// Resolves what an item shows. Shares go through the web app's own media lookup and, failing that,
// the share's embed page: a reel's in a hidden iframe, read off its <video>; a carousel's from the
// slide data in its HTML. Gallery items, stories
// and one-photo posts carry their own media in the record, so they ask the network nothing.
import type { Item, Media, Slide } from './adapter';
import * as S from './selectors';

const cache = new Map<string, Promise<Media | null>>();

function mediaId(shortcode: string): string | null {
  let id = 0n;
  for (const ch of shortcode.slice(0, S.SHORTCODE_ID_LENGTH)) {
    const digit = S.SHORTCODE_ALPHABET.indexOf(ch);
    if (digit < 0) return null;
    id = id * 64n + BigInt(digit);
  }
  return id.toString();
}

function httpsUrl(url: unknown): string | null {
  return typeof url === 'string' && url.startsWith('https://') ? url : null;
}

function slideOf(media: any): Slide | null {
  if (media?.media_type === S.VIDEO_MEDIA_TYPE) {
    const url = httpsUrl(media.video_versions?.[0]?.url);
    return url ? { type: 'video', url } : null;
  }
  const url = httpsUrl(media?.image_versions2?.candidates?.[0]?.url);
  return url ? { type: 'photo', url } : null;
}

/** Works for shares whose author turned embedding off, which are many. */
async function fromApi(shortcode: string): Promise<Media | null> {
  const id = mediaId(shortcode);
  if (!id) return null;
  try {
    const res = await fetch(S.mediaInfoUrl(id), { credentials: 'include', headers: S.WEB_APP_ID_HEADER });
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null;
    const item = (await res.json())?.items?.[0];
    // A decoded id that points at another post must not play in this one's place.
    if (item?.code && item.code !== shortcode.slice(0, item.code.length)) return null;
    if (item?.media_type !== S.CAROUSEL_MEDIA_TYPE) return slideOf(item);
    const slides = ((item.carousel_media ?? []) as unknown[]).map(slideOf);
    // A slide missing its URL would shift every dot after it: all slides or none.
    if (!slides.length || slides.includes(null)) return null;
    return { type: 'slides', slides: slides as Slide[] };
  } catch {
    return null;
  }
}

function readVideoUrl(frame: HTMLIFrameElement): string | null {
  const video = frame.contentDocument?.querySelector('video');
  return httpsUrl(video?.currentSrc || video?.src);
}

function fromEmbed(path: string): Promise<Media | null> {
  return new Promise((done) => {
    const frame = document.createElement('iframe');
    frame.src = S.embedUrl(path);
    frame.style.cssText = 'position: fixed; left: -10000px; width: 400px; height: 700px; opacity: 0; pointer-events: none;';
    frame.setAttribute('aria-hidden', 'true');
    const started = Date.now();
    const poll = setInterval(() => {
      const url = readVideoUrl(frame);
      if (!url && Date.now() - started < S.EMBED_TIMEOUT_MS) return;
      clearInterval(poll);
      frame.remove();
      done(url ? { type: 'video', url } : null);
    }, S.EMBED_POLL_MS);
    document.body.append(frame);
  });
}

function embedSlideOf(node: any): Slide | null {
  const url = httpsUrl(node?.is_video ? node.video_url : node?.display_url);
  return url ? { type: node.is_video ? 'video' : 'photo', url } : null;
}

/** A carousel's slides from its embed page's data, with no iframe. */
async function fromEmbedData(path: string): Promise<Media | null> {
  try {
    const res = await fetch(S.embedUrl(path), { credentials: 'include' });
    if (!res.ok) return null;
    const raw = (await res.text()).match(S.EMBED_CONTEXT_JSON)?.[1];
    if (!raw) return null;
    const media = JSON.parse(JSON.parse(`"${raw}"`))?.gql_data?.shortcode_media;
    if (media?.__typename !== S.EMBED_CAROUSEL_TYPE) return null;
    const slides = ((media.edge_sidecar_to_children?.edges ?? []) as any[]).map((e) => embedSlideOf(e?.node));
    if (!slides.length || slides.includes(null)) return null;
    return { type: 'slides', slides: slides as Slide[] };
  } catch {
    return null;
  }
}

/** A share's media from the network. A found one is asked once; a miss may be a slow network, so it is asked again next time. */
function fetchShare(shortcode: string, path: string | null, fallback: ((path: string) => Promise<Media | null>) | null): Promise<Media | null> {
  let found = cache.get(shortcode);
  if (!found) {
    found = fromApi(shortcode).then((media) => media ?? (fallback && path ? fallback(path) : null));
    cache.set(shortcode, found);
    found.then((media) => media ?? cache.delete(shortcode));
  }
  return found;
}

const isVideo = (media: Media | null) => media?.type === 'video';

/** What the item shows, or null when Instagram shows nothing for it. */
export async function mediaOf(item: Item): Promise<Media | null> {
  const { shortcode, path, isVideo: video, stored } = item.source;
  const own: Media | null = stored.length > 1 ? { type: 'slides', slides: stored } : (stored[0] ?? null);
  if (!shortcode) return own;
  if (item.kind === 'reel' || video) {
    const media = await fetchShare(shortcode, path, fromEmbed);
    // The poster in the record is not the video: without the video, the item is unavailable.
    return isVideo(media) ? media : null;
  }
  // The record holds a carousel's first slide only; the rest come from the lookup or the embed page.
  if (item.kind === 'carousel') return (await fetchShare(shortcode, path, fromEmbedData)) ?? own;
  return own;
}

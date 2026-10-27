// Resolves what an item shows. Shares come from their public embed page only: a reel's in a hidden
// iframe, read off its <video>; a carousel's from the slide data in its HTML. Gallery items, stories
// and one-photo posts carry their own media in the record, so they ask the network nothing.
import type { Item, Media, Slide } from './adapter';
import * as S from './selectors';

// Each read keeps who asked for it, so a queued read nobody still wants is dropped.
const cache = new Map<string, { media: Promise<Media | null>; wanted: (() => boolean)[] }>();

// Instagram's first refusal stops every read, in every tab, for an hour: asking again soon is what a bot does.
const PAUSE_MS = 3600e3;
const PAUSE_KEY = 'pausedUntil';
let refusal: string | null = null;
const refusalListeners = new Set<(reason: string) => void>();

// Absent when the script runs outside the extension (injected by hand for a check).
const storage = () => (typeof chrome === 'undefined' ? undefined : chrome.storage?.local);

function refuse(reason: string, store = true): void {
  if (refusal) return;
  refusal = reason;
  console.warn('[dm-slide] Instagram pushed back; media reads stopped for an hour:', reason);
  if (store) void storage()?.set({ [PAUSE_KEY]: Date.now() + PAUSE_MS }).catch(() => undefined);
  refusalListeners.forEach((listener) => listener(reason));
}

/** A pause stored by any tab stops this one too while it lasts. */
function honour(until: unknown): void {
  if (typeof until === 'number' && until > Date.now()) refuse('paused earlier', false);
}

const storedPause = (async () => {
  try {
    honour((await storage()?.get(PAUSE_KEY))?.[PAUSE_KEY]);
  } catch {
    // Unreadable storage leaves only this page's own refusals to go by.
  }
})();
if (storage()) chrome.storage.onChanged.addListener((changes, area) => area === 'local' && honour(changes[PAUSE_KEY]?.newValue));

// One read at a time: several embed pages at once is a burst, whatever asked for them. The first waits for the stored pause.
let lane: Promise<unknown> = storedPause;

/** Calls `listener` once Instagram refuses a read, at once if it already has; returns the unsubscribe. */
export function onRefusal(listener: (reason: string) => void): () => void {
  if (refusal) {
    listener(refusal);
    return () => {};
  }
  refusalListeners.add(listener);
  return () => refusalListeners.delete(listener);
}

/** True, and reads stop, when Instagram answered a read with anything but the embed page. */
function pushedBack(status: number, url: string): boolean {
  const path = new URL(url, location.href).pathname;
  // The first segment only: a full path can name an account.
  const why = S.REFUSED_STATUS.includes(status) ? `HTTP ${status}` : S.EMBED_PATH.test(path) ? null : `sent to /${path.split('/')[1]}/`;
  if (why) refuse(why);
  return why !== null;
}

function httpsUrl(url: unknown): string | null {
  return typeof url === 'string' && url.startsWith('https://') ? url : null;
}

function readVideoUrl(frame: HTMLIFrameElement): string | null {
  const video = frame.contentDocument?.querySelector('video');
  return httpsUrl(video?.currentSrc || video?.src);
}

/** The embed covers the post with "Watch on Instagram": no video is coming, so waiting out the timeout is pointless. */
function embedHasNoVideo(frame: HTMLIFrameElement): boolean {
  return !!frame.contentDocument?.querySelector(S.EMBED_NO_VIDEO);
}

/** The frame left its embed page for a login, a challenge or the home page. */
function framePushedBack(frame: HTMLIFrameElement): boolean {
  try {
    const href = frame.contentWindow?.location.href;
    return !!href && href !== 'about:blank' && pushedBack(200, href);
  } catch {
    // Reading it throws only once the frame is on another origin, which no embed page is.
    refuse('sent off instagram.com');
    return true;
  }
}

function fromEmbed(path: string): Promise<Media | null> {
  return new Promise((done) => {
    const frame = document.createElement('iframe');
    // Without the session's cookies or the thread's address: an embed page is public, so reading it need not be the account's activity.
    frame.setAttribute('credentialless', '');
    frame.referrerPolicy = 'no-referrer';
    frame.src = S.embedUrl(path);
    frame.style.cssText = 'position: fixed; left: -10000px; width: 400px; height: 700px; opacity: 0; pointer-events: none;';
    frame.setAttribute('aria-hidden', 'true');
    const started = Date.now();
    const poll = setInterval(() => {
      const refused = framePushedBack(frame);
      const url = refused ? null : readVideoUrl(frame);
      if (!url && !refused && !embedHasNoVideo(frame) && Date.now() - started < S.EMBED_TIMEOUT_MS) return;
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
    const res = await fetch(S.embedUrl(path), { credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (pushedBack(res.status, res.url) || !res.ok) return null;
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

/** A share's media from its embed page. A found one is asked once; a miss is asked again only when the item shows again. */
function fetchShare(
  shortcode: string,
  path: string | null,
  read: (path: string) => Promise<Media | null>,
  wanted: () => boolean,
): Promise<Media | null> {
  if (refusal || !path) return Promise.resolve(null);
  const found = cache.get(shortcode);
  if (found) {
    found.wanted.push(wanted);
    return found.media;
  }
  const entry = { media: Promise.resolve<Media | null>(null), wanted: [wanted] };
  entry.media = lane.then(() => (refusal || !entry.wanted.some((w) => w()) ? null : read(path)));
  lane = entry.media.catch(() => null);
  cache.set(shortcode, entry);
  entry.media.then((media) => media ?? cache.delete(shortcode));
  return entry.media;
}

const isVideo = (media: Media | null) => media?.type === 'video';

/** What the item shows, or null when Instagram shows nothing for it or `wanted` says it is no longer needed. */
export async function mediaOf(item: Item, wanted: () => boolean = () => true): Promise<Media | null> {
  const { shortcode, path, isVideo: video, stored } = item.source;
  const own: Media | null = stored.length > 1 ? { type: 'slides', slides: stored } : (stored[0] ?? null);
  if (!shortcode) return own;
  if (item.kind === 'reel' || video) {
    const media = await fetchShare(shortcode, path, fromEmbed, wanted);
    // The poster in the record is not the video: without the video, the item is unavailable.
    return isVideo(media) ? media : null;
  }
  // The record holds a carousel's first slide only; the rest come from the embed page.
  if (item.kind === 'carousel') return (await fetchShare(shortcode, path, fromEmbedData, wanted)) ?? own;
  return own;
}

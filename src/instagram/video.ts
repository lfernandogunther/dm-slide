// Resolves a reel's mp4 URL: first from the web app's own media lookup, then, if that fails, by
// loading the reel's embed page in a hidden iframe and reading the URL off the embed's <video>.
import * as S from './selectors';

const cache = new Map<string, Promise<string | null>>();

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

/** Works for reels whose author turned embedding off, which are many. */
async function fromApi(shortcode: string): Promise<string | null> {
  const id = mediaId(shortcode);
  if (!id) return null;
  try {
    const res = await fetch(S.mediaInfoUrl(id), { credentials: 'include', headers: S.WEB_APP_ID_HEADER });
    if (!res.ok) return null;
    const item = (await res.json())?.items?.[0];
    // A decoded id that points at another post must not play in this reel's place.
    if (item?.code && item.code !== shortcode.slice(0, item.code.length)) return null;
    return httpsUrl(item?.video_versions?.[0]?.url);
  } catch {
    return null;
  }
}

function readVideoUrl(frame: HTMLIFrameElement): string | null {
  const video = frame.contentDocument?.querySelector('video');
  return httpsUrl(video?.currentSrc || video?.src);
}

function fromEmbed(shortcode: string): Promise<string | null> {
  return new Promise((done) => {
    const frame = document.createElement('iframe');
    frame.src = S.embedUrl(shortcode);
    frame.style.cssText = 'position: fixed; left: -10000px; width: 400px; height: 700px; opacity: 0; pointer-events: none;';
    frame.setAttribute('aria-hidden', 'true');
    const started = Date.now();
    const poll = setInterval(() => {
      const url = readVideoUrl(frame);
      if (!url && Date.now() - started < S.EMBED_TIMEOUT_MS) return;
      clearInterval(poll);
      frame.remove();
      done(url);
    }, S.EMBED_POLL_MS);
    document.body.append(frame);
  });
}

/** The reel's mp4 URL, or null when Instagram shows no video for it. A found URL is asked once. */
export function videoUrl(shortcode: string): Promise<string | null> {
  let url = cache.get(shortcode);
  if (!url) {
    url = fromApi(shortcode).then((found) => found ?? fromEmbed(shortcode));
    cache.set(shortcode, url);
    // A miss may be a slow network: ask again next time.
    url.then((found) => found ?? cache.delete(shortcode));
  }
  return url;
}

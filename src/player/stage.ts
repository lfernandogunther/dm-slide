// The current reel, played by our own <video> so loop, pause and progress are ours. The next
// reel loads in a second, hidden <video> and takes over when the player moves to it.
import type { Item, ThreadAdapter } from '../instagram/adapter';
import { reelUrl } from '../instagram/selectors';

export interface Stage {
  show(reel: Item, next: Item | undefined): void;
  togglePause(): void;
  toggleMute(): void;
  destroy(): void;
}

const SPEAKER = '<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/>';
const SOUND_ON = `${SPEAKER}<path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`;
const SOUND_OFF = `${SPEAKER}<path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;

function createVideo(): HTMLVideoElement {
  const video = document.createElement('video');
  video.loop = true;
  video.playsInline = true;
  video.preload = 'auto';
  return video;
}

export function createStage(el: HTMLElement, adapter: ThreadAdapter): Stage {
  const status = document.createElement('div');
  status.className = 'reel-status';
  const playMark = document.createElement('div');
  playMark.className = 'reel-play';
  playMark.textContent = '▶';
  const bar = document.createElement('div');
  const progress = document.createElement('div');
  progress.className = 'reel-progress';
  progress.append(bar);
  const mute = document.createElement('button');
  mute.type = 'button';
  mute.className = 'reel-mute';
  // Not focusable: Space must keep pausing instead of pressing this button.
  mute.tabIndex = -1;

  let current = createVideo();
  let spare = createVideo();
  // Each show() bumps this, so a URL resolved for a reel already left behind is ignored.
  let showing = 0;

  const onTime = (e: Event) => {
    const v = e.target as HTMLVideoElement;
    if (v === current && !v.hidden && v.duration) bar.style.width = `${(v.currentTime / v.duration) * 100}%`;
  };
  const onPauseChange = (e: Event) => {
    // A pause fired while leaving a reel arrives late; a hidden video no longer owns the stage.
    if (e.target === current && !current.hidden) el.classList.toggle('paused', current.paused);
  };
  for (const v of [current, spare]) {
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('play', onPauseChange);
    v.addEventListener('pause', onPauseChange);
  }

  // One setting for both videos, so it carries over from reel to reel.
  function renderMute(): void {
    mute.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16">${current.muted ? SOUND_OFF : SOUND_ON}</svg>`;
    mute.title = current.muted ? 'Unmute (M)' : 'Mute (M)';
  }

  function toggleMute(): void {
    current.muted = spare.muted = !current.muted;
    renderMute();
  }

  mute.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMute();
  });

  function setStatus(content: Node | string | null): void {
    status.replaceChildren(...(content === null ? [] : [content]));
    status.hidden = content === null;
  }

  function unavailable(reel: Item, reason: string): void {
    console.info('[reel-queue] reel unavailable:', reason);
    current.pause();
    current.removeAttribute('src');
    current.hidden = true;
    mute.hidden = true;
    bar.style.width = '0';
    el.classList.remove('paused');
    const link = document.createElement('a');
    link.href = reelUrl(reel.shortcode);
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Open on Instagram';
    const card = document.createElement('div');
    card.append('Reel unavailable', document.createElement('br'), link);
    setStatus(card);
  }

  function play(reel: Item, url: string): void {
    if (current.src !== url) current.src = url;
    // A swapped-in spare may be a reel watched earlier, paused midway: every reel starts over.
    current.currentTime = 0;
    current.hidden = false;
    mute.hidden = false;
    setStatus(null);
    const video = current;
    // Once swapped out, this element becomes the spare: its errors are no longer this reel's.
    current.onerror = () => video === current && unavailable(reel, `video error ${video.error?.code} ${video.error?.message ?? ''}`);
    // Without a recent click or key, the browser may refuse sound; the ▶ mark then shows paused.
    current.play().catch(() => el.classList.add('paused'));
  }

  async function preload(reel: Item | undefined): Promise<void> {
    const url = reel && (await adapter.videoUrl(reel.shortcode));
    if (url && spare.src !== url) spare.src = url;
  }

  el.replaceChildren(current, spare, status, playMark, mute, progress);
  spare.hidden = true;
  renderMute();

  return {
    async show(reel, next) {
      const ticket = ++showing;
      current.pause();
      bar.style.width = '0';
      el.classList.remove('paused');
      current.hidden = true;
      setStatus('Loading…');
      const url = await adapter.videoUrl(reel.shortcode).then(
        (found) => found,
        () => null,
      );
      if (ticket !== showing) return;
      // The spare already loaded this reel: swap it in instead of loading again.
      if (url && spare.src === url) [current, spare] = [spare, current];
      current.hidden = true;
      spare.hidden = true;
      if (url) play(reel, url);
      else unavailable(reel, 'no video URL in the embed');
      void preload(next);
    },
    togglePause() {
      if (current.hidden || !current.src) return;
      if (current.paused) void current.play().catch(() => undefined);
      else current.pause();
    },
    toggleMute,
    destroy() {
      showing++;
      for (const v of [current, spare]) {
        v.pause();
        v.removeAttribute('src');
        v.load();
      }
    },
  };
}

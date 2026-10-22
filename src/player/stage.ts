// The current item: a video played by our own <video> so loop, pause and progress are ours, a
// photo, or slides with dots. The next item's video loads in a second, hidden <video> and takes
// over when the player moves to it.
import type { Item, Slide, ThreadAdapter } from '../instagram/adapter';

export interface Stage {
  show(item: Item, next: Item | undefined): void;
  slide(delta: -1 | 1): boolean; // false when there is no slide that way
  canSlide(delta: -1 | 1): boolean;
  togglePause(): void;
  toggleMute(): void;
  destroy(): void;
}

const SPEAKER = '<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/>';
const SOUND_ON = `${SPEAKER}<path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`;
const SOUND_OFF = `${SPEAKER}<path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;

const UNAVAILABLE = { reel: 'Reel', post: 'Post', carousel: 'Post', story: 'Story', gallery: 'Media' };

function createVideo(): HTMLVideoElement {
  const video = document.createElement('video');
  video.loop = true;
  video.playsInline = true;
  video.preload = 'auto';
  return video;
}

/** `onSlides` runs when the slides that A/D can reach change. */
export function createStage(el: HTMLElement, adapter: ThreadAdapter, onSlides: () => void): Stage {
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
  mute.dataset.kt = 'M';
  const photo = document.createElement('img');
  photo.alt = '';
  const dots = document.createElement('div');
  dots.className = 'reel-dots';

  let current = createVideo();
  let spare = createVideo();
  // Each show() bumps this, so media resolved for an item already left behind is ignored.
  let showing = 0;
  let item: Item | null = null;
  let slides: Slide[] = [];
  let at = 0;

  const onTime = (e: Event) => {
    const v = e.target as HTMLVideoElement;
    if (v === current && !v.hidden && v.duration) bar.style.width = `${(v.currentTime / v.duration) * 100}%`;
  };
  const onPauseChange = (e: Event) => {
    // A pause fired while leaving a video arrives late; a hidden video no longer owns the stage.
    if (e.target === current && !current.hidden) el.classList.toggle('paused', current.paused);
  };
  for (const v of [current, spare]) {
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('play', onPauseChange);
    v.addEventListener('pause', onPauseChange);
  }

  // One setting for both videos, so it carries over from item to item.
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

  /** Clears whatever the stage showed, so exactly one thing shows next. */
  function blank(): void {
    current.pause();
    current.hidden = true;
    spare.hidden = true;
    photo.hidden = true;
    photo.removeAttribute('src');
    mute.hidden = true;
    progress.hidden = true;
    bar.style.width = '0';
    el.classList.remove('paused');
  }

  function unavailable(shown: Item, reason: string): void {
    console.info('[dm-slide] item unavailable:', reason);
    blank();
    current.removeAttribute('src');
    setSlides([]);
    const link = document.createElement('a');
    link.href = adapter.link(shown);
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Open on Instagram';
    const card = document.createElement('div');
    card.append(`${UNAVAILABLE[shown.kind]} unavailable`, document.createElement('br'), link);
    setStatus(card);
  }

  function play(shown: Item, url: string): void {
    blank();
    // The spare already loaded this video: swap it in instead of loading again.
    if (spare.src === url && current.src !== url) [current, spare] = [spare, current];
    if (current.src !== url) current.src = url;
    // A swapped-in spare may be a video watched earlier, paused midway: every video starts over.
    current.currentTime = 0;
    current.hidden = false;
    mute.hidden = false;
    progress.hidden = false;
    setStatus(null);
    const video = current;
    // Once swapped out, this element becomes the spare: its errors are no longer this item's.
    current.onerror = () => video === current && unavailable(shown, `video error ${video.error?.code} ${video.error?.message ?? ''}`);
    // Without a recent click or key, the browser may refuse sound; the ▶ mark then shows paused.
    current.play().catch(() => el.classList.add('paused'));
  }

  function showPhoto(shown: Item, slide: Slide): void {
    blank();
    setStatus(null);
    const fallback = slide.fallbackUrl;
    photo.onerror = () => {
      // The store's photo may come in a format the browser can't show; its fallback is another copy.
      if (fallback && photo.src === slide.url) photo.src = fallback;
      else if (photo.src === slide.url || photo.src === fallback) unavailable(shown, 'photo failed to load');
    };
    photo.src = slide.url;
    photo.hidden = false;
  }

  function showSlide(shown: Item): void {
    const slide = slides[at];
    if (slide.type === 'video') play(shown, slide.url);
    else showPhoto(shown, slide);
    dots.replaceChildren(
      ...slides.map((_, i) => {
        const dot = document.createElement('span');
        dot.classList.toggle('on', i === at);
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          if (i === at) return;
          at = i;
          showSlide(shown);
          onSlides();
        });
        return dot;
      }),
    );
  }

  function setSlides(next: Slide[]): void {
    slides = next;
    at = 0;
    dots.hidden = slides.length < 2;
    onSlides();
  }

  async function preload(next: Item | undefined): Promise<void> {
    const media = next && (await adapter.media(next).catch(() => null));
    const first = media && (media.type === 'slides' ? media.slides[0] : media);
    if (!first) return;
    if (first.type === 'video') {
      if (spare.src !== first.url) spare.src = first.url;
    } else new Image().src = first.url;
  }

  el.replaceChildren(current, spare, photo, status, playMark, mute, progress, dots);
  blank();
  dots.hidden = true;
  renderMute();

  const canSlide = (delta: -1 | 1) => item !== null && at + delta >= 0 && at + delta < slides.length;

  return {
    async show(shown, next) {
      const ticket = ++showing;
      item = null;
      blank();
      setSlides([]);
      setStatus('Loading…');
      const media = await adapter.media(shown).catch(() => null);
      if (ticket !== showing) return;
      item = shown;
      if (!media) unavailable(shown, 'no media found');
      else {
        setSlides(media.type === 'slides' ? media.slides : [media]);
        if (slides.length) showSlide(shown);
        else unavailable(shown, 'no slides');
      }
      void preload(next);
    },
    slide(delta) {
      if (!item || !canSlide(delta)) return false;
      at += delta;
      showSlide(item);
      onSlides();
      return true;
    },
    canSlide,
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

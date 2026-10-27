// The current item: a video played by our own <video> so loop, pause and progress are ours, a
// photo, or slides with dots between two arrows. The next item's video loads in a second, hidden <video> and takes
// over when the player moves to it.
import type { Item, Slide, ThreadAdapter } from '../instagram/adapter';
import { stateCard, type KeyAct } from './cards';
import { animate, finishAll } from './motion';
import { loadSettings, saveSettings } from './settings';

export interface Stage {
  /** `dir` slides the new item in from below (1) or above (-1); 0 just shows it. */
  show(item: Item, next: Item | undefined, dir?: -1 | 0 | 1): void;
  slide(delta: -1 | 1): boolean; // false when there is no slide that way
  canSlide(delta: -1 | 1): boolean;
  togglePause(): void;
  pause(): void;
  toggleMute(): void;
  destroy(): void;
}

const SPEAKER = '<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/>';
const SOUND_ON = `${SPEAKER}<path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`;
const SOUND_OFF = `${SPEAKER}<path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;

const ITEM_MS = 300;
// An item passed through, as when S is held, is never asked for: only one that held the screen this long.
const SETTLE_MS = 300;
const SLIDE_MS = 260;
const REVEAL_MS = 320;
const CANT_PLAY = { title: "Can't play this here", text: "Instagram doesn't let this one play outside its own view. I opens it." };
// While Instagram's refusal holds, a share is not broken: it is not asked for.
const PAUSED = { title: 'Paused to keep your account safe', text: 'I opens it in Instagram.' };

function createVideo(): HTMLVideoElement {
  const video = document.createElement('video');
  video.loop = true;
  video.playsInline = true;
  video.preload = 'auto';
  return video;
}

/** `onSlides` runs when the slides that A/D can reach change; `cantPlay` are the keys on the won't-play card. */
export function createStage(el: HTMLElement, adapter: ThreadAdapter, onSlides: () => void, cantPlay: KeyAct[]): Stage {
  const status = document.createElement('div');
  status.className = 'reel-status';
  let paused = false;
  const unbindPause = adapter.onPause(() => (paused = true));
  // What moves when the item or slide changes; the controls over it stay put.
  const media = document.createElement('div');
  media.className = 'reel-media';
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
  const level = document.createElement('input');
  level.type = 'range';
  level.min = '0';
  level.max = '1';
  level.step = '0.05';
  level.tabIndex = -1;
  level.title = 'Volume';
  const levelPanel = document.createElement('div');
  levelPanel.className = 'vol-panel';
  levelPanel.append(level);
  const sound = document.createElement('div');
  sound.className = 'vol';
  sound.append(levelPanel, mute);
  const photo = document.createElement('img');
  photo.alt = '';
  const dots = document.createElement('div');
  dots.className = 'reel-dots';
  const pips = document.createElement('div');
  const slideButton = (delta: -1 | 1, glyph: string, key: string, name: string) => {
    const button = document.createElement('button');
    button.tabIndex = -1;
    button.textContent = glyph;
    button.title = `${name} slide (${key} / ${delta < 0 ? '←' : '→'})`;
    button.dataset.kt = key;
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      slideBy(delta);
    });
    return button;
  };
  const prevSlide = slideButton(-1, '‹', 'A', 'Previous');
  const nextSlide = slideButton(1, '›', 'D', 'Next');
  dots.append(prevSlide, pips, nextSlide);
  // While the media loads: the item's thumbnail, blurred, with a running bar.
  const coverImg = document.createElement('img');
  coverImg.alt = '';
  // An expired signed thumbnail: the cover goes blank rather than broken.
  coverImg.onerror = () => (coverImg.hidden = true);
  const loadingBar = document.createElement('div');
  loadingBar.className = 'reel-bar';
  const cover = document.createElement('div');
  cover.className = 'reel-cover';
  cover.append(coverImg, loadingBar);
  let reveal: Animation | null = null;

  let current = createVideo();
  let spare = createVideo();
  // Each show() bumps this, so media resolved for an item already left behind is ignored.
  let showing = 0;
  // The item the latest show() is for, set before its media resolves.
  let target: Item | null = null;
  // The item whose media the last preload got: showing it asks Instagram nothing.
  let ready: Item | null = null;
  let item: Item | null = null;
  let slides: Slide[] = [];
  let at = 0;
  let volume = 1;

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
    current.volume = spare.volume = volume;
    level.value = String(current.muted ? 0 : volume);
  }

  function toggleMute(): void {
    current.muted = spare.muted = !current.muted;
    renderMute();
  }

  mute.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMute();
  });
  // Muting keeps the level, so M brings the sound back where it was; dragging to 0 is a mute.
  level.addEventListener('input', () => {
    const value = Number(level.value);
    current.muted = spare.muted = value === 0;
    if (value > 0) volume = value;
    renderMute();
  });
  level.addEventListener('change', () => {
    saveSettings({ volume });
    level.blur();
  });
  // The stage toggles pause on a click; the slider is not part of that.
  sound.addEventListener('click', (e) => e.stopPropagation());
  void loadSettings().then((s) => {
    volume = s.volume > 0 ? s.volume : 1;
    renderMute();
  });

  function coverOn(thumb: string | null): void {
    reveal?.cancel();
    reveal = null;
    cover.style.opacity = '';
    if (thumb) coverImg.src = thumb;
    else coverImg.removeAttribute('src');
    coverImg.hidden = !thumb;
    cover.hidden = false;
    el.classList.remove('unplayable');
    el.classList.add('loading');
  }

  function coverOff(): void {
    reveal?.cancel();
    reveal = null;
    cover.hidden = true;
    cover.style.opacity = '';
    el.classList.remove('loading', 'unplayable');
  }

  /** Fades the cover away once the media of the item it covers can show. */
  function uncover(ticket: number): void {
    if (ticket !== showing || cover.hidden || reveal || el.classList.contains('unplayable')) return;
    el.classList.remove('loading');
    // The end state is set up front, so a finish (by the next key) leaves no frame of cover behind.
    cover.style.opacity = '0';
    const a = animate(cover, [{ opacity: 1 }, { opacity: 0 }], { duration: REVEAL_MS, fade: 'out' });
    reveal = a;
    // A show() after this one owns the cover; a late finish must not hide it.
    a.addEventListener('finish', () => reveal === a && coverOff());
  }

  /** A still of what shows now, to leave the stage while the next one comes in. */
  function ghost(): HTMLElement | null {
    let still: HTMLElement;
    const shown = !current.hidden ? current : !photo.hidden ? photo : null;
    // A cover that is fading away is no longer what shows; the media under it is.
    if (!cover.hidden && !reveal) still = cover.cloneNode(true) as HTMLElement;
    else if (shown) {
      const w = shown === current ? current.videoWidth : photo.naturalWidth;
      const h = shown === current ? current.videoHeight : photo.naturalHeight;
      if (!w || !h) return null;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      // A cross-origin frame taints the canvas, which only forbids reading it back: it still shows.
      canvas.getContext('2d')?.drawImage(shown, 0, 0, w, h);
      still = canvas;
    } else if (!status.hidden) still = status.cloneNode(true) as HTMLElement;
    else return null;
    const layer = document.createElement('div');
    layer.className = 'reel-media';
    layer.append(still);
    return layer;
  }

  /** The current view leaves toward -dir while the media comes in from dir. */
  function move(axis: 'X' | 'Y', dir: -1 | 1, duration: number): void {
    finishAll();
    const old = ghost();
    if (old) {
      media.after(old);
      const leave = animate(old, [{ transform: 'none' }, { transform: `translate${axis}(${-dir * 100}%)` }], { duration, fill: 'forwards', fade: 'out' });
      const drop = () => old.remove();
      leave.addEventListener('finish', drop);
      leave.addEventListener('cancel', drop);
    }
    animate(media, [{ transform: `translate${axis}(${dir * 100}%)` }, { transform: 'none' }], { duration });
  }

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
    sound.hidden = true;
    progress.hidden = true;
    bar.style.width = '0';
    el.classList.remove('paused');
  }

  function unavailable(shown: Item, reason: string, card = CANT_PLAY): void {
    console.info('[dm-slide] item unavailable:', reason);
    blank();
    // The blurred thumbnail stays, still, under the card.
    coverOn(shown.thumb);
    el.classList.replace('loading', 'unplayable');
    current.removeAttribute('src');
    setSlides([]);
    setStatus(stateCard({ ...card, keys: cantPlay }));
  }

  function play(shown: Item, url: string): void {
    blank();
    // The spare already loaded this video: swap it in instead of loading again.
    if (spare.src === url && current.src !== url) {
      [current, spare] = [spare, current];
      // The spare now holds the video swapped out, not the preloaded item.
      ready = null;
    }
    if (current.src !== url) current.src = url;
    // Read before the seek below, which can drop a preloaded spare's readyState for a moment.
    const loaded = current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    // A swapped-in spare may be a video watched earlier, paused midway: every video starts over.
    current.currentTime = 0;
    current.hidden = false;
    sound.hidden = false;
    progress.hidden = false;
    setStatus(null);
    const video = current;
    const ticket = showing;
    // Once swapped out, this element becomes the spare: its errors are no longer this item's.
    current.onerror = () => video === current && unavailable(shown, `video error ${video.error?.code} ${video.error?.message ?? ''}`);
    if (loaded) uncover(ticket);
    else for (const type of ['loadeddata', 'canplay']) video.addEventListener(type, () => video === current && uncover(ticket), { once: true });
    // Without a recent click or key, the browser may refuse sound; the ▶ mark then shows paused.
    current.play().catch(() => el.classList.add('paused'));
  }

  function showPhoto(shown: Item, slide: Slide): void {
    blank();
    setStatus(null);
    const fallback = slide.fallbackUrl;
    const ticket = showing;
    photo.onload = () => uncover(ticket);
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
    prevSlide.disabled = at === 0;
    nextSlide.disabled = at === slides.length - 1;
    pips.replaceChildren(
      ...slides.map((_, i) => {
        const dot = document.createElement('span');
        dot.classList.toggle('on', i === at);
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          if (i === at) return;
          move('X', i > at ? 1 : -1, SLIDE_MS);
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

  async function preload(next: Item | undefined, ticket: number): Promise<void> {
    // Moving onto the item being preloaded keeps its read: it is now the one asked for.
    const media = next && (await adapter.media(next, () => ticket === showing || target === next).catch(() => null));
    const first = media && (media.type === 'slides' ? media.slides[0] : media);
    if (!first) return;
    if (first.type === 'video') {
      if (spare.src !== first.url) spare.src = first.url;
    } else new Image().src = first.url;
    ready = next;
  }

  media.append(current, spare, photo, cover, status);
  el.replaceChildren(media, playMark, sound, progress, dots);
  blank();
  coverOff();
  dots.hidden = true;
  renderMute();

  const canSlide = (delta: -1 | 1) => item !== null && at + delta >= 0 && at + delta < slides.length;

  function slideBy(delta: -1 | 1): boolean {
    if (!item || !canSlide(delta)) return false;
    move('X', delta, SLIDE_MS);
    at += delta;
    showSlide(item);
    onSlides();
    return true;
  }

  return {
    async show(shown, next, dir = 0) {
      if (dir) move('Y', dir, ITEM_MS);
      const ticket = ++showing;
      target = shown;
      item = null;
      blank();
      setSlides([]);
      setStatus(null);
      coverOn(shown.thumb);
      const settled = new Promise((done) => setTimeout(done, SETTLE_MS));
      if (shown !== ready) await settled;
      if (ticket !== showing) return;
      const media = await adapter.media(shown, () => ticket === showing).catch(() => null);
      if (ticket !== showing) return;
      item = shown;
      if (!media) unavailable(shown, paused ? 'media paused' : 'no media found', paused ? PAUSED : CANT_PLAY);
      else {
        setSlides(media.type === 'slides' ? media.slides : [media]);
        if (slides.length) showSlide(shown);
        else unavailable(shown, 'no slides');
      }
      // A preloaded item skips the settle, but its own preload doesn't, so a held key still reads nothing.
      await settled;
      if (ticket !== showing) return;
      void preload(next, ticket);
    },
    slide: slideBy,
    canSlide,
    togglePause() {
      if (current.hidden || !current.src) return;
      if (current.paused) void current.play().catch(() => undefined);
      else current.pause();
    },
    pause() {
      current.pause();
    },
    toggleMute,
    destroy() {
      showing++;
      target = null;
      unbindPause();
      for (const v of [current, spare]) {
        v.pause();
        v.removeAttribute('src');
        v.load();
      }
    },
  };
}

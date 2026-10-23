// The real player over a fake thread: generated media, invented people, no network. Never ships.
import type { Item, Media, Slide, ThreadAdapter } from '../src/instagram/adapter';
import { createButton, renderButton } from '../src/content/button';
import { openNotice, openPlayer, startIndex, type Player } from '../src/player/overlay';

// Query switches for the states worth a look: ?delay=ms ?fail=1 ?failOlder=1 ?video=0 ?layer=0 ?notice=1 ?pushback=1
const q = new URLSearchParams(location.search);
const DELAY = Number(q.get('delay') ?? 150);
const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

interface Share {
  kind: Item['kind'];
  sender: string;
  scenes: { emoji: string; caption: string; hue: number }[]; // one per slide; a reel's first is its video
  notes?: string[];
  replies?: string[];
  reaction?: string;
}

const SHARES: Share[] = [
  { kind: 'reel', sender: 'Alex', scenes: [{ emoji: '🐶', caption: 'dog learns to skateboard', hue: 200 }], reaction: '😂' },
  { kind: 'post', sender: 'Sam', scenes: [{ emoji: '🍝', caption: 'pasta in 60 seconds', hue: 18 }], replies: ['making this tonight'] },
  {
    kind: 'carousel',
    sender: 'Alex',
    scenes: [
      { emoji: '🏔️', caption: 'day 1', hue: 190 },
      { emoji: '🌲', caption: 'day 2', hue: 140 },
      { emoji: '⛺', caption: 'day 3', hue: 30 },
      { emoji: '🌅', caption: 'last night', hue: 12 },
    ],
    notes: ['the third one is us 😅', 'we should go back in spring'],
  },
  { kind: 'reel', sender: 'Sam', scenes: [{ emoji: '🎸', caption: 'that riff, slowed down', hue: 275 }] },
  { kind: 'reel', sender: 'Alex', scenes: [{ emoji: '🐱', caption: 'cat vs cucumber', hue: 95 }], notes: ['watch till the end'] },
  { kind: 'story', sender: 'Sam', scenes: [{ emoji: '☕', caption: 'monday mood', hue: 28 }] },
  { kind: 'reel', sender: 'Alex', scenes: [{ emoji: '🛹', caption: 'how is this even possible', hue: 330 }] },
  { kind: 'gallery', sender: 'Sam', scenes: [{ emoji: '🎂', caption: 'the cake survived', hue: 340 }] },
  { kind: 'reel', sender: 'Alex', scenes: [{ emoji: '🌊', caption: 'biggest wave of the year', hue: 210 }] },
  { kind: 'reel', sender: 'Sam', scenes: [{ emoji: '🍳', caption: 'one-pan breakfast', hue: 45 }] },
];
const OLDER: Share[] = [
  { kind: 'reel', sender: 'Sam', scenes: [{ emoji: '🦜', caption: 'the parrot that sings', hue: 120 }], reaction: '❤️' },
  { kind: 'post', sender: 'Alex', scenes: [{ emoji: '🏀', caption: 'from half court', hue: 22 }], reaction: '🔥' },
];

/** A still: a gradient, a big emoji and a caption, as a JPEG data URL. */
function still({ emoji, caption, hue }: Share['scenes'][number], w: number, h: number): string {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  paint(c.getContext('2d')!, emoji, caption, hue, w, h, 0);
  return c.toDataURL('image/jpeg', 0.85);
}

function paint(g: CanvasRenderingContext2D, emoji: string, caption: string, hue: number, w: number, h: number, t: number): void {
  const grad = g.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, `hsl(${hue} 60% 48%)`);
  grad.addColorStop(1, `hsl(${(hue + 50) % 360} 55% 16%)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `${Math.round(w * 0.38)}px sans-serif`;
  g.fillText(emoji, w / 2, h * 0.45 + Math.sin(t * Math.PI * 2) * h * 0.04);
  if (w < 200) return;
  g.font = `600 ${Math.round(w * 0.06)}px sans-serif`;
  g.fillStyle = 'rgba(255,255,255,.92)';
  g.fillText(caption, w / 2, h * 0.78);
}

// A real webm per reel, recorded once on load, so the sound and pause controls behave as on a reel.
async function clip({ emoji, caption, hue }: Share['scenes'][number]): Promise<string> {
  const c = document.createElement('canvas');
  c.width = 360;
  c.height = 640;
  const g = c.getContext('2d')!;
  const rec = new MediaRecorder(c.captureStream(30), { mimeType: 'video/webm' });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => chunks.push(e.data);
  const stopped = new Promise((done) => (rec.onstop = done));
  rec.start();
  const t0 = performance.now();
  await new Promise<void>((done) => {
    const tick = () => {
      const t = (performance.now() - t0) / 2000;
      paint(g, emoji, caption, hue, c.width, c.height, t);
      if (t < 1) requestAnimationFrame(tick);
      else done();
    };
    tick();
  });
  rec.stop();
  await stopped;
  return URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
}

const HOUR = 3600e3;
let count = 0;
function toItem(share: Share, timestampMs: number): Item {
  const id = `m${count++}`;
  return {
    id,
    kind: share.kind,
    source: { shortcode: null, path: null, isVideo: false, stored: [], thumb: null },
    senderId: share.sender,
    senderName: share.sender,
    timestampMs,
    myReaction: share.reaction ?? null,
    myReplies: [...(share.replies ?? [])],
    notes: share.notes ?? [],
    thumb: still(share.scenes[0], 104, 160),
  };
}

let items = SHARES.map((s, i) => toItem(s, Date.now() - (SHARES.length - i) * HOUR));
const shareOf = new Map(items.map((item, i) => [item.id, SHARES[i]]));
const clips = new Map<string, string>();
if (q.get('video') !== '0') {
  for (const item of items) if (item.kind === 'reel') clips.set(item.id, await clip(shareOf.get(item.id)!.scenes[0]));
}
let olderLeft = OLDER.length;
const find = (id: string) => items.find((r) => r.id === id)!;
const fail = (what: string) => {
  if (q.get('fail') === '1') throw new Error(`demo: ${what} set to fail`);
};

const adapter: ThreadAdapter = {
  listItems: () => items.map((r) => ({ ...r, myReplies: [...r.myReplies] })),
  async react(id, emoji) {
    await sleep(DELAY);
    fail('react');
    find(id).myReaction = emoji;
    render();
  },
  async unreact(id) {
    await sleep(DELAY);
    find(id).myReaction = null;
    render();
  },
  async reply(id, text, quote) {
    await sleep(DELAY * 3);
    fail('reply');
    if (quote) find(id).myReplies.push(text);
    render();
  },
  async loadOlder() {
    await sleep(600);
    if (q.get('failOlder') === '1') throw new Error('demo: loading older set to fail');
    if (olderLeft === 0) return false;
    const share = OLDER[--olderLeft];
    const item = toItem(share, items[0].timestampMs - HOUR);
    shareOf.set(item.id, share);
    items = [item, ...items];
    render();
    return true;
  },
  reveal: (id) => card(id)?.scrollIntoView({ block: 'nearest' }),
  async media(item): Promise<Media | null> {
    await sleep(DELAY * 3);
    const scenes = shareOf.get(item.id)!.scenes;
    const video = clips.get(item.id);
    if (video) return { type: 'video', url: video };
    const slides: Slide[] = scenes.map((s) => ({ type: 'photo', url: still(s, 540, 675) }));
    return slides.length > 1 ? { type: 'slides', slides } : slides[0];
  },
  // ?pushback=1 stands in for Instagram refusing a read, a moment after the player opens.
  onPause(listener) {
    const timer = q.get('pushback') === '1' ? setTimeout(() => listener('demo'), DELAY * 5) : undefined;
    return () => clearTimeout(timer);
  },
  link: () => '#',
  health: () => ({ ok: true }),
  itemAt: (el) => el.closest<HTMLElement>('[data-item]')?.dataset.item ?? null,
  rectOf(id) {
    const el = card(id);
    if (!el) return null;
    const { x, y, width, height } = el.getBoundingClientRect();
    return y >= 0 && y + height <= innerHeight ? { x, y, width, height } : null;
  },
  // Stands in for Instagram's own view of the item; ?layer=0 makes it never open.
  async openLayer(id) {
    await sleep(DELAY);
    if (q.get('layer') === '0') throw new Error('demo: layer set to fail');
    const layer = document.getElementById('layer')!;
    layer.querySelector('p')!.textContent = `Instagram's own view of “${shareOf.get(id)!.scenes[0].caption}” opens here.`;
    layer.hidden = false;
  },
  layerOpen: () => !document.getElementById('layer')!.hidden,
  closeLayer() {
    const layer = document.getElementById('layer')!;
    const open = !layer.hidden;
    layer.hidden = true;
    return open;
  },
};

const card = (id: string) => document.querySelector<HTMLElement>(`[data-item="${id}"]`);
const chat = document.getElementById('chat')!;
const button = createButton(() => open());
document.getElementById('header')!.append(button);

/** The chat stand-in: one card per item, with what I sent under it. */
function render(): void {
  chat.replaceChildren(
    ...items.flatMap((item) => {
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<span class="who"></span><img class="share" alt="">`;
      row.querySelector('.who')!.textContent = item.senderName;
      const img = row.querySelector('img')!;
      img.src = item.thumb!;
      img.dataset.item = item.id;
      if (item.myReaction) row.insertAdjacentHTML('beforeend', `<span class="mine">${item.myReaction}</span>`);
      const texts = [...item.notes.map((t) => ['note', t]), ...item.myReplies.map((t) => ['reply', t])];
      return [row, ...texts.map(([cls, t]) => Object.assign(document.createElement('p'), { className: cls, textContent: t }))];
    }),
  );
  renderButton(button, { items: adapter.listItems() });
}

let player: Player | null = null;
function open(at?: string): boolean {
  if (player) return false;
  const list = adapter.listItems();
  const start = at === undefined ? startIndex(list) : list.findIndex((r) => r.id === at);
  if (start < 0) return false;
  const onClose = () => {
    player = null;
    render();
  };
  player = q.get('notice') === '1' ? openNotice('demo: the thread set to unreadable', onClose) : openPlayer(adapter, list, start, onClose);
  return true;
}

// As on Instagram, a click on a card opens the player at that item.
chat.addEventListener('click', (e) => {
  const id = e.target instanceof Element ? adapter.itemAt(e.target) : null;
  if (id !== null) open(id);
});
document.getElementById('layer-close')!.addEventListener('click', () => adapter.closeLayer());
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') adapter.closeLayer();
});

render();
chat.scrollTop = chat.scrollHeight;
open();

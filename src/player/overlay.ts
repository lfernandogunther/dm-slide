// The player: a full-window overlay in its own shadow root, with the strip on the left, the video
// alone in the middle and a panel on the right. It talks only to the ThreadAdapter.
import { CantRead, engaged, QUICK_REACTIONS, type Box, type Item, type Post, type ThreadAdapter } from '../instagram/adapter';
import { createPill, keyCard, stateCard } from './cards';
import { bindKeys } from './keys';
import { animate, finishAll, reduceMotion } from './motion';
import { loadSettings, saveSettings, type Settings } from './settings';
import { createStage } from './stage';
import { createStrip, type Follow, type StripEdge } from './strip';
import { STYLE } from './style';

// How often a paused load checks whether the reaction or reply it waits on is done.
const BUSY_POLL_MS = 250;
const STRIP_LOAD_MARGIN_PX = 40;
const WHEEL_REST_MS = 400;
// Long enough to read; the next action clears it sooner.
const FAIL_MS = 5000;
// A control whose action failed shakes twice.
const SHAKE = [
  { transform: 'none' },
  { transform: 'translateX(-5px)', offset: 0.2 },
  { transform: 'translateX(5px)', offset: 0.4 },
  { transform: 'translateX(-5px)', offset: 0.6 },
  { transform: 'translateX(5px)', offset: 0.8 },
  { transform: 'none' },
];
const SHAKE_MS = 450;
const SENT_MS = 3000;
const CANT_READ = "Can't read this conversation · nothing was done";
// How often the player, stepped aside, checks whether Instagram's view of the item is still up.
const LAYER_POLL_MS = 250;
// How long the won't-play card shows before Instagram's view opens by itself.
const AUTO_OPEN_MS = 2000;
// The sender and the reactions rise into place as a new item comes in.
const PANEL_RISE = [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }];
const PANEL_MS = 200;
// Below this the post card would show a line of caption to scroll through: it gives the room back instead.
const POST_MIN_PX = 72;
// A reaction: the button pops, the emoji bursts over the video, a copy flies to the tile, the badge pops.
const POP = [{ transform: 'scale(1)' }, { transform: 'scale(1.35)', offset: 0.4 }, { transform: 'scale(1)' }];
const POP_MS = 320;
const BURST = [
  { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 },
  { transform: 'translate(-50%, -50%) scale(1.25)', opacity: 1, offset: 0.3 },
  { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: 0.55 },
  { transform: 'translate(-50%, -80%) scale(.9)', opacity: 0 },
];
const BURST_MS = 900;
const FLY_DELAY_MS = 350;
const FLY_MS = 450;
const BADGE_POP = [{ transform: 'scale(0)' }, { transform: 'scale(1.4)', offset: 0.6 }, { transform: 'scale(1)' }];
const BADGE_MS = 260;
// The least time between two things told to Instagram: a person can't react faster through its own UI.
const ACTION_GAP_MS = 1500;
// Opening grows the video out of its message and closing shrinks it back in; the rest of the player fades.
const GROW_MS = 440;
const SHRINK_MS = 380;
const SHRINK_EASE = 'cubic-bezier(.6,0,.3,1)';
const MESSAGE_RADIUS_PX = 18;
const BACKDROP_MS = 300;
const CHROME_IN = { duration: 240, delay: 200 };
const CHROME_OUT_MS = 140;
// With the message off screen there is nothing to grow from: the player rises in and sinks out instead.
const RISE_FROM = { opacity: 0, transform: 'translateY(18px) scale(.985)' };
const RISE_IN_MS = 280;
const BACKDROP_IN_MS = 220;
const SINK_MS = 200;
// W at the start of the chat: the video bumps against it, and a pill says so.
const BUMP = [{ transform: 'none' }, { transform: 'translateY(16px)', offset: 0.35 }, { transform: 'none' }];
const BUMP_MS = 450;
const START_PILL_MS = 2000;
const PAUSED = 'Instagram asked to slow down · paused for about an hour to keep your account safe';
// Longer than a failure: it explains every unavailable item that follows.
const PAUSED_MS = 12000;
const LOADING_OLDER = 'Loading older…';
const NOTHING_OLDER = 'Nothing to watch in that page · W to look further back';
const BLACK = { backgroundColor: '#000' };
const CLEAR = { backgroundColor: 'transparent' };
const SHOW = { opacity: 1 };
const HIDE = { opacity: 0 };

const LAYOUT = `
  <div class="player" tabindex="-1">
    <header class="p-head">
      <span class="p-title">DM Slide</span>
      <span class="p-pos" data-pos></span>
      <button class="pill" data-filter tabindex="-1" aria-pressed="false" title="Only the ones without my reaction or reply (U)" data-kt="U" data-kt-at="br">Not reacted</button>
      <button class="pill" data-ig tabindex="-1" title="Instagram view (I)" data-kt="I" data-kt-at="br">◧ Instagram view</button>
      <span class="sp"></span>
      <span class="p-hold" data-hold></span>
      <button class="circ" data-tips tabindex="-1" aria-pressed="false" title="Key tips (?)">?</button>
      <button class="circ" data-close tabindex="-1" title="Close (Esc)" data-kt="Esc" data-kt-at="b">✕</button>
    </header>
    <div class="p-body">
      <div class="p-strip" data-strip></div>
      <div class="p-theatre">
        <div class="p-video">
          <div class="reel" data-reel data-kt="Space"></div>
          <div class="p-burst" data-burst></div>
          <button class="nav prev" data-prev tabindex="-1" title="Previous (W / ↑)" data-kt="W"><span>‹</span></button>
          <button class="nav next" data-next tabindex="-1" title="Next (S / ↓)" data-kt="S"><span>›</span></button>
          <div class="p-caught" data-caught hidden></div>
        </div>
      </div>
      <aside class="p-side">
        <div class="p-post" data-post hidden></div>
        <div class="p-panel">
          <div class="p-who" data-who><div class="p-av" data-av></div><div><b data-sender></b><div class="p-date" data-sent></div></div></div>
          <div class="p-talk" data-talk>
            <h4 data-notes-head>Sent with it</h4>
            <ul class="p-th" data-notes></ul>
            <h4 data-replies-head>Your replies</h4>
            <ul class="p-th" data-replies></ul>
          </div>
          <div class="p-emos" data-quick></div>
          <div class="p-fail" data-fail role="alert" hidden></div>
          <form class="p-box" data-reply-form data-kt="R" data-kt-at="tl">
            <input type="text" data-reply autocomplete="off" placeholder="Reply…">
            <div class="p-row">
              <label class="p-quote" title="Quote the item in the reply"><input type="checkbox" data-quote tabindex="-1" checked>❝ Quote</label>
              <span class="sp"></span>
              <button type="submit" class="send" data-send tabindex="-1" disabled title="Send (Enter)">Send</button>
            </div>
          </form>
          <div class="p-setting">
            <label><input type="checkbox" data-next-after tabindex="-1" checked>Next after reacting</label>
            <button type="button" class="p-dir" data-after-dir tabindex="-1" title="Which way reacting moves">↓ newer</button>
          </div>
          <div class="p-setting">
            <label title="Opens it 2 s after “Can't play this here”, once per item"><input type="checkbox" data-open-in tabindex="-1" checked>Open in Instagram when it can't play here</label>
          </div>
        </div>
      </aside>
      <span class="kt w">W ↑</span>
      <span class="kt s">S ↓</span>
    </div>
    <div class="p-dim"></div>
  </div>
  <button class="p-back" data-back tabindex="-1" hidden>Back to DM Slide <b>I</b> or <b>Esc</b></button>
`;

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

// What one page of older messages brought.
type Older = 'found' | 'nothing' | 'start' | 'failed';

interface Pending {
  id: string;
  text: string;
  quoted: boolean;
  state: 'sending' | 'sent' | 'failed';
}

interface ReactJob {
  item: Item;
  target: string | null; // null removes mine
  was: string | null; // what the item showed before the press, if Instagram can't be read after a failure
  slot: number; // the quick reaction pressed
}

/** A key as the states write it: bold, in the key font. */
function keyMark(key: string): HTMLElement {
  const b = document.createElement('b');
  b.className = 'key';
  b.textContent = key;
  return b;
}

// The browser's own language decides the date's format.
const SENT_AT = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
// A post's date is only right to the day, so it never shows a time.
const POSTED_AT = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const POSTED_AT_YEAR = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const COUNT = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

/** A shared post's card as text nodes only: what Instagram's page holds is never read as HTML. */
function postParts({ author, verified, caption, postedMs, likes, comments, views, music, originalAudio }: Post): HTMLElement[] {
  const el = (tag: string, className: string, text = '') => Object.assign(document.createElement(tag), { className, textContent: text });
  const parts: HTMLElement[] = [];
  const by = el('div', 'p-by');
  if (author) {
    const name = el('b', '', author);
    if (verified) name.append(el('span', 'p-ver', '✓'));
    by.append(name);
  }
  if (postedMs !== null) {
    const thisYear = new Date(postedMs).getFullYear() === new Date().getFullYear();
    by.append(el('div', 'p-date', `Posted ${(thisYear ? POSTED_AT : POSTED_AT_YEAR).format(postedMs)}`));
  }
  if (by.childElementCount) parts.push(by);
  if (caption) parts.push(el('p', 'p-cap', caption));
  if (music) parts.push(el('div', 'p-music', `🎵 ${music.artist} — ${music.song}`));
  else if (originalAudio) parts.push(el('div', 'p-music', '🎵 Original audio'));
  const counts = (
    [
      ['❤️', likes],
      ['💬', comments],
      ['▶', views],
    ] as const
  ).flatMap(([mark, n]) => (n === null ? [] : [`${mark} ${COUNT.format(n)}`]));
  if (counts.length) parts.push(el('div', 'p-nums', counts.join(' · ')));
  return parts;
}

export interface Player {
  close(): void;
  away(): boolean; // stepped aside for Instagram's view, which may change the page's path
}

/** The oldest loaded item without my reaction or reply (the newest such one when reacting moves older), or the newest one when every item has one. */
export function startIndex(items: Item[], dir: Settings['afterReactDir'] = 'newer'): number {
  const order = dir === 'older' ? [...items.keys()].reverse() : [...items.keys()];
  return order.find((i) => !engaged(items[i])) ?? items.length - 1;
}

const NOTICE_KEY_EVENTS = ['keydown', 'keyup', 'keypress'] as const;
const NOTICE = `
  <div class="player" tabindex="-1">
    <header class="p-head">
      <span class="p-title">DM Slide</span>
      <span class="sp"></span>
      <button class="circ" data-close tabindex="-1" title="Close (Esc)">✕</button>
    </header>
    <div class="p-body p-frame"><div class="p-video" data-notice></div></div>
  </div>
`;

// Missing outside the extension (the scratch harness), where the detail line goes without it.
const VERSION = typeof chrome === 'undefined' ? null : chrome.runtime?.getManifest?.().version;

/** In place of the player when the thread can't be read: its frame and a card saying so, and nothing else. */
export function openNotice(detail: string, onClose: () => void): Player {
  const host = document.createElement('div');
  host.style.cssText = 'position: fixed; inset: 0; z-index: 2147483647;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${STYLE}</style>${NOTICE}`;
  const panel = root.querySelector<HTMLElement>('.player')!;
  root.querySelector('[data-notice]')!.append(
    stateCard({
      big: '⚠︎',
      title: "Can't read this conversation",
      text: "Instagram's page may have changed. Nothing was done here: no reaction, no reply.",
      detail: VERSION ? `${detail} · v${VERSION}` : detail,
      // Instagram's own view is the chat under the player, so I simply uncovers it.
      keys: [
        { key: 'I', label: 'Instagram view', act: close },
        { key: 'Esc', label: 'Close', act: close },
      ],
    }),
  );

  const onKey = (e: KeyboardEvent) => {
    if (!e.isTrusted || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key !== 'Escape' && e.key.toLowerCase() !== 'i') return;
    e.stopPropagation();
    e.preventDefault();
    if (e.type === 'keydown') close();
  };
  let closed = false;
  function close(): void {
    if (closed) return;
    closed = true;
    for (const type of NOTICE_KEY_EVENTS) window.removeEventListener(type, onKey, true);
    host.remove();
    onClose();
  }
  root.querySelector('[data-close]')!.addEventListener('click', close);
  for (const type of NOTICE_KEY_EVENTS) window.addEventListener(type, onKey, true);

  (document.activeElement as HTMLElement | null)?.blur();
  document.body.append(host);
  panel.focus();
  return { close, away: () => false };
}

export function openPlayer(adapter: ThreadAdapter, loaded: Item[], start: number, onClose: () => void): Player {
  const host = document.createElement('div');
  host.style.cssText = 'position: fixed; inset: 0; z-index: 2147483647;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${STYLE}</style>${LAYOUT}`;
  const $ = <T extends HTMLElement>(attr: string) => root.querySelector<T>(`[${attr}]`)!;
  const player = root.querySelector<HTMLElement>('.player')!;
  const head = root.querySelector<HTMLElement>('.p-head')!;
  const body = root.querySelector<HTMLElement>('.p-body')!;
  const video = root.querySelector<HTMLElement>('.p-video')!;
  const reel = $('data-reel');
  const side = root.querySelector<HTMLElement>('.p-side')!;
  const panel = root.querySelector<HTMLElement>('.p-panel')!;
  const postCard = $('data-post');
  const chrome = [head, $('data-strip'), side];
  const reply = $<HTMLInputElement>('data-reply');
  const stage = createStage(reel, adapter, renderNav, [
    { key: 'I', label: 'Instagram view', act: () => void instagramView() },
    { key: 'S', label: 'Next', act: () => next() },
  ], cantPlay);
  const pill = createPill(video);
  let caughtShows = '';
  const strip = createStrip($('data-strip'));

  let items = loaded;
  let current = start;
  let edge: StripEdge = null;
  let loading: Promise<Older> | null = null;
  let closed = false;
  // Stepped aside for Instagram's view of the item, from the thread at `path`.
  let away = false;
  let opening = false;
  let awayTimer: ReturnType<typeof setTimeout> | undefined;
  // Ids of the items that can't play here, and of those whose view already opened once.
  const unplayable = new Set<string>();
  const autoOpened = new Set<string>();
  let autoTimer: ReturnType<typeof setTimeout> | undefined;
  const path = location.pathname;
  const back = $('data-back');
  // Reactions wait here and are told to Instagram one at a time, while the player moves on.
  const reactions: ReactJob[] = [];
  let reacting = false;
  let sending = false;
  let lastTold = 0;
  // Only around Instagram's composer, so a reaction never drives the picker at the same time.
  let replying = false;
  // The reply being sent, or the last one sent or not, shown as a bubble on its item.
  let pending: Pending | null = null;
  let nextAfterReact = true;
  let afterReactDir: Settings['afterReactDir'] = 'newer';
  let onlyNotReacted = false;
  let openInInstagram = true;
  let tipsHeld = false;
  let tipsPinned = false;
  const nextAfter = $<HTMLInputElement>('data-next-after');
  const afterDir = $<HTMLButtonElement>('data-after-dir');
  const openIn = $<HTMLInputElement>('data-open-in');
  const quote = $<HTMLInputElement>('data-quote');
  const send = $<HTMLButtonElement>('data-send');
  void loadSettings().then((s) => {
    nextAfter.checked = nextAfterReact = s.nextAfterReact;
    afterReactDir = s.afterReactDir;
    renderAfterDir();
    quote.checked = s.quoteReply;
    openIn.checked = openInInstagram = s.openInInstagram;
    onlyNotReacted = s.onlyNotReacted;
    renderChrome(true);
    if (s.seenKeys || closed) return;
    showKeyCard(true);
    saveSettings({ seenKeys: true });
  });
  const coach = keyCard();
  coach.hidden = true;
  player.append(coach);

  // Not focusable: Space must keep pausing instead of pressing a button.
  const quick = QUICK_REACTIONS.map((emoji, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'emo';
    button.tabIndex = -1;
    button.textContent = emoji;
    button.dataset.kt = i === 0 ? 'F · 1' : String(i + 1);
    button.dataset.ktAt = 't';
    button.title = i === 0 ? `React ${emoji} (F or 1)` : `React ${emoji} (${i + 1})`;
    button.addEventListener('click', () => react(i));
    return button;
  });
  $('data-quick').append(...quick);

  // With the filter on, the current item stays shown: the one I just reacted to leaves once I move away.
  const shown = (i: number) => !onlyNotReacted || i === current || !engaged(items[i]);

  /** The nearest shown item from `from` in direction `step`, or -1. */
  function neighbour(from: number, step: 1 | -1): number {
    for (let i = from + step; i >= 0 && i < items.length; i += step) if (shown(i)) return i;
    return -1;
  }

  function renderAfterDir(): void {
    afterDir.textContent = afterReactDir === 'older' ? '↑ older' : '↓ newer';
    afterDir.disabled = !nextAfterReact;
  }

  function renderNav(): void {
    $<HTMLButtonElement>('data-prev').disabled = neighbour(current, -1) < 0 && edge === 'start';
    $<HTMLButtonElement>('data-next').disabled = neighbour(current, 1) < 0;
  }

  function renderChrome(follow: Follow): void {
    const item = items[current];
    const left = items.filter((r) => !engaged(r)).length;
    $('data-pos').textContent = `${items.length - current} / ${items.length} loaded · ${left} to react`;
    renderNav();
    $('data-filter').setAttribute('aria-pressed', String(onlyNotReacted));
    renderCaught(onlyNotReacted && left === 0);
    quick.forEach((b) => b.classList.toggle('mine', b.textContent === item.myReaction));
    const av = $('data-av');
    av.hidden = !item.senderName;
    av.textContent = Array.from(item.senderName ?? '')[0]?.toUpperCase() ?? '';
    $('data-sender').textContent = item.senderName ?? '';
    $('data-sent').textContent = SENT_AT.format(item.timestampMs);
    reply.placeholder = item.senderName ? `Reply to ${item.senderName}…` : 'Reply…';
    renderTalk(item);
    strip.render(items, current, edge, follow, shown);
  }

  /** The end card over the dimmed video once the filter leaves nothing to react to. */
  function renderCaught(on: boolean): void {
    const box = $('data-caught');
    box.hidden = !on;
    video.classList.toggle('caught', on);
    const shows = on ? `${items.length}${edge === 'start'}` : '';
    if (!on || shows === caughtShows) return;
    caughtShows = shows;
    box.replaceChildren(
      stateCard({
        big: '✓',
        title: 'All caught up',
        text: `You reacted or replied to all ${items.length} loaded.`,
        keys: [
          ...(edge === 'start' ? [] : [{ key: 'W', label: 'Look further back', act: () => item(-1) }]),
          { key: 'U', label: 'Show all', act: toggleFilter },
          { key: 'Esc', label: 'Close', act: close },
        ],
      }),
    );
  }

  /** What the sender wrote with the item, then my replies; a section with nothing in it isn't shown. */
  function renderTalk(item: Item): void {
    const section = (attr: string, texts: string[], side: 'theirs' | 'mine') => {
      $(`${attr}-head`).hidden = texts.length === 0;
      const list = $(attr);
      list.hidden = texts.length === 0;
      list.replaceChildren(
        ...texts.map((text) => {
          const li = document.createElement('li');
          li.className = `bub ${side}`;
          li.textContent = text;
          return li;
        }),
      );
      return list;
    };
    section('data-notes', item.notes, 'theirs');
    const mine = pending?.id === item.id ? pending : null;
    // A quoted reply that went through is already the last of my replies; any other gets its own bubble.
    const own = mine && !(mine.state === 'sent' && mine.quoted);
    const replies = section('data-replies', own ? [...item.myReplies, mine.text] : item.myReplies, 'mine');
    $('data-talk').hidden = item.notes.length === 0 && replies.hidden;
    const bubble = replies.lastElementChild;
    if (!mine || !bubble) return;
    bubble.classList.toggle('sending', mine.state === 'sending');
    bubble.classList.toggle('bad', mine.state === 'failed');
    const st = document.createElement('span');
    st.className = 'st';
    if (mine.state === 'failed') st.append('Not sent · ', keyMark('R'), ' to try again');
    else st.textContent = mine.state === 'sent' ? '✓' : 'Sending…';
    bubble.append(st);
  }

  /** The shared post's card above the panel, or none; `post` comes once the item's media read settled. */
  function renderPost(post: Post | null): void {
    postCard.replaceChildren(...(post ? postParts(post) : []));
    postCard.scrollTop = 0;
    const was = postCard.hidden;
    fitPost();
    if (was && !postCard.hidden) animate(postCard, PANEL_RISE, { duration: PANEL_MS });
  }

  /** The card takes only what room the panel leaves above it, and none when that is too little to read. */
  function fitPost(): void {
    const room = side.clientHeight - panel.offsetHeight - parseFloat(getComputedStyle(side).rowGap || '0');
    postCard.hidden = postCard.childElementCount === 0 || room < POST_MIN_PX;
  }
  // The panel grows with bubbles and the column with the window.
  const fit = new ResizeObserver(fitPost);
  fit.observe(side);
  fit.observe(panel);

  let failTimer = 0;
  /** Says on the control that its action didn't land: it shakes red-ringed, and a line says which key tries again. */
  function showFailure(control: HTMLElement, line: (string | Node)[], e: unknown): void {
    console.warn('[dm-slide]', e instanceof Error ? e.message : e);
    clearFailure();
    control.classList.add('bad');
    if (!reduceMotion()) animate(control, SHAKE, { duration: SHAKE_MS, easing: 'ease-in-out' });
    const el = $('data-fail');
    if (e instanceof CantRead) el.textContent = CANT_READ;
    else el.replaceChildren(...line);
    el.hidden = false;
    failTimer = window.setTimeout(clearFailure, FAIL_MS);
  }

  function clearFailure(): void {
    clearTimeout(failTimer);
    $('data-fail').hidden = true;
    for (const el of quick) el.classList.remove('bad');
  }

  // Following the chat is a convenience: if the row can't be found, the player carries on.
  function revealCurrent(): void {
    try {
      adapter.reveal(items[current].id);
    } catch (e) {
      console.warn('[dm-slide]', e instanceof Error ? e.message : e);
    }
  }

  function go(index: number): void {
    if (index < 0 || index >= items.length) return;
    stopAutoOpen();
    // A click doesn't pass through the keys; the strip must be measured settled, not mid-glide.
    finishAll();
    const dir = Math.sign(index - current) as -1 | 0 | 1;
    current = index;
    renderChrome(dir ? 'glide' : true);
    if (dir) for (const el of [$('data-who'), $('data-quick')]) animate(el, PANEL_RISE, { duration: PANEL_MS });
    // The preload reads what the next press the same way would show; a jump guesses the way reacting moves.
    const ahead = neighbour(current, dir < 0 || (!dir && afterReactDir === 'older') ? -1 : 1);
    const shows = items[current];
    renderPost(null);
    // The read that brings the media brings the post's words too; a later move drops this answer.
    void stage.show(shows, items[ahead], dir).then((still) => still && !closed && items[current] === shows && renderPost(adapter.post(shows)));
    // Scrolling now would pull the row from under a reaction under way; the chat follows once they're done.
    if (!reacting) revealCurrent();
  }

  /** Puts the items older than the first one in front, and counts those shown; newer arrivals wait for the next open. */
  function mergeOlder(found: Item[]): number {
    const known = new Set(items.map((r) => r.id));
    const older = found.filter((r) => !known.has(r.id) && r.timestampMs <= items[0].timestampMs);
    items = [...older, ...items];
    current += older.length;
    return older.filter((r) => !onlyNotReacted || !engaged(r)).length;
  }

  /** One page, and only when the user asked for it: loading on its own is what a bot does. */
  async function fetchOlder(): Promise<Older> {
    edge = 'loading';
    renderChrome(false);
    let result: Older = 'nothing';
    try {
      // A page scrolls the thread to its top, which would pull the row away from a reaction or reply under way.
      while ((reacting || sending || away) && !closed) await sleep(BUSY_POLL_MS);
      if (!closed) {
        if (!(await adapter.loadOlder())) {
          edge = 'start';
          result = 'start';
        } else if (!closed && mergeOlder(adapter.listItems()) > 0) result = 'found';
      }
    } catch (e) {
      result = 'failed';
      console.warn('[dm-slide]', e instanceof Error ? e.message : e);
      if (!closed) pill.show(e instanceof CantRead ? CANT_READ : "Couldn't load older · W to try again", FAIL_MS, true);
    }
    if (edge === 'loading') edge = null;
    // Loading scrolled the thread to its top: bring it back to the item on screen, open or closed.
    if (!reacting) revealCurrent();
    if (!closed) renderChrome(false);
    return result;
  }

  /** One load at a time; asking during one joins it. */
  function loadOlder(): Promise<Older> {
    if (edge === 'start' || closed) return Promise.resolve(edge === 'start' ? 'start' : 'nothing');
    loading ??= fetchOlder().finally(() => (loading = null));
    return loading;
  }

  async function prev(held = false): Promise<void> {
    const before = neighbour(current, -1);
    if (before >= 0) return go(before);
    // A held key moves through loaded items, but only a fresh press loads a page.
    if (held) return;
    if (edge !== 'start') {
      const from = items[current].id;
      pill.show(LOADING_OLDER);
      const loaded = await loadOlder();
      if (pill.text === LOADING_OLDER) pill.hide();
      // Only if the player is still on the item A was pressed on.
      if (items[current].id !== from || closed || away) return;
      const older = neighbour(current, -1);
      if (older >= 0) return go(older);
      if (loaded === 'nothing') return void pill.show(NOTHING_OLDER, START_PILL_MS);
    }
    if (edge === 'start') atStart();
  }

  function atStart(): void {
    pill.show('Start of the chat', START_PILL_MS);
    if (!reduceMotion()) animate(video, BUMP, { duration: BUMP_MS });
  }

  const next = () => go(neighbour(current, 1));
  const item = (delta: -1 | 1, held = false) => (delta < 0 ? void prev(held) : next());
  const step = (delta: -1 | 1) => stage.slide(delta) || item(delta);

  function toggleFilter(): void {
    onlyNotReacted = !onlyNotReacted;
    saveSettings({ onlyNotReacted });
    renderChrome(true);
    player.focus();
  }

  /** Shows the quick reaction in `slot` at once, or removes it when it is already mine, and moves on; Instagram hears in the background. */
  function react(slot: number): void {
    const emoji = QUICK_REACTIONS[slot];
    if (!emoji) return;
    const item = items[current];
    const removing = item.myReaction === emoji;
    clearFailure();
    strip.flag(item.id, false);
    const job: ReactJob = { item, target: removing ? null : emoji, was: item.myReaction, slot };
    item.myReaction = job.target;
    // A press on an item still waiting its turn replaces that one.
    const waiting = reactions.findIndex((j) => j.item === item);
    if (waiting >= 0) reactions[waiting] = { ...job, was: reactions[waiting].was };
    else reactions.push(job);
    void tellReactions();
    // Moving older stops at the oldest loaded item: reacting never loads history.
    const to = neighbour(current, afterReactDir === 'older' ? -1 : 1);
    if (removing || !nextAfterReact || to < 0) renderChrome(false);
    else go(to);
    // After the move, which settles every running motion.
    if (!reduceMotion()) animate(quick[slot], POP, { duration: POP_MS, easing: 'ease-out' });
    if (!removing) celebrate(item, emoji);
  }

  /** Waits out the gap since the last thing told to Instagram, then tells it this one. */
  async function told<T>(act: () => Promise<T>): Promise<T> {
    const wait = lastTold + ACTION_GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    try {
      return await act();
    } finally {
      lastTold = Date.now();
    }
  }

  /** Tells Instagram each waiting reaction in turn, never during a reply; a failed one is undone, never tried again on its own. */
  async function tellReactions(): Promise<void> {
    if (reacting) return;
    reacting = true;
    while (reactions.length > 0) {
      const job = reactions.shift()!;
      while (replying) await sleep(BUSY_POLL_MS);
      // Instagram's picker takes the focus (onto its ❤️); whatever had it gets it back.
      const focused = root.activeElement instanceof HTMLElement ? root.activeElement : player;
      let error: unknown = null;
      try {
        await told(() => (job.target ? adapter.react(job.item.id, job.target) : adapter.unreact(job.item.id)));
      } catch (e) {
        error = e;
      }
      if (!closed && !away) focused.focus();
      if (error) reactionFailed(job, error);
    }
    reacting = false;
    if (!closed) revealCurrent();
  }

  /** Puts back what Instagram shows for the item, and says the reaction failed on its control, or on its tile once the player moved on. */
  function reactionFailed(job: ReactJob, e: unknown): void {
    const { item, slot } = job;
    // A newer press on the item is still waiting; that one decides what it shows.
    if (!reactions.some((j) => j.item === item)) item.myReaction = reactionShown(item) ?? job.was;
    const emoji = QUICK_REACTIONS[slot];
    const verb = job.target ? "didn't land" : 'is still there';
    if (!closed && items[current] === item) {
      showFailure(quick[slot], [`Your ${emoji} ${verb} · `, keyMark(slot === 0 ? 'F' : String(slot + 1)), ' to try again'], e);
    } else {
      console.warn('[dm-slide]', e instanceof Error ? e.message : e);
      if (closed) return;
      const tile = strip.flag(item.id, true);
      if (tile && !reduceMotion()) animate(tile, SHAKE, { duration: SHAKE_MS, easing: 'ease-in-out' });
      window.setTimeout(() => strip.flag(item.id, false), FAIL_MS);
      pill.show(e instanceof CantRead ? CANT_READ : `Your ${emoji} on #${items.length - items.indexOf(item)} ${verb}`, FAIL_MS, true);
    }
    renderChrome(false);
  }

  /** My reaction as Instagram shows it now, or undefined when the thread can't be read. */
  function reactionShown(item: Item): string | null | undefined {
    try {
      const found = adapter.listItems().find((r) => r.id === item.id);
      return found ? found.myReaction : undefined;
    } catch {
      return undefined;
    }
  }

  /** Bursts the emoji over the video and flies a copy to the item's tile, whose badge then pops. */
  function celebrate(item: Item, emoji: string): void {
    const burst = $('data-burst');
    burst.textContent = emoji;
    animate(burst, BURST, { duration: BURST_MS, easing: 'ease-out', fade: 'out' });
    const target = strip.visibleTile(item.id);
    // A tile out of view or filtered out gets no flyer: the strip never scrolls for one.
    if (!target) return;
    const reduced = reduceMotion();
    animate(target.tile, BADGE_POP, { pseudoElement: '::after', duration: BADGE_MS, delay: reduced ? 0 : FLY_DELAY_MS + FLY_MS, fill: 'backwards' });
    if (reduced) return;
    const box = player.getBoundingClientRect();
    const from = $('data-reel').getBoundingClientRect();
    const to = target.rect;
    const flyer = document.createElement('span');
    flyer.className = 'p-flyer';
    flyer.textContent = emoji;
    player.append(flyer);
    // The 26px flyer is centred on the video, then on the badge inside the tile's bottom-right corner.
    const x0 = from.left - box.left + from.width / 2 - 13;
    const y0 = from.top - box.top + from.height / 2 - 13;
    const x1 = to.right - box.left - 25;
    const y1 = to.bottom - box.top - 24;
    const fly = animate(
      flyer,
      [
        { transform: `translate(${x0}px, ${y0}px) scale(1.8)`, opacity: 0.9 },
        { transform: `translate(${x1}px, ${y1}px) scale(.6)`, opacity: 1 },
      ],
      { duration: FLY_MS, delay: FLY_DELAY_MS, easing: 'cubic-bezier(.5,0,.2,1)' },
    );
    const drop = () => flyer.remove();
    fly.addEventListener('finish', drop);
    fly.addEventListener('cancel', drop);
  }

  let sentTimer = 0;
  function renderSend(): void {
    reply.disabled = sending;
    send.disabled = sending || reply.value.trim() === '';
  }

  /** Sends the box's text about the current item as a bubble at once; a failed one puts the text back in the box. */
  async function sendReply(): Promise<void> {
    const text = reply.value.trim();
    if (!text || sending) return;
    const item = items[current];
    const quoted = quote.checked;
    clearFailure();
    clearTimeout(sentTimer);
    sending = true;
    const sent: Pending = { id: item.id, text, quoted, state: 'sending' };
    pending = sent;
    reply.value = '';
    renderSend();
    renderChrome(false);
    try {
      // A reaction under way is driving Instagram's picker; the composer waits for the queue to empty.
      while (reacting) await sleep(BUSY_POLL_MS);
      replying = true;
      await told(() => adapter.reply(item.id, text, quoted));
      if (quoted) item.myReplies.push(text);
      sent.state = 'sent';
      const shown = sent;
      sentTimer = window.setTimeout(() => {
        if (pending !== shown) return;
        pending = null;
        if (!closed) renderChrome(false);
      }, SENT_MS);
    } catch (e) {
      console.warn('[dm-slide]', e instanceof Error ? e.message : e);
      sent.state = 'failed';
      // Typing something else meanwhile wins over the text that failed.
      if (!reply.value.trim()) reply.value = text;
    }
    replying = false;
    sending = false;
    renderSend();
    renderChrome(false);
    // Instagram's composer took the focus to type; the player takes it back.
    player.focus();
  }

  const tipsButton = $('data-tips');
  $('data-hold').textContent = `hold ${/Mac/.test(navigator.platform) ? '⌥' : 'Alt'} for keys`;
  function renderTips(): void {
    player.classList.toggle('tips', tipsHeld || tipsPinned);
    tipsButton.setAttribute('aria-pressed', String(tipsPinned));
  }

  const unbindKeys = bindKeys((e) => e.composedPath()[0] === reply, {
    item,
    step,
    close,
    togglePause: () => stage.togglePause(),
    toggleMute: () => stage.toggleMute(),
    toggleFilter,
    react,
    focusReply: () => reply.focus(),
    blurReply: () => player.focus(),
    holdTips: (held) => {
      if (held) stopAutoOpen();
      tipsHeld = held;
      renderTips();
    },
    toggleTips,
    dismissKeyCard,
    instagramView: () => void instagramView(),
    away: () => away,
  });

  /** Steps aside for Instagram's own view of the item; while away, closes that view instead. */
  async function instagramView(): Promise<void> {
    if (away) {
      adapter.closeLayer();
      return;
    }
    // The view could cover a picker or composer the extension is driving, or a thread a load is scrolling.
    if (closed || opening || reacting || sending || loading) return;
    finishAll();
    stage.pause();
    // Opened by hand or by itself, it opens by itself no more: coming back must not reopen it.
    stopAutoOpen();
    autoOpened.add(items[current].id);
    opening = true;
    try {
      await adapter.openLayer(items[current].id);
    } catch (e) {
      console.warn('[dm-slide]', e);
      pill.show(e instanceof CantRead ? CANT_READ : "Instagram view didn't open · I to try again", FAIL_MS, true);
      return;
    } finally {
      opening = false;
    }
    // Hidden only now, so a view that never opens leaves the player where it was instead of blinking away.
    if (closed) return void adapter.closeLayer();
    setAway(true);
    watchLayer();
  }

  function cantPlay(it: Item): void {
    unplayable.add(it.id);
    if (items[current]?.id === it.id) armAutoOpen(AUTO_OPEN_MS);
  }

  function armAutoOpen(ms: number): void {
    const id = items[current].id;
    if (!openInInstagram || autoTimer || autoOpened.has(id)) return;
    autoTimer = setTimeout(() => {
      autoTimer = undefined;
      if (closed || away || !openInInstagram || items[current]?.id !== id) return;
      // An action under way would refuse the view: wait for it instead of dropping the open.
      if (opening || reacting || sending || loading) return armAutoOpen(BUSY_POLL_MS);
      void instagramView();
    }, ms);
  }

  function stopAutoOpen(): void {
    clearTimeout(autoTimer);
    autoTimer = undefined;
  }

  function watchLayer(): void {
    awayTimer = setTimeout(() => {
      if (closed) return;
      if (adapter.layerOpen()) watchLayer();
      else comeBack();
    }, LAYER_POLL_MS);
  }

  /** Back, paused, on the same item; unless the view led to another conversation, which closes the player. */
  function comeBack(): void {
    setAway(false);
    if (location.pathname !== path) return close();
    (document.activeElement as HTMLElement | null)?.blur();
    player.focus();
  }

  function setAway(on: boolean): void {
    away = on;
    player.hidden = on;
    back.hidden = !on;
    // Only the Back chip stays clickable; the rest of the page is Instagram's.
    host.style.pointerEvents = on ? 'none' : '';
  }

  /** `?` shows the key card with the tips, or hides whichever is showing. */
  function toggleTips(): void {
    const on = !tipsPinned && coach.hidden === true;
    tipsPinned = on;
    showKeyCard(on);
    renderTips();
  }

  function showKeyCard(on: boolean): void {
    if (on) stopAutoOpen();
    if (on && coach.hidden) animate(coach, [HIDE, SHOW], { duration: BACKDROP_IN_MS });
    coach.hidden = !on;
  }

  function dismissKeyCard(): boolean {
    if (coach.hidden) return false;
    // `?` pinned the tips along with the card; they leave together.
    tipsPinned = false;
    showKeyCard(false);
    renderTips();
    player.focus();
    return true;
  }

  /** The transform that lays the video, at rest, over `box`; its corners keep the message's radius. */
  function onto(box: Box): { video: Keyframe; reel: Keyframe } {
    const at = video.getBoundingClientRect();
    const sx = box.width / at.width;
    const sy = box.height / at.height;
    return {
      video: { transform: `translate(${box.x - at.x}px, ${box.y - at.y}px) scale(${sx}, ${sy})` },
      reel: { borderRadius: `${MESSAGE_RADIUS_PX / sx}px / ${MESSAGE_RADIUS_PX / sy}px` },
    };
  }

  function enter(from: Box | null): void {
    const linear = { easing: 'linear' };
    if (!from) {
      animate(player, [CLEAR, BLACK], { ...linear, duration: BACKDROP_IN_MS });
      for (const el of [head, body]) animate(el, [RISE_FROM, { opacity: 1, transform: 'none' }], { duration: RISE_IN_MS });
      return;
    }
    const start = onto(from);
    animate(player, [CLEAR, BLACK], { ...linear, duration: BACKDROP_MS });
    animate(video, [start.video, { transform: 'none' }], { duration: GROW_MS });
    if (!reduceMotion()) animate(reel, [start.reel, { borderRadius: '14px' }], { duration: GROW_MS });
    for (const el of chrome) animate(el, [HIDE, SHOW], { ...linear, ...CHROME_IN, fill: 'backwards' });
  }

  function exit(to: Box | null): Animation[] {
    const out = { fade: 'out' as const, fill: 'forwards' as const };
    if (!to) {
      return [
        animate(player, [BLACK, CLEAR], { ...out, easing: 'linear', duration: SINK_MS }),
        ...[head, body].map((el) => animate(el, [{ opacity: 1, transform: 'none' }, RISE_FROM], { ...out, easing: 'ease-in', duration: SINK_MS })),
      ];
    }
    const end = onto(to);
    const shrink = { ...out, easing: SHRINK_EASE, duration: SHRINK_MS };
    return [
      animate(player, [BLACK, CLEAR], { ...out, easing: 'linear', duration: BACKDROP_MS, delay: 60, fill: 'both' }),
      animate(video, [{ transform: 'none' }, end.video], shrink),
      ...(reduceMotion() ? [] : [animate(reel, [{ borderRadius: '14px' }, end.reel], shrink)]),
      ...chrome.map((el) => animate(el, [SHOW, HIDE], { ...out, easing: 'linear', duration: CHROME_OUT_MS })),
    ];
  }

  // The chat is back in charge at once; the player only finishes leaving, and lets clicks through meanwhile.
  function close(): void {
    if (closed) return;
    closed = true;
    clearTimeout(awayTimer);
    stopAutoOpen();
    unbindKeys();
    unbindPause();
    fit.disconnect();
    finishAll();
    const to = adapter.rectOf(items[current].id);
    host.style.pointerEvents = 'none';
    host.inert = true;
    onClose();
    void Promise.allSettled(exit(to).map((a) => a.finished)).then(() => {
      stage.destroy();
      host.remove();
    });
  }

  const unbindPause = adapter.onPause(() => pill.show(PAUSED, PAUSED_MS, true));

  $('data-close').addEventListener('click', close);
  $('data-prev').addEventListener('click', () => item(-1));
  $('data-next').addEventListener('click', () => item(1));
  $('data-filter').addEventListener('click', toggleFilter);
  $('data-ig').addEventListener('click', () => void instagramView());
  back.addEventListener('click', () => adapter.closeLayer());
  tipsButton.addEventListener('click', toggleTips);
  coach.addEventListener('click', dismissKeyCard);
  $('data-strip').addEventListener('click', (e) => {
    const tile = (e.target as Element).closest<HTMLElement>('li[data-i]');
    if (tile) go(Number(tile.dataset.i));
  });
  // One page per gesture: a swipe fires a wheel event per frame, so the next load waits for the wheel to rest.
  let wheelArmed = true;
  let wheelRest: ReturnType<typeof setTimeout> | undefined;
  $('data-strip').addEventListener(
    'wheel',
    (e) => {
      const strip = e.currentTarget as HTMLElement;
      clearTimeout(wheelRest);
      wheelRest = setTimeout(() => (wheelArmed = true), WHEEL_REST_MS);
      if (!wheelArmed || e.deltaY >= 0 || strip.scrollTop >= STRIP_LOAD_MARGIN_PX) return;
      wheelArmed = false;
      void loadOlder();
    },
    { passive: true },
  );
  $('data-reel').addEventListener('click', (e) => {
    if (!(e.target as Element).closest('a, button')) stage.togglePause();
  });
  nextAfter.addEventListener('change', () => {
    nextAfterReact = nextAfter.checked;
    saveSettings({ nextAfterReact });
    renderAfterDir();
    player.focus();
  });
  afterDir.addEventListener('click', () => {
    afterReactDir = afterReactDir === 'newer' ? 'older' : 'newer';
    saveSettings({ afterReactDir });
    renderAfterDir();
    player.focus();
  });
  openIn.addEventListener('change', () => {
    openInInstagram = openIn.checked;
    saveSettings({ openInInstagram });
    player.focus();
  });
  $('data-reply-form').addEventListener('submit', (e) => {
    e.preventDefault();
    void sendReply();
  });
  reply.addEventListener('input', renderSend);
  reply.addEventListener('focus', stopAutoOpen);
  quote.addEventListener('change', () => {
    saveSettings({ quoteReply: quote.checked });
    player.focus();
  });

  // Read before go() moves the chat to the item.
  const from = adapter.rectOf(items[start].id);
  // Instagram's composer may hold the focus; typed keys would land in it.
  (document.activeElement as HTMLElement | null)?.blur();
  document.body.append(host);
  player.focus();
  go(start);
  enter(from);
  return { close, away: () => away };
}

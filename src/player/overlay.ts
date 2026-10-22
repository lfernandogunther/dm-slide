// The player: a full-window overlay in its own shadow root, laid out like the prototype
// (specs/01-mvp/prototype/index.html). It talks only to the ThreadAdapter.
import { CantRead, QUICK_REACTIONS, type Item, type ThreadAdapter } from '../instagram/adapter';
import { bindKeys } from './keys';
import { loadSettings, saveSettings } from './settings';
import { createStage } from './stage';
import { renderStrip, type StripEdge } from './strip';

// Going back loads page after page on its own until the chat reaches this far into the past.
const LOAD_HORIZON_MS = 60 * 24 * 60 * 60 * 1000;
// Past that, one load goes on for at most this many pages while they bring no item to show.
const MAX_PAGES_PER_LOAD = 5;
// A pause between pages, drawn at random, so loading reads like a person scrolling up, not a burst.
const PAGE_PAUSE_MS = { min: 1200, max: 3000 };
// Loading starts once fewer shown items than this are left above the current one.
const PREFETCH_ITEMS = 3;
const STRIP_LOAD_MARGIN_PX = 40;
// Long enough to read; the next action clears it sooner.
const ALERT_MS = 6000;

const STYLE = `
  * { box-sizing: border-box; }
  button { font: inherit; color: inherit; cursor: pointer; }
  .player {
    position: absolute; inset: 0; display: flex; flex-direction: column; outline: 0;
    background: #000; color: #f5f5f5;
    font: 14px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  .muted { color: #a8a8a8; }
  kbd {
    font: 11px ui-monospace, monospace; background: #262626; border: 1px solid #3a3a3a;
    border-bottom-width: 2px; border-radius: 4px; padding: 0 5px;
  }
  .p-head { display: flex; align-items: center; gap: 16px; padding: 10px 16px; border-bottom: 1px solid #262626; flex-wrap: wrap; }
  .p-title { flex: 1; min-width: 160px; }
  .p-keys { display: flex; gap: 10px; flex-wrap: wrap; font-size: 12px; color: #a8a8a8; }
  .icon-btn { background: transparent; border: 0; font-size: 18px; padding: 4px 8px; }
  .p-filter { background: transparent; border: 1px solid #3a3a3a; border-radius: 999px; padding: 4px 12px; font-size: 12px; }
  .p-filter[aria-pressed="true"] { background: #f5f5f5; border-color: #f5f5f5; color: #000; }
  .p-alert { padding: 8px 16px; background: #3a1d1d; color: #ffb4b4; font-size: 13px; text-align: center; }
  .p-alert[hidden] { display: none; }
  .p-notice { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 16px; text-align: center; }
  .p-notice strong { font-size: 18px; }
  .p-notice p { margin: 0; max-width: 480px; overflow-wrap: anywhere; }
  .p-notice button { margin-top: 8px; border: 0; background: #262626; border-radius: 16px; padding: 6px 16px; }
  .p-body { flex: 1; display: flex; gap: 16px; padding: 16px; min-height: 0; }
  .p-strip {
    list-style: none; margin: 0; padding: 4px 12px 8px 0; width: 84px; flex-shrink: 0;
    overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column; gap: 8px;
    scrollbar-width: thin; scrollbar-color: transparent transparent;
  }
  .p-strip:hover { scrollbar-color: #4a4a4a transparent; }
  .p-strip li {
    position: relative; width: 60px; height: 92px; flex-shrink: 0; border-radius: 8px; cursor: pointer;
    display: grid; place-items: center; font-size: 16px; background: #1c1c1e; opacity: 0.5;
    border: 2px solid transparent;
  }
  .p-strip li.current { opacity: 1; border-color: #fff; }
  .p-strip li.edge { height: auto; background: none; opacity: 1; border: 0; cursor: default; font-size: 11px; color: #a8a8a8; text-align: center; }
  .p-strip li[hidden] { display: none; }
  .p-strip li .kind { position: absolute; left: 4px; top: 3px; font-size: 12px; line-height: 1; }
  .p-strip li.reacted::after { content: attr(data-reaction); position: absolute; right: -6px; bottom: -6px; font-size: 14px; }
  .p-strip li.replied::before { content: "💬"; position: absolute; right: -6px; bottom: -6px; font-size: 14px; }
  .p-strip li.replied.reacted::before { right: 12px; }
  .p-stage { flex: 1; display: flex; align-items: center; justify-content: center; gap: 14px; min-width: 0; }
  .nav { width: 44px; height: 44px; border-radius: 50%; border: 0; background: #262626; font-size: 24px; flex-shrink: 0; }
  .nav:disabled { opacity: 0.25; cursor: default; }
  .p-center { position: relative; display: flex; flex-direction: column; gap: 10px; align-items: stretch; }
  .p-empty {
    position: absolute; z-index: 1; top: 48px; left: 12px; right: 12px; display: flex; flex-direction: column; gap: 8px;
    align-items: center; padding: 12px; border-radius: 12px; background: rgba(38, 38, 38, 0.92); text-align: center;
  }
  .p-empty[hidden] { display: none; }
  .p-empty button { border: 0; background: #0095f6; border-radius: 16px; padding: 6px 16px; font-weight: 600; }
  .p-meta { width: 0; min-width: 100%; display: flex; gap: 6px; font-size: 13px; color: #a8a8a8; padding: 0 4px; white-space: nowrap; }
  .p-meta strong { color: #fff; overflow: hidden; text-overflow: ellipsis; }
  .reel {
    position: relative; overflow: hidden; cursor: pointer;
    height: clamp(280px, calc(100vh - 220px), 640px); aspect-ratio: 9 / 16; border-radius: 14px;
    background: #1c1c1e; display: grid; place-items: center;
  }
  .reel video, .reel img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: #000; }
  .reel [hidden] { display: none; }
  .reel-status { text-align: center; color: #a8a8a8; padding: 16px; line-height: 1.8; }
  .reel-status a { color: #0095f6; }
  .reel-play {
    position: absolute; font-size: 40px; opacity: 0; transition: opacity 0.2s; pointer-events: none;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
  }
  .reel.paused .reel-play { opacity: 1; }
  .reel-mute {
    position: absolute; right: 12px; bottom: 16px; width: 28px; height: 28px; border-radius: 50%;
    border: 0; padding: 0; background: rgba(38, 38, 38, 0.8); color: #fff; display: grid; place-items: center;
  }
  .reel-progress { position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: rgba(255, 255, 255, 0.25); }
  .reel-dots { position: absolute; top: 6px; left: 0; right: 0; display: flex; justify-content: center; gap: 2px; }
  .reel-dots span { width: 6px; height: 6px; margin: 4px; cursor: pointer; border-radius: 50%; background: rgba(255, 255, 255, 0.4); }
  .reel-dots span.on { background: #fff; }
  .reel-progress div { height: 100%; width: 0; background: #fff; }
  .p-reply { display: flex; gap: 8px; align-items: center; background: #121212; border: 1px solid #3a3a3a; border-radius: 22px; padding: 4px 6px 4px 14px; }
  .p-reply:focus-within { border-color: #0095f6; }
  .p-reply input { flex: 1; min-width: 0; background: transparent; border: 0; outline: 0; padding: 8px 0; color: inherit; font: inherit; }
  .p-reply button { border: 0; background: #0095f6; border-radius: 16px; padding: 6px 12px; font-weight: 600; }
  .p-reply button:disabled { opacity: 0.4; cursor: default; }
  .p-reply input:disabled { opacity: 0.5; }
  /* Under the box, text wraps to the video's width instead of widening the column. */
  .p-reply-opts, .p-replies { width: 0; min-width: 100%; }
  .p-reply-opts { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; color: #a8a8a8; padding: 0 14px; }
  .p-reply-opts label { display: flex; gap: 6px; align-items: center; cursor: pointer; }
  .p-reply-opts input { margin: 0; }
  .p-replies { list-style: none; margin: 0; padding: 0 14px; max-height: 96px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
  .p-replies li { background: #262626; border-radius: 12px; padding: 4px 10px; align-self: flex-end; max-width: 100%; overflow-wrap: anywhere; }
  .p-replies li::before { content: "You: "; color: #a8a8a8; }
  .p-actions { display: flex; flex-direction: column; align-items: center; gap: 10px; width: 76px; }
  .p-quick { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .quick { width: 40px; height: 40px; border-radius: 50%; border: 2px solid transparent; background: transparent; font-size: 20px; padding: 0; }
  .quick:hover { background: #262626; }
  .quick.mine { border-color: #fff; background: #262626; }
  .quick { position: relative; }
  .quick::after {
    content: attr(data-key); position: absolute; right: -4px; bottom: -4px; line-height: 1.3;
    font: 10px ui-monospace, monospace; color: #a8a8a8; background: #262626; border: 1px solid #3a3a3a; border-radius: 4px; padding: 0 4px;
  }
  .reacting .quick { opacity: 0.4; cursor: progress; }
  .p-setting { display: flex; flex-direction: column; gap: 4px; align-items: center; font-size: 11px; line-height: 1.3; color: #a8a8a8; text-align: center; cursor: pointer; }
  .p-setting input { margin: 0; }
`;

const LAYOUT = `
  <div class="player" tabindex="-1">
    <header class="p-head">
      <div class="p-title"><strong>Reel Queue</strong> <span class="muted" data-pos></span></div>
      <div class="p-keys">
        <span><kbd>W</kbd><kbd>S</kbd> or <kbd>↑</kbd><kbd>↓</kbd> prev / next</span><span><kbd>A</kbd><kbd>D</kbd> or <kbd>←</kbd><kbd>→</kbd> slides</span>
        <span><kbd>Space</kbd> pause</span><span><kbd>M</kbd> sound</span><span><kbd>F</kbd> or <kbd>1</kbd>–<kbd>6</kbd> react</span><span><kbd>R</kbd> reply</span><span><kbd>U</kbd> not reacted</span><span><kbd>Esc</kbd> close</span>
      </div>
      <button class="p-filter" data-filter tabindex="-1" aria-pressed="false" title="Only the ones without my reaction (U)">Not reacted</button>
      <button class="icon-btn" data-close title="Close (Esc)">✕</button>
    </header>
    <div class="p-alert" data-alert role="alert" hidden></div>
    <div class="p-body">
      <ol class="p-strip" data-strip></ol>
      <div class="p-stage">
        <button class="nav" data-prev title="Previous (A / ←)">‹</button>
        <div class="p-center">
          <div class="p-meta"><strong data-sender></strong><span data-sent></span></div>
          <div class="p-empty" data-empty hidden><span data-empty-text></span><button type="button" data-show-all tabindex="-1">Show all (U)</button></div>
          <div class="reel" data-reel></div>
          <form class="p-reply" data-reply-form>
            <input type="text" data-reply autocomplete="off" placeholder="Reply…">
            <button type="submit" data-send disabled title="Send (Enter)">Send</button>
          </form>
          <div class="p-reply-opts">
            <label><input type="checkbox" data-quote tabindex="-1" checked>Quote it</label>
            <span data-reply-status></span>
          </div>
          <ul class="p-replies" data-replies></ul>
        </div>
        <div class="p-actions">
          <div class="p-quick" data-quick></div>
          <label class="p-setting"><input type="checkbox" data-next-after tabindex="-1" checked>Next after reacting</label>
        </div>
        <button class="nav" data-next title="Next (D / →)">›</button>
      </div>
    </div>
  </div>
`;

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

// The browser's own language decides the date's format.
const SENT_AT = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export interface Player {
  close(): void;
}

/** The oldest loaded item without my reaction, or the newest one when every item has one. */
export function startIndex(items: Item[]): number {
  const unreacted = items.findIndex((r) => r.myReaction === null);
  return unreacted >= 0 ? unreacted : items.length - 1;
}

const NOTICE = `
  <div class="player" tabindex="-1">
    <header class="p-head">
      <div class="p-title"><strong>Reel Queue</strong></div>
      <button class="icon-btn" data-close title="Close (Esc)">✕</button>
    </header>
    <div class="p-notice">
      <strong>Can't read this conversation</strong>
      <p>Instagram's page may have changed, so Reel Queue does nothing here.</p>
      <p class="muted" data-detail></p>
      <button data-done>Close</button>
    </div>
  </div>
`;

/** In place of the player when the thread can't be read: says so, and does nothing else. */
export function openNotice(detail: string, onClose: () => void): Player {
  const host = document.createElement('div');
  host.style.cssText = 'position: fixed; inset: 0; z-index: 2147483647;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${STYLE}</style>${NOTICE}`;
  const panel = root.querySelector<HTMLElement>('.player')!;
  root.querySelector('[data-detail]')!.textContent = detail;

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };
  function close(): void {
    window.removeEventListener('keydown', onKey, true);
    host.remove();
    onClose();
  }
  root.querySelector('[data-close]')!.addEventListener('click', close);
  root.querySelector('[data-done]')!.addEventListener('click', close);
  window.addEventListener('keydown', onKey, true);

  (document.activeElement as HTMLElement | null)?.blur();
  document.body.append(host);
  panel.focus();
  return { close };
}

export function openPlayer(adapter: ThreadAdapter, loaded: Item[], start: number, onClose: () => void): Player {
  const host = document.createElement('div');
  host.style.cssText = 'position: fixed; inset: 0; z-index: 2147483647;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${STYLE}</style>${LAYOUT}`;
  const $ = <T extends HTMLElement>(attr: string) => root.querySelector<T>(`[${attr}]`)!;
  const player = root.querySelector<HTMLElement>('.player')!;
  const reply = $<HTMLInputElement>('data-reply');
  const stage = createStage($('data-reel'), adapter, renderNav);

  let items = loaded;
  let current = start;
  let edge: StripEdge = null;
  let loading: Promise<void> | null = null;
  let pageWaiters: (() => void)[] = [];
  let closed = false;
  let reacting = false;
  let sending = false;
  let nextAfterReact = true;
  let onlyNotReacted = false;
  const nextAfter = $<HTMLInputElement>('data-next-after');
  const quote = $<HTMLInputElement>('data-quote');
  const send = $<HTMLButtonElement>('data-send');
  void loadSettings().then((s) => {
    nextAfter.checked = nextAfterReact = s.nextAfterReact;
    quote.checked = s.quoteReply;
    onlyNotReacted = s.onlyNotReacted;
    renderChrome(true);
  });

  // Not focusable: Space must keep pausing instead of pressing a button.
  const quick = QUICK_REACTIONS.map((emoji, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quick';
    button.tabIndex = -1;
    button.textContent = emoji;
    button.dataset.key = String(i + 1);
    button.title = i === 0 ? `React ${emoji} (F or 1)` : `React ${emoji} (${i + 1})`;
    button.addEventListener('click', () => void react(i));
    return button;
  });
  $('data-quick').append(...quick);

  // With the filter on, the current item stays shown: the one I just reacted to leaves once I move away.
  const shown = (i: number) => !onlyNotReacted || i === current || items[i].myReaction === null;

  /** The nearest shown item from `from` in direction `step`, or -1. */
  function neighbour(from: number, step: 1 | -1): number {
    for (let i = from + step; i >= 0 && i < items.length; i += step) if (shown(i)) return i;
    return -1;
  }

  function renderNav(): void {
    $<HTMLButtonElement>('data-prev').disabled = !stage.canSlide(-1) && neighbour(current, -1) < 0 && edge === 'start';
    $<HTMLButtonElement>('data-next').disabled = !stage.canSlide(1) && neighbour(current, 1) < 0;
  }

  function renderChrome(follow: boolean): void {
    const item = items[current];
    const left = items.filter((r) => r.myReaction === null).length;
    $('data-pos').textContent = `· ${items.length - current} of ${items.length} loaded · ${left} to react`;
    renderNav();
    $('data-filter').setAttribute('aria-pressed', String(onlyNotReacted));
    $('data-empty').hidden = !onlyNotReacted || left > 0;
    $('data-empty-text').textContent = `Nothing left to react to${edge === 'start' ? '' : ' in what is loaded'}.`;
    quick.forEach((b) => b.classList.toggle('mine', b.textContent === item.myReaction));
    $('data-sender').textContent = item.senderName ?? '';
    $('data-sent').textContent = `${item.senderName ? '· ' : ''}${SENT_AT.format(item.timestampMs)}`;
    reply.placeholder = item.senderName ? `Reply to ${item.senderName}…` : 'Reply…';
    player.classList.toggle('reacting', reacting);
    $('data-replies').replaceChildren(
      ...item.myReplies.map((text) => {
        const li = document.createElement('li');
        li.textContent = text;
        return li;
      }),
    );
    renderStrip($('data-strip'), items, current, edge, follow, shown);
  }

  let alertTimer = 0;
  /** Says an action did nothing: the thread can't be read at all, or that one action failed. */
  function showFailure(what: string, e: unknown): void {
    const reason = e instanceof Error ? e.message : String(e);
    console.warn('[reel-queue]', reason);
    const el = $('data-alert');
    el.textContent = e instanceof CantRead ? "Can't read this conversation. Nothing was done." : `Couldn't ${what}.`;
    el.title = reason;
    el.hidden = false;
    clearTimeout(alertTimer);
    alertTimer = window.setTimeout(clearFailure, ALERT_MS);
  }

  function clearFailure(): void {
    clearTimeout(alertTimer);
    $('data-alert').hidden = true;
  }

  // Following the chat is a convenience: if the row can't be found, the player carries on.
  function revealCurrent(): void {
    try {
      adapter.reveal(items[current].id);
    } catch (e) {
      console.warn('[reel-queue]', e instanceof Error ? e.message : e);
    }
  }

  function go(index: number): void {
    if (index < 0 || index >= items.length) return;
    current = index;
    renderChrome(true);
    stage.show(items[current], items[current + 1]);
    revealCurrent();
    if (shownAbove() < PREFETCH_ITEMS) void loadOlder();
  }

  function shownAbove(): number {
    let count = 0;
    for (let i = current - 1; i >= 0 && count < PREFETCH_ITEMS; i--) if (shown(i)) count++;
    return count;
  }

  /** Puts the items older than the first one in front, and counts those shown; newer arrivals wait for the next open. */
  function mergeOlder(found: Item[]): number {
    const known = new Set(items.map((r) => r.id));
    const older = found.filter((r) => !known.has(r.id) && r.timestampMs <= items[0].timestampMs);
    items = [...older, ...items];
    current += older.length;
    return older.filter((r) => !onlyNotReacted || r.myReaction === null).length;
  }

  const wakeWaiters = () => pageWaiters.splice(0).forEach((wake) => wake());

  /** Page after page with a pause between: back to the horizon, then until one brings an item to show. */
  async function fetchOlder(): Promise<void> {
    edge = 'loading';
    renderChrome(false);
    const horizon = Date.now() - LOAD_HORIZON_MS;
    let found = false;
    try {
      for (let page = 0, beyond = 0; ; page++) {
        if (page > 0) await sleep(PAGE_PAUSE_MS.min + Math.random() * (PAGE_PAUSE_MS.max - PAGE_PAUSE_MS.min));
        if (closed) break;
        if (!(await adapter.loadOlder())) {
          edge = 'start';
          break;
        }
        if (closed) break;
        if (mergeOlder(adapter.listItems()) > 0) {
          found = true;
          wakeWaiters();
        }
        renderChrome(false);
        const oldest = adapter.oldestLoadedMs();
        if (oldest !== null && oldest > horizon) continue;
        if (found || ++beyond >= MAX_PAGES_PER_LOAD) break;
      }
    } catch (e) {
      if (!closed) showFailure('load older messages', e);
    }
    if (edge === 'loading') edge = null;
    wakeWaiters();
    // Loading scrolled the thread to its top: bring it back to the item on screen, open or closed.
    revealCurrent();
    if (!closed) renderChrome(false);
  }

  /** One load at a time; asking during one joins it. */
  function loadOlder(): Promise<void> {
    if (edge === 'start' || closed) return Promise.resolve();
    loading ??= fetchOlder().finally(() => (loading = null));
    return loading;
  }

  /** Resolves once a page brings an older item to show, or loading stops. */
  function olderShown(): Promise<void> {
    return new Promise((done) => {
      pageWaiters.push(done);
      void loadOlder().then(done);
    });
  }

  async function prev(): Promise<void> {
    const before = neighbour(current, -1);
    if (before >= 0) return go(before);
    const from = items[current].id;
    await olderShown();
    // Only if the player is still on the item A was pressed on.
    if (items[current].id === from) go(neighbour(current, -1));
  }

  const next = () => go(neighbour(current, 1));
  const item = (delta: -1 | 1) => (delta < 0 ? void prev() : next());
  const step = (delta: -1 | 1) => stage.slide(delta) || item(delta);

  function toggleFilter(): void {
    onlyNotReacted = !onlyNotReacted;
    saveSettings({ onlyNotReacted });
    renderChrome(true);
    player.focus();
  }

  /** Reacts with the quick reaction in `slot`, or removes it when it is already mine. One at a time. */
  async function react(slot: number): Promise<void> {
    const emoji = QUICK_REACTIONS[slot];
    if (!emoji || reacting) return;
    const item = items[current];
    const removing = item.myReaction === emoji;
    clearFailure();
    reacting = true;
    renderChrome(false);
    let done = false;
    try {
      await (removing ? adapter.unreact(item.id) : adapter.react(item.id, emoji));
      item.myReaction = removing ? null : emoji;
      done = true;
    } catch (e) {
      showFailure(removing ? 'remove the reaction' : 'react', e);
    }
    reacting = false;
    // Instagram's picker took the focus (onto its ❤️); keys never reach it, but the player wants it back.
    player.focus();
    // Only if the player is still on the item the reaction was for.
    if (done && !removing && nextAfterReact && items[current] === item && neighbour(current, 1) >= 0) next();
    else renderChrome(false);
  }

  let statusTimer = 0;
  /** Shows how the last send went; "Sent" fades, while "Sending…" and a failure stay. */
  function replyStatus(text: string, fades = true): void {
    clearTimeout(statusTimer);
    $('data-reply-status').textContent = text;
    if (text && fades) statusTimer = window.setTimeout(() => replyStatus(''), 3000);
  }

  function renderSend(): void {
    reply.disabled = sending;
    send.disabled = sending || reply.value.trim() === '';
  }

  /** Sends the box's text about the current item; the text stays in the box when it fails. */
  async function sendReply(): Promise<void> {
    const text = reply.value.trim();
    if (!text || sending) return;
    const item = items[current];
    const quoted = quote.checked;
    clearFailure();
    sending = true;
    renderSend();
    replyStatus('Sending…', false);
    try {
      await adapter.reply(item.id, text, quoted);
      if (quoted) item.myReplies.push(text);
      reply.value = '';
      replyStatus('Sent');
    } catch (e) {
      showFailure('send the reply', e);
      replyStatus('Not sent', false);
    }
    sending = false;
    renderSend();
    renderChrome(false);
    // Instagram's composer took the focus to type; the player takes it back.
    player.focus();
  }

  const unbindKeys = bindKeys((e) => e.composedPath()[0] === reply, {
    item,
    step,
    close,
    togglePause: () => stage.togglePause(),
    toggleMute: () => stage.toggleMute(),
    toggleFilter,
    react: (slot) => void react(slot),
    focusReply: () => reply.focus(),
    blurReply: () => player.focus(),
  });

  function close(): void {
    closed = true;
    unbindKeys();
    stage.destroy();
    host.remove();
    onClose();
  }

  $('data-close').addEventListener('click', close);
  $('data-prev').addEventListener('click', () => step(-1));
  $('data-next').addEventListener('click', () => step(1));
  $('data-filter').addEventListener('click', toggleFilter);
  $('data-show-all').addEventListener('click', toggleFilter);
  $('data-strip').addEventListener('click', (e) => {
    const tile = (e.target as Element).closest<HTMLElement>('li[data-i]');
    if (tile) go(Number(tile.dataset.i));
  });
  $('data-strip').addEventListener(
    'wheel',
    (e) => {
      const strip = e.currentTarget as HTMLElement;
      if (e.deltaY < 0 && strip.scrollTop < STRIP_LOAD_MARGIN_PX) void loadOlder();
    },
    { passive: true },
  );
  $('data-reel').addEventListener('click', (e) => {
    if (!(e.target as Element).closest('a')) stage.togglePause();
  });
  nextAfter.addEventListener('change', () => {
    nextAfterReact = nextAfter.checked;
    saveSettings({ nextAfterReact });
    player.focus();
  });
  $('data-reply-form').addEventListener('submit', (e) => {
    e.preventDefault();
    void sendReply();
  });
  reply.addEventListener('input', renderSend);
  quote.addEventListener('change', () => {
    saveSettings({ quoteReply: quote.checked });
    player.focus();
  });

  // Instagram's composer may hold the focus; typed keys would land in it.
  (document.activeElement as HTMLElement | null)?.blur();
  document.body.append(host);
  player.focus();
  go(start);
  return { close };
}

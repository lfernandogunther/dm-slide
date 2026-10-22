// The player: a full-window overlay in its own shadow root, with the strip on the left, the video
// alone in the middle and a panel on the right. It talks only to the ThreadAdapter.
import { CantRead, QUICK_REACTIONS, type Item, type ThreadAdapter } from '../instagram/adapter';
import { bindKeys } from './keys';
import { loadSettings, saveSettings } from './settings';
import { createStage } from './stage';
import { createStrip, type StripEdge } from './strip';
import { STYLE } from './style';

// Going back loads page after page on its own until the chat reaches this far into the past.
const LOAD_HORIZON_MS = 60 * 24 * 60 * 60 * 1000;
// Past that, one load goes on for at most this many pages while they bring no item to show.
const MAX_PAGES_PER_LOAD = 5;
// A pause between pages, drawn at random, so loading reads like a person scrolling up, not a burst.
const PAGE_PAUSE_MS = { min: 1200, max: 3000 };
// Loading starts once fewer shown items than this are left above the current one.
const PREFETCH_ITEMS = 3;
// How often a paused load checks whether the reaction or reply it waits on is done.
const BUSY_POLL_MS = 250;
const STRIP_LOAD_MARGIN_PX = 40;
// Long enough to read; the next action clears it sooner.
const ALERT_MS = 6000;

const LAYOUT = `
  <div class="player" tabindex="-1">
    <header class="p-head">
      <span class="p-title">DM Slide</span>
      <span class="p-pos" data-pos></span>
      <button class="pill" data-filter tabindex="-1" aria-pressed="false" title="Only the ones without my reaction (U)" data-kt="U" data-kt-at="br">Not reacted</button>
      <span class="sp"></span>
      <span class="p-hold" data-hold></span>
      <button class="circ" data-tips tabindex="-1" aria-pressed="false" title="Key tips (?)">?</button>
      <button class="circ" data-close tabindex="-1" title="Close (Esc)" data-kt="Esc" data-kt-at="b">✕</button>
    </header>
    <div class="p-alert" data-alert role="alert" hidden></div>
    <div class="p-body">
      <ol class="p-strip" data-strip></ol>
      <div class="p-theatre">
        <div class="p-video">
          <div class="reel" data-reel data-kt="Space"></div>
          <button class="nav prev" data-prev tabindex="-1" title="Previous (A / ←)" data-kt="A">‹</button>
          <button class="nav next" data-next tabindex="-1" title="Next (D / →)" data-kt="D">›</button>
          <div class="p-empty" data-empty hidden><span data-empty-text></span><button type="button" data-show-all tabindex="-1">Show all (U)</button></div>
        </div>
      </div>
      <aside class="p-side">
        <div class="p-panel">
          <div class="p-who"><div class="p-av" data-av></div><div><b data-sender></b><div class="p-date" data-sent></div></div></div>
          <div class="p-talk" data-talk>
            <h4 data-notes-head>Sent with it</h4>
            <ul class="p-th" data-notes></ul>
            <h4 data-replies-head>Your replies</h4>
            <ul class="p-th" data-replies></ul>
          </div>
          <div class="p-emos" data-quick></div>
          <form class="p-box" data-reply-form data-kt="R" data-kt-at="tl">
            <input type="text" data-reply autocomplete="off" placeholder="Reply…">
            <div class="p-row">
              <label class="p-quote" title="Quote the item in the reply"><input type="checkbox" data-quote tabindex="-1" checked>❝ Quote</label>
              <span data-reply-status></span>
              <button type="submit" class="send" data-send tabindex="-1" disabled title="Send (Enter)">Send</button>
            </div>
          </form>
          <label class="p-setting"><input type="checkbox" data-next-after tabindex="-1" checked>Next after reacting</label>
        </div>
      </aside>
      <span class="kt w">W ↑</span>
      <span class="kt s">S ↓</span>
    </div>
    <div class="p-dim"></div>
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
      <div class="p-title"><strong>DM Slide</strong></div>
      <span class="sp"></span>
      <button class="circ" data-close title="Close (Esc)">✕</button>
    </header>
    <div class="p-notice">
      <strong>Can't read this conversation</strong>
      <p>Instagram's page may have changed, so DM Slide does nothing here.</p>
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
  const strip = createStrip($('data-strip'));

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
  let tipsHeld = false;
  let tipsPinned = false;
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
    button.className = 'emo';
    button.tabIndex = -1;
    button.textContent = emoji;
    button.dataset.kt = i === 0 ? 'F · 1' : String(i + 1);
    button.dataset.ktAt = 't';
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
    $('data-pos').textContent = `${items.length - current} / ${items.length} loaded · ${left} to react`;
    renderNav();
    $('data-filter').setAttribute('aria-pressed', String(onlyNotReacted));
    $('data-empty').hidden = !onlyNotReacted || left > 0;
    $('data-empty-text').textContent = `Nothing left to react to${edge === 'start' ? '' : ' in what is loaded'}.`;
    quick.forEach((b) => b.classList.toggle('mine', b.textContent === item.myReaction));
    const av = $('data-av');
    av.hidden = !item.senderName;
    av.textContent = Array.from(item.senderName ?? '')[0]?.toUpperCase() ?? '';
    $('data-sender').textContent = item.senderName ?? '';
    $('data-sent').textContent = SENT_AT.format(item.timestampMs);
    reply.placeholder = item.senderName ? `Reply to ${item.senderName}…` : 'Reply…';
    player.classList.toggle('reacting', reacting);
    renderTalk(item);
    strip.render(items, current, edge, follow, shown);
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
    };
    section('data-notes', item.notes, 'theirs');
    section('data-replies', item.myReplies, 'mine');
    $('data-talk').hidden = item.notes.length === 0 && item.myReplies.length === 0;
  }

  let alertTimer = 0;
  /** Says an action did nothing: the thread can't be read at all, or that one action failed. */
  function showFailure(what: string, e: unknown): void {
    const reason = e instanceof Error ? e.message : String(e);
    console.warn('[dm-slide]', reason);
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
      console.warn('[dm-slide]', e instanceof Error ? e.message : e);
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
        // A page scrolls the thread to its top, which would pull the row away from a reaction or reply under way.
        while ((reacting || sending) && !closed) await sleep(BUSY_POLL_MS);
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
    react: (slot) => void react(slot),
    focusReply: () => reply.focus(),
    blurReply: () => player.focus(),
    holdTips: (held) => {
      tipsHeld = held;
      renderTips();
    },
    toggleTips,
  });

  function toggleTips(): void {
    tipsPinned = !tipsPinned;
    renderTips();
  }

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
  tipsButton.addEventListener('click', toggleTips);
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

import {
  requestCloseLayer,
  requestComposerEmpty,
  requestLayerOpen,
  requestLoadOlder,
  requestOpenLayer,
  requestOpenPicker,
  requestPickEmoji,
  requestRect,
  requestReveal,
  requestScan,
  requestMediaCard,
  requestSendReply,
  requestStartReply,
  requestTypeReply,
  type Box,
  type ItemKind,
  type ItemSource,
  type OpResult,
  type Slide,
  type ScanResult,
} from './bridge';
import {
  ACTION_POLL_MS,
  ACTION_TIMEOUT_MS,
  LOAD_OLDER_POLL_MS,
  LOAD_OLDER_TIMEOUT_MS,
  QUICK_REACTIONS,
  SEND_TIMEOUT_MS,
  THREAD_PATH,
} from './selectors';
import { mediaOf, onRefusal } from './media';

export interface Item {
  id: string; // the DM message id
  kind: ItemKind;
  source: ItemSource; // only the adapter reads it
  senderId: string;
  senderName: string | null; // display name, else username
  timestampMs: number;
  myReaction: string | null; // one of QUICK_REACTIONS when it is one of them
  myReplies: string[]; // my loaded replies quoting it
  notes: string[]; // the sender's texts sent right after it
  thumb: string | null; // a still for the strip; a signed URL that may expire
}

/** I reacted to it or replied quoting it; a reply that doesn't quote can't be tied to an item. */
export const engaged = (item: Item) => item.myReaction !== null || item.myReplies.length > 0;

export type Media = Slide | { type: 'slides'; slides: Slide[] };

export { QUICK_REACTIONS, type Box, type ItemKind, type Slide };

export type Health = { ok: true } | { ok: false; reason: string };

export interface ThreadAdapter {
  listItems(): Item[]; // others' items, send order, with myReaction
  react(id: string, emoji: string): Promise<void>; // replaces any reaction of mine
  unreact(id: string): Promise<void>;
  reply(id: string, text: string, quote: boolean): Promise<void>;
  loadOlder(): Promise<boolean>; // one page; false = start of chat
  oldestLoadedMs(): number | null; // when the oldest loaded message, of any kind, was sent
  reveal(id: string): void; // scrolls Instagram's thread to that message
  media(item: Item): Promise<Media | null>; // null = unavailable
  onPause(listener: (reason: string) => void): () => void; // Instagram refused a read, so media reads stopped
  link(item: Item): string; // the item on Instagram itself
  health(): Health;
  itemAt(el: Element): string | null; // the message of the chat's media card holding el
  rectOf(id: string): Box | null; // where that message's media sits on screen; null when not wholly in view
  openLayer(id: string): Promise<void>; // Instagram's own view of that message, open once this resolves
  layerOpen(): boolean; // Instagram's view of an item is up: its layer over the chat, or a page of its own
  closeLayer(): boolean; // false when that view has no close key of ours to press
}

/** The thread can't be read at all (Instagram's page changed, or this is no thread): nothing was done. */
export class CantRead extends Error {}

function scanThread(): ScanResult {
  if (!THREAD_PATH.test(location.pathname)) return { ok: false, reason: `not in a DM thread (${location.pathname})` };
  return requestScan();
}

function readThread(what: string): Extract<ScanResult, { ok: true }> {
  const scan = scanThread();
  if (!scan.ok) throw new CantRead(`${what}: ${scan.reason}`);
  return scan;
}

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

async function loadOlderPage(): Promise<boolean> {
  const before = readThread('loadOlder');
  if (!before.hasMoreAbove) return false;
  const scrolled = requestLoadOlder();
  if (!scrolled.ok) throw new Error(`loadOlder: ${scrolled.reason}`);
  for (const deadline = Date.now() + LOAD_OLDER_TIMEOUT_MS; Date.now() < deadline; ) {
    await sleep(LOAD_OLDER_POLL_MS);
    const now = scanThread();
    if (now.ok && now.messageCount > before.messageCount) return true;
  }
  throw new Error(`loadOlder: no older messages arrived within ${LOAD_OLDER_TIMEOUT_MS} ms`);
}

// Relay may store ❤️ without its variation selector.
const plain = (emoji: string) => emoji.replace(/\uFE0F/g, '').trim();
const canonical = (emoji: string) => QUICK_REACTIONS.find((q) => plain(q) === plain(emoji)) ?? emoji;

function listOthersItems(): Item[] {
  const scan = readThread('listItems');
  return scan.items
    .filter((r) => r.senderId !== scan.viewerId)
    .map((r) => {
      const mine = r.reactions.find((x) => x.senderId === scan.viewerId);
      return {
        id: r.messageId,
        kind: r.kind,
        source: r.source,
        senderId: r.senderId,
        senderName: r.senderName,
        timestampMs: r.timestampMs,
        myReaction: mine ? canonical(mine.emoji) : null,
        myReplies: r.myReplies,
        notes: r.notes,
        thumb: r.source.thumb,
      };
    });
}

/** Retries `step` until it returns true; any other value is why not yet, quoted on timeout. */
async function retry(step: () => true | string, what: string, timeoutMs = ACTION_TIMEOUT_MS): Promise<void> {
  let why = '';
  for (const deadline = Date.now() + timeoutMs; Date.now() < deadline; await sleep(ACTION_POLL_MS)) {
    const done = step();
    if (done === true) return;
    why = done;
  }
  throw new Error(`${what} within ${timeoutMs} ms (${why})`);
}

const answered = (r: OpResult) => r.ok || r.reason;

/** One reaction per person per message, so picking my own emoji again removes it. */
async function setReaction(id: string, target: string | null): Promise<void> {
  const reactionOf = () => listOthersItems().find((r) => r.id === id);
  const item = reactionOf();
  if (!item) throw new Error(`react: message ${id} is not a loaded item from someone else`);
  if (item.myReaction === target) return;
  const emoji = target ?? item.myReaction!;
  // Each step clicks at most once: a step that clicked returns true and is not called again.
  await retry(() => answered(requestOpenPicker(id)), 'react: the React button did not answer');
  await retry(() => answered(requestPickEmoji(emoji)), 'react: the picker did not open');
  await retry(() => {
    const now = reactionOf()?.myReaction ?? null;
    return now === target || `my reaction is still ${now ?? 'none'}`;
  }, `react: Instagram did not show ${target ?? 'no reaction'}`);
}

/** Sends through Instagram's composer, quoting the message via its Reply button when `quote`. */
async function sendReply(id: string, text: string, quote: boolean): Promise<void> {
  const body = text.trim();
  if (!body) throw new Error('reply: nothing to send');
  const before = readThread('reply');
  if (!before.items.some((r) => r.messageId === id && r.senderId !== before.viewerId)) {
    throw new Error(`reply: message ${id} is not a loaded item from someone else`);
  }
  // A draft of mine in Instagram's composer is never sent along or overwritten.
  const empty = requestComposerEmpty();
  if (!empty.ok) throw new Error(`reply: ${empty.reason}`);
  if (quote) await retry(() => answered(requestStartReply(id)), 'reply: the Reply button did not answer');
  // With a quote, Instagram focuses the composer itself; waiting for that is waiting for the quote.
  await retry(() => answered(requestTypeReply(body, !quote)), 'reply: the composer did not take the focus');
  await retry(() => answered(requestSendReply(body)), 'reply: the composer did not take the text');
  const previous = before.lastMine?.id;
  await retry(
    () => {
      const now = scanThread();
      const last = now.ok ? now.lastMine : null;
      if (!last || last.id === previous || last.text?.trim() !== body) return 'no new message of mine with that text';
      if (last.repliedToId !== (quote ? id : null)) throw new Error(`reply: sent, but ${quote ? 'without' : 'with'} a quote`);
      return true;
    },
    'reply: Instagram did not show the message',
    SEND_TIMEOUT_MS,
  );
}

const layerOpen = () => !THREAD_PATH.test(location.pathname) || requestLayerOpen().ok;

// The path a close already went back from, so a second press before the path changes doesn't leave the thread too.
let backedFrom: string | null = null;

async function openLayer(id: string): Promise<void> {
  if (!listOthersItems().some((r) => r.id === id)) throw new Error(`openLayer: message ${id} is not a loaded item from someone else`);
  backedFrom = null;
  // A row scrolled into view draws its media a moment later.
  await retry(() => answered(requestOpenLayer(id)), 'openLayer: no media card to click');
  await retry(() => layerOpen() || 'no view of the item yet', "openLayer: Instagram's view did not open");
}

/** Esc in Instagram's dialog; a page with no dialog (a story) is left by going back to the thread. */
function closeLayer(): boolean {
  // Going back is a last resort: Instagram may replace the thread's history entry with the post's.
  const pressed = requestCloseLayer().ok;
  if (pressed || THREAD_PATH.test(location.pathname)) return pressed;
  if (backedFrom !== location.pathname) {
    backedFrom = location.pathname;
    history.back();
  }
  return true;
}

export function createThreadAdapter(): ThreadAdapter {
  return {
    listItems: listOthersItems,
    health() {
      const scan = scanThread();
      return scan.ok ? { ok: true } : { ok: false, reason: scan.reason };
    },
    reveal(id) {
      const result = requestReveal(id);
      if (!result.ok) throw new Error(`reveal: ${result.reason}`);
    },
    media: mediaOf,
    onPause: onRefusal,
    // A gallery item has no page of its own: the thread is where Instagram shows it.
    link: (item) => (item.source.path ? `https://www.instagram.com${item.source.path}` : location.href),
    react: (id, emoji) => setReaction(id, emoji),
    unreact: (id) => setReaction(id, null),
    reply: sendReply,
    loadOlder: loadOlderPage,
    oldestLoadedMs: () => readThread('oldestLoadedMs').oldestMs,
    itemAt(el) {
      const card = requestMediaCard(el);
      return card.ok ? card.messageId : null;
    },
    rectOf(id) {
      const result = requestRect(id);
      if (!result.ok) return null;
      const { x, y, width, height } = result;
      return { x, y, width, height };
    },
    openLayer,
    layerOpen,
    closeLayer,
  };
}

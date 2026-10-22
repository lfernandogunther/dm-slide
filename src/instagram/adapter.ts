import {
  requestComposerEmpty,
  requestLoadOlder,
  requestOpenPicker,
  requestPickEmoji,
  requestReveal,
  requestScan,
  requestReelCard,
  requestSendReply,
  requestStartReply,
  requestTypeReply,
  type OpResult,
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
import { videoUrl } from './video';

export interface Reel {
  id: string; // the DM message id
  shortcode: string;
  senderId: string;
  senderName: string | null; // display name, else username
  timestampMs: number;
  myReaction: string | null; // one of QUICK_REACTIONS when it is one of them
  myReplies: string[]; // my loaded replies quoting it
}

export { QUICK_REACTIONS };

export type Health = { ok: true } | { ok: false; reason: string };

export interface ThreadAdapter {
  listReels(): Reel[]; // others' reels, send order, with myReaction
  react(id: string, emoji: string): Promise<void>; // replaces any reaction of mine
  unreact(id: string): Promise<void>;
  reply(id: string, text: string, quote: boolean): Promise<void>;
  loadOlder(): Promise<boolean>; // one page; false = start of chat
  reveal(id: string): void; // scrolls Instagram's thread to that message
  videoUrl(shortcode: string): Promise<string | null>; // null = unavailable
  health(): Health;
  reelAt(el: Element): string | null; // the message of the chat's reel card holding el
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

function listOthersReels(): Reel[] {
  const scan = readThread('listReels');
  return scan.reels
    .filter((r) => r.senderId !== scan.viewerId)
    .map((r) => {
      const mine = r.reactions.find((x) => x.senderId === scan.viewerId);
      return {
        id: r.messageId,
        shortcode: r.shortcode,
        senderId: r.senderId,
        senderName: r.senderName,
        timestampMs: r.timestampMs,
        myReaction: mine ? canonical(mine.emoji) : null,
        myReplies: r.myReplies,
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
  const reactionOf = () => listOthersReels().find((r) => r.id === id);
  const reel = reactionOf();
  if (!reel) throw new Error(`react: message ${id} is not a loaded reel from someone else`);
  if (reel.myReaction === target) return;
  const emoji = target ?? reel.myReaction!;
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
  if (!before.reels.some((r) => r.messageId === id && r.senderId !== before.viewerId)) {
    throw new Error(`reply: message ${id} is not a loaded reel from someone else`);
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

export function createThreadAdapter(): ThreadAdapter {
  return {
    listReels: listOthersReels,
    health() {
      const scan = scanThread();
      return scan.ok ? { ok: true } : { ok: false, reason: scan.reason };
    },
    reveal(id) {
      const result = requestReveal(id);
      if (!result.ok) throw new Error(`reveal: ${result.reason}`);
    },
    videoUrl,
    react: (id, emoji) => setReaction(id, emoji),
    unreact: (id) => setReaction(id, null),
    reply: sendReply,
    loadOlder: loadOlderPage,
    reelAt(el) {
      const card = requestReelCard(el);
      return card.ok ? card.messageId : null;
    },
  };
}

import { requestLoadOlder, requestOpenPicker, requestPickEmoji, requestReveal, requestScan, type ScanResult } from './bridge';
import {
  LOAD_OLDER_POLL_MS,
  LOAD_OLDER_TIMEOUT_MS,
  QUICK_REACTIONS,
  REACT_POLL_MS,
  REACT_TIMEOUT_MS,
  THREAD_PATH,
} from './selectors';
import { videoUrl } from './video';

export interface Reel {
  id: string; // the DM message id
  shortcode: string;
  senderId: string;
  timestampMs: number;
  myReaction: string | null; // one of QUICK_REACTIONS when it is one of them
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
}

function scanThread(): ScanResult {
  if (!THREAD_PATH.test(location.pathname)) return { ok: false, reason: `not in a DM thread (${location.pathname})` };
  return requestScan();
}

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

async function loadOlderPage(): Promise<boolean> {
  const before = scanThread();
  if (!before.ok) throw new Error(`loadOlder: ${before.reason}`);
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
  const scan = scanThread();
  if (!scan.ok) throw new Error(`listReels: ${scan.reason}`);
  return scan.reels
    .filter((r) => r.senderId !== scan.viewerId)
    .map((r) => {
      const mine = r.reactions.find((x) => x.senderId === scan.viewerId);
      return {
        id: r.messageId,
        shortcode: r.shortcode,
        senderId: r.senderId,
        timestampMs: r.timestampMs,
        myReaction: mine ? canonical(mine.emoji) : null,
      };
    });
}

/** Retries `step` until it returns true; any other value is why not yet, quoted on timeout. */
async function retry(step: () => true | string, what: string): Promise<void> {
  let why = '';
  for (const deadline = Date.now() + REACT_TIMEOUT_MS; Date.now() < deadline; await sleep(REACT_POLL_MS)) {
    const done = step();
    if (done === true) return;
    why = done;
  }
  throw new Error(`${what} within ${REACT_TIMEOUT_MS} ms (${why})`);
}

/** One reaction per person per message, so picking my own emoji again removes it. */
async function setReaction(id: string, target: string | null): Promise<void> {
  const reactionOf = () => listOthersReels().find((r) => r.id === id);
  const reel = reactionOf();
  if (!reel) throw new Error(`react: message ${id} is not a loaded reel from someone else`);
  if (reel.myReaction === target) return;
  const emoji = target ?? reel.myReaction!;
  // Each step clicks at most once: a step that clicked returns true and is not called again.
  await retry(() => {
    const r = requestOpenPicker(id);
    return r.ok || r.reason;
  }, 'react: the React button did not answer');
  await retry(() => {
    const r = requestPickEmoji(emoji);
    return r.ok || r.reason;
  }, 'react: the picker did not open');
  await retry(() => {
    const now = reactionOf()?.myReaction ?? null;
    return now === target || `my reaction is still ${now ?? 'none'}`;
  }, `react: Instagram did not show ${target ?? 'no reaction'}`);
}

function notYet(task: string): Promise<never> {
  return Promise.reject(new Error(`not implemented yet (S01 ${task})`));
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
    reply: () => notYet('#08'),
    loadOlder: loadOlderPage,
  };
}

import { requestReveal, requestScan, type ScanResult } from './bridge';
import { THREAD_PATH } from './selectors';
import { videoUrl } from './video';

export interface Reel {
  id: string; // the DM message id
  shortcode: string;
  senderId: string;
  timestampMs: number;
  myReaction: string | null;
}

export type Health = { ok: true } | { ok: false; reason: string };

export interface ThreadAdapter {
  listReels(): Reel[]; // others' reels, send order, with myReaction
  react(id: string): Promise<void>;
  unreact(id: string): Promise<void>;
  reply(id: string, text: string, quote: boolean): Promise<void>;
  loadOlder(): Promise<boolean>; // false = start of chat
  reveal(id: string): void; // scrolls Instagram's thread to that message
  videoUrl(shortcode: string): Promise<string | null>; // null = unavailable
  health(): Health;
}

function scanThread(): ScanResult {
  if (!THREAD_PATH.test(location.pathname)) return { ok: false, reason: `not in a DM thread (${location.pathname})` };
  return requestScan();
}

function notYet(task: string): Promise<never> {
  return Promise.reject(new Error(`not implemented yet (S01 ${task})`));
}

export function createThreadAdapter(): ThreadAdapter {
  return {
    listReels() {
      const scan = scanThread();
      if (!scan.ok) throw new Error(`listReels: ${scan.reason}`);
      return scan.reels
        .filter((r) => r.senderId !== scan.viewerId)
        .map((r) => ({
          id: r.messageId,
          shortcode: r.shortcode,
          senderId: r.senderId,
          timestampMs: r.timestampMs,
          myReaction: r.reactions.find((x) => x.senderId === scan.viewerId)?.emoji ?? null,
        }));
    },
    health() {
      const scan = scanThread();
      return scan.ok ? { ok: true } : { ok: false, reason: scan.reason };
    },
    reveal(id) {
      const result = requestReveal(id);
      if (!result.ok) throw new Error(`reveal: ${result.reason}`);
    },
    videoUrl,
    react: () => notYet('#07'),
    unreact: () => notYet('#07'),
    reply: () => notYet('#08'),
    loadOlder: () => notYet('#09'),
  };
}

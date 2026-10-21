// The page's React and Relay data are only visible from the page's own (MAIN) world, while the
// extension runs isolated. The two talk through synchronous DOM events carrying JSON strings.

export const REQUEST_EVENT = 'reel-queue:request';
export const RESPONSE_EVENT = 'reel-queue:response';

export interface RawReaction {
  emoji: string;
  senderId: string;
}

export interface RawReel {
  messageId: string;
  shortcode: string;
  senderId: string;
  timestampMs: number;
  reactions: RawReaction[];
}

export type ScanResult =
  | { ok: true; viewerId: string; hasMoreAbove: boolean; reels: RawReel[] }
  | { ok: false; reason: string };

/** Isolated side: ask the page script for a scan. dispatchEvent runs its listener synchronously. */
export function requestScan(): ScanResult {
  let response: string | null = null;
  const onResponse = (e: Event) => {
    response = String((e as CustomEvent).detail);
  };
  document.addEventListener(RESPONSE_EVENT, onResponse, { once: true });
  document.dispatchEvent(new CustomEvent(REQUEST_EVENT, { detail: JSON.stringify({ op: 'scan' }) }));
  document.removeEventListener(RESPONSE_EVENT, onResponse);
  if (response === null) return { ok: false, reason: 'the page script did not answer (page.js not injected?)' };
  return JSON.parse(response) as ScanResult;
}

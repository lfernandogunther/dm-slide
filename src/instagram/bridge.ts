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
  | { ok: true; viewerId: string; hasMoreAbove: boolean; messageCount: number; reels: RawReel[] }
  | { ok: false; reason: string };

export type OpResult = { ok: true } | { ok: false; reason: string };

export type Request =
  | { op: 'scan' }
  | { op: 'reveal'; messageId: string }
  | { op: 'loadOlder' }
  | { op: 'openPicker'; messageId: string }
  | { op: 'pickEmoji'; emoji: string };

/** Isolated side: ask the page script. dispatchEvent runs its listener synchronously. */
function call<T extends { ok: boolean }>(request: Request): T | { ok: false; reason: string } {
  let response: string | null = null;
  const onResponse = (e: Event) => {
    response = String((e as CustomEvent).detail);
  };
  document.addEventListener(RESPONSE_EVENT, onResponse, { once: true });
  document.dispatchEvent(new CustomEvent(REQUEST_EVENT, { detail: JSON.stringify(request) }));
  document.removeEventListener(RESPONSE_EVENT, onResponse);
  if (response === null) return { ok: false, reason: 'the page script did not answer (page.js not injected?)' };
  return JSON.parse(response) as T;
}

export const requestScan = (): ScanResult => call<ScanResult>({ op: 'scan' });

export const requestReveal = (messageId: string): OpResult => call<OpResult>({ op: 'reveal', messageId });

export const requestLoadOlder = (): OpResult => call<OpResult>({ op: 'loadOlder' });

export const requestOpenPicker = (messageId: string): OpResult => call<OpResult>({ op: 'openPicker', messageId });

export const requestPickEmoji = (emoji: string): OpResult => call<OpResult>({ op: 'pickEmoji', emoji });

// The page's React and Relay data are only visible from the page's own (MAIN) world, while the
// extension runs isolated. The two talk through synchronous DOM events carrying JSON strings.

export const REQUEST_EVENT = 'dm-slide:request';
export const RESPONSE_EVENT = 'dm-slide:response';

export interface RawReaction {
  emoji: string;
  senderId: string;
}

// Each kind of item someone can send to watch.
export type ItemKind = 'reel' | 'post' | 'carousel' | 'story' | 'gallery';

export type Slide = { type: 'video' | 'photo'; url: string; fallbackUrl?: string };

/** Where an item's media comes from: its share's shortcode, or what the record itself carries. */
export interface ItemSource {
  shortcode: string | null;
  path: string | null; // the item's own page on instagram.com
  isVideo: boolean; // a shared video post, whose record holds only a poster
  stored: Slide[]; // in send order; a carousel's holds its first slide only
  thumb: string | null; // a still the record carries, for the strip; not the media itself
}

export interface RawItem {
  messageId: string;
  kind: ItemKind;
  source: ItemSource;
  senderId: string;
  senderName: string | null; // display name, else username
  timestampMs: number;
  reactions: RawReaction[];
  myReplies: string[]; // the texts of my loaded messages quoting this one, oldest first
  notes: string[]; // the sender's own texts right after it, oldest first
}

export interface SentMessage {
  id: string;
  text: string | null;
  repliedToId: string | null;
}

export type ScanResult =
  | {
      ok: true;
      viewerId: string;
      hasMoreAbove: boolean;
      messageCount: number;
      items: RawItem[];
      lastMine: SentMessage | null; // my newest loaded message
    }
  | { ok: false; reason: string };

export type OpResult = { ok: true } | { ok: false; reason: string };

export type CardResult = { ok: true; messageId: string } | { ok: false; reason: string };

/** A box on screen, in viewport pixels. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type RectResult = ({ ok: true } & Box) | { ok: false; reason: string };

export type Request =
  | { op: 'scan' }
  | { op: 'reveal'; messageId: string }
  | { op: 'loadOlder' }
  | { op: 'openPicker'; messageId: string }
  | { op: 'pickEmoji'; emoji: string }
  | { op: 'composerEmpty' }
  | { op: 'startReply'; messageId: string }
  | { op: 'typeReply'; text: string; focus: boolean }
  | { op: 'sendReply'; text: string }
  | { op: 'mediaCard' }
  | { op: 'rect'; messageId: string }
  | { op: 'openLayer'; messageId: string }
  | { op: 'layerOpen' }
  | { op: 'closeLayer' };

/** Isolated side: ask the page script. dispatchEvent runs its listener synchronously. */
function call<T extends { ok: boolean }>(request: Request, on: EventTarget = document): T | { ok: false; reason: string } {
  let response: string | null = null;
  const onResponse = (e: Event) => {
    response = String((e as CustomEvent).detail);
  };
  document.addEventListener(RESPONSE_EVENT, onResponse, { once: true });
  // Dispatched on an element, the request bubbles up and the page script sees that element as its target.
  on.dispatchEvent(new CustomEvent(REQUEST_EVENT, { detail: JSON.stringify(request), bubbles: true }));
  document.removeEventListener(RESPONSE_EVENT, onResponse);
  if (response === null) return { ok: false, reason: 'the page script did not answer (page.js not injected?)' };
  return JSON.parse(response) as T;
}

export const requestScan = (): ScanResult => call<ScanResult>({ op: 'scan' });

export const requestReveal = (messageId: string): OpResult => call<OpResult>({ op: 'reveal', messageId });

export const requestLoadOlder = (): OpResult => call<OpResult>({ op: 'loadOlder' });

export const requestOpenPicker = (messageId: string): OpResult => call<OpResult>({ op: 'openPicker', messageId });

export const requestPickEmoji = (emoji: string): OpResult => call<OpResult>({ op: 'pickEmoji', emoji });

export const requestComposerEmpty = (): OpResult => call<OpResult>({ op: 'composerEmpty' });

export const requestStartReply = (messageId: string): OpResult => call<OpResult>({ op: 'startReply', messageId });

export const requestTypeReply = (text: string, focus: boolean): OpResult =>
  call<OpResult>({ op: 'typeReply', text, focus });

export const requestSendReply = (text: string): OpResult => call<OpResult>({ op: 'sendReply', text });

/** The message whose media card holds `el`, asked of the page script about that very element. */
export const requestMediaCard = (el: Element): CardResult => call<CardResult>({ op: 'mediaCard' }, el);

export const requestRect = (messageId: string): RectResult => call<RectResult>({ op: 'rect', messageId });

export const requestOpenLayer = (messageId: string): OpResult => call<OpResult>({ op: 'openLayer', messageId });

export const requestLayerOpen = (): OpResult => call<OpResult>({ op: 'layerOpen' });

export const requestCloseLayer = (): OpResult => call<OpResult>({ op: 'closeLayer' });

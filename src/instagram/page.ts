// Runs in the page's MAIN world: reads the loaded messages from React and the Relay store, and
// answers the isolated content script over the bridge. Besides the thread's scroll position (to
// follow the player and load older messages), it only ever drives Instagram's own React picker,
// Reply button and composer.
import {
  REQUEST_EVENT,
  RESPONSE_EVENT,
  type OpResult,
  type RawReel,
  type Request,
  type ScanResult,
  type SentMessage,
} from './bridge';
import * as S from './selectors';

// React and Relay internals are untyped, hence the `any`s.
type Fiber = { return: Fiber | null; key?: string | null; memoizedProps?: any; memoizedState?: any };
type RecordSource = { get(id: string): any };

function fiberOf(el: Element): Fiber | null {
  const key = Object.keys(el).find((k) => k.startsWith(S.FIBER_KEY_PREFIX));
  return key ? (el as any)[key] : null;
}

function findUp(from: Fiber | null, test: (f: Fiber) => boolean, maxDepth = S.MAX_FIBER_DEPTH): Fiber | null {
  for (let f = from, depth = 0; f && depth < maxDepth; f = f.return, depth++) {
    if (test(f)) return f;
  }
  return null;
}

type MessageList = { scroller: Element; el: Element; fiber: Fiber };

/** The thread's loaded messages and the DOM list of their rows, found from its scroll container. */
function findMessageList(): MessageList | null {
  for (const scroller of document.querySelectorAll('main div')) {
    if (scroller.scrollHeight <= scroller.clientHeight) continue;
    if (!S.SCROLLABLE_OVERFLOW.includes(getComputedStyle(scroller).overflowY)) continue;
    const el = scroller.firstElementChild?.firstElementChild;
    const fiber = el && findUp(fiberOf(el), (f) => Array.isArray(f.memoizedProps?.[S.LOADED_MESSAGES_PROP]));
    if (el && fiber) return { scroller, el, fiber };
  }
  return null;
}

/** The Relay environment sits in a hook (or prop) of an ancestor of the message list. */
function findRecordSource(from: Fiber): RecordSource | null {
  const sourceOf = (env: any): RecordSource | null =>
    typeof env?.getStore === 'function' ? env.getStore().getSource() : null;
  let found: RecordSource | null = null;
  findUp(from, (f) => {
    found = sourceOf(f.memoizedProps?.environment);
    for (let hook = f.memoizedState; !found && hook && typeof hook === 'object'; hook = hook.next) {
      found = sourceOf(hook.memoizedState?.environment) ?? sourceOf(hook.memoizedState);
    }
    return found !== null;
  });
  return found;
}

function deref(src: RecordSource, link: any): any {
  const id = link?.__ref ?? link?.__refs?.[0];
  return typeof id === 'string' ? src.get(id) : undefined;
}

function viewerIdOf(src: RecordSource): string | null {
  const viewer = deref(src, src.get(S.STORE_ROOT_ID)?.[S.VIEWER_ROOT_FIELD]);
  const id = deref(src, viewer?.user)?.[S.VIEWER_ID_FIELD];
  return id ? String(id) : null;
}

function reelOf(src: RecordSource, item: any, myReplies: Map<string, string[]>): RawReel | null {
  const message = item?.currentMessage;
  const record = message?.__id && src.get(message.__id);
  if (!record) return null;
  const xma = deref(src, deref(src, record.content)?.xma);
  const shortcode = typeof xma?.target_url === 'string' ? xma.target_url.match(S.REEL_URL)?.[1] : undefined;
  if (!shortcode) return null;
  const reactions = ((record.reactions?.__refs ?? []) as string[])
    .map((id) => src.get(id))
    .filter((r) => r?.reaction && r?.sender_fbid)
    .map((r) => ({ emoji: String(r.reaction), senderId: String(r.sender_fbid) }));
  return {
    messageId: String(message.id),
    shortcode,
    senderId: String(message.sender_fbid),
    timestampMs: Number(message.timestamp_ms),
    reactions,
    myReplies: myReplies.get(String(message.id)) ?? [],
  };
}

/** My loaded messages: the texts of those quoting another message, by quoted id, and the newest one. */
function readMine(src: RecordSource, items: any[], viewerId: string) {
  const replies = new Map<string, string[]>();
  let last: SentMessage | null = null;
  for (const item of items) {
    const record = item?.currentMessage?.__id && src.get(item.currentMessage.__id);
    if (!record || String(record.sender_fbid) !== viewerId) continue;
    const text = typeof record[S.TEXT_FIELD] === 'string' ? record[S.TEXT_FIELD] : null;
    const repliedToId = record[S.REPLIED_TO_FIELD] ? String(record[S.REPLIED_TO_FIELD]) : null;
    last = { id: String(record.id), text, repliedToId };
    if (repliedToId && text) replies.set(repliedToId, [...(replies.get(repliedToId) ?? []), text]);
  }
  return { replies, last };
}

function scan(): ScanResult {
  const list = findMessageList();
  if (!list) return { ok: false, reason: 'no scroll container whose fiber holds the loaded messages' };
  const src = findRecordSource(list.fiber);
  if (!src) return { ok: false, reason: 'no Relay store above the message list' };
  const viewerId = viewerIdOf(src);
  if (!viewerId) return { ok: false, reason: 'no viewer id in the Relay store' };
  const items: unknown[] = list.fiber.memoizedProps[S.LOADED_MESSAGES_PROP];
  const mine = readMine(src, items, viewerId);
  const reels = items.map((item) => reelOf(src, item, mine.replies)).filter((r): r is RawReel => r !== null);
  const hasMoreAbove = Boolean(list.fiber.memoizedProps[S.HAS_MORE_ABOVE_PROP]);
  return { ok: true, viewerId, hasMoreAbove, messageCount: items.length, reels, lastMine: mine.last };
}

/** The row of a message: by the row's own fiber key or, unless `exact`, by position when the counts line up. */
function findRow(list: MessageList, messageId: string, exact = false): Element | null {
  const rows = [...list.el.children];
  const byKey = rows.find((row) =>
    findUp(fiberOf(row), (f) => f.key === messageId || f.memoizedProps?.messageId === messageId, S.MAX_ROW_FIBER_DEPTH),
  );
  if (byKey || exact) return byKey ?? null;
  const items: any[] = list.fiber.memoizedProps[S.LOADED_MESSAGES_PROP];
  const index = items.findIndex((item) => String(item?.currentMessage?.id) === messageId);
  // Rows above the messages (a progressbar while older pages exist) shift the DOM index.
  const offset = rows.length - items.length;
  if (index < 0 || offset < 0 || offset > S.MAX_LEADING_ROWS) return null;
  return rows[index + offset] ?? null;
}

/** Scrolls the thread so the message's row sits in the middle, so closing the player lands there. */
function reveal(messageId: string): OpResult {
  const list = findMessageList();
  if (!list) return { ok: false, reason: 'no scroll container whose fiber holds the loaded messages' };
  const row = findRow(list, messageId);
  if (!row) return { ok: false, reason: `no row for message ${messageId} among the loaded ones` };
  row.scrollIntoView({ block: 'center' });
  return { ok: true };
}

/** Scrolls the thread to its oldest loaded message, which is what makes Instagram fetch the page before. */
function loadOlder(): OpResult {
  const list = findMessageList();
  if (!list) return { ok: false, reason: 'no scroll container whose fiber holds the loaded messages' };
  // The list is column-reverse (its top is a negative scrollTop); the browser clamps to the top either way.
  list.scroller.scrollTop = -list.scroller.scrollHeight;
  return { ok: true };
}

const plain = (emoji: string) => emoji.replace(/\uFE0F/g, '').trim();

/** A button of the row's own toolbar: the group of exactly React, Reply and More, not an outer group around it. */
function findToolbarButton(row: Element, selector: string): HTMLElement | null {
  for (const group of row.querySelectorAll('[role=group]')) {
    if (group.querySelectorAll('[role=button]').length !== S.ROW_ACTION_COUNT) continue;
    const button = group.querySelector<HTMLElement>(selector);
    if (button) return button;
  }
  return null;
}

/** A pointer arriving on the row's reel card from outside the window: React fires enter on all its ancestors. */
function hover(row: Element): void {
  const area = (el: Element) => el.getBoundingClientRect().width * el.getBoundingClientRect().height;
  let target: Element | undefined = [...row.querySelectorAll('img')].sort((a, b) => area(b) - area(a))[0];
  if (!target) for (target = row; target.firstElementChild; ) target = target.firstElementChild;
  const box = target.getBoundingClientRect();
  const init = { bubbles: true, composed: true, clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 };
  target.dispatchEvent(new PointerEvent('pointerover', init));
  target.dispatchEvent(new MouseEvent('mouseover', init));
  target.dispatchEvent(new PointerEvent('pointermove', init));
  target.dispatchEvent(new MouseEvent('mousemove', init));
}

/** Clicks a toolbar button of the message's row once; the toolbar renders a moment after the hover, so the caller retries. */
function clickToolbar(messageId: string, selector: string, name: string): OpResult {
  const list = findMessageList();
  if (!list) return { ok: false, reason: 'no scroll container whose fiber holds the loaded messages' };
  // A row matched by position is a guess, and a guess would act on the wrong message.
  const row = findRow(list, messageId, true);
  if (!row) return { ok: false, reason: `no row whose fiber carries message ${messageId}` };
  row.scrollIntoView({ block: 'center' });
  const button = findToolbarButton(row, selector);
  if (!button) {
    hover(row);
    return { ok: false, reason: `no ${name} button in the row's toolbar after hovering it` };
  }
  button.click();
  return { ok: true };
}

const composer = () => document.querySelector<HTMLElement>(S.COMPOSER);
const composerText = (el: HTMLElement) => (el.textContent ?? '').trim();

function composerEmpty(): OpResult {
  const el = composer();
  if (!el) return { ok: false, reason: 'no composer in the thread' };
  return composerText(el) === '' ? { ok: true } : { ok: false, reason: 'the composer already holds a draft' };
}

/** Types once into the empty composer once it has the focus: Reply gives it the focus, or `focus` does. */
function typeReply(text: string, focus: boolean): OpResult {
  const el = composer();
  if (!el) return { ok: false, reason: 'no composer in the thread' };
  if (composerText(el) !== '') return { ok: false, reason: 'the composer already holds a draft' };
  if (focus) el.focus();
  if (document.activeElement !== el) return { ok: false, reason: 'the composer has no focus yet' };
  // Lexical renders the text a moment later, so the send step waits for it instead of checking here.
  return document.execCommand('insertText', false, text) ? { ok: true } : { ok: false, reason: 'insertText was refused' };
}

/** Presses Enter in the composer, only if it holds exactly this text. */
function sendReply(text: string): OpResult {
  const el = composer();
  if (!el) return { ok: false, reason: 'no composer in the thread' };
  if (composerText(el) !== text.trim()) return { ok: false, reason: 'the composer does not hold the reply' };
  const init = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
  el.dispatchEvent(new KeyboardEvent('keydown', init));
  el.dispatchEvent(new KeyboardEvent('keyup', init));
  return { ok: true };
}

/** Clicks the emoji in the open picker, by its text. */
function pickEmoji(emoji: string): OpResult {
  for (const dialog of document.querySelectorAll(S.PICKER)) {
    const button = [...dialog.querySelectorAll<HTMLElement>(S.PICKER_BUTTON)].find(
      (b) => plain(b.textContent ?? '') === plain(emoji),
    );
    if (button) {
      button.click();
      return { ok: true };
    }
  }
  return { ok: false, reason: `no open picker offering ${emoji}` };
}

function handle(request: Request): ScanResult | OpResult {
  if (request.op === 'scan') return scan();
  if (request.op === 'reveal') return reveal(request.messageId);
  if (request.op === 'loadOlder') return loadOlder();
  if (request.op === 'openPicker') return clickToolbar(request.messageId, S.REACT_BUTTON, 'React');
  if (request.op === 'pickEmoji') return pickEmoji(request.emoji);
  if (request.op === 'composerEmpty') return composerEmpty();
  if (request.op === 'startReply') return clickToolbar(request.messageId, S.REPLY_BUTTON, 'Reply');
  if (request.op === 'typeReply') return typeReply(request.text, request.focus);
  if (request.op === 'sendReply') return sendReply(request.text);
  return { ok: false, reason: `unknown op ${(request as { op: string }).op}` };
}

document.addEventListener(REQUEST_EVENT, (e) => {
  let result: ScanResult | OpResult;
  try {
    result = handle(JSON.parse(String((e as CustomEvent).detail)) as Request);
  } catch (err) {
    result = { ok: false, reason: `page script threw: ${err instanceof Error ? err.message : String(err)}` };
  }
  document.dispatchEvent(new CustomEvent(RESPONSE_EVENT, { detail: JSON.stringify(result) }));
});

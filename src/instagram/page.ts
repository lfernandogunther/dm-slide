// Runs in the page's MAIN world: reads the loaded messages from React and the Relay store, and
// answers the isolated content script over the bridge. It never clicks; the one thing it changes
// is the thread's scroll position, to follow the player and to load older messages.
import { REQUEST_EVENT, RESPONSE_EVENT, type RawReel, type Request, type ScanResult, type ScrollResult } from './bridge';
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

function reelOf(src: RecordSource, item: any): RawReel | null {
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
  };
}

function scan(): ScanResult {
  const list = findMessageList();
  if (!list) return { ok: false, reason: 'no scroll container whose fiber holds the loaded messages' };
  const src = findRecordSource(list.fiber);
  if (!src) return { ok: false, reason: 'no Relay store above the message list' };
  const viewerId = viewerIdOf(src);
  if (!viewerId) return { ok: false, reason: 'no viewer id in the Relay store' };
  const items: unknown[] = list.fiber.memoizedProps[S.LOADED_MESSAGES_PROP];
  const reels = items.map((item) => reelOf(src, item)).filter((r): r is RawReel => r !== null);
  const hasMoreAbove = Boolean(list.fiber.memoizedProps[S.HAS_MORE_ABOVE_PROP]);
  return { ok: true, viewerId, hasMoreAbove, messageCount: items.length, reels };
}

/** The row of a message: by the row's own fiber key, or by position when the counts line up. */
function findRow(list: MessageList, messageId: string): Element | null {
  const rows = [...list.el.children];
  const byKey = rows.find((row) =>
    findUp(fiberOf(row), (f) => f.key === messageId || f.memoizedProps?.messageId === messageId, S.MAX_ROW_FIBER_DEPTH),
  );
  if (byKey) return byKey;
  const items: any[] = list.fiber.memoizedProps[S.LOADED_MESSAGES_PROP];
  const index = items.findIndex((item) => String(item?.currentMessage?.id) === messageId);
  // Rows above the messages (a progressbar while older pages exist) shift the DOM index.
  const offset = rows.length - items.length;
  if (index < 0 || offset < 0 || offset > S.MAX_LEADING_ROWS) return null;
  return rows[index + offset] ?? null;
}

/** Scrolls the thread so the message's row sits in the middle, so closing the player lands there. */
function reveal(messageId: string): ScrollResult {
  const list = findMessageList();
  if (!list) return { ok: false, reason: 'no scroll container whose fiber holds the loaded messages' };
  const row = findRow(list, messageId);
  if (!row) return { ok: false, reason: `no row for message ${messageId} among the loaded ones` };
  row.scrollIntoView({ block: 'center' });
  return { ok: true };
}

/** Scrolls the thread to its oldest loaded message, which is what makes Instagram fetch the page before. */
function loadOlder(): ScrollResult {
  const list = findMessageList();
  if (!list) return { ok: false, reason: 'no scroll container whose fiber holds the loaded messages' };
  // The list is column-reverse (its top is a negative scrollTop); the browser clamps to the top either way.
  list.scroller.scrollTop = -list.scroller.scrollHeight;
  return { ok: true };
}

function handle(request: Request): ScanResult | ScrollResult {
  if (request.op === 'scan') return scan();
  if (request.op === 'reveal') return reveal(request.messageId);
  if (request.op === 'loadOlder') return loadOlder();
  return { ok: false, reason: `unknown op ${(request as { op: string }).op}` };
}

document.addEventListener(REQUEST_EVENT, (e) => {
  let result: ScanResult | ScrollResult;
  try {
    result = handle(JSON.parse(String((e as CustomEvent).detail)) as Request);
  } catch (err) {
    result = { ok: false, reason: `page script threw: ${err instanceof Error ? err.message : String(err)}` };
  }
  document.dispatchEvent(new CustomEvent(RESPONSE_EVENT, { detail: JSON.stringify(result) }));
});

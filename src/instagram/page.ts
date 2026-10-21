// Runs in the page's MAIN world: reads the loaded messages from React and the Relay store, and
// answers the isolated content script over the bridge. It reads only; it never clicks.
import { REQUEST_EVENT, RESPONSE_EVENT, type RawReel, type ScanResult } from './bridge';
import * as S from './selectors';

// React and Relay internals are untyped, hence the `any`s.
type Fiber = { return: Fiber | null; memoizedProps?: any; memoizedState?: any };
type RecordSource = { get(id: string): any };

function fiberOf(el: Element): Fiber | null {
  const key = Object.keys(el).find((k) => k.startsWith(S.FIBER_KEY_PREFIX));
  return key ? (el as any)[key] : null;
}

function findUp(from: Fiber | null, test: (f: Fiber) => boolean): Fiber | null {
  for (let f = from, depth = 0; f && depth < S.MAX_FIBER_DEPTH; f = f.return, depth++) {
    if (test(f)) return f;
  }
  return null;
}

/** The fiber holding the thread's loaded messages, found from its scroll container. */
function findMessageList(): Fiber | null {
  for (const el of document.querySelectorAll('main div')) {
    if (el.scrollHeight <= el.clientHeight) continue;
    if (!S.SCROLLABLE_OVERFLOW.includes(getComputedStyle(el).overflowY)) continue;
    const list = el.firstElementChild?.firstElementChild;
    const fiber = list && findUp(fiberOf(list), (f) => Array.isArray(f.memoizedProps?.[S.LOADED_MESSAGES_PROP]));
    if (fiber) return fiber;
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
  const src = findRecordSource(list);
  if (!src) return { ok: false, reason: 'no Relay store above the message list' };
  const viewerId = viewerIdOf(src);
  if (!viewerId) return { ok: false, reason: 'no viewer id in the Relay store' };
  const items: unknown[] = list.memoizedProps[S.LOADED_MESSAGES_PROP];
  const reels = items.map((item) => reelOf(src, item)).filter((r): r is RawReel => r !== null);
  return { ok: true, viewerId, hasMoreAbove: Boolean(list.memoizedProps[S.HAS_MORE_ABOVE_PROP]), reels };
}

document.addEventListener(REQUEST_EVENT, () => {
  let result: ScanResult;
  try {
    result = scan();
  } catch (err) {
    result = { ok: false, reason: `scan threw: ${err instanceof Error ? err.message : String(err)}` };
  }
  document.dispatchEvent(new CustomEvent(RESPONSE_EVENT, { detail: JSON.stringify(result) }));
});

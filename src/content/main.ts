import { createThreadAdapter } from '../instagram/adapter';
import { findHeaderIcons } from '../instagram/header';
import { THREAD_PATH } from '../instagram/selectors';
import { openNotice, openPlayer, startIndex, type Player } from '../player/overlay';
import { createButton, renderButton, type ButtonState } from './button';

// Instagram is a SPA: the script loads on any page and acts only inside a DM thread.

const adapter = createThreadAdapter();

// Debug handle, reachable from the console's "Reel Queue" context: __rq.listReels(), __rq.health().
(globalThis as unknown as { __rq: typeof adapter }).__rq = adapter;

// Instagram mutates the page constantly (typing, presence); a burst becomes one sync.
const SYNC_DEBOUNCE_MS = 400;

let player: { instance: Player; path: string } | null = null;

const onClose = () => {
  player = null;
  sync();
};

/** Opens at the reel with message id `at`, else by the start rule; false when nothing opened. */
function open(at?: string): boolean {
  if (player) return false;
  let reels;
  try {
    reels = adapter.listReels();
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    console.error('[reel-queue]', reason);
    // From a reel card the click goes on to Instagram; from the button, say why nothing opens.
    if (at === undefined) player = { instance: openNotice(reason, onClose), path: location.pathname };
    return false;
  }
  const start = at === undefined ? startIndex(reels) : reels.findIndex((r) => r.id === at);
  if (start < 0) return false;
  player = { instance: openPlayer(adapter, reels, start, onClose), path: location.pathname };
  return true;
}

const button = createButton(() => void open());

// A plain click on someone else's reel card opens the player there instead of Instagram's viewer.
// Anything else, including a ⌘-click or my own reels, stays Instagram's.
window.addEventListener(
  'click',
  (e) => {
    if (player || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!THREAD_PATH.test(location.pathname) || !(e.target instanceof Element)) return;
    const id = adapter.reelAt(e.target);
    if (id === null || !open(id)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  },
  true,
);

function readState(): ButtonState {
  try {
    return { reels: adapter.listReels() };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

/** Keeps the button in the current thread's header with a fresh count, or out of the page. */
function sync(): void {
  // Switching conversation closes the player.
  if (player && location.pathname !== player.path) player.instance.close();
  const icons = THREAD_PATH.test(location.pathname) ? findHeaderIcons() : null;
  if (!icons) {
    button.remove();
    return;
  }
  // React re-renders the header on a thread switch, dropping the button; put it back.
  if (button.nextElementSibling !== icons) icons.before(button);
  renderButton(button, readState());
}

let pending: number | undefined;
new MutationObserver(() => {
  clearTimeout(pending);
  pending = setTimeout(sync, SYNC_DEBOUNCE_MS);
}).observe(document.body, { childList: true, subtree: true });
sync();

console.log('[reel-queue] content script loaded', {
  path: location.pathname,
  inThread: THREAD_PATH.test(location.pathname),
});

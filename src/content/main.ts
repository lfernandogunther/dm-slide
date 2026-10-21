import { createThreadAdapter } from '../instagram/adapter';
import { findHeaderIcons } from '../instagram/header';
import { THREAD_PATH } from '../instagram/selectors';
import { openPlayer, startIndex, type Player } from '../player/overlay';
import { createButton, renderButton, type ButtonState } from './button';

// Instagram is a SPA: the script loads on any page and acts only inside a DM thread.

const adapter = createThreadAdapter();

// Debug handle, reachable from the console's "Reel Queue" context: __rq.listReels(), __rq.health().
(globalThis as unknown as { __rq: typeof adapter }).__rq = adapter;

// Instagram mutates the page constantly (typing, presence); a burst becomes one sync.
const SYNC_DEBOUNCE_MS = 400;

let player: { instance: Player; path: string } | null = null;

function open(): void {
  if (player) return;
  let reels;
  try {
    reels = adapter.listReels();
  } catch (e) {
    // S01 #11 turns this into a visible message.
    console.error('[reel-queue]', e instanceof Error ? e.message : e);
    return;
  }
  if (reels.length === 0) return;
  const instance = openPlayer(adapter, reels, startIndex(reels), () => {
    player = null;
    sync();
  });
  player = { instance, path: location.pathname };
}

const button = createButton(open);

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

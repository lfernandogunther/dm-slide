import { createThreadAdapter } from '../instagram/adapter';
import { findHeaderIcons } from '../instagram/header';
import { THREAD_PATH } from '../instagram/selectors';
import { openNotice, openPlayer, startIndex, type Player } from '../player/overlay';
import { loadSettings, type Settings } from '../player/settings';
import { createButton, renderButton, type ButtonState } from './button';

// Instagram is a SPA: the script loads on any page and acts only inside a DM thread.

const adapter = createThreadAdapter();

// Debug handle, reachable from the console's "DM Slide" context: __dms.listItems(), __dms.health().
(globalThis as unknown as { __dms: typeof adapter }).__dms = adapter;

// Instagram mutates the page constantly (typing, presence); a burst becomes one sync.
const SYNC_DEBOUNCE_MS = 400;

let player: { instance: Player; path: string } | null = null;

// Read ahead, since open() must answer a click at once; the player may change it, so it is read again on close.
let afterReactDir: Settings['afterReactDir'] = 'newer';
const readAfterReactDir = () => void loadSettings().then((s) => (afterReactDir = s.afterReactDir));
readAfterReactDir();

const onClose = () => {
  player = null;
  readAfterReactDir();
  sync();
};

/** Opens at the item with message id `at`, else by the start rule; false when nothing opened. */
function open(at?: string): boolean {
  if (player) return false;
  let items;
  try {
    items = adapter.listItems();
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    console.error('[dm-slide]', reason);
    // From a card the click goes on to Instagram; from the button, say why nothing opens.
    if (at === undefined) player = { instance: openNotice(reason, onClose), path: location.pathname };
    return false;
  }
  const start = at === undefined ? startIndex(items, afterReactDir) : items.findIndex((r) => r.id === at);
  if (start < 0) return false;
  player = { instance: openPlayer(adapter, items, start, onClose), path: location.pathname };
  return true;
}

const button = createButton(() => void open());

// A plain click on a card of someone else's item opens the player there instead of Instagram's viewer.
// Anything else, including a ⌘-click or my own shares, stays Instagram's.
window.addEventListener(
  'click',
  (e) => {
    if (player || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!THREAD_PATH.test(location.pathname) || !(e.target instanceof Element)) return;
    const id = adapter.itemAt(e.target);
    if (id === null || !open(id)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  },
  true,
);

function readState(): ButtonState {
  try {
    return { items: adapter.listItems() };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

/** Keeps the button in the current thread's header with a fresh count, or out of the page. */
function sync(): void {
  // Switching conversation closes the player; Instagram's view of an item may change the path for a while.
  if (player && location.pathname !== player.path && !player.instance.away()) player.instance.close();
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

console.log('[dm-slide] content script loaded', {
  path: location.pathname,
  inThread: THREAD_PATH.test(location.pathname),
});

// The player's shortcuts. While it is open, Instagram never sees a key: every keyboard event is
// stopped at the window in the capture phase, before it reaches any of Instagram's listeners.
import { finishAll } from './motion';

export interface KeyActions {
  item(delta: -1 | 1, held?: boolean): void; // the older or newer item; held = a key's auto-repeat
  step(delta: -1 | 1): void; // the slide before or after, else the item
  close(): void;
  togglePause(): void;
  toggleMute(): void;
  toggleFilter(): void;
  react(slot: number): void; // 0 is ❤️, then the rest of the quick set
  focusReply(): void;
  blurReply(): void;
  holdTips(held: boolean): void; // Option (Alt) shows the key tips while held
  toggleTips(): void;
  dismissKeyCard(): boolean; // true when the key card was showing
  instagramView(): void; // opens Instagram's own view of the item, or closes it while away
  frame(key: FrameKey): void; // W, S, F or R pressed over Instagram's view
  away(): boolean; // the player stepped aside for Instagram's view
}

export type FrameKey = 'w' | 's' | 'f' | 'r';

const KEY_EVENTS = ['keydown', 'keyup', 'keypress'] as const;
// The only keys taken over Instagram's view: A, D, the arrows and Esc stay its own.
const FRAME_KEYS = new Set(['w', 's', 'f', 'r', 'i']);
// Pressed on the way to another key (Shift for ?), so they never count as the key that dismisses the card.
const MODIFIERS = new Set(['Shift', 'CapsLock']);

function editable(e: KeyboardEvent): boolean {
  const target = e.composedPath()[0];
  return target instanceof HTMLElement && (target.isContentEditable || target.matches('input, textarea, select'));
}

/** Binds the shortcuts; `isTyping` says whether an event comes from one of our reply boxes. Returns the unbind. */
export function bindKeys(isTyping: (e: KeyboardEvent) => boolean, actions: KeyActions): () => void {
  const onKey = (e: KeyboardEvent) => {
    // Keys the extension itself dispatches (Enter in Instagram's composer, to send) go through.
    if (!e.isTrusted) return;
    // Over Instagram's view every other key is Instagram's (its Esc closes it), and so is any key typed in a text box.
    if (actions.away()) {
      // Our reply box over the view: the keys typed there are its own, never Instagram's.
      if (isTyping(e)) {
        e.stopPropagation();
        if (e.type === 'keydown' && e.key === 'Escape') {
          e.preventDefault();
          actions.blurReply();
        }
        return;
      }
      const key = e.key.toLowerCase();
      if (e.type !== 'keydown' || !FRAME_KEYS.has(key) || e.metaKey || e.ctrlKey || e.altKey || editable(e)) return;
      e.stopPropagation();
      e.preventDefault();
      // Each of these closes the view: a held key would close the next one too.
      if (e.repeat) return;
      if (key === 'i') actions.instagramView();
      else actions.frame(key as FrameKey);
      return;
    }
    if (e.key === 'Alt') {
      // Option alone types nothing and has no browser shortcut, so the player can own it.
      e.stopPropagation();
      e.preventDefault();
      if (e.type !== 'keypress') actions.holdTips(e.type === 'keydown');
      return;
    }
    // Browser shortcuts (⌘R, ⌘D…) stay the browser's.
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    e.stopPropagation();
    if (e.type !== 'keydown' || e.isComposing) return;
    if (isTyping(e)) {
      if (e.key === 'Escape') {
        e.preventDefault();
        actions.blurReply();
      }
      return;
    }
    // The key that dismisses the key card does only that.
    if (e.key !== '?' && !MODIFIERS.has(e.key) && actions.dismissKeyCard()) return e.preventDefault();
    // F is ❤️; 1–9 pick a quick reaction by its place in the set. A held key reacts once.
    const slot = e.key.toLowerCase() === 'f' ? 0 : /^[1-9]$/.test(e.key) ? Number(e.key) - 1 : null;
    if (slot !== null && e.repeat) return e.preventDefault();
    const action = slot !== null ? () => actions.react(slot) : {
      w: () => actions.item(-1, e.repeat),
      arrowup: () => actions.item(-1, e.repeat),
      s: () => actions.item(1, e.repeat),
      arrowdown: () => actions.item(1, e.repeat),
      a: () => actions.step(-1),
      arrowleft: () => actions.step(-1),
      d: () => actions.step(1),
      arrowright: () => actions.step(1),
      ' ': actions.togglePause,
      m: actions.toggleMute,
      u: actions.toggleFilter,
      r: actions.focusReply,
      i: actions.instagramView,
      '?': actions.toggleTips,
      escape: actions.close,
    }[e.key.toLowerCase()];
    if (!action) return;
    e.preventDefault();
    finishAll();
    action();
  };
  // A release can land in another window (⌥⇥), and its keyup then never comes here.
  const onBlur = () => actions.holdTips(false);
  KEY_EVENTS.forEach((type) => window.addEventListener(type, onKey, true));
  window.addEventListener('blur', onBlur);
  return () => {
    KEY_EVENTS.forEach((type) => window.removeEventListener(type, onKey, true));
    window.removeEventListener('blur', onBlur);
  };
}

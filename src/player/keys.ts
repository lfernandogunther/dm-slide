// The player's shortcuts. While it is open, Instagram never sees a key: every keyboard event is
// stopped at the window in the capture phase, before it reaches any of Instagram's listeners.
import { finishAll } from './motion';

export interface KeyActions {
  item(delta: -1 | 1): void; // the older or newer item
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
}

const KEY_EVENTS = ['keydown', 'keyup', 'keypress'] as const;
// Pressed on the way to another key (Shift for ?), so they never count as the key that dismisses the card.
const MODIFIERS = new Set(['Shift', 'CapsLock']);

/** Binds the shortcuts; `isTyping` says whether an event comes from the reply box. Returns the unbind. */
export function bindKeys(isTyping: (e: KeyboardEvent) => boolean, actions: KeyActions): () => void {
  const onKey = (e: KeyboardEvent) => {
    // Keys the extension itself dispatches (Enter in Instagram's composer, to send) go through.
    if (!e.isTrusted) return;
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
      w: () => actions.item(-1),
      arrowup: () => actions.item(-1),
      s: () => actions.item(1),
      arrowdown: () => actions.item(1),
      a: () => actions.step(-1),
      arrowleft: () => actions.step(-1),
      d: () => actions.step(1),
      arrowright: () => actions.step(1),
      ' ': actions.togglePause,
      m: actions.toggleMute,
      u: actions.toggleFilter,
      r: actions.focusReply,
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

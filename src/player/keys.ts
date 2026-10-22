// The player's shortcuts. While it is open, Instagram never sees a key: every keyboard event is
// stopped at the window in the capture phase, before it reaches any of Instagram's listeners.

export interface KeyActions {
  prev(): void;
  next(): void;
  close(): void;
  togglePause(): void;
  toggleMute(): void;
  react(slot: number): void; // 0 is ❤️, then the rest of the quick set
  focusReply(): void;
  blurReply(): void;
}

const KEY_EVENTS = ['keydown', 'keyup', 'keypress'] as const;

/** Binds the shortcuts; `isTyping` says whether an event comes from the reply box. Returns the unbind. */
export function bindKeys(isTyping: (e: KeyboardEvent) => boolean, actions: KeyActions): () => void {
  const onKey = (e: KeyboardEvent) => {
    // Keys the extension itself dispatches (Enter in Instagram's composer, to send) go through.
    if (!e.isTrusted) return;
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
    // F is ❤️; 1–9 pick a quick reaction by its place in the set. A held key reacts once.
    const slot = e.key.toLowerCase() === 'f' ? 0 : /^[1-9]$/.test(e.key) ? Number(e.key) - 1 : null;
    if (slot !== null && e.repeat) return e.preventDefault();
    const action = slot !== null ? () => actions.react(slot) : {
      a: actions.prev,
      w: actions.prev,
      arrowleft: actions.prev,
      d: actions.next,
      s: actions.next,
      arrowright: actions.next,
      ' ': actions.togglePause,
      m: actions.toggleMute,
      r: actions.focusReply,
      escape: actions.close,
    }[e.key.toLowerCase()];
    if (!action) return;
    e.preventDefault();
    action();
  };
  KEY_EVENTS.forEach((type) => window.addEventListener(type, onKey, true));
  return () => KEY_EVENTS.forEach((type) => window.removeEventListener(type, onKey, true));
}

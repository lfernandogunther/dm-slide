// The player's shortcuts. While it is open, Instagram never sees a key: every keyboard event is
// stopped at the window in the capture phase, before it reaches any of Instagram's listeners.

export interface KeyActions {
  prev(): void;
  next(): void;
  close(): void;
  focusReply(): void;
  blurReply(): void;
}

const KEY_EVENTS = ['keydown', 'keyup', 'keypress'] as const;

/** Binds the shortcuts; `isTyping` says whether an event comes from the reply box. Returns the unbind. */
export function bindKeys(isTyping: (e: KeyboardEvent) => boolean, actions: KeyActions): () => void {
  const onKey = (e: KeyboardEvent) => {
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
    const action = {
      a: actions.prev,
      arrowleft: actions.prev,
      d: actions.next,
      arrowright: actions.next,
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

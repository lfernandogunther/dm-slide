// Every hook into Instagram's page lives here: when Instagram changes, this is the file to fix.
// See specs/01-mvp/learnings.md for how each one was found.

export const THREAD_PATH = /^\/direct\/t\/\d+\//;

// React attaches its fiber to each DOM node under a key with this prefix.
export const FIBER_KEY_PREFIX = '__reactFiber';
export const MAX_FIBER_DEPTH = 40;

// The thread's scroll container: `scroller > div > list`, with the fiber holding the loaded
// messages a few levels above `list` (IGDMessageListBoundaryScrollTriggers).
export const SCROLLABLE_OVERFLOW = ['auto', 'scroll'];
export const LOADED_MESSAGES_PROP = 'elements';
export const HAS_MORE_ABOVE_PROP = 'hasMoreAbove';

// Relay store records.
export const STORE_ROOT_ID = 'client:root';
export const VIEWER_ROOT_FIELD = 'xdt_viewer';
export const VIEWER_ID_FIELD = 'interop_messaging_user_fbid';

// A shared reel's XMA card points at its reel URL; posts (/p/) are not reels.
export const REEL_URL = /instagram\.com\/reel\/([^/?#]+)/;

// The thread header sits in the previous sibling of an ancestor of the message scroller (wide and
// tall, unlike the inbox list's). Its call / video / info icons are a div whose children are all
// `[role=button]` with an svg; the button goes right before that div. No aria-label: the UI is
// localized.
export const MESSAGE_SCROLLER_MIN = { width: 400, height: 300 };
export const HEADER_ICON_COUNT = { min: 2, max: 4 };

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

// A message row's DOM child carries the message id as a fiber key a few levels up. Failing that,
// DOM child i is message i-1 while a progressbar row sits above the messages.
export const MAX_ROW_FIBER_DEPTH = 8;
export const MAX_LEADING_ROWS = 1;

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

// Playback: a reel's embed page is same-origin and its <video> carries a plain fbcdn mp4 URL,
// which our own <video> plays with sound. No video within the timeout = unavailable (the embed
// shows "link may be broken" for some reels).
export const embedUrl = (shortcode: string) => `https://www.instagram.com/reel/${shortcode}/embed/`;
export const reelUrl = (shortcode: string) => `https://www.instagram.com/reel/${shortcode}/`;
export const EMBED_TIMEOUT_MS = 6000;
// A page of older messages took ~2 s in the spike.
export const LOAD_OLDER_TIMEOUT_MS = 8000;
export const LOAD_OLDER_POLL_MS = 250;
// The web app's own media lookup; the app id header is the one instagram.com sends with it.
export const mediaInfoUrl = (mediaId: string) => `https://www.instagram.com/api/v1/media/${mediaId}/info/`;
export const WEB_APP_ID_HEADER = { 'X-IG-App-ID': '936619743392459' };
// A shortcode is the media id in base 64; private accounts append extra characters after these.
export const SHORTCODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
export const SHORTCODE_ID_LENGTH = 11;
export const EMBED_POLL_MS = 200;

// Reacting goes through Instagram's own picker. A row's hover toolbar is the group of exactly React
// (aria-haspopup=dialog), Reply and More; it renders on hover. The picker's emoji buttons carry no
// label, only the emoji as text, and focus starts on ❤️: click by text, never confirm with Enter.
export const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍'];
export const ROW_ACTION_COUNT = 3;
export const REACT_BUTTON = '[role=button][aria-haspopup="dialog"]';
export const PICKER = '[role=dialog]';
export const PICKER_BUTTON = '[role=button], button';
export const ACTION_TIMEOUT_MS = 5000;
export const ACTION_POLL_MS = 100;

// Replying: Reply is the toolbar button without aria-haspopup, and it focuses the composer. The
// composer is a Lexical editor: it takes text from execCommand('insertText') and sends on Enter.
// A quoted reply is a plain message whose record names the quoted message's id.
export const REPLY_BUTTON = '[role=button]:not([aria-haspopup])';
export const COMPOSER = 'div[role=textbox][contenteditable=true][data-lexical-editor]';
export const REPLIED_TO_FIELD = 'replied_to_message_id';
export const TEXT_FIELD = 'text_body';
// Sending waits on the server, unlike a reaction.
export const SEND_TIMEOUT_MS = 10000;
// A message's sender is a SlideUser record keyed by its fbid; its display name, else the username.
export const SENDER_RECORD_PREFIX = 'SlideUser:';
export const SENDER_NAME_FIELD = 'name';
export const SENDER_USER_FIELD = 'user_dict';
export const USERNAME_FIELD = 'username';
// A reel card in the chat: a pressable whose props say `isReel`, under one holding the message ref.
export const REEL_CARD = '[role=button]';
export const REEL_CARD_FLAG_PROP = 'isReel';
export const REEL_CARD_MESSAGE_PROP = 'slideMessageRef';
export const MAX_CARD_FIBER_DEPTH = 12;

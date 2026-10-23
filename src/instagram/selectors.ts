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

// A shared item's XMA card points at its URL. Placeholders (deleted, private, expired) carry
// none, and a link to another site matches none of these.
export const REEL_URL = /instagram\.com\/reel\/([^/?#]+)/;
export const POST_URL = /instagram\.com\/p\/([^/?#]+)/;
export const STORY_URL = /instagram\.com(\/stories\/[^?#]+)/;
// The XMA's preview photo; its decoration tells a carousel and a video post from a one-photo post.
export const XMA_PREVIEW_FIELD = 'preview_image';
export const XMA_DECORATION_FIELD = 'preview_image_decoration_type';
export const CAROUSEL_DECORATION = 'COLLAGE';
export const VIDEO_DECORATION = 'VIDEO';
// A story card with text is a reply or reaction to a story, usually mine, not a story sent to watch.
export const STORY_REPLY_TEXT_FIELD = 'xma_text_body';
// Sent from the gallery: the record's content lists its attachments under one of these fields.
// Only `videos` was seen live; the photo and mixed fields come from the web app's own code.
export const GALLERY_FIELDS = ['videos', 'attachments', 'ordered_photo_video_attachments'];
export const GALLERY_URL_FIELD = 'attachment_cdn_url';
export const GALLERY_PREVIEW_FIELD = 'preview_cdn_url';
export const GALLERY_VIDEO_FIELD = 'videos';
export const VIDEO_ATTACHMENT_TYPE = 4;

// The thread header sits in the previous sibling of an ancestor of the message scroller (wide and
// tall, unlike the inbox list's). Its call / video / info icons are a div whose children are all
// `[role=button]` with an svg; the button goes right before that div. No aria-label: the UI is
// localized.
export const MESSAGE_SCROLLER_MIN = { width: 400, height: 300 };
export const HEADER_ICON_COUNT = { min: 2, max: 4 };

// Playback: a share's embed page is same-origin and its <video> carries a plain fbcdn mp4 URL,
// which our own <video> plays with sound. No video within the timeout = unavailable (the embed
// shows "link may be broken" for some reels). `path` is the share's own, ending in a slash.
export const embedUrl = (path: string) => `https://www.instagram.com${path}embed/`;
export const EMBED_TIMEOUT_MS = 6000;
// A page of older messages took ~2 s in the spike.
export const LOAD_OLDER_TIMEOUT_MS = 8000;
export const LOAD_OLDER_POLL_MS = 250;
// Instagram saying "slow down": one of these statuses, or a page other than the embed asked for.
export const REFUSED_STATUS = [401, 403, 429];
export const EMBED_PATH = /\/embed\/?$/;
export const EMBED_POLL_MS = 200;
// A carousel's embed page carries every slide as a JSON string, escaped once inside the page's script;
// its rendered iframe fills only the first two. One-photo posts have `null` there.
export const EMBED_CONTEXT_JSON = /"contextJSON":"((?:[^"\\]|\\.)*)"/;
export const EMBED_CAROUSEL_TYPE = 'GraphSidecar';

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
// A text the sender sends this soon after an item, before anything else, is read as about that item.
export const NOTE_WINDOW_MS = 5 * 60 * 1000;
// Sending waits on the server, unlike a reaction.
export const SEND_TIMEOUT_MS = 10000;
// A message's sender is a SlideUser record keyed by its fbid; its display name, else the username.
export const SENDER_RECORD_PREFIX = 'SlideUser:';
export const SENDER_NAME_FIELD = 'name';
export const SENDER_USER_FIELD = 'user_dict';
export const USERNAME_FIELD = 'username';
// A media card in the chat: a pressable (a link, for a story) showing a photo, under a component
// holding the message ref: 5 levels up for a reel, 7 for a gallery video, 13 for a post, ~26 for a
// story. The photo tells it from the row's toolbar buttons and reaction pills.
export const MEDIA_CARD = '[role=button], a[href*="/stories/"]';
export const MEDIA_CARD_MIN_PHOTO_PX = 100;
export const CARD_MESSAGE_PROP = 'slideMessageRef';
export const MAX_CARD_FIBER_DEPTH = 32;

// Instagram view: clicking a media card opens Instagram's own view of it, a dialog over the chat
// showing the media (the reaction picker is a dialog too, of emoji only). Not yet confirmed live;
// a story opens as a page of its own instead, so any page but a thread counts as that view.
export const LAYER = '[role=dialog]';
export const LAYER_MIN_MEDIA_PX = 200;

# DM Slide — Notes

Decisions and gotchas that outlive a single spec. The full record per task is in
`specs/<NN>-*/learnings.md`; this file keeps what the next spec needs to know.

## Reading Instagram
- **Read the page's own data, not its markup.** Hashed classes are unstable and labels are
  localized (my Chrome is pt-BR, the automated one is English). Hooks are React props and the Relay
  store, reached from the page's MAIN world (`page.js`); the isolated content script cannot see
  `__reactFiber…` expandos. The two talk through synchronous CustomEvents carrying JSON.
- **Message list:** the scroller (`overflow-y: auto|scroll`, `column-reverse`, so up is a negative
  `scrollTop`) holds a wrapper whose children include the rows' container. A fiber a few levels up
  from that container has `elements` (the loaded messages, oldest → newest) and `hasMoreAbove`.
  Once the start of the chat is loaded, a profile header sits before the rows' container, so never
  assume it is the first child.
- **Records:** each `elements[i].currentMessage.__id` is a Relay record, read through a hook
  above the list whose `memoizedState.environment.getStore()` exists. Record → `content` → `xma`
  → `target_url` (`/reel/<code>/` for reels, `/p/<code>/` for posts); `reactions` →
  `{reaction, sender_fbid}`; quoted replies carry `replied_to_message_id`; sender name via
  `SlideUser:<sender_fbid>`. Viewer id: `client:root.xdt_viewer` → `user` →
  `interop_messaging_user_fbid`.
- **Virtualized rows:** only ~5 rows near the viewport render; the rest are placeholders. Act only
  on a row matched by its own fiber key (`messageId`), scrolled into view first, never by index.
- **Kinds:** every message record is a `SlideMessage`; the kind is `content_type`, the content's
  `__typename` and, for shares, the XMA's: reel = `/reel/` target; post = `/p/` target, where
  `preview_image.preview_image_decoration_type` COLLAGE means carousel and VIDEO a video post
  (`preview_layout_type` is always SINGLE); story = `/stories/` target, a reply when
  `xma_text_body` is non-empty; gallery = `videos[]` / `attachments` /
  `ordered_photo_video_attachments` with `attachment_cdn_url`. Gallery photos and story *shares*
  are read from the bundle only, never seen live.
- **Availability has no boolean:** PlaceholderXMA and ExpiredPlaceholderXMA (no target, no
  preview) are the unavailable ones; `tombstone_reason` and expirations were always null.
- **Media card in the chat:** any `[role=button]` or `a[href*="/stories/"]` showing an img/video of
  100px or more; the nearest `slideMessageRef.__id` above it (5–26 fibers up depending on kind) is
  the message. `isReel` exists only on reels, so it can't be the rule.
- **Thumbnails:** the XMA's `preview_image.url`, already in the record (a reel's is its cover, never
  played). Signed URLs expire, so a tile whose `<img>` fails shows its number.
- Loading older: `scrollTop` to the top loads a page of 20 messages in 450–625 ms plus ~600 ms to
  settle. Two months back is ~2 pages in a quiet thread, 30+ in a busy one.
- Revealing a row near the top of the loaded list makes Instagram fetch older pages on its own, so
  list indices shift under the caller: keep ids, never indices, across an await.
- The loaded window can in principle miss the newest messages (`hasMoreBelow`); in normal use it
  doesn't. A jump into old history may break "1 = newest"; untested.

## Driving Instagram
- Only through Instagram's own controls, one click per step, confirmed by re-reading Relay:
  hover the row (dispatched `pointerover` on its largest `img`), `.click()` React, `.click()` the
  emoji by its text. Picking my current emoji again removes it.
- **The picker focuses ❤️ first:** never confirm it with Enter or Space.
- A reaction from the full emoji picker (not the quick six) likely cannot be removed by the player,
  since the quick picker doesn't offer it. Untested.
- The composer is Lexical: `execCommand('insertText')` once, then wait until the composer holds the
  text before a synthetic Enter (Lexical commits the text a moment later). A draft already in the
  composer is never sent along or overwritten, so a failed send's leftover text blocks the next
  one until cleared by hand. Typing while "Sending…" shows lands in Instagram's composer and aborts
  the send (a ~1 s window, unguarded).
- The bridge can ask about one element: dispatch the request on it (bubbling) and the page script
  reads `e.target`, a node both worlds share.
- **Instagram view (`I`)** clicks the row's media card once (the pressable around its largest
  img/video, exact row only) and waits for Instagram's view: a `[role=dialog]` showing media
  ≥ 200 px (the picker is a dialog of emoji only), or any page but a thread, which is how a story
  opens. The player hides, lets every key through but `I` outside a text box, and polls every
  250 ms; once the view is gone it comes back paused, or closes if the path is another thread.
  `I` closes the view with a synthetic Esc on the dialog. **Unconfirmed live** (written on faith,
  2026-10-22): the dialog shape, whether the path changes, and whether a synthetic Esc closes it.
- The header button's anchor is found from the message scroller, not from labels or
  `data-pagelet`; a `MutationObserver` with a 400 ms debounce puts it back when React drops it.

## Keys inside the overlay
- One capture-phase listener on `window` stops every key while the player is open (a `document`
  listener misses them); ⌘/Ctrl/Alt combos pass through. On open, Instagram's focused composer is
  blurred, or typed keys land in it.
- "Typing in the reply box" is `e.composedPath()[0]`: `e.target` is retargeted to the shadow host.
- Keys with `isTrusted` false are ignored, so neither a page script nor a test can drive the player
  with synthetic events: harness checks need real key presses.

## Playback
- Video URL: the web app's `/api/v1/media/<id>/info/` (with `X-IG-App-ID`) first — the media id is
  the shortcode's first 11 characters read in base 64 — and the `/reel/<code>/embed/` page second,
  because many authors turn embedding off. Our own `<video>` plays the mp4 with sound.
- Since 2026-10, that lookup answers 302 to the home page for every kind, so reels play through the
  embed, a carousel shows only the first slide the record holds, and a video post needs its
  `/p/<code>/embed/`. Photos, stories and gallery media come from the record and ask nothing.
- A one-photo post's `preview_image.url` is full resolution; its `fallback_url` is the copy to try
  when the browser can't decode the first (HEIC).
- Two `<video>` elements (current and a spare preloading the next); a swapped-out video must not
  drive the stage or report errors for the reel on screen.
- Seeking a preloaded spare can drop its `readyState` for a moment: read it before the seek.

## Player motion
- Grow and shrink read the message's media rect only when it is wholly inside the scroller's view;
  reading never scrolls. Otherwise the player fades.
- `close()` hands the chat back at once (`onClose`, `inert`, no pointer events) and only then
  finishes leaving, so the header button works during the shrink.
- React → next counts its 850 ms from Instagram's confirmation, not from the key, so the motion never
  shows a reaction that didn't land. Any move, and `I`, cancel the pending move.

## Failure
- `CantRead` (the scan failed, so nothing was attempted) vs any other error (one action failed).
  The header button stays clickable in the error state and opens a notice instead of the player.
- A failed action shows on its own control (shake, red ring, one line with the key to retry), never
  as a global alert; only can't-read takes the whole frame.
- A step the page never answers is retried every ~100 ms until its timeout: safe (each try clicks at
  most once), just chatty.

## Testing
- The DevTools-controlled Chrome runs with extensions off: test there by reloading the tab and
  injecting `dist/page.js`, then `dist/content.js`. The real extension is tested in my own Chrome.
- Content-script logs show under the console's "DM Slide" context, not "top"; `__dms` is the
  adapter there. Each extension reload leaves the old isolated world in the context list
  (a SPA tab never swaps documents), and evaluating in one throws `__dms is not defined`: reload the
  tab so one "DM Slide" remains. `console.warn` from a content script lands on the extension's Errors page.
- The button syncs on page mutations only, so an idle page can lag in a test.
- An unreadable thread can be simulated by blocking the `scan` request at window capture.

## Icon
- `icons/icon.svg` is the master; the PNGs are rendered from it by headless Chrome, never by hand.
  For each size `n` in 16 32 48 128: an HTML file holding `<img src="file://…/icons/icon.svg">` at
  `n`×`n` px on a transparent `html, body`, then
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu
  --hide-scrollbars --force-device-scale-factor=1 --default-background-color=00000000
  --window-size=$n,$n --screenshot=icons/icon$n.png file://…/icon-$n.html`. The build copies the
  PNGs (not the SVG) into `dist/icons`.

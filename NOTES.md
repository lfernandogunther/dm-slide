# reel-queue — Notes

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
- **Reel card in the chat:** a `div[role=button]`; a few fibers up, a pressable with `isReel: true`,
  above it `slideMessageRef.__id`. Shared posts use the same pressable without `isReel`.
- Loading older: `scrollTop` to the top loads a page of 20 messages in ~2–4 s.
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
- The header button's anchor is found from the message scroller, not from labels or
  `data-pagelet`; a `MutationObserver` with a 400 ms debounce puts it back when React drops it.

## Keys inside the overlay
- One capture-phase listener on `window` stops every key while the player is open (a `document`
  listener misses them); ⌘/Ctrl/Alt combos pass through. On open, Instagram's focused composer is
  blurred, or typed keys land in it.
- "Typing in the reply box" is `e.composedPath()[0]`: `e.target` is retargeted to the shadow host.

## Playback
- Video URL: the web app's `/api/v1/media/<id>/info/` (with `X-IG-App-ID`) first — the media id is
  the shortcode's first 11 characters read in base 64 — and the `/reel/<code>/embed/` page second,
  because many authors turn embedding off. Our own `<video>` plays the mp4 with sound.
- Two `<video>` elements (current and a spare preloading the next); a swapped-out video must not
  drive the stage or report errors for the reel on screen.

## Failure
- `CantRead` (the scan failed, so nothing was attempted) vs any other error (one action failed).
  The header button stays clickable in the error state and opens a notice instead of the player.
- A step the page never answers is retried every ~100 ms until its timeout: safe (each try clicks at
  most once), just chatty.

## Testing
- The DevTools-controlled Chrome runs with extensions off: test there by reloading the tab and
  injecting `dist/page.js`, then `dist/content.js`. The real extension is tested in my own Chrome.
- Content-script logs show under the console's "Reel Queue" context, not "top"; `__rq` is the
  adapter there. `console.warn` from a content script lands on the extension's Errors page.
- The button syncs on page mutations only, so an idle page can lag in a test.
- An unreadable thread can be simulated by blocking the `scan` request at window capture.

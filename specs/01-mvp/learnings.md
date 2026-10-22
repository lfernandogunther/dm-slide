# S01 — Learnings

## #01 spike — read-only pass (2026-10-21)
Instagram web DMs, UI language `en`, one 1:1 and one group thread. No writes. Hashed `x…` classes
are unstable; every hook below is a role, an aria-label, an svg label or a React prop.

**Thread & URL**
- A thread is `location.pathname` matching `^/direct/t/\d+/`. Inbox items are `div[role=button]`
  inside `[aria-label="Thread list"]`, not links; navigation is SPA.
- Opening an unread thread marks it read.

**Message list**
- Scroll container: the largest `div` with `overflow-y: auto|scroll`. No role/aria. It is
  `flex-direction: column-reverse`: `scrollTop` is 0 at the bottom and negative going up; the top
  is `-(scrollHeight - clientHeight)`.
- Rows: `sc.firstElementChild.firstElementChild.children`; DOM order = oldest → newest. A row is
  a message or a timestamp. Child 0 is `[role=progressbar][aria-label="Loading..."]` while older
  pages exist.
- **Virtualized:** off-screen rows are empty fixed-height placeholders; only ~2–4 rows near the
  viewport hydrate (`[role=article]`, roledescription "message"). `listReels()` has to scroll,
  collect and de-duplicate — it cannot read the thread in one pass.

**Reels**
- Reel card: `article div[role=button]` containing `svg[aria-label="Clip"]` (label is
  locale-dependent). The `<a>` inside points at the reel's *author* profile, not the reel.
- **No `/reel/` link anywhere in the DOM.** The shortcode comes from the React fiber: walk
  `.return` from the card button (depth ~4) to the first `memoizedProps.shortCode` (also
  `targetUrl` = `https://www.instagram.com/reel/<code>/?id=…`). This needs the page's MAIN world:
  a content script in the isolated world cannot see `__reactFiber…` expandos → `"world": "MAIN"`
  script, or an injected script that posts the codes back.
- Fallback for the code: clicking the card opens a modal and pushes `/p/<code>/`.

**Sender**
- Every hydrated row has `[role=group][aria-label="Message actions"]` (hidden with
  `opacity:0; pointer-events:none` until hover) holding three buttons:
  `React to message from <user>` (`aria-haspopup=dialog`), `Reply to message from <user>`,
  `See more options for message from <user>` (`aria-haspopup=menu`).
- Sender = the username in that label; mine is my own username (also `a[href="/<me>/"]` in the
  nav). Matched alignment on every rendered row, 1:1 and group. Avatars only show on the first
  message of a run — not usable per row.
- The labels are English-only: other locales need their own prefixes, or match by button
  position in the group.

**Reactions**
- A chip is a sibling of the article in the row: `div[role=button]`, no aria-label, emoji in
  `span > span`, a count in `div[role=none]` in groups. Every chip looks identical.
- **"Is this reaction mine?" is not readable without interaction** in the read-only pass.

**Playback**
- Embed iframe `https://www.instagram.com/reel/<code>/embed/`: loads (no XFO/CSP block),
  same-origin, `contentDocument` accessible, `<video>` with an fbcdn mp4, `muted:false`, starts
  paused; `video.play()` works with sound after a user gesture. 1 of 5 reels showed "link may be
  broken" with no video.
- Clicking the card: a `[role=dialog]` modal with a `blob:` MSE `<video>`, sound on, autoplay;
  URL `/p/<code>/`; Escape returns to the thread intact.
- Verdict: embed as plan A, the native modal as the per-reel fallback.

**Load older**
- Setting `scrollTop` to the negative bound loads +20 rows per page (~2 s). Start-of-chat
  detection untested (likely: the progressbar row disappears).

**E2EE**
- No sign of it in either thread; DOM shape identical in 1:1 and group. Only two threads checked.

## #01 spike — write pass (2026-10-21)
One reel row from the other person in a 1:1 thread; reacted 👍 and removed it, opened Reply and
typed without sending. End state verified clean: no reaction, empty composer, no quote bar.

**React**
- Hover the row → `[aria-label^="React to message from "]` (`aria-haspopup=dialog`) → an
  unlabeled `div[role=dialog]` portal with the text "React", buttons ❤️ 😂 😮 😢 😡 👍 and
  "Choose an emoji" (full picker, untested).
- Emoji buttons have no aria-label; match by `textContent`. **Focus lands on ❤️** (the first
  button): never confirm the picker with Enter/Space — click the emoji by its text.

**Is this reaction mine? — answered**
- Chips are byte-identical whoever reacted; no tooltip, no title.
- From the **chip's** fiber (not the article's: they are siblings), walk `.return` ~12–15 levels
  to the row-footer component; a hook's `memoizedState.snapshot.data.reactions` is
  `[{reaction, sender_fbid}]`. The viewer id is the first `memoizedProps.viewerRef
  .interop_messaging_user_fbid` up the tree. mine = some `sender_fbid === viewerId`. Verified on
  my chip (true) and the other person's (false). A row with no chip has no reactions.
- Fallback if that layout moves: click the chip → `div[role=dialog][aria-modal]`, heading
  "Reactions", one button per reactor; mine reads "… Select to remove <emoji>".

**Unreact**
- Click my chip → click my "Select to remove" entry. One click removes it and closes the dialog.

**Reply**
- `[aria-label^="Reply to message from "]` → a "Replying to <name> / Reel" bar above the
  composer, cancel via `[role=button][aria-label="Cancel reply"]` or Escape. The composer
  (`div[role=textbox][contenteditable=true]`, `aria-placeholder="Message..."`) takes focus.
- Send is `div[role=button][aria-label="Send"]` and exists only once there is text. Clearing the
  text does not cancel the quote. Sending itself was not tested (out of bounds).

**Follow in the chat**
- `row.scrollIntoView({block:'center'})` lands and hydrates a placeholder row, and the scroll
  stays stable (no jump, no load). Scrolling near the oldest rows loads the next page (+20 rows)
  without moving the viewport.
- Row indices shift after a prepend, and rows revert to placeholders off-screen: **identify rows
  by shortcode, never by index**; act only on a hydrated row (scroll it into view first).

## #01 verdict per piece
| Piece | Verdict |
|---|---|
| List reels | Plan A, with a MAIN-world script for the shortcode (fiber) and a scroll-and-collect pass over the virtualized list |
| My reaction | Plan A via the footer fiber; fallback: the Reactions dialog |
| Play | Plan A: the `/reel/<code>/embed/` iframe; fallback per reel: Instagram's own modal |
| React / unreact | Plan A via the native picker and the Reactions dialog |
| Reply | Plan A via Reply + composer; Send untested until #08 (in a thread chosen then) |
| Load older | Plan A: `scrollTop` to the negative bound; start-of-chat detection still open (#09) |
| Follow in the chat | Plan A: `scrollIntoView` |
| Locale | UI labels are English; another language needs its own strings in `selectors.ts` |

## #02 scaffold (2026-10-21)
- The DevTools-controlled Chrome (chrome-devtools MCP) runs with extensions off: "Load unpacked"
  there fails silently. Load and test the extension in the everyday Chrome.
- The content script's `console.log` did not show with the console on its default "top"
  context; it showed once the context menu was switched to "Reel Queue". Look there first.
- The everyday Chrome shows Instagram in **pt-BR** ("Mensagem...", "Pesquisar"); the spike's
  labels were English. #03 needs the pt-BR strings for every aria-label it matches.

## #03 listReels from the page's own data (2026-10-21)
- No scrolling is needed for what Instagram has already loaded. Above the message list
  (`scroller > div > list`, ~3 fibers up, `IGDMessageListBoundaryScrollTriggers`) the props
  `elements` (oldest → newest, one per row; DOM child i = `elements[i-1]` while the progressbar row
  exists) and `hasMoreAbove` hold the loaded window: 20 messages per page.
- Each `elements[i].currentMessage` has `id` (message id), `__id` (Relay id), `sender_fbid`,
  `timestamp_ms`. The full record is in the Relay store: walk up to a hook whose
  `memoizedState.environment.getStore` exists (`IGDMessageListOffMsys`, ~23 up) →
  `getStore().getSource().get(__id)`.
- Record → `content.__ref` → `xma.__ref` → `target_url` (`/reel/<code>/` or `/p/<code>/`);
  `reactions.__refs` → `{reaction, sender_fbid}` (`msg_reactions` has no emoji).
- My id: `client:root.xdt_viewer.__ref` → `.user.__ref` → `interop_messaging_user_fbid`.
- Row fibers carry `memoizedProps.messageId` (= `fiber.key`) for mapping a message to its row.
- Language-independent action buttons: the `[role=group]` holding exactly three `[role=button]`
  with `aria-haspopup` dialog (React), none (Reply), menu (More). A row may have an outer group
  with extra buttons around it, so don't take the first group.
- Checked by injecting the built `page.js` into the spike's thread: 8 reels (4 from the other
  person), ascending timestamps, unique ids, no reaction of mine — same as the spike's counts.
- Checked through the real extension in my everyday Chrome (pt-BR UI): the isolated ↔ MAIN bridge
  answers synchronously, `health()` ok, 12 reels from others with unique ids and no reaction of
  mine, which matches the chat. The same reel sent twice is two items (one per message), by design.
  A non-null `myReaction` is still unverified; #07 covers it once React exists.

## #04 header button (2026-10-21)
- The thread header is found from the message scroller, not from labels: walk up from the wide,
  tall scroller (the inbox list is ~100px wide) to the first ancestor with a previous sibling; in it,
  the icon row is the div whose 2–4 children are all `[role=button]` with an svg. `data-pagelet`
  is useless as an anchor (four on the page, the first is the inbox list).
- The button goes right before the icon row, in the same flex row as the avatar/name link.
- A `MutationObserver` on `body` with a 400 ms debounce keeps it there: React dropping the button
  puts it back within one sync, and an unchanged label writes nothing, so there is no observer loop
  (the label lives in a shadow root, outside what the observer sees anyway).
- Checked by injecting the build into the automated Chrome: one button, "4 without ❤️" for the
  spike's thread, stable after 3 s, back after being removed.
- Checked in my own Chrome (pt-BR): the counts matched the chat in three threads, back and forth,
  including one at "0 without ❤️" where I had reacted to every reel — the first live proof of a
  non-null `myReaction`. Instagram's header spreads its items, so the button sits mid-header.

## #05 player shell (2026-10-21)
- Keys: one capture-phase listener on `window` for keydown/keyup/keypress stops every key while the
  player is open (a document listener counted 0 keys through a whole session). Typing in the reply
  box still works, since stopping propagation doesn't cancel the default action. ⌘/Ctrl/Alt
  combos pass through to the browser. On open, the focused element (Instagram's composer) is
  blurred, or typed keys would land in it.
- "Typing" is `e.composedPath()[0] === replyInput`: `e.target` is retargeted to the shadow host.
- Follow-in-chat (`reveal`): the page script finds the row by a fiber key / `messageId` prop within
  8 levels above each DOM row, falling back to `rows[index + (rows − messages)]` only when that
  offset is 0 or 1. Each move put the same row at the thread's center, with no warnings.
  Confirmed by eye in my own Chrome: after a few D presses and Esc, the thread showed that reel.
- The prototype's 95%-opaque backdrop let Instagram's nav show through the strip; it's opaque now.

## #06 playback (2026-10-21)
- The embed iframe is only a resolver: its `<video>` carries a plain fbcdn mp4 URL, which our own
  `<video>` (in the shadow root) plays with sound, so loop, pause and progress are ours and none of
  the embed's chrome shows. The iframe is dropped as soon as the URL is read; a miss (no video in
  6 s) is not cached, so a slow network gets another try.
- Two `<video>` elements, current and spare: the spare loads the next reel and is swapped in on
  `D`, playing at readyState 4 straight away. Every shown reel restarts at 0, since a swapped-in
  spare can be a reel watched earlier.
- In the automated Chrome, playback with sound started right after opening from the button's
  `.click()` — sticky activation from earlier interaction was enough. If the browser refuses
  sound, the stage shows the paused ▶ and Space starts it.
- **The embed is not enough:** in my own thread, 9 of 21 reels had no video in their embed page
  (likely the author turned embedding off); they are still videos. The web app's own media lookup,
  `/api/v1/media/<id>/info/` with the `X-IG-App-ID` header, returned an mp4 in
  `items[0].video_versions` for all 21, in 0.4–0.9 s against ~2 s for the embed. It comes first now,
  the embed second. The media id is the shortcode's first 11 characters read in base 64.
- A swapped-out `<video>` kept the `onerror` of the reel it last played: an error while preloading
  into it showed "Reel unavailable" on the reel actually playing. The handler now checks it is
  still the current video.
- A `pause` event from leaving a reel arrives after the next reel's reset, so the ▶ mark and the
  old progress leaked onto the next card; a hidden video no longer drives the stage.
- `console.warn` from a content script lands on the extension's Errors page in `chrome://extensions`;
  diagnostics use `console.info`.
- The stage has a mute button (bottom right, as on Instagram) and `M`; the setting holds across reels.

## #09 lazy loading (2026-10-21, done before #07)
- The message list's props also carry `hasMoreBelow`, `isLoadingAbove/Below` and
  `onLoadMoreAbove/BelowExternal`: the loaded window can, in principle, miss the newest messages.
  Scrolling up four pages (20 → 100 messages) kept `hasMoreBelow` false, so in normal use the
  newest stay loaded and "1 = newest" holds. A jump into old history (search, a quoted message)
  may break that; untested.
- `loadOlder` scrolls the thread to its top (`scrollTop = -scrollHeight`, which the browser clamps
  for the column-reverse list) and waits for the message count to grow: 1.8–3.7 s per page of 20.
  The thread is then scrolled back to the current reel, so closing still lands there.
- The strip numbers from the newest, so prepending older reels renumbers nothing; prepending keeps
  the visible tiles in place (distance from the bottom), and the current reel keeps playing.
- Checked by injecting the build in the automated Chrome: `A` at the top tile loaded 4 → 6 tiles
  and moved one older; a wheel-up at the top of the strip loaded 6 → 9, current unchanged.
  "Start of chat" not reached (long thread).

## #07 react (2026-10-21)
- Instagram's own picker works when driven by script: dispatched `pointerover`/`mouseover` on the
  row's largest `img` renders the hover toolbar, then `.click()` on React (`aria-haspopup=dialog`)
  and `.click()` on the emoji found by its text. No real mouse needed.
- **Choosing my current emoji again in the picker removes it.** The Reactions dialog fallback was
  not needed.
- Relay reflects the change almost immediately: the confirming re-read succeeded on the first poll,
  both for adding and removing. No picker dialog is left open afterwards.
- Actions only use a row matched by its own fiber key (`findRow(..., exact)`), never by position.
- Checked in the test thread with 👍 only (key `6`): react, next after react, back, remove, no
  advance on removal, setting toggle, clean end state. ❤️ via `F` confirmed by the user in their
  own Chrome through the real extension.
- A reaction picked from the full emoji picker (not the quick set) cannot be removed by the player:
  the quick picker does not offer it. Untested; #11 should surface the timeout.

## #08 spike — replies and the composer, read only (2026-10-21)
- A quoted reply is just another `SlideMessage` with `replied_to_message_id` (string, equal to the
  quoted message's `id` = `message_id` = record `__id`) and `replied_to_message` (`{__ref}` to the
  same record). No separate reply type in the store. Its text is `text_body`.
- `igd_snippet` is not a reply field: it sits on `MESSAGE_INLINE_SHARE` messages (share preview).
- My replies to a reel = loaded messages with `sender_fbid === me` and `replied_to_message_id ===
  reel id`. Only loaded messages count.
- The composer is a Lexical editor: `div[role=textbox][contenteditable=true][data-lexical-editor]`,
  the DOM node carries `__lexicalEditor`. Not a textarea; typing must go through events Lexical
  listens to.
- The thread read had 1 quoted reply (from the other person, to a reel); none of mine.

## #08 reply (2026-10-21)
- Sending through Instagram's own composer works, quoted and plain, confirmed by the user in their
  own Chrome: Reply on the row (quote) or `focus()` (plain), `execCommand('insertText')`, then a
  synthetic Enter keydown. keys.ts lets untrusted events through, so the Enter reaches Lexical.
- Lexical applies `insertText` a moment later: on an empty paragraph it cancels the native insert
  and commits its own update afterwards, so the composer's text is still empty right after the
  call. The first build checked synchronously, retried, then saw its own text as "a draft" until
  the timeout, and left the text in Instagram's composer. Fix: type exactly once, and let the send
  step wait until the composer holds the text before pressing Enter.
- A failed send can leave text in Instagram's composer; the next send then refuses it as a draft
  (by design). Clear it by hand.
- Typing while "Sending…" shows lands in Instagram's composer (it has the focus) and aborts the
  send. Not guarded; the window is about a second.

## #10 sender, date, reel card click (2026-10-21)
- Sender: a message's `sender` refs a `SlideUser` record whose id is `SlideUser:<sender_fbid>`;
  `name` is the display name, and `user_dict` refs an `XDTUserDict` with `username`.
- Group vs 1:1, if ever needed: `client:root["get_slide_thread_nullable(thread_fbid:\"<URL id>\")"]`
  → `SlideThread.as_ig_direct_thread` → `XFBIGDirectViewerThread` with `is_group` and
  `thread_subtype` (`IGD_GROUP`, `IG_ONLY_ONE_TO_ONE`, `IG_BUSINESS_ACCOUNT_ONE_TO_ONE`). Unused:
  the name shows in 1:1 too.
- Reel card in the chat: a 200x356 `div[role=button]` whose thumbnail `img` is what a click hits.
  A few fibers up, a pressable has `isReel: true`; above it `slideMessageRef.__id` is the message
  record. A shared post uses the same pressable without `isReel`; toolbar buttons have neither.
- A reply quoting a reel shows a small reel card whose `slideMessageRef` is the quoted reel, so a
  click on it opens the player at that reel.
- The bridge can ask about a specific element: dispatching the request event on it (bubbling) lets
  the page script read `e.target`, a DOM node shared by both worlds.
- Only ~5 rows near the viewport render their cards; the rest are placeholders. The message list
  is `column-reverse`, so scrolling up is a negative `scrollTop`.
- Confirmed by the user in their own Chrome, in a 1:1 and in a group thread: names, dates and a
  click on someone else's reel card opening the player there.

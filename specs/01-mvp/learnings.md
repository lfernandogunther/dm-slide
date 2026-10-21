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
- Instagram wipes the console after load, so the content script's `console.log` is gone by the
  time you look. Check injection via the console's context menu ("top" → "Reel Queue"), or turn
  on "Preserve log".
- The everyday Chrome shows Instagram in **pt-BR** ("Mensagem...", "Pesquisar"); the spike's
  labels were English. #03 needs the pt-BR strings for every aria-label it matches.

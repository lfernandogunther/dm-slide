# Learnings — S03

## Learned
- 2026-10-22 — A tile's thumbnail is the XMA's `preview_image.url`, the first photo the record
  already holds; a reel's preview is only its cover, kept as the thumb and never played. A tile
  whose `<img>` fails falls back to its number. -> NOTES.md
- 2026-10-22 — Grow and shrink read the message's media rect only when it is wholly inside the
  thread's scroller view, and reading never scrolls; otherwise the player fades. -> NOTES.md
- 2026-10-22 — `close()` hands the chat back at once (`onClose`, `inert`, no pointer events) and
  only then finishes leaving, so the header button and the chat work during the shrink. -> NOTES.md
- 2026-10-22 — Keys with `isTrusted` false are ignored, so a page script or a test cannot drive the
  player with synthetic events; harness checks need real key presses. -> NOTES.md
- 2026-10-22 — React → next counts its 850 ms from Instagram's confirmation, not from the key, so
  the motion never shows a reaction that didn't land; any move, and `I`, cancel it. -> NOTES.md
- 2026-10-22 — A failed action shows on its own control (shake, red ring, one line with the key to
  retry) instead of a global alert; only can't-read takes the whole frame. -> NOTES.md
- 2026-10-22 — Seeking a preloaded spare `<video>` can drop its `readyState` for a moment: read it
  before the seek. -> NOTES.md
- 2026-10-22 — Every motion goes through one `animate()` that keeps its own set of running
  animations, so `finishAll()` settles the player before a key acts; reduced motion turns every
  transform into a crossfade there. -> stays
- 2026-10-22 — The strip keeps one tile per item id and FLIPs it, so a load-older that prepends
  items doesn't rebuild or jump the strip. -> stays
- 2026-10-22 — `HTMLElement.hidden` is typed `boolean | "until-found"`, so a toggle reads it with
  `=== true`. -> stays
- 2026-10-22 — `?` toggles the key card and the key tips together; dismissing the card clears both,
  or the tips stayed pinned (caught in the harness). -> stays
- 2026-10-22 — Playwright's browser reports `prefers-reduced-motion: reduce` unless media is
  emulated as `no-preference`, so every motion check first looked like a missing animation. -> lessons (proposed)
- 2026-10-22 — The Playwright MCP blocks `file:` URLs: the harness is served on 127.0.0.1 instead.
  Headless Chrome also has no running AudioContext without a gesture. -> stays
- 2026-10-22 — The fake adapter's shallow item copy shared `myReplies` with the player's items, so a
  reply looked recorded twice; deep-copy what the player mutates. -> stays
- 2026-10-22 — A tick in `tasks.md` whose working copy also holds uncommitted spec edits is committed
  through the index alone (`git hash-object` of HEAD's file with the tick, `git update-index
  --cacheinfo`), so the edits wait for their own commit. -> lessons (proposed)
- 2026-10-22 — Instagram view (`I`) was written on faith: the layer is taken to be a media dialog or
  any non-thread path, closed with a synthetic Esc. Unconfirmed live; flags 3 and 5 of the
  self-review wait on that hand check (tasks 16, 17). -> NOTES.md (already there)
- 2026-10-22 — `I` failing with "the row shows no media card" was timing, not markup: right after
  `scrollIntoView` a placeholder row holds no media, and its cover draws ~12–14 ms later, while the
  click ran once. The rows looked identical in every DOM diff; only polling the same row over time
  showed it. -> NOTES.md
- 2026-10-22 — A shared post's view moves the path to `/p/<code>/` and shows a dialog with no
  img/video, so "a dialog showing media" never matched and the synthetic Esc was never reached.
  Closing with our own `history.back()` landed on another thread in one run (`history.length` did
  not grow; cause unconfirmed); a synthetic Esc on any dialog off the thread path lets Instagram go
  back itself, and returned to the thread in 2 of 2 runs with a recorded push/pop. -> NOTES.md
- 2026-10-22 — Reacting no longer waits on Instagram: the player moves on at once and a queue tells
  Instagram one job at a time, two tries, then reverts the badge and says which item failed. A reply
  waits for the queue to drain, since both drive Instagram's thread and its focus. -> NOTES.md
- 2026-10-22 — With the media lookup answering 302, a carousel showed its first slide only. Its
  `/p/<code>/embed/` HTML carries every slide as twice-encoded JSON; the rendered iframe does not
  (two of N slides filled). -> NOTES.md

## Concepts learned
- FLIP, the Web Animations API and `prefers-reduced-motion`, as in spec.md's glossary.

## Promoted
- 7 entries -> NOTES.md (Reading Instagram, Keys, Playback, Failure, Player motion).
- 2 entries proposed for lessons, waiting on the owner.

# Learnings — S07

## Learned
- **2026-10-27 — `stage.show` preloads `items[current + 1]` whatever the direction or filter.**
  Found while planning: moving older, the preload reads an item the user is not going to, and the
  lane makes the item they did go to wait behind it. A wasted read, not only a slow one.
- **2026-10-27 — the baseline cannot wait for the cuts.** The DevTools Chrome has no DM threads,
  so both probe runs are the owner's; the "before" run uses the v0.1.1 zip (unpacked), the "after"
  run `dist/`. The code went ahead of the numbers, and a cut the numbers don't justify is reverted.
- **2026-10-27 — moving onto an item mid-preload must keep its read.** Abandoning unwanted reads
  (04) would otherwise kill the preload during the new item's 300 ms settle, before its own request
  joins the wanted list: the preload's `wanted` is "still on the item it came from, or now on it".
- **2026-10-27 — the settle only guards items passed through; a preloaded item asks nothing.** So
  it shows at once, and only its own preload waits the settle: a held S still reads nothing.
- **2026-10-27 — a shorter settle for a single press dropped without measuring.** `e.repeat` only
  marks a held key; taps at 4–6 a second (165–250 ms apart) would each outlast a shorter settle and
  be read. Its gain (≤ 300 ms on a fresh item) doesn't pay for reading items tapped through.
- **2026-10-27 — first v0.1.1 run, too small to be the baseline.** The player opened on the newest
  item, so 5 W then 5 S covered 5 items and the next 13 S did nothing; all newer moves were items
  already read. What it showed: a fresh reel moving older = 300 ms settle + 400–800 ms read + 40–120
  ms to the first frame (746, 1222 ms); an unplayable one 712 ms; an item read before still takes
  exactly the 300 ms settle, photos too. The probe's steps now cover older and newer on unseen
  items (a tab reload between).
- **2026-10-27 — baseline, v0.1.1, one thread with 100+ reels (no pushback).** Older, fresh reels:
  median 1001 ms (n=7; 930–2034) = 300 settle + ~600 read + 30–180 to the first frame; reads end on
  200 ms poll ticks (601–605 ms, one 804). Newer, preloaded: 299 ms (n=6), which is the settle alone.
  Unplayable with the cover: 700–930 ms. Four reads ran into the 6 s timeout (no cover, no video):
  6.3 s to the card, and moving older the preload then re-read the reel just left (the timeout's null
  is not cached), holding the lane for 6 s more. The newer leg had 8 reels, not 10: a reload loads
  14 items. The probe now records what a timed-out frame holds.
- **2026-10-27 — after the cuts, same thread, same probe text as the baseline (no pushback).** The
  build is the new one: newer, preloaded items show in 0–1 ms where v0.1.1 showed a flat 299 ms, and
  only the settle skip can do that. Moving older, preloaded reels show in 0–1 ms (n=5); v0.1.1 had
  no preload hits moving older. Videos overall: older median 1001 → 1, newer 299 → 1. Fresh reads
  are unchanged (1001, 978 vs 1001), as expected, since nothing preloaded them. A timed-out read
  being left now ends within one poll (5751 ms, twice), and the next reel showed in 978 ms where
  v0.1.1 needed 2034 behind the same kind of read. The 50 ms poll gives no median of its own: the
  reads no longer end on 200 ms ticks (6 of 6, 362–650 ms); rounded up to the old ticks, they would
  have ended 39–187 ms later (median ~150). That is a derived figure, not a measured one. 6 s
  timeouts still happen (one in each part). The timeout diagnostics weren't captured, because the
  run used the earlier probe text. An item's "ownReads 2" is its read plus its own preload when the
  preload starts before the first frame, not a second read for it.
- **2026-10-27 — hand check on the new build (owner, W).** A held W passed through dozens of items
  with no read for any of them (ownReads 0, aheadReads 0 on every passed row). Fast taps landing
  more than 300 ms apart each start a read, as v0.1.1 did. Each of those reads now stops within one
  poll once the tap moves on (56 and 161 ms), but its request was already sent. The 6 s timeouts
  are an embed page that shows broken media: the only classes in the frame are `EmbedBrokenMedia`,
  `EmbedLogo`, `EmbedVisitInstagram` and `Sprite`, with no video and no img (3 of 3). Removing an
  embed frame makes Instagram's own script beacon `logging_client_events` on unload. v0.1.1 did
  this too; it is Instagram's, not a new request of ours.
- **2026-10-27 — the broken-media fast fail, owner's eye.** After it, such items show "Can't play
  this here" in about 1 s, not 6.3 s. That was seen by eye, without probe numbers.

## Concepts learned

## Promoted
- preload ignores direction · first v0.1.1 run · mid-preload move keeps its read · broken-media by eye -> stay here
- the baseline needs the owner, how to compare builds -> NOTES.md (Testing)
- settle only guards items passed through; baseline and after-cut numbers -> NOTES.md (Playback, "Where a reel's start time goes")
- single-press settle cut dropped -> NOTES.md (Playback)
- `EmbedBrokenMedia` and the unload beacon -> NOTES.md (Playback)
- a median can't show a cut that removes rounding -> proposed for lessons.local.md

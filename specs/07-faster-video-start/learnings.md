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

## Concepts learned

## Promoted

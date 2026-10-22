# Session — S02

## Status: built · 2026-10-21 · all 13 tasks committed, waiting on the manual test

## Next
I test on the real extension (reload `dist/` in chrome://extensions): react, unreact and replies on
every kind, the filter surviving a reload, carousel/photo/story/gallery stages, a card click, paced
loading in a busy thread, and a gallery photo I send myself. Then phase 04 closes in ROADMAP.md.

**Source branch:** main · **Working branch:** main
**Repo(s):** reel-queue · **PR:** none (solo, local only)

## Open decisions
- The media lookup answers 302 for every kind: carousels show one slide, video posts depend on
  their embed. Worth a spike on another source if that matters in use.

## Tasks status
13 of 13 done; see tasks.md.

## What was done
- 2026-10-21: scope settled in chat: every non-text media item, the strip marks (number + icon),
  the keys (W/S items, A/D slides), and the "Not reacted" filter (toggle + `U`, remembered).
- 2026-10-21: tasks 01–12 built and committed unattended, read-only checks only on the real
  account (nothing reacted, sent or replied). Learnings sorted into NOTES.md.
- 2026-10-22: task 13 added: the sender's texts within 5 min after an item show beside it, on
  their side; checked read-only on a live thread (counts and layout match).

## Pre-compact snapshot
<!-- Written by pre-compact.sh on every compaction, replaced whole. Edit above, not here. -->

**2026-10-21 23:22** - branch `main`

Next open task: **12 — self-review, close learnings.md and promote**

### Uncommitted
```
 M specs/02-beyond-reels/session.md
```

### Recent commits
```
c8979d5 feat [S02 #09]: open the player from a click on any media card in the chat
7d1d87d feat [S02 #05]: resolve each item to a video, a photo or slides, asking the network only for shares
9147a61 feat [S02 #04]: list shared posts, carousels, stories and gallery media, dropping the unavailable ones
2ae4bcf doc [S02 #01]: record how each media kind and its chat card look in Instagram's store
d3f1d43 feat [S02 #06]: show photos and slides with dots on the stage, playing only the current slide's video
```

# Session — S07

## Status: DONE · 2026-10-27

## Next
Nothing pending in the spec. Push and a 0.1.2 release are the owner's call (spec, open question 2).

**Source branch:** main · **Working branch:** main
**Repo(s):** dm-slide · **PR:** not opened yet (solo repo, commits on main)

## Open decisions
- A target time for key-to-first-frame: set after the baseline (spec, open question 1).

## Tasks status
4 of 8; see tasks.md.

## What was done
- 2026-10-27: planned from ROADMAP 07 after v0.1.1 shipped; found the preload ignores direction.
- 2026-10-27: spec approved; 01 — probe.md: top-frame observers on the embed iframes, the stage's
  `loading` class and `data-pos`; numbers only.
- 2026-10-27: 03–05 done (preload by direction and filter; unwanted reads stop; 50 ms poll; no
  settle for a preloaded item; the single-press settle cut dropped). Demo check: W preloads the
  older item, a preloaded item is asked at 0 ms instead of 300, its preload waits the settle, a
  press leaving within the settle reads nothing ahead. Abandoning reads is real-adapter only.
- 2026-10-27: 02 — v0.1.1 baseline in learnings.md (older 1001 ms, newer preloaded 299 ms, 6 s
  timeouts); the newer leg had 8 reels, accepted since every one is the 300 ms settle. The build
  for 06 is copied to `dist/s07`.

## Inputs ingested

## Pre-compact snapshot
<!-- Written by pre-compact.sh on every compaction, replaced whole. Edit above, not here. -->

**2026-10-27 10:27** - branch `main`

Next open task: **02 — owner: baseline with today's build — at least 10 reels moving newer and 5 moving older; numbers into learnings.md**

### Recent commits
```
5460701 doc [S07 #02]: record the v0.1.1 baseline and look inside timed-out frames
f6ac3c2 doc [S07 #02]: cover unseen items both ways in the probe and log the first run
17e6fcf doc [S07 #05]: record the cuts, the dropped one and the demo check
77d2711 chore [S07 #05]: log the item id of each demo media read
6d71b51 feat [S07 #05]: show a preloaded item without waiting the settle
```

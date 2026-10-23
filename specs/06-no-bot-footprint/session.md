# Session — S06

## Status: IN-PROGRESS · 2026-10-23 · owner's go-ahead on the plan

## Next
Task 12: self-review (`/cn-self-review`, then `/cn-self-review-walk`). Then 13, the owner's hand check and the release.

**Source branch:** main · **Working branch:** main
**Repo(s):** dm-slide · **PR:** none (solo)

## Open decisions
- None. Spec open question 1 resolved: a stored 6 h pause.

## Tasks status
11 of 14. See tasks.md.

## What was done
- 2026-10-23: a friend's Instagram challenged them right after installing v0.1.0. The owner amended
  principle 3 and asked for S05 to wait on a branch. S06 drafted.
- 2026-10-23: go-ahead. Task 01 done: S05 on `05-post-caption` (8 commits, ON-HOLD), `main` is
  `origin/main` + the amendment (398bc9a). Web research on similar extensions running in a subagent.
- 2026-10-23: tasks 02–07 done (embed only, back off, history on request, 1.5 s gap with no
  auto-retry, build guard, docs). Research in `docs/research-instagram-extensions.md`: it confirms
  the direction; open from it — a stored cooldown across reloads (spec open question 1), embeds
  loaded without credentials (needs a live test).
- 2026-10-23: task 08, demo half passed: 0 older pages on open and on moving, exactly 1 per `W` at
  the oldest item, a 1501 ms gap between two quick reactions, pushback pill shown once. Live half not
  run: in the DevTools Chrome, `/direct/inbox/` showed only the empty "Your messages" state (0
  thread links after a reload), and the subagent may not click Instagram's UI.
- 2026-10-23: task 08, live half, in a thread the owner opened: 20 loaded messages before open,
  after open and after each move; 6 embed loads for 5 items visited (the 6th the lookahead); 0
  `/api/v1/media/`; one `W` at the oldest took 20 → 40 and nothing more loaded in the next ~16 s.
  A `credentialless` iframe on an embed page is readable from the page and its `<video>` has an https
  src: embeds can load without the session's cookies. Forced pushback not run live (the only carousel
  was visited at open); covered in the demo.
- 2026-10-23: owner asked for everything needed to avoid trouble: tasks 09–14 added. 09: a read
  starts only after 300 ms on screen, one at a time (held `S` not reproducible in the demo; in the
  hand check). 10: embeds `credentialless` / `omit`, and `no-referrer` after the live check found the
  thread's path in every `Referer`; two live runs passed (carousel 5 slides, reels play, no session
  cookie, no referrer). 11: `pausedUntil` stored for 6 h, honoured by every tab; checked in Node with a
  fake `chrome.storage` (future pause → 0 fetches, refusal → +6 h, another tab's pause stops this one,
  no `chrome` → reads still go out).

## Pre-compact snapshot
<!-- Written by pre-compact.sh on every compaction, replaced whole. Edit above, not here. -->

**2026-10-23 13:24** - branch `main`

Next open task: **10 — embeds without the session's cookies: `credentialless` iframe for reels and video posts, `credentials: 'omit'` for the carousel fetch; live check of a carousel read**

### Recent commits
```
ed5e953 fix [S06 #09]: read an item's media only once it holds the screen, one read at a time
d00a5b4 doc [S06]: add no burst, cookieless embeds and a stored pause before the release
a4d3477 doc [S06 #08]: record the live check
0d51deb doc [S06 #08]: record the demo half of the live check
69cdcad chore [S06 #08]: record when the demo's actions and older pages run
```

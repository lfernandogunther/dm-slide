# Session — S06

## Status: IN-PROGRESS · 2026-10-23 · owner's go-ahead on the plan

## Next
Task 08: live check in a subagent (new tab, injected `dist/`, counts only). Then 09, the owner's hand check.

**Source branch:** main · **Working branch:** main
**Repo(s):** dm-slide · **PR:** none (solo)

## Open decisions
- Spec open question 1: stay stopped for the page's life (chosen) or a stored time.

## Tasks status
7 of 10. See tasks.md.

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

## Pre-compact snapshot
<!-- Written by pre-compact.sh on every compaction, replaced whole. Edit above, not here. -->

**2026-10-23 12:49** - branch `main`

Next open task: **05 — pace the queue: at least 1.5 s between two things told to Instagram**

### Uncommitted
```
?? docs/research-instagram-extensions.md
```

### Recent commits
```
7aab6a4 fix [S06 #04]: load older messages one page at a time, only when asked
687cfea feat [S06 #03]: stop every media read at Instagram's first refusal and say so
902a1ed fix [S06 #02]: play shares from their embed page only, without the private API
3b20ea7 doc [S06]: plan the move to no private API, history on request and backing off
398bc9a doc: extend principle 3 to reads, requests and Instagram's terms
```

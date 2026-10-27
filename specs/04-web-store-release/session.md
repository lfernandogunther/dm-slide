# Session — S04

## Status: DONE · 2026-10-27

## Next
Nothing: S04 is closed.

**Source branch:** main · **Working branch:** main
**Repo(s):** dm-slide · **PR:** none (solo)

## Open decisions
- None.

## Tasks status
12 of 12. See tasks.md.

## What was done
- 2026-10-22: the owner asked for a full README with screenshots and a Web Store release with
  automatic releases, and to amend the constitution for it. S04 drafted.
- 2026-10-22: tasks 01–08 built. Demo checked in a subagent (carousel, reel, Instagram view, close
  and reopen); four screenshots from it, read one by one: no real data. Release script run end to
  end in a scratch clone against a bare remote; workflow passes actionlint.
- 2026-10-22: pushed; v0.1.0 cut by the owner; the workflow built it (store job skipped, as meant)
  and the Release carries `dm-slide-v0.1.0.zip` (manifest at the root, 0.1.0). The owner registered
  as a developer, filled listing and privacy from `store/listing.md`, and submitted for review.
- 2026-10-22: task 10 deferred to the next release. Self-review: 8 flags, 7 fixed (privacy policy
  names the CDN, release job split from the read-only build, store job needs all four variables,
  release script fetches and typechecks first), 1 to task 12. Learnings sorted into NOTES.md.
- 2026-10-27: 10 proven by v0.1.2, whose tag uploaded the zip to the store and submitted it for
  review with no hand step. 12 done: the release workflow's actions pinned to commit SHAs, and
  Dependabot keeps the pins current.

## Pre-compact snapshot
<!-- Written by pre-compact.sh on every compaction, replaced whole. Edit above, not here. -->

**2026-10-27 10:55** - branch `main`

Next open task: **10 — owner, guided: store credentials for the workflow, proven by one tag that reaches the store** — deferred 2026-10-22: the owner uploads each release zip by hand; the store job stays skipped until its variables exist

### Recent commits
```
9686241 doc [S07 #08]: close learnings and promote them to NOTES
42c48cc doc [S07 #08]: record the self-review and its walk
fe25751 fix [S07 #08]: forget the preloaded item once the spare is swapped out
922bbbe fix [S07 #08]: keep a video already found and fail a no-video embed on two checks
0f547ff doc [S07 #07]: mark ROADMAP 07 done and note where a reel's start time goes
```

# Session — S04

## Status: IN-PROGRESS · 2026-10-22 · go-ahead with the defaults (0.1.0, public, federation)

## Next
v0.1.0 is in the store's review. When it is approved: the Web Store link goes in the README.
Then 11 — self-review. Task 10 is deferred (2026-10-22): releases reach the store by hand, zip
from the GitHub Release.

**Source branch:** main · **Working branch:** main
**Repo(s):** dm-slide · **PR:** none (solo)

## Open decisions
- None.

## Tasks status
9 of 11. See tasks.md.

## What was done
- 2026-10-22: the owner asked for a full README with screenshots and a Web Store release with
  automatic releases, and to amend the constitution for it. S04 drafted.
- 2026-10-22: tasks 01–08 built. Demo checked in a subagent (carousel, reel, Instagram view, close
  and reopen); four screenshots from it, read one by one: no real data. Release script run end to
  end in a scratch clone against a bare remote; workflow passes actionlint.
- 2026-10-22: pushed; v0.1.0 cut by the owner; the workflow built it (store job skipped, as meant)
  and the Release carries `dm-slide-v0.1.0.zip` (manifest at the root, 0.1.0). The owner registered
  as a developer, filled listing and privacy from `store/listing.md`, and submitted for review.

## Pre-compact snapshot
<!-- Written by pre-compact.sh on every compaction, replaced whole. Edit above, not here. -->

**2026-10-22 14:21** - branch `main`

Next open task: **09 — owner, guided: developer account, first submission by hand with the first release's zip**

### Recent commits
```
6eaf927 doc [S04]: mark tasks 02-08 done and record their learnings
b06f87e feat [S04 #08]: release on a v* tag to GitHub Releases and the Chrome Web Store
67a1106 feat [S04 #07]: add npm run release to bump, commit, tag and push a version
b232086 doc [S04 #06]: add the Chrome Web Store listing kit and promo tile
f5e7582 doc [S04 #04]: rewrite the README with screenshots, install, keys and privacy
```

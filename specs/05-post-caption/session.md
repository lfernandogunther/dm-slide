# Session — S05

## Status: IN-PROGRESS · 2026-10-27 · brought back on the embed page as its source

## Next
07 — self-review walk, close learnings.md and promote.

**Source branch:** main · **Working branch:** main
**Repo(s):** dm-slide · **PR:** none (solo)

## Open decisions
- None.

## Tasks status
6 of 7. See tasks.md.

## What was done
- 2026-10-22: the owner asked to fill the right column's empty space with the post's caption and,
  below it, the author's first comment with its date. S05 drafted and built on the private API.
- 2026-10-23: put on hold on the branch `05-post-caption`, because it read Instagram's private API.
- 2026-10-27: brought back. Two live reads of public embeds (isolated tab, keys and types only):
  the caption, the author and the counts are there, the comments and the post time are not. The
  owner chose the card: author ✓ · date, caption, music on reels, likes · comments · views; a
  photo shows its date only. Spec and tasks rewritten.
- 2026-10-27: 02 done. Both embed reads keep the post's facts from `contextJSON`, even with no
  video; `post(item)` adds the date from the shortcode and asks nothing. The field paths come from
  the live shape report and were not yet read against a real page: the owner's check (06) does that.
- 2026-10-27: 03 done. `.p-post` above the panel; `Stage.show` now says when the item's media read
  settled, and only then the overlay asks `post(item)`; a later move drops the answer. The card
  hides when the panel leaves under 72 px above it (hidden from a 370 px tall window in the demo).
- 2026-10-27: 04 done. Four demo items carry post data (a reel, a one-photo post with its date only,
  a carousel, a verified reel with music). Checked in the demo by a subagent: each card's text, line
  breaks, no card on the rest, quick moves never show another item's card, no console errors.
  Screenshot 01 retaken on the reel with its card.
- 2026-10-27: 05 done. PRIVACY.md names the caption, author, counts and music read from the embed
  page; the listing adds them to its description, host justification and data usage.
- 2026-10-27: 06 done. The owner checked a reel, a carousel and a photo on the real Instagram, with
  quick moves: all as specified.

## Inputs ingested

## Pre-compact snapshot
<!-- Written by pre-compact.sh on every compaction, replaced whole. Edit above, not here. -->

**2026-10-27 12:24** - branch `main`

Next open task: **07 — self-review, close learnings.md and promote**

### Uncommitted
```
 M specs/04-web-store-release/session.md
 M specs/05-post-caption/session.md
 M specs/05-post-caption/tasks.md
?? specs/05-post-caption/self-review.md
```

### Recent commits
```
d9436d6 doc [S05 #05]: name the post's caption, author and counts in the privacy policy and listing
b8e60b6 feat [S05 #04]: give the demo's posts invented captions and retake the player screenshot
af0f27b feat [S05 #03]: show the shared post's card above the reactions once its media read settles
0915ae7 feat [S05 #02]: keep a shared post's facts from its embed read and date it from its shortcode
8a73f46 doc [S05 #01]: bring S05 back with the public embed as its source
```

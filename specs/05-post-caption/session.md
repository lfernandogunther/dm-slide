# Session — S05

## Status: IN-PROGRESS · 2026-10-27 · brought back on the embed page as its source

## Next
06 — owner: hand check on the real Instagram.

**Source branch:** main · **Working branch:** main
**Repo(s):** dm-slide · **PR:** none (solo)

## Open decisions
- None.

## Tasks status
5 of 7. See tasks.md.

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

## Inputs ingested

## Pre-compact snapshot
<!-- Written by pre-compact.sh on every compaction, replaced whole. Edit above, not here. -->

**2026-10-27 12:03** - branch `main`

Next open task: **03 — player: the post card above the reactions, ported from the branch onto today's overlay; late answers dropped; hidden when squeezed**

### Uncommitted
```
 M demo/demo.ts
 M specs/04-web-store-release/session.md
 M specs/05-post-caption/spec.md
 M specs/05-post-caption/tasks.md
 M src/instagram/adapter.ts
 M src/instagram/media.ts
 M src/instagram/selectors.ts
?? src/instagram/post.ts
```

### Recent commits
```
8a73f46 doc [S05 #01]: bring S05 back with the public embed as its source
7e09aa8 doc [S07 #08]: bring the session log up to date
9686241 doc [S07 #08]: close learnings and promote them to NOTES
42c48cc doc [S07 #08]: record the self-review and its walk
fe25751 fix [S07 #08]: forget the preloaded item once the spare is swapped out
```

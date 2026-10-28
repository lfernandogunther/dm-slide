# Session — S08

## Status: SHIPPED · 2026-10-28 · v0.2.0

## Next
Nothing pending. v0.2.0 is in the Chrome Web Store's review.

**Source branch:** main · **Working branch:** main
**Repo(s):** dm-slide · **PR:** none (solo repo, commits on main)

## Open decisions
- None. R over Instagram's view stays in our box: the hand check showed the modal leaves the focus there.

## Tasks status
16 of 16; see tasks.md.

## What was done
- 2026-10-28: planned from labs 03 and 04, with three assumptions the owner confirmed:
  - n/N follows the filter.
  - A, D and the arrow keys stay Instagram's.
  - An item not read yet goes back to the player.
- 2026-10-28: self-review walked (11 fixed). The owner's hand check added tasks 13–16: the card's keys
  and countdown, auto-open once per visit, and A/D over Instagram's view. A/D missed the carousel's ‹ ›
  live until a numbers-only snippet measured it (46×62, over the 48 px cap). Hand check passed;
  learnings promoted to NOTES.
- 2026-10-28: committed (3b6860d), store texts pasted as a draft, released v0.2.0 (tag v0.2.0):
  the workflow built it, published the GitHub Release, uploaded to the store and submitted it for
  review. Wrapped.

## Inputs ingested

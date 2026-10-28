# Learnings — S08

## Learned
- 2026-10-28 — `embed/captioned/` sampled on 8 public posts (all 200, ~0.3–0.5 s, ~200–260 KB):
  - `.Caption` holds `a.CaptionUsername`, then the text with `<br>` for line breaks, then
    `div.CaptionComments` ("View all N comments"). Both must be removed, and every `<br>` turned
    into `\n`, or the card shows the author's name and a comment count inside the caption.
  - A post with no caption has no `.Caption`; the author then comes from `.UsernameText`.
  - A collab post carries the post's data as non-null `contextJSON` and two `.UsernameText`, the
    first not always the author; the JSON path (`keepFacts`) reads it with counts and the badge.
  - The parser, run live on 4 posts, returned clean captions (no "View all", no leading author,
    line breaks kept) and the author alone on the one without a caption.
- 2026-10-28 — Plan part 3 said every share counts as unplayable during the refusal pause, without
  being read. Dropped: a reel loaded before the pause stays cached and still plays, and carousels and
  photos fall back to the DM's own media. The stage already reports what can't play as it shows or
  preloads it, and the refusal makes those reads come back null at once, so the Set fills by itself.
  An item not read yet goes back to the player, where the 2 s rule opens it.

## Concepts learned

## Promoted

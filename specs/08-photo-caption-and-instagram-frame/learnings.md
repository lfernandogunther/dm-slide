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

## Concepts learned

## Promoted

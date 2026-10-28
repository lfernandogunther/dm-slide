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
- 2026-10-28 — Demo check (browser subagent, new tab, two unplayable neighbours): auto-open at
  ~2.0 s; W/S between them stayed in the view and stepping onto a playable item brought the player
  back; a revisited item did not reopen by itself; F reacted and moved on without reopening on a
  playable item; R's box took the focus, a typed W did not step, Esc hid only the box, Enter sent and
  the view reopened on the same item; the drag moved the bar, flipped the box above it in the lower
  half, and a double-click reset it. The kept spot needs `chrome.storage`, so it resets in the demo.
- 2026-10-28 — A/D over Instagram's view: Instagram itself has no key there for its carousel (A, D
  and the arrows did nothing, even with the focus on its close button). Ours now click its ‹ ›,
  found by place. The demo check passed every step (photo by photo both ways, stepping past either
  end, ↑/↓ as W/S, no console errors). Live, the first try missed the ‹ › and stepped to the next
  post instead. Measured with a numbers-only console snippet: the › is a 46×62 button, 23 px in from
  the photo's right edge at its exact mid-height, over the 48 px cap; the cap is now 72. The only
  other buttons over the photo are two photo-sized ones, and none in the comments counts.

## Concepts learned
- **Shown area vs. layout box:** `getBoundingClientRect()` ignores an ancestor's `overflow` clip, so
  a carousel's off-screen slides report full size. Intersecting the box with every ancestor whose
  overflow is not `visible` gives what is actually on screen.
- **DOMParser:** turns an HTML string into a document without running its scripts or loading its
  images, so a fetched page can be read as text only.

## Promoted
- `embed/captioned/` sample → NOTES (Playback, "A one-photo post's words are HTML"), already there.
- Plan part 3 dropped → stays here; the spec's edge case already says what replaced it.
- Demo check → stays here: the record of what the demo showed.
- A/D over Instagram's view → NOTES (Driving Instagram, "The bar over Instagram's view"), with the
  measured size and the focus answer.

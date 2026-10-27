# Learnings — S07

## Learned
- **2026-10-27 — `stage.show` preloads `items[current + 1]` whatever the direction or filter.**
  Found while planning: moving older, the preload reads an item the user is not going to, and the
  lane makes the item they did go to wait behind it. A wasted read, not only a slow one.

## Concepts learned

## Promoted

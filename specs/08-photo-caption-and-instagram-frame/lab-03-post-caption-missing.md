# 03-post-caption-missing — the card leaves out the author's caption on some shared posts
**Kind:** bug   <!-- idea | bug | question -->
**Status:** shaped   <!-- open | shaped | handed off | became | done | shipped | parked | dropped -->
**Opened:** 2026-10-27   **Closed:** —

## Decisions
- **2026-10-27 — Becomes a spec.** The owner chose "become a task"; the spec is made once lab 04 is shaped, so both are planned together.

## Drawings
<!-- local, in .lab/03-post-caption-missing/drawings/ -->

## Verdict
Confirmed, and by design: a one-photo share asks the network nothing, so its card has only the
date. The caption is reachable without the private API: a cookieless `fetch` of the post's
`/embed/captioned/` page (~0.4 s), parsed as HTML (`.Caption`, `UsernameText`), the same kind of
read carousels already make. Fix shape: for kind `post`, one such read in the existing lane, only
for the item on screen and the next, never cached past the page, and a refusal stops it like any
other read. Cost: one more request per photo share viewed.

## Rabbit holes & no-gos
- No `/api/…` call to get the caption, and no request beyond the item on screen and the next.
- No shell fetch of the embed page with faked browser headers.
- HTML scraping is more fragile than the JSON: a class rename silently empties the card. The
  selector lives in selectors.ts, and a miss just shows the date, as today.
- Never render the caption HTML: text only (DOMParser, no scripts, no innerHTML into our DOM).
- Out: comments other than the caption; "buscas" for reels and carousels, which already have it.

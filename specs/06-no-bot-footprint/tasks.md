# Tasks — S06

**8 of 10 done · next: 09 — owner hand check and release**

- [x] **01 — park S05 on the branch `05-post-caption`: commit its uncommitted work there, mark its session ON-HOLD with the reason; reset `main` to `origin/main`, cherry-pick the constitution amendment, rebase the branch onto it; discard the hook's snapshot in S04's session.md**
- [x] **02 — media: drop `/api/v1/media/…/info/`; reels and video posts from the embed page only, carousels from the embed data or the record's first slide; remove `mediaId`, `postInfo`, the app-id header and the media-type constants**
- [x] **03 — back off: one `pushedBack` check (redirect, 401/403/429, a challenge or login path, in a fetch and in the embed iframe) stops every read for the page's life; `adapter.pausedReason()`; the player says so once**
- [x] **04 — history only on request: no load on open or on moving; `W` at the oldest item or the wheel at the strip's top loads one page; drop the horizon, the page chain and the random pause**
- [x] **05 — pace the queue: at least 1.5 s between two things told to Instagram**
- [x] **06 — build guard: `npm run build` fails if the bundle contains `/api/`**
- [x] **07 — docs: NOTES.md (Playback, Loading older, Player motion), `PRIVACY.md`, `store/listing.md`, the README if it says any of this**
- [x] **08 — live check (subagent, new tab, injected `dist/`, counts only): 5 items → 0 `/api/` requests from us, embed loads ≤ visited + 1, 0 history pages until `W` at the oldest item, then 1; a forced redirect stops reads and shows the pill once**
- [ ] **09 — owner: hand check with the real extension in your own Chrome, then push and cut v0.1.1 (`npm run release 0.1.1`) and upload it to the store**
- [ ] **10 — self-review, close learnings.md and promote**

---

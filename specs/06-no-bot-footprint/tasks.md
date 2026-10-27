# Tasks — S06

**15 of 17 done · next: 17, then 14 — hand check and release**

- [x] **01 — park S05 on the branch `05-post-caption`: commit its uncommitted work there, mark its session ON-HOLD with the reason; reset `main` to `origin/main`, cherry-pick the constitution amendment, rebase the branch onto it; discard the hook's snapshot in S04's session.md**
- [x] **02 — media: drop `/api/v1/media/…/info/`; reels and video posts from the embed page only, carousels from the embed data or the record's first slide; remove `mediaId`, `postInfo`, the app-id header and the media-type constants**
- [x] **03 — back off: one `pushedBack` check (redirect, 401/403/429, a challenge or login path, in a fetch and in the embed iframe) stops every read for the page's life; `adapter.pausedReason()`; the player says so once**
- [x] **04 — history only on request: no load on open or on moving; `W` at the oldest item or the wheel at the strip's top loads one page; drop the horizon, the page chain and the random pause**
- [x] **05 — pace the queue: at least 1.5 s between two things told to Instagram**
- [x] **06 — build guard: `npm run build` fails if the bundle contains `/api/`**
- [x] **07 — docs: NOTES.md (Playback, Loading older, Player motion), `PRIVACY.md`, `store/listing.md`, the README if it says any of this**
- [x] **08 — live check (subagent, new tab, injected `dist/`, counts only): 5 items → 0 `/api/` requests from us, embed loads ≤ visited + 1, 0 history pages until `W` at the oldest item, then 1; a forced redirect stops reads and shows the pill once**
- [x] **09 — no burst: a media read starts only once an item has held the screen ~300 ms, and Instagram gets one read at a time**
- [x] **10 — embeds without the session's cookies: `credentialless` iframe for reels and video posts, `credentials: 'omit'` for the carousel fetch; live check of a carousel read**
- [x] **11 — the pause outlives a reload: a refusal stores `pausedUntil` (now + 6 h) in `chrome.storage.local`; every tab honours it**
- [x] **12 — self-review before the release (`/cn-self-review`, `/cn-self-review-walk`)**
- [x] **13 — the pause is 1 h, and the item card says when media is paused rather than broken**
- [ ] **14 — owner: hand check with the real extension in your own Chrome, then push and cut v0.1.1 (`npm run release 0.1.1`) and upload it to the store**
- [x] **15 — close learnings.md and promote (the self-review ran in 12)**
- [x] **16 — an embed that serves no video ("Watch on Instagram"): the card shows as soon as the embed says so, not after the 6 s wait, and its text stops blaming private accounts**
- [ ] **17 — reacting moves newer or older: a `↓ newer` / `↑ older` button beside "Next after reacting" (`afterReactDir`); older opens at the newest unreacted item and stops at the oldest loaded one, never loading history**

---

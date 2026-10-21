# S01 — Tasks

One commit each. `feat [S01 #NN]: ...` (docs-only → `doc`).

- [x] #01 — Spike on the real, logged-in Instagram (a throwaway DevTools script, not committed): prove listing reels with sender, shortcode and my reaction; playing one inline with sound; react and unreact ❤️; reply quoted and plain; loading older messages. Record the selectors and the plan-A/fallback verdict per piece in `learnings.md` (`doc`)
- [x] #02 — Scaffold: `package.json`, `tsconfig.json`, `manifest.json` (MV3, content script on `instagram.com/*`, acting only in `/direct/t/<id>/`), `scripts/build.mjs` (esbuild build + watch), a content script that logs on load. Loads unpacked. Declare the pre-commit `npm run typecheck`
- [x] #03 — `src/instagram/selectors.ts` + `adapter.listReels()` + `health()`: others' reels in send order with sender, time, shortcode, `myReaction`
- [x] #04 — `src/content/main.ts`: inject "▶ Reel Queue · N without ❤️" / disabled "No reels" into the thread header; re-inject on thread change (acceptance #1)
- [x] #05 — Player shell in Shadow DOM (`src/player/`): prototype layout, open/close, the start position rule, strip, ‹ ›, keys `A`/`D`/`←`/`→`/`Esc`, shortcuts off while typing, the thread following the current reel (acceptance #2, #3 nav, #8, #10)
- [x] #06 — Playback: the current reel inline with sound, loop, `Space`/click pauses, the next one preloaded, an "unavailable" card (acceptance #3)
- [ ] #07 — React: `adapter.react`/`unreact` with the row re-check; `F` and the ❤️ button; "Next after ❤️"; strip and counter update; settings in `chrome.storage.local` (acceptance #4)
- [ ] #08 — Reply: `adapter.reply` quoted or plain; `R`, `Enter`, the "Quote this reel" toggle; a sent toast (acceptance #5)
- [ ] #09 — Lazy loading: strip sentinel + `A` at the edge → `adapter.loadOlder()`; keep the current reel in place; "start of chat" (acceptance #6)
- [ ] #10 — Groups (the sender on the video and in the placeholder) and a click on a reel card in the chat opening at that reel (acceptance #2, #7)
- [ ] #11 — Fail visibly: `health()` on open and a row re-check failure → a clear message, no action (acceptance #9)
- [ ] #12 — Manual click-through of every acceptance criterion on the real Instagram (1:1 + group); fix rough edges; fill `learnings.md`

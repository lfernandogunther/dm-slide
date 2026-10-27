# Self-review — 07-faster-video-start
**Status:** reviewed   <!-- analyzed | walked | reviewed -->
**Range:** origin/main..HEAD (specs/07-faster-video-start, S07)
**Analyzed:** 0f547ff @ 2026-10-27
**Reviewed:** fe25751 @ 2026-10-27

## Findings
<!-- code-reviewer writes this section -->
1. MED · src/instagram/media.ts:101 — the abandoned-read abort throws away a read that was about to succeed and un-caches it, so a quick direction flip or W-then-S re-reads the same embed a second time; the spec says the cut "saves lane time, never a request" and "no more embed reads per item visited than before" · evidence: at A with B's preload in flight, press W (target=Z, B no longer wanted, poll finishes null, `cache.delete` at line 156), press S back: show(A) preloads B again = second embed load of B; before S07 the first read ran to the end and was cached. Also the `wanted()` check runs before `readVideoUrl`, so a URL that is already in the frame on that very tick is dropped; check it after reading the URL. Decide whether the trade is acceptable and say so in the Outcome.
2. MED · src/instagram/selectors.ts:68 — `.EmbedBrokenMedia` is a fail-at-once signal with thin evidence: 5 of 5 on never-playable pages, "never seen on a playable one" from a handful of reels; the fast fail is also confirmed "by eye", with no probe number · evidence: learnings.md 2026-10-27 (3 of 3) and NOTES.md (5 of 5). The poll still takes the URL first (media.ts:103-105), so only an embed that shows the broken class before its video would be failed; a transient broken page (rate limit) is failed fast and not cached (retried on next show), which is fine. Cost of a false positive is an item shown as "Can't play" that would have played.
3. LOW · src/player/stage.ts:342 — `ready` is set whenever a preload resolves, even when its ticket is stale (kept alive by `target === next`), and is never cleared when `spare` is overwritten by a later preload or the item's media is evicted; it only skips the settle, and the cache holds found media, so no extra read, but "ready" does not mean "spare holds it" (a ready item shown later may not be instant) · evidence: preload(B) sets spare.src=B, then preload(C) overwrites spare while ready=C; ready=B never matches again, harmless. Order-dependence: preload's continuation must run before show's continuation on the same promise for `play` to see spare.src===url (works today because preload awaited first).
4. LOW · src/instagram/media.ts:148 — every cache hit pushes another `wanted` closure into `entry.wanted`, never pruned; now that a skipped settle means a ready item is re-asked on every visit, the array grows for the life of the page · evidence: `found.wanted.push(wanted)`; closures capture only a ticket number, so memory is small.
5. LOW · src/player/stage.ts:388 — a ready item shown with the settle skipped still applies media at once (sets `current.src`, starts playback) during a held key, though no request is made (the mp4 was already preloaded into the spare); the held-key guarantee holds because the preload awaits `settled` and the ticket check follows. Verified: no read for an item passed through · evidence: show() reads cache only for `shown`, preload(next) after `await settled` is skipped on a stale ticket.
6. LOW · demo/demo.ts:125 — demo only gained an `id` in the `demoTold` log; no behaviour change, `wanted` is not honoured by the demo adapter so the abort path is not exercised there · evidence: `log(..., item.id)`.
7. Checked, no finding: `npm run typecheck` passes and `npm run build` passes (dist/content.js 87.7kb, dist/page.js 18.9kb); selectors only in src/instagram/selectors.ts; copy is English; no message content stored; direction logic: go() computes `ahead` after `current = index`, so the filter's `i === current` rule applies, dir<0 maps to neighbour(-1) (older) matching prev(); a jump with dir 0 follows afterReactDir.

## Fixes
### 1 · MED · src/instagram/media.ts:101
**Fix**
> In the poll, read the URL before asking `wanted()`: `const url = refused ? null : readVideoUrl(frame); if (url) return finish({type:'video', url});` then `if (!wanted()) return finish(null);`. A URL already in the frame is kept and cached whatever the user did, so the first read is never wasted. For the remaining case (an abandoned read with no URL yet, which `fetchShare` un-caches at :156), the second load of the same embed is the price of freeing the lane; either accept it and write that in the spec Outcome ("saves lane time, never a request" holds only for reads that had a URL), or keep a null from an abandoned read out of `cache.delete` by marking it so a re-show within a short window does not re-read. Recommend the first option.
**Effort:** small · **Outcome:** agora

### 2 · MED · src/instagram/selectors.ts:68
**Fix**
> Keep `.EmbedBrokenMedia`, but fail on it only after it has been present on two consecutive polls (50 ms apart) and still no video, so a transient render of the class before the `<video>` appears cannot fail a playable reel. Alternatively widen the evidence first: run the probe on the next playable-heavy thread and record how many playable reels ever showed the class before their video (expected 0). Add the number to learnings.md either way.
**Effort:** medium (a counter in `fromEmbed`'s poll) · **Outcome:** agora

### 3 · LOW · src/player/stage.ts:342
**Fix**
> Clear `ready` when the spare is overwritten: set `ready = next` only after the `spare.src` / `Image` assignment succeeds, and reset it to null whenever `spare.src` changes to another item's URL. Optionally set it only when the preload's ticket is still current. No read changes, so no test needed; the point is that `ready` then means "spare holds it".
**Effort:** small · **Outcome:** agora

### 4 · LOW · src/instagram/media.ts:148
**Fix**
> Stop pushing onto `found.wanted` for a settled entry: once `entry.media` has resolved non-null, `wanted` no longer matters, so skip the push when the cached media is already settled (track `entry.done = true` in the `.then`), or cap the array by dropping closures that return false.
**Effort:** small · **Outcome:** agora

### 5 · LOW · src/player/stage.ts:388
**Fix**
> No change: the reviewer verified a held key still reads nothing, and the instant apply uses an already-preloaded mp4. Dismiss in the walk.
**Effort:** small · **Outcome:** agora

### 6 · LOW · demo/demo.ts:125
**Fix**
> No change: a log argument only. Dismiss in the walk.
**Effort:** small · **Outcome:** agora

<!-- /cn-self-review-walk fills each Outcome -->

## Later
<!-- flags I chose to fix in a follow-up — they become tasks.md items -->

## Dismissed
<!-- flags I decided against, one line of reason each -->

## Decision
6 fixed (5 and 6: no change, per their own fix) · 0 later · 0 dismissed · checks: green (typecheck + build)


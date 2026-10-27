# Self-review — S05 post-caption (tasks 02–05)
**Status:** reviewed   <!-- analyzed | walked | reviewed -->
**Range:** 8a73f46..HEAD
**Analyzed:** d9436d6 @ 2026-10-27
**Reviewed:** 7996290 @ 2026-10-27

## Findings
1. MED · src/instagram/media.ts:205-208 — a reel read that ends without a video (cover / "Watch on Instagram") deletes its cache entry, so reopening it loads a new embed iframe even though its facts were already kept; the card then shows from `facts` but Instagram is asked again, against "opening the same item again asks Instagram nothing new" · evidence: `if (!media) cache.delete(shortcode)` runs for every null, and `keepFacts` in `finish` (line 157) stores facts for that same null. Pre-existing "a miss is asked again" rule; decide whether a miss that kept facts should stay cached.
2. LOW · src/player/overlay.ts:~473 (the `else if (views !== null)` branch in `postParts`) — "Original audio" is keyed on views being present, not on the reel's own flag: a reel whose `video_view_count` is missing shows no audio line, and a reel with `artist_name` but no `song_name` (`music` null in media.ts `keepFacts`) is labelled "Original audio" · evidence: `music: artist && song ? ... : null`; `clips_music_attribution_info.uses_original_audio` is in learnings.md 2026-10-27 but never read.
3. LOW · src/instagram/post.ts:11-17 and overlay.ts POSTED_AT — the decoded time ran up to 2.4 h early on a reel (learnings), so a post made just after local midnight can show the previous day; spec accepts "to the day" but the timezone is the viewer's · evidence: `POSTED_AT.format(postedMs)` uses local time; no rounding or "~" hint.
4. LOW · src/instagram/post.ts:6-18 — the shortcode decode (BigInt, 11-char cap, alphabet, `ms <= sentMs` guard) has no recorded known pair in learnings.md or the code, so correctness rests on the three live matches described in prose; the guard silently turns a wrong sent time (NaN from `Number(message.timestamp_ms)`, page.ts:175) into "no date" · evidence: typecheck and build pass, but nothing pins `(id>>23)+1314220021721`; constitution #6 allows no tests, so a one-line known value in a comment would do.
5. LOW · src/player/overlay.ts renderPost call in `show` flow (~line 507) — the card (and the date for a photo post) waits for the media read to settle, and `renderPost(null)` clears it on every move, so a cached or one-photo item flickers off/on and a slow reel read shows no card for up to the embed timeout · evidence: `renderPost(null)` runs before `stage.show(...).then(...)`; matches the spec ("once the item's own media read settles"), so a note rather than a defect.

Checked and clean: typecheck and build green (private-API gate included); no new request kind (`keepFacts` only reads the iframe's document / the carousel's already fetched HTML); text set via `textContent` only; selectors/alphabet/epoch live in selectors.ts; `[hidden]{display:none !important}` (style.ts:5) makes `.p-post{display:flex}` safe; late answers dropped by `ticket` plus `items[current] === shows`; gallery/story have `shortcode: null` so `post()` is null with no network; PRIVACY.md and store/listing.md match the code (memory only, no new permission); demo/demo.ts returns the same `Post` shape and covers verified, music, original audio, no-caption-with-date-only.

## Fixes
<!-- one block per flag; /cn-self-review-walk fills each Outcome -->

### 1 · MED · src/instagram/media.ts:205-208
**Fix**
> Only `cache.delete(shortcode)` on a null result when `keepFacts` stored nothing for that shortcode; a miss that kept facts stays cached, so reopening the reel loads no new iframe. Check the "a miss is asked again" rule still holds for misses with no facts.
**Effort:** small · **Outcome:** descartar

### 2 · LOW · src/player/overlay.ts:~473
**Fix**
> Read `uses_original_audio` in `keepFacts` into the facts, and show "Original audio" from that flag rather than from `views !== null`; show nothing when neither music nor the flag is present.
**Effort:** medium · **Outcome:** agora

### 3 · LOW · src/instagram/post.ts:11-17
**Fix**
> Unknown: whether to accept the up-to-2.4 h skew or add a "~" hint to the date; the spec accepts "to the day". Needs a decision, not a code read.
**Effort:** unknown · **Outcome:** descartar

### 4 · LOW · src/instagram/post.ts:6-18
**Fix**
> Add a one-line comment with a known shortcode and its expected date from the three live matches, so the epoch constant is pinned; no test (constitution #6).
**Effort:** small · **Outcome:** agora (synthetic pair: the three live codes were never recorded; it pins the decode, not the epoch)

### 5 · LOW · src/player/overlay.ts:~507
**Fix**
> No change: the flicker follows the spec ("once the item's own media read settles"). Note it in learnings.md, or dismiss.
**Effort:** small · **Outcome:** agora (learnings.md entry, no code)

## Later
<!-- flags I chose to fix in a follow-up — they become tasks.md items -->

## Dismissed
<!-- flags I decided against, one line of reason each -->
1 · src/instagram/media.ts:205-208 — a cover can be passing, and caching it would keep a reel unavailable until reload; the saving is one request on revisiting a rare reel that can't play here, and "a miss is asked again" is deliberate
3 · src/instagram/post.ts:11-17 — the spec promises the date to the day; a post made just after midnight showing the day before is rare, and a "~" would mark every card for it

## Decision
<!-- filled by the walk -->
3 corrigidos (2, 4, 5) · 0 pra depois · 2 descartados (1, 3) · checks: verde (typecheck, build)

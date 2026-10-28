# Self-review — S08 photo-caption-and-instagram-frame
**Status:** reviewed   <!-- analyzed | walked | reviewed -->
**Range:** `git diff fdee09d^..HEAD` (770f37b) plus working tree (specs/08.../session.md, tasks.md only). Widened from the requested `1f65e44^` so task #01's code (fdee09d, the caption read) is included.
**Analyzed:** 770f37b @ 2026-10-28
**Reviewed:** uncommitted @ 2026-10-28

## Findings
1 · MED · src/player/overlay.ts:905-932,953-958 · `frame()`, `frameSend()` and `frameStep()` set `afterBack` / `stepTo` and then call `adapter.closeLayer()`, ignoring its boolean. `closeLayer` returns false when "that view has no close key of ours" (adapter.ts:86, 215-222); the view then stays open, `afterBack`/`stepTo` stay set, and every later bar key hits the guard `if (afterBack || stepTo || opening) return` (lines 906, 940), so the bar goes dead, and a later Esc by hand fires the stale action. Evidence: no code path ever resets them except `comeBack`/`stepAcross`.
2 · MED · src/player/overlay.ts:918-924 + spec open question 2 · `showFrameReply(true)` does `frameText.focus()` under Instagram's modal; whether the modal pulls focus back is unresolved (task 10 open). If it does, the keys the user types as a reply fall outside `isTyping` and `editable(e)`, so `w`/`s`/`f`/`i` act as bar keys (F reacts, I closes the view, W/S step) while the user believes they are typing. Evidence: keys.ts only protects events whose composed target is the box.
3 · MED · specs/08.../tasks.md:20, spec.md Outcome table · Acceptance "owner's hand check passes on the real Instagram" is not done; Outcome table is empty. The only evidence for the 2 s rule, W/S reopen, F/R and the drag is the fake-data demo (learnings.md), and the real-DOM paths (closeLayer, openLayer under a `[role=dialog]`, focus) are exactly what the demo cannot exercise. No automated test exists either (constitution #6), so keys.ts's new away-branch has only that check.
4 · MED · src/player/overlay.ts:339-342 (`unplayable` set) · Items are added by `cantPlay` and never removed. A reel that missed once (6 s embed timeout, a transient failure, or a null read during a refusal pause; media.ts `fetchShare` deliberately re-asks on the next show) stays "known not to play" for the whole player session, so W/S from the bar keep stepping through Instagram's view into an item that could now play, and `reopen` re-opens it. Evidence: grep shows `unplayable.delete` nowhere.
5 · LOW · specs/08.../spec.md (edge case "pause starts while the frame is up: W/S treat every share as unplayable") · Not implemented; learnings.md records the drop and why, but spec.md still states the old behaviour. Reconcile the spec (or acceptance wording) so the hand check does not test for it.
6 · LOW · src/player/overlay.ts:361-366, 1046 · Auto-open is stopped when the key card or tips open (`showKeyCard`, `holdTips`) only at the moment they open. A card that can't play appearing while the first-run key card is already up arms a fresh timer (`cantPlay` -> `armAutoOpen`) and opens Instagram's view over the key card after 2 s. Evidence: `armAutoOpen` checks `openInInstagram`/`autoOpened`/`autoTimer` only, never `coach.hidden`.
7 · LOW · src/player/overlay.ts:628-650 · React that does not move (`removing`, `nextAfterReact` off, no neighbour) does not call `go()`, so does not call `stopAutoOpen`; the pending auto-open still fires after a user action on the item. Spec says "never after the user moved, typed, or closed"; reacting in place is outside that wording, but worth a deliberate decision.
8 · LOW · src/player/settings.ts:15-21 · `loadSettings` spreads storage unvalidated: `barSpot` of the wrong shape (`{}`, string, NaN) flows into `placeBar` (overlay.ts:~1000), yielding `NaNpx` (ignored by the style, so the bar silently reverts to top) rather than a clean `null`. Only our own code writes it, so low; a shape check (two finite numbers) costs one line.
9 · LOW · src/player/style.ts `.p-frame-reply` / overlay.ts `placeBar` · The bar is clamped to the window but its 340 px reply box is not; a bar dragged near the right edge puts the reply box (left:0, width 340) partly off-screen. Evidence: `placeBar` only uses `bar.width` / `bar.height`.
10 · LOW · src/player/overlay.ts:844-858, 906-958 · The open sequence `openView -> setAway(true) -> watchLayer` is written three times (`instagramView`, `reopen`, and a variant in `stepAcross`); the "can't open" and "closed meanwhile" handling differ slightly between them. One `enterAway()` helper would keep them in step.
11 · LOW · src/instagram/selectors.ts:56 · `EMBED_PATH` is widened to `/embed(/captioned)?/?$` for every caller, including the reel iframe check at media.ts:125, where a redirect to `/embed/captioned/` would now count as "not pushed back". Probably harmless; a separate pattern for the captioned fetch would keep the reel check strict.
12 · LOW · src/player/keys.ts:~45 · Shift+letter (`W`, `R`) also passes `FRAME_KEYS` (lowercased); only meta/ctrl/alt are excluded. Same as the existing `I` handling, so consistent, but it takes Shift+W from Instagram's view as well.
13 · LOW · store/listing.md:6-9 · One paragraph line far exceeds the 100-column wrap used in the rest of the file (nit). PRIVACY.md and the storage and host justifications match the code (new `openInInstagram`, `barSpot`, the captioned read, 2 s auto-open) as far as I could check.

## Fixes
<!-- one block per flag; /cn-self-review-walk fills each Outcome -->

### 1 · MED · src/player/overlay.ts:905-958
**Fix**
> In `frame()` (react path), `frameSend()` and `frameStep()`, use the result of `adapter.closeLayer()`: if it returns false, clear `afterBack` / `stepTo` right there (and leave the bar as it is) so the guard at the top of each does not block every later key. Three call sites, same two lines.
**Effort:** small · **Outcome:** agora

### 2 · MED · src/player/overlay.ts:918-924
**Fix**
> Unknown until the hand check (task 10) shows whether Instagram's modal pulls focus from `frameText`. If it does, fall back as spec open question 2 says: R closes the view and replies from the player's own box, then reopens. Cheap guard meanwhile: in the bar key handler, ignore W/S/F/I while `frameReply` is visible and `frameText` is not the focused element, so a stolen focus never turns typed letters into actions.
**Effort:** unknown · **Outcome:** no change needed: the hand check typed and sent from the box, the modal kept no focus

### 3 · MED · specs/08.../tasks.md:20, spec.md Outcome table
**Fix**
> Not a code change: run task 10 on the real Instagram (captions, auto-open, keys in the modal, F/R after the close, the drag), then fill the Outcome table in spec.md. Flag 2 and 4 depend on what it shows.
**Effort:** unknown · **Outcome:** done: task 10 passed, Outcome table filled

### 4 · MED · src/player/overlay.ts:339-342
**Fix**
> Delete an id from `unplayable` when the stage later shows or preloads that item as playing (the same hook that calls `cantPlay`, with the opposite result). I have not read the stage hook, so confirm where "it played" is reported before editing; if the stage has no such signal, add one in `stage.ts`.
**Effort:** medium · **Outcome:** agora

### 5 · LOW · specs/08.../spec.md (edge case, pause starts while the frame is up)
**Fix**
> Edit that edge-case line in spec.md to the behaviour in learnings.md: items read before the pause keep playing; an unread one goes back to the player, where the 2 s rule opens it.
**Effort:** small · **Outcome:** agora

### 6 · LOW · src/player/overlay.ts:361-366
**Fix**
> In `armAutoOpen`, return early when the key card or tips are showing (`!coach.hidden`, as the code names it), and re-arm when they close.
**Effort:** small · **Outcome:** agora

### 7 · LOW · src/player/overlay.ts:628-650
**Fix**
> Decision first: should reacting in place cancel the pending auto-open? If yes, call `stopAutoOpen()` at the start of `react()`; the spec wording ("moved, typed, closed") does not require it, so "dismiss" is also valid.
**Effort:** small · **Outcome:** agora

### 8 · LOW · src/player/settings.ts:15-21
**Fix**
> After the spread in `loadSettings`, keep `barSpot` only if it is an object with two finite numbers, else set it to `null`.
**Effort:** small · **Outcome:** agora

### 9 · LOW · src/player/style.ts `.p-frame-reply` / overlay.ts `placeBar`
**Fix**
> In `placeBar`, when the bar's left plus 340 px exceeds the window width, anchor the reply box to the bar's right edge (`right: 0; left: auto`), the way the lower half already flips it above. Needs a hand look at the class that does the flip.
**Effort:** medium · **Outcome:** agora

### 10 · LOW · src/player/overlay.ts:844-858, 906-958
**Fix**
> Extract `enterAway()` for `openView -> setAway(true) -> watchLayer` and call it from `instagramView`, `reopen` and `stepAcross`; keep each caller's own "closed meanwhile" check. Touches three functions, no signature change. Optional: pure refactor.
**Effort:** medium · **Outcome:** agora

### 11 · LOW · src/instagram/selectors.ts:56
**Fix**
> Restore `EMBED_PATH` to its strict form for the reel check at media.ts:125 and add a second pattern (e.g. `CAPTIONED_PATH`) for the captioned fetch, used only there.
**Effort:** small · **Outcome:** agora

### 12 · LOW · src/player/keys.ts:~45
**Fix**
> Consistent with how `I` already behaves, so likely dismiss. If Shift+W should stay Instagram's, add `e.shiftKey` to the exclusion next to meta/ctrl/alt for FRAME_KEYS only.
**Effort:** small · **Outcome:** agora

### 13 · LOW · store/listing.md:6-9
**Fix**
> Re-wrap the over-long paragraph line at 100 columns, text unchanged.
**Effort:** small · **Outcome:** agora

## Later
<!-- flags I chose to fix in a follow-up — they become tasks.md items -->

## Dismissed
<!-- flags I decided against, one line of reason each -->

## Decision
<!-- filled by the walk -->
11 corrigidos (1, 4–13) · 0 pra depois · 0 descartado · checks: verde (typecheck + build)

2 and 3 closed by the hand check (2026-10-28): no change needed for 2, and 3 is done. Tasks 13–16 came after the review; their diff was re-read on the same day, with no new flag.

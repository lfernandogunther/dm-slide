# Self-review — S03 player-polish
**Status:** walked   <!-- analyzed | walked | reviewed -->
**Range:** 5f35d93~1..HEAD  (08ae249..15c3704, branch main, working tree clean)
**Analyzed:** 15c3704 @ 2026-10-22
**Reviewed:** uncommitted @ 2026-10-22

## Findings
<!-- code-reviewer writes this section -->
1. HIGH · src/player/overlay.ts:556 — the react→next timer is not cancelled by `I`: press F then I within the 850ms and `next()` runs while the player is away, so Instagram's view is opened for item N, the player comes back on item N+1 (not "the same item"), and `stage.show` autoplays that video with sound unseen behind the hidden player and `revealCurrent()` scrolls the chat under Instagram's layer · evidence: `instagramView` (669-688) only guards `reacting || sending`, both already false once react() resolves (547); the timer callback (556-558) checks `!closed && items[current] === item` but never `away`; nothing clears `reactNextTimer` except react() and close() (784).
2. MED · src/player/overlay.ts:675 — "I acts only when no action is in flight" omits a running load-older: fetchOlder (444-478) keeps paging while away, scrolling the thread to its top (and `revealCurrent()` at 476 scrolls it back) under Instagram's layer, and a pending `prev()` (495-507, awaiting `olderShown`) calls `go()` while away, same wrong-item/autoplay outcome as flag 1 · evidence: the busy-wait at 453 tests only `reacting || sending`; neither fetchOlder nor prev() tests `away`.
3. MED · src/player/overlay.ts:671 and 803 — the result of `adapter.closeLayer()` is ignored, so for a story (which opens as a page, not a dialog: selectors.ts:107 comment, adapter.ts `layerOpen` path branch) `I` and the Back chip do nothing: `closeLayer()` returns `{ok:false}` when `openLayerDialog()` finds no dialog (page.ts), and the player stays hidden until the user leaves by Esc/browser back · evidence: closeLayer is `false`-returning by contract (adapter.ts "false when that view has no close key of ours"), yet both call sites drop it; stories are a core kind (KIND_ICON, story branch in sourceOf). Decision needed: for a page-view, should `I`/Back do `history.back()`, or is Esc-only acceptable (spec says Instagram's ✕, Esc, or `I`)?
4. LOW · src/player/overlay.ts:557 — the dropped-move rule only compares `items[current] === item`, so W then S back onto the same item inside the 850ms still fires the stale move · evidence: `go()` (413) never clears `reactNextTimer`; clearing it in go() and in instagramView would fix this and flag 1 together.
5. LOW · src/player/overlay.ts:677 — `setAway(true)` hides the player before the layer exists, so an Instagram layer that is slow or never opens shows the bare chat for the whole retry window, and `layerOpen()` (adapter.ts:183) is true for any other media dialog, which would end the wait without the item's layer being open · evidence: setAway at 678 precedes `await adapter.openLayer` at 680; layerOpen matches any `[role=dialog]` with media >= 200px. Unverified live (NOTES.md already marks the dialog shape as unconfirmed).
6. LOW · src/player/stage.ts:75 — the loading cover's `<img>` has no `onerror`, so an expired signed thumbnail leaves a broken image under the bar and on the won't-play card, while the strip tile falls back to its number (strip.ts:47) · evidence: grep finds `onerror` on the strip's img but none on `coverImg`; the spec's expiry edge case names tiles only, so this is a judgement call.
7. LOW · src/player/stage.ts:27 — two blank lines after the constants · evidence: lines 27-28.

Checked and fine: `npm run typecheck` and `npm run build` pass; seenKeys is a boolean (settings.ts) and settings hold no message content; `I` never acts in the reply box (keys.ts isTyping returns before the `i` action, and the away branch tests `editable`) nor while reacting/sending; src/player/ imports Instagram only through the ThreadAdapter, with all new selectors in selectors.ts and the new page ops in page.ts; reduce-motion goes through `animate()` (motion.ts) for every transform motion, with CSS covering the loading bar and skeletons; icons, manifest `icons`/`action.default_icon` and the build copy (SVG excluded) are consistent and dist/icons holds the four PNGs; first-open card shows once and `?` toggles it; reply bubble sending/sent/failed states match the spec.

## Fixes
<!-- one block per flag; /cn-self-review-walk fills each Outcome -->

### 1 · HIGH · src/player/overlay.ts:556
**Fix**
> In `instagramView` (669-688), clear `reactNextTimer` before `setAway(true)`; in the timer callback (556-558) also bail when `away`. The pending move is dropped, so the player returns on the same item, paused.
**Effort:** small · **Outcome:** agora — fixed

### 2 · MED · src/player/overlay.ts:675
**Fix**
> Make `I` a no-op while a load-older runs (reuse whatever flag fetchOlder (444-478) keeps; add one if none), and add an `away` bail to the `fetchOlder` loop (453) and to `prev()`'s wait (495-507) so neither scrolls the chat or calls `go()` while away.
**Effort:** medium · **Outcome:** agora — fixed (`I` also no-ops while `loading`)

### 3 · MED · src/player/overlay.ts:671 and 803
**Fix**
> Read the `closeLayer()` result at both sites. When it is `{ok:false}` (a page view such as a story), call `history.back()` and wait for `layerOpen()` to turn false before `setAway(false)`. Decision for you: this, or Esc-only. Not verified how Instagram routes a story page; confirm by hand before choosing.
**Effort:** unknown · **Outcome:** depois

### 4 · LOW · src/player/overlay.ts:557
**Fix**
> Clear `reactNextTimer` at the top of `go()` (413), so any move cancels the pending react-next. Lands together with flag 1.
**Effort:** small · **Outcome:** agora — fixed

### 5 · LOW · src/player/overlay.ts:677
**Fix**
> Cannot name it yet: the dialog shape is unconfirmed (NOTES.md). Options are to hide only once `openLayer` resolves, or to narrow `layerOpen()` to the dialog whose media matches the item. Needs one hand check on the real Instagram first.
**Effort:** unknown · **Outcome:** depois

### 6 · LOW · src/player/stage.ts:75
**Fix**
> Add `coverImg.onerror` that hides the cover image, as strip.ts:47 does for its tile.
**Effort:** small · **Outcome:** agora — fixed

### 7 · LOW · src/player/stage.ts:27
**Fix**
> Delete one of the two blank lines after the constants.
**Effort:** small · **Outcome:** agora — fixed

## Later
<!-- flags I chose to fix in a follow-up — they become tasks.md items -->
3 · src/player/overlay.ts:671 and 803 — `history.back()` when `closeLayer()` finds no dialog, after a hand check -> tasks.md 16
5 · src/player/overlay.ts:677 — hide only once the layer opens, or narrow `layerOpen()`, after a hand check -> tasks.md 17

## Dismissed
<!-- flags I decided against, one line of reason each -->

## Decision
<!-- filled by the walk -->
5 corrigidos · 2 pra depois (tasks.md 16, 17) · 0 descartados · checks: verde (typecheck + build)

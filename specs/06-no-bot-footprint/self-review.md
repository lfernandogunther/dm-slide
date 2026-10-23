# Self-review — 06-no-bot-footprint
**Status:** reviewed   <!-- analyzed | walked | reviewed -->
**Range:** git diff origin/main..HEAD (spec specs/06-no-bot-footprint), plus working tree (clean)
**Analyzed:** 544af1c @ 2026-10-23
**Reviewed:** uncommitted @ 2026-10-23

## Findings
1. HIGH · src/player/overlay.ts:478 (prev) + src/player/keys.ts:66 — a held W/↑ at the oldest item loads a page every time the previous one settles, not exactly one: keys.ts blocks `e.repeat` only for react slots, so repeat keydowns reach prev(); loadOlder() joins the in-flight load, but `loading` clears in `.finally`, so the next repeat starts another fetchOlder() (~2 s per page, spec cites 8 s timeout) · evidence: keys.ts:66 `if (slot !== null && e.repeat)` is the only repeat guard; overlay.ts:472-475 only dedups concurrent calls; spec #8 itself names holding W as the scenario; derived from code, not run live
2. MED · src/player/overlay.ts:858 — a trackpad swipe at the strip's top fires a wheel event per frame, and each one after a load finishes starts another page while scrollTop stays <40 (mergeOlder prepends, so the strip may stay near the top) · evidence: handler has no per-gesture guard or wheel-end check, same dedup-only loadOlder(); criterion "exactly one page per W" / "wheel at the strip's top loads one"; not run live
3. MED · src/instagram/media.ts:54-60,72-80 — one unusual item can pause every read in every tab for 6 h: any final path that is not `/embed/` (a cookieless embed of a private/restricted post bounced to login) counts as pushback and stores `pausedUntil` · evidence: pushedBack() treats every non-embed path as a refusal; the 2026-10-23 live check covered readable embeds only (learnings.md), no unavailable/private case is recorded; unverified guess, worth one live check on a private-account share
4. LOW · PRIVACY.md:17-22 and store/listing.md — "your cookies are not sent / same request as anyone not signed in" overstates: NOTES.md says that from the second embed on, the credentialless jar sends the anonymous device-id and csrf cookies the first embed set · evidence: NOTES.md "Embeds load without cookies or referrer" paragraph and learnings.md first entry; say "not your account's cookies"
5. LOW · src/instagram/media.ts:128-137 — a read already queued in `lane` still runs after the user moved on (no ticket check), so a quick S then pause leaves up to two stale embed loads, each still one at a time · evidence: stage.ts:365 cancels only after the settle, fetchShare has no cancel; within criterion "one at a time", but costs requests for items no longer on screen
6. LOW · specs/06-no-bot-footprint/spec.md Outcome table is empty and tasks 12-14 open (expected before release); also scope extras in the range: docs/research-instagram-extensions.md (265 lines), demo/demo.ts, session.md · evidence: git diff --stat origin/main..HEAD
Verified clean: typecheck and build pass; build guard fails and leaves dist untouched when `/api/` is injected (mutation run, then reverted); no fetch/XHR/Image to Instagram other than embed fetch (credentials omit, no-referrer) and iframe (credentialless, no-referrer); no `/api/`, app-id or shortcode decoding left; reaction retry removed, told() gaps reactions and replies by 1.5 s; no jitter left; stored pause read before first read and watched via onChanged.

## Fixes
### 1 · HIGH · src/player/overlay.ts:478 + src/player/keys.ts:66
**Fix**
> In keys.ts:66 widen the repeat guard to the item keys: return `e.preventDefault()` on `e.repeat` for W, ArrowUp, S and ArrowDown too, so a held key moves one item and, at the oldest, loads one page. Moving along loaded items by holding is a spec-8 scenario (~20 items/s); if that must keep working, instead block repeat only when `prev()` would load (a `prev` that finds no loaded neighbour and `edge !== 'start'` ignores `e.repeat`), by passing `e.repeat` into `actions.item`.
**Effort:** small · **Outcome:** agora

### 2 · MED · src/player/overlay.ts:858
**Fix**
> Make the wheel load one page per gesture: after `loadOlder()` resolves, require a wheel-idle gap (e.g. ignore wheel events until ~400 ms pass with none) or require `scrollTop` to have left the margin and come back before the next load. Smallest form: a `wheelArmed` flag, cleared when a load starts, re-armed by a debounce timer after the last wheel event.
**Effort:** small · **Outcome:** agora

### 3 · MED · src/instagram/media.ts:54-60,72-80
**Fix**
> Unknown what a cookieless embed of a private or unavailable post lands on. Run one live check (new tab, counts and final path only, a share from a private account) before v0.1.1. If it lands on login, treat an `/accounts/login` path from the embed as "unavailable" (item-level, no stored pause) and keep `/challenge/` and 429/403 as the pushback; if it stays on `/embed/`, no change.
**Effort:** unknown · **Outcome:** reworded (owner: test it on my private account's post) — no change

### 4 · LOW · PRIVACY.md:17-22, store/listing.md
**Fix**
> Replace "your cookies are not sent" with "your account's cookies are not sent" and drop "same request as anyone not signed in"; add that the embed may set anonymous ids that are not tied to your account, as NOTES.md says.
**Effort:** small · **Outcome:** agora

### 5 · LOW · src/instagram/media.ts:128-137
**Fix**
> Check a ticket (or the item's `current/next` membership) at the start of the job inside `lane`, so a read queued for an item that has left the current+next window returns without loading its embed. Touches the signature of the read call, so medium.
**Effort:** medium · **Outcome:** agora

### 6 · LOW · spec.md Outcome table, scope extras
**Fix**
> Fill the Outcome table after the walk and the owner's hand check (task 13/14). The research doc, demo/demo.ts and session.md belong to this spec (tasks 07, 08), so no change; nothing to remove.
**Effort:** small · **Outcome:** agora

## Later
<!-- flags I chose to fix in a follow-up — they become tasks.md items -->

## Dismissed
<!-- flags I decided against, one line of reason each -->
3 · src/instagram/media.ts:54-80 — checked live: a cookieless embed of a private account's post answers 200 on `/p/…/embed/` with `contextJSON: null` and no media, so it is unavailable, never a pushback.

## Decision
<!-- filled by the walk -->
5 corrigidos (1, 2, 4, 5, 6) · 0 pra depois · 0 descartados · 3 sem mudança, por teste ao vivo · checks: verde (typecheck, build + guard)
- 1 also passes `held` through S/↓; A/D at the oldest item still reach `prev()` without it.
- 5 checked in Node: a queued read whose item was left makes 0 fetches; a dropped preload joined by the item now on screen still fetches once.
- 6 needs no change now: the Outcome table is filled in task 14.
- 3: a nonexistent post (curl) and the owner's private-account post (live, fetch and iframe) both answer 200 on `/embed/` with no media: unavailable, no pause.

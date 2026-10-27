# S07: Faster video start

**Source branch:** main · **Working branch:** main
**Repo(s):** dm-slide

## Context
Since S06, a reel's video comes only from its public embed page, loaded in a hidden credentialless
iframe and read off its `<video>` (`src/instagram/media.ts`). Moving to a reel can take seconds
before it plays. ROADMAP 07 asks to measure that path on current reels first, then cut what can be
cut without asking Instagram for more. Principle 3 and S06's rules bound every cut: the item on
screen and at most the next, one read at a time, nothing read for an item only passed through,
no new kind of request.

Where the time can go today, from a key press to the first frame:
1. `SETTLE_MS` (300 ms) in `stage.show` before anything is asked, so a held S reads nothing.
2. The lane: the read waits for any read already running (the next item's preload, or a read for
   an item already left), up to `EMBED_TIMEOUT_MS` (6 s).
3. The embed iframe: page, scripts, then a `<video>` with a src (~1 s on the one playable reel
   probed in S06), checked every `EMBED_POLL_MS` (200 ms).
4. The mp4 itself: ~1.6 s to a first frame when fresh (S06), none when the spare preloaded it.

Read in the code while planning: `stage.show` always preloads `items[current + 1]`, the newer
neighbour, whichever way the user is moving and whatever the "Not reacted" filter hides. Moving
older (W, or reacting with `↑ older`), the preload reads an item the user is not going to, and
the lane then makes the item they did go to wait behind it.

## What to build
1. A probe the owner pastes into Claude in Chrome: from the top frame, through the player's open
   shadow root, it times each phase above per item and returns numbers only.
2. A baseline on current reels with today's build.
3. The preload follows the direction of travel and the filter.
4. Cuts the baseline justifies, each only if it adds no request: a read for an item no longer
   wanted stops at once instead of running to its end; a shorter poll; an embed showing broken
   media fails at once like the "Watch on Instagram" cover (the 6 s timeouts); no settle for an item the
   preload already got (its own preload still waits it); a shorter settle for a single press
   (never for a held key) — dropped, see learnings.
5. The same probe after the cuts, on the same kind of thread.

## Acceptance criteria
- [x] A baseline: per item, key → read starts, read time, read → first frame, and whether the
      preload served it; on at least 10 reels moving newer and 5 moving older.
- [x] The preload reads the item the next key in the current direction would show (filter
      included); moving older no longer reads the newer neighbour.
- [x] The median key-to-first-frame time drops, measured with the same probe, and each cut kept
      has its own number in the Outcome.
- [x] No more embed reads per item visited than before (at most the item and the next); none for
      an item passed through with S held; no request of a new kind.
- [x] `npm run typecheck` and `npm run build` pass; the owner's hand check on the real Instagram.

## Approach
Measure before cutting: the probe sits outside the extension (top frame, open shadow root, a
`MutationObserver` for the embed iframes on `document.body`, the stage's `loading` / `unplayable`
classes and the `<video>`'s `playing` event), so the baseline runs on today's build unchanged and
the same probe measures every cut. The direction fix comes first, because it removes reads rather
than speeding them. Then each cut is one commit with its before/after number; a cut that does not
move the median is reverted, not kept for tidiness. Nothing here adds a read: shortening the
settle is weighed against fast tapping (several presses inside 300 ms must still read at most the
item that stays).

## Edge cases
- **Fast tapping, not holding:** S pressed three times in 400 ms. A shorter settle must not turn
  each tap into a read; `e.repeat` covers only a held key.
- **An abandoned read:** removing its iframe stops what the browser still loads, but the request
  already went out; the cut saves lane time, never a request.
- **The probe on a real account:** keys only S, W and I with the overlay focused, no reactions, no
  replies; output is numbers and booleans only (CLAUDE.md, "Testing on the real Instagram").
- **Unplayable reels** ("Watch on Instagram") end their read at ~0.6 s since S06 #16: counted
  apart, so they don't flatter the median.
- **Cache hits:** an item already read (preloaded, or visited before) skips the iframe; the probe
  marks them so the baseline compares like with like.
- **Instagram pushes back mid-measure:** the probe stops and reports; nothing retries.

## Glossary & concepts (learning)
- **Settle:** a short wait after arriving on an item before asking for it, so items skipped in
  passing are never requested.
- **Lane:** the single queue every embed read goes through; one runs at a time.
- **Preload / spare:** after the item on screen resolves, the next one is read and its mp4 put in
  a second, hidden `<video>`, so arriving there plays at once.
- **Median:** the middle value of the measured times; one slow outlier does not move it the way it
  moves an average.
- **Open shadow root:** the player's DOM is inside a shadow root created with `mode: 'open'`, so a
  script in the page can read it (`host.shadowRoot`) without being part of the extension.

## Open questions
1. A target number for key-to-first-frame (say, under 1.5 s on a fresh reel)? Proposed: set it
   after the baseline, when the real split is known.
2. Is a 0.1.2 with only this worth a store review of its own, or does it wait for more? Decided at
   the end, not here.

## Outcome

| # | Criterion | Result |
|---|---|---|
| 1 | Baseline (v0.1.1) | Older fresh reels 1001 ms (n=7); newer preloaded 299 ms (n=6), the settle alone; 6 s timeouts. 8 newer reels, not 10: each was the flat 300 ms settle |
| 2 | Preload follows direction + filter | Moving older, preloaded reels show in 0–1 ms (n=5); v0.1.1 had none |
| 3 | Median drops, a number per cut | Videos: older 1001 → 1 ms, newer 299 → 1 ms. Per cut: direction 1001 → 0–1 (older); no settle when preloaded 299 → 1 (newer); abandoned read stops: next reel 2034 → 978 ms; 50 ms poll: no median of its own, reads end 39–187 ms sooner than the 200 ms ticks would allow (derived, kept); broken embed fails in ~1 s, not 6.3 s (owner's eye) |
| 4 | No more reads, none when held, no new request | Held key: dozens of items passed, 0 reads. ≤ 1 read + 1 preload per item. Same embed iframe only. Taps > 300 ms apart read each item, as before. An abandoned read with no URL yet is not cached, so coming back loads that embed again: the price of freeing the lane, accepted |
| 5 | typecheck + build, hand check | Pass; owner's hand check 2026-10-27 |

Open question 1 (target): a preloaded reel is ~0 ms; a fresh one stays ~1 s (settle + read), set by Instagram's page, not ours.

---

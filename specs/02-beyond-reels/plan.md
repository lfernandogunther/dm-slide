# Plan — S02

## Architecture
1. **Spike, read only.** In a real thread, for each kind, it answers these questions:
   - what the Relay record holds: the `xma.target_url` shape, or direct attachments with their
     image and video URLs;
   - whether an expired or unavailable item is flagged in the record;
   - which fiber prop marks the card in the chat (today `isReel`), and what a post, photo and story
     card carry instead;
   - what the media lookup returns for a post, a carousel and a story.

   The findings go to `learnings.md`. Every part below depends on them.
2. **Model (`src/instagram/`).**
   - `Reel` becomes `Item`, with `kind: 'reel' | 'post' | 'carousel' | 'story' | 'gallery'`, plus
     what is needed to resolve its media (a shortcode, or the record's own URLs).
   - `page.ts`'s `reelOf` becomes `itemOf`, which recognizes each kind and drops text and
     everything else.
   - `listReels` becomes `listItems`, and `reelAt` becomes `itemAt`.
   - The kinds are recognized in `selectors.ts`, like every other hook.
3. **Media resolution (`src/instagram/media.ts`, from `video.ts`).** `media(item)` returns one of
   three things, or `null` when the item is unavailable:
   - `{ type: 'video', url }`;
   - `{ type: 'photo', url }`;
   - `{ type: 'slides', slides: [...] }`.

   Shares resolve through the media lookup, with the reel embed as a fallback for reels only. Gallery
   items resolve from the record's own URLs. Results are cached per item, as they are today.
4. **Stage (`src/player/stage.ts`).**
   - It shows a photo (`<img>`), a video (the two-video swap as today) or slides (the current slide
     plus dots).
   - It exposes `slide(delta)`, which returns false at either end so the overlay moves to the
     neighbouring item.
   - Only the current slide's video plays.
5. **Keys (`src/player/keys.ts`).** It gets two actions instead of one pair:
   - `item(±1)`, bound to W/S and ↑/↓;
   - `step(±1)`, bound to A/D and ←/→, which tries `stage.slide` and falls back to `item`.
6. **Strip (`src/player/strip.ts`).** A kind icon next to the number. Rendering a filtered list
   keeps each tile's full-list number.
7. **Filter (`overlay.ts` and `settings.ts`).**
   - The new setting `onlyNotReacted` is toggled by a header button and by `U`.
   - The overlay keeps the full list and derives the visible one from it. The current item stays
     visible until the user moves, even once it is reacted.
   - With the filter on, `loadOlder` repeats until a new visible item appears or the start of chat
     is reached (up to 5 pages per request).
8. **Chat cards (`src/content/main.ts`).** The click hook opens the player for any media card that
   `itemAt` recognizes.

## Files to touch
| File | Change |
|---|---|
| `src/instagram/selectors.ts` | Kind patterns (post, story URLs; gallery attachment fields; card flags) |
| `src/instagram/page.ts` | `itemOf`, card recognition for every kind |
| `src/instagram/bridge.ts` | Raw item type with `kind` and media fields |
| `src/instagram/adapter.ts` | `Item`, `listItems`, `itemAt`, `media` |
| `src/instagram/video.ts` → `media.ts` | Photo, video and slides resolution |
| `src/player/stage.ts` | Photo and slides rendering, `slide()` |
| `src/player/keys.ts` | `item` and `step` actions, `U` |
| `src/player/strip.ts` | Kind icons, number from the full list |
| `src/player/overlay.ts` | Filter state and toggle, step fallback, empty-filter state, renames |
| `src/player/settings.ts` | `onlyNotReacted` |
| `src/content/main.ts`, `button.ts` | Renames, any media card opens the player |
| `constitution.md`, `ROADMAP.md`, `CLAUDE.md` | Amendment (with ok), phase 04 current, phase 02 note |

## Key decisions
- **Rename `Reel` to `Item` in one commit, before any behaviour change.** Keeping `Reel` with a
  `kind` field would leave every name lying about posts and photos. A rename mixed into the feature
  commits would bury the real diff.
- **Media resolution returns a shape, not a URL.** The alternative, a per-kind branch in the stage,
  spreads Instagram knowledge into `src/player/`, which CLAUDE.md forbids.
- **The filter derives the visible list from the full one.** Re-scanning with a filter in the
  adapter would make numbering and "stay until I move" depend on the adapter, and the numbers would
  shift on every toggle.
- **The current item stays visible after a reaction.** Hiding it at once would yank the stage
  mid-view. With auto-advance on, it leaves anyway.
- **Unavailable items are dropped only when the record says so.** Probing each item over the
  network before listing it would mean N lookups on open, which is the background activity principle
  3 rules out.

## Dependencies
- The spike finding a record field or a card flag for every kind. If a kind has none, it stays out
  of this spec and goes back to the roadmap. It is never guessed (principle 4).
- The media lookup answering for posts and stories the way it does for reels. If stories need
  another endpoint, the spike finds it, or stories fall back to "Open on Instagram".

## Gates this trips
- `npm run typecheck` throughout the rename task, until every caller is renamed. That task commits
  only once it is green.

# Plan — S08

## Architecture
1. **The captioned read** (`src/instagram/media.ts`, `selectors.ts`).
   - `fromEmbedCaptioned(path, own)` fetches `S.embedCaptionedUrl(path)` cookieless.
   - It checks `pushedBack` (whose embed-path test also accepts `/embed/captioned/`).
   - It parses the HTML with `DOMParser`, and keeps `{ author, caption }` in `facts`, the rest null.
   - It returns the DM's own media, so `fetchShare` caches it and the post is asked once.
   - `mediaOf` sends a non-video `post` through it.

   It is its own part because it is the only read here, and the only change Instagram can see.
2. **The setting** (`src/player/settings.ts`, overlay settings row).
   - `openInInstagram: boolean`, default true.
   - `barSpot: { x, y } | null`, default null.
3. **Knowing what can't play** (`src/player/stage.ts` → overlay).
   - The stage reports an unplayable item through a new callback. It fires from `unavailable()`,
     and from a preload that came back with no media while it was still wanted.
   - The overlay keeps those ids in a Set.
   - During the refusal pause, every share counts as unplayable without being read.
4. **Auto-open** (overlay).
   - A report for the item on screen starts a 2 s timer. When it fires, it calls `instagramView()`
     only if all of these still hold:
     - the same item is on screen;
     - we are not away;
     - the setting is on;
     - nothing is busy (`reacting`, `sending`, `loading`, `opening`);
     - the reply box is not focused, and help is closed;
     - the item has not auto-opened before (a Set).
   - `go()`, `close()`, focusing the reply box and opening help each clear the timer.
5. **The bar** (overlay HTML + `style.ts`).
   - `[data-back]` grows into the bar: grip, ‹ W, n/N, S ›, ❤️ F, Reply R, Back I.
   - Each part is a button of ours, and n/N comes from the same count as the strip.
6. **Keys while away** (`src/player/keys.ts`).
   - `w`, `s`, `f`, `r` and `i` are taken outside editable fields, through new actions.
   - When the target is inside our host (the bar's reply box), every key stops at our listener, so
     none reaches Instagram's modal.
7. **Stepping from the frame** (overlay). `frameStep(delta)` works out the target with `neighbour`,
   then:
   - **No target** (the oldest item): come back, then `item(delta)`, which loads older.
   - **Target known to be unplayable:** set `pendingStep`, then `adapter.closeLayer()`. When
     `watchLayer` sees the view closed, `go(target)` runs with the player kept hidden, then
     `openLayer` for the target.
   - **Any other target:** come back, then `item(delta)`.
8. **Acting from the frame** (overlay). `frameAct(fn)`:
   - Close the view and wait for `!layerOpen()`.
   - Run today's `react(slot)` or the bar's send through `adapter.reply`.
   - Wait while `reacting` or `sending`.
   - Reopen if the item on screen is still the same and still unplayable.
   - If the react moved on (`nextAfterReact`), the step rule of part 7 applies to the new item.
9. **The grip** (overlay).
   - Pointer events with pointer capture on the grip move the bar.
   - On release, the spot is saved and clamped to the window.
   - A double-click on the grip saves null, which puts the bar back at the top.
   - On resize, the bar is clamped again.

## Files to touch
| File | Change |
|---|---|
| `src/instagram/selectors.ts` | `embedCaptionedUrl`, `EMBED_CAPTION`, `EMBED_USERNAME`; `EMBED_PATH` accepts `captioned/` |
| `src/instagram/media.ts` | `fromEmbedCaptioned`; `mediaOf` routes one-photo posts through it |
| `src/player/settings.ts` | `openInInstagram`, `barSpot` |
| `src/player/stage.ts` | an unplayable callback, from `unavailable` and a wanted preload with no media |
| `src/player/overlay.ts` | unplayable Set, auto-open timer, bar, frame step/act, grip, the setting's toggle |
| `src/player/keys.ts` | w/s/f/r while away; keys stop at our host while typing in it away |
| `src/player/style.ts` | the bar, its reply box, the grip |
| `demo/demo.ts`, `demo/index.html` | an unplayable item; the layer behaves like Instagram's |
| `PRIVACY.md`, `store/listing.md` | the captioned read; the two new settings |
| `NOTES.md`, `README.md`, `ROADMAP.md` | the embed fact, the bar's keys, a roadmap entry |

## Key decisions
- **The caption comes from HTML parsed as text, not from running the page in an iframe.** The
  iframe path loads scripts and media for a photo we already have; one fetch is lighter and cannot
  run anything of Instagram's in our context.
- **F and R close Instagram's view while they run.** The alternative, driving the thread's toolbar
  and composer under the modal, could pick the modal for the emoji picker (both are
  `[role=dialog]`), or type into a comment box. The blink is the price.
- **Reopen after S only for an item known not to play.** Reopening for every item would click
  Instagram's card for items the player can show; going back to the player and letting the 2 s
  rule decide clicks nothing extra.
- **Instagram keeps Esc in its view**, its own close, which our poll already follows. A, D and the
  arrows were left to it too, until the hand check showed they do nothing there: they are ours now,
  turning its carousel through its ‹ › buttons (task 16).
- **One auto-open per item.** Without the Set, coming back with I would reopen the same item 2 s
  later, a loop.

## Dependencies
- The `embed/captioned/` markup (`.Caption`, `.UsernameText`) was seen on one post. Task 01 samples
  more posts before the parser is written. If the markup varies, the parser keeps only what is
  stable, and the card shows the author alone.
- Taking W/S/F/R inside Instagram's modal assumes it binds none of them. The owner's hand check
  confirms it.

## Gates this trips
None expected: `npm run typecheck` and `npm run build`. No tests exist (constitution #6).

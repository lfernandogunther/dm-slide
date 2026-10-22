# Plan — S03

## Architecture
Each part below is one module, and the parts come in dependency order.

1. **Adapter additions** (`src/instagram/`). Three read-or-act operations, all exposed through
   `ThreadAdapter`. They are separate because only this layer may know Instagram's markup.
   - **`Item.thumb: string | null`.** `sourceOf` already reads every share's preview with
     `photoOf(preview)` (`page.ts:108-111`) but drops it for reels. Keep it as `source.thumb` and
     copy it onto `Item`. A gallery item's thumb is its first stored photo, and a gallery video's
     is null.
   - **`rectOf(id): Rect | null`.** A new page op, `rect`. It finds the row with
     `findRow(list, id, true)` (exact match only), takes its largest image's bounding box, and
     returns null when that box is outside the viewport. It never scrolls.
   - **`openLayer(id): Promise<void>`** and **`layerOpen(): boolean`**. A new page op, `openLayer`.
     It clicks the row's media card once, exact row only, the way a person would; that is the same
     shape as `clickToolbar`. The layer's selector goes in `selectors.ts`. `layerOpen` reports
     whether that layer is on screen, so the player knows when to come back.
2. **`src/player/style.ts`**. The CSS moves here out of `overlay.ts`. It is about to double in size,
   and `overlay.ts` (568 lines) should keep only behaviour. This is a pure move, done inside task
   02.
3. **`src/player/motion.ts`**. One small wrapper around `el.animate()`:
   - it tracks every running animation, and `finishAll()` finishes them all;
   - it uses one easing constant;
   - when `matchMedia('(prefers-reduced-motion: reduce)')` matches, every named motion is replaced
     by an opacity crossfade.

   It sits apart because the stage, the strip and the overlay all use it, and finish-on-interrupt
   has to be one rule, not three.
4. **`src/player/cards.ts`**. Builders for the state card, the pill, the key card and the
   failed-control ring, each returning an element. The overlay decides when; this module decides
   how a state looks, so every state speaks in one voice.
5. **Stage / strip / overlay changes.**
   - `stage.ts` owns the slides' motion, the loading thumbnail and the volume slider.
   - `strip.ts` owns the thumbnails, the skeleton tiles and the follow animation.
   - `overlay.ts` owns the item motion, the react burst, open / close, the states and Instagram
     view.
6. **Keys** (`keys.ts`).
   - `?` toggles the key tips, and holding Alt shows them. The Alt keydown and keyup are handled
     before today's `altKey` early return.
   - `I` opens Instagram view.
   - Any key dismisses the key card.
   - Every key calls `motion.finishAll()` before it acts.

## Files to touch
| File | Change |
|---|---|
| `src/instagram/bridge.ts` | `ItemSource.thumb`; the `rect` and `openLayer` ops and their requests |
| `src/instagram/page.ts` | keep the preview as `thumb`; `rect()`; `openLayer()`; `layerOpen` in the scan or as its own op |
| `src/instagram/adapter.ts` | `Item.thumb`; `rectOf`, `openLayer`, `layerOpen` on `ThreadAdapter` |
| `src/instagram/selectors.ts` | the layer's selector, plus any constant the new ops need |
| `src/player/style.ts` | new: the CSS, moved out of `overlay.ts` and then reshaped to layout C v2 |
| `src/player/motion.ts` | new: the animate wrapper, `finishAll`, reduce-motion |
| `src/player/cards.ts` | new: the card, pill, key card and failed-control builders |
| `src/player/overlay.ts` | layout C v2, key tips, react burst, open / close, states, Instagram view; `openNotice` becomes the can't-read state |
| `src/player/stage.ts` | slide motion, loading thumbnail + bar, volume slider, won't-play card |
| `src/player/strip.ts` | thumbnails with a number fallback, skeleton tiles, follow motion |
| `src/player/keys.ts` | `?`, the Alt hold, `I`, any key for the key card, finish-on-key |
| `src/player/settings.ts` | `volume` and `seenKeys` |
| `src/content/main.ts` | the can't-read path opens the player frame; the open motion needs the card's message id |
| `icons/icon.svg`, `icons/icon-{16,32,48,128}.png` | new: the mark from lab 02, and its PNGs rendered once from the SVG |
| `manifest.json` | `icons` and `action.default_icon` |
| `scripts/build.mjs` | copy `icons/` into `dist/` |
| `NOTES.md` | the layer selector and anything learned about it |

## Key decisions
- **The icon's PNGs are rendered once and committed**, not built on every run. A renderer in the
  build would be a new dependency for four files that change only when the mark does. Headless
  Chrome renders them, and the command goes in NOTES.md.
- **The Web Animations API is used instead of CSS transitions toggled by classes.** `animate()`
  returns a handle that can be finished, which "a key finishes the current motion" needs. Class
  transitions can only be cut by removing the class, and that snaps the element to its end state
  mid-frame. The approved `motion.html` already works this way (`anim()` and `finishAll()`).
- **Motion never gates input.** A key calls `finishAll()` and acts in the same tick; nothing waits
  on `animation.finished` before handling a key. Queuing input behind motion loses on principle 5.
- **Thumbnails come from the record, not from `media()`.** One `media()` per visible tile would be
  a request per tile, which is a bot-like burst (principle 3). The preview is already in the
  record, so the only cost is the `<img>` itself.
- **Instagram view clicks Instagram's own card**, instead of navigating to `/p/<code>/` or framing
  the page. Navigating reloads the SPA and loses the player's state, and framing is blocked
  (`x-frame-options: DENY`). Stripping that header is a no-go (lab).
- **The can't-read state opens the player frame**, not a notice page, so it matches every other
  place-state. The frame is drawn without reading the thread: the header and an empty stage.
- **CSS moves to `style.ts` in task 02.** Moving it on its own would be a pure-churn commit, and
  doing it inside the layout task keeps the diff in one place.

## Dependencies
- **The owner's hand check of Instagram's layer** (lab Missing 1): whether a reel or a photo opened
  from the chat shows comments and a comment box. Task 13 starts only after it. If the layer turns
  out to be bare, Instagram view still ships, but the spec's promise of "reach comments" is
  re-asked first.
- **Preview coverage** (lab Missing 2). The owner runs a counts-only snippet during task 01. If
  many reels lack a preview, the number fallback carries them, and nothing else changes.
- **Option on Windows** (lab Missing 3). Not blocking: `?` is the fallback.
- **The exact-row match.** `rectOf` and `openLayer` reuse `findRow(..., exact)`. If that stops
  matching, both return null or fail, and the player falls back (fade) or says so (Instagram
  view). Neither ever guesses a row.

## Gates this trips
- None expected. `npm run typecheck` is the pre-commit gate, and `npm run build` runs per task.
  There are no automated tests (constitution #6). The acceptance bar is the manual click-through.

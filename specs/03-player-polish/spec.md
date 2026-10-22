# S03: Player polish — layout C, motion and states in one voice

**Source branch:** main · **Working branch:** main
**Repo(s):** dm-slide
**Origin:** .lab/01-polish-player-design-motion, .lab/02-extension-icon

## Context
S01 and S02 work end to end, but the player still looks and moves like the MVP prototype. The
whole key legend sits in the header, tiles are numbered grey boxes, a new item replaces the old one
with a hard cut, a reaction gives no feedback, and failures show as a red bar at the top.

Shaped in lab-01-polish-player-design-motion.md; drawings linked, not copied. The approved drawings
are local only (`.lab/` is not committed):
- `.lab/01-polish-player-design-motion/drawings/look-layout-c-v2.html`: look and layout.
- `.lab/01-polish-player-design-motion/drawings/motion.html`: motion. B is used for navigation and
  C for react and open / close.
- `.lab/01-polish-player-design-motion/drawings/states.html`: states. B is used everywhere except a
  failed action, which uses C.

The lab's appetite moved. `src/instagram/` gains three small additions: a thumbnail on `Item`, the
on-screen rect of a message, and opening an item's own Instagram layer. The fix rule still holds:
only `src/instagram/` knows Instagram's markup.

The extension's icon was shaped in lab-02-extension-icon.md; drawings linked, not copied (local:
`.lab/02-extension-icon/drawings/icon-concepts.html` for the shape, B; `icon-colour.html` for the
colour, F).

## What to build
1. **Layout C v2.**
   - The strip of thumbnail tiles stays vertical on the left. A tile without a preview falls back
     to its number.
   - The video sits alone in the middle.
   - A content-sized panel on the right shows only what there is: who sent it and when, the
     reactions, the reply box, the notes and replies, and "Next after reacting".
   - Below 1200px wide, the arrows float on the video and the panel narrows to 280px.
   - The header keeps the title, the position, the "Not reacted" filter, the Instagram view toggle
     and ✕. The key legend leaves the header.
2. **Key tips.** Holding Option (Alt), or pressing `?`, shows each control's key next to it.
3. **Volume.** Hovering the sound button opens a level slider, and `M` still mutes. The level is
   saved in `chrome.storage.local`.
4. **Motion.**
   - Items slide up and down in 300ms, and a carousel's slides slide sideways in 260ms.
   - The panel's sender and reactions rise 8px over 200ms, and the strip follows in 280ms.
   - A reaction pops its button, bursts a big emoji over the video, then flies it to the tile,
     where the badge pops. React → next moves at once; Instagram hears in the background.
   - Close (Esc) shrinks the video into its message in the chat. Open grows the video from the
     message, and the rest fades in 200ms later. If the message is off screen, both fall back to a
     fade-and-rise. The chat is never scrolled for an animation.
   - While an item loads, its thumbnail shows blurred with a thin bar at the bottom, then fades
     out when the media is ready.
   - Easing is `cubic-bezier(.2,.8,.2,1)`. With the system's reduce-motion setting on, every
     motion is a plain crossfade.
   - A key pressed during a motion finishes it at once and acts. Held keys never queue.
5. **States in one voice.** A state about where you are shows on the video as a card or pill that
   carries the keys acting on it. The result of an action shows on the thing acted on.
   - **All caught up** (the filter is on and nothing is left): an end card on the dimmed video
     with the count, and W look further back · U show all · Esc close.
   - **Loading older:** skeleton tiles at the top of the strip, and a "Loading older…" pill on the
     video. The video stays on the current item.
   - **Start of the chat:** the video bumps, and a "Start of the chat" pill shows for 2s.
   - **Won't play:** the blurred thumbnail with a card giving the reason, and I Instagram view ·
     S next.
   - **Can't read the chat:** the player's frame with a card saying what happened and "Nothing was
     done", a detail line, and I · Esc. This replaces today's `openNotice` page.
   - **Action failed:** the control that failed shakes with a red ring, and a line under it says
     the action didn't land and which key tries again.
   - **Reply:** the bubble appears at once, greyed while sending, then solid with a ✓. If sending
     fails, the bubble turns red with "Not sent · R to try again", and the text goes back in the
     box.
   - **First open:** a key card, shown only the first time: "Press any key to start · ? brings
     this back". The setting that records it holds no message content.
6. **Instagram view (`I`).** `I` pauses and hides the player and opens the current item's message
   in Instagram's own layer over the chat. Closing that layer brings the player back, paused, on
   the same item; the layer closes with Instagram's ✕, with Esc, or with `I` again.
   - If the message can't be found, the player says so and does nothing.
   - `I` never acts while a text box has focus.

7. **Extension icon.** The mark from lab 02: B, the queue — three portrait cards stacked like
   reels, the front one playing — in F, orange → pink (`#fa7e1e` → `#d62976` on the front card,
   bottom-left to top-right; the cards behind flat `#fa7e1e` at .62 and .35).
   - One SVG master, `icons/icon.svg`, and PNGs rendered from it once at 16, 32, 48 and 128,
     committed in `icons/`.
   - `manifest.json` declares them in `icons` and `action.default_icon`; the build copies `icons/`
     into `dist/`. No popup: the action only gives the icon a place on the toolbar.
   - If the cards behind blur at 16px, the 16px PNG gets its own simplified drawing of the same
     mark.

## Acceptance criteria
Checked by hand on the real Instagram, per CLAUDE.md "Testing on the real Instagram".
- [ ] Strip tiles show the item's thumbnail; a tile without one shows its number. The marks for
      kind, note, reaction and reply stay.
- [ ] Layout matches `look-layout-c-v2.html` at 1280×720 and at half a Full HD (960 wide: arrows
      on the video, 280px panel). The panel never shows an empty section.
- [ ] No key legend in the header. Holding Option, or pressing `?`, shows the key next to every
      control. Releasing Option, or pressing `?` again, hides them.
- [ ] The volume slider opens on hover and is easy to grab, with a hit target wider than the line
      drawn. The level carries across items and over a reload. `M` still mutes.
- [ ] W/S slide items vertically, and A/D slide a carousel's slides sideways. The panel and the
      strip follow. Holding S moves at the key-repeat rate, and nothing plays catch-up after
      release.
- [ ] Reacting with `6` (👍) shows pop, burst, flyer and badge. With "Next after reacting" on, the
      next item comes in at once.
- [ ] Esc shrinks the video into its message when the message is on screen, and fades otherwise.
      Opening from a card grows the video from that card.
- [ ] A slow item shows its blurred thumbnail and a bar, not a black box or "Loading…".
- [ ] With macOS "Reduce motion" on, every motion is a crossfade.
- [ ] Each of the eight states shows as drawn in `states.html`. Nothing moves or retries by
      itself.
- [ ] The first open shows the key card once, and `?` brings it back.
- [ ] `I` opens the item's Instagram layer. Instagram's ✕, Esc or `I` brings the player back,
      paused, on the same item. `I` typed in Instagram's comment box stays a letter. Checked by
      the owner by hand only.
- [ ] The extension shows the icon on `chrome://extensions` (128) and pinned on the toolbar (16),
      on a light and a dark Chrome theme; the cards and the play read at 16px.
- [ ] `npm run typecheck` and `npm run build` pass.

## Approach
See [plan.md](plan.md): three new player modules, three small adapter additions, then the work in
the order of the drawings.

## Edge cases
- **Thumbnail URLs expire.** Instagram's CDN URLs are signed. A tile whose `<img>` fails shows its
  number, the same as a tile with no preview.
- **The react flyer's target tile is off-screen or hidden by the filter.** The flyer fades where
  it is; the strip is never scrolled for it.
- **A reaction that fails after the player moved on.** Reactions wait in a queue told to
  Instagram one at a time, never during a reply. A failed one is tried once more, then undone:
  its tile rings red and shakes, and a pill names it by number.
- **Open / close while loading older pages.** The rect is read once at the start of the motion. A
  row moving underneath only makes the motion land slightly off, never act on the wrong message.
- **A non-quoted reply.** It isn't tied to the item in Instagram's data, so its bubble shows until
  you leave the item and then it is gone, like today.
- **Instagram view while a reaction or reply is still under way.** `I` waits for nothing and does
  nothing. It acts only when no action is in flight, so the layer can never cover a picker the
  extension is driving.
- **The layer never opens.** For example, Instagram changed its markup. The player comes back and
  says so (principle 4).
- **Option on Windows** may focus Chrome's menu. `?` works everywhere (see the lab's Missing).

## Glossary & concepts (learning)
- **FLIP** (First, Last, Invert, Play): measure where an element starts and ends, place it at the
  end, transform it back to the start, then animate the transform away. It is cheap because only
  `transform` animates.
- **Web Animations API** (`el.animate()`): the same keyframes as CSS animations, but from JS. It
  returns an `Animation` that can be `finish()`ed or `cancel()`ed, and that is what makes
  "finish on interrupt" a one-liner.
- **`prefers-reduced-motion`**: the OS accessibility setting, readable from CSS and from
  `matchMedia`.
- **Skeleton tiles**: grey placeholder shapes standing in for content that is still loading.

## Open questions
1. ~~Principle 5 lists the core keys. Should `I` and `?` be added to it?~~ **Answered 2026-10-22:
   yes**, as a dated amendment to the constitution.
2. ~~On the can't-read card, what does `I` do?~~ **Answered 2026-10-22:** it closes the player
   exactly like Esc and leaves Instagram's chat as it is.
3. Task 13 waited on the lab's Missing item: what Instagram's layer shows for a reel or a photo
   (comments, a comment box). **2026-10-22: the owner chose to go ahead on faith;** task 13 ships
   unverified by hand, and the owner checks it in the manual click-through.

## Outcome
| # | Criterion | Result |
|---|---|---|
| 1 | Thumbnails on tiles, number fallback | harness ✓ · live data ✓ 2026-10-22 (10 of 10 items, 8 of 8 reels carry a thumb) · the tiles' look by hand pending |
| 2 | Layout C v2 at 1280×720 and 960 wide | harness ✓ · hand check pending |
| 3 | Option / `?` show and hide the key tips | harness ✓ · hand check pending |
| 4 | Volume slider: hover, wide hit target, level kept, `M` | harness ✓ · hand check pending |
| 5 | W/S and A/D slides; holding S has no catch-up | harness ✓ · hand check pending |
| 6 | React `6`: pop, burst, flyer, badge; next at once, reaction queued | harness ✓ (850 ms version) · next at once and queue: by hand ✓ 2026-10-22 |
| 7 | Esc shrinks into the message, open grows from the card | harness ✓ · hand check pending |
| 8 | Slow item: blurred thumbnail and bar | harness ✓ · hand check pending |
| 9 | Reduce motion: every motion a crossfade | harness ✓ (emulated) · hand check pending |
| 10 | Eight states as in `states.html` | harness ✓ · hand check pending |
| 11 | Key card on first open, `?` brings it back | harness ✓ · hand check pending |
| 12 | `I`: Instagram's layer and back, same item, paused | Playwright on the real thread ✓ (2 of 2: opens at `/p/`, Back returns to the same item) · by hand ✓ 2026-10-22 |
| 13 | Icon at 128 and 16, light and dark theme | rendered ✓ · toolbar check pending |
| 14 | `npm run typecheck` and `npm run build` | pass ✓ |
| 15 | Carousel shows every slide | Playwright ✓ (7 of 7 carousels, 2–12 slides) · by hand ✓ 2026-10-22 |

---

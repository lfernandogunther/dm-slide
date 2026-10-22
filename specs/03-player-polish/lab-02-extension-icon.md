# 02-extension-icon — an icon for the extension, and later for what derives from it
**Kind:** idea   <!-- idea | bug | question -->
**Status:** shaped   <!-- open | shaped | handed off | became | done | shipped | parked | dropped -->
**Opened:** 2026-10-22   **Closed:** —

## Decisions
### Round 1 — concept
- **2026-10-22 — Start from three concepts side by side.** A bubble + play, B the queue (stacked cards), C play that talks (the triangle grows a speech tail); colour stays a placeholder until a later round.
- ~~**2026-10-22 — Mix two concepts: C’s shape with B’s queue.**~~ Misread: “B” meant concept B, not the “mix” option. `icon-mix.html` was drawn from the misread and is rejected.
- **2026-10-22 — Shape: B, the queue, as drawn in round 1.** Portrait cards stacked like reels, the front one playing. Frozen.
- **2026-10-22 — The colour changes; Instagram’s blue #0095f6 goes.** A derivative in Instagram’s button blue reads as Instagram’s.

### Round 2 — colour
- **2026-10-22 — Four colours against today’s blue:** A teal, B coral, C amber, D teal → green on the front card; each with its contrast on both toolbars.
- **2026-10-22 — Owner asked to see Instagram's gradient too:** E the full gradient on the front card, F only its orange → pink middle. The trademark risk below stays and is the owner's call.
- **2026-10-22 — Colour: F, orange → pink** (`#fa7e1e` → `#d62976`, diagonal, bottom-left to top-right, on the front card; the cards behind are flat `#fa7e1e` at .62 / .35). Warm and gradient like Instagram, generic enough not to be its mark.

### Round 3 — the chat header button
- ~~**2026-10-22 — A separate glyph of three plays for the chat header button.**~~ The owner described it wrong; disregarded. `header-button.html` is rejected.

## Drawings
- `drawings/icon-concepts.html` — A/B/C at 128 · 48 · 32 · 16, light + dark toolbar, mono, and the 24px header button — B approved 2026-10-22 (shape only; colour reopened)
- `drawings/icon-mix.html` — round 2: Echo / Card / Cut, drawn from a misread — rejected
- `drawings/icon-colour.html` — round 2: B in teal / coral / amber / teal → green vs today’s blue, sizes and toolbars, plus E Instagram gradient / F orange → pink — F approved 2026-10-22. Frozen.
- `drawings/header-button.html` — round 3: the chat header glyph, Stack / Column / Outline stack, in Instagram's dark and light header at 24 · 20 · 16 — rejected (misdescribed ask)

## Verdict
The mark is **B, the queue** — three portrait cards stacked like reels, the front one playing — in
**F, orange → pink**. Approved in `drawings/icon-concepts.html` (shape) and
`drawings/icon-colour.html` (colour, option F). Its one-colour version is round 1's B mono
(cards at 1 / .62 / .35, the play cut out). Next: an SVG master, PNGs at 16 / 32 / 48 / 128, and
`icons` + `action.default_icon` in `manifest.json`.

## Rabbit holes & no-gos
- No Instagram logo, camera glyph or its purple–orange gradient (trademark). The gradient was reopened as a colour option on 2026-10-22 at the owner's request (E/F in `icon-colour.html`); F was chosen, the full gradient (E) stays out.
- Out: a wordmark, a brand book, the button injected into Instagram's chat header (stays as it is).
- Risk: at 16px the stacked cards may blur; the fix is a 16px-specific drawing, not a different mark.

<!-- Ask, Checked and Missing stay local in .lab/02-extension-icon/lab.md -->

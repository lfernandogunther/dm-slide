# DM Slide

A Chrome extension that slides through what was sent in an Instagram DM conversation — reels,
posts, carousels, stories and gallery photos or videos — one after another, so you can watch, react
and reply on one screen, without the back-and-forth.

- Principles: [constitution.md](constitution.md)
- Roadmap: [ROADMAP.md](ROADMAP.md)
- Specs: [specs/01-mvp/](specs/01-mvp/spec.md) (clickable prototype in `specs/01-mvp/prototype/`),
  [specs/02-beyond-reels/](specs/02-beyond-reels/spec.md),
  [specs/03-player-polish/](specs/03-player-polish/spec.md)

## Install
1. `npm install` and `npm run build` (or `npm run watch`); the extension lands in `dist/`.
2. In `chrome://extensions`, turn on Developer mode, then "Load unpacked" and pick `dist/`.
3. Open a conversation in Instagram's DMs and press the DM Slide button in its header.

After a rebuild, press reload on the extension's card.

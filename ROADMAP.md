# DM Slide — Roadmap

## 01 · MVP — the player (done)
A player over any Instagram DM conversation, 1:1 or group: every reel others sent, in the order
sent, one at a time. Walk with A/D, react ❤️ with F, reply under the video (quoting the reel or
not). Older reels load as you go back. Spec: `specs/01-mvp/`.

## 02 · Filters (future)
Pick which items enter the player: only from one sender (in groups), a date range. The first
filter, "not reacted", shipped early with phase 04 (`specs/02-beyond-reels/`).

## 03 · Faster reactions & replies (future)
Other reactions besides ❤️ on single keys, and quick replies (a short list of canned messages on
number keys).

## 04 · Beyond reels (done)
Posts, carousels, stories and photos or videos sent from the gallery go through the same player,
marked by kind in the strip, with the "not reacted" filter, faster loading of older messages and
the sender's texts shown beside the item they came with.
Spec: `specs/02-beyond-reels/`.

## 05 · Settings & polish (future)
An options page (defaults for auto-advance and quote, key remapping). The player's polish shipped
early (`specs/03-player-polish/`).

## 06 · Web Store release (in progress)
The extension on the Chrome Web Store, a README with screenshots and every key, and releases that
ship from a tag. Spec: `specs/04-web-store-release/`.

## 07 · Faster video start (future)
A reel can take seconds to start: its video comes from the embed page loaded in a hidden iframe,
since the page's HTML does not carry it for reels. Measure the iframe on current reels first, then
cut what can be cut without more requests (the 200 ms poll, a read for an item already left).

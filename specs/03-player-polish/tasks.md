# Tasks — S03

**18 of 21 done · next: 16 — `I` waits for the row to draw (fix planned, not applied)**

- [x] **01 — thumbnails: `thumb` on `Item` (page, bridge, adapter), strip tiles show it, number fallback; counts-only snippet for the owner**
- [x] **02 — layout C v2: CSS to `style.ts`, vertical thumbnail strip, video alone, content-sized panel, slim header; arrows on the video and 280px panel below 1200px**
- [x] **03 — key tips: hold Option or `?` shows each control's key; the header legend goes**
- [x] **04 — volume: slider on hover of the sound button, wide hit target, level saved; `M` unchanged**
- [x] **05 — motion: `motion.ts` (finish on key, no queue, reduce-motion crossfade); items 300ms, slides 260ms, panel rise, strip follow**
- [x] **06 — loading: blurred thumbnail + thin bar, fades out when the media is ready**
- [x] **07 — react: pop, burst, flyer to the tile, badge pop; react → next at 850ms**
- [x] **08 — open / close: `rectOf` in the adapter; grow from / shrink into the message, fade-and-rise when off screen**
- [x] **09 — place states: all caught up card, loading older (skeleton tiles + pill), start of the chat (bump + pill), won't play card**
- [x] **10 — can't read: the player frame with its card replaces `openNotice`**
- [x] **11 — action states: failed control shakes with a red ring and a line; reply bubble sending / sent ✓ / not sent**
- [x] **12 — first open: key card shown once (`seenKeys` setting), `?` brings it back**
- [x] **13 — Instagram view `I`: `openLayer` + `layerOpen` in the adapter, player hides and comes back paused; gated on the owner's hand check**
- [x] **14 — extension icon: SVG master (B, the queue, orange → pink), PNGs 16 / 32 / 48 / 128 in `icons/`, `icons` + `action.default_icon` in the manifest, copied by the build**
- [x] **15 — self-review, close learnings.md and promote**
- [ ] 16 — on a page view (a story), `I` and Back call `history.back()` when `closeLayer()` finds no dialog, once a hand check shows how Instagram routes a story (self-review flag 3, MED)
- [ ] 17 — hide the player only once `openLayer` resolves, or narrow `layerOpen()` to the dialog showing the item, once a hand check shows the layer's shape (self-review flag 5, LOW)
- [x] **18 — strip badges: my reaction and 💬 sit inside the tile's bottom-right corner, not clipped; the flyer lands there**
- [x] **19 — a quoted reply counts as answered: start item, filter, "N to react", caught-up card**
- [x] **20 — react → next at once: reactions queued one at a time, never during a reply; one retry, then undone with a red tile and a pill**
- [ ] 21 — carousel shows only its first slide: look for the other slides in `/p/<code>/embed/` now the lookup answers 302

---

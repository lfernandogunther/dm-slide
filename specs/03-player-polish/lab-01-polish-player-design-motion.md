# 01-polish-player-design-motion — a better look, flow and motion for the player
**Kind:** idea   <!-- idea | bug | question -->
**Status:** became   <!-- open | shaped | handed off | became | done | shipped | parked | dropped -->
**Opened:** 2026-10-22   **Closed:** —

## Decisions
### Stage 1 — look & layout
- **2026-10-22 — A and C stay in the running; B is out.** Liked both A and C on the first drawing; not sure yet which.
- **2026-10-22 — The next round builds on C, with two changes.** The panel shows only what there is (no empty sections, sitting on the video's foot); key tips replace the header's legend — hold Alt/Option, or `?`, and each control shows its key.
- **2026-10-22 — Strip tiles show thumbnails; a tile whose record has no preview falls back to its number.** The preview is already read in `src/instagram/page.ts` and dropped for reels — a small read-only addition, no new request beyond the `<img>`.
- **2026-10-22 — Stage 1 closed: layout C approved** (`drawings/look-layout-c.html`). Strip vertical on the left, the video alone in the middle, a content-sized panel on the right; arrows float on the video below 1200px wide and the panel slims to 280px.
- **2026-10-22 — Added after C's approval: a volume slider, like Instagram's.** Hovering the sound button opens a level slider; M still toggles mute. The level is a setting in `chrome.storage.local`, never message content (constitution #2). It goes into `look-layout-c-v2.html`, because C is frozen.
- **2026-10-22 — Added: an "Open on Instagram" button.** It takes the item to Instagram's own post page, where the user sees the comments and comments by hand. The extension itself still never comments (non-goal). The link is built from the share's `shortcode` (`bridge.ts:19`). An item with no shortcode, such as a photo sent straight into the chat, gets no button rather than a guessed link (principle 4). 
- ~~**2026-10-22 — "Open on Instagram" opens a new tab and pauses the current item.**~~ Superseded by the next decision. The player stays exactly where it was. Pausing stops the sound from playing over the Instagram tab.
- **2026-10-22 — Instead: an "Instagram view" toggle in the header, with a key (proposed `I`).** It changes the scene in the same tab: the player steps aside and shows Instagram's own view of the current item, with its comments and its comment box. The same key brings the player back on the same item. It replaces the new tab, so the A/B/C placement question in `look-layout-c-v2.html` is settled: the header. How it switches is still open (see Missing).
- **2026-10-22 — The toggle uses Instagram's own layer.** Pressing `I` pauses and hides the player, then opens the current item the way a person would: its message in the chat, in Instagram's layer over the chat. Closing that layer (Instagram's ✕ or Esc, or `I` again) brings the player back, paused, on the same item. There is no reload and no reading of history again. If the item's message can't be found in the chat, it says so and does nothing (principle 4). `I` never toggles while a text box has focus, so typing a comment is safe.
- **2026-10-22 — C v2 approved** (`drawings/look-layout-c-v2.html`): the layout plus the volume slider and the Instagram view toggle. Frozen.

### Stage 2 — motion
- **2026-10-22 — Navigation moves like B (Feed).** Items slide up/down (300ms), carousel slides sideways (260ms), the panel's who + reactions rise 8px as they change, and the strip follows in 280ms. It reads like Instagram's own reels, so going up and down feels familiar.
- **2026-10-22 — React and open / close move like C (Expressive).** React pops the button, bursts a big emoji over the video and flies it to the strip tile. Esc shrinks the video back into its message in the chat (and opening grows it from there), with the rest fading in after it. These are the rare, deliberate moments, so they can afford to be felt.
- **2026-10-22 — React → next waits 850ms.** You see the burst, and the next item slides in while the emoji is still flying to the strip. The owner wants no time lost, so the move doesn't wait for the emoji to land.
- **2026-10-22 — Loading shows the item's thumbnail, blurred, until the video is ready.** A thin bar runs at the bottom, then the thumbnail fades out. It fits the B navigation and reuses the thumbnails from stage 1, so a slow network never shows a black hole.
- **2026-10-22 — Stage 2 closed.** In the real code, every style falls back to a plain crossfade when the system's reduce-motion setting is on. A key pressed mid-motion finishes the current motion at once, so held keys never queue.

### Stage 3 — flow & states
- **2026-10-22 — States speak in one voice (`drawings/states.html`).** Two rules cover every state. If the state is about where you are (nothing left, loading, the start of the chat, an item that won't play, a chat that can't be read), it shows on the video as a card or pill carrying the keys that act on it. If it is the result of one action, it shows on the thing you acted on. The owner picked these per situation; the rule is what they share, and new states follow it.
- **2026-10-22 — All reacted → B.** An end card on the dimmed video: "All caught up", how many were reacted to, and keys W look further back · U show all · Esc close. The filter never turns itself off.
- **2026-10-22 — Loading older → B.** Skeleton tiles at the top of the strip plus a "Loading older…" pill on the video, which stays on the current item.
- **2026-10-22 — Start of the chat → B.** The video bumps and a "Start of the chat" pill shows for 2s.
- **2026-10-22 — Item won't play → B.** The blurred thumbnail with a card giving the reason, plus I Instagram view · S next. It never skips by itself.
- **2026-10-22 — An action failed → C.** The control that failed shakes with a red ring, and one line under it says it didn't land and which key tries again. It never retries by itself (principle 4).
- **2026-10-22 — Can't read the chat → B.** The player opens with its frame and a card on the video: what happened, "nothing was done", a detail line for reporting, and I Instagram view · Esc close. Chosen over C (greying the button before opening) to match every other place-state. C would also mean reading the thread before any click, and pressing the button would then seem to do nothing.
- **2026-10-22 — Reply sent / not sent → B.** The reply joins the list at once, greyed while it sends, then solid with a ✓. If it fails, the bubble turns red with "Not sent · R to try again", and the text goes back in the box.
- **2026-10-22 — First open → B.** A key card over the player on the very first open only: the keys in two columns, "Press any key to start · ? brings this back". Having seen it is stored as a setting in `chrome.storage.local`, which holds no message content (principle 2).
- **2026-10-22 — Stage 3 closed.**

## Drawings
- `drawings/look-layout.html` — stage 1: today + A tidy / B immersive / C theatre + panel, tiles as thumbnails or numbers — rejected (narrowed to A vs C)
- `drawings/look-layout-a-vs-c.html` — A vs C (C with the strip kept vertical) across simple / busy / replying and four screen sizes, incl. half a Full HD (C narrows: arrows on the video, 280px panel) — rejected (C chosen, refined in look-layout-c.html)
- `drawings/look-layout-c.html` — C with the content-sized panel and key tips (hold Option, or ?) — approved 2026-10-22, superseded by v2
- `drawings/look-layout-c-v2.html` — C plus a volume slider on hover and an "Instagram view" toggle in the header (key I). The toggle pauses the item and opens it in Instagram's layer over the chat; I or Esc comes back. Also a photo sent in the chat, which has no sound control. Redrawn from the new-tab / three-places version before approval — approved 2026-10-22
- `drawings/motion.html` — stage 2: three motion styles side by side (A quiet · B feed · C expressive) across item, slide, react, react → next, open / close and loading — approved 2026-10-22 as a mix: B for navigation, C for react and open / close (loading: B's blurred thumbnail)
- `drawings/states.html` — stage 3: nine situations (first open, all reacted, loading older, start of chat, item won't play, action failed, can't read the chat, reply sent / not sent) in three styles: A in place · B on the stage · C inline & automatic — approved 2026-10-22 per situation: B everywhere except an action failed (C); first open B

## Verdict
Shaped. S03 builds the player as drawn in three approved drawings: `look-layout-c-v2.html` for the look, `motion.html` for the motion (B navigation, C react and open / close) and `states.html` for the states (B, plus C for a failed action). Decisions above, per stage.

What S03 contains:
1. **Layout C v2.** Thumbnail strip on the left, the video alone in the middle, a content-sized panel on the right. Key tips replace the legend (hold Option, or `?`). A volume slider. The "Instagram view" toggle (`I`).
2. **Motion.** The feed-style slide between items and slides. A burst-and-fly reaction. Open / close grows from and shrinks into the chat message. 850ms for react → next. A blurred thumbnail while loading. A crossfade under reduce-motion. Interrupting finishes the current motion, and held keys never queue.
3. **States in one voice.** A state about where you are shows as a card or pill on the video, with keys. The result of an action shows on the thing acted on. A first-open key card is shown once.

The appetite moved: the Ask said `src/instagram/` stays untouched. Three decisions need small, read-only-in-spirit additions there:
- a `thumb` on `Item` (~10 lines, see Checked);
- the chat message's on-screen rect, for the open / close motion;
- opening the item's own layer, for Instagram view.

The fix rule still holds: Instagram knowledge lives only in `src/instagram/`, and `src/player/` asks the adapter for it.

## Rabbit holes & no-gos
- Removing Instagram's `X-Frame-Options` with `declarativeNetRequest` so the post page fits in a frame is out: it weakens Instagram's clickjacking protection in the user's browser.
- The `/embed/` page can be framed (the player already reads it), but it has no comment box and no full comment list, so it is not "Instagram's view".
- Showing comments inside the player is out: it would mean new requests the user never made (principle 3) and a second feed inside the panel. The "Instagram view" toggle is the deliberate way to reach comments. It steps aside to Instagram's own layer in the same tab and comes back to the same item, so principle 1 ("never leave the player") holds. If it ever grows into more than that, the constitution has to be amended first.
- Alt alone in Chrome on Windows focuses the browser menu when released; whether `preventDefault` on the page stops it is unverified (this machine is a Mac, where Option does nothing).
- The open / close motion grows from the chat message's rect. If that message isn't on screen, it falls back to B's fade-and-rise. The chat is never scrolled just for an animation.
- Instagram view opens the item's layer the way a person would, on the owner's own key press. Automated checks never do it: it means acting on Instagram's elements, which the testing rules in CLAUDE.md forbid. It is verified by hand only.
- The volume slider's drawn hit area is about 6px wide. The real control needs a wider hit target than it shows.
- No automatic moves: no auto-skip of items that won't play, no turning the filter off by itself, no retrying a reaction or a reply. These were drawn as C and rejected. Each one would act without being asked (principles 3 and 4).
- The motion must not delay input. A key pressed mid-motion acts at once, so B and C styling never costs keyboard speed (principle 5).


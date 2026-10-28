# 04-instagram-view-arrows — move between items from Instagram's own view, and open it on its own when an item fails
**Kind:** idea   <!-- idea | bug | question -->
**Status:** shaped   <!-- open | shaped | handed off | became | done | shipped | parked | dropped -->
**Opened:** 2026-10-27   **Closed:** —

## Decisions
- **2026-10-27 — Auto-open fires 2 s after the "Can't play this here" card, not 2 s after the item shows.** Leaves time to skip with W/S, and a slow reel that would play is never cut.
- **2026-10-27 — Auto-open also during the 1 h refusal pause.** No read of ours is made; Instagram's view is the only way those items show. Open tension with principle 3 ("stops asking", "every action is one the user triggered"): the open is a click the user did not make, once per item they land on. To weigh in the spec.
- **2026-10-28 — Option A's bar is draggable, no auto-hide.** It can sit over a reel; a grip moves it, the spot is kept in `chrome.storage.local`, double-click resets it. Auto-hide was offered and not chosen: a bar that stays put is more predictable.
- **2026-10-28 — Option A approved; it becomes a spec together with lab 03.** The owner approved the drawing and chose to plan both in one spec.

## Drawings
<!-- local, in .lab/04-instagram-view-arrows/drawings/ -->
- drawings/frame-around-modal.html — three frames around Instagram's modal (A top bar, draggable · B side arrows + dock · C mini strip rail), the move-on flow and the setting — approved 2026-10-28 (option A)

## Verdict
Our player stays the default. An item that cannot play opens in Instagram's own modal — by `I`, or
by itself 2 s after "Can't play this here" (a setting, on by default, also during the refusal
pause) — and a yellow bar of ours sits over it: ‹ W · position · S › · ❤️ F · Reply R · Back I. The
bar is draggable by a grip, its spot kept locally, double-click resets. W/S close Instagram's view
(Esc, as today), step, and reopen only for an item that cannot play; a playable one comes back to
the player. A key during the 2 s skips before anything opens. Built from what exists: openLayer,
closeLayer, the away state and the Back chip.

## Rabbit holes & no-gos
- Never click, focus or dispatch events on Instagram's elements; arrows and keys are ours.
- Our reply goes to the DM; Instagram's own box in the modal comments publicly on the post. The frame
  must say which is which, or a DM reply ends up as a public comment.
- Auto-open must not loop or open Instagram's view for every item during a refusal pause.

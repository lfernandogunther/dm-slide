# S08: Photo caption and a frame around Instagram's view

**Source branch:** main · **Working branch:** main
**Repo(s):** dm-slide
**Origin:** .lab/03-post-caption-missing, .lab/04-instagram-view-arrows

## Context
Shaped in lab-03-post-caption-missing.md and lab-04-instagram-view-arrows.md; drawings linked, not
copied.

Two gaps, found by the owner on the real Instagram:
1. **A one-photo post shows no caption.** The card beside a shared post (S05) is filled from the
   embed page its media comes from. A reel reads that page in a hidden iframe and a carousel reads
   its HTML, but a one-photo post plays from the DM's own image and reads nothing, so its card stays
   empty. In the lab, a cookieless fetch of the post's `embed/captioned/` page returned 200, with no
   redirect, in ~0.4 s. Its HTML carries the caption (`.Caption`) and the author
   (`.UsernameText`) as markup, and its `contextJSON` is null. One post was sampled.
2. **An item that can't play is a dead end.** `I` opens Instagram's own view of it. From there, the
   only way on is back to the player, then the next item. The owner wants to move on from that view
   with the player's keys. The owner also wants the view to open by itself when an item can't play.

## What to build
1. **A caption for one-photo posts.** One cookieless read of `/p/<code>/embed/captioned/` goes
   through the existing lane, for the item on screen and the next only. Its HTML is parsed as text
   (never run) and gives the author and the caption. The photo still comes from the DM.
2. **The wording for that read** in PRIVACY.md and the store listing. Today both say the facts need
   no further request.
3. **A setting:** "Open in Instagram when it can't play here", on by default.
4. **Auto-open.** With the setting on, an item showing "Can't play this here" (or "Paused…", during
   the refusal pause) opens Instagram's view after 2 s, once per item. Moving on within the 2 s
   opens nothing.
5. **The frame.** While Instagram's view is open, the yellow "Back to DM Slide" chip becomes the
   approved bar: `⋮⋮  ‹ W  n / N  S ›  |  ❤️ F  |  Reply R  |  Back I`.
   - Its keys are W, S, F, R and I.
   - Each part is also clickable.
   - n/N counts what the "Not reacted" filter leaves.
6. **W/S from the frame.** Close Instagram's view, then step:
   - The next item is known not to play → open its view, and the frame stays.
   - Otherwise → back to the player, where the 2 s rule decides.
7. **F/R from the frame.**
   - F closes the view, reacts through today's path, and reopens the view while that item is still
     current.
   - R opens our reply box beside the bar, labelled "Reply in the DM — not a comment on the post".
     Sending closes the view, sends through today's path, then reopens.
8. **The grip.** Drag the bar anywhere. Its spot is kept in `chrome.storage.local`, and a
   double-click on the grip puts it back at the top.

## Acceptance criteria
- [ ] A shared one-photo post shows its author and caption in the card, from one cookieless read of
      its `embed/captioned/` page. That read is made for the item on screen and the next only, and
      never during the refusal pause. Reels and carousels make no new read.
- [ ] A redirect off the embed page, or a 401/403/429, starts the refusal pause, as for every read.
- [ ] PRIVACY.md and store/listing.md describe that read, and the new settings.
- [ ] With the setting on, an unplayable item opens Instagram's view 2 s after its card shows:
      - once per item;
      - never after the user moved, typed, or closed the player;
      - also during the refusal pause.
      With the setting off, nothing opens by itself.
- [ ] In Instagram's view, the bar shows the position, and W, S, F, R and I work, from the keys or
      by click. A, D, the arrow keys and Esc stay Instagram's.
- [ ] W/S reopen Instagram's view only for an item known not to play; otherwise the player comes
      back. At the oldest item, W loads older messages as the player does.
- [ ] F reacts and R replies to the DM, with Instagram's view closed while our action runs. Nothing
      is typed into, clicked on or focused in Instagram's modal.
- [ ] The bar drags by its grip, its spot survives a reload, and a double-click resets it.
- [ ] `npm run typecheck` and `npm run build` pass; the demo shows the flow; the owner's hand check
      passes on the real Instagram.

## Approach
Two parts, in plan.md:
- The caption is a new read beside the carousel's, using the same fetch options and the same
  refusal check.
- The frame is built only from what exists today: `openLayer`, `closeLayer`, the away state and
  the Back chip. The overlay learns which items can't play, and the bar drives today's actions with
  Instagram's view closed while they run.

## Edge cases
- **Several captioned posts in a row:** one read each, in the lane; an item passed in under 300 ms
  reads nothing.
- **No `.Caption` in the page** (no caption, or the markup changed): the card shows the author
  only. The read is still cached, so it is not repeated.
- **The caption's text** includes the username link and a trailing "view all comments" style
  footer. Only the caption text is kept.
- **The pause starts while the frame is up:** W/S treat every share as unplayable, so the frame
  stays.
- **Own media during the pause:** a photo sent from the gallery plays and never auto-opens.
- **Instagram's view is a page of its own** (a story): `closeLayer` already goes back once, and the
  step happens after the thread is back.
- **A key in the 2 s:** S moves on and nothing opens. Typing in the reply box or opening help
  cancels the timer.
- **Coming back with I or Esc:** the same item does not auto-open again.
- **The window shrinks:** the bar is clamped back inside it.
- **Instagram's modal pulls focus from our reply box:** see open question 2.

## Glossary & concepts (learning)
- **Instagram's view / the layer:** what Instagram opens when its card in the thread is clicked —
  a modal over the chat, or a page of its own for a story.
- **Away:** our state while that view is open. The player is hidden, and only the bar takes clicks.
- **Cookieless fetch:** `credentials: 'omit'` and `referrerPolicy: 'no-referrer'`. Instagram sees
  the same request any site embedding the post would make, with no account attached.
- **DOMParser:** builds a document from an HTML string without running its scripts or loading its
  images; only text is read from it.

## Open questions
1. **Auto-open during the refusal pause vs principle 3.** The owner chose yes in the lab. Why it
   fits:
   - It makes no read of ours.
   - It happens once per item the user lands on and stays on for 2 s.
   - It never happens for an item passed through, and never twice for the same item.

   It is still a click on Instagram's card the user did not make. The setting turns it off.
2. **R over Instagram's view.** If Instagram's modal pulls focus back from our box, R closes the
   view and replies from the player instead, then reopens after sending. That departs from the
   drawing; the hand check decides.
3. **F and R close the view while they run** (~1 s blink), where the drawing shows the frame
   staying. The reason: today's react and reply drive the thread's toolbar and composer, which sit
   under Instagram's modal. The emoji picker is found by the same `[role=dialog]` selector as the
   modal. Driving them with the modal open risks reacting to the wrong item, or a public comment.

## Outcome

| # | Criterion | Result |
|---|---|---|
| 1 | Caption for one-photo posts | |
| 2 | Pushback on the new read | |
| 3 | PRIVACY + listing | |
| 4 | Auto-open | |
| 5 | Bar and its keys | |
| 6 | W/S reopen rule | |
| 7 | F/R without touching the modal | |
| 8 | Drag, kept, reset | |
| 9 | Checks + hand check | |

---

# S02: Beyond reels — every shared post, photo and story in the player, and a filter

**Source branch:** main · **Working branch:** main
**Repo(s):** reel-queue

## Context
The MVP plays only reels. In a real thread, a click on a shared post or a photo still opens
Instagram's own viewer, which is the same back-and-forth that S01 removed for reels. Roadmap phase 04
("Beyond reels") covers that. This spec also pulls forward the first filter from phase 02, "only the
ones I haven't reacted to". That filter was always meant to come first.

The constitution's non-goals are scoped "for the MVP", so they do not block this spec. Its vision
and principle 5 (the keys) do describe the MVP's reels and keys, so they get a dated amendment (see
Open questions 1).

## What to build
- **Which items:** every non-text message someone else sent for me to see, while it is still
  available, in send order. That means:
  - reels;
  - shared posts (a single photo, a video, or a carousel);
  - photos and videos sent straight from the gallery;
  - shared stories.

  These stay out: text, voice messages, GIFs and stickers, links to other sites, reactions, and my
  own messages.
- **Strip:** every item is numbered from the newest, as reels are today, and every kind except reels
  carries a small icon:

  | Kind | Icon |
  |---|---|
  | post | 🖼 |
  | carousel | ▦ |
  | story | ◯ |
  | photo or video from the gallery | 📷 |
- **Stage:**
  - A photo is shown fitted to the stage.
  - A video of any kind plays like a reel: sound, loop, pause, mute, progress bar.
  - A carousel shows one slide at a time, with dots under it for its position. A slide can be a
    photo or a video, and a dot click jumps to that slide.
- **Keys:**
  - `W`/`S` and `↑`/`↓` always move to the previous or next item.
  - `A`/`D` and `←`/`→` move between a carousel's slides. Past its first or last slide, and on any
    item that is not a carousel, they move to the neighbouring item. The ‹ › buttons do the same.
- **React and reply:** reacting (`F`, `1`–`6`) and replying, with or without a quote, work on every
  kind exactly as they do on reels. They go to the DM message, not to the post.
- **Chat cards:** a click on any of these cards in the chat opens the player at it, instead of
  Instagram's viewer. Text and every other message keep Instagram's own behaviour.
- **Filter "Not reacted":**
  - A toggle in the player's header, and the key `U`.
  - When it is on, items that carry my reaction leave the strip and the navigation.
  - The choice is saved and holds across openings.
  - Numbers stay those of the full list, so toggling the filter never renumbers an item.
- **Loading older, faster:** one request loads several pages in a row, paced like a person
  scrolling up (no burst), until about 2 months back or the start of chat. Today it is one page of
  20 messages per request.
- **Count:** "N to react" on the header button and in the player counts every loaded item, whatever
  its kind.

## Acceptance criteria
Manual click-through on the real Instagram, in my own Chrome, in a 1:1 and a group thread.
- [ ] 1. The player lists every kind above that others sent and that is still available, in send
  order, and nothing else.
- [ ] 2. The strip shows a number on every tile and the kind's icon on every non-reel tile.
- [ ] 3. Photos are fitted to the stage. Post, story and gallery videos play with sound and loop.
- [ ] 4. In a carousel, `A`/`D` and `←`/`→` walk its slides, then step out to the neighbouring
  item at either end. The dots show the position and jump on click.
- [ ] 5. `W`/`S` and `↑`/`↓` always move between items. On a non-carousel item, `A`/`D` and
  `←`/`→` do the same.
- [ ] 6. React, remove the reaction, and reply both quoted and plain. All of it works on a post, a
  carousel, a story and a gallery photo, and Instagram's chat shows it on the right message.
- [ ] 7. Clicking a post, photo or story card in the chat opens the player at that item. Clicking
  a text message does nothing new.
- [ ] 8. With "Not reacted" on, only items without my reaction are in the strip and the navigation.
  - An item I just reacted to stays until I move away.
  - The setting is still on after closing and opening again.
  - Turning it off brings every item back, with the same numbers.
- [ ] 9. With the filter on and nothing left to react to, the stage says so and offers to turn the
  filter off.
- [ ] 10. An item that is no longer available (an expired story, a deleted post) does not appear
  when Instagram's record already says so. When the record does not say so and the item only fails
  on play, the stage shows "Unavailable" with "Open on Instagram", as reels do today.
- [ ] 11. Going back loads pages one after another without a keypress each, at a human pace, and
  stops around 2 months back (or at the start of chat). The strip and current item never jump.
- [ ] 12. The S01 acceptance criteria still pass for reels, with the new keys.

## Approach
A read-only spike first: what each kind looks like in Relay and on its chat card. Then the model
grows from `Reel` to `Item` with a `kind`. Media is resolved to a video, a photo or a list of slides.
On top of that come the stage, keys, strip, cards and the filter. See [plan.md](plan.md).

## Edge cases
- A carousel whose slides mix photos and videos. Only the current slide's video plays.
- A story shared after it expired, or one that expires while the player is open.
- A post from a private account I don't follow, so the lookup returns nothing: "Unavailable".
- The filter is on and I open from a card I already reacted to: the player opens at it anyway, and
  it leaves the strip once I move away.
- The filter is on and a page of older messages brings nothing new to react to. Loading goes on
  until at least one new item shows up or the start of chat is reached (Open questions 3).
- The filter is on and the start item is the oldest unreacted one. Same rule as today, but within
  the filtered list.
- Several photos sent at once from the gallery may be one message with several attachments, so they
  show as a carousel. The spike confirms this.
- The same post sent twice is two items, one per message, as it is for reels.

## Glossary & concepts (learning)
- **XMA:** Instagram's "extensible message attachment". It is the card a shared reel, post or story
  shows in the chat, and its record carries `target_url`, the link to the shared item.
- **Carousel:** a post with up to 20 slides (photos or videos). In the media lookup it is
  `media_type` 8, with `carousel_media`. A single photo is 1 and a video is 2.
- **Shortcode / media id:** the `/p/<code>/` part of a post's URL. It is the media id written in
  base 64, the same as for reels.

## Open questions
1. Amending the constitution, dated: the vision says "reels" becomes "anything shared to watch";
   principle 5 gets the new keys (`W`/`S` and `↑`/`↓` move items; `A`/`D` and `←`/`→` move slides or
   items); the non-goals drop "Reels only" and the filter line. Your explicit ok is needed (task 02).
2. The icons (🖼 ▦ ◯ 📷) are a first pick. Change them now, or after seeing them?
3. With the filter on, one keypress loads older pages until a new item shows up, capped at 5 pages,
   about 10–20 s. Is that cap right?

## Outcome
<!-- Filled at wrap. -->

| # | Criterion | Result |
|---|---|---|

---

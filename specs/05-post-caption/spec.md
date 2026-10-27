# S05: Post card — a shared post's caption, author, date and numbers beside the player

**Source branch:** main · **Working branch:** main
**Repo(s):** dm-slide

## Context
Since S03 the player's right column holds one card at its foot: who sent the item, what they wrote
with it, the reactions and the reply box. The rest of the column, above that card, is empty. On
2026-10-22 the owner asked to use that space for the shared post's own words.

The first build of S05 read them from Instagram's private API (`/info/` and `/comments/`). The
amended principle 3 forbids that, so it was parked on the branch `05-post-caption` (2026-10-23)
while S06 removed the private API. The owner brought it back on 2026-10-27 with a new source: the
public embed page the player already loads for every reel and carousel. Two live reads, with keys
and types only, show what that page carries (learnings.md, 2026-10-27). It has the caption, the
author and the numbers. It has no comment bodies, so the author's first comment is dropped, and it
has no post time. The time is decoded locally from the post's code instead, which is accurate to
the day.

The owner chose the card's content on 2026-10-27:
- the author, with a ✓ when verified, and the date;
- the caption;
- on reels, the music;
- a line of likes, comments and, on reels, views.

A one-photo post shows its date only, since its embed data is empty and reading its HTML would be a
new request.

## What to build
1. **Adapter**: `post(item)` returns what the card shows, or `null` when there is nothing to show
   (gallery item, story).
   - Reels and carousels: the author, verified or not, the caption, the like and comment counts,
     and on reels the view count and the music. These come from the `contextJSON` the item's embed
     read already loads: the reel's hidden iframe, the carousel's fetch.
   - Any share: the date, from its shortcode.
   - No new request, and no request of a new kind.
2. **Player**: a card above the existing one in the right column, in the same look. It holds:
   - the author with its ✓, then the date;
   - the caption as written, with line breaks kept;
   - `🎵 artist — song`, or `Original audio`;
   - a small line `❤️ 56K · 💬 446 · ▶ 358K`.

   The card shrinks before the card below does, scrolls when the text is long, and hides when
   there is no room left for it. An item with nothing to show gets no card, and the column stays as
   it is today.
3. **Demo**: invented post data on a few items, so the card can be seen and screenshotted without
   Instagram.
4. **Privacy**: `PRIVACY.md` and the store listing say that the player shows a shared post's
   caption, author and public counts. These are read from the same embed page that brings the
   video, and are never stored or sent.
5. **README**: the player screenshot shows the card.

## Acceptance criteria
- [ ] A shared reel or carousel shows:
      - the author, with ✓ when verified;
      - its date;
      - the caption with its line breaks;
      - likes and comments, plus views on a reel.
- [ ] A reel with music shows the artist and song; a reel without them shows "Original audio".
- [ ] A one-photo post shows only its date. A gallery item or story shows no card. Nothing is asked
      of the network for any of them.
- [ ] No more embed reads per item than before, and no new kind of request. The build's
      private-API gate stays green.
- [ ] Moving quickly between items never shows one item's card on another.
- [ ] Opening the same item again asks Instagram nothing new.
- [ ] Nothing is liked, commented or clicked on the post: it is read only.
- [ ] The card never covers or squeezes the reactions and the reply box; it hides when squeezed.
- [ ] `PRIVACY.md` and `store/listing.md` name what is read, and no new permission is added.
- [ ] `npm run typecheck` and `npm run build` pass, the demo shows the card, and the owner checks a
      reel, a carousel and a photo on the real Instagram.

## Approach
`media.ts` already holds every embed read. Whichever read runs for a share also parses its
`contextJSON` into a small `PostFacts` and keeps it per shortcode for the page's life:
- the reel's iframe reads the JSON from its own document before the frame is removed;
- the carousel's fetch reads it from the HTML it already parses.

A read that ends without a video still keeps the facts, so an unplayable reel keeps its caption.
`post.ts` combines those facts with a date decoded from the shortcode. The shortcode is base64url,
which gives the media id; the post time is `(id >> 23) + 1314220021721` ms. The adapter returns
what it has once the item's own media read settles, and it never starts a read itself.

The overlay ports the card from the parked branch onto today's `.p-side`: a `.p-post` above
`.p-panel`. It renders the card when the item becomes current, and drops an answer that arrives
after the item is gone. Text from Instagram is set as text only. Field names live in
`selectors.ts` next to `EMBED_CONTEXT_JSON`.

## Edge cases
- **No caption** (Instagram allows posts without one): the card shows the author, the date and the
  numbers.
- **Unplayable reel** (the cover, or broken media): the card still shows when the embed carried its
  data.
- **Private account, or embedding turned off:** `contextJSON` is null, so the card shows the date
  only.
- **Abandoned read**: if the user leaves before the JSON was read, the item has no facts until its
  next read. The date shows anyway.
- **Date accuracy:** the decoded time was 17 s, 7 s and 2.4 h early against the real post time. The
  card shows a date (`Oct 15`, plus the year when it isn't this year), never a clock time.
- **Long captions** (walls of hashtags): the card scrolls inside itself, and the page never
  scrolls.
- **Big numbers:** compact (`56K`, `1.2M`), in English like the rest of the UI.
- **Collab posts:** only the main author shows. The second author exists only in the rendered
  `captioned` page.
- **Text from Instagram is untrusted:** it is set as text, never as HTML.

## Glossary & concepts (learning)
- **Caption**: the text the author wrote when posting.
- **contextJSON**: the data an embed page carries in an inline script, escaped once, so it is
  parsed twice.
- **Shortcode**: the post's code in its link (`/p/<code>/`). It is the media id written in base64url.
- **Media id time**: Instagram's ids begin with the milliseconds since its own epoch (2011-08-24),
  so shifting the id 23 bits right gives roughly when the post was created.
- **Compact number**: `56,023` written as `56K`.

## Open questions
1. ~~Which "first post of the author"?~~ **Answered 2026-10-22:** the author's first comment on
   their own post. **Dropped 2026-10-27:** the public embed carries no comment bodies.
2. ~~What goes on the card?~~ **Answered 2026-10-27:**
   - author ✓ · date;
   - caption;
   - the music on reels;
   - likes · comments · views.

   A photo shows its date only.

## Outcome
| # | Criterion | Result |
|---|---|---|

---

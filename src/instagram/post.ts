// What the card above the reactions shows: the facts the item's embed read already kept, and the
// date its shortcode holds. It asks the network nothing.
import type { Item, Post } from './adapter';
import { factsOf } from './media';
import * as S from './selectors';

/** When the post was made, from its shortcode alone; null for a code that is no plain media id. */
function postedMsOf(shortcode: string, sentMs: number): number | null {
  // A media id fits 64 bits, 11 characters; longer codes carry more than the id.
  if (shortcode.length > 11) return null;
  let id = 0n;
  for (const c of shortcode) {
    const digit = S.SHORTCODE_ALPHABET.indexOf(c);
    if (digit < 0) return null;
    id = id * 64n + BigInt(digit);
  }
  const ms = Number((id >> S.MEDIA_ID_TIME_SHIFT) + S.MEDIA_ID_EPOCH_MS);
  // A post is made before it is shared, so a later time means the code was no plain id.
  return ms > Number(S.MEDIA_ID_EPOCH_MS) && ms <= sentMs ? ms : null;
}

/** The card's contents; null for an item that is no shared post, or that says nothing. */
export function postOf(item: Item): Post | null {
  const { shortcode, path } = item.source;
  if (!shortcode || !path) return null;
  const postedMs = postedMsOf(shortcode, item.timestampMs);
  const facts = factsOf(path);
  if (!facts && postedMs === null) return null;
  return {
    author: null,
    verified: false,
    caption: null,
    likes: null,
    comments: null,
    views: null,
    music: null,
    ...facts,
    postedMs,
  };
}

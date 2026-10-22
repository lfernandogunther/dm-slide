// The strip of loaded reels on the left, in chat order: one tile per reel, the current one
// outlined, my reaction and a 💬 on the ones I reacted or replied to. Numbers count from the
// newest (1, at the bottom), so older reels loading at the top never renumber the ones already there.
import type { Item } from '../instagram/adapter';

export type StripEdge = 'loading' | 'start' | null;

const EDGE_TEXT = { loading: 'Loading older…', start: 'Start of chat' };

/** `follow` scrolls to the current tile; otherwise the visible tiles stay put while older ones prepend. */
export function renderStrip(strip: HTMLElement, items: Item[], current: number, edge: StripEdge, follow: boolean): void {
  const fromBottom = strip.scrollHeight - strip.scrollTop;
  const edgeTile = document.createElement('li');
  edgeTile.className = 'edge';
  edgeTile.hidden = edge === null;
  edgeTile.textContent = edge ? EDGE_TEXT[edge] : '';
  strip.replaceChildren(
    edgeTile,
    ...items.map((item, i) => {
      const tile = document.createElement('li');
      tile.dataset.i = String(i);
      tile.textContent = String(items.length - i);
      tile.classList.toggle('current', i === current);
      tile.classList.toggle('reacted', item.myReaction !== null);
      if (item.myReaction) tile.dataset.reaction = item.myReaction;
      tile.classList.toggle('replied', item.myReplies.length > 0);
      return tile;
    }),
  );
  if (follow) strip.querySelector('.current')?.scrollIntoView({ block: 'nearest' });
  else strip.scrollTop = strip.scrollHeight - fromBottom;
  // The edge tile sits above the oldest reel, where scrolling to that reel would hide it.
  if (edge && current === 0) strip.scrollTop = 0;
}

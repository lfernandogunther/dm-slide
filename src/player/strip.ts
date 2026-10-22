// The strip of loaded items on the left, in chat order: one tile per item, the current one
// outlined, my reaction and a 💬 on the ones I reacted or replied to. Numbers count from the
// newest (1, at the bottom) over every loaded item, so neither older items loading at the top nor
// the filter hiding some ever renumber a tile.
import type { Item } from '../instagram/adapter';

export type StripEdge = 'loading' | 'start' | null;

const EDGE_TEXT = { loading: 'Loading older…', start: 'Start of chat' };

/** `follow` scrolls to the current tile; otherwise the visible tiles stay put while older ones prepend. */
export function renderStrip(
  strip: HTMLElement,
  items: Item[],
  current: number,
  edge: StripEdge,
  follow: boolean,
  shown: (i: number) => boolean,
): void {
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
      tile.hidden = !shown(i);
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
  // The edge tile sits above the oldest shown item, where scrolling to that item would hide it.
  if (edge && current === items.findIndex((_, i) => shown(i))) strip.scrollTop = 0;
}

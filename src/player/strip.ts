// The strip of loaded items on the left, in chat order: one tile per item showing its thumbnail, the
// current one outlined, a mark for every kind but reels, a 💬 at the top when the sender wrote with
// it, my reaction and a 💬 on the ones I reacted or replied to. Numbers count from the newest (1, at
// the bottom) over every loaded item, so neither older items loading at the top nor the filter
// hiding some ever renumber a tile. A tile without a thumbnail, or whose thumbnail fails, shows its
// number large instead.
import type { Item, ItemKind } from '../instagram/adapter';
import { animate, reduceMotion } from './motion';

export type StripEdge = 'loading' | 'start' | null;
/** Whether to bring the current tile into view: at once, gliding there, or not at all. */
export type Follow = boolean | 'glide';

const FOLLOW_MS = 280;

const EDGE_TEXT = { loading: 'Loading older…', start: 'Start of chat' };

// Reels are most of what is sent, so they stay unmarked and the rest stands out.
const KIND_ICON: Record<ItemKind, string> = { reel: '', post: '🖼', carousel: '▦', story: '◯', gallery: '📷' };

export interface Strip {
  /** `follow` scrolls to the current tile; otherwise the visible tiles stay put while older ones prepend. */
  render(items: Item[], current: number, edge: StripEdge, follow: Follow, shown: (i: number) => boolean): void;
  /** The item's tile when it is shown and wholly in view, else null. */
  visibleTile(id: string): HTMLElement | null;
}

function mark(className: string, text: string, title?: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  if (title) span.title = title;
  return span;
}

/** A tile is built once per item and kept, so its thumbnail loads once and never flickers on a render. */
function createTile(item: Item): HTMLLIElement {
  const tile = document.createElement('li');
  tile.append(mark('num', ''));
  if (item.thumb) {
    const img = document.createElement('img');
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    // A signed URL that expired, or a format the browser can't show: the number stands in.
    img.onerror = () => {
      img.remove();
      tile.classList.remove('thumb');
    };
    img.src = item.thumb;
    tile.classList.add('thumb');
    tile.prepend(img);
  }
  if (KIND_ICON[item.kind]) tile.append(mark('kind', KIND_ICON[item.kind]));
  if (item.notes.length) tile.append(mark('note', '💬', 'They wrote with it'));
  return tile;
}

/** `box` scrolls; the list inside it is what glides. */
export function createStrip(box: HTMLElement): Strip {
  const strip = document.createElement('ol');
  box.append(strip);
  const tiles = new Map<string, HTMLLIElement>();
  const edgeTile = document.createElement('li');
  edgeTile.className = 'edge';

  return {
    render(items, current, edge, follow, shown) {
      const fromBottom = box.scrollHeight - box.scrollTop;
      const top = box.scrollTop;
      edgeTile.hidden = edge === null;
      edgeTile.textContent = edge ? EDGE_TEXT[edge] : '';
      const list = items.map((item, i) => {
        let tile = tiles.get(item.id);
        if (!tile) tiles.set(item.id, (tile = createTile(item)));
        tile.dataset.i = String(i);
        tile.hidden = !shown(i);
        tile.querySelector('.num')!.textContent = String(items.length - i);
        tile.classList.toggle('current', i === current);
        tile.classList.toggle('reacted', item.myReaction !== null);
        if (item.myReaction) tile.dataset.reaction = item.myReaction;
        else delete tile.dataset.reaction;
        tile.classList.toggle('replied', item.myReplies.length > 0);
        return tile;
      });
      // Only when the list changed, so a render that changes no tile moves none.
      const children = strip.children;
      if (children.length !== list.length + 1 || list.some((tile, i) => children[i + 1] !== tile)) {
        strip.replaceChildren(edgeTile, ...list);
      }
      if (follow) strip.querySelector('.current')?.scrollIntoView({ block: 'nearest' });
      else box.scrollTop = box.scrollHeight - fromBottom;
      // The edge tile sits above the oldest shown item, where scrolling to that item would hide it.
      if (edge && current === items.findIndex((_, i) => shown(i))) box.scrollTop = 0;
      // The scroll already jumped; the list starts where it was and glides to it.
      const moved = box.scrollTop - top;
      if (follow === 'glide' && moved && !reduceMotion()) {
        animate(strip, [{ transform: `translateY(${moved}px)` }, { transform: 'none' }], { duration: FOLLOW_MS });
      }
    },
    visibleTile(id) {
      const tile = tiles.get(id);
      if (!tile?.isConnected || tile.hidden) return null;
      const t = tile.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      return t.top >= b.top && t.bottom <= b.bottom ? tile : null;
    },
  };
}

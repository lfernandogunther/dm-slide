// The strip of loaded reels on the left: one tile per reel, the current one outlined, a ❤️ on the
// ones I reacted to.
import type { Reel } from '../instagram/adapter';

export function renderStrip(strip: HTMLElement, reels: Reel[], current: number): void {
  strip.replaceChildren(
    ...reels.map((reel, i) => {
      const tile = document.createElement('li');
      tile.dataset.i = String(i);
      tile.textContent = String(i + 1);
      tile.classList.toggle('current', i === current);
      tile.classList.toggle('reacted', reel.myReaction !== null);
      if (reel.myReaction) tile.dataset.reaction = reel.myReaction;
      return tile;
    }),
  );
  strip.querySelector('.current')?.scrollIntoView({ block: 'nearest' });
}

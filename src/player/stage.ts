// The current reel. For now a placeholder naming it; playback comes in S01 #06.
import type { Reel } from '../instagram/adapter';

export function renderStage(stage: HTMLElement, reel: Reel): void {
  const when = document.createElement('span');
  when.className = 'muted';
  when.textContent = new Date(reel.timestampMs).toLocaleString();
  const code = document.createElement('strong');
  code.textContent = reel.shortcode;
  stage.replaceChildren(code, when);
}

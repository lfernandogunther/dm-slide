// The "▶ Reel Queue" entry button in the thread header. It lives in its own shadow root so
// Instagram's CSS never reaches it; color and font are inherited from the header.
import type { Reel } from '../instagram/adapter';

export const BUTTON_HOST_ATTR = 'data-reel-queue';

const STYLE = `
  button {
    font: inherit; font-size: 13px; font-weight: 600; color: inherit;
    background: transparent; border: 1px solid currentColor; border-radius: 999px;
    padding: 6px 12px; margin-right: 8px; white-space: nowrap; cursor: pointer;
  }
  button:disabled { opacity: 0.5; cursor: default; }
`;

export type ButtonState = { reels: Reel[] } | { error: string };

export function createButton(onOpen: () => void): HTMLElement {
  const host = document.createElement('span');
  host.setAttribute(BUTTON_HOST_ATTR, '');
  host.style.display = 'flex';
  host.style.alignItems = 'center';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${STYLE}</style><button type="button"></button>`;
  root.querySelector('button')!.addEventListener('click', onOpen);
  return host;
}

export function renderButton(host: HTMLElement, state: ButtonState): void {
  const button = host.shadowRoot!.querySelector('button')!;
  let label: string;
  let title = '';
  if ('error' in state) {
    label = "Reel Queue · can't read";
    title = state.error;
  } else if (state.reels.length === 0) {
    label = 'No reels';
  } else {
    label = `▶ Reel Queue · ${state.reels.filter((r) => r.myReaction === null).length} to react`;
  }
  // Rewriting identical text would still be a DOM write; skip it.
  if (button.textContent !== label) button.textContent = label;
  if (button.title !== title) button.title = title;
  // In error the button stays clickable, to say why the player can't open.
  button.disabled = 'reels' in state && state.reels.length === 0;
}

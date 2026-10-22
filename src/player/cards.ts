// How a state looks: a card or a pill on the video, carrying the keys that act on it, so every
// state speaks in one voice. The overlay and the stage decide when; this decides how.
import { animate } from './motion';

/** A key and what it does here; with `act`, the pill is also a button doing the same. */
export interface KeyAct {
  key: string;
  label: string;
  act?: () => void;
}

export interface CardContent {
  big?: string;
  title: string;
  text: string;
  detail?: string;
  keys: KeyAct[];
}

const PILL_FADE_MS = 300;

function el(tag: string, className: string, text: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

export function keysRow(keys: KeyAct[]): HTMLElement {
  const row = el('div', 'c-keys', '');
  for (const { key, label, act } of keys) {
    const kb = document.createElement(act ? 'button' : 'span');
    kb.className = 'kb';
    if (act) {
      (kb as HTMLButtonElement).type = 'button';
      // Not focusable: Space must keep pausing instead of pressing it.
      kb.tabIndex = -1;
      kb.addEventListener('click', act);
    }
    kb.append(el('b', '', key), label);
    row.append(kb);
  }
  return row;
}

export function stateCard({ big, title, text, detail, keys }: CardContent): HTMLElement {
  const card = el('div', 'c-card', '');
  if (big) card.append(el('div', 'big', big));
  card.append(el('h3', '', title), el('p', '', text));
  if (detail) card.append(el('p', 'detail', detail));
  card.append(keysRow(keys));
  return card;
}

export interface Pill {
  /** Shows `text`, red-edged when `bad`; with `ms`, it fades away after that long. */
  show(text: string, ms?: number, bad?: boolean): void;
  hide(): void;
  readonly text: string | null;
}

/** One pill at the top of `parent`: a newer one replaces the one showing. */
export function createPill(parent: HTMLElement): Pill {
  const pill = el('div', 'c-pill', '');
  pill.hidden = true;
  parent.append(pill);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let fading: Animation | null = null;
  const stop = () => {
    clearTimeout(timer);
    fading?.cancel();
    fading = null;
  };
  return {
    show(text, ms, bad = false) {
      stop();
      pill.textContent = text;
      pill.classList.toggle('bad', bad);
      pill.hidden = false;
      if (ms) {
        timer = setTimeout(() => {
          fading = animate(pill, [{ opacity: 1 }, { opacity: 0 }], { duration: PILL_FADE_MS, easing: 'linear', fade: 'out' });
          fading.onfinish = () => {
            fading = null;
            pill.hidden = true;
          };
        }, ms);
      }
    },
    hide() {
      stop();
      pill.hidden = true;
    },
    get text() {
      return pill.hidden ? null : pill.textContent;
    },
  };
}

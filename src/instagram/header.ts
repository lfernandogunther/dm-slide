// Finds the thread header's icon buttons from the DOM alone, so the isolated content script can
// place the entry button without asking the page script.
import * as S from './selectors';

function isMessageScroller(el: HTMLElement): boolean {
  return (
    S.SCROLLABLE_OVERFLOW.includes(getComputedStyle(el).overflowY) &&
    el.clientWidth > S.MESSAGE_SCROLLER_MIN.width &&
    el.clientHeight > S.MESSAGE_SCROLLER_MIN.height
  );
}

function isIconRow(el: Element): boolean {
  const kids = [...el.children];
  return (
    kids.length >= S.HEADER_ICON_COUNT.min &&
    kids.length <= S.HEADER_ICON_COUNT.max &&
    kids.every((k) => k.getAttribute('role') === 'button' && k.querySelector('svg'))
  );
}

/** The header's icon row, or null unless exactly one is found: never place the button on a guess. */
export function findHeaderIcons(): HTMLElement | null {
  const main = document.querySelector('main');
  if (!main) return null;
  const found = new Set<HTMLElement>();
  for (const scroller of main.querySelectorAll<HTMLElement>('div')) {
    if (!isMessageScroller(scroller)) continue;
    for (let n: HTMLElement | null = scroller; n && n !== main; n = n.parentElement) {
      const header = n.previousElementSibling;
      const rows = header ? [...header.querySelectorAll<HTMLElement>('div')].filter(isIconRow) : [];
      rows.forEach((r) => found.add(r));
      if (rows.length) break;
    }
  }
  return found.size === 1 ? [...found][0] : null;
}

// The player: a full-window overlay in its own shadow root, laid out like the prototype
// (specs/01-mvp/prototype/index.html). It talks only to the ThreadAdapter.
import type { Reel, ThreadAdapter } from '../instagram/adapter';
import { bindKeys } from './keys';
import { createStage } from './stage';
import { renderStrip } from './strip';

const STYLE = `
  * { box-sizing: border-box; }
  button { font: inherit; color: inherit; cursor: pointer; }
  .player {
    position: absolute; inset: 0; display: flex; flex-direction: column; outline: 0;
    background: #000; color: #f5f5f5;
    font: 14px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  .muted { color: #a8a8a8; }
  kbd {
    font: 11px ui-monospace, monospace; background: #262626; border: 1px solid #3a3a3a;
    border-bottom-width: 2px; border-radius: 4px; padding: 0 5px;
  }
  .p-head { display: flex; align-items: center; gap: 16px; padding: 10px 16px; border-bottom: 1px solid #262626; flex-wrap: wrap; }
  .p-title { flex: 1; min-width: 160px; }
  .p-keys { display: flex; gap: 10px; flex-wrap: wrap; font-size: 12px; color: #a8a8a8; }
  .icon-btn { background: transparent; border: 0; font-size: 18px; padding: 4px 8px; }
  .p-body { flex: 1; display: flex; gap: 16px; padding: 16px; min-height: 0; }
  .p-strip {
    list-style: none; margin: 0; padding: 4px 12px 8px 0; width: 84px; flex-shrink: 0;
    overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column; gap: 8px;
    scrollbar-width: thin; scrollbar-color: transparent transparent;
  }
  .p-strip:hover { scrollbar-color: #4a4a4a transparent; }
  .p-strip li {
    position: relative; width: 60px; height: 92px; flex-shrink: 0; border-radius: 8px; cursor: pointer;
    display: grid; place-items: center; font-size: 16px; background: #1c1c1e; opacity: 0.5;
    border: 2px solid transparent;
  }
  .p-strip li.current { opacity: 1; border-color: #fff; }
  .p-strip li.reacted::after { content: attr(data-reaction); position: absolute; right: -6px; bottom: -6px; font-size: 14px; }
  .p-stage { flex: 1; display: flex; align-items: center; justify-content: center; gap: 14px; min-width: 0; }
  .nav { width: 44px; height: 44px; border-radius: 50%; border: 0; background: #262626; font-size: 24px; flex-shrink: 0; }
  .nav:disabled { opacity: 0.25; cursor: default; }
  .p-center { display: flex; flex-direction: column; gap: 10px; align-items: stretch; }
  .reel {
    position: relative; overflow: hidden; cursor: pointer;
    height: clamp(280px, calc(100vh - 220px), 640px); aspect-ratio: 9 / 16; border-radius: 14px;
    background: #1c1c1e; display: grid; place-items: center;
  }
  .reel video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: #000; }
  .reel [hidden] { display: none; }
  .reel-status { text-align: center; color: #a8a8a8; padding: 16px; line-height: 1.8; }
  .reel-status a { color: #0095f6; }
  .reel-play {
    position: absolute; font-size: 40px; opacity: 0; transition: opacity 0.2s; pointer-events: none;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
  }
  .reel.paused .reel-play { opacity: 1; }
  .reel-mute {
    position: absolute; right: 12px; bottom: 16px; width: 28px; height: 28px; border-radius: 50%;
    border: 0; padding: 0; background: rgba(38, 38, 38, 0.8); color: #fff; display: grid; place-items: center;
  }
  .reel-progress { position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: rgba(255, 255, 255, 0.25); }
  .reel-progress div { height: 100%; width: 0; background: #fff; }
  .p-reply { display: flex; gap: 8px; align-items: center; background: #121212; border: 1px solid #3a3a3a; border-radius: 22px; padding: 4px 6px 4px 14px; }
  .p-reply:focus-within { border-color: #0095f6; }
  .p-reply input { flex: 1; min-width: 0; background: transparent; border: 0; outline: 0; padding: 8px 0; color: inherit; font: inherit; }
  .p-reply button { border: 0; background: #0095f6; border-radius: 16px; padding: 6px 12px; font-weight: 600; }
  .p-reply button:disabled { opacity: 0.4; cursor: default; }
  .p-actions { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .heart { width: 60px; height: 60px; border-radius: 50%; border: 0; background: #262626; font-size: 28px; }
  .heart:disabled { cursor: default; }
`;

const LAYOUT = `
  <div class="player" tabindex="-1">
    <header class="p-head">
      <div class="p-title"><strong>Reel Queue</strong> <span class="muted" data-pos></span></div>
      <div class="p-keys">
        <span><kbd>A</kbd><kbd>D</kbd> or <kbd>←</kbd><kbd>→</kbd> prev / next</span>
        <span><kbd>Space</kbd> pause</span><span><kbd>M</kbd> sound</span><span><kbd>R</kbd> reply</span><span><kbd>Esc</kbd> close</span>
      </div>
      <button class="icon-btn" data-close title="Close (Esc)">✕</button>
    </header>
    <div class="p-body">
      <ol class="p-strip" data-strip></ol>
      <div class="p-stage">
        <button class="nav" data-prev title="Previous (A / ←)">‹</button>
        <div class="p-center">
          <div class="reel" data-reel></div>
          <form class="p-reply" data-reply-form>
            <input type="text" data-reply autocomplete="off" placeholder="Reply…">
            <button type="submit" disabled title="Sending comes in S01 #08">Send</button>
          </form>
        </div>
        <div class="p-actions">
          <button class="heart" data-heart disabled title="Reacting comes in S01 #07"></button>
        </div>
        <button class="nav" data-next title="Next (D / →)">›</button>
      </div>
    </div>
  </div>
`;

export interface Player {
  close(): void;
}

/** The oldest loaded reel without my reaction, or the newest one when every reel has one. */
export function startIndex(reels: Reel[]): number {
  const unreacted = reels.findIndex((r) => r.myReaction === null);
  return unreacted >= 0 ? unreacted : reels.length - 1;
}

export function openPlayer(adapter: ThreadAdapter, reels: Reel[], start: number, onClose: () => void): Player {
  const host = document.createElement('div');
  host.style.cssText = 'position: fixed; inset: 0; z-index: 2147483647;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${STYLE}</style>${LAYOUT}`;
  const $ = <T extends HTMLElement>(attr: string) => root.querySelector<T>(`[${attr}]`)!;
  const player = root.querySelector<HTMLElement>('.player')!;
  const reply = $<HTMLInputElement>('data-reply');
  const stage = createStage($('data-reel'), adapter);

  let current = start;

  function render(): void {
    const reel = reels[current];
    const left = reels.filter((r) => r.myReaction === null).length;
    $('data-pos').textContent = `· ${current + 1} of ${reels.length} loaded · ${left} without ❤️`;
    $<HTMLButtonElement>('data-prev').disabled = current === 0;
    $<HTMLButtonElement>('data-next').disabled = current === reels.length - 1;
    $('data-heart').textContent = reel.myReaction ?? '♡';
    stage.show(reel, reels[current + 1]);
    renderStrip($('data-strip'), reels, current);
  }

  function go(index: number): void {
    if (index < 0 || index >= reels.length) return;
    current = index;
    render();
    // Following the chat is a convenience: if the row can't be found, the player carries on.
    try {
      adapter.reveal(reels[current].id);
    } catch (e) {
      console.warn('[reel-queue]', e instanceof Error ? e.message : e);
    }
  }

  const unbindKeys = bindKeys((e) => e.composedPath()[0] === reply, {
    prev: () => go(current - 1),
    next: () => go(current + 1),
    close,
    togglePause: () => stage.togglePause(),
    toggleMute: () => stage.toggleMute(),
    focusReply: () => reply.focus(),
    blurReply: () => player.focus(),
  });

  function close(): void {
    unbindKeys();
    stage.destroy();
    host.remove();
    onClose();
  }

  $('data-close').addEventListener('click', close);
  $('data-prev').addEventListener('click', () => go(current - 1));
  $('data-next').addEventListener('click', () => go(current + 1));
  $('data-strip').addEventListener('click', (e) => {
    const tile = (e.target as Element).closest<HTMLElement>('li[data-i]');
    if (tile) go(Number(tile.dataset.i));
  });
  $('data-reel').addEventListener('click', (e) => {
    if (!(e.target as Element).closest('a')) stage.togglePause();
  });
  $('data-reply-form').addEventListener('submit', (e) => e.preventDefault());

  // Instagram's composer may hold the focus; typed keys would land in it.
  (document.activeElement as HTMLElement | null)?.blur();
  document.body.append(host);
  player.focus();
  go(start);
  return { close };
}

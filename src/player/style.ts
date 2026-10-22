// The player's CSS, inside its shadow root: the strip on the left, the video alone in the middle, a
// panel on the right as tall as what it holds. Always dark, like Instagram's own player.
export const STYLE = `
  * { box-sizing: border-box; }
  [hidden] { display: none !important; }
  button { font: inherit; color: inherit; cursor: pointer; }
  .player {
    position: absolute; inset: 0; display: flex; flex-direction: column; outline: 0;
    background: #000; color: #f5f5f5;
    font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    /* The video's height: the window's, unless its width leaves less room beside the strip, panel and arrows. */
    --video-h: max(240px, min(calc(100vh - 64px), calc((100vw - 538px) * 16 / 9)));
    --side-w: 320px;
  }
  .muted { color: #a8a8a8; }

  .p-head { display: flex; align-items: center; gap: 12px; height: 48px; padding: 9px 16px; flex-shrink: 0; }
  .p-title { font-weight: 600; }
  .p-pos { font: 600 12px ui-monospace, monospace; color: #a8a8a8; white-space: nowrap; }
  .p-hold { font-size: 11px; color: #6b6b6b; white-space: nowrap; }
  .sp { flex: 1; }
  .pill { position: relative; background: transparent; border: 1px solid #3a3a3a; border-radius: 999px; padding: 3px 11px; font-size: 12px; white-space: nowrap; }
  .pill[aria-pressed="true"] { background: #f5f5f5; border-color: #f5f5f5; color: #000; }
  .circ {
    position: relative; width: 30px; height: 30px; border-radius: 50%; border: 0; padding: 0; flex-shrink: 0;
    display: grid; place-items: center; background: #1c1c1e; font-size: 14px;
  }
  .circ[aria-pressed="true"] { background: #f5f5f5; color: #000; }
  .p-alert {
    position: absolute; z-index: 6; top: 48px; left: 0; right: 0;
    padding: 8px 16px; background: #3a1d1d; color: #ffb4b4; text-align: center;
  }
  .p-notice { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 16px; text-align: center; }
  .p-notice strong { font-size: 18px; }
  .p-notice p { margin: 0; max-width: 480px; overflow-wrap: anywhere; }
  .p-notice button { margin-top: 8px; border: 0; background: #262626; border-radius: 16px; padding: 6px 16px; }

  .p-body { position: relative; flex: 1; display: flex; gap: 16px; padding: 0 16px 16px; min-height: 0; }

  .p-strip {
    list-style: none; margin: 0; padding: 4px 0; width: 62px; flex-shrink: 0;
    overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column; gap: 8px; scrollbar-width: none;
  }
  .p-strip li {
    position: relative; width: 52px; height: 80px; flex-shrink: 0; border-radius: 8px; cursor: pointer;
    display: grid; place-items: center; font-size: 15px; background: #1c1c1e; opacity: 0.55;
    border: 2px solid transparent;
  }
  .p-strip li img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 6px; }
  .p-strip li.thumb .num {
    position: absolute; left: 4px; bottom: 2px; font: 600 9px ui-monospace, monospace;
    color: rgba(255, 255, 255, 0.85); text-shadow: 0 1px 2px #000;
  }
  .p-strip li.current { opacity: 1; border-color: #fff; }
  .p-strip li.edge { height: auto; background: none; opacity: 1; border: 0; cursor: default; font-size: 11px; color: #a8a8a8; text-align: center; }
  .p-strip li .kind { position: absolute; left: 3px; top: 2px; font-size: 10px; line-height: 1; }
  .p-strip li .note { position: absolute; right: 3px; top: 2px; font-size: 10px; line-height: 1; }
  .p-strip li.reacted::after { content: attr(data-reaction); position: absolute; right: -6px; bottom: -6px; font-size: 13px; }
  .p-strip li.replied::before { content: "💬"; position: absolute; right: -6px; bottom: -6px; font-size: 12px; }
  .p-strip li.replied.reacted::before { right: 10px; }

  .p-theatre { flex: 1; display: flex; align-items: center; justify-content: center; min-width: 0; }
  .p-video { position: relative; height: var(--video-h); aspect-ratio: 9 / 16; flex-shrink: 0; }
  .nav {
    position: absolute; top: calc(50% - 16px); width: 32px; height: 32px;
    border-radius: 50%; border: 0; padding: 0; background: #1c1c1e; font-size: 18px; display: grid; place-items: center;
  }
  .nav.prev { left: -46px; }
  .nav.next { right: -46px; }
  .nav:disabled { opacity: 0.25; cursor: default; }
  .p-empty {
    position: absolute; z-index: 3; top: 48px; left: 12px; right: 12px; display: flex; flex-direction: column; gap: 8px;
    align-items: center; padding: 12px; border-radius: 12px; background: rgba(38, 38, 38, 0.92); text-align: center;
  }
  .p-empty button { border: 0; background: #0095f6; border-radius: 16px; padding: 6px 16px; font-weight: 600; }

  .reel {
    position: absolute; inset: 0; overflow: hidden; cursor: pointer; border-radius: 14px;
    background: #1c1c1e; display: grid; place-items: center;
  }
  .reel video, .reel img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: #000; }
  .reel-status { position: relative; text-align: center; color: #a8a8a8; padding: 16px; line-height: 1.8; }
  .reel-status a { color: #0095f6; }
  .reel-play {
    position: absolute; left: 50%; top: 50%; width: 64px; height: 64px; margin: -32px 0 0 -32px; border-radius: 50%;
    background: rgba(0, 0, 0, 0.5); display: grid; place-items: center; font-size: 26px; pointer-events: none;
    opacity: 0; transform: scale(0.8); transition: opacity 0.15s, transform 0.15s;
  }
  .reel.paused .reel-play { opacity: 1; transform: scale(1); }
  .reel-mute {
    position: absolute; right: 12px; bottom: 14px; width: 28px; height: 28px; border-radius: 50%;
    border: 0; padding: 0; background: rgba(38, 38, 38, 0.8); color: #fff; display: grid; place-items: center;
  }
  .reel-progress { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: rgba(255, 255, 255, 0.25); }
  .reel-progress div { height: 100%; width: 0; background: #fff; }
  .reel-dots { position: absolute; top: 4px; left: 0; right: 0; display: flex; justify-content: center; gap: 0; }
  .reel-dots span { width: 6px; height: 6px; margin: 4px 2.5px; cursor: pointer; border-radius: 50%; background: rgba(255, 255, 255, 0.4); }
  .reel-dots span.on { background: #fff; }

  /* The panel is as tall as what it holds, its foot level with the video's; it grows upward. */
  .p-side { width: var(--side-w); flex-shrink: 0; align-self: center; height: var(--video-h); display: flex; flex-direction: column; justify-content: flex-end; }
  .p-panel { background: #121212; border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 10px; min-height: 0; max-height: 100%; }
  .p-who { display: flex; gap: 10px; align-items: center; min-width: 0; }
  .p-who > div { min-width: 0; }
  .p-who b { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .p-av { width: 32px; height: 32px; border-radius: 50%; background: #3a2a4a; display: grid; place-items: center; font-weight: 600; flex-shrink: 0; }
  .p-date { font-size: 11px; color: #a8a8a8; }
  .p-talk { min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; scrollbar-width: thin; scrollbar-color: #3a3a3a transparent; }
  .p-talk h4 { margin: 4px 0 0; font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: #8a8a8a; font-weight: 600; }
  .p-th { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  .bub { background: #262626; border-radius: 12px; padding: 4px 10px; font-size: 12.5px; max-width: 100%; overflow-wrap: anywhere; align-self: flex-end; }
  .bub.theirs { background: #1c1c1e; align-self: flex-start; }
  .p-emos { display: flex; justify-content: space-between; padding-top: 8px; }
  .emo {
    position: relative; width: 38px; height: 38px; border-radius: 50%; border: 0; padding: 0; flex-shrink: 0;
    background: transparent; font-size: 19px; display: grid; place-items: center;
  }
  .emo:hover { background: #1c1c1e; }
  .emo.mine { background: #262626; box-shadow: 0 0 0 2px #fff inset; }
  .reacting .emo { opacity: 0.4; cursor: progress; }
  .p-box {
    position: relative; margin: 0; background: #000; border: 1px solid #3a3a3a; border-radius: 12px; padding: 8px 10px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .p-box:focus-within { border-color: #0095f6; }
  .p-box input[type="text"] { min-width: 0; background: transparent; border: 0; outline: 0; padding: 0; color: inherit; font: inherit; }
  .p-box input[type="text"]:disabled { opacity: 0.5; }
  .p-row { display: flex; align-items: center; gap: 8px; }
  .p-row [data-reply-status] { flex: 1; font-size: 11px; color: #a8a8a8; text-align: right; }
  .p-quote { position: relative; font-size: 11px; border-radius: 10px; padding: 1px 8px; white-space: nowrap; cursor: pointer; background: #262626; color: #a8a8a8; }
  .p-quote:has(input:checked) { background: #1d3a5a; color: #cfe6ff; }
  .p-quote input { position: absolute; opacity: 0; pointer-events: none; }
  .send { border: 0; background: #0095f6; color: #fff; border-radius: 16px; padding: 4px 11px; font-weight: 600; }
  .send:disabled { opacity: 0.45; cursor: default; }
  .p-setting { display: flex; gap: 6px; align-items: center; font-size: 11px; color: #a8a8a8; cursor: pointer; }
  .p-setting input { margin: 0; }

  /* Key tips: each control's key, shown while Option (Alt) is held or ? is on. */
  .kt, [data-kt]::after {
    position: absolute; z-index: 5; left: 50%; top: 50%; pointer-events: none; white-space: nowrap;
    font: 700 12px/1 ui-monospace, monospace; color: #111; background: #ffd60a; border-radius: 5px; padding: 4px 6px;
    box-shadow: 0 2px 0 #b38f00, 0 4px 14px rgba(0, 0, 0, 0.6);
    opacity: 0; transform: translate(-50%, -50%) scale(0.7); transition: opacity 0.12s, transform 0.12s;
  }
  [data-kt]::after { content: attr(data-kt); }
  [data-kt-at="t"]::after { top: 0; }
  [data-kt-at="b"]::after { top: 100%; }
  [data-kt-at="tl"]::after { left: 0; top: 0; }
  [data-kt-at="br"]::after { left: 100%; top: 100%; }
  .kt.w { left: 47px; top: 16px; }
  .kt.s { left: 47px; top: auto; bottom: 22px; }
  .tips .kt, .tips [data-kt]::after { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  /* A reaction's tip sits above the emoji, not on it. */
  .tips .emo::after { transform: translate(-50%, -95%) scale(1); }
  .p-dim { position: absolute; inset: 0; z-index: 4; background: rgba(0, 0, 0, 0.35); opacity: 0; transition: opacity 0.12s; pointer-events: none; }
  .tips .p-dim { opacity: 1; }

  /* Narrow (half a Full HD): the arrows go onto the video and the panel slims. */
  @media (max-width: 1199px) {
    .player { --video-h: max(240px, min(calc(100vh - 64px), calc((100vw - 406px) * 16 / 9))); --side-w: 280px; }
    .nav { top: calc(50% - 15px); width: 30px; height: 30px; font-size: 16px; background: rgba(0, 0, 0, 0.45); color: #fff; }
    .nav.prev { left: 8px; }
    .nav.next { right: 8px; }
  }
`;

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
  .p-body { position: relative; flex: 1; display: flex; gap: 16px; padding: 0 16px 16px; min-height: 0; }

  .p-strip { width: 62px; flex-shrink: 0; overflow-y: auto; overflow-x: hidden; scrollbar-width: none; }
  .p-strip ol { list-style: none; margin: 0; padding: 4px 0; display: flex; flex-direction: column; gap: 8px; }
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
  .p-strip li.skel { background: #1d1d20; opacity: 1; overflow: hidden; cursor: default; }
  .p-strip li.skel::before {
    content: ""; position: absolute; inset: 0;
    background: linear-gradient(170deg, transparent 30%, rgba(255, 255, 255, 0.09) 50%, transparent 70%);
    animation: skel-shine 1.1s linear infinite;
  }
  @keyframes skel-shine { from { transform: translateY(-100%); } to { transform: translateY(100%); } }
  .p-strip li.edge { height: auto; background: none; opacity: 1; border: 0; cursor: default; font-size: 11px; color: #a8a8a8; text-align: center; }
  .p-strip li .kind { position: absolute; left: 3px; top: 2px; font-size: 10px; line-height: 1; }
  .p-strip li .note { position: absolute; right: 3px; top: 2px; font-size: 10px; line-height: 1; }
  .p-strip li.reacted::after { content: attr(data-reaction); position: absolute; right: 3px; bottom: 2px; font-size: 13px; line-height: 1; }
  .p-strip li.replied::before { content: "💬"; position: absolute; right: 3px; bottom: 2px; font-size: 12px; line-height: 1; }
  .p-strip li.replied.reacted::before { right: 19px; }
  /* A reaction bursts over the video, then a copy flies to its tile; both rest invisible. */
  .p-burst {
    position: absolute; left: 50%; top: 50%; z-index: 3; font-size: 120px; line-height: 1; pointer-events: none;
    opacity: 0; transform: translate(-50%, -50%);
  }
  .p-flyer {
    position: absolute; left: 0; top: 0; z-index: 20; width: 26px; height: 26px; font-size: 26px; line-height: 26px;
    text-align: center; pointer-events: none; opacity: 0;
  }

  .p-theatre { flex: 1; display: flex; align-items: center; justify-content: center; min-width: 0; }
  .p-frame { justify-content: center; }
  .p-frame .p-video { border-radius: 14px; background: #0d0d0f; }
  .p-video { position: relative; height: var(--video-h); aspect-ratio: 9 / 16; flex-shrink: 0; transform-origin: 0 0; }
  .nav {
    position: absolute; top: calc(50% - 16px); width: 32px; height: 32px;
    border-radius: 50%; border: 0; padding: 0; background: #1c1c1e; font-size: 18px; display: grid; place-items: center;
  }
  .nav.prev { left: -46px; }
  .nav.next { right: -46px; }
  .nav:disabled { opacity: 0.25; cursor: default; }
  .p-video.caught .reel-media { filter: brightness(0.35); }

  .reel {
    position: absolute; inset: 0; overflow: hidden; cursor: pointer; border-radius: 14px;
    background: #1c1c1e; display: grid; place-items: center;
  }
  .reel-media { position: absolute; inset: 0; display: grid; place-items: center; }
  .reel video, .reel img, .reel canvas { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: #000; }
  .reel-status { position: absolute; inset: 0; }
  .reel-cover { position: absolute; inset: 0; overflow: hidden; background: #1d1d20; }
  .reel .reel-cover img { object-fit: cover; background: none; filter: blur(18px) brightness(0.7); transform: scale(1.15); }
  .reel.unplayable .reel-cover img { filter: blur(18px) brightness(0.5); }
  .reel.unplayable .reel-bar { display: none; }
  .reel-bar {
    position: absolute; left: 0; bottom: 0; height: 3px; width: 40%; background: rgba(255, 255, 255, 0.7);
    animation: reel-bar 1s ease-in-out infinite;
  }
  @keyframes reel-bar { from { transform: translateX(-100%); } to { transform: translateX(260%); } }
  @keyframes reel-pulse { from { opacity: 0.2; } to { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) {
    .reel-bar { left: 30%; animation: reel-pulse 1s ease-in-out infinite alternate; }
    .p-strip li.skel::before { animation: reel-pulse 1s ease-in-out infinite alternate; transform: none; }
  }
  /* The loading bar takes the progress bar's place until the media shows. */
  .reel.loading .reel-progress { visibility: hidden; }
  .reel-play {
    position: absolute; left: 50%; top: 50%; width: 64px; height: 64px; margin: -32px 0 0 -32px; border-radius: 50%;
    background: rgba(0, 0, 0, 0.5); display: grid; place-items: center; font-size: 26px; pointer-events: none;
    opacity: 0; transform: scale(0.8); transition: opacity 0.15s, transform 0.15s;
  }
  .reel.paused .reel-play { opacity: 1; transform: scale(1); }
  .vol { position: absolute; right: 12px; bottom: 14px; }
  /* Shown on hover; its bottom padding bridges the gap so the pointer can travel up to it. */
  .vol-panel { position: absolute; left: 0; right: 0; bottom: 100%; padding-bottom: 6px; display: none; }
  .vol:hover .vol-panel { display: block; }
  .vol-panel input {
    display: block; box-sizing: content-box; width: 28px; height: 84px; margin: 0; padding: 10px 0; cursor: pointer;
    background: rgba(38, 38, 38, 0.8); border-radius: 14px; accent-color: #fff; writing-mode: vertical-lr; direction: rtl;
  }
  .reel-mute {
    position: relative; width: 28px; height: 28px; border-radius: 50%;
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
  .emo.bad, .emo.mine.bad { box-shadow: 0 0 0 2px #ff6b6b inset; }
  .p-fail { font-size: 11px; color: #ff6b6b; text-align: center; }
  .bub .st { font-size: 10px; margin-left: 6px; color: rgba(255, 255, 255, 0.7); }
  .bub.sending { opacity: 0.5; }
  .bub.bad { background: transparent; border: 1px solid #ff6b6b; color: #ffb3b3; }
  .bub.bad .st { color: #ff6b6b; }
  b.key { font: 700 10px ui-monospace, monospace; background: #2a2a2a; color: #f5f5f5; border-radius: 4px; padding: 0 4px; }
  .p-box {
    position: relative; margin: 0; background: #000; border: 1px solid #3a3a3a; border-radius: 12px; padding: 8px 10px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .p-box:focus-within { border-color: #0095f6; }
  .p-box input[type="text"] { min-width: 0; background: transparent; border: 0; outline: 0; padding: 0; color: inherit; font: inherit; }
  .p-box input[type="text"]:disabled { opacity: 0.5; }
  .p-row { display: flex; align-items: center; gap: 8px; }
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

  /* States: a card or a pill on the video, with the keys acting on it. */
  .c-card {
    position: absolute; left: 22px; right: 22px; top: 50%; transform: translateY(-50%); z-index: 4;
    background: rgba(18, 18, 18, 0.94); border: 1px solid #333; border-radius: 14px; padding: 18px 16px; text-align: center;
  }
  .c-card h3 { margin: 0 0 4px; font-size: 16px; }
  .c-card p { margin: 0; color: #b5b5b5; font-size: 12.5px; }
  .c-card .detail { margin-top: 8px; font: 11px ui-monospace, monospace; color: #7a7a7a; }
  .c-card .big { font-size: 34px; line-height: 1; margin-bottom: 8px; }
  .c-keys { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 14px; }
  .kb {
    display: inline-flex; gap: 6px; align-items: center; border: 1px solid #3a3a3a; border-radius: 999px;
    padding: 4px 10px; font-size: 12px; white-space: nowrap; background: none; color: inherit;
  }
  button.kb:hover { border-color: #6a6a6a; }
  .kb b { font: 700 11px ui-monospace, monospace; background: #2a2a2a; border-radius: 4px; padding: 1px 5px; }
  .c-pill {
    position: absolute; top: 14px; left: 50%; transform: translateX(-50%); z-index: 4; pointer-events: none;
    background: rgba(10, 10, 10, 0.85); border: 1px solid #333; border-radius: 999px; padding: 6px 14px;
    font-size: 12px; white-space: nowrap;
  }
  .c-pill.bad { border-color: #ff6b6b; }
  .c-coach { position: absolute; inset: 0; z-index: 8; background: rgba(0, 0, 0, 0.72); display: grid; place-items: center; }
  .c-coach .in { background: #151517; border: 1px solid #333; border-radius: 16px; padding: 22px 26px; width: min(560px, calc(100% - 32px)); }
  .c-coach h3 { margin: 0 0 12px; font-size: 18px; }
  .c-coach dl { display: grid; grid-template-columns: auto 1fr auto 1fr; gap: 8px 12px; margin: 0; align-items: center; }
  .c-coach dt { text-align: right; white-space: nowrap; }
  .c-coach dt b { font: 700 11px ui-monospace, monospace; background: #2a2a2a; border-radius: 4px; padding: 2px 6px; }
  .c-coach dd { margin: 0; color: #cfcfcf; }
  .c-coach .go { margin-top: 16px; color: #a8a8a8; text-align: center; }
  .c-coach .go b { font: 700 11px ui-monospace, monospace; background: #2a2a2a; color: #f5f5f5; border-radius: 4px; padding: 1px 5px; }
  .p-back { position: fixed; left: 50%; top: 14px; transform: translateX(-50%); pointer-events: auto; border: 0; background: #ffd60a; color: #111; font-weight: 600; font-size: 12.5px; border-radius: 999px; padding: 5px 14px; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6); white-space: nowrap; }
  .p-back b { font: 700 12px ui-monospace, monospace; background: #111; color: #ffd60a; border-radius: 4px; padding: 1px 6px; margin: 0 2px; }
`;

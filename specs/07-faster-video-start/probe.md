You are helping me measure DM Slide, a Chrome extension I wrote, on MY real Instagram account, in
the tab open on an Instagram DM conversation. DM Slide is a dark player over the chat: a
"DM Slide · X / N loaded" header, a strip of thumbnails, the item in the middle.

Goal: time how long each item takes to show after a key press. You need JavaScript in the page
(top frame) for this; if you cannot run JavaScript, stop and say so.

## Hard rules (break one = stop and tell me)
- Act only on the DM Slide overlay. Never click, type into or focus anything of Instagram's own.
  Clicking DM Slide's "▶ DM Slide" button in the chat header, its thumbnails, its buttons or an
  empty dark area of the overlay is fine.
- Keys only while the overlay is focused (click an empty dark area of it first). Allowed keys: S and
  W. Never press F, 1-6, R, U, I, Enter or Esc. Do not react, do not reply.
- Stop and report if you see "Instagram asked to slow down", "Paused to keep your account safe", a
  login page, "suspicious activity" or a challenge.
- Privacy: your report contains only the report snippet's JSON output and yes/no answers. Never
  write message text, names, usernames, captions, links, ids or URLs. The output holds none of
  those; paste it as is.

## Steps
Part A — moving older, on items not seen yet:
1. If the player is not open, press "▶ DM Slide" in the conversation's header. Wait 5 s.
2. Run the INSTALL snippet below in the top frame. It must return `"probe on"`; anything else, stop
   and report it.
3. Click an empty dark area of the overlay so it has focus.
4. Press W three times as fast as you can, then wait 6 s.
5. Press W twelve more times, waiting 6 s after each press. A "Loading older" pill is fine; stop
   early if "Start of the chat" shows.
6. Run the REPORT snippet; keep its output as PROBE-A.

Part B — moving newer, on items not seen yet:
7. Reload the tab (this clears what the player remembers). Wait 5 s, open the player again, run
   INSTALL again, click an empty dark area of the overlay.
8. In DM Slide's strip of thumbnails, click the oldest thumbnail you can see (the end W moved
   toward). Wait 6 s.
9. Press S fifteen times, waiting 6 s after each press; stop early if the player no longer moves.
10. Run the REPORT snippet; keep its output as PROBE-B.

## INSTALL
```js
(() => {
  const host = [...document.querySelectorAll('body > div')].find((e) => e.shadowRoot?.querySelector('[data-reel]'));
  if (!host) return 'no player open';
  const root = host.shadowRoot;
  const reel = root.querySelector('[data-reel]');
  const pos = root.querySelector('[data-pos]');
  window.__dmsProbe?.stop();
  const t = () => Math.round(performance.now());
  const P = { rows: [], cur: null, frames: new Map() };
  const at = () => Number((pos.textContent || '').split(' / ')[0]) || 0;
  const inflight = () => [...P.frames.values()].some((f) => f.end == null);
  const done = (kind) => {
    if (!P.cur || P.cur.kind) return;
    P.cur.kind = kind;
    P.cur.done = t();
  };
  const start = () => {
    const now = at();
    const prev = P.cur;
    if (prev && prev.at === now) return;
    if (prev) {
      prev.kind ??= 'left';
      P.rows.push(prev);
    }
    P.cur = { at: now, dir: prev ? (now < prev.at ? 'newer' : 'older') : 'first', t0: t(), inflightAtStart: inflight(), own: 0, ahead: 0, read: null, kind: null, done: null };
  };
  const embed = (n) => n.tagName === 'IFRAME' && /\/embed\/?$/.test(new URL(n.src, location.href).pathname);
  const bodyObs = new MutationObserver((muts) => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (!embed(n)) continue;
        const f = { start: t(), end: null };
        P.frames.set(n, f);
        if (!P.cur) continue;
        if (P.cur.kind) P.cur.ahead++;
        else {
          P.cur.own++;
          P.cur.read ??= f;
        }
      }
      for (const n of m.removedNodes) {
        const f = P.frames.get(n);
        if (f) f.end = t();
      }
    }
  });
  const reelObs = new MutationObserver(() => {
    if (!P.cur || P.cur.kind) return;
    if (reel.classList.contains('unplayable')) return done('unplayable');
    if (reel.classList.contains('loading')) return;
    done([...reel.querySelectorAll('video')].some((v) => !v.hidden && v.getAttribute('src')) ? 'video' : 'photo');
  });
  const posObs = new MutationObserver(start);
  bodyObs.observe(document.body, { childList: true });
  reelObs.observe(reel, { attributes: true, attributeFilter: ['class'] });
  posObs.observe(pos, { childList: true, characterData: true, subtree: true });
  P.stop = () => [bodyObs, reelObs, posObs].forEach((o) => o.disconnect());
  window.__dmsProbe = P;
  start();
  return 'probe on';
})();
```

## REPORT
```js
(() => {
  const P = window.__dmsProbe;
  if (!P) return 'no probe';
  const rows = [...P.rows, ...(P.cur ? [P.cur] : [])].map((c) => ({
    dir: c.dir,
    kind: c.kind ?? 'pending',
    inflightAtStart: c.inflightAtStart,
    ownReads: c.own,
    aheadReads: c.ahead,
    toReadStart: c.read ? c.read.start - c.t0 : null,
    readMs: c.read && c.read.end != null ? c.read.end - c.read.start : null,
    readEndToShown: c.read && c.read.end != null && c.done ? c.done - c.read.end : null,
    totalMs: c.done ? c.done - c.t0 : null,
  }));
  const median = (a) => {
    const s = a.filter((x) => x != null).sort((x, y) => x - y);
    return s.length ? s[Math.floor(s.length / 2)] : null;
  };
  const groups = {};
  for (const r of rows) if (r.kind === 'video') (groups[`${r.dir}/${r.ownReads ? 'read' : 'cached'}`] ??= []).push(r.totalMs);
  const medianTotalMs = Object.fromEntries(Object.entries(groups).map(([k, a]) => [k, { n: a.length, median: median(a) }]));
  return JSON.stringify({ rows, medianTotalMs });
})();
```

## Report (paste-ready, nothing else)
PROBE-A: <part A's REPORT output>
PROBE-B: <part B's REPORT output>
Plus one line if anything looked off (an item that never showed, a pill, a card), without names or
content.

# reel-queue

<!-- Personal project. This CLAUDE.md is committed to the repo (it's mine). -->
<!-- Inherits the global ~/.claude rules (plan-first, conventional commits, no AI attribution, etc). -->

Chrome extension that plays the reels sent in an Instagram DM conversation one after another,
with react ❤️ and reply on the same screen. Principles live in [constitution.md](constitution.md);
read it before non-trivial calls.

## Stack & layout
- **Chrome extension, Manifest V3, TypeScript.** A content script runs on
  `https://www.instagram.com/*` and acts only inside a DM thread (`/direct/t/<id>/`): Instagram is a
  SPA, so a narrower match would miss reaching DMs from the home page. There is no background logic
  beyond what MV3 requires.
- **UI:** vanilla TS + DOM, rendered in a **Shadow DOM** overlay so Instagram's CSS and ours never
  touch. No UI framework (constitution #6).
- **Build:** esbuild via `scripts/build.mjs` → `dist/` (loaded unpacked). Typecheck: `tsc --noEmit`.
- **Settings** (auto-advance, quote default): `chrome.storage.local`. Never message content
  (constitution #2).
- Layout:
  - `src/instagram/` is the only code that knows Instagram's markup. `selectors.ts` holds every
    selector; the `ThreadAdapter` reads reels and performs react / reply / load-older.
  - `src/player/` is the overlay (strip, stage, reply box, keys). It talks only to `ThreadAdapter`
    and never to Instagram's DOM.
  - `src/content/` holds the entry point: it injects the header button and handles navigation
    between threads.
  - `manifest.json`, `scripts/` (build), `specs/`, `docs/`.
- The extension's UI copy is English.
- Prototype (disposable, fake data): `specs/01-mvp/prototype/index.html`.

## Run / test / build
- Build: `npm run build` (one-off) or `npm run watch`. Then go to `chrome://extensions` →
  Developer mode → "Load unpacked" → `dist/`, and press reload on the card after each rebuild.
- Test: no automated tests yet (constitution #6). The bar is the manual click-through in
  `specs/01-mvp/spec.md` (Acceptance), on the real Instagram.
- Pre-commit: `npm run typecheck` — run before every commit by the global pre-commit hook.
  This line documents it; each clone declares it in local git config (`git config cn.precommit`),
  because a committed declaration would let any cloned repo run a command of its choosing here.

## Testing on the real Instagram
- Automated checks run on my real account: react only with 👍 (key `6`) or 😂, never ❤️; never
  click, type into or focus Instagram's own elements (`.click()` and dispatched events go on ours
  only); `press_key` only while our overlay is open and focused; never send, never press Enter in
  Instagram's inputs; act on one row at a time.
- Diagnostics I run in my own Chrome are console snippets in the "top" context that return
  numbers and booleans only — never message text, names, usernames or ids.
- Instagram's internals and the testing gotchas live in NOTES.md.

## Conventions
- Everything written here is in English — code, identifiers, comments, docs, README, commit
  messages, specs, tasks, notes. We may talk in any language; the language of the conversation
  never decides the language of what lands in the repo.
- Plan before non-trivial changes; if unsure whether to act or plan, plan.
- When Instagram's page changes, the fix belongs in `src/instagram/selectors.ts` (and the adapter),
  never as a workaround in `src/player/`.
- Commits: `<type> [S<NN> #<TT>]: <description>` — spec number + task number (a light spec,
  which has no tasks: `[S<NN>]`), imperative, no AI attribution (e.g. `feat [S01 #07]: react to the current reel with F`).
  Docs-only -> `doc`. Outside any spec -> plain `<type>: <description>`.
- My own pace; no PR flow for now -- commit, and push when I want. If collaborators join, /cn-spec
  detects it on its own (repo contributors) and switches to a branch + PR per spec -- no config
  needed here unless I want to override that default.

## References
Anything pasted in that isn't my own words — a quote, something said out loud, a screenshot, a
video/audio link, any external reference — goes in `docs/` at the repo root, not left buried in
chat, so it's still findable later. If it changes how we work here, fold the takeaway into
NOTES.md (decision/gotcha) or this file (convention worth keeping) — same sort /cn-spec's Learn
step already does with a spec's own learnings.md.

<!-- History, learnings & gotchas -> NOTES.md at the repo root (not auto-loaded every session). -->

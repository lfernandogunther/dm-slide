# reel-queue — Constitution

## Vision
A Chrome extension that turns the reels people send you in Instagram DMs into a player you walk
through: watch, react ❤️, reply, next. Today every reel means opening it, going back, scrolling
to find the message again, reacting, scrolling to the bottom to reply, and doing that again. With
reel-queue you do all of it on one screen, from the keyboard, in any conversation, 1:1 or group.

## Principles
1. **Never leave the player.** Watching, reacting and replying all happen on one screen. A
   feature that sends the user back into Instagram's back-and-forth misses the point of the
   project.
2. **Your session, your browser, nothing else.** It runs on instagram.com inside the user's
   logged-in browser. No password, no server, no account of its own. Message content is never
   stored or sent anywhere; it lives only as long as the page does.
3. **Act like a person, not a bot.** Every action is one the user triggered, one at a time. No
   bulk reacting, no automatic replies, no background polling. This protects the account, which
   matters more than any feature.
4. **Instagram's page is the source of truth, and a guess is never an action.** State (which
   reels exist, whether I reacted) is read from what Instagram shows, never from a parallel copy
   that can drift. When the extension can't find what it needs, because Instagram changed its
   page, it says so plainly and does nothing. Reacting to or replying on the wrong message is
   worse than not working.
5. **Keyboard first.** Every core action is one key (A/D or ←/→ to move, F to react, R to reply,
   Space to pause, Esc to close). The mouse works too, but it is never required.
6. **Prove the idea before hardening it.** Vanilla TypeScript, no UI framework, no automated tests
   until the idea has proven itself in real use. For v0, the quality bar is a manual click-through
   on the real Instagram. A framework or a test suite earns its place when a real need shows up.

## Non-goals (for the MVP)
- No filters beyond "every reel others sent, in the order sent". Filters are phase 02.
- Reels only. No posts, photos or stories.
- No mobile, and no browser other than Chrome (desktop).
- No liking or commenting on the reel itself. Reactions and replies go to the DM message.
- No bulk or automatic actions of any kind (principle 3).
- No Chrome Web Store release. The extension is loaded unpacked.
- No automated tests (principle 6).
- No live updates while the player is open. Reels that arrive meanwhile show up on the next open.

## Amendment note
This document is the project's north star: it is rarely touched, CLAUDE.md points to it, and
CLAUDE.md never restates it. It is amended only on my explicit request, and each amendment is
dated. Created 2026-10-21.

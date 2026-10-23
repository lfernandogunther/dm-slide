# DM Slide — Constitution

## Vision
A Chrome extension that turns what people send you to watch in Instagram DMs (reels, posts,
photos, stories) into a player you walk through: watch, react ❤️, reply, next. Today every one
means opening it, going back, scrolling to find the message again, reacting, scrolling to the
bottom to reply, and doing that again. With
DM Slide you do all of it on one screen, from the keyboard, in any conversation, 1:1 or group.

## Principles
1. **Never leave the player.** Watching, reacting and replying all happen on one screen. A
   feature that sends the user back into Instagram's back-and-forth misses the point of the
   project.
2. **Your session, your browser, nothing else.** It runs on instagram.com inside the user's
   logged-in browser. No password, no server, no account of its own. Message content is never
   stored or sent anywhere; it lives only as long as the page does.
3. **Never give Instagram a reason to see a bot.** Nothing the extension does may lead Instagram to
   flag the user's account as automated, to challenge, lock or ban it, or to take action against
   the project. That holds for what the extension reads as much as for what it does:
   - Every action is one the user triggered, one at a time. No bulk reacting, no automatic
     replies, no background polling.
   - It loads only what a person on instagram.com would load at that moment: the item on screen
     and at most the next one. No paging through history on its own, no bursts.
   - No direct calls to Instagram's private API (`/api/…`). Data comes from what the page already
     holds or from public pages Instagram serves to any site, one item at a time.
   - When Instagram pushes back (a redirect, a 429, a challenge), it stops asking and says so; it
     never retries its way through.
   - It behaves like a person instead of passing for one: no requests dressed up as Instagram's
     own app, no getting around a limit Instagram sets.
   - Nothing in Instagram's or Meta's terms is broken: no scraping, no collecting beyond what the
     user is looking at.
   The user's account and the project matter more than any feature. A feature that can only work
   by breaking this does not ship.
4. **Instagram's page is the source of truth, and a guess is never an action.** State (which
   reels exist, whether I reacted) is read from what Instagram shows, never from a parallel copy
   that can drift. When the extension can't find what it needs, because Instagram changed its
   page, it says so plainly and does nothing. Reacting to or replying on the wrong message is
   worse than not working.
5. **Keyboard first.** Every core action is one key (W/S or ↑/↓ to move between items, A/D or ←/→
   through a carousel's slides and on to the next item, F to react, R to reply, U to show only what
   I haven't reacted to, Space to pause, I to see the item in Instagram's own view, ? for the
   keys, Esc to close). The mouse works too, but it is never required.
6. **Prove the idea before hardening it.** Vanilla TypeScript, no UI framework, no automated tests
   until the idea has proven itself in real use. For v0, the quality bar is a manual click-through
   on the real Instagram. A framework or a test suite earns its place when a real need shows up.

## Non-goals
- No filters beyond "not reacted yet". Sender and date filters wait for roadmap phase 02.
- Only what was sent to watch: no text, voice messages, GIFs, stickers or links to other sites.
- No mobile, and no browser other than Chrome (desktop).
- No liking or commenting on the reel itself. Reactions and replies go to the DM message.
- No bulk or automatic actions of any kind (principle 3).
- No reading Instagram through its private API, and no loading history the user didn't ask for
  (principle 3).
- No automated tests (principle 6).
- No live updates while the player is open. Reels that arrive meanwhile show up on the next open.

## Amendment note
This document is the project's north star: it is rarely touched, CLAUDE.md points to it, and
CLAUDE.md never restates it. It is amended only on my explicit request, and each amendment is
dated. Created 2026-10-21.
- 2026-10-21: posts, photos and stories join reels (S02); the keys split into W/S for items and
  A/D for a carousel's slides; the "not reacted" filter is allowed; the non-goals are no longer
  scoped to the MVP.
- 2026-10-22: principle 5 gains I (Instagram view: the item's own layer over the chat, and back)
  and ? (the key tips), from S03.
- 2026-10-22: the Chrome Web Store release leaves the non-goals, on the owner's request (S04); the
  extension ships there and as a zip on each GitHub release. The principles are unchanged.
- 2026-10-23: principle 3 covers reads and requests, not only actions, and adds Instagram's and
  Meta's terms, on the owner's request: a user of v0.1.0 got Instagram's "suspicious activity"
  challenge and was asked to change their password right after installing it. No private API, no
  history loaded on its own, back off when Instagram pushes back, never pass for Instagram's app.

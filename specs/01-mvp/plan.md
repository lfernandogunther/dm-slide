# S01 — Plan

## Approach
A content script on `instagram.com/direct/*` reads the conversation **from the page Instagram
renders** and acts by **driving Instagram's own controls**: the message's hover menu for React
and Reply, and Instagram's composer for sending. The player is a Shadow DOM overlay on top of it.

Why DOM-driven instead of calling Instagram's internal endpoints:
- **Transport-proof.** Web DMs arrive over a realtime channel, and some threads may be end-to-end
  encrypted. Whatever the transport, the page renders the decrypted result, and the page is what
  we read.
- **It acts like the user** (constitution #3). A reaction made through the native menu is exactly
  the request Instagram's own UI would send.
- **Cost:** it breaks when Instagram changes its markup. That cost is contained by keeping every
  selector in one file and failing visibly (constitution #4).

**Task #01 is a spike that proves each piece on the real, logged-in Instagram before any
extension code exists.** For any piece the DOM can't do, the fallback is the web app's own
internal request for that single action, and the choice gets recorded in `learnings.md`.

## Pieces and how each one works
| Piece | Plan A (DOM) | Proved in |
|---|---|---|
| List reels | Walk the thread's message rows: a reel card links to `/reel/<shortcode>/`, and we read the sender, the time and my reaction from the row | #01, #03 |
| Play | An iframe of `instagram.com/reel/<shortcode>/embed`, or the `<video>` Instagram renders when the reel opens, whichever #01 shows works with sound | #01, #06 |
| React / unreact | Hover the message row → React → ❤️, or a double-click on the message if Instagram supports it there | #01, #07 |
| Reply | Hover → Reply (quoted) or plain focus on the composer; type; send | #01, #08 |
| Load older | Scroll Instagram's message list to the top so it fetches the next page; re-read the rows | #01, #09 |

## Modules
- `src/instagram/selectors.ts`: every selector and text match, in one place.
- `src/instagram/adapter.ts`: the `ThreadAdapter` interface and its DOM implementation:
  ```ts
  interface ThreadAdapter {
    listReels(): Reel[];               // others' reels, send order, with myReaction
    react(id: string): Promise<void>;
    unreact(id: string): Promise<void>;
    reply(id: string, text: string, quote: boolean): Promise<void>;
    loadOlder(): Promise<boolean>;     // false = start of chat
    health(): { ok: true } | { ok: false; reason: string };
  }
  ```
  Each action re-checks that it found the right row (same shortcode, same sender) before
  clicking. If the check fails, the action throws, and the player shows the error instead.
- `src/player/`: the overlay (`overlay.ts`, `strip.ts`, `stage.ts`, `reply.ts`, `keys.ts`). It
  follows the prototype's layout and talks only to `ThreadAdapter`.
- `src/content/main.ts`: injects the header button, watches SPA navigation between threads
  (URL + MutationObserver), opens and closes the player.

## Key decisions
| Decision | Choice | Why / tradeoff |
|---|---|---|
| UI tech | Vanilla TS + Shadow DOM | Two screens and no framework need yet (constitution #6); the cost is a few hand-written render functions |
| Build | esbuild script, no Vite/CRXJS | Fewest moving parts for one content script; no HMR, so reloading the extension is manual |
| Data access | DOM first, internal request only as a per-piece fallback | See Approach |
| Reel card click | Opens our player instead of Instagram's viewer | The faster path is the point; the cost is that Instagram's own viewer moves behind the card's link |
| Keys while open | Captured in the overlay, `stopPropagation` | Instagram never sees A/D/F/R; outside the player nothing is touched |
| Settings | `chrome.storage.local`: auto-advance, quote default | Tiny and per-user; never message content |

## Risks
- **Instagram changes its markup.** Contained to `selectors.ts`. `health()` checks on open, and
  acceptance #9 tests the failure path.
- **Account flagged.** We perform only user-triggered actions, through the native UI, one at a
  time (constitution #3).
- **Reels won't play inline** (embed blocked, no sound). #01 decides this before anything gets
  built on it. The last resort is opening the reel in Instagram's own viewer inside the overlay
  area.
- **The spike touches a real conversation.** #01's react and reply tests go to a test chat (or
  are undone right away), not into my wife's thread.

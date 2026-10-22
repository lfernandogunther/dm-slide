# S01 — MVP: the player

## What & why
My wife sends me a lot of reels in Instagram DMs. Going through them on Instagram's own page
means opening a reel, going back, finding the message again to react, and scrolling to the bottom
to reply, every time. That back-and-forth takes far longer than watching the reels.

The MVP is a Chrome extension that opens a **player over the conversation**. It shows every reel
the other people sent, in the order they sent them, one at a time. From there I move back and
forth, react ❤️ to the message and reply in the chat, without leaving the screen. It works in
any conversation, 1:1 or group.

The flow was settled in the clickable prototype: [`prototype/index.html`](prototype/index.html)
(fake data). It has two screens:

| Screen | Kind | What it is |
|---|---|---|
| S1 · Conversation | reuses: Instagram Direct | Instagram's own page, plus one injected button in the thread header |
| S2 · Player | new | An overlay with the strip of reels on the left, the video in the middle, ❤️ beside it, and the reply box under it |

See [constitution.md](../../constitution.md) for principles and non-goals.

## Scope
- **Entry:** a "▶ Reel Queue" button in the thread header, showing how many loaded reels have no
  reaction from me. Clicking a reel card in the chat opens the player at that reel.
- **Which reels:** every reel sent by someone other than me, in send order, with no filter. A
  reaction from me only *marks* a reel (in the strip and the counter); it never hides it.
- **Start position:** the button opens at the oldest loaded reel without my reaction (the newest
  reel if every one has a reaction). A clicked reel card opens at that reel.
- **Navigate:** `A`/`D`, `W`/`S` (up / down the strip) or `←`/`→`, the ‹ › buttons, or a click on any item in the strip. At the
  last reel, "next" stops. The strip follows the chat's order (oldest at the top, newest at the
  bottom) and numbers reels from the newest: 1 is the bottom tile, counting up, so loading older
  reels never renumbers the ones already there.
- **Follow in the chat:** every move scrolls Instagram's thread behind the player to the current
  reel's message, so the chat always sits where the player is.
- **Watch:** the current reel plays inline with sound and loops. `Space` and a click on the video
  pause it. A speaker button (and `M`) mutes and unmutes. Only the current reel loads, and the next
  one is preloaded. The top of the video shows when the reel was sent.
- **React:** `F` or the ❤️ button reacts ❤️ to that **DM message**, and pressing again removes it.
  Instagram's whole quick set (❤️ 😂 😮 😢 😡 👍) sits beside the video as equal buttons, numbered
  `1`–`6`; choosing my current reaction again removes it, and another one replaces it. "Next reel after reacting"
  (on by default) advances automatically after adding a reaction, never after removing one.
- **Reply:** `R` focuses the box under the video and `Enter` sends to the conversation. With
  "Quote this reel" on (the default), the message is a reply to that reel's message; off, it is a
  plain message. Shortcuts are off while typing, and `Esc` leaves the box. Under the box, the
  replies I already sent quoting that reel show, so I see what I said about it.
- **Lazy loading:** scrolling the strip up, or pressing `A` near the oldest loaded reel, fetches
  older messages, one page at a time. The current reel stays in place, and the strip shows
  "start of chat" when nothing older is left.
- **Groups:** same behavior. The top of the video names the sender, and the reply placeholder
  names them too.
- **Close:** `Esc` or ✕. The thread is left at the last reel viewed, and it already shows the
  reactions and replies made.

## Acceptance criteria
Checked by hand on the real Instagram, in one 1:1 and one group conversation:
1. A thread with reels from others shows "▶ Reel Queue · N without ❤️", where N matches the
   loaded reels I haven't reacted to. A thread without such reels shows a disabled "No reels".
2. The button opens the player at the oldest loaded reel without my reaction, and a click on a
   reel card opens it at that reel.
3. The player lists only reels from others, in send order. `A`/`D`, `←`/`→`, ‹ › and the strip
   all move; next stops at the last reel; the video plays with sound, loops, and pauses on `Space`.
4. `F` reacts ❤️ to the message, which shows in Instagram's own thread after closing, and a second
   `F` removes it; `2`–`6` do the same with the other quick reactions. With "Next reel after reacting" on,
   the player advances.
5. A reply sent with "Quote this reel" on appears in the thread as a reply to that reel; with it
   off, it appears as a plain message. A reel I had replied to with a quote shows that reply under
   the box.
6. Going back past the oldest loaded reel loads older ones without moving off the current reel,
   until "start of chat".
7. In a group, the sender shown on each reel is the right person. Every reel shows its send date.
8. `Esc` closes the player, and keys typed in the reply box never trigger shortcuts.
9. With a selector deliberately broken, the player shows a clear "can't read this conversation"
   message and performs no action (constitution #4).
10. After moving through a few reels and closing, Instagram's thread shows the last reel viewed.

## Edge cases
- **Reels I sent:** never in the player.
- **I reacted with something other than ❤️:** it counts as reacted. Pressing `F` replaces it with
  ❤️, since Instagram allows one reaction per person per message.
- **Reel unavailable** (deleted, or from a private account I can't see): the player shows an
  "unavailable" card, and react and reply still work on the message.
- **A new reel arrives while the player is open:** it is not added until the next open (non-goal:
  live updates).
- **Switching conversation in Instagram while the player is open:** the player closes.
- **Thread with only a few reels:** no lazy loading is triggered beyond "start of chat".
- **Instagram's page changed:** see acceptance #9. Never act on a guess.

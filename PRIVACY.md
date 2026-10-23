# Privacy policy

*Last updated: 2026-10-22*

DM Slide is a Chrome extension that plays the reels, posts, stories and photos sent in an Instagram
direct-message conversation, one after another, so you can react and reply on one screen.

## The short version
DM Slide collects nothing, sends nothing to its author or anyone else, and has no server. Everything
it does happens in your browser, on the Instagram page you have open.

## What it reads
- **The conversation you have open.** While you are in an Instagram DM thread, DM Slide reads that
  thread's messages in the page to find what was sent to watch, who sent it, when, and your own
  reactions and replies to it. This stays in the page's memory and is gone when you close or reload
  the tab. It is never stored, logged or sent anywhere.
- **The media itself.** To play an item, DM Slide loads the item's public embed page — the page
  Instagram serves so other sites can show a post — and the media file it points to, from
  Instagram's own servers and content network, without your Instagram session or the address of
  your conversation: your cookies are not sent, so Instagram sees the same request as from anyone who
  is not signed in. It loads only the item on screen and the next one, and never calls Instagram's private API.
  If Instagram ever answers with a refusal, DM Slide stops loading media until you reload the page.
  Nothing else is contacted.
- **Older messages, only when you ask.** DM Slide never scrolls back through your conversation on
  its own. Going back past the oldest loaded item loads one more page of it, the way scrolling up in
  Instagram does.

## What it stores
Only its own settings, in your browser's extension storage (`chrome.storage.local`), on your device:

| Setting | What it holds |
|---|---|
| `nextAfterReact` | whether reacting moves on to the next item |
| `quoteReply` | whether a reply quotes the item |
| `onlyNotReacted` | whether the "Not reacted" filter is on |
| `volume` | the sound level, from 0 to 1 |
| `seenKeys` | whether the first-time key card was already shown |

No message, name, username, id or media is ever stored. Removing the extension removes these
settings.

## What it does on your behalf
DM Slide reacts or replies only when you press the key or button for it, in the conversation you are
watching. It never acts on its own.

## What it does not do
- No analytics, tracking, advertising or telemetry.
- No account, sign-in or data of its own.
- No data sold, shared or transferred to anyone.
- No remote code: everything that runs ships inside the extension.

## Permissions
- **`storage`**: to keep the settings above.
- **Access to `https://www.instagram.com/*`**: to read the open conversation and play its items.
  Instagram is a single-page app, so the extension loads on any of its pages and acts only inside a
  DM thread.

## Contact
Questions or concerns: open an issue at https://github.com/lfernandogunther/dm-slide/issues.

DM Slide is not affiliated with, endorsed by or sponsored by Instagram or Meta.

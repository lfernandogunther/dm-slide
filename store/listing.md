# Chrome Web Store listing

Everything the Developer Dashboard asks for, ready to paste. Keep it in step with
[PRIVACY.md](../PRIVACY.md) and `manifest.json`: the review compares them.

## Store listing tab

**Name** (from the manifest): DM Slide

**Summary** (from the manifest's `description`, max 132 characters):
> Slide through the reels, posts, stories and photos sent in an Instagram DM conversation, reacting and replying on one screen.

**Description:**
```
Friends send you reels faster than you can watch them. DM Slide plays everything sent to watch in an Instagram direct-message conversation, one after another, on one screen — and lets you react and reply without leaving it.

• Plays reels, posts, carousels, stories and photos in the order they were sent
• Starts at the first one you haven't reacted to or answered
• Shows each shared post's caption, author, date, music and public counts beside it
• React with ❤️ or any quick reaction in one key, and move on to the next
• Reply on the same screen, quoting the item or not
• Every action has a keyboard shortcut: W/S to move, A/D through a carousel, F to like, R to reply, ? to show every key
• Filter to what you haven't reacted to yet
• Open the item in Instagram's own view with I, and come back where you were

How to use it: open a conversation on instagram.com/direct and press the "▶ DM Slide" button in its header, or click any shared reel in the chat.

Private by design: DM Slide has no server, collects nothing and sends nothing anywhere. It reads the conversation you have open, in your browser, to show it to you, and keeps only its own settings (like the volume) on your device. It acts only when you press a key or a button.

Open source (MIT): https://github.com/lfernandogunther/dm-slide

DM Slide is not affiliated with, endorsed by or sponsored by Instagram or Meta.
```

**Category:** Social Networking (Lifestyle)

**Language:** English

**Graphic assets:**
- Store icon, 128×128: `icons/icon128.png`
- Screenshots, 1280×800: `docs/screenshots/01-player.png` … `04-react-reply.png`
- Small promo tile, 440×280: `store/promo-440x280.png`

**Homepage URL:** https://github.com/lfernandogunther/dm-slide

**Support URL:** https://github.com/lfernandogunther/dm-slide/issues

## Privacy practices tab

**Single purpose:**
```
DM Slide plays the media sent in the Instagram direct-message conversation the user has open — reels, posts, stories and photos — one after another in one viewer, where the user can react to and reply to each item.
```

**Permission justification — `storage`:**
```
Keeps the player's own settings on the user's device: whether reacting moves to the next newer or older item, whether replies quote the item, the "not reacted" filter, the volume level, and whether the first-time key card was shown; and, only after Instagram refuses a load, the time media loading may resume. No message content is stored.
```

**Permission justification — host permission (`https://www.instagram.com/*`):**
```
The extension's only purpose is to play the media in the user's open Instagram DM conversation. It reads that conversation in the page and loads each item's media from its public embed page on Instagram's own servers and content network, without the user's session cookies; the post's caption, author and public counts shown beside it come from that same page, with no further request: only the item on screen and the next one, never Instagram's private API, and it stops for an hour at Instagram's first refusal. Older messages load one page at a time, only when the user asks; nothing else is contacted. Instagram is a single-page app, so the content script must load on its pages to be present when the user navigates to a conversation; it acts only on /direct/t/ pages.
```

**Remote code:** No, I am not using remote code.

**Data usage — what the extension handles** (local only, never transmitted; disclosed because the
store counts local handling too):
- [x] Personally identifiable information — the sender's display name and the shared post's
  author's username, shown next to the item
- [x] Personal communications — the conversation's messages, read to find the items and the notes
  sent with them
- [x] Website content — the media of each item, loaded to play it, and the shared post's caption,
  author's username and public counts from the same embed page, shown beside it
- [ ] Health information · Financial and payment information · Authentication information ·
  Location · Web history · User activity — not handled

**Certifications** (all three checked):
- [x] I do not sell or transfer user data to third parties, outside of the approved use cases
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:** https://github.com/lfernandogunther/dm-slide/blob/main/PRIVACY.md

## Distribution tab
- **Visibility:** Public
- **Regions:** All regions

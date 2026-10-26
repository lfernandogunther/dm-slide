# Learnings — S06

## Learned
- **2026-10-23 — A 302 from a private endpoint is Instagram pushing back, not a format change.**
  S03 recorded `/info/` answering 302 for every kind, and the response was to add a fallback around
  it. It answered 200 again later the same day. The day after v0.1.0 was tagged, a user got the
  "suspicious activity" challenge. A refusal that comes and goes means stop asking, not route around it.

- **2026-10-23 — "No cookies" was not "not linked".** The live check of cookieless embeds found two
  links left: every same-origin read sent the thread's full path as `Referer`, and Chrome gives a
  page's `credentialless` iframes one throwaway cookie jar, so the anonymous ids the first embed set
  ride on every later one. The first is fixed with `no-referrer`; the second is Chrome's design and
  links reads to each other only, never to the account. Read the request headers, not the flag.
- **2026-10-23 — Cookieless costs private accounts.** A post from a private account, even one the
  user follows, embeds as an empty page without cookies (200, `contextJSON: null`, no media), so it
  shows as unavailable and `I` opens it. It is not a refusal, so it never pauses anything.
- **2026-10-26 — The embed's HTML is fast, but reels keep their video out of it.** The owner found
  videos slow to start. In an isolated tab, on four public fixtures: a cookieless `fetch` of an embed
  page took 0.4–0.5 s, and a fresh mp4 needed ~1.6 s to its first frame. `contextJSON` held a
  `video_url` for one `/tv/` only; both `/reel/` ones were `GraphVideo` with no URL. So a fetch
  cannot replace the iframe for reels, and the speed-up became its own roadmap item, not part of
  v0.1.1. The fixtures were old (2020–22) and never played even in the iframe, so the iframe's own
  time on current reels is still unmeasured. Retrying from the shell with a browser's headers was
  refused, which is right: faking a browser is what principle 3 rules out.

## Concepts learned
- **Private API**: Instagram's internal `/api/v1/…` endpoints; calling them from a script breaks Meta's terms.
- **Back off**: stop asking after a refusal instead of retrying until it works.

## Promoted
- 302 from a private endpoint → NOTES.md, Playback ("No private API").
- "No cookies" was not "not linked" → NOTES.md, Playback ("Embeds load without cookies or referrer").
- Cookieless costs private accounts → NOTES.md, Playback (the Video URL bullet).
- The embed's HTML is fast, reels keep their video out of it → NOTES.md, Playback ("Load time"),
  and ROADMAP.md 07.

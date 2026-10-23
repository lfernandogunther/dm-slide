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

## Concepts learned
- **Private API**: Instagram's internal `/api/v1/…` endpoints; calling them from a script breaks Meta's terms.
- **Back off**: stop asking after a refusal instead of retrying until it works.

## Promoted

# Learnings — S06

## Learned
- **2026-10-23 — A 302 from a private endpoint is Instagram pushing back, not a format change.**
  S03 recorded `/info/` answering 302 for every kind, and the response was to add a fallback around
  it. It answered 200 again later the same day. The day after v0.1.0 was tagged, a user got the
  "suspicious activity" challenge. A refusal that comes and goes means stop asking, not route around it.

## Concepts learned
- **Private API**: Instagram's internal `/api/v1/…` endpoints; calling them from a script breaks Meta's terms.
- **Back off**: stop asking after a refusal instead of retrying until it works.

## Promoted

# S06: No bot footprint — bring the extension into the amended principle 3

**Source branch:** main · **Working branch:** main
**Repo(s):** dm-slide

## Context
On 2026-10-23, a friend installed v0.1.0 from the Chrome Web Store and Instagram showed them a
"suspicious activity" challenge, asking them to change their password. Instagram does not say why,
so the cause is not proven. Still, v0.1.0 does three things that look like automation:
- **Private API:** for every reel, video post and carousel, it calls
  `/api/v1/media/<id>/info/` with only the `X-IG-App-ID` header, which is less than the web app
  itself sends. Our own tests saw this call answer 302 to the home page on 2026-10-22 (S03) and 200
  later the same day (S05). An intermittent redirect like that looks like Instagram pushing back.
- **History on its own:** opening the player, or moving near the oldest loaded item, pages the
  thread back 60 days, one page every 1.2–3 s with a random pause. In a busy thread that is 30+
  pages, and it is the shape of scraping.
- **Retries:** a miss is asked again on the next visit, with no limit, even when Instagram
  answered with a redirect.

The owner amended principle 3 the same day (commit 398bc9a): no private API, no history the user
didn't ask for, back off when Instagram pushes back, never pass for Instagram's app, nothing against
Instagram's or Meta's terms. S05 (post caption) reads `/info/` and `/comments/`, so it is parked on
the branch `05-post-caption`, unreleased, until a compliant source exists.

## What to build
1. **S05 off main.** Its commits and its uncommitted work move to the branch `05-post-caption`,
   with its session marked ON-HOLD and the reason given. `main` goes back to `origin/main` plus the
   constitution amendment. Nothing has been pushed past `origin/main`, so no history is rewritten
   on the remote.
2. **No private API.** Reels and video posts play from their public `/embed/` page only. Carousels
   take their slides from the embed page's data, or else show the first slide the record already
   holds. `/api/v1/media/…/info/`, the app-id header and the shortcode-to-id decoding are removed.
   Authors who turned embedding off: their item shows as unavailable, and `I` opens it in
   Instagram's own view.
3. **Back off.** A redirect, a 401/403/429, or landing on a challenge or login page, in a `fetch`
   or in the embed iframe, stops every network read the extension makes for the rest of the page's
   life. The player says so once, in plain words, and suggests waiting and reloading later. No
   retry loops: an item that missed is asked again only when the user comes back to it.
4. **History only on request.** Nothing loads on open, or when moving between items. `W` (or `↑`)
   at the oldest loaded item, or the wheel at the strip's top, loads **one** page. If that page
   brings nothing to show, the pill says so and the next press loads the next one. The 60-day
   horizon, the page chain and the random pause are removed.
5. **Paced actions.** The reaction/reply queue keeps at least 1.5 s between two things it tells
   Instagram. A person cannot react faster through Instagram's own UI. A reaction that failed is
   no longer tried again on its own: the player says so, and the user's next press is the retry.
   No random jitter: it would dress our timing up as a person's, which principle 3 rules out.
6. **A mechanical guard.** `npm run build` fails, and writes nothing, if the bundle contains
   `/api/`, `i.instagram.com`, `graphql`, `doc_id`, `fb_dtsg` or `x-ig-` (any case), so a private
   API call cannot come back by accident. The release workflow runs the same build.
7. **Docs.** NOTES.md (Playback, Loading older, Player motion), `PRIVACY.md`, `store/listing.md`,
   the README if it mentions any of this.
8. **No burst.** Holding `S` or `W` passes ~20 items a second. A media read starts only once an item
   has held the screen ~300 ms, and Instagram gets one read at a time, never a batch of iframes.
9. **Embeds without the session's cookies.** The embed iframe is `credentialless` and the carousel
   fetch omits credentials, so an embed load looks like any site's embed traffic and is not tied to
   the account. A live check on 2026-10-23 found a `credentialless` embed readable, with its video.
10. **The pause outlives a reload.** A refusal stores `pausedUntil` (now + 6 h) in
   `chrome.storage.local`; every tab, and every page load until then, reads nothing. Our pill tells
   the user to wait, so a reload must not undo it.
11. **Release.** After a self-review, the owner cuts v0.1.1 and uploads it to the store by hand.

## Acceptance criteria
- [ ] `main` holds no S05 commit, and the branch `05-post-caption` holds all of S05, including the formerly uncommitted work, with its session marked ON-HOLD.
- [ ] The built bundle contains no `/api/` (the build fails if it does).
- [ ] In a live run of 5 items, the extension requests nothing under `/api/`, and at most one embed page per item visited plus one (the next).
- [ ] Opening the player and moving through items loads no history page. One `W` at the oldest item loads exactly one page.
- [ ] A forced pushback (a fetch answered by a redirect) stops all further reads, and the player says so once.
- [ ] Two quick reactions in a row reach Instagram at least 1.5 s apart.
- [ ] A reel with embedding off shows as unavailable, and `I` opens it in Instagram.
- [ ] `PRIVACY.md` and `store/listing.md` describe what is read now. No API lookup is mentioned.
- [ ] `npm run typecheck` and `npm run build` pass.

## Approach
Small edits in place, no new modules. In `media.ts`, `fetchShare` loses its API leg (embed only),
and a module-level `stopped` flag, set by one `pushedBack(res | frame)` check, short-circuits every
read. The adapter exposes it as `ThreadAdapter.pausedReason()`, so the player can show the pill
without touching Instagram. In `overlay.ts`, the auto-loads (`go()`'s prefetch check, the horizon
loop in `fetchOlder`) are cut down to one `adapter.loadOlder()` per user request, and the reaction
queue waits out a minimum gap before each job. The build guard is a few lines in
`scripts/build.mjs` that read the outputs after `esbuild.build`. Live checks run in the
DevTools-controlled Chrome with injected `dist/` scripts, in a new tab, counts only. The owner's
hand check runs with the real extension.

## Edge cases
- The 302 from `/info/` was never seen on an embed page. A pushback there may look different (the
  iframe lands on `/accounts/login/` or `/challenge/`). The check reads the iframe's final path,
  since it is same-origin.
- The CDN (`fbcdn`) image and video loads are not Instagram API calls, and stay as they are. The
  strip's thumbnails are already `loading="lazy"`.
- The embed iframe is a full page with its own scripts. It is still one per item, current plus
  next, and it is the page any site embedding a reel loads.
- Once stopped, the reaction and reply actions still work: they are clicks in Instagram's own UI,
  not network reads of ours. Only media lookups stop.
- `I` (Instagram's own view) is Instagram loading its own page, so it is allowed even when stopped.

## Glossary & concepts (learning)
- **Private API**: the internal endpoints (`/api/v1/…`) that Instagram's own app calls. Nothing
  promises them to anyone else, and calling them from a script is what Meta's terms forbid.
- **Embed page**: `/<kind>/<code>/embed/`, the public page Instagram serves so that other sites
  can show a post. The author can turn it off.
- **Pushback / challenge**: Instagram's ways of saying "slow down": a redirect to the home or login
  page, an HTTP 429 (too many requests), or the checkpoint page asking you to prove you are you.
- **Back off**: stop asking after a refusal, instead of trying again until it works.

## Open questions
1. How long to stay stopped after a pushback. First chosen: the page's life. Changed on 2026-10-23
   after the research: a stored 6 h pause, since the pill itself tells the user to reload. No source
   publishes a duration; 6 h errs on the safe side.
2. The 1.5 s gap between actions is a judgment call, roughly a person's hover-click-click.

## Outcome

| # | Criterion | Result |
|---|---|---|

---

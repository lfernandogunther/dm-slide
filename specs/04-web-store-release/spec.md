# S04: Web Store release — README, demo, store listing and automatic releases

**Source branch:** main · **Working branch:** main
**Repo(s):** dm-slide

## Context
DM Slide is public on GitHub (lfernandogunther/dm-slide, MIT) but only installs by building it and
loading `dist/` unpacked. The owner wants anyone to install it from the Chrome Web Store, a README
that shows it (screenshots, keys, install), and releases that ship without hand work. The
constitution lists "No Chrome Web Store release" as a non-goal; the owner asked on 2026-10-22 to
amend it.

The store needs things the repo does not have yet: screenshots, a privacy policy at a public URL,
justifications for each permission, and a zip per version. The first submission is by hand in the
Developer Dashboard (the API only updates an item that already exists); after that, a tag can
upload and submit each new version.

## What to build
1. **Constitution amendment**, dated: the Web Store release leaves the non-goals. Principles stay.
2. **Demo page** (`demo/`): the real player over a fake `ThreadAdapter`, with generated media and
   invented names, served locally by `npm run demo`. It never touches Instagram and never ships in
   `dist/`. It is the only source of screenshots: a screenshot of the real Instagram would show
   real names and messages.
3. **Screenshots** in `docs/screenshots/`, 1280×800, taken from the demo: the player on a reel, a
   carousel with its ‹ › arrows, the key tips, a reaction and a reply.
4. **README**: what it does, with a screenshot first; install from the Web Store, from a release
   zip, or from source; how to open the player; every shortcut in one table; privacy; limitations;
   development; license.
5. **Privacy policy** (`PRIVACY.md`): nothing collected, nothing sent; settings in
   `chrome.storage.local`; message content read in the page and gone with it. Its GitHub URL goes
   in the listing.
6. **Store listing kit** (`store/`): the listing text, the 440×280 promo tile, each permission's
   justification and the data-use answers, ready to paste into the dashboard.
7. **Release automation**:
   - `npm run release <version>` bumps `manifest.json` and `package.json`, commits and tags `v<version>`.
   - A GitHub Actions workflow on a `v*` tag runs typecheck and build, checks the tag matches the
     manifest, zips `dist/`, and creates a GitHub Release with the zip.
   - With the store's ids set as repository variables, the same workflow uploads the zip and
     submits it for review. Without them it stops after the GitHub Release, green. Federation
     needs no secret at all: the ids it reads (publisher, item, provider, service account) are not
     credentials.
8. **First submission (owner, by hand)**, guided step by step: developer account, listing, privacy
   tab, the zip of the first version. Then the credentials for the workflow, proven by one tag.

## Acceptance criteria
- [ ] The constitution's non-goals no longer forbid the Web Store, with a dated amendment line.
- [ ] `npm run demo` opens the player with fake data; nothing from `demo/` lands in `dist/`.
- [ ] Four screenshots, 1280×800, show no real person, name or message.
- [ ] The README lists every key the player binds; checked against `keys.ts`, none missing.
- [ ] `PRIVACY.md` matches what the code does (storage keys read from the source).
- [ ] A `v*` tag produces a GitHub Release with an installable zip (loaded unpacked, it runs).
- [ ] A tag with a version different from the manifest fails before anything is published.
- [ ] The item is submitted to the Web Store; after review its listing is public and the README
      links it.
- [ ] One later tag reaches the store with no hand work beyond `npm run release`.
- [ ] `npm run typecheck` and `npm run build` pass.

## Approach
The demo grows from the scratch harness used in S03 (real player, fake adapter); it moves into
`demo/` with its own esbuild entry, outside the extension's build. Screenshots are taken with
Playwright in a subagent, with reduced motion emulated off. The workflow builds on
`ubuntu-latest` with Node pinned by a new `.nvmrc` (none exists yet); the store steps call the Chrome Web Store API v2
(`upload`, then `publish`) with an access token. The token comes from a service account linked to
the publisher in the dashboard; the workflow gets it through Workload Identity Federation
(`google-github-actions/auth`), so no JSON key is stored in GitHub. If federation cannot mint a
token with the store's scope, fall back to a service-account JSON key in a secret (open question 3).

## Edge cases
- **Trademark.** "Instagram" may appear only as a description ("for Instagram DMs"), never in the
  name or icon; no Instagram logo or screenshot of Instagram's own UI in the listing.
- **Review rejection.** Broad host access and reading messages draw a closer review. The listing
  answers "single purpose" plainly and declares personal communications as handled, never sent.
- **Meta's terms.** Instagram forbids automated access. The extension acts only on the user's own
  keypress (principle 3); the listing says so. A takedown is possible and out of our hands.
- **A failed store upload after the GitHub Release.** The release stays; re-running the job
  retries only the store steps. The store refuses a version it already has.
- **Secrets on forks.** The store steps never run on a fork or a pull request.
- **The demo drifts from the player.** It imports the real player, so a breaking change fails
  `npm run demo`'s build, not silently.

## Glossary & concepts (learning)
- **Chrome Web Store Developer Dashboard**: where an extension is created, described and
  submitted. One-time US$ 5 registration; 2-step verification required to publish.
- **Item ID**: the extension's permanent id in the store, assigned at the first upload.
- **Chrome Web Store API v2**: `upload` sends a new zip for an existing item; `publish` submits
  it for review, and it goes live when review passes.
- **Service account**: a Google identity for a program instead of a person; one can be linked to
  the publisher, in the dashboard's Account section.
- **Workload Identity Federation**: lets a GitHub Actions run prove who it is to Google and get a
  short-lived token, so no long-lived key sits in GitHub's secrets.
- **Privacy practices tab**: the store's form for single purpose, permission justifications and
  data use; it must match the privacy policy.

## Open questions
1. ~~First version number?~~ **Answered 2026-10-22:** `0.1.0`.
2. ~~Visibility at launch?~~ **Answered 2026-10-22:** public.
3. ~~Store credentials?~~ **Answered 2026-10-22:** Workload Identity Federation; a JSON key only
   if federation cannot mint a token with the store's scope.

## Outcome
| # | Criterion | Result |
|---|---|---|

---

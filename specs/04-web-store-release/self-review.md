# Self-review — 04-web-store-release
**Status:** walked   <!-- analyzed | walked | reviewed -->
**Range:** 2610a89^..HEAD (branch is main; folder first appeared at 2610a89)
**Analyzed:** a780a29 @ 2026-10-22
**Reviewed:** uncommitted @ 2026-10-22
**Reviewed:** —

## Findings
<!-- code-reviewer writes this section -->
Format: n | severity | file:line | what | effort — reason; fix. No HIGH found. Verified clean: typecheck and build pass; dist/ holds only content.js, page.js, manifest.json, icons (no demo); screenshots 1280x800, promo 440x280, invented names only; README keys vs keys.ts: none missing, none invented (keys 7-9 are bound but no-ops, README says 2-6, matches QUICK_REACTIONS); PRIVACY storage keys equal settings.ts's five; permissions equal manifest (`storage` + instagram host); v0.1.0 release exists with dm-slide-v0.1.0.zip and the run was green; tsconfig `include: demo` typechecks; no `engines` in package.json so .nvmrc (26) has nothing to contradict.

1. MED | PRIVACY.md:17-19 (and store/listing.md host justification) | "No other site is contacted" is not exact: the player's own <video>/<img> load the media from Instagram's CDN (fbcdn), not www.instagram.com | small | evidence: src/instagram/selectors.ts:53 ("plain fbcdn mp4 URL, which our own <video> plays"); the store review compares policy and code. Fix: say "media is loaded from Instagram's own servers and CDN, the same as Instagram's page does" in PRIVACY.md and the host justification.
2. MED | .github/workflows/release.yml:23-60 | Actions pinned to movable major tags, incl. third-party google-github-actions/auth@v3 that holds `id-token: write`; a retagged action runs with the token | small | evidence: `uses: ...@v7/@v8/@v3`, no SHAs. Fix: pin each to a commit SHA with a `# v7.0.1` comment (Dependabot can bump).
3. LOW | .github/workflows/release.yml:19-30 | `build` job has `contents: write` and checkout keeps the token (persist-credentials default true) while `npm ci` runs dependency install scripts | small | evidence: job permissions block + no `persist-credentials: false`. Fix: set `persist-credentials: false`, and move `contents: write` to a separate release job (or only the release step's env already uses github.token).
4. LOW | scripts/release.mjs:29-31 | If typecheck fails, manifest.json, package.json and package-lock.json are left modified and tsc's diagnostics (stdout) are swallowed by `stdio: ['ignore','pipe','inherit']`, so the user sees only "Command failed" | small | evidence: run() pipes stdout; typecheck runs after the writes. Fix: run typecheck before writing (or `git checkout` the three files on failure) and use stdio 'inherit' for it.
5. LOW | scripts/release.mjs:19,36-39 | Only local tags and branch name are checked: a stale local main or a tag existing on origin passes the guards, the commit and tag are made, then `push --atomic` fails and the retry hint (same push) fails again | small | evidence: only `git tag --list` (local) and `branch --show-current`; no `git fetch`/ahead-behind check. Fix: `git fetch origin main --tags` first, fail if HEAD is not origin/main or the tag is on origin (`git ls-remote --tags`).
6. LOW | .github/workflows/release.yml:67 | store job gated only on vars.CWS_EXTENSION_ID; with that set but publisher/provider/service-account vars missing it fails red after a good GitHub Release | small | evidence: `if:` tests one variable, the auth step reads three more. Fix: also test CWS_PUBLISHER_ID, GCP_WORKLOAD_IDENTITY_PROVIDER, GCP_SERVICE_ACCOUNT (store job is deferred, so low urgency).
7. LOW | .github/workflows/release.yml:88-100 | Upload/poll pipes (`curl | tee | jq`) run without pipefail (default `bash -e`), so a curl failure is caught only because jq yields "null" and the later state check fails; the error text says "ended null" | small | evidence: no `shell: bash` set. Fix: `shell: bash` (adds pipefail) or split curl and jq.
8. LOW | spec.md acceptance (criteria 8-9) / README.md:14 | "after review its listing is public and the README links it" is not met yet (README says "coming soon; in review"); the tag-mismatch-fails-before-publish path was verified by reading the workflow only, no mismatched tag was ever run | small | evidence: README line 14; only one workflow run (v0.1.0, success). Fix: keep the criterion open in Outcome, link the store when public; optionally dry-run a mismatch with `act` or a throwaway fork tag.

## Fixes
<!-- one block per flag; /cn-self-review-walk fills each Outcome -->
### 1 · MED · PRIVACY.md:17
**Fix**
> Reword to: media is loaded from Instagram's own servers and CDN, as Instagram's page already does; nothing else is contacted. Mirror it in the host justification in store/listing.md.
**Effort:** small · **Outcome:** agora

### 2 · MED · .github/workflows/release.yml:23
**Fix**
> Replace each `@vN` with the commit SHA of that release plus a `# vN.x.y` comment; add Dependabot for github-actions.
**Effort:** small · **Outcome:** depois

### 3 · LOW · .github/workflows/release.yml:19
**Fix**
> Add `persist-credentials: false` to checkout; move `contents: write` to the release step's own job, keeping build read-only.
**Effort:** small · **Outcome:** agora

### 4 · LOW · scripts/release.mjs:29
**Fix**
> Run typecheck before writing the three files, with stdio inherited, so a failure leaves a clean tree and shows tsc's output.
**Effort:** small · **Outcome:** agora

### 5 · LOW · scripts/release.mjs:19
**Fix**
> Start with `git fetch origin main --tags`; fail if HEAD is not origin/main or `git ls-remote --tags origin v<version>` returns the tag.
**Effort:** small · **Outcome:** agora

### 6 · LOW · .github/workflows/release.yml:67
**Fix**
> Extend the store job's `if:` to test the publisher, provider and service-account variables as well as the item id.
**Effort:** small · **Outcome:** agora

### 7 · LOW · .github/workflows/release.yml:88
**Fix**
> Set `shell: bash` on the upload step so pipefail applies, or split curl from jq and check curl's exit first.
**Effort:** small · **Outcome:** agora

### 8 · LOW · README.md:14
**Fix**
> No code change: leave criteria 8-9 open in Outcome; link the store listing once public. Mismatch path stays read-only verified unless a throwaway tag is pushed.
**Effort:** small · **Outcome:** agora (no code change: criteria 8–9 stay open in the Outcome)


## Later
<!-- flags I chose to fix in a follow-up — they become tasks.md items -->
2 · .github/workflows/release.yml:23 — pin actions to commit SHAs and add Dependabot for github-actions -> tasks.md 12

## Dismissed
<!-- flags I decided against, one line of reason each -->

## Decision
<!-- filled by the walk -->
7 corrigidos (1, 3, 4, 5, 6, 7, 8) · 1 pra depois (tasks.md 12) · 0 descartados · checks: verde
(typecheck, build, actionlint; release.mjs re-run in a scratch clone: bad version, dirty tree,
main ahead of origin, tag already on origin, type error leaves a clean tree, happy path).
Flag 1 also touches the dashboard: the host justification submitted with v0.1.0 still names only
www.instagram.com; paste the new text from store/listing.md with the next release.

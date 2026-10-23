# Research: tools that run inside instagram.com, what gets them flagged, and where DM Slide stands

Researched 2026-10-23 for S06 (no bot footprint). Web sources only. This is not legal advice: the
legal section only describes what each case was about. Claims marked **(unverified)** have no
primary source, or rest on an inference of ours.

## Summary

- **The private API is the most likely trigger, and removing it is the right first change.** In
  Sept–Oct 2026, open-source tools that call `/api/v1/…` from a logged-in web session reported
  forced logouts, "automated activity" notices and prompts to change the email or password. One
  maintainer wrote that Instagram had "tighten[ed] rate limits". v0.1.0's per-reel
  `/api/v1/media/<id>/info/` call with only the app-id header fits that pattern (§1, §2).
- **Paging history on its own is shaped like bulk collection.** Instagram's Terms ban "accessing or
  collecting information in an automated way without our express permission, regardless of
  whether … logged-in". Libraries that document their limits all warn against bursts. Loading
  history only when the user asks is correct (§2, §4).
- **Stopping at the first pushback is what mature tools do.** Instaloader aborts on a login
  redirect and on `checkpoint_required` / `challenge_required` / `feedback_required`. An instagrapi
  issue calls a client that keeps talking to its own challenge "a strong automation signature" (§2).
- **Embed pages are Meta's sanctioned public surface and much lower risk than `/api/v1`.** No source
  says anything either way about loading them with a logged-in session's cookies. Loading them
  from instagram.com in an iframe sends those cookies, so every embed load is tied to the account.
  **Still to change:** load embeds without credentials, if that proves workable (§3).
- **Meta's official oEmbed is not viable.** It needs a Meta app, App Review and a token shipped in the
  client. It returns embed HTML only, with no video URL, and its thumbnails were removed on
  2025-11-03. Its docs say "Shadow DOM is not supported", and embed.js ends up loading the same
  `/embed/` page anyway (§3).
- **Legal precedent concerns data leaving the device. Account action does not need it.** Meta's
  suits against extension makers (Oink and Stuff, BrandTotal) were about collecting users' data and
  sending it to a server, to sell or analyse. DM Slide keeps everything local. But Meta also sent a
  cease-and-desist letter, and banned the developer for life, over "Unfollow Everything": a tool
  that only automated the user's own actions, citing automated collection and trademarks (§4).
- **The Chrome Web Store has no "obey the site's ToS" rule.** The rules that apply are: no
  unauthorized access to site content, no sending messages for the user without confirmation, the
  Limited Use data rules, and no implied affiliation with another company (§5).
- **Still unverified:** whether Instagram checks `isTrusted` on clicks, what its real thresholds
  are (none are published), and whether a credentialless iframe can be read by our content script.

## 1. Similar tools: how they fetch, and what happened to them

| Tool | How it fetches / acts | Reported consequences and response |
|---|---|---|
| **InstagramUnfollowers** (open-source bookmarklet/web tool) | Calls `/api/v1/friendships/…` from the logged-in page. Unfollows now go through `POST /api/graphql` with `doc_id`, `fb_dtsg` and `lsd` read from the page ([PR #363](https://github.com/davidarroyo1234/InstagramUnfollowers/pull/363)) | Sept 2026: users logged out after "automated activity", some asked to change their email ([#333](https://github.com/davidarroyo1234/InstagramUnfollowers/issues/333), [#340](https://github.com/davidarroyo1234/InstagramUnfollowers/issues/340), [#342](https://github.com/davidarroyo1234/InstagramUnfollowers/issues/342)). The maintainer: "Instagram recently rolled out changes that tighten rate limits, which impacted the script and triggered account warnings for several users" ([#347](https://github.com/davidarroyo1234/InstagramUnfollowers/issues/347)). The response: add the web client's headers (`X-ASBD-ID`, `X-CSRFToken`, `X-Requested-With`), 429 backoff of 30 s / 60 s, and a halt on `feedback_required` ([PR #345](https://github.com/davidarroyo1234/InstagramUnfollowers/pull/345)). Users still reported failures afterwards (#347 thread) |
| **IG Helper** (userscript) | "Fetch high-quality photos or videos through the Media API", plus an optional "Force Fetch API" | The author warns that heavy use, especially of the Media API, "may trigger Instagram's automation bot checks, potentially leading to account warnings, being logged out", and at worst a ban ([Greasy Fork](https://greasyfork.org/en/scripts/404535-ig-helper)) |
| **Instagram Download Button** (userscript) | Since v1.13 (after a May 2022 site change), a "new url fetch method which uses info API", on by default and switchable off | Quotes user reports that "Instagram will block your account for a few hours (maybe longer) if you download too much media in a short time", and that the account may be logged out while the script is enabled ([Greasy Fork](https://greasyfork.org/en/scripts/406535-instagram-download-button)) |
| **Inssist** (Chrome extension, web client) | Wraps Instagram's web app. The listing says data "does not leave your PC" ([CWS listing](https://chrome.google.com/webstore/detail/inssist-post-stories-dm-w/bcocdbombenodlegijagbhdjbifpiijp)). Internals are not documented **(unverified)** | One review reads "The add-on INSSIST got my Instagram account locked out" (2024-09-02, [Trustpilot](https://ca.trustpilot.com/review/inssist.com)). This is anecdotal |
| **Oink and Stuff extensions** (incl. "Web for Instagram plus DM") | Hidden code scraped profile data and sent it to the developers | Facebook sued in Portugal, 2021 (§4) |

Pattern: every report of a logout or warning that we found involves a tool calling Instagram's
private endpoints (`/api/v1/…`, the "info API" / "Media API") at volume. We found no report that
blames DOM-only tools or embed pages **(absence of evidence, not proof)**.

## 2. What triggers "suspicious activity" / automated-behavior challenges

Instagram publishes no thresholds. The best public data comes from open-source clients that
document their own empirical budgets.

- **Instaloader's own rate budget** ([instaloadercontext.py](https://github.com/instaloader/instaloader/blob/master/instaloader/instaloadercontext.py), `RateController`):
  - Non-GraphQL requests to `www.instagram.com` (the "other" type, which is what
    `/api/v1/media/<id>/info/` would be): 75 per 11-minute sliding window, about 1 every 9 s on
    average.
  - GraphQL: 200 per query type per 11 minutes, and 275 across all types per 10 minutes.
  - Mobile API (`i.instagram.com`): 199 per 30 minutes.
  - These are the tool's own guesses, not Instagram's numbers.
- **Instaloader stops for good on these signals** (same file):
  - A redirect to `/accounts/login` while logged in: "You've been logged out, please wait some time".
  - HTTP 400 whose message is `feedback_required`, `checkpoint_required` or `challenge_required`:
    it raises `AbortDownloadException` "to stop producing more requests".
  - A 429 is retried only after its own cooldown.
- **Instaloader's troubleshooting docs** ([docs](https://instaloader.github.io/troubleshooting.html)):
  - "restarting or reinstantiating Instaloader often within short time is prone to cause a 429".
  - The checkpoint challenge is "issued when Instagram suspects authentication activity on your
    account".
  - An older changelog note says logged-in limits are "much stronger" than anonymous ones
    ([changelog](https://pyup.io/packages/pypi/instaloader/changelog?page=13)).
- **Endpoints are being shut to web sessions (Oct 2026).** `api/v1/users/web_profile_info/` now
  answers "HTTP 429 or `feedback_required` for some logged-in sessions" ([instaloader PR #2765](https://github.com/instaloader/instaloader/pull/2765)).
  `/api/v1/friendships/destroy/<id>/` answers the instagram.com HTML page with HTTP 200 instead of
  JSON ([PR #363](https://github.com/davidarroyo1234/InstagramUnfollowers/pull/363)). So a
  200 can also be a refusal.
- **instagrapi best practices** ([docs](https://subzeroid.github.io/instagrapi/latest/usage-guide/best-practices/)):
  - Its example delay is a random 1–3 s after each request ("random and not too long").
  - On a 429: "stop the current burst of requests" and back off.
  - `PleaseWaitFewMinutes` "is usually more serious than a single 429": "do not spam retries in a
    tight loop".
  - `feedback_required`: "freeze the account or action type for a cooldown window".
  - It lists "suspicious login emails, challenges, forced password changes" as the operational
    blocks, and advises: "Increase volume slowly over days, not minutes."
- **Answering a challenge automatically makes it worse.** An instagrapi issue says the automatic
  resolver's extra `/challenge/` requests are "a strong automation signature, and each attempt
  deepens verification/throttling" ([#2874](https://github.com/subzeroid/instagrapi/issues/2874)).
  After a re-login, the first feed request hit `challenge_required` straight away ([#2890](https://github.com/subzeroid/instagrapi/issues/2890)).
- **Headers.** Instaloader's web requests send `X-CSRFToken`, `X-Instagram-AJAX`,
  `X-Requested-With` and `x-ig-app-id: 936619743392459` (source above). PR #345 claims that missing
  web headers get requests flagged by a "WAF". That is a contributor's claim and was not proven
  **(unverified)**. No source documents what `X-IG-WWW-Claim` or `X-ASBD-ID` are checked for.
  Either way, a request with only the app id looks unlike the web client, which now fetches
  through `/api/graphql` with `doc_id`, `fb_dtsg` and `lsd`.
- **Synthetic events.** A click made with `.click()` or `dispatchEvent` has `isTrusted = false`
  ([WHATWG note](https://lists.w3.org/Archives/Public/public-web-platform-tests-notifications/2016Apr/0355.html)).
  We found no source saying Instagram checks it **(unverified both ways)**.
- **Other triggers mentioned in vendor guides:**
  - VPNs or IP changes, many devices, rapid likes, follows and comments.
  - Third-party apps "used for posting or viewing content" ([Storrito help](https://storrito.com/help-center/troubleshooting-instagram-s-suspicious-activity-detected-notifications/), [DEV](https://dev.to/swiftproxy_residential/handling-instagram-challengerequired-error-5e6d)).
  - These are low-authority sources.

## 3. Embed pages and the official oEmbed

- **The `/embed/` pages** are what Meta's embed.js renders for third-party sites. Those are mostly
  loaded as logged-out or third-party-cookie traffic.
  - RSS-Bridge contributors fetched profile embed pages "without any cookies" from server IPs in 2024.
  - By Nov 2024, "even the embed url shows the login page" for some of them, intermittently.
  - Media served with `cross-origin-resource-policy: same-origin` did not display elsewhere.
  - A maintainer guessed "the embed has some form of rate limits" ([RSS-Bridge PR #4060](https://github.com/RSS-Bridge/rss-bridge/pull/4060)).
  - We found no report of an account challenged for loading embed pages. We also found none about
    loading them *with* a session's cookies **(unknown)**.
  - Our inference: an iframe on instagram.com sends first-party cookies, so a burst of embed loads
    is attributed to the account. A request without credentials would look like ordinary embed
    traffic and would only risk per-IP anonymous limits. Instaloader notes those are stricter on
    shared IPs (cloud, VPN, proxy).
  - Chrome's `credentialless` iframe loads "in an ephemeral context" without the origin's cookies
    ([MDN](https://developer.mozilla.org/en-US/docs/Web/Security/IFrame_credentialless)). MDN does
    not say whether the parent can still script into a same-origin credentialless frame. That needs
    a test **(unverified)**.
- **Official oEmbed** (`GET graph.facebook.com/{v}/instagram_oembed`, [docs](https://developers.facebook.com/docs/instagram-platform/oembed)):
  - **What it returns.** `html` (a `blockquote` plus embed.js), `width`, `type` and the provider.
    There is no media or video URL. `thumbnail_url` and `author_name` were removed from
    2025-11-03 ([Meta blog](https://developers.facebook.com/blog/post/2025/04/08/oembed-updates/), [changelog](https://developers.facebook.com/docs/instagram-platform/changelog)).
    So the statement that it returns no video URL is **confirmed**.
  - **Limits.** "Stories are not supported", "Shadow DOM is not supported", and private,
    age-restricted or embed-disabled accounts are unsupported. 1,000 requests per hour. Use for
    anything "other than providing a front-end view" is prohibited.
  - **Access.** It needs a Meta app with the **Meta oEmbed Read** feature. Apps created after
    2025-04-08 need App Review, and the call takes an app token ([Discourse guide](https://meta.discourse.org/t/configure-an-app-token-for-instagram-oneboxes/223548)).
    Shipping that token in a client-only extension exposes it **(our inference)**.
  - **Verdict.** It adds a token, a review and a Graph call, then renders the same `/embed/`
    iframe. It is not worth it for DM Slide.

## 4. Legal: Instagram's Terms and Meta's cases against extension makers

- **Instagram Terms of Use, §"How You Can't Use Instagram"** (Effective Date 1 January 2025, archived
  copy at [Open Terms Archive](https://github.com/OpenTermsArchive/pga-versions/blob/main/Instagram/Terms%20of%20Service.md);
  live page [help.instagram.com/581066165581870](https://help.instagram.com/581066165581870)). The
  archived copy may be the EU variant **(unverified)**:
  - "You can't attempt to create accounts or access or collect information in unauthorized ways.
    This includes creating accounts or accessing or collecting information in an automated way
    without our express permission, regardless of whether such automated access or collection is
    undertaken while logged-in to an Instagram account."
  - "You can't do anything to interfere with or impair the intended operation of the Service."
  - "You can’t modify, translate, create derivative works of, or reverse engineer our products or
    their components."
  - "You can't do, or attempt to do, anything to circumvent, by-pass, or override any
    technological measures that control or limit access to the Service or data."
- **Meta Automated Data Collection Terms** (effective 2024-10-07): "You will not engage in Automated
  Data Collection without first obtaining Meta’s express written permission". This covers "web
  scrapers, bots, robots, spiders, crawlers" ([Meta](https://www.facebook.com/legal/automated_data_collection_terms)).
- **Facebook v. Oink and Stuff (Portugal, filed Jan 2021).** The extensions included
  "Web for Instagram plus DM", Blue Messenger, Emoji keyboard and Green Messenger.
  - Facebook said they carried hidden code that scraped name, user ID, gender, relationship status
    and age group, plus unrelated browser data, while their privacy policy claimed no collection.
  - About 54,000 installs. Facebook sought an injunction and deletion of the data ([Meta newsroom](https://about.fb.com/news/2021/01/combating-scraping-by-malicious-browser-extensions/), [The Register](https://www.theregister.com/2021/01/17/facebook_oinkandstuff_lawsuit)).
- **Facebook/Meta v. BrandTotal & Unimania (N.D. Cal. 3:20-cv-07182, filed Oct 2020).**
  - The "UpVoice" and "Ads Feed" extensions collected users' profile data and ad data while they
    browsed, and sent it "to a server shared by BrandTotal and Unimania" to sell marketing
    intelligence ([Meta newsroom](https://about.fb.com/news/2020/10/taking-legal-action-against-data-scraping/)).
  - On 2022-05-27, Meta won summary judgment on liability for breach of contract and California
    Penal Code §502. Reports say UpVoice itself was not held to violate the CFAA; the anti-hacking
    finding rested on fake or purchased accounts ([Bloomberg Law](https://news.bloomberglaw.com/litigation/meta-gets-win-in-hacking-competition-case-against-data-scraper)).
  - The parties settled in Sept 2022 with a permanent injunction ([TechCrunch](https://techcrunch.com/2022/10/03/meta-settles-lawsuit-for-significant-sum-against-businesses-scraping-facebook-and-instagram-data)).
- **"Unfollow Everything" (2021).** The Facebook extension unfollowed everything for the user,
  locally. Meta's law firm sent a cease-and-desist letter citing "automated collection of user
  content" without permission and trademark infringement. The developer's Facebook and Instagram
  accounts were disabled permanently ([Gizmodo](https://gizmodo.com/facebook-banned-the-creator-of-unfollow-everything-and-1847826505), [TechSpot](https://www.techspot.com/news/91650-facebook-bans-sends-cease-desist-letter-developer-unfollow.html)).
  - A pre-emptive suit for "Unfollow Everything 2.0" (Zuckerman v. Meta, §230(c)(2)(B)) was
    dismissed in Nov 2024 as not ripe, without a ruling on the merits ([Benton](https://www.benton.org/headlines/suit-against-meta-using-tech-shield-law-dismissed), [opinion PDF](https://storage.courtlistener.com/recap/gov.uscourts.cand.428857/gov.uscourts.cand.428857.43.0.pdf)).
- **Meta v. Bright Data (Jan 2024).** The court held that Meta's terms did not bar *logged-off*
  scraping of public data. Meta then dropped the case ([FBM](https://www.fbm.com/data-analytics/publications/major-decision-affects-law-of-scraping-and-online-data-collection-meta-platforms-v-bright-data/), [TechCrunch](https://techcrunch.com/2024/02/26/meta-drops-lawsuit-against-web-scraping-firm-bright-data-that-sold-millions-of-instagram-records)).
  - The current clause's "regardless of whether … logged-in" wording looks written to close that gap
    **(our inference)**.
- **How DM Slide compares** (descriptive, not advice):
  - What the cases have in common is data collected from users or others, sent off the device, and
    sold or analysed, sometimes concealed or done through fake accounts. DM Slide shows the user's
    own DM content locally and transmits nothing.
  - Still, the Terms' text reaches "accessing … information in an automated way", and Unfollow
    Everything shows Meta acting against a local, data-free tool.
  - The realistic exposure is account action against users and a C&D or store takedown for us, not
    a damages suit **(our reading)**.

## 5. Chrome Web Store policy

The source for this section is [Program Policies](https://developer.chrome.com/docs/webstore/program-policies/policies).

- **No rule requires obeying a third-party site's ToS.** The page uses "terms of service" only
  for payments.
- **Malicious and Prohibited Products:** "Do not facilitate unauthorized access to content on
  websites, such as circumventing paywalls or login restrictions." Also: "Do not encourage,
  facilitate, or enable the unauthorized access, download, or streaming of copyrighted content or
  media." And no content "that harms or interferes with the operation of the networks, servers, or
  other infrastructure of … any third-parties."
- **Spam and Abuse:** "We don't allow extensions that send messages on behalf of the user without
  giving the user the ability to confirm the content and intended recipients."
- **Limited Use:** collect, use or transmit user data only as "necessary for the extension's
  disclosed single purpose". "All other transfers, uses, or sale of user data is completely
  prohibited."
- **Impersonation / Deceptive behavior:**
  - "Don't represent that your product is authorized by, endorsed by, or produced by another
    company or organization."
  - "Don't misrepresent the functionality of your product."
  - "The outcome of any user interaction should match the reasonable expectations that were set
    with the user."
- **Permissions:** "Request access to the narrowest permissions necessary".
- A forum post claims the store no longer allows extensions that download Instagram videos ([Brave community](https://community.brave.app/t/video-downloader-professional-extension-no-longer-works-in-brave-any-solutions-i-have-an-idea/595853)) **(unverified)**.
  It does not apply to DM Slide, which does not download media.

## Implications for DM Slide (mapped to S06)

1. **#2 No private API: confirm.**
   - §1–§2 tie the 2026 logouts and warnings to `/api/v1` traffic from web sessions.
   - The build guard on `/api/` also catches `/api/graphql`.
   - Add `i.instagram.com`, `graphql`, `doc_id`, `fb_dtsg` and `x-ig-` to the guard, so no
     internal endpoint or header can creep back.
2. **#2 Embed pages: confirm, and add one change.**
   - Load embeds without the session's cookies: a `credentialless` iframe, or a
     `fetch(..., {credentials: 'omit'})`. First test that our code can still read what it needs
     (§3).
   - Keep at most the visited item plus the next one, one at a time, never a batch of hidden
     iframes.
   - "Embedding off shows as unavailable" matches oEmbed's documented limits.
3. **#3 Back off: confirm, and widen the signals.** Treat each of these as pushback:
   - a 3xx to `/accounts/login` or `/challenge/`;
   - a 401, 403 or 429;
   - a 400 carrying `checkpoint_required`, `challenge_required` or `feedback_required`;
   - a 200 that returns the instagram.com HTML page where something else was expected.
4. **#3: add a cooldown that survives a reload.**
   - "For the rest of the page's life" ends at the first reload, which is exactly what the
     message suggests.
   - Store a pushback timestamp in `chrome.storage.local` and stay read-only for some hours. It is a
     setting-like value, not message content (constitution #2).
   - No source publishes a duration. instagrapi only says "for a while" and "a cooldown window".
5. **#3: never interact with a challenge.** Make no request to `/challenge/` and leave Instagram's
   own UI to the user, as instagrapi #2874 warns.
6. **#4 History on request: confirm.** One page per explicit gesture and no chaining. A machine-like
   1.2–3 s cadence over 30+ pages is the burst every library warns against.
7. **#5 Paced actions: confirm 1.5 s.**
   - That sits inside instagrapi's 1–3 s example.
   - Add small jitter.
   - Never retry a failed react or reply automatically. Keep exactly one Instagram action per user
     key press.
8. **Synthetic clicks: keep them, but stay minimal (unverified risk).**
   - `isTrusted` is false on our clicks. Whether Instagram looks at it is unknown.
   - The mitigation already in the design is to act only on a user gesture, one row at a time.
9. **oEmbed: do not adopt.** No video URL, Shadow DOM is unsupported, it needs App Review and a
   shipped token, and it renders the same `/embed/` page anyway (§3).
10. **Listing and privacy: confirm, and add a line.**
    - Say "not affiliated with Instagram or Meta". This follows CWS Impersonation, and the
      trademark ground in the Unfollow Everything C&D.
    - State plainly that nothing leaves the device. That is the line between DM Slide and every
      extension Meta has sued.
    - Replies are typed and sent by the user, which meets CWS "Spam and Abuse".
11. **Residual risk to document, not fix.**
    - The Terms forbid "accessing … information in an automated way" without permission, and DM
      Slide reads the thread's DOM and embed pages automatically.
    - Keeping reads small, user-initiated and local reduces the risk of detection. It does not make
      the Terms' text go away.

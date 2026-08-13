# Session handoff — LiTex website redesign

**Written:** 2026-08-11, last updated 2026-08-14 (session 13 — **Plan 9 written, not executed; see the resume point below**)
**Reason:** This file is the resume point between sessions.

---

## ▶▶ SESSION 14 RESUME POINT — Plan 9 is WRITTEN but NOT EXECUTED

**Session 13 ended here because the human ran out of budget, mid-plan-9, with nothing half-built.**
The tree is clean and the stopping point is tidy: everything shipped is merged and verified in
production, and the only thing outstanding is a plan document waiting to be executed.

### State

- **`main` is at `3538a82`, clean.** Merged this session: **#17** homepage rebuild + the three
  shared-chrome fixes, **#19** lede-figure crop, **#20** factory-strip background repaint, **#18**
  and **#21** docs. All feature branches deleted.
- **One PR open: [#22](https://github.com/darsonl/litex-website/pull/22)** — the Plan 9 document on
  branch `docs/plan-9`. **Docs only, nothing executed.** Merge it (or not) before starting.
- `npm run build` → **36 pages**. `npm test` → **393 across 25 files**. `test:a11y` → **11**.
- **Cloudflare A, B, C, E done; the enquiry pipeline is PROVEN end-to-end** — a real submission
  reached `/enquiry-sent/?delivery=pending`. `docs/deployment.md` §6c.
- ✅ **Lighthouse re-run by hand 2026-08-14: still 100 across the board**, on the homepage that now
  ships three photographs rather than the image-free one the original result came from. LCP and CLS
  held. §6b. Still needs re-running after the Part F cutover — different host, different question.

### → Do this next: EXECUTE Plan 9

**`docs/superpowers/plans/2026-08-14-litex-cms-and-grade-cta.md`** — written with
`superpowers:writing-plans` and researched against live Sveltia documentation. **7 TDD tasks, real
test code, no placeholders. Do not rewrite it; execute it** with
`superpowers:subagent-driven-development`. Test count runs **393 → 417**.

The plan's own research corrected the scope that was recorded here for months:

- ⚠ **There is NO OAuth backend and no second Cloudflare deployable.** Sveltia signs in with a
  **personal access token** ("Sign In with Token" links to GitHub with the scopes pre-selected).
  The old note in this file claiming otherwise was written before anyone checked. **Do not go
  looking for `sveltia-cms-auth`; you do not need it.**
- ⚠ **Sveltia's documented install is a `unpkg.com` CDN script. Do not use it.** It would break the
  `DISCLOSED` guard in `tests/legal.test.ts` or make `/legal/privacy/` untrue. Task 1 vendors the
  bundle from npm at build time, the same way the catalog PDFs and the fonts already are.
- ⚠ **`allHtmlFiles()` in `tests/helpers/dist.ts` returns EVERY `.html` in `dist/`.** Four guards
  read "every generated page" as every page of the *website* — masthead, footer, contact details,
  one `h1`. `/admin` has none of them, so **Task 2 splits app pages from site pages BEFORE `/admin`
  exists.** Do not reorder the tasks past this.
- **Editorial Workflow is the safety net.** The zod `superRefine` rules cannot be expressed in YAML,
  so every CMS save becomes a PR and the Pages preview build enforces them.
- **Two steps need a human and a browser** and cannot be done by an agent: Task 4 Step 6 (the
  `publishedAt` quoting round-trip, using a real GitHub PAT) and Task 6 Step 6.

### Also still open, both cheap, neither blocking

- **Re-run `/impeccable critique` on the homepage** to see the score move off 25/40, now that both
  P0s, the two mobile P2s and the white-page-ground decision are all closed.
- **Nobody has confirmed the Google Group's posting settings.** `sales@litex.com.tw` is a Google
  Group with the owner as a member — but `outcome: 'delivered'` only means the Resend API accepted
  the message, so a Group rejection, moderation hold or spam classification is invisible to the
  endpoint. `docs/cloudflare-setup.md` **D9** covers it: Part D is finished when an enquiry is
  confirmed to *arrive*, not when Resend says Verified.

### What is done — session 11, shared chrome

Verified: **393 passing across 25 files** (was 373/23 — three new test files), 36 pages,
`npm run test:a11y` 11 passing, detector clean.

1. **P0 print, FIXED.** `BaseLayout` now carries a print-only letterhead — wordmark, legal name,
   address, phone, email, and the page's own canonical URL — shown only in print media and
   `display: none` on screen, so it never reaches the accessibility tree either. The canonical URL
   is declared once in the layout and used twice, as `<link rel="canonical">` and as the printed
   address, because a sheet carrying a URL that is not its own canonical address sends the reader
   somewhere else and nothing on screen would ever show it.
   `tests/print.test.ts` renders three pages under print media emulation and reads `innerText`.
2. **Nav collapses below 40rem.** `<details>`/`<summary>`, no JavaScript — navigation is the last
   chrome that should be able to fail to a blank state, and the test opens it with JS disabled.
   Masthead at 390px went **153.59px → under 96px**; menu items from 20px to ≥44px tall. Desktop is
   the original row of seven, unchanged. Current section still marked by colour *and* a rule — a
   left rule on mobile, the original underline on desktop.
3. **Credibility strip.** Separator moved from `li + li::before` to `li:not(:last-child)::after`, so
   a wrap can only ever leave a separator at the END of a line, where it reads as continuation.
   Size 10px → 12px: it carries the buyer's whole qualification checklist.

### ⚠ Two traps found doing it — both will bite again

- **`content-visibility` defeats every naive visibility check.** Chromium hides a closed
  `<details>`'s contents with `content-visibility: hidden` on the `::details-content` pseudo-element,
  which skips PAINTING but still answers layout queries. A link inside the **closed** menu reports a
  44px bounding box, a non-null `offsetParent`, **and its text appears in
  `document.body.innerText`**. Two assertions in the first draft of `tests/responsive.test.ts`
  passed before the feature existed — this repo's own gotcha 12, caught by probing rather than by
  reasoning. **`Element.checkVisibility()` is the only check that discriminates**, verified against
  closed-on-phone, opened-on-phone and CSS-reopened-on-desktop. Note `innerText` *does* respect
  `display: none`, which is why `tests/print.test.ts` can rely on it — the two files use different
  checks on purpose.
- **Keeping `<details>` open on desktop needs TWO separate rules**, never a selector list:
  `.menu::details-content { content-visibility: visible }` for Chromium 131+, and
  `.menu > nav { display: block }` for engines before it. Written as one list, an engine that does
  not recognise the pseudo-element would discard both. Same lesson as the `:has()` note already in
  the print block of `global.css`.

### What was done — session 10, homepage only (`src/pages/index.astro`)

- 3 images added, all existing rights-cleared archive material: the CMY micrograph beside the lede,
  the factory strip, and the trade-show staff photo **placed last, so the page ends on people
  rather than a legal colophon**.
- A 5-cell grade ladder (`1S ~4.4` → `4S4Z ~0.8 Ω/M`). **The numbers are read from the content
  collection via `mustResolve`, never restated** — hardcoding them would create a second source of
  truth that drifts from the product page.
- Structure: was 1 `h1` / 0 `<section>`; now 1 `h1` / 4 `h2` / 4 `<section>`.
- A closing contact band that **names the MOQ gap out loud** instead of leaving it silent.
- `h1` given `clamp()` — 230px tall at 390px, now 97px. Mobile above-the-fold went from "menu,
  headline, empty box edge" to headline + lede + the full micrograph.
- Door hover given a transition (was a hard snap); eyebrows removed (craft-floor ban).

### ✅ The white-page-ground decision is CLOSED (PR #19, `30a62ce`)

The homepage lede figure was the catalog's three-panel composite, measured at **34% near-white**.
It is now **cropped to the SEM micrograph alone** — `src/assets/products/cmy-cross-section.jpg`,
`506×359`, native resolution, no upscaling.

Resolution did not decide it: the macro panel is `508×354`, within a hair. The micrograph is
grayscale on a mid-gray plate so it sits against the page instead of fighting the copper accent, it
carries the instrument's own scale bar and ×300, and it shows what the lede actually claims — a
metal layer over a polymer core.

- **The product page keeps the whole composite.** There the caption explains all three panels and
  the white reads as the document it came from. Do not "finish the job" by cropping it too.
- **`archive/images/cmy-structure1.jpg` is NOT a better source.** It looks like one at 936×609, but
  it is a slide holding the same two images placed *smaller* (~370×252 and ~433×312). Checked, so
  nobody has to check again.
- **The EMI thumbnail does not need this.** An earlier note here implied two images had the problem;
  measured, `emi-shielding-woven-tube.jpg` is only **6.4%** near-white. Nothing to do.
- **A guard now exists** in `tests/imagery.test.ts`: no homepage figure may exceed a quarter
  near-white. ⚠ **Deliberately scoped to the homepage** — `sgs-test-report.jpg` is 74.5% near-white
  and `taitronics-award.jpg` 74.3%, because they are photographs **of documents**, where paper is
  supposed to be white. **Do not promote this to a site-wide rule**; it would either fail those two
  or have to be loosened until it caught nothing.

### The critique itself

`.impeccable/critique/2026-08-13T11-59-34Z__src-pages-index-astro.md` — **gitignored**, local only.
Homepage scored **25/40 (Acceptable)**, 2 P0 and 3 P1. `/impeccable polish` reads it directly.
Re-run `/impeccable critique` after the chrome fixes to see the score move.

⚠ **Also found: `detect.mjs` URL-scan mode prints `Error: puppeteer is required`, then prints `[]`
and exits 0.** A failed scan is indistinguishable from a clean one by exit code — this repo's own
gotcha 12. Nothing depends on it yet; anything that ever does would pass silently forever.

---

## ▶ Do this first

**Plans 1–8 are ALL merged.** Do not re-run brainstorming, the spec self-review, `/impeccable init`,
or `writing-plans` for anything already built.

### → Start here: write Plan 9

**Plan 9 does not exist yet.** Write it with `superpowers:writing-plans`, then execute it
subagent-driven. Its scope was fixed by decision on 2026-08-13:

1. **Sveltia CMS at `/admin`** — needs a GitHub OAuth backend (a second deployable on Cloudflare)
   plus a `config.yml` mirroring every content collection's schema. This is a subsystem, not a
   chore, which is why it was deferred out of Plan 8.
2. **The deferred `SpecTable` "Request this grade" CTA** (spec §5). It reads `fieldsFor('sample')`
   from `src/lib/enquiry.ts` — the machinery already exists.

`main` is at **`34d86cf`** plus the Plan 8 Task 9 docs commit, clean and pushed, nothing in flight.
`npm run build` → **36 pages**, `npm test` → **373 passing across 23 files**, `npm run test:a11y` →
**11 passing**, detector clean.

**Run `npx playwright install chromium` before `npm test` on a fresh checkout**, or the suite fails
with a missing-executable error rather than a test failure.

#### ✅ Cloudflare B + C-secret + E are DONE and the enquiry pipeline is PROVEN (2026-08-14)

This section used to say finishing Cloudflare outranked Plan 9. It did, and it is done. A real
submission through the live form reached `/enquiry-sent/?delivery=pending` — see the setup table
below and `docs/deployment.md` §6c.

**The site is still on `litex-website.pages.dev`.** What remains is **D (Resend — blocked, no
registrar access)** and **F (the custom domain / nameserver move, deliberately last)**. Neither is
startable today, which makes **Plan 9 the next real work** once `homepage-redesign` is merged.

### ⚠ Three things about Plan 8 that will bite if forgotten

- The Pages build command **must be `npm run build`**, not `npx astro build`. Already set correctly
  in the live project, and **verified in production** — all six catalogs download byte-exact.
- Cloudflare Web Analytics must be added to the **`DISCLOSED` allowlist in `tests/legal.test.ts`**
  and disclosed on `/legal/privacy/` in the same commit. Use the **manual** snippet, not
  Cloudflare's automatic injection — an auto-injected beacon is invisible to that guard, so the
  privacy notice could silently become untrue.
- The Turnstile **production** sitekey `0x4AAAAAAEOqzFlvFS397MkG` is committed and **guarded**: a
  test fails the build if the always-passes test key `1x00000000000000000000AA` reaches any page.
  Consequence for local work — `npm run dev` renders an error widget unless `localhost` is on the
  widget's hostname list in the dashboard. **Add it there; do not put the test key back.**

---

## State as of 2026-08-13 (session 10)

- **Plan 8 is COMPLETE** — all nine tasks merged (PRs #10, #11, #13, #14, and Task 9's docs commit).
  It shipped the 404 page, 15 redirects, the 410 Function, the sitemap, robots, the favicon, the
  print stylesheet, the broken-link sweep, the axe harness and cookieless analytics.
- **Plan 7** added the site's first server-side runtime, the first `functions/` directory and the
  first JavaScript this site has ever shipped.
- **The site is deployed** at **`https://litex-website.pages.dev`** — Cloudflare Pages, Git
  integration, auto-deploys on push to `main` in about 45 seconds.
- `npm run build` → **36 pages**. `npm test` → **373 passing across 23 files**.
  `npm run test:a11y` → **11 passing**. Detector clean. Spacing sweep empty.
- ⚠ **`npm test` needs a browser binary.** Task 7 added an axe/playwright accessibility run, so
  a fresh checkout must do **`npx playwright install chromium`** once or the suite fails with a
  missing-executable error rather than a test failure. CI will need it too. The run takes ~8s
  instead of ~2s. `npm run test:a11y` runs just that file.
- `dist` is about 16 MB, of which `dist/catalogs` is ~11 MB — the six catalog PDFs.
- Repo public at **https://github.com/darsonl/litex-website**. PRs #1–#15 merged.

### What is live, and what is not

**Cloudflare setup is PART-DONE.** `docs/cloudflare-setup.md` is the click-by-click walkthrough and
tracks which parts are finished.

| Part | State |
|---|---|
| A — Pages project, Git integration, build command | ✅ done, verified in production |
| B — KV namespace bound as `SUBMISSIONS` | ✅ **done and PROVEN 2026-08-14** — `docs/deployment.md` §6c |
| C — Turnstile widget | ✅ widget, sitekey **and secret** — all proven 2026-08-14 |
| D — Resend domain `send.litex.com.tw` | ❌ **blocked** — no registrar access yet |
| E — the Pages variables/secrets | ✅ **done** for the three that do not need Resend; `RESEND_API_KEY` absent by design until D |
| F — custom domain / nameserver move | ❌ deliberately last |

**The enquiry pipeline is proven end-to-end.** A real submission through the live form on 2026-08-14
landed on `/enquiry-sent/?delivery=pending` — which is only reachable by passing Turnstile *and*
completing the KV write, since a failed `put()` returns 503 instead. The full reasoning, and why no
automated check could have established it, is `docs/deployment.md` §6c. What remains is **delivery**,
which is Resend, which is blocked on registrar access.
| G — Web Analytics | ✅ site added; token committed in `BaseLayout.astro` |

**The fastest path to proving the enquiry pipeline is B + the C secret + E — none of which need
Resend.** With those three done, submitting a form writes a real KV record and returns the honest
queued-delivery message, because delivery fails without a Resend key and the endpoint reports
`outcome: 'stored'` rather than a false success. That is the never-lose-a-submission guarantee
demonstrated against real infrastructure, and it is the single most valuable thing still unproven.

**Consequence:** submitting either form on the live site currently returns
`400 {"outcome":"rejected","errors":{"turnstile":…}}` — the endpoint failing closed with no
secret configured. That is the design working, not a bug.

**Once B, C-secret and E are done — which do NOT need Resend — the most valuable behaviour in the
whole system becomes testable:** submit a form, watch a KV record appear, and see the honest
queued-delivery message. Delivery failure yields `outcome: 'stored'`, never a false success.

### Verified in production on 2026-08-13 — do not re-derive

Each of these was something an earlier plan could only assert. The full table is in
**`docs/deployment.md` §6b**; this is the summary.

- **All six catalog PDFs download byte-exact** against `src/data/catalog-files.json`. Plan 5's
  parked residual is **closed in production**.
- **`functions/api/submit.ts` deployed and runs**, and its import of `../../src/lib/enquiry` —
  reaching outside `functions/` into `src/` — **resolved in a real Pages build**.
- **Turnstile loads on exactly `/contact/` and `/request-a-sample/`**, and nowhere else.
- **A missing URL returns 404**, `/about-2/` returns **301 → `/company/about/`**, and
  `/2016/09/22/test-post-blah/` returns **410 in both the trailing-slash and bare forms** — the one
  behaviour that could not be verified locally.
- **`/contact/` returns 200, not a redirect.** The identity-mapping trap stays shut in production.
- **`robots.txt`, `sitemap-index.xml` and `favicon.svg` all return 200.** `robots.txt` names
  **`https://litex.com.tw/sitemap-index.xml`** — the custom domain, not the `pages.dev` host, so it
  needs no edit at the Part F cutover.
- **`sitemap-0.xml` carries 34 URLs** = 36 built pages − `/404` − `/enquiry-sent/`. Neither excluded
  page appears in it; both carry `noindex` per-page instead. That arithmetic is the cheapest way to
  re-check the exclusion after any page is added.
- **The analytics beacon serves on the deployed homepage.**
- **Lighthouse: 100 / 100 / 100 / 100 on both `/` and `/products/conductive-metal-yarn/`** —
  performance, accessibility, best practices, SEO, mobile preset, run by hand 2026-08-13. Spec §4's
  budget is ≥95, so it clears on every axis. **This is a lab measurement, not field data**, and it
  was taken on `litex-website.pages.dev`; **re-run it after the Part F cutover** rather than assuming
  it carries to the custom domain. Full table in `docs/deployment.md` §6b.

### ⚠ The defect that shaped Plan 8's task order

Before Task 1, **every unmatched URL returned HTTP 200 with the homepage.** Cloudflare Pages treats
a build output with no root `404.html` as a single-page app and matches all paths to `/`. That
silently defeated any broken-link check (nothing *could* 404) and made spec §3's 410 unobservable.
`src/pages/404.astro` is the entire fix, and it is why the 404 page is Task 1 rather than a
cosmetic afterthought.

### What Tasks 6–8 measured, so nobody re-derives it

- **The broken-link sweep found nothing** across **701 internal hrefs and 138 asset references on
  36 pages**. Proved rather than trusted: a probe adding `/no-such-page/` and `/no-such-image.png`
  failed both halves naming the exact URL.
- **axe reports zero WCAG 2 A/AA violations on all eleven representative pages.** The plan
  predicted real failures and there were none. In particular the honeypot's `tabindex="-1"`
  mitigation — decided on reasoning alone in Plan 7 — **holds up under a real engine**. Proved by
  a probe adding an alt-less image and a low-contrast paragraph, which failed naming `image-alt`
  (critical) and `color-contrast` (serious).
- **axe returns THREE outcomes, not two.** `incomplete` means "axe could not decide" — classically
  text over a background image. `tests/a11y.test.ts` asserts on incompletes **as well as**
  violations, with exactly one allowlisted exception: the decorative `aria-hidden` bullet in the
  status pill, which axe declines to judge as a non-BMP character. **Do not drop that second
  assertion** — without it a genuine unanswered question sits behind a green suite.
- **`@axe-core/playwright` rejects a page from `browser.newPage()`.** Every page must come from an
  explicit `browser.newContext()`, or all eleven tests fail before a single rule runs.

### ⚠ `tests/build.test.ts`'s render-blocking rule was narrowed — read before "restoring" it

`ships no render-blocking third-party requests` used to fail on **any** absolute URL, which is
broader than its name. Task 8's analytics beacon is `type="module"` — **deferred by default, so it
does not block first paint** — and therefore never violated the stated intent. The rule now tests
what it claims: an external stylesheet, or a plain `<script src>` with no `defer`/`async`/`module`,
still fails.

**This is not the disclosure guard and must not be treated as one.** Whether a third party may be
contacted at all is enforced separately and far more strictly by the `DISCLOSED` allowlist in
`tests/legal.test.ts`, which sweeps every built page **and** the emitted JS. A single probe — an
undisclosed, non-deferred script — trips both guards at once. Verified 2026-08-13.

### ⚠ Recurring lesson found three times in Plan 8 alone

**Every string-containment guard written in this plan collided with prose explaining the banned
thing:** the `_redirects` header comment mentioning `test-post-blah`, the 404 test searching for a
phrase that only exists in `<title>`, and the favicon comment saying "rather than `<text>`". This
is the same ruling as Plan 6's `techtextil-blog.com` collision, now confirmed as a *pattern*:

> When a guard bans a string, strip or parse away the places that string may legitimately be
> **discussed**, and assert against what the machine actually reads — rules, not comments; markup,
> not documentation about markup.

### What Plan 7 built, in one paragraph

`src/lib/enquiry.ts` defines the fields and validates them, with **zero imports**, so Vitest, the
Astro build and the Workers runtime can all load it. `src/components/EnquiryForm.astro` renders a
form from that list; `functions/api/submit.ts` validates against the same list. Both pages post to
the one endpoint with a `formType` discriminator. The endpoint runs honeypot → Turnstile →
validate → **KV write** → delivery, in that order, and the KV write happening *before* delivery is
asserted by a test on **call order**, not by reading the code. Delivery failure yields
`outcome: 'stored'` with the direct email address — never a success, never a bare failure.

### ⚠ The nav has seven items and the newest news post is January 2022. That is deliberate.

`/news/` is framed as an **archive**, not a live feed, and the framing is what makes the four-year
gap honest rather than embarrassing. The index says out loud that these are announcements published
between 2017 and 2022, reproduced with their original dates. The date range is **computed from the
entries**, so it cannot drift, and an eighth post in any year slots in with no code change.

Do not "fix" this by hiding the section from the nav, back-dating anything, or inventing filler
posts. The correct fix is LiTex supplying news since 2022 — see the open questions.

### Plan roadmap — 8 total

| Plan | Scope | State |
|---|---|---|
| 1 | Foundation & content layer | ✅ merged (PR #1) |
| 2 | Product layer & spec table | ✅ merged (PR #2) |
| 3 | Product photography & image pipeline | ✅ merged (PR #3) |
| 4 | Site chrome & the technology section | ✅ merged (PR #4) |
| 5 | `/company/` ×4 · `/downloads/` · `/legal/privacy/` | ✅ merged (PR #5, `28fc138`) |
| 6 | `/news/` index + 7 posts | ✅ merged (PR #6, `bafff91`) |
| 7 | Contact + sample-request flow (Pages Function, Turnstile, KV, Resend) | ✅ merged (PR #7, `1a2a3a6`) |
| 8 | Launch: 404, `_redirects`, sitemap, favicon, print, link sweep, axe, analytics | ✅ **merged in full** (PR #10, #11, #13, #14 + the Task 9 docs commit) |
| 9 | **Sveltia CMS at `/admin`** + the deferred `SpecTable` "Request this grade" CTA | 📝 **not written — write it next** |

**The roadmap grew to 9.** Sveltia CMS was deferred out of Plan 8 by decision on 2026-08-13: it
needs a GitHub OAuth backend (a second deployable on Cloudflare) plus a `config.yml` mirroring every
content collection's schema. That is a subsystem, not a launch chore, and **launch does not depend
on it** — content is edited by commit until then. Spec §4's CMS row still stands; it is simply not
Plan 8.

---

## What Plan 9 inherits — use these, don't reinvent

| Thing | Where | Note |
|---|---|---|
| Deployment checklist **+ the launch verification record** | `docs/deployment.md` | Every binding, secret and variable the function reads, the build-command trap, the Turnstile test keys, the Resend DNS dependency and a five-step smoke test. **§6b holds the Plan 8 Task 9 results — local and deployed — so nobody re-runs them to find out.** Written to be executed, not re-derived. |
| The 404 page | `src/pages/404.astro` | **Load-bearing infrastructure, not a cosmetic page.** Without a root `404.html`, Cloudflare Pages treats the whole build as a single-page app and answers *every* unmatched path with 200 + the homepage. A test asserts `dist/404.html` exists so that cannot silently return. |
| Legacy URL map | `public/_redirects` | **Exactly 15 rules**, all 301. A test fails on a 16th that maps a path to itself. |
| The one 410 | `functions/2016/09/22/test-post-blah.ts` | A Pages **Function**, because `_redirects` cannot express 410. Cloudflare matches both the trailing-slash and bare forms. |
| Sitemap & robots | `@astrojs/sitemap` in `astro.config.mjs`, `public/robots.txt` | The sitemap **excludes** `/404` and `/enquiry-sent/`; both also carry per-page `noindex`. A new page joins the sitemap automatically — if it must not, exclude it **and** add the meta tag. |
| Print stylesheet | `src/styles/global.css` `@media print` | Checked by eye on a spec-table page and on `/contact/`. A new page type with heavy chrome should be print-previewed once. |
| Broken-link sweep | `tests/links.test.ts` | Walks **every** built page's internal hrefs and asset references against `dist`. A new route needs no registration; a dead link fails the build naming the exact URL. |
| Accessibility harness | `tests/a11y.test.ts`, `npm run test:a11y` | axe over **eleven representative pages**. **A new page template should be added to its list** — the list is representative, not exhaustive, so an unlisted template is unmeasured. Asserts on `incomplete` as well as `violations`. |
| Analytics + the disclosure contract | `src/layouts/BaseLayout.astro:18`, `tests/legal.test.ts` | The token is committed and the beacon is injected **manually**. Any new third party must be added to `DISCLOSED` **and** disclosed on `/legal/privacy/` in the same commit. |
| Primary nav | `src/lib/nav.ts` | Seven items; `/contact/` is last. `tests/chrome.test.ts` **fails if a chrome link has no built page behind it** — add the route first, then the nav entry. |
| Shared dist test helpers | `tests/helpers/dist.ts` | `DIST`, `walk`, `allHtmlFiles`, `docFor`, `routeFile` — one copy each. A new test imports them; it does not paste them. `walk` also exists in `tests/fonts.test.ts` **by design** — different function, walks `src/`. Do not merge them. |
| Enquiry field definitions | `src/lib/enquiry.ts` | `FORM_TYPES`, `FIELDS`, `fieldsFor()`, `validateEnquiry()`, `MAX_LENGTHS`, `HONEYPOT_FIELD`. **Zero imports, deliberately** — loaded by Vitest, the Astro build *and* the Workers runtime. Do not add an Astro import to it. A product-page "Request this grade" CTA (spec §5) reads `fieldsFor('sample')` from here. |
| The endpoint | `functions/api/submit.ts` | `onRequestPost` at `POST /api/submit`, plus exported `verifyTurnstile()` and `deliver()` so both are testable alone. `fetchImpl` is an injected test seam; Cloudflare never passes it. `RETENTION_SECONDS` = 180 days and **`/legal/privacy/` states that number in prose** — change the constant, the page and `tests/legal.test.ts` together. |
| The form component | `src/components/EnquiryForm.astro` | `<EnquiryForm formType="contact"\|"sample" submitLabel="…" sitekey?="…" />`. Renders fields from `fieldsFor()`, plus honeypot and Turnstile widget. Its `<script>` is progressive enhancement only — **the form must keep working with it removed.** |
| Stored-timestamp handling | `src/lib/dates.ts` | The single owner of `2017-02-23T14:47:55+08:00`: parsing, formatting, ordering *and* calendar validity. Zero imports. Do not re-derive its calendar check anywhere else. |
| `byPublishedDesc` is load-bearing | `src/lib/dates.ts` | Three posts share **2017-02-23** and differ only by time. **If anyone "simplifies" this to compare dates only, those three silently reorder.** |
| Captioned archive photography | `src/components/ArchiveFigure.astro` | Props `{ image, alt, caption (required), size?, loading? }`. Never upscales a source. |
| Contact block | `src/components/ContactBlock.astro` | Props `{ showLegalNameZh?: boolean }`. Used on `/company/about/`, `/company/`, `/legal/privacy/` **and now `/contact/`**. Do not add a fifth inline `<address>`. |
| Three-group image extraction | `scripts/extract-images.mjs` + `extract-image.py` | `SOURCES` entries carry `group: 'products'\|'company'\|'news'`. `tests/provenance.test.ts` asserts no filename appears in two groups. Re-running is deterministic, but the script **clears every group directory first**. |
| Catalog delivery | `public/catalogs/` (gitignored), `scripts/sync-catalogs.mjs`, `src/data/catalog-files.json` | `npm run build` is `node scripts/sync-catalogs.mjs && astro build` — an **inlined step, not an npm `prebuild` hook** — so it survives `pnpm`. It does **not** survive `npx astro build`. See the parked residual. |
| `data-source-note` vs `data-page-note` | `company/*.astro`, `news/[slug].astro` | `SpecTable` emits its own `[data-source-note]`; a page-level note beside a `SpecTable` uses `[data-page-note]`. Tests query per page via `docFor`, never site-wide. |
| JSON-LD | `src/lib/jsonld.ts` | `productJsonLd()` and `newsJsonLd()` (`BlogPosting`). Emitted `url` must match the page's canonical. News `datePublished` keeps `+08:00` and `tests/news.test.ts` **hardcodes it**. |
| The third-party allowlist | `tests/legal.test.ts` | `DISCLOSED` now holds **two** URLs — the Turnstile widget and the Web Analytics beacon. The guard sweeps **built HTML *and* emitted JS** and fails on anything undisclosed. **A third entry may only be added in the same commit that discloses it on `/legal/privacy/`.** |

---

## ⚠ The two Plan 5 forward guards — both resolved in Plan 7, do not reopen

Plan 5 wrote two tests designed to fail the moment their premise stopped being true. Plan 7 Task 4
made **both** false, and both were resolved in that same commit — the plan predicted only one.

1. **`describes no form while no form exists`** — **deleted**, and replaced by
   `describes the form now that one exists`, which asserts `/legal/privacy/` names Turnstile, the
   180-day retention and the no-IP promise.
2. **`claims no analytics only while the site really runs none`** — **rewritten, not deleted.** It
   now fails on any external resource not in the `DISCLOSED` allowlist. Its unrelated "no analytics"
   text assertion was **kept as its own test** rather than lost with the sweep it used to travel
   with.

Both fired for real before being fixed, which is the evidence they were doing their job. The
rewritten guard was then **proved** by adding `<script src="https://example.org/tracker.js">` to
`BaseLayout.astro`, watching it fail naming that URL, and reverting.

---

## The news archive as built

Seven posts in `src/content/news/`, transcribed from `archive/pages/news-*.html` with linkedom and
**independently re-verified word-for-word by a second reader** against the archived originals.

- `publishedAt` is taken from the archive's `entry-date published` datetime — **not** the "updated"
  timestamp. The archived pages carry both; they are not the same value.
- Every archived title contained **U+00A0**. All were normalized to a normal space; a test asserts
  none survives. Curly apostrophes (U+2019) are correct typography and were preserved.
- **No page anywhere claims a quotation is verbatim.** Each post carries a `sourceNote`.
- Exactly **one photograph** ships: `src/assets/news/new-braided-self-curling-tube.jpg`, LiTex's own
  macro of the braided sleeving.

---

## Company photography extracted in Plan 5

All six sourced from `archive/catalogs/2018-company-introduction.pdf`, verified 2026-08-11 by
rendering and viewing each file.

| Slug | Shows | Used on |
|---|---|---|
| `premises` | The LiTex building from street level, illuminated shopfront sign reading *LiTex* over *LED 紡織科技* | `/company/about/` |
| `heritage-nameplates` | Two brushed-steel nameplates: 恆好貿易有限公司 / HEN HAO TRADING CO., LTD. and 台灣吉普織帶工業 / TAIWAN TULIP RIBBON & BRAIDS | `/company/about/` |
| `factory-floor` | Creel rack, narrow-fabric loom, a row of covering machines | `/company/about/` |
| `trade-show-stand` | Three staff under a sign reading LITEX TEXTILE & TECH. CO., LTD. | `/company/about/` |
| `taitronics-award` | 2014 TAITRONICS Technology Innovation Awards certificate | `/company/patents-and-awards/` |
| `sgs-test-report` | Cover of SGS Test Report `CE/2013/52203` | `/company/certifications/` |

**Correction held from session 4:** an earlier handoff described p.1 xref 52 as "a loom with
LiTex-branded tape, two framed certificates, a spool of woven tape". That is wrong on every count.
Taiwan Tulip Ribbon & Braids appears in **no archived HTML** — only in this photograph. Do not
reintroduce the old wording.

**Correction to the TAITRONICS date:** the day's final digit is unresolvable at 14× lanczos —
either a 6 or a 9. The site publishes **"September 2014"** and nothing more precise. Do not restore
a specific day without a better source image.

---

## ⚠ Patent facts — resolved 2026-08-11, do not re-derive or revert

The archive's patent claims are **stale and partly false**. Transcribing
`archive/images/patents-and-awards.jpg` onto the site would publish two untrue statements.

| Record | Truth (Google Patents) |
|---|---|
| **TWM545145U** | *"Elastic ribbon having extensible electronic device"*, filed 2017-03-20 by **富鉅紡織科技股份有限公司** — exact match for `COMPANY.legalNameZh`. **Renewal status unconfirmed.** |
| **US 12/787,378** | **ABANDONED 2012-04-23** — failure to respond to an office action. **Never granted.** |
| **TW M371733** | **LAPSED 2017-10-01**, non-payment. |
| Applicant | Older filings are **Fu-Biau Hsu / 許富標 as an individual**, not the company. |

- The archive prints **"TW 1M545145" — malformed**. Correct form is **TWM545145** / `M545145`.
- Because the US application was abandoned, **the USPTO ribbon certificate in the catalog is not for
  it.** What it depicts is unknown. It carries **no number** — checked at 4× upscale.
- The credibility bar reads **`TW UTILITY MODEL M545145`**, deliberately not asserting a right in
  force. `tests/chrome.test.ts` fails if `1M545145` or `PATENTED` reaches any built page.

---

## Settled — do not re-raise

- **Image usage rights granted** (2026-08-11) for all catalog photography. The grant covers
  **LiTex's own photography**, not third parties' marks.
- **The public repo is deliberate.** Do not suggest making it private.
- **The Google Maps API key in `archive/pages/*.html` is not a leak and is not LiTex's.** Checked
  2026-08-11; it is Automattic's. Do not propose a history rewrite.
- **News posts stay as short dated entries.** *New Braided Self-curling Tube* has **no body text at
  all**; the longest of the seven is three sentences. That is the real material. Do not pad it.
- **WordPress.com Site Redirect:** legacy `litextextile.wordpress.com` URLs will not 301. Business
  decision, already taken.
- **LiTex is a subsidiary of Hen Hao Trading**, and the two share the Bangka Blvd. premises.
  Declared once as `COMPANY.parentCompany`. **Only the LiTex/Hen Hao relationship is confirmed** —
  Taiwan Tulip Ribbon & Braids is known solely from its nameplate, which establishes co-location
  and nothing more.
- **SGS report `CE/2013/52203` is issued in Hen Hao Trading's name**, stated outright on
  `/company/certifications/` under "Issued to". A residual commercial question remains and it is a
  question for LiTex, not for the site.
- **`litex.com.tw` and `sales@litex.com.tw` are confirmed.** A test fails if any `example.com`
  string is rendered.
- **The four Plan 6 news decisions** — no third-party event imagery; `test-post-blah` stays dead
  (seven posts, not eight); the TechTextil blog article is not linked (dead domain, wrong TLS
  certificate); titles normalized and two typos corrected with disclosure. **Do not re-litigate.**

### Settled in Plan 7 — the five contact-flow decisions

Taken with the human on 2026-08-12, recorded in the plan's front matter and now also in **spec §4
"Contact form — failure modes → As built"**. Do not re-derive them, and in particular do not
rediscover the dead end in the first one:

1. **Delivery goes through Resend.** **MailChannels' free Cloudflare integration ended 2024-06-30** —
   every blog post and Stack Overflow answer describing it is dead. And **`send_email` is a
   Workers-only binding, unavailable to Pages Functions**: it would need a second deployable plus a
   service binding, and Email Routing needs LiTex to click a verification link.
2. **The form works with JavaScript disabled.** Verified in a browser with `javaScriptEnabled:
   false`: a native `POST` to `/api/submit` carrying the full body.
3. **Both pages, one endpoint**, with a `formType` discriminator.
4. **Three outcomes, never two** — `delivered` / `stored` / `rejected`, plus `failed` when the store
   itself fails.
5. **No IP address is stored or transmitted.** Turnstile's `remoteip` is deliberately not sent.

### Also settled in Plan 6 — rulings and standards worth keeping

- **`walk` exists in two files by design.** Two reviewers confirmed they are different functions.
  **Do not "finish the job" by merging them.**
- **A string-containment ban over rendered HTML cannot tell a link from a mention.** Guard the thing
  that actually harms a reader.
- **The standard for "this guard still works".** Prove it, don't assert it: add a live probe that
  should trip the guard, rebuild, observe the failure, revert, re-verify. Applied again in Plan 7
  to the rewritten third-party guard.
- **When a fix rewrites a factual sentence, re-verify the whole sentence.** Plan 6's best catch: a
  fix removed one unverifiable claim from an alt text and introduced a different one in the same
  sentence.
- **The braided-tube alt text does not mention the self-curling overlap seam.** Three viewers found
  none in this crop. Do not restore the claim from product knowledge.

---

## Toolchain gotchas that have already cost time

Full detail in the `litex-verified-toolchain` memory. The ones that bite hardest:

1. **`extract_image()` returns raw stored bytes** — three catalog images are **JPEG 2000**, which
   sharp cannot decode, and all six are **CMYK**. Decode through `fitz.Pixmap` → `fitz.csRGB`.
2. **Astro `compressHTML` (default true) strips the newline between text and a following element**,
   so `covering,\n<span>1S1Z</span>` ships as `covering,1S1Z`. Fix with an explicit `{' '}`.
   Detect with `grep -oE '[a-zA-Z,;:.]<(span|a|strong|em)\b'` over `dist/**/*.html`.
3. **`<Picture>` sizes its fallback from the source's intrinsic width** unless given `width`, and
   **Astro emits the untouched source file for every `image()` a schema resolves**, referenced or
   not. Sources are capped at 1400 px by the extraction script.
4. **A broken `reference()` does not fail the build** (exits 0, renders blank). Always use
   `mustResolve()`. Schema `superRefine` violations *do* fail (127).
5. **sharp holds files open on Windows** — read into a Buffer before writing back to the same path.
6. A local, gitignored waiver in `.impeccable/config.local.json` silences the `broken-image` rule
   inside `tests/imagery.test.ts` only. The rule still fires everywhere else.
7. **pymupdf's `Pixmap.copy(source, irect)` works in absolute coordinates.** A destination pixmap at
   `IRect(0, 0, w, h)` does not intersect a source region at a non-zero offset — the result is a
   black rectangle that is otherwise a completely valid JPEG. Fixed in Plan 5; now caught
   structurally by a bytes-per-pixel uniformity check in `tests/provenance.test.ts`.
8. **YAML parses an unquoted ISO timestamp into a `Date`, not a string** — and a `Date` has already
   thrown away the `+08:00` offset. **Every `publishedAt` in `src/content/news/*.md` is quoted.**
   Do not "tidy" the quotes away.
9. **`Date.parse` is lenient by specification — it cannot be used as a validity check.**
   `Date.parse('2018-02-31')` rolls forward to March 3 and returns a good number. **Round-trip
   through `Date.UTC` and compare the fields back.** The trap inside the trap: a stricter check must
   still **accept real leap days** — `2016-02-29` is valid and a test pins it.
10. **Consolidating a helper out of a test file breaks unrelated imports** — an import line can serve
    both a helper being deleted and a direct use elsewhere in the same file. Run the suite before
    believing the refactor.
11. **Astro rewrites a non-`is:inline` external `<script src>` into a local module** whose body is
    `import "https://…"`. The browser still makes the third-party request, but **no HTML attribute
    names it**, so an HTML-only scan for external resources reports clean. This was demonstrated,
    not assumed, in Plan 7 Task 4 — it is why `tests/legal.test.ts` sweeps emitted `.js` as well as
    HTML, and why the Turnstile tag is marked `is:inline`.
12. **`dist/` is gitignored, and ripgrep skips ignored paths by default.** Claude Code's Grep tool
    is ripgrep, so a dist-wide search through it returns "no matches" **without opening a file**.
    Since this repo's entire test strategy reads `dist/`, use Bash `grep` for any dist sweep. A
    clean result from a tool that never looked is the most dangerous kind of green.
13. **`playwright-cli eval` treats any string containing `=>` as a function definition**, so an
    arrow-function one-liner fails with `TypeError: result is not a function`. Wrap the expression
    in `(function(){ … })()` and use a `for` loop instead.

---

## Parked residual — ✅ CLOSED in production, but the trap is permanent

`npx astro build` on a cold checkout ships a build with an unpopulated `public/catalogs/`, because
`npx` bypasses `package.json` scripts entirely and the inlined `node scripts/sync-catalogs.mjs`
never runs. **The Cloudflare Pages build command is set to `npm run build` and all six catalog PDFs
download byte-exact in production**, so the residual is closed.

**The trap itself has not gone away.** It is the first row of `docs/deployment.md`'s settings table
because it is invisible to every test in this repo: nothing fails, the six downloads and five
product catalog links simply 404. **The moment CI exists, it must run `npm run build`, never
`npx astro build`.**

---

## Carried-forward minors from the Plan 5–7 review ledgers

The SDD ledgers are gitignored and deleted once their plan merges, so findings with a live trigger
condition are preserved here. None is a bug; each is a decision that becomes wrong later.

**Plan 8 acted on none of these three; they carry to Plan 9.** Items 1 and 2 were re-checked
against the code and the live site on 2026-08-13 and the notes below are corrected accordingly.

1. **The function still assumes all five `env` values exist.** `submit.ts:131` is still bare
   `const contactEmail = env.ENQUIRY_TO`, with no fallback, so on a deployment where the variable is
   missing every honest failure message degrades to "please email " with nothing after it — on
   exactly the paths that exist to give the visitor a way through. Cheapest fix is a hardcoded
   default equal to `COMPANY.email`.
   **⚠ Correction to an earlier note: `ENQUIRY_TO` IS set in production.** A probe POST on
   2026-08-13 returned `"contactEmail":"sales@litex.com.tw"`, and a missing value would have made
   `JSON.stringify` drop the key entirely. So the bad path is **latent, not live** — it would show up
   on a preview deployment, or if the project were ever recreated. Fix it anyway; do not treat the
   live site as evidence the risk is gone.
   **That same probe proves nothing about `TURNSTILE_SECRET`**, because it sent no
   `cf-turnstile-response` field — the rejection is what you get whether or not the secret exists.
   Do not read a Turnstile rejection as "the secret is missing".
2. ✅ **Resolved.** The production sitekey `0x4AAAAAAEOqzFlvFS397MkG` ships and **a test fails the
   build if the always-passes test key reaches any page.** The gap existed only because the real key
   did not exist in the repo yet. Do not reintroduce the test key for local convenience — add
   `localhost` to the widget's hostname list instead.
3. **Nothing notices a run of `stored` outcomes**, which is precisely the signal that Resend has
   stopped accepting mail. There is no alerting and no admin UI; submissions are read from the
   Cloudflare dashboard.
4. The **dist-reading test strategy assumes `npm run build` ran immediately before `npm test`.** A
   stale `dist/` can pass some assertions vacuously. A CI-ordering constraint the moment CI exists.
5. **Every `npm run build` rewrites `src/data/catalog-files.json` with a CRLF-only diff** and no
   content change, dirtying the working tree on every build. It has now cost **five** separate agents
   a detour into "what did I change?" — it recurred again in session 10. Fix the line-ending handling
   in `scripts/sync-catalogs.mjs` or `.gitattributes`. **Until then: if it shows modified with an
   empty `git diff`, `git checkout --` it.** `git diff` prints only
   `warning: … LF will be replaced by CRLF`, which is the tell.
6. **`/news/`'s `BlogPosting` JSON-LD omits `image` and `author`.** Both omissions are honest rather
   than lazy — `author` is genuinely unknown and `image` exists for only one of seven. If LiTex ever
   answers who wrote them, add `author`.

**Left alone deliberately, trigger re-evaluated:**

7. **`ArchiveFigure` and `ProductHero` share near-identical figure boilerplate.** The recorded
   trigger was "if a third figure component appears". It has not. Re-evaluate if one does.
8. **`ArchiveFigure size="full"` resolves its `widths` ladder to `[400, 800]`**, so an 800–1200px
   source fills a ~960px slot at 800px. Cosmetic sharpness only; no budget is breached.
9. **`/enquiry-sent/` shows both the delivered and the queued message when JavaScript is off.** The
   page is static, so the distinction is drawn by a tiny inline script reading the query string.
   Verbose but never misleading — the visitor is told the enquiry is recorded either way. The
   comment in the page says so.

**No trigger, carry indefinitely:**

- `dirFor()` reimplemented with different signatures in `extract-images.mjs` and `provenance.test.ts`.
- `patents.ts` repeats 富鉅紡織科技股份有限公司 as a literal instead of importing `COMPANY.legalNameZh`.
- `AWARD.dated` is styled `class="value"` beside true identifiers.
- The "does not assert a right currently in force" test only checks that the word "renewal" appears.
- The "never publishes the unattributable US patent certificate" test cannot fail until a
  `us-patent` slug exists (forward guard by design).
- `scripts/sync-catalogs.mjs` throws a bare ENOENT if `archive/catalogs/` is missing.
- `humanSize()` has no direct unit test, so the MB/KB boundary is unpinned.
- `about.astro:99` is a 113-char line against a ~78–90 char file norm.
- `about.astro:132–135` is interpretive framing rather than a sourced fact.
- **`isStoredTimestamp` does not signal in its name that it also checks calendar realness.** Its
  JSDoc says so. `isValidStoredTimestamp` would read better if it is ever renamed.
- **`dates.ts`'s "does not depend on the runner timezone" test never varies `TZ`.** Proving it
  properly needs a child process; the implementation contains no timezone-sensitive path at all.
- **`products/[slug].astro` tags its JSON-LD `<script>` `is:inline`; the news page omits it.**
  Verified that Astro 7 does not process `type="application/ld+json"` at all — both emit
  byte-identical tags. Stylistic only.

---

## Open questions for LiTex — carried forward and revised

Ordered by how much damage the wrong answer does.

1. **Who actually receives enquiries?** ⚠ **New, and now the most urgent of all of these.** The
   whole contact flow delivers to `sales@litex.com.tw`. Nobody has confirmed that inbox is
   monitored, or by whom, or how fast. `/enquiry-sent/` promises a reply "within one working day".
   **The most carefully built enquiry pipeline on earth is worth nothing if the inbox is not read** —
   and the site now makes a promise on LiTex's behalf. Ask before launch.
1b. **Should the `*.pages.dev` preview host be de-indexed once the custom domain is live?** ⚠ **New.**
   `robots.txt` already names the **custom** domain's sitemap (`https://litex.com.tw/sitemap-index.xml`),
   and every canonical points at `litex.com.tw`, so the duplicate-content risk is small — but
   `litex-website.pages.dev` is publicly crawlable today and will stay so after the cutover unless
   something is done. The options are a Cloudflare redirect rule from the `pages.dev` host to the
   custom domain, or leaving it. **Decide at the Part F cutover, not before** — de-indexing it now
   would hide the only host the site currently has.
2. **TWM545145 renewal status.** Its sibling lapsed for non-payment; this is the claim in the footer
   of every page. A confirmation would let the credibility bar say something stronger.
3. **What is the SGS report's scope?** Not readable at the stored resolution — the site says so out
   loud. Spec §7 item 5 rates it High.
4. **The thermograph's test conditions** — voltage, duration, ambient temperature, colour scale.
   Held out of `/technology/` for a fifth plan running.
5. **News since 2022** (spec §7 item 14). `/news/` is framed as an archive, which makes the gap
   **honest** — it does not **fill** it. Drop a Markdown file in `src/content/news/` and the year
   grouping and stated date range update themselves. **Ask every time you speak to them.**
6. **Does LiTex have a copy of the TechTextil coverage?** June 2017, `techtextil-blog.com/en/the-heat-is-on/`,
   interviewer Liam Rodden. The domain is dead and serves a Messe Frankfurt certificate. **This is
   the only independent editorial mention of LiTex anywhere in the archive**, which makes it
   disproportionately valuable. Ask for a PDF, a print copy or a screenshot.
7. **Is a 180-day retention right** for their record-keeping? ⚠ **New.** It is published on
   `/legal/privacy/` and enforced by `expirationTtl` on every KV write. If their commercial
   record-keeping needs longer, both must change together.
8. **Should a sample request accept attachments?** ⚠ **New.** A drawing or spec sheet would be
   genuinely useful and is the most obvious missing field; it needs R2 or size-limited base64 and
   its own abuse surface, so it was deliberately not built.
9. **Should `/legal/privacy/` be reviewed by LiTex's counsel?** **Sharper now than before Plan 7** —
   the page has stopped being a formality, because the site now collects personal data and makes
   specific, checkable promises about it (no IP address, 180 days, three named processors). Flag it;
   do not block launch on it.
10. **What the USPTO certificate actually is**, given 12/787,378 was abandoned. Deliberately
    unpublished, so no longer blocking.
11. **Are CN 201485574U, TW 099146482 and CN 201120008487.x still live?** The page prints "Not
    verified" against all three. LiTex can answer in a sentence.
11b. **Which of the older filings were made by Fu-Biau Hsu (許富標) personally?** The page says "some"
    because that is the precision the evidence supports.
12. **Company facts for `/company/about/`** — headcount, floor area, production capacity, factory
    locations. The page deliberately states none of these.
13. **CuNi status** — "coming soon" in 2018; `/technology/` still says exactly that. Nine years of
    "coming soon" is its own signal.
14. **Is the 2018 grade range (1S–4S4Z) still current?** The whole `/technology/` argument rests on it.
15. **Are the 2018 catalogs still the current set?** `/downloads/` serves all six and says plainly
    that they are eight years old.
16. **Re-shoot `wired-conductive-tape`** (600×341 is genuinely the largest in the archive).
17. Carried over: EMI `(c)` column and `(ø)` units; the stainless steel yarn table's owning product.

---

## Resuming in a new session

**Everything below was true at 2026-08-13. Trust it over any recollection.**

### Where things stand

**Plans 1–8 are all merged.** `main` is clean and pushed, **nothing in flight**: `npm run build` →
**36 pages**, `npm test` → **373 passing across 23 files**, `npm run test:a11y` → **11 passing**,
detector clean. The site auto-deploys to `litex-website.pages.dev` on push to `main`, in about 45
seconds. The launch verification record is `docs/deployment.md` §6b.

### Do this first

**Two candidates, and the second is worth more than the first:**

1. **Write Plan 9** with `superpowers:writing-plans` — Sveltia CMS at `/admin` plus the deferred
   `SpecTable` "Request this grade" CTA. Then execute it subagent-driven.
2. **Finish the Cloudflare setup** — parts B, C-secret and E of `docs/cloudflare-setup.md`, none of
   which need Resend. This is what turns the enquiry pipeline from unit-tested into proven, and it
   is the last thing standing between the repo being launch-ready and the site being launched.

**Run `npx playwright install chromium` before `npm test`** on a fresh checkout, or the suite fails
with a missing-executable error rather than a test failure.

**Branch before committing anything.** In session 9 the Plan 8 document was committed straight to
local `main` and never pushed; a later branch cut from that `main` dragged the unpushed commit into
an unrelated PR (#9), which then carried two commits its title did not mention. Nothing was lost,
but `main` had to be reset to `origin/main` and the feature branch rebased. **Committing to `main`
looks harmless right up until someone branches from it.**

Do not re-run brainstorming or the spec self-review, and do not re-derive anything under
"Settled — do not re-raise".

The `gh` token note, kept because it will recur: `gh pr edit` and `gh pr merge` may fail with a
**`read:org` scope error**. Fall back to the REST API
(`gh api --method PUT repos/darsonl/litex-website/pulls/N/merge`) or the browser. It is a token
config issue, not a repo problem. Note that `git branch -d` **refuses after a squash merge**,
because the branch's commits are not ancestors of `main`. Diff the branch against `main` to prove
the content landed, then `-D`. **The refusal is not evidence of unmerged work.**

### What NOT to redo

- Do not re-derive the patent statuses, the TAITRONICS award text, the SGS report facts, the catalog
  page counts, or any company photograph's contents.
- Do not re-transcribe the seven news posts.
- Do not "fix" the missing full stop at the end of the Mobile information paragraph on
  `/legal/privacy/`, or the reduced-precision "September 2014" award date. Both are deliberate and
  both are explained in comments beside them.
- Do not restore `PATENTED` or `1M545145` anywhere. A test bans both site-wide.
- Do not add a fifth inline contact `<address>` — use `src/components/ContactBlock.astro`.
- Do not hide `/news/` from the nav or invent posts to close the 2022 gap.
- Do not go hunting for an eighth news post. `test-post-blah` was read, has real content, and was
  killed anyway on the merits.
- **Do not remove or loosen the `DISCLOSED` allowlist in `tests/legal.test.ts`.** It is deliberate,
  and it now holds **two** entries — the Turnstile widget and the Cloudflare Web Analytics beacon,
  both disclosed on `/legal/privacy/`. Any future third party goes in the list **and** on that page
  in the same commit. Loosening the guard to make a test pass silently un-does the only mechanism
  that keeps the privacy notice true.
- **Do not add a Subresource Integrity hash to the Turnstile script.** The endpoint is unversioned
  and Cloudflare rolls it in place, so a hash would guarantee a silent breakage of both forms. The
  full reasoning is in Plan 7's front matter.
- **Do not add client-side validation to `EnquiryForm.astro` to make errors appear without a
  server.** Validation lives once, in `src/lib/enquiry.ts`, and the server is authoritative. In
  `astro dev` there is no Functions runtime, so a submission 404s and the script correctly reports
  that it could not reach the server. That is the design working, not a gap to fill.
- **`_redirects` deliberately holds 15 rules, not the 22 rows in spec §3.** Seven of those rows are
  **identity mappings** — a path redirecting to itself — and writing them creates redirect loops.
  `/contact/` returning **200** on the live site is that trap staying shut, and it is asserted.
- **The 410 is a Pages Function** (`functions/2016/09/22/test-post-blah.ts`) because `_redirects`
  cannot express 410. **Do not "simplify" it into the redirects file** — the file has no syntax for
  it, so the result would be a silent downgrade to a redirect or a 404.
- **The analytics beacon and the Turnstile tag are `is:inline` so the third-party guard can see
  them.** Astro rewrites a non-inline external `<script src>` into a local module whose body is
  `import "https://…"`: the browser still makes the third-party request, but **no HTML attribute
  names it**. Removing `is:inline` makes them invisible to the guard and the privacy notice can
  silently become untrue.
- **Do not "restore" the render-blocking rule in `tests/build.test.ts` to fail on any absolute
  URL.** It was deliberately narrowed in Task 8 to test what its name claims. See the section on it
  below — and note it is **not** the disclosure guard, which is separate and much stricter.

### Execution mode recommendation for Plan 8

Run it **subagent-driven** (`superpowers:subagent-driven-development`), as Plans 5–7 were, and run
the pre-flight scan before Task 1 — it caught a build-breaking contradiction in Plan 6 before a
single implementer started. Across three plans the pattern holds: **most implementation tasks needed
a fix round, and effectively every finding traced to the plan's own text rather than to implementer
error.** The plan's author cannot review the plan's prose.

Plan 7 added a fresh example, and it is worth carrying into Plan 8's review budget: the plan's own
manual-verification step asked the implementer to confirm that **inline field errors appear in
`astro dev`**, which the plan's own architecture makes impossible — validation is server-side only
and there is no Functions runtime locally. The same step's *next* sentence correctly predicts the
404 that makes it impossible. **Two adjacent sentences of the same step contradicted each other.**
The inline-error path was verified instead by mocking the endpoint response in the browser, which is
the only honest way to check it before Plan 8 deploys.

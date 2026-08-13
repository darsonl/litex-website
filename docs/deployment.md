# Deploying LiTex to Cloudflare Pages

**Written:** 2026-08-13, at the end of Plan 7. **Updated 2026-08-13** at the end of Plan 8 with the
launch verification results in §6b.

**Status: partly executed.** The site is live at **`https://litex-website.pages.dev`** — Pages
project, Git integration and build command are done and **proved in production** (§6a), and Plan 8's
launch work is verified against the deployed site (§6b). **Still outstanding: the KV namespace, the
`TURNSTILE_SECRET`, the four Pages variables/secrets, Resend domain verification (§4) and the
nameserver move (§6).** Every item below is either read directly out of the committed code or was
verified against vendor documentation on 2026-08-12 — nothing here is written from memory.

Until §2's bindings exist, `/contact/` and `/request-a-sample/` render correctly and post to
`/api/submit`, which **is deployed and runs** but fails closed at the Turnstile check with no secret
configured — returning `400 {"outcome":"rejected",…}` and storing nothing. That is the design
working. There is no Functions runtime in `astro dev`, so a *local* submission returns 404. Both are
expected and neither is a bug to chase.

---

## 1. Pages project settings

| Setting | Value | Why it matters |
|---|---|---|
| Framework preset | **None** | Astro's preset may substitute its own build command and undo the row below. |
| Build command | **`npm run build`** | **Not `npx astro build`, and not the Cloudflare default.** `npm run build` is `node scripts/sync-catalogs.mjs && astro build`. `npx` bypasses `package.json` scripts entirely, so the catalog sync never runs, `public/catalogs/` stays empty, and the six downloads plus five product catalog links 404 in production **with no test catching it**. This is the parked residual from Plan 5. |
| Build output directory | **`dist`** | |
| Root directory | repository root | `functions/` must sit at the root of the deployed project or the endpoint is never created. |
| Node version | **`NODE_VERSION` = `22.12.0`**, set as a build environment variable | `package.json` declares `engines: { node: ">=22.12.0" }`. Cloudflare's default build-image Node version depends on which build system the project uses and **may be older**, so set this explicitly rather than relying on the default. |

`functions/api/submit.ts` needs no configuration — Cloudflare compiles every file under
`functions/` at deploy time and serves this one at **`POST /api/submit`**, matching the `action` on
both forms.

### Why there is no deploy command — and why it is not `wrangler deploy`

**Build command is not a deploy command.** In the Git-integration model above there is no deploy
step to configure at all: pushing to `main` is the deploy. Cloudflare clones the repo, runs
`npm run build` inside its own container, publishes `dist`, and compiles `functions/` itself.

`npx wrangler deploy` is the **Workers** command, not the Pages one, and this project has no
`wrangler.toml`, no wrangler dependency and no Worker to deploy — Plan 7 chose that deliberately
("no `wrangler` dependency and no local Functions runtime"). Putting it in the **Build command**
field would fail.

| Model | Deploy command | Who runs the build |
|---|---|---|
| **Pages + Git integration** ← what this document sets up | **none** — `git push` to `main` | Cloudflare, in its build container |
| Pages direct upload | `npx wrangler pages deploy dist --project-name=litex-website` | You, locally, before uploading |
| Workers + static assets | `npx wrangler deploy` | You, or Workers Builds |

**When direct upload would be the better choice:** if the build ever needs something Cloudflare's
build image lacks, or you want to keep the ~11 MB of `archive/` out of its container. The cost is
that a human (or a CI job) must run the command with an API token, and **per-PR preview deployments
are lost** — which matters here, because this project ships one PR per plan.

**On Workers vs Pages.** Cloudflare is visibly investing in Workers-with-static-assets and publishes
a migrate-from-Pages guide, but as of 2026-08-13 its docs carry **no deprecation notice for Pages**,
and Workers has no equivalent of Pages' native Git integration (it needs Workers Builds configured
separately). More decisively: `functions/api/submit.ts` is written to the **Pages Functions**
convention — file-based routing and `onRequestPost(context)`. Migrating would mean rewriting it as a
`fetch` handler with its own routing. There is no pull in that direction either; the one Workers-only
feature this project evaluated, the `send_email` binding, was assessed and rejected in Plan 7's
Decision 1. **If Cloudflare ever does force the move, the endpoint is the file that changes.**

> **Verify at first deploy:** `functions/api/submit.ts` imports `../../src/lib/enquiry`, i.e. it
> reaches *outside* `functions/` into `src/`. That is deliberate — one validation module shared by
> the pages and the endpoint is the whole architecture — and Pages bundles functions with esbuild,
> which resolves relative imports normally. It has never been run through a real Pages build.
> If the deploy fails to resolve it, that is the first thing to look at; do **not** fix it by
> copying the module, which is precisely the drift the shared module exists to prevent.

## 2. Bindings, secrets and variables

The function reads exactly five things from `env`, typed in `functions/api/submit.ts:25-31`. All are
configured **in the Pages project dashboard** — Pages bindings do not come from a `wrangler.toml`,
and this repo deliberately has no `wrangler` dependency.

| Name | Kind | Value | Read at |
|---|---|---|---|
| `SUBMISSIONS` | **KV namespace binding** | A KV namespace created for this project. The binding *name* must be exactly `SUBMISSIONS`. | `submit.ts:177` |
| `TURNSTILE_SECRET` | **Secret** | The secret key of the Turnstile widget from §3. | `submit.ts:158` |
| `RESEND_API_KEY` | **Secret** | A Resend API key with send permission. | `submit.ts:69` |
| `ENQUIRY_TO` | Plaintext variable | `sales@litex.com.tw` | `submit.ts:74`, and echoed to the visitor as `contactEmail` on every failure path |
| `ENQUIRY_FROM` | Plaintext variable | **`LiTex Website <website@send.litex.com.tw>`** — must be on a domain verified in Resend (§4) | `submit.ts:73` |

Set all five for **both** the Production and Preview environments. A preview deployment with no
`SUBMISSIONS` binding throws on the KV write and returns the honest `failed` outcome — correct
behaviour, confusing to debug if you have forgotten why.

**Retention.** Records are written with `expirationTtl` = `RETENTION_SECONDS` =
`180 * 24 * 60 * 60` (**180 days**), after which Cloudflare deletes them automatically.
`/legal/privacy/` states 180 days in prose and `tests/legal.test.ts` asserts that string is on the
page. **If this number changes, change the constant, the privacy page and that test together** —
the site would otherwise publish a retention promise the infrastructure does not keep.

## 3. Turnstile

1. ✅ **Done 2026-08-13.** Widget created. Its **hostname list must contain both**
   `litex.com.tw` *and* `litex-website.pages.dev`, plus `localhost` if anyone runs `npm run dev`.
2. Put its **secret key** in the `TURNSTILE_SECRET` secret. *(Outstanding.)*
3. ✅ **Done 2026-08-13.** The production **sitekey** `0x4AAAAAAEOqzFlvFS397MkG` is the default in
   `src/components/EnquiryForm.astro` — a sitekey is public by design and ships in the HTML, so it
   belongs in the repo. The always-passes test sitekey is gone.

The test keys, for local work (verified against Cloudflare's docs 2026-08-12):

| Key | Behaviour |
|---|---|
| Sitekey `1x00000000000000000000AA` | Always passes, visible widget |
| Secret `1x0000000000000000000000000000000AA` | Always passes |
| Secret `2x0000000000000000000000000000000AA` | Always fails |
| Secret `3x0000000000000000000000000000000AA` | Returns "token already spent" |

**Shipping the test sitekey to production is a soft failure, not a loud one.** The widget still
renders and the form still works — it just stops filtering bots, because the server-side
`siteverify` call accepts the dummy token. Every other test in the suite passes either way.

**This is now guarded.** `tests/contact.test.ts` fails the build if `1x00000000000000000000AA`
appears on **any** built page, and separately asserts the production sitekey is present on both
form pages. The guard was proved by reverting the default to the test key and watching both tests
fail. Until 2026-08-13 the repo genuinely could not tell the two keys apart, because the real one
did not exist yet — that was the reason for the gap, not an oversight.

**Consequence for local development:** Turnstile validates the hostname, so `npm run dev` shows an
error widget unless `localhost` is on the widget's hostname list in the dashboard. Add it there.
**Do not reintroduce the test key for convenience** — that is exactly the regression the guard now
catches.

The widget script is loaded from `challenges.cloudflare.com` **with no Subresource Integrity hash,
deliberately** — the endpoint is unversioned and Cloudflare rolls it in place, so a hash would
guarantee a silent breakage of both forms rather than prevent one. The full reasoning is in
`docs/superpowers/plans/2026-08-12-litex-contact-and-sample-flow.md`. Do not "fix" this.

## 4. Resend

1. Create a Resend account and **verify the sending subdomain `send.litex.com.tw`** by adding the
   SPF (TXT), DKIM (TXT) and return-path (MX) records it specifies.
   **Decided 2026-08-13: sending is on a subdomain, not the root domain.** Resend's own guidance is
   that a deliverability problem on the sending domain must not be able to damage the reputation of
   the address humans actually write to — and `sales@litex.com.tw` is that address. Buyers still
   reply to `sales@`, because the function sets `Reply-To` to the submitter and delivers *to*
   `ENQUIRY_TO`.
2. Create an API key with sending permission; put it in the `RESEND_API_KEY` secret. It is shown once.
3. Make sure the address in `ENQUIRY_FROM` is on that verified subdomain.
4. After verification succeeds, add a **DMARC** record.

> ⚠ **These three DNS records are added at LiTex's *current* DNS provider**, because the nameserver
> move to Cloudflare is deliberately being done last (see §6). **When that move happens, these
> records must come across with everything else** — Resend does not re-verify on its own, and mail
> delivery stops silently if they are dropped. They belong on the pre-move export checklist.

**Until domain verification completes, every submission takes the stored-but-undelivered path.**
That is the designed behaviour, not a bug: the enquiry is written to KV first, the visitor is told
honestly that the message is queued and given the direct address, and nothing is lost. But it means
**somebody must watch the KV namespace between first deploy and DNS propagation**, or a real RFQ
will sit there unread. Do the DNS records before announcing the site.

## 5. Post-deploy smoke test

Do all five. Items 3 and 4 are the ones worth the effort — the happy path is the easy half, and the
failure paths are the reason this design exists.

1. **Submit `/contact/`** with JavaScript on. Expect a redirect to `/enquiry-sent/` with no queued-delivery note.
2. **Submit `/request-a-sample/`.** Confirm a second KV record appears and a second email arrives at `sales@litex.com.tw`, with the submitter's address as `Reply-To`.
3. **Submit with JavaScript disabled.** Expect a native POST and a `303` to `/enquiry-sent/`. This path is the baseline; if it is broken, it is broken silently for everyone who blocks scripts.
4. **Force a delivery failure** — revoke or corrupt `RESEND_API_KEY`, then submit. Expect: a KV record still written, `/enquiry-sent/?delivery=pending`, and the visitor shown the queued-delivery note naming `sales@litex.com.tw`. **It must not read as a success.** Restore the key afterwards.
5. **Fill the honeypot** (`name="website"`, the off-screen input) via devtools and submit. Expect a normal-looking success, no KV record, and no Turnstile or Resend call.

Then confirm the two records from steps 1 and 2 carry **no IP address** — Decision 5, enforced in
`tests/submit.test.ts` against the code and worth confirming once against reality.

## 6. The custom domain — deliberately last

**Decided 2026-08-13: the nameserver move happens after everything else is proven on `*.pages.dev`.**

`litex.com.tw` is an **apex** domain, so Cloudflare requires the whole domain to become a Cloudflare
zone — you change nameservers at the registrar and Cloudflare takes over **all** of its DNS. That
includes the MX records delivering `sales@litex.com.tw`, which is both LiTex's real inbox and the
destination of every enquiry this site generates.

Consequences of doing it last, all of which are the *reason* to do it last:

- Everything in §1–§5 is tested on the `*.pages.dev` URL first, so a failure there is a build
  problem, never a DNS problem.
- The Turnstile widget must list **both** hostnames — the `pages.dev` one and `litex.com.tw`.
- Cloudflare Web Analytics' automatic injection only applies to proxied sites, so until the move
  the manual snippet is the only option. That is the option this repo wants anyway (§ below).

**Before changing nameservers:** export every existing DNS record — MX, SPF/TXT, DKIM, any CNAME or
A record, any mail-provider verification record, **and the three Resend records from §4**.
Cloudflare's scan imports most of them automatically; verify each one by eye afterwards rather than
trusting the scan. Then send a test mail to `sales@litex.com.tw` and confirm it arrives **before**
attaching the custom domain to the Pages project.

Full click-by-click steps are in `docs/cloudflare-setup.md` Part F.

## 6a. First deploy — verified 2026-08-13 against `litex-website.pages.dev`

Part A of `docs/cloudflare-setup.md` is **done**. Parts B–E (KV, Turnstile, Resend, secrets) are not.

**Confirmed working**, each of which Plan 7 could only assert:

- **All six catalog PDFs download byte-exact** against `src/data/catalog-files.json`. The build
  command took and `sync-catalogs.mjs` ran in Cloudflare's container. **Plan 5's parked residual is
  closed in production.**
- **`functions/api/submit.ts` deployed and runs**, and its import of `../../src/lib/enquiry` —
  reaching outside `functions/` into `src/` — **resolved in a real Pages build.** The §1 "verify at
  first deploy" risk is closed. Proof: a probe POST reached the *Turnstile* check, which sits
  downstream of the `FORM_TYPES` test, so the shared module loaded in the Workers runtime.
- **The endpoint fails closed.** With no `TURNSTILE_SECRET` set, a probe returned
  `400 {"outcome":"rejected","errors":{"turnstile":…}}` and stored nothing — rejection precedes the
  KV write, so probing leaves no junk records.
- **Turnstile loads on exactly `/contact/` and `/request-a-sample/`**, and on none of `/`,
  `/products/`, `/downloads/`, `/news/`, `/legal/privacy/`.

### ⚠ Defect found — ✅ FIXED in Plan 8 Task 1, re-verified in production 2026-08-13 (§6b)

**Kept on the record because it explains the shape of Plan 8**, not because it is still true.

At first deploy, **every** path that did not match a file — `/robots.txt`, `/favicon.ico`,
`/any-typo/` — returned **HTTP 200** serving the homepage HTML.

**Cause** (confirmed against Cloudflare's serving-pages documentation): when a Pages build output
has **no root `404.html`**, Cloudflare assumes a single-page application and matches all incoming
paths to `/`. The project had no `src/pages/404.astro`, so Astro emitted no `404.html`.

**Fix, now shipped:** `src/pages/404.astro`. Astro emits `dist/404.html` and Cloudflare serves it
with a genuine 404 status — confirmed live in §6b. This was **Plan 8 Task 1**, deliberately ahead of
`_redirects` and of any broken-link checking, because:

1. A broken-link check would otherwise be **vacuous** — nothing on the site can 404, so a "no dead
   links" assertion passes without looking. (Compare HANDOFF gotcha 12.)
2. Spec §3 sentences `/2016/09/22/test-post-blah/` to **410 Gone**; today it answers 200 with the
   homepage.
3. Missing assets masquerade as present — `favicon.ico` reads as 200 while no favicon exists.

A test asserts `dist/404.html` exists, so the SPA fallback cannot silently return.

## 6b. Launch verification — Plan 8 Task 9, run 2026-08-13

### Local

| Check | Result |
|---|---|
| `npm run build` | **36 pages**, exit 0 |
| `npm test` | **373 passing across 23 files** |
| `npm run test:a11y` | **11 passing** — zero axe WCAG 2 A/AA violations *and* zero unexplained incompletes |
| Design detector over `src/components src/pages src/styles` | clean, exit 0 |
| `compressHTML` spacing sweep over `dist/404.html dist/contact dist/request-a-sample` | no matches |

⚠ `npm test` needs a browser binary. On a fresh checkout run **`npx playwright install chromium`**
once, or the suite fails with a missing-executable error rather than a test failure.

### Against the deployed site

Run with `curl` against `https://litex-website.pages.dev`. **Every result matched the expectation.**

| Check | Expected | Actual |
|---|---|---|
| `/no-such-page-xyz/` | 404 | **404** |
| `/about-2/` | 301 → `/company/about/` | **301 → `https://litex-website.pages.dev/company/about/`** |
| `/2016/09/22/test-post-blah/` | 410 | **410** |
| `/2016/09/22/test-post-blah` (bare) | 410 | **410** |
| `/robots.txt` | 200 | **200** |
| `/sitemap-index.xml` | 200 | **200** |
| `/favicon.svg` | 200 | **200** |
| `/contact/` | 200, **not** a redirect | **200** |

Also confirmed live:

- **`robots.txt` names `https://litex.com.tw/sitemap-index.xml`** — the custom domain, not the
  `pages.dev` host, so it needs no edit at the Part F cutover.
- **`sitemap-0.xml` carries 34 URLs** = 36 built pages − `/404` − `/enquiry-sent/`. Neither excluded
  page appears; both carry `noindex` per-page instead.
- **The analytics beacon serves on the homepage** (`static.cloudflareinsights.com/beacon.min.js`).

### What is in place, and where it lives

| Thing | Where | Note |
|---|---|---|
| Legacy URL map | `public/_redirects` | **Exactly 15 rules**, all 301. Not 22 — seven of spec §3's rows are identity mappings, and writing those creates redirect loops. `/contact/` returning 200 above is that trap staying shut. |
| The one **410 Gone** | `functions/2016/09/22/test-post-blah.ts` | A Pages **Function**, because `_redirects` cannot express 410. Do not "simplify" it into the redirects file. Cloudflare matches both the trailing-slash and bare forms. |
| Web Analytics token | `src/layouts/BaseLayout.astro:18` — `73942cd6e84c4e33a475ee5ea0527c13` | Injected **manually**, not via Cloudflare's automatic injection. An auto-injected beacon never appears in the build, so it would be invisible to the `DISCLOSED` guard in `tests/legal.test.ts` and the privacy notice could silently become untrue. |

Both the beacon and the Turnstile tag are marked **`is:inline`** so the third-party guard can see
them. Astro otherwise rewrites an external `<script src>` into a local module whose body is
`import "https://…"` — the request still happens, but no HTML attribute names it. Removing
`is:inline` makes them invisible to the guard.

### Lighthouse — run by hand 2026-08-13, mobile preset

<!-- Plan 8 Task 9 Step 3. The numbers are evidence, not a target: a sub-95 score belongs here with
     its reason rather than re-run until it passes. These happened to come back clean. -->

Chrome DevTools, **Navigation** mode, **Mobile** device, against the deployed site.

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| `/` | **100** | **100** | **100** | **100** |
| `/products/conductive-metal-yarn/` | **100** | **100** | **100** | **100** |

Spec §4's budget is **≥95** for performance, accessibility and SEO. **All three clear it on both
pages, with Best Practices at 100 as well.**

**Why this is plausible rather than suspicious.** The site ships no framework JavaScript, no
web fonts from a third party, and exactly one deferred `type="module"` beacon; images are built by
Astro's pipeline at pinned widths so nothing is resized in the browser; and there is no client-side
routing or hydration anywhere. A static site with almost no script is the case Lighthouse scores
best, so 100 is the expected result here — not a surprise to be double-checked.

**What these numbers do not say.** Lighthouse mobile is a **lab** measurement with a simulated
network and CPU throttle, run from one machine at one moment. It is not field data and it is not a
promise about real visitors on real devices in the EU or Japan. It is evidence that nothing in the
build is structurally slow, which is what the budget was for.

⚠ **Re-run both pages after the Part F custom-domain cutover.** These were measured on
`litex-website.pages.dev`; the custom domain adds a Cloudflare zone in front, and the numbers should
be confirmed rather than assumed to carry over.

## 6c. Enquiry pipeline — proven end-to-end 2026-08-14

Parts B, C-secret and E were completed in the dashboard and the latest deployment retried. **A real
enquiry was then submitted through `https://litex-website.pages.dev/contact/` in an ordinary
browser, and landed on `/enquiry-sent/?delivery=pending`.**

That single observation is decisive, because `functions/api/submit.ts` can only reach the `stored`
outcome by passing through every earlier gate:

| Reaching `?delivery=pending` proves | Because |
|---|---|
| `TURNSTILE_SECRET` is set and correct | `verifyTurnstile` returned true; a wrong or missing secret gets `success: false` from siteverify and returns the 400 rejection instead |
| The KV binding resolves and the write succeeded | `env.SUBMISSIONS.put()` did not throw; if it had, the function returns 503 "We could not record your enquiry" |
| `ENQUIRY_TO` is set | Independently confirmed — a probe POST echoed `sales@litex.com.tw` in `contactEmail` |
| Delivery honestly reported failure | `deliver()` returned false because `RESEND_API_KEY` is absent, and the endpoint said so rather than showing a false success |

The record is in KV namespace `litex-enquiries`, keyed `enquiry:<iso>:<uuid>`, with a 180-day TTL.

**Why this could not be automated.** Turnstile in Managed mode serves an interactive challenge to a
headless browser — that is the control working as designed, not a defect, and it must not be worked
around. Probing from outside cannot substitute: a wrong secret and an invalid token produce
byte-identical 400s, so **only a human submitting the real form settles it**. Two things *were*
verified without a token, and are worth keeping: the served sitekey is the production
`0x4AAAAAAEOqzFlvFS397MkG` rather than the always-passes test key, and `litex-website.pages.dev` is
on the widget's hostname allowlist — the widget renders a genuine challenge rather than an error box.

⚠ **Retrying a deployment rebuilds the same commit.** It is the correct way to pick up new bindings
and variables (setup part E4) but it ships no new code. Confirmed the same day: after the retry, the
live HTML still lacked markers from the unmerged `homepage-redesign` branch.

---

## 6d. Homepage + shared chrome — verified in production 2026-08-14

PR #17 (`abec8f5`) merged and auto-deployed. Measured against the live
`litex-website.pages.dev` in a real browser, not against a local build:

| Check | Result |
|---|---|
| Print media on `/products/conductive-metal-yarn/` — wordmark, canonical URL, email, phone | all four present |
| Print colophon leaking onto the screen | no |
| Masthead height at 390px | **77.00px** (was 153.59px; the guard is ≤96px) |
| Primary nav links visible at 390px, menu closed → opened | **0 → 7** |
| Primary nav links visible at 1280px | 7 |
| Footer credibility strip at 390px | 3 rendered lines, **0** starting with a separator |

⚠ **The printed canonical URL is `https://litex.com.tw/...`, which does not point here yet.** That
is `SITE_URL` from `astro.config.mjs` and it is deliberate — it matches the `<link rel="canonical">`
already shipping since Plan 8, and a printed sheet citing a `pages.dev` address would be worse and
would need reprinting after Part F. **It becomes correct at the domain cutover.** Until then a
printed sheet cites the domain LiTex already owns, which currently serves the old WordPress site.

---

## 7. Still open after this list

**Infrastructure not yet done** — Plan 8 finishing means the *repo* is ready, not that the site is
launched. `docs/cloudflare-setup.md` is the click-by-click walkthrough and tracks each part.

| Part | What | State |
|---|---|---|
| B | KV namespace bound as `SUBMISSIONS` | ✅ **done and proven 2026-08-14** — see §6c |
| C | `TURNSTILE_SECRET` (widget and sitekey are done) | ✅ **done and proven 2026-08-14** — see §6c |
| E | The Pages variables/secrets | ✅ **done** for the three that do not need Resend; `RESEND_API_KEY` is absent by design until D |
| D | **Resend domain verification** for `send.litex.com.tw` (§4) | ❌ **blocked** — no registrar access to `litex.com.tw` yet |
| F | Custom domain / nameserver move (§6) | ❌ deliberately last |

**The enquiry pipeline is no longer the most valuable unproven thing — it is proven.** See §6c. What
remains is delivery, which is Resend, which is blocked on registrar access.

**Also unresolved:**

- ~~**Nobody has confirmed `sales@litex.com.tw` is monitored, or by whom.**~~ ✅ **Closed 2026-08-14: it is a Google Group with the site owner as a member**, and live DNS confirms Google Workspace MX. The residual risk moved rather than vanished — a Group can reject an external sender, hold mail for moderation, or spam-file it, and **`outcome: 'delivered'` cannot see any of that**, because it reports only that the Resend API accepted the message. See `docs/cloudflare-setup.md` Part D, step **D9**: Part D is not finished until a real enquiry is confirmed to *arrive in the Group*.
- **No admin UI.** Submissions are read from the Cloudflare dashboard. A KV-reading page needs auth, which needs sessions.
- **No attachments.** A drawing or spec sheet on a sample request would be genuinely useful; it needs R2 and its own abuse surface.
- **No alerting.** Nothing notices a run of `stored` outcomes, which is exactly the signal that Resend has stopped working.

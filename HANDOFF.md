# Session handoff — LiTex website redesign

**Written:** 2026-08-11, last updated 2026-08-13 (end of session 8, Plan 7 complete)
**Reason:** This file is the resume point between sessions.

---

## ▶ Do this first

**Plans 1–7 are built and verified. Plan 8 is NOT written.** Do not re-run brainstorming, the spec
self-review, or `/impeccable init`.

### → Start here: write Plan 8, then execute it

Plan 8 is the launch plan and it is the **last** one. Its scope, from spec §3 and the roadmap:
`_redirects` for all 23 legacy URLs, sitemap, Cloudflare Web Analytics, Sveltia CMS, a print
stylesheet, Lighthouse/axe budgets, a broken-link check — **and the deployment itself**, which is
now written out step by step in **`docs/deployment.md`**. Read that file before planning; it is the
executable half of Plan 8 and it already resolves the decisions.

Use `superpowers:writing-plans` to write it, then run it **subagent-driven**
(`superpowers:subagent-driven-development`) from a new branch off `main`.

**Before planning, confirm where `main` actually is.** At the time of writing, Plan 7 is complete
on `plan-7-contact-and-sample` (9 commits, tip `830cdd1`) and **PR #7 had not yet been merged**, so
this file cannot record its squash SHA the way earlier sessions recorded theirs. Run
`git log --oneline -5 main` and `gh pr list --state all` and trust that over this paragraph.

**Plan 8 carries three things that will bite if forgotten**, all detailed below and in
`docs/deployment.md`:

- The Pages build command **must be `npm run build`**, not `npx astro build` or the Cloudflare
  default. `npx` skips `package.json` scripts, so the catalog sync never runs and eleven links 404
  in production **with no test catching it**.
- The **Turnstile sitekey in `src/components/EnquiryForm.astro` is Cloudflare's always-passes test
  key.** Shipping it is a soft failure — the widget renders, the form works, spam filtering is
  simply off. No test can catch it, because the real key does not exist in this repo.
- Cloudflare Web Analytics is an external script, so it must be **added to the `DISCLOSED`
  allowlist in `tests/legal.test.ts` and disclosed on `/legal/privacy/` in the same commit.** The
  allowlist is deliberate. Do not remove it to make a test pass.

---

## State as of 2026-08-13 (end of session 8)

- **Plan 7 is complete on its branch**, seven tasks, all committed. It added the site's first
  server-side runtime, the first `functions/` directory and **the first JavaScript this site has
  ever shipped**.
- `npm run build` exits 0 emitting **35 pages**. `npm test` = **330 tests across 21 files**, all
  passing. Design detector over `src/components src/pages src/styles` reports **no findings**.
- `dist` totals about **16 MB**, of which `dist/catalogs` is about 11 MB — the six catalog PDFs.
- Routes added this plan: **`/contact/`**, **`/request-a-sample/`**, **`/enquiry-sent/`**. The
  primary nav now has **seven** items; `/contact/` is last.
- **Nothing in Plan 7 has run against real Cloudflare infrastructure.** There is no Pages project,
  no KV namespace, no Resend account and no Turnstile widget. The function is covered by unit tests
  against a mocked environment. `docs/deployment.md` is the checklist Plan 8 executes. **This is a
  stated limitation of the plan, not an oversight — do not let a reviewer treat it as one.**
- Repo public at **https://github.com/darsonl/litex-website**. Plans 1–6 merged via PR #1–#6
  (Plan 6 squashed as `bafff91`).

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
| 7 | Contact + sample-request flow (Pages Function, Turnstile, KV, Resend) | ✅ **built** — `plan-7-contact-and-sample`, PR #7 |
| 8 | Launch: deploy, `_redirects`, sitemap, analytics, Sveltia CMS, print stylesheet, Lighthouse/axe, broken-link check | 📝 **not written** |

---

## What Plan 8 inherits — use these, don't reinvent

| Thing | Where | Note |
|---|---|---|
| Deployment checklist | `docs/deployment.md` | Every binding, secret and variable the function reads, the build-command trap, the Turnstile test keys, the Resend DNS dependency and a five-step smoke test. **Written to be executed, not re-derived.** |
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
| The third-party allowlist | `tests/legal.test.ts` | `DISCLOSED` contains exactly the Turnstile widget URL. The guard sweeps **built HTML *and* emitted JS** and fails on anything undisclosed. **Plan 8 extends the list and updates `/legal/privacy/` in the same commit.** |

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

## Parked residual — Plan 8 must handle this

`npx astro build` on a cold checkout ships a build with an unpopulated `public/catalogs/`, because
`npx` bypasses `package.json` scripts entirely and the inlined `node scripts/sync-catalogs.mjs`
never runs. No CI config exists yet, so nothing currently triggers this path. **Plan 8 must set the
Cloudflare Pages build command to `npm run build`**, or the six downloads and five product catalog
links 404 in production with no test catching it. This is now the first row of
`docs/deployment.md`'s settings table.

---

## Carried-forward minors from the Plan 5–7 review ledgers

The SDD ledgers are gitignored and deleted once their plan merges, so findings with a live trigger
condition are preserved here. None is a bug; each is a decision that becomes wrong later.

**Plan 8 should act on these:**

1. **The function assumes all five `env` values exist.** `const contactEmail = env.ENQUIRY_TO` has
   no fallback, so on a deployment where the variable is missing, every honest failure message
   degrades to "please email " with nothing after it — on exactly the paths that exist to give the
   visitor a way through. Cheapest fix is a hardcoded default equal to `COMPANY.email`.
2. **The Turnstile test sitekey ships by default** and no test can detect the real one is missing,
   because the real key does not exist in this repo. Soft failure: the widget renders and the form
   works, spam filtering is simply off. Check by eye after deploy.
3. **Nothing notices a run of `stored` outcomes**, which is precisely the signal that Resend has
   stopped accepting mail. There is no alerting and no admin UI; submissions are read from the
   Cloudflare dashboard.
4. The **dist-reading test strategy assumes `npm run build` ran immediately before `npm test`.** A
   stale `dist/` can pass some assertions vacuously. A CI-ordering constraint the moment CI exists.
5. **Every `npm run build` rewrites `src/data/catalog-files.json` with a CRLF-only diff** and no
   content change, dirtying the working tree on every build. It has now cost four separate agents a
   detour into "what did I change?". Fix the line-ending handling in `scripts/sync-catalogs.mjs` or
   `.gitattributes`. **Until then: if it shows modified with an empty `git diff`, `git checkout --` it.**
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

Plans 1–6 are merged. **Plan 7 is complete on `plan-7-contact-and-sample`** (tip `830cdd1`), with
PR #7 open at the time of writing — **verify its state with git before assuming anything.** On the
branch: `npm run build` → **35 pages**, `npm test` → **330 passing across 21 files**, detector →
no findings.

### Do this first

**Write Plan 8** with `superpowers:writing-plans`, reading `docs/deployment.md` first — it is
already the executable half. Then run it subagent-driven from a branch off `main`. Plan 8 is the
last plan.

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
- **Do not remove or loosen the `DISCLOSED` allowlist in `tests/legal.test.ts`.** It is deliberate.
  Plan 8 **extends** it with the Cloudflare Web Analytics URL and updates `/legal/privacy/` in the
  same commit. Loosening the guard to make a test pass silently un-does the only mechanism that
  keeps the privacy notice true.
- **Do not add a Subresource Integrity hash to the Turnstile script.** The endpoint is unversioned
  and Cloudflare rolls it in place, so a hash would guarantee a silent breakage of both forms. The
  full reasoning is in Plan 7's front matter.
- **Do not add client-side validation to `EnquiryForm.astro` to make errors appear without a
  server.** Validation lives once, in `src/lib/enquiry.ts`, and the server is authoritative. In
  `astro dev` there is no Functions runtime, so a submission 404s and the script correctly reports
  that it could not reach the server. That is the design working, not a gap to fill.

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

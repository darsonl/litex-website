# Session handoff — LiTex website redesign

**Written:** 2026-08-11, last updated 2026-08-12 (end of session 7, after PR #6 merged)
**Reason:** Session running out of context. This file is the resume point.

---

## ▶ Do this first

**Plans 1–6 are built, verified and merged.** Do not re-run brainstorming, the spec self-review,
`/impeccable init`, or `writing-plans` for Plans 1–6 — all complete.

### → Start here: write Plan 7 with `superpowers:writing-plans`

Plan 7 is **the contact page + sample-request flow** (Cloudflare Pages Function, Turnstile, KV).

Read before writing it: this file, `PRODUCT.md`, and
`docs/superpowers/specs/2026-08-10-litex-website-redesign-design.md` (§3 IA, §4 "Contact form —
failure modes", §7 gaps). The six completed plans in `docs/superpowers/plans/` are worth skimming
for house style — they are long, fully-specified, and every code block is real.

**Execution mode:** Plans 1–4 ran **inline** via `superpowers:executing-plans`. **Plans 5 and 6 ran
subagent-driven** via `superpowers:subagent-driven-development` — a fresh implementer per task, a
spec-plus-quality review after each, and one whole-branch review at the end. Both modes work; the
branch → task → test → commit per task → PR → merge → delete branch pattern is unchanged and has
now held for 41 tasks across six plans.

Subagent-driven is worth repeating, and Plan 6 strengthened the evidence rather than merely
repeating it: **five of Plan 6's seven implementation tasks needed a fix round, and every single
finding traced to the plan's own text rather than to implementer error.** A pre-flight scan caught
a sixth before Task 1 started. The four that cost the most were all authoring defects a fresh
reader found and the author could not:

- a brief whose stated **premise was false** (it claimed two files duplicated the dist helpers; six
  more did);
- plan-supplied code that validated a date's **format but not its calendar validity**;
- plan-supplied code that used `Date.parse` as a validity check, so **the plan's own required test
  failed against the plan's own code**;
- a **plan self-contradiction** — one task mandated recording a dead URL as prose provenance, a
  later task's test banned that string from the whole build. Both were mandated; they cannot both
  hold.

Budget for the review loop. It is where the quality came from, in both plans now.

---

## State as of 2026-08-12 (end of session 7)

- **Plan 6 is MERGED.** Squash-merged 2026-08-12 as **PR #6 → `bafff91`**; both the remote and
  local branches are deleted. All 8 tasks were done and reviewed, five with a fix round, then a
  **whole-branch review on the most capable model returned "ready with fixes"** — 2 Important,
  5 Minor, all seven fixed in one wave and confirmed by a scoped re-review, which returned
  **ready**. Re-verified on merged `main`: 32 pages, 284 tests, and the squashed branch diffed
  **identical** to `main` before its local branch was force-deleted.
  - Note for next time: `git branch -d` **refuses** after a squash merge, because the branch's
    commits are not ancestors of `main`. Diff the branch against `main` to prove the content
    landed, then `-D`. The refusal is not evidence of unmerged work.
- **The Plan 6 SDD ledger has been deleted** — it was gitignored and existed only on one
  machine. Everything durable from it was lifted into this file first: the carried-forward
  minors, the toolchain gotchas, and the review lessons below. Do not go looking for
  `.superpowers/sdd/2026-08-12-*`; it is gone. The committed plan and the PR #6 diff are the
  remaining record.
- **The whole-branch review earned its place**, and its best catch is a warning for future
  plans: Task 6's fix round removed an unverifiable claim from the braid photograph's alt
  text and *introduced a different one in the same sentence* — it said the tube crossed the
  frame "diagonally" when it runs horizontally; the braid **pattern** is what is diagonal.
  Every per-task re-review checked that the retracted claim was gone. None re-read the rest
  of the sentence. **When a fix rewrites a factual sentence, re-verify the whole sentence.**
  The same review also found the retracted claim still alive in `scripts/extract-images.mjs`'s
  provenance note, where it would have walked back onto the page the next time anyone drafted
  alt text from the manifest — a per-task review could not have seen that, because the note
  and the alt were written in different tasks.
- `main` is at **`9d0e164`** ("docs: write Plan 6"), which sits on top of **`ee93b71`** and Plan 5's
  squash merge **`28fc138`** (PR #5).
- `npm run build` exits 0, emitting **32 pages**. `npm test` = **284 tests across 18 files**, all
  passing. Design detector over `src/components src/pages src/styles` reports **no findings**.
- `dist` totals about **17 MB**, of which `dist/catalogs` is about **11 MB** — the six catalog PDFs.
- Routes added this plan: `/news/` plus `/news/<slug>/` ×7 — `techtextil-frankfurt`,
  `wearable-expo`, `copper-nickel-1s1z`, `featured-on-techtextil-blog`, `dusseldorf-wire-show`,
  `new-braided-self-curling-tube`, `tokyo-wearable-expo-2022`. These are exactly the seven slugs
  spec §3's redirect map promises, at exactly those paths.
- Repo public at **https://github.com/darsonl/litex-website**. Plans 1–5 merged via PR #1–#5.

### ⚠ The nav has six items and the newest news post is January 2022. That is deliberate.

`/news/` is framed as an **archive**, not a live feed, and the framing is what makes the four-year
gap honest rather than embarrassing. The index says out loud that these are announcements published
between 2017 and 2022, reproduced with their original dates, nothing rewritten or brought up to
date — so a 2017 post reading *"we will soon roll out (around April)"* cannot be read as a current
claim. The date range is **computed from the entries** (`Math.min`/`Math.max` over
`publishedYear`), so it cannot drift, and an eighth post in any year slots in with no code change.

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
| 7 | Contact + sample-request flow (Pages Function, Turnstile, KV) | ← **next, not written** |
| 8 | Launch: `_redirects`, sitemap, analytics, Sveltia CMS, print stylesheet, Lighthouse/axe, broken-link check | not written |

---

## What Plan 7 inherits — use these, don't reinvent

| Thing | Where | Note |
|---|---|---|
| Primary nav | `src/lib/nav.ts` | Six items; `/news/` is last. `tests/chrome.test.ts` **fails if a chrome link has no built page behind it** — add the route first, then the nav entry. Verified this plan by pointing it at a route that does not exist and watching it fail. |
| Shared dist test helpers | `tests/helpers/dist.ts` | `DIST`, `walk`, `allHtmlFiles`, `docFor`, `routeFile` — **one copy each, consolidated across eight test files in Plan 6 Task 1.** A new `tests/contact.test.ts` imports them; it does not paste them. See the caveat about `tests/fonts.test.ts` below — its `walk` is a different function, not a stray duplicate. |
| Stored-timestamp handling | `src/lib/dates.ts` | **The single owner of the format** `2017-02-23T14:47:55+08:00`: parsing, formatting, ordering *and* validity. Exports `STORED`, `isStoredTimestamp`, `displayDate`, `isoDate`, `publishedYear`, `byPublishedDesc`. It has **zero imports**, which is exactly what keeps it loadable by both Vitest and the Astro build — **do not add an Astro import to it**, and do not re-derive its calendar check anywhere else (`src/schemas/news.ts` imports it rather than keeping a second copy). Display never constructs a `Date`; ordering does, because comparing instants across offsets is the one place a `Date` is correct. |
| `byPublishedDesc` is load-bearing | `src/lib/dates.ts` | Three posts share **2017-02-23** and differ only by time (14:38 / 14:47 / 14:54). Glob order differs from published order. **If anyone "simplifies" this to compare dates only, those three silently reorder** — verified in the built HTML, not the source. |
| Captioned archive photography | `src/components/ArchiveFigure.astro` | Props `{ image: ImageMetadata; alt: string; caption: string (required); size?: 'full'\|'half'\|'document'; loading?: 'eager'\|'lazy' }`. Never upscales a source. Plan 6 reused it for the one news photograph rather than adding a third figure component — see carried-forward minor 2. |
| Contact block | `src/components/ContactBlock.astro` | Props `{ showLegalNameZh?: boolean }`, default `false`. Renders legal name, optional Chinese legal name, address lines, Tel, Fax, email, hours as `<p>` children inside one `<address data-contact-block>`. Used on `/company/about/`, `/company/` (with `showLegalNameZh`), and `/legal/privacy/`. It carries its own `.contact p { margin: 0; }` — that rule has to live inside the component. **Plan 7's `/contact/` must use it; do not add a fourth inline `<address>`.** |
| Three-group image extraction | `scripts/extract-images.mjs` + `extract-image.py`; `src/assets/{products,company,news}/provenance.json` | `SOURCES` entries carry `group: 'products' \| 'company' \| 'news'`, default `'products'`. `tests/provenance.test.ts` walks all three manifests and asserts no filename appears in two groups. Re-running is **deterministic** — Plan 6 re-ran it and reproduced the other thirteen images byte-for-byte. Be aware the script **clears every group directory before regenerating**, which is what makes that check worth doing. |
| Catalog delivery | `public/catalogs/` (gitignored), `scripts/sync-catalogs.mjs`, `src/data/catalog-files.json` (generated, committed) | `npm run build` is `node scripts/sync-catalogs.mjs && astro build` — an **inlined step, not an npm `prebuild` lifecycle hook** — so it survives `pnpm` or any runner that skips lifecycle hooks. It does **not** survive `npx astro build`; see the parked residual. |
| `data-source-note` vs `data-page-note` | `company/patents-and-awards.astro`, `company/certifications.astro`, `news/[slug].astro` | `SpecTable` emits its own `[data-source-note]`. A page-level note sitting **beside a `SpecTable`** uses `[data-page-note]` instead. News posts do use `[data-source-note]`, and that is safe: every test queries it **per page via `docFor`**, never site-wide, so the singular-hook rule is about one page, not the whole build. |
| JSON-LD | `src/lib/jsonld.ts` | `productJsonLd()` and `newsJsonLd()` (`BlogPosting`). Emitted `url` must match the page's own canonical element. The news `datePublished` keeps its `+08:00` offset and `tests/news.test.ts` **hardcodes `+08:00`** in its dist regex — deliberate and sound for this dataset, but a normalizing change would fail it. There is no `dateModified`. |
| Forward-guard tests | `tests/legal.test.ts` | Two tests on `/legal/privacy/` — *"claims no analytics only while the site really runs none"* and *"describes no form while no form exists"*. **The second one is Plan 7's problem: it is written to fail the moment a form ships.** Delete it deliberately, in the same commit that updates `/legal/privacy/` to describe the new reality. Do not silence or loosen it instead. |

---

## The news archive as built

Seven posts in `src/content/news/`, transcribed from `archive/pages/news-*.html` with linkedom and
**independently re-verified word-for-word by a second reader** against the archived originals.

- `publishedAt` is taken from the archive's `entry-date published` datetime — **not** the "updated"
  timestamp. The archived pages carry both; they are not the same value.
- Every archived title contained **U+00A0** (WordPress widow-prevention). All were normalized to a
  normal space; a test asserts none survives in `src/content/news/`. Curly apostrophes (U+2019) are
  correct typography and were preserved.
- **No page anywhere claims a quotation is verbatim.** Each post carries a `sourceNote` recording
  its permalink and what was changed or withheld.
- Exactly **one photograph** ships: `src/assets/news/new-braided-self-curling-tube.jpg`, LiTex's own
  macro of the braided sleeving. Largest emitted variant is 133 KB, well under the 300 KB cap. The
  Tier 3 guard covers `/news/` — proved by flipping `aiGenerated` to `true` and watching
  `tests/imagery.test.ts` name the exact page and asset.

---

## Company photography extracted in Plan 5

All six sourced from `archive/catalogs/2018-company-introduction.pdf` via the extraction
pipeline, verified 2026-08-11 by rendering and viewing each file.

| Slug | Shows | Used on |
|---|---|---|
| `premises` | The LiTex building photographed from street level, illuminated shopfront sign reading *LiTex* over *LED 紡織科技* | `/company/about/` |
| `heritage-nameplates` | Two brushed-steel company nameplates at the shared premises: 恆好貿易有限公司 / HEN HAO TRADING CO., LTD. and 台灣吉普織帶工業 / TAIWAN TULIP RIBBON & BRAIDS | `/company/about/` |
| `factory-floor` | Creel rack, narrow-fabric loom, a row of covering machines | `/company/about/` |
| `trade-show-stand` | Three staff under a sign reading LITEX TEXTILE & TECH. CO., LTD. | `/company/about/` |
| `taitronics-award` | 2014 TAITRONICS Technology Innovation Awards certificate | `/company/patents-and-awards/` |
| `sgs-test-report` | Cover of SGS Test Report `CE/2013/52203` | `/company/certifications/` |

**Correction to session 4's handoff, caught during Plan 5 planning:** the prior version of this file
described p.1 xref 52 as *"a loom with LiTex-branded tape, two framed certificates, a spool of woven
tape."* That is wrong on every count — there is no loom in it and there are no certificates in it.
It is three panels: the LiTex building from street level with an illuminated shopfront sign; **two
brushed-steel company nameplates** reading 恆好貿易有限公司 / HEN HAO TRADING CO., LTD.
and 台灣吉普織帶工業 / TAIWAN TULIP RIBBON & BRAIDS; and spools of metal filament beside woven tape.
Taiwan Tulip Ribbon & Braids appears in **no archived HTML** — only in this photograph. The old
wording is deleted from this file; do not reintroduce it.

**Correction to the TAITRONICS date:** an earlier session recorded the certificate as "fully read"
and dated `2014.9.29`. Re-examined at 14× lanczos, the day's final digit is roughly five pixels tall
and is either a 6 or a 9 — unresolvable. That earlier "fully read" claim was overconfident. The site
publishes **"September 2014"** (`AWARD.dated` in `src/data/patents.ts`) and nothing more precise. Do
not restore a specific day without a better source image.

---

## ⚠ Patent facts — resolved 2026-08-11, do not re-derive or revert

The archive's patent claims are **stale and partly false**. Transcribing
`archive/images/patents-and-awards.jpg` onto `/company/patents-and-awards/` would publish two
untrue statements.

| Record | Truth (Google Patents) |
|---|---|
| **TWM545145U** | *"Elastic ribbon having extensible electronic device"*, filed 2017-03-20 by **富鉅紡織科技股份有限公司** — exact match for `COMPANY.legalNameZh`, so certainly LiTex's. **Renewal status unconfirmed.** |
| **US 12/787,378** | **ABANDONED 2012-04-23** — "failure to respond to an office action". Published US2010/0300060A1. **Never granted.** |
| **TW M371733** | **LAPSED 2017-10-01**, non-payment. Archive lists it under "Issued patents" — true once, false now. |
| Applicant | Older filings are **Fu-Biau Hsu / 許富標 as an individual**, not the company. |

- The archive prints **"TW 1M545145" — malformed**; the leading `1` is a transcription artifact.
  Correct form is **TWM545145** / `M545145`.
- Because the US application was abandoned, **the USPTO ribbon certificate in the catalog is not
  for it.** What it depicts is unknown. Do not attribute it. It carries **no number** — it is the
  generic cover page; the number lives on the facing page, never photographed. Don't try to read
  it off the image; that was checked at 4× upscale.
- The credibility bar now reads **`TW UTILITY MODEL M545145`**, deliberately *not* asserting a
  right in force. `tests/chrome.test.ts` fails if `1M545145` or `PATENTED` reaches any built page.
  **Do not restore "PATENTED" without LiTex confirming renewal.**

---

## Settled — do not re-raise

- **Image usage rights granted** (2026-08-11) for all catalog photography, including the
  certificates and personnel shots held for Plan 5. Note the limit: the grant covers **LiTex's own
  photography**, not third parties' marks — see the news imagery decision below.
- **The public repo is deliberate.** The archived catalogs and images are material LiTex publishes
  publicly. Do not suggest making it private.
- **The Google Maps API key in `archive/pages/*.html` is not a leak and is not LiTex's.** Google
  Cloud Console was checked 2026-08-11: no key ending `p8dwTE` exists in their account, so it is
  Automattic's. Nothing to revoke. Documented in `archive/README.md`. Do not propose a history
  rewrite.
- **News posts stay as short dated entries** (decided 2026-08-11, executed in Plan 6) — published
  honestly with their original dates, not merged into a timeline and not expanded with invented
  detail. *New Braided Self-curling Tube* has **no body text at all** (it is a photograph and a
  product link), *Tokyo Wearable Expo 2022* is one sentence, and the longest of the seven is three
  sentences. That is the real material. Do not pad it.
- **WordPress.com Site Redirect:** the user is not using WordPress, so legacy
  `litextextile.wordpress.com` URLs will not 301 and that ranking is not recoverable. Business
  decision, already taken. Nothing blocks building.
- **LiTex is a subsidiary of Hen Hao Trading, and the two share the Bangka Blvd. premises.**
  Confirmed by the user 2026-08-11. Hen Hao is the **current parent**, not a predecessor — an
  earlier draft of `/company/about/` called the nameplates "the two businesses that came before",
  which was wrong and is now fixed. Declared once as `COMPANY.parentCompany` in
  `src/lib/company.ts`. **Only the LiTex/Hen Hao relationship is confirmed** — Taiwan Tulip Ribbon
  & Braids is known solely from its nameplate at the same address, which establishes co-location
  and nothing more. A draft of `/company/about/` called it "in the same group"; that was an
  invented corporate fact about a third party and a test now guards against it returning.
- **SGS report `CE/2013/52203` is issued in Hen Hao Trading's name**, confirmed by the user
  2026-08-11. It is stated outright on `/company/certifications/` under "Issued to", because a buyer
  who requests the report and meets an unfamiliar company name on it has found a discrepancy the
  site created by staying quiet. It is **not** read off the cover photograph — the addressee block
  there is still illegible, and `SGS_REPORT.notReadable` correctly still says so. A residual
  commercial question remains and it is a question for LiTex, not for the site: a procurement filter
  requiring the certificate be in the *supplier's* name is not satisfied by a parent-company
  document.
- **`litex.com.tw` and `sales@litex.com.tw` are confirmed** and declared in `astro.config.mjs`.
  `mail@example.com` is theme boilerplate — a test fails if any `example.com` string is rendered.

### Settled in Plan 6 — the four news decisions

Taken with the human on 2026-08-12 after reading all ten archived posts, and recorded in the plan's
"Decisions taken before this plan was written" table. **Do not re-litigate them.**

1. **No third-party event imagery is republished.** Six of the seven posts' only images are
   trade-show organizers' marks — Messe Frankfurt's Techtextil key visual, the Wearable Expo logos,
   Messe Düsseldorf's mark, and a screenshot of a third-party blog. LiTex's usage grant covers its
   own catalog photography, not event organizers' trademarks. `/news/` therefore ships **exactly one
   photograph**, and it is LiTex's own.
2. **`test-post-blah` stays dead — seven posts, not eight.** ⚠ **Read this before you "discover" it
   again.** Its title is *"LiTex Attending Wearable Expo"* and **its body is genuinely real content,
   not junk** — the junk is the slug. It is killed anyway, because it pre-announces the very expo
   that `wearable-expo` (2017-02-23) thanks visitors for, so nothing of substance is lost. Spec §3
   sentences the URL to **410 Gone**; that holds. There is no eighth post to recover.
3. **The TechTextil blog article is not linked.** `techtextil-blog.com` now serves a certificate for
   `*.messefrankfurt.com`, so the 2017 link throws a TLS warning — worse than no link. A Wayback
   snapshot (2022-05-19, HTTP 200) exists and the original path is recorded in that post's
   `sourceNote` as plain text for a future session, but nothing is linked because the capture's
   contents were never verified.
4. **Titles are normalized; two typos are corrected; nothing claims to be verbatim.** The
   `featured-on-techtextil-blog` body had two genuine errors (*"Its been"*, *"It was pleasure"*),
   corrected and disclosed in that post's `sourceNote`. A second reader confirmed those two
   corrections are the only changes to that body.

### Also settled in Plan 6 — rulings and standards worth keeping

- **`walk` exists in two files by design.** `tests/helpers/dist.ts` walks `dist/`;
  `tests/fonts.test.ts` walks `src/` and filters against an extension allowlist. Two reviewers read
  both and confirmed they are different functions. **Do not "finish the job" by merging them.**
  `DIST`, `docFor` and `routeFile` do each exist in exactly one place.
- **Human ruling, Task 1: the wider scope governs.** When the brief's premise turned out to
  understate the duplication, the consolidation was extended to all eight affected test files rather
  than stopping at the two the brief named.
- **Human ruling, Task 5: the provenance note governs; the test was wrong.** A test banned the
  string `techtextil-blog.com` anywhere in the build, which collided with the provenance note that
  deliberately records the dead article's path. The test was narrowed to **anchor `href`s across the
  whole build**, and the note was restored byte-identical from its verified commit. **General
  lesson: a string-containment ban over rendered HTML cannot tell a link from a mention. Guard the
  thing that actually harms a reader** — here, that no visitor can click through to a TLS warning.
- **The standard for "this guard still works".** Prove it, don't assert it: add a live probe that
  should trip the guard, rebuild, observe the failure, revert, re-verify. Both the narrowed link
  guard and the Tier 3 imagery guard were verified this way in Plan 6, as was the nav guard.
- **The braided-tube alt text does not mention the self-curling overlap seam.** Three independent
  viewers examined the frame; none could find one. The product genuinely has such a seam — it is
  simply not in this crop. On this site alt text is a factual claim read aloud to someone who cannot
  check it, so an unconfirmable structural detail is the same class of error as an unsourced spec
  value. **Do not restore the claim from product knowledge if this alt is ever revisited.**
- **`img_4818.jpg` really is LiTex's own photography.** The archived post's `og:image` points at
  `litextextile.wordpress.com/wp-content/uploads/2020/05/img_4818.jpg` — LiTex's own media library —
  and the camera-default filename is consistent. This was queried and closed.

---

## Toolchain gotchas that have already cost time

Full detail in the `litex-verified-toolchain` memory. The ones that bite hardest:

1. **`extract_image()` returns raw stored bytes** — three catalog images are **JPEG 2000**, which
   sharp cannot decode at all, and all six are **CMYK**. Decode through `fitz.Pixmap` →
   `fitz.csRGB`. Soft masks are page-layout gutters over white; ignore them.
2. **Astro `compressHTML` (default true) strips the newline between text and a following element**,
   so `covering,\n<span>1S1Z</span>` ships as `covering,1S1Z`. Fix with an explicit `{' '}`.
   Detect with `grep -oE '[a-zA-Z,;:.]<(span|a|strong|em)\b'` over `dist/**/*.html`.
3. **`<Picture>` sizes its fallback from the source's intrinsic width** unless given `width`, and
   **Astro emits the untouched source file for every `image()` a schema resolves**, referenced or
   not. Both silently ship megabytes. Sources are capped at 1400 px by the extraction script.
4. **A broken `reference()` does not fail the build** (exits 0, renders blank). Always use
   `mustResolve()` from `src/lib/references.ts`. Schema `superRefine` violations *do* fail (127).
5. **sharp holds files open on Windows** — read into a Buffer before writing back to the same path.
6. A local, gitignored waiver in `.impeccable/config.local.json` silences the `broken-image` rule
   inside `tests/imagery.test.ts` only (it false-positived on the `<img>`-matching regexes there).
   The rule still fires everywhere else — verified.
7. **pymupdf's `Pixmap.copy(source, irect)` works in absolute coordinates.** A destination pixmap
   created at `IRect(0, 0, w, h)` does not intersect a source region at a non-zero offset, so the
   copy is empty and the result is a black rectangle. `scripts/extract-image.py` had this bug from
   the start; it was invisible because its only caller (the RFID hero, Plan 3) cropped from `(0,0)`,
   where the bug can't show. Fixed in Plan 5 Task 1 by creating the destination pixmap at the crop
   origin and resetting its origin afterward. A black frame is otherwise a completely valid JPEG of
   the correct dimensions with a valid provenance entry — nothing about it looks wrong until you
   open it. It is now caught structurally: `tests/provenance.test.ts` computes bytes-per-pixel for
   every shipped image and fails anything too uniform to be a photograph.
8. **YAML parses an unquoted ISO timestamp into a `Date`, not a string.** Written bare in front
   matter, `publishedAt: 2017-02-23T14:54:11+08:00` arrives at the schema as a `Date` object — and
   a `Date` has already thrown away the `+08:00` offset and the exact characters, which is the whole
   point of storing the string. **Every `publishedAt` in `src/content/news/*.md` is quoted**, and
   `src/schemas/news.ts` uses a plain `z.string()` so zod's default type error ("expected string,
   received date") names the exact mistake. Do not "tidy" the quotes away.
9. **`Date.parse` is lenient by specification — it cannot be used as a validity check.**
   `Date.parse('2018-02-31')` does not return `NaN`; it rolls the value forward to **March 3** and
   returns a perfectly good number. A schema written on the assumption that it rejects impossible
   dates rejects nothing, and *"February 31, 2018"* renders happily. This cost a whole fix round
   twice in one plan. **Round-trip through `Date.UTC` and compare the fields back**, as
   `fields()` in `src/lib/dates.ts` does. The trap inside the trap: a naive stricter check must
   still **accept real leap days** — `2016-02-29` is valid and there is a test pinning it.
10. **Consolidating a helper out of a test file breaks unrelated imports.** Twice in Plan 6 Task 1,
    an import line served both a helper being deleted *and* a direct use elsewhere in the same file
    (`fileURLToPath` in `chrome.test.ts`; `readFileSync` + `fileURLToPath` in `build.test.ts`).
    Deleting the helper deleted a live import. The test run caught both before commit — expect this
    on any future consolidation here, and run the suite before believing the refactor.

---

## Parked residual — Plan 8 must handle this

The Plan 5 final whole-branch review found that `npx astro build` on a cold checkout, where
`public/catalogs/` was never populated, still ships a build with an unpopulated `public/catalogs/`.
`npx` bypasses `package.json` scripts entirely, so the inlined `node scripts/sync-catalogs.mjs &&
astro build` in `npm run build` never runs — there is no way to reach the sync step from
`package.json` alone. No CI config exists in this repo yet, so nothing currently triggers this path.
**Plan 8 must set the Cloudflare Pages build command to `npm run build`, not `npx astro build` or
the Cloudflare default**, or the six downloads and five product catalog links 404 in production with
no test catching it.

---

## Carried-forward minors from the Plan 5 and Plan 6 review ledgers

Both SDD ledgers were gitignored and are deleted once their plan merges, so the findings with a live
trigger condition are preserved here. None is a bug; each is a decision that becomes wrong later.

**Closed by Plan 6:**

- ~~**1. `walk()` and `routeFile()` are duplicated verbatim** in `tests/chrome.test.ts` and
  `tests/company.test.ts`; extract a shared helper.~~ **DONE** — Plan 6 Task 1 created
  `tests/helpers/dist.ts`. The duplication turned out to be wider than recorded here (eight files,
  not two), and all eight were consolidated. `DIST`, `docFor` and `routeFile` now exist in exactly
  one place; `walk` exists in two **by design** (see "Settled"). Do not reopen this.

**Left alone deliberately, with the trigger re-evaluated:**

2. **`ArchiveFigure` and `ProductHero` share near-identical figure boilerplate** (wrapper CSS,
   `:global(img)`, figcaption, width/height shape). The recorded trigger was "if a third figure
   component appears". **It did not** — Plan 6 reused `ArchiveFigure` unchanged for the one news
   photograph rather than writing a third component, which was the right call and leaves the
   boilerplate at two copies. Still not worth refactoring; re-evaluate if a genuine third appears.
3. **`ArchiveFigure size="full"` resolves its `widths` ladder to `[400, 800]`**, so an 800–1200px
   source fills a ~960px slot at 800px. Inherited unchanged from `ProductHero`. It now affects two
   images — `factory-floor.jpg` and the news braid macro, whose 3024px source is capped to 1400px by
   the extraction script and then served at 800px. Cosmetic sharpness only; no budget is breached.

**Plan 8 should act on these four:**

4. The **dist-reading test strategy assumes `npm run build` ran immediately before `npm test`.**
   A stale `dist/` can pass some assertions vacuously. Pre-existing; a CI-ordering constraint the
   moment CI exists.
5. `/legal/privacy/`'s **script guard checks only absolute `http(s)` `script[src]`** — it would miss
   a protocol-relative URL or an inline third-party call. Cloudflare Web Analytics uses a full
   `https` src, so Plan 8's actual change *is* covered; the guard is just narrower than it reads.
6. The same page's **analytics guard asserts `toContain('no analytics')`**, which could pass on a
   partially-rewritten page. The script-src assertion is the real blocker; this is redundancy.
7. **Every `npm run build` rewrites `src/data/catalog-files.json` with a CRLF-only diff** and no
   content change, dirtying the working tree on every build. It has now cost three separate agents a
   detour into "what did I change?". Harmless, but fix the line-ending handling in
   `scripts/sync-catalogs.mjs` (or `.gitattributes`) in Plan 8. **Until then: if
   `src/data/catalog-files.json` shows modified with an empty `git diff`, just `git checkout --` it.**

**Plan 7 should keep this one in view:**

8. **`/news/`'s `BlogPosting` JSON-LD omits `image` and `author`**, both of which Google's Rich
   Results Test lists as recommended. Both omissions are honest rather than lazy — `author` is
   genuinely unknown for these posts and `image` exists for only one of the seven. If LiTex ever
   answers who wrote them, add `author`.

**No trigger, carry indefinitely:**

- `dirFor()` reimplemented with different signatures in `extract-images.mjs` and
  `provenance.test.ts`.
- `patents.ts` repeats 富鉅紡織科技股份有限公司 as a literal instead of importing
  `COMPANY.legalNameZh`, while commenting that it is "an exact match".
- `AWARD.dated` is styled `class="value"` beside true identifiers.
- The "does not assert a right currently in force" test only checks that the word "renewal" appears.
- The "never publishes the unattributable US patent certificate" test cannot fail until a
  `us-patent` slug exists (forward guard by design).
- `scripts/sync-catalogs.mjs` throws a bare ENOENT if `archive/catalogs/` is missing.
- `humanSize()` has no direct unit test, so the MB/KB boundary is unpinned.
- `about.astro:99` is a 113-char line against a ~78–90 char file norm.
- `about.astro:132–135` ("looms built for exactly the widths a conductive tape needs") is
  interpretive framing rather than a sourced fact — noted because it sits on a page built on
  traceability.
- **`isStoredTimestamp` does not signal in its name that it also checks calendar realness**, not
  only format. Its JSDoc says so. `isValidStoredTimestamp` would read better if it is ever renamed.
- **`dates.ts`'s "does not depend on the runner timezone" test never varies `TZ`.** It documents
  intent and pins one expected output rather than empirically proving timezone independence. Proving
  it properly needs a child process with `TZ` set, which costs more than it returns while the
  implementation contains no timezone-sensitive path at all. **Revisit only if `dates.ts` ever gains
  one.**
- **`src/pages/products/[slug].astro` tags its JSON-LD `<script>` with `is:inline`; the news page
  omits it.** Verified empirically that Astro 7 does not process `type="application/ld+json"` at
  all — both pages emit byte-identical script tags, no hoisting, no bundle reference. Stylistic
  inconsistency only. Worth one cleanup pass someday; not a functional risk.

---

## Open questions for LiTex — carried forward and revised

Ordered by how much damage the wrong answer does.

1. **TWM545145 renewal status.** Unchanged, still the highest-value answer. Its sibling lapsed for non-payment; this is the claim in the footer of every page. A confirmation would let the credibility bar say something stronger than "TW UTILITY MODEL".
2. **What is the SGS report's scope?** Not readable at the stored resolution — the site currently says so out loud. The full report closes the largest hole in `/company/certifications/`, and spec §7 item 5 rates it High.
3. **The thermograph's test conditions** — voltage, duration, ambient temperature, colour scale. Held out of `/technology/` for a fourth plan running.
4. **News since 2022** (spec §7 item 14). `/news/` now exists and is framed as an archive, which makes the four-year gap **honest** — it does not **fill** it. Anything from 2023–2026 (a trade show attended, a new grade, a customer win) turns a closed archive back into evidence of a live company, and the section is built to take it: drop a Markdown file in `src/content/news/`, and the year grouping and the stated date range update themselves. **Ask for this every time you speak to them.**
5. **Does LiTex have a copy of the TechTextil coverage?** In June 2017 the Techtextil blog interviewed them at Frankfurt Messe and published an article (`techtextil-blog.com/en/the-heat-is-on/`, interviewer Liam Rodden). The domain is dead and now serves a Messe Frankfurt certificate, so it cannot be linked. **This is the only independent editorial mention of LiTex anywhere in the archive**, which makes it disproportionately valuable — third-party coverage is worth more than anything the site says about itself. Ask whether they kept a PDF, a print copy, or a screenshot; failing that, whether they can confirm the Wayback capture of 2022-05-19 reflects the real article, which would let it be cited.
6. **What the USPTO certificate actually is**, given 12/787,378 was abandoned. It is now deliberately unpublished, so this is no longer blocking anything — but if it turns out to be a granted patent under a different number, that is a real asset currently missing from the site.
7. **Are CN 201485574U, TW 099146482 and CN 201120008487.x still live?** `/company/patents-and-awards/` prints "Not verified" against all three. LiTex can answer this in a sentence and the page improves immediately.
7b. **Which of the older filings were made by Fu-Biau Hsu (許富標) personally rather than by the company?** The register check found individual applicants on the older family but did not enumerate which. The page says "some" because that is the precision the evidence supports; naming them would be better, and only LiTex can.
8. **Company facts for `/company/about/`** — headcount, floor area, production capacity, factory locations. The page deliberately states none of these. Spec §7 item 13.
9. **Should `/legal/privacy/` be reviewed by LiTex's counsel?** The page states only verifiable properties of the site and makes no promise the site cannot keep, but it is a legal document published in LiTex's name in a market where such documents matter. Flag it; do not block launch on it. **Plan 7 makes this sharper** — the moment a contact form collects personal data, the privacy page stops being a formality.
10. **CuNi status** — "coming soon" in 2018; `/technology/` still says exactly that, and the January 2017 news post *Copper Nickel 1s1z* announces it. Nine years of "coming soon" is its own signal.
11. **Is the 2018 grade range (1S–4S4Z) still current?** The whole `/technology/` argument rests on it.
12. **Are the 2018 catalogs still the current set?** `/downloads/` now serves all six and says plainly that they are eight years old. Spec §7 item 15.
13. **Re-shoot `wired-conductive-tape`** (600×341 is genuinely the largest in the archive).
14. Carried over: EMI `(c)` column and `(ø)` units; the stainless steel yarn table's owning product.

---

## Resuming in a new session

**Everything below was true at 2026-08-12. Trust it over any recollection.**

### Where things stand

Plan 6 is **merged**. `main` is at **`bafff91`** (PR #6, squashed), clean and pushed, with no
branches outstanding. On `main`: `npm run build` → **32 pages**, `npm test` → **284 passing across
18 files**, detector → no findings.

The Plan 6 SDD ledger has been **deleted**, as Plan 5's was. Everything durable in it was lifted
into this file first: the four news decisions and the two human rulings are under "Settled", the new
deferred findings are under "Carried-forward minors", and the two date-handling traps are toolchain
gotchas 8 and 9. What was left behind was bookkeeping only: per-task commit SHAs that die with the
squash, and two report-arithmetic slips with no code impact. Do not go looking for
`.superpowers/sdd/2026-08-11-*` or `.superpowers/sdd/2026-08-12-*`; both are gone.

### Do this first

**Write Plan 7** with `superpowers:writing-plans`, then execute it subagent-driven. Scope, sources
and house style are described above. Nothing from Plan 6 is outstanding.

Do not re-run brainstorming or the spec self-review, and do not re-derive anything under
"Settled — do not re-raise".

The `gh` token note, kept because it will recur on PR #7: `gh pr edit` and `gh pr merge` may fail
with a **`read:org` scope error**. Fall back to the REST API
(`gh api --method PUT repos/darsonl/litex-website/pulls/N/merge`) or the browser. It is a token
config issue, not a repo problem. On PR #5 **and PR #6**, `gh pr merge --squash --delete-branch`
worked with no error. Note that `git branch -d` **refuses a squash merge**; that refusal is expected
and is not evidence of unmerged work.

### What NOT to redo

- Do not re-derive the patent statuses, the TAITRONICS award text, the SGS report facts, the
  catalog page counts, or any company photograph's contents. All were verified twice and are
  recorded above.
- Do not re-transcribe the seven news posts. Their text was extracted with linkedom and then
  re-verified word-for-word by an independent second reader against the archived originals.
- Do not "fix" the missing full stop at the end of the Mobile information paragraph on
  `/legal/privacy/`, or the reduced-precision "September 2014" award date. Both are deliberate
  and both are explained in comments beside them.
- Do not restore `PATENTED` or `1M545145` anywhere. A test bans both site-wide.
- Do not add a fourth inline contact `<address>` — use `src/components/ContactBlock.astro`.
- Do not hide `/news/` from the nav or invent posts to close the 2022 gap. See the state block.
- Do not go hunting for an eighth news post. `test-post-blah` was read, has real content, and was
  killed anyway on the merits.

### Execution mode recommendation for Plan 7

Run it **subagent-driven** (`superpowers:subagent-driven-development`), as Plans 5 and 6 were. Across
two plans the pattern is now unambiguous: **ten of fifteen implementation tasks needed a fix round,
and effectively every finding traced to the plan's own text rather than to implementer error.** The
plan's author cannot review the plan's prose — that separation is where the quality came from.

Plan 7 is the strongest case yet for it. It is the first plan with a **server-side runtime**
(a Pages Function), the first that **accepts input from strangers**, and the first where a defect is
a security or spam problem rather than a wrong figure on a page. A fresh reviewer reading each task's
diff against its brief is worth more there than anywhere so far. Also run the pre-flight scan before
Task 1 — it caught a build-breaking contradiction in Plan 6 before a single implementer started.

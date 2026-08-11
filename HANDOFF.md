# Session handoff — LiTex website redesign

**Written:** 2026-08-11 (end of session 6)
**Reason:** Session running out of context. This file is the resume point.

---

## ▶ Do this first

**Plans 1–5 are built, verified and merged.** Do not re-run brainstorming, the spec self-review,
`/impeccable init`, or `writing-plans` for Plans 1–5 — all complete.

### → Start here: write Plan 6 with `superpowers:writing-plans`, then execute it

Plan 6 is **`/news/` index + 7 posts.**

Read before writing it: this file, `PRODUCT.md`, and
`docs/superpowers/specs/2026-08-10-litex-website-redesign-design.md` (§3 IA, §6 extracted content,
§7 gaps). The five completed plans in `docs/superpowers/plans/` are worth skimming for house
style — they are long, fully-specified, and every code block is real.

**Execution mode:** Plans 1–4 ran **inline** via `superpowers:executing-plans`. **Plan 5 ran
subagent-driven** via `superpowers:subagent-driven-development` — a fresh implementer per task, a
spec-plus-quality review after each, and one whole-branch review at the end. Both modes work; the
branch → task → test → commit per task → PR → merge → delete branch pattern is unchanged and has
now held for 33 tasks across five plans.

Subagent-driven is worth repeating, on this evidence: **five of the eight implementation tasks
needed a fix round, and every one of those findings traced to the plan text rather than to
implementer error.** A fresh reviewer reading one task's diff against its brief caught things the
plan's own author did not — a page asserting a test scope three lines above declaring that scope
unreadable, a verified fact silently dropped from a data file, a quotation claimed verbatim that
had gained a full stop, a present-tense claim resting on 2017 sources. The whole-branch review then
caught three more that no single-task review could see, including a CSS bug that made the contact
address render as seven loose paragraphs on three routes. Budget for the review loop; it is where
the quality came from.

---

## State as of 2026-08-11 (end of session 6)

- Plan 5's branch, `plan-5-company-downloads-legal`, is complete: all 9 tasks done, each reviewed
  and fixed. Full account in
  `.superpowers/sdd/2026-08-11-litex-company-downloads-legal/progress.md`. Pushed, and open as
  **PR #5** — https://github.com/darsonl/litex-website/pull/5. **Not merged yet.**
- `npm run build` exits 0, emitting **24 pages**. `npm test` = **229 tests across 16 files**, all
  passing. Design detector returns `[]` for `src/components src/pages src/styles`.
- `dist` totals **16 MB**, of which `dist/catalogs` is about **11 MB** — the six catalog PDFs,
  served for the first time this plan.
- Routes added this plan: `/company/`, `/company/about/`, `/company/patents-and-awards/`,
  `/company/certifications/`, `/downloads/`, `/legal/privacy/`.
- Repo public at **https://github.com/darsonl/litex-website**. Plans 1–4 merged via PR #1–#4; Plan 5
  merges via whichever PR number the controller opens next — not confirmed at the time this file was
  written.

### Plan roadmap — 8 total

| Plan | Scope | State |
|---|---|---|
| 1 | Foundation & content layer | ✅ merged (PR #1) |
| 2 | Product layer & spec table | ✅ merged (PR #2) |
| 3 | Product photography & image pipeline | ✅ merged (PR #3) |
| 4 | Site chrome & the technology section | ✅ merged (PR #4) |
| 5 | `/company/` ×4 · `/downloads/` · `/legal/privacy/` | ✅ complete — **PR #5 open, not merged** |
| 6 | `/news/` index + 7 posts | ← **next, not written** |
| 7 | Contact + sample-request flow (Pages Function, Turnstile, KV) | not written |
| 8 | Launch: `_redirects`, sitemap, analytics, Sveltia CMS, print stylesheet, Lighthouse/axe, broken-link check | not written |

---

## What Plan 6 inherits from Plan 5 — use these, don't reinvent

| Thing | Where | Note |
|---|---|---|
| Primary nav | `src/lib/nav.ts` | Add `/news/` here. `tests/chrome.test.ts` **fails if a chrome link has no built page behind it** — add the route first. |
| Captioned archive photography | `src/components/ArchiveFigure.astro` | Props `{ image: ImageMetadata; alt: string; caption: string (required); size?: 'full'\|'half'\|'document'; loading?: 'eager'\|'lazy' }`. Never upscales a source — the `widths` ladder is capped under the narrowest source that uses each `size`. |
| Contact block | `src/components/ContactBlock.astro` | Props `{ showLegalNameZh?: boolean }`, default `false`. Renders legal name, optional Chinese legal name, address lines, Tel, Fax, email, hours as `<p>` children inside one `<address data-contact-block>`. Used on `/company/about/`, `/company/` (with `showLegalNameZh`), and `/legal/privacy/`. It carries its own `.contact p { margin: 0; }` — see the toolchain-adjacent gotcha below for why that rule has to live inside the component. |
| Two-group image extraction | `scripts/extract-images.mjs` + `extract-image.py`; `src/assets/{products,company}/provenance.json` | `SOURCES` entries carry an optional `group: 'products' \| 'company'`, default `'products'`. `tests/provenance.test.ts` walks both manifests and asserts no filename appears in both. Re-runnable; add a third group only if a third page family needs its own photography — a shared directory would make the per-slug assertions meaningless. |
| Catalog delivery | `public/catalogs/` (gitignored), `scripts/sync-catalogs.mjs`, `src/data/catalog-files.json` (generated, committed) | `npm run build` is `node scripts/sync-catalogs.mjs && astro build` — an **inlined step, not an npm `prebuild` lifecycle hook** — so it survives `pnpm` or any runner that skips lifecycle hooks. It does **not** survive calling `npx astro build` directly; see the parked residual below. |
| `data-source-note` vs `data-page-note` | `company/patents-and-awards.astro`, `company/certifications.astro` | `SpecTable` emits its own `[data-source-note]`. A second one on the same page would make that hook non-singular site-wide, so a page-level note that sits beside a `SpecTable` uses `[data-page-note]` instead. Keep the distinction if Plan 6 ever pairs a `SpecTable` with page-level prose. |
| Forward-guard tests | `tests/legal.test.ts` | Two tests on `/legal/privacy/` — *"claims no analytics only while the site really runs none"* and *"describes no form while no form exists"* — are written to fail the moment Plan 7 ships a form or Plan 8 ships analytics. **Delete each one deliberately**, in the same commit that updates the page to describe the new reality. Do not silence or loosen them instead. |

---

## Company photography extracted in Plan 5

All six sourced from `archive/catalogs/2018-company-introduction.pdf` via the two-group extraction
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
and dated `2014.9.29`. Re-examined at 14× lanczos this session, the day's final digit is roughly
five pixels tall and is either a 6 or a 9 — unresolvable. That earlier "fully read" claim was
overconfident. The site publishes **"September 2014"** (`AWARD.dated` in `src/data/patents.ts`) and
nothing more precise. Do not restore a specific day without a better source image.

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
  certificates and personnel shots held for Plan 5.
- **The public repo is deliberate.** The archived catalogs and images are material LiTex publishes
  publicly. Do not suggest making it private.
- **The Google Maps API key in `archive/pages/*.html` is not a leak and is not LiTex's.** Google
  Cloud Console was checked 2026-08-11: no key ending `p8dwTE` exists in their account, so it is
  Automattic's. Nothing to revoke. Documented in `archive/README.md`. Do not propose a history
  rewrite.
- **News posts stay as short dated entries** (decided 2026-08-11) — published honestly with their
  original dates, not merged into a timeline and not expanded with invented detail. Be warned:
  *New Braided Self-curling Tube* has **no body text at all**, *Tokyo Wearable Expo 2022* has one
  sentence, and the longest of the seven is three sentences.
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
  2026-08-11. This *was* open question 1 and is now closed. It is stated outright on
  `/company/certifications/` under "Issued to", because a buyer who requests the report and meets
  an unfamiliar company name on it has found a discrepancy the site created by staying quiet. Note
  it is **not** read off the cover photograph — the addressee block there is still illegible, and
  `SGS_REPORT.notReadable` correctly still says so. A residual commercial question remains, and it
  is a question for LiTex rather than for the site: a procurement filter that requires the
  certificate be in the *supplier's* name is not satisfied by a parent-company document.
- **`litex.com.tw` and `sales@litex.com.tw` are confirmed** and declared in `astro.config.mjs`.
  `mail@example.com` is theme boilerplate — a test fails if any `example.com` string is rendered.

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

---

## Parked residual — Plan 8 must handle this

The Plan 5 final whole-branch review found that `npx astro build` on a cold checkout, where
`public/catalogs/` was never populated, still ships a build with an unpopulated `public/catalogs/`.
`npx` bypasses `package.json` scripts entirely, so the inlined `node scripts/sync-catalogs.mjs &&
astro build` in `npm run build` never runs — there is no way to reach the sync step from
`package.json` alone. No CI config exists in this repo yet, so nothing currently triggers this path,
and it does not block merging Plan 5. **Plan 8 must set the Cloudflare Pages build command to
`npm run build`, not `npx astro build` or the Cloudflare default**, or the six downloads and five
product catalog links 404 in production with no test catching it.

---

## Open questions for LiTex — carried forward and revised

Ordered by how much damage the wrong answer does.

1. **TWM545145 renewal status.** Unchanged, still the highest-value answer. Its sibling lapsed for non-payment; this is the claim in the footer of every page. A confirmation would let the credibility bar say something stronger than "TW UTILITY MODEL".
2. **What is the SGS report's scope?** Not readable at the stored resolution — the site currently says so out loud. The full report closes the largest hole in `/company/certifications/`, and spec §7 item 5 rates it High.
3. **The thermograph's test conditions** — voltage, duration, ambient temperature, colour scale. Held out of `/technology/` for a third plan running.
4. **What the USPTO certificate actually is**, given 12/787,378 was abandoned. It is now deliberately unpublished, so this is no longer blocking anything — but if it turns out to be a granted patent under a different number, that is a real asset currently missing from the site.
5. **Are CN 201485574U, TW 099146482 and CN 201120008487.x still live?** `/company/patents-and-awards/` prints "Not verified" against all three. LiTex can answer this in a sentence and the page improves immediately.
5b. **Which of the older filings were made by Fu-Biau Hsu (許富標) personally rather than by the company?** The register check found individual applicants on the older family but did not enumerate which. The page says "some" because that is the precision the evidence supports; naming them would be better, and only LiTex can.
6. **Company facts for `/company/about/`** — headcount, floor area, production capacity, factory locations. The page deliberately states none of these. Spec §7 item 13.
7. **Should `/legal/privacy/` be reviewed by LiTex's counsel?** The page states only verifiable properties of the site and makes no promise the site cannot keep, but it is a legal document published in LiTex's name in a market where such documents matter. Flag it; do not block launch on it.
8. **CuNi status** — "coming soon" in 2018; `/technology/` still says exactly that.
9. **Is the 2018 grade range (1S–4S4Z) still current?** The whole `/technology/` argument rests on it.
10. **Are the 2018 catalogs still the current set?** `/downloads/` now serves all six and says plainly that they are eight years old. Spec §7 item 15.
11. **Re-shoot `wired-conductive-tape`** (600×341 is genuinely the largest in the archive).
12. Carried over: EMI `(c)` column and `(ø)` units; the stainless steel yarn table's owning product.

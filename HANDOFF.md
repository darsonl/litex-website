# Session handoff — LiTex website redesign

**Written:** 2026-08-11 (end of session 4)
**Reason:** Session running out of context. This file is the resume point.

---

## ▶ Do this first

**Plans 1–4 are built, verified and merged.** Do not re-run brainstorming, the spec self-review,
`/impeccable init`, or `writing-plans` for Plans 1–4 — all complete.

### → Start here: write Plan 5 with `superpowers:writing-plans`, then execute it

Plan 5 is **`/company/` hub + `/company/about/` + `/company/patents-and-awards/` +
`/company/certifications/` + `/downloads/` + `/legal/privacy/`.**

Read before writing it: this file, `PRODUCT.md`, and
`docs/superpowers/specs/2026-08-10-litex-website-redesign-design.md` (§3 IA, §5 design system,
§6 extracted content, §7 gaps). The three completed plans in `docs/superpowers/plans/` are worth
skimming for house style — they are long, fully-specified, and every code block is real.

**Execution mode:** all four plans ran **inline** via `superpowers:executing-plans` — subagents are
disabled and inline reuses context cheaply. Working pattern that has held for 24 tasks:
branch → task → test → commit per task → PR → merge → delete branch.

---

## State as of 2026-08-11

- **`main` is at `573dbe2`, clean and pushed. Nothing in flight** — no open branch, no open PR.
- Repo public at **https://github.com/darsonl/litex-website**. Plans 1–4 merged via PR #1–#4; all
  four branches deleted, remote pruned.
- `npm test` = **160 tests across 13 files**, all passing. `npm run build` exits 0, emitting
  **18 pages**. Design detector returns `[]` for `src/components src/pages src/styles`.
- dist imagery: 3110 KB total, largest asset 280 KB.

### Plan roadmap — now 8 total

Plan 4 was scoped down (site had no navigation at all), which pushed the count from 6 to 8.

| Plan | Scope | State |
|---|---|---|
| 1 | Foundation & content layer | ✅ merged (PR #1) |
| 2 | Product layer & spec table | ✅ merged (PR #2) |
| 3 | Product photography & image pipeline | ✅ merged (PR #3) |
| 4 | Site chrome & the technology section | ✅ merged (PR #4) |
| 5 | **`/company/` ×4 · `/downloads/` · `/legal/privacy/`** | ← **next, not written** |
| 6 | `/news/` index + 7 posts | not written |
| 7 | Contact + sample-request flow (Pages Function, Turnstile, KV) | not written |
| 8 | Launch: `_redirects`, sitemap, analytics, Sveltia CMS, print stylesheet, Lighthouse/axe, broken-link check | not written |

---

## What Plan 5 inherits from Plan 4 — use these, don't reinvent

| Thing | Where | Note |
|---|---|---|
| Primary nav | `src/lib/nav.ts` | Add `/company/` and `/downloads/` here. `tests/chrome.test.ts` **fails if a chrome link has no built page behind it** — add the route first. |
| Company facts | `src/lib/company.ts` | `COMPANY` + `CREDIBILITY`. A test fails if `COMPANY.email` drifts from `CONTACT_EMAIL` in `astro.config.mjs`. |
| Chrome | `SiteNav.astro`, `SiteFooter.astro` | Mounted globally in `BaseLayout.astro`. |
| Page container | `.page` in `global.css` | `max-width: 76rem`, plus h1/h2/h3 rhythm. |
| Spec tables | `SpecTable.astro` | Takes `{ columns, rows }`; gives Copy-as-CSV + provenance note free. |
| Tier 3 imagery guard | `tests/imagery.test.ts` | **Vacuous today, starts biting the moment `/company/` gets a photograph.** Every raster on `/company/` or `/technology/` must trace to a `provenance.json` entry with `aiGenerated: false`. |
| Image extraction | `scripts/extract-images.mjs` + `extract-image.py` | Re-runnable, writes `src/assets/products/provenance.json`. Extend for `/company/` assets. |

---

## Assets held for Plan 5 — verified 2026-08-11 by rendering each

All in `archive/catalogs/2018-company-introduction.pdf`. **Decode via `fitz.Pixmap`, never
`extract_image`** — see the toolchain memory for why.

| xref | Size | Content | Page |
|---|---|---|---|
| p1 xref 52 | 989×692 | Loom with LiTex-branded tape, two framed certificates, spool of woven tape | `/company/about/` |
| p1 xref 54 | 1024×536 | Factory floor — creels, spools, machinery | `/company/about/` |
| p2 xref 8 | 626×504 | Trade-show booth and three staff under a LITEX sign | `/company/about/` |
| p2 xref 5 | 1035×442 | US patent certificate · TAITRONICS award · SGS report | `/company/certifications/`, `/company/patents-and-awards/` |
| p2 xref 6 · heating p1 xref 122 | 746×253 · 1310×462 | Heating textile + **thermograph** | `/technology/` — **held, see open questions** |

**TAITRONICS award, fully read:** 40th Taipei International Electronics Show, Technology Innovation
Awards, **優選獎 / The Quality Award**, dated **2014.9.29**, for **非碳纖維電子發熱紡織品 /
Non-Carbon Fiber Electrical Heating Textile**, to 富鉅紡織科技股份有限公司.
**SGS report number: `CE/2013/52203`** (2013; scope not readable at stored resolution).

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

---

## Open questions for LiTex — do not guess these

1. **TWM545145 renewal status.** Its sibling lapsed for non-payment; this is the claim currently on
   every page. Highest priority.
2. **The thermograph's test conditions** — voltage, duration, ambient temperature, colour scale.
   Held out of `/technology/` until answered; publishing it as evidence of a measurable claim
   without conditions invites the exact diligence failure this redesign exists to fix.
3. **What the USPTO certificate actually is**, given 12/787,378 was abandoned.
4. **SGS `CE/2013/52203` is from 2013** and its scope is unreadable. Is there anything newer?
5. **CuNi status** — "coming soon" in 2018; `/technology/` currently says exactly that.
6. **Is the 2018 grade range (1S–4S4Z) still current?** The whole `/technology/` argument rests on it.
7. **Re-shoot `wired-conductive-tape`** (600×341 is genuinely the largest in the archive).
8. Carried over: EMI `(c)` column and `(ø)` units; the stainless steel yarn table's owning product.

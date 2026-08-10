# Session handoff — LiTex website redesign

**Written:** 2026-08-10
**Reason:** User restarting Claude Code so impeccable's skills and slash commands register.

---

## ▶ Do this first in the new session

**Plans 1 and 2 are built and merged. Plan 3 is WRITTEN BUT NOT EXECUTED.**
Do not re-run brainstorming, the spec self-review, `/impeccable init`, or `writing-plans` for
Plans 1–3 — all are complete.

### → Start here: execute Plan 3

```
docs/superpowers/plans/2026-08-11-litex-product-photography.md
```

Invoke `superpowers:executing-plans` and work Tasks 1–6 in order. **The plan is self-contained** —
it carries every source path, xref, image dimension and the full alt text for all seven products.
You do not need to re-survey the PDFs; that was done and verified on 2026-08-11.

**Execution mode:** Plans 1 and 2 both ran inline via `superpowers:executing-plans`. This session
is configured not to spawn subagents, and inline reuses context cheaply. Do the same unless asked.
Working pattern that has held for 15 tasks: branch → task → test → commit per task → PR → merge →
delete branch. Branch name for this one: `plan-3-product-photography`.

### Plan roadmap — renumbered to 6 total

Splitting imagery into its own plan changed the count from 5 to 6.

| Plan | Scope | State |
|---|---|---|
| 1 | Foundation & content layer | ✅ merged (PR #1) |
| 2 | Product layer & spec table | ✅ merged (PR #2) |
| 3 | **Product photography & image pipeline** | 📝 written, **not executed** |
| 4 | Content pages: `/technology/`, `/company/` + 3 children, `/downloads/`, `/news/` + 7 posts | not written |
| 5 | Contact + sample-request flow: Pages Function, Turnstile, KV, store-before-send | not written |
| 6 | Launch: `_redirects` (23 URLs), sitemap, analytics, Sveltia CMS, print stylesheet, Lighthouse/axe budgets, broken-link check | not written |

Write each of 4–6 with `superpowers:writing-plans` immediately before executing it.

### Resume state as of 2026-08-11 (end of session 3)

- **`main` is at `aebf5e1`, clean, pushed. Nothing is in flight — no open branch, no open PR.**
- Plans 1 and 2 merged via PR #1 and PR #2; both branches deleted.
- Repo is public at **https://github.com/darsonl/litex-website**.
- `npm run build` exits 0, emitting **7 product routes, 6 application routes**, the two indexes
  and the home page. `npm test` = **97 tests across 9 files, all passing**.
- **Blockers: 1 of 4 remain.** Only the WordPress.com Site Redirect, and the user has said they
  are not using WordPress — so legacy `litextextile.wordpress.com` URLs will not 301 and that
  ranking is not recoverable. Business decision, already taken. Nothing blocks building.
- **Domain and email are settled:** `litex.com.tw` and `sales@litex.com.tw`, declared once in
  `astro.config.mjs` as `SITE_URL` / `CONTACT_EMAIL`. Both corroborated by LiTex's own 2018
  catalog footer, which also gives `+886 2 2308-4712` and
  `No. 188, Bangka Blvd., Taipei City 10860, Taiwan` for the Plan 5 contact page.
- Every Definition-of-Done item in both plans was verified **empirically** — each guard
  deliberately broken, observed to fail, restored. Never assumed from reading the code.
- Verified toolchain, all latest at install: `astro@7.2.0` · `vitest@4.1.10` · `linkedom@0.18.13`
  · `@fontsource-variable/archivo@5.3.0` · `@fontsource/ibm-plex-mono@5.3.0`. All pinned exactly.
- **Verified `astro:content` exports:** `getCollection`, `getEntry`, `getEntries`, `render`
  (alias of `renderEntry`), `reference`, `z`. `getEntryBySlug`/`getDataEntryById` are deprecated.

### Reusable modules Plans 3–5 should not rebuild

| Module | Purpose |
|---|---|
| `src/lib/references.ts` | `mustResolve()` — **always** wrap `getEntry()` in it |
| `src/lib/crossLinks.ts` | `productsClaiming()` — reverse lookup for dual-entry |
| `src/lib/csv.ts` | RFC 4180 serialization |
| `src/lib/jsonld.ts` | schema.org `Product` builder |
| `src/lib/contrast.ts` | WCAG maths behind the token guard |
| `src/components/` | `SpecTable`, `ProductCard`, `StatusBadge` |

### Verifying spec data from a PDF — the method that works here

`pdftoppm` is **not** installed, so the Read tool cannot render PDFs. `pymupdf` **is**:

```python
import fitz
doc = fitz.open('archive/catalogs/<name>.pdf')
doc[page].get_pixmap(dpi=170).save('out.png')   # then read the PNG
```

This is how the RFID and EMI tables were verified on 2026-08-11. **`pdftotext -layout` silently
scrambles these catalogs' tables** — it dropped an entire row from the RFID table and mangled a
header. Do not trust it for anything going into a `specTable`.

### ⚠ Plan 1 finding that changes later plans

**Astro 7.2.0 does NOT fail the build on a broken `reference()`.** It logs
`Entry <collection> → <id> was not found.`, **exits 0**, and renders the reference as blank —
silent data loss. Plan 1's Definition of Done asserted the opposite; that assertion was false.

Fixed by `src/lib/references.ts` → `mustResolve()`, which every page must use when resolving a
reference. **Plans 2–5: do not call `getEntry()` bare.** Wrap it, or the missing entry ships as
an empty string. Unit tests in `tests/references.test.ts`.

The general lesson: this stack's "the build will catch it" assumptions need to be *tested*, not
trusted. Schema-level guards (`superRefine`) genuinely do fail the build (verified, exit 127);
reference integrity does not.
- **Market and credibility questions are settled (2026-08-10). Nothing is outstanding.**
  **EU is the priority market**, which agrees with all archive evidence (Techtextil Frankfurt,
  Düsseldorf Wire Show) and with the REACH/RoHS/SGS claims LiTex already makes. Japan secondary.
  The credibility bar in spec §5 stays exactly as designed — **REACH · RoHS · SGS TESTED ·
  PATENTED TW 1M545145 · MANUFACTURING SINCE 1999** — built on what LiTex holds today. Gap 17
  (North American certifications) is **withdrawn**; no new certification class is being pursued.
  The remaining certification work is gap 5: obtaining the actual SGS/REACH documents with dates
  and scope. English at launch is correct, not a compromise.

---

## Where we are

Brainstorming, spec, `/impeccable init`, and **Plans 1 and 2** are all complete.

Plan 1 built the foundation: design tokens with an enforced WCAG guard, self-hosted typography
with a banned-font guard, an accessible base layout, and typed content schemas enforcing
provenance and imagery policy.

Plan 2 built the product layer: **all seven products and all six applications**, cross-linked in
both directions, with the spec-table component (build-time CSV serialization, progressive-
enhancement copy control, provenance line) and schema.org `Product` JSON-LD emitted from the same
data that renders the page.

**Two corrections Plan 2 made to earlier assumptions, both caught by verifying rather than
trusting:**

1. `pdftotext -layout` had **dropped a row** (`Orientation: S`) from the RFID spec table and
   mangled a header. Found by rendering the PDF page and reading it. Both previously-ambiguous
   tables are now verified against source artwork and no product carries `needsVerification`.
2. The EMI catalog has a fifth column headed `(c)` whose meaning appears nowhere in the document.
   **Omitted rather than published with a guessed meaning** — logged in Plan 2's open questions.

Next gate: **merge `plan-2-product-layer` into `main`**, then write Plan 3.

### Brainstorming checklist state

| # | Step | State |
|---|---|---|
| 1 | Explore project context | ✅ done |
| 2 | Ask clarifying questions | ✅ done |
| 3 | Offer visual companion | ✅ done — accepted, used for 4 screens |
| 4 | Propose approaches | ✅ done |
| 5 | Present design sections | ✅ IA, technical architecture and design system approved in conversation (spec §3, §4, §5). Gaps register (spec §7) written, not walked through. |
| 6 | Write design doc | ✅ written and committed (`d77837e`) |
| 7 | Spec self-review | ✅ done — 9 defects found and fixed |
| 8 | User reviews spec | ✅ approved (user proceeded to `/impeccable init`) |
| 9 | Invoke `writing-plans` | ✅ Plan 1 written — `docs/superpowers/plans/2026-08-10-litex-foundation-content-layer.md` |

Brainstorming is **complete**. `PRODUCT.md` is written, the impeccable detector hook is genuinely
enabled, and the spec is split into 5 sequential plans. Plan 1 (foundation & content layer) is
written and self-reviewed; plans 2–5 are outlined in its scope section and not yet written.

**Verified environment facts** (checked 2026-08-10, don't re-derive): Node v24.14.0 · npm 11.12.0 ·
**Astro 7.2.0** (not the 5.x the spec sketched) · content config at `src/content.config.ts` with
`z` imported from **`astro/zod`**, `glob` from `astro/loaders`, `defineCollection`/`reference` from
`astro:content` · zod 4.4.3, where single- and two-arg `z.record()` behave identically.

### Spec self-review findings (all fixed in place)

The review was not a formality — it caught one user-facing bug and two factual errors:

1. **`legacy` colour token failed WCAG AA** (4.19:1 on base, 4.02:1 on the `raised` surface it
   actually renders against). It carries the small `○ LEGACY · SAMPLING ONLY` label. Raised to
   `#7E858A` (5.03:1 on raised). Ratios are now computed, stated for both surfaces, and asserted in CI.
2. **IA tree still listed 4 application pages** after the shortlist was revised to 6 — the revision
   note was added but the tree beneath it was never updated. Automotive and Healthcare routes added.
3. **Legacy URL count was 24 in three places; it is 23**, verified against `archive/README.md`.
4. `copper` and `text-1` contrast figures were both overstated. Corrected.
5. Blog-post arithmetic was wrong (10 posts, not 7 or 5). Page count restated as 27 routes + 7 news.
6. Catalog extraction status was vague and inaccurate — now a table; **RFID text extraction is the
   priority**, since it is the only source for a route that has no content behind it.
7. One cross-reference pointed at §6 instead of §7.

---

## Decisions locked in (do not relitigate)

| Topic | Decision |
|---|---|
| Goals | Qualified inquiries **+** findability/credibility **+** technical self-serve reference — all three |
| Platform | New static site + own domain (**not** WordPress) |
| Content sourcing | Only what exists on the current site today; everything else → gaps register |
| IA | **Dual-entry** — products ↔ applications, cross-linked |
| Scope | **Full expansion** — 28 pages |
| Maintenance | Git-backed CMS (Sveltia) at `/admin` |
| Visual direction | **"Technical Instrument"** — dark, data-forward, copper accent |
| Typography | **Archivo + IBM Plex Mono** (Inter rejected — see below) |
| Applications | 4 evidenced ones only; automotive + medical excluded pending confirmation |
| Language | English at launch, i18n-ready |
| Content sourcing | Widened 2026-08-10 — LiTex's **Alibaba storefront** counts as a source alongside the site. Rule is *never invent*, not *never leave the domain*. Facts carry `sourceNote` + retrieval date. |
| Imagery | Three tiers: SVG technical diagrams are the primary visual language · AI-generated permitted for abstract/atmosphere (flagged `aiGenerated`) · **real photography only** for product, factory, machinery, personnel, certifications — enforced by build rule |
| Stack | Astro · Cloudflare Pages · Pages Function forms + Turnstile + KV · Cloudflare Web Analytics |

---

## impeccable

Installed this session via `npx impeccable install` → `.claude/skills/impeccable/`.
v3.5.0, Apache-2.0, by Paul Bakaus, `github.com/pbakaus/impeccable`.

- **Hooks are live** in `.claude/settings.local.json`: fast detector pass after
  `Edit|Write|MultiEdit`, deeper pass on `Stop`.
- **It already changed a decision.** Running the detector on the mockups flagged
  `overused-font: Inter` (7 instances). Correct critique — Inter was reflexive, not chosen.
  Replaced with **Archivo + IBM Plex Mono**, confirmed by the user.
- **Run the detector directly** (works without slash commands):
  ```
  node .claude/skills/impeccable/scripts/detect.mjs <file-or-dir-or-url>
  ```
- **Commands worth using later:** `audit` (a11y/perf gate in spec §4), `harden` (form edge cases),
  `adapt` (mobile), `clarify` (UX copy on the sample-request flow), `critique`, `live`.

### Why `/impeccable init` runs *after* the spec

`init` runs a multi-round discovery interview and writes `PRODUCT.md` (users, brand, principles),
which every other impeccable command then reads. Nearly all of that ground is already covered by
the spec. Running it after means it can absorb settled decisions instead of asking the user to
re-answer questions from this session.

---

## The original site is archived — do not re-fetch it

`archive/` holds a complete local copy captured 2026-08-10:

- `archive/pages/` — all 23 HTML pages
- `archive/catalogs/` — all 6 PDFs (11 MB) + `.txt` extractions
- `archive/images/` — all 46 images (29 MB)
- **`archive/extracted-from-images.md`** — the payload: spec tables, patents and feature lists
  transcribed out of JPGs into plain text
- `archive/README.md` — filename → original URL map, capture method

**This archive changed a decision.** `applications.jpg` and `cmy-applications.jpg` show LiTex
claiming **Automotive** and **Healthcare** applications — which had been excluded from the spec
as unevidenced. The evidence was inside a JPG. Spec §3 has been corrected: the shortlist is now
**six** applications, with Architecture, Agriculture and Loudspeaker coil-cords held pending
detail from LiTex.

**Still un-transcribed:** two catalogs are image-only PDFs with no text layer
(`2018-company-introduction.pdf`, `2018-wired-conductive-tape.pdf`) and need OCR or vision
reading. Three more have `.txt` extractions not yet folded into
`extracted-from-images.md` — including **`2018-rfid-textile-tape.pdf`, the only source for the
new RFID product page**.

## Environment notes

- **Git repo exists.** Initialised with `.gitignore` + `.gitattributes`; spec and full archive
  committed as `d77837e`.
- **Visual companion** was running on `http://localhost:51079` — it dies with the session restart.
  Mockups persist at `.superpowers/brainstorm/1097-1786371119/content/`:
  `visual-direction.html`, `information-architecture.html`, `design-system.html`, `typography.html`.
  Restart with:
  ```
  "C:/Users/Darson/.claude/plugins/cache/claude-plugins-official/superpowers/6.2.0/skills/brainstorming/scripts/start-server.sh" --project-dir "C:/Users/Darson/Projects/litex-website" --open
  ```
- **PDF extraction works** via `pdftotext -layout` (present at `/mingw64/bin/pdftotext`).
  `pypdf` is installed; `pdfplumber` is not. Only the heating-textile catalog has been extracted
  so far — five catalogs remain.

---

## Immediate risks to keep visible

Gaps register §7 was walked through with the user on 2026-08-10. **BLOCKERs went 4 → 3 → 1.**

**Only one blocker remains (2026-08-11):**

1. **301s need WordPress.com's paid Site Redirect upgrade.** Free plan cannot do it; without it the
   migration forfeits all existing search ranking. Must be arranged at cutover.

**Closed 2026-08-11 — do not reopen:**

- ~~No real email address.~~ **`sales@litex.com.tw` is the real inbound address.** Declared as
  `CONTACT_EMAIL` in `astro.config.mjs`; Plan 2's contact page must read it from there.
  `mail@example.com` is WordPress theme boilerplate and appears 4× on the archived contact page —
  a build test now asserts no page renders any `example.com` string.
- ~~Domain ownership unconfirmed.~~ **LiTex owns `litex.com.tw`.** `SITE_URL` is no longer a
  placeholder; canonicals resolve to `https://litex.com.tw/` (trailing slash, from
  `build.format: 'directory'` — which keeps the legacy-URL 301 map 1:1).

**No longer blockers:** the placeholder US address is confirmed theme boilerplate (it sits on the
same page as the real Taipei address — just delete it), and the RFID specs have been recovered from
the catalog into spec §6.

**Needs a human:** capturing `litex.en.alibaba.com` (supplier ID 234468551). It likely answers gap
items 5, 10, 11 and 13 in one pass. curl, WebFetch **and** headless Chrome all hit Alibaba's captcha
interception — verified, don't retry them. Needs a real browser session or a manual page save.

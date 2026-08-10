# LiTex Website Redesign — Design Spec

**Date:** 2026-08-10
**Status:** User has approved the information architecture (§3), technical architecture (§4)
and design system (§5), each in conversation. The content gaps register (§7) is written but has
not yet been walked through. The document as a whole has **not** been approved and is **not**
committed — no git repo exists yet.
**Source site:** https://litextextile.wordpress.com/ (24 URLs, WordPress.com free tier)

---

## 0. Context

**LiTex Textile & Technology Co., Ltd.** — Taipei, Taiwan. Founded 1999 as a spinoff of
Hen Hao Trading, a narrow-fabrics manufacturer. Weaves conductive and metal elements into
textile. Positioning line: *"We specialize in weaving conductive elements into textile."*

Contact of record: 188 Bangka Blvd., Wanhua Dist., Taipei, Taiwan 108 · +886-2-2308-4712 ·
Mon–Fri 09:00–18:00.

### Problems in the current site, ranked by damage

| # | Issue | Consequence |
|---|---|---|
| 1 | Contact page carries **placeholder data** — "10 Street Road, City, 10100, USA", `mail@example.com`, "(555) 555 1234" | Reads as abandoned or fraudulent at the exact moment of purchase intent. No real email address exists anywhere on the site. |
| 2 | **Spec data is baked into JPG images** | Invisible to search, unreadable on mobile, inaccessible to screen readers, uncopyable for a buyer's BOM |
| 3 | Six **2018 PDF catalogs** hold the best content on the site, unlinked from any product page | Real spec tables, REACH/RoHS/SGS claims and a competitive comparison table are effectively invisible |
| 4 | `litextextile.wordpress.com` subdomain + stock free theme | Reads as a hobby blog, not a 25-year manufacturer |
| 5 | News stalled at 2022; `test-post-blah` (2016) still live | Signals a dormant company |
| 6 | **RFID Textile Tape** has a catalog but no product page | Entire product invisible |
| 7 | URL cruft: `/about-2/`, `/patents-and-awards-2/`, `/silica-gel-switch-controller-2/` | Leftover WordPress artifacts |
| 8 | No certifications, MOQ, lead times, or sample policy surfaced | The exact criteria B2B buyers use to qualify a supplier |

---

## 1. Goals

Primary job of the site, per the user, is a combination of three mutually reinforcing outcomes:

1. **Generate qualified inquiries** — sample requests and RFQs from engineers, sourcing managers, OEM buyers.
2. **Be found and look credible** — rank for queries like *conductive yarn supplier Taiwan*, *EMI shielding woven sleeve*, and survive the credibility check on landing.
3. **Serve as a technical self-serve reference** — an engineer can spec LiTex material into a design without emailing first.

Brand repositioning is treated as a downstream effect, not a target.

**The engine:** real spec data creates the SEO surface → the SEO surface creates credibility →
credibility converts to RFQs. One engine, three outputs.

---

## 2. Decisions taken

| Decision | Choice | Rationale |
|---|---|---|
| Platform | **New static site + own domain** | Total design freedom, edge performance for EU/JP/US buyers, near-zero hosting cost |
| Content sourcing | **Only what exists on the current site today** (pages, images, and the 6 PDF catalogs) | User constraint. Everything missing goes on the gaps register in §6 rather than being invented. |
| IA | **Dual-entry** — products ↔ applications, cross-linked | Serves the engineer who knows the part *and* the buyer who only knows the problem |
| Scope | **Full expansion** | New application pages, technology pages, a real conversion flow |
| Maintenance | **Git-backed CMS** (Sveltia) at `/admin` | Staff get a login and WYSIWYG; output is a commit |
| Visual direction | **"Technical Instrument"** — dark, precise, data-forward | Chosen from 3 options. Carries credibility signals (REACH/RoHS/SGS/patents/since-1999) as first-class furniture so it serves buyers as well as engineers. |
| Typography | **Archivo + IBM Plex Mono** | Replaces Inter after the impeccable detector flagged it as an overused, undifferentiated default |
| Languages | **English only at launch**, i18n-ready routing and content layer | Current site is English-only and aimed at international buyers; Traditional Chinese addable later without rework |

---

## 3. Information architecture

```
/                                          Home — two doors: by product / by application
/products/                                 Catalog index + cross-product spec comparison
  /products/conductive-metal-yarn/                flagship
  /products/electrical-heating-textile/
  /products/emi-shielding-woven-tube/
  /products/braided-self-curling-tube/
  /products/wired-conductive-tape/
  /products/rfid-textile-tape/                    NEW — catalog exists, page never did
  /products/silica-gel-switch-controller/         legacy / sampling only
/applications/                             Index
  /applications/heated-apparel-wearables/
  /applications/cable-protection-emi-shielding/
  /applications/smart-textiles-rfid/
  /applications/industrial-woven-metal/
/technology/                               How CMY works — 1S / 1Z / 2S2Z structure explained
  /technology/heating-element-comparison/         CMY vs carbon fibre vs heating film vs steel fibre
/downloads/                                All 6 catalogs with real descriptions
/company/
  /company/about/
  /company/patents-and-awards/
  /company/certifications/                        needs LiTex input
/news/                                     Retained, justified by the CMS
/contact/                                  Real details + map + working form
/request-a-sample/                         Dedicated conversion page
/legal/privacy/
```

**28 pages, up from 24 URLs.** Composition changes completely: 7 dead blog posts become
4 application pages, 2 technology pages, and a real conversion flow.

### Application shortlist — revised 2026-08-10 after image extraction

> **This section was revised.** The original shortlist was 4 applications, with automotive and
> medical deliberately excluded for lack of evidence. That evidence existed — inside
> `images/applications.jpg` and `images/cmy-applications.jpg`, where LiTex publishes its own
> application claims as graphics. The exclusion was wrong and has been reversed. This is a
> concrete example of the core problem the redesign fixes: content trapped in images is invisible
> even to the people working on the site.

LiTex's own published claims, transcribed in `archive/extracted-from-images.md` §5:

- **Electrical heating textile:** Wearable Heating · Automotive industry · Healthcare · Architecture · Agriculture
- **Conductive Metal Yarn:** Healthcare · EMI Shielding · Heating Applications · Loudspeaker Coil-cords

**Build these six** — all evidenced, all with enough supporting material for a real page:

| Application | Evidence |
|---|---|
| Heated apparel & wearables | `applications.jpg`; two Wearable Expo posts; Tokyo Wearable Expo 2022; heating-textile catalog |
| Automotive interiors | `applications.jpg` ("Automotive industry") |
| Healthcare & therapeutic heating | `applications.jpg` and `cmy-applications.jpg` (both list Healthcare) |
| Cable protection & EMI shielding | `cmy-applications.jpg`; EMI tube + self-curling tube products; Düsseldorf Wire Show post |
| Smart textiles & RFID | RFID Textile Tape catalog; conductive tape copy "connect wearable devices" |
| Industrial woven metal | About page: "contracts requiring woven metal products for heavy industries" |

**Hold these three** — claimed by LiTex but with no supporting detail beyond a single icon, which
is not enough to write a page a buyer would trust:

- Architecture
- Agriculture
- Loudspeaker coil-cords — *the most specific and commercially interesting of the three; worth
  asking LiTex about first, since a named niche application is strong differentiation*

**Standing principle, unchanged:** publish only applications LiTex has itself claimed or confirmed.
An application page asserting an end-use the company cannot support is worse than no page, because
it fails under exactly the diligence a serious buyer applies.

### Redirect map — all 24 legacy URLs

| Old URL | New URL | Type |
|---|---|---|
| `/` | `/` | 301 |
| `/about-2/` | `/company/about/` | 301 |
| `/patents-and-awards-2/` | `/company/patents-and-awards/` | 301 |
| `/privacy-policy/` | `/legal/privacy/` | 301 |
| `/contact/` | `/contact/` | 301 |
| `/downloads/` | `/downloads/` | 301 |
| `/products/` | `/products/` | 301 |
| `/products/conductive-metal-yarn-cmy/` | `/products/conductive-metal-yarn/` | 301 |
| `/products/conductive-metal-yarn-cmy/electrical-heating-textile/` | `/products/electrical-heating-textile/` | 301 |
| `/products/emi-shielding-woven-tube/` | `/products/emi-shielding-woven-tube/` | 301 |
| `/products/braided-self-curling-tube/` | `/products/braided-self-curling-tube/` | 301 |
| `/products/wired-conductive-tape/` | `/products/wired-conductive-tape/` | 301 |
| `/products/silica-gel-switch-controller-2/` | `/products/silica-gel-switch-controller/` | 301 |
| `/2018/12/06/new-electrical-heating-alternatives-to-consider/` | `/technology/heating-element-comparison/` | 301 |
| `/2018/02/26/catalog-download/` | `/downloads/` | 301 |
| `/2022/01/21/tokyo-wearable-expo-2022/` | `/news/tokyo-wearable-expo-2022/` | 301 |
| `/2020/05/20/new-braided-self-curling-tube-item/` | `/news/new-braided-self-curling-tube/` | 301 |
| `/2018/02/26/dusseldorf-wire-show/` | `/news/dusseldorf-wire-show/` | 301 |
| `/2017/06/26/featured-on-techtextil-blog/` | `/news/featured-on-techtextil-blog/` | 301 |
| `/2017/02/23/copper-nickel-1s1z/` | `/news/copper-nickel-1s1z/` | 301 |
| `/2017/02/23/litex-attending-techtextil-at-frankfurt-germany/` | `/news/techtextil-frankfurt/` | 301 |
| `/2017/02/23/a-rewarding-experience-at-the-wearable-expo/` | `/news/wearable-expo/` | 301 |
| `/2016/09/22/test-post-blah/` | — | **410 Gone** |

`test-post-blah` is deliberately killed rather than redirected. A 301 transfers value;
a 410 tells search engines to drop the URL. Redirecting junk to the homepage dilutes
relevance signals.

> ⚠️ **Migration risk, outside the build.** Issuing real 301s *from* `litextextile.wordpress.com`
> requires WordPress.com's paid Site Redirect upgrade — the free plan cannot do it. Without it,
> the old subdomain retains its ranking and passes none of it to the new domain. This is a paid
> step on WordPress's side that must happen at cutover.

---

## 4. Technical architecture

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Astro** | Zero JS by default; content collections give typed, validated content |
| Content | Markdown + YAML in `src/content/` | Diffable, portable, no database |
| CMS | **Sveltia CMS** at `/admin` | Git-backed; staff get a login, output is a commit |
| Hosting | **Cloudflare Pages** | Free tier, PoPs in Taipei/Frankfurt/Tokyo, native `_redirects` support |
| Forms | Cloudflare Pages Function + Turnstile | No third-party form vendor, no recurring fee |
| Analytics | Cloudflare Web Analytics | Cookieless — no consent banner, matters for EU buyers |
| Fonts | Self-hosted, subset (Archivo, IBM Plex Mono) | ~15–30 KB total, no third-party request, no CDN dependency |

### Core principle: specs are data, not prose

Every spec value lives in structured YAML behind a validated schema. Never in a paragraph,
never in an image.

```ts
// src/content.config.ts  (sketch — exact API pinned at implementation against installed Astro version)
const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    name: z.string(),
    status: z.enum(['active', 'legacy']),
    summary: z.string().max(160),            // doubles as meta description
    applications: z.array(reference('applications')),
    certifications: z.array(z.enum(['REACH', 'RoHS', 'SGS'])).default([]),
    catalogPdf: z.string().optional(),
    specTable: z.object({
      columns: z.array(z.object({ key: z.string(), label: z.string(), unit: z.string().optional() })),
      rows: z.array(z.record(z.string())),
    }).optional(),
    sourceNote: z.string().optional(),        // provenance: which PDF / page each figure came from
  }),
});
```

Four consequences fall out for free:

1. The **comparison table on `/products/`** is generated from the same data — it cannot drift.
2. `applications: [...]` is a **typed reference**, so the dual-entry cross-linking is automatic and
   bidirectional. A broken link fails the build instead of shipping.
3. **JSON-LD `Product` schema** is emitted from the same object.
4. **`sourceNote`** records provenance, so when LiTex corrects a figure it is obvious what is being
   corrected and where it came from.

### Deliberately not built (YAGNI)

- **No site search** — 28 pages; navigation is faster and search is pure maintenance burden.
- **No quote calculator** — pricing is quote-based; a calculator would be theatre.
- **No React/Vue** — only interactive elements are a nav toggle, a spec-table filter, and the form.
- **No blog categories/tags/archives** — five posts; flat reverse-chronological is correct.

### Contact form — failure modes

Static hosting cannot process forms, so this is a Pages Function handling three failure modes:

- **Validation failure** → inline field errors, no page reload.
- **Spam** → Cloudflare Turnstile + honeypot field.
- **Email delivery failure** → the dangerous one. A silently dropped RFQ is a lost customer who
  believes they were ignored.

**Mitigation:** the function writes every submission to Cloudflare KV *before* attempting delivery.
If email fails, the submission still exists, and the user sees an honest error with the direct email
address as fallback — never a fake success message. Store first, then attempt delivery, treat
delivery as retryable.

### Verification

- **Build fails on:** schema violation, broken internal link, broken `reference()`.
- **CI asserts:** all 24 legacy URLs resolve against the redirect map.
- **Budgets:** Lighthouse performance / a11y / SEO ≥ 95.
- **Accessibility:** axe checks on one representative page per template type.
- **Design:** impeccable detector runs on UI file writes (hook) plus a deep pass on stop.

---

## 5. Design system — "Technical Instrument"

### Colour tokens

| Token | Value | Contrast on base | Use |
|---|---|---|---|
| `base` | `#0A0C0D` | — | Page background |
| `raised` | `#0F1213` | — | Cards, table rows |
| `line` | `#1E2325` | — | Borders, rules |
| `text-1` | `#F2F1EF` | 17.6:1 | Primary text |
| `text-2` | `#9AA0A5` | 7.4:1 | Secondary text |
| `copper` | `#C87941` | 6.6:1 | Accent, labels, large text — **never body copy at small sizes** |
| `copper-lift` | `#E09B62` | — | Hover |
| `in-production` | `#4FB286` | — | Active product status |
| `legacy` | `#6E757A` | — | Legacy product status |
| `paper` | `#FFFFFF` | — | Print / light stylesheet |

Copper is the accent because **tinned copper is literally the material in CMY**. Accent colours
drawn from the product survive scrutiny better than colours picked from a palette generator.

Contrast ratios are committed at token level specifically to avoid the classic dark-UI failure:
fashionable low-contrast grey that fails WCAG AA and fails real buyers on uncalibrated office
monitors and projectors.

### Typography

- **Archivo** — display and UI. Grotesk built for high-performance print and signage; weight and
  squared-off confidence without shouting.
- **IBM Plex Mono** — part numbers, spec values, labels. Literal engineering heritage, narrow
  enough for dense spec tables.
- **Scale:** 10 · 12 · 14 · 16 · 20 · 26 · 34 · 40 · 56
- **Rule:** monospace is reserved for anything with a *measured value* — part numbers, dimensions,
  resistances, labels. Prose is Archivo. Effect: an engineer can scan a page and find the numbers
  without reading a word. The rule is self-enforcing — if an element is ambiguous, ask "does this
  have units?"

Inter was the original choice and was **rejected** after the impeccable detector flagged it
(`overused-font`, 7 instances). Correct critique: for a company whose pitch is *we make something
nobody else can weave*, a stock UI face quietly contradicts the message.

### Key components

1. **Spec table** — the signature component. Generated from YAML. Carries a provenance note
   ("source: 2018 catalog p.3"), **Copy as CSV**, **Datasheet PDF**, and **Request this grade**.
   Copy-as-CSV matters because the realistic path is: engineer finds page → pastes values into a
   comparison spreadsheet next to two competitors. Painful copying means retyping, errors, or a
   competitor who made it easy.
2. **Print / light stylesheet** for spec tables — industrial procurement prints and PDFs things
   constantly. Carries the LiTex wordmark, canonical URL, compliance line and phone number.
3. **Product card** with explicit status — `● IN PRODUCTION` / `○ LEGACY · SAMPLING ONLY`. Lets the
   Silica Gel Switch keep its search value while being honest about availability.
4. **Credibility bar** — REACH · RoHS · SGS TESTED · PATENTED TW 1M545145 · MANUFACTURING SINCE 1999.
   Carried over from the rejected "Swiss Industrial" direction so the dark theme still serves
   sourcing managers, not just design engineers.

---

## 6. Content extracted from existing sources

> **The original site is now archived locally at `archive/`** — all 23 pages, all 6 PDF catalogs,
> all 46 images. There is no need to re-fetch anything from wordpress.com. The transcriptions of
> data previously trapped in images live in **`archive/extracted-from-images.md`**, which is the
> primary source for building product pages. It contains, among other things, the **stainless
> steel yarn spec table**, the **complete patent list**, and the **HT001 silicon switch
> specifications** — none of which existed as text anywhere on the original site.
>
> A summary of the highest-value extractions follows; the archive file is authoritative.

### Conductive Metal Yarn — copper foil grades
*Source: `2018-non-carbon-electrical-heating-textile.pdf`, extracted via `pdftotext -layout`*

| Item | Coverings | Ø no coating (mm) | Ø coated (mm) | Resistance (Ω/M) | Toughness |
|---|---|---|---|---|---|
| 010/N(K)30'*3/1S | 1 | 0.27±0.02 | 0.47±0.05 | ~4.4 | Weaker |
| 010/N(K)30'*3/1S1Z | 2 | 0.33±0.02 | 0.62±0.05 | ~2.5 | ↓ |
| 010/N(K)30'*3/2S2Z | 4 | 0.53±0.02 | 0.75±0.05 | ~1.4 | ↓ |
| 010/N(K)30'*3/3S3Z | 6 | 0.55±0.02 | 0.84±0.05 | ~1 | ↓ |
| 010/N(K)30'*3/4S4Z | 8 | 0.65±0.02 | — | ~0.8 | Stronger |

Coverings are tinned copper. Coating options: PU, FEP (Teflon). Copper-nickel (CuNi) noted as
"coming soon" as of 2018 — **status must be confirmed**.

### Claims recoverable from the PDFs (not currently on the website)

REACH compliant · RoHS compliant · SGS test certified toughness · patented technology ·
even and stable heating · flame retardant and heat resistant · excellent breathability ·
flexibility to cover uneven objects · customizable fabric width up to 70 cm · waterproof
varieties available · ODM/OEM welcome · sturdy connector manufacturing service available ·
"can use almost any metal alloy" · up to eight strands manufactured simultaneously.

### Competitive comparison (becomes `/technology/heating-element-comparison/`)

| Heating element | Material characteristics | Manufacturing process |
|---|---|---|
| Carbon fibre | Brittle, easy breakage | Mostly manual labour |
| Flexible printed circuit / heating film | Thin board, easy to snap | Special equipment, high operating cost |
| Stainless steel fibre | Filament bundle frays easily | Mostly manual labour |
| **Conductive Metal Yarn** | Coiled design offers flexibility *and* strength | Loom-made, easily mass manufactured |

### The six existing catalogs

| Catalog | File |
|---|---|
| About Us / company introduction | `2018-company-introduction.pdf` |
| Electrical Heating Textile | `2018-non-carbon-electrical-heating-textile.pdf` |
| Wired Conductive Tape | `2018-wired-conductive-tape.pdf` |
| Cable EMI Shielding Tube | `2018-emi-shielding-wire-tube.pdf` |
| Silicon Switch with Temperature Sensor | `201611e68ea7e588b6e599a8final.pdf` — marked out of production, available for sampling |
| RFID Textile Tape | `2018-rfid-textile-tape.pdf` — **no corresponding web page exists** |

Only remaining catalogs still need extraction; the heating-textile one is done (above).

---

## 7. Content gaps register — what LiTex must supply

Ordered by blocking severity. Items marked **BLOCKER** prevent a credible launch.

| # | Needed | Why | Severity |
|---|---|---|---|
| 1 | **A real email address** | None exists anywhere on the current site. Cannot ship a B2B site without one. | **BLOCKER** |
| 2 | **Confirm/remove the placeholder US address** ("10 Street Road, City, 10100, USA", `mail@example.com`, "(555) 555 1234") | Is this a real second office or theme boilerplate? Almost certainly boilerplate. | **BLOCKER** |
| 3 | **Domain ownership** — does LiTex own `litex.com.tw` or equivalent? | Gates the entire migration | **BLOCKER** |
| 4 | **WordPress.com admin access** + budget for the paid Site Redirect upgrade | Without it the migration forfeits existing search ranking | **BLOCKER** |
| 5 | **Certification documents** — SGS test reports, REACH/RoHS declarations, with dates and scope | Currently a claim on page 1 of a PDF. European/Japanese procurement uses these as a hard filter. | High |
| 6 | **Patent status re-confirmation** — the full list is now recovered (see `archive/extracted-from-images.md` §2), but "pending" applications date from 2010–2011 and have since been granted or abandoned | Publishing a 15-year-old "pending" status is worse than publishing nothing | High |
| 7 | **Product line confirmation** — is everything still manufactured? Is CuNi (2018 "coming soon") now shipping? | Prevents publishing a catalog of products that no longer exist | High |
| 8 | **RFID Textile Tape specs** | Only the PDF exists; the new page needs real data | High |
| 9 | **Detail for Architecture, Agriculture and Loudspeaker coil-cord applications** | LiTex claims all three in `applications.jpg` / `cmy-applications.jpg` but with only an icon each — not enough to write a credible page. Loudspeaker coil-cords is the most commercially interesting; ask about it first. | High |
| 10 | **MOQ, lead times, sample policy** | The questions every RFQ opens with | High |
| 11 | **Hi-res photography** — macro fabric shots, product shots, loom/factory floor | The dark direction relies on strong macro imagery; there is currently none usable | High |
| 12 | **Vector logo (SVG)** | Current mark is a raster from the WordPress theme | Medium |
| 13 | **Company facts** — factory location(s), headcount, capacity, ISO certifications if any | `/company/about/` is currently three sentences | Medium |
| 14 | **News since 2022** | Feed is 4 years stale; the CMS only helps if someone posts | Medium |
| 15 | **Updated catalogs** — current set is 2018 | Downloads page is offering 8-year-old documents | Medium |
| 16 | **Traditional Chinese copy** | Only if/when bilingual is wanted; architecture will be ready | Low |

---

## 8. Open questions

- Whether to run `/impeccable init` before or after implementation planning — **decided: after this
  spec is approved**, so its PRODUCT.md consumes decisions already made rather than re-interviewing.
- Git repository not yet initialised (`litex-website` was an empty directory). Recommend `git init`
  plus a `.gitignore` covering `.superpowers/`, `node_modules/`, `dist/`, `.astro/` before
  implementation begins.

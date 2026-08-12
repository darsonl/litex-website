# LiTex Website Redesign — Design Spec

**Date:** 2026-08-10
**Status:** User has approved the information architecture (§3), technical architecture (§4)
and design system (§5), each in conversation. The content gaps register (§7) is written but has
not yet been walked through. Committed to git (`d77837e`). Spec self-review complete — see the
revision note below. The document as a whole is **awaiting user approval**, which is the gate
before implementation planning begins.

**Self-review revisions, 2026-08-10** — nine defects found and fixed in place: the `legacy` colour
token failed WCAG AA and was corrected (§5); the IA tree still listed 4 application pages after the
shortlist was revised to 6 (§3); the legacy-URL count was 24 in three places and is 23 (§0, §3, §4);
the blog-post arithmetic was wrong (§3, §4); the catalog extraction status was inaccurate (§6); and
one cross-reference pointed at the wrong section (§2).
**Source site:** https://litextextile.wordpress.com/ (23 URLs, WordPress.com free tier)

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
| Content sourcing | **Only what LiTex has itself published** — the current site (pages, images, 6 PDF catalogs) **and its own Alibaba storefront** | User constraint, widened 2026-08-10. The rule's purpose is *never invent content*, not *never leave the domain*. The storefront at `litex.en.alibaba.com` is LiTex's own self-authored commercial copy, linked from the About page. Every fact taken from it carries a `sourceNote` naming the source and retrieval date, and must still be confirmed by LiTex before launch. Everything missing goes on the gaps register in §7 rather than being invented. |
| IA | **Dual-entry** — products ↔ applications, cross-linked | Serves the engineer who knows the part *and* the buyer who only knows the problem |
| Scope | **Full expansion** | New application pages, technology pages, a real conversion flow |
| Maintenance | **Git-backed CMS** (Sveltia) at `/admin` | Staff get a login and WYSIWYG; output is a commit |
| Visual direction | **"Technical Instrument"** — dark, precise, data-forward | Chosen from 3 options. Carries credibility signals (REACH/RoHS/SGS/patents/since-1999) as first-class furniture so it serves buyers as well as engineers. |
| Typography | **Archivo + IBM Plex Mono** | Replaces Inter after the impeccable detector flagged it as an overused, undifferentiated default |
| Languages | **English at launch**, i18n-ready routing and content layer | EU is the priority market and English is the working language of European industrial procurement, so it is correct at launch rather than a compromise. German is the most plausible later addition; the routing stays i18n-shaped because that costs nothing. |
| Priority market | **Europe (EU)** | Confirmed 2026-08-10. Agrees with all documented evidence — Techtextil Frankfurt, Düsseldorf Wire Show, and the REACH/RoHS/SGS claims already made. Japan secondary. |
| Primary user | **The design engineer**, when engineer and sourcing manager conflict | Confirmed 2026-08-10. The engineer creates the requirement the buyer later sources, and the "specs are data" architecture exists to serve them. Credibility signals stay present but subordinate. |
| Client channel | **Informal and slow** | Confirmed 2026-08-10. Answers from LiTex arrive partially or not at all, so no page may depend on a reply. Designing around an open gap is the default, not the fallback. |

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
  /applications/automotive-interiors/
  /applications/healthcare-therapeutic-heating/
  /applications/cable-protection-emi-shielding/
  /applications/smart-textiles-rfid/
  /applications/industrial-woven-metal/
/technology/                               How CMY works — 1S / 1Z / 2S2Z structure explained
  /technology/heating-element-comparison/         CMY vs carbon fibre vs heating film vs steel fibre
/downloads/                                All 6 catalogs with real descriptions
/company/                                  Hub page — links the three below, carries the
                                           credibility bar. Not a bare path segment.
  /company/about/
  /company/patents-and-awards/
  /company/certifications/                        needs LiTex input
/news/                                     Index. Retained, justified by the CMS
  /news/<slug>/  × 7                              the 7 posts kept from the old blog
/contact/                                  Real details + map + working form
/request-a-sample/                         Dedicated conversion page
/legal/privacy/
```

**27 fixed routes + 7 news posts = 34 pages, up from 23 legacy URLs.**

The old site had **10 blog posts**, and the composition change is where the value is: 7 are kept
as real news entries, `new-electrical-heating-alternatives` is promoted to
`/technology/heating-element-comparison/` (it was always a technology page misfiled as a post),
`catalog-download` collapses into `/downloads/`, and `test-post-blah` is killed. The genuinely new
surface is 6 application pages, 2 technology pages, an RFID product page, a certifications page,
and a conversion flow — none of which exist today.

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

### Redirect map — all 23 legacy URLs

*Verified against `archive/README.md`: the 23 rows below are exactly the 23 pages captured in
`archive/pages/`. Earlier drafts of this spec said 24; that figure was wrong.*

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

**How the seven news rows were built — decided 2026-08-12, implemented in Plan 6.** All seven
`/news/<slug>/` routes exist at exactly the slugs above. Four decisions were taken after reading
all ten archived posts, and are recorded here so they are not rediscovered and reopened:

1. **`test-post-blah` has real content and is killed anyway.** Its title is *"LiTex Attending
   Wearable Expo"* and its body is genuine prose — the junk is the slug, not the post. It is still
   sentenced to 410 because it pre-announces the very expo that `/news/wearable-expo/`
   (2017-02-23) thanks visitors for, so nothing of substance is lost. There is no eighth post to
   recover. Do not revisit this row.
2. **No third-party event imagery is republished.** Six of the seven posts' only images are trade
   show organizers' marks (Messe Frankfurt, Wearable Expo, Messe Düsseldorf) or a screenshot of a
   third-party blog. LiTex's usage grant covers its own photography, not those. `/news/` ships
   exactly one photograph, LiTex's own.
3. **The 2017 TechTextil blog article is not linked.** `techtextil-blog.com` now serves a
   certificate for `*.messefrankfurt.com`, so the original link throws a TLS warning. The path is
   recorded as plain text in that post's `sourceNote`; a Wayback capture (2022-05-19) exists but
   was never content-verified, so nothing is linked.
4. **Titles are normalized, two typos corrected, and nothing claims to be verbatim.** Every
   archived title carried U+00A0 (WordPress widow-prevention), normalized to a normal space;
   U+2019 apostrophes are preserved. Two grammatical errors in `featured-on-techtextil-blog` are
   corrected and disclosed in its `sourceNote`.

`/news/` is framed as an **archive with a computed date range**, not a live feed — which is what
makes the gap since January 2022 honest rather than the "dormant company" signal of §0 problem 5.
It does not close the gap; see §7 item 14.

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
- **No blog categories/tags/archives** — seven posts; flat reverse-chronological is correct.

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
- **CI asserts:** all 23 legacy URLs resolve against the redirect map, and every colour token
  used for text clears 4.5:1 against `raised` (see §5).
- **Budgets:** Lighthouse performance / a11y / SEO ≥ 95.
- **Accessibility:** axe checks on one representative page per template type.
- **Design:** impeccable detector runs on UI file writes (hook) plus a deep pass on stop.

---

## 5. Design system — "Technical Instrument"

### Colour tokens

| Token | Value | On `base` | On `raised` | Use |
|---|---|---|---|---|
| `base` | `#0A0C0D` | — | — | Page background |
| `raised` | `#0F1213` | — | — | Cards, table rows |
| `line` | `#1E2325` | 1.23:1 | 1.18:1 | Borders, rules — **decorative only**, never the sole carrier of meaning |
| `text-1` | `#F2F1EF` | 17.37:1 | 16.67:1 | Primary text |
| `text-2` | `#9AA0A5` | 7.42:1 | 7.12:1 | Secondary text |
| `copper` | `#C87941` | 5.85:1 | 5.61:1 | Accent, labels, headings — passes AA at all sizes; reserved for accent by choice, not by limit |
| `copper-lift` | `#E09B62` | 8.43:1 | 8.09:1 | Hover |
| `in-production` | `#4FB286` | 7.51:1 | 7.21:1 | Active product status |
| `legacy` | `#7E858A` | 5.24:1 | 5.03:1 | Legacy product status |
| `paper` | `#FFFFFF` | — | — | Print / light stylesheet |

**Every ratio above is computed, not estimated**, and both columns are given because the signature
component — the spec table — renders on `raised`, which is lighter than `base` and therefore the
worse case. Any token used for text must clear 4.5:1 **in the `raised` column**, not just `base`.

> **Two corrections from the spec self-review.** `legacy` was `#6E757A`, which measures 4.19:1 on
> `base` and 4.02:1 on `raised` — a WCAG AA failure, in the exact category §5 warns against. It
> carries the `○ LEGACY · SAMPLING ONLY` label, which is small text, so the failure was real and
> user-facing. Raised to `#7E858A`. Separately, `copper` was stated as 6.6:1 and `text-1` as
> 17.6:1; both were wrong (5.85 and 17.37). Copper still passes AA for normal text, so the
> restriction on it is a design choice rather than a contrast limit — stated as such above.

**Implementation requirement:** these ratios are asserted in CI against the token file, so a future
palette edit that breaks AA fails the build instead of shipping. This is the mechanism that keeps
the numbers above from drifting back into decoration.

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

### Imagery policy

LiTex has **no usable photography** — the current homepage runs a Pexels stock photo. The direction
must therefore work at full quality with zero photographs, using AI-generated imagery where it is
safe and diagrams where it is better. Three tiers, with a hard boundary between them.

**Tier 1 — SVG technical diagrams. The primary visual language.**
Yarn structure (1S / 1Z / 2S2Z / 3S3Z covering counts), weave geometry, tape cross-sections, EMI
tube construction, integration methods. Drawn from the spec data in §6, so they are accurate by
construction. They theme, scale, print, stay legible at any size, and cost kilobytes. For a product
whose selling point is a structure nobody else can weave, **a correct diagram outperforms any
photograph** — it shows the thing the photograph would obscure.

**Tier 2 — AI-generated imagery. Permitted, bounded, declared.**
Allowed for: abstract texture and background fields, atmospheric application-context scenes
(a heated garment in use, a cable run, a workshop mood), editorial headers, and section dividers.
Every such asset carries `aiGenerated: true` in its content entry, and the CMS surfaces the flag so
staff cannot lose track of which images are synthetic.

**Tier 3 — Real photography only. AI is forbidden here.**
Any image that depicts, or lets a viewer infer, **LiTex's actual product, material close-ups,
factory, machinery, personnel, or certification documents**. Two reasons, both hard:

1. **Credibility.** The site's foundational problem (§0 item 1) is that it reads as untrustworthy.
   A sourcing manager who identifies a synthetic "macro shot of our CMY yarn" destroys exactly the
   trust this project exists to rebuild — and destroys it worse than the placeholder address did,
   because it looks deliberate rather than neglectful.
2. **Accuracy.** Image models cannot render helical covering structure correctly. The covering count
   and S/Z handedness *are* the product specification. A generated close-up would show plausible
   yarn with wrong geometry, and the engineer this site is written for will notice.

**Enforced, not just stated:** the image schema carries `aiGenerated: boolean`, and the build fails
if an asset with `aiGenerated: true` is used as a product-page hero, inside a spec table, or on
`/company/` or `/technology/`. The policy is a build rule, not a good intention.

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
4. **Credibility bar** — REACH · RoHS · SGS TESTED · TW UTILITY MODEL M545145 · MANUFACTURING SINCE 1999.

   > **Corrected 2026-08-11 — do not restore the original wording.** This line read
   > "PATENTED TW 1M545145". Both halves were wrong. The number is malformed: the register
   > shows **TWM545145U**, *"Elastic ribbon having extensible electronic device"*, filed
   > 2017-03-20 by 富鉅紡織科技股份有限公司 (an exact match for LiTex's registered name, so
   > the patent is certainly theirs); the leading "1" is a transcription artifact from
   > `archive/images/patents-and-awards.jpg`. And "PATENTED" asserts a right currently in
   > force, which is not established — sibling patent **TWM371733 lapsed for non-payment on
   > 2017-10-01**, and **US 12/787,378 was abandoned on 2012-04-23** for failure to respond
   > to an office action, so it never granted at all. Verified against Google Patents.
   > Restore a stronger claim only on LiTex's confirmation of renewal status.
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

### RFID Wired Woven Tape — recovered 2026-08-10
*Source: `2018-rfid-textile-tape.pdf` via `pdftotext -layout`. This is the entire content basis for
`/products/rfid-textile-tape/`, a page that has never existed.*

Narrow textile tape with conductive wires woven in, providing RFID tag antenna reception. RFID chip
can be fixed to the tape with epoxy. Integration by hot-melt adhesive or sewing. Selvage edge
prevents fraying. All specifications customisable; OEM and ODM offered.

| Tape | Value |
|---|---|
| Width | 20 mm |
| Material | Polyester |
| Elasticity | 0% |
| Weave geometry | wavelength 1.8 cm · 2 × amplitude 1.5 cm · width 2 cm |

| Conductive core | Wire type 1 | Wire type 2 |
|---|---|---|
| Material | Copper | Stainless 316L |
| Max resistance @20° | 326.2 Ω/km | 1400 Ω/km |
| Max current | 0.2 A | — |
| Filaments | — | 275 × 2 |
| Orientation | S | — |
| Outer diameter | 0.631–0.633 mm | 0.95 mm |
| Covering | TPU, black | TPU, black |

> ⚠️ **Verify before publishing.** `pdftotext -layout` misaligned this table's label and value
> columns by one row; the pairings above are reconstructed by reading the offset, not read directly.
> They must be confirmed against the PDF by eye (or vision model) before going into `specTable`
> YAML. A mis-paired spec table is worse than no page — it is exactly the failure §0 item 2 is
> meant to end.

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

**Extraction status — verified against `archive/catalogs/` on 2026-08-10:**

| Catalog | Text layer | Folded into `extracted-from-images.md`? |
|---|---|---|
| `2018-non-carbon-electrical-heating-textile.pdf` | ✅ 4.5 KB | ✅ done — §7, §8 above |
| `201611e68ea7e588b6e599a8final.pdf` (silicon switch) | ✅ 4.4 KB | ⬜ **not yet** |
| `2018-emi-shielding-wire-tube.pdf` | ✅ 2.5 KB | ⬜ **not yet** |
| `2018-rfid-textile-tape.pdf` | ✅ 2.5 KB | ⬜ **not yet — highest priority** |
| `2018-company-introduction.pdf` | ❌ image-only | needs OCR or vision reading |
| `2018-wired-conductive-tape.pdf` | ❌ image-only | needs OCR or vision reading |

RFID is the priority because `2018-rfid-textile-tape.pdf` is the **only** source for
`/products/rfid-textile-tape/`, a page that has never existed. Without folding it in, that route
in §3 has no content behind it. Three extractions are a mechanical step (the text already exists);
the two image-only catalogs are the genuinely unresolved ones.

---

## 7. Content gaps register — what LiTex must supply

Ordered by blocking severity. Items marked **BLOCKER** prevent a credible launch.

| # | Needed | Why | Severity |
|---|---|---|---|
| 1 | **A real email address** | Verified 2026-08-10: the only address on the site is `mail@example.com`, appearing 4× on `/contact/`. Every email inquiry sent through this site has gone nowhere. LiTex's *one* working inbound channel today is Alibaba messaging — which is also a reason `/contact/` should link the storefront rather than pretend it doesn't exist. | **BLOCKER** |
| 2 | ~~Confirm/remove the placeholder US address~~ — **resolved by evidence, courtesy check only** | Verified 2026-08-10: `archive/pages/contact.html` carries the fake US block ("10 Street Road, City, 10100, USA" ×3, `(555) 555 1234` ×3, `mail@example.com` ×4) **simultaneously with** the real Bangka Blvd address and `2308-4712`. A genuine second office is not called "10 Street Road". This is theme boilerplate: delete it, and mention it to LiTex rather than wait on them. | ~~BLOCKER~~ → Low |
| 3 | **Domain ownership** — does LiTex own `litex.com.tw` or equivalent? | Gates the entire migration | **BLOCKER** |
| 4 | **WordPress.com admin access** + budget for the paid Site Redirect upgrade | Without it the migration forfeits existing search ranking | **BLOCKER** |
| 5 | **Certification documents** — SGS test reports, REACH/RoHS declarations, with dates and scope | Currently a claim on page 1 of a PDF. European/Japanese procurement uses these as a hard filter. | High |
| 6 | **Patent status re-confirmation** — the full list is now recovered (see `archive/extracted-from-images.md` §2), but "pending" applications date from 2010–2011 and have since been granted or abandoned | Publishing a 15-year-old "pending" status is worse than publishing nothing | High |
| 7 | **Product line confirmation** — is everything still manufactured? Is CuNi (2018 "coming soon") now shipping? | Prevents publishing a catalog of products that no longer exist | High |
| 8 | ~~RFID Textile Tape specs~~ — **largely recovered**; needs eye-verification, then LiTex confirmation | Full spec set extracted from the catalog on 2026-08-10 (see §6). Enough to build the page. Two caveats: the extracted table's columns were misaligned and must be checked against the PDF, and the data is 8 years old, so it folds into item 7's product-line confirmation. | ~~High~~ → Medium |
| 8b | **Manual capture of the Alibaba storefront** (`litex.en.alibaba.com`, supplier ID 234468551) | Approved as a source (§2). It plausibly answers items 5, 10, 11 and 13 in one pass — Alibaba profiles publish MOQ, lead time, sample policy, headcount, factory size, main markets and certifications as standard fields. **Cannot be fetched automatically:** curl, WebFetch and headless Chrome all hit Alibaba's captcha interception (verified 2026-08-10). Needs a human browser session — either LiTex's own login or a manual page save into `archive/`. | High |
| 9 | **Supporting detail for 5 under-evidenced applications** — Automotive interiors and Healthcare (in the build set), plus Architecture, Agriculture and Loudspeaker coil-cords (held) | All five rest on a single icon in `applications.jpg` / `cmy-applications.jpg`. That is enough to justify a route but not to fill it: a page asserting an end-use LiTex cannot substantiate fails exactly the diligence a serious buyer applies. Automotive and Healthcare are **blocking their own pages** — the routes are in §3 but cannot ship empty. Loudspeaker coil-cords is the most commercially interesting of the held three; ask about it first. | High |
| 10 | **MOQ, lead times, sample policy** | The questions every RFQ opens with | High |
| 11 | **Hi-res photography** — macro fabric shots, product shots, loom/factory floor | **No longer blocks the build.** The imagery policy in §5 makes SVG diagrams the primary visual language and permits AI-generated atmosphere, so the site reaches full quality with zero photographs. Real photography is still wanted, because Tier 3 (product close-ups, factory, machinery, personnel) is reserved for it and cannot be filled any other way — those slots stay empty until LiTex supplies images. | ~~High~~ → Medium |
| 12 | **Vector logo (SVG)** | Current mark is a raster from the WordPress theme | Medium |
| 13 | **Company facts** — factory location(s), headcount, capacity, ISO certifications if any | `/company/about/` is currently three sentences | Medium |
| 14 | **News since 2022** | Feed is 4 years stale; the CMS only helps if someone posts | Medium |
| 15 | **Updated catalogs** — current set is 2018 | Downloads page is offering 8-year-old documents | Medium |
| 16 | **Second-language copy** | With EU confirmed as the priority market, English is correct at launch — it is the working language of European industrial procurement. German is the most plausible addition if one is ever made; Traditional Chinese is domestic-only and not planned. Routing stays i18n-ready. | Low |
| 17 | ~~North American certification status — UL, FCC, CPSIA, Prop 65~~ — **withdrawn 2026-08-10** | Raised while North America was the target market. **EU is now the priority**, so REACH, RoHS and SGS are the correct regulatory regime and LiTex already claims all three. No new certification class is needed. The remaining certification work is item 5 — getting the actual documents — not acquiring new approvals. | Withdrawn |

---

## 8. Open questions

- Whether to run `/impeccable init` before or after implementation planning — **decided: after this
  spec is approved**, so its PRODUCT.md consumes decisions already made rather than re-interviewing.
- ~~Git repository not yet initialised.~~ **Resolved** — repo initialised, `.gitignore` and
  `.gitattributes` in place, spec and archive committed as `d77837e`.
- **Applications: 6 pages, 3 held.** Automotive interiors and Healthcare are now in the build set
  on the strength of LiTex's own graphics alone (`applications.jpg`). That is enough to justify the
  route, but each page still needs real supporting detail from LiTex before it ships — an
  application page backed by one icon fails the same diligence test §3 warns about. Tracked as gaps
  register item 9, which should be widened to cover all five under-evidenced applications, not just
  the three held.

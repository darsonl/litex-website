# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

**Astro · Cloudflare Pages · Sveltia CMS · Cloudflare Pages Functions + Turnstile + KV ·
Cloudflare Web Analytics.** Decided in the design spec
(`docs/superpowers/specs/2026-08-10-litex-website-redesign-design.md` §4), not delegated.
Content is Markdown + YAML in `src/content/` behind validated schemas; no database.

## Users

**Primary: the design engineer specifying material into a product.** Confirmed as the tiebreaker
user — when their needs conflict with the buyer's, spec depth wins. They arrive knowing a
requirement (resistance, diameter, flexibility, EMI attenuation), need real numbers, and want to
finish without emailing anyone. Their success is leaving with values they can put in a design.

**Secondary: the sourcing manager / OEM buyer qualifying a supplier.** Arrives knowing a problem
rather than a part number. Judges on compliance documents, MOQ, lead times, company solidity and
whether the operation looks real. Their success is deciding LiTex is worth an RFQ.

The dual-entry IA (products ↔ applications) exists because these two enter from opposite ends.

**Maintainer:** LiTex staff, via a Git-backed CMS at `/admin`. Their technical comfort and working
language are **not yet established** — this constrains how much CMS complexity is safe to ship.

## Product Purpose

LiTex Textile & Technology Co., Ltd. (Taipei, founded 1999) weaves conductive and metal elements
into textile. The website exists to do three mutually reinforcing things:

1. Generate qualified inquiries — sample requests and RFQs.
2. Be findable and survive the credibility check on landing.
3. Work as a technical self-serve reference an engineer can specify from without making contact.

The mechanism connecting them: **real spec data creates the SEO surface → the SEO surface creates
credibility → credibility converts to RFQs.** One engine, three outputs. Brand repositioning is a
downstream effect, not a target.

## Positioning

*"We specialize in weaving conductive elements into textile."*

The defensible mechanism is **Conductive Metal Yarn (CMY)** — tinned copper filaments helically
wound around a core in defined covering counts and handedness (1S, 1S1Z, 2S2Z, 3S3Z, 4S4Z), where
covering count trades directly against resistance and toughness. It is **loom-made and mass
manufacturable**, which is the claim a neighbour cannot copy: the documented alternatives (carbon
fibre, heating film, stainless steel fibre) are brittle, snap-prone or fray-prone, and are mostly
made by manual labour. LiTex additionally claims it "can use almost any metal alloy" and can run
up to eight strands simultaneously.

Founded as a spinoff of Hen Hao Trading, a narrow-fabrics manufacturer; the weaving competence is
inherited, not improvised.

## Operating Context

- **B2B industrial procurement.** Nothing is transactional; every outcome is a quote or a sample.
- **The realistic evaluation path** is: engineer finds a page → copies spec values into a comparison
  spreadsheet next to two competitors → shares it internally. Painful copying loses the deal, which
  is why copy-as-CSV and a print stylesheet are product requirements, not embellishments.
- **Procurement prints and PDFs things constantly.** Spec pages must survive being printed and
  attached to an internal document, carrying wordmark, canonical URL and contact details.
- **Compliance is a hard filter**, not a nice-to-have, in formal procurement.
- Trade shows are a real channel: Techtextil Frankfurt, Düsseldorf Wire Show, Tokyo Wearable Expo.

## Capabilities and Constraints

**Product line (as documented in 2018 catalogs; current status UNCONFIRMED):** Conductive Metal
Yarn · Electrical Heating Textile · EMI Shielding Woven Tube · Braided Self-Curling Tube · Wired
Conductive Tape · RFID Textile Tape · Silica Gel Switch Controller (out of production, sampling
only).

**Services:** OEM and ODM; connector manufacturing; customizable fabric width to 70 cm;
waterproof varieties.

**Explicitly undecided — must not be invented:**

- Whether every product is still manufactured. CuNi was "coming soon" in **2018**.
- MOQ, lead times, sample policy. None documented anywhere.
- Certification scope and dates. REACH / RoHS / SGS are claimed on a PDF cover page only.
- Patent status. The full list is recovered, but "pending" applications date from 2010–2011.
- Whether LiTex owns a domain, and whether budget exists for WordPress.com's paid Site Redirect.

**Hard constraint — no invention.** Content comes only from what LiTex has itself published: the
current site, its images, the six 2018 catalogs, and its Alibaba storefront. Anything absent goes
to the gaps register; it is never written from imagination. Facts sourced from the storefront carry
a `sourceNote` naming the source and retrieval date.

**Slow-channel constraint.** Contact with LiTex is **informal and slow**. Answers arrive partially
or not at all. Every design decision must therefore degrade gracefully around an unanswered gap —
a page that cannot ship until LiTex replies is a design defect, not a pending task.

## Brand Commitments

- **Name:** LiTex Textile & Technology Co., Ltd.
- **Positioning line:** "We specialize in weaving conductive elements into textile."
- **Provenance:** manufacturing since 1999; spinoff of Hen Hao Trading.
- **Contact of record:** 188 Bangka Blvd., Wanhua Dist., Taipei, Taiwan 108 · +886-2-2308-4712 ·
  Mon–Fri 09:00–18:00.
- **Patent:** TW 1M545145 (full list recovered in `archive/extracted-from-images.md` §2).
- **Existing channel:** Alibaba storefront `litex.en.alibaba.com` (supplier ID 234468551) — at
  present LiTex's **only working inbound contact route**.
- **Voice: not established.** No confirmed tone of voice exists. Existing copy is sparse and
  functional. Future work should not assume a personality LiTex has not expressed.

## Evidence on Hand

Complete local archive at `archive/`, captured 2026-08-10 — 23 HTML pages, 6 PDF catalogs, 46
images, plus `archive/extracted-from-images.md`, which holds data that existed **only** inside
JPGs: the stainless steel yarn spec table, the full patent list, HT001 switch specs, and LiTex's
own application claims. Recovered spec tables for CMY copper foil grades and RFID Wired Woven Tape
live in the design spec §6.

**Absences future work must not fabricate:**

- **No real email address exists.** `mail@example.com` appears 4× on the contact page and is the
  site's only address.
- **No usable photography.** The current homepage runs a Pexels stock photo. There are no product
  macros, no factory or loom images, no personnel.
- **No vector logo.** The current mark is a raster from the WordPress theme.
- **No certification documents** — only claims on a catalog cover.
- **No MOQ, lead time, or sample policy** anywhere.
- **The contact page's US address is theme boilerplate** ("10 Street Road, City, 10100, USA",
  "(555) 555 1234"), sitting on the same page as the real Taipei address. It is not a second office.
- Two catalogs (`2018-company-introduction.pdf`, `2018-wired-conductive-tape.pdf`) are image-only
  with no text layer and remain unread.

## Product Principles

1. **Specs are data, never prose and never pixels.** Every measured value lives in validated YAML,
   so it can be searched, copied, printed, compared and syndicated. The original site's defining
   failure was burying its best content in JPGs.
2. **The engineer is the tiebreaker.** When technical depth and commercial polish compete, depth
   wins. The engineer creates the requirement the buyer later sources.
3. **Publish only what LiTex has claimed.** An application or capability page asserting something
   the company cannot substantiate fails under exactly the diligence a serious buyer applies — and
   is worse than no page at all.
4. **Provenance travels with the fact.** Every recovered figure records where it came from, so a
   correction from LiTex is obvious to apply and 2018 data is never mistaken for current data.
5. **Degrade gracefully around missing answers.** Contact is slow; the site must reach full quality
   without waiting on LiTex, leaving honest, visible gaps rather than invented filler.

## Accessibility & Inclusion

WCAG 2.1 **AA minimum**, treated as a build gate rather than an audit afterthought. Every colour
token used for text must clear 4.5:1 against the surface it actually renders on, asserted in CI.
Lighthouse accessibility ≥ 95. Rationale is commercial as well as ethical: buyers evaluate on
uncalibrated office monitors and projectors, and formal procurement in several markets treats
accessibility as a procurement criterion.

Spec data must be readable by screen readers and copyable as text — the current site's images
make its most valuable content inaccessible.

## Target Markets

**Europe (EU) — confirmed by the user as the priority market, 2026-08-10.** This agrees with every
piece of documented evidence: Techtextil Frankfurt, the Düsseldorf Wire Show, and the REACH / RoHS
/ SGS compliance claims LiTex already makes. Japan is a real but secondary presence (Tokyo Wearable
Expo 2022). North America was considered and set aside.

Two consequences:

1. **The existing compliance story is the correct one.** REACH and RoHS are EU instruments and
   LiTex already claims both, plus SGS testing. Build credibility on what LiTex holds today rather
   than pursuing a certification class it does not have. The open work is obtaining the actual
   documents — dates, scope, certificate numbers — not acquiring new certifications.
2. **English at launch is correct, not a compromise.** English is the working language of European
   industrial procurement. German is the most plausible second language if one is ever added;
   Traditional Chinese is domestic-only and not planned. i18n-ready routing stays cheap insurance.

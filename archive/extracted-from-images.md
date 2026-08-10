# Content transcribed out of images and PDFs

**Captured:** 2026-08-10 from https://litextextile.wordpress.com/
**Why this file exists:** the original site stores most of its technical data inside JPGs and
PDFs, where it is invisible to search engines, screen readers and copy-paste. Everything below
was read out of those files by hand/vision and is now plain text. This is the primary source for
building the new product pages.

Each entry names the file it came from so figures stay traceable (`sourceNote` in the content schema).

---

## 1. Stainless steel yarn specifications
**Source:** `images/steel-yarn-specs.jpg` — previously text-in-image, nowhere in HTML

| Specification | Weight per metre (g) | Tensile strength (N) | Elongation (%) | Average resistance (Ω) |
|---|---|---|---|---|
| 14µm*90*1 | 0.12 | 25 | 1.10% | 61 |
| 12µm*90*2 | 0.17 | 44 | 1.10% | 42 |
| 12µm*100*1 | 0.095 | 24 | 1.10% | 59 |
| 12µm*100*2 | 0.19 | 41 | 1.10% | 38 |
| 12µm*275*1 | 0.26 | 59 | 1.10% | 27 |
| 12µm*275*2 | 0.54 | 75 | 1.10% | 14 |

---

## 2. Patents & awards — full list
**Source:** `images/patents-and-awards.jpg` and `images/cmy-patent.jpg`

Before this extraction only **TW 1M545145** (Wired Conductive Woven Tape) was available as text
anywhere on the site. The complete list:

**Conductive yarn capable of withstanding dyeing, finishing and washing**
- Issued: **TW M371733**
- Issued: **CN 201485574U**
- Pending application: **US 12/787,378**

**Flexible heating element**
- Pending application: **TW 099146482**
- Pending application: **CN 201120008487.x**

**Wired Conductive Woven Tape**
- **TW 1M545145** (this one was already in HTML on `/patents-and-awards-2/`)

**Award**
- **2014 TAITRONICS (Taiwan), Technology Innovation Awards — The Quality Award**

> ⚠️ All patent statuses date from 2016–2018 page content. "Pending" applications from 2010–2011
> have almost certainly since been granted or abandoned. **Statuses must be re-confirmed with
> LiTex before publishing.**

---

## 3. Silicon switch HT001 — specifications
**Source:** `images/silica-gel-switch-controller-spec.jpg`
Product is marked out of production, available for sampling and testing.

| Property | Value |
|---|---|
| Model | #HT001 Silicon switch |
| Size (W×L×H) | 38 × 38 × 8 mm |
| Input & output volts | 3.3 V – 12 V |
| Current | MAX 5 A |
| LED sign | RGB LED, 3 sets |

**Ports**
- `P+` / `P−` — heating textile port
- `B+` / `B−` — battery input port
- `T1` / `T2` — NTC temperature sensor

---

## 4. Electrical heating textile — feature list
**Source:** `images/features.jpg`

- Patented technology
- REACH and RoHS compliant
- SGS test certified toughness
- Even and stable heating
- ODM / OEM welcome
- Flexibility to cover uneven objects
- Width, conductivity and strength customizable
- Flame retardant and heat resistant
- Waterproof varieties available
- Good vapour permeability

---

## 5. Applications claimed by LiTex — **important**
**Sources:** `images/applications.jpg` (heating textile), `images/cmy-applications.jpg` (CMY)

These are LiTex's own claims, published on their own site, but only ever as images.

**Electrical heating textile:**
Wearable Heating · **Automotive industry** · **Healthcare** · Architecture · Agriculture

**Conductive Metal Yarn:**
**Healthcare** · EMI Shielding · Heating Applications · **Loudspeaker Coil-cords**

> This **reverses** an earlier spec decision. Automotive and healthcare were excluded from the
> application shortlist as unevidenced; the evidence was inside these JPGs the whole time.
> See spec §3.

---

## 6. CMY basic structure
**Source:** `images/cmy-structure1.jpg` — includes an SEM micrograph at ×300, 100 µm scale bar

Construction is a **metal layer** helically coiled over a **core polymer yarn**. The photographed
sample is structure **1S** (one coiled covering).

Coiling configurations illustrated: **1s** · **1z** · **1s1z** — `s` and `z` denote opposite
helical directions, so `1s1z` is two coverings wound in opposing directions.

---

## 7. Conductive Metal Yarn — copper foil grades
**Source:** `catalogs/2018-non-carbon-electrical-heating-textile.pdf` (p.3), via `pdftotext -layout`

| Item | Coverings | Ø no coating (mm) | Ø coated (mm) | Resistance (Ω/M) | Toughness |
|---|---|---|---|---|---|
| 010/N(K)30'*3/1S | 1 | 0.27±0.02 | 0.47±0.05 | ~4.4 | Weaker |
| 010/N(K)30'*3/1S1Z | 2 | 0.33±0.02 | 0.62±0.05 | ~2.5 | ↓ |
| 010/N(K)30'*3/2S2Z | 4 | 0.53±0.02 | 0.75±0.05 | ~1.4 | ↓ |
| 010/N(K)30'*3/3S3Z | 6 | 0.55±0.02 | 0.84±0.05 | ~1 | ↓ |
| 010/N(K)30'*3/4S4Z | 8 | 0.65±0.02 | — | ~0.8 | Stronger |

Coverings are tinned copper. Coatings: **PU**, **FEP (Teflon)**. Copper-nickel (CuNi) listed as
"coming soon" as of 2018 — status unconfirmed. Finest commercial grade 0.27 mm. Up to eight
strands manufactured simultaneously. "Can use almost any metal alloy." Sturdy connector
manufacturing service available.

---

## 8. Competitive comparison — heating elements
**Source:** `catalogs/2018-non-carbon-electrical-heating-textile.pdf`

| Heating element | Material characteristics | Manufacturing process |
|---|---|---|
| Carbon fibre | Brittle, easy breakage | Mostly manual labour |
| Flexible printed circuit board (heating film) | Thin board, easy to snap | Special equipment required, high operating cost |
| Stainless steel fibre | Filament bundle frays easily | Mostly manual labour |
| **Conductive Metal Yarn** | Coiled design offers both flexibility and strength | Made ready to use on LiTex looms; easily mass manufactured |

Also stated: fabric width customizable **up to 70 cm**.

---

## 9. Company background
**Source:** `pages/about.html`

Spinoff founded **1999** from **Hen Hao Trading**, a traditional narrow-fabrics manufacturer.
Grew through contracts requiring woven metal products for heavy industries. Stated objective:
*"to create new innovative products, and take a step into functional fabrics to make ourselves
standout in an ever-evolving industry."*

Contact of record: 188 Bangka Blvd., Wanhua Dist., Taipei, Taiwan 108 · +886-2-2308-4712 ·
Mon–Fri 09:00–18:00.

---

## Still not extracted

| Item | Why |
|---|---|
| `catalogs/2018-company-introduction.pdf` | **Image-only PDF** — no text layer. Needs OCR or page-by-page vision reading. |
| `catalogs/2018-wired-conductive-tape.pdf` | **Image-only PDF** — same. |
| `catalogs/2018-emi-shielding-wire-tube.pdf` | Text extracted (2.5 KB) but not yet transcribed into this file |
| `catalogs/2018-rfid-textile-tape.pdf` | Text extracted (2.5 KB), not yet transcribed — **this is the sole source for the new RFID product page** |
| `catalogs/201611e68ea7e588b6e599a8final.pdf` | Text extracted (4.4 KB), not yet transcribed |
| Remaining ~37 images | Mostly product photography rather than data; worth a sweep for any further text-in-image |

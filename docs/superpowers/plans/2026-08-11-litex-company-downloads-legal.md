# LiTex Website — Plan 5: The Company Section, Downloads and Privacy

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the six routes a sourcing manager checks before issuing an RFQ — `/company/`, `/company/about/`, `/company/patents-and-awards/`, `/company/certifications/`, `/downloads/` and `/legal/privacy/` — publishing the real evidence LiTex holds, with every stale or unverifiable claim stated as exactly what it is rather than dressed up or dropped.

**Architecture:** The company section is four hand-authored `.astro` routes rather than a content collection, because each page has a different shape and there will never be a fifth. Photographic evidence is extracted from `2018-company-introduction.pdf` by the same re-runnable script Plan 3 built, extended with a second output group so `/company/` assets get their own provenance manifest and the Tier 3 build rule covers them. Patent and certification records are typed data rendered through Plan 2's `SpecTable`, so the site's own "specs are data, never prose" rule applies to legal facts too. The six catalog PDFs are copied out of `archive/` into `public/` by a prebuild step rather than committed twice.

**Tech Stack:** Astro 7.2.0 · Vitest 4 · linkedom · pymupdf · sharp — no new dependencies.

## Why this plan exists

Spec §0 ranks the current site's problems. Items 1, 3 and 8 all land here: the contact details read as fraudulent, the six catalogs holding the best content are unlinked from anything, and there is no certifications page at all — "the exact criteria B2B buyers use to qualify a supplier."

Plans 1–4 built the engineer's half of the site. `/products/`, `/applications/` and `/technology/` answer *can this material do the job*. Nothing yet answers *is this company real, and will procurement accept them* — which is the secondary user's entire question and, per spec §0, the question the old site failed most visibly.

The section is also where the redesign's honesty commitment gets its hardest test. The archive's patent list is stale and partly false; the SGS report is thirteen years old and its addressee may not even be LiTex. A page that repeats the catalog would publish falsehoods. A page that omits the problem publishes nothing. Both fail. Each page below states the record and its status, and treats the gap as content.

## Global Constraints

Every task's requirements implicitly include this section. These carry over from Plans 1–4 and remain in force.

- **Astro `7.2.0`**, pinned. **No React, Vue, or any UI framework.**
- **Never call `getEntry()` bare** — wrap in `mustResolve()` from `src/lib/references.ts`. Astro 7.2.0 does not fail the build on a broken `reference()`.
- **Colour tokens only** in components — `var(--c-*)`, never a literal hex. Tokens live in `src/styles/tokens.css`; `tests/tokens.test.ts` asserts their contrast on both surfaces.
- **Fonts are Archivo (`--font-display`) and IBM Plex Mono (`--font-mono`) only.** Monospace is reserved for values that have units — the `.value` class in `global.css`.
- **`mail@example.com` is theme boilerplate and is banned.** A build test fails if any page renders an `example.com` string. The real address is `sales@litex.com.tw`.
- **Images belong in `src/assets/`, never `public/`.** The one exception this plan introduces is `public/catalogs/`, which holds PDFs, not images, and is generated rather than committed.
- **Never invent product or company facts.** Every claim on these pages must trace to `archive/` or to a public register named on the page. Where a source is 8–13 years old, say so rather than presenting it as current.
- **Exactly one `<h1>` per page.** The masthead wordmark is not a heading.
- **Commit after every task.** Conventional prefixes (`feat:`, `test:`, `chore:`).
- Run `node .claude/skills/impeccable/scripts/detect.mjs --json src/components src/pages src/styles` before each commit; expect `[]`.

### Two strings that will fail the build if you type them

`tests/chrome.test.ts` scans **every** built page for these. A section about patents is the most likely place in the whole site to trip them:

- **`PATENTED`** — asserts a right currently in force, which is not established. Lowercase "patented technology" quoted from the catalog is fine; the uppercase string is not.
- **`1M545145`** — the malformed number printed in `archive/images/patents-and-awards.jpg`. Do **not** quote it on the page, not even to explain that it is wrong. Say "the number printed in the 2018 material is malformed" and give the correct one.

## Source inventory — verified 2026-08-11 during planning

Everything this plan publishes traces to one of these. Each was read or rendered directly.

| Fact | Source | How verified |
|---|---|---|
| Spinoff founded 1999 from Hen Hao Trading, a traditional narrow-fabrics manufacturer; grew via contracts needing woven metal for heavy industry; skills led to Wired Conductive Woven Tape and CMY | `archive/pages/about.html` | Text extracted and read in full |
| Objective: *"to create new innovative products, and take a step into functional fabrics to make ourselves standout in an ever-evolving industry."* | same | Read in full — quote is verbatim |
| Alibaba storefront `https://litex.en.alibaba.com/` and Facebook `https://www.facebook.com/litexled/` are LiTex's own linked channels | same, `href` attributes | Extracted from the markup |
| **Fax `+886 2 2308-4714`**, `www.litex.com.tw`, `sales@litex.com.tw`, `No. 188, Bangka Blvd., Taipei City 10860, Taiwan` | `archive/catalogs/201611e68ea7e588b6e599a8final.txt` footer | Read in full. The fax number is **new** — not on any archived page |
| Downloads page offers exactly 6 catalogs, with these labels and files | `archive/pages/downloads.html` | Text and `href`s extracted |
| Silicon switch catalog is labelled *"Out of production but available for sampling and testing purposes"* | same | Verbatim |
| Catalog page counts: switch 2 · company-introduction 2 · EMI 2 · heating 4 · RFID 2 · wired tape 4 | `archive/catalogs/*.pdf` via pymupdf `page_count` | Counted programmatically |
| EMI catalog states heat resistance to 600 °C, aramid/fibreglass core with copper plating, expands 1.5–4× when compressed, 3–15 mm range, "RoHS certified eco-friendly" | `archive/catalogs/2018-emi-shielding-wire-tube.txt` | Read in full |
| Heating catalog states "Reach and RoHS compliant", "SGS test certified toughness", "Patented technology" on p.1 | `archive/catalogs/2018-non-carbon-electrical-heating-textile.txt` | Read in full |
| Old privacy page carries one paragraph, about mobile information not being shared | `archive/pages/privacy-policy.html` | Text extracted; that paragraph is the entire page |
| Patent statuses (TWM545145U, TWM371733, US 12/787,378) | Google Patents, checked 2026-08-11 in session 4 | Recorded in `HANDOFF.md`; **not re-derived here** |

### The five catalog images — re-rendered and re-read during planning

Plan 3 established that a plan's "verified" claims about *images* deserve re-checking. They were re-checked, and **one handoff description was wrong**.

| Asset | What it actually shows |
|---|---|
| p.1 xref 52 (989×692) | **Three panels, not what the handoff said.** Left: the LiTex building from street level, illuminated shopfront sign reading *LiTex* over *LED 紡織科技*. Upper right: **two brushed-steel company nameplates** — 恆好貿易有限公司 / HEN HAO TRADING CO., LTD. and 台灣吉普織帶工業 / TAIWAN TULIP RIBBON & BRAIDS. Lower right: spools of bright metal filament beside lengths of pale woven tape. |
| p.1 xref 54 (1024×536) | Three factory photographs: a creel rack of bobbins, a narrow-fabric loom running striped webbing over its rollers, and a long row of covering machines under a shed roof. Matches the handoff. |
| p.2 xref 8 (626×504) | Two panels: a trade-show stand wall with a backlit LiTex poster and a shelf of tape rolls; three staff in branded polo shirts under a sign reading *LITEX TEXTILE & TECH. CO., LTD.* Matches the handoff. |
| p.2 xref 5 (1035×442) | Three panels: US patent certificate cover (gold seal, signed David J. Kappos, **no number anywhere on it**), the TAITRONICS certificate, and the SGS Test Report. Matches the handoff. |
| p.2 xref 6, heating p.1 xref 122 | Heating textile beside a thermograph. **Still held** — open question 2, unchanged. |

> **The handoff said p.1 xref 52 was "a loom with LiTex-branded tape, two framed certificates, a spool of woven tape."** There is no loom in it and there are no certificates in it. The "two framed certificates" are the two predecessor-company nameplates, which is a materially better fact than the one the handoff recorded: they are direct photographic evidence for the Hen Hao Trading heritage claim that `/company/about/` opens with, and they name a **second** predecessor — Taiwan Tulip Ribbon & Braids, a ribbon and braid works — that appears nowhere in the archived HTML. Task 3 uses them as exactly that.

### Two findings that change what the pages say

**1. `scripts/extract-image.py`'s crop is broken for any non-zero offset.** `Pixmap.copy(source, irect)` works in absolute coordinates, so a destination pixmap created at `IRect(0, 0, w, h)` does not intersect a source region at `x=366` and the result is a black rectangle. The existing code has always been wrong; it only works because its one caller (the RFID hero) crops from `0,0`. Reproduced during planning: cropping xref 5 at `x=366` produced a 2 KB black frame. Task 1 fixes it, and **the fix is a prerequisite for four of the six images this plan ships.**

**2. The SGS report may not be issued to LiTex.** Enlarging the addressee block of the report photograph (6× lanczos, the source text is roughly four pixels tall) shows four lines whose second reads as `H?? ?A? TRADING CO., LTD.` — the word *TRADING* is the clearest thing on it, and LiTex's registered name in either language contains no such word. Hen Hao Trading is at the same Bangka Blvd. address. **This is not legible enough to publish as a reading**, and Task 5 does not publish it. It is legible enough to matter: a buyer who requests `CE/2013/52203` and receives a report in another company's name has found a credibility problem the site created. It goes to LiTex as open question 1 and shapes how Task 5 words the page.

## Held for a later plan — do not use here

| Asset / content | Why not here |
|---|---|
| Thermograph (p.2 xref 6, heating p.1 xref 122) | Test conditions unknown — spec §7 item 5. Unchanged from Plan 4. |
| US patent certificate panel (p.2 xref 5, x 0–299) | **Deliberately never extracted.** See Task 4. |
| p.1 xref 52 lower-right panel (spools and tape) | Product photography, and `/products/` already has better. |
| Trade-show stand wall panel (p.2 xref 8, x 0–270) | The poster on it is 2018 marketing copy that would need its own verification pass. The staff panel carries the same point. |
| `/news/` links from `/company/about/` | Plan 6 builds `/news/`. The trade shows are named in prose without links; Plan 6 can link them. |
| Contact form, `/contact/`, `/request-a-sample/` | Plan 7. `/legal/privacy/` must therefore **not** describe a form. |
| Analytics wording on `/legal/privacy/` | Plan 8 adds Cloudflare Web Analytics. Task 7 ships a page describing a site with no analytics, and a test that fails if that stops being true silently. |

## File Structure

| Path | Responsibility |
|---|---|
| `scripts/extract-image.py` | **Modified** — correct the crop for non-zero offsets |
| `scripts/extract-images.mjs` | **Modified** — output groups; six company sources |
| `scripts/sync-catalogs.mjs` | Copy the 6 catalog PDFs into `public/catalogs/`, record their byte sizes |
| `src/assets/company/*.jpg` + `provenance.json` | Generated. Company photography and its provenance |
| `src/components/ArchiveFigure.astro` | A captioned archive photograph at one of three widths, never upscaled |
| `src/lib/company.ts` | **Modified** — fax, and the credibility-to-evidence map |
| `src/lib/nav.ts` | **Modified** — `/company/` (Task 6), `/downloads/` (Task 7) |
| `src/components/SiteFooter.astro` | **Modified** — Browse list rendered from `NAV`; legal line |
| `src/data/patents.ts` | The patent register as typed data |
| `src/data/certifications.ts` | The compliance claims and what backs each one |
| `src/data/catalogs.ts` | The 6 catalogs: title, description, page count, year |
| `src/data/catalog-files.json` | Generated, committed. Byte size per catalog |
| `src/pages/company/about.astro` | Origin, premises, plant, people |
| `src/pages/company/patents-and-awards.astro` | The register, the award, and what has lapsed |
| `src/pages/company/certifications.astro` | What LiTex claims, where it claims it, what document exists |
| `src/pages/company/index.astro` | Hub: the credibility bar turned into navigation |
| `src/pages/downloads.astro` | All 6 catalogs with real descriptions and file sizes |
| `src/pages/legal/privacy.astro` | Privacy notice describing this site as it actually is |
| `src/pages/products/[slug].astro` | **Modified** — `catalogPdf` becomes a real link |
| `tests/provenance.test.ts` | **Modified** — cover both asset groups |
| `tests/imagery.test.ts` | **Modified** — Tier 3 reads both manifests |
| `tests/company.test.ts` | The four company routes |
| `tests/downloads.test.ts` | Catalog delivery and the downloads page |
| `tests/legal.test.ts` | Privacy route and its forward guards |

Route count goes from **18 to 24**. Spec §3's 27 fixed routes are then 3 short: `/news/` (Plan 6), `/contact/` and `/request-a-sample/` (Plan 7).

## Before Task 1

`main` is clean and pushed. Branch first — Plans 1–4 all ran branch → task → test → commit per task → PR → merge → delete branch:

```bash
git checkout -b plan-5-company-downloads-legal
npm run build && npm test
```

Expected baseline before any change: build exits 0 emitting **18 pages**, and **160 tests across 13 files** pass. If that is not what you see, stop and find out why before writing code.

---

### Task 1: Fix the crop, and extract the company photography

The crop bug is first because four of this plan's six images cannot be produced without the fix, and because a black rectangle passes every test the repo currently has — it is a real image file of a real size with a real provenance entry.

The company assets get their own directory and manifest rather than joining `src/assets/products/`. Nothing about a factory photograph is a product photograph, and `tests/provenance.test.ts` asserts one image per product slug — a shared directory would make that assertion meaningless.

**Files:**
- Modify: `scripts/extract-image.py:32-37`, `scripts/extract-images.mjs`
- Create (generated): `src/assets/company/*.jpg`, `src/assets/company/provenance.json`
- Test: `tests/provenance.test.ts` (rewrite), `tests/imagery.test.ts` (modify)

**Interfaces:**
- Produces: six files in `src/assets/company/` named `premises.jpg`, `heritage-nameplates.jpg`, `factory-floor.jpg`, `trade-show-stand.jpg`, `taitronics-award.jpg`, `sgs-test-report.jpg`, plus `src/assets/company/provenance.json` keyed by filename with the same entry shape the products manifest already uses.
- Produces: `SOURCES` entries in `extract-images.mjs` gain an optional `group: 'products' | 'company'` field, defaulting to `'products'`.

- [ ] **Step 1: Write the failing provenance test**

Replace `tests/provenance.test.ts` entirely. It now walks both groups, and adds two rules the old version could not express: no filename may appear in two manifests, and no image may be a flat single-colour rectangle — which is exactly what the broken crop produced.

```ts
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

type Entry = {
  source: string;
  note: string;
  aiGenerated: boolean;
  dimensions: string;
};

const GROUPS = ['products', 'company'] as const;

function dirFor(group: string): string {
  return fileURLToPath(new URL(`../src/assets/${group}`, import.meta.url));
}

function manifestFor(group: string): Record<string, Entry> {
  return JSON.parse(readFileSync(join(dirFor(group), 'provenance.json'), 'utf8'));
}

function imagesIn(group: string): string[] {
  return readdirSync(dirFor(group)).filter((f) => /\.(jpg|jpeg|png)$/i.test(f));
}

const EXPECTED: Record<string, string[]> = {
  products: [
    'conductive-metal-yarn', 'electrical-heating-textile', 'emi-shielding-woven-tube',
    'rfid-textile-tape', 'wired-conductive-tape', 'silica-gel-switch-controller',
    'braided-self-curling-tube',
  ],
  company: [
    'premises', 'heritage-nameplates', 'factory-floor', 'trade-show-stand',
    'taitronics-award', 'sgs-test-report',
  ],
};

/** First bytes of the formats Astro's sharp can actually decode. */
const MAGIC: Record<string, string> = {
  '.jpg': 'ffd8ff',
  '.jpeg': 'ffd8ff',
  '.png': '89504e',
};

describe.each(GROUPS)('image provenance — %s', (group) => {
  const dir = dirFor(group);
  const manifest = manifestFor(group);
  const imageFiles = imagesIn(group);

  it('ships an image for every expected slug', () => {
    for (const slug of EXPECTED[group]) {
      expect(
        imageFiles.some((f) => f.startsWith(`${slug}.`)),
        `no image found for ${slug}`,
      ).toBe(true);
    }
  });

  it('records a source for every image file on disk', () => {
    for (const file of imageFiles) {
      expect(manifest[file], `${file} has no provenance entry`).toBeDefined();
      expect(manifest[file].source, `${file} has an empty source`).toBeTruthy();
    }
  });

  it('has no manifest entry pointing at a file that does not exist', () => {
    for (const file of Object.keys(manifest)) {
      expect(imageFiles, `manifest lists ${file}, which is not on disk`).toContain(file);
    }
  });

  it('sources every image from the archive, never from the open web', () => {
    for (const [file, entry] of Object.entries(manifest)) {
      expect(entry.source, `${file} is not sourced from archive/`).toMatch(/^archive\//);
    }
  });

  it('declares every photograph as real, never AI generated', () => {
    for (const [file, entry] of Object.entries(manifest)) {
      expect(entry.aiGenerated, `${file} claims to be AI generated`).toBe(false);
    }
  });

  it('never ships the Pexels stock photo the redesign exists to remove', () => {
    for (const [file, entry] of Object.entries(manifest)) {
      expect(entry.source, `${file} is the banned stock photo`).not.toContain('pexels');
    }
    expect(imageFiles.some((f) => f.includes('pexels'))).toBe(false);
  });

  it('carries a human-readable note describing what each photograph shows', () => {
    for (const [file, entry] of Object.entries(manifest)) {
      expect(entry.note.length, `${file} has a uselessly short note`).toBeGreaterThan(20);
    }
  });

  it('ships no image larger than 4 MB, before Astro optimizes it', () => {
    for (const file of imageFiles) {
      const mb = statSync(join(dir, file)).size / 1_048_576;
      expect(mb, `${file} is ${mb.toFixed(1)} MB`).toBeLessThan(4);
    }
  });

  // The catalogs store three of these as JPEG 2000 and all six as CMYK. Copying the
  // stored bytes out and naming the result .jpg produces a file sharp cannot decode
  // (`jp2 input: false`), which fails the Astro build with an opaque error. Check the
  // bytes, not the extension.
  it('holds bytes that match the extension, so sharp can actually decode them', () => {
    for (const file of imageFiles) {
      const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
      const head = readFileSync(join(dir, file)).subarray(0, 3).toString('hex');
      expect(head, `${file} is not really a ${ext} file`).toBe(MAGIC[ext]);
    }
  });

  // A mis-specified crop produces a uniform black rectangle: a real JPEG, of a real
  // size, with a real provenance entry, that passes every other test in this file.
  // Verified 2026-08-11 — Pixmap.copy() works in absolute coordinates, so a
  // destination created at (0,0) does not intersect a source region at x=366.
  it('holds a photograph rather than a flat rectangle', () => {
    for (const file of imageFiles) {
      const bytes = statSync(join(dir, file)).size;
      const [w, h] = manifest[file].dimensions.split('x').map(Number);
      const bytesPerPixel = bytes / (w * h);
      expect(
        bytesPerPixel,
        `${file} is ${bytes} bytes for ${w}x${h} — too uniform to be a photograph`,
      ).toBeGreaterThan(0.04);
    }
  });
});

describe('provenance across groups', () => {
  it('never uses the same filename in two groups, so a merged lookup is unambiguous', () => {
    const seen = new Map<string, string>();
    for (const group of GROUPS) {
      for (const file of Object.keys(manifestFor(group))) {
        expect(seen.has(file), `${file} appears in both ${seen.get(file)} and ${group}`).toBe(false);
        seen.set(file, group);
      }
    }
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npx vitest run tests/provenance.test.ts`
Expected: FAIL — `ENOENT` on `src/assets/company/provenance.json`.

- [ ] **Step 3: Fix the crop in `scripts/extract-image.py`**

Replace lines 32–37 (the `if len(sys.argv) > 4:` block) with:

```python
if len(sys.argv) > 4:
    w, h, x, y = (int(v) for v in sys.argv[4:8])
    # Pixmap.copy() works in ABSOLUTE coordinates: it copies the intersection of the
    # two pixmaps' rectangles. A destination created at IRect(0, 0, w, h) therefore
    # does not intersect a source region at x=366 at all, and the result is a black
    # rectangle. Create the destination AT the crop origin, then reset the origin so
    # tobytes() writes a normal top-left-anchored image.
    #
    # The original version of this block created the destination at (0, 0). It was
    # always wrong and never noticed, because its only caller — the RFID hero —
    # crops from (0, 0), where the bug is invisible. Verified 2026-08-11.
    cropped = fitz.Pixmap(fitz.csRGB, fitz.IRect(x, y, x + w, y + h), False)
    cropped.copy(pix, cropped.irect)
    cropped.set_origin(0, 0)
    pix = cropped
```

- [ ] **Step 4: Add output groups to `scripts/extract-images.mjs`**

Three edits to the existing file. First, replace the single `OUT` constant near the top:

```js
const ROOT = fileURLToPath(new URL('..', import.meta.url));

/**
 * Output groups. Company photography is kept apart from product photography
 * because they are governed differently: tests/provenance.test.ts asserts one
 * image per product slug, and a factory photograph is not a product.
 */
const GROUPS = ['products', 'company'];
const dirFor = (group) => `${ROOT}src/assets/${group}`;
```

Second, append the six company sources to `SOURCES`, after the existing `braided-self-curling-tube` entry. Crop rectangles were derived by white-gutter detection on each rendered composite and confirmed by viewing every crop, 2026-08-11:

```js
  // --- Company photography. All six are panels of two composite images in the
  // company introduction catalog; each composite is a page layout, so cropping to
  // the panel is what makes them usable rather than a design preference.
  //
  // The third panel of p.2 xref 5 — the US patent certificate cover — is
  // deliberately NOT extracted. US 12/787,378 was abandoned on 2012-04-23, so the
  // cover cannot be attributed to it, it carries no number of its own, and
  // publishing it on a patents page asserts a US grant LiTex does not have.
  {
    group: 'company',
    slug: 'premises',
    from: 'archive/catalogs/2018-company-introduction.pdf',
    page: 1, xref: 52,
    crop: { w: 401, h: 535, x: 0, y: 157 },
    note: 'Catalog p.1, left panel: the LiTex building photographed from street level, with an illuminated shopfront sign reading LiTex over LED 紡織科技',
  },
  {
    group: 'company',
    slug: 'heritage-nameplates',
    from: 'archive/catalogs/2018-company-introduction.pdf',
    page: 1, xref: 52,
    crop: { w: 414, h: 156, x: 433, y: 157 },
    note: 'Catalog p.1, upper right panel: two brushed-steel company nameplates side by side, reading 恆好貿易有限公司 / HEN HAO TRADING CO., LTD. and 台灣吉普織帶工業 / TAIWAN TULIP RIBBON & BRAIDS',
  },
  {
    group: 'company',
    slug: 'factory-floor',
    from: 'archive/catalogs/2018-company-introduction.pdf',
    page: 1, xref: 54,
    crop: { w: 1000, h: 486, x: 24, y: 50 },
    note: 'Catalog p.1: three factory photographs — a creel rack of bobbins, a narrow-fabric loom running striped webbing over its rollers, and a long row of covering machines under a shed roof',
  },
  {
    group: 'company',
    slug: 'trade-show-stand',
    from: 'archive/catalogs/2018-company-introduction.pdf',
    page: 2, xref: 8,
    crop: { w: 326, h: 484, x: 289, y: 0 },
    note: 'Catalog p.2, right panel: three LiTex staff in branded polo shirts standing in an exhibition stand under a sign reading LITEX TEXTILE & TECH. CO., LTD.',
  },
  {
    group: 'company',
    slug: 'taitronics-award',
    from: 'archive/catalogs/2018-company-introduction.pdf',
    page: 2, xref: 5,
    crop: { w: 297, h: 442, x: 366, y: 0 },
    note: 'Catalog p.2, centre panel: the 2014 TAITRONICS Technology Innovation Awards certificate, 優選獎 / The Quality Award, naming 富鉅紡織科技股份有限公司 and 非碳纖維電子發熱紡織品, dated 2014.9.29',
  },
  {
    group: 'company',
    slug: 'sgs-test-report',
    from: 'archive/catalogs/2018-company-introduction.pdf',
    page: 2, xref: 5,
    crop: { w: 293, h: 442, x: 737, y: 0 },
    note: 'Catalog p.2, right panel: the cover of SGS Test Report CE/2013/52203, showing a photographed fabric sample. The addressee block and the test scope are not legible at this resolution',
  },
```

Third, replace everything from `mkdirSync(OUT, ...)` to the end of the file:

```js
for (const group of GROUPS) {
  mkdirSync(dirFor(group), { recursive: true });
  for (const stale of readdirSync(dirFor(group)).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))) {
    rmSync(`${dirFor(group)}/${stale}`);
  }
}

const manifests = Object.fromEntries(GROUPS.map((group) => [group, {}]));

for (const s of SOURCES) {
  const group = s.group ?? 'products';
  const file = `${s.slug}.jpg`;
  const dest = `${dirFor(group)}/${file}`;
  let dimensions;

  if (s.copyFrom) {
    copyFileSync(`${ROOT}${s.copyFrom}`, dest);
    dimensions = 'copied';
  } else {
    const crop = s.crop ? [s.crop.w, s.crop.h, s.crop.x, s.crop.y].map(String) : [];
    dimensions = execFileSync(
      'python',
      [`${ROOT}scripts/extract-image.py`, `${ROOT}${s.from}`, String(s.xref), dest, ...crop],
      { encoding: 'utf8' },
    ).trim();
  }

  // Read into a buffer rather than handing sharp the path: on Windows sharp keeps
  // the file open, and writing the reduced image back over it fails with EUNKNOWN.
  let bytes = readFileSync(dest);
  const meta = await sharp(bytes).metadata();
  let reducedFrom = null;

  if (Math.max(meta.width, meta.height) > MAX_EDGE) {
    bytes = await sharp(bytes)
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: REDUCED_QUALITY, mozjpeg: true })
      .toBuffer();
    writeFileSync(dest, bytes);
    reducedFrom = `${meta.width}x${meta.height}`;
  }

  const final = await sharp(bytes).metadata();
  dimensions = `${final.width}x${final.height}`;

  manifests[group][file] = {
    source: s.copyFrom ?? s.from,
    page: s.page ?? null,
    xref: s.xref ?? null,
    crop: s.crop ?? null,
    dimensions,
    reducedFrom,
    note: s.note,
    aiGenerated: false,
    extracted: '2026-08-11',
  };
  console.log(
    `${group.padEnd(9)} ${file.padEnd(30)} ${dimensions}${reducedFrom ? ` (reduced from ${reducedFrom})` : ''}`,
  );
}

for (const group of GROUPS) {
  writeFileSync(
    `${dirFor(group)}/provenance.json`,
    `${JSON.stringify(manifests[group], null, 2)}\n`,
  );
  console.log(`Wrote provenance for ${Object.keys(manifests[group]).length} ${group} images.`);
}
```

- [ ] **Step 5: Run the extraction**

Run: `node scripts/extract-images.mjs`

Expected output — the seven product images unchanged, then:

```
company   premises.jpg                   401x535
company   heritage-nameplates.jpg        414x156
company   factory-floor.jpg              1000x486
company   trade-show-stand.jpg           326x484
company   taitronics-award.jpg           297x442
company   sgs-test-report.jpg            293x442
```

If any of the six reports a size other than these, the crop rectangle was mistyped — do not proceed.

- [ ] **Step 6: Look at all six images before trusting them**

Open each file in `src/assets/company/`. This step is not optional and cannot be replaced by a test: the entire point of Tier 3 is that a human confirmed the photograph shows what the caption will claim. Check against the table in "The five catalog images" above. A black or near-black rectangle means the Python fix in Step 3 did not land.

- [ ] **Step 7: Run the provenance test**

Run: `npx vitest run tests/provenance.test.ts`
Expected: PASS.

- [ ] **Step 8: Extend the Tier 3 rule to both manifests**

In `tests/imagery.test.ts`, add a shared loader below the `imageFiles` constant:

```ts
/**
 * Every provenance manifest, merged. tests/provenance.test.ts asserts the two
 * groups share no filename, so a flat lookup is unambiguous.
 */
function allProvenance(): Record<string, { aiGenerated: boolean }> {
  return ['products', 'company'].reduce(
    (all, group) => ({
      ...all,
      ...JSON.parse(readFileSync(join(SRC, `assets/${group}/provenance.json`), 'utf8')),
    }),
    {},
  );
}
```

Then replace the two places that read a manifest. In `describe('imagery policy')`, the last test becomes:

```ts
  it('declares no AI-generated photography anywhere in the asset tree', () => {
    for (const [file, entry] of Object.entries(allProvenance())) {
      expect(entry.aiGenerated, `${file} is AI generated and used as real photography`).toBe(false);
    }
  });
```

And in `describe('Tier 3 sections — real photography only')`, replace the `const manifest = JSON.parse(...)` block with:

```ts
  const manifest = allProvenance();
```

Finally, the comment above `const TIER_3` says the rule is "near-vacuous today". Replace that paragraph with:

```ts
  // This stopped being vacuous in Plan 5: /company/ now ships six photographs,
  // including two certificate crops. Every one must trace to a manifest entry that
  // declares itself real.
```

- [ ] **Step 9: Full build and test**

Run: `npm run build && npm test`
Expected: build exits 0 with 18 pages (no new routes yet); all tests pass. The Tier 3 suite still finds only `/technology/` pages and still passes.

Run: `node .claude/skills/impeccable/scripts/detect.mjs --json src/components src/pages src/styles`
Expected: `[]`

- [ ] **Step 10: Commit**

```bash
git add scripts/extract-image.py scripts/extract-images.mjs src/assets/company tests/provenance.test.ts tests/imagery.test.ts
git commit -m "fix: correct the pymupdf crop and extract company photography"
```

---

### Task 2: `ArchiveFigure` — a captioned photograph that is never upscaled

Four pages need the same figure, and three of the six images are small: the certificate crops are 297 and 293 pixels wide. Astro's `<Picture>` will happily generate a 1200px variant of a 293px source, and CSS will happily stretch it — both produce a blurrier, heavier certificate than the original. The component makes "never wider than the source" structural instead of remembered.

**Files:**
- Create: `src/components/ArchiveFigure.astro`
- Test: none of its own — it is exercised by every company-page test from Task 3 onward, and by `tests/imagery.test.ts`, which already asserts alt text, modern formats and the 300 KB ceiling across the whole build.

**Interfaces:**
- Produces: `ArchiveFigure.astro` with props
  `{ image: ImageMetadata; alt: string; caption: string; size?: 'full' | 'half' | 'document'; loading?: 'eager' | 'lazy' }`.
  `caption` is **required** — an archive photograph with no stated origin is the thing spec §5 exists to prevent. Default `size` is `'full'`, default `loading` is `'lazy'`.
- Produces: markup `<figure data-archive-figure>` containing one `<picture>` and one `<figcaption>`.

- [ ] **Step 1: Create the component**

```astro
---
import { Picture } from 'astro:assets';

interface Props {
  image: ImageMetadata;
  alt: string;
  /** What the reader is looking at, and which document it came out of. Required. */
  caption: string;
  size?: 'full' | 'half' | 'document';
  loading?: 'eager' | 'lazy';
}

const { image, alt, caption, size = 'full', loading = 'lazy' } = Astro.props;

/**
 * Rendered ceiling per size, in px, chosen to sit UNDER the narrowest source that
 * uses it: half serves premises (401), heritage-nameplates (414) and
 * trade-show-stand (326); document serves the two certificate crops (297, 293).
 * Upscaling a certificate makes it less readable, not more.
 */
const CAP = { full: 1200, half: 320, document: 288 } as const;

/** `sizes` must match the CSS ceiling or the browser downloads the wrong variant. */
const SIZES = {
  full: '(max-width: 60rem) 100vw, 60rem',
  half: '320px',
  document: '288px',
} as const;

// Never request a width larger than the source (ProductHero.astro has the same
// guard for the same reason), and never larger than the box will render.
const widths = [400, 800, 1200].filter((w) => w <= Math.min(image.width, CAP[size]));
if (widths.length === 0) widths.push(Math.min(image.width, CAP[size]));

// Without an explicit `width`, Picture generates its fallback <img> at the source's
// intrinsic size regardless of `widths`. That is how Plan 3 shipped a 1.5 MB
// fallback nobody could download.
const width = Math.max(...widths);
const height = Math.round((image.height / image.width) * width);
---
<figure class:list={['archive', size]} data-archive-figure>
  <Picture
    src={image}
    alt={alt}
    width={width}
    height={height}
    widths={widths}
    sizes={SIZES[size]}
    formats={['avif', 'webp']}
    loading={loading}
    decoding="async"
  />
  <figcaption>{caption}</figcaption>
</figure>

<style>
  .archive {
    margin: var(--s-6) 0 var(--s-8);
    background: var(--c-raised);
    border: 1px solid var(--c-line);
  }
  .full { max-width: 100%; }
  .half { max-width: 320px; }
  .document { max-width: 288px; }

  .archive :global(img) {
    display: block;
    width: 100%;
    height: auto;
  }
  figcaption {
    font-family: var(--font-mono);
    font-size: var(--t-12);
    line-height: 1.45;
    color: var(--c-text-2);
    padding: var(--s-3);
    border-top: 1px solid var(--c-line);
  }
</style>
```

- [ ] **Step 2: Confirm it compiles and changes nothing yet**

Run: `npm run build && npm test`
Expected: build exits 0 with 18 pages, all tests pass. An unimported component is compiled but emits nothing.

Run: `node .claude/skills/impeccable/scripts/detect.mjs --json src/components src/pages src/styles`
Expected: `[]`

- [ ] **Step 3: Commit**

```bash
git add src/components/ArchiveFigure.astro
git commit -m "feat: add ArchiveFigure for captioned archive photography"
```

---

### Task 3: `/company/about/`

The first `/company/` route, so it is also the first page the Tier 3 rule actually bites on. Its argument is the one thing about LiTex a buyer most needs and the old site asserted in three sentences: this is a 27-year-old manufacturer with premises, plant and people, not a trading desk.

Every photograph here is evidence for a sentence next to it. The nameplates back the Hen Hao Trading claim, the plant backs "loom-made and mass manufacturable", the building backs the address in the footer.

There is **no breadcrumb to `/company/` yet** — that route does not exist until Task 6. Do not add one early; it would be a 404 on the site's newest page.

**Files:**
- Create: `src/pages/company/about.astro`
- Test: `tests/company.test.ts`

**Interfaces:**
- Consumes: `ArchiveFigure` from Task 2; `COMPANY` from `src/lib/company.ts`.
- Produces: the route `/company/about/`, carrying `[data-source-note]` and at least three `[data-archive-figure]` elements.

- [ ] **Step 1: Write the failing test**

Create `tests/company.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { parseHTML } from 'linkedom';

function docFor(relativePath: string) {
  return parseHTML(
    readFileSync(fileURLToPath(new URL(`../dist/${relativePath}`, import.meta.url)), 'utf8'),
  ).document;
}

describe('company — about', () => {
  it('generates the route with a single h1 and its canonical', () => {
    const doc = docFor('company/about/index.html');
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://litex.com.tw/company/about/');
  });

  it('states the founding facts the whole credibility argument rests on', () => {
    const text = docFor('company/about/index.html').body.textContent ?? '';
    expect(text).toContain('1999');
    expect(text).toContain('Hen Hao Trading');
    expect(text).toContain('narrow fabrics');
  });

  // The nameplate photograph is the only evidence anywhere in the archive that the
  // Hen Hao heritage claim is more than a sentence. Naming the second predecessor
  // matters too: it appears in no archived HTML, only in this photograph.
  it('names the predecessor businesses the nameplate photograph shows', () => {
    const text = docFor('company/about/index.html').body.textContent ?? '';
    expect(text).toContain('Taiwan Tulip Ribbon & Braids');
  });

  it('shows premises, plant and people rather than asserting them', () => {
    const figures = docFor('company/about/index.html').querySelectorAll('[data-archive-figure]');
    expect(figures.length, 'fewer than three archive photographs').toBeGreaterThanOrEqual(3);
  });

  it('captions every photograph with where it came from', () => {
    for (const fig of [...docFor('company/about/index.html').querySelectorAll('[data-archive-figure]')]) {
      const caption = fig.querySelector('figcaption')?.textContent ?? '';
      expect(caption, 'a photograph has no caption').toBeTruthy();
      expect(caption, `caption does not name its source: ${caption}`)
        .toContain('2018-company-introduction.pdf');
    }
  });

  it('dates the photographs rather than passing 2018 off as today', () => {
    const note = docFor('company/about/index.html').querySelector('[data-source-note]');
    expect(note?.textContent).toContain('2018');
  });

  it('links the storefront that is still LiTex\'s working inbound channel', () => {
    const hrefs = [...docFor('company/about/index.html').querySelectorAll('main a')]
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('https://litex.en.alibaba.com/');
  });

  // Astro's compressHTML strips the newline between text and a following element,
  // so `since\n<span>1999</span>` ships as `since1999`. Every phrase below spans one
  // of those joins in the page source. Add a phrase whenever you add such a join —
  // this list is not self-maintaining.
  it('keeps spaces around inline values that start a source line', () => {
    const text = docFor('company/about/index.html').body.textContent ?? '';
    for (const phrase of [
      'and Taiwan Tulip Ribbon & Braids',
      'later, Conductive Metal Yarn',
      'up to 70 cm. See the full comparison',
      'person is sales@litex.com.tw',
      'storefront at litex.en.alibaba.com',
    ]) {
      expect(text, `lost the space in "${phrase}"`).toContain(phrase);
    }
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npm run build && npx vitest run tests/company.test.ts`
Expected: FAIL — `ENOENT` on `dist/company/about/index.html`.

- [ ] **Step 3: Create `src/pages/company/about.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ArchiveFigure from '../../components/ArchiveFigure.astro';
import { COMPANY } from '../../lib/company';
import premises from '../../assets/company/premises.jpg';
import nameplates from '../../assets/company/heritage-nameplates.jpg';
import factory from '../../assets/company/factory-floor.jpg';
import stand from '../../assets/company/trade-show-stand.jpg';

const CATALOG = '2018-company-introduction.pdf';
---
<BaseLayout
  title="About LiTex — weaving conductive elements into textile since 1999"
  description="LiTex is a 1999 spinoff of Hen Hao Trading, a Taipei narrow-fabrics manufacturer. Woven metal for heavy industry came first; conductive metal yarn grew out of it."
>
  <h1>About LiTex</h1>

  <p class="lede">
    We specialize in weaving conductive elements into textile. The weaving came first — the
    conductivity was added to a competence the business already had.
  </p>

  <h2>A spinoff, not a startup</h2>

  <p>
    LiTex was founded in 1999 as a spinoff of <strong>Hen Hao Trading</strong>, a traditional
    narrow fabrics manufacturer. Narrow fabrics — tapes, ribbons, webbing, braid — are made on
    looms built for exactly the widths a conductive tape needs, which is why a conductive yarn
    business grew out of a ribbon business rather than out of an electronics one.
  </p>

  <ArchiveFigure
    image={nameplates}
    size="half"
    alt="Two brushed-steel company nameplates mounted side by side, engraved 恆好貿易有限公司 / HEN HAO TRADING CO., LTD. and 台灣吉普織帶工業 / TAIWAN TULIP RIBBON & BRAIDS"
    caption={`The businesses LiTex came out of. Photographed for ${CATALOG}.`}
  />

  <p>
    The nameplates above are the two businesses that came before: Hen Hao Trading, and{' '}
    <strong>Taiwan Tulip Ribbon &amp; Braids</strong> — a ribbon and braid works. Both plates
    still hang at the same premises.
  </p>

  <h2>Woven metal came before conductive yarn</h2>

  <p>
    Through special projects and contracts, LiTex moved into manufacturing for heavy industries
    that needed woven metal products. Those projects are where the competence came from: putting
    metal into fabric without the fabric ceasing to behave like fabric. That skill produced the
    Wired Conductive Woven Tape and, later,{' '}
    <a href="/products/conductive-metal-yarn/">Conductive Metal Yarn</a>.
  </p>

  <blockquote>
    <p>
      Our objective is to create new innovative products, and take a step into functional fabrics
      to make ourselves standout in an ever-evolving industry.
    </p>
  </blockquote>

  <h2>Made on looms, not by hand</h2>

  <ArchiveFigure
    image={factory}
    alt="Three photographs of the LiTex plant: a creel rack loaded with bobbins, a narrow-fabric loom drawing striped webbing over its rollers, and a long row of covering machines under a shed roof"
    caption={`Creel, narrow-fabric loom and covering machines. Photographed for ${CATALOG}.`}
  />

  <p>
    The claim that separates Conductive Metal Yarn from carbon fibre and stainless steel fibre is
    not a material claim, it is a manufacturing one: CMY is made ready to use on these looms,
    where the alternatives are mostly assembled by hand. Fabric width is customisable up to 70 cm.{' '}
    <a href="/technology/heating-element-comparison/">See the full comparison →</a>
  </p>

  <h2>Where we are, and where you can meet us</h2>

  <div class="cols">
    <ArchiveFigure
      image={premises}
      size="half"
      alt="A multi-storey building photographed from street level, with an illuminated shopfront sign reading LiTex above the characters LED 紡織科技"
      caption={`The Bangka Blvd. premises. Photographed for ${CATALOG}.`}
    />
    <ArchiveFigure
      image={stand}
      size="half"
      alt="Three LiTex staff in matching branded polo shirts standing in an exhibition stand, beneath a sign reading LITEX TEXTILE & TECH. CO., LTD."
      caption={`A LiTex stand and the people on it. Photographed for ${CATALOG}.`}
    />
  </div>

  <address class="contact">
    <span>{COMPANY.legalName}</span>
    {COMPANY.addressLines.map((line) => <span>{line}</span>)}
    <span>Tel <a class="value" href={COMPANY.phoneHref}>{COMPANY.phone}</a></span>
    <span>Fax <span class="value">{COMPANY.fax}</span></span>
    <span><a class="value" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></span>
    <span>{COMPANY.hours}</span>
  </address>

  <p>
    LiTex has exhibited at Techtextil in Frankfurt (2017), the Wire Show in Düsseldorf (2018) and
    the Wearable Expo in Tokyo (2022). Between shows, the fastest route to a person is{' '}
    <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> or the storefront at{' '}
    <a href="https://litex.en.alibaba.com/">litex.en.alibaba.com</a>.
  </p>

  <p class="note" data-source-note>
    <small>
      Photographs and company description are from {CATALOG} and the previous LiTex website, both
      dated 2018. Headcount, floor area and production capacity are not published anywhere LiTex
      has released, so they are not stated here.
    </small>
  </p>
</BaseLayout>

<style>
  .lede { font-size: var(--t-20); color: var(--c-text-2); max-width: 58ch; }
  p { max-width: 70ch; }
  blockquote {
    margin: var(--s-8) 0;
    padding-left: var(--s-6);
    border-left: 2px solid var(--c-copper);
  }
  blockquote p {
    font-size: var(--t-20);
    color: var(--c-text-1);
    margin: 0;
  }
  .cols {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-6);
  }
  .contact {
    display: flex;
    flex-direction: column;
    gap: var(--s-1);
    font-style: normal;
    color: var(--c-text-2);
    margin: var(--s-8) 0;
  }
  .note { color: var(--c-text-2); margin-top: var(--s-16); }
</style>
```

- [ ] **Step 4: Add `fax` to `src/lib/company.ts`**

The page above reads `COMPANY.fax`, which does not exist yet. Add it after `phoneHref`, and extend the file's opening comment:

```ts
  phoneHref: 'tel:+886223084712',
  /**
   * From the footer of archive/catalogs/201611e68ea7e588b6e599a8final.txt, which is
   * the only LiTex document that publishes it. Still worth carrying: fax is a live
   * channel in Taiwanese and Japanese industrial procurement.
   */
  fax: '+886-2-2308-4714',
```

- [ ] **Step 5: Run the test**

Run: `npm run build && npx vitest run tests/company.test.ts`
Expected: PASS. The build now emits 19 pages.

- [ ] **Step 6: Run everything, including the Tier 3 rule**

Run: `npm test`
Expected: all pass. `tests/imagery.test.ts` now finds four photographs on a Tier 3 page and resolves each against `src/assets/company/provenance.json`. If it reports "has no provenance entry", the filename in the manifest and the imported filename disagree.

Run: `node .claude/skills/impeccable/scripts/detect.mjs --json src/components src/pages src/styles`
Expected: `[]`

- [ ] **Step 7: Commit**

```bash
git add src/pages/company/about.astro src/lib/company.ts tests/company.test.ts
git commit -m "feat: add /company/about/ with the premises, plant and heritage photographs"
```

---

### Task 4: `/company/patents-and-awards/`

This page is the reason the plan exists in this order. Transcribing `archive/images/patents-and-awards.jpg` would publish two false statements: that US 12/787,378 is pending (it was abandoned in 2012) and that TW M371733 is issued (it lapsed in 2017). The archive is not a usable source here; the register is.

The composition follows from that. One live record, stated precisely and with its one real caveat. One award, transcribed in full because it is the strongest thing on the page and it is genuine. Then the dead filings, in a table, clearly labelled — which reads as candour to an engineer and costs nothing commercially, because a lapsed 2010 utility model was never doing any selling.

**Files:**
- Create: `src/data/patents.ts`, `src/pages/company/patents-and-awards.astro`
- Modify: `tests/company.test.ts`

**Interfaces:**
- Consumes: `SpecTable` from Plan 2 — props `{ table: { columns: CsvColumn[]; rows: CsvRow[] }, caption: string, sourceNote?: string, needsVerification?: boolean }`. `CsvColumn` is `{ key: string; label: string; unit?: string }` and `CsvRow` is `Record<string, string>`.
- Produces: `LAPSED_FILINGS` from `src/data/patents.ts`, shaped for `SpecTable` directly.
- Produces: the route `/company/patents-and-awards/`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/company.test.ts`:

```ts
describe('company — patents and awards', () => {
  it('generates the route with a single h1 and its canonical', () => {
    const doc = docFor('company/patents-and-awards/index.html');
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://litex.com.tw/company/patents-and-awards/');
  });

  it('cites the utility model in the form the register uses', () => {
    const text = docFor('company/patents-and-awards/index.html').body.textContent ?? '';
    expect(text).toContain('TWM545145');
    expect(text).toContain('Elastic ribbon having extensible electronic device');
    expect(text).toContain('2017-03-20');
  });

  // Taiwan utility models run ten years from filing and the sibling patent lapsed
  // for non-payment. Until LiTex confirms renewal, the page states the record and
  // stops. tests/chrome.test.ts separately bans the string "PATENTED" site-wide.
  it('does not assert a right currently in force', () => {
    const text = docFor('company/patents-and-awards/index.html').body.textContent ?? '';
    expect(text.toLowerCase()).toContain('renewal');
  });

  it('states plainly that the older filings are no longer in force', () => {
    const text = docFor('company/patents-and-awards/index.html').body.textContent ?? '';
    expect(text).toContain('Abandoned 2012-04-23');
    expect(text).toContain('Lapsed 2017-10-01');
  });

  it('renders the lapsed filings as a table, not prose', () => {
    const doc = docFor('company/patents-and-awards/index.html');
    const headers = [...doc.querySelectorAll('th[scope="col"]')].map((th) => th.textContent);
    expect(headers.join(' ')).toContain('Status');
    expect(doc.querySelectorAll('tbody tr')).toHaveLength(4);
  });

  it('names the register it was checked against, and when', () => {
    const note = docFor('company/patents-and-awards/index.html')
      .querySelector('[data-source-note]');
    expect(note?.textContent).toContain('2026-08-11');
  });

  it('transcribes the TAITRONICS award rather than leaving it in the photograph', () => {
    const text = docFor('company/patents-and-awards/index.html').body.textContent ?? '';
    for (const fact of [
      'TAITRONICS',
      'The Quality Award',
      'Non-Carbon Fiber Electrical Heating Textile',
      'September 2014',
    ]) {
      expect(text, `the award transcription is missing ${fact}`).toContain(fact);
    }
  });

  it('shows the award certificate itself', () => {
    const figures = docFor('company/patents-and-awards/index.html')
      .querySelectorAll('[data-archive-figure]');
    expect(figures.length).toBe(1);
  });

  // US 12/787,378 was abandoned, so the USPTO cover page in the catalog cannot be
  // attributed to it, and it carries no number of its own. Publishing it on this
  // page would assert a US grant LiTex does not hold.
  it('never publishes the unattributable US patent certificate', () => {
    const html = readFileSync(
      fileURLToPath(new URL('../dist/company/patents-and-awards/index.html', import.meta.url)),
      'utf8',
    );
    expect(html).not.toContain('us-patent');
    expect(html).not.toContain('Kappos');
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npm run build && npx vitest run tests/company.test.ts`
Expected: FAIL — `ENOENT` on `dist/company/patents-and-awards/index.html`.

- [ ] **Step 3: Create `src/data/patents.ts`**

```ts
/**
 * The patent record, as verified against the public registers on 2026-08-11.
 *
 * This deliberately does NOT come from archive/images/patents-and-awards.jpg. That
 * graphic lists US 12/787,378 as "pending" and TW M371733 as "issued"; the first was
 * abandoned in 2012 and the second lapsed in 2017. It also prints the utility model
 * number with a leading 1, which is a transcription artifact — the register shows
 * M545145. Publishing the graphic's contents would publish two false statements.
 *
 * Statuses below marked "Not verified" were not found in an English-language register
 * during the 2026-08-11 pass. They are shown as unverified rather than omitted,
 * because omitting a filing LiTex has published is its own kind of edit.
 */

/** The one record that is registered and attributable to LiTex with certainty. */
export const UTILITY_MODEL = {
  number: 'TWM545145U',
  shortNumber: 'M545145',
  title: 'Elastic ribbon having extensible electronic device',
  filed: '2017-03-20',
  holder: '富鉅紡織科技股份有限公司',
  /** Exact match for COMPANY.legalNameZh, which is what makes attribution certain. */
  holderNote: 'Registered to LiTex under its Chinese legal name',
} as const;

export const AWARD = {
  event: '40th Taipei International Electronics Show (TAITRONICS)',
  programme: 'Technology Innovation Awards · 科技創新獎',
  prize: 'The Quality Award · 優選獎',
  subject: 'Non-Carbon Fiber Electrical Heating Textile · 非碳纖維電子發熱紡織品',
  awardedTo: '富鉅紡織科技股份有限公司 / LiTex Textile & Technology Co., Ltd',
  /**
   * The certificate prints a full date in its bottom-right corner, but the day is
   * roughly five pixels tall in the only photograph that exists of it and the final
   * digit cannot be resolved — it is a 6 or a 9. An earlier session recorded
   * "2014.9.29" as fully read; re-checked at 14x on 2026-08-11, that confidence was
   * not warranted. The year and month are unambiguous, so those are what we publish.
   */
  dated: 'September 2014',
} as const;

/** Shaped for SpecTable directly — this is spec data, and it is rendered as such. */
export const LAPSED_FILINGS = {
  columns: [
    { key: 'number', label: 'Filing' },
    { key: 'subject', label: 'Subject' },
    { key: 'status', label: 'Status' },
  ],
  rows: [
    {
      number: 'TW M371733',
      subject: 'Conductive yarn withstanding dyeing, finishing and washing',
      status: 'Lapsed 2017-10-01 — renewal fees unpaid',
    },
    {
      number: 'US 12/787,378',
      subject: 'Conductive yarn withstanding dyeing, finishing and washing',
      status: 'Abandoned 2012-04-23 — no response to an office action. Never granted',
    },
    {
      number: 'CN 201485574U',
      subject: 'Conductive yarn withstanding dyeing, finishing and washing',
      status: 'Not verified',
    },
    {
      number: 'TW 099146482 · CN 201120008487.x',
      subject: 'Flexible heating element',
      status: 'Applications filed 2010–2011. Not verified',
    },
  ],
};
```

- [ ] **Step 4: Create `src/pages/company/patents-and-awards.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ArchiveFigure from '../../components/ArchiveFigure.astro';
import SpecTable from '../../components/SpecTable.astro';
import { UTILITY_MODEL, AWARD, LAPSED_FILINGS } from '../../data/patents';
import award from '../../assets/company/taitronics-award.jpg';

const CHECKED = '2026-08-11';
---
<BaseLayout
  title="Patents and awards — LiTex Textile & Technology"
  description="LiTex holds Taiwan utility model M545145 for an elastic ribbon with an extensible electronic device, and won the 2014 TAITRONICS Quality Award for non-carbon-fibre heating textile."
>
  <h1>Patents and awards</h1>

  <p class="lede">
    One registered utility model, one award, and four older filings that are no longer in force.
    Every status below was checked against the public registers on{' '}
    <span class="value">{CHECKED}</span> rather than copied from our own 2018 material.
  </p>

  <h2>Registered utility model</h2>

  <dl class="record">
    <div>
      <dt>Number</dt>
      <dd class="value">{UTILITY_MODEL.number}</dd>
    </div>
    <div>
      <dt>Title</dt>
      <dd>{UTILITY_MODEL.title}</dd>
    </div>
    <div>
      <dt>Filed</dt>
      <dd class="value">{UTILITY_MODEL.filed}</dd>
    </div>
    <div>
      <dt>Holder</dt>
      <dd>{UTILITY_MODEL.holder} — {UTILITY_MODEL.holderNote}</dd>
    </div>
  </dl>

  <p>
    This covers the construction behind the{' '}
    <a href="/products/wired-conductive-tape/">Wired Conductive Woven Tape</a>: an elastic ribbon
    carrying an electronic device that stretches with it.
  </p>

  <p class="caveat">
    A Taiwan utility model runs ten years from its filing date and must be maintained.{' '}
    <strong>We have not published a renewal confirmation for this record</strong>, and its
    sibling below lapsed for unpaid fees, so this page states what the register shows and no
    more. Ask us for the current certificate if the right matters to your decision.
  </p>

  <h2>2014 TAITRONICS Technology Innovation Award</h2>

  <div class="award">
    <ArchiveFigure
      image={award}
      size="document"
      alt="A framed certificate headed with a 40th anniversary mark and the TAITRONICS Technology Innovation Awards logo, naming 富鉅紡織科技股份有限公司 and the award 優選獎, The Quality Award"
      caption="TAITRONICS certificate, photographed for 2018-company-introduction.pdf."
    />
    <dl class="record">
      <div><dt>Event</dt><dd>{AWARD.event}</dd></div>
      <div><dt>Programme</dt><dd>{AWARD.programme}</dd></div>
      <div><dt>Prize</dt><dd>{AWARD.prize}</dd></div>
      <div><dt>For</dt><dd>{AWARD.subject}</dd></div>
      <div><dt>Awarded to</dt><dd>{AWARD.awardedTo}</dd></div>
      <div><dt>Dated</dt><dd class="value">{AWARD.dated}</dd></div>
    </dl>
  </div>

  <p>
    The award was for the heating textile specifically, and specifically for it{' '}
    <em>not</em> being carbon fibre — which is the same argument{' '}
    <a href="/technology/heating-element-comparison/">the comparison page</a> makes with numbers.
  </p>

  <h2>Earlier filings, no longer in force</h2>

  <p>
    Our 2018 catalog and website list these as issued or pending. That was true when it was
    written and is not true now. They are kept here because they are part of the record, not
    because they protect anything today.
  </p>

  <SpecTable
    table={LAPSED_FILINGS}
    caption="Earlier filings — status as at 2026-08-11"
    sourceNote="Statuses for the Taiwan and US records were read from the public registers on 2026-08-11. Filing numbers are from archive/extracted-from-images.md §2."
  />

  <p class="note" data-source-note>
    <small>
      Registers checked {CHECKED}. The number printed in our 2018 material is malformed — it
      carries a leading digit that is a transcription error. The register form is{' '}
      <span class="value">{UTILITY_MODEL.number}</span>.
    </small>
  </p>
</BaseLayout>

<style>
  .lede { font-size: var(--t-20); color: var(--c-text-2); max-width: 58ch; }
  p { max-width: 70ch; }
  .record { margin: var(--s-6) 0; display: grid; gap: var(--s-3); }
  .record div {
    display: grid;
    grid-template-columns: minmax(0, 9rem) 1fr;
    gap: var(--s-4);
    align-items: baseline;
  }
  dt {
    font-family: var(--font-mono);
    font-size: var(--t-10);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--c-text-2);
  }
  dd { margin: 0; }
  .caveat {
    border-left: 2px solid var(--c-legacy);
    padding-left: var(--s-6);
    color: var(--c-text-2);
  }
  .award {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-8);
    align-items: flex-start;
  }
  .award .record { flex: 1 1 20rem; }
  .note { color: var(--c-text-2); margin-top: var(--s-16); }
</style>
```

- [ ] **Step 5: Run the tests**

Run: `npm run build && npx vitest run tests/company.test.ts`
Expected: PASS. 20 pages.

If the chrome suite fails on `asserts an unverified patent grant`, something on this page rendered the uppercase string. Find it with:
`grep -rn "PATENTED" dist/company/`

- [ ] **Step 6: Full test and detector**

Run: `npm test`
Expected: all pass.

Run: `node .claude/skills/impeccable/scripts/detect.mjs --json src/components src/pages src/styles`
Expected: `[]`

- [ ] **Step 7: Commit**

```bash
git add src/data/patents.ts src/pages/company/patents-and-awards.astro tests/company.test.ts
git commit -m "feat: add /company/patents-and-awards/ with verified register statuses"
```

---

### Task 5: `/company/certifications/`

Spec §7 item 5 rates the missing certification documents "High", and calls compliance "a hard filter" in European procurement. LiTex has claims, not documents: REACH and RoHS appear on catalog pages, and the SGS report exists only as a photograph of its cover.

The page therefore does the one useful thing available — it tells a buyer exactly what is claimed, exactly where LiTex claims it, and exactly which document exists behind it. A procurement officer can act on that: they know what to ask for and they know the age of it. A page of badges could not be acted on at all, and would be a lie.

**Files:**
- Create: `src/data/certifications.ts`, `src/pages/company/certifications.astro`
- Modify: `tests/company.test.ts`

**Interfaces:**
- Consumes: `SpecTable`, `ArchiveFigure`, `COMPANY`.
- Produces: `COMPLIANCE_CLAIMS` (a `SpecTable` table object) and `SGS_REPORT` from `src/data/certifications.ts`.
- Produces: the route `/company/certifications/`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/company.test.ts`:

```ts
describe('company — certifications', () => {
  it('generates the route with a single h1 and its canonical', () => {
    const doc = docFor('company/certifications/index.html');
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://litex.com.tw/company/certifications/');
  });

  it('covers all three claims the credibility bar makes', () => {
    const text = docFor('company/certifications/index.html').body.textContent ?? '';
    for (const claim of ['REACH', 'RoHS', 'SGS']) {
      expect(text, `${claim} is not accounted for`).toContain(claim);
    }
  });

  // The distinction the whole page turns on: a claim in our own catalog is not a
  // certificate. A buyer must be able to see which is which at a glance.
  it('says for every claim whether a document is published behind it', () => {
    const doc = docFor('company/certifications/index.html');
    const headers = [...doc.querySelectorAll('th[scope="col"]')].map((th) => th.textContent);
    expect(headers.join(' ')).toContain('Document published here');
    expect(doc.querySelectorAll('tbody tr')).toHaveLength(3);
  });

  it('names the SGS report number and its year', () => {
    const text = docFor('company/certifications/index.html').body.textContent ?? '';
    expect(text).toContain('CE/2013/52203');
    expect(text).toContain('2013');
  });

  it('admits what the report photograph does not show', () => {
    const text = docFor('company/certifications/index.html').body.textContent ?? '';
    expect(text.toLowerCase()).toContain('not legible');
  });

  it('shows the report cover, captioned to its source', () => {
    const figures = docFor('company/certifications/index.html')
      .querySelectorAll('[data-archive-figure]');
    expect(figures.length).toBe(1);
    expect(figures[0].querySelector('figcaption')?.textContent)
      .toContain('2018-company-introduction.pdf');
  });

  it('gives a buyer a route to the actual documents', () => {
    const hrefs = [...docFor('company/certifications/index.html').querySelectorAll('main a')]
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('mailto:sales@litex.com.tw');
  });

  // A REACH or RoHS badge graphic asserts a conformity assessment that no document
  // on this site supports. Words can be qualified; a badge cannot.
  it('displays no compliance badge imagery', () => {
    const doc = docFor('company/certifications/index.html');
    for (const img of [...doc.querySelectorAll('img')]) {
      const alt = (img.getAttribute('alt') ?? '').toLowerCase();
      expect(alt, 'a REACH/RoHS badge is being rendered').not.toMatch(/reach|rohs/);
    }
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npm run build && npx vitest run tests/company.test.ts`
Expected: FAIL — `ENOENT` on `dist/company/certifications/index.html`.

- [ ] **Step 3: Create `src/data/certifications.ts`**

```ts
/**
 * What LiTex claims about compliance, and what backs each claim.
 *
 * The third column is the point of the table. REACH and RoHS are asserted on catalog
 * pages and nowhere else; the SGS report exists as a photograph of its cover, from
 * which only the report number is readable. Spec §7 item 5 tracks obtaining the real
 * documents. Until they arrive, the honest thing is to publish the distinction rather
 * than a row of badges.
 */

/** Shaped for SpecTable directly. */
export const COMPLIANCE_CLAIMS = {
  columns: [
    { key: 'claim', label: 'Claim' },
    { key: 'where', label: 'Where LiTex states it' },
    { key: 'document', label: 'Document published here' },
    { key: 'dated', label: 'Dated' },
  ],
  rows: [
    {
      claim: 'REACH compliant',
      where: '2018-non-carbon-electrical-heating-textile.pdf, p.1 features list',
      document: 'None — claim only',
      dated: '2018',
    },
    {
      claim: 'RoHS compliant',
      where:
        '2018-non-carbon-electrical-heating-textile.pdf p.1; 2018-emi-shielding-wire-tube.pdf states "RoHS certified eco-friendly"',
      document: 'None — claim only',
      dated: '2018',
    },
    {
      claim: 'SGS test certified toughness',
      where: '2018-non-carbon-electrical-heating-textile.pdf, p.1 features list',
      document: 'Report cover photograph — number only',
      dated: '2013',
    },
  ],
};

export const SGS_REPORT = {
  number: 'CE/2013/52203',
  year: 2013,
  /** What the stored photograph actually resolves, checked 2026-08-11. */
  readable: 'The report number, the SGS mark, and a photograph of the tested sample',
  notReadable: 'The test scope, the standards applied, the results, and the addressee block',
} as const;
```

- [ ] **Step 4: Create `src/pages/company/certifications.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ArchiveFigure from '../../components/ArchiveFigure.astro';
import SpecTable from '../../components/SpecTable.astro';
import { COMPLIANCE_CLAIMS, SGS_REPORT } from '../../data/certifications';
import { COMPANY } from '../../lib/company';
import sgs from '../../assets/company/sgs-test-report.jpg';
---
<BaseLayout
  title="Certifications and test reports — LiTex Textile & Technology"
  description="REACH, RoHS and SGS: what LiTex claims, the document each claim rests on, and how to request the certificates themselves."
>
  <h1>Certifications and test reports</h1>

  <p class="lede">
    European procurement treats compliance documents as a filter, not a footnote. This page states
    what we claim, where we claim it, and which document exists behind it — including where that
    document is a claim rather than a certificate.
  </p>

  <SpecTable
    table={COMPLIANCE_CLAIMS}
    caption="Compliance claims and their supporting documents"
    sourceNote="Read from the catalogs named in each row. No claim on this page originates anywhere other than LiTex's own published material."
  />

  <h2>SGS Test Report {SGS_REPORT.number}</h2>

  <div class="report">
    <ArchiveFigure
      image={sgs}
      size="document"
      alt="The cover page of an SGS test report, headed 測試報告 Test Report, carrying the report number CE/2013/52203 above a photograph of a fabric sample"
      caption="SGS report cover, photographed for 2018-company-introduction.pdf."
    />
    <div class="detail">
      <p>
        The report was issued in <span class="value">{SGS_REPORT.year}</span> and covers toughness
        testing. We publish the cover photograph rather than the report because the cover is what
        our 2018 catalog contains.
      </p>
      <p>
        <strong>Readable at the resolution we hold:</strong> {SGS_REPORT.readable}.
      </p>
      <p>
        <strong>Not legible:</strong> {SGS_REPORT.notReadable}. We are not going to summarise a
        scope we cannot read.
      </p>
    </div>
  </div>

  <h2>Asking for the documents</h2>

  <p>
    If your qualification process needs the certificates themselves — the SGS report in full, or
    REACH and RoHS declarations with dates and scope — write to{' '}
    <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> and say which product and which market
    you are qualifying for. That is faster than working from a thirteen-year-old cover page, and
    it is the only way to get a document that is current.
  </p>

  <p class="note" data-source-note>
    <small>
      All claims on this page are LiTex's own, taken from the catalogs named in the table above and
      dated 2018 or earlier. Nothing here has been re-tested or re-certified since. Product pages
      show the same claims per product:{' '}
      <a href="/products/">see the product index</a>.
    </small>
  </p>
</BaseLayout>

<style>
  .lede { font-size: var(--t-20); color: var(--c-text-2); max-width: 58ch; }
  p { max-width: 70ch; }
  .report {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-8);
    align-items: flex-start;
  }
  .detail { flex: 1 1 22rem; }
  .detail p:first-child { margin-top: 0; }
  .note { color: var(--c-text-2); margin-top: var(--s-16); }
</style>
```

- [ ] **Step 5: Run the tests**

Run: `npm run build && npx vitest run tests/company.test.ts`
Expected: PASS. 21 pages.

- [ ] **Step 6: Full test and detector**

Run: `npm test`
Expected: all pass.

Run: `node .claude/skills/impeccable/scripts/detect.mjs --json src/components src/pages src/styles`
Expected: `[]`

- [ ] **Step 7: Commit**

```bash
git add src/data/certifications.ts src/pages/company/certifications.astro tests/company.test.ts
git commit -m "feat: add /company/certifications/ stating claims and their evidence separately"
```

---

### Task 6: The `/company/` hub, breadcrumbs, and wiring it into the chrome

Spec §3 says the hub "carries the credibility bar" and is "not a bare path segment". The footer already carries the credibility bar on every page, so repeating it here would be decoration. The hub does something better with the same five strings: it turns each one into a link to the page that substantiates it. A claim that leads to its evidence is worth more than a claim repeated twice.

The three leaf pages get their breadcrumb in this task, because this is the first commit in which `/company/` exists to point at. The footer's Browse list starts rendering from `NAV` in the same commit, so that adding a nav entry can never again leave the footer behind.

**Files:**
- Create: `src/pages/company/index.astro`
- Modify: `src/lib/company.ts`, `src/lib/nav.ts`, `src/components/SiteFooter.astro`, and all three of `src/pages/company/{about,patents-and-awards,certifications}.astro`
- Modify: `tests/company.test.ts`

**Interfaces:**
- Produces: `CREDIBILITY_EVIDENCE: Readonly<Record<string, string>>` from `src/lib/company.ts`, keyed by exactly the strings in `CREDIBILITY`.
- Produces: the route `/company/`, and `NAV` gains `{ href: '/company/', label: 'Company' }`.
- Produces: a `<p class="breadcrumb">` as the first element of `<main>` on each of the three leaf pages.

- [ ] **Step 1: Write the failing tests**

Append to `tests/company.test.ts`. **Merge the three new imports into the statements already at the top of the file** — `readFileSync` is already imported from `node:fs`, so add `existsSync`, `readdirSync` and `statSync` to that same line, and add the `node:path` line beside it. The three constants below go under the existing `docFor` helper.

```ts
// at the top of the file, alongside the existing imports:
//   import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
//   import { join } from 'node:path';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/** Maps an internal href to the file Astro's build.format:'directory' emits for it. */
function routeFile(href: string): string {
  const clean = href.replace(/^\//, '').replace(/\/$/, '');
  return clean === '' ? 'index.html' : `${clean}/index.html`;
}

describe('company — hub', () => {
  it('generates the route with a single h1 and its canonical', () => {
    const doc = docFor('company/index.html');
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://litex.com.tw/company/');
  });

  it('links all three company pages', () => {
    const hrefs = [...docFor('company/index.html').querySelectorAll('main a')]
      .map((a) => a.getAttribute('href'));
    for (const href of [
      '/company/about/', '/company/patents-and-awards/', '/company/certifications/',
    ]) {
      expect(hrefs, `hub does not link ${href}`).toContain(href);
    }
  });

  // The hub's job: every claim the footer makes site-wide becomes a link to the page
  // that substantiates it.
  it('turns each credibility claim into a link to its evidence', async () => {
    const { CREDIBILITY, CREDIBILITY_EVIDENCE } = await import('../src/lib/company');
    const doc = docFor('company/index.html');
    const links = [...doc.querySelectorAll('[data-credibility-evidence] a')];
    expect(links).toHaveLength(CREDIBILITY.length);
    for (const claim of CREDIBILITY) {
      const link = links.find((a) => (a.textContent ?? '').includes(claim));
      expect(link, `no evidence link for "${claim}"`).toBeTruthy();
      expect(link?.getAttribute('href')).toBe(CREDIBILITY_EVIDENCE[claim]);
    }
  });

  it('never lets a credibility claim exist without an evidence route', async () => {
    const { CREDIBILITY, CREDIBILITY_EVIDENCE } = await import('../src/lib/company');
    expect(Object.keys(CREDIBILITY_EVIDENCE).sort()).toEqual([...CREDIBILITY].sort());
  });

  it('is reachable from the primary navigation', () => {
    const hrefs = [...docFor('index.html').querySelectorAll('nav[aria-label="Primary"] a')]
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/company/');
  });

  it('gives every company page a way back up', () => {
    for (const slug of ['about', 'patents-and-awards', 'certifications']) {
      const crumb = docFor(`company/${slug}/index.html`).querySelector('.breadcrumb a');
      expect(crumb?.getAttribute('href'), `${slug} has no breadcrumb`).toBe('/company/');
    }
  });

  // Plan 8 adds a whole-site link checker. Until then this covers the section that
  // just gained the most internal cross-linking in one commit.
  it('links nothing from a /company/ page that the build did not generate', () => {
    const broken: string[] = [];
    for (const file of walk(join(DIST, 'company')).filter((f) => f.endsWith('.html'))) {
      const doc = parseHTML(readFileSync(file, 'utf8')).document;
      for (const a of [...doc.querySelectorAll('a')]) {
        const href = a.getAttribute('href') ?? '';
        if (!href.startsWith('/')) continue;
        if (!existsSync(join(DIST, routeFile(href)))) broken.push(`${file} → ${href}`);
      }
    }
    expect(broken, `broken links:\n${broken.join('\n')}`).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npm run build && npx vitest run tests/company.test.ts`
Expected: FAIL — `ENOENT` on `dist/company/index.html`.

- [ ] **Step 3: Add the evidence map to `src/lib/company.ts`**

Append, below the existing `CREDIBILITY` export:

```ts
/**
 * Where each credibility claim is substantiated. The /company/ hub renders the bar
 * as links through this map, so a claim the site cannot back up has nowhere to point.
 * tests/company.test.ts fails if the keys drift from CREDIBILITY.
 *
 * The footer keeps rendering CREDIBILITY as plain text: five links in the footer of
 * every page is noise, and the hub is where a buyer goes to check.
 */
export const CREDIBILITY_EVIDENCE: Readonly<Record<string, string>> = {
  REACH: '/company/certifications/',
  RoHS: '/company/certifications/',
  'SGS TESTED': '/company/certifications/',
  'TW UTILITY MODEL M545145': '/company/patents-and-awards/',
  'MANUFACTURING SINCE 1999': '/company/about/',
};
```

- [ ] **Step 4: Create `src/pages/company/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { COMPANY, CREDIBILITY, CREDIBILITY_EVIDENCE } from '../../lib/company';

const SECTIONS = [
  {
    href: '/company/about/',
    title: 'About',
    blurb: 'A 1999 spinoff of a narrow-fabrics manufacturer, with the premises, plant and people photographed.',
  },
  {
    href: '/company/patents-and-awards/',
    title: 'Patents and awards',
    blurb: 'One registered utility model and the 2014 TAITRONICS Quality Award, with every status checked against the register.',
  },
  {
    href: '/company/certifications/',
    title: 'Certifications',
    blurb: 'REACH, RoHS and SGS — what we claim, where we claim it, and which document exists behind each one.',
  },
];
---
<BaseLayout
  title="Company — LiTex Textile & Technology"
  description="LiTex Textile & Technology Co., Ltd., Taipei. Manufacturing since 1999. Company background, patents and awards, and compliance documentation."
>
  <h1>Company</h1>

  <p class="lede">
    Manufacturing in Taipei since {COMPANY.foundedYear}. Every claim we make about ourselves has a
    page behind it.
  </p>

  <ul class="evidence value" data-credibility-evidence>
    {CREDIBILITY.map((claim) => (
      <li><a href={CREDIBILITY_EVIDENCE[claim]}>{claim}</a></li>
    ))}
  </ul>

  <div class="grid">
    {SECTIONS.map((section) => (
      <a class="card" href={section.href}>
        <h2>{section.title}</h2>
        <p>{section.blurb}</p>
      </a>
    ))}
  </div>

  <h2>Contact of record</h2>

  <address class="contact">
    <span>{COMPANY.legalName}</span>
    <span>{COMPANY.legalNameZh}</span>
    {COMPANY.addressLines.map((line) => <span>{line}</span>)}
    <span>Tel <a class="value" href={COMPANY.phoneHref}>{COMPANY.phone}</a></span>
    <span>Fax <span class="value">{COMPANY.fax}</span></span>
    <span><a class="value" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></span>
    <span>{COMPANY.hours}</span>
  </address>
</BaseLayout>

<style>
  .lede { font-size: var(--t-20); color: var(--c-text-2); max-width: 58ch; }
  .evidence {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-2) var(--s-4);
    margin: var(--s-8) 0;
    padding: 0;
    font-size: var(--t-10);
    letter-spacing: 0.12em;
  }
  .evidence li + li::before {
    content: '·';
    margin-right: var(--s-4);
    color: var(--c-line);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
    gap: var(--s-4);
    margin: var(--s-8) 0;
  }
  .card {
    display: block;
    padding: var(--s-6);
    background: var(--c-raised);
    border: 1px solid var(--c-line);
    text-decoration: none;
    color: var(--c-text-1);
  }
  .card:hover { border-color: var(--c-copper); }
  .card h2 { margin: 0 0 var(--s-2); font-size: var(--t-20); color: var(--c-copper); }
  .card p { margin: 0; color: var(--c-text-2); font-size: var(--t-14); }
  .contact {
    display: flex;
    flex-direction: column;
    gap: var(--s-1);
    font-style: normal;
    color: var(--c-text-2);
  }
</style>
```

- [ ] **Step 5: Add the breadcrumb to all three leaf pages**

In each of `about.astro`, `patents-and-awards.astro` and `certifications.astro`, insert this as the first line inside `<BaseLayout>`, immediately above the `<h1>`:

```astro
  <p class="breadcrumb"><a href="/company/">← Company</a></p>
```

And add to each page's `<style>` block:

```css
  .breadcrumb { font-size: var(--t-14); }
```

- [ ] **Step 6: Add `/company/` to `src/lib/nav.ts`**

```ts
export const NAV: readonly NavItem[] = [
  { href: '/products/', label: 'Products' },
  { href: '/applications/', label: 'Applications' },
  { href: '/technology/', label: 'Technology' },
  { href: '/company/', label: 'Company' },
];
```

- [ ] **Step 7: Render the footer's Browse list from `NAV`**

In `src/components/SiteFooter.astro`, change the import line and the secondary nav block. The import becomes:

```astro
import { COMPANY, CREDIBILITY } from '../lib/company';
import { NAV } from '../lib/nav';
```

And the `<nav class="secondary">` block becomes:

```astro
      <nav class="secondary" aria-label="Footer">
        <span class="label">Browse</span>
        {NAV.map((item) => <a href={item.href}>{item.label}</a>)}
      </nav>
```

This is the reason `tests/chrome.test.ts` walks footer links too: the footer now inherits every future nav entry automatically, including the one Task 7 adds.

- [ ] **Step 8: Run the tests**

Run: `npm run build && npm test`
Expected: PASS, 22 pages. `tests/chrome.test.ts` now walks a `/company/` link in both masthead and footer and finds `dist/company/index.html` behind it.

Run: `node .claude/skills/impeccable/scripts/detect.mjs --json src/components src/pages src/styles`
Expected: `[]`

- [ ] **Step 9: Commit**

```bash
git add src/pages/company src/lib/company.ts src/lib/nav.ts src/components/SiteFooter.astro tests/company.test.ts
git commit -m "feat: add the /company/ hub and wire the section into the chrome"
```

---

### Task 7: `/downloads/` and actually serving the catalogs

Spec §0 item 3: the six catalogs "hold the best content on the site, unlinked from any product page." They still are. `src/pages/products/[slug].astro:97-99` prints `Catalog: 2018-rfid-textile-tape.pdf` as dead text, because nothing serves the file.

The PDFs are already in the repository, under `archive/`. Committing a second copy under `public/` would add 11 MB of duplicate binary to satisfy a path convention, so a prebuild step copies them instead and `public/catalogs/` is gitignored. That introduces exactly one failure mode — someone builds without the step and ships six broken links — so a test asserts the files reached `dist/`, and byte sizes are recorded in a committed JSON so the page never needs the filesystem at render time.

**Files:**
- Create: `scripts/sync-catalogs.mjs`, `src/data/catalogs.ts`, `src/data/catalog-files.json` (generated, committed), `src/pages/downloads.astro`
- Modify: `package.json`, `.gitignore`, `src/lib/nav.ts`, `src/pages/products/[slug].astro:97-99`
- Test: `tests/downloads.test.ts`

**Interfaces:**
- Produces: `CATALOGS: readonly Catalog[]` from `src/data/catalogs.ts`, where
  `type Catalog = { file: string; title: string; description: string; pages: number; year: number; product?: string }`.
- Produces: `src/data/catalog-files.json`, shape `Record<string, { bytes: number }>`, keyed by filename.
- Produces: every catalog served at `/catalogs/<file>`.

- [ ] **Step 1: Write the failing tests**

Create `tests/downloads.test.ts`:

```ts
import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { parseHTML } from 'linkedom';
import { CATALOGS } from '../src/data/catalogs';
import catalogFiles from '../src/data/catalog-files.json';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const ARCHIVE = fileURLToPath(new URL('../archive/catalogs', import.meta.url));

function docFor(relativePath: string) {
  return parseHTML(readFileSync(join(DIST, relativePath), 'utf8')).document;
}

describe('catalog delivery', () => {
  // public/catalogs/ is generated by the prebuild step and gitignored. If that step
  // is skipped the page still renders and every download link 404s, which is worse
  // than the dead text it replaced. Fail loudly instead.
  it('serves every catalog from dist, at full size', () => {
    for (const catalog of CATALOGS) {
      const served = join(DIST, 'catalogs', catalog.file);
      expect(existsSync(served), `${catalog.file} was never copied into dist`).toBe(true);
      expect(statSync(served).size).toBe(statSync(join(ARCHIVE, catalog.file)).size);
    }
  });

  it('records a byte size that matches the file on disk', () => {
    for (const catalog of CATALOGS) {
      expect(
        (catalogFiles as Record<string, { bytes: number }>)[catalog.file]?.bytes,
        `${catalog.file} size has drifted — re-run scripts/sync-catalogs.mjs`,
      ).toBe(statSync(join(ARCHIVE, catalog.file)).size);
    }
  });

  it('lists exactly the six catalogs the old site offered', () => {
    expect(CATALOGS).toHaveLength(6);
  });
});

describe('downloads page', () => {
  it('generates the route with a single h1 and its canonical', () => {
    const doc = docFor('downloads/index.html');
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://litex.com.tw/downloads/');
  });

  it('links every catalog', () => {
    const hrefs = [...docFor('downloads/index.html').querySelectorAll('main a[href$=".pdf"]')]
      .map((a) => a.getAttribute('href'));
    for (const catalog of CATALOGS) {
      expect(hrefs, `${catalog.file} is not linked`).toContain(`/catalogs/${catalog.file}`);
    }
  });

  // A buyer on a trade-show wifi connection deciding whether to tap a 6 MB download
  // needs to know it is 6 MB before tapping it.
  it('states size and page count for every catalog before the click', () => {
    const doc = docFor('downloads/index.html');
    for (const catalog of CATALOGS) {
      const row = [...doc.querySelectorAll('[data-catalog]')]
        .find((el) => el.getAttribute('data-catalog') === catalog.file);
      expect(row, `${catalog.file} has no entry`).toBeTruthy();
      const text = row?.textContent ?? '';
      expect(text, `${catalog.file} does not state its size`).toMatch(/\d+(\.\d+)?\s*(KB|MB)/);
      expect(text, `${catalog.file} does not state its page count`).toContain('pages');
    }
  });

  it('describes each catalog rather than repeating its filename', () => {
    for (const catalog of CATALOGS) {
      expect(catalog.description.length, `${catalog.file} description is too thin`)
        .toBeGreaterThan(60);
      expect(catalog.description).not.toContain('.pdf');
    }
  });

  it('says how old the catalogs are, once, plainly', () => {
    const text = docFor('downloads/index.html').body.textContent ?? '';
    expect(text).toContain('2018');
  });

  it('is reachable from the primary navigation', () => {
    const hrefs = [...docFor('index.html').querySelectorAll('nav[aria-label="Primary"] a')]
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/downloads/');
  });
});

describe('product pages link their catalog', () => {
  it('turns catalogPdf into a real download instead of dead text', () => {
    const doc = docFor('products/rfid-textile-tape/index.html');
    const link = doc.querySelector('a[href="/catalogs/2018-rfid-textile-tape.pdf"]');
    expect(link, 'the RFID product page still prints its catalog as plain text').toBeTruthy();
  });

  it('never links a catalog that is not served', () => {
    for (const slug of [
      'conductive-metal-yarn', 'electrical-heating-textile', 'emi-shielding-woven-tube',
      'rfid-textile-tape', 'silica-gel-switch-controller',
    ]) {
      const doc = docFor(`products/${slug}/index.html`);
      for (const a of [...doc.querySelectorAll('a[href^="/catalogs/"]')]) {
        const href = a.getAttribute('href') ?? '';
        expect(existsSync(join(DIST, href.replace(/^\//, ''))), `${slug} → ${href}`).toBe(true);
      }
    }
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npx vitest run tests/downloads.test.ts`
Expected: FAIL — cannot resolve `../src/data/catalogs`.

- [ ] **Step 3: Create `scripts/sync-catalogs.mjs`**

```js
/**
 * Copy the six catalog PDFs out of archive/ and into public/, and record their sizes.
 *
 * Run: node scripts/sync-catalogs.mjs   (npm runs it automatically via `prebuild`)
 *
 * Why a build step rather than committed files: the PDFs total roughly 11 MB and are
 * already versioned under archive/, which is the source of truth for everything on
 * this site. A second committed copy would double that for no reason and could drift
 * from the first. public/catalogs/ is gitignored.
 *
 * The size manifest IS committed, because src/pages/downloads.astro needs it at
 * render time and reading the filesystem from page frontmatter is a sharper edge than
 * a 6-line JSON file. tests/downloads.test.ts fails if it drifts from the archive.
 */
import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FROM = `${ROOT}archive/catalogs`;
const TO = `${ROOT}public/catalogs`;

mkdirSync(TO, { recursive: true });
for (const stale of readdirSync(TO).filter((f) => f.endsWith('.pdf'))) {
  rmSync(`${TO}/${stale}`);
}

const files = readdirSync(FROM).filter((f) => f.endsWith('.pdf')).sort();
const manifest = {};

for (const file of files) {
  copyFileSync(`${FROM}/${file}`, `${TO}/${file}`);
  const bytes = statSync(`${TO}/${file}`).size;
  manifest[file] = { bytes };
  console.log(`${file.padEnd(48)} ${Math.round(bytes / 1024)} KB`);
}

writeFileSync(
  `${ROOT}src/data/catalog-files.json`,
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(`\nCopied ${files.length} catalogs and wrote src/data/catalog-files.json.`);
```

- [ ] **Step 4: Wire it into npm and git**

In `package.json`, add `prebuild` above `build`:

```json
    "prebuild": "node scripts/sync-catalogs.mjs",
    "build": "astro build",
```

In `.gitignore`, add above the `# Env` block:

```
# Catalog PDFs, copied out of archive/ by scripts/sync-catalogs.mjs at build time.
# The archive copy is the versioned one; see scripts/sync-catalogs.mjs.
public/catalogs/
```

- [ ] **Step 5: Run the sync**

Run: `node scripts/sync-catalogs.mjs`

Expected:

```
201611e68ea7e588b6e599a8final.pdf                432 KB
2018-company-introduction.pdf                    1375 KB
2018-emi-shielding-wire-tube.pdf                 6008 KB
2018-non-carbon-electrical-heating-textile.pdf   858 KB
2018-rfid-textile-tape.pdf                       865 KB
2018-wired-conductive-tape.pdf                   1662 KB
```

- [ ] **Step 6: Create `src/data/catalogs.ts`**

Descriptions come from reading each catalog's text layer, or from its images where it has none. Page counts were counted with pymupdf on 2026-08-11.

```ts
/**
 * The six catalogs the old site offered, in the order it listed them
 * (archive/pages/downloads.html), with descriptions written from each document's
 * actual contents rather than its title.
 *
 * Page counts counted 2026-08-11. Byte sizes are NOT here — they live in
 * catalog-files.json, written by scripts/sync-catalogs.mjs, so they cannot drift.
 */
export type Catalog = {
  file: string;
  title: string;
  description: string;
  pages: number;
  year: number;
  /** Product route this catalog is the source for, when there is exactly one. */
  product?: string;
};

export const CATALOGS: readonly Catalog[] = [
  {
    file: '2018-company-introduction.pdf',
    title: 'Company introduction',
    description:
      'Two pages of company background: the premises, the creel and loom floor, the covering machines, the two predecessor businesses, and photographs of the TAITRONICS award and the SGS test report cover. Image-only — it has no text layer.',
    pages: 2,
    year: 2018,
  },
  {
    file: '2018-non-carbon-electrical-heating-textile.pdf',
    title: 'Electrical heating textile',
    description:
      'The most technical document of the six. Carries the full copper-foil grade table — covering counts, diameters coated and uncoated, resistance and toughness for 1S through 4S4Z — the CMY structure diagram, and the comparison against carbon fibre, heating film and stainless steel fibre.',
    pages: 4,
    year: 2018,
    product: '/products/electrical-heating-textile/',
  },
  {
    file: '2018-wired-conductive-tape.pdf',
    title: 'Wired conductive tape',
    description:
      'Woven tape with a conductive wire laid in a repeating wave, shown against a rule for scale. Image-only, with no text layer, so the figures in it have not been transcribed.',
    pages: 4,
    year: 2018,
    product: '/products/wired-conductive-tape/',
  },
  {
    file: '2018-emi-shielding-wire-tube.pdf',
    title: 'Cable EMI shielding tube',
    description:
      'Braided sleeving over an aramid and fibreglass core plated with copper. States expansion of 1.5 to 4 times the taut diameter, a 3–15 mm size range, heat resistance to 600 °C, and RoHS conformity.',
    pages: 2,
    year: 2018,
    product: '/products/emi-shielding-woven-tube/',
  },
  {
    file: '201611e68ea7e588b6e599a8final.pdf',
    title: 'Silicon switch with temperature sensor',
    description:
      'The HT001 controller for LiTex heating textile: 3.3–12 V in and out, 5 A maximum, three temperature modes, an NTC sensor pair, an overheat cut-out, and sewable silicone edges. Out of production, available for sampling and testing.',
    pages: 2,
    year: 2016,
    product: '/products/silica-gel-switch-controller/',
  },
  {
    file: '2018-rfid-textile-tape.pdf',
    title: 'RFID textile tape',
    description:
      'Narrow polyester tape with conductive wire woven in to act as an RFID tag antenna. Gives the tape and wire specifications, the serpentine geometry, and the two integration methods — hot-melt adhesive or sewing.',
    pages: 2,
    year: 2018,
    product: '/products/rfid-textile-tape/',
  },
];
```

- [ ] **Step 7: Create `src/pages/downloads.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { CATALOGS } from '../data/catalogs';
import catalogFiles from '../data/catalog-files.json';

const sizes = catalogFiles as Record<string, { bytes: number }>;

/** MB above a megabyte, KB below — a buyer deciding whether to tap wants one number. */
function humanSize(bytes: number): string {
  const mb = bytes / 1_048_576;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}
---
<BaseLayout
  title="Catalog downloads — LiTex Textile & Technology"
  description="All six LiTex product catalogs as PDFs: heating textile, EMI shielding tube, RFID tape, wired conductive tape, the silicon switch, and the company introduction."
>
  <h1>Catalog downloads</h1>

  <p class="lede">
    Every catalog LiTex has published, with what is actually inside it. The current set dates from
    2018, and 2016 for the switch — the specification figures on this site come out of these
    documents and carry the same date.
  </p>

  <ul class="list">
    {CATALOGS.map((catalog) => (
      <li class="item" data-catalog={catalog.file}>
        <h2><a href={`/catalogs/${catalog.file}`}>{catalog.title}</a></h2>
        <p class="meta value">
          PDF · {catalog.pages} pages · {humanSize(sizes[catalog.file].bytes)} · {catalog.year}
        </p>
        <p class="blurb">{catalog.description}</p>
        {catalog.product && (
          <p class="also"><a href={catalog.product}>Specifications as data →</a></p>
        )}
      </li>
    ))}
  </ul>

  <p class="note" data-source-note>
    <small>
      These are the documents as LiTex published them, unaltered. Where a figure in one of them has
      been transcribed onto this site, the page carries a source note naming the file and page.
    </small>
  </p>
</BaseLayout>

<style>
  .lede { font-size: var(--t-20); color: var(--c-text-2); max-width: 58ch; }
  .list { list-style: none; margin: var(--s-8) 0; padding: 0; }
  .item {
    padding: var(--s-6) 0;
    border-top: 1px solid var(--c-line);
  }
  .item h2 { margin: 0 0 var(--s-2); font-size: var(--t-20); }
  .meta {
    margin: 0 0 var(--s-3);
    font-size: var(--t-12);
    letter-spacing: 0.06em;
    color: var(--c-text-2);
  }
  .blurb { margin: 0; max-width: 70ch; color: var(--c-text-2); }
  .also { margin: var(--s-3) 0 0; font-size: var(--t-14); }
  .note { color: var(--c-text-2); margin-top: var(--s-16); }
</style>
```

- [ ] **Step 8: Make `catalogPdf` a real link**

In `src/pages/products/[slug].astro`, replace lines 97–99 with:

```astro
  {product.data.catalogPdf && (
    <p class="catalog">
      <a href={`/catalogs/${product.data.catalogPdf}`}>Download the {product.data.name} catalog (PDF)</a>
    </p>
  )}
```

Add to that file's `<style>` block:

```css
  .catalog { font-size: var(--t-14); }
```

**Do not add a year here.** The obvious improvement is to append "· 2018" the way `/downloads/` does, but `catalogPdf` is only a filename — the year lives in `src/data/catalogs.ts` and the product schema knows nothing about it, and the silicon switch catalog is from 2016. A hardcoded 2018 would be wrong on one of the five pages, which is precisely the class of error this project exists to remove. `/downloads/` states the year for every catalog; that is enough.

- [ ] **Step 9: Add `/downloads/` to `src/lib/nav.ts`**

```ts
export const NAV: readonly NavItem[] = [
  { href: '/products/', label: 'Products' },
  { href: '/applications/', label: 'Applications' },
  { href: '/technology/', label: 'Technology' },
  { href: '/downloads/', label: 'Downloads' },
  { href: '/company/', label: 'Company' },
];
```

The footer picks this up with no further change, because Task 6 made it render from `NAV`.

- [ ] **Step 10: Run the tests**

Run: `npm run build && npm test`
Expected: PASS, 23 pages. The build log should show the prebuild copying six PDFs before Astro starts.

Check the dist size did not explode beyond the PDFs themselves:
`du -sh dist dist/catalogs`
Expected: `dist/catalogs` around 11 MB, the rest roughly unchanged from the 3.1 MB Plan 4 left.

Run: `node .claude/skills/impeccable/scripts/detect.mjs --json src/components src/pages src/styles`
Expected: `[]`

- [ ] **Step 11: Commit**

```bash
git add scripts/sync-catalogs.mjs src/data/catalogs.ts src/data/catalog-files.json src/pages/downloads.astro "src/pages/products/[slug].astro" src/lib/nav.ts package.json .gitignore tests/downloads.test.ts
git commit -m "feat: serve the six catalogs and add /downloads/"
```

---

### Task 8: `/legal/privacy/`

The archived privacy policy is one paragraph about mobile information not being shared with third parties — a fragment of some SMS-marketing compliance template, describing a site that does not exist. It is also the 301 target for `/privacy-policy/`, so the route has to exist regardless.

The rule for this page is narrower than for the rest of the site: **describe only what is verifiably true of the site as built.** Right now that is a site with no cookies, no third-party requests, no analytics and no forms — three of which are properties `tests/build.test.ts` already asserts. Plan 7 adds a form and Plan 8 adds analytics; both then have to update this page, so this task ships tests that fail when they do not.

**Files:**
- Create: `src/pages/legal/privacy.astro`
- Modify: `src/components/SiteFooter.astro`
- Test: `tests/legal.test.ts`

**Interfaces:**
- Consumes: `COMPANY` from `src/lib/company.ts`.
- Produces: the route `/legal/privacy/`, linked from `footer[data-sitefooter]` on every page.

- [ ] **Step 1: Write the failing tests**

Create `tests/legal.test.ts`:

```ts
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { parseHTML } from 'linkedom';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function docFor(relativePath: string) {
  return parseHTML(readFileSync(join(DIST, relativePath), 'utf8')).document;
}

describe('privacy notice', () => {
  it('generates the route with a single h1 and its canonical', () => {
    const doc = docFor('legal/privacy/index.html');
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://litex.com.tw/legal/privacy/');
  });

  it('identifies the data controller by legal name and address', () => {
    const text = docFor('legal/privacy/index.html').body.textContent ?? '';
    expect(text).toContain('LiTex Textile & Technology Co., Ltd.');
    expect(text).toContain('Bangka Blvd');
  });

  it('gives one address for privacy requests', () => {
    const hrefs = [...docFor('legal/privacy/index.html').querySelectorAll('main a')]
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('mailto:sales@litex.com.tw');
  });

  it('carries the mobile-information statement the old site published', () => {
    const text = docFor('legal/privacy/index.html').body.textContent ?? '';
    expect(text).toContain('No mobile information will be shared with third parties');
  });

  it('is reachable from the footer of every page', () => {
    for (const file of walk(DIST).filter((f) => f.endsWith('.html'))) {
      const doc = parseHTML(readFileSync(file, 'utf8')).document;
      const hrefs = [...doc.querySelectorAll('footer[data-sitefooter] a')]
        .map((a) => a.getAttribute('href'));
      expect(hrefs, `${file} has no privacy link`).toContain('/legal/privacy/');
    }
  });
});

describe('privacy notice stays true as the site grows', () => {
  // These two guards exist to be deleted, deliberately, by the plan that makes them
  // false. A privacy notice that quietly stops describing the site is worse than one
  // that was never written.

  // Plan 8 adds Cloudflare Web Analytics. When it does, update the page to describe
  // it and remove this test in the same commit.
  it('claims no analytics only while the site really runs none', () => {
    const scripts = new Set<string>();
    for (const file of walk(DIST).filter((f) => f.endsWith('.html'))) {
      const doc = parseHTML(readFileSync(file, 'utf8')).document;
      for (const s of [...doc.querySelectorAll('script[src]')]) {
        const src = s.getAttribute('src') ?? '';
        if (/^https?:\/\//.test(src)) scripts.add(src);
      }
    }
    expect([...scripts], 'the site now loads a third-party script — update /legal/privacy/')
      .toEqual([]);
    expect(docFor('legal/privacy/index.html').body.textContent).toContain('no analytics');
  });

  // Plan 7 adds the contact form and the Pages Function behind it. When it does, the
  // page must describe what happens to a submission, and this test goes.
  it('describes no form while no form exists', () => {
    const forms = walk(DIST)
      .filter((f) => f.endsWith('.html'))
      .filter((f) => parseHTML(readFileSync(f, 'utf8')).document.querySelector('form'));
    expect(forms, 'a form now exists — update /legal/privacy/ to describe it').toEqual([]);
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npm run build && npx vitest run tests/legal.test.ts`
Expected: FAIL — `ENOENT` on `dist/legal/privacy/index.html`.

- [ ] **Step 3: Create `src/pages/legal/privacy.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { COMPANY } from '../../lib/company';

/**
 * Every statement below is a property of the site as built, checkable in dist/:
 * no cookies are set, no third-party host is requested, no analytics script runs,
 * and there is no form. tests/legal.test.ts and tests/build.test.ts both assert the
 * last three. When Plan 7 adds the contact form or Plan 8 adds analytics, this page
 * changes in the same commit — the tests fail until it does.
 */
const UPDATED = '2026-08-11';
---
<BaseLayout
  title="Privacy — LiTex Textile & Technology"
  description="What this website collects, which is almost nothing: no cookies, no analytics, no third-party requests. How to contact LiTex about personal data."
>
  <h1>Privacy</h1>

  <p class="lede">
    This site collects nothing about you. That is not a policy position so much as a description
    of how it is built — there is no cookie, no analytics script and no third-party request on any
    page of it.
  </p>

  <h2>Who is responsible</h2>

  <address class="contact">
    <span>{COMPANY.legalName}</span>
    {COMPANY.addressLines.map((line) => <span>{line}</span>)}
    <span><a class="value" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></span>
    <span><a class="value" href={COMPANY.phoneHref}>{COMPANY.phone}</a></span>
  </address>

  <h2>What this website does</h2>

  <ul>
    <li>
      <strong>No cookies.</strong> No page on this site sets a cookie or writes to local storage.
    </li>
    <li>
      <strong>No analytics.</strong> There is no analytics script, no tag manager and no pixel.
      Nobody is counting your visit.
    </li>
    <li>
      <strong>No third-party requests.</strong> Fonts, images, stylesheets and scripts are all
      served from this domain. Loading a page contacts no other company.
    </li>
    <li>
      <strong>No forms.</strong> There is nothing on this site to submit. Contact happens by email
      or telephone, using the details above.
    </li>
  </ul>

  <h2>Hosting</h2>

  <p>
    The site is served by Cloudflare Pages. Like any web host, Cloudflare processes the technical
    information a browser sends in order to deliver a page — your IP address, the page requested,
    and your user agent — and retains it briefly for security and operational purposes. LiTex does
    not receive that data as a report and does not combine it with anything else.
  </p>

  <h2>If you email or telephone us</h2>

  <p>
    Then we hold whatever you send us: your name, your address, and what you asked about. We use it
    to answer you and to handle any resulting quotation, sample or order, and we keep it for as
    long as that business relationship needs. We do not sell it and we do not pass it to anyone
    outside the company for marketing.
  </p>

  <h2>Your rights</h2>

  <p>
    If you are in the EU or the UK, you can ask us for a copy of what we hold about you, ask us to
    correct it, or ask us to delete it. Write to{' '}
    <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> and say which. If a request is about an
    inquiry you sent us, telling us roughly when you sent it makes it much faster to find.
  </p>

  <h2>Mobile information</h2>

  <p class="quoted">
    No mobile information will be shared with third parties/affiliates for marketing/promotional
    purposes. All other categories exclude text messaging originator opt-in data and consent; this
    information will not be shared with any third parties.
  </p>

  <p class="note" data-source-note>
    <small>
      Last updated {UPDATED}. The mobile-information paragraph is carried over verbatim from the
      previous LiTex privacy policy, where it was the entire text of the page.
    </small>
  </p>
</BaseLayout>

<style>
  .lede { font-size: var(--t-20); color: var(--c-text-2); max-width: 58ch; }
  p, li { max-width: 70ch; }
  ul { padding-left: var(--s-6); }
  li { margin-bottom: var(--s-3); }
  .contact {
    display: flex;
    flex-direction: column;
    gap: var(--s-1);
    font-style: normal;
    color: var(--c-text-2);
    margin: var(--s-6) 0;
  }
  .quoted {
    border-left: 2px solid var(--c-line);
    padding-left: var(--s-6);
    color: var(--c-text-2);
  }
  .note { color: var(--c-text-2); margin-top: var(--s-16); }
</style>
```

- [ ] **Step 4: Link it from the footer**

In `src/components/SiteFooter.astro`, replace the `.legal` paragraph:

```astro
    <p class="legal">
      <small>© {year} {COMPANY.legalName} · {COMPANY.legalNameZh}</small>
      <a href="/legal/privacy/">Privacy</a>
    </p>
```

And update its style rule:

```css
  .legal {
    margin: var(--s-12) 0 0;
    color: var(--c-text-2);
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-2) var(--s-6);
    align-items: baseline;
    font-size: var(--t-14);
  }
```

- [ ] **Step 5: Run the tests**

Run: `npm run build && npm test`
Expected: PASS, **24 pages**. `tests/chrome.test.ts` now resolves the footer's privacy link.

Run: `node .claude/skills/impeccable/scripts/detect.mjs --json src/components src/pages src/styles`
Expected: `[]`

- [ ] **Step 6: Commit**

```bash
git add src/pages/legal/privacy.astro src/components/SiteFooter.astro tests/legal.test.ts
git commit -m "feat: add /legal/privacy/ describing the site as it is actually built"
```

---

### Task 9: Update the handoff and close out the plan

The handoff is the resume point for the next session and currently describes a state two plans old in places. It also carries the p.1 xref 52 error, which will mislead whoever reads it next.

**Files:**
- Modify: `HANDOFF.md`

- [ ] **Step 1: Verify the finished state before writing anything down**

Run: `npm run build && npm test`
Record the actual numbers: page count, test count, test file count. Do not write numbers you have not just read off the terminal.

Run: `du -sh dist` and note the total.

- [ ] **Step 2: Rewrite `HANDOFF.md`**

Carry these forward unchanged: the "Settled — do not re-raise" section, the toolchain gotchas, and the patent facts section. Update:

- **Do this first** → Plan 6 (`/news/` index + 7 posts) with `superpowers:writing-plans`.
- **Plan roadmap** → Plans 1–5 merged; 6, 7, 8 remaining.
- **State** → new commit, page count, test count, dist size.
- **Correct the xref 52 description** — it is the building facade, the two predecessor nameplates, and spools with tape. Delete the "loom and two framed certificates" wording so it cannot be reintroduced.
- **Add a toolchain gotcha:** `Pixmap.copy()` is absolute-coordinate; the destination must be created at the crop origin. Fixed in Task 1, but the shape of the bug is worth remembering.
- **Add to "What Plan 6 inherits"**: `ArchiveFigure.astro`, the two-group extraction pipeline, `public/catalogs/` and the `prebuild` step, and the fact that `/legal/privacy/` carries two forward-guard tests that Plans 7 and 8 must delete deliberately.
- **Open questions** — replace the current list with the one at the end of this plan.

- [ ] **Step 3: Commit and open the PR**

```bash
git add HANDOFF.md
git commit -m "docs: update HANDOFF for session 6 — Plan 5 merged, Plan 6 is next"
git push -u origin plan-5-company-downloads-legal
gh pr create --title "Plan 5: company section, downloads and privacy" --body "$(cat <<'EOF'
Builds the six routes a sourcing manager checks before issuing an RFQ: `/company/`,
`/company/about/`, `/company/patents-and-awards/`, `/company/certifications/`,
`/downloads/` and `/legal/privacy/`. 18 routes → 24.

**Two findings worth reviewing carefully:**

- `scripts/extract-image.py`'s crop was broken for any non-zero offset —
  `Pixmap.copy()` works in absolute coordinates, so a destination created at (0,0)
  produced a black rectangle. It only ever ran with x=0,y=0, so nothing caught it.
  Fixed, and `tests/provenance.test.ts` now fails on a flat rectangle.
- The addressee block on SGS report CE/2013/52203 appears to read
  "… TRADING CO., LTD.", which is not LiTex's name. Not legible enough to publish,
  so it is not published — it is open question 1 for LiTex.

`/company/patents-and-awards/` deliberately does not transcribe
`archive/images/patents-and-awards.jpg`: that graphic lists an abandoned US
application as pending and a lapsed Taiwan model as issued. The page states register
status instead, and the unattributable USPTO certificate cover is never extracted.

Plan: `docs/superpowers/plans/2026-08-11-litex-company-downloads-legal.md`
EOF
)"
```

---

## Open questions for LiTex — carried forward and revised

Ordered by how much damage the wrong answer does. Items 1 and 3 are new.

1. **Is SGS report `CE/2013/52203` issued to LiTex or to Hen Hao Trading?** The addressee block on the photographed cover appears to read `… TRADING CO., LTD.`, which is not LiTex's name in either language, and Hen Hao is at the same address. Not legible enough to publish, legible enough to matter: `/company/certifications/` now points buyers at this report, and a buyer who requests it and receives a document in another company's name has found a problem the site created. **Ask before launch.**
2. **TWM545145 renewal status.** Unchanged, still the highest-value answer. Its sibling lapsed for non-payment; this is the claim in the footer of every page. A confirmation would let the credibility bar say something stronger than "TW UTILITY MODEL".
3. **What is the SGS report's scope?** Not readable at the stored resolution — the site currently says so out loud. The full report closes the largest hole in `/company/certifications/`, and spec §7 item 5 rates it High.
4. **The thermograph's test conditions** — voltage, duration, ambient temperature, colour scale. Held out of `/technology/` for a third plan running.
5. **What the USPTO certificate actually is**, given 12/787,378 was abandoned. It is now deliberately unpublished, so this is no longer blocking anything — but if it turns out to be a granted patent under a different number, that is a real asset currently missing from the site.
6. **Are CN 201485574U, TW 099146482 and CN 201120008487.x still live?** `/company/patents-and-awards/` prints "Not verified" against all three. LiTex can answer this in a sentence and the page improves immediately.
7. **Company facts for `/company/about/`** — headcount, floor area, production capacity, factory locations. The page deliberately states none of these. Spec §7 item 13.
8. **Should `/legal/privacy/` be reviewed by LiTex's counsel?** The page states only verifiable properties of the site and makes no promise the site cannot keep, but it is a legal document published in LiTex's name in a market where such documents matter. Flag it; do not block launch on it.
9. **CuNi status** — "coming soon" in 2018; `/technology/` still says exactly that.
10. **Is the 2018 grade range (1S–4S4Z) still current?** The whole `/technology/` argument rests on it.
11. **Are the 2018 catalogs still the current set?** `/downloads/` now serves all six and says plainly that they are eight years old. Spec §7 item 15.
12. **Re-shoot `wired-conductive-tape`** (600×341 is genuinely the largest in the archive).
13. Carried over: EMI `(c)` column and `(ø)` units; the stainless steel yarn table's owning product.

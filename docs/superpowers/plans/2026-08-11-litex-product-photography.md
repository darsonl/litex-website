# LiTex Website — Plan 3: Product Photography & Image Pipeline

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give all seven product pages real photography of the actual product, recovered from LiTex's own catalogs and archived site, optimized at build time and validated so a synthetic or missing image cannot ship.

**Architecture:** Images live in `src/assets/` so Astro's asset pipeline processes them; `public/` would ship them untouched. The content schema validates them through Astro's `image()` helper, which resolves the file at build time and hands back `ImageMetadata` carrying intrinsic width and height — that is what lets `<Picture>` emit `width`/`height` attributes and eliminate layout shift. Provenance is recorded in a manifest that a test cross-checks against the files on disk, so no image can be published without a traceable source.

**Tech Stack:** Astro 7.2.0 `astro:assets` (sharp 0.35.3, already installed) · pymupdf for extraction · Vitest 4 · linkedom — no new runtime dependencies.

## Why this plan exists

Spec §5 states: *"LiTex has **no usable photography** — the current homepage runs a Pexels stock photo."* **That is false of the catalogs.** Verified 2026-08-11 by extracting embedded images from all six catalog PDFs and the 46 archived site images: **every one of the seven products has at least one genuine photograph of the real product.**

This matters more than it looks. Spec §5 Tier 3 forbids AI imagery for product, material, factory, machinery, personnel, or certification shots, on two grounds — credibility, and the fact that image models cannot render helical covering geometry correctly. That rule was written assuming the alternative was diagrams only. It is not: `2018-non-carbon-electrical-heating-textile.pdf` p.3 contains an **SEM micrograph of the CMY cross-section, labelled "metal layer" and "core polymer yarn"** — the exact structure the spec says a generated image would get wrong.

## Global Constraints

Every task's requirements implicitly include this section. These carry over from Plans 1–2 and remain in force.

- **Astro `7.2.0`**, pinned. Verified: `astro:assets` exports `Image`, `Picture`, `getImage`; `SchemaContext = { image: ImageFunction }`; `sharp@0.35.3` is installed and loads.
- **Never call `getEntry()` bare** — wrap in `mustResolve()` from `src/lib/references.ts`. Astro 7.2.0 does not fail the build on a broken `reference()`.
- **Images belong in `src/assets/`, never `public/`.** Files under `public/` bypass the optimizer entirely and ship at full weight in their original format.
- **Real photography only for products.** `aiGenerated: true` on a product hero must fail the build — already enforced by `superRefine` in `src/schemas/product.ts` and asserted by `tests/schemas.test.ts`.
- **`archive/images/pexels-photo-2117937.jpeg` is a stock photo and is banned.** It is the image spec §0 cites as evidence the site reads as untrustworthy. A test asserts it never reaches `dist/`.
- **Every image needs real alt text describing what is actually shown** — not the product name repeated. A spec-sheet reader who cannot see the image should learn what the photograph demonstrates.
- **Never invent product facts**, including in alt text. Describe only what is visible in the frame.
- **Colour tokens only** in components — `var(--c-*)`, never a literal hex.
- **No React, Vue, or any UI framework.**
- **Fonts are Archivo and IBM Plex Mono only.**
- **Commit after every task.** Conventional prefixes (`feat:`, `test:`, `chore:`).

## Source inventory — verified 2026-08-11

Every row below was confirmed by extracting the image and viewing it. Dimensions are the true intrinsic size of the extracted asset.

| Product | Source | Size | What the photograph shows |
|---|---|---|---|
| `conductive-metal-yarn` | `2018-non-carbon-electrical-heating-textile.pdf` p.3 xref 11 | 1062×562 | Macro of coiled metal covering **plus an SEM micrograph** labelling the metal layer and polymer core |
| `electrical-heating-textile` | same PDF p.2 xref 3 | 1000×500 | Draped white woven heating fabric, showing the open mesh weave |
| `emi-shielding-woven-tube` | `2018-emi-shielding-wire-tube.pdf` p.1 xref 26 | 2030×914 | Three spools of braided tube plus two close-ups of the braid flaring open |
| `rfid-textile-tape` | `2018-rfid-textile-tape.pdf` p.1 xref 1487 | 1035×1370 | Three frames: tape on wood, a mounted RFID chip, and the tape against a ruler |
| `braided-self-curling-tube` | `archive/images/20200313_070104268_ios.jpg` | 2806×2806 | **Five sleeve diameters laid side by side** — the visual statement of "five specifications available" |
| `wired-conductive-tape` | `2018-wired-conductive-tape.pdf` p.2 xref 4 | 600×341 | Black tape with the woven conductive trace, against a ruler |
| `silica-gel-switch-controller` | `201611e68ea7e588b6e599a8final.pdf` p.1 xref 99 | 670×431 | The HT001 switch with its three port pairs **labelled B+/B−, T1/T2, P+/P−** |

**Two are low-resolution** — `wired-conductive-tape` at 600×341 and `silica-gel-switch-controller` at 670×431 are the largest that exist anywhere in the archive. They are used as-is and **never upscaled**; Task 4's `widths` array must not request a width larger than the source, or sharp will emit a blurred enlargement. Both are listed in the open questions as candidates for a re-shoot.

**Not extracted, and deliberately so:** `archive/catalogs/2018-rfid-textile-tape.pdf` p.1 xref 1485 (2470×2725) is the decorative blue background texture, not a product. `2018-emi-shielding-wire-tube.pdf` p.2 xref 66 is the shielding-efficiency chart, already transcribed to prose in the product body.

## Held for a later plan — do not use here

These are real and valuable but belong to pages this plan does not build:

| Asset | Belongs to |
|---|---|
| `2018-company-introduction.pdf` p.2 xref 5 — **US patent certificate, TAITRONICS Quality Award, SGS test report** | `/company/certifications/` and `/company/patents-and-awards/` |
| same PDF p.1 xrefs 52, 54 — factory floor, looms, spool creels | `/company/about/` |
| same PDF p.2 xref 8 — trade-show booth and staff photograph | `/company/about/` |
| same PDF p.2 xref 6 and heating PDF p.1 xref 122 — heating textile **thermograph** | `/technology/` |

## File Structure

| Path | Responsibility |
|---|---|
| `scripts/extract-images.mjs` | One-shot, re-runnable extraction from `archive/` into `src/assets/products/`. Committed for auditability. |
| `src/assets/products/*.{jpg,png}` | The seven product photographs. Committed. |
| `src/assets/products/provenance.json` | Machine-readable source record for every image |
| `src/schemas/product.ts` | **Modified** — factory takes `{ reference, image }`; hero becomes a validated asset |
| `src/content.config.ts` | **Modified** — passes `image` from `SchemaContext` |
| `src/content/products/*.md` | **Modified** — each gains a `heroImage` |
| `src/components/ProductHero.astro` | Renders the hero with `<Picture>`, caption and provenance |
| `src/components/ProductCard.astro` | **Modified** — optional thumbnail |
| `src/pages/products/[slug].astro` | **Modified** — renders the hero |
| `tests/provenance.test.ts` | Manifest ↔ filesystem cross-check |
| `tests/schemas.test.ts` | **Extended** — image validation and alt rules |
| `tests/build.test.ts` | **Extended** — emitted-image assertions |

---

### Task 1: Extract the seven photographs with a provenance manifest

**Files:**
- Create: `scripts/extract-images.mjs`, `src/assets/products/provenance.json`, seven image files
- Test: `tests/provenance.test.ts`

**Interfaces:**
- Consumes: `archive/catalogs/*.pdf`, `archive/images/*.jpg`.
- Produces: `src/assets/products/<slug>.{jpg,png}` for all seven slugs, plus `provenance.json` keyed by filename.

- [ ] **Step 1: Write the extraction script**

Node cannot open PDFs here, so the PDF path shells out to Python + pymupdf — verified present. `pdftoppm` is **not** installed; do not reach for it.

Create `scripts/extract-images.mjs`:

```js
/**
 * One-shot extraction of LiTex product photography out of archive/ into src/assets/.
 * Committed so the provenance of every shipped image is auditable and reproducible.
 *
 * PDF extraction goes through Python + pymupdf: pdftoppm is not installed on the
 * build machine, and pdftotext cannot read images at all.
 *
 * Run: node scripts/extract-images.mjs
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = `${ROOT}src/assets/products`;

/** Every entry was confirmed by extracting and viewing the image on 2026-08-11. */
const SOURCES = [
  {
    slug: 'conductive-metal-yarn',
    from: 'archive/catalogs/2018-non-carbon-electrical-heating-textile.pdf',
    page: 3, xref: 11, ext: 'jpg',
    note: 'Catalog p.3: CMY macro alongside an SEM micrograph labelling metal layer and polymer core',
  },
  {
    slug: 'electrical-heating-textile',
    from: 'archive/catalogs/2018-non-carbon-electrical-heating-textile.pdf',
    page: 2, xref: 3, ext: 'jpg',
    note: 'Catalog p.2: draped woven heating fabric showing the open mesh weave',
  },
  {
    slug: 'emi-shielding-woven-tube',
    from: 'archive/catalogs/2018-emi-shielding-wire-tube.pdf',
    page: 1, xref: 26, ext: 'png',
    note: 'Catalog p.1: three spools of braided tube with close-ups of the braid flaring open',
  },
  {
    slug: 'rfid-textile-tape',
    from: 'archive/catalogs/2018-rfid-textile-tape.pdf',
    page: 1, xref: 1487, ext: 'jpg',
    note: 'Catalog p.1: tape on wood, mounted RFID chip, and tape against a ruler',
  },
  {
    slug: 'wired-conductive-tape',
    from: 'archive/catalogs/2018-wired-conductive-tape.pdf',
    page: 2, xref: 4, ext: 'jpg',
    note: 'Catalog p.2: black tape with woven conductive trace against a ruler. Largest available.',
  },
  {
    slug: 'silica-gel-switch-controller',
    from: 'archive/catalogs/201611e68ea7e588b6e599a8final.pdf',
    page: 1, xref: 99, ext: 'jpg',
    note: 'Catalog p.1: HT001 switch with port pairs labelled B+/B−, T1/T2, P+/P−. Largest available.',
  },
  {
    slug: 'braided-self-curling-tube',
    copyFrom: 'archive/images/20200313_070104268_ios.jpg',
    ext: 'jpg',
    note: 'Archived product page image: five sleeve diameters laid side by side',
  },
];

const PY = `
import fitz, sys
doc = fitz.open(sys.argv[1])
info = doc.extract_image(int(sys.argv[3]))
open(sys.argv[4], 'wb').write(info['image'])
print(f"{info['width']}x{info['height']}")
`;

mkdirSync(OUT, { recursive: true });
const manifest = {};

for (const s of SOURCES) {
  const file = `${s.slug}.${s.ext}`;
  const dest = `${OUT}/${file}`;
  let dimensions = 'copied';

  if (s.copyFrom) {
    copyFileSync(`${ROOT}${s.copyFrom}`, dest);
  } else {
    dimensions = execFileSync(
      'python',
      ['-c', PY, `${ROOT}${s.from}`, String(s.page), String(s.xref), dest],
      { encoding: 'utf8' },
    ).trim();
  }

  manifest[file] = {
    source: s.copyFrom ?? s.from,
    page: s.page ?? null,
    xref: s.xref ?? null,
    dimensions,
    note: s.note,
    aiGenerated: false,
    extracted: '2026-08-11',
  };
  console.log(`${file.padEnd(36)} ${dimensions}`);
}

writeFileSync(`${OUT}/provenance.json`, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`\nWrote provenance for ${Object.keys(manifest).length} images.`);
```

- [ ] **Step 2: Run the extraction**

Run: `node scripts/extract-images.mjs`
Expected: seven files written into `src/assets/products/`, each printing its dimensions, matching the source inventory table above. `provenance.json` written.

- [ ] **Step 3: Write the provenance test**

Create `tests/provenance.test.ts`. This is the guard that stops an image appearing in the repo without a recorded source.

```ts
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const DIR = fileURLToPath(new URL('../src/assets/products', import.meta.url));
const manifest = JSON.parse(readFileSync(join(DIR, 'provenance.json'), 'utf8')) as Record<
  string,
  { source: string; note: string; aiGenerated: boolean; dimensions: string }
>;

const imageFiles = readdirSync(DIR).filter((f) => /\.(jpg|jpeg|png)$/i.test(f));

const EXPECTED_SLUGS = [
  'conductive-metal-yarn', 'electrical-heating-textile', 'emi-shielding-woven-tube',
  'rfid-textile-tape', 'wired-conductive-tape', 'silica-gel-switch-controller',
  'braided-self-curling-tube',
];

describe('image provenance', () => {
  it('ships an image for every product', () => {
    for (const slug of EXPECTED_SLUGS) {
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

  it('declares every product photograph as real, never AI generated', () => {
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
      const mb = statSync(join(DIR, file)).size / 1_048_576;
      expect(mb, `${file} is ${mb.toFixed(1)} MB`).toBeLessThan(4);
    }
  });
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/provenance.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/extract-images.mjs src/assets/products tests/provenance.test.ts
git commit -m "feat: extract product photography from catalogs with provenance manifest"
```

---

### Task 2: Validate hero images through the content schema

Astro's `image()` helper resolves the path at build time and returns `ImageMetadata` with intrinsic width and height. That is what makes Task 4's `width`/`height` attributes possible, which is what prevents cumulative layout shift.

**Files:**
- Modify: `src/schemas/product.ts`, `src/content.config.ts`
- Test: `tests/schemas.test.ts`

**Interfaces:**
- Consumes: `SchemaContext['image']` from `astro:content`.
- Produces: `productSchema({ reference, image }: SchemaDeps)` where
  `type SchemaDeps = { reference: ReferenceFn; image: ImageFn }` and
  `type ImageFn = () => z.ZodTypeAny`.

**Breaking change:** `productSchema` takes an options object instead of a positional `reference`. Both call sites — `src/content.config.ts` and `tests/schemas.test.ts` — must be updated together.

`imageSchema` also changes from an exported constant into a function taking `image`. Verified safe: it is referenced only inside `src/schemas/product.ts`. `ReferenceFn` stays exported unchanged because `src/schemas/application.ts` imports it, and `applicationSchema` keeps its positional argument — it takes no images.

- [ ] **Step 1: Update the schema tests first**

In `tests/schemas.test.ts`, replace the two factory calls at the top. `image()` is stubbed as a string schema because Vitest cannot import Astro's real one — the same reason `reference` is injected.

```ts
/** Stands in for Astro's reference(); shape matches what Astro produces. */
const referenceStub = () => z.object({ collection: z.string(), id: z.string() }).or(z.string());
/** Stands in for Astro's image(); the real one returns ImageMetadata at build time. */
const imageStub = () => z.string();

const product = productSchema({ reference: referenceStub, image: imageStub });
const application = applicationSchema(referenceStub);
```

Then add these cases inside `describe('productSchema', ...)`:

```ts
  it('accepts a hero image with real alt text', () => {
    const r = product.safeParse({
      ...validProduct,
      heroImage: { src: './cmy.jpg', alt: 'Coiled copper covering over a polymer core', aiGenerated: false },
    });
    expect(r.success).toBe(true);
  });

  it('rejects a hero image with empty alt text', () => {
    const r = product.safeParse({
      ...validProduct,
      heroImage: { src: './cmy.jpg', alt: '', aiGenerated: false },
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('alt');
  });

  it('rejects alt text that merely repeats the product name', () => {
    const r = product.safeParse({
      ...validProduct,
      heroImage: { src: './cmy.jpg', alt: 'Conductive Metal Yarn', aiGenerated: false },
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('alt');
  });

  it('still refuses an AI-generated hero even with good alt text', () => {
    const r = product.safeParse({
      ...validProduct,
      heroImage: { src: './cmy.jpg', alt: 'Coiled copper covering over a polymer core', aiGenerated: true },
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('aiGenerated');
  });
```

- [ ] **Step 2: Run to confirm the new cases fail**

Run: `npx vitest run tests/schemas.test.ts`
Expected: FAIL — `productSchema` still expects a positional argument, and the alt rules do not exist.

- [ ] **Step 3: Rewrite the factory in `src/schemas/product.ts`**

Replace the `ReferenceFn` type and `imageSchema`/`productSchema` definitions with:

```ts
export type ReferenceFn = (collection: string) => z.ZodTypeAny;
/** Astro's image() from SchemaContext. Injected so the schema stays unit-testable. */
export type ImageFn = () => z.ZodTypeAny;
export type SchemaDeps = { reference: ReferenceFn; image: ImageFn };

export function imageSchema(image: ImageFn) {
  return z.object({
    src: image(),
    alt: z.string().min(1, 'Alt text is required — describe what the photograph shows.'),
    aiGenerated: z.boolean().default(false),
  });
}

export function productSchema({ reference, image }: SchemaDeps) {
  return z
    .object({
      name: z.string(),
      status: z.enum(['active', 'legacy']),
      summary: z.string().max(160), // doubles as the meta description
      applications: z.array(reference('applications')).default([]),
      certifications: z.array(z.enum(CERTIFICATIONS)).default([]),
      catalogPdf: z.string().optional(),
      specTable: specTableSchema.optional(),
      heroImage: imageSchema(image).optional(),
      /** Which document each figure came from. */
      sourceNote: z.string().optional(),
      /** True while extracted values still need checking against the source PDF. */
      needsVerification: z.boolean().default(false),
    })
    .superRefine((data, ctx) => {
      if (data.specTable && !data.sourceNote) {
        ctx.addIssue({
          code: 'custom',
          path: ['sourceNote'],
          message:
            'A specTable must carry a sourceNote naming the document its figures came from.',
        });
      }
      if (data.heroImage?.aiGenerated) {
        ctx.addIssue({
          code: 'custom',
          path: ['heroImage', 'aiGenerated'],
          message:
            'Product heroes must be real photography. AI imagery is Tier 2 only (spec §5).',
        });
      }
      // Alt text that only restates the name tells a screen-reader user nothing the
      // heading did not already say. Describe what the photograph actually shows.
      if (
        data.heroImage &&
        data.heroImage.alt.trim().toLowerCase() === data.name.trim().toLowerCase()
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['heroImage', 'alt'],
          message:
            'Alt text must describe what the photograph shows, not repeat the product name.',
        });
      }
    });
}
```

- [ ] **Step 4: Update `src/content.config.ts` to pass both dependencies**

```ts
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { productSchema } from './schemas/product';
import { applicationSchema } from './schemas/application';

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  // image comes from Astro's SchemaContext and resolves paths relative to the entry file.
  schema: ({ image }) => productSchema({ reference, image }),
});

const applications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/applications' }),
  schema: applicationSchema(reference),
});

export const collections = { products, applications };
```

- [ ] **Step 5: Run the tests and the build**

Run: `npx vitest run tests/schemas.test.ts && npm run build`
Expected: schema tests PASS; build exits 0. No product declares a `heroImage` yet, so nothing resolves an image path.

- [ ] **Step 6: Commit**

```bash
git add src/schemas/product.ts src/content.config.ts tests/schemas.test.ts
git commit -m "feat: validate hero images and alt text through the content schema"
```

---

### Task 3: Attach the seven heroes with real alt text

Alt text below describes **what is visible in each frame**, written after viewing every image. It is not the product name restated — the schema rejects that.

**Files:**
- Modify: all seven `src/content/products/*.md`

**Interfaces:**
- Consumes: the schema from Task 2, the assets from Task 1.
- Produces: `heroImage` on every product entry.

- [ ] **Step 1: Add the hero to each product**

Paths are relative to the Markdown file, which is how Astro's `image()` resolves them. Insert this block into the frontmatter of each file, immediately after `summary`.

`src/content/products/conductive-metal-yarn.md`:

```yaml
heroImage:
  src: "../../assets/products/conductive-metal-yarn.jpg"
  alt: "Macro photograph of conductive metal yarn beside a scanning electron micrograph of its cross-section, labelled to show the metal layer coiled around the core polymer yarn"
  aiGenerated: false
```

`src/content/products/electrical-heating-textile.md`:

```yaml
heroImage:
  src: "../../assets/products/electrical-heating-textile.jpg"
  alt: "A length of white woven heating textile draped in folds, showing the open mesh weave that carries the conductive yarn"
  aiGenerated: false
```

`src/content/products/emi-shielding-woven-tube.md`:

```yaml
heroImage:
  src: "../../assets/products/emi-shielding-woven-tube.png"
  alt: "Three spools of braided metal shielding tube, with close-ups of the braid flaring open to show how it expands over a cable"
  aiGenerated: false
```

`src/content/products/rfid-textile-tape.md`:

```yaml
heroImage:
  src: "../../assets/products/rfid-textile-tape.jpg"
  alt: "RFID woven tape photographed on a wooden surface, with a close-up of a chip fixed to the tape and a ruler showing the twenty millimetre width"
  aiGenerated: false
```

`src/content/products/braided-self-curling-tube.md`:

```yaml
heroImage:
  src: "../../assets/products/braided-self-curling-tube.jpg"
  alt: "Five diameters of black braided self-curling sleeve laid side by side, the largest open at one end to show the braid structure"
  aiGenerated: false
```

`src/content/products/wired-conductive-tape.md`:

```yaml
heroImage:
  src: "../../assets/products/wired-conductive-tape.jpg"
  alt: "Black woven tape with a pale conductive wire following a repeating wave path along its length, photographed against a ruler"
  aiGenerated: false
```

`src/content/products/silica-gel-switch-controller.md`:

```yaml
heroImage:
  src: "../../assets/products/silica-gel-switch-controller.jpg"
  alt: "The HT001 silicon switch with three labelled lead pairs: battery input, NTC temperature sensor, and heating textile output"
  aiGenerated: false
```

- [ ] **Step 2: Build and confirm every path resolves**

Run: `npm run build`
Expected: exits 0. A mistyped path fails here with an Astro error naming the file — `image()` resolves at build time, which is the point of Task 2.

- [ ] **Step 3: Prove the alt-text guard bites**

Temporarily set `conductive-metal-yarn`'s alt to exactly `Conductive Metal Yarn` and run `npm run build`.
Expected: FAIL, naming `heroImage.alt`. Restore the real alt text and rebuild to confirm green.

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: PASS. No assertion renders images yet; that is Task 4.

- [ ] **Step 5: Commit**

```bash
git add src/content/products
git commit -m "feat: attach real product photography to all seven products"
```

---

### Task 4: Render the hero on product detail pages

**Files:**
- Create: `src/components/ProductHero.astro`
- Modify: `src/pages/products/[slug].astro`
- Test: `tests/build.test.ts`

**Interfaces:**
- Consumes: `astro:assets` `Picture`, the `heroImage` from Task 3.
- Produces: `ProductHero.astro` props `{ image: ImageMetadata; alt: string; caption?: string }`.

- [ ] **Step 1: Write the failing build assertions**

Append to `tests/build.test.ts`:

```ts
describe('product hero imagery', () => {
  const slugs = [
    'conductive-metal-yarn', 'electrical-heating-textile', 'emi-shielding-woven-tube',
    'rfid-textile-tape', 'braided-self-curling-tube', 'wired-conductive-tape',
    'silica-gel-switch-controller',
  ];

  it('every product page shows a photograph', () => {
    for (const slug of slugs) {
      const doc = docFor(`products/${slug}/index.html`);
      expect(doc.querySelector('[data-product-hero] img'), `${slug} has no hero`).toBeTruthy();
    }
  });

  it('every hero carries alt text that is not just the product name', () => {
    for (const slug of slugs) {
      const doc = docFor(`products/${slug}/index.html`);
      const img = doc.querySelector('[data-product-hero] img');
      const alt = img?.getAttribute('alt') ?? '';
      const h1 = doc.querySelector('h1')?.textContent?.trim() ?? '';
      expect(alt.length, `${slug} alt is too short to be descriptive`).toBeGreaterThan(30);
      expect(alt.toLowerCase(), `${slug} alt merely repeats the name`).not.toBe(h1.toLowerCase());
    }
  });

  it('every hero declares intrinsic width and height, so nothing shifts on load', () => {
    for (const slug of slugs) {
      const doc = docFor(`products/${slug}/index.html`);
      const img = doc.querySelector('[data-product-hero] img');
      expect(Number(img?.getAttribute('width')), `${slug} width`).toBeGreaterThan(0);
      expect(Number(img?.getAttribute('height')), `${slug} height`).toBeGreaterThan(0);
    }
  });

  it('serves modern formats through a picture element', () => {
    const doc = docFor('products/conductive-metal-yarn/index.html');
    const types = [...doc.querySelectorAll('[data-product-hero] source')]
      .map((s) => s.getAttribute('type'));
    expect(types).toContain('image/avif');
    expect(types).toContain('image/webp');
  });

  it('defers hero decoding rather than blocking render', () => {
    const doc = docFor('products/conductive-metal-yarn/index.html');
    const img = doc.querySelector('[data-product-hero] img');
    expect(img?.getAttribute('decoding')).toBe('async');
  });

  it('never ships the Pexels stock photo', () => {
    for (const slug of slugs) {
      const doc = docFor(`products/${slug}/index.html`);
      expect(doc.documentElement.outerHTML).not.toContain('pexels');
    }
  });
});
```

- [ ] **Step 2: Run to make sure it fails**

Run: `npm run build && npx vitest run tests/build.test.ts`
Expected: FAIL — no `[data-product-hero]` exists.

- [ ] **Step 3: Create `src/components/ProductHero.astro`**

`widths` is capped at the source's intrinsic width — sharp will happily upscale and produce a soft, larger file, which is worse than serving the original. Two of these sources are only 600 px wide.

```astro
---
import { Picture } from 'astro:assets';

interface Props {
  image: ImageMetadata;
  alt: string;
  caption?: string;
}

const { image, alt, caption } = Astro.props;

// Never request a width larger than the source: upscaling produces a blurrier,
// heavier file. wired-conductive-tape is only 600px wide, silica-gel 670px.
const widths = [480, 800, 1200].filter((w) => w <= image.width);
if (widths.length === 0) widths.push(image.width);
---
<figure class="hero" data-product-hero>
  <Picture
    src={image}
    alt={alt}
    widths={widths}
    sizes="(max-width: 60rem) 100vw, 60rem"
    formats={['avif', 'webp']}
    loading="eager"
    decoding="async"
  />
  {caption && <figcaption>{caption}</figcaption>}
</figure>

<style>
  .hero {
    margin: var(--s-6) 0 var(--s-8);
    background: var(--c-raised);
    border: 1px solid var(--c-line);
  }
  .hero :global(img) {
    display: block;
    width: 100%;
    height: auto;
  }
  figcaption {
    font-family: var(--font-mono);
    font-size: var(--t-12);
    color: var(--c-text-2);
    padding: var(--s-3);
    border-top: 1px solid var(--c-line);
  }
</style>
```

- [ ] **Step 4: Render it in `src/pages/products/[slug].astro`**

Add the import alongside the existing ones:

```astro
import ProductHero from '../../components/ProductHero.astro';
```

Then insert directly after the `certifications` paragraph and before `<div class="prose">`:

```astro
  {product.data.heroImage && (
    <ProductHero
      image={product.data.heroImage.src}
      alt={product.data.heroImage.alt}
      caption={product.data.catalogPdf
        ? `Photograph from ${product.data.catalogPdf}`
        : 'Photograph from the LiTex product archive'}
    />
  )}
```

- [ ] **Step 5: Build and run the suite**

Run: `npm run build && npm test`
Expected: build exits 0; all tests pass, including the six new hero assertions.

- [ ] **Step 6: Check what the optimizer actually emitted**

Run: `node -e "const {readdirSync,statSync}=require('fs');const d='dist/_astro';const f=readdirSync(d).filter(n=>/\.(avif|webp|jpg|png)$/.test(n));console.log(f.length,'images');let t=0;for(const n of f){const kb=statSync(d+'/'+n).size/1024;t+=kb;if(kb>200)console.log('  LARGE',n,Math.round(kb)+'KB')}console.log('total',Math.round(t)+'KB')"`
Expected: AVIF and WebP variants present. Investigate anything over 200 KB before committing — the 2030×914 PNG source is the one to watch.

- [ ] **Step 7: Run the design detector**

Run: `node .claude/skills/impeccable/scripts/detect.mjs --json src/components src/pages`
Expected: `[]`.

- [ ] **Step 8: Commit**

```bash
git add src/components/ProductHero.astro "src/pages/products/[slug].astro" tests/build.test.ts
git commit -m "feat: render optimized product hero photography with AVIF and WebP"
```

---

### Task 5: Thumbnails on cards and application pages

A card grid of seven text blocks is much harder to scan than one carrying images — and these products are visually distinct in a way the names are not.

**Files:**
- Modify: `src/components/ProductCard.astro`, `src/pages/products/index.astro`, `src/pages/applications/[slug].astro`
- Test: `tests/build.test.ts`

**Interfaces:**
- Consumes: `astro:assets` `Image`.
- Produces: `ProductCard.astro` gains optional props `{ image?: ImageMetadata; imageAlt?: string }`. Existing callers keep working unchanged.

- [ ] **Step 1: Write the failing assertions**

Append to `tests/build.test.ts`:

```ts
describe('product thumbnails', () => {
  it('shows a thumbnail on every card in the products index', () => {
    const doc = docFor('products/index.html');
    expect(doc.querySelectorAll('.card img')).toHaveLength(7);
  });

  it('gives every thumbnail width and height so the grid does not reflow', () => {
    const doc = docFor('products/index.html');
    for (const img of [...doc.querySelectorAll('.card img')]) {
      expect(Number(img.getAttribute('width'))).toBeGreaterThan(0);
      expect(Number(img.getAttribute('height'))).toBeGreaterThan(0);
    }
  });

  it('lazy-loads thumbnails, which are below the fold', () => {
    const doc = docFor('products/index.html');
    for (const img of [...doc.querySelectorAll('.card img')]) {
      expect(img.getAttribute('loading')).toBe('lazy');
    }
  });

  it('carries thumbnails through to application pages too', () => {
    const doc = docFor('applications/cable-protection-emi-shielding/index.html');
    expect(doc.querySelectorAll('.card img').length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to make sure it fails**

Run: `npm run build && npx vitest run tests/build.test.ts`
Expected: FAIL — cards contain no images.

- [ ] **Step 3: Extend `src/components/ProductCard.astro`**

Add to the frontmatter:

```astro
import { Image } from 'astro:assets';
```

Extend the `Props` interface and destructuring:

```astro
interface Props {
  href: string;
  name: string;
  summary: string;
  status: 'active' | 'legacy';
  certifications: readonly string[];
  image?: ImageMetadata;
  imageAlt?: string;
}

const { href, name, summary, status, certifications, image, imageAlt } = Astro.props;
```

Insert as the first child of `<article class="card">`, before the `<h2>`:

```astro
  {image && (
    <a class="thumb" href={href} tabindex="-1" aria-hidden="true">
      <Image src={image} alt={imageAlt ?? ''} width={560} loading="lazy" decoding="async" />
    </a>
  )}
```

> **Pass `width` only.** Astro derives `height` from the source's intrinsic aspect ratio and emits both attributes, which is what the width/height assertion checks. Passing a `height` that contradicts the source ratio makes Astro complain rather than crop — the crop belongs in CSS, which is what the `aspect-ratio` + `object-fit` rules below do.

> The thumbnail link is `aria-hidden` with `tabindex="-1"` because the heading beneath it already links to the same page. Two adjacent links to one destination make a screen reader announce the product twice and add a redundant tab stop.

Add to the `<style>` block:

```css
  .thumb {
    display: block;
    margin: calc(var(--s-6) * -1) calc(var(--s-6) * -1) 0;
    border-bottom: 1px solid var(--c-line);
  }
  .thumb :global(img) {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 14 / 9;
    object-fit: cover;
  }
```

- [ ] **Step 4: Pass the image from `src/pages/products/index.astro`**

Add these two props to the `<ProductCard />` call:

```astro
        image={product.data.heroImage?.src}
        imageAlt={product.data.heroImage?.alt}
```

- [ ] **Step 5: Pass the image from `src/pages/applications/[slug].astro`**

Add the identical two props to the `<ProductCard />` call in that file.

- [ ] **Step 6: Build and run the suite**

Run: `npm run build && npm test`
Expected: build exits 0; all tests pass.

- [ ] **Step 7: Run the design detector**

Run: `node .claude/skills/impeccable/scripts/detect.mjs --json src/components src/pages`
Expected: `[]`.

- [ ] **Step 8: Commit**

```bash
git add src/components/ProductCard.astro src/pages/products/index.astro "src/pages/applications/[slug].astro" tests/build.test.ts
git commit -m "feat: add product thumbnails to cards and application pages"
```

---

### Task 6: Lock the imagery policy into the build

Spec §5 says the imagery policy is *"a build rule, not a good intention."* Tasks 2–5 satisfy it for the pages that exist today. This task makes it hold for pages later plans add.

**Files:**
- Create: `tests/imagery.test.ts`

**Interfaces:**
- Consumes: `dist/`, `src/`, `src/assets/products/provenance.json`.
- Produces: nothing — this task is entirely a guard.

- [ ] **Step 1: Write the policy test**

Create `tests/imagery.test.ts`:

```ts
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const SRC = fileURLToPath(new URL('../src', import.meta.url));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const distFiles = walk(DIST);
const htmlFiles = distFiles.filter((f) => f.endsWith('.html'));
const imageFiles = distFiles.filter((f) => /\.(avif|webp|jpe?g|png|gif|svg)$/i.test(f));

describe('imagery policy', () => {
  it('never ships the Pexels stock photo anywhere in the build', () => {
    const offenders = distFiles.filter((f) => f.toLowerCase().includes('pexels'));
    expect(offenders).toEqual([]);
    for (const file of htmlFiles) {
      expect(readFileSync(file, 'utf8'), `${file} references pexels`).not.toContain('pexels');
    }
  });

  it('gives every img in the build a non-empty alt, or marks it decorative', () => {
    const offenders: string[] = [];
    for (const file of htmlFiles) {
      const html = readFileSync(file, 'utf8');
      for (const tag of html.match(/<img\b[^>]*>/g) ?? []) {
        const hasAlt = /\balt\s*=/.test(tag);
        const decorative = /aria-hidden\s*=\s*"true"/.test(tag) || /\balt\s*=\s*""/.test(tag);
        if (!hasAlt && !decorative) offenders.push(`${file}: ${tag.slice(0, 90)}`);
      }
    }
    expect(offenders, `img tags without alt:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('serves an AVIF or WebP variant for every raster image it emits', () => {
    const modern = imageFiles.filter((f) => /\.(avif|webp)$/i.test(f));
    expect(modern.length, 'no modern image formats were emitted').toBeGreaterThan(0);
  });

  it('keeps every emitted image under 300 KB', () => {
    const heavy = imageFiles
      .map((f) => ({ f, kb: statSync(f).size / 1024 }))
      .filter(({ kb }) => kb > 300)
      .map(({ f, kb }) => `${f} is ${Math.round(kb)}KB`);
    expect(heavy, `oversized images:\n${heavy.join('\n')}`).toEqual([]);
  });

  it('references no remote image host, so no visitor data leaves the origin', () => {
    for (const file of htmlFiles) {
      const html = readFileSync(file, 'utf8');
      expect(html, `${file} loads a remote image`).not.toMatch(
        /<img[^>]+src\s*=\s*"https?:\/\//,
      );
    }
  });

  it('keeps raw archive images out of the published build', () => {
    // archive/ is versioned as source material, not as a public asset directory.
    const leaked = distFiles.filter(
      (f) => f.includes('archive') && /\.(jpe?g|png)$/i.test(f),
    );
    expect(leaked).toEqual([]);
  });

  it('declares no AI-generated product photography', () => {
    const manifest = JSON.parse(
      readFileSync(join(SRC, 'assets/products/provenance.json'), 'utf8'),
    ) as Record<string, { aiGenerated: boolean }>;
    for (const [file, entry] of Object.entries(manifest)) {
      expect(entry.aiGenerated, `${file} is AI generated and used as a product image`).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run it**

Run: `npm run build && npx vitest run tests/imagery.test.ts`
Expected: PASS, 7 tests. If the 300 KB budget fails, reduce the offending source rather than raising the budget — the EMI PNG is the likely culprit and converting that source to JPEG before re-running Task 1 is the correct fix.

- [ ] **Step 3: Run the full suite and the detector**

Run: `npm test && node .claude/skills/impeccable/scripts/detect.mjs --json src/components src/pages src/styles`
Expected: all suites pass; detector returns `[]`.

- [ ] **Step 4: Commit**

```bash
git add tests/imagery.test.ts
git commit -m "test: enforce the imagery policy against the built site"
```

---

## Definition of done

Verify each by running it, not by reading the code.

- [ ] `npm run build` exits 0; all seven product pages render a photograph
- [ ] `npm test` passes every suite: contrast, tokens, fonts, schemas, references, crossLinks, csv, jsonld, provenance, imagery, build
- [ ] Every hero has descriptive alt text longer than 30 characters that is not the product name
- [ ] Every `<img>` in `dist/` declares `width` and `height`
- [ ] AVIF and WebP variants are emitted; no image in `dist/` exceeds 300 KB
- [ ] Alt text equal to the product name fails the build (re-verified in Task 3 Step 3)
- [ ] An `aiGenerated: true` hero fails the build
- [ ] `pexels` appears nowhere in `dist/`
- [ ] Every file in `src/assets/products/` has a provenance entry naming an `archive/` source

## Deliberately out of scope

Deferred to later plans: `/technology/` and the heating-element comparison, `/company/` and its three children, `/downloads/`, `/news/` and the 7 posts, the contact and sample-request flow with its Pages Function + Turnstile + KV, the print/light stylesheet, the credibility bar, the cross-product comparison table, `_redirects` and the 23-URL redirect map, sitemap, Cloudflare Web Analytics, the Sveltia CMS at `/admin`, and the Lighthouse/axe CI budgets.

**Plan renumbering.** Splitting imagery out means the remaining work is now Plans 4–6, not 4–5:

- **Plan 4** — content pages: `/technology/`, `/company/` + three children, `/downloads/`, `/news/` + 7 posts. The company-catalog assets held back above are for this plan.
- **Plan 5** — contact and sample-request flow: Pages Function, Turnstile, KV, the store-before-send failure handling in spec §4.
- **Plan 6** — launch: `_redirects`, sitemap, analytics, Sveltia CMS, print stylesheet, Lighthouse and axe budgets, broken-link checking.

Also still not implemented, and not to be assumed present:

- **Broken internal link detection.** Plan 6.
- **Lighthouse and axe budgets.** Plan 6. The image-weight budget in Task 6 is a byte check, not a Lighthouse score.

## Open questions for LiTex — do not guess these

1. ~~Usage rights on the catalog photography.~~ **RESOLVED 2026-08-11 — LiTex has granted usage rights on the catalog photography.** No rights question remains for any image in this plan, nor for the company-catalog assets held for Plan 4 (patent certificate, TAITRONICS award, SGS report, factory, looms, trade-show and personnel frames). Proceed without further confirmation.
2. **Two products have only low-resolution photography.** `wired-conductive-tape` (600×341) and `silica-gel-switch-controller` (670×431) are the largest that exist anywhere in the archive. They are used unscaled, but both would benefit from a re-shoot — the wired tape especially, since it is the product carrying patent TW 1M545145.
3. **No photograph exists for CuNi (copper-nickel) CMY**, which was "coming soon" in 2018 and whose status is still unconfirmed.
4. **The thermograph images** (heating textile under thermal imaging) are strong evidence for the "even and stable heating" claim, held for `/technology/` in Plan 4. Confirm the test conditions before publishing them as evidence of anything measurable.
5. Carried over: the EMI `(c)` column, the EMI `(ø)` units, the stainless steel yarn table's owning product, and patent statuses.

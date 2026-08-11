/**
 * One-shot extraction of LiTex product photography out of archive/ into src/assets/.
 * Committed so the provenance of every shipped image is auditable and reproducible.
 *
 * Run: node scripts/extract-images.mjs
 *
 * PDF work is delegated to scripts/extract-image.py (Python + pymupdf): Node cannot
 * open a PDF here, pdftoppm is not installed, and pdftotext cannot read images at
 * all. That script explains why the embedded bytes are decoded rather than copied.
 *
 * Re-runnable: every image in the output directory is cleared first, so a source
 * that stops being used cannot linger as an orphan.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = `${ROOT}src/assets/products`;

/** Every entry was confirmed by decoding the image and viewing it on 2026-08-11. */
const SOURCES = [
  {
    slug: 'conductive-metal-yarn',
    from: 'archive/catalogs/2018-non-carbon-electrical-heating-textile.pdf',
    page: 3, xref: 11,
    note: 'Catalog p.3: spool of CMY on wood, a macro of three coiled filaments, and an SEM micrograph captioned "outer layer: micro metal" and "Core: polymer yarn"',
  },
  {
    slug: 'electrical-heating-textile',
    from: 'archive/catalogs/2018-non-carbon-electrical-heating-textile.pdf',
    page: 2, xref: 3,
    note: 'Catalog p.2: folded lengths of white open-mesh heating textile on a dark wooden bench',
  },
  {
    slug: 'emi-shielding-woven-tube',
    from: 'archive/catalogs/2018-emi-shielding-wire-tube.pdf',
    page: 1, xref: 26,
    note: 'Catalog p.1: three spools of braided shielding tube, with two close-ups of the braid flaring open',
  },
  {
    slug: 'rfid-textile-tape',
    from: 'archive/catalogs/2018-rfid-textile-tape.pdf',
    page: 1, xref: 1487,
    // The stored image is the whole page's image layer, roughly half empty page.
    // Only the top band is a photograph; the two small right-hand frames sit in a
    // sea of white that would read as a broken hero.
    crop: { w: 1035, h: 525, x: 0, y: 0 },
    note: 'Catalog p.1, top band cropped from the page image layer: two lengths of RFID woven tape on a wooden surface, showing the serpentine antenna path',
  },
  {
    slug: 'wired-conductive-tape',
    from: 'archive/catalogs/2018-wired-conductive-tape.pdf',
    page: 2, xref: 4,
    note: 'Catalog p.2: two lengths of dark woven tape with a pale conductive wire in a repeating wave, held against a steel ruler. Largest available.',
  },
  {
    slug: 'silica-gel-switch-controller',
    // Larger and identical in framing to the catalog crop at p.1 xref 99 (670x431).
    copyFrom: 'archive/images/silica-gel-switch-controller.jpg',
    note: 'Archived product page image: the HT001 switch with its three lead pairs annotated B+/B-, T1/T2 and P+/P-, plus an inset close-up of the moulded body',
  },
  {
    slug: 'braided-self-curling-tube',
    copyFrom: 'archive/images/20200313_070104268_ios.jpg',
    note: 'Archived product page image: five diameters of black braided sleeve laid side by side on a white surface',
  },
];

mkdirSync(OUT, { recursive: true });
for (const stale of readdirSync(OUT).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))) {
  rmSync(`${OUT}/${stale}`);
}

const manifest = {};

for (const s of SOURCES) {
  const file = `${s.slug}.jpg`;
  const dest = `${OUT}/${file}`;
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

  manifest[file] = {
    source: s.copyFrom ?? s.from,
    page: s.page ?? null,
    xref: s.xref ?? null,
    crop: s.crop ?? null,
    dimensions,
    note: s.note,
    aiGenerated: false,
    extracted: '2026-08-11',
  };
  console.log(`${file.padEnd(36)} ${dimensions}`);
}

writeFileSync(`${OUT}/provenance.json`, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`\nWrote provenance for ${Object.keys(manifest).length} images.`);

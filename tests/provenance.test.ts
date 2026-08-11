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

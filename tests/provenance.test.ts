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

/** First bytes of the formats Astro's sharp can actually decode. */
const MAGIC: Record<string, string> = {
  '.jpg': 'ffd8ff',
  '.jpeg': 'ffd8ff',
  '.png': '89504e',
};

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

  // The catalogs store three of these as JPEG 2000 and all six as CMYK. Copying the
  // stored bytes out and naming the result .jpg produces a file sharp cannot decode
  // (`jp2 input: false`), which fails the Astro build with an opaque error. Check the
  // bytes, not the extension.
  it('holds bytes that match the extension, so sharp can actually decode them', () => {
    for (const file of imageFiles) {
      const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
      const head = readFileSync(join(DIR, file)).subarray(0, 3).toString('hex');
      expect(head, `${file} is not really a ${ext} file`).toBe(MAGIC[ext]);
    }
  });
});

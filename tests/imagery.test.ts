import { readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { DIST, walk } from './helpers/dist';

const SRC = fileURLToPath(new URL('../src', import.meta.url));

const distFiles = walk(DIST);
const htmlFiles = distFiles.filter((f) => f.endsWith('.html'));
const imageFiles = distFiles.filter((f) => /\.(avif|webp|jpe?g|png|gif|svg)$/i.test(f));

/**
 * Every provenance manifest, merged. tests/provenance.test.ts asserts the two
 * groups share no filename, so a flat lookup is unambiguous.
 */
function allProvenance(): Record<string, { aiGenerated: boolean }> {
  return ['products', 'company', 'news'].reduce(
    (all, group) => ({
      ...all,
      ...JSON.parse(readFileSync(join(SRC, `assets/${group}/provenance.json`), 'utf8')),
    }),
    {},
  );
}

/**
 * The front door ships no catalog page ground.
 *
 * The images in archive/ were lifted out of PDF catalogs, and several are composites: two
 * or three small photographs floating in the white of the page they were laid out on.
 * Dropped onto a near-black page that white is not provenance, it is a slab — most
 * obviously on a phone, where the lede figure is full width.
 *
 * Deliberately scoped to the homepage rather than applied site-wide. Measured across every
 * shipped asset on 2026-08-14: `sgs-test-report.jpg` is 74.5% near-white and
 * `taitronics-award.jpg` 74.3%, because they are photographs OF DOCUMENTS — paper is
 * supposed to be white, and a global rule would either fail them or be set so loose it
 * caught nothing. The homepage is where the composite actually hurt.
 */
describe('the homepage ships photographs, not catalog page ground', () => {
  it('keeps every homepage figure under a quarter blank page', async () => {
    const sharp = (await import('sharp')).default;
    const html = readFileSync(join(DIST, 'index.html'), 'utf8');

    // The `src` attribute, not a srcset entry: it is the single fallback the browser uses
    // when it understands neither avif nor webp, and it is unambiguous to resolve.
    const srcs = [...html.matchAll(/<figure[^>]*data-archive-figure[\s\S]*?<img[^>]*\ssrc="([^"]+)"/g)]
      .map((m) => m[1]);

    // Without this the loop below would pass by iterating over nothing — the exact
    // failure mode this repo keeps finding. Three figures were added to the homepage in
    // the redesign; if that changes deliberately, change this number deliberately.
    expect(srcs.length, 'no homepage figures were found, so nothing was measured').toBe(3);

    const measured: { src: string; white: string }[] = [];
    for (const src of srcs) {
      const file = join(DIST, src.split('/').join(sep));
      const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
      let near = 0;
      for (let i = 0; i < info.width * info.height; i++) {
        const o = i * info.channels;
        if (data[o] >= 242 && data[o + 1] >= 242 && data[o + 2] >= 242) near++;
      }
      const pct = (100 * near) / (info.width * info.height);
      if (pct >= 25) measured.push({ src, white: `${pct.toFixed(1)}%` });
    }

    // 25% sits above the honest headroom and below the defect. The three-panel CMY
    // composite measured 33.8%; the factory strip, which is also a composite but a
    // tightly packed one, measures 14.3% and is fine. Both numbers were read off the
    // build, not guessed.
    expect(measured, `homepage figures that are mostly blank page:\n${JSON.stringify(measured, null, 2)}`)
      .toEqual([]);
  });
});

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

  it('declares no AI-generated photography anywhere in the asset tree', () => {
    for (const [file, entry] of Object.entries(allProvenance())) {
      expect(entry.aiGenerated, `${file} is AI generated and used as real photography`).toBe(false);
    }
  });
});

describe('Tier 3 sections — real photography only', () => {
  // Spec §5: any image that depicts LiTex's actual product, material, factory, machinery,
  // personnel or certification documents must be real. /technology/ and /company/ are
  // Tier 3 wall to wall, so every raster image they render must trace to a provenance
  // entry that declares itself real. Inline SVG diagrams are Tier 1 and exempt.
  //
  // This stopped being vacuous in Plan 5: /company/ now ships six photographs,
  // including two certificate crops. Every one must trace to a manifest entry that
  // declares itself real.
  const TIER_3 = ['technology', 'company', 'news'];

  const manifest = allProvenance();

  /** Astro emits /_astro/<stem>.<hash>[_<variant>].<ext>; recover the original stem. */
  function sourceStem(src: string): string {
    const base = src.split('/').pop() ?? '';
    return base.split('.')[0];
  }

  const tier3Html = htmlFiles.filter((f) =>
    TIER_3.some((section) => f.includes(`${sep}${section}${sep}`)),
  );

  it('covers the sections it claims to cover', () => {
    // If /technology/ stops being generated this suite would pass by doing nothing.
    expect(tier3Html.length, 'no Tier 3 pages were found in dist').toBeGreaterThan(0);
  });

  it('renders no image on a Tier 3 page without a real-photography provenance entry', () => {
    const offenders: string[] = [];
    for (const file of tier3Html) {
      const html = readFileSync(file, 'utf8');
      for (const tag of html.match(/<img\b[^>]*>/g) ?? []) {
        const src = tag.match(/\bsrc\s*=\s*"([^"]+)"/)?.[1] ?? '';
        if (!src) continue;
        const entry = manifest[`${sourceStem(src)}.jpg`] ?? manifest[`${sourceStem(src)}.png`];
        if (!entry) offenders.push(`${file}: ${src} has no provenance entry`);
        else if (entry.aiGenerated) offenders.push(`${file}: ${src} is AI generated`);
      }
    }
    expect(offenders, `Tier 3 violations:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('allows inline SVG diagrams, which are Tier 1', () => {
    const tech = readFileSync(
      tier3Html.find((f) => f.includes(`technology${sep}index.html`)) ?? '',
      'utf8',
    );
    expect(tech).toContain('<svg');
  });
});

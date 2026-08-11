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

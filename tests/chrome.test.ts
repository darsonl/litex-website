import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
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

const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html'));

function docFor(relativePath: string) {
  return parseHTML(readFileSync(join(DIST, relativePath), 'utf8')).document;
}

/** Maps an internal href to the file Astro's build.format:'directory' emits for it. */
function routeFile(href: string): string {
  const clean = href.replace(/^\//, '').replace(/\/$/, '');
  return clean === '' ? 'index.html' : `${clean}/index.html`;
}

describe('site chrome', () => {
  it('puts a masthead on every generated page', () => {
    for (const file of htmlFiles) {
      const doc = parseHTML(readFileSync(file, 'utf8')).document;
      expect(doc.querySelector('header[data-masthead]'), `${file} has no masthead`).toBeTruthy();
    }
  });

  it('offers primary navigation to the sections that exist', () => {
    const doc = docFor('index.html');
    const hrefs = [...doc.querySelectorAll('nav[aria-label="Primary"] a')]
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/products/');
    expect(hrefs).toContain('/applications/');
  });

  // A nav link to an unbuilt route is broken on every page at once. This is the
  // cheapest possible guard against that, and it runs before Plan 8's link checker.
  it('never links from the chrome to a route the build did not generate', () => {
    const broken: string[] = [];
    for (const file of htmlFiles) {
      const doc = parseHTML(readFileSync(file, 'utf8')).document;
      const chrome = [
        ...doc.querySelectorAll('header[data-masthead] a'),
        ...doc.querySelectorAll('footer[data-sitefooter] a'),
      ];
      for (const a of chrome) {
        const href = a.getAttribute('href') ?? '';
        if (!href.startsWith('/')) continue; // external and mailto/tel are not our routes
        if (!existsSync(join(DIST, routeFile(href)))) broken.push(`${file} → ${href}`);
      }
    }
    expect(broken, `chrome links with no page behind them:\n${broken.join('\n')}`).toEqual([]);
  });

  it('marks the current section in the nav for assistive tech', () => {
    const doc = docFor('products/index.html');
    const current = doc.querySelector('nav[aria-label="Primary"] a[aria-current="page"]');
    expect(current?.getAttribute('href')).toBe('/products/');
  });

  it('does not let the wordmark introduce a second h1', () => {
    for (const file of htmlFiles) {
      const doc = parseHTML(readFileSync(file, 'utf8')).document;
      expect(doc.querySelectorAll('h1').length, `${file} h1 count`).toBe(1);
    }
  });

  it('keeps the skip link ahead of the masthead in source order', () => {
    const doc = docFor('index.html');
    const first = doc.body.querySelector('a, header');
    expect(first?.getAttribute('class')).toContain('skip-link');
  });
});

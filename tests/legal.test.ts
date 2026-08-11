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

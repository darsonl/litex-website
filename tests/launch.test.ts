import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { DIST, docFor } from './helpers/dist';

describe('404 handling', () => {
  // Cloudflare Pages treats a build output with no root 404.html as a single-page app
  // and answers EVERY unmatched path with 200 + index.html. Verified live against
  // litex-website.pages.dev on 2026-08-13, before this file existed: /robots.txt,
  // /favicon.ico and /any-typo/ all returned 200 and the homepage. The presence of
  // dist/404.html is the entire fix, so it is asserted structurally.
  it('emits a 404.html at the root of the build', () => {
    expect(
      existsSync(join(DIST, '404.html')),
      'without dist/404.html every unmatched URL returns 200 with the homepage',
    ).toBe(true);
  });

  it('is a real page with one h1 and a way back', () => {
    const doc = docFor('404.html');
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    const hrefs = [...doc.querySelectorAll('main a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/products/');
  });

  it('is not indexable, because a 404 must never be a search result', () => {
    const robots = docFor('404.html').querySelector('meta[name="robots"]');
    expect(robots?.getAttribute('content')).toContain('noindex');
  });

  // The SPA fallback served index.html for everything, so "looks like the homepage" is
  // the exact shape of the bug being fixed. Compared against the homepage's real h1
  // rather than a phrase from its <title>: the plan's original wording searched
  // body.textContent for a title fragment, which never appears there and so could not
  // have failed. Read both files, compare the thing that actually differs.
  it('does not render the homepage under a 404 name', () => {
    const notFound = docFor('404.html').querySelector('h1')?.textContent?.trim();
    const home = docFor('index.html').querySelector('h1')?.textContent?.trim();
    expect(notFound, 'dist/404.html is a copy of the homepage').not.toBe(home);
    expect(notFound?.toLowerCase()).toContain('does not exist');
  });
});

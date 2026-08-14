import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { DIST, allHtmlFiles, appHtmlFiles, docFor } from './helpers/dist';

describe('the CMS bundle is vendored, not fetched', () => {
  it('ships the Sveltia bundle from our own origin', () => {
    const bundle = join(DIST, 'admin', 'sveltia-cms.js');
    expect(
      existsSync(bundle),
      'dist/admin/sveltia-cms.js is missing — scripts/sync-cms.mjs did not run',
    ).toBe(true);
  });

  // A zero-byte or truncated copy would satisfy existsSync and fail only in a browser,
  // where nobody is looking. The real bundle is a whole SPA; 100 KB is far below its
  // true size and far above any plausible stub.
  it('ships a bundle big enough to actually be the application', () => {
    const kb = statSync(join(DIST, 'admin', 'sveltia-cms.js')).size / 1024;
    expect(kb, `the vendored bundle is only ${kb.toFixed(0)} KB`).toBeGreaterThan(100);
  });

  it('is copied rather than committed, so it cannot drift from package.json', () => {
    const ignored = readFileSync(join(DIST, '..', '.gitignore'), 'utf8');
    expect(ignored, '.gitignore does not exclude the vendored bundle').toContain(
      'public/admin/sveltia-cms.js',
    );
  });
});

describe('the admin app is an application, not a page of the website', () => {
  it('is excluded from the site-page guards', () => {
    const leaked = allHtmlFiles().filter((f) => f.includes('admin'));
    expect(
      leaked,
      `allHtmlFiles() returned admin pages, which will fail the masthead, single-h1,\n` +
        `footer and contact-details guards for a reason that is not a defect:\n${leaked.join('\n')}`,
    ).toEqual([]);
  });

  // The counterpart. If appHtmlFiles() ever returns nothing, the assertions below stop
  // testing anything and would keep passing forever.
  it('is still reachable to the tests that do care about it', () => {
    expect(appHtmlFiles().length, 'the admin app was not built at all').toBe(1);
  });

  it('tells search engines to stay out, in the page and in robots.txt', () => {
    const doc = docFor('admin/index.html');
    expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content')).toContain(
      'noindex',
    );
    const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
    expect(robots, 'robots.txt does not disallow /admin/').toContain('Disallow: /admin/');
  });

  // public/ files are not Astro routes, so the sitemap should never have seen this.
  // Asserted anyway: it costs nothing and would catch someone turning /admin into a page.
  it('never appears in the sitemap', () => {
    const sitemap = readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8');
    expect(sitemap, '/admin/ is being advertised to search engines').not.toContain('/admin');
  });

  // The whole point of Task 1. If someone "fixes" a loading problem by pasting the
  // documented unpkg tag back in, this fails before the privacy guard has to.
  it('loads nothing from another origin', () => {
    const html = readFileSync(join(DIST, 'admin', 'index.html'), 'utf8');
    const absolute = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
    expect(absolute, `the admin shell reaches off-origin:\n${absolute.join('\n')}`).toEqual([]);
  });
});

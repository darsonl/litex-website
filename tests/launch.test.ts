import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { DIST, docFor, routeFile } from './helpers/dist';

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

describe('the legacy URL map', () => {
  const source = readFileSync(join(DIST, '_redirects'), 'utf8');
  const rules = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const [from, to, code] = l.split(/\s+/);
      return { from, to, code };
    });
  const byFrom = Object.fromEntries(rules.map((r) => [r.from, r.to]));

  // Spec §3 lists 23 legacy URLs. Seven are identity mappings that need no rule, and
  // test-post-blah is a 410 served by a Function, so the file holds exactly 15.
  it('contains exactly the fifteen rules that actually change a path', () => {
    expect(rules).toHaveLength(15);
  });

  it('uses 301 for every rule, because these are permanent moves', () => {
    for (const rule of rules) {
      expect(rule.code, `${rule.from} has code ${rule.code}`).toBe('301');
    }
  });

  // A rule whose source equals its destination is an infinite redirect. Seven rows of
  // spec §3's table are identity mappings, and this is what stops them being written.
  it('never redirects a path to itself', () => {
    for (const rule of rules) {
      expect(rule.from, 'redirect loop').not.toBe(rule.to);
    }
  });

  it('sends every rule to a page that was actually built', () => {
    for (const rule of rules) {
      expect(
        existsSync(join(DIST, routeFile(rule.to))),
        `${rule.from} -> ${rule.to} but ${routeFile(rule.to)} was not built`,
      ).toBe(true);
    }
  });

  it('maps the seven news permalinks to their new slugs', () => {
    expect(byFrom['/2022/01/21/tokyo-wearable-expo-2022/']).toBe('/news/tokyo-wearable-expo-2022/');
    expect(byFrom['/2020/05/20/new-braided-self-curling-tube-item/']).toBe('/news/new-braided-self-curling-tube/');
    expect(byFrom['/2018/02/26/dusseldorf-wire-show/']).toBe('/news/dusseldorf-wire-show/');
    expect(byFrom['/2017/06/26/featured-on-techtextil-blog/']).toBe('/news/featured-on-techtextil-blog/');
    expect(byFrom['/2017/02/23/copper-nickel-1s1z/']).toBe('/news/copper-nickel-1s1z/');
    expect(byFrom['/2017/02/23/litex-attending-techtextil-at-frankfurt-germany/']).toBe('/news/techtextil-frankfurt/');
    expect(byFrom['/2017/02/23/a-rewarding-experience-at-the-wearable-expo/']).toBe('/news/wearable-expo/');
  });

  it('maps the renamed product and company URLs', () => {
    expect(byFrom['/about-2/']).toBe('/company/about/');
    expect(byFrom['/patents-and-awards-2/']).toBe('/company/patents-and-awards/');
    expect(byFrom['/privacy-policy/']).toBe('/legal/privacy/');
    expect(byFrom['/products/conductive-metal-yarn-cmy/']).toBe('/products/conductive-metal-yarn/');
    expect(byFrom['/products/conductive-metal-yarn-cmy/electrical-heating-textile/'])
      .toBe('/products/electrical-heating-textile/');
    expect(byFrom['/products/silica-gel-switch-controller-2/']).toBe('/products/silica-gel-switch-controller/');
    expect(byFrom['/2018/12/06/new-electrical-heating-alternatives-to-consider/'])
      .toBe('/technology/heating-element-comparison/');
    expect(byFrom['/2018/02/26/catalog-download/']).toBe('/downloads/');
  });

  // Spec §3: a 301 transfers value, a 410 tells search engines to drop the URL.
  // _redirects supports only 301/302/303/307/308 — verified against Cloudflare's docs
  // 2026-08-13 — so this one URL cannot live in the file and must not be smuggled in
  // as a redirect to the homepage.
  //
  // Asserted against the parsed RULES, not the raw file. The plan's original wording
  // banned the string anywhere in the source, which collided with the header comment
  // explaining why the URL is absent — and that comment is the thing stopping someone
  // "helpfully" adding a rule later. Cloudflare acts on rules; a comment is inert.
  // Same ruling as Plan 6's techtextil-blog.com collision: a string-containment ban
  // cannot tell a rule from a mention, so guard what actually reaches a visitor.
  it('does not redirect test-post-blah anywhere', () => {
    const smuggled = rules.filter(
      (r) => r.from.includes('test-post-blah') || r.to.includes('test-post-blah'),
    );
    expect(smuggled, 'test-post-blah must answer 410, not redirect').toEqual([]);
  });

  it('serves test-post-blah from a Function so it can answer 410', () => {
    const fn = new URL('../functions/2016/09/22/test-post-blah.ts', import.meta.url);
    expect(existsSync(fn), 'the 410 Function is missing').toBe(true);
    expect(readFileSync(fn, 'utf8')).toContain('410');
  });
});

import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { parseHTML } from 'linkedom';
import { DIST, walk, allHtmlFiles, docFor } from './helpers/dist';

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
    // Pins the deliberate absence of a trailing full stop — the archived page never
    // had one, and the page's own source note claims the paragraph is verbatim.
    expect(text).toContain('this information will not be shared with any third parties');
  });

  // allHtmlFiles(), not a raw walk of dist/: "every page" means every page of the LiTex
  // website. The /admin content editor is served from this origin but is an application,
  // not a page — its whole body is one <script> and it has no footer to carry a link.
  //
  // Proved rather than assumed: with this reading dist/ directly, the guard fails with
  // "dist\admin\index.html has no privacy link". The two sweeps below deliberately keep
  // walking dist/ directly, because "no undisclosed third party" and "Turnstile only
  // where there is a form" DO apply to the admin app and must keep covering it.
  it('is reachable from the footer of every page', () => {
    for (const file of allHtmlFiles()) {
      const doc = parseHTML(readFileSync(file, 'utf8')).document;
      const hrefs = [...doc.querySelectorAll('footer[data-sitefooter] a')]
        .map((a) => a.getAttribute('href'));
      expect(hrefs, `${file} has no privacy link`).toContain('/legal/privacy/');
    }
  });
});

describe('privacy notice stays true as the site grows', () => {
  // These guards exist to fail the moment the page stops describing the site. A privacy
  // notice that quietly stops being true is worse than one that was never written.

  // Rewritten in Plan 7, extended in Plan 8. The site loads exactly two third-party
  // resources — the Turnstile widget, on the pages that carry a form, and the cookieless
  // Cloudflare Web Analytics beacon on every page — and /legal/privacy/ discloses both.
  // The guard's job is unchanged: an UNDISCLOSED third party must fail. A third entry may
  // only be added in the same commit that discloses it on that page.
  const DISCLOSED = new Set([
    'https://challenges.cloudflare.com/turnstile/v0/api.js',
    'https://static.cloudflareinsights.com/beacon.min.js',
  ]);

  it('loads no third-party resource the privacy notice does not disclose', () => {
    const undisclosed = new Set<string>();

    for (const file of walk(DIST).filter((f) => f.endsWith('.html'))) {
      const doc = parseHTML(readFileSync(file, 'utf8')).document;
      for (const el of [
        ...doc.querySelectorAll('script[src], link[rel="stylesheet"], link[rel="preconnect"]'),
      ]) {
        const url = el.getAttribute('src') ?? el.getAttribute('href') ?? '';
        if (/^https?:\/\//.test(url) && !DISCLOSED.has(url)) undisclosed.add(url);
      }
    }

    // Scanning the HTML alone is not enough, and this was demonstrated rather than
    // assumed: a plain <script src="https://..."> in a .astro file does NOT reach dist/
    // as an absolute URL. Astro processes it into a local module whose whole body is
    // `import "https://.../tracker.js"` — the browser still makes the third-party
    // request, but no HTML attribute names it. Turnstile only stays visible above
    // because EnquiryForm.astro marks it is:inline. So the emitted JS is swept too.
    for (const file of walk(DIST).filter((f) => f.endsWith('.js'))) {
      const js = readFileSync(file, 'utf8');
      for (const [, url] of js.matchAll(/(?:^|[\s;{(])(?:import|from)\s*["'](https?:\/\/[^"']+)["']/g)) {
        if (!DISCLOSED.has(url)) undisclosed.add(url);
      }
    }

    expect(
      [...undisclosed],
      'an undisclosed third-party resource is now loaded — update /legal/privacy/',
    ).toEqual([]);
  });

  // Deliberately matched on the script element, not on the raw text of the file:
  // /legal/privacy/ has to NAME challenges.cloudflare.com in order to disclose it, and a
  // page that discloses the widget is exactly not a page that loads it. The count is
  // exact rather than toBeGreaterThan(0) — that is what catches the widget leaking onto
  // a page with no form to protect.
  it('loads Turnstile only on the pages that have a form', () => {
    const withTurnstile = walk(DIST)
      .filter((f) => f.endsWith('.html'))
      .filter((f) =>
        parseHTML(readFileSync(f, 'utf8'))
          .document.querySelector('script[src*="challenges.cloudflare.com"]'),
      );
    expect(withTurnstile).toHaveLength(2);
    expect(withTurnstile.every((f) => /contact|request-a-sample/.test(f))).toBe(true);
  });

  // Replaces "claims no analytics only while the site really runs none", which Plan 8
  // Task 8 made false and which was deleted rather than loosened. The site now runs
  // Cloudflare Web Analytics, so the obligation inverts: the page must SAY SO.
  it('discloses the analytics it now runs', () => {
    const text = docFor('legal/privacy/index.html').body.textContent ?? '';
    expect(text).toContain('Cloudflare Web Analytics');
    // Cookieless is the reason spec §4 chose this vendor and the reason the site needs
    // no consent banner. If that stops being true, this page is wrong, not just stale.
    expect(text.toLowerCase()).toContain('cookie');
  });

  it('loads the analytics beacon on every page', () => {
    for (const file of allHtmlFiles()) {
      expect(
        readFileSync(file, 'utf8'),
        `${file} is missing the analytics beacon`,
      ).toContain('static.cloudflareinsights.com/beacon.min.js');
    }
  });

  it('describes the form now that one exists', () => {
    const text = docFor('legal/privacy/index.html').body.textContent ?? '';
    expect(text).toContain('Turnstile');
    expect(text).toContain('180 days');
    // The no-IP promise is enforced against the function in tests/submit.test.ts,
    // which is what makes it safe for the page to state.
    expect(text.toLowerCase()).toContain('ip address');
  });
});

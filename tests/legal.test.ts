import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { parseHTML } from 'linkedom';
import { DIST, walk, docFor } from './helpers/dist';

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
  // These guards exist to fail the moment the page stops describing the site. A privacy
  // notice that quietly stops being true is worse than one that was never written.

  // Rewritten in Plan 7. The site now loads exactly one third-party resource — the
  // Turnstile widget, on the pages that carry a form — and /legal/privacy/ discloses it.
  // The guard's job is unchanged: an UNDISCLOSED third party must fail. Plan 8 adds the
  // Cloudflare Web Analytics script to this list and updates the page in the same commit.
  const DISCLOSED = new Set([
    'https://challenges.cloudflare.com/turnstile/v0/api.js',
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

  // Carried over from the guard rewritten above, which asserted this alongside the
  // external-resource sweep. The claim is unchanged and still true, so it must not be
  // lost with the sweep it used to travel with. Plan 8 changes the page and this line.
  it('claims no analytics only while the site really runs none', () => {
    expect(docFor('legal/privacy/index.html').body.textContent).toContain('no analytics');
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

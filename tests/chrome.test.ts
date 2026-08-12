import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { parseHTML } from 'linkedom';
import { DIST, allHtmlFiles, docFor, routeFile } from './helpers/dist';

const htmlFiles = allHtmlFiles();

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

describe('site footer', () => {
  it('puts a footer on every generated page', () => {
    for (const file of htmlFiles) {
      const doc = parseHTML(readFileSync(file, 'utf8')).document;
      expect(doc.querySelector('footer[data-sitefooter]'), `${file} has no footer`).toBeTruthy();
    }
  });

  it('carries the credibility bar spec §5 specifies', () => {
    const text = docFor('index.html').querySelector('[data-credibility]')?.textContent ?? '';
    for (const claim of ['REACH', 'RoHS', 'SGS TESTED', 'M545145', 'SINCE 1999']) {
      expect(text, `credibility bar is missing ${claim}`).toContain(claim);
    }
  });

  // "TW 1M545145" is what the archive graphic prints and it is malformed; the real
  // record is TWM545145U. Verified against Google Patents 2026-08-11. The site must
  // never reintroduce the typo, and must not assert a right currently in force while
  // the renewal status is unconfirmed.
  it('cites the patent number in a form that matches the register', () => {
    for (const file of htmlFiles) {
      const html = readFileSync(file, 'utf8');
      expect(html, `${file} prints the malformed patent number`).not.toContain('1M545145');
      expect(html, `${file} asserts an unverified patent grant`).not.toContain('PATENTED');
    }
  });

  it('publishes the real contact details, on every page', () => {
    for (const file of htmlFiles) {
      const html = readFileSync(file, 'utf8');
      expect(html, `${file} lost the contact address`).toContain('sales@litex.com.tw');
      expect(html, `${file} lost the phone number`).toContain('2308-4712');
    }
  });

  it('never reintroduces the theme placeholder contact details', () => {
    for (const file of htmlFiles) {
      const html = readFileSync(file, 'utf8');
      expect(html, `${file} contains placeholder contact details`).not.toContain('example.com');
      expect(html, `${file} contains the placeholder US address`).not.toContain('10 Street Road');
      expect(html, `${file} contains the placeholder phone`).not.toContain('555 1234');
    }
  });

  it('keeps the email in astro.config.mjs identical to the one pages render', async () => {
    // Two declarations exist on purpose: pages must not import astro.config.mjs.
    // They must never disagree.
    const { COMPANY } = await import('../src/lib/company');
    const config = readFileSync(
      fileURLToPath(new URL('../astro.config.mjs', import.meta.url)),
      'utf8',
    );
    expect(config, 'CONTACT_EMAIL has drifted from COMPANY.email').toContain(COMPANY.email);
  });
});

describe('homepage', () => {
  it('offers both doors — by product and by application', () => {
    const doc = docFor('index.html');
    const hrefs = [...doc.querySelectorAll('[data-door]')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/products/', '/applications/']);
  });

  it('states how much is behind each door, from the collections themselves', () => {
    const doc = docFor('index.html');
    const doors = [...doc.querySelectorAll('[data-door]')].map((a) => a.textContent ?? '');
    expect(doors[0]).toContain('7');
    expect(doors[1]).toContain('6');
  });

  it('says what LiTex actually makes, above the fold', () => {
    const doc = docFor('index.html');
    expect(doc.querySelector('h1')?.textContent).toContain('conductive');
  });

  it('names the founding year rather than leaving credibility to the footer alone', () => {
    expect(docFor('index.html').body.textContent).toContain('1999');
  });
});

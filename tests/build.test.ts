import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeAll } from 'vitest';
import { parseHTML } from 'linkedom';

function docFor(relativePath: string) {
  const html = readFileSync(
    fileURLToPath(new URL(`../dist/${relativePath}`, import.meta.url)),
    'utf8',
  );
  return parseHTML(html).document;
}

describe('built home page', () => {
  let doc: ReturnType<typeof docFor>;
  beforeAll(() => { doc = docFor('index.html'); });

  it('declares the document language', () => {
    expect(doc.documentElement.getAttribute('lang')).toBe('en');
  });

  it('has exactly one h1', () => {
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
  });

  it('has a non-empty title and meta description', () => {
    expect(doc.querySelector('title')?.textContent?.trim()).toBeTruthy();
    expect(
      doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim(),
    ).toBeTruthy();
  });

  it('offers a skip link as the first focusable element', () => {
    const skip = doc.querySelector('a[href="#main"]');
    expect(skip, 'no skip link found').toBeTruthy();
    expect(skip?.textContent?.toLowerCase()).toContain('skip');
  });

  it('marks up a main landmark matching the skip target', () => {
    const main = doc.querySelector('main');
    expect(main).toBeTruthy();
    expect(main?.getAttribute('id')).toBe('main');
  });

  it('never leaks placeholder contact details into visible copy', () => {
    // mail@example.com is the WordPress theme placeholder and appears 4x on the
    // archived contact page — the real address is CONTACT_EMAIL in astro.config.mjs.
    const text = doc.body.textContent ?? '';
    expect(text).not.toContain('litex.example');
    expect(text).not.toContain('example.com');
  });

  it('ships no render-blocking third-party requests', () => {
    const external = [...doc.querySelectorAll('link[rel="stylesheet"], script[src]')]
      .map((el) => el.getAttribute('href') ?? el.getAttribute('src') ?? '')
      .filter((url) => /^https?:\/\//.test(url));
    expect(external).toEqual([]);
  });
});

describe('built products index', () => {
  let doc: ReturnType<typeof docFor>;
  beforeAll(() => { doc = docFor('products/index.html'); });

  it('renders one card per product, each linking to its detail page', () => {
    const links = [...doc.querySelectorAll('.card a[href^="/products/"]')]
      .map((a) => a.getAttribute('href'));
    expect(links).toContain('/products/conductive-metal-yarn/');
    expect(links).toContain('/products/rfid-textile-tape/');
  });

  it('states availability in words, not by colour alone', () => {
    expect(doc.body.textContent).toContain('IN PRODUCTION');
  });

  it('lists active products before legacy ones', () => {
    const statuses = [...doc.querySelectorAll('[data-status]')]
      .map((n) => n.getAttribute('data-status'));
    const firstLegacy = statuses.indexOf('legacy');
    const lastActive = statuses.lastIndexOf('active');
    if (firstLegacy !== -1) expect(firstLegacy).toBeGreaterThan(lastActive);
  });

  it('never leaks placeholder contact details into visible copy', () => {
    const text = doc.body.textContent ?? '';
    expect(text).not.toContain('litex.example');
    expect(text).not.toContain('example.com');
  });

  it('points canonical URLs at the confirmed domain, trailing slash included', () => {
    // build.format: 'directory' emits /products/ — the trailing slash matters because
    // the legacy wordpress.com URLs carry one, keeping the 301 map a 1:1 mapping.
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://litex.com.tw/products/');
  });
});

describe('built product detail page', () => {
  let doc: ReturnType<typeof docFor>;
  beforeAll(() => { doc = docFor('products/conductive-metal-yarn/index.html'); });

  it('has exactly one h1 naming the product', () => {
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('h1')?.textContent).toContain('Conductive Metal Yarn');
  });

  it('points its canonical at its own URL', () => {
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://litex.com.tw/products/conductive-metal-yarn/');
  });

  it('renders the spec table with scoped column headers', () => {
    const headers = [...doc.querySelectorAll('th[scope="col"]')].map((th) => th.textContent);
    expect(headers.join(' ')).toContain('Resistance (Ω/M)');
  });

  it('shows provenance for the spec data', () => {
    const note = doc.querySelector('[data-source-note]');
    expect(note?.textContent).toContain('2018-non-carbon-electrical-heating-textile.pdf');
  });

  it('offers Copy as CSV with the serialized table attached', () => {
    const button = doc.querySelector('[data-copy-csv]');
    expect(button, 'no copy-as-CSV control found').toBeTruthy();
    const csv = button?.getAttribute('data-csv') ?? '';
    expect(csv.split('\r\n')[0]).toContain('Resistance (Ω/M)');
    expect(csv).toContain("010/N(K)30'*3/1S");
  });

  it('hides the copy control until script enables it, so no-JS sees no dead button', () => {
    expect(doc.querySelector('[data-copy-csv]')?.hasAttribute('hidden')).toBe(true);
  });

  it('emits valid Product JSON-LD naming LiTex as manufacturer', () => {
    const raw = doc.querySelector('script[type="application/ld+json"]')?.textContent ?? '';
    const ld = JSON.parse(raw);
    expect(ld['@type']).toBe('Product');
    expect(ld.name).toBe('Conductive Metal Yarn');
    expect(ld.manufacturer.name).toContain('LiTex');
    expect(ld.url).toBe('https://litex.com.tw/products/conductive-metal-yarn/');
  });

  it('never advertises a price, because pricing is quote-based', () => {
    const raw = doc.querySelector('script[type="application/ld+json"]')?.textContent ?? '';
    expect(raw).not.toContain('price');
  });

  it('links every application it references', () => {
    const links = [...doc.querySelectorAll('a[href^="/applications/"]')];
    expect(links.length).toBeGreaterThan(0);
  });
});

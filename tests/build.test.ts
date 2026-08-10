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

  it('lists both seeded products by name', () => {
    const text = doc.body.textContent ?? '';
    expect(text).toContain('Conductive Metal Yarn');
    expect(text).toContain('RFID Wired Woven Tape');
  });

  it('resolves application references into readable names', () => {
    expect(doc.body.textContent).toContain('Heated apparel & wearables');
  });

  it('shows provenance for every product carrying spec data', () => {
    const notes = [...doc.querySelectorAll('[data-source-note]')];
    expect(notes.length).toBeGreaterThanOrEqual(2);
    for (const note of notes) {
      expect(note.textContent?.trim()).not.toBe('');
    }
  });

  it('claims verification honestly — a caveat appears only where the flag is set', () => {
    // Both seeded spec tables were verified against their rendered source PDFs on
    // 2026-08-11, so no caveat should render. The flag's behaviour is covered by
    // tests/schemas.test.ts; this asserts we are not showing a stale warning.
    expect(doc.querySelector('[data-needs-verification]')).toBeNull();
  });

  it('renders measured values in the monospace class', () => {
    const values = [...doc.querySelectorAll('.value')].map((n) => n.textContent);
    expect(values.join(' ')).toContain('326.2');
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

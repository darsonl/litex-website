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

  it('never leaks the placeholder domain into visible copy', () => {
    expect(doc.body.textContent).not.toContain('litex.example');
  });

  it('ships no render-blocking third-party requests', () => {
    const external = [...doc.querySelectorAll('link[rel="stylesheet"], script[src]')]
      .map((el) => el.getAttribute('href') ?? el.getAttribute('src') ?? '')
      .filter((url) => /^https?:\/\//.test(url));
    expect(external).toEqual([]);
  });
});

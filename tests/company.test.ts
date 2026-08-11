import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { parseHTML } from 'linkedom';

function docFor(relativePath: string) {
  return parseHTML(
    readFileSync(fileURLToPath(new URL(`../dist/${relativePath}`, import.meta.url)), 'utf8'),
  ).document;
}

describe('company — about', () => {
  it('generates the route with a single h1 and its canonical', () => {
    const doc = docFor('company/about/index.html');
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://litex.com.tw/company/about/');
  });

  it('states the founding facts the whole credibility argument rests on', () => {
    const text = docFor('company/about/index.html').body.textContent ?? '';
    expect(text).toContain('1999');
    expect(text).toContain('Hen Hao Trading');
    expect(text).toContain('narrow fabrics');
  });

  // The nameplate photograph is the only evidence anywhere in the archive that the
  // Hen Hao heritage claim is more than a sentence. Naming the second predecessor
  // matters too: it appears in no archived HTML, only in this photograph.
  it('names the predecessor businesses the nameplate photograph shows', () => {
    const text = docFor('company/about/index.html').body.textContent ?? '';
    expect(text).toContain('Taiwan Tulip Ribbon & Braids');
  });

  it('shows premises, plant and people rather than asserting them', () => {
    const figures = docFor('company/about/index.html').querySelectorAll('[data-archive-figure]');
    expect(figures.length, 'fewer than three archive photographs').toBeGreaterThanOrEqual(3);
  });

  it('captions every photograph with where it came from', () => {
    for (const fig of [...docFor('company/about/index.html').querySelectorAll('[data-archive-figure]')]) {
      const caption = fig.querySelector('figcaption')?.textContent ?? '';
      expect(caption, 'a photograph has no caption').toBeTruthy();
      expect(caption, `caption does not name its source: ${caption}`)
        .toContain('2018-company-introduction.pdf');
    }
  });

  it('dates the photographs rather than passing 2018 off as today', () => {
    const note = docFor('company/about/index.html').querySelector('[data-source-note]');
    expect(note?.textContent).toContain('2018');
  });

  it('links the storefront that is still LiTex\'s working inbound channel', () => {
    const hrefs = [...docFor('company/about/index.html').querySelectorAll('main a')]
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('https://litex.en.alibaba.com/');
  });

  // Astro's compressHTML strips the newline between text and a following element,
  // so `since\n<span>1999</span>` ships as `since1999`. Every phrase below spans one
  // of those joins in the source — they are the four places on this page where an
  // element starts a line.
  it('keeps spaces around inline values that start a source line', () => {
    const text = docFor('company/about/index.html').body.textContent ?? '';
    for (const phrase of [
      'and Taiwan Tulip Ribbon & Braids',
      'later, Conductive Metal Yarn',
      'up to 70 cm. See the full comparison',
      'storefront at litex.en.alibaba.com',
    ]) {
      expect(text, `lost the space in "${phrase}"`).toContain(phrase);
    }
  });
});

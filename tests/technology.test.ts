import { describe, it, expect } from 'vitest';
import { docFor } from './helpers/dist';

describe('technology index', () => {
  it('generates the route with a single h1 and its canonical', () => {
    const doc = docFor('technology/index.html');
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://litex.com.tw/technology/');
  });

  it('explains the covering counts that name each grade', () => {
    const text = docFor('technology/index.html').body.textContent ?? '';
    for (const grade of ['1S', '1S1Z', '2S2Z', '4S4Z']) {
      expect(text, `${grade} is not explained`).toContain(grade);
    }
  });

  it('draws the structure rather than photographing it, per spec §5 Tier 1', () => {
    const doc = docFor('technology/index.html');
    const figures = doc.querySelectorAll('[data-yarn-diagram]');
    expect(figures.length, 'no yarn structure diagram').toBeGreaterThanOrEqual(3);
    for (const fig of [...figures]) {
      expect(fig.querySelector('svg'), 'diagram is not an SVG').toBeTruthy();
    }
  });

  it('gives every diagram an accessible name, so it is not silent to a screen reader', () => {
    for (const fig of [...docFor('technology/index.html').querySelectorAll('[data-yarn-diagram]')]) {
      const svg = fig.querySelector('svg');
      expect(svg?.getAttribute('role')).toBe('img');
      const labelled = svg?.getAttribute('aria-labelledby');
      expect(labelled, 'svg has no aria-labelledby').toBeTruthy();
      expect(fig.querySelector(`#${labelled}`)?.textContent?.trim()).toBeTruthy();
    }
  });

  // Verified 2026-08-11 against archive/images/cmy-structure1.jpg, LiTex's own
  // illustration: the 1s ribbon descends left-to-right, 1z is its mirror. Handedness
  // is part of the specification, so a flipped diagram is a wrong spec, not a style bug.
  it('draws S descending left to right and Z ascending, matching LiTex\'s illustration', () => {
    const doc = docFor('technology/index.html');
    const svg = doc.querySelector('[data-yarn-diagram] svg');
    const first = svg?.querySelector('g[data-direction="S"] line');
    expect(first, 'no S-direction stroke found').toBeTruthy();
    const x1 = Number(first?.getAttribute('x1'));
    const y1 = Number(first?.getAttribute('y1'));
    const x2 = Number(first?.getAttribute('x2'));
    const y2 = Number(first?.getAttribute('y2'));
    // In SVG coords y grows downward, so "descending to the right" means the
    // larger-x end has the larger y.
    const descendsRight = (x2 > x1) === (y2 > y1);
    expect(descendsRight, `S stroke ${x1},${y1} → ${x2},${y2} does not descend to the right`)
      .toBe(true);
  });

  // Astro's compressHTML (on by default) strips the newline between text and a
  // following element, so `covering,\n<span>1S1Z</span>` renders as "covering,1S1Z".
  // Inline mono values are everywhere on this site; a missing space reads as a typo
  // in exactly the copy that is meant to look precise.
  it('keeps spaces around inline values that start a source line', () => {
    const text = docFor('technology/index.html').body.textContent ?? '';
    for (const phrase of [
      'single covering, 1S1Z',
      'and 4S4Z is eight',
      '1S through 4S4Z',
      'from about 4.4',
      'PU and FEP',
      'manufacturable. Compared against',
    ]) {
      expect(text, `lost the space in "${phrase}"`).toContain(phrase);
    }
  });

  it('names where the structure data came from', () => {
    const note = docFor('technology/index.html').querySelector('[data-source-note]');
    expect(note?.textContent).toContain('2018-non-carbon-electrical-heating-textile.pdf');
  });

  it('sends a reader wanting the full grade table to the product page', () => {
    const hrefs = [...docFor('technology/index.html').querySelectorAll('main a')]
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/products/conductive-metal-yarn/');
  });

  it('is reachable from the primary navigation', () => {
    const hrefs = [...docFor('index.html').querySelectorAll('nav[aria-label="Primary"] a')]
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/technology/');
  });
});

describe('heating element comparison', () => {
  it('generates the route that the 2018 blog post redirects to', () => {
    const doc = docFor('technology/heating-element-comparison/index.html');
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://litex.com.tw/technology/heating-element-comparison/');
  });

  it('compares all four heating elements', () => {
    const text = docFor('technology/heating-element-comparison/index.html').body.textContent ?? '';
    for (const element of ['Carbon fibre', 'heating film', 'Stainless steel fibre', 'Conductive Metal Yarn']) {
      expect(text, `${element} is missing from the comparison`).toContain(element);
    }
  });

  it('renders as a spec table with scoped headers, not prose', () => {
    const doc = docFor('technology/heating-element-comparison/index.html');
    const headers = [...doc.querySelectorAll('th[scope="col"]')].map((th) => th.textContent);
    expect(headers.join(' ')).toContain('Manufacturing process');
    expect(doc.querySelectorAll('tbody tr')).toHaveLength(4);
  });

  it('offers the comparison as CSV, like every other spec table on the site', () => {
    const button = docFor('technology/heating-element-comparison/index.html')
      .querySelector('[data-copy-csv]');
    expect(button, 'no copy-as-CSV control').toBeTruthy();
    expect(button?.getAttribute('data-csv')).toContain('Carbon fibre');
  });

  it('names its source, because it is a competitive claim', () => {
    const note = docFor('technology/heating-element-comparison/index.html')
      .querySelector('[data-source-note]');
    expect(note?.textContent).toContain('2018-non-carbon-electrical-heating-textile.pdf');
  });

  it('is linked from the technology index', () => {
    const hrefs = [...docFor('technology/index.html').querySelectorAll('main a')]
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/technology/heating-element-comparison/');
  });
});

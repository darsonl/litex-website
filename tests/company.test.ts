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
  // so `since\n<span>1999</span>` ships as `since1999`. Each phrase below spans a
  // place in the source where an element starts a line, guarded by an explicit
  // {' '} marker — this list is illustrative, not a claim that it is exhaustive.
  it('keeps spaces around inline values that start a source line', () => {
    const text = docFor('company/about/index.html').body.textContent ?? '';
    for (const phrase of [
      'and Taiwan Tulip Ribbon & Braids',
      'later, Conductive Metal Yarn',
      'up to 70 cm. See the full comparison',
      'storefront at litex.en.alibaba.com',
      'person is sales@litex.com.tw',
    ]) {
      expect(text, `lost the space in "${phrase}"`).toContain(phrase);
    }
  });
});

describe('company — patents and awards', () => {
  it('generates the route with a single h1 and its canonical', () => {
    const doc = docFor('company/patents-and-awards/index.html');
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://litex.com.tw/company/patents-and-awards/');
  });

  it('cites the utility model in the form the register uses', () => {
    const text = docFor('company/patents-and-awards/index.html').body.textContent ?? '';
    expect(text).toContain('TWM545145');
    expect(text).toContain('Elastic ribbon having extensible electronic device');
    expect(text).toContain('2017-03-20');
  });

  // Taiwan utility models run ten years from filing and the sibling patent lapsed
  // for non-payment. Until LiTex confirms renewal, the page states the record and
  // stops. tests/chrome.test.ts separately bans the string "PATENTED" site-wide.
  it('does not assert a right currently in force', () => {
    const text = docFor('company/patents-and-awards/index.html').body.textContent ?? '';
    expect(text.toLowerCase()).toContain('renewal');
  });

  it('states plainly that the older filings are no longer in force', () => {
    const text = docFor('company/patents-and-awards/index.html').body.textContent ?? '';
    expect(text).toContain('Abandoned 2012-04-23');
    expect(text).toContain('Lapsed 2017-10-01');
  });

  it('renders the lapsed filings as a table, not prose', () => {
    const doc = docFor('company/patents-and-awards/index.html');
    const headers = [...doc.querySelectorAll('th[scope="col"]')].map((th) => th.textContent);
    expect(headers.join(' ')).toContain('Status');
    expect(doc.querySelectorAll('tbody tr')).toHaveLength(4);
  });

  it('names the register it was checked against, and when', () => {
    const note = docFor('company/patents-and-awards/index.html')
      .querySelector('[data-source-note]');
    expect(note?.textContent).toContain('2026-08-11');
  });

  // SpecTable renders its own [data-source-note]; the page's hand-authored correction
  // note is a second, distinct note and must not collide with that selector.
  it('states the malformed-number correction in its own page note', () => {
    const note = docFor('company/patents-and-awards/index.html')
      .querySelector('[data-page-note]');
    expect(note).toBeTruthy();
    expect(note?.textContent).toContain('TWM545145U');
    expect(note?.textContent).toContain('malformed');
  });

  it('discloses that older filings may be in an individual\'s name, not the company\'s', () => {
    const text = docFor('company/patents-and-awards/index.html').body.textContent ?? '';
    expect(text).toContain('Fu-Biau Hsu');
    expect(text).toContain('許富標');
  });

  it('transcribes the TAITRONICS award rather than leaving it in the photograph', () => {
    const text = docFor('company/patents-and-awards/index.html').body.textContent ?? '';
    for (const fact of [
      'TAITRONICS',
      'The Quality Award',
      'Non-Carbon Fiber Electrical Heating Textile',
      'September 2014',
    ]) {
      expect(text, `the award transcription is missing ${fact}`).toContain(fact);
    }
  });

  it('shows the award certificate itself', () => {
    const figures = docFor('company/patents-and-awards/index.html')
      .querySelectorAll('[data-archive-figure]');
    expect(figures.length).toBe(1);
  });

  // US 12/787,378 was abandoned, so the USPTO cover page in the catalog cannot be
  // attributed to it, and it carries no number of its own. Publishing it on this
  // page would assert a US grant LiTex does not hold.
  it('never publishes the unattributable US patent certificate', () => {
    const html = readFileSync(
      fileURLToPath(new URL('../dist/company/patents-and-awards/index.html', import.meta.url)),
      'utf8',
    );
    expect(html).not.toContain('us-patent');
    expect(html).not.toContain('Kappos');
  });
});

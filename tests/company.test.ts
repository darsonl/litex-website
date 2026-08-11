import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { parseHTML } from 'linkedom';

function docFor(relativePath: string) {
  return parseHTML(
    readFileSync(fileURLToPath(new URL(`../dist/${relativePath}`, import.meta.url)), 'utf8'),
  ).document;
}

const DIST = fileURLToPath(new URL('../dist', import.meta.url));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/** Maps an internal href to the file Astro's build.format:'directory' emits for it. */
function routeFile(href: string): string {
  const clean = href.replace(/^\//, '').replace(/\/$/, '');
  return clean === '' ? 'index.html' : `${clean}/index.html`;
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
  // Hen Hao claim is more than a sentence. Naming the third company matters too: it
  // appears in no archived HTML, only in this photograph.
  it('names the group companies the nameplate photograph shows', () => {
    const text = docFor('company/about/index.html').body.textContent ?? '';
    expect(text).toContain('Taiwan Tulip Ribbon & Braids');
  });

  // Confirmed by LiTex 2026-08-11. Hen Hao is the current parent, not a predecessor —
  // an earlier draft called these "the businesses that came before", which was wrong.
  // The relationship is load-bearing: SGS report CE/2013/52203 is issued in the
  // parent's name, so a buyer who meets that name first on a certificate they
  // requested has found a discrepancy this page exists to pre-empt.
  it('states the parent-company relationship rather than implying separation', () => {
    const text = docFor('company/about/index.html').body.textContent ?? '';
    // "spinoff" alone reads as separation, so the founding sentence has to carry the
    // present tense too — the two framings must not be left for a reader to reconcile.
    expect(text).toContain('remains its subsidiary today');
    expect(text).toContain('share these Taipei premises');
    expect(text, 'the page still frames Hen Hao as a predecessor').not.toContain('came before:');
  });

  // Only the LiTex/Hen Hao relationship is confirmed. Taiwan Tulip Ribbon & Braids is
  // known solely from a nameplate at the shared address, which establishes co-location
  // and nothing else — a draft of this page claimed it was "in the same group", which
  // was an invented corporate fact about a third party.
  it('claims no corporate relationship it cannot support', () => {
    const text = docFor('company/about/index.html').body.textContent ?? '';
    expect(text).toContain('at the same address');
    expect(text, 'group membership asserted for a company nobody confirmed').not.toContain(
      'in the same group',
    );
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
      'alongside Taiwan Tulip Ribbon & Braids',
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

  // src/data/patents.ts comments that UTILITY_MODEL.holder is "an exact match" for
  // COMPANY.legalNameZh — that claim is what makes the attribution to LiTex certain,
  // so it must actually hold rather than merely be asserted in a comment.
  it('attributes the utility model to LiTex\'s exact legal name in Chinese', async () => {
    const { UTILITY_MODEL } = await import('../src/data/patents');
    const { COMPANY } = await import('../src/lib/company');
    expect(UTILITY_MODEL.holder).toBe(COMPANY.legalNameZh);
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

describe('company — certifications', () => {
  it('generates the route with a single h1 and its canonical', () => {
    const doc = docFor('company/certifications/index.html');
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://litex.com.tw/company/certifications/');
  });

  it('covers all three claims the credibility bar makes', () => {
    const text = docFor('company/certifications/index.html').body.textContent ?? '';
    for (const claim of ['REACH', 'RoHS', 'SGS']) {
      expect(text, `${claim} is not accounted for`).toContain(claim);
    }
  });

  // The distinction the whole page turns on: a claim in our own catalog is not a
  // certificate. A buyer must be able to see which is which at a glance.
  it('says for every claim whether a document is published behind it', () => {
    const doc = docFor('company/certifications/index.html');
    const headers = [...doc.querySelectorAll('th[scope="col"]')].map((th) => th.textContent);
    expect(headers.join(' ')).toContain('Document published here');
    expect(doc.querySelectorAll('tbody tr')).toHaveLength(3);
  });

  it('names the SGS report number and its year', () => {
    const text = docFor('company/certifications/index.html').body.textContent ?? '';
    expect(text).toContain('CE/2013/52203');
    expect(text).toContain('2013');
  });

  it('admits what the report photograph does not show', () => {
    const text = docFor('company/certifications/index.html').body.textContent ?? '';
    expect(text.toLowerCase()).toContain('not legible');
  });

  it('shows the report cover, captioned to its source', () => {
    const figures = docFor('company/certifications/index.html')
      .querySelectorAll('[data-archive-figure]');
    expect(figures.length).toBe(1);
    expect(figures[0].querySelector('figcaption')?.textContent)
      .toContain('2018-company-introduction.pdf');
  });

  it('gives a buyer a route to the actual documents', () => {
    const hrefs = [...docFor('company/certifications/index.html').querySelectorAll('main a')]
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('mailto:sales@litex.com.tw');
  });

  // A REACH or RoHS badge graphic asserts a conformity assessment that no document
  // on this site supports. Words can be qualified; a badge cannot.
  it('displays no compliance badge imagery', () => {
    const doc = docFor('company/certifications/index.html');
    for (const img of [...doc.querySelectorAll('img')]) {
      const alt = (img.getAttribute('alt') ?? '').toLowerCase();
      expect(alt, 'a REACH/RoHS badge is being rendered').not.toMatch(/reach|rohs/);
    }
  });

  // SpecTable renders its own [data-source-note]; the page's hand-authored page note
  // is a second, distinct note (Task 4 established this pattern for patents-and-awards).
  it('states in its own page note that the claims are LiTex\'s own, dated 2018 or earlier', () => {
    const note = docFor('company/certifications/index.html').querySelector('[data-page-note]');
    expect(note).toBeTruthy();
    expect(note?.textContent).toContain('LiTex\'s own');
    expect(note?.textContent).toContain('2018 or earlier');
  });

  // The whole point of naming the addressee. A buyer who requests CE/2013/52203 and
  // meets an unfamiliar company name on the document has found a discrepancy the site
  // manufactured by staying quiet. Confirmed by LiTex 2026-08-11 — it is deliberately
  // NOT read off the cover photograph, where the addressee block stays illegible.
  it('warns that the SGS report is issued in the parent company\'s name', () => {
    const text = docFor('company/certifications/index.html').body.textContent ?? '';
    expect(text).toContain('Hen Hao Trading');
    expect(text.toLowerCase()).toContain('parent company');
  });

  it('keeps the report\'s addressee identical to the declared parent company', async () => {
    const { SGS_REPORT } = await import('../src/data/certifications');
    const { COMPANY } = await import('../src/lib/company');
    expect(SGS_REPORT.issuedTo).toBe(COMPANY.parentCompany);
  });
});

describe('company — hub', () => {
  it('generates the route with a single h1 and its canonical', () => {
    const doc = docFor('company/index.html');
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://litex.com.tw/company/');
  });

  it('links all three company pages', () => {
    const hrefs = [...docFor('company/index.html').querySelectorAll('main a')]
      .map((a) => a.getAttribute('href'));
    for (const href of [
      '/company/about/', '/company/patents-and-awards/', '/company/certifications/',
    ]) {
      expect(hrefs, `hub does not link ${href}`).toContain(href);
    }
  });

  // The hub's job: every claim the footer makes site-wide becomes a link to the page
  // that substantiates it.
  it('turns each credibility claim into a link to its evidence', async () => {
    const { CREDIBILITY, CREDIBILITY_EVIDENCE } = await import('../src/lib/company');
    const doc = docFor('company/index.html');
    const links = [...doc.querySelectorAll('[data-credibility-evidence] a')];
    expect(links).toHaveLength(CREDIBILITY.length);
    for (const claim of CREDIBILITY) {
      const link = links.find((a) => (a.textContent ?? '').includes(claim));
      expect(link, `no evidence link for "${claim}"`).toBeTruthy();
      expect(link?.getAttribute('href')).toBe(CREDIBILITY_EVIDENCE[claim]);
    }
  });

  it('never lets a credibility claim exist without an evidence route', async () => {
    const { CREDIBILITY, CREDIBILITY_EVIDENCE } = await import('../src/lib/company');
    expect(Object.keys(CREDIBILITY_EVIDENCE).sort()).toEqual([...CREDIBILITY].sort());
  });

  it('is reachable from the primary navigation', () => {
    const hrefs = [...docFor('index.html').querySelectorAll('nav[aria-label="Primary"] a')]
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/company/');
  });

  it('gives every company page a way back up', () => {
    for (const slug of ['about', 'patents-and-awards', 'certifications']) {
      const crumb = docFor(`company/${slug}/index.html`).querySelector('.breadcrumb a');
      expect(crumb?.getAttribute('href'), `${slug} has no breadcrumb`).toBe('/company/');
    }
  });

  // Plan 8 adds a whole-site link checker. Until then this covers the section that
  // just gained the most internal cross-linking in one commit.
  it('links nothing from a /company/ page that the build did not generate', () => {
    const broken: string[] = [];
    for (const file of walk(join(DIST, 'company')).filter((f) => f.endsWith('.html'))) {
      const doc = parseHTML(readFileSync(file, 'utf8')).document;
      for (const a of [...doc.querySelectorAll('a')]) {
        const href = a.getAttribute('href') ?? '';
        if (!href.startsWith('/')) continue;
        if (!existsSync(join(DIST, routeFile(href)))) broken.push(`${file} → ${href}`);
      }
    }
    expect(broken, `broken links:\n${broken.join('\n')}`).toEqual([]);
  });
});

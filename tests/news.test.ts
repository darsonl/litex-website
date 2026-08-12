import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { DIST, allHtmlFiles, docFor, routeFile } from './helpers/dist';

describe('/news/ index', () => {
  const doc = docFor('news/index.html');

  it('lists all seven posts, newest first', () => {
    const links = [...doc.querySelectorAll('[data-news-list] a[href^="/news/"]')]
      .map((a) => a.getAttribute('href'));
    expect(links).toEqual([
      '/news/tokyo-wearable-expo-2022/',
      '/news/new-braided-self-curling-tube/',
      '/news/dusseldorf-wire-show/',
      '/news/featured-on-techtextil-blog/',
      '/news/copper-nickel-1s1z/',
      '/news/techtextil-frankfurt/',
      '/news/wearable-expo/',
    ]);
  });

  it('groups the posts under their publication year', () => {
    const years = [...doc.querySelectorAll('[data-news-year]')].map((h) => h.textContent.trim());
    expect(years).toEqual(['2022', '2020', '2018', '2017']);
  });

  // Spec §0 problem 5: a feed that stopped in 2022 reads as a dormant company. Saying
  // outright that this is an archive is what stops a four-year gap looking like neglect.
  it('frames the section as an archive and names its real date range', () => {
    const intro = doc.querySelector('[data-archive-note]')?.textContent ?? '';
    expect(intro).toContain('archive');
    expect(intro).toContain('2017');
    expect(intro).toContain('2022');
  });

  it('renders each date as prose, machine-readable in a time element', () => {
    const first = doc.querySelector('[data-news-list] li time');
    expect(first?.getAttribute('datetime')).toBe('2022-01-21');
    expect(first?.textContent?.trim()).toBe('January 21, 2022');
  });

  it('gives every post a summary, so the index is scannable', () => {
    const summaries = [...doc.querySelectorAll('[data-news-list] li [data-summary]')];
    expect(summaries).toHaveLength(7);
    for (const s of summaries) expect(s.textContent!.trim().length).toBeGreaterThan(20);
  });
});

const SLUGS = [
  'techtextil-frankfurt', 'wearable-expo', 'copper-nickel-1s1z',
  'featured-on-techtextil-blog', 'dusseldorf-wire-show',
  'new-braided-self-curling-tube', 'tokyo-wearable-expo-2022',
];

describe('news posts', () => {
  it('builds a page at every slug the redirect map promises', () => {
    for (const slug of SLUGS) {
      expect(existsSync(join(DIST, routeFile(`/news/${slug}/`))), `/news/${slug}/ missing`).toBe(true);
    }
  });

  it('dates every post in a machine-readable time element', () => {
    for (const slug of SLUGS) {
      const time = docFor(routeFile(`/news/${slug}/`)).querySelector('article time');
      expect(time?.getAttribute('datetime'), `${slug} has no dated time element`).toMatch(
        /^\d{4}-\d{2}-\d{2}$/,
      );
    }
  });

  // Every post is a republication. Saying where it came from is what lets a reader tell a
  // 2017 announcement from a claim the company is making today.
  it('states the provenance of every post', () => {
    for (const slug of SLUGS) {
      const note = docFor(routeFile(`/news/${slug}/`)).querySelector('[data-source-note]');
      expect(note?.textContent?.trim().length, `${slug} has no source note`).toBeGreaterThan(20);
    }
  });

  it('never claims a republished post is verbatim', () => {
    for (const slug of SLUGS) {
      const html = docFor(routeFile(`/news/${slug}/`)).body.textContent ?? '';
      expect(html.toLowerCase(), `${slug} claims to be verbatim`).not.toContain('verbatim');
    }
  });

  it('links a post to the product it announces', () => {
    const doc = docFor(routeFile('/news/copper-nickel-1s1z/'));
    const hrefs = [...doc.querySelectorAll('[data-related] a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/products/conductive-metal-yarn/');
  });

  it('offers a way back to the index from every post', () => {
    for (const slug of SLUGS) {
      const doc = docFor(routeFile(`/news/${slug}/`));
      const hrefs = [...doc.querySelectorAll('a')].map((a) => a.getAttribute('href'));
      expect(hrefs, `${slug} is a dead end`).toContain('/news/');
    }
  });

  it('carries the one outbound link that still resolves', () => {
    const hrefs = [...docFor(routeFile('/news/dusseldorf-wire-show/')).querySelectorAll('a')]
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('https://www.wire.de/');
  });

  // techtextil-blog.com now serves a certificate for *.messefrankfurt.com, so an <a href>
  // pointing at it would send a buyer straight to a TLS warning — that's the actual risk,
  // not the domain appearing as plain text (the featured-on-techtextil-blog source note
  // names the exact dead path on purpose, so a reader can find it again). Checked across
  // the whole build, not just the one post, because the tempting place to "helpfully"
  // restore the link is the index or a different post's source note.
  it('never links to the dead TechTextil blog anywhere in the build', () => {
    const offenders = allHtmlFiles().filter((file) =>
      [...docFor(relative(DIST, file)).querySelectorAll('a')].some((a) =>
        a.getAttribute('href')?.includes('techtextil-blog.com'),
      ),
    );
    expect(offenders, `dead link restored in:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('gives every post a body: prose, a figure, or both', () => {
    for (const slug of SLUGS) {
      const doc = docFor(routeFile(`/news/${slug}/`));
      const hasProse = (doc.querySelector('[data-prose]')?.textContent ?? '').trim().length > 0;
      const hasFigure = doc.querySelector('[data-archive-figure]') !== null;
      expect(hasProse || hasFigure, `${slug} renders an empty post`).toBe(true);
    }
  });

  it('captions the one photograph, and sources it to LiTex', () => {
    const doc = docFor(routeFile('/news/new-braided-self-curling-tube/'));
    const figure = doc.querySelector('[data-archive-figure]');
    expect(figure, 'the May 2020 post lost its photograph').not.toBeNull();
    expect(figure!.querySelector('figcaption')?.textContent ?? '').toContain('LiTex');
  });
});

import { describe, it, expect } from 'vitest';
import { docFor } from './helpers/dist';

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

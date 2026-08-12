import { describe, it, expect } from 'vitest';
import { displayDate, isoDate, publishedYear, byPublishedDesc } from '../src/lib/dates';

describe('displayDate', () => {
  it('formats a stored timestamp as a long date', () => {
    expect(displayDate('2017-02-23T14:47:55+08:00')).toBe('February 23, 2017');
    expect(displayDate('2022-01-21T17:24:08+08:00')).toBe('January 21, 2022');
  });

  it('does not pad the day, so it reads as prose rather than as a value', () => {
    expect(displayDate('2020-05-01T12:02:57+08:00')).toBe('May 1, 2020');
  });

  // The trap this module exists to avoid: new Date('2020-05-20') is midnight UTC, so
  // toLocaleDateString on a build machine west of Greenwich renders it as May 19. The
  // stored calendar date is what LiTex published; it must survive any build timezone.
  it('formats the stored calendar date rather than an instant in the runner timezone', () => {
    expect(displayDate('2020-05-20T12:02:57+08:00')).toBe('May 20, 2020');
    expect(displayDate('2018-02-26T15:15:53+08:00')).toBe('February 26, 2018');
  });

  it('refuses a value it cannot read rather than rendering something wrong', () => {
    expect(() => displayDate('26 February 2018')).toThrow(/ISO 8601/);
  });
});

describe('isoDate and publishedYear', () => {
  it('yields the machine-readable date for a <time datetime> attribute', () => {
    expect(isoDate('2017-06-26T13:39:06+08:00')).toBe('2017-06-26');
  });

  it('yields the calendar year for grouping', () => {
    expect(publishedYear('2017-06-26T13:39:06+08:00')).toBe(2017);
  });
});

describe('byPublishedDesc', () => {
  it('orders newest first', () => {
    const sorted = ['2017-02-23T14:47:55+08:00', '2022-01-21T17:24:08+08:00']
      .sort(byPublishedDesc);
    expect(sorted[0]).toBe('2022-01-21T17:24:08+08:00');
  });

  // Three of the seven posts share 2017-02-23 and differ only by time. Sorting on the
  // date alone would leave their order down to whatever getCollection happened to return.
  it('separates posts published on the same day by their time', () => {
    const sorted = [
      '2017-02-23T14:38:59+08:00',
      '2017-02-23T14:54:11+08:00',
      '2017-02-23T14:47:55+08:00',
    ].sort(byPublishedDesc);
    expect(sorted).toEqual([
      '2017-02-23T14:54:11+08:00',
      '2017-02-23T14:47:55+08:00',
      '2017-02-23T14:38:59+08:00',
    ]);
  });
});

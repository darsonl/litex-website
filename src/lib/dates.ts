/**
 * News timestamps are stored as ISO 8601 with their original +08:00 offset, exactly as
 * the WordPress export recorded them.
 *
 * Display deliberately never constructs a Date. `new Date('2020-05-20')` is midnight
 * UTC, so formatting it on a machine west of Greenwich renders the previous day — a
 * published date silently off by one, on a site whose entire argument is that its
 * figures can be trusted. Reading the calendar fields out of the string cannot do that.
 *
 * Ordering is the one place a Date is correct: comparing instants handles offsets
 * properly, and every stored value carries one.
 */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const STORED = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;

function fields(publishedAt: string): { year: number; month: number; day: number } {
  const match = STORED.exec(publishedAt);
  if (!match) {
    throw new Error(
      `"${publishedAt}" is not a stored publication timestamp. ` +
        'Expected ISO 8601 with an offset, e.g. 2017-02-23T14:47:55+08:00.',
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  // Validate the date is a real calendar date by checking if Date.UTC round-trips.
  // JavaScript's Date silently rolls over invalid dates (e.g. Feb 31 → Mar 3), so we
  // detect that by comparing parsed fields against what the date reports back.
  const utcTime = Date.UTC(year, month - 1, day);
  const checkDate = new Date(utcTime);

  if (
    checkDate.getUTCFullYear() !== year ||
    checkDate.getUTCMonth() !== month - 1 ||
    checkDate.getUTCDate() !== day
  ) {
    throw new Error(`"${publishedAt}" is not a valid calendar date.`);
  }

  return { year, month, day };
}

export function displayDate(publishedAt: string): string {
  const { year, month, day } = fields(publishedAt);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

export function isoDate(publishedAt: string): string {
  const { year, month, day } = fields(publishedAt);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function publishedYear(publishedAt: string): number {
  return fields(publishedAt).year;
}

/** Newest first. Comparing instants is correct across offsets; formatting is not. */
export function byPublishedDesc(a: string, b: string): number {
  return Date.parse(b) - Date.parse(a);
}

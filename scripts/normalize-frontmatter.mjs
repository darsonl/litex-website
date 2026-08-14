/**
 * Quote the `publishedAt` timestamp in src/content/news/*.md, in place.
 *
 * Run: node scripts/normalize-frontmatter.mjs   (npm's "build" runs it before `astro
 * build`, and "predev" before `astro dev`, same as the catalog and CMS syncs.)
 *
 * WHY THIS EXISTS
 *
 * Sveltia CMS writes the timestamp unquoted:
 *
 *     publishedAt: 2026-08-14T10:30:00+08:00
 *
 * YAML 1.1 auto-types that scalar as a timestamp, so Astro's content layer hands the
 * schema a `Date` — and `src/schemas/news.ts` requires a STRING, because a `Date` has
 * already thrown away the `+08:00` offset. The build fails with
 * `publishedAt: Expected type "string", received "object"`, which is exactly what took
 * production down on 2026-08-14 the first time anyone saved a post through the CMS.
 *
 * ⚠ The fix is to quote the value, NOT to loosen the schema. Accepting a `Date` would
 * mean reconstructing the offset from an instant, and reconstructing +08:00 is only
 * correct as long as every post is Taiwanese — a silent wrong answer the day one is not.
 * src/lib/dates.ts exists because a timezone shifting a published date by a day is a real
 * defect this site already fixed once.
 *
 * WHY IT RUNS AT BUILD TIME rather than being a one-off cleanup: the CMS writes to the
 * repository directly and will keep producing unquoted values for as long as its
 * serializer does. Running here means a build never fails for this reason, and because
 * the rewrite is in place and idempotent, the corrected file is picked up by whoever next
 * commits. It touches only this one key, only when the value is an unquoted ISO timestamp
 * with an offset — anything else is left exactly as written.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const NEWS = fileURLToPath(new URL('../src/content/news', import.meta.url));

/**
 * `publishedAt:` followed by an unquoted ISO-8601 timestamp carrying an offset, anchored
 * to the start of a line so it only ever matches a top-level front-matter key. The offset
 * is required: a value without one is a different problem and should fail the schema
 * loudly rather than be quietly quoted into looking correct.
 */
const UNQUOTED = /^(publishedAt:[ \t]*)(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2})[ \t]*$/gm;

let fixed = 0;

for (const file of readdirSync(NEWS).filter((f) => f.endsWith('.md'))) {
  const path = `${NEWS}/${file}`;
  const before = readFileSync(path, 'utf8');
  const after = before.replace(UNQUOTED, (_m, key, stamp) => `${key}'${stamp}'`);

  if (after !== before) {
    writeFileSync(path, after);
    console.log(`[normalize-frontmatter] quoted publishedAt in ${file}`);
    fixed += 1;
  }
}

console.log(
  fixed === 0
    ? '[normalize-frontmatter] every publishedAt already quoted'
    : `[normalize-frontmatter] quoted ${fixed} timestamp(s)`,
);

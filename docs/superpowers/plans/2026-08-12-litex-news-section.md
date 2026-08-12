# LiTex News Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish `/news/` as a dated, honestly-framed archive of the seven announcements worth keeping from LiTex's old WordPress blog, at the exact slugs spec §3's redirect map promises.

**Architecture:** A fourth content collection (`news`) holding seven Markdown entries, rendered by an index page that groups by year and a `[slug]` page that carries each post's original publication date and provenance. Post text is LiTex's own words, reproduced without expansion. Dates are stored as quoted ISO-8601 timestamps with their original `+08:00` offset and formatted by string manipulation — never by constructing a `Date` — so a build machine's timezone cannot shift a published date. One photograph ships: LiTex's own macro of the braided self-curling tube, extracted into a third provenance group.

**Tech Stack:** Astro 7.2.0 · `astro/zod` 4.4.3 · Vitest 4.1.10 · linkedom 0.18.13 · sharp 0.35.3 · pymupdf (not needed this plan — the one image is a straight copy).

## Global Constraints

- **Astro is 7.2.0.** `z` comes from `astro/zod`, `glob` from `astro/loaders`, `defineCollection`/`reference`/`getCollection`/`render` from `astro:content`. Schemas are factories taking `reference` (and `image`) as parameters so Vitest can import them — `astro:content` is a virtual module Vitest cannot resolve.
- **A broken `reference()` does not fail the Astro build** — it logs, exits 0 and renders blank. Resolve every reference through `mustResolve()` in `src/lib/references.ts`. Schema `superRefine` violations *do* fail the build (exit 127).
- **`compressHTML` is on by default** and strips the newline between text and a following element. Write `{' '}` explicitly where a space must survive. Detect with `grep -oE '[a-zA-Z,;:.]<(span|a|strong|em)\b'` over `dist/**/*.html`.
- **Never restore `PATENTED` or `1M545145`** anywhere. `tests/chrome.test.ts` bans both site-wide.
- **No `example.com` string may reach any rendered page.** A build test enforces it.
- **Add a route to `NAV` only after the page exists** — `tests/chrome.test.ts` fails if a chrome link has no built page behind it.
- **Do not add a fourth inline contact `<address>`** — use `src/components/ContactBlock.astro`.
- Monospace (`.value`) is reserved for values that have units. Dates are **not** `.value`.
- Every image on a Tier 3 page must trace to a provenance entry with `aiGenerated: false`.

---

## Decisions taken before this plan was written

These were settled with the human on 2026-08-12 after reading all ten archived posts. **Do not re-litigate them; do not "improve" them during implementation.**

| # | Decision | Why |
|---|---|---|
| 1 | **No third-party event imagery is republished.** | Six of the seven posts' only images are trade-show organizers' marks — Messe Frankfurt's Techtextil key visual (`keyvisual-968-113.jpg`), the Wearable Expo logo (`wea_17_logo.png`, `wea_en_22_img_mainlog01.png`), Messe Düsseldorf's mark (`wire-dusseldorf.jpg`) and a screenshot of a third-party blog (`capture.jpg`). LiTex's granted usage rights cover **its own catalog photography**, not event organizers' trademarks. `/news/` therefore ships exactly one photograph. |
| 2 | **`test-post-blah` stays dead — seven posts, not eight.** | Its title is *"LiTex Attending Wearable Expo"* and its body is real, so the junk is the slug rather than the content. But it pre-announces the very expo that `wearable-expo` (2017-02-23) thanks visitors for, so nothing of substance is lost. Spec §3 sentences the URL to **410 Gone**; that holds. |
| 3 | **The TechTextil blog article is not linked.** | `techtextil-blog.com` now serves a certificate for `*.messefrankfurt.com`, so the 2017 link throws a TLS warning in the browser — worse than no link. A Wayback snapshot (2022-05-19, HTTP 200) exists and is recorded in the post's `sourceNote` for a future session, but is not linked because its contents could not be verified. |
| 4 | **Titles are normalized; two typos are corrected; nothing claims to be verbatim.** | Every archived title contains **U+00A0** (WordPress widow-prevention) — normalize to a normal space. Curly apostrophes (**U+2019**) are correct typography and are preserved. The `featured-on-techtextil-blog` body has two genuine errors (*"Its been"*, *"It was pleasure"*) which are corrected and recorded in that post's `sourceNote`. **No page anywhere claims a quotation is verbatim** — that removes the claim Plan 5's review caught drifting, rather than trying to keep it true. |
| 5 | **`/news/` is framed as an archive, not a live feed.** | Spec §0 problem 5 is *"News stalled at 2022 — signals a dormant company."* Publishing a stale feed unchanged reproduces the problem the redesign exists to fix. The index states the real date range and says the section is an archive, so a 2017 post reading *"we will soon roll out (around April)"* cannot be mistaken for a current claim. The range is **computed from the entries**, so it cannot drift. |

---

## Source material — the seven posts, transcribed

Extracted from `archive/pages/news-*.html` with linkedom on 2026-08-12 and dumped with non-ASCII escaped, so the characters below are exact. ` ` appears in six of seven titles and **must not survive transcription**.

| Slug | Original title (raw) | Timestamp | Body |
|---|---|---|---|
| `techtextil-frankfurt` | `LiTex Attending TechTextil at Frankfurt Germany!` | `2017-02-23T14:47:55+08:00` | 1 paragraph |
| `wearable-expo` | `A Rewarding Experience at the Wearable Expo` | `2017-02-23T14:38:59+08:00` | 1 paragraph, contains `sales@litex.com.tw` |
| `copper-nickel-1s1z` | `Copper Nickel 1s1z` | `2017-02-23T14:54:11+08:00` | 1 paragraph |
| `featured-on-techtextil-blog` | `Featured on TechTextil Blog!` | `2017-06-26T13:39:06+08:00` | 2 paragraphs, 2 typos corrected |
| `dusseldorf-wire-show` | `Dusseldorf Wire Show` | `2018-02-26T15:15:53+08:00` | 1 paragraph, links `https://www.wire.de/` |
| `new-braided-self-curling-tube` | `New Braided Self-curling Tube Item!` | `2020-05-20T12:02:57+08:00` | **no text at all** — an image and a product link |
| `tokyo-wearable-expo-2022` | `Tokyo Wearable Expo 2022` | `2022-01-21T17:24:08+08:00` | 1 short paragraph |

Three posts share the date **2017-02-23** and differ only by time (14:38, 14:47, 14:54). Sorting on the date alone is therefore ambiguous — this is why the full timestamp is stored.

`https://www.wire.de/` was verified live on 2026-08-12 (Messe Düsseldorf, promoting wire 2026).

**The braided-tube photograph** (`archive/images/img_4818.jpg`, 3024×3024, 1.28 MB) was viewed on 2026-08-12: a macro of black braided sleeving filling the frame against a pale ground, showing the herringbone braid and the self-curling overlap seam. It is LiTex's own product photography and is genuinely better than the product page's hero. Measured re-encodes (sharp, q82 / webp q80 / avif q50):

```
 1400px   jpg 193KB   webp 171KB   avif  81KB
 1200px   jpg 151KB   webp 137KB   avif  65KB
  800px   jpg  75KB   webp  71KB   avif  36KB
  400px   jpg  21KB   webp  21KB   avif  11KB
```

Every size clears the 300 KB per-image budget in `tests/imagery.test.ts`, so the existing `MAX_EDGE = 1400` and `ArchiveFigure size="full"` are used unchanged. **Do not add a new `ArchiveFigure` size for this image** — it was considered and the measurement removed the reason.

---

## File Structure

**Created**

| File | Responsibility |
|---|---|
| `tests/helpers/dist.ts` | The one copy of `walk` / `allHtmlFiles` / `docFor` / `routeFile`. Three test files need them; today two hold verbatim copies. |
| `src/lib/dates.ts` | Timezone-safe display and ordering of stored timestamps. No Astro imports, unit-testable. |
| `src/schemas/news.ts` | `newsSchema({ reference, image })` factory. |
| `src/content/news/*.md` | The seven posts. Front matter is data; the body is LiTex's prose. |
| `src/pages/news/index.astro` | Archive index, grouped by year, with the computed date range. |
| `src/pages/news/[slug].astro` | One post. Date, prose, optional figure, related products, provenance. |
| `src/assets/news/new-braided-self-curling-tube.jpg` | Generated by the extraction script. Not hand-placed. |
| `src/assets/news/provenance.json` | Generated. |
| `tests/news.test.ts` | Everything asserted against `dist/`. |

**Modified**

| File | Change |
|---|---|
| `src/content.config.ts` | Register the `news` collection. |
| `src/lib/nav.ts` | Add `/news/` — **after** the page builds. |
| `src/lib/jsonld.ts` | Add `newsJsonLd()` beside `productJsonLd()`. |
| `scripts/extract-images.mjs` | Add `'news'` to `GROUPS`; add one `SOURCES` entry. |
| `tests/provenance.test.ts` | Add `'news'` to `GROUPS` and `EXPECTED`. |
| `tests/imagery.test.ts` | Add `'news'` to `allProvenance()` and to `TIER_3`. |
| `tests/chrome.test.ts`, `tests/company.test.ts` | Import the shared helpers instead of redeclaring them. |
| `tests/schemas.test.ts` | Unit tests for `newsSchema`. |
| `tests/jsonld.test.ts` | Unit tests for `newsJsonLd`. |
| `HANDOFF.md` | Rewrite for session 8. |

**Deliberately not built:** an RSS feed (no subscriber and no publishing cadence — YAGNI, and spec §7 item 14 says the feed is stale), tag or category pages (seven posts), pagination, and any "related posts" widget.

---

### Task 1: Shared dist test helpers

Plan 5's review recorded that `tests/company.test.ts` duplicates `walk()` and `routeFile()` verbatim from `tests/chrome.test.ts`. `tests/news.test.ts` would be the third copy. Extract first, so the new file consumes the helper rather than adding to the problem.

**Files:**
- Create: `tests/helpers/dist.ts`
- Modify: `tests/chrome.test.ts` (remove its local `walk`, `docFor`, `routeFile`), `tests/company.test.ts` (remove its local copies)
- Test: the existing suite is the test — it must stay green with no assertion changed.

**Interfaces:**
- Consumes: nothing.
- Produces: `DIST: string`, `walk(dir: string): string[]`, `allHtmlFiles(): string[]`, `docFor(relativePath: string): Document`, `routeFile(href: string): string`.

- [ ] **Step 1: Write the helper module**

```ts
// tests/helpers/dist.ts
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';

/** The built site. Every assertion in this suite reads the real build output. */
export const DIST = fileURLToPath(new URL('../../dist', import.meta.url));

export function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

export function allHtmlFiles(): string[] {
  return walk(DIST).filter((f) => f.endsWith('.html'));
}

export function docFor(relativePath: string) {
  return parseHTML(readFileSync(join(DIST, relativePath), 'utf8')).document;
}

/** Maps an internal href to the file Astro's build.format:'directory' emits for it. */
export function routeFile(href: string): string {
  const clean = href.replace(/^\//, '').replace(/\/$/, '');
  return clean === '' ? 'index.html' : `${clean}/index.html`;
}
```

- [ ] **Step 2: Confirm the suite is green before touching the callers**

Run: `npm run build && npm test`
Expected: PASS — 230 tests / 16 files. This is the baseline the refactor must preserve exactly.

- [ ] **Step 3: Point `tests/chrome.test.ts` at the helper**

Delete its local `walk`, `docFor` and `routeFile` declarations and the now-unused `readdirSync`/`statSync`/`join`/`fileURLToPath`/`parseHTML` imports it kept only for them. Keep `readFileSync` and `existsSync` — chrome.test.ts still reads files directly. Replace the header with:

```ts
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { parseHTML } from 'linkedom';
import { DIST, allHtmlFiles, docFor, routeFile } from './helpers/dist';

const htmlFiles = allHtmlFiles();
```

Leave every `it(...)` block byte-identical. If a test needed changing, the refactor is wrong.

- [ ] **Step 4: Point `tests/company.test.ts` at the helper**

Do the same there. Read the file first and remove exactly its duplicated declarations — do not assume its import list matches chrome's.

- [ ] **Step 5: Run the suite and confirm nothing moved**

Run: `npm test`
Expected: PASS — still **230 tests / 16 files**. A changed count means behaviour changed; investigate rather than accepting it.

- [ ] **Step 6: Commit**

```bash
git add tests/helpers/dist.ts tests/chrome.test.ts tests/company.test.ts
git commit -m "refactor(tests): extract the duplicated dist walkers into one helper"
```

---

### Task 2: Timezone-safe dates

**Files:**
- Create: `src/lib/dates.ts`, `tests/dates.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `displayDate(publishedAt: string): string` → `"February 23, 2017"`; `isoDate(publishedAt: string): string` → `"2017-02-23"`; `byPublishedDesc(a: string, b: string): number` for `Array.prototype.sort`; `publishedYear(publishedAt: string): number`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/dates.test.ts
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
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/dates.test.ts`
Expected: FAIL — cannot resolve `../src/lib/dates`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/dates.ts
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
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
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
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run tests/dates.test.ts`
Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/dates.ts tests/dates.test.ts
git commit -m "feat: add timezone-safe formatting for stored publication timestamps"
```

---

### Task 3: The news collection and its seven entries

**Files:**
- Create: `src/schemas/news.ts`, `src/content/news/{seven}.md`
- Modify: `src/content.config.ts`, `tests/schemas.test.ts`

**Interfaces:**
- Consumes: `ReferenceFn`, `ImageFn`, `SchemaDeps`, `imageSchema` from `src/schemas/product.ts`.
- Produces: collection `news`, entries keyed by the seven slugs, each `data` carrying `title`, `publishedAt`, `summary`, `sourceUrl`, `sourceNote`, `relatedProducts`, `externalLinks`, optional `image { src, alt, aiGenerated, caption }`.

- [ ] **Step 1: Write the failing schema test**

Append to `tests/schemas.test.ts`. The file already declares `referenceStub` and `imageStub` at the top and asserts with `safeParse(...).success` rather than `toThrow` — reuse both. Add only the `newsSchema` import to the existing import block.

```ts
import { newsSchema } from '../src/schemas/news';

const news = newsSchema({ reference: referenceStub, image: imageStub });

const validPost = {
  title: 'Dusseldorf Wire Show',
  publishedAt: '2018-02-26T15:15:53+08:00',
  summary: 'LiTex attended the Düsseldorf wire show for the first time in 2018.',
  sourceUrl: 'https://litextextile.wordpress.com/2018/02/26/dusseldorf-wire-show/',
  sourceNote: 'Reproduced from LiTex’s previous site.',
};

describe('newsSchema', () => {
  it('accepts a post carrying its date, summary and provenance', () => {
    const r = news.safeParse(validPost);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.relatedProducts).toEqual([]);
      expect(r.data.externalLinks).toEqual([]);
    }
  });

  // YAML parses an unquoted 2018-02-26T15:15:53+08:00 into a Date, not a string. Quoting
  // it in the front matter is what keeps it a string, so the schema must reject a Date
  // loudly rather than let one reach the formatter.
  it('rejects a timestamp that arrived as a Date rather than a quoted string', () => {
    const r = news.safeParse({ ...validPost, publishedAt: new Date('2018-02-26') });
    expect(r.success).toBe(false);
  });

  it('rejects a timestamp with no offset, which would be ambiguous', () => {
    expect(news.safeParse({ ...validPost, publishedAt: '2018-02-26T15:15:53' }).success).toBe(false);
  });

  it('rejects a date that does not exist', () => {
    expect(news.safeParse({ ...validPost, publishedAt: '2018-02-31T15:15:53+08:00' }).success)
      .toBe(false);
  });

  it('requires provenance, because every post is a republication', () => {
    const { sourceUrl, ...noUrl } = validPost;
    expect(news.safeParse(noUrl).success).toBe(false);
    const { sourceNote, ...noNote } = validPost;
    expect(news.safeParse(noNote).success).toBe(false);
  });

  it('holds the summary to the meta-description budget', () => {
    expect(news.safeParse({ ...validPost, summary: 'x'.repeat(161) }).success).toBe(false);
  });

  it('refuses AI imagery — /news/ ships product photography, which is Tier 3', () => {
    const r = news.safeParse({
      ...validPost,
      image: { src: 'x.jpg', alt: 'A braided sleeve', caption: 'Source', aiGenerated: true },
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(JSON.stringify(r.error.issues)).toContain('Tier 3');
  });

  it('requires a caption on any image, so a reader is told what they are looking at', () => {
    const r = news.safeParse({ ...validPost, image: { src: 'x.jpg', alt: 'A braided sleeve' } });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/schemas.test.ts`
Expected: FAIL — cannot resolve `../src/schemas/news`.

- [ ] **Step 3: Write the schema**

```ts
// src/schemas/news.ts
import { z } from 'astro/zod';
import { imageSchema, type SchemaDeps } from './product';

/**
 * Stored exactly as the WordPress export recorded it, offset included. It must be a
 * STRING: YAML parses an unquoted 2017-02-23T14:54:11+08:00 into a Date object, which
 * would reach src/lib/dates.ts and defeat the whole point of storing calendar fields.
 * Quote it in the front matter.
 */
const STORED_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;

export function newsSchema({ reference, image }: SchemaDeps) {
  return z
    .object({
      title: z.string().min(1),
      // Plain z.string() on purpose: zod 4 renamed the v3 `invalid_type_error` option, and
      // the default type error ("expected string, received date") already names the exact
      // mistake — an unquoted timestamp in the front matter.
      publishedAt: z
        .string()
        .regex(STORED_TIMESTAMP, 'publishedAt must be ISO 8601 with an offset, e.g. 2017-02-23T14:47:55+08:00.'),
      summary: z.string().max(160), // doubles as the meta description
      /** The WordPress permalink this was republished from. */
      sourceUrl: z.string().url(),
      /** What was changed in republishing, and what was left out. Never optional. */
      sourceNote: z.string().min(1),
      relatedProducts: z.array(reference('products')).default([]),
      externalLinks: z
        .array(z.object({ label: z.string().min(1), href: z.string().url() }))
        .default([]),
      image: imageSchema(image)
        .extend({ caption: z.string().min(1) })
        .optional(),
    })
    .superRefine((data, ctx) => {
      // The regex admits 2018-02-31. Date.parse does not.
      if (Number.isNaN(Date.parse(data.publishedAt))) {
        ctx.addIssue({
          code: 'custom',
          path: ['publishedAt'],
          message: `"${data.publishedAt}" is not a real date.`,
        });
      }
      if (data.image?.aiGenerated) {
        ctx.addIssue({
          code: 'custom',
          path: ['image', 'aiGenerated'],
          message: 'News imagery depicts LiTex product, which is Tier 3 — real photography only (spec §5).',
        });
      }
    });
}
```

- [ ] **Step 4: Run the schema test and confirm it passes**

Run: `npx vitest run tests/schemas.test.ts`
Expected: PASS.

- [ ] **Step 5: Register the collection**

```ts
// src/content.config.ts — add to the existing file
import { newsSchema } from './schemas/news';

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: ({ image }) => newsSchema({ reference, image }),
});

export const collections = { products, applications, news };
```

- [ ] **Step 6: Write the seven entries**

Transcribe exactly what is below. The titles here already have U+00A0 normalized to a normal space; the bodies keep their U+2019 apostrophes. **Every `publishedAt` is quoted.**

`src/content/news/techtextil-frankfurt.md`

```markdown
---
title: 'LiTex Attending TechTextil at Frankfurt Germany!'
publishedAt: '2017-02-23T14:47:55+08:00'
summary: 'LiTex exhibited at Techtextil in Frankfurt and invited visitors to booth B76.'
sourceUrl: 'https://litextextile.wordpress.com/2017/02/23/litex-attending-techtextil-at-frankfurt-germany/'
sourceNote: 'Reproduced from LiTex’s previous site. The original carried Messe Frankfurt’s Techtextil key visual, which is not republished here.'
---

Please stop by our booth at B76 to learn more about us! We would certainly appreciate the
opportunity to talk to all interested parties in how we can collaborate and develop new
exciting products!
```

`src/content/news/wearable-expo.md`

```markdown
---
title: 'A Rewarding Experience at the Wearable Expo'
publishedAt: '2017-02-23T14:38:59+08:00'
summary: 'LiTex thanks the visitors to its booth at the Wearable Expo in Tokyo.'
sourceUrl: 'https://litextextile.wordpress.com/2017/02/23/a-rewarding-experience-at-the-wearable-expo/'
sourceNote: 'Reproduced from LiTex’s previous site, unchanged.'
---

A big thanks to all that visited our booth at the Wearable Expo in Tokyo! It was a pleasure
to meet you all. To all that visited, you should have received an email from us. If you’d
like to hear from us and learn more about our products, please don’t hesitate to email us at
sales@litex.com.tw.
```

`src/content/news/copper-nickel-1s1z.md`

```markdown
---
title: 'Copper Nickel 1s1z'
publishedAt: '2017-02-23T14:54:11+08:00'
summary: 'LiTex announced a copper-nickel grade of Conductive Metal Yarn, offering a more resistive material for better battery performance.'
sourceUrl: 'https://litextextile.wordpress.com/2017/02/23/copper-nickel-1s1z/'
sourceNote: 'Reproduced from LiTex’s previous site, unchanged. The grade was still described as forthcoming in the 2018 catalogs; its current status is an open question for LiTex.'
relatedProducts:
  - conductive-metal-yarn
---

All of us at LiTex are pleased to announce that we will soon roll out (around April) a new
specification of Conductive Metal Yarn that may satisfy the needs of a more resistive
material for better battery performance. Please stay tuned for updates as we run tests on
this new item!
```

`src/content/news/featured-on-techtextil-blog.md`

```markdown
---
title: 'Featured on TechTextil Blog!'
publishedAt: '2017-06-26T13:39:06+08:00'
summary: 'The Techtextil blog interviewed LiTex at Frankfurt Messe and published an article about the company.'
sourceUrl: 'https://litextextile.wordpress.com/2017/06/26/featured-on-techtextil-blog/'
sourceNote: 'Reproduced from LiTex’s previous site with two grammatical corrections ("Its been" → "It’s been", "It was pleasure" → "It was a pleasure"). The original linked the article at techtextil-blog.com/en/the-heat-is-on/, which no longer resolves — the domain now serves a Messe Frankfurt certificate. A Wayback capture dated 2022-05-19 exists but has not been verified, so no link is published.'
---

It’s been a couple of weeks since we have returned from our trip in Europe. It was a
pleasure meeting all those who stopped by our booth. Thanks for your time!

Thanks to Liam Rodden for interviewing us at Frankfurt Messe, and writing an article about
us!
```

`src/content/news/dusseldorf-wire-show.md`

```markdown
---
title: 'Dusseldorf Wire Show'
publishedAt: '2018-02-26T15:15:53+08:00'
summary: 'LiTex attended the Düsseldorf wire show for the first time in 2018.'
sourceUrl: 'https://litextextile.wordpress.com/2018/02/26/dusseldorf-wire-show/'
sourceNote: 'Reproduced from LiTex’s previous site, unchanged. The original linked the trade fair, which is still live.'
externalLinks:
  - label: 'wire Düsseldorf'
    href: 'https://www.wire.de/'
---

We are glad to announce that we will be attending the Dusseldorf Wire Show 2018! This is the
first time that we will be attending this show. Hope to meet more people in different fields
and learn more about how we can expand our expertise. We also welcome people we know to come
visit us if you happen to be in the area!
```

`src/content/news/new-braided-self-curling-tube.md` — **body is empty on purpose.** The image is the post.

```markdown
---
title: 'New Braided Self-curling Tube Item!'
publishedAt: '2020-05-20T12:02:57+08:00'
summary: 'A close-up of the braided self-curling tube, announced as a new item in May 2020.'
sourceUrl: 'https://litextextile.wordpress.com/2020/05/20/new-braided-self-curling-tube-item/'
sourceNote: 'Reproduced from LiTex’s previous site. The original post had no text — a photograph linking to the product page was the whole announcement.'
relatedProducts:
  - braided-self-curling-tube
image:
  src: '../../assets/news/new-braided-self-curling-tube.jpg'
  alt: 'Macro photograph of black braided sleeving filling the frame, showing the herringbone braid pattern and the overlapping edge that lets the tube curl closed around a cable'
  caption: 'Braided self-curling tube, photographed by LiTex for the May 2020 announcement.'
---
```

> The `image` block is added in **Task 6**, once the asset exists. Astro fails to resolve a
> schema `image()` pointing at a missing file, so writing it now breaks the build. Create
> this file with everything **above** `image:` in Task 3 and add the three image lines in
> Task 6.

`src/content/news/tokyo-wearable-expo-2022.md`

```markdown
---
title: 'Tokyo Wearable Expo 2022'
publishedAt: '2022-01-21T17:24:08+08:00'
summary: 'LiTex thanks the visitors to its booth at the Tokyo Wearable Expo 2022.'
sourceUrl: 'https://litextextile.wordpress.com/2022/01/21/tokyo-wearable-expo-2022/'
sourceNote: 'Reproduced from LiTex’s previous site. The original carried the Wearable Expo organizer’s logo, which is not republished here.'
---

Thanks for visiting our booth! Please feel free to contact us for any questions and sample
needs!
```

- [ ] **Step 7: Prove the collection loads and no title kept a non-breaking space**

Add to `tests/schemas.test.ts`:

```ts
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

describe('news entries as authored', () => {
  const dir = fileURLToPath(new URL('../src/content/news', import.meta.url));
  const files = readdirSync(dir).filter((f) => f.endsWith('.md'));

  it('publishes exactly the seven posts spec §3 keeps', () => {
    expect(files.map((f) => f.replace(/\.md$/, '')).sort()).toEqual([
      'copper-nickel-1s1z', 'dusseldorf-wire-show', 'featured-on-techtextil-blog',
      'new-braided-self-curling-tube', 'techtextil-frankfurt', 'tokyo-wearable-expo-2022',
      'wearable-expo',
    ]);
  });

  // Six of the seven archived titles contain U+00A0, WordPress's widow-prevention. It is
  // invisible in an editor and in a browser, breaks text search, and wraps wrong.
  it('carries no non-breaking space transcribed in from WordPress', () => {
    for (const file of files) {
      const text = readFileSync(join(dir, file), 'utf8');
      expect(text.includes(' '), `${file} still holds a U+00A0`).toBe(false);
    }
  });

  // test-post-blah is deliberately dead (spec §3, 410 Gone). Its content is real but is
  // superseded by wearable-expo; if it ever reappears that was a decision, not a drift.
  it('does not resurrect the killed test post', () => {
    expect(files.some((f) => f.includes('test-post'))).toBe(false);
  });
});
```

- [ ] **Step 8: Run the tests and the build**

Run: `npm test` then `npm run build`
Expected: tests PASS; build exits 0 and still emits **24 pages** — the collection exists but nothing renders it yet.

- [ ] **Step 9: Commit**

```bash
git add src/schemas/news.ts src/content/news src/content.config.ts tests/schemas.test.ts
git commit -m "feat: add the news collection and the seven posts kept from the old blog"
```

---

### Task 4: The `/news/` index

**Files:**
- Create: `src/pages/news/index.astro`, `tests/news.test.ts`
- Modify: `src/lib/nav.ts`

**Interfaces:**
- Consumes: `getCollection('news')`; `displayDate`, `isoDate`, `publishedYear`, `byPublishedDesc` from `src/lib/dates`; `allHtmlFiles`/`docFor`/`routeFile` from `tests/helpers/dist`.
- Produces: route `/news/`, each entry linking `/news/<slug>/`; `NAV` gains `{ href: '/news/', label: 'News' }`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/news.test.ts
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
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run build && npx vitest run tests/news.test.ts`
Expected: FAIL — `dist/news/index.html` does not exist.

- [ ] **Step 3: Write the index page**

```astro
---
// src/pages/news/index.astro
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { displayDate, isoDate, publishedYear, byPublishedDesc } from '../../lib/dates';

const posts = (await getCollection('news'))
  .sort((a, b) => byPublishedDesc(a.data.publishedAt, b.data.publishedAt));

// Computed, never written down: an archive that names a range it no longer covers is
// exactly the kind of stale claim this section is trying not to make.
const years = posts.map((p) => publishedYear(p.data.publishedAt));
const first = Math.min(...years);
const last = Math.max(...years);

const grouped = [...new Set(years)].map((year) => ({
  year,
  posts: posts.filter((p) => publishedYear(p.data.publishedAt) === year),
}));
---
<BaseLayout
  title="News — LiTex Textile & Technology"
  description={`Announcements LiTex published between ${first} and ${last}, reproduced from its previous site.`}
>
  <h1>News</h1>

  <p class="intro" data-archive-note>
    An archive of the announcements LiTex published between {first} and {last}, reproduced
    from the company’s previous site with their original dates. Nothing here has been
    rewritten or brought up to date, so read every statement as of the date it carries.
    Current specifications live on the{' '}
    <a href="/products/">product pages</a>.
  </p>

  {grouped.map(({ year, posts: yearPosts }) => (
    <section class="year">
      <h2 data-news-year>{year}</h2>
      <ul class="list" data-news-list>
        {yearPosts.map((post) => (
          <li>
            <time datetime={isoDate(post.data.publishedAt)}>
              {displayDate(post.data.publishedAt)}
            </time>
            <a href={`/news/${post.id}/`}>{post.data.title}</a>
            <p class="summary" data-summary>{post.data.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  ))}
</BaseLayout>

<style>
  .intro { color: var(--c-text-2); max-width: 60ch; }
  .year h2 { margin-bottom: var(--s-2); }
  .list { list-style: none; padding: 0; margin: 0; }
  .list li {
    border-top: 1px solid var(--c-line);
    padding: var(--s-4) 0;
  }
  .list time {
    display: block;
    font-size: var(--t-12);
    color: var(--c-text-2);
  }
  .list a { font-size: var(--t-20); }
  .summary { color: var(--c-text-2); font-size: var(--t-14); margin: var(--s-2) 0 0; max-width: 70ch; }
</style>
```

> The `data-news-list` selector in the test collects across all four year groups in
> document order, which is why the flat newest-first assertion holds.

- [ ] **Step 4: Build and confirm the index passes**

Run: `npm run build && npx vitest run tests/news.test.ts`
Expected: PASS. Build emits **25 pages** (24 + `/news/`).

- [ ] **Step 5: Add `/news/` to the primary navigation**

Only now — the page exists, so `tests/chrome.test.ts` can find a file behind the link.

```ts
// src/lib/nav.ts — append to NAV, after Company
  { href: '/company/', label: 'Company' },
  { href: '/news/', label: 'News' },
];
```

- [ ] **Step 6: Run the whole suite**

Run: `npm run build && npm test`
Expected: PASS. `tests/chrome.test.ts` now walks a six-item nav and finds `dist/news/index.html` behind the new entry.

- [ ] **Step 7: Verify the nav guard is real rather than assumed**

Temporarily change the new NAV entry to `{ href: '/news-feed/', label: 'News' }`, run `npm run build && npx vitest run tests/chrome.test.ts`, and confirm it **FAILS** with `chrome links with no page behind them`. Restore `/news/` and re-run to green. Do not skip this — Plan 1–5's practice is that every guard is verified by breaking it.

- [ ] **Step 8: Commit**

```bash
git add src/pages/news/index.astro src/lib/nav.ts tests/news.test.ts
git commit -m "feat: publish the /news/ archive index and put it in the primary nav"
```

---

### Task 5: The post pages

**Files:**
- Create: `src/pages/news/[slug].astro`
- Modify: `tests/news.test.ts`

**Interfaces:**
- Consumes: `getCollection('news')`, `render`, `getEntry`; `mustResolve` from `src/lib/references`; `displayDate`/`isoDate` from `src/lib/dates`.
- Produces: routes `/news/<slug>/` ×7.

- [ ] **Step 1: Write the failing tests**

Append to `tests/news.test.ts`, and **extend the existing import line** rather than adding a second one — `import { docFor } from './helpers/dist';` from Task 4 becomes:

```ts
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, docFor, routeFile } from './helpers/dist';
```

Then append:

```ts
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

  // The May 2020 post had no text at all — a photograph was the whole announcement. A
  // post that renders as a bare heading is indistinguishable from a broken page.
  it('gives every post a body: prose, a figure, or both', () => {
    for (const slug of SLUGS) {
      const doc = docFor(routeFile(`/news/${slug}/`));
      const hasProse = (doc.querySelector('[data-prose]')?.textContent ?? '').trim().length > 0;
      const hasFigure = doc.querySelector('[data-archive-figure]') !== null;
      expect(hasProse || hasFigure, `${slug} renders an empty post`).toBe(true);
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

  // techtextil-blog.com now serves a certificate for *.messefrankfurt.com, so linking it
  // sends a buyer to a TLS warning. Decision 3 — it stays unlinked until someone verifies
  // a replacement URL. Checked across the whole build, not just the one post, because the
  // tempting place to "helpfully" restore it later is a source note or the index.
  it('publishes no link to the dead TechTextil blog anywhere in the build', () => {
    const offenders = allHtmlFiles().filter((file) =>
      readFileSync(file, 'utf8').includes('techtextil-blog.com'),
    );
    expect(offenders, `dead link restored in:\n${offenders.join('\n')}`).toEqual([]);
  });
});
```

> That last test needs `readFileSync` and `allHtmlFiles` — add both to the imports at the
> top of the file alongside `existsSync`.

- [ ] **Step 2: Run and watch it fail**

Run: `npx vitest run tests/news.test.ts`
Expected: FAIL — no post routes exist.

- [ ] **Step 3: Write the post page**

```astro
---
// src/pages/news/[slug].astro
import { getCollection, getEntry, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import ArchiveFigure from '../../components/ArchiveFigure.astro';
import { mustResolve } from '../../lib/references';
import { displayDate, isoDate, byPublishedDesc } from '../../lib/dates';

export async function getStaticPaths() {
  const posts = await getCollection('news');
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

const { post } = Astro.props;
const { Content } = await render(post);

// A broken reference renders blank instead of failing the build (Astro 7.2.0), so every
// related product is resolved through the guard.
const related = await Promise.all(
  post.data.relatedProducts.map(async (ref) =>
    mustResolve(await getEntry(ref), ref, `news/${post.id}`),
  ),
);
---
<BaseLayout
  title={`${post.data.title} — LiTex Textile & Technology`}
  description={post.data.summary}
>
  <p class="breadcrumb"><a href="/news/">← All news</a></p>

  <article>
    <time datetime={isoDate(post.data.publishedAt)}>{displayDate(post.data.publishedAt)}</time>
    <h1>{post.data.title}</h1>

    <div class="prose" data-prose><Content /></div>

    {post.data.image && (
      <ArchiveFigure
        image={post.data.image.src}
        alt={post.data.image.alt}
        caption={post.data.image.caption}
      />
    )}

    {post.data.externalLinks.length > 0 && (
      <ul class="links">
        {post.data.externalLinks.map((link) => (
          <li><a href={link.href} rel="noopener">{link.label}</a></li>
        ))}
      </ul>
    )}

    {related.length > 0 && (
      <section data-related>
        <h2>Related product{related.length === 1 ? '' : 's'}</h2>
        <ul class="links">
          {related.map((product) => (
            <li><a href={`/products/${product.id}/`}>{product.data.name}</a></li>
          ))}
        </ul>
      </section>
    )}

    <p class="provenance" data-source-note>
      <small>
        Published {displayDate(post.data.publishedAt)} at{' '}
        <a href={post.data.sourceUrl} rel="noopener">{post.data.sourceUrl}</a>.{' '}
        {post.data.sourceNote}
      </small>
    </p>
  </article>
</BaseLayout>

<style>
  .breadcrumb { font-size: var(--t-14); }
  article > time {
    display: block;
    font-size: var(--t-12);
    color: var(--c-text-2);
    margin-bottom: var(--s-2);
  }
  .prose { max-width: 70ch; }
  .prose :global(p:first-child) { margin-top: 0; }
  .links { list-style: none; padding: 0; margin: var(--s-4) 0 0; }
  .links li + li { margin-top: var(--s-2); }
  .provenance {
    color: var(--c-text-2);
    margin-top: var(--s-12);
    padding-top: var(--s-4);
    border-top: 1px solid var(--c-line);
    max-width: 70ch;
    /* The source URL is long and unbreakable; without this it overflows on a phone. */
    overflow-wrap: anywhere;
  }
</style>
```

- [ ] **Step 4: Build and run**

Run: `npm run build && npm test`
Expected: PASS. Build emits **32 pages** (24 + index + 7 posts).

- [ ] **Step 5: Check the compressHTML spacing trap on the new pages**

Run:

```bash
grep -roE '[a-zA-Z,;:.]<(span|a|strong|em)\b' dist/news | head -20
```

Expected: no output. Any hit is a missing `{' '}` — the provenance line joins text to an `<a>` twice and is the likely offender.

- [ ] **Step 6: Commit**

```bash
git add src/pages/news/[slug].astro tests/news.test.ts
git commit -m "feat: render the seven news posts with their dates and provenance"
```

---

### Task 6: The braided-tube photograph

**Files:**
- Modify: `scripts/extract-images.mjs`, `tests/provenance.test.ts`, `tests/imagery.test.ts`, `src/content/news/new-braided-self-curling-tube.md`
- Generated: `src/assets/news/new-braided-self-curling-tube.jpg`, `src/assets/news/provenance.json`

**Interfaces:**
- Consumes: `ArchiveFigure` (already wired in Task 5).
- Produces: a third provenance group, `news`.

- [ ] **Step 1: Add the third group and the source**

HANDOFF records the rule: add a group only when a third page family needs its own photography. `/news/` is that family, and a shared directory would make `provenance.test.ts`'s per-slug assertions meaningless.

```js
// scripts/extract-images.mjs
const GROUPS = ['products', 'company', 'news'];
```

Append to `SOURCES`:

```js
  // --- News photography. The May 2020 announcement had no text: this photograph was the
  // whole post. It is a different frame from the product hero (which shows five diameters
  // laid out on white) and shows the braid structure far better, so it is kept separate
  // rather than reused.
  {
    group: 'news',
    slug: 'new-braided-self-curling-tube',
    copyFrom: 'archive/images/img_4818.jpg',
    note: 'Archived post image, May 2020: macro of black braided sleeving filling the frame, showing the herringbone braid and the overlapping edge that lets the tube curl closed',
  },
```

- [ ] **Step 2: Run the extraction**

Run: `node scripts/extract-images.mjs`
Expected: the log gains a `news new-braided-self-curling-tube.jpg 1400x1400 (reduced from 3024x3024)` line, and `Wrote provenance for 1 news images.`

- [ ] **Step 3: Look at the file before shipping it**

Open `src/assets/news/new-braided-self-curling-tube.jpg` and confirm it is the braid macro. A mis-specified extraction produces a valid JPEG of valid dimensions with valid provenance — Plan 5 shipped a black rectangle that way. The bytes-per-pixel guard catches a flat frame, not a wrong one.

- [ ] **Step 4: Teach the tests about the third group**

```ts
// tests/provenance.test.ts
const GROUPS = ['products', 'company', 'news'] as const;

const EXPECTED: Record<string, string[]> = {
  // Leave the existing `products` (7 slugs) and `company` (6 slugs) arrays exactly as
  // they are — this task only adds a third key.
  news: ['new-braided-self-curling-tube'],
};
```

```ts
// tests/imagery.test.ts — allProvenance()
  return ['products', 'company', 'news'].reduce(
```

```ts
// tests/imagery.test.ts — Tier 3. The braid macro depicts LiTex's actual product, so
// /news/ is Tier 3 wherever it carries a photograph.
  const TIER_3 = ['technology', 'company', 'news'];
```

- [ ] **Step 5: Add the image to the post's front matter**

Add the three lines held back in Task 3 to `src/content/news/new-braided-self-curling-tube.md`:

```yaml
image:
  src: '../../assets/news/new-braided-self-curling-tube.jpg'
  alt: 'Macro photograph of black braided sleeving filling the frame, showing the herringbone braid pattern and the overlapping edge that lets the tube curl closed around a cable'
  caption: 'Braided self-curling tube, photographed by LiTex for the May 2020 announcement.'
```

- [ ] **Step 6: Build and run everything**

Run: `npm run build && npm test`
Expected: PASS. Still 32 pages. `dist` gains avif/webp variants of the macro, all comfortably under the 300 KB cap (measured: 1200px webp is 137 KB).

- [ ] **Step 7: Verify the Tier 3 guard actually covers `/news/`**

Temporarily set `"aiGenerated": true` on the news entry in `src/assets/news/provenance.json`, run `npx vitest run tests/imagery.test.ts`, and confirm it **FAILS** with a Tier 3 violation. Restore it (or re-run the extraction script) and confirm green.

- [ ] **Step 8: Commit**

```bash
git add scripts/extract-images.mjs src/assets/news src/content/news/new-braided-self-curling-tube.md tests/provenance.test.ts tests/imagery.test.ts
git commit -m "feat: ship LiTex's own braid macro as the May 2020 post's content"
```

---

### Task 7: `BlogPosting` JSON-LD

**Files:**
- Modify: `src/lib/jsonld.ts`, `src/pages/news/[slug].astro`, `tests/jsonld.test.ts`, `tests/news.test.ts`

**Interfaces:**
- Consumes: `MANUFACTURER` from `src/lib/jsonld.ts`.
- Produces: `newsJsonLd(input: { title, description, url, publishedAt }): Record<string, unknown>`.

- [ ] **Step 1: Write the failing unit test**

`tests/jsonld.test.ts` already imports `MANUFACTURER` on line 2 — widen that existing import to `import { productJsonLd, newsJsonLd, MANUFACTURER } from '../src/lib/jsonld';` rather than adding a second import line. Then append:

```ts
describe('newsJsonLd', () => {
  const ld = newsJsonLd({
    title: 'Dusseldorf Wire Show',
    description: 'LiTex attended the Düsseldorf wire show for the first time in 2018.',
    url: 'https://litex.com.tw/news/dusseldorf-wire-show/',
    publishedAt: '2018-02-26T15:15:53+08:00',
  });

  it('describes the post as a BlogPosting published by LiTex', () => {
    expect(ld['@type']).toBe('BlogPosting');
    expect(ld.headline).toBe('Dusseldorf Wire Show');
    expect(ld.publisher).toEqual(MANUFACTURER);
  });

  // The stored offset is part of the fact. Emitting a UTC-normalized instant would state
  // a different local date than the page shows.
  it('emits the timestamp exactly as stored, offset included', () => {
    expect(ld.datePublished).toBe('2018-02-26T15:15:53+08:00');
  });

  it('makes no claim about modification, because nothing has been revised', () => {
    expect(ld).not.toHaveProperty('dateModified');
  });
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npx vitest run tests/jsonld.test.ts`
Expected: FAIL — `newsJsonLd` is not exported.

- [ ] **Step 3: Implement it**

```ts
// src/lib/jsonld.ts — append

/**
 * schema.org BlogPosting for a republished announcement. Deliberately emits no
 * `dateModified`: the posts are reproduced, not revised, and claiming a modification date
 * would assert editorial activity that never happened.
 */
export function newsJsonLd(input: {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.title,
    description: input.description,
    url: input.url,
    datePublished: input.publishedAt,
    publisher: MANUFACTURER,
  };
}
```

- [ ] **Step 4: Emit it from the post page**

In `src/pages/news/[slug].astro`, add to the front matter:

```ts
import { newsJsonLd } from '../../lib/jsonld';

const jsonLd = newsJsonLd({
  title: post.data.title,
  description: post.data.summary,
  url: new URL(Astro.url.pathname, Astro.site).href,
  publishedAt: post.data.publishedAt,
});
```

and inside `<BaseLayout>`, as the last child:

```astro
  <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
```

- [ ] **Step 5: Assert it against the build**

Append to `tests/news.test.ts`:

```ts
it('emits valid BlogPosting JSON-LD on every post', () => {
  for (const slug of SLUGS) {
    const raw = docFor(routeFile(`/news/${slug}/`))
      .querySelector('script[type="application/ld+json"]')?.textContent ?? '';
    const ld = JSON.parse(raw);
    expect(ld['@type'], `${slug}`).toBe('BlogPosting');
    expect(ld.datePublished, `${slug}`).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/);
    expect(ld.url, `${slug}`).toBe(`https://litex.com.tw/news/${slug}/`);
  }
});
```

> `SITE_URL` in `astro.config.mjs` is `https://litex.com.tw` with no trailing slash
> (verified 2026-08-12), which is why the expected URL is spelled out in full.

- [ ] **Step 6: Build and run**

Run: `npm run build && npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/jsonld.ts src/pages/news/[slug].astro tests/jsonld.test.ts tests/news.test.ts
git commit -m "feat: emit BlogPosting JSON-LD for the news archive"
```

---

### Task 8: Documentation and handoff

**Files:**
- Modify: `HANDOFF.md`, `docs/superpowers/specs/2026-08-10-litex-website-redesign-design.md`

- [ ] **Step 1: Reconcile the spec with what was built**

Spec §3 says *"the 7 posts kept from the old blog"* and its redirect map lists all seven slugs — both already match. Add a short note under §3's redirect map recording Decisions 1–4 above, particularly that `test-post-blah` has real content and is killed anyway, so a future reader does not "discover" it and reopen the question.

- [ ] **Step 2: Rewrite `HANDOFF.md` for session 8**

Carry forward, updating each: the state block (page count, test count, `main` SHA), the roadmap table with Plan 6 merged, the "What Plan 7 inherits" table, the carried-forward minors (**strike the three this plan closed** — the shared test helper is done; note whether `ArchiveFigure`/`ProductHero` boilerplate was left alone deliberately), the patent facts, the settled list, the toolchain gotchas, and the open questions.

Add to the open questions: **news since 2022** (spec §7 item 14) — the archive framing makes a four-year gap honest, but it does not fill it; and **the TechTextil article** — whether LiTex has a copy of the coverage, or can confirm the Wayback capture, since it is their only independent editorial mention.

Add to the toolchain gotchas: **YAML parses an unquoted ISO timestamp into a `Date`**, which is why every `publishedAt` is quoted and why the schema rejects a non-string.

- [ ] **Step 3: Final whole-branch verification**

Run: `npm run build && npm test`, then the design detector over `src/components src/pages src/styles`.
Expected: build exits 0 at **32 pages**; the full suite passes; detector returns `[]`.

- [ ] **Step 4: Commit**

```bash
git add HANDOFF.md docs/superpowers/specs/2026-08-10-litex-website-redesign-design.md
git commit -m "docs: record the news archive and rewrite HANDOFF for session 8"
```

---

## Definition of Done

Every item verified by observation, not assumption. Where a guard is claimed, break it and watch it fail.

1. `npm run build` exits 0 and emits **32 pages**.
2. `npm test` passes; no existing assertion was weakened to make room.
3. All seven routes from spec §3's redirect map exist at exactly those slugs.
4. `/news/` states it is an archive and names a date range **computed from the entries**.
5. No page claims any text is verbatim.
6. No U+00A0 survives anywhere in `src/content/news/`.
7. `/news/` ships exactly one photograph, it is LiTex's own, and it traces to a `news` provenance entry with `aiGenerated: false`.
8. The Tier 3 guard covers `/news/` — verified by flipping `aiGenerated` and watching it fail.
9. The nav guard covers `/news/` — verified by pointing it at a route that does not exist.
10. `walk`/`routeFile` exist in exactly one file; `grep -c 'function walk' tests/*.ts` returns nothing outside `tests/helpers/`.
11. No `techtextil-blog.com` link is published anywhere in `dist/`.
12. `grep -roE '[a-zA-Z,;:.]<(span|a|strong|em)\b' dist/news` is empty.

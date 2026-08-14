// src/schemas/news.ts
import { z } from 'astro/zod';
import { imageSchema, type SchemaDeps } from './product';
import { STORED, isStoredTimestamp } from '../lib/dates';

export function newsSchema({ reference, image }: SchemaDeps) {
  return z
    .object({
      title: z.string().min(1),
      // Plain z.string() on purpose: zod 4 renamed the v3 `invalid_type_error` option, and
      // the default type error ("expected string, received date") already names the exact
      // mistake — an unquoted timestamp in the front matter. It must be a STRING: YAML
      // parses an unquoted 2017-02-23T14:54:11+08:00 into a Date object, which would reach
      // src/lib/dates.ts and defeat the whole point of storing calendar fields. Quote it in
      // the front matter. STORED is src/lib/dates.ts's own format regex — this schema does
      // not keep a second copy of it.
      publishedAt: z
        .string()
        .regex(STORED, 'publishedAt must be ISO 8601 with an offset, e.g. 2017-02-23T14:47:55+08:00.'),
      summary: z.string().max(160), // doubles as the meta description
      /**
       * The WordPress permalink this was republished from.
       *
       * Optional since 2026-08-14, because the site has stopped being a republication of
       * litextextile.wordpress.com and started being where news is published. WordPress
       * is being retired; a post written here has no original to point at, and inventing
       * one would be worse than omitting it.
       *
       * The seven archived posts still carry theirs, and the superRefine below keeps the
       * disclosure obligation attached to the thing that creates it — republishing —
       * rather than to every post forever.
       */
      sourceUrl: z.string().url().optional(),
      /** What was changed in republishing, and what was left out. Required whenever
       *  sourceUrl is present; see the superRefine. */
      sourceNote: z.string().min(1).optional(),
      relatedProducts: z.array(reference('products')).default([]),
      externalLinks: z
        .array(z.object({ label: z.string().min(1), href: z.string().url() }))
        .default([]),
      image: imageSchema(image)
        .extend({ caption: z.string().min(1) })
        .optional(),
    })
    .superRefine((data, ctx) => {
      // The regex admits 2018-02-31, and Date.parse silently rolls that over to March 3rd
      // rather than rejecting it (verified against this project's Node — not the "Date.parse
      // does not" behavior the brief assumed). src/lib/dates.ts already owns a deterministic
      // UTC round-trip check for exactly this; isStoredTimestamp is that check reused, not
      // re-derived here.
      if (!isStoredTimestamp(data.publishedAt)) {
        ctx.addIssue({
          code: 'custom',
          path: ['publishedAt'],
          message: `"${data.publishedAt}" is not a real date.`,
        });
      }
      // The disclosure obligation belongs to republishing, not to publishing. An
      // original post has no original to describe. But a post that DOES name a source
      // must say what changed in reproducing it — that sentence is the whole reason a
      // reader can trust the archive, and losing it silently as posts are added through
      // a CMS is exactly how an archive stops being honest.
      if (data.sourceUrl && !data.sourceNote) {
        ctx.addIssue({
          code: 'custom',
          path: ['sourceNote'],
          message:
            'A post that names a sourceUrl must carry a sourceNote saying what was ' +
            'changed in republishing it, and what was left out.',
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

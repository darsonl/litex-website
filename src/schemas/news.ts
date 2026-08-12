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
      // The regex admits 2018-02-31, and Date.parse silently rolls that over to March 3rd
      // rather than rejecting it (verified against this project's Node — not the "Date.parse
      // does not" behavior the brief assumed). A UTC round-trip is deterministic: reconstruct
      // the date from its own y/m/d and check nothing shifted.
      const [, y, mo, d] = data.publishedAt.match(/^(\d{4})-(\d{2})-(\d{2})T/) ?? [];
      if (y) {
        const rebuilt = new Date(Date.UTC(+y, +mo - 1, +d));
        const rolledOver =
          rebuilt.getUTCFullYear() !== +y || rebuilt.getUTCMonth() !== +mo - 1 || rebuilt.getUTCDate() !== +d;
        if (rolledOver) {
          ctx.addIssue({
            code: 'custom',
            path: ['publishedAt'],
            message: `"${data.publishedAt}" is not a real date.`,
          });
        }
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

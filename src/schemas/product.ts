import { z } from 'astro/zod';

export type ReferenceFn = (collection: string) => z.ZodTypeAny;

/** Certifications LiTex has actually claimed. Adding one requires evidence, not optimism. */
export const CERTIFICATIONS = ['REACH', 'RoHS', 'SGS'] as const;

export const specTableSchema = z.object({
  columns: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      unit: z.string().optional(),
    }),
  ),
  rows: z.array(z.record(z.string(), z.string())),
});

export const imageSchema = z.object({
  src: z.string(),
  alt: z.string(),
  aiGenerated: z.boolean().default(false),
});

export function productSchema(reference: ReferenceFn) {
  return z
    .object({
      name: z.string(),
      status: z.enum(['active', 'legacy']),
      summary: z.string().max(160), // doubles as the meta description
      applications: z.array(reference('applications')).default([]),
      certifications: z.array(z.enum(CERTIFICATIONS)).default([]),
      catalogPdf: z.string().optional(),
      specTable: specTableSchema.optional(),
      heroImage: imageSchema.optional(),
      /** Which document each figure came from. */
      sourceNote: z.string().optional(),
      /** True while extracted values still need checking against the source PDF. */
      needsVerification: z.boolean().default(false),
    })
    .superRefine((data, ctx) => {
      if (data.specTable && !data.sourceNote) {
        ctx.addIssue({
          code: 'custom',
          path: ['sourceNote'],
          message:
            'A specTable must carry a sourceNote naming the document its figures came from.',
        });
      }
      if (data.heroImage?.aiGenerated) {
        ctx.addIssue({
          code: 'custom',
          path: ['heroImage', 'aiGenerated'],
          message:
            'Product heroes must be real photography. AI imagery is Tier 2 only (spec §5).',
        });
      }
    });
}

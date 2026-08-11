import { z } from 'astro/zod';

export type ReferenceFn = (collection: string) => z.ZodTypeAny;
/** Astro's image() from SchemaContext. Injected so the schema stays unit-testable. */
export type ImageFn = () => z.ZodTypeAny;
export type SchemaDeps = { reference: ReferenceFn; image: ImageFn };

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

export function imageSchema(image: ImageFn) {
  return z.object({
    src: image(),
    alt: z.string().min(1, 'Alt text is required — describe what the photograph shows.'),
    aiGenerated: z.boolean().default(false),
  });
}

export function productSchema({ reference, image }: SchemaDeps) {
  return z
    .object({
      name: z.string(),
      status: z.enum(['active', 'legacy']),
      summary: z.string().max(160), // doubles as the meta description
      applications: z.array(reference('applications')).default([]),
      certifications: z.array(z.enum(CERTIFICATIONS)).default([]),
      catalogPdf: z.string().optional(),
      specTable: specTableSchema.optional(),
      heroImage: imageSchema(image).optional(),
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
      // Alt text that only restates the name tells a screen-reader user nothing the
      // heading did not already say. Describe what the photograph actually shows.
      if (
        data.heroImage &&
        data.heroImage.alt.trim().toLowerCase() === data.name.trim().toLowerCase()
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['heroImage', 'alt'],
          message:
            'Alt text must describe what the photograph shows, not repeat the product name.',
        });
      }
    });
}

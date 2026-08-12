/**
 * schema.org Product JSON-LD, built from the same content entry that renders the
 * visible page so the two cannot drift (spec §4). Pure — no DOM, no Astro imports.
 *
 * Deliberately emits no `offers`: LiTex pricing is quote-based, and an invented
 * price is a factual claim the company never made.
 */

export const MANUFACTURER = {
  '@type': 'Organization',
  name: 'LiTex Textile & Technology Co., Ltd.',
  url: 'https://litex.com.tw',
} as const;

export function productJsonLd(input: {
  name: string;
  description: string;
  url: string;
  status: 'active' | 'legacy';
  certifications: readonly string[];
}): Record<string, unknown> {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description,
    url: input.url,
    manufacturer: MANUFACTURER,
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'availability',
        value: input.status === 'active' ? 'In production' : 'Discontinued — sampling only',
      },
    ],
  };

  if (input.certifications.length > 0) {
    ld.hasCertification = input.certifications.map((name) => ({
      '@type': 'Certification',
      name,
    }));
  }

  return ld;
}

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

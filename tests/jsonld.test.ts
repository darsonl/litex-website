import { describe, it, expect } from 'vitest';
import { productJsonLd, newsJsonLd, MANUFACTURER } from '../src/lib/jsonld';

const base = {
  name: 'Conductive Metal Yarn',
  description: 'Tinned copper filaments helically wound around a core.',
  url: 'https://litex.com.tw/products/conductive-metal-yarn/',
  status: 'active' as const,
  certifications: ['REACH', 'RoHS'],
};

describe('productJsonLd', () => {
  it('declares itself as a schema.org Product', () => {
    const ld = productJsonLd(base);
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('Product');
  });

  it('carries name, description and canonical url', () => {
    const ld = productJsonLd(base);
    expect(ld.name).toBe('Conductive Metal Yarn');
    expect(ld.description).toBe(base.description);
    expect(ld.url).toBe(base.url);
  });

  it('names LiTex as the manufacturer', () => {
    expect(productJsonLd(base).manufacturer).toEqual(MANUFACTURER);
  });

  it('never invents an offer or a price, because pricing is quote-based', () => {
    const ld = productJsonLd(base);
    expect(ld.offers).toBeUndefined();
    expect(JSON.stringify(ld)).not.toContain('price');
  });

  it('maps certifications to hasCertification entries', () => {
    const ld = productJsonLd(base) as { hasCertification: { name: string }[] };
    expect(ld.hasCertification.map((c) => c.name)).toEqual(['REACH', 'RoHS']);
  });

  it('omits hasCertification entirely when there are none', () => {
    expect(productJsonLd({ ...base, certifications: [] }).hasCertification).toBeUndefined();
  });

  it('marks a legacy product as discontinued', () => {
    expect(productJsonLd({ ...base, status: 'legacy' })['@type']).toBe('Product');
    expect(productJsonLd({ ...base, status: 'legacy' }).additionalProperty)
      .toEqual([{ '@type': 'PropertyValue', name: 'availability', value: 'Discontinued — sampling only' }]);
  });

  it('marks an active product as in production', () => {
    expect(productJsonLd(base).additionalProperty)
      .toEqual([{ '@type': 'PropertyValue', name: 'availability', value: 'In production' }]);
  });

  it('produces an object that survives JSON serialization', () => {
    expect(() => JSON.stringify(productJsonLd(base))).not.toThrow();
  });
});

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

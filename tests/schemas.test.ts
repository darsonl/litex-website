import { describe, it, expect } from 'vitest';
import { z } from 'astro/zod';
import { productSchema } from '../src/schemas/product';
import { applicationSchema } from '../src/schemas/application';

/** Stands in for Astro's reference(); shape matches what Astro produces. */
const referenceStub = () => z.object({ collection: z.string(), id: z.string() }).or(z.string());

const product = productSchema(referenceStub);
const application = applicationSchema(referenceStub);

const validProduct = {
  name: 'Conductive Metal Yarn',
  status: 'active',
  summary: 'Tinned copper filaments helically wound around a core, loom-made.',
  applications: ['heated-apparel-wearables'],
  certifications: ['REACH', 'RoHS'],
};

describe('productSchema', () => {
  it('accepts a minimal valid product', () => {
    expect(product.safeParse(validProduct).success).toBe(true);
  });

  it('rejects an unknown status', () => {
    const r = product.safeParse({ ...validProduct, status: 'discontinued' });
    expect(r.success).toBe(false);
  });

  it('rejects a summary over 160 characters, because it doubles as the meta description', () => {
    const r = product.safeParse({ ...validProduct, summary: 'x'.repeat(161) });
    expect(r.success).toBe(false);
  });

  it('rejects a certification LiTex has not claimed', () => {
    const r = product.safeParse({ ...validProduct, certifications: ['UL'] });
    expect(r.success).toBe(false);
  });

  it('requires sourceNote whenever a specTable is present', () => {
    const r = product.safeParse({
      ...validProduct,
      specTable: {
        columns: [{ key: 'item', label: 'Item' }],
        rows: [{ item: '010/N(K)30*3/1S' }],
      },
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('sourceNote');
  });

  it('accepts a specTable that carries its provenance', () => {
    const r = product.safeParse({
      ...validProduct,
      sourceNote: '2018-non-carbon-electrical-heating-textile.pdf',
      specTable: {
        columns: [
          { key: 'item', label: 'Item' },
          { key: 'resistance', label: 'Resistance', unit: 'Ω/M' },
        ],
        rows: [{ item: '010/N(K)30*3/1S', resistance: '~4.4' }],
      },
    });
    expect(r.success).toBe(true);
  });

  it('refuses an AI-generated product hero image', () => {
    const r = product.safeParse({
      ...validProduct,
      heroImage: { src: '/img/cmy.jpg', alt: 'Conductive metal yarn', aiGenerated: true },
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('aiGenerated');
  });

  it('accepts a real photographed product hero', () => {
    const r = product.safeParse({
      ...validProduct,
      heroImage: { src: '/img/cmy.jpg', alt: 'Conductive metal yarn', aiGenerated: false },
    });
    expect(r.success).toBe(true);
  });

  it('defaults needsVerification to false but accepts an explicit flag', () => {
    const off = product.safeParse(validProduct);
    expect(off.success).toBe(true);
    if (off.success) expect(off.data.needsVerification).toBe(false);

    const on = product.safeParse({ ...validProduct, needsVerification: true });
    expect(on.success).toBe(true);
    if (on.success) expect(on.data.needsVerification).toBe(true);
  });

  it('defaults certifications to an empty array', () => {
    const { certifications: _omitted, ...withoutCerts } = validProduct;
    const r = product.safeParse(withoutCerts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.certifications).toEqual([]);
  });
});

describe('applicationSchema', () => {
  it('accepts a valid application', () => {
    const r = application.safeParse({
      name: 'Heated apparel & wearables',
      summary: 'Garment heating built on conductive metal yarn.',
      evidence: 'archive/images/applications.jpg',
    });
    expect(r.success).toBe(true);
  });

  it('requires evidence, because unevidenced applications must not be published', () => {
    const r = application.safeParse({
      name: 'Aerospace',
      summary: 'Invented end-use with no support.',
    });
    expect(r.success).toBe(false);
  });
});

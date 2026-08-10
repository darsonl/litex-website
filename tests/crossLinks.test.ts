import { describe, it, expect } from 'vitest';
import { productsClaiming } from '../src/lib/crossLinks';

const products = [
  { id: 'cmy', data: { applications: ['heated-apparel-wearables'] } },
  { id: 'heating', data: { applications: ['heated-apparel-wearables', 'automotive-interiors'] } },
  { id: 'switch', data: { applications: [] } },
  { id: 'emi', data: { applications: [{ collection: 'applications', id: 'cable-protection-emi-shielding' }] } },
];

describe('productsClaiming', () => {
  it('finds every product that references the application', () => {
    expect(productsClaiming(products, 'heated-apparel-wearables').map((p) => p.id))
      .toEqual(['cmy', 'heating']);
  });

  it('accepts a parsed reference object as well as a bare string id', () => {
    expect(productsClaiming(products, 'cable-protection-emi-shielding').map((p) => p.id))
      .toEqual(['emi']);
  });

  it('returns an empty array when no product claims it, rather than throwing', () => {
    expect(productsClaiming(products, 'architecture')).toEqual([]);
  });

  it('ignores products with no applications at all', () => {
    expect(productsClaiming(products, 'heated-apparel-wearables').map((p) => p.id))
      .not.toContain('switch');
  });

  it('preserves the input order, so callers control sorting', () => {
    expect(productsClaiming(products, 'heated-apparel-wearables')[0].id).toBe('cmy');
  });
});

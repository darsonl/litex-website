import { describe, it, expect } from 'vitest';
import { mustResolve, refToId } from '../src/lib/references';

describe('refToId', () => {
  it('reads a bare string id', () => {
    expect(refToId('heated-apparel-wearables')).toBe('heated-apparel-wearables');
  });

  it('reads the id out of a parsed Astro reference', () => {
    expect(refToId({ collection: 'applications', id: 'smart-textiles-rfid' }))
      .toBe('smart-textiles-rfid');
  });
});

describe('mustResolve', () => {
  it('returns the entry when it resolved', () => {
    const entry = { data: { name: 'Heated apparel & wearables' } };
    expect(mustResolve(entry, 'heated-apparel-wearables', 'conductive-metal-yarn'))
      .toBe(entry);
  });

  it('throws when the reference did not resolve, rather than rendering blank', () => {
    expect(() => mustResolve(undefined, 'does-not-exist', 'conductive-metal-yarn'))
      .toThrow(/Broken reference/);
  });

  it('names both the missing id and the entry that referenced it', () => {
    expect(() => mustResolve(undefined, 'does-not-exist', 'conductive-metal-yarn'))
      .toThrow(/conductive-metal-yarn.*does-not-exist/);
  });

  it('treats null the same as undefined', () => {
    expect(() => mustResolve(null, { collection: 'applications', id: 'gone' }, 'rfid-textile-tape'))
      .toThrow(/gone/);
  });
});

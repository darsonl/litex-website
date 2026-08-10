import { describe, it, expect } from 'vitest';
import { contrastRatio, relativeLuminance } from '../src/lib/contrast';

describe('contrastRatio', () => {
  it('returns 21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 2);
  });

  it('returns 1:1 for a colour against itself', () => {
    expect(contrastRatio('#C87941', '#C87941')).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#0A0C0D', '#F2F1EF')).toBeCloseTo(
      contrastRatio('#F2F1EF', '#0A0C0D'), 10,
    );
  });

  it('computes the known luminance of white and black', () => {
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5);
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
  });

  it('accepts lowercase and uppercase hex identically', () => {
    expect(contrastRatio('#c87941', '#0a0c0d')).toBeCloseTo(
      contrastRatio('#C87941', '#0A0C0D'), 10,
    );
  });
});

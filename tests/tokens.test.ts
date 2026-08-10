import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { contrastRatio } from '../src/lib/contrast';

const css = readFileSync(
  fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url)),
  'utf8',
);

function parseTokens(source: string): Record<string, string> {
  const found: Record<string, string> = {};
  for (const m of source.matchAll(/--c-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    found[m[1]] = m[2].toUpperCase();
  }
  return found;
}

/** Tokens that may carry text, and therefore must clear WCAG AA on both surfaces. */
const TEXT_TOKENS = ['text-1', 'text-2', 'copper', 'copper-lift', 'in-production', 'legacy'];
const SURFACE_TOKENS = ['base', 'raised'];

describe('colour tokens', () => {
  const tokens = parseTokens(css);

  it('defines every token the design system names', () => {
    for (const name of [...TEXT_TOKENS, ...SURFACE_TOKENS, 'line', 'paper']) {
      expect(tokens[name], `--c-${name} is missing from tokens.css`).toBeDefined();
    }
  });

  it('pins the accent to the exact copper the spec commits to', () => {
    expect(tokens.copper).toBe('#C87941');
  });

  for (const token of TEXT_TOKENS) {
    for (const surface of SURFACE_TOKENS) {
      it(`--c-${token} clears WCAG AA on --c-${surface}`, () => {
        const ratio = contrastRatio(tokens[token], tokens[surface]);
        expect(
          ratio,
          `--c-${token} (${tokens[token]}) on --c-${surface} is ${ratio.toFixed(2)}:1, below 4.5:1`,
        ).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it('still rejects the pre-review legacy grey, proving the guard works', () => {
    expect(contrastRatio('#6E757A', tokens.raised)).toBeLessThan(4.5);
  });
});

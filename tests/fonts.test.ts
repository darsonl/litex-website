import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const SRC = fileURLToPath(new URL('../src', import.meta.url));
const EXTENSIONS = ['.astro', '.css', '.ts', '.js', '.md'];
const BANNED = [/\bInter\b/i, /\bsystem-ui\b/i, /-apple-system/i, /\bRoboto\b/i, /\bHelvetica\b/i];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return EXTENSIONS.some((e) => full.endsWith(e)) ? [full] : [];
  });
}

describe('typography', () => {
  it('never references a banned font family', () => {
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      const content = readFileSync(file, 'utf8');
      for (const pattern of BANNED) {
        if (pattern.test(content)) offenders.push(`${file} matches ${pattern}`);
      }
    }
    expect(offenders, `Banned fonts found:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('declares both required families as custom properties', () => {
    const css = readFileSync(join(SRC, 'styles/fonts.css'), 'utf8');
    expect(css).toContain('--font-display');
    expect(css).toContain('--font-mono');
    expect(css).toContain('Archivo');
    expect(css).toContain('IBM Plex Mono');
  });

  it('self-hosts rather than calling a font CDN', () => {
    const css = readFileSync(join(SRC, 'styles/fonts.css'), 'utf8');
    expect(css).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit/);
  });
});

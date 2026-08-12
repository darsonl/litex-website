import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';

/** The built site. Every assertion in this suite reads the real build output. */
export const DIST = fileURLToPath(new URL('../../dist', import.meta.url));

export function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

export function allHtmlFiles(): string[] {
  return walk(DIST).filter((f) => f.endsWith('.html'));
}

export function docFor(relativePath: string) {
  return parseHTML(readFileSync(join(DIST, relativePath), 'utf8')).document;
}

/** Maps an internal href to the file Astro's build.format:'directory' emits for it. */
export function routeFile(href: string): string {
  const clean = href.replace(/^\//, '').replace(/\/$/, '');
  return clean === '' ? 'index.html' : `${clean}/index.html`;
}

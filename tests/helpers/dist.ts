import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
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

/**
 * Directories under dist/ that hold an application rather than a page of the LiTex
 * website. They are served from this origin but they are not the site: the CMS shell has
 * no masthead, no footer, no contact details and no h1, and every "on every generated
 * page" guard in this suite means the website when it says page.
 *
 * Adding a directory here is a deliberate act. It exempts everything inside it from the
 * chrome, contact-detail and single-h1 guards, so it needs its own coverage in
 * tests/cms.test.ts instead.
 */
const APP_DIRS = ['admin'];

const isAppFile = (f: string) => APP_DIRS.some((d) => f.includes(`${sep}${d}${sep}`));

/** Every page of the website. Excludes the applications listed in APP_DIRS. */
export function allHtmlFiles(): string[] {
  return walk(DIST).filter((f) => f.endsWith('.html') && !isAppFile(f));
}

/** Only the applications. The complement of allHtmlFiles(). */
export function appHtmlFiles(): string[] {
  return walk(DIST).filter((f) => f.endsWith('.html') && isAppFile(f));
}

export function docFor(relativePath: string) {
  return parseHTML(readFileSync(join(DIST, relativePath), 'utf8')).document;
}

/** Maps an internal href to the file Astro's build.format:'directory' emits for it. */
export function routeFile(href: string): string {
  const clean = href.replace(/^\//, '').replace(/\/$/, '');
  return clean === '' ? 'index.html' : `${clean}/index.html`;
}

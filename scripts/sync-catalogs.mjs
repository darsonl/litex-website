/**
 * Copy the six catalog PDFs out of archive/ and into public/, and record their sizes.
 *
 * Run: node scripts/sync-catalogs.mjs   (npm runs it automatically via `prebuild`)
 *
 * Why a build step rather than committed files: the PDFs total roughly 11 MB and are
 * already versioned under archive/, which is the source of truth for everything on
 * this site. A second committed copy would double that for no reason and could drift
 * from the first. public/catalogs/ is gitignored.
 *
 * The size manifest IS committed, because src/pages/downloads.astro needs it at
 * render time and reading the filesystem from page frontmatter is a sharper edge than
 * a 6-line JSON file. tests/downloads.test.ts fails if it drifts from the archive.
 */
import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FROM = `${ROOT}archive/catalogs`;
const TO = `${ROOT}public/catalogs`;

mkdirSync(TO, { recursive: true });
for (const stale of readdirSync(TO).filter((f) => f.endsWith('.pdf'))) {
  rmSync(`${TO}/${stale}`);
}

const files = readdirSync(FROM).filter((f) => f.endsWith('.pdf')).sort();
const manifest = {};

for (const file of files) {
  copyFileSync(`${FROM}/${file}`, `${TO}/${file}`);
  const bytes = statSync(`${TO}/${file}`).size;
  manifest[file] = { bytes };
  console.log(`${file.padEnd(48)} ${Math.round(bytes / 1024)} KB`);
}

writeFileSync(
  `${ROOT}src/data/catalog-files.json`,
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(`\nCopied ${files.length} catalogs and wrote src/data/catalog-files.json.`);

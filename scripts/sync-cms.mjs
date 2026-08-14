/**
 * Copy the Sveltia CMS bundle out of node_modules and into public/admin/.
 *
 * Run: node scripts/sync-cms.mjs   (npm's "build" runs it before `astro build`, and
 * "predev" before `astro dev`, so it is not left to a lifecycle hook that a different
 * package manager — or `npx astro build` — could skip. Same reasoning as
 * scripts/sync-catalogs.mjs, and the same failure mode if it is skipped: the page
 * loads and the application never appears.)
 *
 * Why vendored rather than loaded from unpkg.com, which is what Sveltia's own docs
 * show: a CDN script is a third-party request, and this site enumerates its third
 * parties on /legal/privacy/ with tests/legal.test.ts enforcing the list. Adding a CDN
 * would either break that guard or quietly make the privacy notice untrue. Self-hosting
 * is also what this site already does for its fonts.
 *
 * ⚠ Copy sveltia-cms.js, NOT sveltia-cms.mjs. The package ships both and its "main"
 * field points at the .mjs, so the .mjs is what a bundler would pick — but public/admin/
 * is served as static files to a browser, and index.html loads this with a plain
 * <script src> tag. The .js build is the IIFE; the .mjs is an ES module and would fail
 * with a syntax error unless the tag also gained type="module". Checked, not assumed.
 *
 * public/admin/sveltia-cms.js is gitignored. package-lock.json is the versioned record.
 */
import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FROM = `${ROOT}node_modules/@sveltia/cms/dist/sveltia-cms.js`;
const TO = `${ROOT}public/admin/sveltia-cms.js`;

if (!statSync(FROM, { throwIfNoEntry: false })) {
  console.error(
    `[sync-cms] ${FROM} is missing. Run \`npm install\` — the CMS bundle comes from the ` +
      `@sveltia/cms dependency, not from a CDN.`,
  );
  process.exit(1);
}

mkdirSync(`${ROOT}public/admin`, { recursive: true });
copyFileSync(FROM, TO);
console.log(`[sync-cms] vendored ${(statSync(TO).size / 1024).toFixed(0)} KB to public/admin/`);

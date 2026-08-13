/**
 * Rasterises public/favicon.svg to public/apple-touch-icon.png at 180x180.
 *
 * Run manually (`npm run favicon`) and commit the output. It is deliberately not part
 * of `npm run build`: the source SVG changes roughly never, and a build-time raster step
 * would put sharp on the critical path of every deploy for no benefit.
 *
 * No .ico is produced. sharp cannot write ICO, and every browser this site targets
 * accepts an SVG icon. A request for /favicon.ico now returns a real 404 — see
 * src/pages/404.astro — which browsers handle silently.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const svg = fileURLToPath(new URL('../public/favicon.svg', import.meta.url));
const png = fileURLToPath(new URL('../public/apple-touch-icon.png', import.meta.url));

// Read into a Buffer first: sharp holds files open on Windows, so streaming from a path
// you may later write beside is a known way to lose an afternoon. See the toolchain
// gotchas in HANDOFF.md.
const source = readFileSync(svg);
const out = await sharp(source).resize(180, 180).png().toBuffer();
writeFileSync(png, out);

console.log(`Wrote ${png} (${out.length} bytes)`);

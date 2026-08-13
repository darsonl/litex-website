/**
 * A minimal static server over dist/, so the accessibility run drives a real browser
 * against the real build.
 *
 * It mirrors Cloudflare's behaviour deliberately: a directory path resolves to its
 * index.html, and anything unmatched gets a 404 with dist/404.html. Serving unmatched
 * paths as the homepage — which is exactly what Cloudflare did before Plan 8 Task 1 —
 * would let a mistyped route pass an accessibility check by silently scanning the
 * homepage a second time.
 *
 * Port 0 lets the OS assign a free port, so parallel runs cannot collide.
 */
import { createServer, type Server } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { DIST } from './dist';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

export type StaticServer = { origin: string; close: () => Promise<void> };

export async function serveDist(): Promise<StaticServer> {
  const server: Server = createServer((req, res) => {
    const path = decodeURIComponent((req.url ?? '/').split('?')[0]);
    let file = join(DIST, path);

    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');

    if (!existsSync(file)) {
      const notFound = join(DIST, '404.html');
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      res.end(existsSync(notFound) ? readFileSync(notFound) : 'Not found');
      return;
    }

    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('server did not bind');

  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))),
  };
}

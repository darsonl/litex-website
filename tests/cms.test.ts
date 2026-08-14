import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { DIST } from './helpers/dist';

describe('the CMS bundle is vendored, not fetched', () => {
  it('ships the Sveltia bundle from our own origin', () => {
    const bundle = join(DIST, 'admin', 'sveltia-cms.js');
    expect(
      existsSync(bundle),
      'dist/admin/sveltia-cms.js is missing — scripts/sync-cms.mjs did not run',
    ).toBe(true);
  });

  // A zero-byte or truncated copy would satisfy existsSync and fail only in a browser,
  // where nobody is looking. The real bundle is a whole SPA; 100 KB is far below its
  // true size and far above any plausible stub.
  it('ships a bundle big enough to actually be the application', () => {
    const kb = statSync(join(DIST, 'admin', 'sveltia-cms.js')).size / 1024;
    expect(kb, `the vendored bundle is only ${kb.toFixed(0)} KB`).toBeGreaterThan(100);
  });

  it('is copied rather than committed, so it cannot drift from package.json', () => {
    const ignored = readFileSync(join(DIST, '..', '.gitignore'), 'utf8');
    expect(ignored, '.gitignore does not exclude the vendored bundle').toContain(
      'public/admin/sveltia-cms.js',
    );
  });
});

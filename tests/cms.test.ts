import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { parse } from 'yaml';
import { DIST, allHtmlFiles, appHtmlFiles, docFor } from './helpers/dist';
import { STORED } from '../src/lib/dates';

function cmsConfig(): any {
  return parse(readFileSync(join(DIST, 'admin', 'config.yml'), 'utf8'));
}

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

describe('the admin app is an application, not a page of the website', () => {
  it('is excluded from the site-page guards', () => {
    const leaked = allHtmlFiles().filter((f) => f.includes('admin'));
    expect(
      leaked,
      `allHtmlFiles() returned admin pages, which will fail the masthead, single-h1,\n` +
        `footer and contact-details guards for a reason that is not a defect:\n${leaked.join('\n')}`,
    ).toEqual([]);
  });

  // The counterpart. If appHtmlFiles() ever returns nothing, the assertions below stop
  // testing anything and would keep passing forever.
  it('is still reachable to the tests that do care about it', () => {
    expect(appHtmlFiles().length, 'the admin app was not built at all').toBe(1);
  });

  it('tells search engines to stay out, in the page and in robots.txt', () => {
    const doc = docFor('admin/index.html');
    expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content')).toContain(
      'noindex',
    );
    const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
    expect(robots, 'robots.txt does not disallow /admin/').toContain('Disallow: /admin/');
  });

  // public/ files are not Astro routes, so the sitemap should never have seen this.
  // Asserted anyway: it costs nothing and would catch someone turning /admin into a page.
  it('never appears in the sitemap', () => {
    const sitemap = readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8');
    expect(sitemap, '/admin/ is being advertised to search engines').not.toContain('/admin');
  });

  // The whole point of Task 1. If someone "fixes" a loading problem by pasting the
  // documented unpkg tag back in, this fails before the privacy guard has to.
  it('loads nothing from another origin', () => {
    const html = readFileSync(join(DIST, 'admin', 'index.html'), 'utf8');
    const absolute = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
    expect(absolute, `the admin shell reaches off-origin:\n${absolute.join('\n')}`).toEqual([]);
  });
});

describe('the CMS config', () => {
  it('points at this repository', () => {
    const { backend } = cmsConfig();
    expect(backend.name).toBe('github');
    expect(backend.repo).toBe('darsonl/litex-website');
  });

  /**
   * The single most important assertion in this file, and it is the inverse of what it
   * used to be.
   *
   * It used to require `publish_mode: editorial_workflow`, on the belief that every save
   * became a pull request whose build enforced the zod rules. Sveltia's own schema says
   * "Editorial Workflow is not yet supported in Sveltia CMS": the option is accepted and
   * does nothing. The assertion passed for weeks while the guarantee did not exist, and
   * the first real save committed straight to main, broke the build with an unquoted
   * timestamp, and froze deploys.
   *
   * So: the key must stay ABSENT, because setting it restores the false confidence rather
   * than the safety. And the CMS must not write to whatever branch deploys.
   */
  it('does not claim an editorial workflow that Sveltia does not implement', () => {
    expect(
      cmsConfig().publish_mode,
      'publish_mode is back. Sveltia ignores it — it does not open pull requests — so ' +
        'this only re-creates the belief that saves are reviewed. The branch below is ' +
        'what actually keeps a bad entry away from production.',
    ).toBeUndefined();
  });

  it('writes to a branch that nothing deploys', () => {
    const { backend } = cmsConfig();
    expect(
      backend.branch,
      'the CMS is committing to the deploy branch. A single bad save then breaks the ' +
        'production build immediately — which is exactly what happened on 2026-08-14.',
    ).not.toBe('main');
    expect(backend.branch, 'no CMS branch is configured at all').toBeTruthy();
  });

  it('offers newest-first sorting on the news collection', () => {
    const news = cmsConfig().collections.find((c: any) => c.name === 'news');
    expect(news.sortable_fields?.fields, 'news cannot be sorted by date').toContain(
      'publishedAt',
    );
    expect(news.sortable_fields?.default?.direction).toBe('descending');
  });

  // Enforcing the imagery policy through absence. Every raster on this site needs a
  // provenance.json entry sourced from archive/ with aiGenerated false, plus the Tier 3
  // real-photography rule in tests/imagery.test.ts. Nothing an editor can upload through
  // a browser satisfies that, so the widgets simply are not offered.
  //
  // Asserted against the PARSED config, not the raw text. config.yml has to name the
  // settings it is refusing in order to explain why, and a string-containment check over
  // the source fails on its own explanation — the same collision this repo hit three
  // times in Plan 8 (the _redirects header comment, the 404 title, the favicon note).
  // Guard what the machine reads. Walking the field tree also catches an upload widget
  // nested inside specTable, which a flat text scan would only catch by luck.
  // ⚠ This deliberately does NOT assert that media_folder is absent, and the reason is a
  // shipped defect. It used to. Sveltia treats media_folder as required and replaces the
  // whole application with "The media folder is not defined." when it is missing, so that
  // assertion enforced a config the CMS refuses to run — and every test here passed while
  // /admin was unusable, because they all read the config as data and none of them ever
  // loaded the page. tests/cms-boot.test.ts now does.
  //
  // The policy is unchanged; what changed is where it is enforced. A media folder must
  // exist, so the guard is on the WIDGETS: with no image or file field anywhere, nothing
  // an editor uploads can be attached to an entry.
  it('offers no way to upload an image', () => {
    const config = cmsConfig();

    // Pointed away from src/assets/, where every raster is tracked in a provenance.json
    // and checked by tests/imagery.test.ts, and away from public/, so a stray upload
    // cannot reach the built site.
    expect(config.media_folder, 'Sveltia will not start without a media folder').toBeTruthy();
    expect(
      config.media_folder,
      'the media folder points into the provenance-tracked asset tree or into public/',
    ).not.toMatch(/^(src\/assets|public)\b/);

    const widgets: string[] = [];
    const collect = (fields: any[] | undefined) => {
      for (const f of fields ?? []) {
        if (f.widget) widgets.push(f.widget);
        collect(f.fields);
        if (f.field) collect([f.field]);
      }
    };
    for (const collection of config.collections) {
      expect(
        collection.media_folder,
        `the ${collection.name} collection declares its own media folder`,
      ).toBeUndefined();
      collect(collection.fields);
    }

    for (const banned of ['image', 'file']) {
      expect(
        widgets,
        `a "${banned}" widget is offered — see the imagery policy`,
      ).not.toContain(banned);
    }
  });

  it('mirrors the product schema field for field', () => {
    const products = cmsConfig().collections.find((c: any) => c.name === 'products');
    expect(products, 'no products collection').toBeTruthy();
    expect(products.folder).toBe('src/content/products');

    const names = products.fields.map((f: any) => f.name);
    for (const key of [
      'name', 'status', 'summary', 'applications', 'certifications',
      'catalogPdf', 'specTable', 'sourceNote', 'needsVerification', 'body',
    ]) {
      expect(names, `the products collection is missing ${key}`).toContain(key);
    }
    // heroImage is absent on purpose, not by oversight.
    expect(names, 'heroImage must not be editable — see the imagery policy').not.toContain(
      'heroImage',
    );
  });

  it('offers exactly the statuses and certifications the schema accepts', () => {
    const products = cmsConfig().collections.find((c: any) => c.name === 'products');
    const byName = (n: string) => products.fields.find((f: any) => f.name === n);
    expect(byName('status').options).toEqual(['active', 'legacy']);
    expect(byName('certifications').options).toEqual(['REACH', 'RoHS', 'SGS']);
  });

  // summary doubles as the meta description and the schema caps it at 160. A CMS that
  // let an editor type 400 characters would produce an entry that fails the build.
  it('caps summary at the length the schema caps it at', () => {
    const products = cmsConfig().collections.find((c: any) => c.name === 'products');
    const summary = products.fields.find((f: any) => f.name === 'summary');
    expect(summary.maxlength).toBe(160);
  });
});

/**
 * The blind spot created by leaving heroImage out of the CMS.
 *
 * config.yml has no heroImage field, by policy. The open question — which no test in
 * this repo can answer, because it depends on what Sveltia's serializer does with
 * front-matter keys it has no field for — is whether saving a product through the CMS
 * PRESERVES heroImage or silently drops it.
 *
 * If it drops it, nothing else would notice: heroImage is .optional() in
 * src/schemas/product.ts, so the entry still validates, the build still succeeds, and a
 * product page just quietly loses its photograph. That is the exact shape of failure
 * this repo keeps guarding against.
 *
 * Every product has one today, so requiring it costs nothing and turns a silent
 * regression into a red check on the pull request the CMS opens — which is the whole
 * safety-net argument for editorial_workflow. Task 4 Step 6's human round-trip is what
 * actually answers the question; this is what catches it if the answer is bad.
 */
describe('the fields the CMS cannot edit survive the fields it can', () => {
  const PRODUCTS = fileURLToPath(new URL('../src/content/products', import.meta.url));

  it('keeps a heroImage on every product entry', () => {
    const entries = readdirSync(PRODUCTS).filter((f) => f.endsWith('.md'));
    expect(entries.length, 'no product entries found').toBeGreaterThan(0);

    const missing = entries.filter(
      (f) => !/^heroImage:/m.test(readFileSync(join(PRODUCTS, f), 'utf8')),
    );
    expect(
      missing,
      'a product lost its heroImage. The CMS has no field for it, so the most likely\n' +
        'cause is a CMS save dropping front matter it does not know about — see\n' +
        'docs/cms.md. The schema makes it optional, so nothing else will fail:\n' +
        `${missing.join('\n')}`,
    ).toEqual([]);
  });
});

describe('the CMS config — applications and news', () => {
  const find = (name: string) =>
    cmsConfig().collections.find((c: any) => c.name === name);

  it('mirrors the application schema', () => {
    const apps = find('applications');
    expect(apps.folder).toBe('src/content/applications');
    const names = apps.fields.map((f: any) => f.name);
    for (const key of ['name', 'summary', 'evidence', 'needsDetail', 'body']) {
      expect(names, `applications is missing ${key}`).toContain(key);
    }
  });

  it('keeps evidence required, because an unevidenced end-use is the whole risk', () => {
    const evidence = find('applications').fields.find((f: any) => f.name === 'evidence');
    expect(evidence.required, 'evidence must stay required').not.toBe(false);
  });

  it('mirrors the news schema', () => {
    const news = find('news');
    expect(news.folder).toBe('src/content/news');
    const names = news.fields.map((f: any) => f.name);
    for (const key of [
      'title', 'publishedAt', 'summary', 'sourceUrl', 'sourceNote',
      'relatedProducts', 'externalLinks', 'body',
    ]) {
      expect(names, `news is missing ${key}`).toContain(key);
    }
    expect(names, 'news imagery must not be editable').not.toContain('image');
  });

  // The trap this task exists for. A datetime widget would be the obvious choice and is
  // the wrong one: YAML turns an unquoted timestamp into a Date, and src/schemas/news.ts
  // requires a STRING matching src/lib/dates.ts's own regex. A string widget with the
  // same pattern keeps the CMS and the schema agreeing on one definition.
  it('validates publishedAt with the same regex the schema uses', () => {
    const field = find('news').fields.find((f: any) => f.name === 'publishedAt');
    expect(field.widget, 'a datetime widget will write a value the schema rejects').toBe(
      'string',
    );
    const [pattern] = field.pattern;
    expect(
      new RegExp(pattern).source,
      'the CMS pattern has drifted from STORED in src/lib/dates.ts',
    ).toBe(STORED.source);
  });

  // Proves the pattern admits what the site already publishes, rather than merely
  // being identical to a regex that might itself be wrong.
  it('accepts the timestamps already in the repository', () => {
    const field = find('news').fields.find((f: any) => f.name === 'publishedAt');
    const re = new RegExp(field.pattern[0]);
    expect(re.test('2017-02-23T14:47:55+08:00')).toBe(true);
    expect(re.test('2017-02-23 14:47:55')).toBe(false);
  });
});

/**
 * The normalizer that keeps the CMS's output loadable.
 *
 * Sveltia writes `publishedAt: 2026-08-14T10:30:00+08:00` unquoted. YAML auto-types that
 * as a timestamp, Astro hands the schema a Date, and src/schemas/news.ts rejects it
 * because a Date has already discarded the +08:00 offset. That is not hypothetical: it
 * took production down on 2026-08-14, the first time a post was saved through the CMS.
 *
 * scripts/normalize-frontmatter.mjs quotes it, and runs as part of `npm run build`.
 */
describe('the news front matter the CMS writes stays loadable', () => {
  const NEWS = fileURLToPath(new URL('../src/content/news', import.meta.url));
  const entries = () => readdirSync(NEWS).filter((f) => f.endsWith('.md'));

  it('has every publishedAt quoted after a build', () => {
    const unquoted = entries().filter((f) =>
      /^publishedAt:[ \t]*\d{4}-\d{2}-\d{2}T/m.test(readFileSync(join(NEWS, f), 'utf8')),
    );
    expect(
      unquoted,
      'an unquoted publishedAt survived the build. YAML will parse it into a Date and ' +
        'the schema will reject it, failing the build for the whole site:\n' +
        unquoted.join('\n'),
    ).toEqual([]);
  });

  // Guards the guard. If the normalizer stopped running, the assertion above would still
  // pass on a repository whose files happen to be quoted already, and would only fail
  // later, on someone else's machine, after a CMS edit.
  it('runs the normalizer as part of the build', () => {
    const pkg = JSON.parse(readFileSync(join(DIST, '..', 'package.json'), 'utf8'));
    expect(pkg.scripts.build, 'the build does not normalize front matter').toContain(
      'normalize-frontmatter',
    );
  });
});

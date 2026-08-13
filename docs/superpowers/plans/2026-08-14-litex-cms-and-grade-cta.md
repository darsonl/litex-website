# Plan 9 — Sveltia CMS at `/admin`, and the SpecTable "Request this grade" CTA

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give LiTex a browser-based editor for the three content collections at `/admin`, without letting it violate any invariant the build already enforces — and ship the spec-table CTA that spec §5 has always listed and no plan has built.

**Architecture:** Sveltia CMS is a single-page app configured entirely by one `config.yml`. It is **vendored into the build from npm**, never loaded from a CDN, because this site's privacy notice enumerates its third parties and a `unpkg.com` script would silently make that notice untrue. Editing goes through **Editorial Workflow**, so every save becomes a pull request whose Cloudflare Pages preview build must succeed — that build is what enforces the cross-field rules a YAML config cannot express. Image fields are deliberately absent from the CMS.

**Tech Stack:** Astro 7.2.0 (static, `build.format: 'directory'`), `@sveltia/cms` (vendored), vitest 4.1.10 + linkedom, Cloudflare Pages.

---

## Research already done — do not re-derive

Verified against live documentation on **2026-08-14**. Re-verify only if much time has passed.

| Claim | Status |
|---|---|
| Sveltia needs a GitHub OAuth backend, deployed as a second Cloudflare Worker | **FALSE, and this is the plan's biggest simplification.** Sveltia supports **personal access token** sign-in: the login screen has a "Sign In with Token" button that links to GitHub's token page with the scopes pre-selected. **No OAuth app, no proxy, no second deployable, and no config for it.** Earlier notes in `HANDOFF.md` said otherwise; they were written before anyone checked. |
| Config location | `public/admin/config.yml`, beside `index.html` |
| Minimum backend config | `backend:` with `name: github` and `repo: owner/repo` — that is all |
| Editorial Workflow | **Implemented**, listed as one of two production workflows. Adds a review/approval stage before merge. |
| Install | Documented as `<script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>`. **We do not do this** — see Task 1. No `type="module"`, no stylesheet: styles are bundled in the JS. |
| Fields are required by default | Yes. `required: false` opts out. |
| `pattern` option | Supported on string-type fields: `pattern: ['regex', 'message']` |

Sources: <https://sveltiacms.app/en/docs/start>, <https://sveltiacms.app/en/docs/backends/github>, <https://sveltiacms.app/en/docs/collections>, <https://sveltiacms.app/en/docs/workflows>, <https://sveltiacms.app/en/docs/fields>, <https://github.com/sveltia/sveltia-cms-auth>

---

## Global Constraints

Every task's requirements implicitly include this section.

- **Node `>=22.12.0`.** Exact-pinned dependencies — this repo uses no `^` ranges. Install with `--save-exact`.
- **`npm run build` is `node scripts/sync-catalogs.mjs && astro build`.** Never `npx astro build`.
- **Run `npx playwright install chromium` once** on a fresh checkout or `npm test` fails with a missing-executable error rather than a test failure.
- **Branch before committing.** Never commit to `main`. One PR for the plan, or one per task.
- **Baseline to preserve:** `npm run build` → **36 pages** (37 after Task 2 adds no route — see note). `npm test` → **393 passing across 25 files**. `npm run test:a11y` → **11 passing**. Detector clean.
- **No third-party resource may ship undisclosed.** `tests/legal.test.ts` holds `DISCLOSED`, which contains exactly the Turnstile API URL and the Cloudflare Insights beacon. **Do not add a third entry in this plan.** If you think you need one, you have taken a wrong turn.
- **No SRI hash on the Turnstile or analytics script.** Unversioned endpoints that roll in place; a pinned hash guarantees silent breakage. On the record in Plan 7 and `docs/deployment.md`.
- **Never let `1x00000000000000000000AA`** (the always-passes Turnstile test sitekey) reach a built page. A test fails the build if it does.
- **Never let `1M545145` or the string `PATENTED`** reach a built page.
- **Imagery is not editable in this plan.** Every raster needs a `provenance.json` entry sourced from `archive/` with `aiGenerated: false`, and `tests/imagery.test.ts` enforces a Tier 3 real-photography rule. No CMS upload can satisfy that, so **no `image` or `file` widget appears anywhere in `config.yml`.**

---

## File Structure

| File | Responsibility |
|---|---|
| `scripts/sync-cms.mjs` | **Create.** Copies the Sveltia bundle out of `node_modules` into `public/admin/`. Mirrors `scripts/sync-catalogs.mjs` exactly. |
| `package.json` | **Modify.** Add `@sveltia/cms` exact-pinned; add `sync-cms` to `build` and `predev`. |
| `.gitignore` | **Modify.** Ignore the vendored bundle, as `public/catalogs/` already is. |
| `public/admin/index.html` | **Create.** The CMS shell. Static, `noindex`, no absolute URLs. |
| `public/admin/config.yml` | **Create.** Backend, workflow, and all three collections. |
| `public/robots.txt` | **Modify.** `Disallow: /admin/`. |
| `tests/helpers/dist.ts` | **Modify.** Teach `allHtmlFiles()` that `/admin` is an application, not a site page. |
| `tests/cms.test.ts` | **Create.** Every guard about the admin app and its config. |
| `src/components/SpecTable.astro` | **Modify.** Add the "Request this grade" CTA. |
| `src/lib/enquiry.ts` | **Modify.** Export `PREFILLABLE`, the allowlist of fields a query string may fill. |
| `src/components/EnquiryForm.astro` | **Modify.** Client-side prefill from the query string. |
| `tests/enquiry.test.ts` | **Modify.** Cover `PREFILLABLE`. |
| `tests/contact.test.ts` | **Modify.** Cover the rendered CTA and the prefill script. |
| `docs/cms.md` | **Create.** How LiTex signs in and what the CMS deliberately cannot do. |

**Note on page count:** `public/` files are copied verbatim and are **not Astro routes**, so `/admin` does not appear in the sitemap and the "36 pages built" line does not change. Task 2 asserts both.

---

## Task 1: Vendor the Sveltia bundle into the build

Loading the CMS from `unpkg.com` would put a third-party script on a page this site serves, which `tests/legal.test.ts` exists to prevent and `/legal/privacy/` would have to disclose. Vendoring keeps the guard honest and matches how the catalog PDFs and the web fonts are already handled.

**Files:**
- Create: `scripts/sync-cms.mjs`
- Modify: `package.json`, `.gitignore`
- Test: `tests/cms.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `public/admin/sveltia-cms.js` at build time, therefore `dist/admin/sveltia-cms.js` in the build. Task 2's `index.html` loads it at the **relative** path `sveltia-cms.js`.

- [ ] **Step 1: Install the dependency, exact-pinned**

```bash
npm install --save-dev --save-exact @sveltia/cms
```

Then open `package.json` and confirm the entry has **no `^`**, matching every other dependency in the file. Record the resolved version — you will quote it in Step 8's commit message.

- [ ] **Step 2: Write the failing test**

Create `tests/cms.test.ts`:

```typescript
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
    const ignored = readFileSync(
      join(DIST, '..', '.gitignore'),
      'utf8',
    );
    expect(ignored, '.gitignore does not exclude the vendored bundle').toContain(
      'public/admin/sveltia-cms.js',
    );
  });
});
```

- [ ] **Step 3: Run the test and watch all three fail**

```bash
npx vitest run tests/cms.test.ts
```

Expected: 3 failed. The first two fail because `dist/admin/sveltia-cms.js` does not exist; the third because `.gitignore` has no such line.

- [ ] **Step 4: Write the sync script**

Create `scripts/sync-cms.mjs`:

```javascript
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
```

- [ ] **Step 5: Wire it into the build**

In `package.json`, change the two lifecycle scripts so the CMS sync runs everywhere the catalog sync already does:

```json
"predev": "node scripts/sync-catalogs.mjs && node scripts/sync-cms.mjs",
"build": "node scripts/sync-catalogs.mjs && node scripts/sync-cms.mjs && astro build",
```

- [ ] **Step 6: Ignore the vendored copy**

In `.gitignore`, directly beneath the existing `public/catalogs/` block, add:

```
# The Sveltia CMS bundle, copied out of node_modules by scripts/sync-cms.mjs at build
# time. package-lock.json is the versioned record of which version that is; a committed
# copy would drift from it silently.
public/admin/sveltia-cms.js
```

- [ ] **Step 7: Build, then run the test and watch it pass**

```bash
npm run build && npx vitest run tests/cms.test.ts
```

Expected: `[sync-cms] vendored … KB to public/admin/`, then 3 passed. Then confirm nothing else moved:

```bash
npm test
```

Expected: **396 passing across 26 files** (393 + the 3 new).

- [ ] **Step 8: Commit**

```bash
git checkout -b feat/plan-9-cms
git add package.json package-lock.json .gitignore scripts/sync-cms.mjs tests/cms.test.ts
git commit -m "feat: vendor the Sveltia CMS bundle instead of loading it from a CDN

Sveltia's own docs load the bundle from unpkg.com. This site enumerates its
third parties on /legal/privacy/ and tests/legal.test.ts enforces that list, so
a CDN script would either break the guard or make the privacy notice untrue.
Vendored from the npm package at build time, the same way the catalog PDFs and
the web fonts already are.

The copy is gitignored; package-lock.json is the versioned record."
```

---

## Task 2: The `/admin` shell, and teaching the suite it is not a site page

`tests/helpers/dist.ts` currently returns **every** `.html` file in `dist/`, and several guards read "every generated page" to mean "every page of the LiTex website" — masthead present, exactly one `h1`, footer present, contact details present. A bare CMS shell has none of those. Without this task, adding `/admin` turns four passing guards red for a reason that is not a defect.

**Files:**
- Create: `public/admin/index.html`
- Modify: `tests/helpers/dist.ts`, `public/robots.txt`, `tests/cms.test.ts`
- Test: `tests/cms.test.ts`

**Interfaces:**
- Consumes: `dist/admin/sveltia-cms.js` from Task 1.
- Produces: `allHtmlFiles()` — unchanged signature `(): string[]`, now excluding the admin app. New export `appHtmlFiles(): string[]` returning only it. Task 3 relies on `dist/admin/config.yml` existing beside `index.html`.

- [ ] **Step 1: Write the failing test**

Append to `tests/cms.test.ts`:

```typescript
import { allHtmlFiles, appHtmlFiles, docFor } from './helpers/dist';

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
```

- [ ] **Step 2: Run the test and watch it fail**

```bash
npx vitest run tests/cms.test.ts
```

Expected: FAIL — `appHtmlFiles` is not exported from `./helpers/dist` (an import error), plus the admin page does not exist. Fix the import error first by doing Step 3, then re-run to see the real assertion failures before Step 4.

- [ ] **Step 3: Split site pages from app pages**

In `tests/helpers/dist.ts`, add `sep` to the `node:path` import and replace `allHtmlFiles`:

```typescript
import { join, sep } from 'node:path';

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
```

- [ ] **Step 4: Write the admin shell**

Create `public/admin/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>LiTex content editor</title>
  </head>
  <body>
    <!--
      Vendored by scripts/sync-cms.mjs, deliberately NOT the unpkg.com URL in Sveltia's
      documentation. A third-party script here would have to be added to DISCLOSED in
      tests/legal.test.ts and to /legal/privacy/, and the privacy notice would stop being
      true the moment someone forgot. The path is relative so it works unchanged on
      litex-website.pages.dev and on litex.com.tw after the domain cutover.

      No type="module" and no stylesheet link: Sveltia bundles its styles into the JS.
    -->
    <script src="sveltia-cms.js"></script>
  </body>
</html>
```

- [ ] **Step 5: Keep crawlers out**

In `public/robots.txt`, add before any `Sitemap:` line:

```
# The content editor. Not secret — it is useless without a GitHub account holding write
# access to the repository — but there is nothing here for a search engine to index.
Disallow: /admin/
```

- [ ] **Step 6: Build, then run the test and watch it pass**

```bash
npm run build && npx vitest run tests/cms.test.ts
```

Expected: 8 passed. Then the whole suite:

```bash
npm test
```

Expected: **401 passing across 26 files**, and critically **no failures in `tests/chrome.test.ts`** — that file is the one the helper split protects. Confirm the build still says **36 page(s) built**: `/admin` is a static file, not a route.

- [ ] **Step 7: Commit**

```bash
git add public/admin/index.html public/robots.txt tests/helpers/dist.ts tests/cms.test.ts
git commit -m "feat: add the /admin shell and separate app pages from site pages

tests/helpers/dist.ts returned every .html in dist/, and four guards read 'every
generated page' to mean every page of the LiTex website — masthead, footer,
contact details, exactly one h1. A CMS shell has none of those, so adding /admin
would have turned those guards red for a reason that is not a defect.

allHtmlFiles() now excludes APP_DIRS and appHtmlFiles() returns only them, so the
exemption is explicit and the admin app gets its own coverage rather than an
exception buried in a filter."
```

---

## Task 3: `config.yml` — backend, workflow, and the products collection

**Files:**
- Create: `public/admin/config.yml`
- Modify: `tests/cms.test.ts`
- Test: `tests/cms.test.ts`

**Interfaces:**
- Consumes: the admin shell from Task 2.
- Produces: a `collections:` array whose first entry is `products`. Task 4 appends `applications` and `news` to the same array.

**Schema being mirrored** — read from `src/schemas/product.ts`, do not re-derive:

| Front-matter key | Zod | CMS widget |
|---|---|---|
| `name` | `z.string()` | `string`, required |
| `status` | `z.enum(['active','legacy'])` | `select`, required |
| `summary` | `z.string().max(160)` | `text`, required, `maxlength: 160` |
| `applications` | `z.array(reference('applications'))`, default `[]` | `relation`, multiple, `required: false` |
| `certifications` | `z.array(z.enum(['REACH','RoHS','SGS']))`, default `[]` | `select` multiple, `required: false` |
| `catalogPdf` | `z.string().optional()` | `string`, `required: false` |
| `specTable` | `{columns:[{key,label,unit?}], rows:[record<string,string>]}` | `object` → `list` + `list`/`keyvalue`, `required: false` |
| `heroImage` | `{src: image(), alt, aiGenerated}` | **omitted — see Global Constraints** |
| `sourceNote` | `z.string().optional()` | `string`, `required: false` |
| `needsVerification` | `z.boolean()`, default `false` | `boolean`, `required: false`, default `false` |

- [ ] **Step 1: Write the failing test**

Append to `tests/cms.test.ts`:

```typescript
import { parse } from 'yaml';

function cmsConfig(): any {
  return parse(readFileSync(join(DIST, 'admin', 'config.yml'), 'utf8'));
}

describe('the CMS config', () => {
  it('points at this repository', () => {
    const { backend } = cmsConfig();
    expect(backend.name).toBe('github');
    expect(backend.repo).toBe('darsonl/litex-website');
  });

  // The single most important line in the file. The zod schemas carry rules no YAML
  // config can express — a specTable requires a sourceNote, a heroImage may not be AI
  // generated, publishedAt must be a real calendar date. Editorial Workflow turns every
  // save into a pull request, so the Cloudflare Pages preview build is what catches all
  // of them, before anything reaches production.
  it('routes every edit through a pull request rather than straight to main', () => {
    expect(
      cmsConfig().publish_mode,
      'without editorial_workflow a bad entry commits directly to main and breaks the ' +
        'production build, because the CMS cannot enforce the schema superRefine rules',
    ).toBe('editorial_workflow');
  });

  // Enforcing the imagery policy through absence. Every raster on this site needs a
  // provenance.json entry sourced from archive/ with aiGenerated false, plus the Tier 3
  // real-photography rule in tests/imagery.test.ts. Nothing an editor can upload through
  // a browser satisfies that, so the widgets simply are not offered.
  it('offers no way to upload an image', () => {
    const raw = readFileSync(join(DIST, 'admin', 'config.yml'), 'utf8');
    for (const widget of ['widget: image', 'widget: file', 'media_folder']) {
      expect(raw, `config.yml contains "${widget}" — see the imagery policy`).not.toContain(
        widget,
      );
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
```

- [ ] **Step 2: Add the YAML parser**

`yaml` is not yet a dependency. Install it exact-pinned:

```bash
npm install --save-dev --save-exact yaml
```

- [ ] **Step 3: Run the test and watch it fail**

```bash
npx vitest run tests/cms.test.ts
```

Expected: FAIL — `ENOENT` on `dist/admin/config.yml`.

- [ ] **Step 4: Write the config**

Create `public/admin/config.yml`:

```yaml
# yaml-language-server: $schema=https://unpkg.com/@sveltia/cms/schema/sveltia-cms.json
#
# The LiTex content editor.
#
# ⚠ This file mirrors the zod schemas in src/schemas/. When one changes, change both —
# tests/cms.test.ts fails if a field disappears from here, but it cannot notice a field
# you added to zod and forgot to add here. That one shows up as a CMS that silently
# cannot edit something.
#
# ⚠ There is deliberately no media_folder and no image or file widget. Every raster on
# this site needs an entry in the relevant assets/provenance.json, traced to archive/ and
# declared aiGenerated: false, and tests/imagery.test.ts enforces a real-photography rule
# on product, company and technology pages. A browser upload cannot satisfy any of that,
# so imagery stays a code-review path. Adding a widget here would let an editor produce a
# commit that fails the build with no idea why.
#
# The $schema comment above is read by editors like VS Code for completion. It is a
# comment: it is not fetched by the browser, so it is not a third-party request and does
# not belong in DISCLOSED.

backend:
  name: github
  repo: darsonl/litex-website
  branch: main

# Every save becomes a pull request instead of a commit to main.
#
# This is the safety net for everything the config below cannot express. The zod schemas
# carry cross-field rules — a specTable requires a sourceNote, publishedAt must be a real
# calendar date and not just a well-formed one, a heroImage may not be AI generated — and
# no YAML config can enforce those. What CAN enforce them is the build, and Cloudflare
# Pages builds every pull request. So a bad entry fails a visible check on a PR rather
# than breaking production the moment someone clicks Save.
publish_mode: editorial_workflow

collections:
  - name: products
    label: Products
    label_singular: Product
    folder: src/content/products
    create: true
    extension: md
    format: yaml-frontmatter
    identifier_field: name
    fields:
      - { name: name, label: Product name, widget: string }

      - name: status
        label: Status
        widget: select
        options: ['active', 'legacy']
        hint: >-
          legacy keeps the page and its search value while telling buyers it is
          sampling-only. It is not a soft delete.

      - name: summary
        label: Summary
        widget: text
        maxlength: 160
        hint: >-
          Also used as the page's meta description, which is why it is capped at 160
          characters. Say what the product is, not that it is high quality.

      - name: applications
        label: Applications
        widget: relation
        collection: applications
        value_field: '{{slug}}'
        display_fields: ['name']
        search_fields: ['name', 'summary']
        multiple: true
        required: false

      - name: certifications
        label: Certifications
        widget: select
        options: ['REACH', 'RoHS', 'SGS']
        multiple: true
        required: false
        hint: >-
          Only what LiTex has already claimed in its own catalogs. Adding one requires
          evidence, not optimism.

      - name: catalogPdf
        label: Catalog PDF filename
        widget: string
        required: false
        hint: >-
          A filename inside archive/catalogs/, e.g.
          2018-non-carbon-electrical-heating-textile.pdf — not a URL.

      - name: specTable
        label: Specification table
        widget: object
        required: false
        collapsed: true
        fields:
          - name: columns
            label: Columns
            widget: list
            fields:
              - { name: key, label: Key, widget: string, hint: Must match the key used in every row. }
              - { name: label, label: Heading, widget: string }
              - { name: unit, label: Unit, widget: string, required: false }
          - name: rows
            label: Rows
            widget: list
            hint: >-
              One entry per row. Each key must match a column key above; values are
              always text, never numbers, so tolerances like 0.27±0.02 survive.
            field: { name: row, label: Row, widget: keyvalue }

      - name: sourceNote
        label: Source note
        widget: string
        required: false
        hint: >-
          Required whenever there is a specification table — name the document the
          figures came from. The build rejects a table without one.

      - name: needsVerification
        label: Figures still need checking
        widget: boolean
        required: false
        default: false
        hint: Renders a visible warning under the table. Leave off unless it is true.

      - { name: body, label: Page body, widget: markdown, required: false }
```

- [ ] **Step 5: Build, then run the test and watch it pass**

```bash
npm run build && npx vitest run tests/cms.test.ts
```

Expected: 14 passed.

- [ ] **Step 6: Commit**

```bash
git add public/admin/config.yml package.json package-lock.json tests/cms.test.ts
git commit -m "feat: configure the CMS backend, editorial workflow and products

Editorial Workflow is the load-bearing choice: the zod schemas carry cross-field
rules no YAML config can express, so every save becomes a pull request and the
Cloudflare Pages preview build is what enforces them. A bad entry fails a check
on a PR instead of breaking production on Save.

No media_folder and no image widget, enforced by a test. Every raster needs a
provenance entry traced to archive/ plus the Tier 3 real-photography rule, and
nothing uploaded through a browser can satisfy that."
```

---

## Task 4: The applications and news collections

`news` carries the plan's one genuine unknown. `publishedAt` is a **string** with a strict regex, deliberately — YAML parses an unquoted `2017-02-23T14:54:11+08:00` into a `Date`, which would defeat `src/lib/dates.ts` entirely. A `datetime` widget invites exactly that. Use `string` with a `pattern` so the CMS enforces the shape and the value is unambiguously text.

**Files:**
- Modify: `public/admin/config.yml`, `tests/cms.test.ts`
- Test: `tests/cms.test.ts`

**Interfaces:**
- Consumes: the `collections:` array from Task 3.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Write the failing test**

Append to `tests/cms.test.ts`:

```typescript
import { STORED } from '../src/lib/dates';

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
```

- [ ] **Step 2: Run the test and watch it fail**

```bash
npx vitest run tests/cms.test.ts
```

Expected: FAIL — `find('applications')` is `undefined`, so reading `.folder` throws.

- [ ] **Step 3: Append both collections**

Add to the `collections:` array in `public/admin/config.yml`, after `products`:

```yaml
  - name: applications
    label: Applications
    label_singular: Application
    folder: src/content/applications
    create: true
    extension: md
    format: yaml-frontmatter
    identifier_field: name
    fields:
      - { name: name, label: Application name, widget: string }
      - { name: summary, label: Summary, widget: text, maxlength: 160 }
      - name: evidence
        label: Evidence
        widget: string
        hint: >-
          Where LiTex itself claims this end-use — a catalog page, a news post, an
          exhibition. Required: publishing an unevidenced application fails exactly the
          diligence a serious buyer applies.
      - name: needsDetail
        label: Still needs detail
        widget: boolean
        required: false
        default: false
      - { name: body, label: Page body, widget: markdown, required: false }

  - name: news
    label: News
    label_singular: Post
    folder: src/content/news
    create: true
    extension: md
    format: yaml-frontmatter
    identifier_field: title
    fields:
      - { name: title, label: Title, widget: string }

      # ⚠ A string, not a datetime widget, and this is deliberate.
      #
      # src/schemas/news.ts requires publishedAt to be a STRING matching the STORED regex
      # in src/lib/dates.ts. YAML parses an unquoted 2017-02-23T14:47:55+08:00 into a Date
      # object, which is precisely what that schema exists to prevent — the whole date
      # layer stores calendar fields as text so a timezone cannot silently shift a
      # published date. A datetime widget invites the CMS to write the value that breaks
      # it. The pattern below is the same regex, and tests/cms.test.ts fails if the two
      # ever drift.
      - name: publishedAt
        label: Published at
        widget: string
        pattern:
          - '^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$'
          - 'Must be ISO 8601 with an offset, e.g. 2017-02-23T14:47:55+08:00'
        hint: 'Taiwan is +08:00. Example: 2017-02-23T14:47:55+08:00'

      - { name: summary, label: Summary, widget: text, maxlength: 160 }

      - name: sourceUrl
        label: Original URL
        widget: string
        hint: The WordPress permalink this was republished from. Must be a full URL.

      - name: sourceNote
        label: Source note
        widget: string
        hint: >-
          What was changed in republishing, and what was left out. Never optional — it is
          what keeps the archive honest.

      - name: relatedProducts
        label: Related products
        widget: relation
        collection: products
        value_field: '{{slug}}'
        display_fields: ['name']
        search_fields: ['name', 'summary']
        multiple: true
        required: false

      - name: externalLinks
        label: External links
        widget: list
        required: false
        fields:
          - { name: label, label: Label, widget: string }
          - { name: href, label: URL, widget: string }

      - { name: body, label: Post body, widget: markdown, required: false }
```

- [ ] **Step 4: Build, then run the test and watch it pass**

```bash
npm run build && npx vitest run tests/cms.test.ts && npm test
```

Expected: `tests/cms.test.ts` 19 passed; full suite **406 passing across 26 files**.

- [ ] **Step 5: Commit**

```bash
git add public/admin/config.yml tests/cms.test.ts
git commit -m "feat: add the applications and news collections to the CMS

publishedAt uses a string widget with a pattern rather than a datetime widget.
src/schemas/news.ts requires a string matching STORED, and YAML parses an
unquoted timestamp into a Date — which is the exact failure the date layer
exists to prevent. A test fails if the CMS pattern drifts from STORED."
```

- [ ] **Step 6: ⚠ Round-trip check — needs a human and a browser**

Nothing above proves what Sveltia actually **writes**. The risk is narrow and specific: a YAML serializer may emit `publishedAt: 2017-02-23T14:47:55+08:00` **unquoted**, which Astro then parses as a `Date` and the schema rejects with *"expected string, received date"*.

Ask the human to:

1. Sign in at `/admin` (Sign In with Token → GitHub PAT).
2. Create a news post with a valid `publishedAt` and save it. Editorial Workflow opens a PR.
3. **Look at the diff.** If the value is quoted (`publishedAt: '2017-…'`) it is correct. If unquoted, the Cloudflare Pages check on that PR will fail — which is the safety net working, not a surprise.

**If it writes unquoted**, the fix is a normalizer, not a schema loosening: add a `scripts/normalize-frontmatter.mjs` step that quotes the value, and record why. **Do not relax the regex or accept a `Date`** — `src/lib/dates.ts` exists because a timezone silently shifting a published date is a real defect this site already fixed once.

---

## Task 5: The SpecTable "Request this grade" CTA

Spec §5 lists four things the signature component carries: a provenance note, **Copy as CSV**, **Datasheet PDF**, and **Request this grade**. The first three ship. This is the fourth.

**Design decision, made and recorded:** one CTA per table, not one per row. A per-row "Request" link matches the spec's wording most literally and was considered, but it means a column that must then be excluded from the CSV export — and `Copy as CSV` is the component's most valuable feature for the engineer this site is written for. Corrupting the copy path to gain a link is a bad trade. The CTA carries the product forward and the sample form asks for the grade, whose hint already names the covering counts.

**Files:**
- Modify: `src/components/SpecTable.astro`, and the pages that render it
- Test: `tests/contact.test.ts`

**Interfaces:**
- Consumes: nothing from Tasks 1–4.
- Produces: `SpecTable` gains a required prop `productName: string`. **Every page rendering `<SpecTable>` must pass it** — the build fails otherwise, which is the intended forcing function.

- [ ] **Step 1: Find every call site**

```bash
grep -rn "<SpecTable" src/
```

Note each file. You will edit all of them in Step 4.

- [ ] **Step 2: Write the failing test**

Append to `tests/contact.test.ts`:

```typescript
describe('the spec table asks for a sample', () => {
  it('offers a Request this grade link beside Copy as CSV', () => {
    const doc = docFor('products/conductive-metal-yarn/index.html');
    const cta = doc.querySelector('[data-request-grade]');
    expect(cta, 'the spec table has no Request this grade CTA').toBeTruthy();
    expect(cta?.textContent).toContain('Request this grade');
  });

  // The point of the CTA is that the engineer does not retype what they were just
  // reading. A bare link to the form would be a link to the form, not a CTA.
  it('carries the product forward so the form is not a blank page', () => {
    const href = docFor('products/conductive-metal-yarn/index.html')
      .querySelector('[data-request-grade]')
      ?.getAttribute('href') ?? '';
    expect(href.startsWith('/request-a-sample/?'), `href was ${href}`).toBe(true);
    const product = new URLSearchParams(href.split('?')[1]).get('product');
    expect(product).toBe('Conductive Metal Yarn');
  });

  // Copy as CSV is the component's most valuable feature. A CTA that leaked into the
  // exported table would put a button caption into a procurement spreadsheet.
  it('keeps the CTA out of the copied CSV', () => {
    const csv = docFor('products/conductive-metal-yarn/index.html')
      .querySelector('[data-copy-csv]')
      ?.getAttribute('data-csv') ?? '';
    expect(csv, 'the CTA leaked into the CSV export').not.toContain('Request');
  });
});
```

- [ ] **Step 3: Run the test and watch it fail**

```bash
npx vitest run tests/contact.test.ts
```

Expected: FAIL — `the spec table has no Request this grade CTA`.

- [ ] **Step 4: Add the prop and the CTA**

In `src/components/SpecTable.astro`, add to `Props`:

```typescript
  /**
   * Carried into the sample form's `product` field so the engineer does not retype what
   * they were just reading. Required rather than optional on purpose: a spec table with
   * no route to a sample request is the gap this closes, and an optional prop would let
   * a new page reintroduce it silently.
   */
  productName: string;
```

Update the destructure:

```typescript
const { table, caption, sourceNote, needsVerification = false, productName } = Astro.props;
const csv = specTableToCsv(table);
const requestHref = `/request-a-sample/?product=${encodeURIComponent(productName)}`;
```

Then, immediately after the existing `<button … data-copy-csv …>` element:

```astro
  <a class="request" href={requestHref} data-request-grade>Request this grade</a>
```

And add to the component's `<style>` block:

```css
  .request {
    display: inline-block;
    margin-left: var(--s-3);
    font-family: var(--font-mono);
    font-size: var(--t-12);
    letter-spacing: 0.08em;
    color: var(--c-copper);
  }
  .request:hover { color: var(--c-copper-lift); }

  /* On paper a sample-request link is a dead end, and the print block in global.css
     already hides both enquiry forms for the same reason. */
  @media print { .request { display: none; } }
```

Now update **every** call site found in Step 1 to pass `productName`. On a product detail page the value is the entry's own name:

```astro
<SpecTable
  table={product.data.specTable}
  caption={`${product.data.name} — specifications`}
  sourceNote={product.data.sourceNote}
  needsVerification={product.data.needsVerification}
  productName={product.data.name}
/>
```

- [ ] **Step 5: Run the test and watch it pass**

```bash
npm run build && npx vitest run tests/contact.test.ts && npm test
```

Expected: `tests/contact.test.ts` all passing; full suite **409 passing across 26 files**. If the build fails with a missing `productName`, you missed a call site from Step 1 — that is the forcing function working.

- [ ] **Step 6: Commit**

```bash
git add src/components/SpecTable.astro src/pages tests/contact.test.ts
git commit -m "feat: add the Request this grade CTA to the spec table

Spec §5 lists four things the signature component carries; this is the fourth
and last. One CTA per table rather than one per row: a per-row link matches the
spec wording more literally but needs a column that must then be excluded from
the CSV export, and Copy as CSV is the component's most valuable feature for the
engineer. Corrupting the copy path to gain a link is a bad trade.

productName is a required prop so a new spec-table page cannot silently ship
without a route to a sample request."
```

---

## Task 6: Prefill the sample form from the query string

The CTA is worthless if the form ignores what it sends. `/request-a-sample/` is a **static page**, so there is no server to read the query string: prefill is client-side, and it must be treated as untrusted input.

**Files:**
- Modify: `src/lib/enquiry.ts`, `src/components/EnquiryForm.astro`
- Test: `tests/enquiry.test.ts`, `tests/contact.test.ts`

**Interfaces:**
- Consumes: the `?product=` parameter produced by Task 5.
- Produces: `export const PREFILLABLE: readonly string[]` from `src/lib/enquiry.ts`.

- [ ] **Step 1: Write the failing test**

Append to `tests/enquiry.test.ts`:

```typescript
import { PREFILLABLE, MAX_LENGTHS, HONEYPOT_FIELD, fieldsFor } from '../src/lib/enquiry';

describe('query-string prefill', () => {
  it('allows only fields the sample form actually has', () => {
    const sampleFields = fieldsFor('sample').map((f) => f.name);
    for (const name of PREFILLABLE) {
      expect(sampleFields, `${name} is prefillable but is not a sample field`).toContain(
        name,
      );
    }
  });

  // The honeypot is the whole spam defence. A URL that could fill it would let anyone
  // hand out a link that makes every submission look like a bot.
  it('never allows the honeypot', () => {
    expect(PREFILLABLE).not.toContain(HONEYPOT_FIELD);
  });

  // Prefilling an identity field from a URL means a link can put words in the sender's
  // mouth. Only the two fields describing what they are asking about are allowed.
  it('never allows an identity field', () => {
    for (const name of ['name', 'company', 'email']) {
      expect(PREFILLABLE, `${name} must not be settable from a URL`).not.toContain(name);
    }
  });

  it('covers exactly product and grade', () => {
    expect([...PREFILLABLE].sort()).toEqual(['grade', 'product']);
  });

  it('has a length ceiling for every prefillable field', () => {
    for (const name of PREFILLABLE) {
      expect(MAX_LENGTHS[name], `${name} has no MAX_LENGTHS ceiling`).toBeGreaterThan(0);
    }
  });
});
```

And append to `tests/contact.test.ts`:

```typescript
describe('the sample form prefill script', () => {
  const html = () => readFileSync(join(DIST, 'request-a-sample', 'index.html'), 'utf8');

  it('ships a prefill script on the sample form', () => {
    expect(html()).toContain('data-prefill');
  });

  // The value comes from a URL a stranger can hand out. Assigning it to .value is inert;
  // building markup from it is an injection. Asserted on the shipped source because this
  // is the kind of line a later refactor "simplifies".
  it('assigns values rather than building markup from them', () => {
    const doc = docFor('request-a-sample/index.html');
    const script = [...doc.querySelectorAll('script')]
      .map((s) => s.textContent ?? '')
      .find((t) => t.includes('data-prefill')) ?? '';
    expect(script, 'no prefill script found').not.toBe('');
    expect(script, 'prefill must not write markup').not.toContain('innerHTML');
    expect(script, 'prefill must not write markup').not.toContain('insertAdjacentHTML');
  });

  it('does not put a prefill script on the contact form, which has no such fields', () => {
    expect(readFileSync(join(DIST, 'contact', 'index.html'), 'utf8')).not.toContain(
      'data-prefill',
    );
  });
});
```

- [ ] **Step 2: Run both and watch them fail**

```bash
npx vitest run tests/enquiry.test.ts tests/contact.test.ts
```

Expected: FAIL — `PREFILLABLE` is not exported (import error), and `data-prefill` is absent.

- [ ] **Step 3: Export the allowlist**

In `src/lib/enquiry.ts`, directly after `HONEYPOT_FIELD`:

```typescript
/**
 * The only fields a query string may fill in, so the spec table's "Request this grade"
 * CTA can carry the product forward instead of handing the engineer a blank form.
 *
 * An allowlist rather than a denylist, and deliberately just these two. Both describe
 * what is being asked about; neither says anything about who is asking. Identity fields
 * are excluded because a prefilled URL is a link anyone can hand out, and a link that
 * fills in `name` or `email` puts words in the sender's mouth. The honeypot is excluded
 * for the obvious reason: a URL that filled it would make every submission look like a
 * bot. tests/enquiry.test.ts asserts all three properties.
 */
export const PREFILLABLE: readonly string[] = ['product', 'grade'];
```

- [ ] **Step 4: Prefill in the form component**

In `src/components/EnquiryForm.astro`, render the script only for the sample form. Add near the other frontmatter:

```typescript
const prefillable = formType === 'sample' ? PREFILLABLE : [];
```

(importing `PREFILLABLE` alongside the existing imports from `../lib/enquiry`), then at the end of the component:

```astro
{prefillable.length > 0 && (
  <script is:inline define:vars={{ prefillable, maxLengths: MAX_LENGTHS }} data-prefill>
    // The spec table links here with ?product=… so the engineer does not retype what
    // they were just reading.
    //
    // Everything here is untrusted: the query string comes from a URL a stranger can
    // hand out. Two rules follow. Only names on the allowlist are read, so a crafted
    // link cannot reach the honeypot or an identity field. And the value is ASSIGNED to
    // .value — never used to build markup — so it is inert text rather than a script.
    // The same length ceilings the server enforces are applied here, so a link cannot
    // push a field past what validateEnquiry() would accept.
    const params = new URLSearchParams(window.location.search);
    for (const name of prefillable) {
      const raw = params.get(name);
      if (raw === null) continue;
      const field = document.querySelector(`[name="${name}"]`);
      if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) continue;
      if (field.value !== '') continue; // never overwrite something already typed
      field.value = raw.slice(0, maxLengths[name] ?? 80);
    }
  </script>
)}
```

- [ ] **Step 5: Run the tests and watch them pass**

```bash
npm run build && npx vitest run tests/enquiry.test.ts tests/contact.test.ts && npm test
```

Expected: full suite **417 passing across 26 files**.

- [ ] **Step 6: Prove it end to end in a browser**

```bash
npm run build && npx astro preview
```

Open `/products/conductive-metal-yarn/`, click **Request this grade**, and confirm the sample form's **Product** field already reads `Conductive Metal Yarn`. Then try `/request-a-sample/?name=Mallory` and confirm **Your name** is still empty — that is the allowlist working.

- [ ] **Step 7: Commit**

```bash
git add src/lib/enquiry.ts src/components/EnquiryForm.astro tests/enquiry.test.ts tests/contact.test.ts
git commit -m "feat: prefill the sample form from the spec table's CTA

/request-a-sample/ is static, so prefill is client-side and the query string is
untrusted input. An allowlist of exactly product and grade: both describe what is
being asked about, neither says who is asking. A prefilled URL is a link anyone
can hand out, and one that filled name or email would put words in the sender's
mouth. The honeypot is excluded for the obvious reason.

Values are assigned to .value, never used to build markup, and truncated with the
same MAX_LENGTHS the endpoint enforces."
```

---

## Task 7: Document it

An editor who cannot sign in will email the developer, and a developer who does not know why imagery is missing will "fix" it.

**Files:**
- Create: `docs/cms.md`
- Modify: `HANDOFF.md`, `docs/deployment.md`

- [ ] **Step 1: Write `docs/cms.md`**

Create `docs/cms.md` covering, in this order:

1. **Signing in.** Go to `/admin`, choose **Sign In with Token**, follow the link to GitHub with scopes pre-selected, paste the token. It is stored in that browser's local storage. **No OAuth app and no auth backend exist** — if a future reader goes looking for one, there is nothing to find.
2. **Access is repository write access.** There are no CMS accounts. Anyone with write access to `darsonl/litex-website` can edit; nobody else can. Revoking access is a GitHub permission change.
3. **Saving opens a pull request.** Editorial Workflow. The Cloudflare Pages check on that PR is what proves the entry builds. **A red check means the entry is invalid — read the build log, do not merge.**
4. **What the CMS deliberately cannot do**, and why:
   - **Images.** Every raster needs a `provenance.json` entry traced to `archive/` with `aiGenerated: false`, plus the Tier 3 real-photography rule. Imagery is a code-review path.
   - **Cross-field rules.** A spec table requires a source note; `publishedAt` must be a real calendar date; a hero image may not be AI generated. The CMS cannot check these — the build does, on the PR.
5. **Adding a field** means editing `src/schemas/*.ts` **and** `public/admin/config.yml`. `tests/cms.test.ts` catches a field removed from the config, but cannot notice one you added to zod and forgot here.
6. **The bundle is vendored**, not loaded from a CDN, and `public/admin/sveltia-cms.js` is gitignored. Never paste the `unpkg.com` tag back in.

- [ ] **Step 2: Update the handoff and deployment docs**

In `HANDOFF.md`, replace the "Start here: write Plan 9" section with a record that Plan 9 shipped, pointing at `docs/cms.md`, and note the **PAT finding** — that the OAuth-backend scope in the old note was wrong and no second deployable exists.

In `docs/deployment.md` §2, add a row noting that `/admin` is a static asset needing no binding, variable or build configuration.

- [ ] **Step 3: Verify and commit**

```bash
npm run build && npm test && npm run test:a11y
```

Expected: 36 pages, **417 passing across 26 files**, a11y 11 passing.

```bash
git add docs/cms.md HANDOFF.md docs/deployment.md
git commit -m "docs: record how the CMS works and what it deliberately cannot do

Names the finding that changed this plan's scope: Sveltia authenticates with a
personal access token, so the OAuth backend the old scoping note described — a
second Cloudflare deployable — does not exist and was never needed."
```

---

## Definition of Done

- [ ] `npm run build` → **36 pages**, plus `dist/admin/{index.html,config.yml,sveltia-cms.js}`
- [ ] `npm test` → **417 passing across 26 files**; `npm run test:a11y` → **11 passing**
- [ ] `tests/legal.test.ts` `DISCLOSED` still holds **exactly two** entries
- [ ] `/admin` loads the CMS, signs in with a PAT, and saving opens a pull request
- [ ] The round-trip check in Task 4 Step 6 has been run **by a human**, and its outcome recorded
- [ ] "Request this grade" prefills `product`; `?name=` does not prefill anything
- [ ] Detector clean on every changed `.astro` file

**Verify each item by running it.** Where a guard is claimed, break it deliberately once and watch it fail — this repo's Definition of Done has meant that since Plan 5, and every plan that skipped it shipped a vacuous test.

---

## Self-Review

**Spec coverage.** Spec §5's four spec-table features: provenance note ✅ (shipped), Copy as CSV ✅ (shipped), Datasheet PDF ✅ (shipped), Request this grade ✅ (Task 5). CMS at `/admin` ✅ (Tasks 1–4). All three content collections mirrored ✅ (Tasks 3–4).

**Placeholder scan.** No "TBD", no "add error handling", no "similar to Task N". Every code step carries the actual code. The one deliberately unresolved item — what Sveltia writes for `publishedAt` — is called out as a named risk with a concrete check and a specific fallback, not left as a gap.

**Type consistency.** `PREFILLABLE` is declared in Task 6 Step 3 and consumed in Step 4 and both test files under that one name. `productName` is added to `SpecTable`'s `Props` in Task 5 Step 4 and passed at every call site in the same step. `appHtmlFiles()` is defined in Task 2 Step 3 and used in Step 1's test. `cmsConfig()` is defined in Task 3 Step 1 and reused in Task 4 via `find()`. Test counts run 393 → 396 → 401 → 406 → 409 → 417 consistently.

**One gap accepted deliberately:** `tests/cms.test.ts` cannot detect a field added to a zod schema but never added to `config.yml` — that surfaces as a CMS silently unable to edit something. Named in `docs/cms.md` §5 rather than papered over.

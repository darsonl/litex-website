# LiTex Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the site behave correctly as a *hosted* site — real 404 semantics, the legacy URL map, discoverability, a favicon, print output, measured accessibility, and disclosed analytics — so that launch is a decision rather than a project.

**Architecture:** Everything here is either a static file Cloudflare reads (`404.html`, `_redirects`, `robots.txt`, `sitemap-index.xml`, `favicon.svg`), one tiny Pages Function for the single URL that must answer `410 Gone`, or a test that proves one of those is real. The one new dependency pair (`playwright` + `@axe-core/playwright`) exists to turn spec §4's accessibility requirement from a claim into an assertion.

**Tech Stack:** Astro 7.2.0 (static) · Cloudflare Pages · `@astrojs/sitemap` · Vitest 4.1.10 · linkedom 0.18.13 · playwright + `@axe-core/playwright` (new) · sharp 0.35.3 (already present).

## Global Constraints

- **Astro is 7.2.0 and the build stays `static`.** No SSR adapter.
- **`src/lib/enquiry.ts` must keep zero imports** — it is loaded by Vitest, the Astro build *and* the Workers runtime.
- **Resolve references through `mustResolve()`** — a broken `reference()` does not fail the Astro 7.2.0 build.
- **`compressHTML` is on by default** and strips the newline between text and a following element. Use an explicit `{' '}`. Check with `grep -oE '[a-zA-Z,;:.]<(span|a|strong|em)\b'` over `dist/**/*.html`.
- **No `example.com` string may reach any built page.** Never restore `PATENTED` or `1M545145`.
- **Add a route to `NAV` only after the page exists** — `tests/chrome.test.ts` fails otherwise.
- **Never reintroduce the Turnstile test sitekey** `1x00000000000000000000AA`. `tests/contact.test.ts` fails the build if it appears on any page. The production sitekey is `0x4AAAAAAEOqzFlvFS397MkG` and is public by design.
- **Do not add an SRI hash to the Turnstile script — or to the analytics beacon added in Task 8.** Both are unversioned endpoints that Cloudflare rolls in place, so a pinned hash would guarantee a silent breakage rather than prevent one: the forms would stop working, and the beacon would stop reporting. Automated tooling flags every external script without `integrity`, and it flagged both while this plan was being written. The reasoning is recorded in Plan 7's front matter and `docs/deployment.md`. What is enforced instead is **containment and disclosure**: `tests/legal.test.ts` fails on any undisclosed third-party resource.
- **`dist/` is gitignored, so ripgrep skips it.** Any dist-wide shell search must use Bash `grep`, never the Grep tool, or it returns "no matches" without opening a file.
- **`src/data/catalog-files.json` gets a CRLF-only rewrite on every build.** If it shows modified with an empty `git diff`, `git checkout --` it.

---

## Decisions taken before this plan was written

Settled with the human on 2026-08-13. Do not re-litigate.

| # | Decision | Why |
|---|---|---|
| 1 | **Sveltia CMS is deferred to its own Plan 9.** | It needs a GitHub OAuth backend (a second deployable on Cloudflare) plus a `config.yml` mirroring every content collection's schema. That is a subsystem, not a launch chore, and launch does not depend on it — content is edited by commit until then. Spec §4's CMS row stands; it is simply not this plan. |
| 2 | **Accessibility is measured with real tooling**, not asserted: `playwright` + `@axe-core/playwright` as dev dependencies, one representative page per template type. | Spec §4 requires axe checks. The existing linkedom tests can check structure but cannot see contrast, focus order, or computed roles. A requirement that cannot fail is not a requirement. |
| 3 | **Lighthouse stays a manual, recorded check.** | Automating it means a headless Chrome performance run whose numbers move with the machine. Spec §4's ≥95 budget is verified once against the deployed site and the numbers are written into `docs/deployment.md`. |
| 4 | **Sending is from `send.litex.com.tw`**, not the root domain. | Resend's own guidance: a deliverability problem on the sending domain must not damage the reputation of `sales@litex.com.tw`, the address humans actually write to. Already reflected in `docs/deployment.md`. |
| 5 | **The nameserver move happens last**, after everything is proven on `litex-website.pages.dev`. | It takes over the MX records delivering `sales@litex.com.tw`. See `docs/cloudflare-setup.md` Part F. |

---

## ⚠ Verified platform facts — checked against live docs 2026-08-13, do not re-derive

These four changed the shape of this plan. Three of them would have produced a production bug if assumed.

1. **A Cloudflare Pages site with no root `404.html` is treated as a single-page app.** Cloudflare *"matches all incoming paths to the root"* — so **every** unmatched URL returns **HTTP 200 with the homepage**. Confirmed live against `litex-website.pages.dev` on 2026-08-13: `/robots.txt`, `/favicon.ico` and `/any-typo/` all returned 200 and the homepage HTML. This is why Task 1 is Task 1.

2. **`_redirects` supports only `301, 302, 303, 307, 308`.** **410 is not supported and neither is 404.** Spec §3 sentences `/2016/09/22/test-post-blah/` to **410 Gone**, so that one URL *cannot* be done in `_redirects` and is served by a tiny Pages Function instead (Task 2).

3. **`_redirects` rules do not apply to paths served by Pages Functions.** This is what makes the 410 Function safe: it wins for its own path, and there is no ordering conflict to reason about.

4. **Seven of spec §3's 23 rows are identity mappings** — `/`, `/contact/`, `/downloads/`, `/products/`, and three product URLs whose paths did not change. **Writing them into `_redirects` would create redirect loops.** The file therefore contains **15 rules**, not 22. The redirect map is still complete: 15 redirects + 7 identities that need no rule + 1 Function = 23.

Also worth knowing, though it did not change a decision: `@astrojs/sitemap` emits **`sitemap-index.xml`** (plus `sitemap-0.xml`), *not* `sitemap.xml`. `robots.txt` must reference the index by its real name.

---

## What this plan does not build

- **No Sveltia CMS.** Decision 1 — Plan 9.
- **No `X-Robots-Tag` suppression of the `*.pages.dev` preview host.** `_headers` cannot vary by hostname, and every page's canonical already points at `https://litex.com.tw/…`, which is the mechanism search engines use to collapse the duplicate. Recorded as an open item rather than solved badly.
- **No automated Lighthouse run.** Decision 3.
- **No product-page "Request this grade" CTA.** Spec §5 lists it; it is a one-line `SpecTable` change now that `/request-a-sample/` exists, and it is carried into Plan 9 rather than bundled here.
- **No `favicon.ico`.** Modern browsers take `favicon.svg`; sharp cannot write ICO. See Task 4 — this is a deliberate, documented omission, not a gap.

---

## File Structure

**Created**

| File | Responsibility |
|---|---|
| `src/pages/404.astro` | The not-found page. Its existence is what switches Cloudflare out of SPA-fallback mode. |
| `public/_redirects` | The 15 real legacy redirects. Copied verbatim into `dist/` by Astro. |
| `functions/2016/09/22/test-post-blah.ts` | Answers `410 Gone` for the one URL `_redirects` cannot express. |
| `public/robots.txt` | Allows everything, names the sitemap. |
| `public/favicon.svg` | Typographic mark, drawn as paths so it needs no font. |
| `public/apple-touch-icon.png` | 180×180 raster of the same mark, generated by `scripts/make-favicon.mjs`. |
| `scripts/make-favicon.mjs` | Rasterises the SVG with sharp. Run once; output is committed. |
| `tests/helpers/serve.ts` | Minimal static server over `dist/`, so the a11y run drives a real browser against real files. |
| `tests/launch.test.ts` | 404, `_redirects`, sitemap, robots, favicon, print CSS, and the broken-link sweep. |
| `tests/a11y.test.ts` | axe, one representative page per template type. |

**Modified**

| File | Change |
|---|---|
| `src/layouts/BaseLayout.astro` | `noindex?: boolean` prop; favicon `<link>`s; the analytics beacon (Task 8). |
| `src/pages/enquiry-sent/index.astro` | `noindex` — a confirmation page must never be a search result. |
| `src/styles/global.css` | `@media print` block. |
| `astro.config.mjs` | `@astrojs/sitemap` integration, excluding `/enquiry-sent/`. |
| `src/pages/legal/privacy.astro` | Disclose Cloudflare Web Analytics (Task 8). |
| `tests/legal.test.ts` | Add the beacon URL to `DISCLOSED` (Task 8). |
| `package.json` | `@astrojs/sitemap`; dev: `playwright`, `@axe-core/playwright`; `favicon` and `test:a11y` scripts. |
| `docs/deployment.md`, `HANDOFF.md` | Final state, Lighthouse numbers, handoff to Plan 9. |

---

### Task 1: Real 404 semantics

**This is first because three later tasks are meaningless without it.** While every unmatched URL returns 200, a broken-link check passes without looking, and the 410 cannot be observed.

**Files:**
- Create: `src/pages/404.astro`, `tests/launch.test.ts`
- Modify: `src/layouts/BaseLayout.astro`

**Interfaces:**
- Consumes: `BaseLayout`.
- Produces: `dist/404.html`; `BaseLayout` gains `noindex?: boolean` (used by Task 3 as well).

- [ ] **Step 1: Write the failing test**

```ts
// tests/launch.test.ts
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { DIST, docFor } from './helpers/dist';

describe('404 handling', () => {
  // Cloudflare Pages treats a build output with no root 404.html as a single-page app
  // and answers EVERY unmatched path with 200 + index.html. Verified live on
  // litex-website.pages.dev, 2026-08-13, before this file existed. The presence of
  // dist/404.html is the entire fix, so it is asserted structurally.
  it('emits a 404.html at the root of the build', () => {
    expect(
      existsSync(join(DIST, '404.html')),
      'without dist/404.html every unmatched URL returns 200 with the homepage',
    ).toBe(true);
  });

  it('is a real page with one h1 and a way back', () => {
    const doc = docFor('404.html');
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    const hrefs = [...doc.querySelectorAll('main a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/products/');
  });

  it('is not indexable, because a 404 must never be a search result', () => {
    const robots = docFor('404.html').querySelector('meta[name="robots"]');
    expect(robots?.getAttribute('content')).toContain('noindex');
  });

  it('does not claim to be the homepage', () => {
    // The SPA fallback served index.html for everything. If 404.html is ever generated
    // from the wrong template, this catches it.
    expect(docFor('404.html').body.textContent).not.toContain('conductive metal yarn and heating');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/launch.test.ts`
Expected: FAIL — `dist/404.html` does not exist.

- [ ] **Step 3: Add the `noindex` prop to `BaseLayout`**

In `src/layouts/BaseLayout.astro`, extend the props:

```astro
interface Props {
  title: string;
  description: string;
  /**
   * Emit <meta name="robots" content="noindex">. For pages that must never be a search
   * result: the 404 page and the enquiry confirmation. Everything else stays indexable.
   */
  noindex?: boolean;
}

const { title, description, noindex = false } = Astro.props;
```

And inside `<head>`, immediately after the canonical link:

```astro
    {noindex && <meta name="robots" content="noindex" />}
```

- [ ] **Step 4: Write the 404 page**

```astro
---
// src/pages/404.astro
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout
  title="Page not found — LiTex Textile & Technology"
  description="That page does not exist on litex.com.tw."
  noindex
>
  <h1>That page does not exist</h1>

  <p class="lead">
    The address may be mistyped, or it may be a link to the old site that has not been
    carried across.
  </p>

  <ul class="ways">
    <li><a href="/">The homepage</a></li>
    <li><a href="/products/">All products</a>, with the full specification tables</li>
    <li><a href="/downloads/">Catalogs</a> — six PDFs, the complete 2018 set</li>
    <li><a href="/contact/">Contact us</a> if you cannot find what you came for</li>
  </ul>
</BaseLayout>

<style>
  .lead { color: var(--c-text-2); max-width: 60ch; font-size: var(--t-20); }
  .ways { max-width: 60ch; }
  .ways li { margin-bottom: var(--s-2); }
</style>
```

- [ ] **Step 5: Build and confirm**

Run: `npm run build && npx vitest run tests/launch.test.ts`
Expected: PASS. The build now reports **36 pages** (35 + `/404`).

- [ ] **Step 6: Run the whole suite**

Run: `npm test`
Expected: all green. If `tests/chrome.test.ts` or the sitemap-less link tests complain about `404.html`, read the failure before changing anything — a page that is not in `NAV` and not linked from chrome should not affect them.

- [ ] **Step 7: Commit**

```bash
git add src/pages/404.astro src/layouts/BaseLayout.astro tests/launch.test.ts
git commit -m "fix: emit a real 404 page, ending Cloudflare's SPA fallback to the homepage"
```

- [ ] **Step 8: Verify on the deployed site once merged**

This is the only task whose real behaviour lives on the host. After the branch is merged and Cloudflare redeploys:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://litex-website.pages.dev/this-does-not-exist-xyz/
```

Expected: **404**, not 200. Record the observed code in your report. Before this task it was 200.

---

### Task 2: The legacy URL map, and the one URL that must be Gone

**Files:**
- Create: `public/_redirects`, `functions/2016/09/22/test-post-blah.ts`
- Modify: `tests/launch.test.ts`

**Interfaces:**
- Consumes: the built routes from every earlier plan.
- Produces: `dist/_redirects`; `GET|POST|… /2016/09/22/test-post-blah` → `410`.

**Read ⚠ verified facts 2, 3 and 4 at the top of this plan before writing anything here.** In short: `_redirects` cannot express 410, identity rows must not be written, and Function routes bypass `_redirects` entirely.

- [ ] **Step 1: Write the failing test**

Append to `tests/launch.test.ts`:

```ts
import { routeFile } from './helpers/dist';

describe('the legacy URL map', () => {
  const source = readFileSync(join(DIST, '_redirects'), 'utf8');
  const rules = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const [from, to, code] = l.split(/\s+/);
      return { from, to, code };
    });

  // Spec §3 lists 23 legacy URLs. Seven are identity mappings that need no rule, and
  // test-post-blah is a 410 served by a Function, so the file holds exactly 15.
  it('contains exactly the fifteen rules that actually change a path', () => {
    expect(rules).toHaveLength(15);
  });

  it('uses 301 for every rule, because these are permanent moves', () => {
    for (const rule of rules) {
      expect(rule.code, `${rule.from} has code ${rule.code}`).toBe('301');
    }
  });

  // A rule whose source equals its destination is an infinite redirect. Seven rows of
  // spec §3's table are identity mappings and this is what stops them being written.
  it('never redirects a path to itself', () => {
    for (const rule of rules) {
      expect(rule.from, 'redirect loop').not.toBe(rule.to);
    }
  });

  it('sends every rule to a page that was actually built', () => {
    for (const rule of rules) {
      expect(
        existsSync(join(DIST, routeFile(rule.to))),
        `${rule.from} -> ${rule.to} but ${routeFile(rule.to)} was not built`,
      ).toBe(true);
    }
  });

  it('maps the seven news permalinks to their new slugs', () => {
    const byFrom = Object.fromEntries(rules.map((r) => [r.from, r.to]));
    expect(byFrom['/2022/01/21/tokyo-wearable-expo-2022/']).toBe('/news/tokyo-wearable-expo-2022/');
    expect(byFrom['/2020/05/20/new-braided-self-curling-tube-item/']).toBe('/news/new-braided-self-curling-tube/');
    expect(byFrom['/2018/02/26/dusseldorf-wire-show/']).toBe('/news/dusseldorf-wire-show/');
    expect(byFrom['/2017/06/26/featured-on-techtextil-blog/']).toBe('/news/featured-on-techtextil-blog/');
    expect(byFrom['/2017/02/23/copper-nickel-1s1z/']).toBe('/news/copper-nickel-1s1z/');
    expect(byFrom['/2017/02/23/litex-attending-techtextil-at-frankfurt-germany/']).toBe('/news/techtextil-frankfurt/');
    expect(byFrom['/2017/02/23/a-rewarding-experience-at-the-wearable-expo/']).toBe('/news/wearable-expo/');
  });

  it('maps the renamed product and company URLs', () => {
    const byFrom = Object.fromEntries(rules.map((r) => [r.from, r.to]));
    expect(byFrom['/about-2/']).toBe('/company/about/');
    expect(byFrom['/patents-and-awards-2/']).toBe('/company/patents-and-awards/');
    expect(byFrom['/privacy-policy/']).toBe('/legal/privacy/');
    expect(byFrom['/products/conductive-metal-yarn-cmy/']).toBe('/products/conductive-metal-yarn/');
    expect(byFrom['/products/conductive-metal-yarn-cmy/electrical-heating-textile/'])
      .toBe('/products/electrical-heating-textile/');
    expect(byFrom['/products/silica-gel-switch-controller-2/']).toBe('/products/silica-gel-switch-controller/');
    expect(byFrom['/2018/12/06/new-electrical-heating-alternatives-to-consider/'])
      .toBe('/technology/heating-element-comparison/');
    expect(byFrom['/2018/02/26/catalog-download/']).toBe('/downloads/');
  });

  // Spec §3: a 301 transfers value, a 410 tells search engines to drop the URL.
  // _redirects supports only 301/302/303/307/308 — verified against Cloudflare's docs
  // 2026-08-13 — so this one URL cannot live in the file and must not be smuggled in
  // as a redirect to the homepage.
  it('does not redirect test-post-blah anywhere', () => {
    expect(source).not.toContain('test-post-blah');
  });

  it('serves test-post-blah from a Function so it can answer 410', () => {
    const fn = new URL('../functions/2016/09/22/test-post-blah.ts', import.meta.url);
    expect(existsSync(fn), 'the 410 Function is missing').toBe(true);
    expect(readFileSync(fn, 'utf8')).toContain('410');
  });
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npm run build && npx vitest run tests/launch.test.ts`
Expected: FAIL — `dist/_redirects` does not exist.

- [ ] **Step 3: Write `public/_redirects`**

Astro copies `public/` into `dist/` verbatim, which is where Cloudflare reads it from.

```
# Legacy URL map — spec §3. Cloudflare Pages _redirects.
#
# Format: <from> <to> <status>. Only 301/302/303/307/308 are supported; 410 and 404 are
# NOT (verified against Cloudflare's docs 2026-08-13), which is why
# /2016/09/22/test-post-blah/ is a Pages Function instead of a line in this file.
#
# Spec §3 lists 23 legacy URLs. Seven of them are identity mappings — /, /contact/,
# /downloads/, /products/, and three product paths that did not change — and are
# deliberately absent: a rule whose source equals its destination is an infinite redirect.
# 15 rules + 7 identities + 1 Function = 23.

# Company and legal
/about-2/                                                          /company/about/                            301
/patents-and-awards-2/                                             /company/patents-and-awards/               301
/privacy-policy/                                                   /legal/privacy/                            301

# Products that were renamed
/products/conductive-metal-yarn-cmy/                               /products/conductive-metal-yarn/           301
/products/conductive-metal-yarn-cmy/electrical-heating-textile/    /products/electrical-heating-textile/      301
/products/silica-gel-switch-controller-2/                          /products/silica-gel-switch-controller/    301

# Old WordPress dated permalinks
/2018/12/06/new-electrical-heating-alternatives-to-consider/       /technology/heating-element-comparison/    301
/2018/02/26/catalog-download/                                      /downloads/                                301
/2022/01/21/tokyo-wearable-expo-2022/                              /news/tokyo-wearable-expo-2022/            301
/2020/05/20/new-braided-self-curling-tube-item/                    /news/new-braided-self-curling-tube/       301
/2018/02/26/dusseldorf-wire-show/                                  /news/dusseldorf-wire-show/                301
/2017/06/26/featured-on-techtextil-blog/                           /news/featured-on-techtextil-blog/         301
/2017/02/23/copper-nickel-1s1z/                                    /news/copper-nickel-1s1z/                  301
/2017/02/23/litex-attending-techtextil-at-frankfurt-germany/       /news/techtextil-frankfurt/                301
/2017/02/23/a-rewarding-experience-at-the-wearable-expo/           /news/wearable-expo/                       301
```

- [ ] **Step 4: Write the 410 Function**

```ts
// functions/2016/09/22/test-post-blah.ts
/**
 * 410 Gone for the old `test-post-blah` permalink.
 *
 * Spec §3 sentences this URL to 410 rather than 301: a redirect transfers ranking value,
 * and pointing junk at the homepage dilutes relevance signals. 410 tells a crawler to drop
 * the URL outright.
 *
 * This is a Pages Function rather than a line in `_redirects` because `_redirects` supports
 * only 301/302/303/307/308 — 410 is not available there (verified against Cloudflare's
 * documentation 2026-08-13). Redirect rules are not applied to paths served by a Function,
 * so there is no ordering conflict with the rest of the map.
 *
 * The post itself was read before being killed: its title is "LiTex Attending Wearable
 * Expo" and its body is genuine content, but it pre-announces the very expo that
 * /news/wearable-expo/ thanks visitors for, so nothing of substance is lost. Do not
 * "recover" it as an eighth news post.
 */
export const onRequest: () => Response = () =>
  new Response('410 Gone — this page has been permanently removed.', {
    status: 410,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
```

- [ ] **Step 5: Build, test, and check the spacing trap**

Run: `npm run build && npm test`
Expected: all green at **36 pages**.

Run: `grep -roE '[a-zA-Z,;:.]<(span|a|strong|em)\b' dist/404.html`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add public/_redirects functions/2016/09/22/test-post-blah.ts tests/launch.test.ts
git commit -m "feat: map the 15 changed legacy URLs, and 410 the one that is gone"
```

- [ ] **Step 7: Verify on the deployed site once merged**

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://litex-website.pages.dev/about-2/
curl -s -o /dev/null -w "%{http_code}\n" https://litex-website.pages.dev/2016/09/22/test-post-blah/
curl -s -o /dev/null -w "%{http_code}\n" https://litex-website.pages.dev/2016/09/22/test-post-blah
```

Expected: `301` to `/company/about/`, then **410** for both the trailing-slash and bare forms.
**Record all three.** If the bare form 404s while the slashed form works or vice versa, say so —
Pages' trailing-slash normalisation for Function routes is the one thing here that was not
verifiable before deploying.

---

### Task 3: Discoverability — sitemap, robots, and what must stay out of both

**Files:**
- Modify: `astro.config.mjs`, `package.json`, `src/pages/enquiry-sent/index.astro`, `tests/launch.test.ts`
- Create: `public/robots.txt`

- [ ] **Step 1: Install the integration**

Run: `npm install @astrojs/sitemap`

It belongs in `dependencies`, alongside `astro`, because it runs as part of the build.

- [ ] **Step 2: Write the failing test**

Append to `tests/launch.test.ts`:

```ts
describe('discoverability', () => {
  it('emits a sitemap index', () => {
    // @astrojs/sitemap emits sitemap-index.xml plus sitemap-0.xml — NOT sitemap.xml.
    expect(existsSync(join(DIST, 'sitemap-index.xml'))).toBe(true);
    expect(existsSync(join(DIST, 'sitemap-0.xml'))).toBe(true);
  });

  it('lists the pages a buyer should be able to find', () => {
    const xml = readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8');
    for (const route of [
      'https://litex.com.tw/',
      'https://litex.com.tw/products/',
      'https://litex.com.tw/products/conductive-metal-yarn/',
      'https://litex.com.tw/technology/',
      'https://litex.com.tw/downloads/',
      'https://litex.com.tw/news/',
      'https://litex.com.tw/contact/',
      'https://litex.com.tw/request-a-sample/',
    ]) {
      expect(xml, `sitemap is missing ${route}`).toContain(route);
    }
  });

  // A confirmation page in search results is a page reached with no context, telling a
  // stranger their enquiry was received when they never sent one.
  it('excludes the enquiry confirmation and the 404 page', () => {
    const xml = readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8');
    expect(xml).not.toContain('/enquiry-sent/');
    expect(xml).not.toContain('/404');
  });

  it('marks the confirmation page noindex as well, not only unlisted', () => {
    const robots = docFor('enquiry-sent/index.html').querySelector('meta[name="robots"]');
    expect(robots?.getAttribute('content')).toContain('noindex');
  });

  it('serves a robots.txt that names the sitemap by its real filename', () => {
    const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
    expect(robots).toContain('Sitemap: https://litex.com.tw/sitemap-index.xml');
    expect(robots).toContain('User-agent: *');
  });
});
```

- [ ] **Step 3: Run and watch it fail**

Run: `npm run build && npx vitest run tests/launch.test.ts`
Expected: FAIL — no `sitemap-index.xml`.

- [ ] **Step 4: Wire up the integration**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Domain ownership confirmed 2026-08-11 (was spec §7 item 3, now closed).
// Declared exactly once: feeds `site` below, canonical tags, and the sitemap.
export const SITE_URL = 'https://litex.com.tw';

// LiTex's real inbound address, confirmed 2026-08-11 (was spec §7 item 1, now closed).
// The old site's only address was the theme placeholder mail@example.com — never use it.
export const CONTACT_EMAIL = 'sales@litex.com.tw';

export default defineConfig({
  site: SITE_URL,
  build: { format: 'directory' },
  integrations: [
    sitemap({
      // /enquiry-sent/ is a confirmation page. Indexed, it would tell a stranger arriving
      // from a search result that LiTex has their enquiry, which is false and alarming.
      //
      // /404 is excluded explicitly rather than trusting the integration to drop it. Its
      // default handling of the 404 route was not verified, and an unverified default is
      // not a reason to leave an assertion unable to pass.
      filter: (page) => !page.includes('/enquiry-sent/') && !page.includes('/404'),
    }),
  ],
});
```

- [ ] **Step 5: Write `public/robots.txt`**

```
# LiTex Textile & Technology
# Everything on this site is public and intended to be found. The only exclusions are
# handled per-page with <meta name="robots" content="noindex"> — the 404 page and the
# enquiry confirmation — because those are about how a page should be treated once
# reached, not about crawling.

User-agent: *
Allow: /

Sitemap: https://litex.com.tw/sitemap-index.xml
```

- [ ] **Step 6: Mark the confirmation page noindex**

In `src/pages/enquiry-sent/index.astro`, add the prop to the layout call:

```astro
<BaseLayout
  title="Enquiry received — LiTex Textile & Technology"
  description="LiTex has received your enquiry."
  noindex
>
```

- [ ] **Step 7: Build, test, commit**

Run: `npm run build && npm test`
Expected: all green.

```bash
git add astro.config.mjs package.json package-lock.json public/robots.txt \
        src/pages/enquiry-sent/index.astro tests/launch.test.ts
git commit -m "feat: add sitemap and robots.txt, keeping the confirmation page out of both"
```

---

### Task 4: The favicon

The site has never had one. `/favicon.ico` currently 404s (and, before Task 1, misleadingly returned 200).

**There is no LiTex logo anywhere in `archive/`.** The only logo files there belong to trade-show organisers and are third-party marks the usage grant does not cover. The mark below is therefore **typographic and drawn as paths** — an "L" in the site's own copper on the site's own near-black. It asserts nothing about LiTex's brand that the site does not already assert with its wordmark, and it depends on no font being installed.

**Files:**
- Create: `public/favicon.svg`, `public/apple-touch-icon.png`, `scripts/make-favicon.mjs`
- Modify: `src/layouts/BaseLayout.astro`, `package.json`, `tests/launch.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/launch.test.ts`:

```ts
import { allHtmlFiles } from './helpers/dist';

describe('favicon', () => {
  it('ships an SVG icon and a touch icon', () => {
    expect(existsSync(join(DIST, 'favicon.svg'))).toBe(true);
    expect(existsSync(join(DIST, 'apple-touch-icon.png'))).toBe(true);
  });

  it('uses the site\'s own copper, not an arbitrary colour', () => {
    expect(readFileSync(join(DIST, 'favicon.svg'), 'utf8')).toContain('#C87941');
  });

  // Drawn as paths deliberately: an SVG favicon containing <text> renders in whatever
  // font the viewer happens to have, which is not a design decision anyone made.
  it('depends on no font being installed', () => {
    expect(readFileSync(join(DIST, 'favicon.svg'), 'utf8')).not.toContain('<text');
  });

  it('is linked from every page', () => {
    for (const file of allHtmlFiles()) {
      const html = readFileSync(file, 'utf8');
      expect(html, `${file} has no favicon link`).toContain('rel="icon"');
    }
  });
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npm run build && npx vitest run tests/launch.test.ts`
Expected: FAIL — no `favicon.svg`.

- [ ] **Step 3: Write the mark**

```svg
<!-- public/favicon.svg -->
<!--
  LiTex mark: an "L" in the site's copper (--c-copper, #C87941) on its near-black
  (--c-base, #0A0C0D). Drawn as a path rather than <text> so it does not depend on
  Archivo — or any font — being installed on the viewer's machine.

  There is no LiTex logo in archive/; the only logo files there are trade-show
  organisers' marks, which the usage grant does not cover. This is deliberately a
  typographic device, not an invented brand mark.
-->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="LiTex">
  <rect width="64" height="64" rx="12" fill="#0A0C0D"/>
  <path d="M20 14h9v29h17v7H20z" fill="#C87941"/>
</svg>
```

- [ ] **Step 4: Write the rasteriser**

```js
// scripts/make-favicon.mjs
/**
 * Rasterises public/favicon.svg to public/apple-touch-icon.png at 180x180.
 *
 * Run manually (`npm run favicon`) and commit the output — it is not part of the build,
 * because the source SVG changes roughly never and a build-time raster step would add a
 * sharp dependency to every deploy for no benefit.
 *
 * No .ico is produced: sharp cannot write ICO, and every browser this site targets takes
 * an SVG icon. A request for /favicon.ico now returns a real 404 (see Task 1), which
 * browsers handle silently.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const svg = fileURLToPath(new URL('../public/favicon.svg', import.meta.url));
const png = fileURLToPath(new URL('../public/apple-touch-icon.png', import.meta.url));

// Read into a Buffer first: sharp holds files open on Windows, so streaming from a path
// you may later write next to is a known way to lose an afternoon.
const source = readFileSync(svg);
const out = await sharp(source).resize(180, 180).png().toBuffer();
writeFileSync(png, out);

console.log(`Wrote ${png} (${out.length} bytes)`);
```

Add to `package.json` scripts:

```json
"favicon": "node scripts/make-favicon.mjs",
```

- [ ] **Step 5: Generate the PNG**

Run: `npm run favicon`
Expected: writes `public/apple-touch-icon.png` and prints its size.

- [ ] **Step 6: Link it from every page**

In `src/layouts/BaseLayout.astro`, inside `<head>`:

```astro
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

- [ ] **Step 7: Build, test, look at it**

Run: `npm run build && npm test`
Expected: all green.

Then **actually look at the icon** at 16px — open `public/favicon.svg` in a browser and zoom out, or check the tab icon in `npm run dev`. An "L" that reads as a filled block at small sizes is a failed favicon; report what you see rather than assuming the geometry works.

- [ ] **Step 8: Commit**

```bash
git add public/favicon.svg public/apple-touch-icon.png scripts/make-favicon.mjs \
        src/layouts/BaseLayout.astro package.json tests/launch.test.ts
git commit -m "feat: add a typographic favicon, drawn as paths so it needs no font"
```

---

### Task 5: Print stylesheet

Spec §5 asks for one. The audience is concrete: a buyer printing a spec table to take into a meeting, or filing a PDF against a purchase order.

**Files:**
- Modify: `src/styles/global.css`, `tests/launch.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/launch.test.ts`:

```ts
describe('print stylesheet', () => {
  // Astro bundles component and global CSS into dist/_astro/*.css. The assertion is
  // deliberately coarse — that print rules survived the bundler at all. What they look
  // like on paper is checked by eye in this task's final step, because no static
  // assertion can tell you a spec table broke across a page boundary.
  it('ships print rules in the built CSS', () => {
    const css = walk(join(DIST, '_astro'))
      .filter((f) => f.endsWith('.css'))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    expect(css, 'no @media print rules reached the build').toContain('@media print');
  });
});
```

Add `walk` to the imports from `./helpers/dist` at the top of the file.

- [ ] **Step 2: Run and watch it fail**

Run: `npm run build && npx vitest run tests/launch.test.ts`
Expected: FAIL — no `@media print` in the bundled CSS.

- [ ] **Step 3: Write the print rules**

Append to `src/styles/global.css`:

```css
/* ---------------------------------------------------------------------------
   Print. The realistic use is a buyer printing a specification table to take
   into a meeting, or filing one against a purchase order — so the priorities
   are legible tables, visible link targets, and no wasted ink on chrome.
   --------------------------------------------------------------------------- */
@media print {
  :root {
    /* Paper is white and ink is expensive. Re-point the tokens rather than
       overriding every rule that uses them. */
    --c-base: #FFFFFF;
    --c-raised: #FFFFFF;
    --c-text-1: #000000;
    --c-text-2: #333333;
    --c-line: #999999;
    --c-copper: #000000;
    --c-copper-lift: #000000;
  }

  body { background: #FFFFFF; color: #000000; }

  /* Navigation, the footer, the skip link and both enquiry forms are interactive
     surfaces with no meaning on paper. */
  header[data-sitenav], nav, footer[data-sitefooter], .skip-link,
  form.enquiry, .cf-turnstile {
    display: none !important;
  }

  .page { max-width: none; padding: 0; }

  /* A printed link is a dead end unless the reader can see where it went. Internal
     links are left alone: the path alone tells them nothing without the domain. */
  main a[href^="http"]::after {
    content: " (" attr(href) ")";
    font-size: 0.85em;
    word-break: break-all;
  }

  /* Keep a specification table intact. A table split across a page boundary loses
     its header row, which is the part carrying the units. */
  table { break-inside: avoid; border-collapse: collapse; }
  thead { display: table-header-group; }
  tr, img, figure { break-inside: avoid; }

  h1, h2, h3 { break-after: avoid; }

  img { max-width: 100% !important; }
}
```

> **Check the selectors before trusting them.** `header[data-sitenav]` and
> `footer[data-sitefooter]` are written from the existing chrome components — open
> `src/components/SiteNav.astro` and `SiteFooter.astro` and confirm the attributes are
> exactly those. `tests/legal.test.ts` already queries `footer[data-sitefooter]`, so that
> one is known good; **verify the nav's attribute yourself** and correct the rule if it
> differs rather than leaving a selector that silently matches nothing.

- [ ] **Step 4: Build, test, and look at it on paper**

Run: `npm run build && npm test`
Expected: all green.

Then run `npm run dev`, open `/products/conductive-metal-yarn/`, and use the browser's
**Print Preview**. Confirm: no nav or footer, the spec table is readable and its header row
is intact, and text is black on white. Do the same for `/contact/` — the form must be gone
but the address block must remain, because that is the useful half on paper. **Report what
you saw**; this is the only check that matters here.

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css tests/launch.test.ts
git commit -m "feat: add a print stylesheet built around the printed spec table"
```

---

### Task 6: The broken-link sweep

Now meaningful in a way it was not before Task 1: with real 404 semantics, a dead internal link is a real failure rather than a silent 200.

**Files:**
- Modify: `tests/launch.test.ts`

This task adds no production code. It is a gate.

- [ ] **Step 1: Write the test**

Append to `tests/launch.test.ts`:

```ts
describe('no internal link or asset is dead', () => {
  /** Everything the build emitted, as site-absolute paths. */
  function builtPaths(): Set<string> {
    return new Set(
      walk(DIST).map((f) => f.slice(DIST.length).split('\\').join('/')),
    );
  }

  const built = builtPaths();

  /** Does this site-absolute href resolve to something the build emitted? */
  function resolves(href: string): boolean {
    if (built.has(href)) return true;                       // a file, e.g. /catalogs/x.pdf
    if (built.has(`${href}index.html`)) return true;        // /contact/  -> /contact/index.html
    if (built.has(`${href}/index.html`)) return true;       // /contact   -> /contact/index.html
    return false;
  }

  it('resolves every internal href on every page', () => {
    const dead: string[] = [];

    for (const file of allHtmlFiles()) {
      const doc = docFor(file.slice(DIST.length + 1).split('\\').join('/'));
      for (const a of [...doc.querySelectorAll('a[href]')]) {
        const href = a.getAttribute('href') ?? '';
        // External, in-page, and non-HTTP schemes are somebody else's problem.
        if (!href.startsWith('/')) continue;
        const path = href.split('#')[0].split('?')[0];
        if (path === '') continue;
        if (!resolves(path)) dead.push(`${file}: ${href}`);
      }
    }

    expect(dead, 'dead internal links').toEqual([]);
  });

  it('resolves every image, script and stylesheet it references', () => {
    const dead: string[] = [];

    for (const file of allHtmlFiles()) {
      const doc = docFor(file.slice(DIST.length + 1).split('\\').join('/'));
      for (const el of [...doc.querySelectorAll('img[src], script[src], link[href]')]) {
        const url = el.getAttribute('src') ?? el.getAttribute('href') ?? '';
        if (!url.startsWith('/')) continue;
        if (!resolves(url.split('?')[0])) dead.push(`${file}: ${url}`);
      }
    }

    expect(dead, 'dead asset references').toEqual([]);
  });
});
```

- [ ] **Step 2: Run it**

Run: `npm run build && npx vitest run tests/launch.test.ts`

**Expected: it may well FAIL, and that is the point.** This check has never run against this
site. If it names dead links, **fix them and report each one** — do not weaken the test. Two
things it will legitimately flag and which need judgement rather than a fix to the test:

- `srcset` candidates are not checked here (only `src`), so a broken `srcset` will not appear. Noted, not solved.
- If a page links `/sitemap-index.xml` or another non-HTML file, `resolves()` handles it via the first branch.

- [ ] **Step 3: Prove the guard works**

Add a deliberately dead link to `src/pages/404.astro` — `<a href="/no-such-page/">probe</a>` —
rebuild, and confirm the test fails naming it. Remove it, rebuild, confirm green. **Report the
failure text you saw.** A link checker that has never failed has not been tested.

- [ ] **Step 4: Commit**

```bash
git add tests/launch.test.ts
git commit -m "test: fail the build on any dead internal link or asset reference"
```

---

### Task 7: Accessibility, measured

Spec §4 requires axe checks on one representative page per template type. Until now the suite
has checked structure with linkedom, which cannot see contrast, computed roles, or focus order.

**Files:**
- Create: `tests/helpers/serve.ts`, `tests/a11y.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Install the tooling**

```bash
npm install --save-dev playwright @axe-core/playwright
npx playwright install chromium
```

`npx playwright install chromium` downloads a browser binary — **it is a machine setup step, not
a repo artefact**, and CI would need it too. Note it in your report.

- [ ] **Step 2: Write the static server helper**

```ts
// tests/helpers/serve.ts
/**
 * A minimal static server over dist/, so the accessibility run drives a real browser
 * against the real build.
 *
 * It mirrors Cloudflare's behaviour deliberately: a directory path resolves to its
 * index.html, and anything unmatched gets 404 with dist/404.html. Serving unmatched paths
 * as the homepage — which is what Cloudflare did before Task 1 — would let a broken link
 * pass an accessibility check by scanning the homepage twice.
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
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
  '.woff2': 'font/woff2',
};

export async function serveDist(): Promise<{ origin: string; close: () => Promise<void> }> {
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
    close: () => new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve()))),
  };
}
```

- [ ] **Step 3: Write the accessibility test**

```ts
// tests/a11y.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser } from 'playwright';
// Default import. @axe-core/playwright ships AxeBuilder as its default export; a named
// import (`import { AxeBuilder }`) fails on several published versions. If this line
// errors at runtime, check the installed package's exports before changing anything else —
// do not assume the test is wrong.
import AxeBuilder from '@axe-core/playwright';
import { serveDist } from './helpers/serve';

/** One per template type. Adding a template means adding a row here. */
const PAGES: [name: string, path: string][] = [
  ['homepage', '/'],
  ['product index', '/products/'],
  ['product detail, with spec table', '/products/conductive-metal-yarn/'],
  ['technology', '/technology/'],
  ['news index', '/news/'],
  ['news post', '/news/techtextil-frankfurt/'],
  ['company page with figures', '/company/about/'],
  ['downloads', '/downloads/'],
  ['form page', '/contact/'],
  ['legal', '/legal/privacy/'],
  ['404', '/this-path-does-not-exist/'],
];

let server: Awaited<ReturnType<typeof serveDist>>;
let browser: Browser;

beforeAll(async () => {
  server = await serveDist();
  browser = await chromium.launch();
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

describe.each(PAGES)('%s (%s)', (_name, path) => {
  it('has no WCAG 2 A or AA violations', async () => {
    const page = await browser.newPage();

    // Keep the run hermetic and offline: Turnstile's widget is a live third-party script,
    // and an accessibility suite that fails when Cloudflare is slow is a suite people
    // learn to ignore. Blocking it also means the two form pages are checked as they
    // render for a visitor whose network blocked the widget — a real scenario.
    await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());

    await page.goto(`${server.origin}${path}`, { waitUntil: 'load' });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const summary = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.length,
      help: v.help,
      example: v.nodes[0]?.html?.slice(0, 200),
    }));

    await page.close();
    expect(summary, `axe violations on ${path}`).toEqual([]);
  }, 60_000);
});
```

- [ ] **Step 4: Add the script and a longer default timeout**

In `package.json`:

```json
"test:a11y": "vitest run tests/a11y.test.ts",
```

Browser launch routinely exceeds Vitest's 5-second default; the per-test timeouts above cover
it. If the whole file still times out, raise `testTimeout` in the Vitest config rather than
trimming the page list.

- [ ] **Step 5: Run it**

Run: `npm run build && npm run test:a11y`

**Expect real failures on the first run** — this has never been measured. For each violation,
**fix the page, not the test.** Likely candidates, based on what this site does:

- colour contrast on `--c-text-2` against `--c-raised` in small type (hints, captions, notes);
- the `.opt` "(optional)" and `.req` "*" markers in `EnquiryForm`;
- heading order on pages that jump `h1` → `h3`;
- `aria-hidden` on the honeypot wrapper, which contains a focusable input — it carries
  `tabindex="-1"`, which is the correct mitigation, but **if axe flags `aria-hidden-focus`,
  report it rather than silently disabling the rule.**

If a violation is genuinely a false positive, disable that single rule for that single page
with a comment explaining why — never globally.

- [ ] **Step 6: Commit**

```bash
git add tests/a11y.test.ts tests/helpers/serve.ts package.json package-lock.json
git commit -m "test: measure accessibility with axe against a real browser, one page per template"
```

Commit any page fixes separately, each naming the violation it resolves.

---

### Task 8: Cloudflare Web Analytics, disclosed

**Requires an input from the human:** the Web Analytics **token** for the production hostname,
obtained from **Web Analytics → Add a site → Manage site → the JS snippet**. Choose the **manual
snippet**, not automatic injection — see the note below, which is the whole reason this task is
shaped this way.

**Do not invent or guess a token.** If it is not available yet, stop and say so; every other task
in this plan is independent of this one.

**Files:**
- Modify: `src/layouts/BaseLayout.astro`, `src/pages/legal/privacy.astro`, `tests/legal.test.ts`

> **Why the manual snippet.** For a Cloudflare-proxied site, automatic injection is the default:
> Cloudflare inserts the beacon with no code change. That would make the analytics script
> **invisible to `tests/legal.test.ts`**, whose whole job is to fail when an undisclosed third
> party appears. The privacy notice could then quietly become untrue with nobody's fingerprints
> on it. A manual snippet keeps the disclosure mechanical.

- [ ] **Step 1: Write the failing test**

In `tests/legal.test.ts`, extend the allowlist and add the assertions:

```ts
  const DISCLOSED = new Set([
    'https://challenges.cloudflare.com/turnstile/v0/api.js',
    'https://static.cloudflareinsights.com/beacon.min.js',
  ]);
```

Then add:

```ts
  it('loads the analytics beacon on every page', () => {
    for (const file of allHtmlFiles()) {
      expect(
        readFileSync(file, 'utf8'),
        `${file} is missing the analytics beacon`,
      ).toContain('static.cloudflareinsights.com/beacon.min.js');
    }
  });

  it('discloses the analytics it now runs', () => {
    const text = docFor('legal/privacy/index.html').body.textContent ?? '';
    expect(text).toContain('Cloudflare Web Analytics');
    // The cookieless property is the reason this vendor was chosen (spec §4) and the
    // reason the site needs no consent banner. If it stops being true, this page is wrong.
    expect(text.toLowerCase()).toContain('cookie');
  });
```

And **delete the now-false test** `claims no analytics only while the site really runs none`,
replacing it with the disclosure test above. Do not leave it commented out.

- [ ] **Step 2: Run and watch it fail**

Run: `npm run build && npx vitest run tests/legal.test.ts`
Expected: FAIL — no beacon, and the old "no analytics" assertion now contradicts the page.

- [ ] **Step 3: Add the beacon**

In `src/layouts/BaseLayout.astro`, immediately before `</body>`:

```astro
    <!--
      Cloudflare Web Analytics. Cookieless and collects no personal data, which is why
      spec §4 chose it: no consent banner, which matters for EU buyers.

      is:inline is required. Without it Astro rewrites this into a local module that
      imports the remote URL, and the third-party guard in tests/legal.test.ts — which
      reads HTML attributes — would stop being able to see it. Same reason the Turnstile
      tag carries it.

      The manual snippet is used deliberately in preference to Cloudflare's automatic
      injection, so that the script is visible to that guard and to anyone reading the
      built HTML.
    -->
    <script
      is:inline
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={`{"token": "${CF_ANALYTICS_TOKEN}"}`}
    ></script>
```

Declare the token at the top of the layout's frontmatter, next to the other site constants:

```astro
// Cloudflare Web Analytics token for litex.com.tw. Public by design — it identifies the
// site being measured, not an account, and ships in the HTML of every page.
const CF_ANALYTICS_TOKEN = '<the token from the dashboard>';
```

- [ ] **Step 4: Update the privacy notice**

Read `src/pages/legal/privacy.astro` and match its voice. It must now say, in its own words:

- that the site uses **Cloudflare Web Analytics**;
- that it is **cookieless** and sets nothing on the visitor's device, which is why there is no consent banner;
- that it records aggregate page-view data, not individuals;
- and the existing sentence naming the form pages as the exception to "served from this domain" must be widened, because the beacon now loads on **every** page.

- [ ] **Step 5: Build, test, commit**

Run: `npm run build && npm test`
Expected: all green.

```bash
git add src/layouts/BaseLayout.astro src/pages/legal/privacy.astro tests/legal.test.ts
git commit -m "feat: add cookieless analytics and disclose it in the privacy notice"
```

- [ ] **Step 6: Prove the allowlist still bites**

The `DISCLOSED` set has changed, so it is unproven. Add
`<script src="https://example.org/tracker.js"></script>` to `BaseLayout.astro`, rebuild, confirm
`tests/legal.test.ts` FAILS naming that URL, then revert and confirm green. **Report the failure
text.**

---

### Task 9: Verify against reality, and hand over to Plan 9

**Files:**
- Modify: `docs/deployment.md`, `HANDOFF.md`

- [ ] **Step 1: Full local verification**

```bash
npm run build && npm test && npm run test:a11y
node .claude/skills/impeccable/scripts/detect.mjs src/components src/pages src/styles
grep -roE '[a-zA-Z,;:.]<(span|a|strong|em)\b' dist/404.html dist/contact dist/request-a-sample
```

Expected: **36 pages**, whole suite green, a11y green, detector clean, spacing sweep empty.

- [ ] **Step 2: Verify against the deployed site**

After merge and redeploy, run each and **record the actual output**:

```bash
curl -s -o /dev/null -w "404 page:        %{http_code}\n" https://litex-website.pages.dev/no-such-page-xyz/
curl -s -o /dev/null -w "redirect:        %{http_code} -> %{redirect_url}\n" https://litex-website.pages.dev/about-2/
curl -s -o /dev/null -w "gone (slash):    %{http_code}\n" https://litex-website.pages.dev/2016/09/22/test-post-blah/
curl -s -o /dev/null -w "gone (bare):     %{http_code}\n" https://litex-website.pages.dev/2016/09/22/test-post-blah
curl -s -o /dev/null -w "robots:          %{http_code}\n" https://litex-website.pages.dev/robots.txt
curl -s -o /dev/null -w "sitemap:         %{http_code}\n" https://litex-website.pages.dev/sitemap-index.xml
curl -s -o /dev/null -w "favicon:         %{http_code}\n" https://litex-website.pages.dev/favicon.svg
```

Expected: `404`, `301 -> …/company/about/`, `410`, `410`, `200`, `200`, `200`.

- [ ] **Step 3: Run Lighthouse once, by hand, and write the numbers down**

Chrome DevTools → Lighthouse, mobile preset, against the deployed `/` and
`/products/conductive-metal-yarn/`. Spec §4's budget is **≥95** for performance,
accessibility and SEO.

Record all four scores per page in `docs/deployment.md`. **If a score is below 95, record it
honestly and say why** rather than re-running until it passes — the number is evidence, not a
target to hit.

- [ ] **Step 4: Update `docs/deployment.md`**

Add a section recording: the live verification results from Step 2, the Lighthouse numbers, that
`_redirects` and the 410 Function are in place, and that the analytics token is committed in
`BaseLayout.astro`. Mark the Turnstile and sitekey rows done. Note what remains: **Resend domain
verification and the Part F nameserver move.**

- [ ] **Step 5: Rewrite `HANDOFF.md` for session 10**

Preserve its structure and voice. Update the state block (36 pages, new test count), the roadmap
(**Plan 8 done, Plan 9 = Sveltia CMS + the deferred `SpecTable` CTA**), the "What Plan 9 inherits"
table, the carried-forward minors and the open questions.

**Add to "What NOT to redo":**
- `_redirects` deliberately holds **15** rules, not 22 — seven of spec §3's rows are identity mappings and writing them creates redirect loops.
- The 410 is a **Pages Function** because `_redirects` cannot express 410. Do not "simplify" it into the redirects file.
- The analytics beacon and the Turnstile tag are `is:inline` **so the third-party guard can see them**. Removing `is:inline` makes them invisible to the guard.

**Add to the open questions:** whether LiTex wants the `*.pages.dev` preview host de-indexed once
the custom domain is live (see "What this plan does not build").

- [ ] **Step 6: Final commit**

```bash
git add docs/deployment.md HANDOFF.md
git commit -m "docs: record launch verification and hand over to Plan 9"
```

---

## Definition of Done

Verified by observation. Where a guard is claimed, break it and watch it fail.

1. `npm run build` exits 0 at **36 pages** (35 + `/404`).
2. `npm test` passes; **no existing assertion was weakened** to make room. `npm run test:a11y` passes.
3. **A missing URL on the deployed site returns 404**, not 200 with the homepage — checked with `curl`, because this is the defect that started the plan.
4. `dist/_redirects` holds **exactly 15 rules**, all `301`, **none redirecting a path to itself**, and every destination resolves to a built page.
5. `/2016/09/22/test-post-blah/` returns **410** on the deployed site, in both the trailing-slash and bare forms.
6. `sitemap-index.xml` and `sitemap-0.xml` exist; the sitemap **excludes** `/enquiry-sent/` and `/404`; that page also carries `noindex`.
7. `robots.txt` names `https://litex.com.tw/sitemap-index.xml`.
8. A favicon is linked from **every** built page, contains no `<text>`, and was **looked at** at small size.
9. `@media print` rules reach the bundled CSS, and print preview was checked by eye on a spec-table page and on `/contact/`.
10. The broken-link sweep passes, **and was proved** by introducing a dead link and watching it fail.
11. axe reports **zero** WCAG 2 A/AA violations across all eleven representative pages; any suppression is per-rule, per-page, and justified in a comment.
12. The analytics beacon loads on every page, `/legal/privacy/` discloses it as cookieless, and the rewritten third-party guard **fails** when an undisclosed script is added.
13. Lighthouse numbers for two pages are **recorded in `docs/deployment.md`**, whatever they are.

# LiTex Website — Plan 4: Site Chrome & the Technology Section

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the site navigable — header, footer, credibility bar, a real homepage — and build the two `/technology/` pages that carry LiTex's core technical argument, with a link-integrity guard so no page can ship pointing at a route that does not exist.

**Architecture:** Navigation is a single exported array (`src/lib/nav.ts`) rendered by one component, so adding a section is a one-line change and a test can walk every link to a real file in `dist/`. Company facts live once in `src/lib/company.ts` rather than being retyped into markup. The heating-element comparison is data rendered through Plan 2's existing `SpecTable`, keeping the spec's "specs are data, not prose" principle. The yarn-structure diagram is inline SVG — spec §5 Tier 1 — drawn from the covering counts in the catalog, so it is accurate by construction.

**Tech Stack:** Astro 7.2.0 · Vitest 4 · linkedom — no new dependencies.

## Why this plan exists

**The site currently has no navigation of any kind.** `src/layouts/BaseLayout.astro` is `<head>`, a skip link and `<main>`. There is no header, no nav, no footer, and `main` has no width constraint. `src/pages/index.astro` is a single `<h1>` and nothing else. Every route Plans 1–3 built — 7 products, 6 applications, 2 indexes — is reachable only by typing its URL. Whatever pages get added next are equally unreachable until this is fixed, which is why chrome comes before more content.

`/technology/` is the right content to pair with it. Spec §3 gives it two routes, spec §6 already holds all the source data, and `/technology/heating-element-comparison/` is the 301 target for `/2018/12/06/new-electrical-heating-alternatives-to-consider/` — a redirect Plan 6 cannot wire until the route exists.

## Global Constraints

Every task's requirements implicitly include this section. These carry over from Plans 1–3 and remain in force.

- **Astro `7.2.0`**, pinned. **No React, Vue, or any UI framework.**
- **Never call `getEntry()` bare** — wrap in `mustResolve()` from `src/lib/references.ts`. Astro 7.2.0 does not fail the build on a broken `reference()`.
- **Colour tokens only** in components — `var(--c-*)`, never a literal hex. Tokens are defined in `src/styles/tokens.css`; `tests/tokens.test.ts` asserts their contrast on both surfaces.
- **Fonts are Archivo (`--font-display`) and IBM Plex Mono (`--font-mono`) only.** Monospace is reserved for values that have units — the `.value` class in `global.css`.
- **`mail@example.com` is theme boilerplate and is banned.** A build test fails if any page renders an `example.com` string. The real address is `sales@litex.com.tw`.
- **Images belong in `src/assets/`, never `public/`.** Every image needs real alt text describing what is shown.
- **Never invent product or company facts.** Every claim on these pages must trace to `archive/`. Where a source is 8–13 years old, say so rather than presenting it as current.
- **Exactly one `<h1>` per page.** The masthead wordmark is not a heading.
- **Commit after every task.** Conventional prefixes (`feat:`, `test:`, `chore:`).
- Run `node .claude/skills/impeccable/scripts/detect.mjs --json src/components src/pages src/styles` before each commit; expect `[]`.

## Source inventory — verified 2026-08-11

Everything this plan publishes traces to one of these. All were read directly, not taken on trust.

| Fact | Source | Verified |
|---|---|---|
| Founded 1999, spinoff of Hen Hao Trading, grew via woven metal for heavy industry | `archive/pages/about.html` | Read in full |
| 188 Bangka Blvd., Wanhua Dist., Taipei, Taiwan 108 · +886-2-2308-4712 · Mon–Fri 09:00–18:00 | `archive/pages/about.html` contact widget | Read in full |
| `sales@litex.com.tw` | `archive/pages/news-2017-wearable-expo.html` body text | Read in full — independent of `astro.config.mjs` |
| Legal name **富鉅紡織科技股份有限公司 / LiTex Textile & Technology Co., Ltd** | TAITRONICS certificate, `2018-company-introduction.pdf` p.2 xref 5 | Rendered at 1035×442 and read |
| Structure: metal layer helically coiled over a core polymer yarn; sample shown is 1S | `archive/extracted-from-images.md` §6, from `images/cmy-structure1.jpg` (SEM ×300, 100 µm bar) | Read in full |
| Covering counts 1S/1S1Z/2S2Z/3S3Z/4S4Z = 1/2/4/6/8 coverings; resistance ~4.4→~0.8 Ω/M; toughness weaker→stronger | `archive/extracted-from-images.md` §7, from the heating catalog p.3 | Read in full |
| Coverings are tinned copper; coatings PU and FEP (Teflon); CuNi "coming soon" as of 2018 | same | Read in full |
| Heating-element comparison, 4 rows | `archive/extracted-from-images.md` §8 | Read in full |
| Fabric width customisable up to 70 cm | same | Read in full |

**Do not re-derive these.** Plan 3 established that a plan's "verified" claims about *images* deserve re-checking; the rows above are text transcriptions that were read directly from the archived HTML during planning.

## Held for a later plan — do not use here

Verified present and correctly described on 2026-08-11 by rendering each through `fitz.Pixmap`, but belonging to pages this plan does not build:

| Asset | Actual content | Belongs to |
|---|---|---|
| `2018-company-introduction.pdf` p.2 xref 5 (1035×442) | US patent certificate (granted-patent cover, signed David J. Kappos, **number not legible**), TAITRONICS 優選獎 Quality Award dated 2014.9.29 for 非碳纖維電子發熱紡織品, SGS Test Report **CE/2013/52203** | `/company/certifications/`, `/company/patents-and-awards/` |
| same PDF p.1 xref 52 (989×692) | Loom with LiTex-branded tape, two framed certificates, a spool of woven tape | `/company/about/` |
| same PDF p.1 xref 54 (1024×536) | Factory floor — creels, spools, machinery, three panels | `/company/about/` |
| same PDF p.2 xref 8 (626×504) | Trade-show booth and three staff under a LITEX TEXTILE & TECH. CO., LTD. sign | `/company/about/` |
| same PDF p.2 xref 6 (746×253) and heating PDF p.1 xref 122 (1310×462) | Tan woven heating textile beside a thermograph, labelled "Thermograph" | `/technology/` — **see open question 1** |

> The thermograph is the strongest visual evidence for "even and stable heating" and belongs on `/technology/`. It is deliberately **not** used in this plan because the test conditions behind it are unknown (spec §7 item 5). Publishing a thermal image as evidence of a measurable claim without stating input voltage, duration and ambient temperature invites exactly the diligence failure this redesign exists to fix. Task 4 links the claim to the catalog instead.

## File Structure

| Path | Responsibility |
|---|---|
| `src/lib/nav.ts` | The single list of primary navigation routes |
| `src/lib/company.ts` | Company facts and the credibility bar items, defined once |
| `src/components/SiteNav.astro` | Masthead: wordmark + primary nav with `aria-current` |
| `src/components/SiteFooter.astro` | Credibility bar, contact block, secondary links |
| `src/components/YarnStructureDiagram.astro` | Tier 1 inline SVG — core plus N coverings, S/Z handedness |
| `src/data/heatingComparison.ts` | The 4-row competitive comparison as typed data |
| `src/layouts/BaseLayout.astro` | **Modified** — mounts nav and footer, adds the page container |
| `src/styles/global.css` | **Modified** — `.page` container, heading rhythm |
| `src/pages/index.astro` | **Modified** — real homepage: statement + two doors |
| `src/pages/technology/index.astro` | How Conductive Metal Yarn works |
| `src/pages/technology/heating-element-comparison.astro` | CMY vs carbon fibre vs heating film vs steel fibre |
| `tests/chrome.test.ts` | Nav/footer presence, link integrity, `aria-current`, single-h1 |
| `tests/technology.test.ts` | Both technology routes, the comparison table, diagram accessibility |
| `tests/imagery.test.ts` | **Extended** — Tier 3 rule for `/technology/` and `/company/` |

---

### Task 1: Site header, navigation and the page container

Nav lives in one array so that adding a section is a one-line change, and so a test can iterate it. It starts with only the routes that already exist — Task 4 appends `/technology/`. A nav entry pointing at an unbuilt route is a broken link on every page of the site, which is why the link-integrity test lands in this task rather than at the end.

**Files:**
- Create: `src/lib/nav.ts`, `src/components/SiteNav.astro`
- Modify: `src/layouts/BaseLayout.astro`, `src/styles/global.css`
- Test: `tests/chrome.test.ts`

**Interfaces:**
- Produces: `NAV: readonly NavItem[]` where `type NavItem = { href: string; label: string }`, from `src/lib/nav.ts`. Task 4 appends one entry.
- Produces: `SiteNav.astro`, no props — it reads `Astro.url.pathname` itself.

- [ ] **Step 1: Write the failing chrome tests**

Create `tests/chrome.test.ts`:

```ts
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { parseHTML } from 'linkedom';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html'));

function docFor(relativePath: string) {
  return parseHTML(readFileSync(join(DIST, relativePath), 'utf8')).document;
}

/** Maps an internal href to the file Astro's build.format:'directory' emits for it. */
function routeFile(href: string): string {
  const clean = href.replace(/^\//, '').replace(/\/$/, '');
  return clean === '' ? 'index.html' : `${clean}/index.html`;
}

describe('site chrome', () => {
  it('puts a masthead and a footer on every generated page', () => {
    for (const file of htmlFiles) {
      const doc = parseHTML(readFileSync(file, 'utf8')).document;
      expect(doc.querySelector('header[data-masthead]'), `${file} has no masthead`).toBeTruthy();
      expect(doc.querySelector('footer[data-sitefooter]'), `${file} has no footer`).toBeTruthy();
    }
  });

  it('offers primary navigation to the sections that exist', () => {
    const doc = docFor('index.html');
    const hrefs = [...doc.querySelectorAll('nav[aria-label="Primary"] a')]
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/products/');
    expect(hrefs).toContain('/applications/');
  });

  // A nav link to an unbuilt route is broken on every page at once. This is the
  // cheapest possible guard against that, and it runs before Plan 6's link checker.
  it('never links from the chrome to a route the build did not generate', () => {
    const broken: string[] = [];
    for (const file of htmlFiles) {
      const doc = parseHTML(readFileSync(file, 'utf8')).document;
      const chrome = [
        ...doc.querySelectorAll('header[data-masthead] a'),
        ...doc.querySelectorAll('footer[data-sitefooter] a'),
      ];
      for (const a of chrome) {
        const href = a.getAttribute('href') ?? '';
        if (!href.startsWith('/')) continue; // external and mailto/tel are not our routes
        if (!existsSync(join(DIST, routeFile(href)))) broken.push(`${file} → ${href}`);
      }
    }
    expect(broken, `chrome links with no page behind them:\n${broken.join('\n')}`).toEqual([]);
  });

  it('marks the current section in the nav for assistive tech', () => {
    const doc = docFor('products/index.html');
    const current = doc.querySelector('nav[aria-label="Primary"] a[aria-current="page"]');
    expect(current?.getAttribute('href')).toBe('/products/');
  });

  it('does not let the wordmark introduce a second h1', () => {
    for (const file of htmlFiles) {
      const doc = parseHTML(readFileSync(file, 'utf8')).document;
      expect(doc.querySelectorAll('h1').length, `${file} h1 count`).toBe(1);
    }
  });

  it('keeps the skip link ahead of the masthead in source order', () => {
    const doc = docFor('index.html');
    const first = doc.body.querySelector('a, header');
    expect(first?.getAttribute('class')).toContain('skip-link');
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npm run build && npx vitest run tests/chrome.test.ts`
Expected: FAIL — no `header[data-masthead]` exists anywhere.

- [ ] **Step 3: Create `src/lib/nav.ts`**

```ts
/**
 * Primary navigation, in display order.
 *
 * Add a route here only once the page exists — tests/chrome.test.ts walks every
 * chrome link and fails if the build emitted no file behind it. That is deliberate:
 * a broken nav entry is broken on every page of the site simultaneously.
 */
export type NavItem = { href: string; label: string };

export const NAV: readonly NavItem[] = [
  { href: '/products/', label: 'Products' },
  { href: '/applications/', label: 'Applications' },
];
```

- [ ] **Step 4: Create `src/components/SiteNav.astro`**

```astro
---
import { NAV } from '../lib/nav';

const here = Astro.url.pathname;
// A section is current when you are on its index or anywhere beneath it, so a
// product detail page still shows Products as the active section.
const isCurrent = (href: string) => here === href || here.startsWith(href);
---
<header class="masthead" data-masthead>
  <div class="inner">
    <a class="wordmark" href="/">
      <span class="name">LiTex</span>
      <span class="sub">Textile &amp; Technology</span>
    </a>

    <nav aria-label="Primary">
      <ul>
        {NAV.map((item) => (
          <li>
            <a href={item.href} aria-current={isCurrent(item.href) ? 'page' : undefined}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  </div>
</header>

<style>
  .masthead {
    border-bottom: 1px solid var(--c-line);
    background: var(--c-base);
  }
  .inner {
    max-width: 76rem;
    margin: 0 auto;
    padding: var(--s-4) var(--s-6);
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-4) var(--s-8);
    align-items: baseline;
    justify-content: space-between;
  }
  .wordmark {
    color: var(--c-text-1);
    text-decoration: none;
    display: flex;
    align-items: baseline;
    gap: var(--s-3);
  }
  .name {
    font-size: var(--t-20);
    font-weight: 600;
    letter-spacing: 0.01em;
  }
  .sub {
    font-family: var(--font-mono);
    font-size: var(--t-10);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--c-text-2);
  }
  .wordmark:hover .name { color: var(--c-copper-lift); }

  nav ul {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-6);
    margin: 0;
    padding: 0;
  }
  nav a {
    font-family: var(--font-mono);
    font-size: var(--t-12);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--c-text-2);
    text-decoration: none;
    padding-bottom: var(--s-1);
    border-bottom: 1px solid transparent;
  }
  nav a:hover { color: var(--c-text-1); }
  /* The active section is marked by colour *and* a rule, never colour alone. */
  nav a[aria-current='page'] {
    color: var(--c-copper);
    border-bottom-color: var(--c-copper);
  }
</style>
```

- [ ] **Step 5: Mount it in `src/layouts/BaseLayout.astro`**

Replace the whole file:

```astro
---
import '../styles/global.css';
import SiteNav from '../components/SiteNav.astro';

interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={new URL(Astro.url.pathname, Astro.site)} />
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to main content</a>
    <SiteNav />
    <main id="main" class="page">
      <slot />
    </main>
  </body>
</html>
```

- [ ] **Step 6: Add the page container to `src/styles/global.css`**

Append:

```css
/* Every page's content column. Pages had no width constraint before Plan 4 —
   long paragraphs ran the full viewport. */
.page {
  max-width: 76rem;
  margin: 0 auto;
  padding: var(--s-12) var(--s-6) var(--s-24);
}

h1, h2, h3 {
  line-height: 1.15;
  text-wrap: balance;
}
h1 { font-size: var(--t-40); margin: 0 0 var(--s-4); }
h2 { font-size: var(--t-26); margin: var(--s-12) 0 var(--s-4); }
h3 { font-size: var(--t-20); margin: var(--s-8) 0 var(--s-3); }
```

- [ ] **Step 7: Fix the one existing assertion that site-wide links break**

`tests/build.test.ts:323` counts **every** `/applications/` link on the applications index and expects exactly six:

```ts
  it('generates an index listing all six applications', () => {
    const doc = docFor('applications/index.html');
    const links = [...doc.querySelectorAll('a[href^="/applications/"]')]
      .map((a) => a.getAttribute('href'));
    expect(links).toHaveLength(6);
  });
```

A nav link and a footer link to `/applications/` make that eight, and the test fails. The
assertion is still worth keeping — it catches an application silently dropping off its own
index — so scope it to the content column rather than weakening the count:

```ts
  it('generates an index listing all six applications', () => {
    const doc = docFor('applications/index.html');
    // Scoped to main: the masthead and footer also link /applications/ site-wide.
    const links = [...doc.querySelectorAll('main a[href^="/applications/"]')]
      .map((a) => a.getAttribute('href'));
    expect(links).toHaveLength(6);
  });
```

The other three unscoped selectors in that file are safe: `tests/build.test.ts:149` and `:353`
assert `length > 0` and reachability, and `:332` uses `toContain`. Leave them.

- [ ] **Step 8: Build and run the suite**

Run: `npm run build && npm test`
Expected: build exits 0. `tests/chrome.test.ts` passes, and every earlier suite still passes. If the applications-index count fails here, Step 7 was skipped.

- [ ] **Step 9: Prove the link-integrity guard bites**

Temporarily add `{ href: '/company/', label: 'Company' }` to `NAV` — a route no plan has built yet — then run `npm run build && npx vitest run tests/chrome.test.ts`.
Expected: FAIL, listing `/company/` against every page. Remove the entry and re-run to confirm green.

- [ ] **Step 10: Run the design detector**

Run: `node .claude/skills/impeccable/scripts/detect.mjs --json src/components src/pages src/styles`
Expected: `[]`.

- [ ] **Step 11: Commit**

```bash
git add src/lib/nav.ts src/components/SiteNav.astro src/layouts/BaseLayout.astro src/styles/global.css tests/build.test.ts tests/chrome.test.ts
git commit -m "feat: add site masthead, primary navigation and page container"
```

---

### Task 2: Footer, credibility bar and company facts

Spec §5 component 4 specifies the credibility bar verbatim: `REACH · RoHS · SGS TESTED · PATENTED TW 1M545145 · MANUFACTURING SINCE 1999`. Company facts get defined once here rather than retyped into every page that needs an address.

`CONTACT_EMAIL` already exists in `astro.config.mjs`, and pages must not import that file — doing so pulls `defineConfig` from `astro/config` into the page bundle, which is why `[slug].astro` uses `Astro.site` instead. So the address is declared in `src/lib/company.ts` for pages, and a test asserts the two declarations have not drifted apart.

**Files:**
- Create: `src/lib/company.ts`, `src/components/SiteFooter.astro`
- Modify: `src/layouts/BaseLayout.astro`
- Test: `tests/chrome.test.ts`

**Interfaces:**
- Produces: `COMPANY` (frozen object) and `CREDIBILITY` (readonly string array) from `src/lib/company.ts`.
- Produces: `SiteFooter.astro`, no props.

- [ ] **Step 1: Write the failing footer tests**

Append to `tests/chrome.test.ts`:

```ts
describe('site footer', () => {
  it('carries the credibility bar spec §5 specifies', () => {
    const text = docFor('index.html').querySelector('[data-credibility]')?.textContent ?? '';
    for (const claim of ['REACH', 'RoHS', 'SGS TESTED', 'TW 1M545145', 'SINCE 1999']) {
      expect(text, `credibility bar is missing ${claim}`).toContain(claim);
    }
  });

  it('publishes the real contact details, on every page', () => {
    for (const file of htmlFiles) {
      const html = readFileSync(file, 'utf8');
      expect(html, `${file} lost the contact address`).toContain('sales@litex.com.tw');
      expect(html, `${file} lost the phone number`).toContain('2308-4712');
    }
  });

  it('never reintroduces the theme placeholder contact details', () => {
    for (const file of htmlFiles) {
      const html = readFileSync(file, 'utf8');
      expect(html, `${file} contains placeholder contact details`).not.toContain('example.com');
      expect(html, `${file} contains the placeholder US address`).not.toContain('10 Street Road');
      expect(html, `${file} contains the placeholder phone`).not.toContain('555 1234');
    }
  });

  it('keeps the email in astro.config.mjs identical to the one pages render', async () => {
    // Two declarations exist on purpose: pages must not import astro.config.mjs.
    // They must never disagree.
    const { COMPANY } = await import('../src/lib/company');
    const config = readFileSync(
      fileURLToPath(new URL('../astro.config.mjs', import.meta.url)),
      'utf8',
    );
    expect(config, 'CONTACT_EMAIL has drifted from COMPANY.email').toContain(COMPANY.email);
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npm run build && npx vitest run tests/chrome.test.ts`
Expected: FAIL — no `[data-credibility]` element, and `src/lib/company.ts` does not exist.

- [ ] **Step 3: Create `src/lib/company.ts`**

```ts
/**
 * Company facts, declared once.
 *
 * Every value traces to archive/: the address and hours to the contact widget in
 * archive/pages/about.html, sales@litex.com.tw to the body of
 * archive/pages/news-2017-wearable-expo.html, and the Chinese legal name to the
 * TAITRONICS certificate in 2018-company-introduction.pdf p.2.
 *
 * The email is also declared as CONTACT_EMAIL in astro.config.mjs, because pages
 * must not import that file — it would pull defineConfig from astro/config into the
 * page bundle. tests/chrome.test.ts fails if the two ever disagree.
 */
export const COMPANY = {
  legalName: 'LiTex Textile & Technology Co., Ltd.',
  /** From the 2014 TAITRONICS award certificate, shown beside the English name. */
  legalNameZh: '富鉅紡織科技股份有限公司',
  foundedYear: 1999,
  email: 'sales@litex.com.tw',
  phone: '+886-2-2308-4712',
  phoneHref: 'tel:+886223084712',
  addressLines: ['188 Bangka Blvd., Wanhua Dist.', 'Taipei, Taiwan 108'],
  hours: 'Mon–Fri 09:00–18:00',
} as const;

/**
 * Spec §5 component 4, verbatim. Every item is a claim LiTex already makes in its
 * own catalogs — adding one requires evidence, not optimism.
 */
export const CREDIBILITY: readonly string[] = [
  'REACH',
  'RoHS',
  'SGS TESTED',
  'PATENTED TW 1M545145',
  'MANUFACTURING SINCE 1999',
];
```

- [ ] **Step 4: Create `src/components/SiteFooter.astro`**

```astro
---
import { COMPANY, CREDIBILITY } from '../lib/company';

const year = new Date().getFullYear();
---
<footer class="sitefooter" data-sitefooter>
  <div class="inner">
    <ul class="credibility value" data-credibility>
      {CREDIBILITY.map((claim) => <li>{claim}</li>)}
    </ul>

    <div class="cols">
      <address class="contact">
        <span class="label">Manufacturer</span>
        <span>{COMPANY.legalName}</span>
        {COMPANY.addressLines.map((line) => <span>{line}</span>)}
        <a class="value" href={COMPANY.phoneHref}>{COMPANY.phone}</a>
        <a class="value" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
        <span class="hours">{COMPANY.hours}</span>
      </address>

      <nav class="secondary" aria-label="Footer">
        <span class="label">Browse</span>
        <a href="/products/">Products</a>
        <a href="/applications/">Applications</a>
      </nav>
    </div>

    <p class="legal">
      <small>© {year} {COMPANY.legalName} · {COMPANY.legalNameZh}</small>
    </p>
  </div>
</footer>

<style>
  .sitefooter {
    border-top: 1px solid var(--c-line);
    background: var(--c-raised);
  }
  .inner {
    max-width: 76rem;
    margin: 0 auto;
    padding: var(--s-12) var(--s-6);
  }
  .credibility {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-2) var(--s-4);
    margin: 0 0 var(--s-12);
    padding: 0 0 var(--s-6);
    border-bottom: 1px solid var(--c-line);
    font-size: var(--t-10);
    letter-spacing: 0.12em;
    color: var(--c-copper);
  }
  .credibility li + li::before {
    content: '·';
    margin-right: var(--s-4);
    color: var(--c-line);
  }
  .cols {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
    gap: var(--s-8);
  }
  .contact, .secondary {
    display: flex;
    flex-direction: column;
    gap: var(--s-1);
    font-style: normal;
    font-size: var(--t-14);
    color: var(--c-text-2);
  }
  .label {
    font-family: var(--font-mono);
    font-size: var(--t-10);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--c-text-2);
    margin-bottom: var(--s-2);
  }
  .hours { color: var(--c-text-2); }
  .legal { margin: var(--s-12) 0 0; color: var(--c-text-2); }
</style>
```

- [ ] **Step 5: Mount the footer in `BaseLayout.astro`**

Add the import beside `SiteNav`:

```astro
import SiteFooter from '../components/SiteFooter.astro';
```

And place it directly after `</main>`:

```astro
    </main>
    <SiteFooter />
  </body>
```

- [ ] **Step 6: Build and run the suite**

Run: `npm run build && npm test`
Expected: build exits 0, every suite passes.

- [ ] **Step 7: Prove the drift guard bites**

Temporarily change `email` in `src/lib/company.ts` to `sales@litex.example`, then run `npx vitest run tests/chrome.test.ts`.
Expected: FAIL on both the placeholder-details test and the drift test. Restore and re-run to confirm green.

- [ ] **Step 8: Run the design detector**

Run: `node .claude/skills/impeccable/scripts/detect.mjs --json src/components src/pages src/styles`
Expected: `[]`.

- [ ] **Step 9: Commit**

```bash
git add src/lib/company.ts src/components/SiteFooter.astro src/layouts/BaseLayout.astro tests/chrome.test.ts
git commit -m "feat: add site footer with the credibility bar and real contact details"
```

---

### Task 3: A real homepage — two doors

Spec §3 line 1: *"Home — two doors: by product / by application."* The page is currently one `<h1>`. The two doors are the whole navigational proposition: a sourcing manager arrives knowing either what they need to make or what material they need, never both.

**Files:**
- Modify: `src/pages/index.astro`
- Test: `tests/chrome.test.ts`

**Interfaces:**
- Consumes: `getCollection` from `astro:content` for the door counts, `COMPANY` from Task 2.

- [ ] **Step 1: Write the failing homepage tests**

Append to `tests/chrome.test.ts`:

```ts
describe('homepage', () => {
  it('offers both doors — by product and by application', () => {
    const doc = docFor('index.html');
    const hrefs = [...doc.querySelectorAll('[data-door]')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/products/', '/applications/']);
  });

  it('states how much is behind each door, from the collections themselves', () => {
    const doc = docFor('index.html');
    const doors = [...doc.querySelectorAll('[data-door]')].map((a) => a.textContent ?? '');
    expect(doors[0]).toContain('7');
    expect(doors[1]).toContain('6');
  });

  it('says what LiTex actually makes, above the fold', () => {
    const doc = docFor('index.html');
    expect(doc.querySelector('h1')?.textContent).toContain('conductive');
  });

  it('names the founding year rather than leaving credibility to the footer alone', () => {
    expect(docFor('index.html').body.textContent).toContain('1999');
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npm run build && npx vitest run tests/chrome.test.ts`
Expected: FAIL — no `[data-door]` elements exist.

- [ ] **Step 3: Rewrite `src/pages/index.astro`**

Counts come from the collections so the homepage cannot drift out of step with what the site actually publishes.

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import { COMPANY } from '../lib/company';

const products = await getCollection('products');
const applications = await getCollection('applications');

const doors = [
  {
    href: '/products/',
    eyebrow: 'By product',
    title: 'Start from the material',
    count: `${products.length} products`,
    body: 'Conductive metal yarn, heating textile, EMI shielding tube, RFID and conductive tape. Every page publishes its specifications as data, with the source document named.',
  },
  {
    href: '/applications/',
    eyebrow: 'By application',
    title: 'Start from what you are building',
    count: `${applications.length} applications`,
    body: 'Heated apparel, automotive interiors, therapeutic heating, cable protection, smart textiles and industrial woven metal — each listing the products that serve it.',
  },
];
---
<BaseLayout
  title="LiTex Textile & Technology — conductive metal yarn and heating textile"
  description="LiTex weaves conductive elements into textile. Conductive Metal Yarn, electrical heating textile, EMI shielding and RFID tape, manufactured in Taipei since 1999."
>
  <h1>We specialize in weaving conductive elements into textile.</h1>

  <p class="lede">
    A metal layer coiled over a core polymer yarn, made on looms rather than by hand — which is
    what makes it manufacturable at volume. Woven in Taipei since {COMPANY.foundedYear}.
  </p>

  <div class="doors">
    {doors.map((door) => (
      <a class="door" href={door.href} data-door>
        <span class="eyebrow value">{door.eyebrow}</span>
        <span class="title">{door.title}</span>
        <span class="body">{door.body}</span>
        <span class="count value">{door.count} →</span>
      </a>
    ))}
  </div>
</BaseLayout>

<style>
  .lede {
    font-size: var(--t-20);
    color: var(--c-text-2);
    max-width: 58ch;
    margin: 0 0 var(--s-16);
  }
  .doors {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
    gap: var(--s-4);
  }
  .door {
    display: flex;
    flex-direction: column;
    gap: var(--s-3);
    padding: var(--s-8);
    background: var(--c-raised);
    border: 1px solid var(--c-line);
    text-decoration: none;
    color: var(--c-text-1);
  }
  .door:hover { border-color: var(--c-copper); }
  .eyebrow {
    font-size: var(--t-10);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--c-copper);
  }
  .title { font-size: var(--t-26); line-height: 1.2; }
  .body { color: var(--c-text-2); font-size: var(--t-14); }
  .count { font-size: var(--t-12); color: var(--c-copper); margin-top: var(--s-2); }
</style>
```

- [ ] **Step 4: Build and run the suite**

Run: `npm run build && npm test`
Expected: build exits 0, all suites pass. The existing `built home page` suite in `tests/build.test.ts` still passes — it asserts one `h1`, a title, a meta description, the skip link and the `main` landmark, all of which survive.

- [ ] **Step 5: Look at it**

Run `npx astro preview --port 4321` and open `http://localhost:4321/`. Confirm the two doors sit side by side above ~1000px and stack below it, and that the masthead, credibility bar and contact block all render. Stop the server afterwards.

- [ ] **Step 6: Run the design detector**

Run: `node .claude/skills/impeccable/scripts/detect.mjs --json src/components src/pages src/styles`
Expected: `[]`.

- [ ] **Step 7: Commit**

```bash
git add src/pages/index.astro tests/chrome.test.ts
git commit -m "feat: build the homepage as two doors into the catalog"
```

---

### Task 4: `/technology/` — how Conductive Metal Yarn works

The structure is the product. Spec §5 Tier 1 is explicit that for a product whose selling point is a structure nobody else can weave, a correct diagram outperforms a photograph — and that image models cannot render helical covering geometry correctly, which is why this is drawn rather than shot.

**Files:**
- Create: `src/components/YarnStructureDiagram.astro`, `src/pages/technology/index.astro`
- Modify: `src/lib/nav.ts`
- Test: `tests/technology.test.ts`

**Interfaces:**
- Produces: `YarnStructureDiagram.astro` with props `{ coverings: number; directions: readonly ('S' | 'Z')[]; label: string; caption: string }`.
- Consumes: `NAV` from Task 1 — one entry appended.

- [ ] **Step 1: Check the handedness against LiTex's own illustration**

Before drawing anything, view `archive/images/cmy-structure1.jpg` (936×609). It illustrates `1s`, `1z` and `1s1z` as coloured diagrams and is LiTex's own depiction of the convention.

Run: read the file with the Read tool and confirm which way the coils slope for `s` and for `z`.

The diagram below follows the standard textile convention — **S slopes like the middle stroke of the letter S (`\`), Z like the middle stroke of Z (`/`)**. If LiTex's illustration disagrees, follow LiTex and note the discrepancy in the page's source note. Handedness *is* part of the specification; do not guess it.

- [ ] **Step 2: Write the failing technology tests**

Create `tests/technology.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { parseHTML } from 'linkedom';

function docFor(relativePath: string) {
  return parseHTML(
    readFileSync(fileURLToPath(new URL(`../dist/${relativePath}`, import.meta.url)), 'utf8'),
  ).document;
}

describe('technology index', () => {
  it('generates the route with a single h1 and its canonical', () => {
    const doc = docFor('technology/index.html');
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://litex.com.tw/technology/');
  });

  it('explains the covering counts that name each grade', () => {
    const text = docFor('technology/index.html').body.textContent ?? '';
    for (const grade of ['1S', '1S1Z', '2S2Z', '4S4Z']) {
      expect(text, `${grade} is not explained`).toContain(grade);
    }
  });

  it('draws the structure rather than photographing it, per spec §5 Tier 1', () => {
    const doc = docFor('technology/index.html');
    const figures = doc.querySelectorAll('[data-yarn-diagram]');
    expect(figures.length, 'no yarn structure diagram').toBeGreaterThanOrEqual(3);
    for (const fig of [...figures]) {
      expect(fig.querySelector('svg'), 'diagram is not an SVG').toBeTruthy();
    }
  });

  it('gives every diagram an accessible name, so it is not silent to a screen reader', () => {
    for (const fig of [...docFor('technology/index.html').querySelectorAll('[data-yarn-diagram]')]) {
      const svg = fig.querySelector('svg');
      expect(svg?.getAttribute('role')).toBe('img');
      const labelled = svg?.getAttribute('aria-labelledby');
      expect(labelled, 'svg has no aria-labelledby').toBeTruthy();
      expect(fig.querySelector(`#${labelled}`)?.textContent?.trim()).toBeTruthy();
    }
  });

  it('names where the structure data came from', () => {
    const note = docFor('technology/index.html').querySelector('[data-source-note]');
    expect(note?.textContent).toContain('2018-non-carbon-electrical-heating-textile.pdf');
  });

  it('sends a reader wanting the full grade table to the product page', () => {
    const hrefs = [...docFor('technology/index.html').querySelectorAll('main a')]
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/products/conductive-metal-yarn/');
  });

  it('is reachable from the primary navigation', () => {
    const hrefs = [...docFor('index.html').querySelectorAll('nav[aria-label="Primary"] a')]
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/technology/');
  });
});
```

- [ ] **Step 3: Run to confirm it fails**

Run: `npm run build && npx vitest run tests/technology.test.ts`
Expected: FAIL — `dist/technology/index.html` does not exist, so `docFor` throws ENOENT.

- [ ] **Step 4: Create `src/components/YarnStructureDiagram.astro`**

Each covering is drawn as a set of parallel strokes crossing the core at ±22°. S and Z differ only in the sign of that angle, which is the whole point of the diagram.

```astro
---
interface Props {
  /** Number of coverings — 1 for 1S, 2 for 1S1Z, 4 for 2S2Z. */
  coverings: number;
  /** Helical direction of each covering layer, in winding order. */
  directions: readonly ('S' | 'Z')[];
  /** Grade name, e.g. "1S1Z". */
  label: string;
  caption: string;
}

const { coverings, directions, label, caption } = Astro.props;

const W = 320;
const H = 96;
const CORE_Y = H / 2;
const CORE_R = 16;
const STROKES = 11;
const STEP = (W - 24) / STROKES;

// S slopes like the middle stroke of the letter S; Z like the middle stroke of Z.
// Layers are drawn at slightly different vertical extents so overlapping coverings
// stay tellable apart rather than merging into a single hatch.
const layers = directions.map((direction, index) => ({
  direction,
  reach: CORE_R - index * 3,
  strokes: Array.from({ length: STROKES }, (_, i) => {
    const x = 12 + i * STEP + index * (STEP / directions.length);
    const dx = direction === 'S' ? 10 : -10;
    return { x1: x - dx, x2: x + dx };
  }),
}));

const titleId = `yarn-${label.toLowerCase()}-title`;
---
<figure class="diagram" data-yarn-diagram>
  <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={titleId}>
    <title id={titleId}>{caption}</title>

    <!-- Core polymer yarn -->
    <rect
      x="8" y={CORE_Y - CORE_R} width={W - 16} height={CORE_R * 2} rx={CORE_R}
      fill="var(--c-base)" stroke="var(--c-line)" stroke-width="1"
    />

    {layers.map((layer) => (
      <g stroke={layer.direction === 'S' ? 'var(--c-copper)' : 'var(--c-copper-lift)'}
         stroke-width="2" stroke-linecap="round">
        {layer.strokes.map((s) => (
          <line x1={s.x1} y1={CORE_Y + layer.reach} x2={s.x2} y2={CORE_Y - layer.reach} />
        ))}
      </g>
    ))}
  </svg>

  <figcaption>
    <span class="grade value">{label}</span>
    <span class="count value">{coverings} covering{coverings === 1 ? '' : 's'}</span>
    <span class="text">{caption}</span>
  </figcaption>
</figure>

<style>
  .diagram {
    margin: 0;
    background: var(--c-raised);
    border: 1px solid var(--c-line);
    padding: var(--s-4);
  }
  svg { display: block; width: 100%; height: auto; }
  figcaption {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--s-2) var(--s-4);
    margin-top: var(--s-3);
    padding-top: var(--s-3);
    border-top: 1px solid var(--c-line);
  }
  .grade { font-size: var(--t-16); color: var(--c-copper); letter-spacing: 0.04em; }
  .count { font-size: var(--t-10); color: var(--c-text-2); letter-spacing: 0.08em; }
  .text { font-size: var(--t-12); color: var(--c-text-2); flex: 1 1 12rem; }
</style>
```

> The `y1`/`y2` on each line run from `CORE_Y + reach` to `CORE_Y - reach`, so an S stroke rises to the left and a Z stroke rises to the right. Flip `dx`, not the y values, if Step 1 showed LiTex uses the opposite convention.

- [ ] **Step 5: Create `src/pages/technology/index.astro`**

Every sentence below traces to `archive/extracted-from-images.md` §6 and §7. Nothing is added.

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import YarnStructureDiagram from '../../components/YarnStructureDiagram.astro';

const SOURCE = '2018-non-carbon-electrical-heating-textile.pdf p.3, and images/cmy-structure1.jpg';

const structures = [
  {
    label: '1S',
    coverings: 1,
    directions: ['S'] as const,
    caption: 'One covering, wound in the S direction. The finest commercial grade at 0.27 mm uncoated.',
  },
  {
    label: '1S1Z',
    coverings: 2,
    directions: ['S', 'Z'] as const,
    caption: 'Two coverings wound in opposing directions, which balances the torque the first layer introduces.',
  },
  {
    label: '2S2Z',
    coverings: 4,
    directions: ['S', 'S', 'Z', 'Z'] as const,
    caption: 'Four coverings. Roughly a third of the resistance of 1S, and materially tougher.',
  },
];
---
<BaseLayout
  title="Technology — how Conductive Metal Yarn is built | LiTex"
  description="Conductive Metal Yarn is a metal layer coiled helically over a core polymer yarn. Covering count and S/Z direction set resistance and toughness."
>
  <h1>How Conductive Metal Yarn is built</h1>

  <p class="lede">
    A metal layer coiled helically around a core polymer yarn. How many times it is wound, and in
    which direction, is the whole specification — it sets resistance, diameter and toughness
    together.
  </p>

  <h2>Reading a grade name</h2>

  <p>
    A grade like <span class="value">010/N(K)30'*3/2S2Z</span> ends in its covering pattern. The
    digits count coverings in each direction and the letters give the helical direction: <span
    class="value">S</span> and <span class="value">Z</span> are opposite hands, named after the
    middle stroke of each letter. So <span class="value">1S</span> is a single covering,
    <span class="value">1S1Z</span> is two wound against each other, and
    <span class="value">4S4Z</span> is eight.
  </p>

  <div class="structures">
    {structures.map((s) => (
      <YarnStructureDiagram
        label={s.label}
        coverings={s.coverings}
        directions={s.directions}
        caption={s.caption}
      />
    ))}
  </div>

  <h2>What more coverings buy</h2>

  <p>
    Across the published range — <span class="value">1S</span> through
    <span class="value">4S4Z</span>, one covering to eight — resistance falls from about
    <span class="value">4.4&nbsp;Ω/M</span> to about <span class="value">0.8&nbsp;Ω/M</span> while
    toughness rises from the weakest grade to the strongest. Diameter rises with it, from
    <span class="value">0.27&nbsp;mm</span> uncoated to <span class="value">0.65&nbsp;mm</span>.
    Choosing a grade is choosing where on that curve an application sits.
  </p>

  <p>
    Coverings are tinned copper. Coating options are <span class="value">PU</span> and
    <span class="value">FEP&nbsp;(Teflon)</span>. A copper-nickel version was listed as coming soon
    in the 2018 catalog; its current status is unconfirmed.
  </p>

  <p><a href="/products/conductive-metal-yarn/">See the full grade table with diameters and resistances →</a></p>

  <h2>Why coiled rather than bundled</h2>

  <p>
    The coiled construction is what lets the yarn bend without the filament fracture that affects
    brittle heating elements, and it is made ready to use on LiTex's own looms rather than
    assembled by hand — which is what makes it mass manufacturable.
    <a href="/technology/heating-element-comparison/">Compared against carbon fibre, heating film and steel fibre →</a>
  </p>

  <p class="note" data-source-note>
    <small>Source: {SOURCE}. Figures are from the 2018 catalog and have not been re-confirmed with LiTex.</small>
  </p>
</BaseLayout>

<style>
  .lede { font-size: var(--t-20); color: var(--c-text-2); max-width: 58ch; }
  p { max-width: 70ch; }
  .structures {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
    gap: var(--s-4);
    margin: var(--s-8) 0;
  }
  .note { color: var(--c-text-2); margin-top: var(--s-16); }
</style>
```

- [ ] **Step 6: Add Technology to the navigation**

In `src/lib/nav.ts`, append to `NAV`:

```ts
  { href: '/technology/', label: 'Technology' },
```

- [ ] **Step 7: Build and run the suite**

Run: `npm run build && npm test`
Expected: build exits 0. `tests/technology.test.ts` passes except the comparison-page link, which resolves once Task 5 lands — **the link to `/technology/heating-element-comparison/` is in the page body, not the chrome, so `tests/chrome.test.ts` does not fail on it.** If you would rather not carry a dangling body link between tasks, do Task 5 before committing this one.

- [ ] **Step 8: Look at the diagrams**

Run `npx astro preview --port 4321`, open `http://localhost:4321/technology/`, and confirm the three diagrams read as distinct: 1S single-direction, 1S1Z crossing, 2S2Z denser. Stop the server afterwards.

- [ ] **Step 9: Run the design detector**

Run: `node .claude/skills/impeccable/scripts/detect.mjs --json src/components src/pages src/styles`
Expected: `[]`.

- [ ] **Step 10: Commit**

```bash
git add src/components/YarnStructureDiagram.astro src/pages/technology src/lib/nav.ts tests/technology.test.ts
git commit -m "feat: add the technology page explaining CMY covering structure"
```

---

### Task 5: `/technology/heating-element-comparison/`

This route is the 301 target for `/2018/12/06/new-electrical-heating-alternatives-to-consider/`. Spec §3 calls that post *"always a technology page misfiled as a post"*. The comparison is data, rendered through Plan 2's `SpecTable`, so it inherits Copy-as-CSV and the provenance note for free.

**Files:**
- Create: `src/data/heatingComparison.ts`, `src/pages/technology/heating-element-comparison.astro`
- Test: `tests/technology.test.ts`

**Interfaces:**
- Consumes: `SpecTable.astro` with props `{ table: { columns: CsvColumn[]; rows: CsvRow[] }, caption: string, sourceNote?: string, needsVerification?: boolean }`, and `CsvColumn = { key: string; label: string; unit?: string }`, `CsvRow = Record<string, string>` from `src/lib/csv.ts`.
- Produces: `HEATING_COMPARISON` from `src/data/heatingComparison.ts`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/technology.test.ts`:

```ts
describe('heating element comparison', () => {
  it('generates the route that the 2018 blog post redirects to', () => {
    const doc = docFor('technology/heating-element-comparison/index.html');
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://litex.com.tw/technology/heating-element-comparison/');
  });

  it('compares all four heating elements', () => {
    const text = docFor('technology/heating-element-comparison/index.html').body.textContent ?? '';
    for (const element of ['Carbon fibre', 'heating film', 'Stainless steel fibre', 'Conductive Metal Yarn']) {
      expect(text, `${element} is missing from the comparison`).toContain(element);
    }
  });

  it('renders as a spec table with scoped headers, not prose', () => {
    const doc = docFor('technology/heating-element-comparison/index.html');
    const headers = [...doc.querySelectorAll('th[scope="col"]')].map((th) => th.textContent);
    expect(headers.join(' ')).toContain('Manufacturing process');
    expect(doc.querySelectorAll('tbody tr')).toHaveLength(4);
  });

  it('offers the comparison as CSV, like every other spec table on the site', () => {
    const button = docFor('technology/heating-element-comparison/index.html')
      .querySelector('[data-copy-csv]');
    expect(button, 'no copy-as-CSV control').toBeTruthy();
    expect(button?.getAttribute('data-csv')).toContain('Carbon fibre');
  });

  it('names its source, because it is a competitive claim', () => {
    const note = docFor('technology/heating-element-comparison/index.html')
      .querySelector('[data-source-note]');
    expect(note?.textContent).toContain('2018-non-carbon-electrical-heating-textile.pdf');
  });

  it('is linked from the technology index', () => {
    const hrefs = [...docFor('technology/index.html').querySelectorAll('main a')]
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/technology/heating-element-comparison/');
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npm run build && npx vitest run tests/technology.test.ts`
Expected: FAIL — the route does not exist.

- [ ] **Step 3: Create `src/data/heatingComparison.ts`**

```ts
import type { CsvColumn, CsvRow } from '../lib/csv';

/**
 * LiTex's own competitive comparison, transcribed in archive/extracted-from-images.md §8
 * from 2018-non-carbon-electrical-heating-textile.pdf.
 *
 * This is a vendor's claim about competing technologies, not an independent test. The page
 * says so, and the source note names the document. Do not add a row or a characteristic
 * LiTex has not itself published.
 */
export const HEATING_COMPARISON: { columns: CsvColumn[]; rows: CsvRow[] } = {
  columns: [
    { key: 'element', label: 'Heating element' },
    { key: 'material', label: 'Material characteristics' },
    { key: 'process', label: 'Manufacturing process' },
  ],
  rows: [
    {
      element: 'Carbon fibre',
      material: 'Brittle, easy breakage',
      process: 'Mostly manual labour',
    },
    {
      element: 'Flexible printed circuit board (heating film)',
      material: 'Thin board, easy to snap',
      process: 'Special equipment required, high operating cost',
    },
    {
      element: 'Stainless steel fibre',
      material: 'Filament bundle frays easily',
      process: 'Mostly manual labour',
    },
    {
      element: 'Conductive Metal Yarn',
      material: 'Coiled design offers both flexibility and strength',
      process: 'Made ready to use on LiTex looms; easily mass manufactured',
    },
  ],
};
```

- [ ] **Step 4: Create `src/pages/technology/heating-element-comparison.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import SpecTable from '../../components/SpecTable.astro';
import { HEATING_COMPARISON } from '../../data/heatingComparison';
---
<BaseLayout
  title="Heating element comparison — CMY vs carbon fibre, film and steel fibre | LiTex"
  description="How Conductive Metal Yarn compares with carbon fibre, flexible printed circuit heating film and stainless steel fibre, on material behaviour and manufacturing process."
>
  <p class="breadcrumb"><a href="/technology/">← Technology</a></p>

  <h1>Choosing a heating element</h1>

  <p class="lede">
    Four ways to put heat into a textile assembly, and what separates them in practice: how the
    element behaves when it is bent, and how it is made.
  </p>

  <SpecTable
    table={HEATING_COMPARISON}
    caption="Heating elements compared"
    sourceNote="2018-non-carbon-electrical-heating-textile.pdf — LiTex's own comparison, not an independent test"
  />

  <h2>What the table is claiming</h2>

  <p>
    The two columns are doing different work. <strong>Material characteristics</strong> is about
    what happens under repeated flexing, which is the failure mode that matters in a garment or a
    seat. <strong>Manufacturing process</strong> is about whether volume is reachable at all — an
    element assembled by hand carries its labour cost into every unit.
  </p>

  <p>
    LiTex's argument for coiled yarn rests on holding both at once: the coil bends without the
    fracture that affects brittle elements, and it is woven on standard looms rather than assembled,
    so volume is a matter of loom time.
    <a href="/technology/">How the coiling actually works →</a>
  </p>

  <p>
    This comparison is LiTex's, published in its 2018 catalog. It is reproduced here because it is
    the clearest statement of where the product is positioned — not as an independent benchmark.
    <a href="/products/electrical-heating-textile/">See the heating textile built from it →</a>
  </p>
</BaseLayout>

<style>
  .breadcrumb { font-size: var(--t-14); margin-top: 0; }
  .lede { font-size: var(--t-20); color: var(--c-text-2); max-width: 58ch; }
  p { max-width: 70ch; }
</style>
```

- [ ] **Step 5: Build and run the whole suite**

Run: `npm run build && npm test`
Expected: build exits 0; every suite passes, including the technology-index link assertion that was dangling after Task 4.

- [ ] **Step 6: Run the design detector**

Run: `node .claude/skills/impeccable/scripts/detect.mjs --json src/components src/pages src/styles`
Expected: `[]`.

- [ ] **Step 7: Commit**

```bash
git add src/data/heatingComparison.ts src/pages/technology/heating-element-comparison.astro tests/technology.test.ts
git commit -m "feat: add the heating element comparison as a data-driven spec table"
```

---

### Task 6: Extend the imagery policy to `/technology/` and `/company/`

Spec §5 requires that *"the build fails if an asset with `aiGenerated: true` is used as a product-page hero, inside a spec table, or on `/company/` or `/technology/`."* Plan 3 implemented the product-hero half through the content schema. The section half needs a different mechanism, because these pages are `.astro` routes rather than content entries — nothing validates them.

**This guard is vacuous today and that is the point.** `/technology/` currently ships no raster images at all. The guard exists so that when Plan 5 puts the factory and certificate photographs on `/company/`, the rule is already enforced rather than remembered.

**Files:**
- Modify: `tests/imagery.test.ts`

**Interfaces:**
- Consumes: `dist/`, `src/assets/products/provenance.json`.

- [ ] **Step 1: Write the policy test**

Append to `tests/imagery.test.ts`:

```ts
describe('Tier 3 sections — real photography only', () => {
  // Spec §5: any image that depicts LiTex's actual product, material, factory, machinery,
  // personnel or certification documents must be real. /technology/ and /company/ are
  // Tier 3 wall to wall, so every raster image they render must trace to a provenance
  // entry that declares itself real. Inline SVG diagrams are Tier 1 and exempt.
  const TIER_3 = ['technology', 'company'];

  const manifest = JSON.parse(
    readFileSync(join(SRC, 'assets/products/provenance.json'), 'utf8'),
  ) as Record<string, { aiGenerated: boolean }>;

  /** Astro emits /_astro/<stem>.<hash>[_<variant>].<ext>; recover the original stem. */
  function sourceStem(src: string): string {
    const base = src.split('/').pop() ?? '';
    return base.split('.')[0];
  }

  const tier3Html = htmlFiles.filter((f) =>
    TIER_3.some((section) => f.includes(`${sep}${section}${sep}`)),
  );

  it('covers the sections it claims to cover', () => {
    // If /technology/ stops being generated this suite would pass by doing nothing.
    expect(tier3Html.length, 'no Tier 3 pages were found in dist').toBeGreaterThan(0);
  });

  it('renders no image on a Tier 3 page without a real-photography provenance entry', () => {
    const offenders: string[] = [];
    for (const file of tier3Html) {
      const html = readFileSync(file, 'utf8');
      for (const tag of html.match(/<img\b[^>]*>/g) ?? []) {
        const src = tag.match(/\bsrc\s*=\s*"([^"]+)"/)?.[1] ?? '';
        if (!src) continue;
        const entry = manifest[`${sourceStem(src)}.jpg`] ?? manifest[`${sourceStem(src)}.png`];
        if (!entry) offenders.push(`${file}: ${src} has no provenance entry`);
        else if (entry.aiGenerated) offenders.push(`${file}: ${src} is AI generated`);
      }
    }
    expect(offenders, `Tier 3 violations:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('allows inline SVG diagrams, which are Tier 1', () => {
    const tech = readFileSync(
      tier3Html.find((f) => f.includes(`technology${sep}index.html`)) ?? '',
      'utf8',
    );
    expect(tech).toContain('<svg');
  });
});
```

Add `sep` to the existing `node:path` import at the top of the file:

```ts
import { join, sep } from 'node:path';
```

- [ ] **Step 2: Run it**

Run: `npm run build && npx vitest run tests/imagery.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 3: Prove the guard bites**

Temporarily add to `src/pages/technology/index.astro`, inside the `<BaseLayout>`:

```astro
<img src="/_astro/not-a-real-asset.abc123.jpg" alt="A photograph with no provenance" />
```

Run `npm run build && npx vitest run tests/imagery.test.ts`.
Expected: FAIL — `not-a-real-asset ... has no provenance entry`. Remove the tag and re-run to confirm green.

- [ ] **Step 4: Run the full suite and the detector**

Run: `npm test && node .claude/skills/impeccable/scripts/detect.mjs --json src/components src/pages src/styles`
Expected: all suites pass; detector returns `[]`.

- [ ] **Step 5: Commit**

```bash
git add tests/imagery.test.ts
git commit -m "test: enforce the Tier 3 imagery rule on technology and company routes"
```

---

## Definition of done

Verify each by running it, not by reading the code.

- [ ] `npm run build` exits 0 and emits `/technology/` and `/technology/heating-element-comparison/`
- [ ] `npm test` passes every suite: contrast, tokens, fonts, schemas, references, crossLinks, csv, jsonld, provenance, imagery, build, chrome, technology
- [ ] Every generated page carries the masthead and the footer
- [ ] Every chrome link resolves to a file the build generated — re-verified by adding a bogus `NAV` entry (Task 1 Step 8)
- [ ] Every page still has exactly one `<h1>`
- [ ] The nav marks the current section with `aria-current="page"`, and by more than colour
- [ ] The credibility bar renders all five items from spec §5
- [ ] `sales@litex.com.tw` and `2308-4712` appear on every page; `example.com`, `10 Street Road` and `555 1234` appear on none
- [ ] `COMPANY.email` and `CONTACT_EMAIL` disagreeing fails the suite (Task 2 Step 7)
- [ ] The homepage offers exactly two doors, counting 7 products and 6 applications from the collections
- [ ] `/technology/` renders at least three SVG structure diagrams, each with `role="img"` and a resolvable `aria-labelledby`
- [ ] The comparison page renders four rows with scoped headers and a working Copy-as-CSV payload
- [ ] An image on a Tier 3 page without a real-photography provenance entry fails the suite (Task 6 Step 3)
- [ ] Design detector returns `[]` for `src/components src/pages src/styles`

## Deliberately out of scope

- **`/company/` and its three children, `/downloads/`, `/legal/privacy/`** — Plan 5. The company-catalog assets listed under "Held for a later plan" are for those pages. `/legal/privacy/` is the 301 target for `/privacy-policy/`; note that the archived privacy page is a **single paragraph about SMS marketing data** and nothing else, so that page needs real content from LiTex rather than a transcription.
- **`/news/` and the 7 posts** — Plan 6. **Decision taken 2026-08-11: keep them as short dated entries**, published honestly as brief announcements with their original dates, rather than merging them into one timeline or expanding them with invented detail. This preserves seven 301 targets. Be aware of what is actually there: *New Braided Self-curling Tube* has **no body text at all**, *Tokyo Wearable Expo 2022* has one sentence, and the longest of the seven is three sentences.
- **`/contact/` and `/request-a-sample/`** — Plan 7, with the Pages Function, Turnstile, KV and the store-before-send failure handling in spec §4.
- **Launch** — Plan 8: `_redirects` and the 23-URL map, the 410 for `test-post-blah`, sitemap, Cloudflare Web Analytics, Sveltia CMS at `/admin`, the print/light stylesheet, Lighthouse and axe budgets, and broken internal link detection across the *whole* site. The chrome link test in Task 1 covers header and footer links only.
- **A mobile nav disclosure.** The nav wraps to a second line below ~30rem, which is acceptable at three items. Revisit when `/company/`, `/downloads/`, `/news/` and `/contact/` push it to seven.
- **The thermograph images.** Held pending test conditions — see the note under "Held for a later plan".

**Plan renumbering.** Splitting chrome and technology out of the roadmapped Plan 4 makes the remaining work Plans 5–8, not 5–6:

- **Plan 5** — `/company/` hub + about, patents-and-awards, certifications · `/downloads/` · `/legal/privacy/`
- **Plan 6** — `/news/` index + 7 posts
- **Plan 7** — contact and sample-request flow
- **Plan 8** — launch

## Open questions for LiTex — do not guess these

1. **The thermograph's test conditions** — input voltage, duration, ambient temperature, and what the colour scale maps to. Two thermograph images exist and they are the strongest evidence for "even and stable heating", but publishing a thermal image without its conditions asserts a measurable result that cannot be checked. Held out of `/technology/` until answered.
2. **The US patent number.** `2018-company-introduction.pdf` p.2 carries a **granted** US patent certificate — the cover page, signed by David J. Kappos, USPTO Director 2009–2013. The number is not legible at the stored resolution. `archive/extracted-from-images.md` §2 records US 12/787,378 only as a *pending application*, so the grant is new information and the number must come from LiTex.
3. **Patent statuses generally.** Carried over: the TW and CN applications date from 2010–2011 and have since been granted or abandoned. Publishing a 15-year-old "pending" is worse than publishing nothing.
4. **CuNi status.** Copper-nickel CMY was "coming soon" in 2018. `/technology/` currently says exactly that and flags it unconfirmed. Confirm whether it shipped.
5. **Is the 2018 grade range still current?** The whole `/technology/` argument rests on the 1S–4S4Z range and its resistances. If grades have been added or dropped, the page is wrong.
6. **SGS report CE/2013/52203 is from 2013.** The credibility bar says `SGS TESTED`. Confirm whether a more recent test exists, and what exactly was tested — the report shown in the catalog is a single page whose scope is not readable.
7. Carried over from Plan 3: `wired-conductive-tape` and the low-resolution photography re-shoot; the EMI `(c)` column and `(ø)` units.

# LiTex Website — Plan 1: Foundation & Content Layer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Astro project with a design system whose accessibility claims are enforced by tests, and a typed content layer holding real LiTex spec data recovered from the archive.

**Architecture:** A static Astro site with zero client JS by default. Content lives as Markdown + YAML in `src/content/`, validated by zod schemas that live in plain, unit-testable modules and are wired into Astro's content config by dependency injection. Design tokens live in one CSS file that a test parses and audits for WCAG contrast, so a palette edit that breaks accessibility fails the build rather than shipping.

**Tech Stack:** Astro 7.2.0 · zod 4 (via `astro/zod`) · Vitest 4 · linkedom (DOM assertions on built HTML) · Fontsource (self-hosted Archivo + IBM Plex Mono) · Node ≥22.12.0

## Global Constraints

Every task's requirements implicitly include this section.

- **Node ≥22.12.0** — Astro 7.2.0's engine floor. Verified present: v24.14.0.
- **Astro `7.2.0`**, pinned exactly. Its content API is: config at `src/content.config.ts`, `defineCollection`/`reference` from `astro:content`, `glob` from `astro/loaders`, **`z` from `astro/zod`** (not from `astro:content`).
- **No React, Vue, or any UI framework.** Spec §4 "Deliberately not built".
- **Fonts are Archivo (display/UI) and IBM Plex Mono (measured values) only.** `Inter` is explicitly banned — it was rejected by design review. No `system-ui` fallback stacks that would silently render Inter on Windows.
- **Monospace is reserved for values that have units** — part numbers, dimensions, resistances, labels. Prose is Archivo.
- **Colour tokens are exactly these values** (spec §5):
  `base #0A0C0D` · `raised #0F1213` · `line #1E2325` · `text-1 #F2F1EF` · `text-2 #9AA0A5` · `copper #C87941` · `copper-lift #E09B62` · `in-production #4FB286` · `legacy #7E858A` · `paper #FFFFFF`
- **Every token used for text must clear 4.5:1 against BOTH `base` and `raised`.** `raised` is the harder case and the one the spec table renders on. Enforced by test, not convention.
- **WCAG 2.1 AA minimum.** Lighthouse a11y ≥ 95 is the eventual gate (Plan 5).
- **Provenance travels with the fact.** Any content entry carrying a `specTable` MUST carry a `sourceNote` naming the source document. Enforced at schema level.
- **AI-generated imagery may never be a product hero.** Enforced at schema level (spec §5 imagery policy, Tier 3).
- **Never invent product facts.** Only data present in `archive/` or the design spec §6 may be seeded. Unknown values are omitted, never guessed.
- **English only.** No i18n routing work in this plan.
- **Commit after every task.** Conventional commit prefixes (`feat:`, `test:`, `chore:`).

## File Structure

| Path | Responsibility |
|---|---|
| `package.json` | Pinned deps and the `dev`/`build`/`test` scripts |
| `astro.config.mjs` | Astro config; the single place `SITE_URL` is declared |
| `tsconfig.json` | Extends Astro's strict base config |
| `vitest.config.ts` | Node-environment test config |
| `src/lib/contrast.ts` | Pure WCAG relative-luminance and contrast-ratio maths. No DOM, no CSS parsing. |
| `src/styles/tokens.css` | The colour palette and type scale as custom properties. Single source of truth. |
| `src/styles/fonts.css` | `@font-face` declarations for the two self-hosted families |
| `src/styles/global.css` | Reset, base element styles, focus-visible treatment |
| `src/layouts/BaseLayout.astro` | Document shell: `lang`, head metadata, skip link, landmarks |
| `src/schemas/product.ts` | Product zod schema as a factory taking `reference`. Unit-testable. |
| `src/schemas/application.ts` | Application zod schema |
| `src/content.config.ts` | Wires the schemas to Astro collections. Thin — no schema logic here. |
| `src/content/products/*.md` | Real product data recovered from the archive |
| `src/content/applications/*.md` | Application entries products point at |
| `src/pages/index.astro` | Placeholder home; proves the layout renders |
| `src/pages/products/index.astro` | Product index; proves collections load and references resolve |
| `tests/contrast.test.ts` | Unit tests for the contrast maths |
| `tests/tokens.test.ts` | Audits `tokens.css` — the accessibility guard |
| `tests/fonts.test.ts` | Asserts no banned font appears anywhere in `src/` |
| `tests/schemas.test.ts` | Schema acceptance/rejection, provenance rule, AI-hero rule |
| `tests/build.test.ts` | Assertions against built HTML in `dist/` |

---

### Task 1: Project scaffold and a build that passes

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`
- Create: `src/pages/index.astro`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: `npm run build` emitting `dist/`; `npm test` running Vitest. `SITE_URL` exported from `astro.config.mjs`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "litex-website",
  "type": "module",
  "private": true,
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "astro": "7.2.0"
  },
  "devDependencies": {
    "linkedom": "0.18.13",
    "vitest": "4.1.10"
  }
}
```

- [ ] **Step 2: Install and verify the toolchain**

Run: `npm install`
Expected: completes without peer-dependency errors. Then `npx astro --version` prints `7.2.0`.

- [ ] **Step 3: Create `astro.config.mjs`**

`SITE_URL` is a placeholder because domain ownership is an unresolved blocker (spec §7 item 3). It is declared exactly once so the eventual real domain is a one-line change, and it must never appear in visible page copy.

```js
import { defineConfig } from 'astro/config';

// PLACEHOLDER. LiTex domain ownership is spec §7 item 3, unresolved.
// Used only for sitemap/canonical generation. Never render this in visible copy.
export const SITE_URL = 'https://litex.example';

export default defineConfig({
  site: SITE_URL,
  build: { format: 'directory' },
});
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "archive"]
}
```

- [ ] **Step 5: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 6: Create a minimal `src/pages/index.astro`**

```astro
---
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>LiTex Textile &amp; Technology</title>
  </head>
  <body>
    <h1>LiTex Textile &amp; Technology</h1>
  </body>
</html>
```

- [ ] **Step 7: Extend `.gitignore`**

Append these lines (the file already covers `.superpowers/` and `.impeccable/config.local.json`):

```gitignore
node_modules/
dist/
.astro/
```

- [ ] **Step 8: Run the build and confirm it succeeds**

Run: `npm run build`
Expected: exits 0 and creates `dist/index.html`.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts src/pages/index.astro .gitignore
git commit -m "feat: scaffold Astro 7 project with Vitest"
```

---

### Task 2: Design tokens with an enforced contrast guard

This is the task that makes spec §5's accessibility claim real. The design review found `legacy` at 4.19:1 — a WCAG AA failure that existed only because the ratios were prose. Here they become executable.

**Files:**
- Create: `src/lib/contrast.ts`
- Create: `src/styles/tokens.css`
- Test: `tests/contrast.test.ts`, `tests/tokens.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `contrastRatio(hexA: string, hexB: string): number` and `relativeLuminance(hex: string): number` from `src/lib/contrast.ts`. CSS custom properties named `--c-<token>` in `src/styles/tokens.css`.

- [ ] **Step 1: Write the failing test for the contrast maths**

Create `tests/contrast.test.ts`. The reference values come from the WCAG 2.1 definition: black-on-white is exactly 21:1, and any colour against itself is exactly 1:1.

```ts
import { describe, it, expect } from 'vitest';
import { contrastRatio, relativeLuminance } from '../src/lib/contrast';

describe('contrastRatio', () => {
  it('returns 21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 2);
  });

  it('returns 1:1 for a colour against itself', () => {
    expect(contrastRatio('#C87941', '#C87941')).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#0A0C0D', '#F2F1EF')).toBeCloseTo(
      contrastRatio('#F2F1EF', '#0A0C0D'), 10,
    );
  });

  it('computes the known luminance of white and black', () => {
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5);
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
  });

  it('accepts lowercase and uppercase hex identically', () => {
    expect(contrastRatio('#c87941', '#0a0c0d')).toBeCloseTo(
      contrastRatio('#C87941', '#0A0C0D'), 10,
    );
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/contrast.test.ts`
Expected: FAIL — cannot resolve `../src/lib/contrast`.

- [ ] **Step 3: Implement `src/lib/contrast.ts`**

```ts
/** WCAG 2.1 relative luminance and contrast ratio. Pure maths — no DOM, no CSS. */

function channel(value8bit: number): number {
  const s = value8bit / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  if (Number.isNaN(n) || hex.length !== 7) {
    throw new Error(`Expected a 6-digit hex colour like #A1B2C3, received: ${hex}`);
  }
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
}

export function contrastRatio(hexA: string, hexB: string): number {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  const [lighter, darker] = a > b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/contrast.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Write the failing token audit**

Create `tests/tokens.test.ts`. The final test is the important one — it proves the guard has teeth by asserting the pre-review colour would still be caught.

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { contrastRatio } from '../src/lib/contrast';

const css = readFileSync(
  fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url)),
  'utf8',
);

function parseTokens(source: string): Record<string, string> {
  const found: Record<string, string> = {};
  for (const m of source.matchAll(/--c-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    found[m[1]] = m[2].toUpperCase();
  }
  return found;
}

/** Tokens that may carry text, and therefore must clear WCAG AA on both surfaces. */
const TEXT_TOKENS = ['text-1', 'text-2', 'copper', 'copper-lift', 'in-production', 'legacy'];
const SURFACE_TOKENS = ['base', 'raised'];

describe('colour tokens', () => {
  const tokens = parseTokens(css);

  it('defines every token the design system names', () => {
    for (const name of [...TEXT_TOKENS, ...SURFACE_TOKENS, 'line', 'paper']) {
      expect(tokens[name], `--c-${name} is missing from tokens.css`).toBeDefined();
    }
  });

  it('pins the accent to the exact copper the spec commits to', () => {
    expect(tokens.copper).toBe('#C87941');
  });

  for (const token of TEXT_TOKENS) {
    for (const surface of SURFACE_TOKENS) {
      it(`--c-${token} clears WCAG AA on --c-${surface}`, () => {
        const ratio = contrastRatio(tokens[token], tokens[surface]);
        expect(
          ratio,
          `--c-${token} (${tokens[token]}) on --c-${surface} is ${ratio.toFixed(2)}:1, below 4.5:1`,
        ).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it('still rejects the pre-review legacy grey, proving the guard works', () => {
    expect(contrastRatio('#6E757A', tokens.raised)).toBeLessThan(4.5);
  });
});
```

- [ ] **Step 6: Run it to make sure it fails**

Run: `npx vitest run tests/tokens.test.ts`
Expected: FAIL — `ENOENT`, `src/styles/tokens.css` does not exist.

- [ ] **Step 7: Create `src/styles/tokens.css`**

```css
/* LiTex design tokens — "Technical Instrument".
   Contrast ratios are asserted in tests/tokens.test.ts against BOTH surfaces.
   Do not edit a colour without running `npm test`. */

:root {
  /* Surfaces */
  --c-base: #0A0C0D;
  --c-raised: #0F1213;
  --c-line: #1E2325;

  /* Text and accent */
  --c-text-1: #F2F1EF;
  --c-text-2: #9AA0A5;
  --c-copper: #C87941;
  --c-copper-lift: #E09B62;

  /* Product status */
  --c-in-production: #4FB286;
  --c-legacy: #7E858A;

  /* Print */
  --c-paper: #FFFFFF;

  /* Type scale — spec §5 */
  --t-10: 0.625rem;
  --t-12: 0.75rem;
  --t-14: 0.875rem;
  --t-16: 1rem;
  --t-20: 1.25rem;
  --t-26: 1.625rem;
  --t-34: 2.125rem;
  --t-40: 2.5rem;
  --t-56: 3.5rem;

  /* Spacing — 4px base */
  --s-1: 0.25rem;
  --s-2: 0.5rem;
  --s-3: 0.75rem;
  --s-4: 1rem;
  --s-6: 1.5rem;
  --s-8: 2rem;
  --s-12: 3rem;
  --s-16: 4rem;
  --s-24: 6rem;
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run tests/tokens.test.ts`
Expected: PASS — 15 tests (1 completeness + 1 copper pin + 12 contrast pairs + 1 regression guard).

- [ ] **Step 9: Commit**

```bash
git add src/lib/contrast.ts src/styles/tokens.css tests/contrast.test.ts tests/tokens.test.ts
git commit -m "feat: add design tokens with enforced WCAG contrast guard"
```

---

### Task 3: Self-hosted typography with a banned-font guard

**Files:**
- Create: `src/styles/fonts.css`
- Modify: `package.json` (two dependencies)
- Test: `tests/fonts.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: CSS custom properties `--font-display` and `--font-mono`, usable by any stylesheet or component.

- [ ] **Step 1: Write the failing banned-font test**

Create `tests/fonts.test.ts`. Inter was rejected by design review; this test makes the rejection permanent. `system-ui` is banned in font stacks specifically because it resolves to a different face per OS, which silently defeats the choice.

```ts
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const SRC = fileURLToPath(new URL('../src', import.meta.url));
const EXTENSIONS = ['.astro', '.css', '.ts', '.js', '.md'];
const BANNED = [/\bInter\b/i, /\bsystem-ui\b/i, /-apple-system/i, /\bRoboto\b/i, /\bHelvetica\b/i];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return EXTENSIONS.some((e) => full.endsWith(e)) ? [full] : [];
  });
}

describe('typography', () => {
  it('never references a banned font family', () => {
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      const content = readFileSync(file, 'utf8');
      for (const pattern of BANNED) {
        if (pattern.test(content)) offenders.push(`${file} matches ${pattern}`);
      }
    }
    expect(offenders, `Banned fonts found:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('declares both required families as custom properties', () => {
    const css = readFileSync(join(SRC, 'styles/fonts.css'), 'utf8');
    expect(css).toContain('--font-display');
    expect(css).toContain('--font-mono');
    expect(css).toContain('Archivo');
    expect(css).toContain('IBM Plex Mono');
  });

  it('self-hosts rather than calling a font CDN', () => {
    const css = readFileSync(join(SRC, 'styles/fonts.css'), 'utf8');
    expect(css).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit/);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/fonts.test.ts`
Expected: FAIL — `src/styles/fonts.css` does not exist.

- [ ] **Step 3: Install the self-hosted font packages**

Run: `npm install @fontsource-variable/archivo@5.3.0 @fontsource/ibm-plex-mono@5.3.0`
Expected: both resolve. Archivo is a variable font; IBM Plex Mono ships static weights (no variable build exists).

- [ ] **Step 4: Create `src/styles/fonts.css`**

```css
/* Self-hosted. No third-party request, no CDN dependency.
   Archivo: display and UI. IBM Plex Mono: anything with a measured value. */

@import '@fontsource-variable/archivo/index.css';
@import '@fontsource/ibm-plex-mono/400.css';
@import '@fontsource/ibm-plex-mono/500.css';

:root {
  --font-display: 'Archivo Variable', 'Archivo', sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/fonts.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/styles/fonts.css tests/fonts.test.ts
git commit -m "feat: self-host Archivo and IBM Plex Mono with banned-font guard"
```

---

### Task 4: Base layout and accessibility baseline

**Files:**
- Create: `src/styles/global.css`, `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/build.test.ts`

**Interfaces:**
- Consumes: `src/styles/tokens.css`, `src/styles/fonts.css`.
- Produces: `BaseLayout.astro` accepting props `{ title: string; description: string }` and a default `<slot />`. Every page in every later plan renders inside it.

- [ ] **Step 1: Write the failing build assertions**

Create `tests/build.test.ts`. These run against real built output, so they catch what unit tests cannot.

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeAll } from 'vitest';
import { parseHTML } from 'linkedom';

function docFor(relativePath: string) {
  const html = readFileSync(
    fileURLToPath(new URL(`../dist/${relativePath}`, import.meta.url)),
    'utf8',
  );
  return parseHTML(html).document;
}

describe('built home page', () => {
  let doc: ReturnType<typeof docFor>;
  beforeAll(() => { doc = docFor('index.html'); });

  it('declares the document language', () => {
    expect(doc.documentElement.getAttribute('lang')).toBe('en');
  });

  it('has exactly one h1', () => {
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
  });

  it('has a non-empty title and meta description', () => {
    expect(doc.querySelector('title')?.textContent?.trim()).toBeTruthy();
    expect(
      doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim(),
    ).toBeTruthy();
  });

  it('offers a skip link as the first focusable element', () => {
    const skip = doc.querySelector('a[href="#main"]');
    expect(skip, 'no skip link found').toBeTruthy();
    expect(skip?.textContent?.toLowerCase()).toContain('skip');
  });

  it('marks up a main landmark matching the skip target', () => {
    const main = doc.querySelector('main');
    expect(main).toBeTruthy();
    expect(main?.getAttribute('id')).toBe('main');
  });

  it('never leaks the placeholder domain into visible copy', () => {
    expect(doc.body.textContent).not.toContain('litex.example');
  });

  it('ships no render-blocking third-party requests', () => {
    const external = [...doc.querySelectorAll('link[rel="stylesheet"], script[src]')]
      .map((el) => el.getAttribute('href') ?? el.getAttribute('src') ?? '')
      .filter((url) => /^https?:\/\//.test(url));
    expect(external).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npm run build && npx vitest run tests/build.test.ts`
Expected: FAIL — no skip link, no `<main id="main">`, no meta description.

- [ ] **Step 3: Create `src/styles/global.css`**

```css
@import './tokens.css';
@import './fonts.css';

*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--c-base);
  color: var(--c-text-1);
  font-family: var(--font-display);
  font-size: var(--t-16);
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

/* Monospace is reserved for values that have units. */
.value, code, kbd, samp {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

a { color: var(--c-copper); }
a:hover { color: var(--c-copper-lift); }

:focus-visible {
  outline: 2px solid var(--c-copper-lift);
  outline-offset: 2px;
}

.skip-link {
  position: absolute;
  left: var(--s-2);
  top: -4rem;
  z-index: 100;
  padding: var(--s-2) var(--s-4);
  background: var(--c-raised);
  color: var(--c-text-1);
  border: 1px solid var(--c-line);
  transition: top 120ms ease;
}
.skip-link:focus { top: var(--s-2); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Create `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css';

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
    <main id="main">
      <slot />
    </main>
  </body>
</html>
```

- [ ] **Step 5: Rewrite `src/pages/index.astro` to use the layout**

Copy is deliberately limited to LiTex's own published positioning line. No claims are invented.

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout
  title="LiTex Textile & Technology — conductive metal yarn and heating textile"
  description="LiTex weaves conductive elements into textile. Conductive Metal Yarn, electrical heating textile, EMI shielding and RFID tape, manufactured in Taipei since 1999."
>
  <h1>We specialize in weaving conductive elements into textile.</h1>
</BaseLayout>
```

- [ ] **Step 6: Run the build and the tests**

Run: `npm run build && npx vitest run tests/build.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 7: Commit**

```bash
git add src/styles/global.css src/layouts/BaseLayout.astro src/pages/index.astro tests/build.test.ts
git commit -m "feat: add base layout with skip link and a11y baseline"
```

---

### Task 5: Content schemas with provenance and imagery rules enforced

The two `superRefine` rules here are the spec's Product Principle 4 and the §5 imagery policy, expressed as code that fails the build.

**Files:**
- Create: `src/schemas/product.ts`, `src/schemas/application.ts`, `src/content.config.ts`
- Test: `tests/schemas.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `productSchema(reference: ReferenceFn)` → zod object, from `src/schemas/product.ts`
  - `applicationSchema(reference: ReferenceFn)` → zod object, from `src/schemas/application.ts`
  - `type ReferenceFn = (collection: string) => z.ZodTypeAny`
  - Astro collections named `products` and `applications`

**Why a factory:** `reference()` is exported from `astro:content`, a virtual module that only exists inside Astro's build. Vitest cannot import it. Passing it in keeps the schemas unit-testable and keeps `content.config.ts` free of logic.

- [ ] **Step 1: Write the failing schema tests**

Create `tests/schemas.test.ts`.

```ts
import { describe, it, expect } from 'vitest';
import { z } from 'astro/zod';
import { productSchema } from '../src/schemas/product';
import { applicationSchema } from '../src/schemas/application';

/** Stands in for Astro's reference(); shape matches what Astro produces. */
const referenceStub = () => z.object({ collection: z.string(), id: z.string() }).or(z.string());

const product = productSchema(referenceStub);
const application = applicationSchema(referenceStub);

const validProduct = {
  name: 'Conductive Metal Yarn',
  status: 'active',
  summary: 'Tinned copper filaments helically wound around a core, loom-made.',
  applications: ['heated-apparel-wearables'],
  certifications: ['REACH', 'RoHS'],
};

describe('productSchema', () => {
  it('accepts a minimal valid product', () => {
    expect(product.safeParse(validProduct).success).toBe(true);
  });

  it('rejects an unknown status', () => {
    const r = product.safeParse({ ...validProduct, status: 'discontinued' });
    expect(r.success).toBe(false);
  });

  it('rejects a summary over 160 characters, because it doubles as the meta description', () => {
    const r = product.safeParse({ ...validProduct, summary: 'x'.repeat(161) });
    expect(r.success).toBe(false);
  });

  it('rejects a certification LiTex has not claimed', () => {
    const r = product.safeParse({ ...validProduct, certifications: ['UL'] });
    expect(r.success).toBe(false);
  });

  it('requires sourceNote whenever a specTable is present', () => {
    const r = product.safeParse({
      ...validProduct,
      specTable: {
        columns: [{ key: 'item', label: 'Item' }],
        rows: [{ item: '010/N(K)30*3/1S' }],
      },
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('sourceNote');
  });

  it('accepts a specTable that carries its provenance', () => {
    const r = product.safeParse({
      ...validProduct,
      sourceNote: '2018-non-carbon-electrical-heating-textile.pdf',
      specTable: {
        columns: [
          { key: 'item', label: 'Item' },
          { key: 'resistance', label: 'Resistance', unit: 'Ω/M' },
        ],
        rows: [{ item: '010/N(K)30*3/1S', resistance: '~4.4' }],
      },
    });
    expect(r.success).toBe(true);
  });

  it('refuses an AI-generated product hero image', () => {
    const r = product.safeParse({
      ...validProduct,
      heroImage: { src: '/img/cmy.jpg', alt: 'Conductive metal yarn', aiGenerated: true },
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('aiGenerated');
  });

  it('accepts a real photographed product hero', () => {
    const r = product.safeParse({
      ...validProduct,
      heroImage: { src: '/img/cmy.jpg', alt: 'Conductive metal yarn', aiGenerated: false },
    });
    expect(r.success).toBe(true);
  });

  it('defaults certifications to an empty array', () => {
    const { certifications: _omitted, ...withoutCerts } = validProduct;
    const r = product.safeParse(withoutCerts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.certifications).toEqual([]);
  });
});

describe('applicationSchema', () => {
  it('accepts a valid application', () => {
    const r = application.safeParse({
      name: 'Heated apparel & wearables',
      summary: 'Garment heating built on conductive metal yarn.',
      evidence: 'archive/images/applications.jpg',
    });
    expect(r.success).toBe(true);
  });

  it('requires evidence, because unevidenced applications must not be published', () => {
    const r = application.safeParse({
      name: 'Aerospace',
      summary: 'Invented end-use with no support.',
    });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/schemas.test.ts`
Expected: FAIL — cannot resolve `../src/schemas/product`.

- [ ] **Step 3: Implement `src/schemas/product.ts`**

```ts
import { z } from 'astro/zod';

export type ReferenceFn = (collection: string) => z.ZodTypeAny;

/** Certifications LiTex has actually claimed. Adding one requires evidence, not optimism. */
export const CERTIFICATIONS = ['REACH', 'RoHS', 'SGS'] as const;

export const specTableSchema = z.object({
  columns: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      unit: z.string().optional(),
    }),
  ),
  rows: z.array(z.record(z.string(), z.string())),
});

export const imageSchema = z.object({
  src: z.string(),
  alt: z.string(),
  aiGenerated: z.boolean().default(false),
});

export function productSchema(reference: ReferenceFn) {
  return z
    .object({
      name: z.string(),
      status: z.enum(['active', 'legacy']),
      summary: z.string().max(160), // doubles as the meta description
      applications: z.array(reference('applications')).default([]),
      certifications: z.array(z.enum(CERTIFICATIONS)).default([]),
      catalogPdf: z.string().optional(),
      specTable: specTableSchema.optional(),
      heroImage: imageSchema.optional(),
      /** Which document each figure came from. */
      sourceNote: z.string().optional(),
      /** True while extracted values still need checking against the source PDF. */
      needsVerification: z.boolean().default(false),
    })
    .superRefine((data, ctx) => {
      if (data.specTable && !data.sourceNote) {
        ctx.addIssue({
          code: 'custom',
          path: ['sourceNote'],
          message:
            'A specTable must carry a sourceNote naming the document its figures came from.',
        });
      }
      if (data.heroImage?.aiGenerated) {
        ctx.addIssue({
          code: 'custom',
          path: ['heroImage', 'aiGenerated'],
          message:
            'Product heroes must be real photography. AI imagery is Tier 2 only (spec §5).',
        });
      }
    });
}
```

- [ ] **Step 4: Implement `src/schemas/application.ts`**

```ts
import { z } from 'astro/zod';
import type { ReferenceFn } from './product';

export function applicationSchema(_reference: ReferenceFn) {
  return z.object({
    name: z.string(),
    summary: z.string().max(160),
    /**
     * Where LiTex itself claims this application. Required: publishing an
     * unevidenced end-use fails exactly the diligence a serious buyer applies.
     */
    evidence: z.string().min(1),
    needsDetail: z.boolean().default(false),
  });
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/schemas.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 6: Wire the schemas into `src/content.config.ts`**

```ts
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { productSchema } from './schemas/product';
import { applicationSchema } from './schemas/application';

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: productSchema(reference),
});

const applications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/applications' }),
  schema: applicationSchema(reference),
});

export const collections = { products, applications };
```

- [ ] **Step 7: Confirm the build still succeeds with empty collections**

Run: `npm run build`
Expected: exits 0. Astro may warn that the collections are empty; that is expected until Task 6.

- [ ] **Step 8: Commit**

```bash
git add src/schemas src/content.config.ts tests/schemas.test.ts
git commit -m "feat: add content schemas enforcing provenance and imagery policy"
```

---

### Task 6: Seed real archive data and prove references resolve

Every figure here comes from `archive/` or design spec §6. Nothing is invented. The RFID entry is flagged `needsVerification` because `pdftotext` misaligned its source table.

**Files:**
- Create: `src/content/applications/heated-apparel-wearables.md`, `src/content/applications/smart-textiles-rfid.md`
- Create: `src/content/products/conductive-metal-yarn.md`, `src/content/products/rfid-textile-tape.md`
- Create: `src/pages/products/index.astro`
- Modify: `tests/build.test.ts`

**Interfaces:**
- Consumes: `BaseLayout.astro` (Task 4), the `products` and `applications` collections (Task 5).
- Produces: `dist/products/index.html`.

- [ ] **Step 1: Write the failing product-index assertions**

Append to `tests/build.test.ts`:

```ts
describe('built products index', () => {
  let doc: ReturnType<typeof docFor>;
  beforeAll(() => { doc = docFor('products/index.html'); });

  it('lists both seeded products by name', () => {
    const text = doc.body.textContent ?? '';
    expect(text).toContain('Conductive Metal Yarn');
    expect(text).toContain('RFID Wired Woven Tape');
  });

  it('resolves application references into readable names', () => {
    expect(doc.body.textContent).toContain('Heated apparel & wearables');
  });

  it('shows provenance for every product carrying spec data', () => {
    const notes = [...doc.querySelectorAll('[data-source-note]')];
    expect(notes.length).toBeGreaterThanOrEqual(2);
    for (const note of notes) {
      expect(note.textContent?.trim()).not.toBe('');
    }
  });

  it('flags data that still needs verification against its source', () => {
    expect(doc.querySelector('[data-needs-verification]')).toBeTruthy();
  });

  it('renders measured values in the monospace class', () => {
    const values = [...doc.querySelectorAll('.value')].map((n) => n.textContent);
    expect(values.join(' ')).toContain('326.2');
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npm run build && npx vitest run tests/build.test.ts`
Expected: FAIL — `dist/products/index.html` does not exist.

- [ ] **Step 3: Create the two application entries**

`src/content/applications/heated-apparel-wearables.md`:

```markdown
---
name: "Heated apparel & wearables"
summary: "Garment and wearable heating built on conductive metal yarn woven directly into fabric."
evidence: "archive/images/applications.jpg; Tokyo Wearable Expo 2022; 2018 heating textile catalog"
needsDetail: false
---

LiTex publishes wearable heating as a primary application for its electrical heating textile.
```

`src/content/applications/smart-textiles-rfid.md`:

```markdown
---
name: "Smart textiles & RFID"
summary: "Woven tape carrying conductive wire as an RFID tag antenna, with the chip fixed by epoxy."
evidence: "archive/catalogs/2018-rfid-textile-tape.pdf"
needsDetail: false
---

LiTex manufactures narrow textile tape with conductive wires integrated during weaving, providing RFID antenna reception.
```

- [ ] **Step 4: Create the Conductive Metal Yarn entry**

Values transcribed from design spec §6, sourced from `2018-non-carbon-electrical-heating-textile.pdf`.

```markdown
---
name: "Conductive Metal Yarn"
status: "active"
summary: "Tinned copper filaments helically wound around a core. Loom-made, so it is mass manufacturable."
applications:
  - heated-apparel-wearables
certifications: ["REACH", "RoHS", "SGS"]
catalogPdf: "2018-non-carbon-electrical-heating-textile.pdf"
sourceNote: "2018-non-carbon-electrical-heating-textile.pdf, extracted via pdftotext -layout"
needsVerification: false
specTable:
  columns:
    - { key: "item", label: "Item" }
    - { key: "coverings", label: "Coverings" }
    - { key: "diaUncoated", label: "Ø no coating", unit: "mm" }
    - { key: "diaCoated", label: "Ø coated", unit: "mm" }
    - { key: "resistance", label: "Resistance", unit: "Ω/M" }
  rows:
    - { item: "010/N(K)30'*3/1S",   coverings: "1", diaUncoated: "0.27±0.02", diaCoated: "0.47±0.05", resistance: "~4.4" }
    - { item: "010/N(K)30'*3/1S1Z", coverings: "2", diaUncoated: "0.33±0.02", diaCoated: "0.62±0.05", resistance: "~2.5" }
    - { item: "010/N(K)30'*3/2S2Z", coverings: "4", diaUncoated: "0.53±0.02", diaCoated: "0.75±0.05", resistance: "~1.4" }
    - { item: "010/N(K)30'*3/3S3Z", coverings: "6", diaUncoated: "0.55±0.02", diaCoated: "0.84±0.05", resistance: "~1" }
    - { item: "010/N(K)30'*3/4S4Z", coverings: "8", diaUncoated: "0.65±0.02", diaCoated: "—",         resistance: "~0.8" }
---

Coverings are tinned copper. Coating options are PU and FEP (Teflon). More coverings lower the resistance and increase toughness.
```

- [ ] **Step 5: Create the RFID Textile Tape entry**

`needsVerification: true` because `pdftotext` misaligned the source table's label and value columns.

```markdown
---
name: "RFID Wired Woven Tape"
status: "active"
summary: "Narrow woven tape with conductive wire inside, providing RFID tag antenna reception."
applications:
  - smart-textiles-rfid
certifications: []
catalogPdf: "2018-rfid-textile-tape.pdf"
sourceNote: "2018-rfid-textile-tape.pdf, extracted via pdftotext -layout — columns were misaligned and reconstructed"
needsVerification: true
specTable:
  columns:
    - { key: "property", label: "Property" }
    - { key: "wire1", label: "Wire type 1" }
    - { key: "wire2", label: "Wire type 2" }
  rows:
    - { property: "Material",            wire1: "Copper",        wire2: "Stainless 316L" }
    - { property: "Max resistance @20°", wire1: "326.2 Ω/km",    wire2: "1400 Ω/km" }
    - { property: "Max current",         wire1: "0.2 A",         wire2: "—" }
    - { property: "Filaments",           wire1: "—",             wire2: "275 x 2" }
    - { property: "Outer diameter",      wire1: "0.631–0.633 mm", wire2: "0.95 mm" }
    - { property: "Covering",            wire1: "TPU, black",    wire2: "TPU, black" }
---

Tape is 20 mm wide polyester with 0% elasticity. Integration by hot-melt adhesive or sewing. The selvage edge prevents yarn fraying. An RFID chip can be fixed to the tape with epoxy.
```

- [ ] **Step 6: Create `src/pages/products/index.astro`**

```astro
---
import { getCollection, getEntry } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

const products = await getCollection('products');

const withApplications = await Promise.all(
  products.map(async (product) => ({
    product,
    applications: await Promise.all(
      product.data.applications.map((ref) => getEntry(ref)),
    ),
  })),
);
---
<BaseLayout
  title="Products — LiTex Textile & Technology"
  description="Conductive metal yarn, heating textile, EMI shielding tube and RFID tape, with published specifications."
>
  <h1>Products</h1>

  {withApplications.map(({ product, applications }) => (
    <article>
      <h2>{product.data.name}</h2>
      <p>{product.data.summary}</p>

      <p>
        Status:
        <span class="value">
          {product.data.status === 'active' ? '● IN PRODUCTION' : '○ LEGACY · SAMPLING ONLY'}
        </span>
      </p>

      {applications.length > 0 && (
        <p>Applications: {applications.map((a) => a?.data.name).join(', ')}</p>
      )}

      {product.data.specTable && (
        <table>
          <thead>
            <tr>
              {product.data.specTable.columns.map((col) => (
                <th scope="col">{col.label}{col.unit ? ` (${col.unit})` : ''}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {product.data.specTable.rows.map((row) => (
              <tr>
                {product.data.specTable!.columns.map((col) => (
                  <td class="value">{row[col.key] ?? '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {product.data.sourceNote && (
        <p data-source-note><small>Source: {product.data.sourceNote}</small></p>
      )}

      {product.data.needsVerification && (
        <p data-needs-verification>
          <small>These figures are awaiting verification against the source catalog.</small>
        </p>
      )}
    </article>
  ))}
</BaseLayout>
```

- [ ] **Step 7: Build and run the full suite**

Run: `npm run build && npm test`
Expected: build exits 0; all tests pass, including the 5 new product-index assertions.

- [ ] **Step 8: Verify a broken reference actually fails the build**

This confirms the typed cross-linking works as spec §4 promises.

Temporarily edit `src/content/products/conductive-metal-yarn.md`, changing `heated-apparel-wearables` to `does-not-exist`, then run `npm run build`.
Expected: the build FAILS with a reference error naming the missing entry. Revert the change and rebuild to confirm it passes again.

- [ ] **Step 9: Run the design detector over the new UI**

Run: `node .claude/skills/impeccable/scripts/detect.mjs --json src/pages src/layouts src/styles`
Expected: no findings. If any appear, fix them before committing rather than suppressing them.

- [ ] **Step 10: Commit**

```bash
git add src/content src/pages/products/index.astro tests/build.test.ts
git commit -m "feat: seed CMY and RFID product data with resolved application references"
```

---

## Definition of done

- [ ] `npm run build` exits 0 and emits `dist/index.html` and `dist/products/index.html`
- [ ] `npm test` passes every suite: contrast, tokens, fonts, schemas, build
- [ ] A colour edit that breaks WCAG AA fails `npm test`
- [ ] Adding `Inter` anywhere under `src/` fails `npm test`
- [ ] A `specTable` without a `sourceNote` fails the build
- [ ] An AI-generated product hero fails the build
- [ ] A broken `reference()` fails the build
- [ ] No page renders the placeholder domain in visible copy

## Deliberately out of scope

Deferred to later plans: the spec-table component with copy-as-CSV, print stylesheet, JSON-LD, product detail pages, the remaining 5 products, application and technology pages, news, the contact and sample-request flow with its Pages Function, redirects, sitemap, analytics, the Sveltia CMS at `/admin`, and Lighthouse/axe CI budgets.

Two spec §4 verification gates are **not** implemented here and must not be assumed present:

- **Broken internal link detection.** This plan enforces broken `reference()` (Task 6, Step 8) but not broken `<a href>` links, which needs a link checker over `dist/`. Plan 5.
- **Lighthouse and axe budgets.** Task 4 establishes an accessibility *baseline* (lang, landmarks, skip link, single h1, focus-visible) and Task 2 enforces contrast, but neither is the ≥95 Lighthouse gate. Plan 5.

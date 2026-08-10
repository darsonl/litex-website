# LiTex Website — Plan 2: Product Layer & Spec Table

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the seven product pages, the six application pages that cross-link back to them, and the site's signature component — a spec table generated from YAML that carries its own provenance and copies itself to the clipboard as CSV.

**Architecture:** Product detail pages are generated from the `products` collection via `getStaticPaths`. All logic that can be pure is pure: CSV serialization and JSON-LD construction live in plain modules under `src/lib/` with unit tests, because Vitest cannot import `.astro` files. Components consume those functions and render markup only. The CSV is serialized **at build time** into a `data-csv` attribute, so the client-side script is ~15 lines and the serialization itself is fully testable.

**Tech Stack:** Astro 7.2.0 · zod 4 (via `astro/zod`) · Vitest 4 · linkedom — no new dependencies.

## Global Constraints

Every task's requirements implicitly include this section. These carry over from Plan 1 and remain in force.

- **Astro `7.2.0`**, pinned exactly. Verified exports of `astro:content`: `getCollection`, `getEntry`, `getEntries`, `render` (aliased from `renderEntry`), `reference`, `z`. **`getEntryBySlug` and `getDataEntryById` are deprecated — never use them.**
- **`z` for schema files comes from `astro/zod`**, not `astro:content`, so Vitest can import it.
- **Never call `getEntry()` bare.** Astro 7.2.0 does **not** fail the build on a broken `reference()` — it logs, exits 0, and renders blank. Wrap every resolution in `mustResolve()` from `src/lib/references.ts`. This is a verified finding from Plan 1, not a theory.
- **No React, Vue, or any UI framework.** The only interactive elements permitted site-wide are a nav toggle, a spec-table control, and the contact form (spec §4 "Deliberately not built").
- **Fonts are Archivo and IBM Plex Mono only.** `Inter`, `system-ui`, `-apple-system`, `Roboto`, `Helvetica` are banned and asserted against by `tests/fonts.test.ts`.
- **Monospace (`class="value"`) is reserved for values that have units** — part numbers, dimensions, resistances, model numbers. Prose is Archivo.
- **Colour tokens only** — use `var(--c-*)`, never a literal hex, in any component. Text tokens must clear 4.5:1 on both `base` and `raised`; `tests/tokens.test.ts` enforces it.
- **`line` (`--c-line`) is decorative only** and must never be the sole carrier of meaning (spec §5). Product status is carried by **text**, not by colour or glyph alone.
- **Provenance travels with the fact.** Any entry carrying a `specTable` MUST carry a `sourceNote`. Enforced at schema level; a violation fails the build with exit 127 (verified).
- **AI-generated imagery may never be a product hero.** Enforced at schema level.
- **Never invent product facts.** Only data present in `archive/` or spec §6 may be seeded. Unknown values are omitted, never guessed. Where an extraction is ambiguous, set `needsVerification: true` rather than guessing a pairing.
- **Certifications are exactly `REACH`, `RoHS`, `SGS`.** Do not add to this enum. In particular the wired conductive tape's "Wire is UL approved" refers to a **third-party wire**, not a LiTex certification — it stays as prose. `tests/schemas.test.ts` already asserts `UL` is rejected.
- **No page may render any `example.com` string.** Asserted by `tests/build.test.ts`.
- **English only.** No i18n routing in this plan.
- **Commit after every task.** Conventional prefixes (`feat:`, `test:`, `chore:`).

## File Structure

| Path | Responsibility |
|---|---|
| `src/lib/csv.ts` | RFC 4180 CSV serialization. Pure — no DOM, no Astro. |
| `src/lib/jsonld.ts` | Builds a schema.org `Product` object from a product entry. Pure. |
| `src/components/SpecTable.astro` | The signature component: table + provenance + verification flag + Copy as CSV |
| `src/components/ProductCard.astro` | Product summary card carrying explicit availability status |
| `src/components/StatusBadge.astro` | `● IN PRODUCTION` / `○ LEGACY · SAMPLING ONLY`, used by card and detail page |
| `src/pages/products/[slug].astro` | Product detail page, one per collection entry |
| `src/pages/products/index.astro` | **Rewritten** — card grid replacing Plan 1's raw dump |
| `src/content/applications/*.md` | Four new entries so product references resolve |
| `src/content/products/*.md` | Five new products seeded from the archive |
| `src/lib/crossLinks.ts` | Reverse lookup: which products claim a given application. Pure. |
| `src/pages/applications/index.astro` | Application index |
| `src/pages/applications/[slug].astro` | Application detail, listing the products that claim it |
| `tests/csv.test.ts` | Unit tests for CSV escaping and serialization |
| `tests/jsonld.test.ts` | Unit tests for the JSON-LD builder |
| `tests/build.test.ts` | **Extended** — detail-page, card, and JSON-LD assertions against `dist/` |

---

### Task 1: RFC 4180 CSV serialization

The spec calls Copy-as-CSV out by name (§5 key components 1): the realistic path is an engineer pasting values into a comparison spreadsheet next to two competitors. Escaping is where naive CSV breaks — LiTex part numbers contain commas in some grades and the unit column contains `Ω`.

**Files:**
- Create: `src/lib/csv.ts`
- Test: `tests/csv.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type CsvColumn = { key: string; label: string; unit?: string }`
  - `type CsvRow = Record<string, string>`
  - `escapeCsvField(value: string): string`
  - `columnHeader(column: CsvColumn): string`
  - `specTableToCsv(table: { columns: CsvColumn[]; rows: CsvRow[] }): string`

- [ ] **Step 1: Write the failing tests**

Create `tests/csv.test.ts`. RFC 4180 requires CRLF line endings and doubled quotes inside quoted fields.

```ts
import { describe, it, expect } from 'vitest';
import { escapeCsvField, columnHeader, specTableToCsv } from '../src/lib/csv';

describe('escapeCsvField', () => {
  it('leaves a plain value untouched', () => {
    expect(escapeCsvField('0.27')).toBe('0.27');
  });

  it('quotes a value containing a comma', () => {
    expect(escapeCsvField('TPU, black')).toBe('"TPU, black"');
  });

  it('quotes and doubles an embedded double quote', () => {
    expect(escapeCsvField('12" tube')).toBe('"12"" tube"');
  });

  it('quotes a value containing a newline', () => {
    expect(escapeCsvField('a\nb')).toBe('"a\nb"');
  });

  it('does not quote an apostrophe, which is not a CSV metacharacter', () => {
    expect(escapeCsvField("010/N(K)30'*3/1S")).toBe("010/N(K)30'*3/1S");
  });
});

describe('columnHeader', () => {
  it('returns the bare label when there is no unit', () => {
    expect(columnHeader({ key: 'item', label: 'Item' })).toBe('Item');
  });

  it('appends the unit in parentheses', () => {
    expect(columnHeader({ key: 'r', label: 'Resistance', unit: 'Ω/M' }))
      .toBe('Resistance (Ω/M)');
  });
});

describe('specTableToCsv', () => {
  const table = {
    columns: [
      { key: 'item', label: 'Item' },
      { key: 'resistance', label: 'Resistance', unit: 'Ω/M' },
    ],
    rows: [
      { item: "010/N(K)30'*3/1S", resistance: '~4.4' },
      { item: "010/N(K)30'*3/1S1Z", resistance: '~2.5' },
    ],
  };

  it('emits a header row built from labels and units', () => {
    expect(specTableToCsv(table).split('\r\n')[0]).toBe('Item,Resistance (Ω/M)');
  });

  it('emits one line per row, CRLF separated', () => {
    expect(specTableToCsv(table).split('\r\n')).toHaveLength(3);
  });

  it('orders cells by column, not by object key order', () => {
    const reordered = {
      columns: table.columns,
      rows: [{ resistance: '~4.4', item: 'X' }],
    };
    expect(specTableToCsv(reordered).split('\r\n')[1]).toBe('X,~4.4');
  });

  it('renders a missing cell as an em dash rather than the string undefined', () => {
    const sparse = { columns: table.columns, rows: [{ item: 'X' }] };
    expect(specTableToCsv(sparse).split('\r\n')[1]).toBe('X,—');
  });

  it('has no trailing newline, so pasting does not create a blank row', () => {
    expect(specTableToCsv(table).endsWith('\r\n')).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/csv.test.ts`
Expected: FAIL — cannot resolve `../src/lib/csv`.

- [ ] **Step 3: Implement `src/lib/csv.ts`**

```ts
/** RFC 4180 CSV serialization for spec tables. Pure — no DOM, no Astro imports. */

export type CsvColumn = { key: string; label: string; unit?: string };
export type CsvRow = Record<string, string>;

/** Shown for a cell the source document does not provide. Matches the on-page rendering. */
const MISSING = '—';

export function escapeCsvField(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function columnHeader(column: CsvColumn): string {
  return column.unit ? `${column.label} (${column.unit})` : column.label;
}

export function specTableToCsv(table: { columns: CsvColumn[]; rows: CsvRow[] }): string {
  const header = table.columns.map((c) => escapeCsvField(columnHeader(c))).join(',');
  const body = table.rows.map((row) =>
    table.columns.map((c) => escapeCsvField(row[c.key] ?? MISSING)).join(','),
  );
  return [header, ...body].join('\r\n');
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/csv.test.ts`
Expected: PASS, 13 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/csv.ts tests/csv.test.ts
git commit -m "feat: add RFC 4180 CSV serialization for spec tables"
```

---

### Task 2: JSON-LD Product builder

Spec §4 consequence 3: JSON-LD is emitted from the same object as the visible table, so structured data cannot drift from the page. Kept pure for the same reason as Task 1.

**Files:**
- Create: `src/lib/jsonld.ts`
- Test: `tests/jsonld.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `const MANUFACTURER: { '@type': 'Organization'; name: string; url: string }`
  - `productJsonLd(input: { name: string; description: string; url: string; status: 'active' | 'legacy'; certifications: readonly string[] }): Record<string, unknown>`

- [ ] **Step 1: Write the failing tests**

Create `tests/jsonld.test.ts`. The negative assertions matter most: inventing an `offers` block with a price would be a factual claim LiTex never made, and pricing is quote-based (spec §4).

```ts
import { describe, it, expect } from 'vitest';
import { productJsonLd, MANUFACTURER } from '../src/lib/jsonld';

const base = {
  name: 'Conductive Metal Yarn',
  description: 'Tinned copper filaments helically wound around a core.',
  url: 'https://litex.com.tw/products/conductive-metal-yarn/',
  status: 'active' as const,
  certifications: ['REACH', 'RoHS'],
};

describe('productJsonLd', () => {
  it('declares itself as a schema.org Product', () => {
    const ld = productJsonLd(base);
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('Product');
  });

  it('carries name, description and canonical url', () => {
    const ld = productJsonLd(base);
    expect(ld.name).toBe('Conductive Metal Yarn');
    expect(ld.description).toBe(base.description);
    expect(ld.url).toBe(base.url);
  });

  it('names LiTex as the manufacturer', () => {
    expect(productJsonLd(base).manufacturer).toEqual(MANUFACTURER);
  });

  it('never invents an offer or a price, because pricing is quote-based', () => {
    const ld = productJsonLd(base);
    expect(ld.offers).toBeUndefined();
    expect(JSON.stringify(ld)).not.toContain('price');
  });

  it('maps certifications to hasCertification entries', () => {
    const ld = productJsonLd(base) as { hasCertification: { name: string }[] };
    expect(ld.hasCertification.map((c) => c.name)).toEqual(['REACH', 'RoHS']);
  });

  it('omits hasCertification entirely when there are none', () => {
    expect(productJsonLd({ ...base, certifications: [] }).hasCertification).toBeUndefined();
  });

  it('marks a legacy product as Discontinued', () => {
    expect(productJsonLd({ ...base, status: 'legacy' }).productionDate).toBeUndefined();
    expect(productJsonLd({ ...base, status: 'legacy' })['@type']).toBe('Product');
    expect(productJsonLd({ ...base, status: 'legacy' }).additionalProperty)
      .toEqual([{ '@type': 'PropertyValue', name: 'availability', value: 'Discontinued — sampling only' }]);
  });

  it('marks an active product as In production', () => {
    expect(productJsonLd(base).additionalProperty)
      .toEqual([{ '@type': 'PropertyValue', name: 'availability', value: 'In production' }]);
  });

  it('produces an object that survives JSON serialization', () => {
    expect(() => JSON.stringify(productJsonLd(base))).not.toThrow();
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/jsonld.test.ts`
Expected: FAIL — cannot resolve `../src/lib/jsonld`.

- [ ] **Step 3: Implement `src/lib/jsonld.ts`**

```ts
/**
 * schema.org Product JSON-LD, built from the same content entry that renders the
 * visible page so the two cannot drift (spec §4). Pure — no DOM, no Astro imports.
 *
 * Deliberately emits no `offers`: LiTex pricing is quote-based, and an invented
 * price is a factual claim the company never made.
 */

export const MANUFACTURER = {
  '@type': 'Organization',
  name: 'LiTex Textile & Technology Co., Ltd.',
  url: 'https://litex.com.tw',
} as const;

export function productJsonLd(input: {
  name: string;
  description: string;
  url: string;
  status: 'active' | 'legacy';
  certifications: readonly string[];
}): Record<string, unknown> {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description,
    url: input.url,
    manufacturer: MANUFACTURER,
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'availability',
        value: input.status === 'active' ? 'In production' : 'Discontinued — sampling only',
      },
    ],
  };

  if (input.certifications.length > 0) {
    ld.hasCertification = input.certifications.map((name) => ({
      '@type': 'Certification',
      name,
    }));
  }

  return ld;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/jsonld.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/jsonld.ts tests/jsonld.test.ts
git commit -m "feat: add schema.org Product JSON-LD builder"
```

---

### Task 3: Status badge and product card

Spec §5 key component 3. The Silica Gel Switch keeps its search value while being honest about availability — which only works if "legacy" is stated in **words**. Colour and glyph are reinforcement, never the carrier.

**Files:**
- Create: `src/components/StatusBadge.astro`, `src/components/ProductCard.astro`
- Test: covered by `tests/build.test.ts` in Task 6

**Interfaces:**
- Consumes: `src/styles/tokens.css` custom properties.
- Produces:
  - `StatusBadge.astro` props `{ status: 'active' | 'legacy' }`
  - `ProductCard.astro` props `{ href: string; name: string; summary: string; status: 'active' | 'legacy'; certifications: readonly string[] }`

- [ ] **Step 1: Create `src/components/StatusBadge.astro`**

The glyph is `aria-hidden` because a screen reader announcing "black circle" adds nothing — the text after it already says everything.

```astro
---
interface Props {
  status: 'active' | 'legacy';
}

const { status } = Astro.props;

const label = status === 'active' ? 'IN PRODUCTION' : 'LEGACY · SAMPLING ONLY';
const glyph = status === 'active' ? '●' : '○';
---
<span class:list={['status', status]} data-status={status}>
  <span aria-hidden="true">{glyph}</span> {label}
</span>

<style>
  .status {
    font-family: var(--font-mono);
    font-size: var(--t-12);
    letter-spacing: 0.06em;
    white-space: nowrap;
  }
  .active { color: var(--c-in-production); }
  .legacy { color: var(--c-legacy); }
</style>
```

- [ ] **Step 2: Create `src/components/ProductCard.astro`**

```astro
---
import StatusBadge from './StatusBadge.astro';

interface Props {
  href: string;
  name: string;
  summary: string;
  status: 'active' | 'legacy';
  certifications: readonly string[];
}

const { href, name, summary, status, certifications } = Astro.props;
---
<article class="card">
  <h2 class="name"><a href={href}>{name}</a></h2>
  <StatusBadge status={status} />
  <p class="summary">{summary}</p>
  {certifications.length > 0 && (
    <p class="certs value">{certifications.join(' · ')}</p>
  )}
</article>

<style>
  .card {
    background: var(--c-raised);
    border: 1px solid var(--c-line);
    padding: var(--s-6);
    display: flex;
    flex-direction: column;
    gap: var(--s-3);
  }
  .name {
    margin: 0;
    font-size: var(--t-20);
    line-height: 1.25;
  }
  .name a {
    color: var(--c-text-1);
    text-decoration: none;
  }
  .name a:hover { color: var(--c-copper-lift); }
  .summary {
    margin: 0;
    color: var(--c-text-2);
    font-size: var(--t-14);
  }
  .certs {
    margin: 0;
    font-size: var(--t-12);
    color: var(--c-copper);
    letter-spacing: 0.04em;
  }
</style>
```

- [ ] **Step 3: Confirm the build still succeeds**

Run: `npm run build`
Expected: exits 0. Nothing imports these components yet; this step only proves they compile.

- [ ] **Step 4: Run the design detector**

Run: `node .claude/skills/impeccable/scripts/detect.mjs --json src/components`
Expected: `[]`. Fix any finding rather than suppressing it.

- [ ] **Step 5: Commit**

```bash
git add src/components/StatusBadge.astro src/components/ProductCard.astro
git commit -m "feat: add product card and availability status badge"
```

---

### Task 4: The spec table component

The signature component (spec §5). CSV is serialized at build time into `data-csv`, so the client script only reads a string and writes it to the clipboard — no serialization logic ships to the browser, and the logic that does exist is already unit-tested by Task 1.

**Files:**
- Create: `src/components/SpecTable.astro`
- Test: covered by `tests/build.test.ts` in Task 6

**Interfaces:**
- Consumes: `specTableToCsv`, `columnHeader` from `src/lib/csv.ts` (Task 1).
- Produces: `SpecTable.astro` props `{ table: { columns: CsvColumn[]; rows: CsvRow[] }; caption: string; sourceNote?: string; needsVerification?: boolean }`

- [ ] **Step 1: Create `src/components/SpecTable.astro`**

The button ships with `hidden` and is revealed by script, so a no-JS visitor never sees a dead control. `aria-live="polite"` announces the result of the copy.

```astro
---
import { specTableToCsv, columnHeader, type CsvColumn, type CsvRow } from '../lib/csv';

interface Props {
  table: { columns: CsvColumn[]; rows: CsvRow[] };
  caption: string;
  sourceNote?: string;
  needsVerification?: boolean;
}

const { table, caption, sourceNote, needsVerification = false } = Astro.props;
const csv = specTableToCsv(table);
---
<figure class="spec">
  <figcaption class="caption">{caption}</figcaption>

  <div class="scroll">
    <table>
      <thead>
        <tr>
          {table.columns.map((col) => <th scope="col">{columnHeader(col)}</th>)}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row) => (
          <tr>
            {table.columns.map((col) => <td class="value">{row[col.key] ?? '—'}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  <button type="button" class="copy" data-copy-csv data-csv={csv} aria-live="polite" hidden>
    Copy as CSV
  </button>

  {sourceNote && (
    <p class="note" data-source-note><small>Source: {sourceNote}</small></p>
  )}

  {needsVerification && (
    <p class="note warn" data-needs-verification>
      <small>These figures are awaiting verification against the source catalog.</small>
    </p>
  )}
</figure>

<script>
  document.querySelectorAll('[data-copy-csv]').forEach((node) => {
    const button = node as HTMLButtonElement;
    button.hidden = false;
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.csv ?? '');
        button.textContent = 'Copied';
      } catch {
        button.textContent = 'Copy failed — select the table instead';
      }
      window.setTimeout(() => { button.textContent = 'Copy as CSV'; }, 2000);
    });
  });
</script>

<style>
  .spec { margin: var(--s-8) 0; }
  .caption {
    font-family: var(--font-mono);
    font-size: var(--t-12);
    letter-spacing: 0.08em;
    color: var(--c-copper);
    margin-bottom: var(--s-3);
  }
  /* Wide spec tables scroll inside their own box; the page never scrolls sideways. */
  .scroll { overflow-x: auto; }
  table {
    border-collapse: collapse;
    width: 100%;
    background: var(--c-raised);
  }
  th, td {
    border: 1px solid var(--c-line);
    padding: var(--s-2) var(--s-3);
    text-align: left;
    font-size: var(--t-14);
    white-space: nowrap;
  }
  th {
    font-family: var(--font-mono);
    font-size: var(--t-12);
    color: var(--c-text-2);
    font-weight: 500;
  }
  .copy {
    margin-top: var(--s-3);
    font-family: var(--font-mono);
    font-size: var(--t-12);
    color: var(--c-copper);
    background: transparent;
    border: 1px solid var(--c-line);
    padding: var(--s-2) var(--s-3);
    cursor: pointer;
  }
  .copy:hover { color: var(--c-copper-lift); border-color: var(--c-copper); }
  .note { margin: var(--s-2) 0 0; color: var(--c-text-2); }
  .warn { color: var(--c-legacy); }
</style>
```

- [ ] **Step 2: Confirm the build succeeds**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Run the design detector**

Run: `node .claude/skills/impeccable/scripts/detect.mjs --json src/components`
Expected: `[]`.

- [ ] **Step 4: Commit**

```bash
git add src/components/SpecTable.astro
git commit -m "feat: add spec table component with build-time CSV serialization"
```

---

### Task 5: Product detail pages

**Files:**
- Create: `src/pages/products/[slug].astro`
- Test: `tests/build.test.ts` (extended in Task 6)

**Interfaces:**
- Consumes: `BaseLayout.astro`, `SpecTable.astro`, `StatusBadge.astro`, `mustResolve` from `src/lib/references.ts`, `productJsonLd` from `src/lib/jsonld.ts`, `SITE_URL` from `astro.config.mjs`.
- Produces: `dist/products/<slug>/index.html` for every entry in the `products` collection.

- [ ] **Step 1: Create `src/pages/products/[slug].astro`**

`render(product)` is the Astro 7 API for the Markdown body — **verified** against the installed version's virtual module, where it is exported as an alias of `renderEntry`. `product.id` is the filename without extension, which is the slug under the glob loader.

```astro
---
import { getCollection, getEntry, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import SpecTable from '../../components/SpecTable.astro';
import StatusBadge from '../../components/StatusBadge.astro';
import { mustResolve } from '../../lib/references';
import { productJsonLd } from '../../lib/jsonld';

export async function getStaticPaths() {
  const products = await getCollection('products');
  return products.map((product) => ({
    params: { slug: product.id },
    props: { product },
  }));
}

const { product } = Astro.props;
const { Content } = await render(product);

// getEntry() returns undefined for a missing entry and Astro does NOT fail the build
// on it — mustResolve turns that silence into an error. See src/lib/references.ts.
const applications = await Promise.all(
  product.data.applications.map(async (ref) =>
    mustResolve(await getEntry(ref), ref, product.id),
  ),
);

// Astro.site is the configured SITE_URL. Do NOT import astro.config.mjs into a page —
// that pulls `defineConfig` from astro/config into the page bundle.
const canonical = new URL(Astro.url.pathname, Astro.site).href;

const jsonLd = productJsonLd({
  name: product.data.name,
  description: product.data.summary,
  url: canonical,
  status: product.data.status,
  certifications: product.data.certifications,
});
---
<BaseLayout
  title={`${product.data.name} — LiTex Textile & Technology`}
  description={product.data.summary}
>
  <p class="breadcrumb"><a href="/products/">← All products</a></p>

  <h1>{product.data.name}</h1>
  <StatusBadge status={product.data.status} />
  <p class="summary">{product.data.summary}</p>

  {product.data.certifications.length > 0 && (
    <p class="certs value">{product.data.certifications.join(' · ')}</p>
  )}

  <div class="prose"><Content /></div>

  {product.data.specTable && (
    <SpecTable
      table={product.data.specTable}
      caption={`${product.data.name} — specifications`}
      sourceNote={product.data.sourceNote}
      needsVerification={product.data.needsVerification}
    />
  )}

  {applications.length > 0 && (
    <section>
      <h2>Applications</h2>
      <ul>
        {applications.map((app) => (
          <li><a href={`/applications/${app.id}/`}>{app.data.name}</a></li>
        ))}
      </ul>
    </section>
  )}

  {product.data.catalogPdf && (
    <p class="value">Catalog: {product.data.catalogPdf}</p>
  )}

  <script type="application/ld+json" is:inline set:html={JSON.stringify(jsonLd)}></script>
</BaseLayout>

<style>
  .breadcrumb { font-size: var(--t-14); }
  .summary { color: var(--c-text-2); font-size: var(--t-20); max-width: 60ch; }
  .certs { color: var(--c-copper); font-size: var(--t-12); letter-spacing: 0.04em; }
  .prose { max-width: 70ch; }
</style>
```

> **Note on the application links:** `/applications/<id>/` routes are built in Task 8 of this plan, so these links resolve by the end of it. They do not resolve *during* Tasks 5–7 — that is expected and is why Task 8 exists.

- [ ] **Step 2: Build and inspect the generated routes**

Run: `npm run build`
Expected: exits 0 and generates `dist/products/conductive-metal-yarn/index.html` and `dist/products/rfid-textile-tape/index.html` — the two products Plan 1 seeded.

- [ ] **Step 3: Confirm the full suite still passes**

Run: `npm test`
Expected: PASS. Plan 1's 54 tests are unaffected by adding routes.

- [ ] **Step 4: Commit**

```bash
git add src/pages/products/[slug].astro
git commit -m "feat: generate product detail pages from the products collection"
```

---

### Task 6: Products index and the assertions that hold it together

Rewrites Plan 1's raw dump into a card grid, then adds the build assertions covering Tasks 3–5. The assertions come after the page exists because they test the built output of both together.

**Files:**
- Modify: `src/pages/products/index.astro` (full rewrite)
- Modify: `tests/build.test.ts`

**Interfaces:**
- Consumes: `ProductCard.astro`, `BaseLayout.astro`.
- Produces: `dist/products/index.html` containing one card per product.

- [ ] **Step 1: Rewrite `src/pages/products/index.astro`**

Products sort active-first, then alphabetically — a legacy item should not head the list.

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import ProductCard from '../../components/ProductCard.astro';

const products = (await getCollection('products')).sort((a, b) => {
  if (a.data.status !== b.data.status) return a.data.status === 'active' ? -1 : 1;
  return a.data.name.localeCompare(b.data.name);
});
---
<BaseLayout
  title="Products — LiTex Textile & Technology"
  description="Conductive metal yarn, heating textile, EMI shielding tube and RFID tape, with published specifications."
>
  <h1>Products</h1>
  <p class="intro">
    Every specification below is published as data, with the source document named.
  </p>

  <div class="grid">
    {products.map((product) => (
      <ProductCard
        href={`/products/${product.id}/`}
        name={product.data.name}
        summary={product.data.summary}
        status={product.data.status}
        certifications={product.data.certifications}
      />
    ))}
  </div>
</BaseLayout>

<style>
  .intro { color: var(--c-text-2); max-width: 60ch; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
    gap: var(--s-4);
    margin-top: var(--s-8);
  }
</style>
```

- [ ] **Step 2: Replace the products-index assertions in `tests/build.test.ts`**

Plan 1's `describe('built products index', ...)` block asserted against the raw dump — the `[data-source-note]` and `.value` assertions in it no longer hold, because spec tables have moved to the detail pages. Delete that entire `describe` block and append these two in its place. Keep the `describe('built home page', ...)` block untouched.

```ts
describe('built products index', () => {
  let doc: ReturnType<typeof docFor>;
  beforeAll(() => { doc = docFor('products/index.html'); });

  it('renders one card per product, each linking to its detail page', () => {
    const links = [...doc.querySelectorAll('.card a[href^="/products/"]')]
      .map((a) => a.getAttribute('href'));
    expect(links).toContain('/products/conductive-metal-yarn/');
    expect(links).toContain('/products/rfid-textile-tape/');
  });

  it('states availability in words, not by colour alone', () => {
    const text = doc.body.textContent ?? '';
    expect(text).toContain('IN PRODUCTION');
  });

  it('lists active products before legacy ones', () => {
    const statuses = [...doc.querySelectorAll('[data-status]')]
      .map((n) => n.getAttribute('data-status'));
    const firstLegacy = statuses.indexOf('legacy');
    const lastActive = statuses.lastIndexOf('active');
    if (firstLegacy !== -1) expect(firstLegacy).toBeGreaterThan(lastActive);
  });

  it('never leaks placeholder contact details into visible copy', () => {
    const text = doc.body.textContent ?? '';
    expect(text).not.toContain('litex.example');
    expect(text).not.toContain('example.com');
  });
});

describe('built product detail page', () => {
  let doc: ReturnType<typeof docFor>;
  beforeAll(() => { doc = docFor('products/conductive-metal-yarn/index.html'); });

  it('has exactly one h1 naming the product', () => {
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('h1')?.textContent).toContain('Conductive Metal Yarn');
  });

  it('points its canonical at its own URL', () => {
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://litex.com.tw/products/conductive-metal-yarn/');
  });

  it('renders the spec table with scoped column headers', () => {
    const headers = [...doc.querySelectorAll('th[scope="col"]')].map((th) => th.textContent);
    expect(headers.join(' ')).toContain('Resistance (Ω/M)');
  });

  it('shows provenance for the spec data', () => {
    const note = doc.querySelector('[data-source-note]');
    expect(note?.textContent).toContain('2018-non-carbon-electrical-heating-textile.pdf');
  });

  it('offers Copy as CSV with the serialized table attached', () => {
    const button = doc.querySelector('[data-copy-csv]');
    expect(button, 'no copy-as-CSV control found').toBeTruthy();
    const csv = button?.getAttribute('data-csv') ?? '';
    expect(csv.split('\r\n')[0]).toContain('Resistance (Ω/M)');
    expect(csv).toContain("010/N(K)30'*3/1S");
  });

  it('hides the copy control until script enables it, so no-JS sees no dead button', () => {
    expect(doc.querySelector('[data-copy-csv]')?.hasAttribute('hidden')).toBe(true);
  });

  it('emits valid Product JSON-LD naming LiTex as manufacturer', () => {
    const raw = doc.querySelector('script[type="application/ld+json"]')?.textContent ?? '';
    const ld = JSON.parse(raw);
    expect(ld['@type']).toBe('Product');
    expect(ld.name).toBe('Conductive Metal Yarn');
    expect(ld.manufacturer.name).toContain('LiTex');
    expect(ld.url).toBe('https://litex.com.tw/products/conductive-metal-yarn/');
  });

  it('never advertises a price, because pricing is quote-based', () => {
    const raw = doc.querySelector('script[type="application/ld+json"]')?.textContent ?? '';
    expect(raw).not.toContain('price');
  });

  it('links every application it references', () => {
    const links = [...doc.querySelectorAll('a[href^="/applications/"]')];
    expect(links.length).toBeGreaterThan(0);
  });
});

```

- [ ] **Step 3: Run the build and the suite**

Run: `npm run build && npm test`
Expected: build exits 0 and **all** tests pass. Both `describe` blocks above assert only against the two products Plan 1 already seeded, so this task lands green.

- [ ] **Step 4: Commit**

```bash
git add src/pages/products/index.astro tests/build.test.ts
git commit -m "feat: rebuild products index as a card grid with build assertions"
```

---

### Task 7: Seed the five remaining products and the applications they reference

Every value below comes from `archive/` or spec §6. **Nothing is invented.**

**Both previously-ambiguous spec tables were verified on 2026-08-11** by rendering the source PDF pages with pymupdf and reading the artwork directly, so no product ships with `needsVerification: true`. `pdftoppm` is not installed on this machine; `pymupdf` (`import fitz`) is, and `page.get_pixmap(dpi=170).save(path)` produces a legible page image. Use that method for the two image-only catalogs when their turn comes.

The four new application entries exist so product references resolve. Their **pages** are Plan 3; only the content entries are created here.

**Files:**
- Create: `src/content/applications/automotive-interiors.md`, `healthcare-therapeutic-heating.md`, `cable-protection-emi-shielding.md`, `industrial-woven-metal.md`
- Create: `src/content/products/electrical-heating-textile.md`, `emi-shielding-woven-tube.md`, `braided-self-curling-tube.md`, `wired-conductive-tape.md`, `silica-gel-switch-controller.md`

**Interfaces:**
- Consumes: the `products` and `applications` schemas (Plan 1 Task 5), the `[slug].astro` route (Task 5).
- Produces: seven product detail routes in total.

- [ ] **Step 1: Write the failing assertions for the seeded products**

Append to `tests/build.test.ts`. These fail now and pass once the content exists — the seed data is the implementation.

```ts
describe('built legacy product detail page', () => {
  it('states legacy availability in words, not colour alone', () => {
    const doc = docFor('products/silica-gel-switch-controller/index.html');
    expect(doc.body.textContent).toContain('LEGACY');
    expect(doc.body.textContent).toContain('SAMPLING ONLY');
  });

  it('renders the HT001 specification table with its provenance', () => {
    const doc = docFor('products/silica-gel-switch-controller/index.html');
    expect(doc.body.textContent).toContain('#HT001 Silicon switch');
    expect(doc.querySelector('[data-source-note]')?.textContent)
      .toContain('extracted-from-images.md');
  });
});

describe('all seeded products', () => {
  const slugs = [
    'conductive-metal-yarn',
    'rfid-textile-tape',
    'electrical-heating-textile',
    'emi-shielding-woven-tube',
    'braided-self-curling-tube',
    'wired-conductive-tape',
    'silica-gel-switch-controller',
  ];

  it('each generates a detail page with a single h1 and a canonical', () => {
    for (const slug of slugs) {
      const doc = docFor(`products/${slug}/index.html`);
      expect(doc.querySelectorAll('h1'), `${slug} h1 count`).toHaveLength(1);
      expect(
        doc.querySelector('link[rel="canonical"]')?.getAttribute('href'),
        `${slug} canonical`,
      ).toBe(`https://litex.com.tw/products/${slug}/`);
    }
  });

  it('never claims a certification LiTex has not made', () => {
    for (const slug of slugs) {
      const doc = docFor(`products/${slug}/index.html`);
      // "Wire is UL approved" is a third-party wire approval and stays in prose;
      // it must never appear in the certifications line.
      const certLine = doc.querySelector('.certs')?.textContent ?? '';
      expect(certLine, `${slug} certifications`).not.toContain('UL');
    }
  });

  it('every spec table carries a source note', () => {
    for (const slug of slugs) {
      const doc = docFor(`products/${slug}/index.html`);
      if (doc.querySelector('table')) {
        expect(
          doc.querySelector('[data-source-note]')?.textContent?.trim(),
          `${slug} is missing provenance for its spec table`,
        ).toBeTruthy();
      }
    }
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npm run build && npx vitest run tests/build.test.ts`
Expected: FAIL — `ENOENT` on `dist/products/silica-gel-switch-controller/index.html` and the other five unseeded routes.

- [ ] **Step 3: Create the four application entries**

Evidence strings are copied from spec §3's shortlist table — each one names where LiTex itself makes the claim.

`src/content/applications/automotive-interiors.md`:

```markdown
---
name: "Automotive interiors"
summary: "Seat, panel and cabin heating using electrical heating textile woven to the required width."
evidence: "archive/images/applications.jpg — LiTex lists 'Automotive industry' among heating textile applications"
needsDetail: true
---

LiTex publishes automotive as an application for its electrical heating textile. Supporting detail beyond the application graphic has not yet been supplied.
```

`src/content/applications/healthcare-therapeutic-heating.md`:

```markdown
---
name: "Healthcare & therapeutic heating"
summary: "Therapeutic and patient-warming textiles built on conductive metal yarn and heating fabric."
evidence: "archive/images/applications.jpg and archive/images/cmy-applications.jpg — both list Healthcare"
needsDetail: true
---

Healthcare is claimed by LiTex for both the heating textile and Conductive Metal Yarn product lines.
```

`src/content/applications/cable-protection-emi-shielding.md`:

```markdown
---
name: "Cable protection & EMI shielding"
summary: "Braided tube encasing cable runs for EMI shielding and abrasion protection on sensitive instruments."
evidence: "archive/images/cmy-applications.jpg; 2018-emi-shielding-wire-tube.pdf; Düsseldorf Wire Show post"
needsDetail: false
---

LiTex manufactures braided tube from copper-plated aramid for encasing cables that need EMI protection, and a self-curling variant for abrasion resistance.
```

`src/content/applications/industrial-woven-metal.md`:

```markdown
---
name: "Industrial woven metal"
summary: "Contract weaving of metal-bearing textiles for heavy industry, offered as OEM and ODM work."
evidence: "archive/pages/about.html — 'contracts requiring woven metal products for heavy industries'"
needsDetail: true
---

LiTex describes contract manufacturing of woven metal products for heavy industry on its About page.
```

- [ ] **Step 4: Create the electrical heating textile product**

The feature list is transcribed from `archive/extracted-from-images.md` §4. **No `specTable`:** the fabric has no published specification table. The stainless steel yarn table in §1 of that file is *not* assigned to a product anywhere in the archive — do not attach it here on the assumption that it belongs. It is listed in the open questions at the bottom of this plan.

```markdown
---
name: "Electrical Heating Textile"
status: "active"
summary: "Non-carbon heating fabric woven from conductive metal yarn, customizable up to 70 cm wide."
applications:
  - heated-apparel-wearables
  - automotive-interiors
  - healthcare-therapeutic-heating
certifications: ["REACH", "RoHS", "SGS"]
catalogPdf: "2018-non-carbon-electrical-heating-textile.pdf"
needsVerification: false
---

Heating fabric built from Conductive Metal Yarn rather than carbon fibre, so the heating element is woven rather than assembled by hand.

Published features: patented technology · REACH and RoHS compliant · SGS test certified toughness · even and stable heating · flexibility to cover uneven objects · flame retardant and heat resistant · excellent breathability · waterproof varieties available · width, conductivity and strength customizable · fabric width up to 70 cm · ODM and OEM welcome.
```

- [ ] **Step 5: Create the EMI shielding woven tube product**

**This table was verified against the rendered PDF page on 2026-08-11**, so `needsVerification: false` is correct. Two things the verification settled: the diameter headers read **`(ø)`**, not `mm`, so the unit is transcribed as printed; and the source has a fifth column headed **`(c)`** whose value is `3` for all three sizes and whose meaning is defined nowhere in the catalog. **It is omitted deliberately** — an unexplained column on a spec page is exactly the kind of thing that costs trust. It is logged in the open questions below.

```markdown
---
name: "EMI Shielding Woven Tube"
status: "active"
summary: "Braided tube of copper-plated aramid that expands to encase cables needing EMI protection."
applications:
  - cable-protection-emi-shielding
certifications: ["RoHS"]
catalogPdf: "2018-emi-shielding-wire-tube.pdf"
sourceNote: "2018-emi-shielding-wire-tube.pdf p.2, verified against the rendered PDF page on 2026-08-11"
needsVerification: false
specTable:
  columns:
    - { key: "product", label: "Product" }
    - { key: "smallest", label: "Smallest diameter", unit: "ø" }
    - { key: "largest", label: "Largest diameter", unit: "ø" }
    - { key: "taut", label: "Width when taut", unit: "mm" }
  rows:
    - { product: "KPTS-3",  smallest: "3",  largest: "12", taut: "6" }
    - { product: "KPTS-6",  smallest: "6",  largest: "22", taut: "15" }
    - { product: "KPTS-15", smallest: "15", largest: "28", taut: "19" }
---

A composite of aramid (fibre glass) core covered with copper plating, braided into a tube. Compressing the length increases the diameter 1.5 to 4 times its taut state, so one size accommodates a range of cable thicknesses.

Covering is tin-plated copper over an aramid core. Heat resistant to 600 °C. The mesh formed by braiding reduces moisture and vapour buildup inside. Standard put-up is 100 m per roll, four rolls per carton. RoHS certified. OEM and ODM available.

The catalog publishes a measured EMI shielding efficiency curve: attenuation stays between roughly 55 dB and 75 dB across 30 MHz to 1 GHz, with the strongest attenuation below 200 MHz. Read from the chart on page 2 of the catalog — the underlying figures are not published as a table.
```

- [ ] **Step 6: Create the braided self-curling tube product**

Copy is transcribed from `archive/pages/product-braided-self-curling-tube.html`. No `specTable` — the page says "five different specifications available" but the specifications live in a brochure with no extractable text layer.

```markdown
---
name: "Braided Self-Curling Tube"
status: "active"
summary: "Self-curling braided tube protecting cables from abrasion, with multiple wire exit points."
applications:
  - cable-protection-emi-shielding
certifications: []
needsVerification: false
---

Offers protection from rough abrasion and tearing for cables and wires of sensitive instruments. The self-curling construction allows multiple exit and entry points for each wire in a bundle, so a cable can leave the run without breaking the sleeve.

Five specifications are available. Detailed dimensions are published only in the product brochure, which has no extractable text layer — figures will be added once LiTex supplies them.
```

- [ ] **Step 7: Create the wired conductive tape product**

**Do not add `UL` to `certifications`.** The archived page says "Wire is UL approved" — that is a third-party wire approval, not a LiTex certification, and the schema enum rejects it by design.

```markdown
---
name: "Wired Conductive Woven Tape"
status: "active"
summary: "Narrow textile tape with conductive wire woven in, usable as a cable and sewable into fabric."
applications:
  - smart-textiles-rfid
  - industrial-woven-metal
certifications: []
needsVerification: false
---

Narrow textile tape with conductive wire woven within, usable as a regular cable but with additional functionality — it can be sewn directly into fabric. Both elastic and non-elastic varieties are made.

Published features: can be customized to be non-elastic · allows cables to be incorporated into any form of fabric · excellent signal and electric conductance · tape form reduces tangling · the wire used is UL approved.

This product is covered by patent TW 1M545145, "Wired Conductive Woven Tape".
```

- [ ] **Step 8: Create the silica gel switch controller product**

`status: "legacy"` — the catalog marks it out of production, available for sampling. `applications: []` is deliberate: this is a controller accessory, and LiTex publishes no end-use claim for it. Inventing one would breach the standing principle in spec §3.

The HT001 table comes from `archive/extracted-from-images.md` §3, which is a clean two-column transcription with no misalignment, so `needsVerification: false` is correct here.

```markdown
---
name: "Silica Gel Switch Controller"
status: "legacy"
summary: "HT001 silicon switch controlling heating textile, with NTC temperature sensor ports."
applications: []
certifications: []
catalogPdf: "201611e68ea7e588b6e599a8final.pdf"
sourceNote: "archive/extracted-from-images.md §3, transcribed from images/silica-gel-switch-controller-spec.jpg"
needsVerification: false
specTable:
  columns:
    - { key: "property", label: "Property" }
    - { key: "value", label: "Value" }
  rows:
    - { property: "Model",                 value: "#HT001 Silicon switch" }
    - { property: "Size (W×L×H)",          value: "38 × 38 × 8 mm" }
    - { property: "Input & output volts",  value: "3.3 V – 12 V" }
    - { property: "Current",               value: "MAX 5 A" }
    - { property: "LED sign",              value: "RGB LED, 3 sets" }
---

Out of production, available for sampling and testing.

Ports: `P+` / `P−` heating textile port · `B+` / `B−` battery input port · `T1` / `T2` NTC temperature sensor.
```

- [ ] **Step 9: Build and run the full suite**

Run: `npm run build && npm test`
Expected: build exits 0 and generates seven product routes. All tests pass, including the legacy-product block that failed in Task 6.

- [ ] **Step 10: Verify the reference guard still bites**

Temporarily change `cable-protection-emi-shielding` to `does-not-exist` in `src/content/products/emi-shielding-woven-tube.md`, then run `npm run build`.
Expected: build FAILS with `Broken reference: "emi-shielding-woven-tube" points at "does-not-exist"`. Revert and rebuild to confirm green.

- [ ] **Step 11: Run the design detector**

Run: `node .claude/skills/impeccable/scripts/detect.mjs --json src/pages src/components src/layouts src/styles`
Expected: `[]`. Fix any finding rather than suppressing it.

- [ ] **Step 12: Commit**

```bash
git add src/content
git commit -m "feat: seed five remaining products and four application entries"
```

---

### Task 8: Application pages and the reverse cross-link

Spec §2 settles the IA as **dual-entry — products ↔ applications, cross-linked**. Task 5 builds one direction. Without this task the other direction does not exist and every product page ends in seven dead links, which is worse than not linking at all.

The reverse lookup is a pure function so it can be unit-tested without a build.

**Files:**
- Create: `src/lib/crossLinks.ts`, `src/pages/applications/index.astro`, `src/pages/applications/[slug].astro`
- Test: `tests/crossLinks.test.ts`, `tests/build.test.ts` (extended)

**Interfaces:**
- Consumes: `refToId` from `src/lib/references.ts` (Plan 1), `ProductCard.astro` (Task 3), `BaseLayout.astro`.
- Produces:
  - `productsClaiming<T extends { data: { applications: EntryRef[] } }>(products: T[], applicationId: string): T[]`
  - `dist/applications/index.html` and `dist/applications/<slug>/index.html` for all six applications.

- [ ] **Step 1: Write the failing test for the reverse lookup**

Create `tests/crossLinks.test.ts`. The reference values are whatever `reference()` parsed them into, which is why this goes through `refToId` rather than comparing raw.

```ts
import { describe, it, expect } from 'vitest';
import { productsClaiming } from '../src/lib/crossLinks';

const products = [
  { id: 'cmy', data: { applications: ['heated-apparel-wearables'] } },
  { id: 'heating', data: { applications: ['heated-apparel-wearables', 'automotive-interiors'] } },
  { id: 'switch', data: { applications: [] } },
  { id: 'emi', data: { applications: [{ collection: 'applications', id: 'cable-protection-emi-shielding' }] } },
];

describe('productsClaiming', () => {
  it('finds every product that references the application', () => {
    expect(productsClaiming(products, 'heated-apparel-wearables').map((p) => p.id))
      .toEqual(['cmy', 'heating']);
  });

  it('accepts a parsed reference object as well as a bare string id', () => {
    expect(productsClaiming(products, 'cable-protection-emi-shielding').map((p) => p.id))
      .toEqual(['emi']);
  });

  it('returns an empty array when no product claims it, rather than throwing', () => {
    expect(productsClaiming(products, 'architecture')).toEqual([]);
  });

  it('ignores products with no applications at all', () => {
    expect(productsClaiming(products, 'heated-apparel-wearables').map((p) => p.id))
      .not.toContain('switch');
  });

  it('preserves the input order, so callers control sorting', () => {
    expect(productsClaiming(products, 'heated-apparel-wearables')[0].id).toBe('cmy');
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/crossLinks.test.ts`
Expected: FAIL — cannot resolve `../src/lib/crossLinks`.

- [ ] **Step 3: Implement `src/lib/crossLinks.ts`**

```ts
import { refToId, type EntryRef } from './references';

/**
 * The reverse half of the dual-entry IA (spec §2): products declare their
 * applications, so "which products claim this application" is a lookup rather
 * than a second hand-maintained list that can drift out of sync.
 */
export function productsClaiming<T extends { data: { applications: EntryRef[] } }>(
  products: T[],
  applicationId: string,
): T[] {
  return products.filter((product) =>
    product.data.applications.some((ref) => refToId(ref) === applicationId),
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/crossLinks.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Create `src/pages/applications/[slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import ProductCard from '../../components/ProductCard.astro';
import { productsClaiming } from '../../lib/crossLinks';

export async function getStaticPaths() {
  const applications = await getCollection('applications');
  const products = await getCollection('products');
  return applications.map((application) => ({
    params: { slug: application.id },
    props: { application, products: productsClaiming(products, application.id) },
  }));
}

const { application, products } = Astro.props;
const { Content } = await render(application);
---
<BaseLayout
  title={`${application.data.name} — LiTex Textile & Technology`}
  description={application.data.summary}
>
  <p class="breadcrumb"><a href="/applications/">← All applications</a></p>

  <h1>{application.data.name}</h1>
  <p class="summary">{application.data.summary}</p>

  <div class="prose"><Content /></div>

  <section>
    <h2>Products for this application</h2>
    {products.length > 0 ? (
      <div class="grid">
        {products.map((product) => (
          <ProductCard
            href={`/products/${product.id}/`}
            name={product.data.name}
            summary={product.data.summary}
            status={product.data.status}
            certifications={product.data.certifications}
          />
        ))}
      </div>
    ) : (
      <p class="empty">No product currently lists this application.</p>
    )}
  </section>

  <p class="provenance" data-evidence>
    <small>Evidence for this application: {application.data.evidence}</small>
  </p>

  {application.data.needsDetail && (
    <p class="provenance" data-needs-detail>
      <small>LiTex has claimed this application but has not yet supplied supporting detail.</small>
    </p>
  )}
</BaseLayout>

<style>
  .breadcrumb { font-size: var(--t-14); }
  .summary { color: var(--c-text-2); font-size: var(--t-20); max-width: 60ch; }
  .prose { max-width: 70ch; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
    gap: var(--s-4);
  }
  .empty { color: var(--c-text-2); }
  .provenance { color: var(--c-text-2); margin-top: var(--s-6); }
</style>
```

- [ ] **Step 6: Create `src/pages/applications/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { productsClaiming } from '../../lib/crossLinks';

const applications = (await getCollection('applications'))
  .sort((a, b) => a.data.name.localeCompare(b.data.name));
const products = await getCollection('products');

const rows = applications.map((application) => ({
  application,
  count: productsClaiming(products, application.id).length,
}));
---
<BaseLayout
  title="Applications — LiTex Textile & Technology"
  description="End uses LiTex publishes for its conductive metal yarn, heating textile, shielding tube and woven tape."
>
  <h1>Applications</h1>
  <p class="intro">
    Every application listed here is one LiTex has itself published. Each names its evidence.
  </p>

  <ul class="list">
    {rows.map(({ application, count }) => (
      <li>
        <a href={`/applications/${application.id}/`}>{application.data.name}</a>
        <span class="count value">{count} product{count === 1 ? '' : 's'}</span>
        <p class="summary">{application.data.summary}</p>
      </li>
    ))}
  </ul>
</BaseLayout>

<style>
  .intro { color: var(--c-text-2); max-width: 60ch; }
  .list { list-style: none; padding: 0; margin-top: var(--s-8); }
  .list li {
    border-top: 1px solid var(--c-line);
    padding: var(--s-4) 0;
  }
  .list a { font-size: var(--t-20); }
  .count {
    font-size: var(--t-12);
    color: var(--c-text-2);
    margin-left: var(--s-3);
  }
  .summary { color: var(--c-text-2); font-size: var(--t-14); margin: var(--s-2) 0 0; }
</style>
```

- [ ] **Step 7: Add the build assertions**

Append to `tests/build.test.ts`:

```ts
describe('built applications', () => {
  it('generates an index listing all six applications', () => {
    const doc = docFor('applications/index.html');
    const links = [...doc.querySelectorAll('a[href^="/applications/"]')]
      .map((a) => a.getAttribute('href'));
    expect(links).toHaveLength(6);
  });

  it('closes the dual-entry loop — the application lists the products claiming it', () => {
    const doc = docFor('applications/heated-apparel-wearables/index.html');
    const links = [...doc.querySelectorAll('a[href^="/products/"]')]
      .map((a) => a.getAttribute('href'));
    expect(links).toContain('/products/conductive-metal-yarn/');
    expect(links).toContain('/products/electrical-heating-textile/');
  });

  it('names the evidence for every application, so no end-use is unsupported', () => {
    for (const slug of [
      'heated-apparel-wearables', 'smart-textiles-rfid', 'automotive-interiors',
      'healthcare-therapeutic-heating', 'cable-protection-emi-shielding', 'industrial-woven-metal',
    ]) {
      const doc = docFor(`applications/${slug}/index.html`);
      expect(
        doc.querySelector('[data-evidence]')?.textContent?.trim(),
        `${slug} publishes no evidence`,
      ).toBeTruthy();
    }
  });

  it('every product-page application link resolves to a real page', () => {
    const product = docFor('products/conductive-metal-yarn/index.html');
    const targets = [...product.querySelectorAll('a[href^="/applications/"]')]
      .map((a) => a.getAttribute('href') ?? '');
    for (const href of targets) {
      // Throws ENOENT if the route was never generated.
      expect(() => docFor(`${href.replace(/^\//, '')}index.html`)).not.toThrow();
    }
  });
});
```

- [ ] **Step 8: Build and run the full suite**

Run: `npm run build && npm test`
Expected: build exits 0, generating six application routes plus the index. All tests pass.

- [ ] **Step 9: Run the design detector**

Run: `node .claude/skills/impeccable/scripts/detect.mjs --json src/pages src/components`
Expected: `[]`.

- [ ] **Step 10: Commit**

```bash
git add src/lib/crossLinks.ts src/pages/applications tests/crossLinks.test.ts tests/build.test.ts
git commit -m "feat: add application pages closing the dual-entry cross-link"
```

---

## Definition of done

Verify each by running it, not by reading the code.

- [ ] `npm run build` exits 0 and emits seven `dist/products/<slug>/index.html` routes
- [ ] `npm test` passes every suite: contrast, tokens, fonts, schemas, references, csv, jsonld, build
- [ ] Every product with a `specTable` renders a `data-source-note`
- [ ] No product renders a `data-needs-verification` caveat — both formerly-ambiguous tables are now verified against their source PDFs
- [ ] The Copy-as-CSV button ships `hidden` and carries a `data-csv` whose header row includes units
- [ ] Every product detail page emits `Product` JSON-LD with no `price` anywhere in it
- [ ] The legacy product states `LEGACY` and `SAMPLING ONLY` in text, not colour alone
- [ ] A broken `reference()` fails the build (re-verified in Task 7 Step 8)
- [ ] `UL` still fails the schema — `npx vitest run tests/schemas.test.ts`

## Deliberately out of scope

Deferred to later plans: technology pages, `/company/` and its three children, `/downloads/`, news index and the 7 posts, the contact and sample-request flow with its Pages Function + Turnstile + KV, the print/light stylesheet for spec tables, the credibility bar, the cross-product comparison table on `/products/`, `_redirects` and the 23-URL redirect map, sitemap, Cloudflare Web Analytics, the Sveltia CMS at `/admin`, and the Lighthouse/axe CI budgets.

**Spec §5 names three affordances on the spec table; this plan builds one.** Copy-as-CSV ships here because it is self-contained. The other two are deliberately held back because each depends on work that does not exist yet:

- **Datasheet PDF** — needs `/downloads/` and the catalog files served as real assets. The `catalogPdf` field currently renders as a filename, not a link, precisely so it does not become a broken download.
- **Request this grade** — needs the sample-request flow and its Pages Function. A button that goes nowhere is worse than no button on a page whose whole purpose is credibility.

Two verification gates remain **not implemented** and must not be assumed present:

- **Broken internal link detection.** Task 8 asserts that the *product → application* links resolve, but that is a hand-written check against one page, not a link checker. A general checker over `dist/` is Plan 5.
- **Lighthouse and axe budgets.** Plan 5.

## Open questions for LiTex — do not guess these

1. **Who owns the stainless steel yarn spec table?** `archive/extracted-from-images.md` §1 holds a complete six-row table (weight, tensile strength, elongation, resistance) transcribed from `images/steel-yarn-specs.jpg`, but nothing in the archive says which product it documents. It is deliberately unattached rather than guessed onto a page.
2. **Braided self-curling tube — the five specifications.** Named on the page, published only in a brochure with no text layer.
3. **Copper-nickel (CuNi) CMY** was "coming soon" as of 2018 (spec §6). Status unconfirmed; no page claims it.
4. **Patent statuses.** `extracted-from-images.md` §2 lists applications pending since 2010–2011 that have almost certainly since been granted or abandoned. Needed before `/company/patents-and-awards/` in a later plan.
5. **What is the EMI tube's `(c)` column?** The catalog's standard-item table has a fifth column headed `(c)`, value `3` for all three sizes. The facing diagram labels a callout `C` pointing at the braid mesh, so it is plausibly a strand or thickness parameter — but the catalog never says, so the column is omitted rather than published with a guessed meaning.
6. **EMI diameter units.** Headers read `(ø)` rather than `mm`. The product codes (KPTS-3/6/15) match the smallest-diameter figures, which makes mm near-certain, but it is transcribed as printed rather than assumed.

7. **Real product photography exists after all.** Spec §5 states "LiTex has **no usable photography** — the current homepage runs a Pexels stock photo." Rendering `2018-rfid-textile-tape.pdf` shows that is **not true of the catalogs**: page 1 carries genuine photographs of the tape, including a ruler shot establishing scale and a close-up of a mounted RFID chip. Tier 3 of the imagery policy (real photography only for product shots) is therefore satisfiable for at least this product without asking LiTex for anything. Confirm usage rights, extract the embedded images, and revisit the "no photography" premise before any plan commits to diagram-only product pages.

**Resolved 2026-08-11 — no longer open:**

- ~~RFID tape column pairing~~ and ~~EMI tube column pairing~~ are both **verified against the rendered PDF pages**. Plan 1's RFID reconstruction was correct in every pairing; the verification added an `Orientation: S` row that the text extraction had dropped, corrected the header to `Max resistance (20 °C)`, and split covering material and colour into separate rows as the source has them. `src/content/products/rfid-textile-tape.md` was corrected on `main` before this plan runs.

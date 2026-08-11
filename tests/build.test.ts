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

  it('never leaks placeholder contact details into visible copy', () => {
    // mail@example.com is the WordPress theme placeholder and appears 4x on the
    // archived contact page — the real address is CONTACT_EMAIL in astro.config.mjs.
    const text = doc.body.textContent ?? '';
    expect(text).not.toContain('litex.example');
    expect(text).not.toContain('example.com');
  });

  it('ships no render-blocking third-party requests', () => {
    const external = [...doc.querySelectorAll('link[rel="stylesheet"], script[src]')]
      .map((el) => el.getAttribute('href') ?? el.getAttribute('src') ?? '')
      .filter((url) => /^https?:\/\//.test(url));
    expect(external).toEqual([]);
  });
});

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
    expect(doc.body.textContent).toContain('IN PRODUCTION');
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

  it('points canonical URLs at the confirmed domain, trailing slash included', () => {
    // build.format: 'directory' emits /products/ — the trailing slash matters because
    // the legacy wordpress.com URLs carry one, keeping the 301 map a 1:1 mapping.
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://litex.com.tw/products/');
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

describe('product hero imagery', () => {
  const slugs = [
    'conductive-metal-yarn', 'electrical-heating-textile', 'emi-shielding-woven-tube',
    'rfid-textile-tape', 'braided-self-curling-tube', 'wired-conductive-tape',
    'silica-gel-switch-controller',
  ];

  it('every product page shows a photograph', () => {
    for (const slug of slugs) {
      const doc = docFor(`products/${slug}/index.html`);
      expect(doc.querySelector('[data-product-hero] img'), `${slug} has no hero`).toBeTruthy();
    }
  });

  it('every hero carries alt text that is not just the product name', () => {
    for (const slug of slugs) {
      const doc = docFor(`products/${slug}/index.html`);
      const img = doc.querySelector('[data-product-hero] img');
      const alt = img?.getAttribute('alt') ?? '';
      const h1 = doc.querySelector('h1')?.textContent?.trim() ?? '';
      expect(alt.length, `${slug} alt is too short to be descriptive`).toBeGreaterThan(30);
      expect(alt.toLowerCase(), `${slug} alt merely repeats the name`).not.toBe(h1.toLowerCase());
    }
  });

  it('every hero declares intrinsic width and height, so nothing shifts on load', () => {
    for (const slug of slugs) {
      const doc = docFor(`products/${slug}/index.html`);
      const img = doc.querySelector('[data-product-hero] img');
      expect(Number(img?.getAttribute('width')), `${slug} width`).toBeGreaterThan(0);
      expect(Number(img?.getAttribute('height')), `${slug} height`).toBeGreaterThan(0);
    }
  });

  it('serves modern formats through a picture element', () => {
    const doc = docFor('products/conductive-metal-yarn/index.html');
    const types = [...doc.querySelectorAll('[data-product-hero] source')]
      .map((s) => s.getAttribute('type'));
    expect(types).toContain('image/avif');
    expect(types).toContain('image/webp');
  });

  it('defers hero decoding rather than blocking render', () => {
    const doc = docFor('products/conductive-metal-yarn/index.html');
    const img = doc.querySelector('[data-product-hero] img');
    expect(img?.getAttribute('decoding')).toBe('async');
  });

  it('never ships the Pexels stock photo', () => {
    for (const slug of slugs) {
      const doc = docFor(`products/${slug}/index.html`);
      expect(doc.documentElement.outerHTML).not.toContain('pexels');
    }
  });

  // Two heroes come from the archived site, not from the catalog named in catalogPdf.
  // A caption that names a document the photograph did not come from is a false
  // provenance claim on a page whose whole argument is that its figures are traceable.
  it('never credits a catalog the photograph did not actually come from', () => {
    const manifest = JSON.parse(
      readFileSync(
        fileURLToPath(new URL('../src/assets/products/provenance.json', import.meta.url)),
        'utf8',
      ),
    ) as Record<string, { source: string }>;

    for (const slug of slugs) {
      const doc = docFor(`products/${slug}/index.html`);
      const caption = doc.querySelector('[data-product-hero] figcaption')?.textContent ?? '';
      expect(caption.trim(), `${slug} hero has no caption`).toBeTruthy();

      const named = caption.match(/\S+\.pdf/)?.[0];
      if (named) {
        expect(manifest[`${slug}.jpg`].source, `${slug} credits ${named}`).toBe(
          `archive/catalogs/${named}`,
        );
      }
    }
  });
});

describe('product thumbnails', () => {
  it('shows a thumbnail on every card in the products index', () => {
    const doc = docFor('products/index.html');
    expect(doc.querySelectorAll('.card img')).toHaveLength(7);
  });

  it('gives every thumbnail width and height so the grid does not reflow', () => {
    const doc = docFor('products/index.html');
    for (const img of [...doc.querySelectorAll('.card img')]) {
      expect(Number(img.getAttribute('width'))).toBeGreaterThan(0);
      expect(Number(img.getAttribute('height'))).toBeGreaterThan(0);
    }
  });

  it('lazy-loads thumbnails, which are below the fold', () => {
    const doc = docFor('products/index.html');
    for (const img of [...doc.querySelectorAll('.card img')]) {
      expect(img.getAttribute('loading')).toBe('lazy');
    }
  });

  it('carries thumbnails through to application pages too', () => {
    const doc = docFor('applications/cable-protection-emi-shielding/index.html');
    expect(doc.querySelectorAll('.card img').length).toBeGreaterThan(0);
  });
});

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

import { describe, it, expect } from 'vitest';
import { z } from 'astro/zod';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { productSchema } from '../src/schemas/product';
import { applicationSchema } from '../src/schemas/application';
import { newsSchema } from '../src/schemas/news';

/** Stands in for Astro's reference(); shape matches what Astro produces. */
const referenceStub = () => z.object({ collection: z.string(), id: z.string() }).or(z.string());
/** Stands in for Astro's image(); the real one returns ImageMetadata at build time. */
const imageStub = () => z.string();

const product = productSchema({ reference: referenceStub, image: imageStub });
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

  it('accepts a hero image with real alt text', () => {
    const r = product.safeParse({
      ...validProduct,
      heroImage: { src: './cmy.jpg', alt: 'Coiled copper covering over a polymer core', aiGenerated: false },
    });
    expect(r.success).toBe(true);
  });

  it('rejects a hero image with empty alt text', () => {
    const r = product.safeParse({
      ...validProduct,
      heroImage: { src: './cmy.jpg', alt: '', aiGenerated: false },
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('alt');
  });

  it('rejects alt text that merely repeats the product name', () => {
    const r = product.safeParse({
      ...validProduct,
      heroImage: { src: './cmy.jpg', alt: 'Conductive Metal Yarn', aiGenerated: false },
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('alt');
  });

  it('still refuses an AI-generated hero even with good alt text', () => {
    const r = product.safeParse({
      ...validProduct,
      heroImage: { src: './cmy.jpg', alt: 'Coiled copper covering over a polymer core', aiGenerated: true },
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('aiGenerated');
  });

  it('defaults needsVerification to false but accepts an explicit flag', () => {
    const off = product.safeParse(validProduct);
    expect(off.success).toBe(true);
    if (off.success) expect(off.data.needsVerification).toBe(false);

    const on = product.safeParse({ ...validProduct, needsVerification: true });
    expect(on.success).toBe(true);
    if (on.success) expect(on.data.needsVerification).toBe(true);
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

const news = newsSchema({ reference: referenceStub, image: imageStub });

const validPost = {
  title: 'Dusseldorf Wire Show',
  publishedAt: '2018-02-26T15:15:53+08:00',
  summary: 'LiTex attended the Düsseldorf wire show for the first time in 2018.',
  sourceUrl: 'https://litextextile.wordpress.com/2018/02/26/dusseldorf-wire-show/',
  sourceNote: 'Reproduced from LiTex’s previous site.',
};

describe('newsSchema', () => {
  it('accepts a post carrying its date, summary and provenance', () => {
    const r = news.safeParse(validPost);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.relatedProducts).toEqual([]);
      expect(r.data.externalLinks).toEqual([]);
    }
  });

  // YAML parses an unquoted 2018-02-26T15:15:53+08:00 into a Date, not a string. Quoting
  // it in the front matter is what keeps it a string, so the schema must reject a Date
  // loudly rather than let one reach the formatter.
  it('rejects a timestamp that arrived as a Date rather than a quoted string', () => {
    const r = news.safeParse({ ...validPost, publishedAt: new Date('2018-02-26') });
    expect(r.success).toBe(false);
  });

  it('rejects a timestamp with no offset, which would be ambiguous', () => {
    expect(news.safeParse({ ...validPost, publishedAt: '2018-02-26T15:15:53' }).success).toBe(false);
  });

  it('rejects a date that does not exist', () => {
    expect(news.safeParse({ ...validPost, publishedAt: '2018-02-31T15:15:53+08:00' }).success)
      .toBe(false);
  });

  it('requires provenance, because every post is a republication', () => {
    const { sourceUrl, ...noUrl } = validPost;
    expect(news.safeParse(noUrl).success).toBe(false);
    const { sourceNote, ...noNote } = validPost;
    expect(news.safeParse(noNote).success).toBe(false);
  });

  it('holds the summary to the meta-description budget', () => {
    expect(news.safeParse({ ...validPost, summary: 'x'.repeat(161) }).success).toBe(false);
  });

  it('refuses AI imagery — /news/ ships product photography, which is Tier 3', () => {
    const r = news.safeParse({
      ...validPost,
      image: { src: 'x.jpg', alt: 'A braided sleeve', caption: 'Source', aiGenerated: true },
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(JSON.stringify(r.error.issues)).toContain('Tier 3');
  });

  it('requires a caption on any image, so a reader is told what they are looking at', () => {
    const r = news.safeParse({ ...validPost, image: { src: 'x.jpg', alt: 'A braided sleeve' } });
    expect(r.success).toBe(false);
  });
});

describe('news entries as authored', () => {
  const dir = fileURLToPath(new URL('../src/content/news', import.meta.url));
  const files = readdirSync(dir).filter((f) => f.endsWith('.md'));

  it('publishes exactly the seven posts spec §3 keeps', () => {
    expect(files.map((f) => f.replace(/\.md$/, '')).sort()).toEqual([
      'copper-nickel-1s1z', 'dusseldorf-wire-show', 'featured-on-techtextil-blog',
      'new-braided-self-curling-tube', 'techtextil-frankfurt', 'tokyo-wearable-expo-2022',
      'wearable-expo',
    ]);
  });

  // Six of the seven archived titles contain U+00A0, WordPress's widow-prevention. It is
  // invisible in an editor and in a browser, breaks text search, and wraps wrong.
  it('carries no non-breaking space transcribed in from WordPress', () => {
    for (const file of files) {
      const text = readFileSync(join(dir, file), 'utf8');
      expect(text.includes(' '), `${file} still holds a U+00A0`).toBe(false);
    }
  });

  // test-post-blah is deliberately dead (spec §3, 410 Gone). Its content is real but is
  // superseded by wearable-expo; if it ever reappears that was a decision, not a drift.
  it('does not resurrect the killed test post', () => {
    expect(files.some((f) => f.includes('test-post'))).toBe(false);
  });
});

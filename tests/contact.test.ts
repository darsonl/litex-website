import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { allHtmlFiles, docFor } from './helpers/dist';

describe('/contact/', () => {
  const doc = docFor('contact/index.html');

  it('has one h1 and its canonical', () => {
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://litex.com.tw/contact/');
  });

  it('posts to the endpoint with a method a browser can submit without JavaScript', () => {
    const form = doc.querySelector('form[data-enquiry-form]');
    expect(form?.getAttribute('action')).toBe('/api/submit');
    expect(form?.getAttribute('method')?.toLowerCase()).toBe('post');
  });

  it('declares which form it is, so one endpoint can serve both', () => {
    expect(doc.querySelector('input[name="formType"]')?.getAttribute('value')).toBe('contact');
  });

  it('labels every input, so the form is usable by a screen reader', () => {
    const form = doc.querySelector('form[data-enquiry-form]')!;
    for (const control of [...form.querySelectorAll('input, textarea')]) {
      const type = control.getAttribute('type');
      if (type === 'hidden') continue;
      const id = control.getAttribute('id');
      expect(id, 'a control has no id to label').toBeTruthy();
      expect(form.querySelector(`label[for="${id}"]`), `no label for ${id}`).toBeTruthy();
    }
  });

  it('still gives the direct email address, because a form is not the only way in', () => {
    const hrefs = [...doc.querySelectorAll('main a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('mailto:sales@litex.com.tw');
  });

  it('carries the real contact details through the shared block', () => {
    expect(doc.querySelector('[data-contact-block]')).toBeTruthy();
  });

  it('offers the sample request as a distinct path', () => {
    const hrefs = [...doc.querySelectorAll('main a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/request-a-sample/');
  });
});

describe('/request-a-sample/', () => {
  const doc = docFor('request-a-sample/index.html');

  it('has one h1 and its canonical', () => {
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://litex.com.tw/request-a-sample/');
  });

  it('declares itself as the sample form to the shared endpoint', () => {
    expect(doc.querySelector('input[name="formType"]')?.getAttribute('value')).toBe('sample');
  });

  it('asks for what a sample request needs', () => {
    const names = [...doc.querySelectorAll('form [name]')].map((c) => c.getAttribute('name'));
    for (const expected of ['product', 'grade', 'quantity', 'application']) {
      expect(names, `sample form has no ${expected} field`).toContain(expected);
    }
  });

  it('is honest that a sample is not automatic', () => {
    expect(doc.body.textContent?.toLowerCase()).toContain('minimum');
  });
});

describe('both forms', () => {
  // One endpoint, two forms — the discriminator is the only thing that may differ.
  it('post to the same endpoint', () => {
    for (const route of ['contact/index.html', 'request-a-sample/index.html']) {
      expect(docFor(route).querySelector('form')?.getAttribute('action')).toBe('/api/submit');
    }
  });

  it('carry a honeypot that is hidden from assistive technology', () => {
    for (const route of ['contact/index.html', 'request-a-sample/index.html']) {
      const hp = docFor(route).querySelector('input[name="website"]');
      expect(hp, `${route} has no honeypot`).toBeTruthy();
      expect(hp!.closest('[aria-hidden="true"]'), `${route} honeypot is not hidden`).toBeTruthy();
    }
  });
});

describe('the Turnstile sitekey', () => {
  // Shipping Cloudflare's always-passes TEST sitekey is a soft failure with no other
  // symptom: the widget renders, submissions succeed, and spam filtering is simply OFF.
  // Every other test in this suite passes either way, which is precisely why this one
  // exists. It was written the day the real widget was created, because until then the
  // repo genuinely had no way to tell the two apart.
  const TEST_SITEKEY = '1x00000000000000000000AA';
  const PRODUCTION_SITEKEY = '0x4AAAAAAEOqzFlvFS397MkG';

  it('is never the always-passes test key, on any built page', () => {
    const offenders = allHtmlFiles().filter((f) => readFileSync(f, 'utf8').includes(TEST_SITEKEY));
    expect(offenders, 'the Turnstile TEST sitekey reached the build — spam filtering is off')
      .toEqual([]);
  });

  it('is present on both form pages', () => {
    for (const route of ['contact/index.html', 'request-a-sample/index.html']) {
      const widget = docFor(route).querySelector('.cf-turnstile');
      expect(widget, `${route} has no Turnstile widget`).toBeTruthy();
      expect(widget!.getAttribute('data-sitekey'), `${route} sitekey`).toBe(PRODUCTION_SITEKEY);
    }
  });
});

describe('the form works without JavaScript', () => {
  // The script is an upgrade. If the markup ever stops being a submittable form, a
  // visitor with JS blocked loses the most valuable interaction on the site silently.
  it('keeps a native action and method on both forms', () => {
    for (const route of ['contact/index.html', 'request-a-sample/index.html']) {
      const form = docFor(route).querySelector('form[data-enquiry-form]');
      expect(form?.getAttribute('action'), `${route} lost its action`).toBe('/api/submit');
      expect(form?.getAttribute('method')?.toLowerCase(), `${route} lost its method`).toBe('post');
    }
  });

  it('marks required fields in the markup, not only in script', () => {
    const form = docFor('contact/index.html').querySelector('form[data-enquiry-form]')!;
    const required = [...form.querySelectorAll('[required]')].map((c) => c.getAttribute('name'));
    expect(required).toEqual(expect.arrayContaining(['name', 'company', 'email', 'message']));
  });
});

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

/**
 * productName is an OPTIONAL prop, so the build cannot be the thing that stops a new
 * product page shipping without a route to a sample request. These two tests are what
 * replaces that forcing function, and they are strictly better than it: they assert the
 * built output rather than a call signature, so they also catch a page that passes the
 * prop and fails to render it.
 *
 * Optional rather than required because SpecTable has four call sites and only one is a
 * product. The other three render compliance claims, patents and a heating-technology
 * comparison — none of which is a grade anyone can request a sample of, and none of
 * which has a product name to pass. A required prop would have forced an invented value
 * onto all three and put "Request this grade" under the patents table.
 */
describe('every product spec table routes to a sample request — and only those', () => {
  const norm = (f: string) => f.replace(/\\/g, '/');
  const hasSpecTable = (f: string) => readFileSync(f, 'utf8').includes('data-copy-csv');
  const isProductPage = (f: string) => /\/products\/[^/]+\/index\.html$/.test(norm(f));

  it('offers the CTA on every product page carrying a spec table', () => {
    const pages = allHtmlFiles().filter((f) => isProductPage(f) && hasSpecTable(f));
    expect(
      pages.length,
      'no product page has a spec table — this test is vacuous',
    ).toBeGreaterThan(0);

    const missing = pages.filter((f) => !readFileSync(f, 'utf8').includes('data-request-grade'));
    expect(
      missing.map(norm),
      'a product page ships a spec table with no route to a sample request. Pass\n' +
        'productName to <SpecTable> on that page:',
    ).toEqual([]);
  });

  it('offers it on no other spec table, because those are not products', () => {
    const others = allHtmlFiles().filter((f) => !isProductPage(f) && hasSpecTable(f));
    expect(others.length, 'the non-product spec tables have vanished').toBeGreaterThan(0);

    const wrong = others.filter((f) => readFileSync(f, 'utf8').includes('data-request-grade'));
    expect(
      wrong.map(norm),
      'a non-product spec table is inviting a sample request. Compliance claims, patents\n' +
        'and the heating comparison are not grades anyone can ask for a sample of:',
    ).toEqual([]);
  });
});

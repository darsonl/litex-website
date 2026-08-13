import { describe, it, expect } from 'vitest';
import { docFor } from './helpers/dist';

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

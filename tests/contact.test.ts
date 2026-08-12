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

import { describe, it, expect } from 'vitest';
import {
  FORM_TYPES, fieldsFor, validateEnquiry, HONEYPOT_FIELD,
} from '../src/lib/enquiry';

const validContact = {
  formType: 'contact',
  name: 'A Buyer',
  company: 'Buyer GmbH',
  email: 'buyer@example.org',
  message: 'Please send lead times for 2S2Z conductive metal yarn.',
};

const validSample = {
  formType: 'sample',
  name: 'A Buyer',
  company: 'Buyer GmbH',
  email: 'buyer@example.org',
  product: 'conductive-metal-yarn',
  grade: '2S2Z',
  quantity: '50 m',
  application: 'Heated motorcycle grips.',
};

describe('form definitions', () => {
  it('defines exactly the two form types the site offers', () => {
    expect([...FORM_TYPES]).toEqual(['contact', 'sample']);
  });

  it('gives every field a name, label and type, and marks which are required', () => {
    for (const type of FORM_TYPES) {
      const fields = fieldsFor(type);
      expect(fields.length).toBeGreaterThan(0);
      for (const f of fields) {
        expect(f.name, 'field has no name').toBeTruthy();
        expect(f.label, `${f.name} has no label`).toBeTruthy();
        expect(['text', 'email', 'textarea', 'select'], `${f.name} type`).toContain(f.type);
        expect(typeof f.required).toBe('boolean');
      }
    }
  });

  // The honeypot must never be one of the real fields, or a legitimate submission
  // that happens to fill it would be silently discarded as spam.
  it('keeps the honeypot out of the visible field list', () => {
    for (const type of FORM_TYPES) {
      expect(fieldsFor(type).map((f) => f.name)).not.toContain(HONEYPOT_FIELD);
    }
  });

  it('asks a sample request for what a sample request actually needs', () => {
    const names = fieldsFor('sample').map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining(['product', 'grade', 'quantity', 'application']));
  });
});

describe('validateEnquiry', () => {
  it('accepts a complete contact enquiry', () => {
    const r = validateEnquiry('contact', validContact);
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual({});
    expect(r.values.email).toBe('buyer@example.org');
  });

  it('accepts a complete sample request', () => {
    expect(validateEnquiry('sample', validSample).ok).toBe(true);
  });

  it('names every missing required field, not just the first', () => {
    const r = validateEnquiry('contact', { formType: 'contact' });
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors).sort()).toEqual(['company', 'email', 'message', 'name']);
  });

  it('rejects an address that is not an email', () => {
    const r = validateEnquiry('contact', { ...validContact, email: 'buyer at example' });
    expect(r.ok).toBe(false);
    expect(r.errors.email).toBeTruthy();
  });

  it('trims surrounding whitespace rather than treating it as content', () => {
    const r = validateEnquiry('contact', { ...validContact, name: '   A Buyer   ' });
    expect(r.values.name).toBe('A Buyer');
    const blank = validateEnquiry('contact', { ...validContact, name: '     ' });
    expect(blank.ok).toBe(false);
  });

  it('rejects a field longer than its limit, so KV cannot be used as free storage', () => {
    const r = validateEnquiry('contact', { ...validContact, message: 'x'.repeat(5001) });
    expect(r.ok).toBe(false);
    expect(r.errors.message).toBeTruthy();
  });

  it('rejects an unknown form type rather than guessing', () => {
    expect(validateEnquiry('newsletter' as never, validContact).ok).toBe(false);
  });

  // A sample request missing its product is useless to LiTex — it becomes an email
  // asking which product, which is the round trip the form exists to remove.
  it('requires a sample request to name a product', () => {
    const { product, ...withoutProduct } = validSample;
    const r = validateEnquiry('sample', withoutProduct);
    expect(r.ok).toBe(false);
    expect(r.errors.product).toBeTruthy();
  });

  it('never returns values for fields the form did not define', () => {
    const r = validateEnquiry('contact', { ...validContact, isAdmin: 'true' });
    expect(r.values).not.toHaveProperty('isAdmin');
  });
});

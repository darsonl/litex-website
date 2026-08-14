/**
 * The one definition of what the two enquiry forms ask for.
 *
 * The Astro pages render their inputs from fieldsFor() and the Pages Function validates
 * against the same list, so a field cannot exist on the page and be unknown to the
 * server, or vice versa. Spec §4's whole argument for the form is that a buyer's
 * enquiry arrives complete; a drifting field list is how that quietly stops being true.
 *
 * Zero imports, deliberately — this module is loaded by Vitest, by the Astro build and
 * by the Cloudflare Workers runtime. Adding an Astro import breaks two of the three.
 */

export const FORM_TYPES = ['contact', 'sample'] as const;
export type FormType = (typeof FORM_TYPES)[number];

export type Field = {
  name: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'select';
  required: boolean;
  /** Rendered under the input; explains what LiTex needs, not what the box is. */
  hint?: string;
  options?: readonly string[];
  autocomplete?: string;
};

/** Per-field ceilings. KV is not free storage and an RFQ is not an essay. */
export const MAX_LENGTHS: Readonly<Record<string, number>> = {
  name: 120, company: 160, email: 254, country: 80,
  message: 5000, product: 80, grade: 40, quantity: 80, application: 2000,
};

/**
 * Not a real field. Bots fill every input they find; humans never see this one.
 * It is checked by the function and must never appear in fieldsFor().
 */
export const HONEYPOT_FIELD = 'website';

/**
 * The only fields a query string may fill in, so the spec table's "Request this grade"
 * CTA can carry the product forward instead of handing the engineer a blank form.
 *
 * An allowlist rather than a denylist, and deliberately just these two. Both describe
 * what is being asked about; neither says anything about who is asking. Identity fields
 * are excluded because a prefilled URL is a link anyone can hand out, and a link that
 * fills in `name` or `email` puts words in the sender's mouth. The honeypot is excluded
 * for the obvious reason: a URL that filled it would make every submission look like a
 * bot. tests/enquiry.test.ts asserts all three properties.
 */
export const PREFILLABLE: readonly string[] = ['product', 'grade'];

const SHARED: readonly Field[] = [
  { name: 'name', label: 'Your name', type: 'text', required: true, autocomplete: 'name' },
  { name: 'company', label: 'Company', type: 'text', required: true, autocomplete: 'organization' },
  { name: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email' },
  { name: 'country', label: 'Country', type: 'text', required: false, autocomplete: 'country-name' },
];

const BY_TYPE: Readonly<Record<FormType, readonly Field[]>> = {
  contact: [
    ...SHARED,
    {
      name: 'message', label: 'How can we help?', type: 'textarea', required: true,
      hint: 'Grades, quantities and target application if you know them.',
    },
  ],
  sample: [
    ...SHARED,
    {
      name: 'product', label: 'Product', type: 'text', required: true,
      hint: 'Which product you would like a sample of.',
    },
    {
      name: 'grade', label: 'Grade or specification', type: 'text', required: false,
      hint: 'For conductive metal yarn, the covering count — 1S1Z, 2S2Z, and so on.',
    },
    { name: 'quantity', label: 'Quantity needed', type: 'text', required: false },
    {
      name: 'application', label: 'Intended application', type: 'textarea', required: true,
      hint: 'What you plan to build. This is what lets LiTex send a useful grade rather than a default one.',
    },
  ],
};

export function fieldsFor(formType: FormType): readonly Field[] {
  return BY_TYPE[formType] ?? [];
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ValidationResult = {
  ok: boolean;
  values: Record<string, string>;
  errors: Record<string, string>;
};

/**
 * Validates raw form input. Returns every error at once: a form that reveals one
 * problem per submission is a form people abandon.
 */
export function validateEnquiry(
  formType: FormType,
  raw: Record<string, unknown>,
): ValidationResult {
  const values: Record<string, string> = {};
  const errors: Record<string, string> = {};

  if (!FORM_TYPES.includes(formType)) {
    return { ok: false, values, errors: { formType: 'Unknown form type.' } };
  }

  for (const field of fieldsFor(formType)) {
    const value = typeof raw[field.name] === 'string' ? (raw[field.name] as string).trim() : '';
    if (value) values[field.name] = value;

    if (field.required && !value) {
      errors[field.name] = `${field.label} is required.`;
      continue;
    }
    if (!value) continue;

    const max = MAX_LENGTHS[field.name];
    if (max && value.length > max) {
      errors[field.name] = `${field.label} must be ${max} characters or fewer.`;
      continue;
    }
    if (field.type === 'email' && !EMAIL.test(value)) {
      errors[field.name] = 'Enter an email address we can reply to.';
    }
  }

  return { ok: Object.keys(errors).length === 0, values, errors };
}

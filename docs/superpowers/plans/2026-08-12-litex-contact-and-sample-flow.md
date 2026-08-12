# LiTex Contact & Sample-Request Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give a buyer two working ways to reach LiTex — a general enquiry and a dedicated sample request — behind a Cloudflare Pages Function that never loses a submission and never claims success it cannot back.

**Architecture:** One shared, dependency-free module (`src/lib/enquiry.ts`) defines the fields and validates them; the Astro pages render forms from it and the Pages Function validates against the same module, so the two cannot drift. The function stores every valid submission to KV **before** attempting delivery through Resend, and reports three distinct outcomes — delivered, stored-but-undelivered, and rejected — never collapsing the middle one into either end. The form is plain HTML that works with JavaScript disabled; a small script upgrades it to inline errors and no-reload submission.

**Tech Stack:** Astro 7.2.0 (static) · Cloudflare Pages Functions · Cloudflare Turnstile · Workers KV · Resend HTTP API · Vitest 4.1.10 · linkedom 0.18.13.

## Global Constraints

- **Astro is 7.2.0 and the build stays `static`.** Pages Functions live in a `/functions` directory at the project root, outside `src/`, and are picked up by Cloudflare at deploy time. Adding an Astro SSR adapter is out of scope and would change every existing page's output.
- **`src/lib/enquiry.ts` must have zero imports**, exactly like `src/lib/dates.ts`. That is what lets Vitest, the Astro build and the Workers runtime all load it. Do not add an Astro import to it.
- **Resolve references through `mustResolve()`** (`src/lib/references.ts`) — a broken `reference()` does not fail the Astro 7.2.0 build.
- **`compressHTML` is on by default** and strips the newline between text and a following element. Use an explicit `{' '}` where a space must survive. Check with `grep -oE '[a-zA-Z,;:.]<(span|a|strong|em)\b'` over `dist/**/*.html`.
- **No `example.com` string may reach any built page.** Never restore `PATENTED` or `1M545145`.
- **Add a route to `NAV` only after the page exists** — `tests/chrome.test.ts` fails otherwise.
- **Use `src/components/ContactBlock.astro`** on `/contact/`. Do not write a fourth inline `<address>`.
- Monospace (`.value`) is reserved for values carrying units.
- **Never log, store or transmit the submitter's IP address.** Turnstile's `remoteip` parameter is optional and is deliberately not sent. See Decision 5.

---

## Decisions taken before this plan was written

Settled with the human on 2026-08-12. Do not re-litigate them during implementation.

| # | Decision | Why |
|---|---|---|
| 1 | **Delivery goes through the Resend HTTP API.** | MailChannels' free Cloudflare integration ended 2024-06-30 and Resend is Cloudflare's own documented replacement. The alternative, Cloudflare Email Routing's `send_email` binding, is **Workers-only and unavailable to Pages Functions** — it would need a second deployable plus a service binding, and Email Routing additionally requires LiTex to verify the destination address by clicking a link. Contact with LiTex is informal and slow, so a design that blocks on their click is a design that does not ship. |
| 2 | **The form works with JavaScript disabled.** | Plain HTML POST is the baseline; the script is an upgrade. An RFQ is the single most valuable interaction on this site, and making it depend on a script loading is a worse trade than the extra response paths in the function. |
| 3 | **Both pages, one endpoint.** | `/contact/` and `/request-a-sample/` post to the same function with a `formType` discriminator. One validation module, one KV record shape, one delivery path. Two endpoints would duplicate the Turnstile check, the KV write and the delivery logic — the exact duplication the last two plans spent fix rounds removing. |
| 4 | **Three outcomes, never two.** | Spec §4: a silently dropped RFQ is a lost customer who believes they were ignored. The function distinguishes **delivered**, **stored but not delivered** (honest message naming the direct address), and **rejected** (validation or spam). Stored-but-undelivered must never render as either a success or a total failure. |
| 5 | **No IP address is stored or transmitted.** | Turnstile's `remoteip` is optional. Not collecting it removes a category of personal data from the KV record, shortens what `/legal/privacy/` has to disclose, and costs only a marginal amount of spam signal. For an EU-facing site this is the better default. |

---

## ⚠ The two forward guards in `tests/legal.test.ts` — read this before Task 1

Plan 5 wrote two tests designed to fail the moment their premise stopped being true. **This plan makes both of them false, not just the one HANDOFF predicted.**

1. **`describes no form while no form exists`** — fails as soon as any page ships a `<form>`. Expected; HANDOFF flagged it. Delete it in the same commit that updates `/legal/privacy/`.
2. **`claims no analytics only while the site really runs none`** — **this one is a surprise, and it is not Plan 8's problem after all.** It asserts that no page loads *any* absolute `http(s)` `script[src]`, `link[rel=stylesheet]` or `link[rel=preconnect]`, because the privacy page claims *"Fonts, images, stylesheets and scripts are all served from this domain."* Turnstile's widget is `https://challenges.cloudflare.com/turnstile/v0/api.js` — an absolute external script. It will fire.

**Do not loosen either test to make it pass.** The resolution lives in **Task 4 — the same task
that ships the first form** — and not in a later cleanup task. That is deliberate: Plan 5's own
comment says to update the page *"in the same commit"*, and splitting them would leave Tasks 4, 5
and 6 each ending with a red suite, which is not a reviewable gate. The resolution is:

- `/legal/privacy/` gains a section describing Turnstile, Resend and the KV retention period, and its "everything is served from this domain" sentence is narrowed to name the two form pages as the exception.
- Guard 2 is **rewritten, not deleted**: it keeps failing on any external resource that is *not* on a small explicit allowlist, and the allowlist contains exactly `https://challenges.cloudflare.com/turnstile/v0/api.js`. A new third-party script still fails it. Plan 8 adds Cloudflare Web Analytics to the same allowlist and updates the page again.
- Guard 1 is **deleted**, and replaced by a test asserting the privacy page now *does* describe the form.

---

## Why the Turnstile script carries no Subresource Integrity hash

Automated tooling flags any external `<script>` without `integrity="sha384-…" crossorigin`, and
for most third-party scripts that is right. **It is deliberately not applied here**, and the
reasoning belongs on the record so nobody "fixes" it later:

- `https://challenges.cloudflare.com/turnstile/v0/api.js` is an **unversioned, rolling endpoint**.
  Cloudflare updates it in place, without notice, as part of how the challenge stays effective
  against bots. An SRI hash pins one exact byte sequence.
- So a hash would not harden the widget — it would **guarantee it breaks** the next time Cloudflare
  ships a change, and it would break silently, taking both enquiry forms down with it. Trading a
  working RFQ path for a hash that expires unpredictably is a bad trade on this site in particular.
- The residual risk is real and is accepted: a compromise of `challenges.cloudflare.com` would
  execute on the two form pages. Cloudflare is already this site's host and CDN under the Plan 8
  design, so it is inside the trust boundary either way — an SRI hash on one of its scripts would
  not change who has to be trusted.
- What *is* enforced instead: `tests/legal.test.ts` fails if any **undisclosed** third-party
  resource appears anywhere in the build, and a second test fails if Turnstile is loaded on any
  page other than the two that have a form. Containment and disclosure, rather than a hash that
  cannot hold.

If a future version of Turnstile offers a versioned URL, pin it and add the hash then.

## What this plan does not build

- **No product-page "Request this grade" CTA.** Spec §5 lists it on the spec table. It needs `/request-a-sample/` to exist first, which is what this plan delivers; wiring it into `SpecTable` is a one-line follow-up better done when the page is real. Recorded as an open item for Plan 8.
- **No `wrangler` dependency and no local Functions runtime.** Nothing in this repo can be deployed until Plan 8 sets up Cloudflare Pages, so the function is verified by unit tests against a mocked environment. Task 7 writes the deployment checklist that Plan 8 must execute. **This is the plan's main honest limitation — say so, do not paper over it.**
- **No admin UI for reading KV.** Submissions are retrievable from the Cloudflare dashboard. A dashboard page would need auth, which needs sessions, which is a plan of its own.
- **No file attachments.** A spec sheet or drawing would be genuinely useful on a sample request; it needs R2 or size-limited base64 and its own abuse surface. Recorded as an open question for LiTex.

---

## File Structure

**Created**

| File | Responsibility |
|---|---|
| `src/lib/enquiry.ts` | Field definitions and validation for both form types. Zero imports. The single source of truth shared by the pages, the function and the tests. |
| `functions/api/submit.ts` | The Pages Function: honeypot → Turnstile → validate → KV → deliver → respond. |
| `src/components/EnquiryForm.astro` | Renders a form from the shared field definitions, plus honeypot and Turnstile widget. |
| `src/pages/contact/index.astro` | General enquiry, plus the real contact details via `ContactBlock`. |
| `src/pages/request-a-sample/index.astro` | Sample request: product, grade, quantity, application. |
| `src/pages/enquiry-sent/index.astro` | Static confirmation target for the no-JS success redirect. |
| `tests/enquiry.test.ts` | Unit tests for the shared module. |
| `tests/submit.test.ts` | Unit tests for the function against a mocked env. |
| `tests/contact.test.ts` | Dist assertions for the three new pages. |

**Modified**

| File | Change |
|---|---|
| `src/lib/nav.ts` | Add `/contact/` — after the page exists. |
| `src/pages/legal/privacy.astro` | Describe the form, Turnstile, Resend and KV retention. |
| `tests/legal.test.ts` | Delete guard 1, rewrite guard 2 with an explicit allowlist, add a "describes the form" test. |
| `HANDOFF.md` | Rewrite for session 9. |

---

### Task 1: The shared enquiry module

**Files:**
- Create: `src/lib/enquiry.ts`, `tests/enquiry.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `FORM_TYPES`, `FIELDS`, `fieldsFor(formType)`, `validateEnquiry(formType, raw)` → `{ ok, values, errors }`, `MAX_LENGTHS`, `HONEYPOT_FIELD`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/enquiry.test.ts
import { describe, it, expect } from 'vitest';
import {
  FORM_TYPES, FIELDS, fieldsFor, validateEnquiry, HONEYPOT_FIELD,
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
    expect(Object.keys(r.errors).sort()).toEqual(['email', 'message', 'name']);
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
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/enquiry.test.ts`
Expected: FAIL — cannot resolve `../src/lib/enquiry`.

- [ ] **Step 3: Write the module**

```ts
// src/lib/enquiry.ts
/**
 * The one definition of what the two enquiry forms ask for.
 *
 * The Astro pages render their inputs from FIELDS and the Pages Function validates
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
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run tests/enquiry.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/enquiry.ts tests/enquiry.test.ts
git commit -m "feat: define the enquiry fields and validation once, for page and function"
```

---

### Task 2: The Pages Function

**Files:**
- Create: `functions/api/submit.ts`, `tests/submit.test.ts`

**Interfaces:**
- Consumes: `validateEnquiry`, `HONEYPOT_FIELD`, `FORM_TYPES` from `src/lib/enquiry`.
- Produces: `onRequestPost(context)` at `POST /api/submit`; exported helpers `verifyTurnstile(secret, token, fetchImpl)` and `deliver(env, record, fetchImpl)` so both are testable in isolation.

**Verified API facts** (checked against Cloudflare and Resend docs on 2026-08-12 — do not re-derive):

- Turnstile siteverify: `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`, parameters `secret` and `response` (plus optional `remoteip`, which this plan deliberately omits). Response carries `success: boolean` and `error-codes: string[]`.
- Turnstile **test keys**: secret `1x0000000000000000000000000000000AA` always passes, `2x0000000000000000000000000000000AA` always fails, `3x0000000000000000000000000000000AA` returns "token already spent". Sitekey `1x00000000000000000000AA` always passes (visible).
- Resend: `POST https://api.resend.com/emails`, headers `Authorization: Bearer <key>` and `Content-Type: application/json`, body `{ from, to, subject, text?, html?, reply_to? }`, success response `{ id }`.
- Pages Functions: a file at `functions/api/submit.ts` serves `/api/submit`. `onRequestPost(context)` receives `{ request, env, params, data, waitUntil, next, functionPath }`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/submit.test.ts
import { describe, it, expect, vi } from 'vitest';
import { onRequestPost } from '../functions/api/submit';

/** Minimal KV double: records what was written so tests can assert store-before-send. */
function kvDouble() {
  const writes: { key: string; value: string; options?: unknown }[] = [];
  return {
    writes,
    put: vi.fn(async (key: string, value: string, options?: unknown) => {
      writes.push({ key, value, options });
    }),
  };
}

function envDouble(overrides: Record<string, unknown> = {}) {
  return {
    SUBMISSIONS: kvDouble(),
    TURNSTILE_SECRET: '1x0000000000000000000000000000000AA',
    RESEND_API_KEY: 're_test_key',
    ENQUIRY_TO: 'sales@litex.com.tw',
    ENQUIRY_FROM: 'LiTex Website <website@litex.com.tw>',
    ...overrides,
  };
}

function formRequest(fields: Record<string, string>, accept = 'application/json') {
  const body = new URLSearchParams(fields);
  return new Request('https://litex.com.tw/api/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept },
    body: body.toString(),
  });
}

const goodFields = {
  formType: 'contact',
  name: 'A Buyer',
  company: 'Buyer GmbH',
  email: 'buyer@example.org',
  message: 'Lead times for 2S2Z please.',
  'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX',
};

/** Turnstile ok, Resend ok. */
function happyFetch() {
  return vi.fn(async (url: string | URL) => {
    const href = String(url);
    if (href.includes('siteverify')) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    if (href.includes('api.resend.com')) {
      return new Response(JSON.stringify({ id: 'abc-123' }), { status: 200 });
    }
    throw new Error(`unexpected fetch to ${href}`);
  });
}

describe('POST /api/submit — happy path', () => {
  it('stores the submission and reports delivered', async () => {
    const env = envDouble();
    const res = await onRequestPost({ request: formRequest(goodFields), env, fetchImpl: happyFetch() } as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.outcome).toBe('delivered');
    expect(env.SUBMISSIONS.put).toHaveBeenCalledOnce();
  });

  it('writes a record that contains the submitted values and the form type', async () => {
    const env = envDouble();
    await onRequestPost({ request: formRequest(goodFields), env, fetchImpl: happyFetch() } as never);
    const record = JSON.parse(env.SUBMISSIONS.writes[0].value);
    expect(record.formType).toBe('contact');
    expect(record.values.email).toBe('buyer@example.org');
    expect(record.receivedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  // Decision 5: not collecting an IP is a privacy choice the privacy notice relies on.
  // The header goes in the constructor — a Request's headers are guarded once built, so
  // calling .set() afterwards is not reliably applied.
  it('records no IP address anywhere in the stored record', async () => {
    const env = envDouble();
    const request = new Request('https://litex.com.tw/api/submit', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
        'cf-connecting-ip': '203.0.113.7',
      },
      body: new URLSearchParams(goodFields).toString(),
    });
    await onRequestPost({ request, env, fetchImpl: happyFetch() } as never);
    expect(env.SUBMISSIONS.writes[0].value).not.toContain('203.0.113.7');
  });

  it('sets an expiry on the record so submissions do not accumulate forever', async () => {
    const env = envDouble();
    await onRequestPost({ request: formRequest(goodFields), env, fetchImpl: happyFetch() } as never);
    expect(env.SUBMISSIONS.writes[0].options).toMatchObject({ expirationTtl: expect.any(Number) });
  });
});

describe('POST /api/submit — the failure that matters', () => {
  // Spec §4: a silently dropped RFQ is a lost customer who believes they were ignored.
  it('still stores the submission when delivery fails, and says so honestly', async () => {
    const env = envDouble();
    const fetchImpl = vi.fn(async (url: string | URL) => {
      const href = String(url);
      if (href.includes('siteverify')) {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      return new Response('upstream exploded', { status: 500 });
    });

    const res = await onRequestPost({ request: formRequest(goodFields), env, fetchImpl } as never);
    const body = await res.json();

    expect(env.SUBMISSIONS.put, 'the submission was lost').toHaveBeenCalledOnce();
    expect(body.outcome).toBe('stored');
    expect(body.outcome, 'a failed delivery must never read as success').not.toBe('delivered');
    expect(body.contactEmail).toBe('sales@litex.com.tw');
  });

  it('stores before it attempts delivery, not after', async () => {
    const env = envDouble();
    const order: string[] = [];
    env.SUBMISSIONS.put = vi.fn(async () => { order.push('kv'); });
    const fetchImpl = vi.fn(async (url: string | URL) => {
      const href = String(url);
      if (href.includes('siteverify')) {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      order.push('deliver');
      return new Response(JSON.stringify({ id: 'x' }), { status: 200 });
    });

    await onRequestPost({ request: formRequest(goodFields), env, fetchImpl } as never);
    expect(order).toEqual(['kv', 'deliver']);
  });

  it('reports a hard failure when even the store fails', async () => {
    const env = envDouble();
    env.SUBMISSIONS.put = vi.fn(async () => { throw new Error('KV down'); });
    const res = await onRequestPost({ request: formRequest(goodFields), env, fetchImpl: happyFetch() } as never);
    const body = await res.json();
    expect(body.outcome).toBe('failed');
    expect(body.contactEmail).toBe('sales@litex.com.tw');
    expect(res.status).toBeGreaterThanOrEqual(500);
  });
});

describe('POST /api/submit — rejection', () => {
  it('returns field errors without storing anything', async () => {
    const env = envDouble();
    const res = await onRequestPost({
      request: formRequest({ ...goodFields, email: 'not-an-email' }),
      env, fetchImpl: happyFetch(),
    } as never);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.outcome).toBe('rejected');
    expect(body.errors.email).toBeTruthy();
    expect(env.SUBMISSIONS.put).not.toHaveBeenCalled();
  });

  it('rejects a failed Turnstile check without storing', async () => {
    const env = envDouble();
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] }), { status: 200 }));
    const res = await onRequestPost({ request: formRequest(goodFields), env, fetchImpl } as never);
    expect((await res.json()).outcome).toBe('rejected');
    expect(env.SUBMISSIONS.put).not.toHaveBeenCalled();
  });

  // A filled honeypot is a bot. Discard quietly — telling it why teaches it to pass.
  it('discards a submission with the honeypot filled, without calling Turnstile or KV', async () => {
    const env = envDouble();
    const fetchImpl = happyFetch();
    const res = await onRequestPost({
      request: formRequest({ ...goodFields, website: 'http://spam.example' }),
      env, fetchImpl,
    } as never);
    expect(res.status).toBe(200);
    expect(env.SUBMISSIONS.put).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('POST /api/submit — content negotiation', () => {
  // The no-JS path: a browser posting a plain form gets a redirect, not JSON.
  it('redirects a non-JSON client to the confirmation page on success', async () => {
    const env = envDouble();
    const res = await onRequestPost({
      request: formRequest(goodFields, 'text/html'), env, fetchImpl: happyFetch(),
    } as never);
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('/enquiry-sent/');
  });

  it('gives a non-JSON client readable HTML when validation fails', async () => {
    const env = envDouble();
    const res = await onRequestPost({
      request: formRequest({ ...goodFields, email: '' }, 'text/html'), env, fetchImpl: happyFetch(),
    } as never);
    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toContain('text/html');
    const html = await res.text();
    expect(html).toContain('Email');
    expect(html).toContain('sales@litex.com.tw');
  });
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npx vitest run tests/submit.test.ts`
Expected: FAIL — cannot resolve `../functions/api/submit`.

- [ ] **Step 3: Write the function**

```ts
// functions/api/submit.ts
/**
 * The one endpoint behind both enquiry forms.
 *
 * Order is the whole design (spec §4): honeypot, then Turnstile, then validation, then
 * KV, then delivery. The KV write happens BEFORE delivery is attempted and its success
 * is what the user is told about — because a submission LiTex still holds is recoverable
 * and a lost one is not. Delivery is best-effort and explicitly retryable.
 *
 * Three outcomes, never two:
 *   delivered — stored and emailed
 *   stored    — stored, email failed; the visitor is told, and given the direct address
 *   rejected  — validation or spam; nothing stored
 *   failed    — the store itself failed; the visitor is told to email directly
 *
 * `fetchImpl` is injectable so the tests can drive Turnstile and Resend without network.
 */
import { validateEnquiry, HONEYPOT_FIELD, FORM_TYPES, type FormType } from '../../src/lib/enquiry';

const TURNSTILE_VERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/** 180 days. Long enough to recover a missed RFQ, short enough to be a real retention limit. */
const RETENTION_SECONDS = 180 * 24 * 60 * 60;

type Env = {
  SUBMISSIONS: { put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> };
  TURNSTILE_SECRET: string;
  RESEND_API_KEY: string;
  ENQUIRY_TO: string;
  ENQUIRY_FROM: string;
};

export async function verifyTurnstile(
  secret: string,
  token: string,
  fetchImpl: typeof fetch,
): Promise<boolean> {
  if (!token) return false;
  // remoteip is deliberately not sent — see Decision 5 in the plan.
  const body = new URLSearchParams({ secret, response: token });
  try {
    const res = await fetchImpl(TURNSTILE_VERIFY, { method: 'POST', body });
    if (!res.ok) return false;
    return ((await res.json()) as { success?: boolean }).success === true;
  } catch {
    return false;
  }
}

type EnquiryRecord = { formType: FormType; values: Record<string, string>; receivedAt: string };

export async function deliver(env: Env, record: EnquiryRecord, fetchImpl: typeof fetch): Promise<boolean> {
  const lines = Object.entries(record.values).map(([k, v]) => `${k}: ${v}`).join('\n');
  const subject = record.formType === 'sample'
    ? `Sample request — ${record.values.company ?? 'unknown company'}`
    : `Enquiry — ${record.values.company ?? 'unknown company'}`;

  try {
    const res = await fetchImpl(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: env.ENQUIRY_FROM,
        to: env.ENQUIRY_TO,
        reply_to: record.values.email,
        subject,
        text: `${subject}\nReceived ${record.receivedAt}\n\n${lines}\n`,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function wantsJson(request: Request): boolean {
  return (request.headers.get('accept') ?? '').includes('application/json');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

/** The no-JS error page. Deliberately plain: it is a fallback, not a designed surface. */
function errorHtml(errors: Record<string, string>, contactEmail: string): string {
  const items = Object.entries(errors)
    .map(([field, message]) => `<li><strong>${escapeHtml(field)}</strong>: ${escapeHtml(message)}</li>`)
    .join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Enquiry not sent</title></head>
<body><h1>Your enquiry was not sent</h1><ul>${items}</ul>
<p><a href="/contact/">Go back and correct it</a>, or email
<a href="mailto:${contactEmail}">${contactEmail}</a> directly.</p></body></html>`;
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
  /** Test seam. Cloudflare never passes this; production uses global fetch. */
  fetchImpl?: typeof fetch;
}): Promise<Response> {
  const { request, env } = context;
  const fetchImpl = context.fetchImpl ?? fetch;
  const contactEmail = env.ENQUIRY_TO;

  const form = await request.formData();
  const raw = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));

  // A filled honeypot is a bot. Return the same shape a success returns: an error would
  // tell it what to change. Nothing is stored and no upstream is called.
  if ((raw[HONEYPOT_FIELD] ?? '').trim() !== '') {
    return wantsJson(request)
      ? Response.json({ outcome: 'delivered' })
      : new Response(null, { status: 303, headers: { location: '/enquiry-sent/' } });
  }

  const formType = raw.formType as FormType;
  if (!FORM_TYPES.includes(formType)) {
    const errors = { formType: 'Unknown form.' };
    return wantsJson(request)
      ? Response.json({ outcome: 'rejected', errors, contactEmail }, { status: 400 })
      : new Response(errorHtml(errors, contactEmail), {
          status: 400, headers: { 'content-type': 'text/html; charset=utf-8' },
        });
  }

  const passed = await verifyTurnstile(
    env.TURNSTILE_SECRET, raw['cf-turnstile-response'] ?? '', fetchImpl,
  );
  if (!passed) {
    const errors = { turnstile: 'We could not verify that you are human. Please try again.' };
    return wantsJson(request)
      ? Response.json({ outcome: 'rejected', errors, contactEmail }, { status: 400 })
      : new Response(errorHtml(errors, contactEmail), {
          status: 400, headers: { 'content-type': 'text/html; charset=utf-8' },
        });
  }

  const { ok, values, errors } = validateEnquiry(formType, raw);
  if (!ok) {
    return wantsJson(request)
      ? Response.json({ outcome: 'rejected', errors, contactEmail }, { status: 400 })
      : new Response(errorHtml(errors, contactEmail), {
          status: 400, headers: { 'content-type': 'text/html; charset=utf-8' },
        });
  }

  const record: EnquiryRecord = { formType, values, receivedAt: new Date().toISOString() };
  const key = `enquiry:${record.receivedAt}:${crypto.randomUUID()}`;

  try {
    await env.SUBMISSIONS.put(key, JSON.stringify(record), { expirationTtl: RETENTION_SECONDS });
  } catch {
    // Nothing was kept. Say so plainly and give the address that always works.
    const message =
      'We could not record your enquiry. Please email us directly so it is not lost.';
    return wantsJson(request)
      ? Response.json({ outcome: 'failed', message, contactEmail }, { status: 503 })
      : new Response(errorHtml({ submission: message }, contactEmail), {
          status: 503, headers: { 'content-type': 'text/html; charset=utf-8' },
        });
  }

  const delivered = await deliver(env, record, fetchImpl);

  if (!delivered) {
    const message =
      'We have your enquiry, but our email system did not accept it just now. ' +
      'If you do not hear back within one working day, please email us directly.';
    return wantsJson(request)
      ? Response.json({ outcome: 'stored', message, contactEmail })
      : new Response(null, { status: 303, headers: { location: '/enquiry-sent/?delivery=pending' } });
  }

  return wantsJson(request)
    ? Response.json({ outcome: 'delivered' })
    : new Response(null, { status: 303, headers: { location: '/enquiry-sent/' } });
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run tests/submit.test.ts`
Expected: PASS.

- [ ] **Step 5: Confirm the whole suite still passes and the build is untouched**

Run: `npm run build && npm test`
Expected: build exits 0 at **32 pages** — `functions/` is not part of the Astro build and must not change it.

- [ ] **Step 6: Commit**

```bash
git add functions/api/submit.ts tests/submit.test.ts
git commit -m "feat: add the enquiry endpoint, storing every submission before delivery"
```

---

### Task 3: The form component and the confirmation page

**Files:**
- Create: `src/components/EnquiryForm.astro`, `src/pages/enquiry-sent/index.astro`

**Interfaces:**
- Consumes: `fieldsFor`, `HONEYPOT_FIELD`, `MAX_LENGTHS` from `src/lib/enquiry`; `COMPANY` from `src/lib/company`.
- Produces: `<EnquiryForm formType="contact" | "sample" submitLabel="…" />`; route `/enquiry-sent/`.

- [ ] **Step 1: Write the component**

```astro
---
// src/components/EnquiryForm.astro
import { fieldsFor, HONEYPOT_FIELD, MAX_LENGTHS, type FormType } from '../lib/enquiry';
import { COMPANY } from '../lib/company';

interface Props {
  formType: FormType;
  submitLabel: string;
  /** Cloudflare Turnstile sitekey. The documented always-passes test key by default. */
  sitekey?: string;
}

// 1x00000000000000000000AA is Cloudflare's documented always-passes test sitekey. It is
// the default so the form is usable in development and in CI; Plan 8 replaces it with the
// real key at deploy time. A wrong sitekey fails closed — the server still verifies.
const { formType, submitLabel, sitekey = '1x00000000000000000000AA' } = Astro.props;
const fields = fieldsFor(formType);
---
<form
  class="enquiry"
  method="post"
  action="/api/submit"
  novalidate
  data-enquiry-form
  data-contact-email={COMPANY.email}
>
  <input type="hidden" name="formType" value={formType} />

  <!-- Honeypot. Hidden from sight and from assistive technology; only a bot fills it. -->
  <p class="honeypot" aria-hidden="true">
    <label for={`hp-${formType}`}>Leave this field empty</label>
    <input id={`hp-${formType}`} type="text" name={HONEYPOT_FIELD} tabindex="-1" autocomplete="off" />
  </p>

  {fields.map((field) => (
    <p class="field">
      <label for={`${formType}-${field.name}`}>
        {field.label}
        {field.required && <span class="req" aria-hidden="true">*</span>}
        {!field.required && <span class="opt">(optional)</span>}
      </label>

      {field.hint && <span class="hint" id={`${formType}-${field.name}-hint`}>{field.hint}</span>}

      {field.type === 'textarea' ? (
        <textarea
          id={`${formType}-${field.name}`}
          name={field.name}
          rows="5"
          maxlength={MAX_LENGTHS[field.name]}
          required={field.required}
          aria-describedby={field.hint ? `${formType}-${field.name}-hint` : undefined}
        />
      ) : (
        <input
          id={`${formType}-${field.name}`}
          name={field.name}
          type={field.type}
          maxlength={MAX_LENGTHS[field.name]}
          required={field.required}
          autocomplete={field.autocomplete}
          aria-describedby={field.hint ? `${formType}-${field.name}-hint` : undefined}
        />
      )}

      <span class="error" data-error-for={field.name} hidden></span>
    </p>
  ))}

  <div class="cf-turnstile" data-sitekey={sitekey}></div>

  <p class="actions">
    <button type="submit">{submitLabel}</button>
  </p>

  <p class="fallback">
    Prefer email?{' '}
    <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
  </p>

  <p class="status" data-form-status role="status" aria-live="polite" hidden></p>
</form>

<script is:inline src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

<style>
  .enquiry { max-width: 40rem; }
  .field { display: flex; flex-direction: column; gap: var(--s-1); margin: 0 0 var(--s-6); }
  label { font-size: var(--t-14); }
  .req { color: var(--c-copper); margin-left: var(--s-1); }
  .opt { color: var(--c-text-2); font-size: var(--t-12); margin-left: var(--s-2); }
  .hint { color: var(--c-text-2); font-size: var(--t-12); }
  input, textarea {
    background: var(--c-raised);
    border: 1px solid var(--c-line);
    color: var(--c-text-1);
    font: inherit;
    padding: var(--s-2) var(--s-3);
  }
  input:focus-visible, textarea:focus-visible { outline: 2px solid var(--c-copper-lift); }
  .error { color: var(--c-copper-lift); font-size: var(--t-12); }
  /* Off-screen rather than display:none — some bots skip what is not rendered. */
  .honeypot {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }
  button {
    background: var(--c-copper);
    border: 0;
    color: var(--c-base);
    font: inherit;
    font-weight: 600;
    padding: var(--s-3) var(--s-6);
    cursor: pointer;
  }
  button:hover { background: var(--c-copper-lift); }
  .fallback, .status { color: var(--c-text-2); font-size: var(--t-14); }
</style>
```

- [ ] **Step 2: Write the confirmation page**

```astro
---
// src/pages/enquiry-sent/index.astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import { COMPANY } from '../../lib/company';

// The no-JS delivery-failure path lands here with ?delivery=pending. The page is static,
// so the distinction is drawn in the markup and revealed by CSS :target-like logic would
// be fragile — instead both messages are present and the second is only shown when the
// query string says so, via a tiny inline script. With JS off, BOTH are visible, which is
// verbose but never misleading: the visitor is told the enquiry is recorded either way.
---
<BaseLayout
  title="Enquiry received — LiTex Textile & Technology"
  description="LiTex has received your enquiry."
>
  <h1>Thank you — we have your enquiry</h1>

  <p class="lead">
    It is recorded and on its way to the sales team. We normally reply within one working
    day, Monday to Friday, {COMPANY.hours} Taipei time.
  </p>

  <p class="pending" data-delivery-pending>
    One note: our email system did not accept the message on the first attempt, so it is
    queued rather than delivered. Your enquiry is <strong>not lost</strong> — but if you
    have not heard from us within one working day, please email{' '}
    <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> directly.
  </p>

  <p><a href="/products/">Back to products</a></p>
</BaseLayout>

<script is:inline>
  // Hide the queued-delivery note unless the redirect actually flagged it.
  if (!new URLSearchParams(location.search).has('delivery')) {
    document.querySelector('[data-delivery-pending]')?.setAttribute('hidden', '');
  }
</script>

<style>
  .lead { color: var(--c-text-2); max-width: 60ch; font-size: var(--t-20); }
  .pending {
    max-width: 60ch;
    border-left: 2px solid var(--c-copper);
    padding-left: var(--s-4);
  }
</style>
```

- [ ] **Step 3: Build and confirm the route exists**

Run: `npm run build`
Expected: exits 0 at **33 pages** (32 + `/enquiry-sent/`). The component is not yet used by any page.

- [ ] **Step 4: Commit**

```bash
git add src/components/EnquiryForm.astro src/pages/enquiry-sent/index.astro
git commit -m "feat: add the enquiry form component and its confirmation page"
```

---

### Task 4: `/contact/`, and making the privacy notice true again

The moment this task ships a `<form>` and a Turnstile script, **both** forward guards in
`tests/legal.test.ts` become false. They are resolved here, in the same task, so the suite is green
at this task's boundary. Read the ⚠ section at the top of this plan first.

**Files:**
- Create: `src/pages/contact/index.astro`, `tests/contact.test.ts`
- Modify: `src/lib/nav.ts`, `src/pages/legal/privacy.astro`, `tests/legal.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/contact.test.ts
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
```

- [ ] **Step 2: Run and watch it fail**

Run: `npm run build && npx vitest run tests/contact.test.ts`
Expected: FAIL — `dist/contact/index.html` does not exist.

- [ ] **Step 3: Write the page**

```astro
---
// src/pages/contact/index.astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import ContactBlock from '../../components/ContactBlock.astro';
import EnquiryForm from '../../components/EnquiryForm.astro';
---
<BaseLayout
  title="Contact — LiTex Textile & Technology"
  description="Contact LiTex Textile & Technology in Taipei about conductive metal yarn, heating textiles, EMI shielding tube and woven tapes."
>
  <h1>Contact</h1>

  <p class="intro">
    Tell us the grade, quantity and application if you know them — that is usually enough
    for us to answer with real numbers rather than a request for more detail. If you would
    rather have material in your hands first, ask for a{' '}
    <a href="/request-a-sample/">sample</a>.
  </p>

  <div class="cols">
    <section>
      <h2>Send an enquiry</h2>
      <EnquiryForm formType="contact" submitLabel="Send enquiry" />
    </section>

    <section>
      <h2>Direct details</h2>
      <ContactBlock />
      <p class="note">
        Taipei is UTC+8. An enquiry sent from Europe in the afternoon is usually answered
        the following morning.
      </p>
    </section>
  </div>
</BaseLayout>

<style>
  .intro { color: var(--c-text-2); max-width: 60ch; }
  .cols {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
    gap: var(--s-12);
    align-items: start;
  }
  .note { color: var(--c-text-2); font-size: var(--t-14); max-width: 40ch; }
</style>
```

- [ ] **Step 4: Build, test, then add the nav entry**

Run: `npm run build && npx vitest run tests/contact.test.ts` — expect PASS at **34 pages**.

Only then:

```ts
// src/lib/nav.ts — append
  { href: '/news/', label: 'News' },
  { href: '/contact/', label: 'Contact' },
];
```

- [ ] **Step 5: Watch both forward guards fire**

Run: `npm run build && npm test`
Expected: **`tests/legal.test.ts` FAILS twice** — on *"describes no form while no form exists"* (a form now exists) and on *"claims no analytics only while the site really runs none"* (Turnstile is an absolute external script). **Record both failure messages in your report before fixing anything.** They are the guards doing their job, and seeing them fire is the evidence that they were real.

- [ ] **Step 6: Update the privacy notice**

Read `src/pages/legal/privacy.astro` first and match its existing voice and structure. It must now describe, in its own terms:

- **What the forms collect** — the fields defined in `src/lib/enquiry.ts`, and that submissions are stored in Cloudflare Workers KV for **180 days** (`RETENTION_SECONDS` in `functions/api/submit.ts`) before automatic deletion. Keep the number and the code in agreement.
- **That no IP address is recorded** (Decision 5). This is a concrete, checkable promise and one of the few privacy claims most commercial sites cannot make — a test in Task 2 already enforces it.
- **Cloudflare Turnstile**, loaded from `challenges.cloudflare.com` on the two form pages only, and why: to keep the form usable without a spam flood.
- **Resend**, the processor that delivers the enquiry email.
- **Narrow the existing "everything is served from this domain" sentence** so it names the form pages as the exception, rather than being quietly false everywhere else.

- [ ] **Step 7: Delete guard 1 and replace it**

Remove the `describes no form while no form exists` test entirely — do not comment it out. In its place:

```ts
  it('describes the form now that one exists', () => {
    const text = docFor('legal/privacy/index.html').body.textContent ?? '';
    expect(text).toContain('Turnstile');
    expect(text).toContain('180 days');
    // The no-IP promise is enforced against the function in tests/submit.test.ts,
    // which is what makes it safe for the page to state.
    expect(text.toLowerCase()).toContain('ip address');
  });
```

- [ ] **Step 8: Rewrite guard 2 with an explicit allowlist**

Replace the body of `claims no analytics only while the site really runs none` with:

```ts
  // Rewritten in Plan 7. The site now loads exactly one third-party resource — the
  // Turnstile widget, on the two form pages — and /legal/privacy/ discloses it. The
  // guard's job is unchanged: an UNDISCLOSED third party must fail. Plan 8 adds the
  // Cloudflare Web Analytics script to this list and updates the page in the same commit.
  const DISCLOSED = new Set([
    'https://challenges.cloudflare.com/turnstile/v0/api.js',
  ]);

  it('loads no third-party resource the privacy notice does not disclose', () => {
    const undisclosed = new Set<string>();
    for (const file of walk(DIST).filter((f) => f.endsWith('.html'))) {
      const doc = parseHTML(readFileSync(file, 'utf8')).document;
      for (const el of [
        ...doc.querySelectorAll('script[src], link[rel="stylesheet"], link[rel="preconnect"]'),
      ]) {
        const url = el.getAttribute('src') ?? el.getAttribute('href') ?? '';
        if (/^https?:\/\//.test(url) && !DISCLOSED.has(url)) undisclosed.add(url);
      }
    }
    expect(
      [...undisclosed],
      'an undisclosed third-party resource is now loaded — update /legal/privacy/',
    ).toEqual([]);
  });

  it('loads Turnstile only on the pages that have a form', () => {
    const withTurnstile = walk(DIST)
      .filter((f) => f.endsWith('.html'))
      .filter((f) => readFileSync(f, 'utf8').includes('challenges.cloudflare.com'));
    expect(withTurnstile).toHaveLength(1);
    expect(withTurnstile.every((f) => /contact/.test(f))).toBe(true);
  });
```

> Note the count is **1** at this point — only `/contact/` exists. Task 5 adds
> `/request-a-sample/` and must raise it to **2** in the same commit that adds the page.

- [ ] **Step 9: Run the whole suite green**

Run: `npm run build && npm test`
Expected: **everything passes** at **34 pages**.

- [ ] **Step 10: Verify the rewritten guard can still fail**

The guard was just rewritten, so it has not been proven. Temporarily add
`<script src="https://example.org/tracker.js"></script>` to `src/layouts/BaseLayout.astro`, rebuild,
and confirm `tests/legal.test.ts` FAILS naming that URL. Remove it, rebuild, confirm green. Report
the failure text you saw.

- [ ] **Step 11: Commit**

```bash
git add src/pages/contact/index.astro src/lib/nav.ts tests/contact.test.ts \
        src/pages/legal/privacy.astro tests/legal.test.ts
git commit -m "feat: publish /contact/ and describe its form in the privacy notice"
```

---

### Task 5: `/request-a-sample/`

**Files:**
- Create: `src/pages/request-a-sample/index.astro`
- Modify: `tests/contact.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/contact.test.ts`:

```ts
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
```

- [ ] **Step 2: Run and watch it fail**

Run: `npx vitest run tests/contact.test.ts`
Expected: FAIL — `dist/request-a-sample/index.html` does not exist.

- [ ] **Step 3: Write the page**

```astro
---
// src/pages/request-a-sample/index.astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import EnquiryForm from '../../components/EnquiryForm.astro';
---
<BaseLayout
  title="Request a sample — LiTex Textile & Technology"
  description="Request a material sample of LiTex conductive metal yarn, heating textile, EMI shielding tube or woven tape."
>
  <h1>Request a sample</h1>

  <p class="intro">
    Samples are cut to order, so the more precisely you can describe the grade and the
    application, the more useful the material we send will be.
  </p>

  <ul class="expect">
    <li>Sample quantities are agreed case by case — there is no fixed <strong>minimum</strong> for
      an evaluation cut, but production orders do carry one.</li>
    <li>Lead time depends on whether the grade is in stock; we will tell you when we reply.</li>
    <li>We will ask what you are building. That is not sales curiosity — covering count and
      construction change with the application, and the wrong grade evaluates badly.</li>
  </ul>

  <EnquiryForm formType="sample" submitLabel="Request sample" />

  <p class="alt">
    Not ready for material yet? A{' '}
    <a href="/contact/">general enquiry</a> is often the faster first step, and the{' '}
    <a href="/downloads/">catalogs</a> carry the full specifications.
  </p>
</BaseLayout>

<style>
  .intro { color: var(--c-text-2); max-width: 60ch; font-size: var(--t-20); }
  .expect { max-width: 60ch; color: var(--c-text-2); }
  .expect li { margin-bottom: var(--s-2); }
  .alt { color: var(--c-text-2); max-width: 60ch; margin-top: var(--s-12); }
</style>
```

- [ ] **Step 4: Raise the Turnstile page count in `tests/legal.test.ts`**

Task 4's `loads Turnstile only on the pages that have a form` expects **1** page. This task adds the
second form, so change that expectation to **2** and widen the path check:

```ts
    expect(withTurnstile).toHaveLength(2);
    expect(withTurnstile.every((f) => /contact|request-a-sample/.test(f))).toBe(true);
```

Do this in the same commit as the page. The count is deliberately exact rather than
`toBeGreaterThan(0)` — that is what makes it catch Turnstile leaking onto a page that has no form.

- [ ] **Step 5: Build and test**

Run: `npm run build && npm test`
Expected: the **whole suite passes** at **35 pages**.

- [ ] **Step 6: Check the compressHTML spacing trap**

Run: `grep -roE '[a-zA-Z,;:.]<(span|a|strong|em)\b' dist/contact dist/request-a-sample dist/enquiry-sent`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add src/pages/request-a-sample/index.astro tests/contact.test.ts tests/legal.test.ts
git commit -m "feat: publish /request-a-sample/ on the shared enquiry endpoint"
```

---

### Task 6: Progressive enhancement

**Files:**
- Modify: `src/components/EnquiryForm.astro`
- Modify: `tests/contact.test.ts`

The form already works with JavaScript disabled. This task adds inline errors and no-reload submission on top, and must not break the baseline.

- [ ] **Step 1: Add the script to the component**

Append inside `src/components/EnquiryForm.astro`, after the `<style>` block:

```astro
<script>
  // Progressive enhancement only. With JS off the form posts normally and the function
  // answers with a redirect or an HTML error page — that path is the baseline and must
  // keep working. Nothing here is required for the form to function.
  for (const form of document.querySelectorAll<HTMLFormElement>('[data-enquiry-form]')) {
    const status = form.querySelector<HTMLElement>('[data-form-status]');
    const contactEmail = form.dataset.contactEmail ?? '';

    const clearErrors = () => {
      for (const el of form.querySelectorAll<HTMLElement>('[data-error-for]')) {
        el.textContent = '';
        el.hidden = true;
        const control = form.querySelector(`[name="${el.dataset.errorFor}"]`);
        control?.removeAttribute('aria-invalid');
      }
    };

    const showErrors = (errors: Record<string, string>) => {
      let first: HTMLElement | null = null;
      for (const [field, message] of Object.entries(errors)) {
        const el = form.querySelector<HTMLElement>(`[data-error-for="${field}"]`);
        const control = form.querySelector<HTMLElement>(`[name="${field}"]`);
        control?.setAttribute('aria-invalid', 'true');
        if (!el) continue;
        el.textContent = message;
        el.hidden = false;
        first ??= control ?? el;
      }
      first?.focus?.();
    };

    const say = (message: string) => {
      if (!status) return;
      status.textContent = message;
      status.hidden = false;
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearErrors();

      const button = form.querySelector('button[type="submit"]');
      button?.setAttribute('disabled', '');
      say('Sending…');

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          headers: { accept: 'application/json' },
          body: new FormData(form),
        });
        const result = await response.json();

        if (result.outcome === 'delivered') {
          location.assign('/enquiry-sent/');
          return;
        }
        if (result.outcome === 'stored') {
          location.assign('/enquiry-sent/?delivery=pending');
          return;
        }
        if (result.outcome === 'rejected') {
          showErrors(result.errors ?? {});
          say('Please correct the fields marked above.');
        } else {
          say(`${result.message ?? 'Something went wrong.'} Please email ${contactEmail}.`);
        }
      } catch {
        // The network failed, so we cannot know whether anything was stored. Never
        // claim success here; point at the address that always works.
        say(`We could not reach the server. Please email ${contactEmail}.`);
      } finally {
        button?.removeAttribute('disabled');
      }
    });
  }
</script>
```

- [ ] **Step 2: Assert the baseline survived**

Append to `tests/contact.test.ts`:

```ts
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
```

- [ ] **Step 3: Build and run**

Run: `npm run build && npm test`
Expected: the **whole suite passes** at 35 pages. Task 4 already resolved both forward guards, so a red suite here means this task broke something.

- [ ] **Step 4: Verify the enhancement by hand**

Run `npm run dev`, open `/contact/`, and check both paths:
1. With JS enabled, submit an empty form — the browser must not navigate, and errors must appear under the fields.
2. Disable JS in DevTools, reload, submit — the browser must navigate to `/api/submit`. **In `astro dev` there is no Functions runtime, so expect a 404 from the dev server.** That 404 proves the form performed a real native POST, which is the thing being verified. Full end-to-end needs Plan 8.

Record what you observed in your report.

- [ ] **Step 5: Commit**

```bash
git add src/components/EnquiryForm.astro tests/contact.test.ts
git commit -m "feat: upgrade the enquiry form with inline errors, keeping the no-JS path"
```

---

### Task 7: Deployment checklist, docs and handoff

**Files:**
- Create: `docs/deployment.md`
- Modify: `HANDOFF.md`, `docs/superpowers/specs/2026-08-10-litex-website-redesign-design.md`

Nothing built in this plan has run against real Cloudflare infrastructure. This task makes that explicit and hands Plan 8 an executable list.

- [ ] **Step 1: Write `docs/deployment.md`**

It must cover, precisely enough to follow without re-deriving anything:

| What | Detail |
|---|---|
| Pages build command | **`npm run build`** — not `npx astro build`, which skips the catalog sync and 404s eleven links. This is the parked residual from Plan 5. |
| Build output directory | `dist` |
| KV namespace | Bound as **`SUBMISSIONS`** in the Pages project settings. Pages bindings are configured in the dashboard, not `wrangler.toml`. |
| Secret `TURNSTILE_SECRET` | From the Turnstile widget. Test keys are documented in this plan's Task 2 for local use. |
| Secret `RESEND_API_KEY` | From Resend. |
| Var `ENQUIRY_TO` | `sales@litex.com.tw` |
| Var `ENQUIRY_FROM` | A verified sender on `litex.com.tw`, e.g. `LiTex Website <website@litex.com.tw>` |
| Resend domain verification | DNS records on `litex.com.tw`. **Until this is done, delivery fails and every submission lands in the stored-but-undelivered path** — which is the designed behaviour, not a bug, but it means someone must watch KV until DNS is live. |
| Turnstile sitekey | Replace the default test sitekey in `EnquiryForm.astro` with the real one. |
| Post-deploy smoke test | Submit both forms; confirm a KV record appears and an email arrives; then force a failure by revoking the Resend key and confirm the visitor sees the honest queued message rather than a success. |

- [ ] **Step 2: Rewrite `HANDOFF.md` for session 9**

Preserve its structure and voice. Update the state block, the roadmap (Plan 7 done, Plan 8 next), the "What Plan 8 inherits" table, the carried-forward minors, the toolchain gotchas, and the open questions.

Add to the open questions for LiTex: **who receives enquiries** (is `sales@litex.com.tw` monitored, and by whom), **whether attachments are wanted** on a sample request, and **whether a 180-day retention is right** for their record-keeping.

Add to "What NOT to redo": the Turnstile allowlist in `tests/legal.test.ts` is deliberate and Plan 8 extends it rather than removing it.

- [ ] **Step 3: Note the spec's contact section as built**

Add a short note under spec §4 "Contact form — failure modes" recording the five decisions and that `send_email` is Workers-only, so a future reader does not rediscover the MailChannels dead end.

- [ ] **Step 4: Final verification**

Run `npm run build && npm test` and the design detector over `src/components src/pages src/styles`.
Expected: 35 pages, whole suite green, detector clean.

- [ ] **Step 5: Commit**

```bash
git add docs/deployment.md HANDOFF.md docs/superpowers/specs/2026-08-10-litex-website-redesign-design.md
git commit -m "docs: add the deployment checklist and rewrite HANDOFF for session 9"
```

---

## Definition of Done

Verified by observation. Where a guard is claimed, break it and watch it fail.

1. `npm run build` exits 0 at **35 pages** (32 + `/contact/` + `/request-a-sample/` + `/enquiry-sent/`).
2. `npm test` passes; no existing assertion was weakened to make room.
3. Both forms post to `/api/submit` with a native `method="post"` and work with JavaScript disabled.
4. The function **stores to KV before attempting delivery**, proven by a test that asserts call order — not by reading the code.
5. A delivery failure yields `outcome: 'stored'` with the direct email address, never a success.
6. A filled honeypot calls neither KV nor any upstream.
7. No IP address appears in a stored record, asserted with a request that carries `cf-connecting-ip`.
8. `/legal/privacy/` describes the form, Turnstile, Resend and the 180-day retention, and the retention figure matches `RETENTION_SECONDS`.
9. The rewritten third-party guard **fails** when an undisclosed external script is added — verified by adding one.
10. Turnstile loads on exactly two pages.
11. `grep -roE '[a-zA-Z,;:.]<(span|a|strong|em)\b' dist/contact dist/request-a-sample dist/enquiry-sent` is empty.
12. `docs/deployment.md` names every binding, secret and variable the function reads, with no placeholder left unresolved.

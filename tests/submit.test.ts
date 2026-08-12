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

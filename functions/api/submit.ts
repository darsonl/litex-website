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

# Deploying LiTex to Cloudflare Pages

**Written:** 2026-08-13, at the end of Plan 7.

**Status: none of this has been executed.** Plan 7 built the contact and sample-request flow
against unit tests and a mocked environment. There is no Cloudflare project, no KV namespace, no
Resend account and no Turnstile widget yet. **Plan 8 executes this list.** Every item below is
either read directly out of the committed code or was verified against vendor documentation on
2026-08-12 — nothing here is written from memory.

Until this list is done, `/contact/` and `/request-a-sample/` render correctly and post to
`/api/submit`, which does not exist. There is no Functions runtime in `astro dev`, so a local
submission returns 404. That is expected and is not a bug to chase.

---

## 1. Pages project settings

| Setting | Value | Why it matters |
|---|---|---|
| Framework preset | **None** | Astro's preset may substitute its own build command and undo the row below. |
| Build command | **`npm run build`** | **Not `npx astro build`, and not the Cloudflare default.** `npm run build` is `node scripts/sync-catalogs.mjs && astro build`. `npx` bypasses `package.json` scripts entirely, so the catalog sync never runs, `public/catalogs/` stays empty, and the six downloads plus five product catalog links 404 in production **with no test catching it**. This is the parked residual from Plan 5. |
| Build output directory | **`dist`** | |
| Root directory | repository root | `functions/` must sit at the root of the deployed project or the endpoint is never created. |
| Node version | 20 or newer | Astro 7 requires it. Set `NODE_VERSION` if the default image is older. |

`functions/api/submit.ts` needs no configuration — Cloudflare compiles every file under
`functions/` at deploy time and serves this one at **`POST /api/submit`**, matching the `action` on
both forms.

> **Verify at first deploy:** `functions/api/submit.ts` imports `../../src/lib/enquiry`, i.e. it
> reaches *outside* `functions/` into `src/`. That is deliberate — one validation module shared by
> the pages and the endpoint is the whole architecture — and Pages bundles functions with esbuild,
> which resolves relative imports normally. It has never been run through a real Pages build.
> If the deploy fails to resolve it, that is the first thing to look at; do **not** fix it by
> copying the module, which is precisely the drift the shared module exists to prevent.

## 2. Bindings, secrets and variables

The function reads exactly five things from `env`, typed in `functions/api/submit.ts:25-31`. All are
configured **in the Pages project dashboard** — Pages bindings do not come from a `wrangler.toml`,
and this repo deliberately has no `wrangler` dependency.

| Name | Kind | Value | Read at |
|---|---|---|---|
| `SUBMISSIONS` | **KV namespace binding** | A KV namespace created for this project. The binding *name* must be exactly `SUBMISSIONS`. | `submit.ts:177` |
| `TURNSTILE_SECRET` | **Secret** | The secret key of the Turnstile widget from §3. | `submit.ts:158` |
| `RESEND_API_KEY` | **Secret** | A Resend API key with send permission. | `submit.ts:69` |
| `ENQUIRY_TO` | Plaintext variable | `sales@litex.com.tw` | `submit.ts:74`, and echoed to the visitor as `contactEmail` on every failure path |
| `ENQUIRY_FROM` | Plaintext variable | `LiTex Website <website@litex.com.tw>` — must be on a domain verified in Resend (§4) | `submit.ts:73` |

Set all five for **both** the Production and Preview environments. A preview deployment with no
`SUBMISSIONS` binding throws on the KV write and returns the honest `failed` outcome — correct
behaviour, confusing to debug if you have forgotten why.

**Retention.** Records are written with `expirationTtl` = `RETENTION_SECONDS` =
`180 * 24 * 60 * 60` (**180 days**), after which Cloudflare deletes them automatically.
`/legal/privacy/` states 180 days in prose and `tests/legal.test.ts` asserts that string is on the
page. **If this number changes, change the constant, the privacy page and that test together** —
the site would otherwise publish a retention promise the infrastructure does not keep.

## 3. Turnstile

1. Create a Turnstile widget for `litex.com.tw`.
2. Put its **secret key** in the `TURNSTILE_SECRET` secret.
3. Put its **sitekey** in `src/components/EnquiryForm.astro`, replacing the `sitekey` default on
   line 16. It currently defaults to `1x00000000000000000000AA`, Cloudflare's documented
   **always-passes test sitekey**, so that the form is usable in development and in CI.

The test keys, for local work (verified against Cloudflare's docs 2026-08-12):

| Key | Behaviour |
|---|---|
| Sitekey `1x00000000000000000000AA` | Always passes, visible widget |
| Secret `1x0000000000000000000000000000000AA` | Always passes |
| Secret `2x0000000000000000000000000000000AA` | Always fails |
| Secret `3x0000000000000000000000000000000AA` | Returns "token already spent" |

**Shipping the test sitekey to production is a soft failure, not a loud one.** The widget still
renders and the form still works — it just stops filtering bots, because the server-side
`siteverify` call accepts the dummy token. Nothing in the test suite can detect it, since the real
key does not exist in this repo. Check it by eye after deploy.

The widget script is loaded from `challenges.cloudflare.com` **with no Subresource Integrity hash,
deliberately** — the endpoint is unversioned and Cloudflare rolls it in place, so a hash would
guarantee a silent breakage of both forms rather than prevent one. The full reasoning is in
`docs/superpowers/plans/2026-08-12-litex-contact-and-sample-flow.md`. Do not "fix" this.

## 4. Resend

1. Create a Resend account and **verify `litex.com.tw`** by adding the DNS records it specifies.
2. Create an API key; put it in the `RESEND_API_KEY` secret.
3. Make sure the address in `ENQUIRY_FROM` is on the verified domain.

**Until domain verification completes, every submission takes the stored-but-undelivered path.**
That is the designed behaviour, not a bug: the enquiry is written to KV first, the visitor is told
honestly that the message is queued and given the direct address, and nothing is lost. But it means
**somebody must watch the KV namespace between first deploy and DNS propagation**, or a real RFQ
will sit there unread. Do the DNS records before announcing the site.

## 5. Post-deploy smoke test

Do all five. Items 3 and 4 are the ones worth the effort — the happy path is the easy half, and the
failure paths are the reason this design exists.

1. **Submit `/contact/`** with JavaScript on. Expect a redirect to `/enquiry-sent/` with no queued-delivery note.
2. **Submit `/request-a-sample/`.** Confirm a second KV record appears and a second email arrives at `sales@litex.com.tw`, with the submitter's address as `Reply-To`.
3. **Submit with JavaScript disabled.** Expect a native POST and a `303` to `/enquiry-sent/`. This path is the baseline; if it is broken, it is broken silently for everyone who blocks scripts.
4. **Force a delivery failure** — revoke or corrupt `RESEND_API_KEY`, then submit. Expect: a KV record still written, `/enquiry-sent/?delivery=pending`, and the visitor shown the queued-delivery note naming `sales@litex.com.tw`. **It must not read as a success.** Restore the key afterwards.
5. **Fill the honeypot** (`name="website"`, the off-screen input) via devtools and submit. Expect a normal-looking success, no KV record, and no Turnstile or Resend call.

Then confirm the two records from steps 1 and 2 carry **no IP address** — Decision 5, enforced in
`tests/submit.test.ts` against the code and worth confirming once against reality.

## 6. Still open after this list

- **Nobody has confirmed `sales@litex.com.tw` is monitored, or by whom.** The most carefully built enquiry pipeline on earth is worth nothing if the inbox is not read. Ask LiTex before launch.
- **No admin UI.** Submissions are read from the Cloudflare dashboard. A KV-reading page needs auth, which needs sessions.
- **No attachments.** A drawing or spec sheet on a sample request would be genuinely useful; it needs R2 and its own abuse surface.
- **No alerting.** Nothing notices a run of `stored` outcomes, which is exactly the signal that Resend has stopped working.

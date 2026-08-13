# Cloudflare setup — click-by-click

**Written 2026-08-13**, verified against Cloudflare and Resend's live documentation the same day.
Companion to `docs/deployment.md`, which is the terse reference. **This file is the walkthrough:**
what to click, in what order, and where each value ends up.

You need about an hour, plus DNS propagation waiting time. **Do Parts A–E now. Part F (the custom
domain) is a separate decision on a separate day** — it is the only step that can break LiTex's
existing company email, and nothing else depends on it.

> ## ✅ Status as of 2026-08-14
>
> **Parts A, B, C and E are DONE**, and the enquiry pipeline is **proven end-to-end**: a real
> submission through the live form reached `/enquiry-sent/?delivery=pending`, which is only
> reachable by passing Turnstile *and* completing the KV write. The record is in the
> `litex-enquiries` namespace. Full reasoning in `docs/deployment.md` §6c.
>
> **Only D and F remain.** D (Resend) is **blocked** on registrar access to `litex.com.tw`, and F
> (the nameserver move) is deliberately last. Until D is done, submissions are stored and the
> visitor is told delivery is pending — which is the honest behaviour, not a bug.
>
> Ticked boxes below are done. **Do not redo them.**

> **Never paste a secret key or API key into a chat, a commit, or an issue.** The only value from
> this process that is safe to share is the Turnstile **sitekey** (it is public by design and ships
> in the HTML). The Turnstile *secret* key and the Resend API key go straight into the Cloudflare
> dashboard and nowhere else.

---

## Two decisions — both settled 2026-08-13

### 1. ✅ Sending is from the subdomain `send.litex.com.tw`

Resend's own guidance is to send from a **subdomain** rather than the root domain, so that a
deliverability problem on the sending domain cannot damage the reputation of the address humans
actually write to — and `sales@litex.com.tw` is that address.

So the Pages variable is:

```
ENQUIRY_FROM = LiTex Website <website@send.litex.com.tw>
```

Buyers still reply to `sales@litex.com.tw`: the function delivers **to** `ENQUIRY_TO` and sets
**`Reply-To`** to the submitter's own address, so the from-address is never what anyone answers.
`docs/deployment.md` has been updated to match.

### 2. ✅ The nameserver move happens last

Your first deploy gives you a free URL like `litex-website.pages.dev`. **Everything gets proven
there first**, so any failure is a build problem rather than a DNS problem. Part F comes at the end,
on its own day.

> ⚠ **One consequence to hold onto.** Because the domain is not on Cloudflare yet, the three Resend
> DNS records in Part D go in at **LiTex's current DNS provider**. When you later move nameservers
> in Part F, **those three records must come across with everything else.** Resend does not
> re-verify by itself, and if they are dropped, email delivery stops silently — the site keeps
> accepting enquiries and storing them, and nobody is told. They are on the Part F export checklist
> for exactly this reason.

---

## Part A — Create the Pages project

- [x] **A1.** Sign up at [dash.cloudflare.com](https://dash.cloudflare.com) (free plan is enough).
- [x] **A2.** In the sidebar, go to **Workers & Pages**.
- [x] **A3.** Select **Create application** → the **Pages** tab → **Connect to Git**.

> ### ⚠ Make sure you are in the Pages flow, not the Workers flow
>
> Cloudflare pushes the **Workers** path hard, and it is easy to walk straight past the Pages tab.
>
> **How to tell you are in the wrong one:** the panel is headed **"Create a Worker"** / *"Configure
> your Worker project"*, and it shows a **Deploy command** field pre-filled with
> **`npx wrangler deploy`**.
>
> **The Pages flow has no Deploy command field at all** — that absence is the tell. In Pages, the
> push to `main` *is* the deploy.
>
> **Do not click Deploy from the Worker screen.** It does not merely misconfigure things: this repo
> has no `wrangler.toml`/`wrangler.jsonc` and no Worker entry point, so `wrangler deploy` fails with
> a missing-entry-point error. The build would pass and the deploy would stop. There is no set of
> field values on that screen that works. Click **Back** and pick the **Pages** tab.
>
> If your account genuinely offers no Pages option, stop and flag it — that is a real decision (it
> would mean rewriting `functions/api/submit.ts` as a Worker `fetch` handler), not a navigation
> problem. See `docs/deployment.md` §1.
- [x] **A4.** Sign in with GitHub. Choose **`darsonl/litex-website`**. Select **Install & Authorize**, then **Begin setup**.
- [x] **A5.** On *Set up builds and deployments*, enter:

| Field | Value |
|---|---|
| **Project name** | `litex-website` (this becomes `litex-website.pages.dev`) |
| **Production branch** | `main` |
| **Framework preset** | **None** ⚠ |
| **Build command** | **`npm run build`** ⚠ |
| **Build output directory** | `dist` |
| **Root directory (advanced)** | leave blank |

> ⚠ **These two fields are the ones that go wrong.** Do **not** pick the Astro preset and do **not**
> accept `npx astro build`. `npm run build` is `node scripts/sync-catalogs.mjs && astro build`;
> `npx` bypasses `package.json` scripts entirely, so the six catalog PDFs never get copied and
> **eleven download links 404 in production with no test catching it.**

> **Build command is not a deploy command**, and it is **not `npx wrangler deploy`.** That is the
> Workers command; this is a Pages project, and the repo has no `wrangler.toml` and no Worker to
> deploy. In this model there is no deploy step at all — **pushing to `main` is the deploy.**
> Cloudflare clones the repo, runs the build in its own container, publishes `dist`, and compiles
> `functions/` itself. See `docs/deployment.md` §1 for the full comparison.

- [x] **A6.** Open **Environment variables (optional)** and add **one** now:

| Name | Value |
|---|---|
| `NODE_VERSION` | `22.12.0` |

  `package.json` declares `engines: { node: ">=22.12.0" }`, and Cloudflare's default build-image
  Node version depends on the build system version — it may be older. Setting this explicitly turns
  a confusing first-build failure into a non-event. The four runtime variables (`TURNSTILE_SECRET`,
  `RESEND_API_KEY`, `ENQUIRY_TO`, `ENQUIRY_FROM`) come later, in Part E — the **build** needs none
  of them.

  Then select **Save and Deploy**.
- [x] **A7.** Wait for the build. **Expect success, 35 pages.** Open the `*.pages.dev` URL and click around.

**What works and what does not, at this point:** every page renders. Both forms render. Submitting
one **fails**, because the function has no KV binding and no secrets yet. That is expected — you are
about to add them.

---

## Part B — KV namespace (where submissions are stored)

- [x] **B1.** In the sidebar, open **Storage & Databases** → **KV**. (Direct link: `dash.cloudflare.com/?to=/:account/workers/kv/namespaces`.)
- [x] **B2.** Select **Create instance**. Name it **`litex-enquiries`**. Select **Create**.
- [x] **B3.** Go back to **Workers & Pages** → your **litex-website** project → **Settings** → **Bindings** → **Add** → **KV namespace**.
- [x] **B4.** Set:
  - **Variable name:** **`SUBMISSIONS`** — this exact string. The function reads `env.SUBMISSIONS`; any other name and every submission fails.
  - **KV namespace:** `litex-enquiries`
- [x] **B5.** Save. **Add the same binding for the Preview environment too**, or preview deploys will fail at runtime in a way that looks like a code bug.

---

## Part C — Turnstile (the anti-spam widget)

- [x] **C1.** In the sidebar, go to **Turnstile** → **Add widget**.
- [x] **C2.** Fill in:
  - **Widget name:** `LiTex enquiry forms`
  - **Hostnames:** add **`litex.com.tw`** *and* **`litex-website.pages.dev`** — without the second one the widget will not run on your test deploys.
  - **Widget mode:** **Managed**
- [x] **C3.** Select **Create**. Copy both keys. **The secret key is shown once — store it in a password manager now.**
- [x] **C4.** The **sitekey** is public and goes in the code. Send it to me, or edit it yourself in `src/components/EnquiryForm.astro` line 16, replacing the default `1x00000000000000000000AA`.

> **Why this matters more than it looks:** `1x00000000000000000000AA` is Cloudflare's documented
> *always-passes test key*. If it ships to production the forms keep working perfectly — the widget
> renders, submissions succeed — and spam filtering is simply **off**. No test in the repo can
> detect it, because the real key does not exist in the repo. This is the one launch defect with no
> automated guard.

---

## Part D — Resend (email delivery)

- [ ] **D1.** Sign up at [resend.com](https://resend.com).
- [ ] **D2.** Go to **Domains** → **Add Domain**.
- [ ] **D3.** Enter **`send.litex.com.tw`** (decision 1, settled).
- [ ] **D4.** **Region:** pick the one closest to *the people receiving the mail*. The recipient is LiTex in Taipei, so choose the **Asia-Pacific (Tokyo)** region if offered; otherwise EU.
- [ ] **D5.** Resend shows a **Records** tab with three records to create at your DNS provider:

| Type | Purpose |
|---|---|
| **TXT** | SPF — says Resend is allowed to send for you |
| **TXT** | DKIM — cryptographically signs your mail |
| **MX** | Return-path, for bounce handling |

Copy them **exactly**. Since Part F is being done last, **these go in at LiTex's current DNS
provider**, not Cloudflare. Write down that you added them — Part F's export checklist depends on
it. (If you ever add them *after* the move instead, they go under **DNS** → **Records**, with the
MX record set to **DNS only (grey cloud)**, never proxied.)

- [ ] **D6.** Wait. **Usually under 15 minutes; occasionally up to 72 hours.** The domain shows **Verified** when done.
- [ ] **D7.** Go to **API Keys** → **Create API Key**, with **sending** permission. Copy it — **shown once**.
- [ ] **D8.** After verification succeeds, add a **DMARC** record. Resend links its own guide; this protects the domain from being spoofed.

> **Until D6 says Verified, every submission takes the stored-but-undelivered path.** That is the
> design working, not a bug: the enquiry is written to KV first, and the visitor is told honestly
> that it is queued and given the direct address. But it means **somebody must watch the KV
> namespace** between first deploy and verification, or a real enquiry sits there unread.

---

## Part E — Wire the secrets into Pages

- [x] **E1.** **Workers & Pages** → **litex-website** → **Settings** → **Variables and Secrets**. (Older dashboards label this **Environment variables** — same place.)
- [x] **E2.** Add all four. Use **Encrypt** on the two marked secret:

| Name | Value | Encrypt? |
|---|---|---|
| `TURNSTILE_SECRET` | the secret key from C3 | **Yes** |
| `RESEND_API_KEY` | the key from D7 | **Yes** |
| `ENQUIRY_TO` | `sales@litex.com.tw` | No |
| `ENQUIRY_FROM` | your choice from decision 1, e.g. `LiTex Website <website@send.litex.com.tw>` | No |

- [x] **E3.** Set them for **Production and Preview** both.
- [x] **E4.** **Redeploy.** Bindings and variables only take effect on a new deployment — Deployments → the latest one → **Retry deployment**.

---

## Part F — The custom domain ⚠ do this deliberately, on its own day

`litex.com.tw` is an **apex domain**, so Cloudflare requires the whole domain to become a Cloudflare
zone: you change the nameservers at your registrar, and Cloudflare takes over **all** of its DNS.

> ### ⚠ This step can break LiTex's company email
>
> `sales@litex.com.tw` is delivered by MX records that live in your current DNS. When nameservers
> move, **any record you did not copy across stops existing.** Losing the MX records means inbound
> mail to LiTex silently stops — including every enquiry this whole project exists to generate.
>
> **Before changing nameservers:** export or screenshot **every** existing DNS record. Cloudflare's
> scan imports most automatically, but verify each one by eye afterwards. Do not rely on the scan.
>
> **The export checklist — tick every line:**
>
> - [ ] **MX** records for `litex.com.tw` (inbound mail to `sales@`) — the critical ones
> - [ ] **SPF** (TXT) for the root domain
> - [ ] **The three Resend records for `send.litex.com.tw` from Part D** — SPF (TXT), DKIM (TXT), return-path (MX). ⚠ Easy to miss, because they are on a subdomain and were added months earlier. Drop them and enquiry delivery stops silently while the site keeps accepting and storing submissions.
> - [ ] Any **DKIM/DMARC** records for the root domain
> - [ ] Any **A / CNAME** records (the old site, webmail, anything else)
> - [ ] Any **mail-provider or SaaS verification** TXT records

- [ ] **F1.** Add `litex.com.tw` as a site in Cloudflare (**Add a site**), let it scan existing DNS.
- [ ] **F2.** **Compare the imported records against your export, line by line.** Fix any gaps *before* step F3.
- [ ] **F3.** Change the nameservers at your registrar to the two Cloudflare gives you. Propagation is usually minutes to a few hours.
- [ ] **F4.** Send yourself a test email at `sales@litex.com.tw` **and confirm it arrives** before doing anything else.
- [ ] **F5.** **Workers & Pages** → your project → **Custom domains** → **Set up a domain** → enter `litex.com.tw` → **Continue**. Cloudflare creates the CNAME itself. Do not hand-create it.

---

## Part G — Web Analytics (a decision for me, after F)

Cloudflare Web Analytics is cookieless, which is why spec §4 chose it — no consent banner, which
matters for EU buyers.

Once the site is proxied through Cloudflare, **automatic injection is the default**: Cloudflare
inserts the beacon for you, with no code change. **I recommend switching it to the manual JS
snippet instead** (**Web Analytics** → **Add a site** → **Manage site**), for a reason specific to
this repo: `tests/legal.test.ts` enforces that every third-party resource on the site is on an
explicit allowlist and disclosed on `/legal/privacy/`. An automatically injected beacon is invisible
to that guard — the privacy notice could silently become untrue. A manual snippet keeps the
guarantee mechanical.

Don't do anything here yet. Tell me when you reach this point and Plan 8 will add the snippet, the
allowlist entry and the privacy-page disclosure in one commit.

---

## Part H — Smoke test, once E4 has redeployed

Do all five. Items 4 and 5 are the ones worth the effort — the happy path is the easy half.

- [ ] **H1.** Submit `/contact/` with JavaScript on → redirects to `/enquiry-sent/`, no queued-delivery note.
- [ ] **H2.** Submit `/request-a-sample/` → a second KV record appears (**Storage & Databases** → **KV** → `litex-enquiries` → the records list), and a second email arrives at `sales@litex.com.tw` with the submitter's address as **Reply-To**.
- [ ] **H3.** Disable JavaScript in devtools, submit again → still works, via a native form POST.
- [ ] **H4.** **Force a failure:** temporarily corrupt `RESEND_API_KEY`, redeploy, submit. Expect a KV record **still written**, a redirect to `/enquiry-sent/?delivery=pending`, and the queued-delivery note naming `sales@litex.com.tw`. **It must not read as success.** Restore the key and redeploy.
- [ ] **H5.** **Honeypot:** in devtools, put text in the hidden `website` input and submit. Expect a normal-looking success, **no KV record**, and no Resend send.

Then open the two records from H1 and H2 and confirm they contain **no IP address**. The code is
tested for this, but it is the sort of promise worth seeing once with your own eyes, because
`/legal/privacy/` states it publicly.

---

## When you're done, tell me

Send me:

1. The **Turnstile sitekey** (safe to share — it is public).
2. The **`*.pages.dev` URL**.
3. Whether Resend's domain shows **Verified** yet.

Then Plan 8 gets written against real bindings, and its verification steps can hit the live site
instead of a mock. **Do not send me either secret key or the API key.**

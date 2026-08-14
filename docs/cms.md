# The content editor at `/admin`

Sveltia CMS, vendored into the build. It edits the three content collections — products,
applications and news — in a browser, and every save becomes a pull request.

Built by Plan 9 (`docs/superpowers/plans/2026-08-14-litex-cms-and-grade-cta.md`).

---

## 1. Signing in

1. Go to **`/admin`** on the deployed site.
2. Choose **Sign In with Token**.
3. Follow the link to GitHub. The scopes are pre-selected; create the token.
4. Paste it back into the CMS.

The token is stored in that browser's local storage. Signing in on another machine means
creating another token.

> ⚠ **There is no OAuth application and no auth backend.** Earlier scoping notes in
> `HANDOFF.md` said this needed a second Cloudflare deployable — a `sveltia-cms-auth`
> worker — and described it as the reason the CMS was deferred out of Plan 8. That was
> written before anyone checked, and it is wrong. Sveltia signs in with a personal access
> token. **If you go looking for an auth service, there is nothing to find.**

## 2. Access is repository write access

There are no CMS accounts, no invitations and no roles. Anyone with **write access to
`darsonl/litex-website`** can edit; nobody else can. Granting access is a GitHub
collaborator change, and so is revoking it.

## 3. Saving opens a pull request

The CMS runs in **Editorial Workflow** (`publish_mode: editorial_workflow`), so a save
never commits to `main`. It opens a pull request, and Cloudflare Pages builds it.

**That build is the real validation.** The reason is in §4: the CMS can check that a field
is filled in and matches a pattern, but it cannot check the rules that span fields. Those
live in the zod schemas and only run at build time.

> **A red check on the PR means the entry is invalid. Read the build log; do not merge.**
> The failure message names the field and says what is wrong with it — those messages are
> written for this moment.

## 4. What the CMS deliberately cannot do

### Images

There is no image widget, no file widget and no media folder, anywhere in `config.yml`.
`tests/cms.test.ts` fails if one appears.

Every raster on this site needs an entry in the relevant `src/assets/*/provenance.json`,
traced to a source in `archive/`, declared `aiGenerated: false` — and `tests/imagery.test.ts`
enforces a Tier 3 real-photography rule on product, company and technology pages. Nothing
uploaded through a browser can satisfy any of that. **Imagery is a code-review path**, and
offering the widget would only let an editor produce a commit that fails the build with no
idea why.

⚠ **A consequence worth knowing.** Because the CMS has no `heroImage` field, the open
question is what its serializer does with front matter it has no field for. If it drops
unknown keys, saving a product through the CMS would silently cost that product its
photograph — `heroImage` is `.optional()` in `src/schemas/product.ts`, so the entry would
still validate and the build would still pass. `tests/cms.test.ts` therefore requires every
product entry to have one, which turns that into a red check on the PR. **If that test ever
fails after a CMS edit, this is why.**

### Cross-field rules

These are in `src/schemas/*.ts` as zod `superRefine` rules, and no YAML config can express
them:

| Rule | Where |
|---|---|
| A `specTable` requires a `sourceNote` naming the document its figures came from | `product.ts` |
| A `heroImage` may not be AI generated | `product.ts` |
| Alt text may not merely repeat the product name | `product.ts` |
| `publishedAt` must be a **real calendar date** — the regex admits `2018-02-31`, which `Date.parse` silently rolls forward to March 3 | `news.ts` |

The CMS lets you save all of these. The build rejects them.

### `publishedAt` is a text field on purpose

It looks like it wants a date picker. It must not have one.

`src/schemas/news.ts` requires a **string** matching `STORED` in `src/lib/dates.ts`. YAML
parses an unquoted `2017-02-23T14:47:55+08:00` into a `Date`, and a `Date` has already
thrown away the `+08:00` offset — which is the exact failure the whole date layer exists to
prevent. A `datetime` widget invites the CMS to write that value.

So the field is a `string` widget carrying the same regex, and `tests/cms.test.ts` fails if
the two ever drift apart.

## 5. Adding a field

Edit **both**:

1. the zod schema in `src/schemas/`, and
2. `public/admin/config.yml`.

`tests/cms.test.ts` catches a field removed from the config. **It cannot catch one you added
to zod and forgot to add here** — that shows up only as a CMS that silently cannot edit
something. This is the one gap Plan 9 accepted rather than closed.

## 6. The bundle is vendored, never loaded from a CDN

`scripts/sync-cms.mjs` copies `@sveltia/cms`'s bundle out of `node_modules` into
`public/admin/` on every `npm run build` and `npm run dev`. `public/admin/sveltia-cms.js` is
gitignored; `package-lock.json` is the versioned record of which version it is.

Sveltia's own documentation says to load it from `unpkg.com`. **Do not.** This site
enumerates its third parties on `/legal/privacy/` and `tests/legal.test.ts` enforces that
list, so a CDN script would either break the guard or quietly make the privacy notice
untrue.

Two details that will bite whoever touches this next:

- **Copy `sveltia-cms.js`, not `sveltia-cms.mjs`.** The package ships both and its `main`
  field names the `.mjs`, so that is what any bundler-shaped instinct reaches for. But
  `public/admin/index.html` loads it with a plain `<script src>`, which parses as a classic
  script — the `.mjs` would die on its first top-level `export`. The `.js` build is the IIFE.
- **The bundle contains a great many third-party hostnames as string literals** —
  `api.github.com`, `cdn.jsdelivr.net`, image-service and AI-provider endpoints — because
  Sveltia supports integrations this site does not use. They are **strings, not import
  statements**, so `tests/legal.test.ts`'s sweep of emitted JS does not flag them, and no
  page of the website loads the bundle at all. It is worth knowing before someone greps the
  build and panics. What an editor's browser contacts while signed in at `/admin` is a
  different question from what a *visitor* contacts, which is what the privacy notice is
  about.

## 7. Deployment

Nothing to configure. `/admin` is three static files under `public/`, copied verbatim into
`dist/` — no binding, no variable, no build setting, no route. It is not an Astro page, so
it is not in the sitemap and it does not change the page count. `robots.txt` disallows it
and the shell carries `noindex`.

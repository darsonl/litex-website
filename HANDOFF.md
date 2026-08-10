# Session handoff — LiTex website redesign

**Written:** 2026-08-10
**Reason:** User restarting Claude Code so impeccable's skills and slash commands register.

---

## ▶ Do this first in the new session

1. **Read the spec:** `docs/superpowers/specs/2026-08-10-litex-website-redesign-design.md`
   — it holds every decision made so far. This file is only the pointer and the state.
2. **Get user approval on the spec** (the brainstorming skill's user-review gate). Section 7,
   the content gaps register, has been written but not yet walked through with the user.
   The spec self-review is already done — see the findings table below; don't redo it.
3. **Then run `/impeccable init`** — deliberately sequenced *after* the spec so its PRODUCT.md
   consumes decisions already made instead of re-running a discovery interview. See "Why after"
   below.
4. **Then invoke `superpowers:writing-plans`** to turn the approved spec into an implementation
   plan. That is the terminal step of brainstorming — do not jump straight to building.

---

## Where we are

Working through `superpowers:brainstorming`. Design sections 1–3 presented and **approved**.
Spec written, committed, and self-reviewed. **Awaiting user approval of the spec** — that is the
gate before implementation planning.

### Brainstorming checklist state

| # | Step | State |
|---|---|---|
| 1 | Explore project context | ✅ done |
| 2 | Ask clarifying questions | ✅ done |
| 3 | Offer visual companion | ✅ done — accepted, used for 4 screens |
| 4 | Propose approaches | ✅ done |
| 5 | Present design sections | ✅ IA, technical architecture and design system approved in conversation (spec §3, §4, §5). Gaps register (spec §7) written, not walked through. |
| 6 | Write design doc | ✅ written and committed (`d77837e`) |
| 7 | Spec self-review | ✅ done — 9 defects found and fixed |
| 8 | User reviews spec | ⬜ **pending — next action** |
| 9 | Invoke `writing-plans` | ⬜ pending |

### Spec self-review findings (all fixed in place)

The review was not a formality — it caught one user-facing bug and two factual errors:

1. **`legacy` colour token failed WCAG AA** (4.19:1 on base, 4.02:1 on the `raised` surface it
   actually renders against). It carries the small `○ LEGACY · SAMPLING ONLY` label. Raised to
   `#7E858A` (5.03:1 on raised). Ratios are now computed, stated for both surfaces, and asserted in CI.
2. **IA tree still listed 4 application pages** after the shortlist was revised to 6 — the revision
   note was added but the tree beneath it was never updated. Automotive and Healthcare routes added.
3. **Legacy URL count was 24 in three places; it is 23**, verified against `archive/README.md`.
4. `copper` and `text-1` contrast figures were both overstated. Corrected.
5. Blog-post arithmetic was wrong (10 posts, not 7 or 5). Page count restated as 27 routes + 7 news.
6. Catalog extraction status was vague and inaccurate — now a table; **RFID text extraction is the
   priority**, since it is the only source for a route that has no content behind it.
7. One cross-reference pointed at §6 instead of §7.

---

## Decisions locked in (do not relitigate)

| Topic | Decision |
|---|---|
| Goals | Qualified inquiries **+** findability/credibility **+** technical self-serve reference — all three |
| Platform | New static site + own domain (**not** WordPress) |
| Content sourcing | Only what exists on the current site today; everything else → gaps register |
| IA | **Dual-entry** — products ↔ applications, cross-linked |
| Scope | **Full expansion** — 28 pages |
| Maintenance | Git-backed CMS (Sveltia) at `/admin` |
| Visual direction | **"Technical Instrument"** — dark, data-forward, copper accent |
| Typography | **Archivo + IBM Plex Mono** (Inter rejected — see below) |
| Applications | 4 evidenced ones only; automotive + medical excluded pending confirmation |
| Language | English at launch, i18n-ready |
| Stack | Astro · Cloudflare Pages · Pages Function forms + Turnstile + KV · Cloudflare Web Analytics |

---

## impeccable

Installed this session via `npx impeccable install` → `.claude/skills/impeccable/`.
v3.5.0, Apache-2.0, by Paul Bakaus, `github.com/pbakaus/impeccable`.

- **Hooks are live** in `.claude/settings.local.json`: fast detector pass after
  `Edit|Write|MultiEdit`, deeper pass on `Stop`.
- **It already changed a decision.** Running the detector on the mockups flagged
  `overused-font: Inter` (7 instances). Correct critique — Inter was reflexive, not chosen.
  Replaced with **Archivo + IBM Plex Mono**, confirmed by the user.
- **Run the detector directly** (works without slash commands):
  ```
  node .claude/skills/impeccable/scripts/detect.mjs <file-or-dir-or-url>
  ```
- **Commands worth using later:** `audit` (a11y/perf gate in spec §4), `harden` (form edge cases),
  `adapt` (mobile), `clarify` (UX copy on the sample-request flow), `critique`, `live`.

### Why `/impeccable init` runs *after* the spec

`init` runs a multi-round discovery interview and writes `PRODUCT.md` (users, brand, principles),
which every other impeccable command then reads. Nearly all of that ground is already covered by
the spec. Running it after means it can absorb settled decisions instead of asking the user to
re-answer questions from this session.

---

## The original site is archived — do not re-fetch it

`archive/` holds a complete local copy captured 2026-08-10:

- `archive/pages/` — all 23 HTML pages
- `archive/catalogs/` — all 6 PDFs (11 MB) + `.txt` extractions
- `archive/images/` — all 46 images (29 MB)
- **`archive/extracted-from-images.md`** — the payload: spec tables, patents and feature lists
  transcribed out of JPGs into plain text
- `archive/README.md` — filename → original URL map, capture method

**This archive changed a decision.** `applications.jpg` and `cmy-applications.jpg` show LiTex
claiming **Automotive** and **Healthcare** applications — which had been excluded from the spec
as unevidenced. The evidence was inside a JPG. Spec §3 has been corrected: the shortlist is now
**six** applications, with Architecture, Agriculture and Loudspeaker coil-cords held pending
detail from LiTex.

**Still un-transcribed:** two catalogs are image-only PDFs with no text layer
(`2018-company-introduction.pdf`, `2018-wired-conductive-tape.pdf`) and need OCR or vision
reading. Three more have `.txt` extractions not yet folded into
`extracted-from-images.md` — including **`2018-rfid-textile-tape.pdf`, the only source for the
new RFID product page**.

## Environment notes

- **Git repo exists.** Initialised with `.gitignore` + `.gitattributes`; spec and full archive
  committed as `d77837e`.
- **Visual companion** was running on `http://localhost:51079` — it dies with the session restart.
  Mockups persist at `.superpowers/brainstorm/1097-1786371119/content/`:
  `visual-direction.html`, `information-architecture.html`, `design-system.html`, `typography.html`.
  Restart with:
  ```
  "C:/Users/Darson/.claude/plugins/cache/claude-plugins-official/superpowers/6.2.0/skills/brainstorming/scripts/start-server.sh" --project-dir "C:/Users/Darson/Projects/litex-website" --open
  ```
- **PDF extraction works** via `pdftotext -layout` (present at `/mingw64/bin/pdftotext`).
  `pypdf` is installed; `pdfplumber` is not. Only the heating-textile catalog has been extracted
  so far — five catalogs remain.

---

## Immediate risks to keep visible

1. **No real email address exists anywhere on the current LiTex site.** Cannot ship without one.
2. **Contact page carries theme placeholder data** — a fake US address, `mail@example.com`,
   `(555) 555 1234`. Needs confirming as boilerplate and removing.
3. **301s from `litextextile.wordpress.com` need WordPress.com's paid Site Redirect upgrade.**
   Free plan cannot do it. Without it the migration forfeits all existing search ranking.
   This is outside anything buildable here and must be arranged at cutover.

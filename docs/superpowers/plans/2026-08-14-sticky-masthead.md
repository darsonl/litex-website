# Sticky Masthead Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the masthead at the top of the viewport while the page scrolls, at the widths where it is a single compact row, with no JavaScript.

**Architecture:** Three CSS additions and nothing else. `position: sticky` inside a `min-width: 56.25rem` media query; a drop shadow driven by a scroll-driven animation behind an `@supports` guard; and `scroll-padding-top` on `html` so the skip link's `#main` target does not land underneath the stuck header. All behaviour is measured in a real browser by `tests/responsive.test.ts`, which already drives Chromium through Playwright.

**Tech Stack:** Astro 7.2.0 (static), plain CSS in `SiteNav.astro`'s scoped `<style>` and `src/styles/global.css`, vitest 4.1.10 + playwright 1.62.1.

**Spec:** `docs/superpowers/specs/2026-08-14-sticky-masthead-design.md`

## Global Constraints

Every task's requirements implicitly include this section.

- **The breakpoint is `56.25rem` (900px), and it is a measurement, not a preference.** The seven-link row wraps to two rows from 40rem to 55rem: the masthead is **111.59px** there and **64.00px** at 900px and above. Measured in Chromium against the built site, 2026-08-14.
- **No JavaScript.** This site ships JS only for the two enquiry forms and the sample-form prefill. Nothing in this plan adds a script, and the Firefox shadow gap is not to be closed with one.
- **Never add an `overflow` rule to `html`, `body` or any wrapper around the masthead.** `position: sticky` stops working silently if any ancestor has one. None does today — verified across `global.css` and `BaseLayout.astro`.
- **Nothing below 56.25rem may change.** The phone masthead's 96px guard in `tests/responsive.test.ts` must keep passing untouched; it protects session 11's reduction from 153.59px to 77.00px.
- **`npm run build` is `node scripts/sync-catalogs.mjs && node scripts/sync-cms.mjs && astro build`.** Never `npx astro build`.
- **Run `npx playwright install chromium` once** on a fresh checkout or the suite fails with a missing-executable error rather than a test failure.
- **The tests read `dist/`, so `npm run build` must run before `npm test`.** Every assertion in this plan is against the built site.
- **Branch before committing. Never commit to `main`.**
- **Baseline to preserve:** `npm run build` → **36 pages**. `npm test` → **426 passing across 26 files**. `npm run test:a11y` → **11 passing**. Detector clean. This plan adds 10 tests, ending at **436 across 26 files** — no new test file.

## File Structure

| File | Responsibility |
|---|---|
| `src/components/SiteNav.astro` | **Modify.** The sticky rule and the shadow animation, appended to the existing scoped `<style>`. |
| `src/styles/global.css` | **Modify.** `scroll-padding-top` on `html`, so anchors clear the stuck masthead. |
| `tests/responsive.test.ts` | **Modify.** Two new viewport constants and three new `describe` blocks. |

No new files. The nav's styles are scoped to its component and stay there; only the anchor offset is global, because it applies to the scroll container rather than to the masthead.

---

## Task 1: Stick the masthead, and pin the premise of the breakpoint

The breakpoint's whole justification is that the masthead is one 64px row at 900px and two rows below. That premise is what the first test guards — if it stops being true, sticking becomes a bad idea and every other assertion here would still pass.

**Files:**
- Modify: `src/components/SiteNav.astro` (end of the `<style>` block), `tests/responsive.test.ts`
- Test: `tests/responsive.test.ts`

**Interfaces:**
- Consumes: the existing `open(viewport, javaScriptEnabled?)` helper in `tests/responsive.test.ts`, which opens `/` against a static server over `dist/` and returns `{ context, page }`. The caller must `await context.close()`.
- Produces: two exported-in-file constants `STICKY` and `WRAPPED` that Tasks 2 and 3 both use.

- [ ] **Step 1: Add the viewport constants**

In `tests/responsive.test.ts`, directly beneath the existing `DESKTOP` constant:

```typescript
/**
 * 900px is the measured width at which the seven-link row stops wrapping — the masthead
 * is 64.00px here and 111.59px at 880px. The sticky breakpoint is set to exactly this,
 * so this viewport is the boundary case and not a comfortable margin.
 */
const STICKY = { width: 900, height: 900 };
/** The widest width where the nav still wraps to two rows, so must NOT stick. */
const WRAPPED = { width: 880, height: 900 };
```

- [ ] **Step 2: Write the failing tests**

Append to `tests/responsive.test.ts`:

```typescript
describe('the masthead sticks, but only once it is a single row', () => {
  const positionAt = async (viewport: { width: number; height: number }) => {
    const { context, page } = await open(viewport);
    const position = await page.evaluate(
      () => getComputedStyle(document.querySelector('header[data-masthead]')!).position,
    );
    await context.close();
    return position;
  };

  /**
   * The load-bearing assertion of this whole feature.
   *
   * 56.25rem is not a round number chosen for taste. It is the measured width at which
   * seven links stop wrapping: 111.59px at 880px, 64.00px at 900px. Add an eighth nav
   * item or lengthen a label and the wrap point moves past the breakpoint — at which
   * point the site would stick a 111.59px header, a seventh of an 800px window, on every
   * laptop, and every other test here would still be green.
   *
   * ⚠ If this fails, re-measure the width at which the row stops wrapping and move the
   * breakpoint in SiteNav.astro to match. Do NOT raise this number.
   */
  it('is a single row at the breakpoint where it starts sticking', async () => {
    const { context, page } = await open(STICKY);
    const height = await page.evaluate(
      () => document.querySelector('header[data-masthead]')!.getBoundingClientRect().height,
    );
    await context.close();
    expect(height, 'the nav is wrapping at the sticky breakpoint').toBeLessThanOrEqual(72);
  });

  it('sticks at the breakpoint', async () => {
    expect(await positionAt(STICKY)).toBe('sticky');
  });

  // Computed style alone is not proof: an overflow rule on any ancestor leaves
  // position:sticky computing as 'sticky' while the element scrolls away regardless.
  // Only a real scroll can tell the difference.
  it('actually stays at the top when the page scrolls', async () => {
    const { context, page } = await open(STICKY);
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
    await page.waitForFunction(() => window.scrollY === 600);
    const { top, scrollY } = await page.evaluate(() => ({
      top: document.querySelector('header[data-masthead]')!.getBoundingClientRect().top,
      scrollY: window.scrollY,
    }));
    await context.close();

    expect(scrollY, 'the page did not scroll, so this proves nothing').toBe(600);
    expect(top, 'the masthead scrolled away with the page').toBeCloseTo(0, 0);
  });

  it('does not stick where the nav still wraps to two rows', async () => {
    expect(await positionAt(WRAPPED), 'a 111.59px header is being pinned to the viewport')
      .not.toBe('sticky');
  });

  // Phones keep every pixel of session 11's reduction from 153.59px to 77.00px.
  it('does not stick on a phone', async () => {
    expect(await positionAt(PHONE), 'the phone fold is being spent on a stuck masthead')
      .not.toBe('sticky');
  });
});
```

- [ ] **Step 3: Run the tests and watch them fail**

```bash
npm run build && npx vitest run tests/responsive.test.ts
```

Expected: 2 failed — `sticks at the breakpoint` (computed position is `relative`) and `actually stays at the top` (top is `-600`). The other three pass already, because nothing sticks yet; they are guards against regression, not drivers.

- [ ] **Step 4: Add the sticky rule**

In `src/components/SiteNav.astro`, at the **end** of the `<style>` block, after the closing brace of the existing `@media (min-width: 40rem)` block:

```css
  /* ---- 56.25rem and up: the row stays with the reader ---- */

  /* The breakpoint is measured, not chosen. The seven-link row wraps to two rows from
     40rem to 55rem — 111.59px, a seventh of an 800px window — and only fits on one line
     at 900px, where the masthead is 64.00px. So the masthead sticks only where sticking
     is cheap; below this it scrolls away exactly as it always has.

     Overriding position here is safe: the `relative` above exists to be the containing
     block for the phone menu panel, and at 40rem and up that panel is already `static`
     and its control `display: none`. Nothing above this breakpoint is absolutely
     positioned against the masthead.

     ⚠ position:sticky is defeated by an `overflow` value on ANY ancestor. There is none
     today on html, body or any wrapper — adding one would un-stick this silently, which
     is why tests/responsive.test.ts scrolls the page rather than reading the computed
     position. */
  @media (min-width: 56.25rem) {
    .masthead { position: sticky; top: 0; z-index: 10; }
  }
```

- [ ] **Step 5: Run the tests and watch them pass**

```bash
npm run build && npx vitest run tests/responsive.test.ts
```

Expected: all pass, including the pre-existing `does not spend a fifth of the fold on navigation`.

- [ ] **Step 6: Prove the premise guard is not vacuous**

The single-row assertion is the one this task exists to protect. Prove it fires:

Back the file up before touching it, so the revert is a copy rather than an edit you have
to get right — at this point the new rule is not yet committed, so `git checkout --` would
throw the feature away with the probe.

```bash
cp src/components/SiteNav.astro /tmp/SiteNav.astro.bak

# Lower the breakpoint into the wrapping band, where the masthead is 111.59px.
sed -i 's/min-width: 56\.25rem/min-width: 40rem/' src/components/SiteNav.astro
npm run build && npx vitest run tests/responsive.test.ts
```

Expected: FAIL on `does not stick where the nav still wraps to two rows`, with the message
`a 111.59px header is being pinned to the viewport`.

Now restore and confirm the tree is exactly as it was:

```bash
cp /tmp/SiteNav.astro.bak src/components/SiteNav.astro
git diff --stat src/components/SiteNav.astro   # the new block only, insertions only
grep -c 'min-width: 56\.25rem' src/components/SiteNav.astro   # must be 1
npm run build && npx vitest run tests/responsive.test.ts
```

Expected: all pass again.

- [ ] **Step 7: Run the whole suite**

```bash
npm test
```

Expected: **431 passing across 26 files** (426 + 5).

- [ ] **Step 8: Commit**

```bash
git checkout -b feat/sticky-masthead
git add src/components/SiteNav.astro tests/responsive.test.ts
git commit -m "feat: keep the masthead at the top once it is a single row

The breakpoint is a measurement, not a preference. The seven-link row wraps to
two rows from 40rem to 55rem — 111.59px, a seventh of an 800px window — and only
fits on one line at 900px, where the masthead is 64.00px. Sticking at the site's
usual 40rem would have pinned the tall version across every tablet and small
laptop, so it sticks only where sticking is cheap.

Phones are untouched and keep session 11's reduction to 77.00px.

The scroll assertion scrolls the page rather than reading computed style: an
overflow rule on any ancestor leaves position computing as sticky while the
element scrolls away regardless."
```

---

## Task 2: The shadow, once the page has scrolled

The masthead's opaque background and 1px rule already separate it from content. The shadow is the acknowledgement that content is passing underneath, and it is the only part of this feature that needs to know the page has scrolled.

**Files:**
- Modify: `src/components/SiteNav.astro` (end of the `<style>` block), `tests/responsive.test.ts`
- Test: `tests/responsive.test.ts`

**Interfaces:**
- Consumes: `STICKY` from Task 1, and the sticky rule it added.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Write the failing test**

Append to `tests/responsive.test.ts`:

```typescript
describe('the stuck masthead acknowledges content passing under it', () => {
  const shadowAfterScrolling = async (px: number) => {
    const { context, page } = await open(STICKY);

    // Without this the two assertions below are vacuous in any engine that cannot run
    // scroll-driven animations: box-shadow would read 'none' at rest AND after
    // scrolling, and only the resting assertion would pass — quietly, for the wrong
    // reason. Playwright drives Chromium, which supports them.
    const supported = await page.evaluate(() =>
      CSS.supports('animation-timeline', 'scroll()'),
    );

    if (px > 0) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), px);
      await page.waitForFunction((y) => window.scrollY === y, px);
    }
    const shadow = await page.evaluate(
      () => getComputedStyle(document.querySelector('header[data-masthead]')!).boxShadow,
    );
    await context.close();
    return { shadow, supported };
  };

  it('casts no shadow at the top of the page, where nothing is beneath it', async () => {
    const { shadow, supported } = await shadowAfterScrolling(0);
    expect(supported, 'this engine cannot run scroll-driven animations').toBe(true);
    expect(shadow, 'the masthead is shadowed before anything has scrolled under it')
      .toBe('none');
  });

  it('lifts once the page has scrolled', async () => {
    const { shadow, supported } = await shadowAfterScrolling(600);
    expect(supported, 'this engine cannot run scroll-driven animations').toBe(true);
    expect(shadow, 'the masthead never lifts, so scrolled content runs into it')
      .not.toBe('none');
  });
});
```

- [ ] **Step 2: Run the test and watch it fail**

```bash
npm run build && npx vitest run tests/responsive.test.ts
```

Expected: FAIL on `lifts once the page has scrolled` — `box-shadow` is still `none` after scrolling. The resting test passes already.

- [ ] **Step 3: Add the animation**

In `src/components/SiteNav.astro`, at the **end** of the `<style>` block, after the sticky rule from Task 1:

```css
  /* The shadow is the only part of this that needs to know the page has scrolled, and a
     scroll-driven animation is how it finds out without shipping JavaScript.

     Guarded because support is not universal: Chrome/Edge 115+ and Safari 26+ have it,
     but Firefox stable still keeps it behind layout.css.scroll-driven-animations.enabled
     as of Firefox 152 (June 2026) — roughly 83% of visitors. Where it is absent the
     animation simply never runs and the masthead keeps the opaque background and 1px
     rule it already has, which separates it from content perfectly well. That degraded
     state is a good design, not a broken one.

     ⚠ Do not "fix" Firefox with a script. It would be the first JavaScript this site
     ships for chrome rather than for the enquiry forms, and it would buy a decoration. */
  @supports (animation-timeline: scroll()) {
    @media (min-width: 56.25rem) {
      .masthead {
        animation: masthead-lift linear both;
        animation-timeline: scroll();
        /* Fades in over the first 64px of scroll rather than snapping on at 1px, which
           is what makes this read as a lift instead of a flicker. */
        animation-range: 0 4rem;
      }
    }
  }
  @keyframes masthead-lift {
    to { box-shadow: 0 1px 12px rgb(0 0 0 / 0.45); }
  }
```

- [ ] **Step 4: Run the test and watch it pass**

```bash
npm run build && npx vitest run tests/responsive.test.ts
```

Expected: all pass.

- [ ] **Step 5: Confirm it stays off below the breakpoint**

The `@media` sits inside the `@supports`, so the animation should not run on a phone at all. Check by hand rather than assuming:

```bash
npm run build && npx astro preview --port 4321
```

At 390px wide, scroll the homepage and confirm the masthead scrolls away with no shadow. Then stop the server with `npx astro preview stop`.

- [ ] **Step 6: Run the whole suite**

```bash
npm test
```

Expected: **433 passing across 26 files** (431 + 2).

- [ ] **Step 7: Commit**

```bash
git add src/components/SiteNav.astro tests/responsive.test.ts
git commit -m "feat: lift the stuck masthead once content scrolls under it

A scroll-driven animation, so the shadow needs no JavaScript to know the page
has scrolled. Behind @supports: Chrome/Edge 115+ and Safari 26+ have it, Firefox
stable still has it behind a flag as of 152, about 83% of visitors. Where it is
absent the masthead keeps its opaque background and 1px rule, which is the
treatment it would have had anyway — the fallback is a design, not a gap.

The tests assert CSS.supports first. Without that they would both pass in an
engine with no support, because box-shadow reads 'none' at rest and after
scrolling alike."
```

---

## Task 3: Keep the skip link's target out from under the header

The one accessibility consequence of a sticky header, and the only in-page anchor on the site is the skip link's.

**Files:**
- Modify: `src/styles/global.css`, `tests/responsive.test.ts`
- Test: `tests/responsive.test.ts`

**Interfaces:**
- Consumes: `STICKY` and `PHONE` from Task 1 and the existing constants.
- Produces: nothing.

- [ ] **Step 1: Write the failing test**

Append to `tests/responsive.test.ts`:

```typescript
describe('anchors clear the stuck masthead', () => {
  // #main is the skip link's target and the only in-page anchor on the whole site.
  // Without an offset it scrolls to y=0, which is exactly where the stuck masthead now
  // is — so the visitor who most needs the skip link lands on content hidden behind it.
  it('lands #main below the masthead, not underneath it', async () => {
    const { context, page } = await open(STICKY);

    // ⚠ Scroll away FIRST. At the top of the page #main already sits just below the
    // masthead, so activating the anchor there scrolls to a negative offset, clamps to
    // 0, and moves nothing — and the assertion below would hold with or without the fix.
    // Jumping back from 1200px is what makes this discriminating: with the offset the
    // page lands at 0 and #main clears the header; without it the page lands with #main
    // at y=0, behind the header.
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }));
    await page.waitForFunction(() => window.scrollY === 1200);

    await page.evaluate(() => { window.location.hash = 'main'; });
    await page.waitForFunction(() => window.scrollY !== 1200);

    const { mainTop, mastheadBottom } = await page.evaluate(() => ({
      mainTop: document.querySelector('#main')!.getBoundingClientRect().top,
      mastheadBottom: document
        .querySelector('header[data-masthead]')!
        .getBoundingClientRect().bottom,
    }));
    await context.close();

    expect(mainTop, 'the skip link lands the reader behind the masthead')
      .toBeGreaterThanOrEqual(mastheadBottom);
  });

  it('reserves at least the masthead height', async () => {
    const { context, page } = await open(STICKY);
    const { pad, height } = await page.evaluate(() => ({
      pad: parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop),
      height: document.querySelector('header[data-masthead]')!.getBoundingClientRect().height,
    }));
    await context.close();

    expect(pad, `scroll-padding-top is ${pad}px against a ${height}px masthead`)
      .toBeGreaterThanOrEqual(height);
  });

  // Phones have no stuck masthead, so an offset there would push content down for no
  // reason. The rule must be inside the same media query as the sticking.
  it('adds no offset where nothing sticks', async () => {
    const { context, page } = await open(PHONE);
    const pad = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollPaddingTop,
    );
    await context.close();

    expect(pad, 'anchors are being offset on a phone, where nothing sticks').toBe('auto');
  });
});
```

- [ ] **Step 2: Run the test and watch it fail**

```bash
npm run build && npx vitest run tests/responsive.test.ts
```

Expected: 2 failed — `lands #main below the masthead` (`mainTop` is 0 against a `mastheadBottom` of 64) and `reserves at least the masthead height` (`scroll-padding-top` is `auto`, so `parseFloat` gives `NaN`). The phone test passes already.

- [ ] **Step 3: Add the offset**

In `src/styles/global.css`, beside the other document-level rules near the top of the file:

```css
/* The masthead sticks at 56.25rem and up, so an anchor that scrolls to y=0 lands
   underneath it. #main is the skip link's target and the only in-page anchor on the
   site, which makes this an accessibility fix rather than a cosmetic one: the visitor
   who most needs the skip link is the one it would strand behind the header.

   scroll-padding-top on the scroll container rather than scroll-margin-top on #main, so
   any anchor added later inherits the fix instead of having to remember it. Inside the
   same media query as the sticking — below it nothing sticks, and an offset would push
   content down for no reason. */
@media (min-width: 56.25rem) {
  html { scroll-padding-top: 4.5rem; } /* 72px: the 64px masthead, plus air */
}
```

- [ ] **Step 4: Run the test and watch it pass**

```bash
npm run build && npx vitest run tests/responsive.test.ts
```

Expected: all pass.

- [ ] **Step 5: Run the whole suite and the a11y run**

```bash
npm run build && npm test && npm run test:a11y
```

Expected: **436 passing across 26 files**, a11y **11 passing**, build **36 pages**.

- [ ] **Step 6: Check the detector**

```bash
grep -rhoE '[a-zA-Z,;:.]<(span|a|strong|em)\b' dist --include=*.html | sort -u
```

Expected: no output. (Nothing in this plan touches markup, so this is a formality — but it is on the Definition of Done and takes a second.)

- [ ] **Step 7: Commit**

```bash
git add src/styles/global.css tests/responsive.test.ts
git commit -m "fix: keep the skip link's target clear of the stuck masthead

#main is the only in-page anchor on the site and it is the skip link's, so
without an offset the visitor who most needs that link is the one it strands
behind the header.

scroll-padding-top on the scroll container rather than scroll-margin-top on
#main, so a later anchor inherits the fix rather than having to remember it, and
inside the same media query as the sticking so phones are not offset for a
masthead that does not stick."
```

---

## Definition of Done

- [ ] `npm run build` → **36 pages**
- [ ] `npm test` → **436 passing across 26 files**; `npm run test:a11y` → **11 passing**
- [ ] The pre-existing phone guard `does not spend a fifth of the fold on navigation` still passes untouched
- [ ] At 900px and above the masthead stays at the top through a real scroll, and lifts
- [ ] At 880px and below nothing has changed
- [ ] The skip link lands `#main` clear of the masthead
- [ ] Detector clean
- [ ] Checked by eye in a browser at 390px, 880px and 1280px

**Verify each item by running it.** Where a guard is claimed, break it deliberately once and watch it fail — this repo's Definition of Done has meant that since Plan 5, and every plan that skipped it shipped a vacuous test.

---

## Self-Review

**Spec coverage.** Sticking at ≥56.25rem ✅ (Task 1). The measured-breakpoint premise pinned by a test ✅ (Task 1 Step 2, and proved non-vacuous at Step 6). Shadow via scroll-driven animation behind `@supports` ✅ (Task 2). Firefox fallback explicitly nothing ✅ (Task 2 Step 3 comment). `scroll-padding-top` for the skip link ✅ (Task 3). Print unchanged ✅ — no task touches the print block, and `global.css` already hides `header[data-masthead]` on paper. No shrink-on-scroll, no `prefers-reduced-motion` branch, no JavaScript ✅ — none appears in any task. The `overflow` trap ✅ — Global Constraints, the Task 1 CSS comment, and the reason the scroll assertion scrolls rather than reads computed style.

**Placeholder scan.** No "TBD", no "add error handling", no "similar to Task N". Every CSS block and every test is written out in full.

**Two defects found and fixed in review, both of the kind this repo keeps hitting.**

1. **The skip-link test was vacuous as first written.** It activated `#main` from the top of the page — where `#main` already sits below the masthead, so the jump clamps to `scrollY: 0` and moves nothing. `mainTop >= mastheadBottom` would have held **with or without** `scroll-padding-top`, and the guard would have shipped green and meaningless. It now scrolls to 1200px first so the jump is real. This is the same failure mode as the closed-`<details>` measurements at the top of `tests/responsive.test.ts`: an assertion that passes before the feature exists.
2. **Task 1's probe could not be reverted by the command it gave.** The revert `sed` spanned two lines and would silently not match, leaving the breakpoint at 40rem — a probe that quietly becomes the shipped state is worse than no probe. It now backs the file up first and verifies the restore with `git diff --stat` and a `grep -c`. Note `git checkout --` is *not* the right revert there, because at that step the new rule is not yet committed.

**Type consistency.** `STICKY` and `WRAPPED` are declared in Task 1 Step 1 and used under those names in Tasks 1, 2 and 3. `PHONE` and the `open()` helper are pre-existing and used with their real signatures. The masthead is addressed as `header[data-masthead]` throughout, which is the attribute the component emits and the one `global.css`'s print block already targets — not `[data-sitenav]`, which matches nothing. Test counts run 426 → 431 → 433 → 436 consistently.

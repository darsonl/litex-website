# Sticky masthead — design

**Written:** 2026-08-14
**Status:** implemented, merged into `feat/sticky-masthead`
**Scope:** `src/components/SiteNav.astro`, `src/styles/global.css`, `tests/responsive.test.ts`

The masthead stays at the top of the viewport while the page scrolls — but only at widths
where it is a single compact row, and with no JavaScript.

---

## The decision that shaped everything else

The obvious implementation is `position: sticky` under the site's existing `40rem` desktop
breakpoint. **Measurement showed that would be wrong**, and the measurement is the reason
this document exists.

The masthead's height, measured in Chromium against the built site on
`/products/conductive-metal-yarn/`:

| Viewport | Masthead height | Why |
|---|---|---|
| 390px | 77.00px | Menu collapsed behind `<details>` |
| 640px (40rem) | **111.59px** | Desktop row of seven links, **wrapped to two rows** |
| 880px (55rem) | **111.59px** | Still wrapped |
| **900px (56.25rem)** | **64.00px** | First width where the row fits |
| 1280px | 64.00px | — |

The seven-link row does not fit on one line until **56.25rem**. Sticking at `40rem` would
pin a 111.59px header — **14% of an 800px-tall window** — across every tablet and small
laptop.

**So the rule is: the masthead sticks only when it is a single 64px row.** That is
`min-width: 56.25rem`. Below it, nothing changes anywhere.

This also protects the fold work from session 11, which cut the phone masthead from
153.59px to 77.00px specifically to reclaim above-the-fold space. Phones keep every pixel
of that; they are nowhere near the sticky breakpoint.

## Behaviour

| Width | Masthead | Scrolled state |
|---|---|---|
| < 56.25rem | Unchanged — scrolls away with the page | — |
| ≥ 56.25rem | Sticks to the top of the viewport | Gains a drop shadow once the page has scrolled ~4rem |

The wordmark and all seven links stay visible while stuck. Nothing shrinks, condenses or
re-lays-out: the stuck masthead is the same 64px row as the resting one.

## Implementation

### 1. Sticking — `src/components/SiteNav.astro`

```css
@media (min-width: 56.25rem) {
  .masthead { position: sticky; top: 0; z-index: 10; }
}
```

`.masthead` currently carries `position: relative`, which exists to be the containing
block for the phone menu panel. **Overriding it at this breakpoint is safe**, verified
against the component: at `≥40rem` the panel is already set to `position: static` and the
`<summary>` control is `display: none`, so above `56.25rem` there is no absolutely
positioned descendant left for the masthead to anchor.

`z-index: 10` is insurance rather than necessity — a positioned element already paints
above non-positioned in-flow content, and nothing in `main` is positioned — but it states
the intent instead of depending on that.

**`position: sticky` requires no ancestor to be a genuine scroll container** — which is a
narrower condition than "no ancestor has an `overflow` value." Measured in Chromium at
900px, scrolled to 600px: `overflow-x: hidden` on `html`, `overflow-x: clip` on `body`,
and `overflow: clip` on `html` all leave the masthead stuck, because overflow on `html`
and `body` propagates to the viewport rather than creating a scroll container there.
What actually un-sticks it is making `body` a genuine non-propagating scroll container —
e.g. `html { overflow: auto } body { overflow: hidden }` — which produces `top: -600`.
Verified: neither `global.css` nor `BaseLayout.astro` does this today. The one
`overflow-x: auto` in the codebase is `SpecTable`'s `.scroll`, a descendant of `main` and
therefore not an ancestor of the masthead. **Do not add a rule that makes `html` or
`body` a scroll container without re-checking this** — it would silently un-stick the
header with no test failure in any assertion that only reads computed style, which is why
`tests/responsive.test.ts` scrolls the page for real rather than reading `position` alone.

### 2. The shadow

```css
@supports (animation-timeline: scroll()) {
  @media (min-width: 56.25rem) {
    .masthead {
      animation-name: masthead-lift;
      animation-timing-function: linear;
      animation-fill-mode: forwards;
      animation-timeline: scroll();
      animation-range: 1px 4rem;
    }
  }
}
@keyframes masthead-lift {
  from { box-shadow: none; }
  to { box-shadow: 0 1px 12px rgb(0 0 0 / 0.45); }
}
```

**⚠ This is the corrected CSS. The original version of this spec specified the `animation`
shorthand with `animation-range: 0 4rem` and `fill-mode: both`, and it was wrong on both
counts — neither failure is loud:**

1. **The `animation` shorthand.** This build's minifier (lightningcss, via Vite) folds a
   standalone `animation-timeline: scroll()` back INTO the `animation` shorthand whenever
   one is present, and Chromium's parser does not accept `scroll()` inside that shorthand
   — so it discards the whole merged declaration and the masthead never animates at all,
   with nothing in the build complaining. Longhand-only (`animation-name`,
   `-timing-function`, `-fill-mode`, `-timeline`, `-range`, all separate) gives the
   minifier nothing to fold, so it survives the build unmerged. Verified in
   `dist/_astro/*.css` after each build.
2. **`animation-range: 0 4rem` with `fill-mode: both`.** At scroll 0 with a range starting
   at 0, the animation is already inside its active phase, and Chromium reports the
   interpolated progress-0 box-shadow as an explicit transparent shadow
   (`rgba(0, 0, 0, 0) 0px 0px 0px 0px`) rather than the literal `none` this feature's own
   tests assert on. `animation-range: 1px 4rem` with `fill-mode: forwards` (not `both`)
   puts scroll 0 in the animation's *before* phase, where `forwards` fill applies no
   effect, so `box-shadow` falls through to its true un-animated value, `none`. The
   one-pixel shift is invisible and the fade still spans essentially the first 64px of
   scroll.

A future reader must not reintroduce the `animation` shorthand here — it looks like a
harmless simplification and silently kills the whole effect.

The shadow is the only part of this feature that needs to know the page has scrolled, and
CSS scroll-driven animations are how it finds out **without shipping JavaScript**.

Support, checked 2026-08-14: **Chrome/Edge 115+, Safari 26+** (landed September 2025).
**Firefox stable still has it behind `layout.css.scroll-driven-animations.enabled`** as of
Firefox 152 (June 2026), though it is an Interop 2026 priority. caniuse puts global support
at **~82.6%**.

**The `@supports` guard is the whole fallback story, and the degraded state is a good
design rather than a broken one.** Where the feature is absent the animation never runs and
the masthead keeps the opaque `--c-base` background and 1px `--c-line` bottom rule it
already has, which separates it from scrolling content perfectly well. A Firefox visitor
gets a sticky masthead with no shadow. Nothing is missing that they could notice.

**Do not "fix" Firefox by adding a script.** That was considered and rejected: it would be
the first JavaScript this site ships for chrome rather than for the two enquiry forms, it
would need its own browser test, and it would buy a decoration.

`animation-range: 1px 4rem` fades the shadow in over the first 64px of scroll rather than
snapping it on at 1px, which is why this reads as a lift rather than a flicker.

### 3. The skip link — `src/styles/global.css`

This is the one correctness problem a sticky header introduces, and it is an accessibility
one.

`#main` is the **only** in-page anchor target on the entire site — the skip link's, present
once on each of the 36 pages. Activating it scrolls `#main` to y=0, which is exactly where
the stuck masthead now is, so the first 64px of the main content would sit underneath it.

```css
@media (min-width: 56.25rem) {
  html { scroll-padding-top: 4.5rem; } /* 72px: the 64px masthead, plus air */
}
```

**`scroll-padding-top` on the scroll container, not `scroll-margin-top` on `#main`.** The
property applies to every scroll-into-view in that container, so an anchor added later
inherits the fix instead of having to remember it.

## Testing

All of this is behaviour under a real viewport, so it belongs in `tests/responsive.test.ts`,
which already drives Chromium via Playwright. Chromium supports scroll-driven animations,
so the shadow is directly observable.

10 assertions shipped in `tests/responsive.test.ts`, across three `describe` blocks:

| Assertion | Guards |
|---|---|
| **At 900px the masthead is a single row (height ≤ 72px)** | **The breakpoint's premise.** See below |
| At 900px the computed `position` is `sticky` | The feature exists |
| At 900px, after scrolling 600px, the masthead's bounding box top is still 0 | That it actually stays — computed style alone would pass even if an ancestor became a scroll container |
| Below 56.25rem (at 880px) the computed `position` is not `sticky` | The fold decision — the wrapping band is untouched |
| On a phone the computed `position` is not `sticky` | The fold decision — phones are untouched |
| At 900px: no `box-shadow` at rest | The resting state — no shadow before anything has scrolled under it |
| At 900px: a `box-shadow` after scrolling 600px | The shadow, in the one engine that can show it |
| The skip link lands `#main` at or below the masthead's bottom edge, not underneath it | The one accessibility consequence of a sticky header |
| `scroll-padding-top` is at least the masthead's measured height | That the skip link cannot land under the header |
| At 390px **and 880px**, `scroll-padding-top` is `auto` (no offset) | That nothing pushes content down where nothing sticks. 880px is the one that matters: `56.25rem` lives in both `SiteNav.astro` and `global.css` with nothing binding them, so a breakpoint moved in one file and not the other would give the in-between band an anchor offset for a masthead that does not stick — and only this assertion would notice |
| The existing 96px phone-height guard still passes | That this change did not disturb session 11's work |

**The single-row assertion is the load-bearing one.** `56.25rem` is not a round number
chosen for taste; it is the measured width at which seven links stop wrapping. Add an
eighth nav item, or lengthen a label, and the wrap point moves past the breakpoint — at
which point the site would silently stick a 111.59px header on every laptop, with every
other test still green. This assertion fails instead, and its message should say to
re-measure the wrap point rather than to raise the number blindly.

Per this repo's standing rule, each new guard is proved by breaking it deliberately once
and watching it fail before the change is considered done.

## Out of scope

- **No shrinking or condensing on scroll.** The stuck masthead is identical to the resting
  one. Session 11 already settled what the masthead contains.
- **No `prefers-reduced-motion` branch.** Nothing moves — a shadow fades. There is no
  vestibular surface here. Note there is a collision worth recording rather than a gap:
  `global.css` has a global `@media (prefers-reduced-motion: reduce)` rule that sets
  `animation-duration: 0.01ms !important` on `*`, and it does apply to `.masthead`. It is
  currently harmless — verified — because Chromium ignores `animation-duration` on
  progress-based (scroll) timelines, so the shadow ramp is byte-identical with and without
  the preference. An engine that someday honours duration on scroll timelines would make
  that rule collapse the shadow's 64px ramp to effectively nothing, snapping it fully on
  at 1px of scroll for reduced-motion users — the opposite of "reduced." Not a code change
  today; just a trap for whoever revisits this once browsers catch up.
- **No print change.** `global.css` already sets `display: none` on `header[data-masthead]`
  in print media, so the masthead never reaches paper and its positioning is irrelevant
  there.
- **No JavaScript, and no Firefox fallback.**
- **Not fixing the nav wrap.** Making the row fit below 56.25rem would mean changing the
  nav's type size or spacing across all 36 pages, which is a visual-design decision this
  feature has no business making.

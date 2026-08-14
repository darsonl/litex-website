/**
 * What the chrome does at a phone width, measured rather than assumed.
 *
 * Both defects here were found by rendering the homepage at 390px and reading the
 * layout, not by reading the stylesheet — and neither is visible to linkedom, because
 * both are questions about boxes rather than markup.
 *
 * The numeric thresholds are deliberate and are documented at each assertion. A guard
 * with an undefended number is worse than no guard: the next person loosens it.
 *
 * ⚠ Visibility here is `Element.checkVisibility()`, never a bounding box. Chromium hides
 * the contents of a closed <details> with `content-visibility: hidden` on the
 * ::details-content pseudo-element, which skips PAINTING but still answers layout
 * queries: a link inside the closed menu reports a 44px box, a non-null offsetParent,
 * and its text still shows up in document.body.innerText. Every one of those checks
 * reports the menu as open while it is shut. Measured, not assumed — the first draft of
 * this file used getBoundingClientRect and two of its assertions passed before the
 * feature existed. That is this repo's own gotcha 12: a clean result from a check that
 * never looked.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser } from 'playwright';
import { serveDist, type StaticServer } from './helpers/serve';

/** iPhone 12/13/14 CSS pixels — the viewport the critique measured. */
const PHONE = { width: 390, height: 844 };
/** Comfortably past the collapse breakpoint, where all seven links must be on show. */
const DESKTOP = { width: 1280, height: 900 };
/**
 * 900px is the measured width at which the seven-link row stops wrapping — the masthead
 * is 64.00px here and 111.59px at 880px. The sticky breakpoint is set to exactly this,
 * so this viewport is the boundary case and not a comfortable margin.
 */
const STICKY = { width: 900, height: 900 };
/** The widest width where the nav still wraps to two rows, so must NOT stick. */
const WRAPPED = { width: 880, height: 900 };

let server: StaticServer;
let browser: Browser;

beforeAll(async () => {
  server = await serveDist();
  browser = await chromium.launch();
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

async function open(viewport: { width: number; height: number }, javaScriptEnabled = true) {
  const context = await browser.newContext({ viewport, javaScriptEnabled });
  const page = await context.newPage();
  await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
  await page.goto(`${server.origin}/`, { waitUntil: 'load' });
  return { context, page };
}

describe('the masthead on a phone', () => {
  it('does not spend a fifth of the fold on navigation', async () => {
    const { context, page } = await open(PHONE);
    const height = await page.evaluate(
      () => document.querySelector('header[data-masthead]')!.getBoundingClientRect().height,
    );
    await context.close();

    // It measured 153px before this guard existed: seven links wrapping to two rows on
    // top of the wordmark, 18% of an 844px viewport spent before the first word of
    // content. 96px is the ceiling for a single row carrying the wordmark and one
    // control — generous enough not to be fragile, tight enough to fail the old layout.
    expect(height, 'the masthead is eating the fold again').toBeLessThanOrEqual(96);
  });

  it('still offers every section, once the menu is opened', async () => {
    const { context, page } = await open(PHONE);

    // Opened the way a visitor opens it, through the control, rather than by setting
    // the open attribute — that is what proves the control is wired to the list.
    await page.click('[data-navmenu] > summary');
    const visible = await page.evaluate(() =>
      [...document.querySelectorAll('nav[aria-label="Primary"] a')]
        .filter((a) => a.checkVisibility())
        .map((a) => a.getAttribute('href')),
    );
    await context.close();

    expect(visible).toContain('/products/');
    expect(visible).toContain('/applications/');
    expect(visible.length, 'the collapsed menu is dropping sections').toBe(7);
  });

  // The site ships JavaScript only for the two enquiry forms. Navigation that needed a
  // script would be the first piece of chrome that could fail to a blank state, so the
  // disclosure has to be a native one. Proven by turning JavaScript off entirely.
  it('opens with JavaScript disabled', async () => {
    const { context, page } = await open(PHONE, false);
    const seen = () =>
      page.evaluate(() =>
        document.querySelector('nav[aria-label="Primary"] a')!.checkVisibility(),
      );

    const before = await seen();
    await page.click('[data-navmenu] > summary');
    const after = await seen();
    await context.close();

    expect(before, 'the menu is already open, so this proves nothing').toBe(false);
    expect(after, 'the disclosure needs JavaScript to open').toBe(true);
  });

  it('gives each menu item a target a thumb can hit', async () => {
    const { context, page } = await open(PHONE);
    await page.click('[data-navmenu] > summary');
    const heights = await page.evaluate(() =>
      [...document.querySelectorAll('nav[aria-label="Primary"] a')]
        .filter((a) => a.checkVisibility())
        .map((a) => ({
          label: a.textContent?.trim(),
          height: a.getBoundingClientRect().height,
        })),
    );
    await context.close();

    // Guards the guard: filtering on visibility means an unopened menu would leave this
    // list empty, and an empty list trivially satisfies the assertion below.
    expect(heights, 'no menu items were visible, so nothing was measured').toHaveLength(7);

    // 44px is WCAG 2.5.5 Target Size (Enhanced). PRODUCT.md commits to 2.1 AA, so this
    // is above the stated commitment and says so — but the links measured 20px tall,
    // and in a vertical list the cost of clearing 44 is padding.
    const small = heights.filter((h) => h.height < 44);
    expect(small, `menu items under 44px tall:\n${JSON.stringify(small)}`).toEqual([]);
  });
});

describe('the masthead on a desktop', () => {
  it('shows all seven links with nothing to open', async () => {
    const { context, page } = await open(DESKTOP);
    const { visible, control, isOpen } = await page.evaluate(() => ({
      visible: [...document.querySelectorAll('nav[aria-label="Primary"] a')].filter((a) =>
        a.checkVisibility(),
      ).length,
      control: document.querySelector('[data-navmenu] > summary')!.checkVisibility(),
      isOpen: document.querySelector('[data-navmenu]')!.hasAttribute('open'),
    }));
    await context.close();

    // The links are on show while the <details> is still closed — that is the point.
    // Nothing sets the open attribute; CSS reopens the panel above the breakpoint, so a
    // visitor who never touches the control still sees the full row.
    expect(isOpen, 'the desktop row depends on the details being open').toBe(false);
    expect(visible, 'the collapse is leaking above the breakpoint').toBe(7);
    expect(control, 'a disclosure control is showing where there is nothing to disclose')
      .toBe(false);
  });
});

describe('the footer credibility strip on a phone', () => {
  /** Each list item with the top of its rendered line, so lines can be reconstructed. */
  async function items() {
    const { context, page } = await open(PHONE);
    const measured = await page.evaluate(() =>
      [...document.querySelectorAll('[data-credibility] li')].map((li) => {
        const before = getComputedStyle(li, '::before');
        const box = li.getBoundingClientRect();
        return {
          text: li.textContent?.trim() ?? '',
          top: Math.round(box.top),
          left: Math.round(box.left),
          beforeContent: before.content,
          borderLeft: parseFloat(getComputedStyle(li).borderLeftWidth),
        };
      }),
    );
    await context.close();
    return measured;
  }

  // Without this the rest of the block is vacuous. If the strip ever stops wrapping at
  // 390px the separator assertion below would pass for the wrong reason — there would
  // simply be no line start to get wrong — and it would keep passing forever.
  it('really does wrap at this width', async () => {
    const measured = await items();
    const lines = new Set(measured.map((m) => m.top));
    expect(measured.length, 'the credibility strip is empty').toBeGreaterThan(0);
    expect(lines.size, 'the strip fits on one line, so this suite is not testing anything')
      .toBeGreaterThan(1);
  });

  it('never begins a wrapped line with a hanging separator', async () => {
    const measured = await items();

    // The item furthest left on each rendered line is the one that starts it.
    const lineStarts = [...new Set(measured.map((m) => m.top))].map((top) => {
      const online = measured.filter((m) => m.top === top);
      return online.reduce((a, b) => (a.left <= b.left ? a : b));
    });

    // `li + li::before` put the interpunct before every item but the first, so any item
    // that wrapped began its line with a floating '·'. Both a generated glyph and a left
    // border would read the same way on the page, so both are checked — this asserts the
    // absence of a leading mark, not the presence of one particular fix.
    const hanging = lineStarts.filter(
      (m) => (m.beforeContent !== 'none' && m.beforeContent !== '""') || m.borderLeft > 0,
    );
    expect(hanging, `lines starting with a separator:\n${JSON.stringify(hanging, null, 2)}`)
      .toEqual([]);
  });
});

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

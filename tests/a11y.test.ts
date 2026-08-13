/**
 * Accessibility, measured rather than asserted (spec §4).
 *
 * The rest of the suite checks structure with linkedom, which cannot see contrast,
 * computed roles or focus order. This drives a real browser over the real build.
 *
 * Requires a browser binary: `npx playwright install chromium`. That is a machine
 * setup step, not a repo artefact — CI needs it too.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { serveDist, type StaticServer } from './helpers/serve';

/** One per template type. Adding a template means adding a row here. */
const PAGES: [name: string, path: string][] = [
  ['homepage', '/'],
  ['product index', '/products/'],
  ['product detail, with spec table', '/products/conductive-metal-yarn/'],
  ['technology', '/technology/'],
  ['news index', '/news/'],
  ['news post', '/news/techtextil-frankfurt/'],
  ['company page with figures', '/company/about/'],
  ['downloads', '/downloads/'],
  ['form page', '/contact/'],
  ['legal', '/legal/privacy/'],
  ['404', '/this-path-does-not-exist/'],
];

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

describe.each(PAGES)('%s (%s)', (_name, path) => {
  it('has no WCAG 2 A or AA violations', async () => {
    // An explicit context is required: @axe-core/playwright rejects a page created by
    // browser.newPage(), which attaches an implicit context, with "Please use
    // browser.newContext()". A context per page also keeps the runs isolated.
    const context = await browser.newContext();
    const page = await context.newPage();

    // Keep the run hermetic and offline. Turnstile's widget is a live third-party
    // script, and an accessibility suite that fails when Cloudflare is slow is a suite
    // people learn to ignore. Blocking it also means the two form pages are checked as
    // they render for a visitor whose network blocked the widget — a real scenario.
    await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());

    await page.goto(`${server.origin}${path}`, { waitUntil: 'load' });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Report the useful fields rather than the whole axe node dump: a failure should
    // name the rule, how many elements, and one concrete example to go and look at.
    const summary = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.length,
      help: v.help,
      example: v.nodes[0]?.html?.slice(0, 200),
    }));

    // axe returns THREE outcomes, not two. "incomplete" means it could not decide —
    // classically text over a background image — and a suite that asserts only on
    // `violations` reports green while a real question sits unanswered. Asserting on
    // incompletes as well is what stops this harness being the sort of check that
    // passes without looking.
    //
    // One incomplete is accepted, by explicit allowlist rather than by ignoring the
    // whole category: axe declines to judge contrast on the decorative bullet in the
    // status pill because it is a non-BMP character, and that element is aria-hidden
    // anyway. Any other incomplete fails and wants a human.
    const unexplained = results.incomplete.flatMap((rule) =>
      rule.nodes
        .filter(
          (node) =>
            ![...node.any, ...node.all, ...node.none].every(
              (check) =>
                (check.data as { messageKey?: string } | undefined)?.messageKey === 'nonBmp',
            ),
        )
        .map((node) => ({ id: rule.id, help: rule.help, example: node.html.slice(0, 200) })),
    );

    await context.close();
    expect(summary, `axe violations on ${path}`).toEqual([]);
    expect(unexplained, `axe could not decide these on ${path} — a human must look`)
      .toEqual([]);
  }, 60_000);
});

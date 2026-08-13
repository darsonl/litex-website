/**
 * What survives being printed.
 *
 * PRODUCT.md, on the buyer's real workflow: "Procurement prints and PDFs things
 * constantly. Spec pages must survive being printed and attached to an internal
 * document, carrying wordmark, canonical URL and contact details."
 *
 * The screen chrome cannot satisfy that on its own. `@media print` in global.css hides
 * header[data-masthead] and footer[data-sitefooter] on purpose — a navigation bar and a
 * column of links are noise on paper — so something else has to reinstate the three
 * facts, or a printed LiTex spec sheet circulating in a procurement thread is an
 * anonymous sheet of paper.
 *
 * These assertions are made against RENDERED text under print media emulation, never
 * against a selector. That is the whole point of the file: the defect it exists to catch
 * was not a missing element, it was elements present in the HTML and removed by CSS.
 * Every structural check in this suite passed while the bug was live, because linkedom
 * parses markup and has no opinion about `display`.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser } from 'playwright';
import { serveDist, type StaticServer } from './helpers/serve';
import { COMPANY } from '../src/lib/company';

/**
 * The homepage, the spec-table page PRODUCT.md actually names, and a long prose page.
 * Chrome is global, so three pages is enough to prove it without paying for 36.
 */
const PAGES = ['/', '/products/conductive-metal-yarn/', '/technology/'];

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

/** Text as a reader would see it, on screen and then on paper, from one page load. */
async function render(path: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  // Same reasoning as the a11y run: keep it hermetic and offline.
  await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
  await page.goto(`${server.origin}${path}`, { waitUntil: 'load' });

  const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
  // innerText is layout-derived, so it omits anything `display: none` removes — which is
  // exactly the distinction under test. textContent would not see the difference at all.
  const onScreen = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  await page.emulateMedia({ media: 'print' });
  const printed = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));

  await context.close();
  return { canonical, onScreen, printed };
}

describe.each(PAGES)('printing %s', (path) => {
  let out: Awaited<ReturnType<typeof render>>;

  beforeAll(async () => {
    out = await render(path);
  }, 60_000);

  it('names the company on the paper', () => {
    expect(out.printed, 'a printed page that does not say LiTex is anonymous')
      .toContain('LiTex');
  });

  // Asserted against the page's own <link rel="canonical">, not a hardcoded string, so
  // the test cannot drift from the site URL and cannot be satisfied by the wrong page's
  // address. A reader holding the paper has to be able to type in what they are holding.
  it('prints its own canonical URL, so the sheet can be traced back', () => {
    expect(out.canonical, `${path} has no canonical link to print`).toBeTruthy();
    expect(out.printed, 'the printed sheet gives the reader no way back to the page')
      .toContain(out.canonical!);
  });

  it('prints a way to make contact', () => {
    expect(out.printed, 'the printed sheet has no email address').toContain(COMPANY.email);
    expect(out.printed, 'the printed sheet has no phone number').toContain(COMPANY.phone);
  });

  // The cheap way to pass the three tests above is to show a colophon to everybody. This
  // is what stops that: the canonical URL is a string no screen page renders as text, so
  // it doubles as a sentinel for print-only content leaking onto the screen.
  it('keeps the print colophon off the screen', () => {
    expect(out.onScreen, 'print-only material is rendering for screen readers and sighted users')
      .not.toContain(out.canonical!);
  });
});

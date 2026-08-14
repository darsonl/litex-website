/**
 * Does /admin actually start?
 *
 * Every other assertion about the CMS lives in tests/cms.test.ts and reads config.yml as
 * DATA — parsing the YAML and checking its shape. All of them passed while the CMS was
 * completely unusable in a browser, because a config can be structurally perfect and
 * still be rejected by the application that has to run it.
 *
 * The defect that prompted this file: config.yml deliberately omitted `media_folder`, on
 * the reasoning that a site allowing no uploads needs no media folder. Sveltia treats it
 * as required and replaces the entire app with "The media folder is not defined."
 * Nothing caught it — not the build, not 436 tests — and it was found by a human opening
 * the page. This file is the cheapest possible guard against that whole class: boot the
 * real bundle in a real browser and require it to reach a usable state.
 *
 * ⚠ Every request that leaves the origin is aborted. This is a boot test, not an
 * integration test: it must not depend on GitHub being reachable, and must never attempt
 * to authenticate. What it proves is that the app parsed its config and rendered its
 * sign-in screen — which is exactly the step that was broken.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser } from 'playwright';
import { serveDist, type StaticServer } from './helpers/serve';

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

async function bootAdmin() {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.route('**', (route) =>
    route.request().url().startsWith(server.origin) ? route.continue() : route.abort(),
  );
  await page.goto(`${server.origin}/admin/`, { waitUntil: 'load' });

  // The bundle is ~1.8 MB and mounts a Svelte app; give it a real chance to render rather
  // than racing it. Poll instead of sleeping a fixed time so a fast machine is not
  // punished and a slow one is not flaky.
  await page
    .waitForFunction(() => (document.body.innerText ?? '').trim().length > 0, undefined, {
      timeout: 20_000,
    })
    .catch(() => undefined);

  const text = (await page.evaluate(() => document.body.innerText ?? '')).trim();
  await context.close();
  return text;
}

describe('the CMS at /admin actually starts', () => {
  it('renders its sign-in screen rather than a configuration error', async () => {
    const text = await bootAdmin();

    expect(text, '/admin rendered nothing at all — the bundle did not mount').not.toBe('');

    // The positive assertion is the load-bearing one. A config Sveltia rejects never
    // reaches this screen, so requiring it proves the config was accepted — without
    // pinning any particular wording of any particular error message.
    expect(
      text,
      `/admin did not reach a sign-in screen. It rendered:\n${text.slice(0, 400)}`,
    ).toMatch(/sign in/i);
  });

  it('shows the token sign-in route, which is the only way in', async () => {
    const text = await bootAdmin();

    // There is no OAuth backend and no second deployable — authentication is a personal
    // access token pasted into this screen. If this affordance ever disappears, nobody
    // can log in at all, and docs/cms.md's sign-in instructions become fiction.
    expect(text, `no token sign-in offered. Rendered:\n${text.slice(0, 400)}`).toMatch(
      /access token/i,
    );
  });

  it('reports no configuration problem on screen', async () => {
    const text = await bootAdmin();

    // Sveltia surfaces config faults as the entire page content. "media folder" is named
    // explicitly because that is the one this file was written for; the generic patterns
    // catch the rest of the family without guessing at exact strings.
    for (const fault of [/is not defined/i, /media folder/i, /invalid|malformed/i]) {
      expect(
        text,
        `/admin is showing a configuration fault matching ${fault}:\n${text.slice(0, 400)}`,
      ).not.toMatch(fault);
    }
  });
});

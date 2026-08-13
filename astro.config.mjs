import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Domain ownership confirmed 2026-08-11 (was spec §7 item 3, now closed).
// Declared exactly once: feeds `site` below, canonical tags, and the eventual sitemap.
export const SITE_URL = 'https://litex.com.tw';

// LiTex's real inbound address, confirmed 2026-08-11 (was spec §7 item 1, now closed).
// The old site's only address was the theme placeholder mail@example.com — never use it.
export const CONTACT_EMAIL = 'sales@litex.com.tw';

export default defineConfig({
  site: SITE_URL,
  build: { format: 'directory' },
  integrations: [
    sitemap({
      // Emits sitemap-index.xml + sitemap-0.xml, not sitemap.xml. public/robots.txt
      // names the index by that real filename.
      //
      // /enquiry-sent/ is a confirmation page. Indexed, it would greet a stranger
      // arriving from a search result with "we have your enquiry" — false, and
      // alarming. It also carries <meta name="robots" content="noindex">, because
      // omission from a sitemap is a hint and the meta tag is an instruction.
      //
      // /404 is excluded explicitly rather than trusting the integration's default
      // handling of the 404 route, which was not verified.
      filter: (page) => !page.includes('/enquiry-sent/') && !page.includes('/404'),
    }),
  ],
});

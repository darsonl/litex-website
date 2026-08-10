import { defineConfig } from 'astro/config';

// Domain ownership confirmed 2026-08-11 (was spec §7 item 3, now closed).
// Declared exactly once: feeds `site` below, canonical tags, and the eventual sitemap.
export const SITE_URL = 'https://litex.com.tw';

// LiTex's real inbound address, confirmed 2026-08-11 (was spec §7 item 1, now closed).
// The old site's only address was the theme placeholder mail@example.com — never use it.
export const CONTACT_EMAIL = 'sales@litex.com.tw';

export default defineConfig({
  site: SITE_URL,
  build: { format: 'directory' },
});

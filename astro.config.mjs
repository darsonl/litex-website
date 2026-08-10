import { defineConfig } from 'astro/config';

// PLACEHOLDER. LiTex domain ownership is spec §7 item 3, unresolved.
// Used only for sitemap/canonical generation. Never render this in visible copy.
export const SITE_URL = 'https://litex.example';

export default defineConfig({
  site: SITE_URL,
  build: { format: 'directory' },
});

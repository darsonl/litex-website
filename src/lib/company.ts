/**
 * Company facts, declared once.
 *
 * Every value traces to archive/: the address and hours to the contact widget in
 * archive/pages/about.html, sales@litex.com.tw to the body of
 * archive/pages/news-2017-wearable-expo.html, and the Chinese legal name to the
 * TAITRONICS certificate in 2018-company-introduction.pdf p.2.
 *
 * The email is also declared as CONTACT_EMAIL in astro.config.mjs, because pages
 * must not import that file — it would pull defineConfig from astro/config into the
 * page bundle. tests/chrome.test.ts fails if the two ever disagree.
 */
export const COMPANY = {
  legalName: 'LiTex Textile & Technology Co., Ltd.',
  /** From the 2014 TAITRONICS award certificate, shown beside the English name. */
  legalNameZh: '富鉅紡織科技股份有限公司',
  foundedYear: 1999,
  email: 'sales@litex.com.tw',
  phone: '+886-2-2308-4712',
  phoneHref: 'tel:+886223084712',
  addressLines: ['188 Bangka Blvd., Wanhua Dist.', 'Taipei, Taiwan 108'],
  hours: 'Mon–Fri 09:00–18:00',
} as const;

/**
 * Spec §5 component 4, verbatim. Every item is a claim LiTex already makes in its
 * own catalogs — adding one requires evidence, not optimism.
 */
export const CREDIBILITY: readonly string[] = [
  'REACH',
  'RoHS',
  'SGS TESTED',
  'PATENTED TW 1M545145',
  'MANUFACTURING SINCE 1999',
];

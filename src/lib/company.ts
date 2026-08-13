/**
 * Company facts, declared once.
 *
 * Every value traces to archive/: the address and hours to the contact widget in
 * archive/pages/about.html, sales@litex.com.tw to the body of
 * archive/pages/news-2017-wearable-expo.html, the Chinese legal name to the
 * TAITRONICS certificate in 2018-company-introduction.pdf p.2, and the fax number to
 * the footer of archive/catalogs/201611e68ea7e588b6e599a8final.txt.
 *
 * The email is also declared as CONTACT_EMAIL in astro.config.mjs, because pages
 * must not import that file — it would pull defineConfig from astro/config into the
 * page bundle. tests/chrome.test.ts fails if the two ever disagree.
 */
export const COMPANY = {
  legalName: 'LiTex Textile & Technology Co., Ltd.',
  /** From the 2014 TAITRONICS award certificate, shown beside the English name. */
  legalNameZh: '富鉅紡織科技股份有限公司',
  /**
   * LiTex is a subsidiary of Hen Hao Trading and the two operate from the same
   * Taipei premises — confirmed by LiTex 2026-08-11. This is not decoration: some
   * compliance documents, including SGS report CE/2013/52203, are issued in the
   * parent's name, and a buyer who meets that name for the first time on a
   * certificate they requested reads it as a discrepancy. Declaring the
   * relationship is what turns it into ordinary group structure.
   */
  parentCompany: 'Hen Hao Trading Co., Ltd.',
  foundedYear: 1999,
  email: 'sales@litex.com.tw',
  phone: '+886-2-2308-4712',
  phoneHref: 'tel:+886223084712',
  /**
   * From the footer of archive/catalogs/201611e68ea7e588b6e599a8final.txt, which is
   * the only LiTex document that publishes it. Still worth carrying: fax is a live
   * channel in Taiwanese and Japanese industrial procurement.
   */
  fax: '+886-2-2308-4714',
  /**
   * ⚠ This is the OFFICE address, not a factory address.
   *
   * Corrected by LiTex 2026-08-13: the Bangka Blvd. premises are the office; the
   * manufacturing happens in other parts of Taiwan. Site copy therefore says
   * "woven in Taiwan" and "manufacturing in Taiwan", never "in Taipei" — an earlier
   * draft said Taipei on the homepage and the /company/ hub, which was wrong.
   *
   * Taipei remains correct wherever it describes this address, the UTC+8 note on
   * /contact/, the office hours, or the TAITRONICS show name. The distinction is
   * office versus factory, not a ban on the word. A test in tests/chrome.test.ts
   * fails the build if any page claims something is made, woven or manufactured
   * "in Taipei".
   */
  addressLines: ['188 Bangka Blvd., Wanhua Dist.', 'Taipei, Taiwan 108'],
  hours: 'Mon–Fri 09:00–18:00',
} as const;

/**
 * Spec §5 component 4. Every item is a claim LiTex already makes in its own catalogs —
 * adding one requires evidence, not optimism.
 *
 * The patent item departs from the spec's wording deliberately, on evidence gathered
 * 2026-08-11:
 *
 *  - The number the archive prints, "TW 1M545145", is malformed. The real record is
 *    TWM545145U, "Elastic ribbon having extensible electronic device", filed
 *    2017-03-20 by 富鉅紡織科技股份有限公司 — an exact match for legalNameZh above,
 *    so it is certainly LiTex's. The leading "1" is a transcription artifact.
 *  - "PATENTED" asserts a right currently in force, which is not established. Taiwan
 *    utility models run ten years from filing, and the sibling patent TWM371733
 *    lapsed for non-payment on 2017-10-01, so continued renewal cannot be assumed.
 *    "TW UTILITY MODEL" states what the record shows and nothing more.
 *
 * Restore a stronger claim only when LiTex confirms the renewal status. See the open
 * questions in the Plan 5 document.
 */
export const CREDIBILITY: readonly string[] = [
  'REACH',
  'RoHS',
  'SGS TESTED',
  'TW UTILITY MODEL M545145',
  'MANUFACTURING SINCE 1999',
];

/**
 * Where each credibility claim is substantiated. The /company/ hub renders the bar
 * as links through this map, so a claim the site cannot back up has nowhere to point.
 * tests/company.test.ts fails if the keys drift from CREDIBILITY.
 *
 * The footer keeps rendering CREDIBILITY as plain text: five links in the footer of
 * every page is noise, and the hub is where a buyer goes to check.
 */
export const CREDIBILITY_EVIDENCE: Readonly<Record<string, string>> = {
  REACH: '/company/certifications/',
  RoHS: '/company/certifications/',
  'SGS TESTED': '/company/certifications/',
  'TW UTILITY MODEL M545145': '/company/patents-and-awards/',
  'MANUFACTURING SINCE 1999': '/company/about/',
};

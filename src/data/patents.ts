/**
 * The patent record, as verified against the public registers on 2026-08-11.
 *
 * This deliberately does NOT come from archive/images/patents-and-awards.jpg. That
 * graphic lists US 12/787,378 as "pending" and TW M371733 as "issued"; the first was
 * abandoned in 2012 and the second lapsed in 2017. It also prints the utility model
 * number with a leading 1, which is a transcription artifact — the register shows
 * M545145. Publishing the graphic's contents would publish two false statements.
 *
 * Statuses below marked "Not verified" were not found in an English-language register
 * during the 2026-08-11 pass. They are shown as unverified rather than omitted,
 * because omitting a filing LiTex has published is its own kind of edit.
 */

/** The one record that is registered and attributable to LiTex with certainty. */
export const UTILITY_MODEL = {
  number: 'TWM545145U',
  shortNumber: 'M545145',
  title: 'Elastic ribbon having extensible electronic device',
  filed: '2017-03-20',
  holder: '富鉅紡織科技股份有限公司',
  /** Exact match for COMPANY.legalNameZh, which is what makes attribution certain. */
  holderNote: 'Registered to LiTex under its Chinese legal name',
} as const;

export const AWARD = {
  event: '40th Taipei International Electronics Show (TAITRONICS)',
  programme: 'Technology Innovation Awards · 科技創新獎',
  prize: 'The Quality Award · 優選獎',
  subject: 'Non-Carbon Fiber Electrical Heating Textile · 非碳纖維電子發熱紡織品',
  awardedTo: '富鉅紡織科技股份有限公司 / LiTex Textile & Technology Co., Ltd',
  /**
   * The certificate prints a full date in its bottom-right corner, but the day is
   * roughly five pixels tall in the only photograph that exists of it and the final
   * digit cannot be resolved — it is a 6 or a 9. An earlier session recorded
   * "2014.9.29" as fully read; re-checked at 14x on 2026-08-11, that confidence was
   * not warranted. The year and month are unambiguous, so those are what we publish.
   */
  dated: 'September 2014',
} as const;

/** Shaped for SpecTable directly — this is spec data, and it is rendered as such. */
export const LAPSED_FILINGS = {
  columns: [
    { key: 'number', label: 'Filing' },
    { key: 'subject', label: 'Subject' },
    { key: 'status', label: 'Status' },
  ],
  rows: [
    {
      number: 'TW M371733',
      subject: 'Conductive yarn withstanding dyeing, finishing and washing',
      status: 'Lapsed 2017-10-01 — renewal fees unpaid',
    },
    {
      number: 'US 12/787,378',
      subject: 'Conductive yarn withstanding dyeing, finishing and washing',
      status: 'Abandoned 2012-04-23 — no response to an office action. Never granted',
    },
    {
      number: 'CN 201485574U',
      subject: 'Conductive yarn withstanding dyeing, finishing and washing',
      status: 'Not verified',
    },
    {
      number: 'TW 099146482 · CN 201120008487.x',
      subject: 'Flexible heating element',
      status: 'Applications filed 2010–2011. Not verified',
    },
  ],
};

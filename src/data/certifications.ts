/**
 * What LiTex claims about compliance, and what backs each claim.
 *
 * The third column is the point of the table. REACH and RoHS are asserted on catalog
 * pages and nowhere else; the SGS report exists as a photograph of its cover, from
 * which only the report number is readable. Spec §7 item 5 tracks obtaining the real
 * documents. Until they arrive, the honest thing is to publish the distinction rather
 * than a row of badges.
 */

/** Shaped for SpecTable directly. */
export const COMPLIANCE_CLAIMS = {
  columns: [
    { key: 'claim', label: 'Claim' },
    { key: 'where', label: 'Where LiTex states it' },
    { key: 'document', label: 'Document published here' },
    { key: 'dated', label: 'Dated' },
  ],
  rows: [
    {
      claim: 'REACH compliant',
      where: '2018-non-carbon-electrical-heating-textile.pdf, p.1 features list',
      document: 'None — claim only',
      dated: '2018',
    },
    {
      claim: 'RoHS compliant',
      where:
        '2018-non-carbon-electrical-heating-textile.pdf p.1; 2018-emi-shielding-wire-tube.pdf states "RoHS certified eco-friendly"',
      document: 'None — claim only',
      dated: '2018',
    },
    {
      claim: 'SGS test certified toughness',
      where: '2018-non-carbon-electrical-heating-textile.pdf, p.1 features list',
      document: 'Report cover photograph — number only',
      dated: '2013',
    },
  ],
};

export const SGS_REPORT = {
  number: 'CE/2013/52203',
  year: 2013,
  /** What the stored photograph actually resolves, checked 2026-08-11. */
  readable: 'The report number, the SGS mark, and a photograph of the tested sample',
  notReadable: 'The test scope, the standards applied, and the addressee block. The results are not on a cover page at all',
  /**
   * NOT read off the photograph — the addressee block is illegible there, which is
   * why it stays listed under notReadable. Confirmed by LiTex 2026-08-11: the report
   * is issued to the parent company. Published because a buyer who requests this
   * report and meets an unfamiliar company name on it has found a discrepancy the
   * site created by staying silent.
   */
  issuedTo: 'Hen Hao Trading Co., Ltd.',
} as const;

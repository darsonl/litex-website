/**
 * The six catalogs the old site offered, in the order it listed them
 * (archive/pages/downloads.html), with descriptions written from each document's
 * actual contents rather than its title.
 *
 * Page counts counted 2026-08-11. Byte sizes are NOT here — they live in
 * catalog-files.json, written by scripts/sync-catalogs.mjs, so they cannot drift.
 */
export type Catalog = {
  file: string;
  title: string;
  description: string;
  pages: number;
  year: number;
  /** Product route this catalog is the source for, when there is exactly one. */
  product?: string;
};

export const CATALOGS: readonly Catalog[] = [
  {
    file: '2018-company-introduction.pdf',
    title: 'Company introduction',
    description:
      'Two pages of company background: the premises, the creel and loom floor, the covering machines, the two predecessor businesses, and photographs of the TAITRONICS award and the SGS test report cover. Image-only — it has no text layer.',
    pages: 2,
    year: 2018,
  },
  {
    file: '2018-non-carbon-electrical-heating-textile.pdf',
    title: 'Electrical heating textile',
    description:
      'The most technical document of the six. Carries the full copper-foil grade table — covering counts, diameters coated and uncoated, resistance and toughness for 1S through 4S4Z — the CMY structure diagram, and the comparison against carbon fibre, heating film and stainless steel fibre.',
    pages: 4,
    year: 2018,
    product: '/products/electrical-heating-textile/',
  },
  {
    file: '2018-wired-conductive-tape.pdf',
    title: 'Wired conductive tape',
    description:
      'Woven tape with a conductive wire laid in a repeating wave, shown against a rule for scale. Image-only, with no text layer, so the figures in it have not been transcribed.',
    pages: 4,
    year: 2018,
    product: '/products/wired-conductive-tape/',
  },
  {
    file: '2018-emi-shielding-wire-tube.pdf',
    title: 'Cable EMI shielding tube',
    description:
      'Braided sleeving over an aramid and fibreglass core plated with copper. States expansion of 1.5 to 4 times the taut diameter, a 3–15 mm size range, heat resistance to 600 °C, and RoHS conformity.',
    pages: 2,
    year: 2018,
    product: '/products/emi-shielding-woven-tube/',
  },
  {
    file: '201611e68ea7e588b6e599a8final.pdf',
    title: 'Silicon switch with temperature sensor',
    description:
      'The HT001 controller for LiTex heating textile: 3.3–12 V in and out, 5 A maximum, three temperature modes, an NTC sensor pair, an overheat cut-out, and sewable silicone edges. Out of production, available for sampling and testing.',
    pages: 2,
    year: 2016,
    product: '/products/silica-gel-switch-controller/',
  },
  {
    file: '2018-rfid-textile-tape.pdf',
    title: 'RFID textile tape',
    description:
      'Narrow polyester tape with conductive wire woven in to act as an RFID tag antenna. Gives the tape and wire specifications, the serpentine geometry, and the two integration methods — hot-melt adhesive or sewing.',
    pages: 2,
    year: 2018,
    product: '/products/rfid-textile-tape/',
  },
];

import type { CsvColumn, CsvRow } from '../lib/csv';

/**
 * LiTex's own competitive comparison, transcribed in archive/extracted-from-images.md §8
 * from 2018-non-carbon-electrical-heating-textile.pdf.
 *
 * This is a vendor's claim about competing technologies, not an independent test. The page
 * says so, and the source note names the document. Do not add a row or a characteristic
 * LiTex has not itself published.
 */
export const HEATING_COMPARISON: { columns: CsvColumn[]; rows: CsvRow[] } = {
  columns: [
    { key: 'element', label: 'Heating element' },
    { key: 'material', label: 'Material characteristics' },
    { key: 'process', label: 'Manufacturing process' },
  ],
  rows: [
    {
      element: 'Carbon fibre',
      material: 'Brittle, easy breakage',
      process: 'Mostly manual labour',
    },
    {
      element: 'Flexible printed circuit board (heating film)',
      material: 'Thin board, easy to snap',
      process: 'Special equipment required, high operating cost',
    },
    {
      element: 'Stainless steel fibre',
      material: 'Filament bundle frays easily',
      process: 'Mostly manual labour',
    },
    {
      element: 'Conductive Metal Yarn',
      material: 'Coiled design offers both flexibility and strength',
      process: 'Made ready to use on LiTex looms; easily mass manufactured',
    },
  ],
};

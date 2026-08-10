/** RFC 4180 CSV serialization for spec tables. Pure — no DOM, no Astro imports. */

export type CsvColumn = { key: string; label: string; unit?: string };
export type CsvRow = Record<string, string>;

/** Shown for a cell the source document does not provide. Matches the on-page rendering. */
const MISSING = '—';

export function escapeCsvField(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function columnHeader(column: CsvColumn): string {
  return column.unit ? `${column.label} (${column.unit})` : column.label;
}

export function specTableToCsv(table: { columns: CsvColumn[]; rows: CsvRow[] }): string {
  const header = table.columns.map((c) => escapeCsvField(columnHeader(c))).join(',');
  const body = table.rows.map((row) =>
    table.columns.map((c) => escapeCsvField(row[c.key] ?? MISSING)).join(','),
  );
  return [header, ...body].join('\r\n');
}

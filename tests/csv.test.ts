import { describe, it, expect } from 'vitest';
import { escapeCsvField, columnHeader, specTableToCsv } from '../src/lib/csv';

describe('escapeCsvField', () => {
  it('leaves a plain value untouched', () => {
    expect(escapeCsvField('0.27')).toBe('0.27');
  });

  it('quotes a value containing a comma', () => {
    expect(escapeCsvField('TPU, black')).toBe('"TPU, black"');
  });

  it('quotes and doubles an embedded double quote', () => {
    expect(escapeCsvField('12" tube')).toBe('"12"" tube"');
  });

  it('quotes a value containing a newline', () => {
    expect(escapeCsvField('a\nb')).toBe('"a\nb"');
  });

  it('does not quote an apostrophe, which is not a CSV metacharacter', () => {
    expect(escapeCsvField("010/N(K)30'*3/1S")).toBe("010/N(K)30'*3/1S");
  });
});

describe('columnHeader', () => {
  it('returns the bare label when there is no unit', () => {
    expect(columnHeader({ key: 'item', label: 'Item' })).toBe('Item');
  });

  it('appends the unit in parentheses', () => {
    expect(columnHeader({ key: 'r', label: 'Resistance', unit: 'Ω/M' }))
      .toBe('Resistance (Ω/M)');
  });
});

describe('specTableToCsv', () => {
  const table = {
    columns: [
      { key: 'item', label: 'Item' },
      { key: 'resistance', label: 'Resistance', unit: 'Ω/M' },
    ],
    rows: [
      { item: "010/N(K)30'*3/1S", resistance: '~4.4' },
      { item: "010/N(K)30'*3/1S1Z", resistance: '~2.5' },
    ],
  };

  it('emits a header row built from labels and units', () => {
    expect(specTableToCsv(table).split('\r\n')[0]).toBe('Item,Resistance (Ω/M)');
  });

  it('emits one line per row, CRLF separated', () => {
    expect(specTableToCsv(table).split('\r\n')).toHaveLength(3);
  });

  it('orders cells by column, not by object key order', () => {
    const reordered = {
      columns: table.columns,
      rows: [{ resistance: '~4.4', item: 'X' }],
    };
    expect(specTableToCsv(reordered).split('\r\n')[1]).toBe('X,~4.4');
  });

  it('renders a missing cell as an em dash rather than the string undefined', () => {
    const sparse = { columns: table.columns, rows: [{ item: 'X' }] };
    expect(specTableToCsv(sparse).split('\r\n')[1]).toBe('X,—');
  });

  it('has no trailing newline, so pasting does not create a blank row', () => {
    expect(specTableToCsv(table).endsWith('\r\n')).toBe(false);
  });
});

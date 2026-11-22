// CSV for spreadsheet programs: RFC 4180 quoting, a UTF-8 byte-order mark so Excel reads accents,
// and a guard against formula injection (a cell that starts with = + - @ is read as a formula).
export type CsvCell = string | number | boolean | null | undefined;

const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  // Numbers and booleans are data, not text a spreadsheet could execute.
  if (typeof v === 'string' && FORMULA_START.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** A CSV document: a header row of `columns` (field -> header text) and one row per record. */
export function toCsv(rows: Record<string, unknown>[], columns: { field: string; header: string }[]): string {
  const lines = [columns.map((c) => csvCell(c.header)).join(',')];
  for (const r of rows) lines.push(columns.map((c) => csvCell(r[c.field])).join(','));
  return `﻿${lines.join('\r\n')}\r\n`;
}

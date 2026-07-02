/**
 * Pure helpers for the investor-comparison analytics engine.
 * No React, no DB, no globals.
 */

export const r2 = (v: number) => Math.round(v * 100) / 100;

export const toNum = (v: string | null | undefined): number => {
  if (v === null || v === undefined) return 0;
  const s = String(v).trim();
  if (!s || s.toLowerCase() === 'n/a' || s.toLowerCase() === 'na') return 0;
  const n = parseFloat(s.replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
};

export const isYes = (v: string | null | undefined): boolean => {
  if (v === null || v === undefined) return false;
  const s = String(v).toLowerCase().trim();
  return s === 'yes' || s === 'y' || s === 'true' || s === '1';
};

export const safeDiv = (num: number, den: number): number => (den > 0 ? num / den : 0);
export const pct = (num: number, den: number): number => (den > 0 ? (num / den) * 100 : 0);

export const sum = (arr: number[]): number => arr.reduce((a, b) => a + b, 0);
export const mean = (arr: number[]): number => (arr.length > 0 ? sum(arr) / arr.length : 0);

/** Min-max normalization to 0-100. Non-positive values are excluded from min/max and mapped to 0. */
export function minMax(values: number[], inverse = false): number[] {
  const active = values.filter(v => v > 0);
  if (active.length === 0) return values.map(() => 0);
  const min = Math.min(...active);
  const max = Math.max(...active);
  if (max === min) return values.map(v => (v > 0 ? 100 : 0));
  return values.map(v => {
    if (v <= 0) return 0;
    return inverse ? r2(((max - v) / (max - min)) * 100) : r2(((v - min) / (max - min)) * 100);
  });
}

/** Group KPI entries into a company → kpiId → value map (last-write-wins). */
export function groupByCompany(entries: { companyId: string; kpiId: string; value: string | null }[]): Map<string, Record<string, string>> {
  const map = new Map<string, Record<string, string>>();
  for (const e of entries) {
    if (!map.has(e.companyId)) map.set(e.companyId, {});
    map.get(e.companyId)![e.kpiId] = e.value ?? '';
  }
  return map;
}

// ══════════════════════════════════════════════════════════════════════════════
// Reusable period-filter utilities.
// Given a filter (year + optional quarter + period mode) returns the list of
// { quarter, year } slices that should be considered.
//
// Behaviour:
//  • period = 'annual'                  → [{ FY, year }]
//  • period = 'quarterly' + quarter     → [{ quarter, year }] (single slice, e.g. only Q1)
//  • period = 'quarterly' + no quarter  → all four quarters of the year
//  • period = 'ytd'                     → Q1..selectedQuarter of the year
// ══════════════════════════════════════════════════════════════════════════════

export type PeriodMode = 'quarterly' | 'annual' | 'ytd';
export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
export type Quarter = typeof QUARTERS[number];

export interface PeriodFilter {
  period: PeriodMode;
  year: number;
  quarter?: string;
}

export interface PeriodSlice {
  quarter: string;
  year: number;
}

/**
 * Build the array of period slices matching the caller's filter.
 * Pure function — no side effects.
 */
export function buildPeriods(filter: PeriodFilter): PeriodSlice[] {
  const { period, year, quarter } = filter;

  if (period === 'annual') {
    return [{ quarter: 'FY', year }];
  }

  if (period === 'ytd') {
    const endIdx = quarter ? QUARTERS.indexOf(quarter as Quarter) : QUARTERS.length - 1;
    const safeEnd = endIdx >= 0 ? endIdx : QUARTERS.length - 1;
    return QUARTERS.slice(0, safeEnd + 1).map(q => ({ quarter: q, year }));
  }

  // 'quarterly'
  if (quarter && (QUARTERS as readonly string[]).includes(quarter)) {
    return [{ quarter, year }];
  }
  return QUARTERS.map(q => ({ quarter: q, year }));
}

/**
 * Same as buildPeriods, but returns just the quarter labels (no year).
 * Useful when the caller already knows the year.
 */
export function buildQuarterLabels(filter: PeriodFilter): string[] {
  return buildPeriods(filter).map(p => p.quarter);
}

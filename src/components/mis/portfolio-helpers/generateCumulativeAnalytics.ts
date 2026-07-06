/**
 * generateCumulativeAnalytics
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure helper. Takes an arbitrary set of KPI entries spanning ANY quarters
 * and ANY years (e.g. 2025 Q1-Q4 + FY + 2026 Q1) and produces a single
 * cumulative analytics snapshot per company.
 *
 * Merge strategy is the same as `mergeEntriesAcrossPeriods`:
 *   - _pct / _rate / _ratio suffixes → mean of non-empty numerics
 *   - EPR / VPN caps → sum capped at 100
 *   - vendor_mis_*_num_vendors → latest snapshot
 *   - default numeric → sum
 *   - text → last non-empty
 *
 * The merged bucket is passed to `generateAnalytics` with a synthetic period
 * `{ quarter: 'CUMULATIVE', year: <max year seen> }`.
 *
 * Caller responsibilities (unchanged):
 *   - Pre-filter `entries` to the companies you care about.
 *   - Pass the same `companies` context you use elsewhere.
 */

import { generateAnalytics } from './generateAnalytics';
import { mergeEntriesAcrossPeriods } from './mergeEntries';
import type { AnalyticsContext, AnalyticsResult, KPIEntryInput } from './types';

export interface CumulativeAnalyticsResult extends AnalyticsResult {
  /** Range summary of what was cumulated. */
  coverage: {
    yearMin: number;
    yearMax: number;
    quarters: string[];   // distinct quarter labels seen in input
    entryCount: number;   // raw entries in
    mergedCount: number;  // one row per (companyId, kpiId)
  };
}

export function generateCumulativeAnalytics(
  entries: KPIEntryInput[],
  ctx: AnalyticsContext,
): CumulativeAnalyticsResult {
  // 1) Merge everything across (companyId, kpiId), regardless of quarter/year.
  //    mergeEntriesAcrossPeriods already handles the per-key aggregation rules;
  //    we just don't restrict the input to one year.
  const merged = mergeEntriesAcrossPeriods(entries);

  // 2) Coverage summary (before we overwrite quarter/year on merged rows)
  const years = entries.map(e => e.year).filter(y => Number.isFinite(y));
  const yearMax = years.length ? Math.max(...years) : 0;
  const yearMin = years.length ? Math.min(...years) : 0;
  const quarters = Array.from(new Set(entries.map(e => e.quarter))).sort();

  // 3) Force a synthetic period on merged rows.
  const stamped: KPIEntryInput[] = merged.map(e => ({
    ...e,
    quarter: 'CUMULATIVE',
    year: yearMax,
  }));

  // 4) Run the standard analytics pipeline on merged data with cumulative period stamp.
  const analytics = generateAnalytics(stamped, ctx, { mode: 'cumulative' });

  return {
    ...analytics,
    coverage: {
      yearMin,
      yearMax,
      quarters,
      entryCount: entries.length,
      mergedCount: merged.length,
    },
  };
}

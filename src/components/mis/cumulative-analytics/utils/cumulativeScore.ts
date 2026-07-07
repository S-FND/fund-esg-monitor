/**
 * cumulativeScore
 * ─────────────────────────────────────────────────────────────────────────────
 * Per-company ESG scores (E/S/G/Composite + AA-C grade) computed from the
 * cumulative dataset. Wraps `computePortfolioScores` from the shared math
 * library.
 */
import {
  computePortfolioScores,
  type Company,
  type KPIEntryInput,
  type PortfolioScoreOutput,
} from '../lib/portfolio-helpers';
import type { EnabledSlice } from '@/services/quarterConfig';

export interface CumulativeScoreInput {
  entries: KPIEntryInput[];
  companies: Company[];
  enabledSlices: EnabledSlice[];
}

/**
 * Restamp every entry to a single synthetic reporting year while preserving its
 * original quarter label (Q1..Q4/FY/Annual). For each (companyId, kpiId,
 * quarter) triple we keep the most-recent-year value, so a company that
 * reported net_revenue in 2025-Q1 AND 2026-Q1 uses the 2026 value; 2025-Q2/Q3/Q4
 * still fill the other quarter slots. This lets `computePortfolioScores`
 * annual-mode run its OWN Q1-Q4+FY combine (identical to Admin Dashboard's
 * annual scoring path — the one that produces 62% for 2025) across the full
 * cumulative window without double-counting quarters or breaking percentage
 * detection.
 */
function collapseAcrossYears(entries: KPIEntryInput[], refYear: number): KPIEntryInput[] {
  const bestByYear = new Map<string, KPIEntryInput>();
  for (const e of entries) {
    const key = `${e.companyId}::${e.kpiId}::${e.quarter}`;
    const prev = bestByYear.get(key);
    if (!prev || e.year > prev.year) bestByYear.set(key, e);
  }
  return Array.from(bestByYear.values()).map(e => ({ ...e, year: refYear }));
}

export function scoreCumulative({
  entries,
  companies,
  enabledSlices,
}: CumulativeScoreInput): PortfolioScoreOutput {
  const years = enabledSlices.map(s => s.year).filter(y => Number.isFinite(y));
  const refYear = years.length ? Math.max(...years) : new Date().getFullYear();

  const allowed = new Set(companies.map(c => c.id));
  const scoped = entries.filter(e => allowed.has(e.companyId));
  const collapsed = collapseAcrossYears(scoped, refYear);

  const { result } = computePortfolioScores({
    companies,
    entries: collapsed,
    period: { mode: 'annual', year: refYear },
  });
  return result;
}

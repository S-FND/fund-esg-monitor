/**
 * cumulativeRanking
 * ─────────────────────────────────────────────────────────────────────────────
 * Recomputes Overall / Completeness / Consistency / Timeliness rankings from
 * a cumulative dataset. The most recent enabled slice is used as the ranking
 * reference period so that percentile bucketing behaves the same way as the
 * quarterly Admin Dashboard's Company Rankings panel.
 */
import {
  computePortfolioRankings,
  type Company,
  type KPIEntryInput,
  type PortfolioRankingsResult,
} from '../lib/portfolio-helpers';
import type { EnabledSlice } from '@/services/quarterConfig';

export interface CumulativeRankingInput {
  entries: KPIEntryInput[];
  companies: Company[];
  enabledSlices: EnabledSlice[];
}

/** Same collapse strategy used by `scoreCumulative` — see that file for docs. */
function collapseAcrossYears(entries: KPIEntryInput[], refYear: number): KPIEntryInput[] {
  const bestByYear = new Map<string, KPIEntryInput>();
  for (const e of entries) {
    const key = `${e.companyId}::${e.kpiId}::${e.quarter}`;
    const prev = bestByYear.get(key);
    if (!prev || e.year > prev.year) bestByYear.set(key, e);
  }
  return Array.from(bestByYear.values()).map(e => ({ ...e, year: refYear }));
}

export function rankCumulative({
  entries,
  companies,
  enabledSlices,
}: CumulativeRankingInput): PortfolioRankingsResult {
  const years = enabledSlices.map(s => s.year).filter(y => Number.isFinite(y));
  const refYear = years.length ? Math.max(...years) : new Date().getFullYear();

  const allowed = new Set(companies.map(c => c.id));
  const scoped = entries.filter(e => allowed.has(e.companyId));
  const collapsed = collapseAcrossYears(scoped, refYear);

  const { result } = computePortfolioRankings({
    companies,
    entries: collapsed,
    period: { mode: 'annual', year: refYear },
  });
  return result;
}

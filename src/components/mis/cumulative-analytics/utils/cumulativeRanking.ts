/**
 * cumulativeRanking
 * ─────────────────────────────────────────────────────────────────────────────
 * Recomputes Overall / Completeness / Consistency / Timeliness rankings from
 * a cumulative dataset. To match the Admin Dashboard exactly (and avoid the
 * inflated Timeliness that happens when submission timestamps are compared
 * against a synthetic future deadline), we score each dashboard-equivalent
 * period on its OWN real reporting year and then average the per-period
 * results — the same strategy `scoreCumulative` uses for ESG scores.
 */
import {
  computePortfolioRankings,
  scoreToGrade,
  type Company,
  type KPIEntryInput,
  type PortfolioRankingsResult,
  type CompanyRankingOutput,
} from '../lib/portfolio-helpers';
import { EnabledSlice } from '../services/quarterConfig';

export interface CumulativeRankingInput {
  entries: KPIEntryInput[];
  companies: Company[];
  enabledSlices: EnabledSlice[];
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
type Quarter = typeof QUARTERS[number];

type DashboardEquivalentPeriod =
  | { mode: 'annual'; year: number }
  | { mode: 'quarterly'; year: number; quarter: Quarter };

const r2 = (v: number) => Math.round(v * 100) / 100;
const mean = (values: number[]) =>
  values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;

function getDashboardEquivalentPeriods(enabledSlices: EnabledSlice[]): DashboardEquivalentPeriod[] {
  const byYear = new Map<number, Set<string>>();
  for (const slice of enabledSlices) {
    if (!Number.isFinite(slice.year) || !QUARTERS.includes(slice.quarter as Quarter)) continue;
    if (!byYear.has(slice.year)) byYear.set(slice.year, new Set());
    byYear.get(slice.year)!.add(slice.quarter);
  }
  return Array.from(byYear.entries())
    .sort(([a], [b]) => a - b)
    .flatMap<DashboardEquivalentPeriod>(([year, quarters]) => {
      const enabledQuarters = QUARTERS.filter(q => quarters.has(q));
      if (enabledQuarters.length === QUARTERS.length) return [{ mode: 'annual' as const, year }];
      return enabledQuarters.map(quarter => ({ mode: 'quarterly' as const, year, quarter }));
    });
}

function hasEntriesForPeriod(entries: KPIEntryInput[], period: DashboardEquivalentPeriod): boolean {
  return entries.some(e => {
    if (e.year !== period.year) return false;
    if (period.mode === 'annual')
      return QUARTERS.includes(e.quarter as Quarter) || e.quarter === 'FY' || e.quarter === 'Annual';
    return e.quarter === period.quarter;
  });
}

export function rankCumulative({
  entries,
  companies,
  enabledSlices,
}: CumulativeRankingInput): PortfolioRankingsResult {
  const allowed = new Set(companies.map(c => c.id));
  const scoped = entries.filter(e => allowed.has(e.companyId));

  const dashboardPeriods = getDashboardEquivalentPeriods(enabledSlices)
    .filter(period => hasEntriesForPeriod(scoped, period));

  // Fallback: no valid dashboard-equivalent periods → single annual run on the
  // most recent enabled year (legacy behaviour).
  if (dashboardPeriods.length === 0) {
    const years = enabledSlices.map(s => s.year).filter(y => Number.isFinite(y));
    const refYear = years.length ? Math.max(...years) : new Date().getFullYear();
    const { result } = computePortfolioRankings({
      companies,
      entries: scoped,
      period: { mode: 'annual', year: refYear },
    });
    return result;
  }

  const periodResults = dashboardPeriods.map(period =>
    computePortfolioRankings({ companies, entries: scoped, period }).result,
  );

  const perCompany: CompanyRankingOutput[] = companies.map(company => {
    const rows = periodResults
      .map(r => r.perCompany.find(c => c.companyId === company.id))
      .filter((row): row is CompanyRankingOutput => !!row);

    if (rows.length === 0) {
      return {
        companyId: company.id,
        companyName: company.brand || company.name,
        brand: company.brand || company.name,
        industry: company.industry || '',
        completionPct: 0,
        consistencyPct: 0,
        timelinessScore: 0,
        overallScore: 0,
        completenessPercentile: 1,
        consistencyPercentile: 1,
        timelinessPercentile: 1,
        overallPercentile: 1,
        esgCompleteness: { E: 0, S: 0, G: 0, overall: 0 },
        grade: scoreToGrade(0),
      };
    }

    const completionPct = r2(mean(rows.map(r => r.completionPct)));
    const consistencyPct = r2(mean(rows.map(r => r.consistencyPct)));
    const timelinessScore = r2(mean(rows.map(r => r.timelinessScore)));
    const completenessPercentile = r2(mean(rows.map(r => r.completenessPercentile)));
    const consistencyPercentile = r2(mean(rows.map(r => r.consistencyPercentile)));
    const timelinessPercentile = r2(mean(rows.map(r => r.timelinessPercentile)));
    const overallScore = r2(mean(rows.map(r => r.overallScore)));
    const overallPercentile = r2(mean(rows.map(r => r.overallPercentile)));

    return {
      companyId: company.id,
      companyName: company.brand || company.name,
      brand: company.brand || company.name,
      industry: company.industry || '',
      completionPct,
      consistencyPct,
      timelinessScore,
      overallScore,
      completenessPercentile,
      consistencyPercentile,
      timelinessPercentile,
      overallPercentile,
      esgCompleteness: {
        E: r2(mean(rows.map(r => r.esgCompleteness.E))),
        S: r2(mean(rows.map(r => r.esgCompleteness.S))),
        G: r2(mean(rows.map(r => r.esgCompleteness.G))),
        overall: completionPct,
      },
      grade: scoreToGrade(overallScore),
    };
  });

  const avg = (get: (c: CompanyRankingOutput) => number) =>
    perCompany.length === 0 ? 0 : r2(perCompany.reduce((s, c) => s + get(c), 0) / perCompany.length);

  const gradeCounts: Record<'AA' | 'A' | 'BB' | 'B' | 'C', number> = { AA: 0, A: 0, BB: 0, B: 0, C: 0 };
  perCompany.forEach(c => { gradeCounts[c.grade]++; });

  const avgCompletenessScore = avg(c => c.completionPct);
  const avgConsistencyScore = avg(c => c.consistencyPct);
  const avgTimelinessScore = avg(c => c.timelinessScore);

  return {
    perCompany,
    summary: {
      totalCompanies: perCompany.length,
      avgCompletenessScore,
      avgConsistencyScore,
      avgTimelinessScore,
      avgOverallScore: r2((avgCompletenessScore + avgConsistencyScore + avgTimelinessScore) / 3),
      avgCompletenessPercentile: avg(c => c.completenessPercentile),
      avgConsistencyPercentile: avg(c => c.consistencyPercentile),
      avgTimelinessPercentile: avg(c => c.timelinessPercentile),
      avgOverallPercentile: avg(c => c.overallPercentile),
      gradeCounts,
    },
  };
}

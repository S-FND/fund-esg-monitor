/**
 * cumulativeScore
 * ─────────────────────────────────────────────────────────────────────────────
 * Per-company ESG scores (E/S/G/Composite + AA-C grade) computed from the
 * cumulative dataset. Wraps `computePortfolioScores` from the shared math
 * library.
 */
import {
  computePortfolioScores,
  scoreToGrade,
  type Company,
  type KPIEntryInput,
  type PortfolioScoreOutput,
} from '../lib/portfolio-helpers';
import { EnabledSlice } from '../services/quarterConfig';

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

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
type Quarter = typeof QUARTERS[number];

type DashboardEquivalentPeriod =
  | { mode: 'annual'; year: number }
  | { mode: 'quarterly'; year: number; quarter: Quarter };

const r1 = (v: number) => Math.round(v * 10) / 10;
const mean = (values: number[]) => values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;

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
    if (period.mode === 'annual') return QUARTERS.includes(e.quarter as Quarter) || e.quarter === 'FY' || e.quarter === 'Annual';
    return e.quarter === period.quarter;
  });
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
  const dashboardPeriods = getDashboardEquivalentPeriods(enabledSlices)
    .filter(period => hasEntriesForPeriod(scoped, period));

  // Match Admin Dashboard scoring exactly: score each complete admin-equivalent
  // period first (annual for full Q1-Q4 years, quarterly for partial years),
  // then average those already-normalized dashboard outputs. This avoids the
  // synthetic cross-year raw merge that was collapsing Environment to ~5%.
  if (dashboardPeriods.length > 0) {
    const periodResults = dashboardPeriods.map(period => computePortfolioScores({
      companies,
      entries: scoped,
      period,
    }).result);

    const avgScore = (key: keyof PortfolioScoreOutput['scores']) => r1(mean(periodResults.map(r => r.scores[key] ?? 0)));
    const environmentScore = avgScore('environmentScore');
    const socialScore = avgScore('socialScore');
    const governanceScore = avgScore('governanceScore');
    const compositeScore = avgScore('compositeScore');

    const perCompany = companies.map(company => {
      const rows = periodResults
        .map(r => r.perCompany.find(c => c.companyId === company.id))
        .filter((row): row is PortfolioScoreOutput['perCompany'][number] => !!row);
      const rowEnvironment = r1(mean(rows.map(r => r.environmentScore)));
      const rowSocial = r1(mean(rows.map(r => r.socialScore)));
      const rowGovernance = r1(mean(rows.map(r => r.governanceScore)));
      const rowComposite = r1(mean(rows.map(r => r.compositeScore)));
      return {
        companyId: company.id,
        companyName: company.brand || company.name,
        hasEnvironmentFeature: rows.some(r => r.hasEnvironmentFeature),
        environmentScore: rowEnvironment,
        socialScore: rowSocial,
        governanceScore: rowGovernance,
        compositeScore: rowComposite,
        grade: scoreToGrade(rowComposite),
      };
    });

    return {
      period: { quarter: 'CUMULATIVE', year: refYear },
      scores: { environmentScore, socialScore, governanceScore, compositeScore },
      grades: {
        environment: scoreToGrade(environmentScore),
        social: scoreToGrade(socialScore),
        governance: scoreToGrade(governanceScore),
        composite: scoreToGrade(compositeScore),
      },
      perCompany,
      summary: {
        companyCount: companies.length,
        submittingCompanyCount: new Set(scoped.map(e => e.companyId)).size,
        averages: { environmentScore, socialScore, governanceScore, compositeScore },
      },
    };
  }

  const collapsed = collapseAcrossYears(scoped, refYear);

  const { result } = computePortfolioScores({
    companies,
    entries: collapsed,
    period: { mode: 'annual', year: refYear },
  });
  return result;
}

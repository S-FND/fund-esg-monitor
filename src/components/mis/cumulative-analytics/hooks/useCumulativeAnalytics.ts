/**
 * useCumulativeAnalytics
 * ─────────────────────────────────────────────────────────────────────────────
 * PURE hook — no API calls, no data fetching. The caller supplies:
 *   • allEntries        — the full KPI entry universe (all years, all quarters)
 *   • allFeatures       — full company_feature_settings map
 *                         ({ [companyId]: { [featureKey]: boolean } })
 *   • filters           — UI filters (industry / fund / company / etc.)
 *   • enabledSlices?    — OPTIONAL. When omitted, falls back to
 *                         DEFAULT_CUMULATIVE_SLICES (Q1..Q4 2025 + Q1 2026).
 *
 * The hook slices the universe down to the enabled (year, quarter) set plus
 * the FY/Annual overlays for each covered year, then runs the aggregation,
 * scoring and ranking utilities.
 */
import { useMemo } from 'react';
import { mockCompanies } from '@/data/mockData';
import { isCompanyExcluded } from '@/lib/companyExclusions';
import { aggregateCumulative } from '../utils/cumulativeAggregation';
import { rankCumulative } from '../utils/cumulativeRanking';
import { scoreCumulative } from '../utils/cumulativeScore';
import type {
  AnalyticsContext,
  CumulativeAnalyticsResult,
  KPIEntryInput,
  PortfolioRankingsResult,
  PortfolioScoreOutput,
} from '../lib/portfolio-helpers';
import { EnabledSlice } from '../services/quarterConfig';

export interface CumulativeFilters {
  industry?: string;
  fund?: string;
  revenueStage?: string;
  qCategory?: string;
  firesidePOC?: string;
  companyId?: string;
}

export type FeatureFlagsMap = Record<string, Record<string, boolean>>;

export interface CumulativeAnalyticsData {
  analytics: CumulativeAnalyticsResult;
  scores: PortfolioScoreOutput;
  rankings: PortfolioRankingsResult;
}

export interface UseCumulativeAnalyticsInput {
  allEntries: KPIEntryInput[];
  allFeatures: FeatureFlagsMap;
  filters: CumulativeFilters;
  /** Optional override. Defaults to DEFAULT_CUMULATIVE_SLICES. */
  enabledSlices?: EnabledSlice[];
}

/**
 * Default consolidation window used when the caller doesn't pass
 * `enabledSlices`: Q1..Q4 of 2025 plus Q1 of 2026 (the currently opened
 * quarter). FY/Annual overlays are added automatically per year.
 */
export const DEFAULT_CUMULATIVE_SLICES: EnabledSlice[] = [
  { year: 2025, quarter: 'Q1' },
  { year: 2025, quarter: 'Q2' },
  { year: 2025, quarter: 'Q3' },
  { year: 2025, quarter: 'Q4' },
  { year: 2026, quarter: 'Q1' },
];

/**
 * Given a base list of quarter slices, returns the full slice set to pull
 * for cumulative processing — i.e. the base slices plus the FY / Annual
 * overlay for every year touched by the base set.
 */
export function expandSlicesWithAnnualOverlays(base: EnabledSlice[]): EnabledSlice[] {
  const years = new Set(base.map(s => s.year));
  const overlays: EnabledSlice[] = [];
  for (const y of years) {
    overlays.push({ year: y, quarter: 'FY' });
    overlays.push({ year: y, quarter: 'Annual' });
  }
  const seen = new Set<string>();
  return [...base, ...overlays].filter(s => {
    const k = `${s.year}::${s.quarter}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function useCumulativeAnalytics({
  allEntries,
  allFeatures,
  filters,
  enabledSlices,
}: UseCumulativeAnalyticsInput) {
  const slices = useMemo(
    () => (enabledSlices && enabledSlices.length > 0 ? enabledSlices : DEFAULT_CUMULATIVE_SLICES),
    [enabledSlices],
  );

  // Stable identity for downstream memoization.
  const sliceKey = useMemo(
    () => slices.map(s => `${s.year}-${s.quarter}`).sort().join('|'),
    [slices],
  );

  // 1) Slice the entry universe down to the enabled (year, quarter) set +
  //    FY/Annual overlays for each year in the set.
  const entries = useMemo(() => {
    if (!allEntries || allEntries.length === 0) return [];
    const wanted = new Set(
      expandSlicesWithAnnualOverlays(slices).map(s => `${s.year}::${s.quarter}`),
    );
    return allEntries.filter(e => wanted.has(`${e.year}::${e.quarter}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allEntries, sliceKey]);

  // 2) Only companies that reported at least one KPI in the window
  //    participate — mirrors the previous behavior.
  const reportingIds = useMemo(() => {
    const s = new Set<string>();
    for (const e of entries) s.add(e.companyId);
    return s;
  }, [entries]);

  // 3) Build the analytics context (filtered Invested companies + their
  //    feature flags).
  const context: AnalyticsContext = useMemo(() => {
    const invested = mockCompanies.filter(c => {
      if ((c as any).investmentStatus !== 'Invested') return false;
      const excludedFromAll =
        slices.length > 0 && slices.every(s => isCompanyExcluded(c.id, s.quarter, s.year));
      if (excludedFromAll) return false;
      if (reportingIds.size > 0 && !reportingIds.has(c.id)) return false;
      if (filters.industry && (c as any).industry !== filters.industry) return false;
      if (filters.fund && (c as any).fund !== filters.fund) return false;
      if (filters.revenueStage && (c as any).revenueStage !== filters.revenueStage) return false;
      if (filters.qCategory && (c as any).qCategory !== filters.qCategory) return false;
      if (filters.firesidePOC && (c as any).fl !== filters.firesidePOC) return false;
      if (filters.companyId && c.id !== filters.companyId) return false;
      return true;
    });
    return {
      companies: invested.map(c => ({
        id: c.id,
        name: c.name,
        brand: c.brand,
        industry: c.industry,
        revenueStage: c.revenueStage,
        features: allFeatures?.[c.id] ?? {},
      })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sliceKey,
    allFeatures,
    reportingIds,
    filters.industry,
    filters.fund,
    filters.revenueStage,
    filters.qCategory,
    filters.firesidePOC,
    filters.companyId,
  ]);

  // 4) Run the three cumulative pipelines.
  const data: CumulativeAnalyticsData | null = useMemo(() => {
    if (context.companies.length === 0 || entries.length === 0) return null;
    const analytics = aggregateCumulative({ entries, context });
    const scores = scoreCumulative({ entries, companies: context.companies, enabledSlices: slices });
    const rankings = rankCumulative({ entries, companies: context.companies, enabledSlices: slices });
    return { analytics, scores, rankings };
  }, [entries, context, slices]);

  return {
    data,
    enabledSlices: slices,
    companyCount: context.companies.length,
  };
}

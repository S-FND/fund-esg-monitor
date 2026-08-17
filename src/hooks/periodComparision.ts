// useComparePeriods.ts
import { useMemo } from "react";
import { AnalyticsFilters, InsightMetrics, CompanyRawMetrics, useAnalyticsDashboardData } from "@/hooks/useAnalyticsDashboardData";
import { usePortfolioRankings } from "@/hooks/usePortfolioRankings";
import { usePortfolioRankingsV1 } from "@/hooks/usePortfolioRankingsV1";

// ──── Types ────

export type Trend = 'up' | 'down' | 'stable' | 'new';

export interface CompanyTrendEntry {
  brand: string;
  scoreA?: number;
  scoreB: number;
  percentileA?: number;
  percentileB: number;
  categoryA?: string;
  categoryB: string;
  trend: Trend;
}

export interface MetricCardResult {
  key: string;
  label: string;
  valueA?: number;
  valueB: number;
  countA: number;
  countB: number;
  companies: CompanyTrendEntry[];
}

export interface UseComparePeriodsResult {
  rankingCards: MetricCardResult[];
  esgCards: MetricCardResult[];
  isLoading: boolean;
}

// ──── Shared scoring helpers (identical logic to TrendsComparisonPage) ────

const CATEGORY_RANK: Record<string, number> = { AA: 5, A: 4, BB: 3, B: 2, C: 1 };

const getCategoryForPercentile = (percentile: number): string => {
  if (percentile >= 80) return 'AA';
  if (percentile >= 60) return 'A';
  if (percentile >= 40) return 'BB';
  if (percentile >= 20) return 'B';
  return 'C';
};

const assignPercentiles = <T extends { brand: string; score: number }>(
  companies: T[]
): (T & { percentile: number })[] => {
  if (companies.length === 0) return [];
  if (companies.length === 1) return [{ ...companies[0], percentile: 99 }];
  const sorted = [...companies].sort((a, b) => {
    const diff = a.score - b.score;
    return diff !== 0 ? diff : a.brand.localeCompare(b.brand);
  });
  const n = sorted.length;
  return sorted.map((c, idx) => ({
    ...c,
    percentile: Math.max(1, Math.min(99, Math.round(((idx + 1) / n) * 99))),
  }));
};

const computeTrend = (categoryB: string, categoryA?: string): Trend => {
  if (!categoryA) return 'new';
  const rankA = CATEGORY_RANK[categoryA];
  const rankB = CATEGORY_RANK[categoryB];
  if (rankA === rankB) return 'stable';
  return rankB > rankA ? 'up' : 'down';
};

const computeAvg = (vals: number[]): number | undefined => {
  const clean = vals.filter(v => v !== undefined && v !== null && !isNaN(v));
  if (clean.length === 0) return undefined;
  return Math.round((clean.reduce((s, v) => s + v, 0) / clean.length) * 10) / 10;
};

function buildMetricCard(
  key: string,
  label: string,
  poolA: { brand: string; score: number }[],
  poolB: { brand: string; score: number }[],
  filteredBrands?: string[]
): MetricCardResult {
  const filterFn = (c: { brand: string }) =>
    !filteredBrands || filteredBrands.length === 0 || filteredBrands.includes(c.brand);

  const filteredPoolA = poolA.filter(filterFn);
  const filteredPoolB = poolB.filter(filterFn);

  const withPercentilesA = assignPercentiles(filteredPoolA);
  const withPercentilesB = assignPercentiles(filteredPoolB);

  const aByBrand = new Map(withPercentilesA.map(c => [c.brand, c]));

  const companies: CompanyTrendEntry[] = withPercentilesB.map(b => {
    const a = aByBrand.get(b.brand);
    const categoryB = getCategoryForPercentile(b.percentile);
    const categoryA = a ? getCategoryForPercentile(a.percentile) : undefined;

    return {
      brand: b.brand,
      scoreA: a?.score,
      scoreB: b.score,
      percentileA: a?.percentile,
      percentileB: b.percentile,
      categoryA,
      categoryB,
      trend: computeTrend(categoryB, categoryA),
    };
  });

  return {
    key,
    label,
    valueA: computeAvg(filteredPoolA.map(c => c.score)),
    valueB: computeAvg(filteredPoolB.map(c => c.score)) ?? 0,
    countA: filteredPoolA.length,
    countB: filteredPoolB.length,
    companies: companies.sort((x, y) => y.percentileB - x.percentileB),
  };
}

// ──── Main hook — calls the SAME data hooks your component already uses ────

export function useComparePeriods(
  periodAFilters: AnalyticsFilters,
  periodBFilters: AnalyticsFilters,
  newInsight: boolean,
  baseFilters: AnalyticsFilters | undefined,
  filteredCompanyBrands?: string[]
): UseComparePeriodsResult {
  // ── Period A rankings (same dual-hook pattern as TrendsComparisonPage) ──
  const rankingsAV1 = usePortfolioRankings(periodAFilters.year, periodAFilters.quarter || "FY", periodAFilters.cumulative, null, baseFilters);
  const rankingsAV2 = usePortfolioRankingsV1(periodAFilters.year, periodAFilters.quarter || "FY", periodAFilters.cumulative, baseFilters);
  const { rankings: allRankingsA, isLoading: rankingsALoading } = newInsight ? rankingsAV2 : rankingsAV1;

  // ── Period B rankings ──
  const rankingsBV1 = usePortfolioRankings(periodBFilters.year, periodBFilters.quarter || "FY", periodBFilters.cumulative, null, baseFilters);
  const rankingsBV2 = usePortfolioRankingsV1(periodBFilters.year, periodBFilters.quarter || "FY", periodBFilters.cumulative, baseFilters);
  const { rankings: allRankingsB, isLoading: rankingsBLoading } = newInsight ? rankingsBV2 : rankingsBV1;

  // ── Full analytics data for ESG insights + companyRawData ──
  const { data: analyticsA, isLoading: analyticsALoading } = useAnalyticsDashboardData(periodAFilters);
  const { data: analyticsB, isLoading: analyticsBLoading } = useAnalyticsDashboardData(periodBFilters);

  const companyRawDataA = analyticsA?.quarterlyCombinedRawData || analyticsA?.companyRawData || [];
  const companyRawDataB = analyticsB?.quarterlyCombinedRawData || analyticsB?.companyRawData || [];

  const isLoading = rankingsALoading || rankingsBLoading || analyticsALoading || analyticsBLoading;

  const result = useMemo<Pick<UseComparePeriodsResult, 'rankingCards' | 'esgCards'>>(() => {
    // ── Ranking metrics (Responsiveness Score) ──
    const overallA = allRankingsA.map(r => ({
      brand: r.brand,
      score: Math.round(((r.completionPct + r.consistencyPct + r.timelinessScore) / 3) * 10) / 10,
    }));
    const overallB = allRankingsB.map(r => ({
      brand: r.brand,
      score: Math.round(((r.completionPct + r.consistencyPct + r.timelinessScore) / 3) * 10) / 10,
    }));

    const rankingCards: MetricCardResult[] = [
      buildMetricCard('overall', 'Responsiveness Score', overallA, overallB, filteredCompanyBrands),
      buildMetricCard(
        'completeness', 'Completeness',
        allRankingsA.map(r => ({ brand: r.brand, score: r.completionPct })),
        allRankingsB.map(r => ({ brand: r.brand, score: r.completionPct })),
        filteredCompanyBrands
      ),
      buildMetricCard(
        'consistency', 'Consistency',
        allRankingsA.map(r => ({ brand: r.brand, score: r.consistencyPct })),
        allRankingsB.map(r => ({ brand: r.brand, score: r.consistencyPct })),
        filteredCompanyBrands
      ),
      buildMetricCard(
        'timeliness', 'Timeliness',
        allRankingsA.map(r => ({ brand: r.brand, score: r.timelinessScore })),
        allRankingsB.map(r => ({ brand: r.brand, score: r.timelinessScore })),
        filteredCompanyBrands
      ),
    ];

    // ── ESG metrics ──
    const submittingA = companyRawDataA.filter(c => Object.keys(c.kpis).length > 0);
    const submittingB = companyRawDataB.filter(c => Object.keys(c.kpis).length > 0);
    const envA = submittingA.filter(c => c.hasEnvironmentFeature);
    const envB = submittingB.filter(c => c.hasEnvironmentFeature);

    const toPool = (pool: CompanyRawMetrics[], metric: keyof InsightMetrics) =>
      pool
        .filter(c => c.insights[metric] !== undefined && !isNaN(c.insights[metric] as number))
        .map(c => ({ brand: c.brand, score: c.insights[metric] as number }));

    const esgCards: MetricCardResult[] = [
      buildMetricCard(
        'esgCompositeScore', 'ESG Performance Composite Score',
        toPool(submittingA, 'esgCompositeScore'),
        toPool(submittingB, 'esgCompositeScore'),
        filteredCompanyBrands
      ),
      buildMetricCard(
        'circularEconomyIndex', 'Environment Score',
        toPool(envA, 'circularEconomyIndex'),
        toPool(envB, 'circularEconomyIndex'),
        filteredCompanyBrands
      ),
      buildMetricCard(
        'socialScore', 'Social Score',
        toPool(submittingA, 'socialScore'),
        toPool(submittingB, 'socialScore'),
        filteredCompanyBrands
      ),
      buildMetricCard(
        'governanceScore', 'Governance Score',
        toPool(submittingA, 'governanceScore'),
        toPool(submittingB, 'governanceScore'),
        filteredCompanyBrands
      ),
    ];

    return { rankingCards, esgCards };
  }, [allRankingsA, allRankingsB, companyRawDataA, companyRawDataB, filteredCompanyBrands]);

  return { ...result, isLoading };
}
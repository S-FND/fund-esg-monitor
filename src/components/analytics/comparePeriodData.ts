// utils/comparePeriodData.ts

import { mockCompanies } from "@/data/mockData";
import {
  AnalyticsDashboardData,
  AnalyticsFilters,
  AggregationMetrics,
  InsightMetrics,
  CompanyRawMetrics,
  r2,
} from "@/hooks/useAnalyticsDashboardData";
import { computeAnalyticsDashboardData, ComputeAnalyticsDashboardDataInput } from "../mis/ComputeAnalyticsDashboardDataInput";

// ──── Types ────

export interface ComparePeriodDataInput {
  /** Data + filters for the first ("base") period — e.g. Q1 2025 */
  periodA: ComputeAnalyticsDashboardDataInput;
  /** Data + filters for the second ("comparison") period — e.g. Q1 2026 */
  periodB: ComputeAnalyticsDashboardDataInput;
}

export interface MetricDelta {
  a: number;
  b: number;
  /** b - a */
  delta: number;
  /** (b - a) / a * 100, null when a === 0 (avoids divide-by-zero) */
  deltaPct: number | null;
}

export type AggregationDelta = {
  [K in keyof AggregationMetrics]: MetricDelta;
};

export type InsightDelta = {
  [K in keyof InsightMetrics]: MetricDelta;
};

export interface CompanyComparisonRow {
  companyId: string;
  companyName: string;
  brand: string;
  /** Present in period A's filtered dataset */
  inA: boolean;
  /** Present in period B's filtered dataset */
  inB: boolean;
  aggregation?: AggregationDelta;
  insights?: InsightDelta;
}

export interface PeriodComparisonResult {
  periodALabel: string;
  periodBLabel: string;
  /** Aggregation-level delta between the two periods' `current` values */
  currentDelta: AggregationDelta;
  /** Insight-level delta between the two periods' `currentInsights` values */
  currentInsightsDelta: InsightDelta;
  /** Company-count delta */
  companyCountDelta: MetricDelta;
  /** Per-company comparison — only for companies present in at least one period */
  companyComparisons: CompanyComparisonRow[];
  /** Companies present in A but dropped out of B */
  droppedCompanyIds: string[];
  /** Companies newly present in B but absent from A */
  newCompanyIds: string[];
  /** Raw underlying results, in case the caller needs full access beyond the diff */
  raw: {
    periodA: AnalyticsDashboardData;
    periodB: AnalyticsDashboardData;
  };
}

// ──── Helpers ────

function metricDelta(a: number, b: number): MetricDelta {
  const delta = r2(b - a);
  const deltaPct = a !== 0 ? r2((delta / a) * 100) : null;
  return { a: r2(a), b: r2(b), delta, deltaPct };
}

function diffAggregation(a: AggregationMetrics, b: AggregationMetrics): AggregationDelta {
  const result = {} as AggregationDelta;
  (Object.keys(a) as (keyof AggregationMetrics)[]).forEach(key => {
    result[key] = metricDelta(a[key] as number, b[key] as number);
  });
  return result;
}

function diffInsights(a: InsightMetrics, b: InsightMetrics): InsightDelta {
  const result = {} as InsightDelta;
  (Object.keys(a) as (keyof InsightMetrics)[]).forEach(key => {
    const av = a[key];
    const bv = b[key];
    // Skip non-numeric fields (e.g. `_hasNoEnvData` is boolean/undefined)
    if (typeof av !== 'number' || typeof bv !== 'number') return;
    result[key] = metricDelta(av, bv);
  });
  return result;
}

function periodLabel(filters: AnalyticsFilters): string {
  return filters.period === 'annual'
    ? `AY ${filters.year}`
    : `${filters.quarter || 'Q1'} ${filters.year}`;
}

// ──── Main helper ────

/**
 * Pure comparison function — takes two already-prepared inputs (same shape
 * accepted by `computeAnalyticsDashboardData`), computes each period
 * independently via the existing helper, then produces a structured diff.
 *
 * No API calls, no additional filtering — each `periodA`/`periodB` input
 * must already contain exactly the data/filters for its own period, following
 * the same contract as `computeAnalyticsDashboardData`'s input.
 */
export function comparePeriodData(input: ComparePeriodDataInput): PeriodComparisonResult {
  const resultA = computeAnalyticsDashboardData(input.periodA);
  const resultB = computeAnalyticsDashboardData(input.periodB);

  const currentDelta = diffAggregation(resultA.current, resultB.current);
  const currentInsightsDelta = diffInsights(resultA.currentInsights, resultB.currentInsights);
  const companyCountDelta = metricDelta(resultA.companyCount, resultB.companyCount);

  // Build per-company comparison, keyed by companyId, across both periods' companyRawData.
  const mapA = new Map<string, CompanyRawMetrics>(resultA.companyRawData.map(c => [c.companyId, c]));
  const mapB = new Map<string, CompanyRawMetrics>(resultB.companyRawData.map(c => [c.companyId, c]));

  const allCompanyIds = new Set([...mapA.keys(), ...mapB.keys()]);
  const companyComparisons: CompanyComparisonRow[] = [];
  const droppedCompanyIds: string[] = [];
  const newCompanyIds: string[] = [];

  allCompanyIds.forEach(companyId => {
    const ca = mapA.get(companyId);
    const cb = mapB.get(companyId);
    const inA = !!ca;
    const inB = !!cb;

    if (inA && !inB) droppedCompanyIds.push(companyId);
    if (!inA && inB) newCompanyIds.push(companyId);

    companyComparisons.push({
      companyId,
      companyName: (ca || cb)!.companyName,
      brand: (ca || cb)!.brand,
      inA,
      inB,
      aggregation: inA && inB ? diffAggregation(ca!.aggregation, cb!.aggregation) : undefined,
      insights: inA && inB ? diffInsights(ca!.insights, cb!.insights) : undefined,
    });
  });

  return {
    periodALabel: periodLabel(input.periodA.filters),
    periodBLabel: periodLabel(input.periodB.filters),
    currentDelta,
    currentInsightsDelta,
    companyCountDelta,
    companyComparisons,
    droppedCompanyIds,
    newCompanyIds,
    raw: {
      periodA: resultA,
      periodB: resultB,
    },
  };
}
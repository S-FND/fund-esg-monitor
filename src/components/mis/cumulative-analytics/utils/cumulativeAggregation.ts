/**
 * cumulativeAggregation
 * ─────────────────────────────────────────────────────────────────────────────
 * Cumulative aggregation pipeline. Merges all enabled-quarter KPI entries and
 * produces the portfolio-level analytics snapshot (totals, averages, insights)
 * shown on the cumulative dashboard.
 *
 * This module is intentionally kept separate from the quarterly
 * `useAnalyticsDashboardData` pipeline so the two views can evolve independently.
 * Core scoring formulas are delegated to the standalone `portfolio-helpers`
 * calculation library (used here as a pure math dependency, not as a
 * data-source coupling).
 */
import {
  generateCumulativeAnalytics,
  type AnalyticsContext,
  type CumulativeAnalyticsResult,
  type KPIEntryInput,
} from '../lib/portfolio-helpers';

export interface CumulativeAggregationInput {
  entries: KPIEntryInput[];
  context: AnalyticsContext;
}

export function aggregateCumulative({
  entries,
  context,
}: CumulativeAggregationInput): CumulativeAnalyticsResult {
  const allowed = new Set(context.companies.map(c => c.id));
  const scoped = entries.filter(e => allowed.has(e.companyId));
  return generateCumulativeAnalytics(scoped, context);
}

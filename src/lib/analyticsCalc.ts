/**
 * Shared analytics calculation utilities.
 * Used by both stat cards (FeatureAnalyticsView) and detail pages (AnalyticsDetail)
 * to guarantee identical results.
 */

const r2 = (v: number) => Math.round(v * 100) / 100;

export interface AnalyticsSummary {
  total: number;
  avg: number;
  max: number;
  min: number;
  n: number;
  isNumeric: boolean;
}

export function computeSummary(values: number[], isPct: boolean): AnalyticsSummary {
  const numeric = values.filter(v => !isNaN(v));
  const rawTotal = numeric.reduce((s, v) => s + v, 0);
  const rawAvg = numeric.length > 0 ? rawTotal / numeric.length : 0;

  return {
    total: r2(rawTotal),
    avg: r2(isPct ? Math.min(100, rawAvg) : rawAvg),
    max: r2(numeric.length > 0 ? Math.max(...numeric) : 0),
    min: r2(numeric.length > 0 ? Math.min(...numeric) : 0),
    n: numeric.length,
    isNumeric: numeric.length > 0,
  };
}

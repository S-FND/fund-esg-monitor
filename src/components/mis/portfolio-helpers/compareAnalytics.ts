import { r2 } from './helpers';
import type { AnalyticsResult, ComparisonResult, MetricComparison, Sentiment, TrendDirection } from './types';

const EPS = 0.01;

/** Polarity of "up" for each metric — negative means "higher is worse". */
const NEGATIVE_UP_METRICS = new Set([
  'incidentsTotal',
  'virginPlasticMT',
  'unresolvedHighImpactPct',
  'virginPlasticSharePct',
]);

interface MetricDef {
  key: string;
  label: string;
  category: MetricComparison['category'];
  unit?: string;
  get: (r: AnalyticsResult) => number;
}

const METRIC_DEFS: MetricDef[] = [
  // Scores
  { key: 'compositeScore', label: 'ESG Composite', category: 'score', unit: '', get: r => r.averages.compositeScore },
  { key: 'environmentScore', label: 'Environment Score', category: 'score', unit: '', get: r => r.averages.environmentScore },
  { key: 'socialScore', label: 'Social Score', category: 'score', unit: '', get: r => r.averages.socialScore },
  { key: 'governanceScore', label: 'Governance Score', category: 'score', unit: '', get: r => r.averages.governanceScore },
  { key: 'circularEconomyIndex', label: 'Circular Economy Index', category: 'score', unit: '', get: r => r.averages.circularEconomyIndex },
  { key: 'deiScore', label: 'DEI Score', category: 'score', unit: '', get: r => r.averages.deiScore },

  // Aggregations
  { key: 'netRevenue', label: 'Total Net Revenue', category: 'aggregation', unit: '₹ Cr', get: r => r.totals.netRevenue },
  { key: 'totalEmployees', label: 'Total Employees', category: 'aggregation', unit: '', get: r => r.totals.totalEmployees },
  { key: 'csrSpendINR', label: 'CSR Spend', category: 'aggregation', unit: '₹', get: r => r.totals.csrSpendINR },

  // Environment
  { key: 'recycledContentPct', label: 'Avg Recycled Content', category: 'environment', unit: '%', get: r => r.averages.recycledContentPct },
  { key: 'waterRecyclingPct', label: 'Avg Water Recycling', category: 'environment', unit: '%', get: r => r.averages.waterRecyclingPct },
  { key: 'renewableEnergyPct', label: 'Avg Renewable Energy', category: 'environment', unit: '%', get: r => r.averages.renewableEnergyPct },
  { key: 'wasteDiversionPct', label: 'Avg Waste Diversion', category: 'environment', unit: '%', get: r => r.averages.wasteDiversionPct },
  { key: 'virginPlasticMT', label: 'Total Virgin Plastic', category: 'environment', unit: ' MT', get: r => r.totals.virginPlasticMT },
  { key: 'totalWaterKL', label: 'Total Water Consumed', category: 'environment', unit: ' KL', get: r => r.totals.totalWaterKL },
  { key: 'totalEnergyKWh', label: 'Total Energy Consumed', category: 'environment', unit: ' kWh', get: r => r.totals.totalEnergyKWh },
  { key: 'totalWasteMT', label: 'Total Waste Generated', category: 'environment', unit: ' MT', get: r => r.totals.totalWasteMT },

  // Social
  { key: 'genderDiversityPct', label: 'Gender Diversity', category: 'social', unit: '%', get: r => r.averages.genderDiversityPct },
  { key: 'womenInLeadershipPct', label: 'Women in Leadership', category: 'social', unit: '%', get: r => r.averages.womenInLeadershipPct },
  { key: 'femaleEmployees', label: 'Female Employees', category: 'social', unit: '', get: r => r.totals.femaleEmployees },

  // Governance
  { key: 'policyAdoptionPct', label: 'Policy Adoption', category: 'governance', unit: '%', get: r => r.averages.policyAdoptionPct },
  { key: 'trainingCoveragePct', label: 'Training Coverage', category: 'governance', unit: '%', get: r => r.averages.trainingCoveragePct },
  { key: 'incidentsTotal', label: 'Total Incidents', category: 'governance', unit: '', get: r => r.totals.incidentsTotal },
];

function directionOf(delta: number): TrendDirection {
  if (Math.abs(delta) < EPS) return 'flat';
  return delta > 0 ? 'up' : 'down';
}

function sentimentOf(key: string, direction: TrendDirection): Sentiment {
  if (direction === 'flat') return 'neutral';
  const higherIsBad = NEGATIVE_UP_METRICS.has(key);
  const good = higherIsBad ? direction === 'down' : direction === 'up';
  return good ? 'positive' : 'negative';
}

export function compareAnalytics(prev: AnalyticsResult, curr: AnalyticsResult): ComparisonResult {
  const metrics: MetricComparison[] = METRIC_DEFS.map(def => {
    const previous = def.get(prev);
    const current = def.get(curr);
    const absoluteDelta = r2(current - previous);
    const percentDelta = previous === 0 ? null : r2(((current - previous) / Math.abs(previous)) * 100);
    const direction = directionOf(absoluteDelta);
    return {
      key: def.key,
      label: def.label,
      category: def.category,
      unit: def.unit,
      previous: r2(previous),
      current: r2(current),
      absoluteDelta,
      percentDelta,
      direction,
      sentiment: sentimentOf(def.key, direction),
    };
  });

  const prevById = new Map(prev.companies.map(c => [c.companyId, c]));
  const companyComposites = curr.companies.map(c => {
    const p = prevById.get(c.companyId);
    const previous = p?.scores.compositeScore ?? 0;
    const current = c.scores.compositeScore;
    const delta = r2(current - previous);
    return {
      companyId: c.companyId,
      companyName: c.companyName,
      previous: r2(previous),
      current: r2(current),
      absoluteDelta: delta,
      direction: directionOf(delta),
    };
  }).sort((a, b) => b.absoluteDelta - a.absoluteDelta);

  return {
    previousPeriod: prev.period,
    currentPeriod: curr.period,
    metrics,
    companyComposites,
  };
}

import type { InsightMetrics, AggregationMetrics, CompanyRawMetrics } from '@/hooks/useAnalyticsDashboardData';
import { buildAggregation, deriveInsights, sumAggregations } from '@/hooks/useAnalyticsDashboardData';
import type { CompanyFeatureMap } from '@/hooks/useAnalyticsDashboardDataHelpers';

// ═══════════════════════════════════════════════════════════════════════════
// TIME SERIES BUILDING
// ═══════════════════════════════════════════════════════════════════════════

export interface TimeSeriesPoint {
  period: string;
  quarter: string;
  year: number;
  aggregation: AggregationMetrics;
  insights: InsightMetrics;
  perCompanyInsights: InsightMetrics;
  companyCount: number;
}

/** Build time series data for dashboard overview */
export const buildTimeSeriesData = (
  periods: Array<{ quarter: string; year: number }>,
  filteredCompanies: Array<any>,
  entriesByCompanyAndKpi: Record<string, Record<string, string>>,
): TimeSeriesPoint[] => {
  return periods.map(period => buildTimeSeriesPoint(period, filteredCompanies, entriesByCompanyAndKpi));
};

/** Build a single time series point for one period */
const buildTimeSeriesPoint = (
  period: { quarter: string; year: number },
  filteredCompanies: Array<any>,
  entriesByCompanyAndKpi: Record<string, Record<string, string>>,
): TimeSeriesPoint => {
  const byCompany = groupCompaniesByKpis(filteredCompanies, entriesByCompanyAndKpi);

  const companyAggs = Object.values(byCompany).map(kpis => buildAggregation(kpis));
  const aggregation = sumAggregations(companyAggs);
  const insights = deriveInsights(aggregation);

  const perCompanyInsights = calculateAveragePerCompanyInsights(byCompany);

  return {
    period: period.quarter === 'FY' ? `AY ${period.year}` : `${period.quarter} ${period.year}`,
    quarter: period.quarter,
    year: period.year,
    aggregation,
    insights,
    perCompanyInsights,
    companyCount: Object.keys(byCompany).length,
  };
};

/** Group companies by their KPIs */
const groupCompaniesByKpis = (
  companies: Array<any>,
  entriesByCompanyAndKpi: Record<string, Record<string, string>>,
): Record<string, Record<string, string>> => {
  const result: Record<string, Record<string, string>> = {};

  companies.forEach(company => {
    result[company.id] = entriesByCompanyAndKpi[company.id] || {};
  });

  return result;
};

/** Calculate average insights across all companies */
const calculateAveragePerCompanyInsights = (
  byCompany: Record<string, Record<string, string>>,
): InsightMetrics => {
  const companyInsightsList = Object.values(byCompany)
    .filter(kpis => Object.keys(kpis).length > 0)
    .map(kpis => deriveInsights(buildAggregation(kpis)));

  const avgInsight = (key: keyof InsightMetrics): number => {
    const vals = companyInsightsList
      .map(i => i[key] as number)
      .filter(v => v !== undefined && !isNaN(v));
    return vals.length > 0 ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : 0;
  };

  const result: Partial<InsightMetrics> = {};
  if (companyInsightsList.length > 0) {
    const sampleKeys = Object.keys(companyInsightsList[0]) as (keyof InsightMetrics)[];
    for (const key of sampleKeys) {
      (result as any)[key] = avgInsight(key);
    }
  }

  return result as InsightMetrics;
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPANY RAW DATA BUILDING
// ═══════════════════════════════════════════════════════════════════════════

/** Build raw metrics for each company from current period data */
export const buildCompanyRawData = (
  companies: Array<any>,
  kpisByCompany: Record<string, Record<string, string>>,
  featureMap: CompanyFeatureMap,
  hasEnvironmentFeature: (cid: string, fm: CompanyFeatureMap) => boolean,
): CompanyRawMetrics[] => {
  return companies.map(company => {
    const kpis = kpisByCompany[company.id] || {};
    const aggregation = buildAggregation(kpis);
    const hasFashionPkg = featureMap.fashionPkgCompanyIds.has(company.id);
    const insights = deriveInsights(aggregation, company.industry, hasFashionPkg);

    return {
      companyId: company.id,
      companyName: company.name,
      brand: company.brand,
      industry: company.industry,
      fund: company.fund,
      revenueStage: company.revenueStage,
      kpis,
      aggregation,
      insights,
      usesFashionPackaging: hasFashionPkg,
      hasWaterFeature: featureMap.waterDetailedCompanyIds.has(company.id),
      hasEnvironmentFeature: hasEnvironmentFeature(company.id, featureMap),
    };
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// QUARTERLY DATA COMBINATION
// ═══════════════════════════════════════════════════════════════════════════

/** Determine if a KPI value should be averaged across quarters */
const isAveragingKpi = (kpiId: string): boolean => {
  const avgPatterns = [
    '_pct',
    '_percentage',
    'recyclability',
    'unique_female_customers',
    'revenue_tier2_plus',
    'attrition_rate',
    'renewable_pct',
    'wastewater_recycled_pct',
    'waste_recycled_pct',
    'fresh_water_pct',
    'plastic_neutrality',
    'avg_cxo_compensation',
    'employees_enps',
    'leadership_clevel_total',
    'leadership_clevel_female',
    'leadership_board_total',
    'leadership_board_female',
    'leadership_board_independent',
  ];
  return avgPatterns.some(p => kpiId.includes(p));
};

/** Determine if a KPI should use max value across quarters */
const isMaxKpi = (kpiId: string): boolean => {
  const maxPatterns = ['epr_compliance_pct', 'voluntary_plastic_neutrality'];
  return maxPatterns.some(p => kpiId.includes(p));
};

/** Determine if a KPI is Q4 snapshot (use only Q4 value) */
const isQ4SnapshotKpi = (kpiId: string): boolean => {
  return kpiId.startsWith('vendor_mis_') && kpiId.endsWith('_num_vendors');
};

/** Round to 2 decimal places */
const r2 = (val: number): number => Math.round(val * 100) / 100;

/** Combine quarterly KPI values into a single annual value */
export const combineQuarterlyKpis = (
  quarterData: Record<string, Record<string, string>>,
): Record<string, string> => {
  const quarters = Object.keys(quarterData);
  const combinedKpis: Record<string, string> = {};
  const allKpiKeys = new Set<string>();

  quarters.forEach(q => Object.keys(quarterData[q]).forEach(k => allKpiKeys.add(k)));

  allKpiKeys.forEach(kpiId => {
    const rawVals = quarters
      .map(q => quarterData[q]?.[kpiId])
      .filter(v => v !== undefined && v !== '' && v !== null) as string[];

    if (rawVals.length === 0) return;

    const numericVals = rawVals.map(v => parseFloat(v)).filter(v => !isNaN(v));

    if (numericVals.length > 0) {
      if (isMaxKpi(kpiId)) {
        combinedKpis[kpiId] = String(r2(Math.min(100, numericVals.reduce((a, b) => a + b, 0))));
      } else if (isQ4SnapshotKpi(kpiId)) {
        const q4Val = quarterData['Q4']?.[kpiId];
        const q4Num = q4Val ? parseFloat(q4Val) : NaN;
        combinedKpis[kpiId] = !isNaN(q4Num) ? String(Math.round(q4Num)) : rawVals[rawVals.length - 1];
      } else if (isAveragingKpi(kpiId)) {
        combinedKpis[kpiId] = String(r2(numericVals.reduce((a, b) => a + b, 0) / numericVals.length));
      } else {
        combinedKpis[kpiId] = String(r2(numericVals.reduce((a, b) => a + b, 0)));
      }
    } else {
      combinedKpis[kpiId] = rawVals[rawVals.length - 1];
    }
  });

  return combinedKpis;
};

// ═══════════════════════════════════════════════════════════════════════════
// AGGREGATION & ROLLUP HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/** Group aggregations by a specific company dimension */
export const groupByDimension = <T extends string>(
  companies: Array<any>,
  getKey: (company: any) => T,
): Record<T, AggregationMetrics> => {
  const kpisByCompany: Record<string, Record<string, string>> = {};

  companies.forEach(company => {
    kpisByCompany[company.id] = company.kpis || {};
  });

  const groups: Record<T, AggregationMetrics[]> = {} as any;

  companies.forEach(company => {
    const key = getKey(company);
    if (!groups[key]) groups[key] = [];
    groups[key].push(buildAggregation(kpisByCompany[company.id]));
  });

  const result: Record<T, AggregationMetrics> = {} as any;
  Object.entries(groups).forEach(([key, aggs]) => {
    result[key as T] = sumAggregations(aggs);
  });

  return result;
};

// ═══════════════════════════════════════════════════════════════════════════
// AVERAGE INSIGHT EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

/** Calculate average of a specific insight metric across companies */
export const calculateAverageInsightMetric = (
  companies: CompanyRawMetrics[],
  metricKey: keyof InsightMetrics,
): number => {
  const vals = companies
    .map(c => c.insights[metricKey] as number)
    .filter(v => !isNaN(v));

  return vals.length > 0 ? r2(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
};

/** Update insights with averaged per-company metrics */
export const updateInsightsWithAverages = (
  insights: InsightMetrics,
  companies: CompanyRawMetrics[],
  metricKeys: (keyof InsightMetrics)[],
): InsightMetrics => {
  const updated = { ...insights };

  metricKeys.forEach(key => {
    (updated as any)[key] = calculateAverageInsightMetric(companies, key);
  });

  return updated;
};

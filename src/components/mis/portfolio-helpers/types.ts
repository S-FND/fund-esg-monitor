/**
 * Standalone types for portfolio helper functions.
 * No dependencies on any project code.
 */

// ─── Input types ───

export interface KPIField {
  id: string;
}

export interface KPIDefinition {
  id: string;
  fields: KPIField[];
  excludeFromProgress?: boolean;
}

export interface FeatureMapping {
  kpis: KPIDefinition[];
}

/** Map of featureKey → mapping. Caller supplies this. */
export type FeatureMappingsInput = Record<string, FeatureMapping>;

export interface KPIEntryInput {
  companyId: string;
  kpiId: string;
  value: string | null;
  quarter: string; // 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'FY' | 'Annual'
  year: number;
  submittedAt?: string | null; // ISO timestamp
}

export interface CompanyInput {
  id: string;
  name: string;
  brand?: string;
  industry?: string;
  /** Set/array of enabled feature keys, e.g. ['social', 'primarySecondaryPackaging']. */
  enabledFeatures?: string[];
}

/**
 * Optional exclusion map for company/quarter pairs — caller supplies.
 * Return true to exclude the pair.
 */
export type IsExcludedFn = (companyId: string, quarter: string, year: number) => boolean;

/**
 * Optional "as of" cutoff. Filters out entries submitted after this month/year.
 */
export interface AsOfCutoff {
  month: number; // 1-12
  year: number;
}

// ─── Output types ───

export interface ESGCompleteness {
  E: number;
  S: number;
  G: number;
  overall: number;
}

export interface CompanyRankingOutput {
  companyId: string;
  companyName: string;
  brand: string;
  industry: string;
  completionPct: number;
  consistencyPct: number;
  timelinessScore: number;
  overallScore: number;
  completenessPercentile: number;
  consistencyPercentile: number;
  timelinessPercentile: number;
  overallPercentile: number;
  esgCompleteness: ESGCompleteness;
  grade: 'AA' | 'A' | 'BB' | 'B' | 'C';
}

export interface PortfolioRankingsSummary {
  totalCompanies: number;
  // Raw score averages — these are the headline values shown on the
  // Admin Dashboard's Company Rankings stat cards.
  avgCompletenessScore: number;
  avgConsistencyScore: number;
  avgTimelinessScore: number;
  avgOverallScore: number;
  // Percentile averages (always ~50 in a full cohort — provided for reference)
  avgCompletenessPercentile: number;
  avgConsistencyPercentile: number;
  avgTimelinessPercentile: number;
  avgOverallPercentile: number;
  gradeCounts: Record<'AA' | 'A' | 'BB' | 'B' | 'C', number>;
}

export interface PortfolioRankingsResult {
  perCompany: CompanyRankingOutput[];
  summary: PortfolioRankingsSummary;
}

export interface ComputePortfolioRankingsInput {
  companies: CompanyInput[];
  entries: KPIEntryInput[];
  featureMappings: FeatureMappingsInput;
  year: number;
  isExcluded?: IsExcludedFn;
  asOf?: AsOfCutoff;
  /** Override feature category lists if needed. Defaults are provided. */
  categories?: {
    allQuarterlyFeatures?: string[];
    allAnnualFeatures?: string[];
    envQuarterlyFeatures?: string[];
    envAnnualFeatures?: string[];
    socialQuarterlyFeatures?: string[];
    socialAnnualFeatures?: string[];
    govQuarterlyFeatures?: string[];
    govAnnualFeatures?: string[];
  };
}

// ===== Analytics engine types =====
/**
 * Public types for the isolated Investor Comparison analytics engine.
 * These are independent from any existing hook/type in the app.
 */

export interface KPIEntryInput {
  companyId: string;
  kpiId: string;         // internal_id from kpi_master
  value: string | null;
  quarter: string;       // 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'FY'
  year: number;
}

export interface CompanyContext {
  id: string;
  name: string;
  brand?: string;
  industry?: string;
  revenueStage?: string;
  /** Feature flags — key: feature_key, value: enabled */
  features: Record<string, boolean>;
}

export interface AnalyticsContext {
  companies: CompanyContext[];
}

export interface CompanyAggregations {
  netRevenue: number;
  totalEmployees: number;
  femaleEmployees: number;
  maleEmployees: number;
  wcEmployees: number;
  bcEmployees: number;
  cLevelTotal: number;
  cLevelFemale: number;
  boardTotal: number;
  boardFemale: number;
  totalPackagingMT: number;
  virginPlasticMT: number;
  recycledPlasticMT: number;
  totalWaterKL: number;
  wastewaterRecycledPctAvg: number;
  totalEnergyKWh: number;
  renewableEnergyPctAvg: number;
  totalWasteMT: number;
  wasteRecycledPctAvg: number;
  incidentsTotal: number;
  incidentsHighImpact: number;
  incidentsUnresolvedHigh: number;
  policiesTotal: number;
  policiesInPlace: number;
  policiesWithTraining: number;
  csrSpendINR: number;
}

export interface CompanyDerived {
  genderDiversityPct: number;         // female / total * 100
  womenInLeadershipPct: number;       // cLevelFemale / cLevelTotal * 100
  womenOnBoardPct: number;
  virginPlasticSharePct: number;      // virgin / (virgin+recycled) * 100
  recycledContentPct: number;         // recycled / (virgin+recycled) * 100
  waterRecyclingPct: number;
  renewableEnergyPct: number;
  wasteDiversionPct: number;
  policyAdoptionPct: number;
  trainingCoveragePct: number;
  unresolvedHighImpactPct: number;
}

export interface CompanyScores {
  environmentScore: number;   // 0-100
  socialScore: number;        // 0-100
  governanceScore: number;    // 0-100
  compositeScore: number;     // 0-100 (E 35 / S 25 / G 40, redistributed if no env feature)
  circularEconomyIndex: number; // alias for env
  deiScore: number;             // derived from social diversity components
}

export interface CompanyAnalytics {
  companyId: string;
  companyName: string;
  hasEnvironmentFeature: boolean;
  aggregations: CompanyAggregations;
  derived: CompanyDerived;
  scores: CompanyScores;
}

export interface PortfolioTotals {
  companyCount: number;
  netRevenue: number;
  totalEmployees: number;
  femaleEmployees: number;
  totalPackagingMT: number;
  virginPlasticMT: number;
  recycledPlasticMT: number;
  totalWaterKL: number;
  totalEnergyKWh: number;
  totalWasteMT: number;
  incidentsTotal: number;
  csrSpendINR: number;
}

export interface PortfolioAverages {
  environmentScore: number;
  socialScore: number;
  governanceScore: number;
  compositeScore: number;
  circularEconomyIndex: number;
  deiScore: number;
  genderDiversityPct: number;
  womenInLeadershipPct: number;
  policyAdoptionPct: number;
  trainingCoveragePct: number;
  recycledContentPct: number;
  waterRecyclingPct: number;
  renewableEnergyPct: number;
  wasteDiversionPct: number;
}

export interface AnalyticsResult {
  period: { quarter: string; year: number };
  companies: CompanyAnalytics[];
  totals: PortfolioTotals;
  averages: PortfolioAverages;
}

// ─── Comparison output ───

export type TrendDirection = 'up' | 'down' | 'flat';
export type Sentiment = 'positive' | 'negative' | 'neutral';

export interface MetricComparison {
  key: string;
  label: string;
  category: 'aggregation' | 'environment' | 'social' | 'governance' | 'score';
  previous: number;
  current: number;
  absoluteDelta: number;
  percentDelta: number | null;
  direction: TrendDirection;
  sentiment: Sentiment;
  unit?: string;
}

export interface CompanyCompositeChange {
  companyId: string;
  companyName: string;
  previous: number;
  current: number;
  absoluteDelta: number;
  direction: TrendDirection;
}

export interface ComparisonResult {
  previousPeriod: { quarter: string; year: number };
  currentPeriod: { quarter: string; year: number };
  metrics: MetricComparison[];
  companyComposites: CompanyCompositeChange[];
}

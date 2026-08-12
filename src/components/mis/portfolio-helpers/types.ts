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

// ─── Unified Company type ───
/**
 * Canonical company shape used by ALL four helpers.
 * `features` (map) is the primary source of feature flags.
 * `enabledFeatures` (array) is a legacy alternative — either one may be
 * supplied; helpers normalize internally via `getEnabledFeatureSet`.
 */
export interface Company {
  id: string;
  name: string;
  brand?: string;
  industry?: string;
  revenueStage?: string;
  features?: Record<string, boolean>;
  enabledFeatures?: string[];
}

/** Back-compat aliases (deprecated — use `Company`). */
export type CompanyInput = Company;
export type CompanyContext = Company;

export interface AnalyticsContext {
  companies: Company[];
}

/** Returns the effective set of enabled feature keys for a company. */
export const getEnabledFeatureSet = (c: Company): Set<string> => {
  const out = new Set<string>();
  if (c.enabledFeatures) for (const k of c.enabledFeatures) out.add(k);
  if (c.features) for (const [k, v] of Object.entries(c.features)) if (v) out.add(k);
  return out;
};

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

// ─── Unified Period type ───
/**
 * Canonical period shape used by ALL four helpers.
 *   annual     → merges Q1-Q4 + FY of `year`
 *   quarterly  → single quarter of `year`
 *   cumulative → blends every entry passed in (any year, any quarter)
 *
 * Not every helper supports every mode:
 *   - computePortfolioScores    → annual | quarterly
 *   - computePortfolioRankings  → annual | quarterly
 *   - generateAnalytics         → any (used only to stamp the result)
 *   - generateCumulativeAnalytics → cumulative
 */
export type Period =
  | { mode: 'annual'; year: number }
  | { mode: 'quarterly'; year: number; quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | string }
  | { mode: 'cumulative' };

/** @deprecated Use `Period`. */
export type RankingPeriod = Extract<Period, { mode: 'annual' | 'quarterly' }>;

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
  avgCompletenessScore: number;
  avgConsistencyScore: number;
  avgTimelinessScore: number;
  avgOverallScore: number;
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
  companies: Company[];
  entries: KPIEntryInput[];
  /** Optional. If omitted, the helper falls back to the bundled FEATURE_FIELD_MAPPINGS copy. */
  featureMappings?: FeatureMappingsInput;
  /**
   * Unified period selector. Only `annual` and `quarterly` are supported here.
   * For back-compat, if `period` is omitted the helper falls back to
   * `{ mode: 'annual', year }`.
   */
  period?: Extract<Period, { mode: 'annual' | 'quarterly' }>;
  /** @deprecated Use `period: { mode: 'annual', year }`. */
  year?: number;
  isExcluded?: IsExcludedFn;
  asOf?: AsOfCutoff;
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
// (Company, CompanyContext, AnalyticsContext are declared once above.)

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

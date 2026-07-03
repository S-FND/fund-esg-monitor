/**
 * Standalone portfolio helper functions.
 * Pure functions — no API calls, no hooks. Caller supplies all inputs.
 *
 * Unified contract:
 *   • Every helper accepts `entries: KPIEntryInput[]` and `companies: Company[]`.
 *   • Every helper accepts a `Period` (annual | quarterly | cumulative) —
 *     not every helper supports every mode; see each type's JSDoc.
 */

// Helpers
export { computePortfolioRankings } from './computePortfolioRankings';
export { computePortfolioScores, scoreToGrade } from './computePortfolioScores';
export { generateAnalytics } from './generateAnalytics';
export { generateCumulativeAnalytics } from './generateCumulativeAnalytics';
export { compareAnalytics } from './compareAnalytics';
export { mergeEntriesAcrossPeriods } from './mergeEntries';
export { FEATURE_FIELD_MAPPINGS } from './featureFieldMapping';

// Unified types
export type {
  // core
  Company,
  CompanyInput,       // alias of Company
  CompanyContext,     // alias of Company
  AnalyticsContext,
  KPIEntryInput,
  Period,
  RankingPeriod,      // subset of Period
  FeatureMappingsInput,
  FeatureMapping,
  KPIDefinition,
  KPIField,
  IsExcludedFn,
  AsOfCutoff,
  ESGCompleteness,
  // rankings I/O
  ComputePortfolioRankingsInput,
  PortfolioRankingsResult,
  CompanyRankingOutput,
  PortfolioRankingsSummary,
  // analytics I/O
  AnalyticsResult,
  CompanyAnalytics,
  CompanyAggregations,
  CompanyDerived,
  CompanyScores,
  PortfolioTotals,
  PortfolioAverages,
  // comparison I/O
  ComparisonResult,
  MetricComparison,
  CompanyCompositeChange,
  TrendDirection,
  Sentiment,
} from './types';
export { getEnabledFeatureSet } from './types';

// Scores I/O
export type { Grade, PortfolioScoreOutput, ComputePortfolioScoresInput } from './computePortfolioScores';

// Cumulative I/O
export type { CumulativeAnalyticsResult } from './generateCumulativeAnalytics';

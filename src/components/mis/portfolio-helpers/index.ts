/**
 * Standalone portfolio helper functions.
 * Pure functions — no API calls, no hooks. Caller supplies all inputs.
 */

// Rankings helper
export { computePortfolioRankings } from './computePortfolioRankings';
export type {
  ComputePortfolioRankingsInput,
  PortfolioRankingsResult,
  CompanyRankingOutput,
  PortfolioRankingsSummary,
  KPIEntryInput,
  CompanyInput,
  FeatureMappingsInput,
  FeatureMapping,
  KPIDefinition,
  KPIField,
  IsExcludedFn,
  AsOfCutoff,
  ESGCompleteness,
} from './types';

// ESG scores + analytics helpers
export * from './types';
export { generateAnalytics } from './generateAnalytics';
export { compareAnalytics } from './compareAnalytics';
export { mergeEntriesAcrossPeriods } from './mergeEntries';
export { computePortfolioScores, scoreToGrade } from './computePortfolioScores';
export type { Grade, PortfolioScoreOutput, ComputePortfolioScoresInput } from './computePortfolioScores';

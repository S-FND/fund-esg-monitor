// ══════════════════════════════════════════════════════════════════════════════
// Reusable KPI count utilities.
// Pure functions with no side effects — safe for hooks, workers, or tests.
// ══════════════════════════════════════════════════════════════════════════════
import { FEATURE_FIELD_MAPPINGS } from '@/lib/featureFieldMapping';

// ─── Feature category constants ───────────────────────────────────────────────
export const ALL_QUARTERLY_FEATURES: string[] = [
  'businessInformation', 'social', 'sourcingFulfillment',
  'primarySecondaryPackaging', 'fashionMaterials', 'incidentLog',
  'productServiceCertifications', 'healthCare',
];

export const ALL_ANNUAL_FEATURES: string[] = [
  'operations', 'governancePolicies', 'certifications', 'csr',
  'sri', 'externalReporting', 'energyManagement', 'waterManagement', 'wasteManagement',
];

export const ENV_QUARTERLY_FEATURES: string[] = ['primarySecondaryPackaging', 'fashionMaterials'];
export const ENV_ANNUAL_FEATURES: string[] = ['energyManagement', 'waterManagement', 'wasteManagement'];
export const SOCIAL_QUARTERLY_FEATURES: string[] = ['social', 'sourcingFulfillment', 'incidentLog', 'healthCare', 'productServiceCertifications'];
export const SOCIAL_ANNUAL_FEATURES: string[] = ['operations', 'csr'];
export const GOV_QUARTERLY_FEATURES: string[] = [];
export const GOV_ANNUAL_FEATURES: string[] = ['governancePolicies', 'certifications', 'sri', 'externalReporting'];

/**
 * Total number of tracked KPIs across the given feature keys.
 * Skips KPIs marked `excludeFromProgress`.
 * Unknown feature keys contribute 0.
 */
export function getTotalKPICount(featureKeys: readonly string[]): number {
  let count = 0;
  for (const key of featureKeys) {
    const mapping = FEATURE_FIELD_MAPPINGS[key];
    if (mapping) count += mapping.kpis.filter(kpi => !kpi.excludeFromProgress).length;
  }
  return count;
}

/**
 * Expected KPI universe for a full year:
 * quarterly KPIs count 4× (Q1–Q4) + annual KPIs count 1× (FY).
 */
export function getExpectedKPICountForYear(
  quarterlyFeatureKeys: readonly string[],
  annualFeatureKeys: readonly string[],
): number {
  return getTotalKPICount(quarterlyFeatureKeys) * 4 + getTotalKPICount(annualFeatureKeys);
}

/**
 * Expected KPI universe restricted to a given period list.
 * Each `Q1..Q4` in the list contributes the quarterly KPI count once.
 * Each `FY` in the list contributes the annual KPI count once.
 */
export function getExpectedKPICountForPeriods(
  periods: readonly string[],
  quarterlyFeatureKeys: readonly string[],
  annualFeatureKeys: readonly string[],
): number {
  const qCount = getTotalKPICount(quarterlyFeatureKeys);
  const aCount = getTotalKPICount(annualFeatureKeys);
  let total = 0;
  for (const p of periods) {
    if (p === 'FY') total += aCount;
    else total += qCount;
  }
  return total;
}

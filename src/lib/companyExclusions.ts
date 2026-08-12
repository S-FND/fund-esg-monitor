/**
 * Quarter-based company exclusions for analytics and rankings.
 * Companies listed here are excluded from the specified quarters'
 * data in analytics aggregations and performance metric calculations.
 */

// Companies excluded from ALL quarters (global exclusions)
export const GLOBAL_EXCLUSIONS: string[] = [
  'company-1',  // Yogabar
  'company-26', // Jetapult
  'company-15', // Fitterfly
  'company-5',  // Wellbeing Nutrition
  'company-demo', // Demo Corp — excluded from all admin analytics
];

/**
 * Companies onboarded in JFM 2026 — they should NOT appear in any
 * 2025 analytics (Q1–Q4 2025 or FY 2025) but are visible from
 * Q1 2026 onwards. Year-aware filtering happens in isCompanyExcluded.
 */
export const JFM_2026_ONBOARDED: string[] = [
  'company-44', // DUSQ (Innergize)
  'company-45', // Kisah
];

// Exclusions keyed by quarter → array of company IDs to exclude
// Companies only considered for specific periods (2025 cycle):
//   Aceblend(38), Enchanté(34), Troovy(37): Q2/Q3/Q4/AY → excluded from Q1
//   Cuminco(39), Earthful(42), SFL(41), Antinorm(43): Q3/Q4/AY → excluded from Q1/Q2
//   Wellopia(40): Q4/AY → excluded from Q1/Q2/Q3
export const QUARTER_EXCLUSIONS: Record<string, string[]> = {
  Q1: [
    ...GLOBAL_EXCLUSIONS,
    'company-38', // Aceblend
    'company-34', // Enchanté Brands
    'company-37', // Troovy
    'company-39', // Cuminco
    'company-40', // Wellopia
    'company-41', // SFL
    'company-42', // Earthful
    'company-43', // Antinorm
  ],
  Q2: [
    ...GLOBAL_EXCLUSIONS,
    'company-39', // Cuminco
    'company-40', // Wellopia
    'company-41', // SFL
    'company-42', // Earthful
    'company-43', // Antinorm
  ],
  Q3: [
    ...GLOBAL_EXCLUSIONS,
    'company-40', // Wellopia
  ],
  Q4: [
    ...GLOBAL_EXCLUSIONS,
  ],
};

/**
 * Check if a company should be excluded for a given quarter.
 *
 * Year-aware behaviour:
 *  - JFM-2026-onboarded companies (DUSQ, Kisah) are excluded from EVERY
 *    period in 2025 and earlier, but appear normally from 2026 onwards.
 *  - When `year` is omitted, callers are treated as legacy 2025 callers.
 */
export const isCompanyExcluded = (companyId: string, quarter: string, year?: number): boolean => {
  if(!year || year == 2026){
    return false
  }
  const effectiveYear = year ?? 2025;

  // JFM 2026 onboardees — invisible in 2025 analytics, visible from 2026.
  if (JFM_2026_ONBOARDED.includes(companyId) && effectiveYear < 2026) {
    return true;
  }

  const excluded = QUARTER_EXCLUSIONS[quarter];
  return excluded ? excluded.includes(companyId) : false;
};

/**
 * Get all company IDs excluded for a given quarter.
 * Pass `year` to also exclude JFM-2026-onboarded companies from 2025 periods.
 */
export const getExcludedCompanyIds = (quarter: string, year?: number): Set<string> => {
  const base = new Set(QUARTER_EXCLUSIONS[quarter] || []);
  const effectiveYear = year ?? 2025;
  if (effectiveYear < 2026) {
    JFM_2026_ONBOARDED.forEach(id => base.add(id));
  }
  return base;
};

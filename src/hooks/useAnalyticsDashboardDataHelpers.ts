import type { AnalyticsFilters } from '@/hooks/useAnalyticsDashboardData';
import { filterKpiEntries } from '@/utils/kpiEntryFilters';
import { mockCompanies } from '@/data/mockData';
import type { Industry, Fund, RevenueStage, QCategory } from '@/types/esg';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface AnalyticsPeriod {
  quarter: string;
  year: number;
}

export interface KpiEntry {
  companyId: string;
  kpi_id: string;
  value: string | null;
  quarter: string;
  year: number;
}

export interface CompanyFeatureMap {
  fashionPkgCompanyIds: Set<string>;
  stdPkgCompanyIds: Set<string>;
  sourcingCompanyIds: Set<string>;
  envFeatureCompanyIds: Set<string>;
  waterDetailedCompanyIds: Set<string>;
}

// ═══════════════════════════════════════════════════════════════════════════
// PERIOD GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/** Generate list of periods (quarters/years) based on filter settings */
export const getAnalyticsPeriods = (filters: AnalyticsFilters): AnalyticsPeriod[] => {
  const START_QUARTER = 'Q4';
  const START_YEAR = 2024;
  const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
  const periods: AnalyticsPeriod[] = [];
  const includeNextYearQ1 = filters.cumulative && filters.year === 2025;

  if (filters.period === 'quarterly') {
    periods.push(...generateQuarterlyPeriods(START_QUARTER, START_YEAR, filters, QUARTERS));
    if (includeNextYearQ1 && !periods.some(p => p.quarter === 'Q1' && p.year === filters.year + 1)) {
      periods.push({ quarter: 'Q1', year: filters.year + 1 });
    }
  } else {
    periods.push(...generateAnnualPeriods(START_YEAR, filters));
    if (includeNextYearQ1) {
      periods.push({ quarter: 'Q1', year: filters.year + 1 });
    }
  }

  return periods;
};

/** Generate quarterly periods from START to current filter quarter/year */
const generateQuarterlyPeriods = (
  startQuarter: string,
  startYear: number,
  filters: AnalyticsFilters,
  quarters: string[],
): AnalyticsPeriod[] => {
  const periods: AnalyticsPeriod[] = [];
  let quarterIndex = quarters.indexOf(startQuarter);
  let year = startYear;
  const endQuarterIndex = quarters.indexOf(filters.quarter || 'Q1');
  const endYear = filters.year;

  while (year < endYear || (year === endYear && quarterIndex <= endQuarterIndex)) {
    periods.push({ quarter: quarters[quarterIndex], year });
    quarterIndex += 1;
    if (quarterIndex > 3) {
      quarterIndex = 0;
      year += 1;
    }
  }

  return periods.length > 0 ? periods : [{ quarter: filters.quarter || 'Q1', year: filters.year }];
};

/** Generate annual periods: all FY + Q1-Q4 for current year */
const generateAnnualPeriods = (startYear: number, filters: AnalyticsFilters): AnalyticsPeriod[] => {
  const periods: AnalyticsPeriod[] = [];

  for (let year = startYear; year <= filters.year; year++) {
    periods.push({ quarter: 'FY', year });
  }

  ['Q1', 'Q2', 'Q3', 'Q4'].forEach(quarter => {
    periods.push({ quarter, year: filters.year });
  });

  return periods;
};

// ═══════════════════════════════════════════════════════════════════════════
// ENTRY FILTERING
// ═══════════════════════════════════════════════════════════════════════════

/** Get filtered KPI entries for a specific period */
export const getFilteredEntriesForPeriod = <T extends { companyId: string; quarter: string; year: number }>(
  entries: T[],
  companyIds: Set<string>,
  period: AnalyticsPeriod,
  filters: AnalyticsFilters,
) => {
  return filterKpiEntries(entries, {
    companyIds,
    quarter: period.quarter,
    year: period.year,
    cumulative: filters.cumulative,
  });
};

/** Get filtered entries for multiple quarters (Q1-Q4) */
export const getFilteredEntriesForQuarters = <T extends { companyId: string; quarter: string; year: number }>(
  entries: T[],
  companyIds: Set<string>,
  quarters: string[],
  year: number,
  cumulative: boolean,
) => {
  return filterKpiEntries(entries, {
    companyIds,
    quarters,
    year,
    cumulative,
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPANY FILTERING
// ═══════════════════════════════════════════════════════════════════════════

/** Filter companies by dashboard filter criteria */
export const getFilteredCompanies = (filters: AnalyticsFilters) => {
  let companies = mockCompanies.filter(c => c.investmentStatus === 'Invested');

  // Exclude specific companies for 2025
  if (filters.year === 2025) {
    companies = companies.filter(c => !['company-44', 'company-45'].includes(c.id));
  }

  if (filters.industry) companies = companies.filter(c => c.industry === filters.industry);
  if (filters.fund) companies = companies.filter(c => c.fund === filters.fund);
  if (filters.revenueStage) companies = companies.filter(c => c.revenueStage === filters.revenueStage);
  if (filters.qCategory) companies = companies.filter(c => c.qCategory === filters.qCategory);
  if (filters.firesidePOC) companies = companies.filter(c => c.fl === filters.firesidePOC);
  if (filters.companyId) companies = companies.filter(c => c.id === filters.companyId);

  return companies;
};

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE & COMPANY MAPPING
// ═══════════════════════════════════════════════════════════════════════════

/** Build mapping of companies to their enabled features */
export const buildCompanyFeatureMap = (
  featureRows: Array<{ companyId: string; feature_key: string; enabled: boolean }>,
): CompanyFeatureMap => {
  return {
    fashionPkgCompanyIds: new Set(
      featureRows.filter(r => r.feature_key === 'fashionMaterials' && r.enabled).map(r => r.companyId),
    ),
    stdPkgCompanyIds: new Set(
      featureRows.filter(r => r.feature_key === 'primarySecondaryPackaging' && r.enabled).map(r => r.companyId),
    ),
    sourcingCompanyIds: new Set<string>(
      featureRows.filter(r => r.feature_key === 'sourcingFulfillment' && r.enabled).map(r => r.companyId),
    ),
    envFeatureCompanyIds: new Set(
      featureRows
        .filter(r => ['waterDetailed', 'waterManagement', 'energyDetailed', 'wasteDetailed'].includes(r.feature_key) && r.enabled)
        .map(r => r.companyId),
    ),
    waterDetailedCompanyIds: new Set(
      featureRows
        .filter(r => (r.feature_key === 'waterDetailed' || r.feature_key === 'waterManagement') && r.enabled)
        .map(r => r.companyId),
    ),
  };
};

/** Check if company has any environmental feature enabled */
export const hasEnvironmentFeature = (
  companyId: string,
  featureMap: CompanyFeatureMap,
): boolean => {
  return (
    featureMap.fashionPkgCompanyIds.has(companyId) ||
    featureMap.stdPkgCompanyIds.has(companyId) ||
    featureMap.envFeatureCompanyIds.has(companyId)
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ENTRY GROUPING & ORGANIZATION
// ═══════════════════════════════════════════════════════════════════════════

/** Group KPI entries by company → kpi_id */
export const groupEntriesByCompanyAndKpi = (
  entries: KpiEntry[],
): Record<string, Record<string, string>> => {
  const grouped: Record<string, Record<string, string>> = {};

  entries.forEach(entry => {
    if (!grouped[entry.companyId]) {
      grouped[entry.companyId] = {};
    }
    grouped[entry.companyId][entry.kpi_id] = entry.value || '';
  });

  return grouped;
};

/** Group KPI entries by company → quarter → kpi_id */
export const groupEntriesByCompanyQuarterAndKpi = (
  entries: KpiEntry[],
): Record<string, Record<string, Record<string, string>>> => {
  const grouped: Record<string, Record<string, Record<string, string>>> = {};

  entries.forEach(entry => {
    if (!grouped[entry.companyId]) {
      grouped[entry.companyId] = {};
    }
    if (!grouped[entry.companyId][entry.quarter]) {
      grouped[entry.companyId][entry.quarter] = {};
    }
    grouped[entry.companyId][entry.quarter][entry.kpi_id] = entry.value || '';
  });

  return grouped;
};

// ═══════════════════════════════════════════════════════════════════════════
// ENTRY FILTERING HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/** Remove entries with KPI IDs that shouldn't be included based on feature flags */
export const filterEntriesByFeatureSettings = (
  entries: KpiEntry[],
  featureMap: CompanyFeatureMap,
): KpiEntry[] => {
  return entries.filter(entry => {
    // Food packaging KPIs only for companies with the feature
    if (entry.kpi_id.startsWith('food_pkg_') && !featureMap.stdPkgCompanyIds.has(entry.companyId)) {
      return false;
    }
    return true;
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// YEAR EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

/** Extract unique years from periods for API requests */
export const getYearsFromPeriods = (periods: AnalyticsPeriod[]): number[] => {
  return [...new Set(periods.map(p => p.year))];
};

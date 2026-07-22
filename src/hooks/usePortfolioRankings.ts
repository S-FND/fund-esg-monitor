import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mockCompanies } from '@/data/mockData';
import { FEATURE_FIELD_MAPPINGS } from '@/lib/featureFieldMapping';
import { isCompanyExcluded } from '@/lib/companyExclusions';
import { fetchAllRows } from '@/lib/supabasePaginate';
import { useAsOf, isPeriodAfterCutoff } from '@/contexts/AsOfContext';
import { http } from '@/utils/httpInterceptor';
import { AnalyticsFilters } from './useAnalyticsDashboardData';

export interface ESGCompleteness {
  E: number;
  S: number;
  G: number;
  overall: number;
}

export interface CompanyRanking {
  companyId: string;
  companyName: string;
  brand: string;
  industry: string;
  completionPct: number;
  consistencyPct: number;
  timelinessScore: number;
  completenessPercentile: number;
  consistencyPercentile: number;
  timelinessPercentile: number;
  esgCompleteness: ESGCompleteness;
}

// types/api.ts
export interface CompanyProfileRaw {
  companyId: string;
  revenueStage: string;
  industry: string;
}

export interface KpiEntryRaw {
  companyId: string;
  kpiId: string;
  value: string | null;
  quarter: string;
  year: number;
  submittedAt: string | null;
  submitted_at?: string | null; // For backward compatibility with older data that uses snake_case
  kpi_id: string; // for compatibility with existing code
}

export interface FeatureSettingRaw {
  companyId: string;
  featureKey: string;
  enabled: boolean;
  feature_key: string; // for compatibility with existing code
}

// ─── Shared helpers (mirrors usePeerComparison) ───
export const ALL_QUARTERLY_FEATURES = [
  'businessInformation', 'social', 'sourcingFulfillment',
  'primarySecondaryPackaging', 'fashionMaterials', 'incidentLog',
  'productServiceCertifications', 'healthCare',
];
export const ALL_ANNUAL_FEATURES = [
  'operations', 'governancePolicies', 'certifications', 'csr',
  'sri', 'externalReporting', 'energyManagement', 'waterManagement', 'wasteManagement',
];

// ESG category mapping for features
export const ENV_QUARTERLY_FEATURES = ['primarySecondaryPackaging', 'fashionMaterials'];
export const ENV_ANNUAL_FEATURES = ['energyManagement', 'waterManagement', 'wasteManagement'];
export const SOCIAL_QUARTERLY_FEATURES = ['social', 'sourcingFulfillment', 'incidentLog', 'healthCare', 'productServiceCertifications'];
export const SOCIAL_ANNUAL_FEATURES = ['operations', 'csr'];
export const GOV_QUARTERLY_FEATURES: string[] = [];
export const GOV_ANNUAL_FEATURES = ['governancePolicies', 'certifications', 'sri', 'externalReporting'];

export const getTotalKPICount = (featureKeys: string[]): number => {
  let count = 0;
  for (const key of featureKeys) {
    const mapping = FEATURE_FIELD_MAPPINGS[key];
    if (mapping) count += mapping.kpis.filter(kpi => !kpi.excludeFromProgress).length;
  }
  return count;
};

const GENERIC_FIELD_IDS = new Set([
  'cases', 'open_cases', 'impact', 'value', 'count', 'in_place', 'details',
  'type', 'amount', 'list', 'self_number', 'self_names', 'self_validity',
  'supplier_number', 'supplier_names', 'supplier_validity', 'training',
  'training_count', 'total_weight', 'plastic_weight', 'recycled_content',
  'recyclable_pct', 'recycled_pct', 'energy_consumed', 'renewable_pct',
  'water_consumed', 'fresh_water_pct', 'rainwater_pct',
  'epr_targets', 'epr_compliance_pct',
  'waste_generated', 'waste_recycled_pct', 'na',
  'last_update',
]);

export const isKPIGroupFilled = (
  kpi: { id: string; fields: { id: string }[] },
  entries: { kpi_id: string; value: string | null }[]
): boolean => {
  const valid = entries.filter(e => e.value !== null && e.value !== '' && e.value.trim() !== '' && !e.kpi_id.endsWith('_additional_comments'));

  // Direct match: entry kpi_id equals the KPI group id itself
  if (valid.some(entry => entry.kpi_id === kpi.id)) return true;

  return kpi.fields.some(field =>
    valid.some(entry => {
      if (entry.kpi_id === field.id) return true;
      // Composite key: kpi_id + field_id
      if (entry.kpi_id === `${kpi.id}_${field.id}`) return true;
      if (GENERIC_FIELD_IDS.has(field.id)) {
        return entry.kpi_id.includes(kpi.id) &&
          (entry.kpi_id.includes(field.id) || entry.kpi_id.endsWith(`_${field.id}`));
      }
      if (entry.kpi_id.endsWith(`_${field.id}`)) return true;
      if (field.id.length >= 12 && entry.kpi_id.includes(field.id)) return true;
      return false;
    })
  );
};

export const countFilledKPIs = (featureKeys: string[], entries: { kpi_id: string; value: string | null }[]): number => {
  let count = 0;
  for (const key of featureKeys) {
    const mapping = FEATURE_FIELD_MAPPINGS[key];
    if (!mapping) continue;
    for (const kpi of mapping.kpis) {
      if (kpi.excludeFromProgress) continue;
      if (isKPIGroupFilled(kpi, entries)) count++;
    }
  }
  return count;
};

const r2 = (v: number) => Math.round(v * 100) / 100;

/**
 * Percentile using the same formula as ESGCategoryBreakdown.assignPercentiles:
 * Sort ascending by score, percentile = round(((ascendingIndex + 1) / n) * 99).
 * rank here is 0-indexed from highest to lowest (descending), so convert:
 * ascendingIndex = total - 1 - rank
 */
const calculatePercentile = (_value: number, _allValues: number[], rank: number, total: number): number => {
  if (total <= 1) return 99;
  const ascIdx = total - 1 - rank; // convert descending rank to ascending index
  const percentile = Math.round(((ascIdx + 1) / total) * 99);
  return Math.max(1, Math.min(99, percentile));
};

// ─── Hook ───
export const usePortfolioRankings = (
  year: number = 2025,
  quarter: string = 'Q4',
  cumulative: boolean = false,
  period: 'quarterly' | 'annual' = 'quarterly',
  filters?:AnalyticsFilters
) => {
  const [rankings, setRankings] = useState<CompanyRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { asOf } = useAsOf();
  let selectedPeriod = period == 'annual' ? ['Q1', 'Q2', 'Q3', 'Q4', 'FY'] : [quarter];
  //console.log('usePortfolioRankings - asOf:', asOf, 'year:', year, 'quarter:', quarter, 'cumulative:', cumulative, 'period:', period);
  // useEffect(() => {
  //   const fetch = async () => {
  //     setIsLoading(true);
  //     try {
  //       const [profilesData, allEntries, allFeatures] = await Promise.all([
  //         fetchAllRows('company_profiles', 'company_id, revenue_stage, industry'),
  //         fetchAllRows('kpi_entries', 'company_id, kpi_id, value, quarter, submitted_at', [{ column: 'year', value: year }]),
  //         fetchAllRows('company_feature_settings', 'company_id, feature_key, enabled', [{ column: 'enabled', value: true }]),
  //       ]);

  //       // Build profile lookup for industry info
  //       const profileMap: Record<string, { revenue_stage: string; industry: string }> = {};
  //       for (const p of profilesData) {
  //         profileMap[p.company_id as string] = { revenue_stage: p.revenue_stage as string, industry: p.industry as string };
  //       }

  //       // Use mockCompanies as the source of truth for company list
  //       const companies = mockCompanies
  //         .filter(c => c.investmentStatus === 'Invested')
  //         .map(c => ({
  //           company_id: c.id,
  //           industry: profileMap[c.id]?.industry || c.industry || '',
  //           brand: c.brand || c.name,
  //         }));

  //       // Cast to typed arrays
  //       const allTypedEntries = allEntries as unknown as { company_id: string; kpi_id: string; value: string | null; quarter: string; submitted_at: string | null }[];
  //       // Apply "As of <Month>/<Year>" cutoff: drop entries from periods whose deadline hasn't passed yet.
  //       const typedEntries = asOf
  //         ? allTypedEntries.filter(e => !isPeriodAfterCutoff(e.quarter, year, asOf))
  //         : allTypedEntries;
  //       const typedFeatures = allFeatures as unknown as { company_id: string; feature_key: string; enabled: boolean }[];

  //       // Build feature maps
  //       const featureMap: Record<string, Set<string>> = {};
  //       for (const f of typedFeatures) {
  //         if (!featureMap[f.company_id]) featureMap[f.company_id] = new Set();
  //         featureMap[f.company_id].add(f.feature_key);
  //       }

  //       // Raw scores
  //       const raw = companies.map(company => {
  //         const cEntries = typedEntries.filter(e => e.company_id === company.company_id);
  //         const enabled = featureMap[company.company_id] || new Set();
  //         const qFeats = enabled.size > 0 ? ALL_QUARTERLY_FEATURES.filter(k => enabled.has(k)) : ALL_QUARTERLY_FEATURES;
  //         const aFeats = enabled.size > 0 ? ALL_ANNUAL_FEATURES.filter(k => enabled.has(k)) : ALL_ANNUAL_FEATURES;
  //         const totalKPIs = getTotalKPICount(qFeats) * 4 + getTotalKPICount(aFeats);

  //         // Exclude company from specific quarters for completeness calculation
  //         let totalFilled = 0;
  //         let adjustedTotalKPIs = totalKPIs;

  //         // Per-ESG category completeness
  //         const envQFeats = qFeats.filter(k => ENV_QUARTERLY_FEATURES.includes(k));
  //         const envAFeats = aFeats.filter(k => ENV_ANNUAL_FEATURES.includes(k));
  //         const socQFeats = qFeats.filter(k => SOCIAL_QUARTERLY_FEATURES.includes(k));
  //         const socAFeats = aFeats.filter(k => SOCIAL_ANNUAL_FEATURES.includes(k));
  //         const govQFeats = qFeats.filter(k => GOV_QUARTERLY_FEATURES.includes(k));
  //         const govAFeats = aFeats.filter(k => GOV_ANNUAL_FEATURES.includes(k));

  //         let envTotal = getTotalKPICount(envQFeats) * 4 + getTotalKPICount(envAFeats);
  //         let envFilled = 0;
  //         let socTotal = getTotalKPICount(socQFeats) * 4 + getTotalKPICount(socAFeats);
  //         let socFilled = 0;
  //         let govTotal = getTotalKPICount(govQFeats) * 4 + getTotalKPICount(govAFeats);
  //         let govFilled = 0;

  //         for (const p of ['Q1', 'Q2', 'Q3', 'Q4', 'FY']) {
  //           if (isCompanyExcluded(company.company_id, p, year)) {
  //             // Reduce total expected KPIs for excluded quarters
  //             if (p !== 'FY') {
  //               adjustedTotalKPIs -= getTotalKPICount(qFeats);
  //               envTotal -= getTotalKPICount(envQFeats);
  //               socTotal -= getTotalKPICount(socQFeats);
  //               govTotal -= getTotalKPICount(govQFeats);
  //             }
  //             continue;
  //           }
  //           const pEntries = cEntries.filter(e => e.quarter === p);
  //           totalFilled += countFilledKPIs(p === 'FY' ? aFeats : qFeats, pEntries);

  //           // Per-ESG fills
  //           if (p === 'FY') {
  //             envFilled += countFilledKPIs(envAFeats, pEntries);
  //             socFilled += countFilledKPIs(socAFeats, pEntries);
  //             govFilled += countFilledKPIs(govAFeats, pEntries);
  //           } else {
  //             envFilled += countFilledKPIs(envQFeats, pEntries);
  //             socFilled += countFilledKPIs(socQFeats, pEntries);
  //             govFilled += countFilledKPIs(govQFeats, pEntries);
  //           }
  //         }
  //         const completionPct = adjustedTotalKPIs > 0 ? r2((totalFilled / adjustedTotalKPIs) * 100) : 0;

  //         const esgCompleteness: ESGCompleteness = {
  //           E: envTotal > 0 ? r2((envFilled / envTotal) * 100) : 0,
  //           S: socTotal > 0 ? r2((socFilled / socTotal) * 100) : 0,
  //           G: govTotal > 0 ? r2((govFilled / govTotal) * 100) : 0,
  //           overall: completionPct,
  //         };

  //         // Consistency
  //         const qKPIDefs: { kpiId: string; fieldIds: string[] }[] = [];
  //         for (const fk of qFeats) {
  //           const m = FEATURE_FIELD_MAPPINGS[fk];
  //           if (!m) continue;
  //           for (const kpi of m.kpis) {
  //             if (kpi.excludeFromProgress) continue;
  //             qKPIDefs.push({ kpiId: kpi.id, fieldIds: kpi.fields.map(f => f.id) });
  //           }
  //         }
  //         // Consistency: only count non-excluded quarters
  //         let consistencyRatio = 0;
  //         const eligibleQuarters = ['Q1', 'Q2', 'Q3', 'Q4'].filter(q => !isCompanyExcluded(company.company_id, q, year));
  //         const eligibleCount = eligibleQuarters.length || 1;
  //         for (const kpiDef of qKPIDefs) {
  //           let qWithData = 0;
  //           for (const q of eligibleQuarters) {
  //             const qE = cEntries.filter(e => e.quarter === q);
  //             if (isKPIGroupFilled({ id: kpiDef.kpiId, fields: kpiDef.fieldIds.map(id => ({ id })) }, qE)) qWithData++;
  //           }
  //           consistencyRatio += qWithData / eligibleCount;
  //         }
  //         const consistencyPct = qKPIDefs.length > 0 ? r2((consistencyRatio / qKPIDefs.length) * 100) : 0;

  //         // Timeliness — use FIRST submission per period, then take latest across periods
  //         // Freeze timeliness as of March 3 of the following year: ignore submissions after this date
  //         const deadlineYear = year + 1;
  //         const TIMELINESS_CUTOFF = new Date(deadlineYear, 2, 3, 23, 59, 59).getTime(); // March 3 of deadline year
  //         const periods = ['Q1', 'Q2', 'Q3', 'Q4', 'FY'];
  //         const firstSubmissionPerPeriod: number[] = [];
  //         for (const p of periods) {
  //           if (isCompanyExcluded(company.company_id, p, year)) continue;
  //           const periodSubs = cEntries
  //             .filter(e => e.quarter === p && e.submitted_at)
  //             .map(e => new Date(e.submitted_at!).getTime())
  //             .filter(d => !isNaN(d) && d <= TIMELINESS_CUTOFF);
  //           if (periodSubs.length > 0) {
  //             firstSubmissionPerPeriod.push(Math.min(...periodSubs));
  //           }
  //         }

  //         let timelinessScore = 0; // Companies with no submissions get 0
  //         if (firstSubmissionPerPeriod.length > 0) {
  //           // The company's effective submission date is the latest of the first-submissions
  //           const effectiveDate = Math.max(...firstSubmissionPerPeriod);
  //           const feb4 = new Date(deadlineYear, 1, 4).getTime();
  //           const feb20 = new Date(deadlineYear, 1, 20).getTime();
  //           const feb24 = new Date(deadlineYear, 1, 24).getTime();

  //           if (effectiveDate <= feb4) {
  //             timelinessScore = 100;
  //           } else if (effectiveDate <= feb20) {
  //             const daysSinceFeb4 = (effectiveDate - feb4) / (1000 * 60 * 60 * 24);
  //             timelinessScore = Math.max(90, 100 - (daysSinceFeb4 / 16) * 10);
  //           } else if (effectiveDate <= feb24) {
  //             const daysSinceFeb20 = (effectiveDate - feb20) / (1000 * 60 * 60 * 24);
  //             timelinessScore = Math.max(70, 90 - (daysSinceFeb20 / 4) * 20);
  //           } else {
  //             const daysLate = (effectiveDate - feb24) / (1000 * 60 * 60 * 24);
  //             timelinessScore = Math.max(0, 70 - daysLate);
  //           }
  //         }

  //         // No floor — companies with no submissions score 0
  //         timelinessScore = r2(timelinessScore);

  //         return {
  //           companyId: company.company_id,
  //           companyName: company.brand,
  //           brand: company.brand,
  //           industry: company.industry,
  //           completionPct,
  //           consistencyPct,
  //           timelinessScore,
  //           esgCompleteness,
  //         };
  //       });

  //       // Compute percentiles using ascending sort matching ESGCategoryBreakdown.assignPercentiles
  //       // Sort ascending by score, then by brand alphabetically for deterministic tie-breaking
  //       const assignPercentiles = (items: typeof raw, getScore: (r: typeof raw[0]) => number): Map<string, number> => {
  //         const sorted = [...items].sort((a, b) => {
  //           const diff = getScore(a) - getScore(b);
  //           return diff !== 0 ? diff : a.brand.localeCompare(b.brand);
  //         });
  //         const n = sorted.length;
  //         const result = new Map<string, number>();
  //         sorted.forEach((r, idx) => {
  //           result.set(r.companyId, n <= 1 ? 99 : Math.max(1, Math.min(99, Math.round(((idx + 1) / n) * 99))));
  //         });
  //         return result;
  //       };

  //       const completionPctiles = assignPercentiles(raw, r => r.completionPct);
  //       const consistencyPctiles = assignPercentiles(raw, r => r.consistencyPct);
  //       const timelinessPctiles = assignPercentiles(raw, r => r.timelinessScore);

  //       const ranked: CompanyRanking[] = raw.map(r => ({
  //         ...r,
  //         completenessPercentile: completionPctiles.get(r.companyId) || 1,
  //         consistencyPercentile: consistencyPctiles.get(r.companyId) || 1,
  //         timelinessPercentile: timelinessPctiles.get(r.companyId) || 1,
  //       }));

  //       setRankings(ranked);
  //     } catch (err) {
  //       console.error('Error fetching portfolio rankings:', err);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   fetch();
  // }, [year, quarter, asOf?.month, asOf?.year]);


  //Comment when data was not coming up and coming 0
  // useEffect(() => {
  //   const fetchData = async () => {
  //     setIsLoading(true);
  //     try {
  //       // 1. Fetch all data in parallel from NestJS MongoDB backend
  //       const yearsQuery = cumulative && year === 2025 ? `${year},${year + 1}` : `${year}`;

  //       let profilesRes = await http.get<CompanyProfileRaw[]>('mis/company-profiles');
  //       let entriesRes = await http.get<KpiEntryRaw[]>(`mis/kpi-entries?years=${yearsQuery}`);
  //       let featuresRes = await http.get<FeatureSettingRaw[]>('mis/company-feature-settings?enabled=true');
  //       //console.log('Fetched data:', { profiles: profilesRes.data, entries: entriesRes.data, features: featuresRes.data });

  //       const profilesData = profilesRes.data;
  //       const allEntries = entriesRes.data.filter(e => e.quarter == 'Q1' && e.year == 2025);
  //       const allFeatures = featuresRes.data;

  //       // 2. Build profile lookup: companyId → { revenue_stage, industry }
  //       const profileMap: Record<string, { revenue_stage: string; industry: string }> = {};
  //       for (const p of profilesData) {
  //         profileMap[p.companyId] = {
  //           revenue_stage: p.revenueStage,
  //           industry: p.industry,
  //         };
  //       }

  //       // 3. Build company list from mockCompanies (invested only)
  //       const companies = mockCompanies
  //         .filter(c => c.investmentStatus === 'Invested')
  //         .map(c => ({
  //           companyId: c.id,
  //           industry: profileMap[c.id]?.industry || c.industry || '',
  //           brand: c.brand || c.name,
  //         }));

  //       // 4. Apply "As of <Month>/<Year>" cutoff filter on entries
  //       const typedEntries: KpiEntryRaw[] = asOf
  //         ? allEntries.filter(e => !isPeriodAfterCutoff(e.quarter, e.year, asOf))
  //         : allEntries;

  //       // 5. Build feature map: companyId → Set<featureKey>
  //       const featureMap: Record<string, Set<string>> = {};
  //       for (const f of allFeatures) {
  //         if (!featureMap[f.companyId]) featureMap[f.companyId] = new Set();
  //         featureMap[f.companyId].add(f.feature_key);
  //       }

  //       //console.log('Processed data:', { companies, typedEntries, featureMap }); 
  //       // 6. Compute raw scores per company (completeness, consistency, timeliness)
  //       const raw = companies.map(company => {
  //         const cEntries = typedEntries.filter(e =>
  //           e.companyId === company.companyId &&
  //           (e.year === year || (cumulative && year === 2025 && e.quarter === 'Q1' && e.year === year + 1))
  //         );
  //         const enabled = featureMap[company.companyId] || new Set();

  //         const qFeats = enabled.size > 0
  //           ? ALL_QUARTERLY_FEATURES.filter(k => enabled.has(k))
  //           : ALL_QUARTERLY_FEATURES;
  //         const aFeats = enabled.size > 0
  //           ? ALL_ANNUAL_FEATURES.filter(k => enabled.has(k))
  //           : ALL_ANNUAL_FEATURES;

  //         const totalKPIs = getTotalKPICount(qFeats) * 4 + getTotalKPICount(aFeats);

  //         let totalFilled = 0;
  //         let adjustedTotalKPIs = totalKPIs;

  //         // Per-ESG category feature sets
  //         const envQFeats = qFeats.filter(k => ENV_QUARTERLY_FEATURES.includes(k));
  //         const envAFeats = aFeats.filter(k => ENV_ANNUAL_FEATURES.includes(k));
  //         const socQFeats = qFeats.filter(k => SOCIAL_QUARTERLY_FEATURES.includes(k));
  //         const socAFeats = aFeats.filter(k => SOCIAL_ANNUAL_FEATURES.includes(k));
  //         const govQFeats = qFeats.filter(k => GOV_QUARTERLY_FEATURES.includes(k));
  //         const govAFeats = aFeats.filter(k => GOV_ANNUAL_FEATURES.includes(k));

  //         let envTotal = getTotalKPICount(envQFeats) * 4 + getTotalKPICount(envAFeats);
  //         let envFilled = 0;
  //         let socTotal = getTotalKPICount(socQFeats) * 4 + getTotalKPICount(socAFeats);
  //         let socFilled = 0;
  //         let govTotal = getTotalKPICount(govQFeats) * 4 + getTotalKPICount(govAFeats);
  //         let govFilled = 0;

  //         const isPeriodExcluded = (period: string) => {
  //           if (period === 'Q1' && cumulative && year === 2025) {
  //             return (
  //               isCompanyExcluded(company.companyId, period, year) &&
  //               isCompanyExcluded(company.companyId, period, year + 1)
  //             );
  //           }
  //           return isCompanyExcluded(company.companyId, period, year);
  //         };

  //         // 6a. Completeness — per period, skip excluded quarters
  //         for (const p of ['Q1', 'Q2', 'Q3', 'Q4', 'FY']) {
  //           if (isPeriodExcluded(p)) {
  //             if (p !== 'FY') {
  //               adjustedTotalKPIs -= getTotalKPICount(qFeats);
  //               envTotal -= getTotalKPICount(envQFeats);
  //               socTotal -= getTotalKPICount(socQFeats);
  //               govTotal -= getTotalKPICount(govQFeats);
  //             }
  //             continue;
  //           }
  //           const pEntries = cEntries.filter(e => e.quarter === p);
  //           totalFilled += countFilledKPIs(p === 'FY' ? aFeats : qFeats, pEntries);

  //           if (p === 'FY') {
  //             envFilled += countFilledKPIs(envAFeats, pEntries);
  //             socFilled += countFilledKPIs(socAFeats, pEntries);
  //             govFilled += countFilledKPIs(govAFeats, pEntries);
  //           } else {
  //             envFilled += countFilledKPIs(envQFeats, pEntries);
  //             socFilled += countFilledKPIs(socQFeats, pEntries);
  //             govFilled += countFilledKPIs(govQFeats, pEntries);
  //           }
  //         }

  //         const completionPct = adjustedTotalKPIs > 0
  //           ? r2((totalFilled / adjustedTotalKPIs) * 100)
  //           : 0;

  //         const esgCompleteness: ESGCompleteness = {
  //           E: envTotal > 0 ? r2((envFilled / envTotal) * 100) : 0,
  //           S: socTotal > 0 ? r2((socFilled / socTotal) * 100) : 0,
  //           G: govTotal > 0 ? r2((govFilled / govTotal) * 100) : 0,
  //           overall: completionPct,
  //         };

  //         // 6b. Consistency — across non-excluded quarters
  //         const qKPIDefs: { kpiId: string; fieldIds: string[] }[] = [];
  //         for (const fk of qFeats) {
  //           const m = FEATURE_FIELD_MAPPINGS[fk];
  //           if (!m) continue;
  //           for (const kpi of m.kpis) {
  //             if (kpi.excludeFromProgress) continue;
  //             qKPIDefs.push({ kpiId: kpi.id, fieldIds: kpi.fields.map(f => f.id) });
  //           }
  //         }

  //         const eligibleQuarters = ['Q1', 'Q2', 'Q3', 'Q4'].filter(
  //           q => !isPeriodExcluded(q)
  //         );
  //         const eligibleCount = eligibleQuarters.length || 1;
  //         let consistencyRatio = 0;

  //         for (const kpiDef of qKPIDefs) {
  //           let qWithData = 0;
  //           for (const q of eligibleQuarters) {
  //             const qEntries = cEntries.filter(e => e.quarter === q);
  //             if (isKPIGroupFilled(
  //               { id: kpiDef.kpiId, fields: kpiDef.fieldIds.map(id => ({ id })) },
  //               qEntries
  //             )) qWithData++;
  //           }
  //           consistencyRatio += qWithData / eligibleCount;
  //         }

  //         const consistencyPct = qKPIDefs.length > 0
  //           ? r2((consistencyRatio / qKPIDefs.length) * 100)
  //           : 0;

  //         // 6c. Timeliness — first submission per period, capped at March 3 of next year
  //         const deadlineYear = year + 1;
  //         const TIMELINESS_CUTOFF = new Date(deadlineYear, 2, 3, 23, 59, 59).getTime();
  //         const feb4 = new Date(deadlineYear, 1, 4).getTime();
  //         const feb20 = new Date(deadlineYear, 1, 20).getTime();
  //         const feb24 = new Date(deadlineYear, 1, 24).getTime();

  //         const firstSubmissionPerPeriod: number[] = [];
  //         for (const p of ['Q1', 'Q2', 'Q3', 'Q4', 'FY']) {
  //           if (isCompanyExcluded(company.companyId, p, year)) continue;
  //           const periodSubs = cEntries
  //             .filter(e => e.quarter === p && e.submitted_at)
  //             .map(e => new Date(e.submitted_at!).getTime())
  //             .filter(d => !isNaN(d) && d <= TIMELINESS_CUTOFF);
  //           if (periodSubs.length > 0) firstSubmissionPerPeriod.push(Math.min(...periodSubs));
  //         }

  //         let timelinessScore = 0;
  //         if (firstSubmissionPerPeriod.length > 0) {
  //           const effectiveDate = Math.max(...firstSubmissionPerPeriod);
  //           if (effectiveDate <= feb4) {
  //             timelinessScore = 100;
  //           } else if (effectiveDate <= feb20) {
  //             const daysSinceFeb4 = (effectiveDate - feb4) / (1000 * 60 * 60 * 24);
  //             timelinessScore = Math.max(90, 100 - (daysSinceFeb4 / 16) * 10);
  //           } else if (effectiveDate <= feb24) {
  //             const daysSinceFeb20 = (effectiveDate - feb20) / (1000 * 60 * 60 * 24);
  //             timelinessScore = Math.max(70, 90 - (daysSinceFeb20 / 4) * 20);
  //           } else {
  //             const daysLate = (effectiveDate - feb24) / (1000 * 60 * 60 * 24);
  //             timelinessScore = Math.max(0, 70 - daysLate);
  //           }
  //         }

  //         return {
  //           companyId: company.companyId,
  //           companyName: company.brand,
  //           brand: company.brand,
  //           industry: company.industry,
  //           completionPct,
  //           consistencyPct,
  //           timelinessScore: r2(timelinessScore),
  //           esgCompleteness,
  //         };
  //       });

  //       // 7. Assign percentiles (ascending sort, deterministic tie-break by brand)
  //       const assignPercentiles = (
  //         items: typeof raw,
  //         getScore: (r: typeof raw[0]) => number
  //       ): Map<string, number> => {
  //         const sorted = [...items].sort((a, b) => {
  //           const diff = getScore(a) - getScore(b);
  //           return diff !== 0 ? diff : a.brand.localeCompare(b.brand);
  //         });
  //         const n = sorted.length;
  //         const result = new Map<string, number>();
  //         sorted.forEach((r, idx) => {
  //           result.set(r.companyId, n <= 1 ? 99 : Math.max(1, Math.min(99, Math.round(((idx + 1) / n) * 99))));
  //         });
  //         return result;
  //       };

  //       const completionPctiles = assignPercentiles(raw, r => r.completionPct);
  //       const consistencyPctiles = assignPercentiles(raw, r => r.consistencyPct);
  //       const timelinessPctiles = assignPercentiles(raw, r => r.timelinessScore);

  //       // 8. Merge percentiles into final ranked list
  //       const ranked: CompanyRanking[] = raw.map(r => ({
  //         ...r,
  //         completenessPercentile: completionPctiles.get(r.companyId) || 1,
  //         consistencyPercentile: consistencyPctiles.get(r.companyId) || 1,
  //         timelinessPercentile: timelinessPctiles.get(r.companyId) || 1,
  //       }));

  //       setRankings(ranked);
  //     } catch (err) {
  //       console.error('Error fetching portfolio rankings:', err);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   fetchData();
  // }, [year, quarter, cumulative]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch all data in parallel from NestJS MongoDB backend


        let profilesRes = await http.get<CompanyProfileRaw[]>('mis/company-profiles');
        let entriesRes = await http.get<KpiEntryRaw[]>(`mis/kpi-entries?year=${year}`);
        let featuresRes = await http.get<FeatureSettingRaw[]>('mis/company-feature-settings?enabled=true');
        //console.log('Fetched data:', { profiles: profilesRes.data, entries: entriesRes.data, features: featuresRes.data });

        const profilesData = profilesRes.data;
        const allEntries = entriesRes.data;
        const allFeatures = featuresRes.data;

        // 2. Build profile lookup: companyId → { revenue_stage, industry }
        const profileMap: Record<string, { revenue_stage: string; industry: string }> = {};
        for (const p of profilesData) {
          profileMap[p.companyId] = {
            revenue_stage: p.revenueStage,
            industry: p.industry,
          };
        }

        // 3. Build company list from mockCompanies (invested only)
        const companies = mockCompanies
          .filter(c => c.investmentStatus === 'Invested')
          .map(c => ({
            companyId: c.id,
            industry: profileMap[c.id]?.industry || c.industry || '',
            brand: c.brand || c.name,
          }));

        // 4. Apply "As of <Month>/<Year>" cutoff filter on entries
        const typedEntries: KpiEntryRaw[] = asOf
          ? allEntries.filter(e => !isPeriodAfterCutoff(e.quarter, year, asOf))
          : allEntries;

        // 5. Build feature map: companyId → Set<featureKey>
        const featureMap: Record<string, Set<string>> = {};
        for (const f of allFeatures) {
          if (!featureMap[f.companyId]) featureMap[f.companyId] = new Set();
          featureMap[f.companyId].add(f.feature_key);
        }

        //console.log('Processed data:', { companies, typedEntries, featureMap });
        // 6. Compute raw scores per company (completeness, consistency, timeliness)
        const raw = companies.map(company => {
          const cEntries = typedEntries.filter(e => e.companyId === company.companyId);
          const enabled = featureMap[company.companyId] || new Set();

          const qFeats = enabled.size > 0
            ? ALL_QUARTERLY_FEATURES.filter(k => enabled.has(k))
            : ALL_QUARTERLY_FEATURES;
          const aFeats = enabled.size > 0
            ? ALL_ANNUAL_FEATURES.filter(k => enabled.has(k))
            : ALL_ANNUAL_FEATURES;

          // Before : const totalKPIs = getTotalKPICount(qFeats) * 4 + getTotalKPICount(aFeats);
          // console.log(`Company ${company.companyId} - Q Features: ${qFeats.length}, A Features: ${aFeats.length}`);
          // console.log(`Company ${company.companyId} - getTotalKPICount(qFeats): ${getTotalKPICount(qFeats)}, getTotalKPICount(aFeats): ${getTotalKPICount(aFeats)}`);
          const totalKPIs = period === 'annual' ? getTotalKPICount(qFeats) * (year == 2025 ? 4 : 1) + (year == 2025 ? getTotalKPICount(aFeats) : 0) : getTotalKPICount(qFeats);
          //
          // console.log(`Company ${company.companyId} - Total KPIs: ${totalKPIs}`);
          let totalFilled = 0;
          let adjustedTotalKPIs = totalKPIs;

          // Per-ESG category feature sets
          const envQFeats = qFeats.filter(k => ENV_QUARTERLY_FEATURES.includes(k));
          const envAFeats = aFeats.filter(k => ENV_ANNUAL_FEATURES.includes(k));
          const socQFeats = qFeats.filter(k => SOCIAL_QUARTERLY_FEATURES.includes(k));
          const socAFeats = aFeats.filter(k => SOCIAL_ANNUAL_FEATURES.includes(k));
          const govQFeats = qFeats.filter(k => GOV_QUARTERLY_FEATURES.includes(k));
          const govAFeats = aFeats.filter(k => GOV_ANNUAL_FEATURES.includes(k));

          // let envTotal = getTotalKPICount(envQFeats) * 4 + getTotalKPICount(envAFeats);
          let envTotal = period === 'annual' ? getTotalKPICount(envQFeats) * (year == 2025 ? 4 : 1) +  (year == 2025 ? getTotalKPICount(envAFeats) : 0) : getTotalKPICount(envQFeats);

          let envFilled = 0;
          // let socTotal = getTotalKPICount(socQFeats) * 4 + getTotalKPICount(socAFeats);
          let socTotal = period === 'annual' ? getTotalKPICount(socQFeats) * (year == 2025 ? 4 : 1) + (year == 2025 ? getTotalKPICount(socAFeats) : 0) : getTotalKPICount(socQFeats);

          let socFilled = 0;
          // let govTotal = getTotalKPICount(govQFeats) * 4 + getTotalKPICount(govAFeats);
          let govTotal = period === 'annual' ? getTotalKPICount(govQFeats) * (year == 2025 ? 4 : 1) + (year == 2025 ? getTotalKPICount(govAFeats) : 0) : getTotalKPICount(govQFeats);

          let govFilled = 0;

          // 6a. Completeness — per period, skip excluded quarters
          // for (const p of ['Q1', 'Q2', 'Q3', 'Q4', 'FY']) {
          for (const p of selectedPeriod) {
            if (isCompanyExcluded(company.companyId, p, year)) {
              if (p !== 'FY') {
                adjustedTotalKPIs -= getTotalKPICount(qFeats);
                envTotal -= getTotalKPICount(envQFeats);
                socTotal -= getTotalKPICount(socQFeats);
                govTotal -= getTotalKPICount(govQFeats);
              }
              continue;
            }
            const pEntries = cEntries.filter(e => e.quarter === p);
            totalFilled += countFilledKPIs(p === 'FY' ? aFeats : qFeats, pEntries);

            if (p === 'FY') {
              envFilled += countFilledKPIs(envAFeats, pEntries);
              socFilled += countFilledKPIs(socAFeats, pEntries);
              govFilled += countFilledKPIs(govAFeats, pEntries);
            } else {
              envFilled += countFilledKPIs(envQFeats, pEntries);
              socFilled += countFilledKPIs(socQFeats, pEntries);
              govFilled += countFilledKPIs(govQFeats, pEntries);
            }
          }

          const completionPct = adjustedTotalKPIs > 0
            ? r2((totalFilled / adjustedTotalKPIs) * 100)
            : 0;
          // console.log(`Company ${company.companyId} - Total Filled: ${totalFilled}, Adjusted Total KPIs: ${adjustedTotalKPIs}, Completion %: ${completionPct}`);
          // console.log(`Company ${company.companyId} - E: ${envFilled}/${envTotal}, S: ${socFilled}/${socTotal}, G: ${govFilled}/${govTotal}`);
          const esgCompleteness: ESGCompleteness = {
            E: envTotal > 0 ? r2((envFilled / envTotal) * 100) : 0,
            S: socTotal > 0 ? r2((socFilled / socTotal) * 100) : 0,
            G: govTotal > 0 ? r2((govFilled / govTotal) * 100) : 0,
            overall: completionPct,
          };

          // 6b. Consistency — across non-excluded quarters
          const qKPIDefs: { kpiId: string; fieldIds: string[] }[] = [];
          for (const fk of qFeats) {
            const m = FEATURE_FIELD_MAPPINGS[fk];
            if (!m) continue;
            for (const kpi of m.kpis) {
              if (kpi.excludeFromProgress) continue;
              qKPIDefs.push({ kpiId: kpi.id, fieldIds: kpi.fields.map(f => f.id) });
            }
          }

          const eligibleQuarters = ['Q1', 'Q2', 'Q3', 'Q4'].filter(
            q => !isCompanyExcluded(company.companyId, q, year)
          );
          const eligibleCount = eligibleQuarters.length || 1;
          let consistencyRatio = 0;

          for (const kpiDef of qKPIDefs) {
            let qWithData = 0;
            for (const q of eligibleQuarters) {
              const qEntries = cEntries.filter(e => e.quarter === q);
              if (isKPIGroupFilled(
                { id: kpiDef.kpiId, fields: kpiDef.fieldIds.map(id => ({ id })) },
                qEntries
              )) qWithData++;
            }
            consistencyRatio += qWithData / eligibleCount;
          }

          const consistencyPct = qKPIDefs.length > 0
            ? r2((consistencyRatio / qKPIDefs.length) * 100)
            : 0;

          // 6c. Timeliness — first submission per period, capped at March 3 of next year
          const deadlineYear = year + 1;
          const TIMELINESS_CUTOFF = new Date(deadlineYear, 2, 3, 23, 59, 59).getTime();
          const feb4 = new Date(deadlineYear, 1, 4).getTime();
          const feb20 = new Date(deadlineYear, 1, 20).getTime();
          const feb24 = new Date(deadlineYear, 1, 24).getTime();

          const firstSubmissionPerPeriod: number[] = [];
          // for (const p of ['Q1', 'Q2', 'Q3', 'Q4', 'FY']) {
          for (const p of selectedPeriod) {
            if (isCompanyExcluded(company.companyId, p, year)) continue;
            const periodSubs = cEntries
              .filter(e => e.quarter === p && e.submitted_at)
              .map(e => new Date(e.submitted_at!).getTime())
              .filter(d => !isNaN(d) && d <= TIMELINESS_CUTOFF);
            if (periodSubs.length > 0) firstSubmissionPerPeriod.push(Math.min(...periodSubs));
          }

          let timelinessScore = 0;
          if (firstSubmissionPerPeriod.length > 0) {
            const effectiveDate = Math.max(...firstSubmissionPerPeriod);
            if (effectiveDate <= feb4) {
              timelinessScore = 100;
            } else if (effectiveDate <= feb20) {
              const daysSinceFeb4 = (effectiveDate - feb4) / (1000 * 60 * 60 * 24);
              timelinessScore = Math.max(90, 100 - (daysSinceFeb4 / 16) * 10);
            } else if (effectiveDate <= feb24) {
              const daysSinceFeb20 = (effectiveDate - feb20) / (1000 * 60 * 60 * 24);
              timelinessScore = Math.max(70, 90 - (daysSinceFeb20 / 4) * 20);
            } else {
              const daysLate = (effectiveDate - feb24) / (1000 * 60 * 60 * 24);
              timelinessScore = Math.max(0, 70 - daysLate);
            }
          }

          return {
            companyId: company.companyId,
            companyName: company.brand,
            brand: company.brand,
            industry: company.industry,
            completionPct,
            consistencyPct,
            timelinessScore: r2(timelinessScore),
            esgCompleteness,
          };
        });

        // 7. Assign percentiles (ascending sort, deterministic tie-break by brand)
        const assignPercentiles = (
          items: typeof raw,
          getScore: (r: typeof raw[0]) => number
        ): Map<string, number> => {
          const sorted = [...items].sort((a, b) => {
            const diff = getScore(a) - getScore(b);
            return diff !== 0 ? diff : a.brand.localeCompare(b.brand);
          });
          const n = sorted.length;
          const result = new Map<string, number>();
          sorted.forEach((r, idx) => {
            result.set(r.companyId, n <= 1 ? 99 : Math.max(1, Math.min(99, Math.round(((idx + 1) / n) * 99))));
          });
          return result;
        };

        const completionPctiles = assignPercentiles(raw, r => r.completionPct);
        const consistencyPctiles = assignPercentiles(raw, r => r.consistencyPct);
        const timelinessPctiles = assignPercentiles(raw, r => r.timelinessScore);

        // 8. Merge percentiles into final ranked list
        const ranked: CompanyRanking[] = raw.map(r => ({
          ...r,
          completenessPercentile: completionPctiles.get(r.companyId) || 1,
          consistencyPercentile: consistencyPctiles.get(r.companyId) || 1,
          timelinessPercentile: timelinessPctiles.get(r.companyId) || 1,
        }));

        setRankings(ranked);
      } catch (err) {
        console.error('Error fetching portfolio rankings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [year, quarter]);
  return { rankings, isLoading };
};



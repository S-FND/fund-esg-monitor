// ══════════════════════════════════════════════════════════════════════════════
// Data-injected variant of useAnalyticsDashboardData.
// The caller supplies already-fetched kpi_entries + company_feature_settings.
// No network calls happen inside this file.
//
// This file DOES NOT modify the original hook. It duplicates the post-fetch
// processing pipeline so `useAnalyticsDashboardDataFromData` produces the same
// output shape (AnalyticsDashboardData) as `useAnalyticsDashboardData`.
// ══════════════════════════════════════════════════════════════════════════════
import { useMemo } from 'react';
import { mockCompanies } from '@/data/mockData';
import { isCompanyExcluded } from '@/lib/companyExclusions';
import {
  applyEnvironmentPercentileNormalization,
  applySocialScorePercentileNormalization,
  computeCrossQuarterVirginReductions,
} from '@/lib/envScorePercentile';
import {
  buildAggregation,
  deriveInsights,
  AnalyticsFilters,
  AnalyticsDashboardData,
  AggregationMetrics,
  InsightMetrics,
  TimeSeriesPoint,
  CompanyRawMetrics,
} from './useAnalyticsDashboardData';
import { buildPeriods } from '@/lib/periodUtils';

/** Round to 2 decimal places */
const r2 = (v: number): number => Math.round(v * 100) / 100;

// Local copy of sumAggregations (not exported from the original hook file).
function sumAggregations(items: AggregationMetrics[]): AggregationMetrics {
  if (items.length === 0) return buildAggregation({});

  const sum = (key: keyof AggregationMetrics) => items.reduce((a, b) => a + (b[key] as number), 0);
  const avg = (key: keyof AggregationMetrics) => {
    const vals = items.filter(i => (i[key] as number) > 0);
    return vals.length > 0 ? vals.reduce((a, b) => a + (b[key] as number), 0) / vals.length : 0;
  };

  const totalEmployment = sum('totalEmployment');
  const totalGrossWages = sum('totalGrossWages');
  const totalWcEmployees = sum('totalWcEmployees');
  const totalWcWages = sum('totalWcWages');

  return {
    netRevenue: sum('netRevenue'),
    revenueTier2Plus: avg('revenueTier2Plus'),
    totalCustomersServed: sum('totalCustomersServed'),
    uniqueFemaleCustomersPct: avg('uniqueFemaleCustomersPct'),
    msmeSupplierPct: avg('msmeSupplierPct'),
    totalWcEmployees: sum('totalWcEmployees'),
    totalWcWages: sum('totalWcWages'),
    totalBcEmployees: sum('totalBcEmployees'),
    totalBcWages: sum('totalBcWages'),
    totalEmployment,
    totalGrossWages,
    pwdPct: avg('pwdPct'),
    attritionRate: avg('attritionRate'),
    cLevelFemale: sum('cLevelFemale'),
    boardFemale: sum('boardFemale'),
    avgCxoCompensation: avg('avgCxoCompensation'),
    avgEmployeeCompensation: totalWcEmployees > 0 ? totalWcWages / totalWcEmployees : 0,
    totalPackagingMT: sum('totalPackagingMT'),
    totalPackagingRecycledMT: sum('totalPackagingRecycledMT'),
    eprTargetsMT: sum('eprTargetsMT'),
    primaryTotalMT: sum('primaryTotalMT'),
    primaryRecyclablePct: (() => {
      let ws = 0, tm = 0;
      items.forEach(a => { if (a.primaryTotalMT > 0) { ws += a.primaryRecyclablePct * a.primaryTotalMT; tm += a.primaryTotalMT; } });
      return tm > 0 ? ws / tm : 0;
    })(),
    secondaryTotalMT: sum('secondaryTotalMT'),
    secondaryRecyclablePct: (() => {
      let ws = 0, tm = 0;
      items.forEach(a => { if (a.secondaryTotalMT > 0) { ws += a.secondaryRecyclablePct * a.secondaryTotalMT; tm += a.secondaryTotalMT; } });
      return tm > 0 ? ws / tm : 0;
    })(),
    fashionTotalMaterials: sum('fashionTotalMaterials'),
    fashionSustainablePct: avg('fashionSustainablePct'),
    fashionRecyclablePct: avg('fashionRecyclablePct'),
    fashionNonRecyclablePct: avg('fashionNonRecyclablePct'),
    fashionPlasticPrimaryRecyclable: sum('fashionPlasticPrimaryRecyclable'),
    fashionPlasticPrimaryNonRecyclable: sum('fashionPlasticPrimaryNonRecyclable'),
    fashionPlasticSecondaryRecyclable: sum('fashionPlasticSecondaryRecyclable'),
    fashionPlasticSecondaryNonRecyclable: sum('fashionPlasticSecondaryNonRecyclable'),
    healthcareConsultations: sum('healthcareConsultations'),
    healthcareProductsOffered: sum('healthcareProductsOffered'),
    csrSpendAmount: sum('csrSpendAmount'),
    voluntaryPlasticNeutralityPct: avg('voluntaryPlasticNeutralityPct'),
    fashionSyntheticMT: sum('fashionSyntheticMT'),
    fashionNaturalMT: sum('fashionNaturalMT'),
    fashionTextileWasteMfgMT: sum('fashionTextileWasteMfgMT'),
    fashionPostMfgWasteMT: sum('fashionPostMfgWasteMT'),
    fashionPkgPlasticTotalMT: sum('fashionPkgPlasticTotalMT'),
    fashionPkgRecycledPlasticMT: sum('fashionPkgRecycledPlasticMT'),
    fashionPkgPaperMT: sum('fashionPkgPaperMT'),
    totalWaterConsumed: sum('totalWaterConsumed'),
    avgWastewaterRecycledPct: avg('avgWastewaterRecycledPct'),
    avgFreshWaterPct: avg('avgFreshWaterPct'),
    fashionRecyclablePackagingPct: avg('fashionRecyclablePackagingPct'),
    totalEnergyConsumed: sum('totalEnergyConsumed'),
    avgRenewableEnergyPct: avg('avgRenewableEnergyPct'),
    totalWasteGenerated: sum('totalWasteGenerated'),
    avgWasteRecycledPct: avg('avgWasteRecycledPct'),
    wcMale: sum('wcMale'),
    wcFemale: sum('wcFemale'),
    wcWagesMale: sum('wcWagesMale'),
    wcWagesFemale: sum('wcWagesFemale'),
    bcMale: sum('bcMale'),
    bcFemale: sum('bcFemale'),
    bcWagesMale: sum('bcWagesMale'),
    bcWagesFemale: sum('bcWagesFemale'),
    cLevelTotal: sum('cLevelTotal'),
    boardTotal: sum('boardTotal'),
    boardIndependent: sum('boardIndependent'),
    primaryPlasticVirgin: sum('primaryPlasticVirgin'),
    primaryPlasticRecycled: sum('primaryPlasticRecycled'),
    primaryNonPlastic: sum('primaryNonPlastic'),
    secondaryPlasticVirgin: sum('secondaryPlasticVirgin'),
    secondaryPlasticRecycled: sum('secondaryPlasticRecycled'),
    secondaryNonPlastic: sum('secondaryNonPlastic'),
    totalIncidents: sum('totalIncidents'),
    totalOpenCases: sum('totalOpenCases'),
    highImpactIncidents: sum('highImpactIncidents'),
    poshCases: sum('poshCases'),
    policiesInPlace: sum('policiesInPlace'),
    policiesWithTraining: sum('policiesWithTraining'),
    totalPolicies: sum('totalPolicies'),
    avgInternationalVendorPct: avg('avgInternationalVendorPct'),
    vendorCategoriesWithDEI: sum('vendorCategoriesWithDEI'),
    totalVendorCategories: sum('totalVendorCategories'),
    smallScaleVendors: sum('smallScaleVendors'),
    largeScaleVendors: sum('largeScaleVendors'),
    envPolicyInPlace: avg('envPolicyInPlace'),
    supplierCocInPlace: avg('supplierCocInPlace'),
    supplierCocTraining: avg('supplierCocTraining'),
  };
}

export interface AnalyticsDashboardInput {
  filters: AnalyticsFilters;
  /** KPI entries already filtered by year/asOf (fetching stage responsibility). */
  kpiEntries: Array<{ companyId: string; kpi_id: string; value: string | null; quarter: string; year: number; submitted_at: string | null }>;
  /** Company feature settings rows (fetching stage responsibility). */
  companyFeatureSettings: Array<{ companyId: string; feature_key: string; enabled: boolean }>;
}

export function processAnalyticsDashboardData(input: AnalyticsDashboardInput): AnalyticsDashboardData {
  const { filters, kpiEntries, companyFeatureSettings } = input;

  // ── Build periods via reusable filter utility ──
  // quarterly + specific quarter → [{ quarter, year }] (e.g. only Q1)
  // quarterly + no quarter       → all four quarters of the year
  // annual                       → [{ FY, year }]
  const periods = buildPeriods({
    period: filters.period === 'quarterly' ? 'quarterly' : 'annual',
    year: filters.year,
    quarter: filters.quarter,
  });

  // ── Build feature sets from provided companyFeatureSettings (replaces the 4 supabase queries) ──
  const enabledFeat = companyFeatureSettings.filter(r => r.enabled);
  const fashionPkgCompanyIds = new Set(enabledFeat.filter(r => r.feature_key === 'fashionMaterials').map(r => r.companyId));
  const stdPkgCompanyIds = new Set(enabledFeat.filter(r => r.feature_key === 'primarySecondaryPackaging').map(r => r.companyId));
  const sourcingCompanyIds = new Set(enabledFeat.filter(r => r.feature_key === 'sourcingFulfillment').map(r => r.companyId));
  const envFeatureRelevant = enabledFeat.filter(r => ['waterDetailed', 'waterManagement', 'energyDetailed', 'wasteDetailed'].includes(r.feature_key));
  const envFeatureCompanyIds = new Set(envFeatureRelevant.map(r => r.companyId));
  const waterDetailedCompanyIds = new Set(envFeatureRelevant.filter(r => r.feature_key === 'waterDetailed' || r.feature_key === 'waterManagement').map(r => r.companyId));

  const hasEnvFeature = (companyId: string) =>
    fashionPkgCompanyIds.has(companyId) || stdPkgCompanyIds.has(companyId) || envFeatureCompanyIds.has(companyId);

  // Strip food_pkg_* entries from companies that don't have primarySecondaryPackaging enabled
  // This prevents stale/erroneous data from polluting aggregation
  let allEntries = kpiEntries.filter(e => {
    if (e.kpi_id.startsWith('food_pkg_') && !stdPkgCompanyIds.has(e.companyId)) return false;
    return true;
  });

      // Filter companies (exclude Demo companies from admin analytics)
      let filteredCompanies = mockCompanies.filter(c => c.investmentStatus === 'Invested');
      if (filters.industry) filteredCompanies = filteredCompanies.filter(c => c.industry === filters.industry);
      if (filters.fund) filteredCompanies = filteredCompanies.filter(c => c.fund === filters.fund);
      if (filters.revenueStage) filteredCompanies = filteredCompanies.filter(c => c.revenueStage === filters.revenueStage);
      if (filters.qCategory) filteredCompanies = filteredCompanies.filter(c => c.qCategory === filters.qCategory);
      if (filters.firesidePOC) filteredCompanies = filteredCompanies.filter(c => c.fl === filters.firesidePOC);
      if (filters.companyId) filteredCompanies = filteredCompanies.filter(c => c.id === filters.companyId);
      const companyIds = new Set(filteredCompanies.map(c => c.id));

      // Build time-series
      const timeSeries: TimeSeriesPoint[] = periods.map(p => {
        const periodEntries = allEntries.filter(e => {
          if (!companyIds.has(e.companyId)) return false;
          // Exclude companies from specific quarters
          if (isCompanyExcluded(e.companyId, e.quarter, e.year)) return false;
          if (p.quarter === 'FY') return (e.quarter === 'FY' || e.quarter === 'Annual') && e.year === p.year;
          return e.quarter === p.quarter && e.year === p.year;
        });

        const byCompany: Record<string, Record<string, string>> = {};
        periodEntries.forEach(e => {
          if (!byCompany[e.companyId]) byCompany[e.companyId] = {};
          byCompany[e.companyId][e.kpi_id] = e.value || '';
        });

        const companyAggs = Object.values(byCompany).map(kpis => buildAggregation(kpis));
        const aggregation = sumAggregations(companyAggs);
        const insights = deriveInsights(aggregation);

        // Per-company averaged insights (matches stat card logic: average of individual company scores)
        const companyInsightsList = Object.values(byCompany)
          .filter(kpis => Object.keys(kpis).length > 0)
          .map(kpis => deriveInsights(buildAggregation(kpis)));
        const avgInsight = (key: keyof InsightMetrics): number => {
          const vals = companyInsightsList.map(i => i[key] as number).filter(v => v !== undefined && !isNaN(v));
          return vals.length > 0 ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : 0;
        };
        const perCompanyInsights: InsightMetrics = {} as InsightMetrics;
        for (const key of Object.keys(insights) as (keyof InsightMetrics)[]) {
          (perCompanyInsights as any)[key] = avgInsight(key);
        }

        return {
          period: p.quarter === 'FY' ? `AY ${p.year}` : `${p.quarter} ${p.year}`,
          quarter: p.quarter,
          year: p.year,
          aggregation,
          insights,
          perCompanyInsights,
          companyCount: Object.keys(byCompany).length,
        };
      });

      // Current period
      const currentQ = filters.period === 'quarterly' ? (filters.quarter || 'Q1') : 'FY';
      const currentPeriod = timeSeries.find(t => t.quarter === currentQ && t.year === filters.year);
      const current = currentPeriod?.aggregation || buildAggregation({});
      const currentInsights = currentPeriod?.insights || deriveInsights(current);

      // Build per-company raw data for current period
      const currentEntries = allEntries.filter(e => {
        if (!companyIds.has(e.companyId)) return false;
        // Exclude companies from specific quarters
        if (isCompanyExcluded(e.companyId, e.quarter, e.year)) return false;
        if (currentQ === 'FY') return (e.quarter === 'FY' || e.quarter === 'Annual') && e.year === filters.year;
        return e.quarter === currentQ && e.year === filters.year;
      });

      const currentByCompany: Record<string, Record<string, string>> = {};
      currentEntries.forEach(e => {
        if (!currentByCompany[e.companyId]) currentByCompany[e.companyId] = {};
        currentByCompany[e.companyId][e.kpi_id] = e.value || '';
      });

      // Per-company raw metrics
      const companyRawData: CompanyRawMetrics[] = filteredCompanies.map(company => {
        const kpis = currentByCompany[company.id] || {};
        const aggregation = buildAggregation(kpis);
        const hasFashionPkg = fashionPkgCompanyIds.has(company.id);
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
          hasWaterFeature: waterDetailedCompanyIds.has(company.id),
          hasEnvironmentFeature: hasEnvFeature(company.id),
        };
      });

      // Compute cross-quarter virgin plastic reduction for quarterly mode too
      // Build per-quarter KPI data from allEntries for VPR calculation
      const vprQ14Entries = allEntries.filter(e => {
        if (!companyIds.has(e.companyId)) return false;
        if (isCompanyExcluded(e.companyId, e.quarter, e.year)) return false;
        return ['Q1', 'Q2', 'Q3', 'Q4'].includes(e.quarter) && e.year === filters.year;
      });
      const vprByCompanyQuarter: Record<string, Record<string, Record<string, string>>> = {};
      vprQ14Entries.forEach(e => {
        if (!vprByCompanyQuarter[e.companyId]) vprByCompanyQuarter[e.companyId] = {};
        if (!vprByCompanyQuarter[e.companyId][e.quarter]) vprByCompanyQuarter[e.companyId][e.quarter] = {};
        vprByCompanyQuarter[e.companyId][e.quarter][e.kpi_id] = e.value || '';
      });
      const vprPerQuarter: Record<string, Array<{ companyId: string; kpis: Record<string, string> }>> = {};
      ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
        vprPerQuarter[q] = filteredCompanies.map(company => ({
          companyId: company.id,
          kpis: vprByCompanyQuarter[company.id]?.[q] || {},
        }));
      });
      const quarterlyVirginReductions = computeCrossQuarterVirginReductions(vprPerQuarter);

      // Apply percentile normalization to Environment Score components (quarterly mode)
      applyEnvironmentPercentileNormalization(companyRawData, quarterlyVirginReductions);
      // Apply percentile normalization to Social Score components
      applySocialScorePercentileNormalization(companyRawData, sourcingCompanyIds);

      // ── Build all-company raw data for comparison when single company selected ──
      let allCompanyRawData: CompanyRawMetrics[] | undefined;
      let allQuarterlyCombinedRawData: CompanyRawMetrics[] | undefined;

      // ── Build combined Q1-Q4 data for annual view ──
      let quarterlyCombinedRawData: CompanyRawMetrics[] | undefined;
      let quarterlyCombinedAggregation: AggregationMetrics | undefined;
      let quarterlyCombinedInsights: InsightMetrics | undefined;
      let quarterlyPerQuarterRawData: Record<string, CompanyRawMetrics[]> | undefined;

      if (filters.period === 'annual') {
        const PCT_PATTERNS = ['_pct', '_percentage', 'recyclability', 'unique_female_customers', 'revenue_tier2_plus', 'attrition_rate', 'renewable_pct', 'wastewater_recycled_pct', 'waste_recycled_pct', 'fresh_water_pct', 'plastic_neutrality'];
        // KPIs that are already averages or scores — should be averaged across quarters, not summed
        const AVG_KPI_PATTERNS = ['avg_cxo_compensation', 'employees_enps', 'leadership_clevel_total', 'leadership_clevel_female', 'leadership_board_total', 'leadership_board_female', 'leadership_board_independent'];
        const isPercentageKpi = (id: string) => PCT_PATTERNS.some(p => id.includes(p));
        const isAverageKpi = (id: string) => AVG_KPI_PATTERNS.some(p => id.includes(p));
        // KPIs that should use Q4 snapshot (latest quarter value) instead of summing
        const isQ4SnapshotKpi = (id: string) => id.startsWith('vendor_mis_') && id.endsWith('_num_vendors');
        // KPIs where the cumulative sum across quarters should be used, capped at 100 (compliance KPIs)
        const MAX_KPI_PATTERNS = ['epr_compliance_pct', 'voluntary_plastic_neutrality'];
        const isMaxAcrossQuartersKpi = (id: string) => MAX_KPI_PATTERNS.some(p => id.includes(p));

        // Get Q1-Q4 entries for the selected year
        const q14Entries = allEntries.filter(e => {
          if (!companyIds.has(e.companyId)) return false;
          // Exclude companies from specific quarters
          if (isCompanyExcluded(e.companyId, e.quarter, e.year)) return false;
          return ['Q1', 'Q2', 'Q3', 'Q4'].includes(e.quarter) && e.year === filters.year;
        });

        // Group by company → quarter → kpis
        const q14ByCompanyQuarter: Record<string, Record<string, Record<string, string>>> = {};
        q14Entries.forEach(e => {
          if (!q14ByCompanyQuarter[e.companyId]) q14ByCompanyQuarter[e.companyId] = {};
          if (!q14ByCompanyQuarter[e.companyId][e.quarter]) q14ByCompanyQuarter[e.companyId][e.quarter] = {};
          q14ByCompanyQuarter[e.companyId][e.quarter][e.kpi_id] = e.value || '';
        });

        // Combine per-company: sum counts, average %
        quarterlyCombinedRawData = filteredCompanies.map(company => {
          const quarterData = q14ByCompanyQuarter[company.id] || {};
          const quarters = Object.keys(quarterData);
          const combinedKpis: Record<string, string> = {};

          // Collect all KPI keys across all quarters
          const allKpiKeys = new Set<string>();
          quarters.forEach(q => Object.keys(quarterData[q]).forEach(k => allKpiKeys.add(k)));

          allKpiKeys.forEach(kpiId => {
            const rawVals = quarters
              .map(q => quarterData[q]?.[kpiId])
              .filter(v => v !== undefined && v !== '' && v !== null) as string[];

            if (rawVals.length === 0) return;

            // Check if values are numeric
            const numericVals = rawVals.map(v => parseFloat(v)).filter(v => !isNaN(v));

            if (numericVals.length > 0) {
              if (isMaxAcrossQuartersKpi(kpiId)) {
                // Cumulative sum across quarters for compliance KPIs, capped at 100
                combinedKpis[kpiId] = String(r2(Math.min(100, numericVals.reduce((a, b) => a + b, 0))));
              } else if (isQ4SnapshotKpi(kpiId)) {
                // Q4 snapshot: use Q4 value if available, otherwise latest quarter
                const q4Val = quarterData['Q4']?.[kpiId];
                const q4Num = q4Val ? parseFloat(q4Val) : NaN;
                if (!isNaN(q4Num)) {
                  combinedKpis[kpiId] = String(Math.round(q4Num));
                } else {
                  // Fallback to latest quarter with data
                  combinedKpis[kpiId] = rawVals[rawVals.length - 1];
                }
              } else if (isPercentageKpi(kpiId) || isAverageKpi(kpiId)) {
                // Average for percentages and pre-averaged metrics (CXO comp, eNPS)
                combinedKpis[kpiId] = String(r2(numericVals.reduce((a, b) => a + b, 0) / numericVals.length));
              } else {
                // Sum for counts/absolutes
                combinedKpis[kpiId] = String(r2(numericVals.reduce((a, b) => a + b, 0)));
              }
            } else {
              // Non-numeric — try to merge JSON arrays, otherwise take latest value
              let merged = false;
              try {
                const arrays = rawVals.map(v => JSON.parse(v)).filter(Array.isArray);
                if (arrays.length > 0) {
                  // Merge arrays, deduplicate by 'id' if objects have one
                  const all = arrays.flat();
                  if (all.length > 0 && typeof all[0] === 'object' && all[0]?.id) {
                    const seen = new Set<string>();
                    const unique = all.filter(item => {
                      if (seen.has(item.id)) return false;
                      seen.add(item.id);
                      return true;
                    });
                    combinedKpis[kpiId] = JSON.stringify(unique);
                  } else {
                    // For simple value arrays (like DEI factors), take latest non-empty
                    const lastNonEmpty = arrays.filter(a => a.length > 0).pop();
                    combinedKpis[kpiId] = JSON.stringify(lastNonEmpty || arrays[arrays.length - 1]);
                  }
                  merged = true;
                }
              } catch { /* not JSON */ }
              if (!merged) {
                combinedKpis[kpiId] = rawVals[rawVals.length - 1];
              }
            }
          });

          // Merge FY-only data (policies, facility data) into combined KPIs
          // so that governance scores, water/energy/waste metrics are accurate
          const fyKpis = currentByCompany[company.id] || {};
          Object.entries(fyKpis).forEach(([k, v]) => {
            // Only add FY keys that are NOT already in quarterly combined data
            if (v && v.trim() && !combinedKpis[k]) {
              combinedKpis[k] = v;
            }
          });

          const aggregation = buildAggregation(combinedKpis);
          const hasFashionPkg = fashionPkgCompanyIds.has(company.id);
          const insights = deriveInsights(aggregation, company.industry, hasFashionPkg);
          return {
            companyId: company.id,
            companyName: company.name,
            brand: company.brand,
            industry: company.industry,
            fund: company.fund,
            revenueStage: company.revenueStage,
            kpis: combinedKpis,
            aggregation,
            insights,
            usesFashionPackaging: hasFashionPkg,
            hasWaterFeature: waterDetailedCompanyIds.has(company.id),
            hasEnvironmentFeature: hasEnvFeature(company.id),
          };
        });

        // Compute cross-quarter virgin plastic reduction (Base Q intensity vs Q4 intensity)
        const perQuarterForVPR: Record<string, Array<{ companyId: string; kpis: Record<string, string> }>> = {};
        ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
          perQuarterForVPR[q] = filteredCompanies.map(company => ({
            companyId: company.id,
            kpis: q14ByCompanyQuarter[company.id]?.[q] || {},
          }));
        });
        const virginReductions = computeCrossQuarterVirginReductions(perQuarterForVPR);

        // Apply percentile normalization to Environment Score components (annual mode)
        applyEnvironmentPercentileNormalization(quarterlyCombinedRawData, virginReductions);
        // Apply percentile normalization to Social Score components (annual mode)
        applySocialScorePercentileNormalization(quarterlyCombinedRawData, sourcingCompanyIds);

        const combinedAggs = quarterlyCombinedRawData.map(c => c.aggregation);
        quarterlyCombinedAggregation = sumAggregations(combinedAggs);
        quarterlyCombinedInsights = deriveInsights(quarterlyCombinedAggregation);

        // Override circularEconomyIndex and esgCompositeScore with per-company percentile-based averages
        const submitting = quarterlyCombinedRawData.filter(c => Object.keys(c.kpis).length > 0);
        const avgField = (key: keyof InsightMetrics) => {
          const vals = submitting.map(c => c.insights[key] as number).filter(v => !isNaN(v));
          return vals.length > 0 ? r2(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
        };
        quarterlyCombinedInsights.circularEconomyIndex = avgField('circularEconomyIndex');
        quarterlyCombinedInsights.socialScore = avgField('socialScore');
        quarterlyCombinedInsights.deiCompositeScore = avgField('deiCompositeScore');
        quarterlyCombinedInsights.esgCompositeScore = avgField('esgCompositeScore');

        // Build per-quarter CompanyRawMetrics for timeline graphs
        quarterlyPerQuarterRawData = {};
        ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
          quarterlyPerQuarterRawData![q] = filteredCompanies.map(company => {
            const kpis = q14ByCompanyQuarter[company.id]?.[q] || {};
            const aggregation = buildAggregation(kpis);
            const hasFashionPkg = fashionPkgCompanyIds.has(company.id);
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
              hasWaterFeature: waterDetailedCompanyIds.has(company.id),
              hasEnvironmentFeature: hasEnvFeature(company.id),
            };
          });
        });
      } else {
        // Quarterly mode: also build per-quarter data for cross-quarter metrics (e.g., plastic reduction)
        // allEntries already contains all entries for the year(s)
        const q14Entries = allEntries.filter(e => {
          if (!companyIds.has(e.companyId)) return false;
          if (isCompanyExcluded(e.companyId, e.quarter, e.year)) return false;
          return ['Q1', 'Q2', 'Q3', 'Q4'].includes(e.quarter) && e.year === filters.year;
        });
        const q14ByCompanyQuarter: Record<string, Record<string, Record<string, string>>> = {};
        q14Entries.forEach(e => {
          if (!q14ByCompanyQuarter[e.companyId]) q14ByCompanyQuarter[e.companyId] = {};
          if (!q14ByCompanyQuarter[e.companyId][e.quarter]) q14ByCompanyQuarter[e.companyId][e.quarter] = {};
          q14ByCompanyQuarter[e.companyId][e.quarter][e.kpi_id] = e.value || '';
        });
        quarterlyPerQuarterRawData = {};
        ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
          quarterlyPerQuarterRawData![q] = filteredCompanies.map(company => {
            const kpis = q14ByCompanyQuarter[company.id]?.[q] || {};
            const aggregation = buildAggregation(kpis);
            const hasFashionPkg = fashionPkgCompanyIds.has(company.id);
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
              hasWaterFeature: waterDetailedCompanyIds.has(company.id),
              hasEnvironmentFeature: hasEnvFeature(company.id),
            };
          });
        });
      }

      // ── Build all-company raw data for comparison averages (only when a single company is selected) ──
      if (filters.companyId) {
        // All companies without companyId filter (but respect industry/fund/stage filters? No — we want ALL for portfolio avg)
        const allCompanies = mockCompanies.filter(c => c.investmentStatus === 'Invested');
        const allCompanyIds = new Set(allCompanies.map(c => c.id));

        if (filters.period === 'annual') {
          // Build Q1-Q4 combined for all companies
          const PCT_PATTERNS2 = ['_pct', '_percentage', 'recyclability', 'unique_female_customers', 'revenue_tier2_plus', 'attrition_rate', 'renewable_pct', 'wastewater_recycled_pct', 'waste_recycled_pct', 'fresh_water_pct', 'plastic_neutrality'];
          const AVG_KPI_PATTERNS2 = ['avg_cxo_compensation', 'employees_enps', 'leadership_clevel_total', 'leadership_clevel_female', 'leadership_board_total', 'leadership_board_female', 'leadership_board_independent'];
          const isPercentageKpi2 = (id: string) => PCT_PATTERNS2.some(p => id.includes(p));
          const isAverageKpi2 = (id: string) => AVG_KPI_PATTERNS2.some(p => id.includes(p));
          const isQ4SnapshotKpi2 = (id: string) => id.startsWith('vendor_mis_') && id.endsWith('_num_vendors');
          const MAX_KPI_PATTERNS2 = ['epr_compliance_pct', 'voluntary_plastic_neutrality'];
          const isMaxAcrossQuartersKpi2 = (id: string) => MAX_KPI_PATTERNS2.some(p => id.includes(p));

          const allQ14Entries = allEntries.filter(e => {
            if (!allCompanyIds.has(e.companyId)) return false;
            if (isCompanyExcluded(e.companyId, e.quarter, e.year)) return false;
            return ['Q1', 'Q2', 'Q3', 'Q4'].includes(e.quarter) && e.year === filters.year;
          });

          const allQ14ByCQ: Record<string, Record<string, Record<string, string>>> = {};
          allQ14Entries.forEach(e => {
            if (!allQ14ByCQ[e.companyId]) allQ14ByCQ[e.companyId] = {};
            if (!allQ14ByCQ[e.companyId][e.quarter]) allQ14ByCQ[e.companyId][e.quarter] = {};
            allQ14ByCQ[e.companyId][e.quarter][e.kpi_id] = e.value || '';
          });

          allQuarterlyCombinedRawData = allCompanies.map(company => {
            const quarterData = allQ14ByCQ[company.id] || {};
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
                if (isMaxAcrossQuartersKpi2(kpiId)) {
                  combinedKpis[kpiId] = String(r2(Math.min(100, numericVals.reduce((a, b) => a + b, 0))));
                } else if (isQ4SnapshotKpi2(kpiId)) {
                  const q4Val = quarterData['Q4']?.[kpiId];
                  const q4Num = q4Val ? parseFloat(q4Val) : NaN;
                  if (!isNaN(q4Num)) {
                    combinedKpis[kpiId] = String(Math.round(q4Num));
                  } else {
                    combinedKpis[kpiId] = rawVals[rawVals.length - 1];
                  }
                } else if (isPercentageKpi2(kpiId) || isAverageKpi2(kpiId)) {
                  combinedKpis[kpiId] = String(r2(numericVals.reduce((a, b) => a + b, 0) / numericVals.length));
                } else {
                  combinedKpis[kpiId] = String(r2(numericVals.reduce((a, b) => a + b, 0)));
                }
              } else {
                combinedKpis[kpiId] = rawVals[rawVals.length - 1];
              }
            });

            const aggregation = buildAggregation(combinedKpis);
            const hasFashionPkg = fashionPkgCompanyIds.has(company.id);
            const insights = deriveInsights(aggregation, company.industry, hasFashionPkg);
            return { companyId: company.id, companyName: company.name, brand: company.brand, industry: company.industry, fund: company.fund, revenueStage: company.revenueStage, kpis: combinedKpis, aggregation, insights, usesFashionPackaging: hasFashionPkg, hasWaterFeature: waterDetailedCompanyIds.has(company.id), hasEnvironmentFeature: hasEnvFeature(company.id) };
          });
          // Compute cross-quarter VPR for all companies
          const allPerQuarterForVPR: Record<string, Array<{ companyId: string; kpis: Record<string, string> }>> = {};
          ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
            allPerQuarterForVPR[q] = allCompanies.map(company => ({
              companyId: company.id,
              kpis: allQ14ByCQ[company.id]?.[q] || {},
            }));
          });
          const allVirginReductions = computeCrossQuarterVirginReductions(allPerQuarterForVPR);
          applyEnvironmentPercentileNormalization(allQuarterlyCombinedRawData, allVirginReductions);
          applySocialScorePercentileNormalization(allQuarterlyCombinedRawData, sourcingCompanyIds);
        } else {
          // Quarterly: build from current period entries for all companies
          const allCurrentEntries = allEntries.filter(e => {
            if (!allCompanyIds.has(e.companyId)) return false;
            if (isCompanyExcluded(e.companyId, e.quarter, e.year)) return false;
            const currentQ2 = filters.quarter || 'Q1';
            return e.quarter === currentQ2 && e.year === filters.year;
          });

          const allCurrentByCompany: Record<string, Record<string, string>> = {};
          allCurrentEntries.forEach(e => {
            if (!allCurrentByCompany[e.companyId]) allCurrentByCompany[e.companyId] = {};
            allCurrentByCompany[e.companyId][e.kpi_id] = e.value || '';
          });

          allCompanyRawData = allCompanies.map(company => {
            const kpis = allCurrentByCompany[company.id] || {};
            const aggregation = buildAggregation(kpis);
            const hasFashionPkg = fashionPkgCompanyIds.has(company.id);
            const insights = deriveInsights(aggregation, company.industry, hasFashionPkg);
            return { companyId: company.id, companyName: company.name, brand: company.brand, industry: company.industry, fund: company.fund, revenueStage: company.revenueStage, kpis, aggregation, insights, usesFashionPackaging: hasFashionPkg, hasWaterFeature: waterDetailedCompanyIds.has(company.id), hasEnvironmentFeature: hasEnvFeature(company.id) };
          });
          // Build per-quarter data for VPR in quarterly mode for all companies
          const allVprQ14 = allEntries.filter(e => {
            if (!allCompanyIds.has(e.companyId)) return false;
            if (isCompanyExcluded(e.companyId, e.quarter, e.year)) return false;
            return ['Q1', 'Q2', 'Q3', 'Q4'].includes(e.quarter) && e.year === filters.year;
          });
          const allVprByCQ: Record<string, Record<string, Record<string, string>>> = {};
          allVprQ14.forEach(e => {
            if (!allVprByCQ[e.companyId]) allVprByCQ[e.companyId] = {};
            if (!allVprByCQ[e.companyId][e.quarter]) allVprByCQ[e.companyId][e.quarter] = {};
            allVprByCQ[e.companyId][e.quarter][e.kpi_id] = e.value || '';
          });
          const allQVprPerQ: Record<string, Array<{ companyId: string; kpis: Record<string, string> }>> = {};
          ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
            allQVprPerQ[q] = allCompanies.map(company => ({
              companyId: company.id,
              kpis: allVprByCQ[company.id]?.[q] || {},
            }));
          });
          const allQVirginReductions = computeCrossQuarterVirginReductions(allQVprPerQ);
          applyEnvironmentPercentileNormalization(allCompanyRawData, allQVirginReductions);
          applySocialScorePercentileNormalization(allCompanyRawData, sourcingCompanyIds);
        }
      }

      // Rollups by dimension
      const companyAggList: { agg: AggregationMetrics; company: typeof mockCompanies[0] }[] = [];
      filteredCompanies.forEach(company => {
        const kpis = currentByCompany[company.id] || {};
        companyAggList.push({ agg: buildAggregation(kpis), company });
      });

      const groupBy = <T extends string>(getKey: (c: typeof mockCompanies[0]) => T) => {
        const groups: Record<string, AggregationMetrics[]> = {};
        companyAggList.forEach(({ agg, company }) => {
          const key = getKey(company);
          if (!groups[key]) groups[key] = [];
          groups[key].push(agg);
        });
        const result: Record<string, AggregationMetrics> = {};
        Object.entries(groups).forEach(([key, aggs]) => {
          result[key] = sumAggregations(aggs);
        });
        return result;
      };

      return {
        current,
        currentInsights,
        timeSeries,
        byIndustry: groupBy(c => c.industry),
        byFund: groupBy(c => c.fund),
        byRevenueStage: groupBy(c => c.revenueStage),
        companyCount: filteredCompanies.length,
        filteredCompanies,
        companyRawData,
        quarterlyCombinedRawData,
        quarterlyCombinedAggregation,
        quarterlyCombinedInsights,
        quarterlyPerQuarterRawData,
        allCompanyRawData,
        allQuarterlyCombinedRawData,
      };

}

export const useAnalyticsDashboardDataFromData = (params: AnalyticsDashboardInput): AnalyticsDashboardData => {
  return useMemo(
    () => processAnalyticsDashboardData(params),
    [params.filters, params.kpiEntries, params.companyFeatureSettings],
  );
};

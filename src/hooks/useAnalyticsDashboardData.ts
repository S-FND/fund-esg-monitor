import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mockCompanies } from '@/data/mockData';
import { Industry, RevenueStage, Fund, QCategory } from '@/types/esg';
import { isCompanyExcluded } from '@/lib/companyExclusions';
import { applyEnvironmentPercentileNormalization, applySocialScorePercentileNormalization, computeCrossQuarterVirginReductions } from '@/lib/envScorePercentile';
import { useAsOf, isPeriodAfterCutoff } from '@/contexts/AsOfContext';
import { KpiEntryRaw } from './usePortfolioRankings';
import { useEffect, useState } from 'react';
import { filterKpiEntries } from '@/utils/kpiEntryFilters';
import { http } from '@/utils/httpInterceptor';

// ──── Types ────
export interface AnalyticsFilters {
  period: 'quarterly' | 'annual';
  quarter?: string;
  year: number;
  years?: number[];
  industry?: Industry;
  fund?: Fund;
  revenueStage?: RevenueStage;
  companyId?: string;
  qCategory?: QCategory;
  firesidePOC?: string;
  cumulative?: boolean;
}

export interface CompanyRawMetrics {
  companyId: string;
  companyName: string;
  brand: string;
  industry: Industry;
  fund: Fund;
  revenueStage: RevenueStage;
  kpis: Record<string, string>;
  aggregation: AggregationMetrics;
  insights: InsightMetrics;
  usesFashionPackaging?: boolean;
  hasEnvironmentFeature?: boolean;
}

export interface AggregationMetrics {
  netRevenue: number;
  revenueTier2Plus: number;
  totalCustomersServed: number;
  uniqueFemaleCustomersPct: number;
  msmeSupplierPct: number;
  totalWcEmployees: number;
  totalWcWages: number;
  totalBcEmployees: number;
  totalBcWages: number;
  totalEmployment: number;
  totalGrossWages: number;
  pwdPct: number;
  attritionRate: number;
  cLevelFemale: number;
  boardFemale: number;
  avgCxoCompensation: number;
  avgEmployeeCompensation: number;
  totalPackagingMT: number;
  totalPackagingRecycledMT: number;
  eprTargetsMT: number;
  primaryTotalMT: number;
  primaryRecyclablePct: number;
  secondaryTotalMT: number;
  secondaryRecyclablePct: number;
  fashionTotalMaterials: number;
  fashionSustainablePct: number;
  fashionRecyclablePct: number;
  fashionNonRecyclablePct: number;
  fashionPlasticPrimaryRecyclable: number;
  fashionPlasticPrimaryNonRecyclable: number;
  fashionPlasticSecondaryRecyclable: number;
  fashionPlasticSecondaryNonRecyclable: number;
  healthcareConsultations: number;
  healthcareProductsOffered: number;
  csrSpendAmount: number;
  voluntaryPlasticNeutralityPct: number;
  fashionSyntheticMT: number;
  fashionNaturalMT: number;
  fashionTextileWasteMfgMT: number;
  fashionPostMfgWasteMT: number;
  fashionPkgPlasticTotalMT: number;
  fashionPkgRecycledPlasticMT: number;
  fashionPkgPaperMT: number;
  totalWaterConsumed: number;
  avgWastewaterRecycledPct: number;
  avgFreshWaterPct: number;
  fashionRecyclablePackagingPct: number;
  totalEnergyConsumed: number;
  avgRenewableEnergyPct: number;
  totalWasteGenerated: number;
  avgWasteRecycledPct: number;
  wcMale: number;
  wcFemale: number;
  wcWagesMale: number;
  wcWagesFemale: number;
  bcMale: number;
  bcFemale: number;
  bcWagesMale: number;
  bcWagesFemale: number;
  cLevelTotal: number;
  boardTotal: number;
  boardIndependent: number;
  primaryPlasticVirgin: number;
  primaryPlasticRecycled: number;
  primaryNonPlastic: number;
  secondaryPlasticVirgin: number;
  secondaryPlasticRecycled: number;
  secondaryNonPlastic: number;
  totalIncidents: number;
  totalOpenCases: number;
  highImpactIncidents: number;
  poshCases: number;
  policiesInPlace: number;
  policiesWithTraining: number;
  totalPolicies: number;
  avgInternationalVendorPct: number;
  vendorCategoriesWithDEI: number;
  totalVendorCategories: number;
  smallScaleVendors: number;
  largeScaleVendors: number;
  envPolicyInPlace: number;
  supplierCocInPlace: number;
  supplierCocTraining: number;
}

export interface InsightMetrics {
  genderDiversityRatio: number;
  genderPayParityIndex: number;
  wcToBcRatio: number;
  womenInLeadershipPct: number;
  womenInBoardPct: number;
  cxoPayRatio: number;
  pwdInclusionRate: number;
  jobsPerCrRevenue: number;
  virginPlasticPct: number;
  recycledContentRatio: number;
  plasticIntensityPerCrRevenue: number;
  eprComplianceRate: number;
  eprComplianceGap: number;
  mtPlasticPerCrRevenue: number;
  mtPackagingPer1000Customers: number;
  caseResolutionRate: number;
  highImpactIncidentRatio: number;
  poshCaseIntensity: number;
  policyAdoptionRate: number;
  trainingCoverageRate: number;
  waterRecyclingRate: number;
  renewableEnergyMix: number;
  wasteDiversionRate: number;
  circularEconomyIndex: number;
  deiCompositeScore: number;
  esgCompositeScore: number;
  supplyChainSustainabilityScore: number;
  socialScore: number;
  governanceScore: number;
  // New module-specific insights
  msmeSupplierDependencyRatio: number;
  supplyChainLocalizationIndex: number;
  deiCompliantVendorPct: number;
  smallVsLargeVendorMix: number;
  virginPlasticVsNonPlasticPrimary: number;
  virginPlasticVsNonPlasticSecondary: number;
  recyclableVsNonRecyclablePrimary: number;
  voluntaryPlasticNeutralityRate: number;
  syntheticVsNaturalFiberRatio: number;
  textileWasteRateMfg: number;
  postMfgWasteRate: number;
  monoMaterialRecyclablePct: number;
  packagingPlasticIntensityFashion: number;
  recycledPlasticAdoptionFashion: number;
  paperToPlasticRatioFashion: number;
  totalIncidentCount: number;
  healthcareAccessScale: number;
  totalWaterConsumption: number;
  totalEnergyConsumption: number;
  totalWasteGeneratedInsight: number;
  csrSpendRatio: number;
  plasticReductionPct: number;
  eprComplianceGapFashion: number;
  _hasNoEnvData?: boolean;
}

export interface TimeSeriesPoint {
  period: string;
  quarter: string;
  year: number;
  aggregation: AggregationMetrics;
  insights: InsightMetrics;
  /** Per-company averaged insights (matches stat card logic) */
  perCompanyInsights: InsightMetrics;
  companyCount: number;
}

export interface AnalyticsDashboardData {
  current: AggregationMetrics;
  currentInsights: InsightMetrics;
  timeSeries: TimeSeriesPoint[];
  byIndustry: Record<string, AggregationMetrics>;
  byFund: Record<string, AggregationMetrics>;
  byRevenueStage: Record<string, AggregationMetrics>;
  companyCount: number;
  filteredCompanies: typeof mockCompanies;
  companyRawData: CompanyRawMetrics[];
  /** Combined Q1-Q4 company data for annual view (counts summed, % averaged) */
  quarterlyCombinedRawData?: CompanyRawMetrics[];
  quarterlyCombinedAggregation?: AggregationMetrics;
  quarterlyCombinedInsights?: InsightMetrics;
  /** Per-quarter company raw data for timeline graphs in annual view */
  quarterlyPerQuarterRawData?: Record<string, CompanyRawMetrics[]>;
  /** All companies raw data (without companyId filter) for comparison averages */
  allCompanyRawData?: CompanyRawMetrics[];
  /** All companies quarterly combined raw data for comparison averages in annual view */
  allQuarterlyCombinedRawData?: CompanyRawMetrics[];
}

// ──── Helpers ────
const parseNum = (val: string | null | undefined): number => {
  if (!val || val === '' || val === 'N/A' || val === 'NA') return 0;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};

/** Round to 2 decimal places */
export const r2 = (v: number): number => Math.round(v * 100) / 100;

const isYes = (val: string | null | undefined): boolean => {
  if (!val) return false;
  const v = val.toLowerCase().trim();
  return v === 'yes' || v === 'y' || v === 'true' || v === '1';
};

const WATER_FACILITIES = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'dark_stores', 'distribution'];
const ENERGY_FACILITIES = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'data_center', 'retail', 'distribution'];
const WASTE_FACILITIES = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'dark_stores', 'distribution'];

const POLICIES = [
  'posh', 'code_of_conduct', 'supplier_code_of_conduct', 'health_and_safety',
  'dei', 'hr', 'human_rights', 'esg', 'environment',
  'grievance_internal', 'grievance_external', 'data_protection'
];

const INCIDENT_TYPES = [
  'posh', 'supplier_vendor', 'customer_grievance', 'employee_grievance',
  'environmental', 'health_safety', 'security_data_privacy',
  'negative_media', 'anti_bribery_corruption', 'other_regulatory'
];

export function buildAggregation(kpis: Record<string, string>): AggregationMetrics {
  // console.log("kpis",kpis)
  const netRevenue = parseNum(kpis['net_revenue']);
  const revenueTier2Plus = parseNum(kpis['revenue_tier2_plus']);
  const totalCustomersServed = parseNum(kpis['total_customers_served']);
  const uniqueFemaleCustomersPct = parseNum(kpis['unique_female_customers']);
  const msmeSupplierPct = parseNum(kpis['msme_supplier_percentage']);

  const wcMaleF = parseNum(kpis['employees_wc_male_fulltime']);
  const wcMaleC = parseNum(kpis['employees_wc_male_contractual']);
  const wcMaleP = parseNum(kpis['employees_wc_male_parttime']);
  const wcFemaleF = parseNum(kpis['employees_wc_female_fulltime']);
  const wcFemaleC = parseNum(kpis['employees_wc_female_contractual']);
  const wcFemaleP = parseNum(kpis['employees_wc_female_parttime']);
  const bcMaleF = parseNum(kpis['employees_bc_male_fulltime']);
  const bcMaleC = parseNum(kpis['employees_bc_male_contractual']);
  const bcMaleP = parseNum(kpis['employees_bc_male_parttime']);
  const bcFemaleF = parseNum(kpis['employees_bc_female_fulltime']);
  const bcFemaleC = parseNum(kpis['employees_bc_female_contractual']);
  const bcFemaleP = parseNum(kpis['employees_bc_female_parttime']);

  const wcMale = wcMaleF + wcMaleC + wcMaleP;
  const wcFemale = wcFemaleF + wcFemaleC + wcFemaleP;
  const bcMale = bcMaleF + bcMaleC + bcMaleP;
  const bcFemale = bcFemaleF + bcFemaleC + bcFemaleP;

  const totalWcEmployees = wcMale + wcFemale;
  const totalBcEmployees = bcMale + bcFemale;
  const totalEmployment = totalWcEmployees + totalBcEmployees;

  const wcWagesMale = parseNum(kpis['employees_wc_wages_male']);
  const wcWagesFemale = parseNum(kpis['employees_wc_wages_female']);
  const bcWagesMale = parseNum(kpis['employees_bc_wages_male']);
  const bcWagesFemale = parseNum(kpis['employees_bc_wages_female']);
  const totalWcWages = wcWagesMale + wcWagesFemale;
  const totalBcWages = bcWagesMale + bcWagesFemale;
  const totalGrossWages = totalWcWages + totalBcWages;

  const pwdPct = parseNum(kpis['employees_pwd_percentage']);
  const attritionRate = parseNum(kpis['employees_attrition_rate']);

  const cLevelTotal = parseNum(kpis['leadership_clevel_total']);
  const cLevelFemale = parseNum(kpis['leadership_clevel_female']);
  const boardTotal = parseNum(kpis['leadership_board_total']);
  const boardFemale = parseNum(kpis['leadership_board_female']);
  const boardIndependent = parseNum(kpis['leadership_board_independent']);
  const cxoTotalCompensation = parseNum(kpis['leadership_avg_cxo_compensation']);
  const avgCxoCompensation = cLevelTotal > 0 ? cxoTotalCompensation / cLevelTotal : 0;
  const avgEmployeeCompensation = totalWcEmployees > 0 ? totalWcWages / totalWcEmployees : 0;

  const totalPackagingMT = parseNum(kpis['food_pkg_basic_total_total_material_used']);
  const totalPackagingRecycledMT = parseNum(kpis['food_pkg_basic_total_total_material_recycled']);
  const eprTargetsMT = parseNum(kpis['food_pkg_basic_compliance_epr_targets_cpcb']);
  const foodPrimaryTotalMT = parseNum(kpis['food_pkg_basic_primary_primary_total_material']);
  const fashPrimaryTotalMT = parseNum(kpis['fashion_primary_pkg_cardboard_mt']) + parseNum(kpis['fashion_primary_pkg_paper_mt']) +
    parseNum(kpis['fashion_primary_pkg_plastic_recyclable_mt']) + parseNum(kpis['fashion_primary_pkg_plastic_non_recyclable_mt']) +
    parseNum(kpis['fashion_primary_pkg_fabric_mt']) + parseNum(kpis['fashion_primary_pkg_other_mt']);
  const primaryTotalMT = foodPrimaryTotalMT > 0 ? foodPrimaryTotalMT : fashPrimaryTotalMT;
  // For Fashion companies, derive recyclable % from material breakup if no direct field
  const primaryRecyclablePct = (() => {
    const directPct = parseNum(kpis['food_pkg_basic_primary_recyclability_primary_mono_materials']);
    if (directPct > 0) return directPct;
    // Fashion: Recyclable = plastic_recyclable + cardboard + paper + fabric; Non-Recyclable = plastic_non_recyclable + other
    const fashPriTotal = parseNum(kpis['fashion_primary_pkg_cardboard_mt']) + parseNum(kpis['fashion_primary_pkg_paper_mt']) +
      parseNum(kpis['fashion_primary_pkg_plastic_recyclable_mt']) + parseNum(kpis['fashion_primary_pkg_plastic_non_recyclable_mt']) +
      parseNum(kpis['fashion_primary_pkg_fabric_mt']) + parseNum(kpis['fashion_primary_pkg_other_mt']);
    if (fashPriTotal > 0) {
      const recyclable = parseNum(kpis['fashion_primary_pkg_plastic_recyclable_mt']) + parseNum(kpis['fashion_primary_pkg_cardboard_mt']) +
        parseNum(kpis['fashion_primary_pkg_paper_mt']) + parseNum(kpis['fashion_primary_pkg_fabric_mt']);
      return (recyclable / fashPriTotal) * 100;
    }
    return 0;
  })();
  const foodSecondaryTotalMT = parseNum(kpis['food_pkg_detailed_secondary_secondary_total_material']);
  const fashSecondaryTotalMT = ['cardboard', 'paper', 'plastic_recyclable', 'plastic_non_recyclable', 'fabric', 'other'].reduce((s, k) =>
    s + parseNum(kpis[`fashion_warehouse_pkg_${k}_mt`]) + parseNum(kpis[`fashion_secondary_pkg_${k}_mt`]), 0);
  const secondaryTotalMT = foodSecondaryTotalMT > 0 ? foodSecondaryTotalMT : fashSecondaryTotalMT;
  const secondaryRecyclablePct = (() => {
    const directPct = parseNum(kpis['food_pkg_detailed_secondary_recyclability_secondary_mono_materials']);
    if (directPct > 0) return directPct;
    // Fashion: Combine warehouse + secondary packaging
    const whKeys = ['cardboard', 'paper', 'plastic_recyclable', 'plastic_non_recyclable', 'fabric', 'other'];
    const secKeys = ['cardboard', 'paper', 'plastic_recyclable', 'plastic_non_recyclable', 'fabric', 'other'];
    let fashSecTotal = 0, fashSecRecyclable = 0;
    whKeys.forEach(k => { fashSecTotal += parseNum(kpis[`fashion_warehouse_pkg_${k}_mt`]); });
    secKeys.forEach(k => { fashSecTotal += parseNum(kpis[`fashion_secondary_pkg_${k}_mt`]); });
    if (fashSecTotal > 0) {
      ['plastic_recyclable', 'cardboard', 'paper', 'fabric'].forEach(k => {
        fashSecRecyclable += parseNum(kpis[`fashion_warehouse_pkg_${k}_mt`]) + parseNum(kpis[`fashion_secondary_pkg_${k}_mt`]);
      });
      return (fashSecRecyclable / fashSecTotal) * 100;
    }
    return 0;
  })();

  const primaryPlasticVirgin = parseNum(kpis['food_pkg_basic_primary_breakup_primary_plastic_virgin']);
  const primaryPlasticRecycled = parseNum(kpis['food_pkg_basic_primary_breakup_primary_plastic_recycled']);
  const primaryNonPlastic = parseNum(kpis['food_pkg_basic_primary_breakup_primary_paper_virgin']) +
    parseNum(kpis['food_pkg_basic_primary_breakup_primary_paper_recycled']) +
    parseNum(kpis['food_pkg_basic_primary_breakup_primary_metal']) +
    parseNum(kpis['food_pkg_basic_primary_breakup_primary_glass']);
  const secondaryPlasticVirgin = parseNum(kpis['food_pkg_detailed_secondary_breakup_secondary_plastic_virgin']);
  const secondaryPlasticRecycled = parseNum(kpis['food_pkg_detailed_secondary_breakup_secondary_plastic_recycled']);
  const secondaryNonPlastic = parseNum(kpis['food_pkg_detailed_secondary_breakup_secondary_paper_virgin']) +
    parseNum(kpis['food_pkg_detailed_secondary_breakup_secondary_paper_recycled']) +
    parseNum(kpis['food_pkg_detailed_secondary_breakup_secondary_metal']) +
    parseNum(kpis['food_pkg_detailed_secondary_breakup_secondary_glass']);

  const fashionTotalMaterials = parseNum(kpis['fashion_total_materials_mt']);
  const fashionSustainablePct = parseNum(kpis['fashion_sustainable_materials_pct']);
  const fashionRecyclablePct = parseNum(kpis['fashion_recyclable_materials_pct']);
  const fashionNonRecyclablePct = parseNum(kpis['fashion_non_recyclable_materials_pct']);
  const fashionPlasticPrimaryRecyclable = parseNum(kpis['fashion_primary_pkg_plastic_recyclable_mt']);
  const fashionPlasticPrimaryNonRecyclable = parseNum(kpis['fashion_primary_pkg_plastic_non_recyclable_mt']);
  const fashionPlasticSecondaryRecyclable = parseNum(kpis['fashion_secondary_pkg_plastic_recyclable_mt']) + parseNum(kpis['fashion_warehouse_pkg_plastic_recyclable_mt']);
  const fashionPlasticSecondaryNonRecyclable = parseNum(kpis['fashion_secondary_pkg_plastic_non_recyclable_mt']) + parseNum(kpis['fashion_warehouse_pkg_plastic_non_recyclable_mt']);

  const healthcareConsultations = parseNum(kpis['healthcare_consultations_screenings']);
  const healthcareProductsOffered = parseNum(kpis['healthcare_products_services']);

  // CSR
  const csrSpendAmount = parseNum(kpis['csr_amount_spent']);

  // Voluntary Plastic Neutrality
  const voluntaryPlasticNeutralityPct = parseNum(kpis['food_pkg_basic_compliance_voluntary_plastic_neutrality']);

  // Fashion material types (synthetic vs natural)
  const fashionSyntheticMT = parseNum(kpis['fashion_material_polyester_mt']) + parseNum(kpis['fashion_material_nylon_mt']) + parseNum(kpis['fashion_material_elastane_mt']);
  const fashionNaturalMT = parseNum(kpis['fashion_material_cotton_mt']) + parseNum(kpis['fashion_material_wool_mt']) + parseNum(kpis['fashion_material_silk_mt']) + parseNum(kpis['fashion_material_linen_mt']);
  const fashionTextileWasteMfgMT = parseNum(kpis['fashion_textile_waste_manufacturing_mt']);
  const fashionPostMfgWasteMT = parseNum(kpis['fashion_post_manufacturing_waste_mt']);
  const fashionPkgPlasticTotalMT = fashionPlasticPrimaryRecyclable + fashionPlasticPrimaryNonRecyclable + fashionPlasticSecondaryRecyclable + fashionPlasticSecondaryNonRecyclable;
  const fashionPkgRecycledPlasticMT = fashionPlasticPrimaryRecyclable + fashionPlasticSecondaryRecyclable;
  const fashionPkgPaperMT = parseNum(kpis['fashion_primary_pkg_paper_mt']) + parseNum(kpis['fashion_secondary_pkg_paper_mt']) + parseNum(kpis['fashion_warehouse_pkg_paper_mt']);

  // Fashion Recyclable Packaging % = avg of primary and secondary recyclable pcts
  const fashionPriRecyclablePct = parseNum(kpis['fashion_primary_pkg_cardboard_pct']) + parseNum(kpis['fashion_primary_pkg_paper_pct']) + parseNum(kpis['fashion_primary_pkg_fabric_pct']);
  const fashionSecRecyclablePct = parseNum(kpis['fashion_secondary_pkg_cardboard_pct']) + parseNum(kpis['fashion_secondary_pkg_paper_pct']) + parseNum(kpis['fashion_secondary_pkg_fabric_pct']);
  const fashionRecyclablePackagingPct = (fashionPriRecyclablePct + fashionSecRecyclablePct) / 2;

  let totalWaterConsumed = 0;
  let totalWastewaterRecycledPctSum = 0;
  let waterRecycledFacilityCount = 0;
  let freshWaterPctSum = 0;
  let freshWaterFacilityCount = 0;
  WATER_FACILITIES.forEach(f => {
    const consumed = parseNum(kpis[`water_detailed_${f}_water_consumed`]);
    const recycledPct = parseNum(kpis[`water_detailed_${f}_wastewater_recycled_pct`]);
    const freshPct = parseNum(kpis[`water_detailed_${f}_fresh_water_pct`]);
    const isNA = isYes(kpis[`water_detailed_${f}_na`]);
    if (!isNA && consumed > 0) {
      totalWaterConsumed += consumed;
      freshWaterPctSum += freshPct;
      freshWaterFacilityCount++;
      // Only count facilities with recycledPct > 0 for the average (matches drill-down logic)
      if (recycledPct > 0) {
        totalWastewaterRecycledPctSum += recycledPct;
        waterRecycledFacilityCount++;
      }
    }
  });

  let totalEnergyConsumed = 0;
  let totalRenewablePctSum = 0;
  let energyRenewFacilityCount = 0;
  ENERGY_FACILITIES.forEach(f => {
    const consumed = parseNum(kpis[`energy_detailed_${f}_energy_consumed`]);
    const renewPct = parseNum(kpis[`energy_detailed_${f}_renewable_pct`]);
    const isNA = isYes(kpis[`energy_detailed_${f}_na`]);
    if (!isNA && consumed > 0) {
      totalEnergyConsumed += consumed;
      // Only count facilities with renewPct > 0 for the average (matches drill-down logic)
      if (renewPct > 0) {
        totalRenewablePctSum += renewPct;
        energyRenewFacilityCount++;
      }
    }
  });

  let totalWasteGenerated = 0;
  let totalWasteRecycledPctSum = 0;
  let wasteRecycledFacilityCount = 0;
  WASTE_FACILITIES.forEach(f => {
    const generated = parseNum(kpis[`waste_detailed_${f}_waste_generated`]);
    const recycledPct = parseNum(kpis[`waste_detailed_${f}_waste_recycled_pct`]);
    const isNA = isYes(kpis[`waste_detailed_${f}_na`]);
    if (!isNA && generated > 0) {
      totalWasteGenerated += generated;
      // Only count facilities with recycledPct > 0 for the average (matches drill-down logic)
      if (recycledPct > 0) {
        totalWasteRecycledPctSum += recycledPct;
        wasteRecycledFacilityCount++;
      }
    }
  });

  let totalIncidents = 0;
  let totalOpenCases = 0;
  let highImpactIncidents = 0;
  let poshCases = 0;
  INCIDENT_TYPES.forEach(type => {
    const cases = parseNum(kpis[`incident_${type}_cases`]);
    const open = parseNum(kpis[`incident_${type}_open_cases`]);
    const impact = (kpis[`incident_${type}_impact`] || '').toLowerCase();
    totalIncidents += cases;
    totalOpenCases += open;
    if (impact === 'high') highImpactIncidents += cases;
    if (type === 'posh') poshCases = cases;
  });

  let policiesInPlace = 0;
  let policiesWithTraining = 0;
  POLICIES.forEach(p => {
    if (isYes(kpis[`policy_${p}_in_place`])) policiesInPlace++;
    if (isYes(kpis[`policy_${p}_training`])) policiesWithTraining++;
  });

  // Vendor MIS calculations across 5 vendor categories
  const vendorCategories = ['input_materials', 'manufacturing', 'packaging', 'logistics_warehousing', 'stores_clinics'];
  const intlVals = vendorCategories.map(c => parseNum(kpis[`vendor_mis_${c}_pct_international`])).filter(v => v > 0);
  const avgInternationalVendorPct = intlVals.length > 0 ? intlVals.reduce((s, v) => s + v, 0) / intlVals.length : 0;

  // DEI: count categories that have at least one DEI factor selected
  let vendorCategoriesWithDEI = 0;
  let totalVendorCategories = 0;
  let smallScaleVendors = 0;
  let largeScaleVendors = 0;
  vendorCategories.forEach(c => {
    const numVendors = kpis[`vendor_mis_${c}_num_vendors`];
    const hasData = numVendors && numVendors.trim() !== '' && numVendors.toLowerCase() !== 'n/a' && numVendors !== '0';
    if (hasData) {
      totalVendorCategories++;
      // DEI factors
      const deiRaw = kpis[`vendor_mis_${c}_dei_factors`];
      if (deiRaw) {
        try {
          const parsed = JSON.parse(deiRaw);
          if (Array.isArray(parsed) && parsed.length > 0) vendorCategoriesWithDEI++;
        } catch {
          if (deiRaw.trim()) vendorCategoriesWithDEI++;
        }
      }
      // Size classification
      const size = kpis[`vendor_mis_${c}_size`] || '';
      if (size === 'sme' || size === 'micro' || size === 'informal') smallScaleVendors++;
      else if (size === 'mnc_large') largeScaleVendors++;
    }
  });

  return {
    netRevenue, revenueTier2Plus, totalCustomersServed, uniqueFemaleCustomersPct,
    msmeSupplierPct,
    totalWcEmployees, totalWcWages, totalBcEmployees, totalBcWages,
    totalEmployment, totalGrossWages, pwdPct, attritionRate,
    cLevelFemale, boardFemale, avgCxoCompensation, avgEmployeeCompensation,
    wcWagesMale, wcWagesFemale, bcWagesMale, bcWagesFemale,
    totalPackagingMT, totalPackagingRecycledMT, eprTargetsMT,
    primaryTotalMT, primaryRecyclablePct, secondaryTotalMT, secondaryRecyclablePct,
    fashionTotalMaterials, fashionSustainablePct, fashionRecyclablePct, fashionNonRecyclablePct,
    fashionPlasticPrimaryRecyclable, fashionPlasticPrimaryNonRecyclable,
    fashionPlasticSecondaryRecyclable, fashionPlasticSecondaryNonRecyclable,
    healthcareConsultations, healthcareProductsOffered,
    csrSpendAmount, voluntaryPlasticNeutralityPct,
    fashionSyntheticMT, fashionNaturalMT, fashionTextileWasteMfgMT, fashionPostMfgWasteMT,
    fashionPkgPlasticTotalMT, fashionPkgRecycledPlasticMT, fashionPkgPaperMT,
    totalWaterConsumed,
    avgWastewaterRecycledPct: waterRecycledFacilityCount > 0 ? totalWastewaterRecycledPctSum / waterRecycledFacilityCount : 0,
    avgFreshWaterPct: freshWaterFacilityCount > 0 ? freshWaterPctSum / freshWaterFacilityCount : 0,
    fashionRecyclablePackagingPct,
    totalEnergyConsumed,
    avgRenewableEnergyPct: energyRenewFacilityCount > 0 ? totalRenewablePctSum / energyRenewFacilityCount : 0,
    totalWasteGenerated,
    avgWasteRecycledPct: wasteRecycledFacilityCount > 0 ? totalWasteRecycledPctSum / wasteRecycledFacilityCount : 0,
    wcMale, wcFemale, bcMale, bcFemale,
    cLevelTotal, boardTotal, boardIndependent,
    primaryPlasticVirgin, primaryPlasticRecycled, primaryNonPlastic,
    secondaryPlasticVirgin, secondaryPlasticRecycled, secondaryNonPlastic,
    totalIncidents, totalOpenCases, highImpactIncidents, poshCases,
    policiesInPlace, policiesWithTraining, totalPolicies: POLICIES.length,
    avgInternationalVendorPct,
    vendorCategoriesWithDEI, totalVendorCategories, smallScaleVendors, largeScaleVendors,
    envPolicyInPlace: isYes(kpis['policy_environment_in_place']) ? 100 : 0,
    supplierCocInPlace: isYes(kpis['policy_supplier_code_of_conduct_in_place']) ? 100 : 0,
    supplierCocTraining: isYes(kpis['policy_supplier_code_of_conduct_training']) ? 100 : 0,
  };
}

export function sumAggregations(items: AggregationMetrics[]): AggregationMetrics {
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

/** Safe division: returns 0 when denominator is 0 (instead of Infinity or NaN) */
const safeDiv = (num: number, den: number): number => den === 0 ? 0 : num / den;

export function deriveInsights(agg: AggregationMetrics, industry?: string, hasFashionPackaging?: boolean): InsightMetrics {
    // if(industry){
    //   console.log('agg',JSON.stringify(agg),industry,'hasFashionPackaging :: ',hasFashionPackaging)
    // }
  const totalEmployees = agg.totalEmployment;
  const totalPlastic = agg.primaryPlasticVirgin + agg.primaryPlasticRecycled + agg.secondaryPlasticVirgin + agg.secondaryPlasticRecycled + agg.fashionPlasticPrimaryRecyclable + agg.fashionPlasticPrimaryNonRecyclable + agg.fashionPlasticSecondaryRecyclable + agg.fashionPlasticSecondaryNonRecyclable;

  // Supply Chain Sustainability Score (legacy, kept for backward compat)
  const actualDeiVendorPct = agg.totalVendorCategories > 0 ? (agg.vendorCategoriesWithDEI / agg.totalVendorCategories) * 100 : 0;
  const localizationIndex = agg.totalVendorCategories > 0 ? Math.max(0, 100 - agg.avgInternationalVendorPct) : 0;
  const supplierCocInPlaceVal = agg.supplierCocInPlace;
  const supplierCocTrainingVal = agg.supplierCocTraining;
  const supplyChainSustainabilityScore = Math.min(100, (
    supplierCocInPlaceVal + supplierCocTrainingVal + actualDeiVendorPct
  ) / 3);

  // Social Score (0-100) — unified score replacing separate Supply Chain + DEI
  // Supplier CoC In Place (10%) + Supplier CoC Training (10%) + DEI Vendor % (10%) +
  // Gender Ratio (25%) + Women Leadership % (25%) + Pay Parity (20%)
  const socialGenderRatio = safeDiv(agg.wcFemale + agg.bcFemale, totalEmployees) * 100;
  const socialWomenLeadership = safeDiv(agg.cLevelFemale, agg.cLevelTotal) * 100;
  const socialFemaleWages = agg.wcWagesFemale + agg.bcWagesFemale;
  const socialFemaleCount = agg.wcFemale + agg.bcFemale;
  const socialMaleWages = agg.wcWagesMale + agg.bcWagesMale;
  const socialMaleCount = agg.wcMale + agg.bcMale;
  const socialPayParity = socialFemaleWages > 0 && socialFemaleCount > 0 && socialMaleWages > 0 && socialMaleCount > 0
    ? Math.min(100, ((socialFemaleWages / socialFemaleCount) / (socialMaleWages / socialMaleCount)) * 100)
    : 0;
  const socialScore = Math.min(100,
    Math.min(100, supplierCocInPlaceVal) * 0.10 +
    Math.min(100, supplierCocTrainingVal) * 0.10 +
    Math.min(100, actualDeiVendorPct) * 0.10 +
    Math.min(100, socialGenderRatio) * 0.25 +
    Math.min(100, socialWomenLeadership) * 0.25 +
    Math.min(100, socialPayParity) * 0.20
  );

  return {
    genderDiversityRatio: r2(safeDiv(agg.wcFemale + agg.bcFemale, totalEmployees) * 100),
    genderPayParityIndex: (() => {
      const totalFemaleWages = agg.wcWagesFemale + agg.bcWagesFemale;
      const totalFemaleCount = agg.wcFemale + agg.bcFemale;
      const totalMaleWages = agg.wcWagesMale + agg.bcWagesMale;
      const totalMaleCount = agg.wcMale + agg.bcMale;
      return r2(totalFemaleWages > 0 && totalFemaleCount > 0 && totalMaleWages > 0 && totalMaleCount > 0
        ? ((totalFemaleWages / totalFemaleCount) / (totalMaleWages / totalMaleCount))
        : 0);
    })(),
    wcToBcRatio: r2(safeDiv(agg.totalWcEmployees, agg.totalBcEmployees)),
    womenInLeadershipPct: r2(safeDiv(agg.cLevelFemale, agg.cLevelTotal) * 100),
    womenInBoardPct: r2(safeDiv(agg.boardFemale, agg.boardTotal) * 100),
    cxoPayRatio: r2(agg.avgCxoCompensation > 0 && agg.avgEmployeeCompensation > 0
      ? agg.avgCxoCompensation / agg.avgEmployeeCompensation : 0),
    pwdInclusionRate: r2(agg.pwdPct),
    jobsPerCrRevenue: r2(safeDiv(totalEmployees, agg.netRevenue)),
    virginPlasticPct: r2(safeDiv(agg.primaryPlasticVirgin + agg.secondaryPlasticVirgin, totalPlastic) * 100),
    recycledContentRatio: r2(safeDiv(agg.primaryPlasticRecycled + agg.secondaryPlasticRecycled, totalPlastic) * 100),
    plasticIntensityPerCrRevenue: r2(safeDiv(totalPlastic, agg.netRevenue)),
    eprComplianceRate: r2(safeDiv(agg.totalPackagingRecycledMT, agg.eprTargetsMT) * 100),
    eprComplianceGap: r2(Math.max(0, agg.eprTargetsMT - agg.totalPackagingRecycledMT)),
    mtPlasticPerCrRevenue: r2(safeDiv(totalPlastic, agg.netRevenue)),
    mtPackagingPer1000Customers: r2(safeDiv(agg.totalPackagingMT, agg.totalCustomersServed) * 1000),
    caseResolutionRate: r2(safeDiv(agg.totalIncidents - agg.totalOpenCases, agg.totalIncidents) * 100),
    highImpactIncidentRatio: r2(safeDiv(agg.highImpactIncidents, agg.totalIncidents) * 100),
    poshCaseIntensity: r2(safeDiv(agg.poshCases, totalEmployees) * 1000),
    policyAdoptionRate: r2(safeDiv(agg.policiesInPlace, agg.totalPolicies) * 100),
    trainingCoverageRate: r2(safeDiv(agg.policiesWithTraining, agg.totalPolicies) * 100),
    waterRecyclingRate: r2(agg.avgWastewaterRecycledPct),
    renewableEnergyMix: r2(agg.avgRenewableEnergyPct),
    wasteDiversionRate: r2(agg.avgWasteRecycledPct),
    circularEconomyIndex: r2(Math.min(100, (() => {
      const isFashion = hasFashionPackaging === true;
      if (isFashion) {
        // //console.log('Computing circular economy index for fashion company:', { agg });
        // Fashion & Lifestyle formula:
        // Recyclable Materials % (40%) + Recyclable Packaging % (40%) + Fresh Water Consumed % (10%) + Water Recycled % (10%)
        const recyclableMaterials = Math.min(100, agg.fashionRecyclablePct);
        const recyclablePackaging = Math.min(100, agg.fashionRecyclablePackagingPct);
        const freshWater = Math.min(100, agg.avgFreshWaterPct);
        const waterRecycled = Math.min(100, agg.avgWastewaterRecycledPct);
        // Only compute score if at least one fashion-specific input is non-zero
        const hasFashionData = recyclableMaterials > 0 || recyclablePackaging > 0 || freshWater > 0 || waterRecycled > 0;
        if (!hasFashionData) return 0;
        return (
          recyclableMaterials * 0.40 +
          recyclablePackaging * 0.40 +
          freshWater * 0.10 +
          waterRecycled * 0.10
        );
      }
      // Non-Fashion formula
      const totalPlasticAgg = agg.primaryPlasticVirgin + agg.primaryPlasticRecycled + agg.secondaryPlasticVirgin + agg.secondaryPlasticRecycled;
      // 1. % Reduction in Virgin Plastic (20%)
      const virginPlasticReduction = totalPlasticAgg > 0 ? safeDiv(agg.primaryPlasticRecycled + agg.secondaryPlasticRecycled, totalPlasticAgg) * 100 : 0;
      // 2. MT plastic per Cr revenue — intensity score (30%), lower=better
      const plasticIntensity = agg.netRevenue > 0 ? totalPlasticAgg / agg.netRevenue : 0;
      const intensityScore = Math.max(0, 100 * (1 - Math.min(1, plasticIntensity)));
      // 3. Total packaging material recycled as % of total packaging (20%)
      const materialRecycledPct = safeDiv(agg.totalPackagingRecycledMT, agg.totalPackagingMT) * 100;
      // 4. EPR or Voluntary Plastic Neutrality % (10%) — if either one is done they get the score
      const eprCompliancePct = safeDiv(agg.totalPackagingRecycledMT, agg.eprTargetsMT) * 100;
      const vpnPct = agg.voluntaryPlasticNeutralityPct;
      const eprVpn = Math.min(100, Math.max(Math.min(100, eprCompliancePct), Math.min(100, vpnPct)));
      // 5. P&S recycled (plastic+paper+glass+metal+plant-based) as % of total packaging (10%)
      const allRecycledPct = safeDiv(agg.primaryPlasticRecycled + agg.secondaryPlasticRecycled + agg.primaryNonPlastic + agg.secondaryNonPlastic, agg.totalPackagingMT) * 100;
      // 6. Recyclable % (10%)
      const recyclablePct = agg.primaryRecyclablePct;
      return (
        Math.min(100, virginPlasticReduction) * 0.20 +
        Math.min(100, intensityScore) * 0.30 +
        Math.min(100, materialRecycledPct) * 0.20 +
        eprVpn * 0.10 +
        Math.min(100, allRecycledPct) * 0.10 +
        Math.min(100, recyclablePct) * 0.10
      );
    })())),
    deiCompositeScore: r2(socialScore), // alias — now uses Social Score
    socialScore: r2(socialScore),
    // ESG Composite Score: E (35%) + S (25%) + G (40%)
    // E = Environment Score (100%), S = Social Score (100%), G = Governance Score (100%)
    esgCompositeScore: r2((() => {
      // E sub-score: reuse the already-computed circularEconomyIndex (which is industry-aware)
      const isFashion2 = hasFashionPackaging === true;
      let eSub: number;
      if (isFashion2) {
        const rm = Math.min(100, agg.fashionRecyclablePct);
        const rp = Math.min(100, agg.fashionRecyclablePackagingPct);
        const fw = Math.min(100, agg.avgFreshWaterPct);
        const wr = Math.min(100, agg.avgWastewaterRecycledPct);
        const hasFD = rm > 0 || rp > 0 || fw > 0 || wr > 0;
        eSub = hasFD ? Math.min(100, rm * 0.40 + rp * 0.40 + fw * 0.10 + wr * 0.10) : 0;
      } else {
        const totalPlasticAgg2 = agg.primaryPlasticVirgin + agg.primaryPlasticRecycled + agg.secondaryPlasticVirgin + agg.secondaryPlasticRecycled;
        const virginPlasticReduction2 = totalPlasticAgg2 > 0 ? safeDiv(agg.primaryPlasticRecycled + agg.secondaryPlasticRecycled, totalPlasticAgg2) * 100 : 0;
        const plasticIntensity2 = agg.netRevenue > 0 ? totalPlasticAgg2 / agg.netRevenue : 0;
        const intensityScore2 = Math.max(0, 100 * (1 - Math.min(1, plasticIntensity2)));
        const materialRecycledPct2 = safeDiv(agg.totalPackagingRecycledMT, agg.totalPackagingMT) * 100;
        const eprCompliancePct2 = safeDiv(agg.totalPackagingRecycledMT, agg.eprTargetsMT) * 100;
        const vpnPct2 = agg.voluntaryPlasticNeutralityPct;
        const eprVpn2 = Math.min(100, Math.max(Math.min(100, eprCompliancePct2), Math.min(100, vpnPct2)));
        const allRecycledPct2 = safeDiv(agg.primaryPlasticRecycled + agg.secondaryPlasticRecycled + agg.primaryNonPlastic + agg.secondaryNonPlastic, agg.totalPackagingMT) * 100;
        const recyclablePct2 = agg.primaryRecyclablePct;
        eSub = Math.min(100,
          Math.min(100, virginPlasticReduction2) * 0.20 +
          Math.min(100, intensityScore2) * 0.30 +
          Math.min(100, materialRecycledPct2) * 0.20 +
          eprVpn2 * 0.10 +
          Math.min(100, allRecycledPct2) * 0.10 +
          Math.min(100, recyclablePct2) * 0.10
        );
      }

      // S sub-score: Social Score (100%) — unified supplier + gender metrics
      const actualDeiVendorPct2 = agg.totalVendorCategories > 0 ? (agg.vendorCategoriesWithDEI / agg.totalVendorCategories) * 100 : 0;
      const supplierCocInPlace2 = agg.supplierCocInPlace;
      const supplierCocTraining2 = agg.supplierCocTraining;
      const genderRatio2 = safeDiv(agg.wcFemale + agg.bcFemale, totalEmployees) * 100;
      const womenLeadership2 = safeDiv(agg.cLevelFemale, agg.cLevelTotal) * 100;
      const totalFemaleWages2 = agg.wcWagesFemale + agg.bcWagesFemale;
      const totalFemaleCount2 = agg.wcFemale + agg.bcFemale;
      const totalMaleWages2 = agg.wcWagesMale + agg.bcWagesMale;
      const totalMaleCount2 = agg.wcMale + agg.bcMale;
      const payParity2 = totalFemaleWages2 > 0 && totalFemaleCount2 > 0 && totalMaleWages2 > 0 && totalMaleCount2 > 0
        ? Math.min(100, ((totalFemaleWages2 / totalFemaleCount2) / (totalMaleWages2 / totalMaleCount2)) * 100)
        : 0;
      const sSub = Math.min(100,
        Math.min(100, supplierCocInPlace2) * 0.10 +
        Math.min(100, supplierCocTraining2) * 0.10 +
        Math.min(100, actualDeiVendorPct2) * 0.10 +
        Math.min(100, genderRatio2) * 0.25 +
        Math.min(100, womenLeadership2) * 0.25 +
        Math.min(100, payParity2) * 0.20
      );

      // G sub-score: Governance Score (100%)
      const policyAdopt = safeDiv(agg.policiesInPlace, agg.totalPolicies) * 100;
      const trainingCoverage = safeDiv(agg.policiesWithTraining, agg.totalPolicies) * 100;
      const highImpactUnresolvedPct = agg.highImpactIncidents > 0
        ? Math.min(100, safeDiv(agg.highImpactIncidents, agg.totalIncidents) * 100)
        : 0;
      const gSub = Math.min(100, policyAdopt * 0.40 + trainingCoverage * 0.40 + Math.max(0, 100 - highImpactUnresolvedPct) * 0.20);

      // If E sub-score is 0 because the company has no environmental data,
      // redistribute E weight (35%) proportionally across S and G.
      // Check: no packaging, no water, no energy, no waste, no env policy data → truly no E data
      const totalPlasticCheck = agg.primaryPlasticVirgin + agg.primaryPlasticRecycled + agg.secondaryPlasticVirgin + agg.secondaryPlasticRecycled;
      const hasEnvData = totalPlasticCheck > 0 || agg.totalPackagingMT > 0 || agg.eprTargetsMT > 0 ||
        agg.voluntaryPlasticNeutralityPct > 0 || agg.envPolicyInPlace > 0 ||
        agg.avgWastewaterRecycledPct > 0 || agg.avgWasteRecycledPct > 0 ||
        agg.fashionRecyclablePct > 0 || agg.primaryRecyclablePct > 0 ||
        agg.fashionRecyclablePackagingPct > 0 || agg.avgFreshWaterPct > 0;
      if (eSub === 0 && !hasEnvData) {
        // Redistribute: S gets 25/65 ≈ 38.46%, G gets 40/65 ≈ 61.54%
        const sWeight = 25 / 65;
        const gWeight = 40 / 65;
        return Math.min(100, sSub * sWeight + gSub * gWeight);
      }
      // ESG Composite Score: E (35%) + S (25%) + G (40%)
      return Math.min(100, eSub * 0.35 + sSub * 0.25 + gSub * 0.40);
    })()),
    _hasNoEnvData: (() => {
      // Recompute E sub-score check independently
      const isFashion3 = hasFashionPackaging === true;
      let eSubCheck: number;
      if (isFashion3) {
        const rm3 = Math.min(100, agg.fashionRecyclablePct);
        const rp3 = Math.min(100, agg.fashionRecyclablePackagingPct);
        const fw3 = Math.min(100, agg.avgFreshWaterPct);
        const wr3 = Math.min(100, agg.avgWastewaterRecycledPct);
        eSubCheck = (rm3 > 0 || rp3 > 0 || fw3 > 0 || wr3 > 0) ? 1 : 0;
      } else {
        const totalPlasticCheck3 = agg.primaryPlasticVirgin + agg.primaryPlasticRecycled + agg.secondaryPlasticVirgin + agg.secondaryPlasticRecycled;
        eSubCheck = (totalPlasticCheck3 > 0 || agg.totalPackagingMT > 0 || agg.eprTargetsMT > 0 ||
          agg.voluntaryPlasticNeutralityPct > 0 || agg.primaryRecyclablePct > 0) ? 1 : 0;
      }
      const hasEnvData3 = eSubCheck > 0 || agg.envPolicyInPlace > 0 ||
        agg.avgWastewaterRecycledPct > 0 || agg.avgWasteRecycledPct > 0 ||
        agg.fashionRecyclablePct > 0 || agg.primaryRecyclablePct > 0 ||
        agg.fashionRecyclablePackagingPct > 0 || agg.avgFreshWaterPct > 0;
      return !hasEnvData3;
    })(),
    supplyChainSustainabilityScore: r2(supplyChainSustainabilityScore),
    governanceScore: r2((() => {
      const policyAdopt = safeDiv(agg.policiesInPlace, agg.totalPolicies) * 100;
      const trainingCoverage = safeDiv(agg.policiesWithTraining, agg.totalPolicies) * 100;
      const highImpactUnresolvedPct = agg.highImpactIncidents > 0
        ? Math.min(100, safeDiv(agg.highImpactIncidents, agg.totalIncidents) * 100)
        : 0;
      return Math.min(100, policyAdopt * 0.40 + trainingCoverage * 0.40 + Math.max(0, 100 - highImpactUnresolvedPct) * 0.20);
    })()),

    // ── New module-specific insight metrics ──
    msmeSupplierDependencyRatio: r2(agg.msmeSupplierPct),
    supplyChainLocalizationIndex: r2(agg.totalVendorCategories > 0 ? Math.max(0, 100 - agg.avgInternationalVendorPct) : 0),
    deiCompliantVendorPct: r2(agg.totalVendorCategories > 0 ? (agg.vendorCategoriesWithDEI / agg.totalVendorCategories) * 100 : 0),
    smallVsLargeVendorMix: r2(agg.largeScaleVendors > 0 ? agg.smallScaleVendors / agg.largeScaleVendors : (agg.smallScaleVendors > 0 ? agg.smallScaleVendors : 0)),

    // Primary & Secondary Packaging
    virginPlasticVsNonPlasticPrimary: r2(agg.primaryTotalMT > 0 ? (agg.primaryPlasticVirgin / agg.primaryTotalMT) * 100 : 0),
    virginPlasticVsNonPlasticSecondary: r2(agg.secondaryTotalMT > 0 ? (agg.secondaryPlasticVirgin / agg.secondaryTotalMT) * 100 : 0),
    recyclableVsNonRecyclablePrimary: r2(agg.primaryRecyclablePct),
    voluntaryPlasticNeutralityRate: r2(agg.voluntaryPlasticNeutralityPct),

    // Fashion Materials & Packaging
    syntheticVsNaturalFiberRatio: r2((agg.fashionSyntheticMT + agg.fashionNaturalMT) > 0 ? (agg.fashionSyntheticMT / (agg.fashionSyntheticMT + agg.fashionNaturalMT)) * 100 : 0),
    textileWasteRateMfg: r2(agg.fashionTotalMaterials > 0 ? (agg.fashionTextileWasteMfgMT / agg.fashionTotalMaterials) * 100 : 0),
    postMfgWasteRate: r2(agg.fashionTotalMaterials > 0 ? (agg.fashionPostMfgWasteMT / agg.fashionTotalMaterials) * 100 : 0),
    monoMaterialRecyclablePct: r2(agg.fashionRecyclablePct),
    packagingPlasticIntensityFashion: r2(agg.fashionTotalMaterials > 0 ? (agg.fashionPkgPlasticTotalMT / agg.fashionTotalMaterials) * 100 : 0),
    recycledPlasticAdoptionFashion: r2(agg.fashionPkgPlasticTotalMT > 0 ? (agg.fashionPkgRecycledPlasticMT / agg.fashionPkgPlasticTotalMT) * 100 : 0),
    paperToPlasticRatioFashion: r2(agg.fashionPkgPlasticTotalMT > 0 ? agg.fashionPkgPaperMT / agg.fashionPkgPlasticTotalMT : 0),

    // Incidents & Grievances
    totalIncidentCount: r2(agg.totalIncidents),

    // Healthcare
    healthcareAccessScale: r2(agg.healthcareConsultations + agg.healthcareProductsOffered),

    // Water / Energy / Waste
    totalWaterConsumption: r2(agg.totalWaterConsumed),
    totalEnergyConsumption: r2(agg.totalEnergyConsumed),
    totalWasteGeneratedInsight: r2(agg.totalWasteGenerated),

    // CSR — csrSpendAmount is in ₹, revenue is in INR Cr (1 Cr = 1e7)
    // Percentage = (CSR Amount (₹) / (Revenue (INR Cr) × 1e7)) × 100
    csrSpendRatio: Math.round((agg.netRevenue > 0 ? (agg.csrSpendAmount / (agg.netRevenue * 1e7)) * 100 : 0) * 10000) / 10000,

    // Plastic Reduction (cross-quarter, computed per-company in FeatureAnalyticsView)
    plasticReductionPct: 0,

    // Fashion EPR Compliance Gap = EPR Target - Actual Compliance %
    eprComplianceGapFashion: 0, // computed per-company in FeatureAnalyticsView
  };
}

export const useAnalyticsDashboardData = (filters: AnalyticsFilters, kpiEntries?: { companyId: string; kpi_id: string; value: string | null; quarter: string; year: number }[],
  featureRows?: { companyId: string; feature_key: string, enabled: boolean }[]) => {
  const { asOf } = useAsOf();
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Stable serialized key to prevent re-fetching on referentially-new-but-equal filter objects
  const filtersKey = JSON.stringify(filters);
  const asOfKey = `${asOf?.month ?? 'live'}-${asOf?.year ?? 'live'}`;
  console.log("Filters key:", filtersKey, "As-of key:", asOfKey);
  // useEffect(() => {
  //   if (filters.year && filters.year == 2025) {

  //   }
  // }, [filters]);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const START_QUARTER = 'Q4';
        const START_YEAR = 2024;
        // const quarters = (filters.year == 2025 ? ['Q1', 'Q2', 'Q3', 'Q4']:['Q1']);
        const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

        const periods: { quarter: string; year: number }[] = [];

        const includeCumulativeQ1NextYear = filters.cumulative && filters.year === 2025;

        if (filters.period === 'quarterly') {
          let qi = quarters.indexOf(START_QUARTER);
          let y = START_YEAR;
          const endQi = quarters.indexOf(filters.quarter || 'Q1');
          const endY = filters.year;

          while (y < endY || (y === endY && qi <= endQi)) {
            periods.push({ quarter: quarters[qi], year: y });
            qi++;
            if (qi > 3) { qi = 0; y++; }
          }
          if (periods.length === 0) {
            periods.push({ quarter: filters.quarter || 'Q1', year: filters.year });
          }
          if (includeCumulativeQ1NextYear && !periods.some(p => p.quarter === 'Q1' && p.year === filters.year + 1)) {
            periods.push({ quarter: 'Q1', year: filters.year + 1 });
          }
        } else {
          for (let y = START_YEAR; y <= filters.year; y++) {
            periods.push({ quarter: 'FY', year: y });
          }
          (filters.year == 2025 ? ['Q1', 'Q2', 'Q3', 'Q4'] : ['Q1']).forEach(q => {
            periods.push({ quarter: q, year: filters.year });
          });
          if (includeCumulativeQ1NextYear) {
            periods.push({ quarter: 'Q1', year: filters.year + 1 });
          }
        }

        // const years = [...new Set(periods.map(p => p.year))];
        const years = filters.years && filters.years.length > 0
          ? filters.years
          : [...new Set(periods.map(p => p.year))];
        let allEntries: { companyId: string; kpi_id: string; value: string | null; quarter: string; year: number }[] = [];

        const res = await http.get<{ companyId: string; kpi_id: string; value: string | null; quarter: string; year: number }[]>(
          `mis/kpi-entries?years=${years.join(',')}`
        );
        allEntries = res.data || [];
        if (filters.year) {
          allEntries = allEntries.filter(e => e.year === filters.year);
        }

        //Static value replace for 2026 for annual kpi from 2025 FY values
        if (filters.year === 2026) {
          const fy2025Entries = res.data.filter(e => e.year === 2025 && e.quarter === 'FY');
          const fy2026Entries = fy2025Entries.map(e => ({ ...e, year: 2026 }));
          allEntries = [...allEntries.filter(e => e.quarter !== 'FY'), ...fy2026Entries];
        }

        //console.log('Fetched KPI entries:', allEntries.filter(e => e.year === 2026), 'entries for years', years);
        if (asOf) {
          allEntries = allEntries.filter(e => !isPeriodAfterCutoff(e.quarter, e.year, asOf));
        }

        const featuresRes = await http.get<{ companyId: string; feature_key: string, enabled: boolean }[]>(
          'mis/company-feature-settings?enabled=true'
        );
        const featureRows = featuresRes.data || [];
        // //console.log('Fetched feature settings rows:', featureRows);
        const fashionPkgCompanyIds = new Set(
          featureRows.filter(r => r.feature_key === 'fashionMaterials' && r.enabled).map(r => r.companyId)
        );
        const stdPkgCompanyIds = new Set(
          featureRows.filter(r => r.feature_key === 'primarySecondaryPackaging' && r.enabled).map(r => r.companyId)
        );
        const sourcingCompanyIds = new Set<string>(
          featureRows.filter(r => r.feature_key === 'sourcingFulfillment' && r.enabled).map(r => r.companyId)
        );
        const envFeatureCompanyIds = new Set(
          featureRows
            .filter(r => ['waterDetailed', 'waterManagement', 'energyDetailed', 'wasteDetailed'].includes(r.feature_key) && r.enabled)
            .map(r => r.companyId)
        );
        const waterDetailedCompanyIds = new Set(
          featureRows
            .filter(r => r.feature_key === 'waterDetailed' || r.feature_key === 'waterManagement')
            .map(r => r.companyId)
        );
        // //console.log('Companies with fashionMaterials feature:', Array.from(fashionPkgCompanyIds));
        // //console.log('Companies with primarySecondaryPackaging feature:', Array.from(stdPkgCompanyIds));
        // //console.log('Companies with sourcingFulfillment feature:', Array.from(sourcingCompanyIds));
        // //console.log('Companies with waterDetailed or waterManagement features:', Array.from(waterDetailedCompanyIds));
        const hasEnvFeature = (companyId: string) =>
          fashionPkgCompanyIds.has(companyId) ||
          stdPkgCompanyIds.has(companyId) ||
          envFeatureCompanyIds.has(companyId);

        allEntries = allEntries.filter(e => {
          if (e.kpi_id.startsWith('food_pkg_') && !stdPkgCompanyIds.has(e.companyId)) return false;
          return true;
        });

        let filteredCompanies = mockCompanies.filter(c => c.investmentStatus === 'Invested');
        if (filters.year && filters.year == 2025) {
          filteredCompanies = filteredCompanies.filter(c => !['company-44', 'company-45'].includes(c.id))
        }
        if (filters.industry) filteredCompanies = filteredCompanies.filter(c => c.industry === filters.industry);
        if (filters.fund) filteredCompanies = filteredCompanies.filter(c => c.fund === filters.fund);
        if (filters.revenueStage) filteredCompanies = filteredCompanies.filter(c => c.revenueStage === filters.revenueStage);
        if (filters.qCategory) filteredCompanies = filteredCompanies.filter(c => c.qCategory === filters.qCategory);
        if (filters.firesidePOC) filteredCompanies = filteredCompanies.filter(c => c.fl === filters.firesidePOC);
        if (filters.companyId) filteredCompanies = filteredCompanies.filter(c => c.id === filters.companyId);
        const companyIds = new Set(filteredCompanies.map(c => c.id));
        //console.log('filters.cumulative', filters.cumulative);
        //console.log("periods :: timeSeries => ", periods);
        const timeSeries: TimeSeriesPoint[] = periods.map(p => {
          const periodEntries = filterKpiEntries(allEntries, {
            companyIds,
            quarter: p.quarter,
            year: p.year,
            cumulative: filters.cumulative,
          });

          const byCompany: Record<string, Record<string, string>> = {};
          periodEntries.forEach(e => {
            if (!byCompany[e.companyId]) byCompany[e.companyId] = {};
            byCompany[e.companyId][e.kpi_id] = e.value || '';
          });

          const companyAggs = Object.values(byCompany).map(kpis => buildAggregation(kpis));
          const aggregation = sumAggregations(companyAggs);
          const insights = deriveInsights(aggregation);

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

        const currentQ = filters.period === 'quarterly' ? (filters.quarter || 'Q1') : 'FY';
        const currentPeriod = timeSeries.find(t => t.quarter === currentQ && t.year === filters.year);
        const current = currentPeriod?.aggregation || buildAggregation({});
        const currentInsights = currentPeriod?.insights || deriveInsights(current);

        const currentEntries = filterKpiEntries(allEntries, {
          companyIds,
          quarter: currentQ,
          year: filters.year,
          cumulative: filters.cumulative,
        });

        const currentByCompany: Record<string, Record<string, string>> = {};
        currentEntries.forEach(e => {
          if (!currentByCompany[e.companyId]) currentByCompany[e.companyId] = {};
          currentByCompany[e.companyId][e.kpi_id] = e.value || '';
        });

        const companyRawData: CompanyRawMetrics[] = filteredCompanies.map(company => {
          // //console.log(`Building raw data for company ${company.name} (${company.id})`);
          const kpis = currentByCompany[company.id] || {};
          const aggregation = buildAggregation(kpis);
          const hasFashionPkg = fashionPkgCompanyIds.has(company.id);
          // //console.log(`Company ${company.name} (${company.id}) - `);
          
          const insights = deriveInsights(aggregation, company.industry, hasFashionPkg);
          const obj = {
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
          // //console.log(`Raw data for ${company.name}:`, obj);
          return obj;
        });

        // Removed illegal useEffect from here — log moved outside
        // //console.log('Company raw data for current period:', companyRawData);

        const vprQ14Entries = filterKpiEntries(allEntries, {
          companyIds,
          quarters: (filters.year == 2025 ? ['Q1', 'Q2', 'Q3', 'Q4'] : ['Q1']),
          year: filters.year,
          cumulative: filters.cumulative,
        });
        const vprByCompanyQuarter: Record<string, Record<string, Record<string, string>>> = {};
        vprQ14Entries.forEach(e => {
          if (!vprByCompanyQuarter[e.companyId]) vprByCompanyQuarter[e.companyId] = {};
          if (!vprByCompanyQuarter[e.companyId][e.quarter]) vprByCompanyQuarter[e.companyId][e.quarter] = {};
          vprByCompanyQuarter[e.companyId][e.quarter][e.kpi_id] = e.value || '';
        });
        const vprPerQuarter: Record<string, Array<{ companyId: string; kpis: Record<string, string> }>> = {};
        (filters.year == 2025 ? ['Q1', 'Q2', 'Q3', 'Q4'] : ['Q1']).forEach(q => {
          vprPerQuarter[q] = filteredCompanies.map(company => ({
            companyId: company.id,
            kpis: vprByCompanyQuarter[company.id]?.[q] || {},
          }));
        });
        const quarterlyVirginReductions = computeCrossQuarterVirginReductions(vprPerQuarter);

        //Commented this for showing same score for filter and without filter
        // applyEnvironmentPercentileNormalization(companyRawData, quarterlyVirginReductions);
        // applySocialScorePercentileNormalization(companyRawData, sourcingCompanyIds);

        let allCompanyRawData: CompanyRawMetrics[] | undefined;
        let allQuarterlyCombinedRawData: CompanyRawMetrics[] | undefined;
        let quarterlyCombinedRawData: CompanyRawMetrics[] | undefined;
        let quarterlyCombinedAggregation: AggregationMetrics | undefined;
        let quarterlyCombinedInsights: InsightMetrics | undefined;
        let quarterlyPerQuarterRawData: Record<string, CompanyRawMetrics[]> | undefined;

        if (filters.period === 'annual') {
          const PCT_PATTERNS = ['_pct', '_percentage', 'recyclability', 'unique_female_customers', 'revenue_tier2_plus', 'attrition_rate', 'renewable_pct', 'wastewater_recycled_pct', 'waste_recycled_pct', 'fresh_water_pct', 'plastic_neutrality'];
          const AVG_KPI_PATTERNS = ['avg_cxo_compensation', 'employees_enps', 'leadership_clevel_total', 'leadership_clevel_female', 'leadership_board_total', 'leadership_board_female', 'leadership_board_independent'];
          const isPercentageKpi = (id: string) => PCT_PATTERNS.some(p => id.includes(p));
          const isAverageKpi = (id: string) => AVG_KPI_PATTERNS.some(p => id.includes(p));
          const isQ4SnapshotKpi = (id: string) => id.startsWith('vendor_mis_') && id.endsWith('_num_vendors');
          const MAX_KPI_PATTERNS = ['epr_compliance_pct', 'voluntary_plastic_neutrality'];
          const isMaxAcrossQuartersKpi = (id: string) => MAX_KPI_PATTERNS.some(p => id.includes(p));

          const q14Entries = filterKpiEntries(allEntries, {
            companyIds,
            quarters: (filters.year == 2025 ? ['Q1', 'Q2', 'Q3', 'Q4'] : ['Q1']),
            year: filters.year,
            cumulative: filters.cumulative,
          });

          const q14ByCompanyQuarter: Record<string, Record<string, Record<string, string>>> = {};
          q14Entries.forEach(e => {
            if (!q14ByCompanyQuarter[e.companyId]) q14ByCompanyQuarter[e.companyId] = {};
            if (!q14ByCompanyQuarter[e.companyId][e.quarter]) q14ByCompanyQuarter[e.companyId][e.quarter] = {};
            q14ByCompanyQuarter[e.companyId][e.quarter][e.kpi_id] = e.value || '';
          });
          quarterlyCombinedRawData = filteredCompanies.map(company => {
            const quarterData = q14ByCompanyQuarter[company.id] || {};
            const qs = Object.keys(quarterData);
            const combinedKpis: Record<string, string> = {};
            const allKpiKeys = new Set<string>();
            qs.forEach(q => Object.keys(quarterData[q]).forEach(k => allKpiKeys.add(k)));

            allKpiKeys.forEach(kpiId => {
              const rawVals = qs
                .map(q => quarterData[q]?.[kpiId])
                .filter(v => v !== undefined && v !== '' && v !== null) as string[];
              if (rawVals.length === 0) return;
              const numericVals = rawVals.map(v => parseFloat(v)).filter(v => !isNaN(v));
              if (numericVals.length > 0) {
                if (isMaxAcrossQuartersKpi(kpiId)) {
                  combinedKpis[kpiId] = String(r2(Math.min(100, numericVals.reduce((a, b) => a + b, 0))));
                } else if (isQ4SnapshotKpi(kpiId)) {
                  const q4Val = quarterData['Q4']?.[kpiId];
                  const q4Num = q4Val ? parseFloat(q4Val) : NaN;
                  if (!isNaN(q4Num)) {
                    combinedKpis[kpiId] = String(Math.round(q4Num));
                  } else {
                    combinedKpis[kpiId] = rawVals[rawVals.length - 1];
                  }
                } else if (isPercentageKpi(kpiId) || isAverageKpi(kpiId)) {
                  combinedKpis[kpiId] = String(r2(numericVals.reduce((a, b) => a + b, 0) / numericVals.length));
                } else {
                  combinedKpis[kpiId] = String(r2(numericVals.reduce((a, b) => a + b, 0)));
                }
              } else {
                let merged = false;
                try {
                  const arrays = rawVals.map(v => JSON.parse(v)).filter(Array.isArray);
                  if (arrays.length > 0) {
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

            const fyKpis = currentByCompany[company.id] || {};
            Object.entries(fyKpis).forEach(([k, v]) => {
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

          const perQuarterForVPR: Record<string, Array<{ companyId: string; kpis: Record<string, string> }>> = {};
          (filters.year == 2025 ? ['Q1', 'Q2', 'Q3', 'Q4'] : ['Q1']).forEach(q => {
            perQuarterForVPR[q] = filteredCompanies.map(company => ({
              companyId: company.id,
              kpis: q14ByCompanyQuarter[company.id]?.[q] || {},
            }));
          });
          const virginReductions = computeCrossQuarterVirginReductions(perQuarterForVPR);

          // applyEnvironmentPercentileNormalization(quarterlyCombinedRawData, virginReductions);
          // applySocialScorePercentileNormalization(quarterlyCombinedRawData, sourcingCompanyIds);

          const combinedAggs = quarterlyCombinedRawData.map(c => c.aggregation);
          quarterlyCombinedAggregation = sumAggregations(combinedAggs);

          quarterlyCombinedInsights = deriveInsights(quarterlyCombinedAggregation);
          // //console.log('Quarterly combined raw data:', quarterlyCombinedRawData);  
          const submitting = quarterlyCombinedRawData.filter(c => Object.keys(c.kpis).length > 0);
          // //console.log('Companies submitting Q1-Q4 data:', submitting);
          const avgField = (key: keyof InsightMetrics) => {
            const vals = submitting.map(c => c.insights[key] as number).filter(v => !isNaN(v));
            return vals.length > 0 ? r2(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
          };
          quarterlyCombinedInsights.circularEconomyIndex = avgField('circularEconomyIndex');
          quarterlyCombinedInsights.socialScore = avgField('socialScore');
          quarterlyCombinedInsights.deiCompositeScore = avgField('deiCompositeScore');
          quarterlyCombinedInsights.esgCompositeScore = avgField('esgCompositeScore');

          quarterlyPerQuarterRawData = {};
          (filters.year == 2025 ? ['Q1', 'Q2', 'Q3', 'Q4'] : ['Q1']).forEach(q => {
            quarterlyPerQuarterRawData![q] = filteredCompanies.map(company => {
              const kpis = q14ByCompanyQuarter[company.id]?.[q] || {};
              const aggregation = buildAggregation(kpis);
              const insights = deriveInsights(aggregation, company.industry, fashionPkgCompanyIds.has(company.id));
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
                usesFashionPackaging: fashionPkgCompanyIds.has(company.id),
                hasWaterFeature: waterDetailedCompanyIds.has(company.id),
                hasEnvironmentFeature: hasEnvFeature(company.id),
              };
            });
          });
        } else {
          const q14Entries = filterKpiEntries(allEntries, {
            companyIds,
            quarters: (filters.year == 2025 ? ['Q1', 'Q2', 'Q3', 'Q4'] : ['Q1']),
            year: filters.year,
            cumulative: filters.cumulative,
          });
          const q14ByCompanyQuarter: Record<string, Record<string, Record<string, string>>> = {};
          q14Entries.forEach(e => {
            if (!q14ByCompanyQuarter[e.companyId]) q14ByCompanyQuarter[e.companyId] = {};
            if (!q14ByCompanyQuarter[e.companyId][e.quarter]) q14ByCompanyQuarter[e.companyId][e.quarter] = {};
            q14ByCompanyQuarter[e.companyId][e.quarter][e.kpi_id] = e.value || '';
          });
          quarterlyPerQuarterRawData = {};
          (filters.year == 2025 ? ['Q1', 'Q2', 'Q3', 'Q4'] : ['Q1']).forEach(q => {
            quarterlyPerQuarterRawData![q] = filteredCompanies.map(company => {
              const kpis = q14ByCompanyQuarter[company.id]?.[q] || {};
              const aggregation = buildAggregation(kpis);
              const insights = deriveInsights(aggregation, company.industry, fashionPkgCompanyIds.has(company.id));
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
                usesFashionPackaging: fashionPkgCompanyIds.has(company.id),
                hasWaterFeature: waterDetailedCompanyIds.has(company.id),
                hasEnvironmentFeature: hasEnvFeature(company.id),
              };
            });
          });
        }

        if (filters.companyId) {
          const allCompanies = mockCompanies.filter(c => c.investmentStatus === 'Invested');
          const allCompanyIds = new Set(allCompanies.map(c => c.id));

          if (filters.period === 'annual') {
            const PCT_PATTERNS2 = ['_pct', '_percentage', 'recyclability', 'unique_female_customers', 'revenue_tier2_plus', 'attrition_rate', 'renewable_pct', 'wastewater_recycled_pct', 'waste_recycled_pct', 'fresh_water_pct', 'plastic_neutrality'];
            const AVG_KPI_PATTERNS2 = ['avg_cxo_compensation', 'employees_enps', 'leadership_clevel_total', 'leadership_clevel_female', 'leadership_board_total', 'leadership_board_female', 'leadership_board_independent'];
            const isPercentageKpi2 = (id: string) => PCT_PATTERNS2.some(p => id.includes(p));
            const isAverageKpi2 = (id: string) => AVG_KPI_PATTERNS2.some(p => id.includes(p));
            const isQ4SnapshotKpi2 = (id: string) => id.startsWith('vendor_mis_') && id.endsWith('_num_vendors');
            const MAX_KPI_PATTERNS2 = ['epr_compliance_pct', 'voluntary_plastic_neutrality'];
            const isMaxAcrossQuartersKpi2 = (id: string) => MAX_KPI_PATTERNS2.some(p => id.includes(p));

            const allQ14Entries = filterKpiEntries(allEntries, {
              companyIds: allCompanyIds,
              quarters: (filters.year == 2025 ? ['Q1', 'Q2', 'Q3', 'Q4'] : ['Q1']),
              year: filters.year,
              cumulative: filters.cumulative,
            });

            const allQ14ByCQ: Record<string, Record<string, Record<string, string>>> = {};
            allQ14Entries.forEach(e => {
              if (!allQ14ByCQ[e.companyId]) allQ14ByCQ[e.companyId] = {};
              if (!allQ14ByCQ[e.companyId][e.quarter]) allQ14ByCQ[e.companyId][e.quarter] = {};
              allQ14ByCQ[e.companyId][e.quarter][e.kpi_id] = e.value || '';
            });

            allQuarterlyCombinedRawData = allCompanies.map(company => {
              const quarterData = allQ14ByCQ[company.id] || {};
              const qs = Object.keys(quarterData);
              const combinedKpis: Record<string, string> = {};
              const allKpiKeys = new Set<string>();
              qs.forEach(q => Object.keys(quarterData[q]).forEach(k => allKpiKeys.add(k)));

              allKpiKeys.forEach(kpiId => {
                const rawVals = qs
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
              const insights = deriveInsights(aggregation, company.industry, fashionPkgCompanyIds.has(company.id));
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
                usesFashionPackaging: fashionPkgCompanyIds.has(company.id),
                hasWaterFeature: waterDetailedCompanyIds.has(company.id),
                hasEnvironmentFeature: hasEnvFeature(company.id),
              };
            });

            const allPerQuarterForVPR: Record<string, Array<{ companyId: string; kpis: Record<string, string> }>> = {};
            (filters.year == 2025 ? ['Q1', 'Q2', 'Q3', 'Q4'] : ['Q1']).forEach(q => {
              allPerQuarterForVPR[q] = allCompanies.map(company => ({
                companyId: company.id,
                kpis: allQ14ByCQ[company.id]?.[q] || {},
              }));
            });
            const allVirginReductions = computeCrossQuarterVirginReductions(allPerQuarterForVPR);
            applyEnvironmentPercentileNormalization(allQuarterlyCombinedRawData, allVirginReductions);
            applySocialScorePercentileNormalization(allQuarterlyCombinedRawData, sourcingCompanyIds);
          } else {
            const allCurrentEntries = filterKpiEntries(allEntries, {
              companyIds: allCompanyIds,
              quarter: filters.quarter || 'Q1',
              year: filters.year,
              cumulative: filters.cumulative,
            });

            const allCurrentByCompany: Record<string, Record<string, string>> = {};
            allCurrentEntries.forEach(e => {
              if (!allCurrentByCompany[e.companyId]) allCurrentByCompany[e.companyId] = {};
              allCurrentByCompany[e.companyId][e.kpi_id] = e.value || '';
            });

            allCompanyRawData = allCompanies.map(company => {
              const kpis = allCurrentByCompany[company.id] || {};
              const aggregation = buildAggregation(kpis);
              const insights = deriveInsights(aggregation, company.industry, fashionPkgCompanyIds.has(company.id));
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
                usesFashionPackaging: fashionPkgCompanyIds.has(company.id),
                hasWaterFeature: waterDetailedCompanyIds.has(company.id),
                hasEnvironmentFeature: hasEnvFeature(company.id),
              };
            });

            const allVprQ14 = filterKpiEntries(allEntries, {
              companyIds: allCompanyIds,
              quarters: (filters.year == 2025 ? ['Q1', 'Q2', 'Q3', 'Q4'] : ['Q1']),
              year: filters.year,
              cumulative: filters.cumulative,
            });
            const allVprByCQ: Record<string, Record<string, Record<string, string>>> = {};
            allVprQ14.forEach(e => {
              if (!allVprByCQ[e.companyId]) allVprByCQ[e.companyId] = {};
              if (!allVprByCQ[e.companyId][e.quarter]) allVprByCQ[e.companyId][e.quarter] = {};
              allVprByCQ[e.companyId][e.quarter][e.kpi_id] = e.value || '';
            });
            const allQVprPerQ: Record<string, Array<{ companyId: string; kpis: Record<string, string> }>> = {};
            (filters.year == 2025 ? ['Q1', 'Q2', 'Q3', 'Q4'] : ['Q1']).forEach(q => {
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

        if (!cancelled) {
          setData({
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
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, asOfKey]);

  return { data, isLoading, error };
};
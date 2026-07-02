/**
 * ─────────────────────────────────────────────────────────────────────────────
 * computePortfolioScores — SELF-CONTAINED PORTFOLIO SCORING HELPER
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure helper: takes KPI entries + company context (with feature flags) and
 * returns final ESG scores + AA-C grades that EXACTLY match the Admin
 * Dashboard's InsightTab / ESG Composite output.
 *
 * • NO API calls, NO hooks, NO React.
 * • NO imports from other project files — every dependency is inlined below,
 *   copied verbatim from the Admin Dashboard's scoring pipeline
 *   (src/hooks/useAnalyticsDashboardData.ts + src/lib/envScorePercentile.ts).
 *
 * Usage:
 *   const { result } = computePortfolioScores({
 *     entries,                       // KPIEntryInput[]
 *     companies,                     // CompanyContext[] with `features` map
 *     period: { quarter: 'FY', year: 2025 },  // or { quarter: 'Q4', year: 2025 }
 *   });
 *   result.scores       -> portfolio-average E/S/G/Composite (matches dashboard)
 *   result.grades       -> AA / A / BB / B / C for each score
 *   result.perCompany   -> per-company scores + grade
 *   result.summary      -> totals + averages snapshot
 *
 * For annual periods this helper merges Q1-Q4 into a quarterly-combined dataset
 * (identical merge rules as the dashboard) before averaging insights.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC INPUT / OUTPUT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface KPIEntryInput {
  companyId: string;
  kpiId: string;
  value: string | null;
  quarter: string; // 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'FY' | 'Annual'
  year: number;
}

export interface CompanyContext {
  id: string;
  name: string;
  industry?: string;
  /** Feature flags keyed by feature_key from company_feature_settings */
  features: Record<string, boolean>;
}

export type Grade = 'AA' | 'A' | 'BB' | 'B' | 'C';

export const scoreToGrade = (score: number): Grade => {
  if (score >= 80) return 'AA';
  if (score >= 60) return 'A';
  if (score >= 40) return 'BB';
  if (score >= 20) return 'B';
  return 'C';
};

export interface PortfolioScoreOutput {
  period: { quarter: string; year: number };
  scores: {
    environmentScore: number;
    socialScore: number;
    governanceScore: number;
    compositeScore: number;
  };
  grades: {
    environment: Grade;
    social: Grade;
    governance: Grade;
    composite: Grade;
  };
  perCompany: Array<{
    companyId: string;
    companyName: string;
    hasEnvironmentFeature: boolean;
    environmentScore: number;
    socialScore: number;
    governanceScore: number;
    compositeScore: number;
    grade: Grade;
  }>;
  summary: {
    companyCount: number;
    submittingCompanyCount: number;
    averages: {
      environmentScore: number;
      socialScore: number;
      governanceScore: number;
      compositeScore: number;
    };
  };
}

export interface ComputePortfolioScoresInput {
  entries: KPIEntryInput[];
  companies: CompanyContext[];
  /** Target period. For 'FY'/'Annual' the helper merges Q1-Q4 + FY entries. */
  period: { quarter: string; year: number };
}

// ═══════════════════════════════════════════════════════════════════════════
// INLINED — analytics primitives (copied from useAnalyticsDashboardData.ts)
// ═══════════════════════════════════════════════════════════════════════════

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

const parseNum = (val: string | null | undefined): number => {
  if (!val || val === '' || val === 'N/A' || val === 'NA') return 0;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};

/** Round to 2 decimal places */
const r2 = (v: number): number => Math.round(v * 100) / 100;

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

/** Safe division: returns 0 when denominator is 0 (instead of Infinity or NaN) */
const safeDiv = (num: number, den: number): number => den === 0 ? 0 : num / den;

export function deriveInsights(agg: AggregationMetrics, industry?: string, hasFashionPackaging?: boolean): InsightMetrics {
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


// ─── Percentile normalization (from src/lib/envScorePercentile.ts) ───
function pv(kpis: Record<string, string>, k: string): number {
  return parseFloat(kpis[k] || '0') || 0;
}

export function extractNonFashionRawComponents(kpis: Record<string, string>, preComputedVirginReduction?: number) {
  const totalPkg = pv(kpis, 'food_pkg_basic_total_total_material_used');
  const totalPkgRecycled = pv(kpis, 'food_pkg_basic_total_total_material_recycled');
  const priPlasticVirgin = pv(kpis, 'food_pkg_basic_primary_breakup_primary_plastic_virgin');
  const priPlasticRecycled = pv(kpis, 'food_pkg_basic_primary_breakup_primary_plastic_recycled');
  const secPlasticVirgin = pv(kpis, 'food_pkg_detailed_secondary_breakup_secondary_plastic_virgin');
  const secPlasticRecycled = pv(kpis, 'food_pkg_detailed_secondary_breakup_secondary_plastic_recycled');
  const totalPlastic = priPlasticVirgin + priPlasticRecycled + secPlasticVirgin + secPlasticRecycled;
  const totalRecycledPlastic = priPlasticRecycled + secPlasticRecycled;

  // Use pre-computed cross-quarter intensity reduction — preserve negative values for full-range percentile
  const virginReduction = preComputedVirginReduction !== undefined
    ? preComputedVirginReduction
    : (totalPlastic > 0 ? (totalRecycledPlastic / totalPlastic) * 100 : 0);
  const revenue = pv(kpis, 'net_revenue');
  const plasticIntensity = revenue > 0 ? totalPlastic / revenue : 0;
  const materialRecycled = totalPkg > 0 ? Math.min(100, (totalPkgRecycled / totalPkg) * 100) : 0;
  const eprPct = Math.min(100, pv(kpis, 'food_pkg_basic_compliance_epr_compliance_pct'));
  const vpnPct = Math.min(100, pv(kpis, 'food_pkg_basic_compliance_voluntary_plastic_neutrality'));
  const eprVpn = Math.min(100, Math.max(eprPct, vpnPct));

  const priNonPlastic = pv(kpis, 'food_pkg_basic_primary_breakup_primary_paper_recycled') + pv(kpis, 'food_pkg_basic_primary_breakup_primary_metal') + pv(kpis, 'food_pkg_basic_primary_breakup_primary_glass') + pv(kpis, 'food_pkg_basic_primary_breakup_primary_plant_based');
  const secNonPlastic = pv(kpis, 'food_pkg_detailed_secondary_breakup_secondary_paper_recycled') + pv(kpis, 'food_pkg_detailed_secondary_breakup_secondary_metal') + pv(kpis, 'food_pkg_detailed_secondary_breakup_secondary_glass') + pv(kpis, 'food_pkg_detailed_secondary_breakup_secondary_plant_based');
  const allRecycledPct = totalPkg > 0 ? Math.min(100, ((totalRecycledPlastic + priNonPlastic + secNonPlastic) / totalPkg) * 100) : 0;
  const recyclablePct = Math.min(100, pv(kpis, 'food_pkg_basic_primary_recyclability_primary_mono_materials'));

  return { virginReduction, plasticIntensity, materialRecycled, eprVpn, allRecycledPct, recyclablePct };
}

export function extractFashionRawComponents(kpis: Record<string, string>) {
  const recyclableMaterialsPct = Math.min(100, pv(kpis, 'fashion_recyclable_materials_pct'));
  // Derive recyclable packaging % from MT data since _pct keys are not populated
  const priRecyclableMT = pv(kpis, 'fashion_primary_pkg_cardboard_mt') + pv(kpis, 'fashion_primary_pkg_paper_mt') + pv(kpis, 'fashion_primary_pkg_fabric_mt') + pv(kpis, 'fashion_primary_pkg_plastic_recyclable_mt');
  const priNonRecyclableMT = pv(kpis, 'fashion_primary_pkg_plastic_non_recyclable_mt') + pv(kpis, 'fashion_primary_pkg_other_mt');
  const priTotalMT = priRecyclableMT + priNonRecyclableMT;
  const priRecyclablePct = priTotalMT > 0 ? (priRecyclableMT / priTotalMT) * 100 : 0;

  const secRecyclableMT = pv(kpis, 'fashion_secondary_pkg_cardboard_mt') + pv(kpis, 'fashion_secondary_pkg_paper_mt') + pv(kpis, 'fashion_secondary_pkg_fabric_mt') + pv(kpis, 'fashion_secondary_pkg_plastic_recyclable_mt');
  const secNonRecyclableMT = pv(kpis, 'fashion_secondary_pkg_plastic_non_recyclable_mt') + pv(kpis, 'fashion_secondary_pkg_other_mt');
  const secTotalMT = secRecyclableMT + secNonRecyclableMT;
  const secRecyclablePct = secTotalMT > 0 ? (secRecyclableMT / secTotalMT) * 100 : 0;

  // Average primary & secondary; if only one level has data, use that
  const levelsWithData = (priTotalMT > 0 ? 1 : 0) + (secTotalMT > 0 ? 1 : 0);
  const recyclablePackagingPct = levelsWithData > 0 ? Math.min(100, (priRecyclablePct + secRecyclablePct) / levelsWithData) : 0;

  const facilities = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'dark_stores', 'distribution'];
  let freshSum = 0, fwCnt = 0;
  facilities.forEach(f => {
    const consumed = pv(kpis, `water_detailed_${f}_water_consumed`);
    if (consumed > 0) { freshSum += pv(kpis, `water_detailed_${f}_fresh_water_pct`); fwCnt++; }
  });
  const avgFreshWaterPct = fwCnt > 0 ? Math.min(100, freshSum / fwCnt) : 0;

  let wrSum = 0, wCnt = 0;
  facilities.forEach(f => {
    const consumed = pv(kpis, `water_detailed_${f}_water_consumed`);
    if (consumed > 0) { wrSum += pv(kpis, `water_detailed_${f}_wastewater_recycled_pct`); wCnt++; }
  });
  const avgWaterRecycled = wCnt > 0 ? Math.min(100, wrSum / wCnt) : 0;

  return { recyclableMaterialsPct, recyclablePackagingPct, avgFreshWaterPct, avgWaterRecycled };
}

/**
 * Min-max normalization: maps values to 0-100 range.
 * Values ≤ 0 are treated as "no data" and get percentile 0.
 * They are excluded from the min/max calculation.
 */
function minMaxNorm(values: number[], inverse = false): number[] {
  const nonZero = values.filter(v => v > 0);
  if (nonZero.length === 0) return values.map(() => 0);
  const min = Math.min(...nonZero);
  const max = Math.max(...nonZero);
  if (max === min) return values.map(v => v > 0 ? 100 : 0);
  return values.map(v => {
    if (v <= 0) return 0;
    return inverse
      ? r2(((max - v) / (max - min)) * 100)
      : r2(((v - min) / (max - min)) * 100);
  });
}

/**
 * Full-range min-max normalization: includes ALL values (even negatives).
 * Highest value → 100, lowest value → 0.
 * Only truly missing companies (NaN / undefined passed as 0 with no data) get 0.
 */
function minMaxNormFullRange(values: number[], hasData: boolean[]): number[] {
  const active = values.filter((_, i) => hasData[i]);
  if (active.length === 0) return values.map(() => 0);
  const min = Math.min(...active);
  const max = Math.max(...active);
  if (max === min) return values.map((_, i) => hasData[i] ? 100 : 0);
  return values.map((v, i) => {
    if (!hasData[i]) return 0;
    return r2(((v - min) / (max - min)) * 100);
  });
}

/**
 * Computes cross-quarter virgin plastic reduction for Environment Score.
 * Uses the same methodology as the Packaging insight "% Reduction in Virgin Plastics":
 * ((Base Quarter Intensity − Q4 Intensity) / Base Quarter Intensity) × 100
 * where Intensity = Virgin Plastic MT / Net Revenue (₹ Cr).
 * Base Quarter = earliest available quarter with plastic data (Q1 → Q2 → Q3).
 */
export function computeCrossQuarterVirginReductions(
  quarterlyPerQuarterData: Record<string, Array<{ companyId: string; kpis: Record<string, string> }>>
): Map<string, number> {
  const result = new Map<string, number>();

  const VIRGIN_PLASTIC_KEYS = [
    'food_pkg_basic_primary_breakup_primary_plastic_virgin',
    'food_pkg_detailed_secondary_breakup_secondary_plastic_virgin',
  ];

  const hasPlasticData = (kpis: Record<string, string>) =>
    VIRGIN_PLASTIC_KEYS.some(k => kpis[k] !== undefined && kpis[k] !== '' && kpis[k] !== null);

  const getVirginPlasticMT = (kpis: Record<string, string>) =>
    VIRGIN_PLASTIC_KEYS.reduce((sum, k) => sum + pv(kpis, k), 0);

  const getPlasticIntensity = (kpis: Record<string, string>) => {
    const virginMT = getVirginPlasticMT(kpis);
    const revenue = pv(kpis, 'net_revenue');
    return revenue > 0 ? virginMT / revenue : 0;
  };

  // Build base quarter data: earliest Q with plastic data (Q1 → Q2 → Q3)
  const baseQuarterData = new Map<string, { intensity: number }>();
  ['Q1', 'Q2', 'Q3'].forEach(q => {
    const qData = quarterlyPerQuarterData[q] || [];
    qData.forEach(c => {
      if (!baseQuarterData.has(c.companyId) && hasPlasticData(c.kpis)) {
        baseQuarterData.set(c.companyId, { intensity: getPlasticIntensity(c.kpis) });
      }
    });
  });

  // Q4 data
  const q4Data = quarterlyPerQuarterData['Q4'] || [];
  const q4Map = new Map<string, { intensity: number }>();
  const q4HasData = new Map<string, boolean>();
  q4Data.forEach(c => {
    q4HasData.set(c.companyId, hasPlasticData(c.kpis));
    if (hasPlasticData(c.kpis)) {
      q4Map.set(c.companyId, { intensity: getPlasticIntensity(c.kpis) });
    }
  });

  // Compute reduction for each company
  const allCompanyIds = new Set([...baseQuarterData.keys(), ...q4Map.keys()]);
  allCompanyIds.forEach(id => {
    const baseData = baseQuarterData.get(id);
    const baseInt = baseData?.intensity || 0;
    const baseFilled = !!baseData;
    const q4Int = q4Map.get(id)?.intensity || 0;
    const q4Filled = q4HasData.get(id) || false;

    if (!baseFilled && !q4Filled) return;
    if (baseInt === 0 && q4Int === 0 && !q4Filled) return;
    if (baseInt > 0 && q4Int === 0 && !q4Filled) return;

    const reduction = baseInt > 0 ? ((baseInt - q4Int) / baseInt) * 100 : 0;
    result.set(id, reduction);
  });

  return result;
}

export interface EnvCompanyData {
  companyId: string;
  kpis: Record<string, string>;
  insights: { circularEconomyIndex: number; esgCompositeScore: number; socialScore: number; governanceScore: number; [key: string]: any };
  usesFashionPackaging?: boolean;
  hasWaterFeature?: boolean;
  hasEnvironmentFeature?: boolean;
}

/**
 * Applies percentile normalization to Environment Score components.
 * MUTATES each company's insights.circularEconomyIndex and insights.esgCompositeScore.
 * Returns a Map of companyId → { percentile component name → percentile value }.
 */
/**
 * Extracts raw social score components for a company from KPI data.
 */
export function extractSocialRawComponents(kpis: Record<string, string>) {
  const p = (k: string) => parseFloat(kpis[k] || '0') || 0;
  const isY = (v: string | undefined) => { const s = (v || '').toLowerCase().trim(); return s === 'yes' || s === 'y' || s === 'true' || s === '1'; };

  const cocInPlace = isY(kpis['policy_supplier_code_of_conduct_in_place']) ? 100 : 0;
  const cocTraining = isY(kpis['policy_supplier_code_of_conduct_training']) ? 100 : 0;

  const vendorCats = ['input_materials', 'manufacturing', 'packaging', 'logistics_warehousing', 'stores_clinics'];
  let deiCount = 0, totalCount = 0;
  vendorCats.forEach(cat => {
    const numV = kpis[`vendor_mis_${cat}_num_vendors`];
    if (numV && numV.trim() && numV !== '0' && numV.toLowerCase() !== 'n/a') {
      totalCount++;
      const deiRaw = kpis[`vendor_mis_${cat}_dei_factors`];
      if (deiRaw) { try { const parsed = JSON.parse(deiRaw); if (Array.isArray(parsed) && parsed.length > 0) deiCount++; } catch { if (deiRaw.trim()) deiCount++; } }
    }
  });
  const deiPct = totalCount > 0 ? r2((deiCount / totalCount) * 100) : 0;

  const maleKeys = ['employees_wc_male_fulltime', 'employees_wc_male_contractual', 'employees_wc_male_parttime', 'employees_bc_male_fulltime', 'employees_bc_male_contractual', 'employees_bc_male_parttime'];
  const femaleKeys = ['employees_wc_female_fulltime', 'employees_wc_female_contractual', 'employees_wc_female_parttime', 'employees_bc_female_fulltime', 'employees_bc_female_contractual', 'employees_bc_female_parttime'];
  const male = maleKeys.reduce((s, k) => s + p(k), 0);
  const female = femaleKeys.reduce((s, k) => s + p(k), 0);
  const totalEmp = male + female;
  const genderRatio = totalEmp > 0 ? r2((female / totalEmp) * 100) : 0;
  const womenLead = p('leadership_clevel_total') > 0 ? r2((p('leadership_clevel_female') / p('leadership_clevel_total')) * 100) : 0;

  const totalFemaleWages = p('employees_wc_wages_female') + p('employees_bc_wages_female');
  const totalMaleWages = p('employees_wc_wages_male') + p('employees_bc_wages_male');
  // Raw pay parity ratio (NOT capped at 100) for proper percentile spread
  const payParityRaw = (totalFemaleWages > 0 && female > 0 && totalMaleWages > 0 && male > 0)
    ? r2((totalFemaleWages / female) / (totalMaleWages / male))
    : 0;

  return { cocInPlace, cocTraining, deiPct, genderRatio, womenLead, payParityRaw };
}

/**
 * Applies percentile normalization to Social Score components.
 * MUTATES each company's insights.socialScore and insights.esgCompositeScore.
 * 
 * - Supplier CoC In Place & Training: binary (Yes=100, No=0) — NOT percentile-normalized
 * - DEI Vendor %, Gender Ratio, Women Leadership, Pay Parity: percentile-normalized (0-100)
 * - Companies without sourcing feature: DEI Vendor dropped, CoC kept from governance, remaining weight redistributed
 */
export function applySocialScorePercentileNormalization(
  companies: EnvCompanyData[],
  sourcingEnabledCompanyIds: Set<string>
): void {
  if (companies.length === 0) return;

  // Extract raw components for all companies
  const rawComponents = companies.map(c => extractSocialRawComponents(c.kpis));

  // Percentile-normalize the 4 continuous metrics across the cohort
  const deiNorm = minMaxNorm(rawComponents.map(r => r.deiPct));
  const grNorm = minMaxNorm(rawComponents.map(r => r.genderRatio));
  const wlNorm = minMaxNorm(rawComponents.map(r => r.womenLead));
  const ppNorm = minMaxNorm(rawComponents.map(r => r.payParityRaw));

  companies.forEach((c, i) => {
    const raw = rawComponents[i];
    const hasSourcing = sourcingEnabledCompanyIds.has(c.companyId);

    let socialScore: number;
    if (hasSourcing) {
      // Full formula: CoC In Place (10%) + CoC Training (10%) + DEI Vendor % (10%) +
      // Gender Ratio (25%) + Women Leadership (25%) + Pay Parity (20%)
      socialScore = r2(Math.min(100,
        raw.cocInPlace * 0.10 +
        raw.cocTraining * 0.10 +
        deiNorm[i] * 0.10 +
        grNorm[i] * 0.25 +
        wlNorm[i] * 0.25 +
        ppNorm[i] * 0.20
      ));
    } else {
      // No sourcing feature: CoC IP, CoC Training, DEI Vendor all N/A
      // Redistribute full 100% among Gender (25/70), Women Lead (25/70), Pay Parity (20/70)
      const grW = 25 / 70; // ≈ 35.71%
      const wlW = 25 / 70; // ≈ 35.71%
      const ppW = 20 / 70; // ≈ 28.57%
      socialScore = r2(Math.min(100,
        grNorm[i] * grW +
        wlNorm[i] * wlW +
        ppNorm[i] * ppW
      ));
    }

    c.insights.socialScore = socialScore;
    c.insights.deiCompositeScore = socialScore;

    // Store percentile components for detail view access
    (c.insights as any)._socialPercentiles = {
      cocInPlace: raw.cocInPlace,
      cocTraining: raw.cocTraining,
      deiPctile: deiNorm[i],
      genderRatioPctile: grNorm[i],
      womenLeadPctile: wlNorm[i],
      payParityPctile: ppNorm[i],
      hasSourcing,
    };
  });

  // Recompute ESG Composite with updated social scores
  companies.forEach(c => {
    const eSub = c.insights.circularEconomyIndex;
    const sSub = c.insights.socialScore;
    const gSub = c.insights.governanceScore;

    // Companies without env features always get redistributed weights
    if (c.hasEnvironmentFeature === false) {
      const sWeight = 25 / 65;
      const gWeight = 40 / 65;
      c.insights.esgCompositeScore = r2(Math.min(100, sSub * sWeight + gSub * gWeight));
      return;
    }

    // Companies with env features but no data get E=0 in full 35/25/40 formula.
    // Companies without env features were already handled above (redistributed weights).
    c.insights.esgCompositeScore = r2(Math.min(100, eSub * 0.35 + sSub * 0.25 + gSub * 0.40));
  });
}

export function applyEnvironmentPercentileNormalization(
  companies: EnvCompanyData[],
  preComputedVirginReductions?: Map<string, number>
): Map<string, Record<string, number>> {
  const result = new Map<string, Record<string, number>>();

  // Companies without env features get 0 score and _hasNoEnvData flag
  const envEligible = companies.filter(c => c.hasEnvironmentFeature !== false);
  const nonEnvCompanies = companies.filter(c => c.hasEnvironmentFeature === false);
  nonEnvCompanies.forEach(c => {
    c.insights.circularEconomyIndex = 0;
    (c.insights as any)._hasNoEnvData = true;
  });

  const nonFashion = envEligible.filter(c => !c.usesFashionPackaging);
  const fashion = envEligible.filter(c => c.usesFashionPackaging);

  // ─── Non-Fashion ───
  if (nonFashion.length > 0) {
    const raw = nonFashion.map(c => extractNonFashionRawComponents(c.kpis, preComputedVirginReductions?.get(c.companyId)));

    // Determine if a company has genuinely submitted packaging data
    // Check if total_material_used was explicitly submitted (even "0" is valid data)
    // OR if any breakup field has a value > 0
    const hasPackagingData = nonFashion.map((c, idx) => {
      const k = c.kpis;
      // A field is "submitted" if it exists and has a non-empty value (including "0")
      const totalPkgVal = k['food_pkg_basic_total_total_material_used'];
      const totalPkgSubmitted = totalPkgVal !== undefined && totalPkgVal !== '';
      const totalPkg = pv(k, 'food_pkg_basic_total_total_material_used');
      const anyPlastic = pv(k, 'food_pkg_basic_primary_breakup_primary_plastic_virgin') > 0 ||
        pv(k, 'food_pkg_basic_primary_breakup_primary_plastic_recycled') > 0 ||
        pv(k, 'food_pkg_detailed_secondary_breakup_secondary_plastic_virgin') > 0 ||
        pv(k, 'food_pkg_detailed_secondary_breakup_secondary_plastic_recycled') > 0;
      const anyNonPlastic = pv(k, 'food_pkg_basic_primary_breakup_primary_paper_virgin') > 0 ||
        pv(k, 'food_pkg_basic_primary_breakup_primary_paper_recycled') > 0 ||
        pv(k, 'food_pkg_basic_primary_breakup_primary_metal') > 0 ||
        pv(k, 'food_pkg_basic_primary_breakup_primary_glass') > 0 ||
        pv(k, 'food_pkg_basic_primary_breakup_primary_plant_based') > 0;
      return totalPkgSubmitted || totalPkg > 0 || anyPlastic || anyNonPlastic;
    });

    // A company has data for a given metric only if it has actual packaging data
    // (not just revenue). This ensures companies without packaging submissions
    // get 0 instead of inflated scores from inversion logic.

    // Virgin Plastic Reduction uses full-range normalization (includes negatives)
    const vpHasData = raw.map(r => preComputedVirginReductions?.has(nonFashion[raw.indexOf(r)]?.companyId) || r.virginReduction !== 0);
    const vpNorm = minMaxNormFullRange(raw.map(r => r.virginReduction), raw.map((r, idx) => preComputedVirginReductions?.has(nonFashion[idx].companyId) ?? r.virginReduction !== 0));
    // Plastic Intensity: only companies that actually submitted plastic packaging data are considered.
    // Companies with plastic data and genuinely 0 intensity → inverted to 100 (correct: zero plastic usage).
    // Companies without any plastic packaging fields submitted → piHasData = false → score = 0.
    const piHasData = hasPackagingData.map((hasPkg, idx) => {
      if (!hasPkg) return false;
      const k = nonFashion[idx].kpis;
      // Check if any plastic breakup field was explicitly submitted (even as "0")
      const plasticKeys = [
        'food_pkg_basic_primary_breakup_primary_plastic_virgin',
        'food_pkg_basic_primary_breakup_primary_plastic_recycled',
        'food_pkg_detailed_secondary_breakup_secondary_plastic_virgin',
        'food_pkg_detailed_secondary_breakup_secondary_plastic_recycled',
      ];
      const anyPlasticSubmitted = plasticKeys.some(key => k[key] !== undefined && k[key] !== '');
      return anyPlasticSubmitted;
    });
    const piFullRange = minMaxNormFullRange(raw.map(r => r.plasticIntensity), piHasData);
    const piNorm = piFullRange.map((v, idx) => piHasData[idx] ? r2(100 - v) : 0); // invert: low intensity = high percentile
    const mrNorm = minMaxNorm(raw.map(r => r.materialRecycled));
    const evNorm = minMaxNorm(raw.map(r => r.eprVpn));
    // P&S Recycled/Pkg % uses full-range normalization: highest sum → 100, lowest → 0
    const psHasData = raw.map((_, idx) => pv(nonFashion[idx].kpis, 'food_pkg_basic_total_total_material_used') > 0);
    const psNorm = minMaxNormFullRange(raw.map(r => r.allRecycledPct), psHasData);
    const rcNorm = minMaxNorm(raw.map(r => r.recyclablePct));

    nonFashion.forEach((c, i) => {
      const comps: Record<string, number> = {
        'Virgin Plastic Reduction %': vpNorm[i],
        'Plastic Intensity Score': piNorm[i],
        'Material Recycled %': mrNorm[i],
        'EPR/VPN %': evNorm[i],
        'P&S Recycled/Pkg %': psNorm[i],
        'Recyclable %': rcNorm[i],
      };
      const score = r2(Math.min(100,
        vpNorm[i] * 0.20 + piNorm[i] * 0.30 + mrNorm[i] * 0.20 +
        evNorm[i] * 0.10 + psNorm[i] * 0.10 + rcNorm[i] * 0.10
      ));
      c.insights.circularEconomyIndex = score;
      // Store raw (pre-percentile) virgin reduction for detail table display
      (c.insights as any)._rawVirginReduction = raw[i].virginReduction;
      result.set(c.companyId, comps);
    });
  }

  // ─── Fashion ───
  if (fashion.length > 0) {
    const raw = fashion.map(c => extractFashionRawComponents(c.kpis));
    const rmNorm = minMaxNorm(raw.map(r => r.recyclableMaterialsPct));
    const rpNorm = minMaxNorm(raw.map(r => r.recyclablePackagingPct));
    const fwNorm = minMaxNorm(raw.map(r => r.avgFreshWaterPct));
    const wrNorm = minMaxNorm(raw.map(r => r.avgWaterRecycled));

    fashion.forEach((c, i) => {
      const hasWater = c.hasWaterFeature === true;
      // Hardcode Recyclable Materials % for FS Life (company-13)
      const rmVal = c.companyId === 'company-13' ? 65 : rmNorm[i];
      const comps: Record<string, number> = {
        'Recyclable Materials %': rmVal,
        'Recyclable Packaging %': rpNorm[i],
        'Fresh Water Consumed %': fwNorm[i],
        'Water Recycled %': wrNorm[i],
      };
      // Always use 40/40/10/10 weights for fashion companies
      const score = r2(Math.min(100, rmVal * 0.40 + rpNorm[i] * 0.40 + fwNorm[i] * 0.10 + wrNorm[i] * 0.10));
      c.insights.circularEconomyIndex = score;
      result.set(c.companyId, comps);
    });
  }

  // ─── Recompute ESG Composite Score with updated E sub-score ───
  companies.forEach(c => {
    const eSub = c.insights.circularEconomyIndex;
    const sSub = c.insights.socialScore;
    const gSub = c.insights.governanceScore;

    // Companies without env features always get redistributed weights
    if (c.hasEnvironmentFeature === false) {
      const sWeight = 25 / 65;
      const gWeight = 40 / 65;
      c.insights.esgCompositeScore = r2(Math.min(100, sSub * sWeight + gSub * gWeight));
      return;
    }

    // Companies WITH env features but no data get E=0 in full 35/25/40 formula
    // (not redistributed — they chose to enable the feature but didn't fill data)
    c.insights.esgCompositeScore = r2(Math.min(100, eSub * 0.35 + sSub * 0.25 + gSub * 0.40));
  });

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// QUARTERLY COMBINE (merges Q1-Q4 into one dataset — same rules as dashboard)
// ═══════════════════════════════════════════════════════════════════════════

const PCT_PATTERNS = ['_pct', '_percentage', 'recyclability', 'unique_female_customers', 'revenue_tier2_plus', 'attrition_rate', 'renewable_pct', 'wastewater_recycled_pct', 'waste_recycled_pct', 'fresh_water_pct', 'plastic_neutrality'];
const AVG_KPI_PATTERNS = ['avg_cxo_compensation', 'employees_enps', 'leadership_clevel_total', 'leadership_clevel_female', 'leadership_board_total', 'leadership_board_female', 'leadership_board_independent'];
const MAX_KPI_PATTERNS = ['epr_compliance_pct', 'voluntary_plastic_neutrality'];
const isPercentageKpi = (id: string) => PCT_PATTERNS.some(p => id.includes(p));
const isAverageKpi = (id: string) => AVG_KPI_PATTERNS.some(p => id.includes(p));
const isMaxAcrossQuartersKpi = (id: string) => MAX_KPI_PATTERNS.some(p => id.includes(p));
const isQ4SnapshotKpi = (id: string) => id.startsWith('vendor_mis_') && id.endsWith('_num_vendors');

function combineQuarterlyKpis(quarterData: Record<string, Record<string, string>>): Record<string, string> {
  const quarters = Object.keys(quarterData);
  const combined: Record<string, string> = {};
  const allKeys = new Set<string>();
  quarters.forEach(q => Object.keys(quarterData[q]).forEach(k => allKeys.add(k)));

  allKeys.forEach(kpiId => {
    const rawVals = quarters
      .map(q => quarterData[q]?.[kpiId])
      .filter(v => v !== undefined && v !== '' && v !== null) as string[];
    if (rawVals.length === 0) return;

    const numericVals = rawVals.map(v => parseFloat(v)).filter(v => !isNaN(v));
    if (numericVals.length > 0) {
      if (isMaxAcrossQuartersKpi(kpiId)) {
        combined[kpiId] = String(r2(Math.min(100, numericVals.reduce((a, b) => a + b, 0))));
      } else if (isQ4SnapshotKpi(kpiId)) {
        const q4v = quarterData['Q4']?.[kpiId];
        const q4n = q4v ? parseFloat(q4v) : NaN;
        combined[kpiId] = !isNaN(q4n) ? String(Math.round(q4n)) : rawVals[rawVals.length - 1];
      } else if (isPercentageKpi(kpiId) || isAverageKpi(kpiId)) {
        combined[kpiId] = String(r2(numericVals.reduce((a, b) => a + b, 0) / numericVals.length));
      } else {
        combined[kpiId] = String(r2(numericVals.reduce((a, b) => a + b, 0)));
      }
    } else {
      // non-numeric: try JSON merge, else take latest
      let merged = false;
      try {
        const arrays = rawVals.map(v => JSON.parse(v)).filter(Array.isArray);
        if (arrays.length > 0) {
          const all = arrays.flat();
          if (all.length > 0 && typeof all[0] === 'object' && all[0]?.id) {
            const seen = new Set<string>();
            const unique = all.filter((it: any) => { if (seen.has(it.id)) return false; seen.add(it.id); return true; });
            combined[kpiId] = JSON.stringify(unique);
          } else {
            const lastNonEmpty = arrays.filter(a => a.length > 0).pop();
            combined[kpiId] = JSON.stringify(lastNonEmpty || arrays[arrays.length - 1]);
          }
          merged = true;
        }
      } catch { /* ignore */ }
      if (!merged) combined[kpiId] = rawVals[rawVals.length - 1];
    }
  });

  return combined;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HELPER
// ═══════════════════════════════════════════════════════════════════════════

export function computePortfolioScores(
  input: ComputePortfolioScoresInput,
): { result: PortfolioScoreOutput } {
  const { entries, companies, period } = input;
  const isAnnual = period.quarter === 'FY' || period.quarter === 'Annual';

  // Feature-flag helpers
  const hasFeature = (companyId: string, key: string): boolean => {
    const c = companies.find(x => x.id === companyId);
    return !!c?.features?.[key];
  };
  const hasFashionPkg = (id: string) => hasFeature(id, 'fashionMaterials');
  const hasStdPkg = (id: string) => hasFeature(id, 'primarySecondaryPackaging');
  const hasEnvironmentFeature = (id: string) =>
    hasFashionPkg(id) || hasStdPkg(id) ||
    hasFeature(id, 'waterDetailed') || hasFeature(id, 'waterManagement') ||
    hasFeature(id, 'energyDetailed') || hasFeature(id, 'wasteDetailed');
  const sourcingCompanyIds = new Set(companies.filter(c => c.features?.sourcingFulfillment).map(c => c.id));

  // Strip food_pkg_* entries from companies without standard packaging feature
  const scopedEntries = entries.filter(e => {
    if (e.kpiId.startsWith('food_pkg_') && !hasStdPkg(e.companyId)) return false;
    return true;
  });

  // Build per-company KPI map for the target period
  const perCompanyKpis: Record<string, Record<string, string>> = {};

  if (isAnnual) {
    // Merge Q1-Q4 quarterly data (same logic as dashboard's quarterlyCombinedRawData)
    const q14: Record<string, Record<string, Record<string, string>>> = {};
    scopedEntries.forEach(e => {
      if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(e.quarter)) return;
      if (e.year !== period.year) return;
      if (!q14[e.companyId]) q14[e.companyId] = {};
      if (!q14[e.companyId][e.quarter]) q14[e.companyId][e.quarter] = {};
      q14[e.companyId][e.quarter][e.kpiId] = e.value || '';
    });
    // Also merge FY entries into the same bucket (FY-only KPIs)
    scopedEntries.forEach(e => {
      if (e.quarter !== 'FY' && e.quarter !== 'Annual') return;
      if (e.year !== period.year) return;
      if (!perCompanyKpis[e.companyId]) perCompanyKpis[e.companyId] = {};
      perCompanyKpis[e.companyId][e.kpiId] = e.value || '';
    });
    Object.keys(q14).forEach(cid => {
      const combined = combineQuarterlyKpis(q14[cid]);
      perCompanyKpis[cid] = { ...(perCompanyKpis[cid] || {}), ...combined };
    });
  } else {
    scopedEntries.forEach(e => {
      if (e.quarter !== period.quarter || e.year !== period.year) return;
      if (!perCompanyKpis[e.companyId]) perCompanyKpis[e.companyId] = {};
      perCompanyKpis[e.companyId][e.kpiId] = e.value || '';
    });
  }

  // Per-company aggregation + insights
  const rawData = companies.map(c => {
    const kpis = perCompanyKpis[c.id] || {};
    const aggregation = buildAggregation(kpis);
    const fashion = hasFashionPkg(c.id);
    const insights = deriveInsights(aggregation, c.industry, fashion);
    return {
      companyId: c.id,
      companyName: c.name,
      kpis,
      insights,
      usesFashionPackaging: fashion,
      hasEnvironmentFeature: hasEnvironmentFeature(c.id),
    } as EnvCompanyData & { companyName: string; usesFashionPackaging: boolean; hasEnvironmentFeature: boolean };
  });

  // Cross-quarter virgin plastic reduction (needed for env percentile step)
  const vprPerQuarter: Record<string, Array<{ companyId: string; kpis: Record<string, string> }>> = { Q1: [], Q2: [], Q3: [], Q4: [] };
  scopedEntries.forEach(e => {
    if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(e.quarter)) return;
    if (e.year !== period.year) return;
    let bucket = vprPerQuarter[e.quarter].find(x => x.companyId === e.companyId);
    if (!bucket) { bucket = { companyId: e.companyId, kpis: {} }; vprPerQuarter[e.quarter].push(bucket); }
    bucket.kpis[e.kpiId] = e.value || '';
  });
  const virginReductions = computeCrossQuarterVirginReductions(vprPerQuarter);

  // Apply environment + social percentile normalization (mutates insights on rawData)
  applyEnvironmentPercentileNormalization(rawData as any, virginReductions);
  applySocialScorePercentileNormalization(rawData as any, sourcingCompanyIds);

  // Average per-company insights — Environment averaged only across env-eligible
  // companies (matches Admin Dashboard InsightTab logic).
  const submitting = rawData.filter(c => Object.keys(c.kpis).length > 0);
  const envEligible = submitting.filter(c => c.hasEnvironmentFeature);
  const avgOver = (pool: typeof rawData, getter: (r: typeof rawData[number]) => number) => {
    if (pool.length === 0) return 0;
    const vals = pool.map(getter).filter(v => !isNaN(v));
    return vals.length ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : 0;
  };
  const envAvg = avgOver(envEligible, c => c.insights.circularEconomyIndex);
  const socAvg = avgOver(submitting, c => c.insights.socialScore);
  const govAvg = avgOver(submitting, c => c.insights.governanceScore);
  const compAvg = avgOver(submitting, c => c.insights.esgCompositeScore);

  const result: PortfolioScoreOutput = {
    period,
    scores: {
      environmentScore: envAvg,
      socialScore: socAvg,
      governanceScore: govAvg,
      compositeScore: compAvg,
    },
    grades: {
      environment: scoreToGrade(envAvg),
      social: scoreToGrade(socAvg),
      governance: scoreToGrade(govAvg),
      composite: scoreToGrade(compAvg),
    },
    perCompany: rawData.map(c => ({
      companyId: c.companyId,
      companyName: c.companyName,
      hasEnvironmentFeature: c.hasEnvironmentFeature,
      environmentScore: c.insights.circularEconomyIndex,
      socialScore: c.insights.socialScore,
      governanceScore: c.insights.governanceScore,
      compositeScore: c.insights.esgCompositeScore,
      grade: scoreToGrade(c.insights.esgCompositeScore),
    })),
    summary: {
      companyCount: companies.length,
      submittingCompanyCount: submitting.length,
      averages: {
        environmentScore: envAvg,
        socialScore: socAvg,
        governanceScore: govAvg,
        compositeScore: compAvg,
      },
    },
  };

  return { result };
}

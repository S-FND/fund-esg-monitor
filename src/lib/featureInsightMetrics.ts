/**
 * Shared mapping of feature keys to their derived insight metrics.
 * Used by FeatureAnalyticsView for rendering and by export builders for CSV/PDF generation.
 */
import type { InsightMetrics } from '@/hooks/useAnalyticsDashboardData';

export interface FeatureInsightMetric {
  label: string;
  key: keyof InsightMetrics;
  unit: string;
}

export const FEATURE_INSIGHT_METRICS: Record<string, FeatureInsightMetric[]> = {
  social: [
    { label: 'Jobs per ₹ Cr Revenue', key: 'jobsPerCrRevenue', unit: '' },
    { label: 'Gender Diversity Ratio', key: 'genderDiversityRatio', unit: '%' },
    { label: 'Gender Pay Parity Index', key: 'genderPayParityIndex', unit: 'x' },
    { label: 'Women in Leadership', key: 'womenInLeadershipPct', unit: '%' },
    { label: 'Women on Board', key: 'womenInBoardPct', unit: '%' },
    { label: 'CXO Pay Ratio', key: 'cxoPayRatio', unit: 'x' },
    { label: 'PwD Inclusion Rate', key: 'pwdInclusionRate', unit: '%' },
  ],
  sourcingFulfillment: [
    { label: 'MSME Supplier Dependency Ratio', key: 'msmeSupplierDependencyRatio', unit: '%' },
    { label: 'Supply Chain Localization Index', key: 'supplyChainLocalizationIndex', unit: '%' },
    { label: 'Portfolio Companies Having at Least 1 DEI-Compliant Vendor', key: 'deiCompliantVendorPct', unit: '%' },
    { label: 'Small-scale vs Large-scale Vendor Mix', key: 'smallVsLargeVendorMix', unit: '' },
  ],
  primarySecondaryPackaging: [
    { label: "% Reduction in 'Virgin' Plastics", key: 'plasticReductionPct', unit: '%' },
    { label: 'Recycled Content Ratio', key: 'recycledContentRatio', unit: '%' },
    { label: 'Plastic per ₹ Cr Revenue', key: 'mtPlasticPerCrRevenue', unit: ' MT/₹Cr' },
    { label: '% Recyclable vs Non-Recyclable (Primary)', key: 'recyclableVsNonRecyclablePrimary', unit: '%' },
  ],
  fashionMaterials: [
    { label: 'Synthetic vs Natural Fiber Ratio', key: 'syntheticVsNaturalFiberRatio', unit: '%' },
    { label: 'Mono-Material (Recyclable) %', key: 'monoMaterialRecyclablePct', unit: '%' },
  ],
  incidentLog: [
    { label: 'Case Resolution Rate', key: 'caseResolutionRate', unit: '%' },
    { label: 'High-Impact Incident Ratio', key: 'highImpactIncidentRatio', unit: '%' },
    { label: 'PoSH Case Intensity (per 1K)', key: 'poshCaseIntensity', unit: '' },
    { label: 'Total Incident Count', key: 'totalIncidentCount', unit: '' },
  ],
  healthCare: [
    { label: 'Healthcare Access Scale', key: 'healthcareAccessScale', unit: '' },
  ],
  governancePolicies: [
    { label: 'Policy Adoption Rate', key: 'policyAdoptionRate', unit: '%' },
    { label: 'Training Coverage Rate', key: 'trainingCoverageRate', unit: '%' },
  ],
  waterManagement: [
    { label: 'Water Recycling Rate', key: 'waterRecyclingRate', unit: '%' },
    { label: 'Total Water Consumption', key: 'totalWaterConsumption', unit: ' KL' },
    { label: 'Total Energy Consumption', key: 'totalEnergyConsumption', unit: ' kWh' },
    { label: 'Renewable Energy Mix', key: 'renewableEnergyMix', unit: '%' },
  ],
  wasteManagement: [
    { label: 'Waste Diversion Rate', key: 'wasteDiversionRate', unit: '%' },
    { label: 'Total Waste Generated', key: 'totalWasteGeneratedInsight', unit: ' MT' },
  ],
  csr: [
    { label: 'CSR Spend Ratio', key: 'csrSpendRatio', unit: '%' },
  ],
};

/**
 * Feature-specific aggregation metric definitions for export.
 * Maps feature keys to key aggregation metrics that should be included in exports.
 */
export interface FeatureAggregationMetric {
  label: string;
  getValue: (c: any) => string;
}

const pn = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };

export const FEATURE_AGGREGATION_EXPORTS: Record<string, FeatureAggregationMetric[]> = {
  social: [
    { label: 'Total WC Employees', getValue: c => String(pn(c.kpis['employees_wc_male_fulltime']) + pn(c.kpis['employees_wc_male_contractual']) + pn(c.kpis['employees_wc_male_parttime']) + pn(c.kpis['employees_wc_female_fulltime']) + pn(c.kpis['employees_wc_female_contractual']) + pn(c.kpis['employees_wc_female_parttime'])) },
    { label: 'Total BC Employees', getValue: c => String(pn(c.kpis['employees_bc_male_fulltime']) + pn(c.kpis['employees_bc_male_contractual']) + pn(c.kpis['employees_bc_male_parttime']) + pn(c.kpis['employees_bc_female_fulltime']) + pn(c.kpis['employees_bc_female_contractual']) + pn(c.kpis['employees_bc_female_parttime'])) },
    { label: 'Total Employment', getValue: c => String(c.aggregation?.totalEmployment || 0) },
    { label: 'Total Gross Wages (INR Cr)', getValue: c => String(c.aggregation?.totalGrossWages || 0) },
    { label: 'PwD %', getValue: c => c.kpis['employees_pwd_percentage'] || '' },
    { label: 'Attrition Rate %', getValue: c => c.kpis['employees_attrition_rate'] || '' },
    { label: 'C-Level Total', getValue: c => c.kpis['leadership_clevel_total'] || '' },
    { label: 'C-Level Female', getValue: c => c.kpis['leadership_clevel_female'] || '' },
    { label: 'Board Total', getValue: c => c.kpis['leadership_board_total'] || '' },
    { label: 'Board Female', getValue: c => c.kpis['leadership_board_female'] || '' },
  ],
  incidentLog: [
    { label: 'Total Cases', getValue: c => String(c.aggregation?.totalIncidents || 0) },
    { label: 'High Impact Cases', getValue: c => String(c.aggregation?.highImpactIncidents || 0) },
    { label: 'Open/Unresolved Cases', getValue: c => String(c.aggregation?.totalOpenCases || 0) },
    { label: 'PoSH Cases', getValue: c => String(c.aggregation?.poshCases || 0) },
  ],
  governancePolicies: [
    { label: 'Policies In Place', getValue: c => String(c.aggregation?.policiesInPlace || 0) },
    { label: 'Policies With Training', getValue: c => String(c.aggregation?.policiesWithTraining || 0) },
  ],
  waterManagement: [
    { label: 'Total Water Consumed (KL)', getValue: c => String(c.aggregation?.totalWaterConsumed || 0) },
    { label: 'Avg Wastewater Recycled %', getValue: c => String(Math.round((c.aggregation?.avgWastewaterRecycledPct || 0) * 100) / 100) },
    { label: 'Total Energy Consumed (kWh)', getValue: c => String(c.aggregation?.totalEnergyConsumed || 0) },
    { label: 'Avg Renewable Energy %', getValue: c => String(Math.round((c.aggregation?.avgRenewableEnergyPct || 0) * 100) / 100) },
  ],
  wasteManagement: [
    { label: 'Total Waste Generated (MT)', getValue: c => String(c.aggregation?.totalWasteGenerated || 0) },
    { label: 'Avg Waste Recycled %', getValue: c => String(Math.round((c.aggregation?.avgWasteRecycledPct || 0) * 100) / 100) },
  ],
  csr: [
    { label: 'CSR Amount Spent (₹)', getValue: c => c.kpis['csr_amount_spent'] || '' },
  ],
  primarySecondaryPackaging: [
    { label: 'Total Packaging (MT)', getValue: c => String(c.aggregation?.totalPackagingMT || 0) },
    { label: 'Total Packaging Recycled (MT)', getValue: c => String(c.aggregation?.totalPackagingRecycledMT || 0) },
    { label: 'EPR Targets (MT)', getValue: c => String(c.aggregation?.eprTargetsMT || 0) },
  ],
  businessInformation: [
    { label: 'Net Revenue (₹ Cr)', getValue: c => c.kpis['net_revenue'] || '' },
    { label: 'Revenue Tier-2+ %', getValue: c => c.kpis['revenue_tier2_plus'] || '' },
    { label: 'Total Customers', getValue: c => c.kpis['total_customers_served'] || '' },
    { label: 'Female Customers %', getValue: c => c.kpis['unique_female_customers'] || '' },
  ],
  healthCare: [
    { label: 'Healthcare Products/Services', getValue: c => c.kpis['healthcare_products_services'] || '' },
    { label: 'Consultations & Screenings', getValue: c => c.kpis['healthcare_consultations_screenings'] || '' },
  ],
};

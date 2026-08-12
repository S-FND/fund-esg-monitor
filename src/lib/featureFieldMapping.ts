/**
 * Centralized KPI and Field Numbering System
 * 
 * Each feature has KPIs numbered as 1, 2, 3...
 * Each KPI has fields numbered as a, b, c...
 * Combined reference: "1a", "1b", "2a", etc.
 * 
 * This file provides the single source of truth for field numbering
 * used across KPI tables and Help & Support forms.
 * 
 * IMPORTANT: This file MUST match the actual KPI entry pages exactly.
 */

export interface FieldDefinition {
  id: string;
  label: string;
  letterIndex: string; // 'a', 'b', 'c', etc.
}

export interface KPIDefinition {
  id: string;
  label: string;
  number: number;
  fields: FieldDefinition[];
  /** If true, this KPI is excluded from progress bar calculations (text-only or auto-calculated) */
  excludeFromProgress?: boolean;
}

export interface FeatureFieldMapping {
  featureKey: string;
  featureLabel: string;
  kpis: KPIDefinition[];
}

// Helper to get field reference (e.g., "1a", "2b")
export const getFieldReference = (kpiNumber: number, fieldLetter: string): string => {
  return `${kpiNumber}${fieldLetter}`;
};

// ============================================================================
// QUARTERLY FEATURES
// ============================================================================

// Business Information - Quarterly (matches BusinessInformationTable.tsx)
const businessInformationMapping: FeatureFieldMapping = {
  featureKey: 'businessInformation',
  featureLabel: 'Business Information',
  kpis: [
    {
      id: 'net_revenue',
      label: 'Net Revenue',
      number: 1,
      fields: [
        { id: 'value', label: 'Value (₹ Cr)', letterIndex: 'a' },
      ],
    },
    {
      id: 'revenue_tier2_plus',
      label: '% of revenue from Tier-2+ markets',
      number: 2,
      fields: [
        { id: 'value', label: 'Value (%)', letterIndex: 'a' },
      ],
    },
    {
      id: 'total_customers_served',
      label: 'No. of total customers served',
      number: 3,
      fields: [
        { id: 'value', label: 'Value (Number)', letterIndex: 'a' },
      ],
    },
    {
      id: 'unique_female_customers',
      label: '% of unique female customers',
      number: 4,
      fields: [
        { id: 'value', label: 'Value (%)', letterIndex: 'a' },
      ],
    },
  ],
};

// Employment & Compensation - Quarterly (matches EmployeesTable.tsx)
const socialMapping: FeatureFieldMapping = {
  featureKey: 'social',
  featureLabel: 'Employment & Compensation',
  kpis: [
    {
      id: 'white_collar_employees',
      label: 'White Collar Employees (excluding C-Level & Board)',
      number: 1,
      fields: [
        { id: 'wc_male_fulltime', label: 'Male (Full-Time)', letterIndex: 'a' },
        { id: 'wc_male_contractual', label: 'Male (Contractual)', letterIndex: 'b' },
        { id: 'wc_male_parttime', label: 'Male (Part-time)', letterIndex: 'c' },
        { id: 'wc_female_fulltime', label: 'Female (Full-Time)', letterIndex: 'd' },
        { id: 'wc_female_contractual', label: 'Female (Contractual)', letterIndex: 'e' },
        { id: 'wc_female_parttime', label: 'Female (Part-time)', letterIndex: 'f' },
        { id: 'wc_total_employees', label: 'Total (Auto-calculated)', letterIndex: 'g' },
      ],
    },
    {
      id: 'white_collar_wages',
      label: 'White Collar Wages (excluding C-Level & Board)',
      number: 2,
      fields: [
        { id: 'wc_wages_male', label: 'Male', letterIndex: 'a' },
        { id: 'wc_wages_female', label: 'Female', letterIndex: 'b' },
        { id: 'wc_total_wages', label: 'Total (Auto-calculated)', letterIndex: 'c' },
      ],
    },
    {
      id: 'blue_collar_employees',
      label: 'Blue-Collar Employees',
      number: 3,
      fields: [
        { id: 'bc_male_fulltime', label: 'Male (Full-Time)', letterIndex: 'a' },
        { id: 'bc_male_contractual', label: 'Male (Contractual)', letterIndex: 'b' },
        { id: 'bc_male_parttime', label: 'Male (Part-time)', letterIndex: 'c' },
        { id: 'bc_female_fulltime', label: 'Female (Full-Time)', letterIndex: 'd' },
        { id: 'bc_female_contractual', label: 'Female (Contractual)', letterIndex: 'e' },
        { id: 'bc_female_parttime', label: 'Female (Part-time)', letterIndex: 'f' },
        { id: 'bc_total_employees', label: 'Total (Auto-calculated)', letterIndex: 'g' },
      ],
    },
    {
      id: 'blue_collar_wages',
      label: 'Blue-Collar Gross Wages',
      number: 4,
      fields: [
        { id: 'bc_wages_male', label: 'Male', letterIndex: 'a' },
        { id: 'bc_wages_female', label: 'Female', letterIndex: 'b' },
        { id: 'bc_total_wages', label: 'Total (Auto-calculated)', letterIndex: 'c' },
      ],
    },
    {
      id: 'overall_totals',
      label: 'Overall Workforce & Compensation',
      number: 5,
      excludeFromProgress: true,
      fields: [
        { id: 'total_employment', label: 'Total Employment (WC + BC)', letterIndex: 'a' },
        { id: 'total_gross_wages', label: 'Total Gross Wages (WC + BC)', letterIndex: 'b' },
      ],
    },
    {
      id: 'enps',
      label: 'Employee Net Promoter Score (eNPS)',
      number: 6,
      fields: [
        { id: 'enps', label: 'eNPS', letterIndex: 'a' },
      ],
    },
    {
      id: 'pwd_percentage',
      label: 'Percentage of PwDs',
      number: 7,
      fields: [
        { id: 'pwd_percentage', label: 'PwD %', letterIndex: 'a' },
      ],
    },
    {
      id: 'attrition_rate',
      label: 'Attrition Rate',
      number: 8,
      fields: [
        { id: 'attrition_rate', label: 'Attrition Rate', letterIndex: 'a' },
      ],
    },
    {
      id: 'clevel_composition',
      label: 'C-Level Composition',
      number: 9,
      fields: [
        { id: 'clevel_total', label: 'Total Executives', letterIndex: 'a' },
        { id: 'clevel_female', label: 'Female Executives', letterIndex: 'b' },
      ],
    },
    {
      id: 'board_composition',
      label: 'Board Composition',
      number: 10,
      fields: [
        { id: 'board_total', label: 'Total Members', letterIndex: 'a' },
        { id: 'board_female', label: 'Female Members', letterIndex: 'b' },
        { id: 'board_independent', label: 'Independent Members', letterIndex: 'c' },
      ],
    },
    {
      id: 'compensation',
      label: 'Compensation',
      number: 11,
      fields: [
        { id: 'avg_cxo_compensation', label: 'Average CXO Compensation', letterIndex: 'a' },
        { id: 'avg_employee_comp', label: 'Average Employee Compensation', letterIndex: 'b' },
      ],
    },
  ],
};

// Sourcing & Fulfillment - Quarterly (matches SourcingFulfilmentTable.tsx)
const sourcingFulfillmentMapping: FeatureFieldMapping = {
  featureKey: 'sourcingFulfillment',
  featureLabel: 'Sourcing & Fulfillment',
  kpis: [
    {
      id: 'suppliers_vendors',
      label: 'Suppliers or Vendors',
      number: 1,
      fields: [
        { id: 'msme_supplier_percentage', label: '% of spend on MSME suppliers', letterIndex: 'a' },
      ],
    },
    {
      id: 'vendor_mis',
      label: 'Vendor MIS',
      number: 2,
      fields: [
        { id: 'input_materials_num_vendors', label: 'Input Materials — Vendors Count', letterIndex: 'a1' },
        { id: 'input_materials_pct_international', label: 'Input Materials — % International', letterIndex: 'a2' },
        { id: 'input_materials_size', label: 'Input Materials — Nature of Business', letterIndex: 'a3' },
        { id: 'input_materials_dei_factors', label: 'Input Materials — DEI Factors', letterIndex: 'a4' },
        { id: 'manufacturing_num_vendors', label: 'Manufacturing — Vendors Count', letterIndex: 'b1' },
        { id: 'manufacturing_pct_international', label: 'Manufacturing — % International', letterIndex: 'b2' },
        { id: 'manufacturing_size', label: 'Manufacturing — Nature of Business', letterIndex: 'b3' },
        { id: 'manufacturing_dei_factors', label: 'Manufacturing — DEI Factors', letterIndex: 'b4' },
        { id: 'packaging_num_vendors', label: 'Packaging — Vendors Count', letterIndex: 'c1' },
        { id: 'packaging_pct_international', label: 'Packaging — % International', letterIndex: 'c2' },
        { id: 'packaging_size', label: 'Packaging — Nature of Business', letterIndex: 'c3' },
        { id: 'packaging_dei_factors', label: 'Packaging — DEI Factors', letterIndex: 'c4' },
        { id: 'logistics_warehousing_num_vendors', label: 'Logistics & Warehousing — Vendors Count', letterIndex: 'd1' },
        { id: 'logistics_warehousing_pct_international', label: 'Logistics & Warehousing — % International', letterIndex: 'd2' },
        { id: 'logistics_warehousing_size', label: 'Logistics & Warehousing — Nature of Business', letterIndex: 'd3' },
        { id: 'logistics_warehousing_dei_factors', label: 'Logistics & Warehousing — DEI Factors', letterIndex: 'd4' },
        { id: 'stores_clinics_num_vendors', label: 'Stores / Clinics — Vendors Count', letterIndex: 'e1' },
        { id: 'stores_clinics_pct_international', label: 'Stores / Clinics — % International', letterIndex: 'e2' },
        { id: 'stores_clinics_size', label: 'Stores / Clinics — Nature of Business', letterIndex: 'e3' },
        { id: 'stores_clinics_dei_factors', label: 'Stores / Clinics — DEI Factors', letterIndex: 'e4' },
      ],
    },
    {
      id: 'logistics_carbon',
      label: 'Logistics Optimization & Carbon Emissions',
      number: 3,
      excludeFromProgress: true,
      fields: [
        { id: 'logistics_carbon_initiatives', label: 'Initiatives Description', letterIndex: 'a' },
      ],
    },
    {
      id: 'vendor_practices',
      label: 'Vendor Selection & Management Practices',
      number: 4,
      excludeFromProgress: true,
      fields: [
        { id: 'vendor_practices_description', label: 'Practices Description', letterIndex: 'a' },
        { id: 'vendor_practices_weblinks', label: 'Supporting Weblinks', letterIndex: 'b' },
      ],
    },
  ],
};

// Primary & Secondary Packaging - Quarterly (matches FoodBPCNutraPackagingBasic + Detailed)
const primarySecondaryPackagingMapping: FeatureFieldMapping = {
  featureKey: 'primarySecondaryPackaging',
  featureLabel: 'Primary & Secondary Packaging',
  kpis: [
    {
      id: 'approach_vision',
      label: 'Approach & Vision',
      number: 1,
      excludeFromProgress: true,
      fields: [
        { id: 'current_approach', label: 'Current Approach', letterIndex: 'a' },
        { id: 'vision_plans', label: 'Vision & Plans', letterIndex: 'b' },
      ],
    },
    {
      id: 'total_packaging',
      label: 'Total Packaging',
      number: 2,
      fields: [
        { id: 'total_material_used', label: 'Total Material Used (MT)', letterIndex: 'a' },
        { id: 'total_material_recycled', label: 'Total Material Recycled (MT)', letterIndex: 'b' },
      ],
    },
    {
      id: 'compliance',
      label: 'Compliance Details',
      number: 3,
      fields: [
        { id: 'epr_targets_cpcb', label: 'EPR Targets (CPCB)', letterIndex: 'a' },
        { id: 'epr_compliance_pct', label: 'Compliance to EPR (%)', letterIndex: 'b' },
        { id: 'voluntary_plastic_neutrality', label: 'Voluntary Plastic Neutrality', letterIndex: 'c' },
        { id: 'epr_partner_name', label: 'EPR Partner Name', letterIndex: 'd' },
        { id: 'waste_expenditure', label: 'Waste Expenditure (INR Cr)', letterIndex: 'e' },
      ],
    },
    {
      id: 'primary_packaging',
      label: 'Primary Packaging',
      number: 4,
      fields: [
        { id: 'primary_total_material', label: 'Total Primary Material (MT)', letterIndex: 'a' },
        { id: 'primary_plastic_virgin', label: 'Plastic (Virgin) (MT)', letterIndex: 'b' },
        { id: 'primary_plastic_recycled', label: 'Plastic (Recycled) (MT)', letterIndex: 'c' },
        { id: 'primary_paper_virgin', label: 'Paper (Virgin) (MT)', letterIndex: 'd' },
        { id: 'primary_paper_recycled', label: 'Paper (Recycled) (MT)', letterIndex: 'e' },
        { id: 'primary_metal', label: 'Metal (MT)', letterIndex: 'f' },
        { id: 'primary_glass', label: 'Glass (MT)', letterIndex: 'g' },
        { id: 'primary_plant_based', label: 'Plant-Based (MT)', letterIndex: 'h' },
        { id: 'primary_others', label: 'Others (MT)', letterIndex: 'i' },
        { id: 'primary_mono_materials', label: 'Recyclable Packaging (%)', letterIndex: 'j' },
        { id: 'primary_multi_layered', label: 'Non-Recyclable Packaging (%)', letterIndex: 'k' },
      ],
    },
    {
      id: 'secondary_packaging',
      label: 'Secondary Packaging',
      number: 5,
      fields: [
        { id: 'secondary_total_material', label: 'Total Secondary Material (MT)', letterIndex: 'a' },
        { id: 'secondary_plastic_virgin', label: 'Plastic (Virgin) (MT)', letterIndex: 'b' },
        { id: 'secondary_plastic_recycled', label: 'Plastic (Recycled) (MT)', letterIndex: 'c' },
        { id: 'secondary_paper_virgin', label: 'Paper (Virgin) (MT)', letterIndex: 'd' },
        { id: 'secondary_paper_recycled', label: 'Paper (Recycled) (MT)', letterIndex: 'e' },
        { id: 'secondary_metal', label: 'Metal (MT)', letterIndex: 'f' },
        { id: 'secondary_glass', label: 'Glass (MT)', letterIndex: 'g' },
        { id: 'secondary_plant_based', label: 'Plant-Based (MT)', letterIndex: 'h' },
        { id: 'secondary_others', label: 'Others (MT)', letterIndex: 'i' },
        { id: 'secondary_mono_materials', label: 'Recyclable Packaging (%)', letterIndex: 'j' },
        { id: 'secondary_multi_layered', label: 'Non-Recyclable Packaging (%)', letterIndex: 'k' },
      ],
    },
  ],
};

// Fashion Materials & Packaging - Quarterly (matches FashionMaterialsTable.tsx)
const fashionMaterialsMapping: FeatureFieldMapping = {
  featureKey: 'fashionMaterials',
  featureLabel: 'Materials & Packaging (Fashion)',
  kpis: [
    {
      id: 'approach_vision',
      label: 'Approach & Vision',
      number: 1,
      excludeFromProgress: true,
      fields: [
        { id: 'materials_approach_vision', label: 'Materials Approach & Vision', letterIndex: 'a' },
        { id: 'materials_vision_plans', label: 'Vision & Plans', letterIndex: 'b' },
      ],
    },
    {
      id: 'materials_overview',
      label: 'Total Amount of Materials Used',
      number: 2,
      fields: [
        { id: 'total_materials_mt', label: 'Total Materials Used (meters)', letterIndex: 'a' },
        { id: 'sustainable_materials_pct', label: 'Sustainable Materials (%)', letterIndex: 'b' },
      ],
    },
    {
      id: 'recyclability_textiles',
      label: 'Recyclability of Textile Materials',
      number: 3,
      fields: [
        { id: 'recyclable_materials_pct', label: 'Recyclable Materials (%)', letterIndex: 'a' },
        { id: 'non_recyclable_materials_pct', label: 'Non-Recyclable (%)', letterIndex: 'b' },
      ],
    },
    {
      id: 'material_types',
      label: 'Type of Textile Materials Sourced',
      number: 4,
      fields: [
        { id: 'material_cotton_mt', label: 'Cotton (meters)', letterIndex: 'a' },
        { id: 'material_polyester_mt', label: 'Polyester (meters)', letterIndex: 'b' },
        { id: 'material_nylon_mt', label: 'Nylon (meters)', letterIndex: 'c' },
        { id: 'material_wool_mt', label: 'Wool (meters)', letterIndex: 'd' },
        { id: 'material_silk_mt', label: 'Silk (meters)', letterIndex: 'e' },
        { id: 'material_linen_mt', label: 'Linen (meters)', letterIndex: 'f' },
        { id: 'material_viscose_mt', label: 'Viscose/Rayon (meters)', letterIndex: 'g' },
        { id: 'material_elastane_mt', label: 'Elastane/Spandex (meters)', letterIndex: 'h' },
        { id: 'material_other_mt', label: 'Other (meters)', letterIndex: 'i' },
      ],
    },
    {
      id: 'warehouse_packaging',
      label: 'Warehouse Packaging',
      number: 5,
      excludeFromProgress: true,
      fields: [
        { id: 'warehouse_pkg_cardboard_mt', label: 'Cardboard (MT)', letterIndex: 'a' },
        { id: 'packaging_reuse_note', label: 'Reuse Note', letterIndex: 'b' },
      ],
    },
    {
      id: 'primary_packaging',
      label: 'Primary Packaging',
      number: 6,
      excludeFromProgress: true,
      fields: [
        { id: 'primary_pkg_cardboard_mt', label: 'Cardboard (MT)', letterIndex: 'a' },
        { id: 'primary_pkg_paper_mt', label: 'Paper (MT)', letterIndex: 'b' },
        { id: 'primary_pkg_plastic_recyclable_mt', label: 'Plastic Recyclable (MT)', letterIndex: 'c' },
      ],
    },
    {
      id: 'epr_compliance',
      label: 'Compliance Details',
      number: 7,
      fields: [
        { id: 'epr_target', label: 'EPR Targets (MT)', letterIndex: 'a' },
        { id: 'epr_compliance_pct', label: 'Compliance (%)', letterIndex: 'b' },
        { id: 'waste_expenditure', label: 'Waste Expenditure (INR Cr)', letterIndex: 'c' },
      ],
    },
    {
      id: 'secondary_packaging',
      label: 'Secondary Packaging',
      number: 8,
      excludeFromProgress: true,
      fields: [
        { id: 'secondary_pkg_cardboard_mt', label: 'Cardboard (MT)', letterIndex: 'a' },
        { id: 'secondary_pkg_paper_mt', label: 'Paper (MT)', letterIndex: 'b' },
        { id: 'secondary_pkg_plastic_recyclable_mt', label: 'Plastic Recyclable (MT)', letterIndex: 'c' },
      ],
    },
  ],
};

// Incidents & Grievances - Quarterly (matches IncidentsTable.tsx + GrievancesTable.tsx)
const incidentLogMapping: FeatureFieldMapping = {
  featureKey: 'incidentLog',
  featureLabel: 'Incidents & Grievances',
  kpis: [
    {
      id: 'posh',
      label: 'PoSH',
      number: 1,
      fields: [
        { id: 'cases', label: 'Number of Cases', letterIndex: 'a' },
        { id: 'open_cases', label: 'Cases Open/Unresolved', letterIndex: 'b' },
        { id: 'impact', label: 'Impact on Business', letterIndex: 'c' },
      ],
    },
    {
      id: 'supplier_vendor',
      label: 'Supplier or Vendor Issues',
      number: 2,
      fields: [
        { id: 'cases', label: 'Number of Cases', letterIndex: 'a' },
        { id: 'open_cases', label: 'Cases Open/Unresolved', letterIndex: 'b' },
        { id: 'impact', label: 'Impact on Business', letterIndex: 'c' },
      ],
    },
    {
      id: 'customer_grievance',
      label: 'Customer Grievance',
      number: 3,
      fields: [
        { id: 'cases', label: 'Number of Cases', letterIndex: 'a' },
        { id: 'open_cases', label: 'Cases Open/Unresolved', letterIndex: 'b' },
        { id: 'impact', label: 'Impact on Business', letterIndex: 'c' },
      ],
    },
    {
      id: 'employee_grievance',
      label: 'Employee Grievance',
      number: 4,
      fields: [
        { id: 'cases', label: 'Number of Cases', letterIndex: 'a' },
        { id: 'open_cases', label: 'Cases Open/Unresolved', letterIndex: 'b' },
        { id: 'impact', label: 'Impact on Business', letterIndex: 'c' },
      ],
    },
    {
      id: 'environmental',
      label: 'Environmental Incidents',
      number: 5,
      fields: [
        { id: 'cases', label: 'Number of Cases', letterIndex: 'a' },
        { id: 'open_cases', label: 'Cases Open/Unresolved', letterIndex: 'b' },
        { id: 'impact', label: 'Impact on Business', letterIndex: 'c' },
      ],
    },
    {
      id: 'health_safety',
      label: 'Health & Safety Incidents',
      number: 6,
      fields: [
        { id: 'cases', label: 'Number of Cases', letterIndex: 'a' },
        { id: 'open_cases', label: 'Cases Open/Unresolved', letterIndex: 'b' },
        { id: 'impact', label: 'Impact on Business', letterIndex: 'c' },
      ],
    },
    {
      id: 'security_data_privacy',
      label: 'Security Incident (Data & Privacy Breach)',
      number: 7,
      fields: [
        { id: 'cases', label: 'Number of Cases', letterIndex: 'a' },
        { id: 'open_cases', label: 'Cases Open/Unresolved', letterIndex: 'b' },
        { id: 'impact', label: 'Impact on Business', letterIndex: 'c' },
      ],
    },
    {
      id: 'negative_media',
      label: 'Negative Media Cases',
      number: 8,
      fields: [
        { id: 'cases', label: 'Number of Cases', letterIndex: 'a' },
        { id: 'open_cases', label: 'Cases Open/Unresolved', letterIndex: 'b' },
        { id: 'impact', label: 'Impact on Business', letterIndex: 'c' },
      ],
    },
    {
      id: 'anti_bribery_corruption',
      label: 'Anti-bribery & corruption',
      number: 9,
      fields: [
        { id: 'cases', label: 'Number of Cases', letterIndex: 'a' },
        { id: 'open_cases', label: 'Cases Open/Unresolved', letterIndex: 'b' },
        { id: 'impact', label: 'Impact on Business', letterIndex: 'c' },
      ],
    },
    {
      id: 'other_regulatory',
      label: 'Other regulatory fines or legal liabilities',
      number: 10,
      fields: [
        { id: 'cases', label: 'Number of Cases', letterIndex: 'a' },
        { id: 'open_cases', label: 'Cases Open/Unresolved', letterIndex: 'b' },
        { id: 'impact', label: 'Impact on Business', letterIndex: 'c' },
      ],
    },
    {
      id: 'grievances',
      label: 'Do you have any grievances logged?',
      number: 11,
      fields: [
        { id: 'has_grievances', label: 'Yes/No', letterIndex: 'a' },
        { id: 'grievances_list', label: 'Grievance Details', letterIndex: 'b' },
      ],
    },
  ],
};

// Awards & Recognitions - Quarterly (matches ProductServiceCertificationsTable.tsx)
const awardsMapping: FeatureFieldMapping = {
  featureKey: 'productServiceCertifications',
  featureLabel: 'Awards & Recognitions',
  kpis: [
    {
      id: 'awards',
      label: 'Awards and Recognitions',
      number: 1,
      fields: [
        { id: 'founder_awards_list', label: 'Award Details', letterIndex: 'a' },
      ],
    },
    {
      id: 'media_mentions',
      label: 'Significant Media Mentions',
      number: 2,
      fields: [
        { id: 'media_mentions_list', label: 'Media Mention Details', letterIndex: 'a' },
      ],
    },
    {
      id: 'other_initiatives',
      label: 'Other Initiatives',
      number: 3,
      fields: [
        { id: 'other_initiatives_list', label: 'Initiative Details', letterIndex: 'a' },
      ],
    },
  ],
};

// Healthcare - Quarterly
const healthCareMapping: FeatureFieldMapping = {
  featureKey: 'healthCare',
  featureLabel: 'Healthcare',
  kpis: [
    {
      id: 'consultations',
      label: 'Doctor Consultations/Patient Screenings',
      number: 1,
      fields: [
        { id: 'value', label: 'Number', letterIndex: 'a' },
      ],
    },
    {
      id: 'products_services',
      label: 'Healthcare Products/Services Offered',
      number: 2,
      fields: [
        { id: 'value', label: 'Number', letterIndex: 'a' },
      ],
    },
    {
      id: 'diseases_addressed',
      label: 'Diseases/Conditions Addressed',
      number: 3,
      excludeFromProgress: true,
      fields: [
        { id: 'value', label: 'Description', letterIndex: 'a' },
      ],
    },
  ],
};

// ============================================================================
// ANNUAL FEATURES
// ============================================================================

// Operations - Annual (matches OperationsTable.tsx)
const operationsMapping: FeatureFieldMapping = {
  featureKey: 'operations',
  featureLabel: 'Operations',
  kpis: [
    {
      id: 'msme_classification',
      label: 'Udhyam/MSME Certification classification for the year',
      number: 1,
      fields: [
        { id: 'classification', label: 'Classification', letterIndex: 'a' },
      ],
    },
    {
      id: 'rented_owned_corporate_office',
      label: 'Rented/Owned Corporate Office',
      number: 2,
      fields: [
        { id: 'count', label: 'Count', letterIndex: 'a' },
      ],
    },
    {
      id: 'coworking_corporate_office',
      label: 'Co-working corporate office',
      number: 3,
      fields: [
        { id: 'count', label: 'Count', letterIndex: 'a' },
      ],
    },
    {
      id: 'owned_manufacturing_units',
      label: 'Owned manufacturing/factory units',
      number: 4,
      fields: [
        { id: 'count', label: 'Count', letterIndex: 'a' },
      ],
    },
    {
      id: 'third_party_manufacturing',
      label: 'Third party manufacturing units',
      number: 5,
      fields: [
        { id: 'count', label: 'Count', letterIndex: 'a' },
      ],
    },
    {
      id: 'owned_warehouses',
      label: 'Owned warehouses',
      number: 6,
      fields: [
        { id: 'count', label: 'Count', letterIndex: 'a' },
      ],
    },
    {
      id: 'third_party_logistics',
      label: 'Third party logistics providers including warehouses',
      number: 7,
      fields: [
        { id: 'count', label: 'Count', letterIndex: 'a' },
      ],
    },
    {
      id: 'coco_stores',
      label: 'Company owned Company Operated (COCO) stores',
      number: 8,
      fields: [
        { id: 'count', label: 'Count', letterIndex: 'a' },
      ],
    },
    {
      id: 'foco_stores',
      label: 'Franchisee owned Company Operated (FOCO) stores',
      number: 9,
      fields: [
        { id: 'count', label: 'Count', letterIndex: 'a' },
      ],
    },
  ],
};

// Certifications - Annual (matches CertificationsTable.tsx)
const certificationsMapping: FeatureFieldMapping = {
  featureKey: 'certifications',
  featureLabel: 'Product/Service Certifications',
  kpis: [
    {
      id: 'ingredient',
      label: 'Ingredient Certifications',
      number: 1,
      fields: [
        { id: 'self_number', label: 'Self - Number', letterIndex: 'a' },
        { id: 'self_names', label: 'Self - Names', letterIndex: 'b' },
        { id: 'self_validity', label: 'Self - Validity', letterIndex: 'c' },
        { id: 'supplier_number', label: 'Supplier - Number', letterIndex: 'd' },
        { id: 'supplier_names', label: 'Supplier - Names', letterIndex: 'e' },
        { id: 'supplier_validity', label: 'Supplier - Validity', letterIndex: 'f' },
      ],
    },
    {
      id: 'packaging',
      label: 'Packaging Certifications',
      number: 2,
      fields: [
        { id: 'self_number', label: 'Self - Number', letterIndex: 'a' },
        { id: 'self_names', label: 'Self - Names', letterIndex: 'b' },
        { id: 'self_validity', label: 'Self - Validity', letterIndex: 'c' },
        { id: 'supplier_number', label: 'Supplier - Number', letterIndex: 'd' },
        { id: 'supplier_names', label: 'Supplier - Names', letterIndex: 'e' },
        { id: 'supplier_validity', label: 'Supplier - Validity', letterIndex: 'f' },
      ],
    },
    {
      id: 'energy',
      label: 'Energy Certifications',
      number: 3,
      fields: [
        { id: 'self_number', label: 'Self - Number', letterIndex: 'a' },
        { id: 'self_names', label: 'Self - Names', letterIndex: 'b' },
        { id: 'self_validity', label: 'Self - Validity', letterIndex: 'c' },
        { id: 'supplier_number', label: 'Supplier - Number', letterIndex: 'd' },
        { id: 'supplier_names', label: 'Supplier - Names', letterIndex: 'e' },
        { id: 'supplier_validity', label: 'Supplier - Validity', letterIndex: 'f' },
      ],
    },
    {
      id: 'production',
      label: 'Production Certifications',
      number: 4,
      fields: [
        { id: 'self_number', label: 'Self - Number', letterIndex: 'a' },
        { id: 'self_names', label: 'Self - Names', letterIndex: 'b' },
        { id: 'self_validity', label: 'Self - Validity', letterIndex: 'c' },
        { id: 'supplier_number', label: 'Supplier - Number', letterIndex: 'd' },
        { id: 'supplier_names', label: 'Supplier - Names', letterIndex: 'e' },
        { id: 'supplier_validity', label: 'Supplier - Validity', letterIndex: 'f' },
      ],
    },
    {
      id: 'quality',
      label: 'Quality Certifications',
      number: 5,
      fields: [
        { id: 'self_number', label: 'Self - Number', letterIndex: 'a' },
        { id: 'self_names', label: 'Self - Names', letterIndex: 'b' },
        { id: 'self_validity', label: 'Self - Validity', letterIndex: 'c' },
        { id: 'supplier_number', label: 'Supplier - Number', letterIndex: 'd' },
        { id: 'supplier_names', label: 'Supplier - Names', letterIndex: 'e' },
        { id: 'supplier_validity', label: 'Supplier - Validity', letterIndex: 'f' },
      ],
    },
    {
      id: 'company_standards',
      label: 'Company Standards',
      number: 6,
      fields: [
        { id: 'self_number', label: 'Self - Number', letterIndex: 'a' },
        { id: 'self_names', label: 'Self - Names', letterIndex: 'b' },
        { id: 'self_validity', label: 'Self - Validity', letterIndex: 'c' },
        { id: 'supplier_number', label: 'Supplier - Number', letterIndex: 'd' },
        { id: 'supplier_names', label: 'Supplier - Names', letterIndex: 'e' },
        { id: 'supplier_validity', label: 'Supplier - Validity', letterIndex: 'f' },
      ],
    },
    {
      id: 'patents',
      label: 'No. of patents/IPs',
      number: 7,
      fields: [
        { id: 'granted', label: 'Granted', letterIndex: 'a' },
        { id: 'filed', label: 'Filed', letterIndex: 'b' },
      ],
    },
  ],
};

// Governance Policies - Annual (matches GovernancePoliciesTable.tsx)
const governancePoliciesMapping: FeatureFieldMapping = {
  featureKey: 'governancePolicies',
  featureLabel: 'Governance Policies',
  kpis: [
    {
      id: 'posh',
      label: 'PoSH (Prevention of Sexual Harassment)',
      number: 1,
      fields: [
        { id: 'in_place', label: 'Policy In Place', letterIndex: 'a' },
        { id: 'training', label: 'Employee Training', letterIndex: 'b' },
        { id: 'last_update', label: 'Last Update (MM/YY)', letterIndex: 'c' },
      ],
    },
    {
      id: 'code_of_conduct',
      label: 'Code of Conduct',
      number: 2,
      fields: [
        { id: 'in_place', label: 'Policy In Place', letterIndex: 'a' },
        { id: 'training', label: 'Employee Training', letterIndex: 'b' },
        { id: 'last_update', label: 'Last Update (MM/YY)', letterIndex: 'c' },
      ],
    },
    {
      id: 'supplier_code_of_conduct',
      label: 'Supplier Code of Conduct',
      number: 3,
      fields: [
        { id: 'in_place', label: 'Policy In Place', letterIndex: 'a' },
        { id: 'training', label: 'Employee Training', letterIndex: 'b' },
        { id: 'last_update', label: 'Last Update (MM/YY)', letterIndex: 'c' },
      ],
    },
    {
      id: 'health_and_safety',
      label: 'Health and Safety',
      number: 4,
      fields: [
        { id: 'in_place', label: 'Policy In Place', letterIndex: 'a' },
        { id: 'training', label: 'Employee Training', letterIndex: 'b' },
        { id: 'last_update', label: 'Last Update (MM/YY)', letterIndex: 'c' },
      ],
    },
    {
      id: 'dei',
      label: 'Diversity, Equity and Inclusion',
      number: 5,
      fields: [
        { id: 'in_place', label: 'Policy In Place', letterIndex: 'a' },
        { id: 'training', label: 'Employee Training', letterIndex: 'b' },
        { id: 'last_update', label: 'Last Update (MM/YY)', letterIndex: 'c' },
      ],
    },
    {
      id: 'hr',
      label: 'HR Policy',
      number: 6,
      fields: [
        { id: 'in_place', label: 'Policy In Place', letterIndex: 'a' },
        { id: 'training', label: 'Employee Training', letterIndex: 'b' },
        { id: 'last_update', label: 'Last Update (MM/YY)', letterIndex: 'c' },
      ],
    },
    {
      id: 'human_rights',
      label: 'Human Rights',
      number: 7,
      fields: [
        { id: 'in_place', label: 'Policy In Place', letterIndex: 'a' },
        { id: 'training', label: 'Employee Training', letterIndex: 'b' },
        { id: 'last_update', label: 'Last Update (MM/YY)', letterIndex: 'c' },
      ],
    },
    {
      id: 'esg',
      label: 'ESG Policy',
      number: 8,
      fields: [
        { id: 'in_place', label: 'Policy In Place', letterIndex: 'a' },
        { id: 'training', label: 'Employee Training', letterIndex: 'b' },
        { id: 'last_update', label: 'Last Update (MM/YY)', letterIndex: 'c' },
      ],
    },
    {
      id: 'environment',
      label: 'Environment Policy',
      number: 9,
      fields: [
        { id: 'in_place', label: 'Policy In Place', letterIndex: 'a' },
        { id: 'training', label: 'Employee Training', letterIndex: 'b' },
        { id: 'last_update', label: 'Last Update (MM/YY)', letterIndex: 'c' },
      ],
    },
    {
      id: 'grievance_internal',
      label: 'Grievance Redressal (Internal)',
      number: 10,
      fields: [
        { id: 'in_place', label: 'Policy In Place', letterIndex: 'a' },
        { id: 'training', label: 'Employee Training', letterIndex: 'b' },
        { id: 'last_update', label: 'Last Update (MM/YY)', letterIndex: 'c' },
      ],
    },
    {
      id: 'grievance_external',
      label: 'Grievance Redressal (External)',
      number: 11,
      fields: [
        { id: 'in_place', label: 'Policy In Place', letterIndex: 'a' },
        { id: 'training', label: 'Employee Training', letterIndex: 'b' },
        { id: 'last_update', label: 'Last Update (MM/YY)', letterIndex: 'c' },
      ],
    },
    {
      id: 'data_protection',
      label: 'Data Protection and Cyber Security',
      number: 12,
      fields: [
        { id: 'in_place', label: 'Policy In Place', letterIndex: 'a' },
        { id: 'training', label: 'Employee Training', letterIndex: 'b' },
        { id: 'last_update', label: 'Last Update (MM/YY)', letterIndex: 'c' },
      ],
    },
  ],
};

// Water Management - Annual (facility-based, numbered 1-6)
const waterManagementMapping: FeatureFieldMapping = {
  featureKey: 'waterManagement',
  featureLabel: 'Water Management',
  kpis: [
    {
      id: 'office',
      label: 'Office',
      number: 1,
      fields: [
        { id: 'water_consumed', label: 'Water Consumed (KL)', letterIndex: 'a' },
        { id: 'fresh_water_pct', label: 'Fresh Water (%)', letterIndex: 'b' },
        { id: 'recycled_pct', label: 'Recycled (%)', letterIndex: 'c' },
        { id: 'rainwater_pct', label: 'Rainwater (%)', letterIndex: 'd' },
      ],
    },
    {
      id: 'stores_coco',
      label: 'Stores (COCO)',
      number: 2,
      fields: [
        { id: 'water_consumed', label: 'Water Consumed (KL)', letterIndex: 'a' },
        { id: 'fresh_water_pct', label: 'Fresh Water (%)', letterIndex: 'b' },
        { id: 'recycled_pct', label: 'Recycled (%)', letterIndex: 'c' },
        { id: 'rainwater_pct', label: 'Rainwater (%)', letterIndex: 'd' },
      ],
    },
    {
      id: 'warehouses',
      label: 'Warehouses',
      number: 3,
      fields: [
        { id: 'water_consumed', label: 'Water Consumed (KL)', letterIndex: 'a' },
        { id: 'fresh_water_pct', label: 'Fresh Water (%)', letterIndex: 'b' },
        { id: 'recycled_pct', label: 'Recycled (%)', letterIndex: 'c' },
        { id: 'rainwater_pct', label: 'Rainwater (%)', letterIndex: 'd' },
      ],
    },
    {
      id: 'manufacturing',
      label: 'Manufacturing / Production',
      number: 4,
      fields: [
        { id: 'water_consumed', label: 'Water Consumed (KL)', letterIndex: 'a' },
        { id: 'fresh_water_pct', label: 'Fresh Water (%)', letterIndex: 'b' },
        { id: 'recycled_pct', label: 'Recycled (%)', letterIndex: 'c' },
        { id: 'rainwater_pct', label: 'Rainwater (%)', letterIndex: 'd' },
      ],
    },
    {
      id: 'data_center',
      label: 'Data Center',
      number: 5,
      fields: [
        { id: 'water_consumed', label: 'Water Consumed (KL)', letterIndex: 'a' },
        { id: 'fresh_water_pct', label: 'Fresh Water (%)', letterIndex: 'b' },
        { id: 'recycled_pct', label: 'Recycled (%)', letterIndex: 'c' },
        { id: 'rainwater_pct', label: 'Rainwater (%)', letterIndex: 'd' },
      ],
    },
    {
      id: 'retail',
      label: 'Retail Outlets',
      number: 6,
      fields: [
        { id: 'water_consumed', label: 'Water Consumed (KL)', letterIndex: 'a' },
        { id: 'fresh_water_pct', label: 'Fresh Water (%)', letterIndex: 'b' },
        { id: 'recycled_pct', label: 'Recycled (%)', letterIndex: 'c' },
        { id: 'rainwater_pct', label: 'Rainwater (%)', letterIndex: 'd' },
      ],
    },
  ],
};

// Energy Management - Annual (facility-based, numbered 1-7)
const energyManagementMapping: FeatureFieldMapping = {
  featureKey: 'energyManagement',
  featureLabel: 'Energy Management',
  kpis: [
    {
      id: 'office',
      label: 'Office',
      number: 1,
      fields: [
        { id: 'energy_consumed', label: 'Energy Consumed (kWh)', letterIndex: 'a' },
        { id: 'renewable_pct', label: '% Renewable', letterIndex: 'b' },
      ],
    },
    {
      id: 'stores_coco',
      label: 'Stores (COCO)',
      number: 2,
      fields: [
        { id: 'energy_consumed', label: 'Energy Consumed (kWh)', letterIndex: 'a' },
        { id: 'renewable_pct', label: '% Renewable', letterIndex: 'b' },
      ],
    },
    {
      id: 'warehouses',
      label: 'Warehouses (Significant Storage)',
      number: 3,
      fields: [
        { id: 'energy_consumed', label: 'Energy Consumed (kWh)', letterIndex: 'a' },
        { id: 'renewable_pct', label: '% Renewable', letterIndex: 'b' },
      ],
    },
    {
      id: 'manufacturing',
      label: 'Manufacturing / Production',
      number: 4,
      fields: [
        { id: 'energy_consumed', label: 'Energy Consumed (kWh)', letterIndex: 'a' },
        { id: 'renewable_pct', label: '% Renewable', letterIndex: 'b' },
      ],
    },
    {
      id: 'data_center',
      label: 'Data Center',
      number: 5,
      fields: [
        { id: 'energy_consumed', label: 'Energy Consumed (kWh)', letterIndex: 'a' },
        { id: 'renewable_pct', label: '% Renewable', letterIndex: 'b' },
      ],
    },
    {
      id: 'retail',
      label: 'Retail Outlets',
      number: 6,
      fields: [
        { id: 'energy_consumed', label: 'Energy Consumed (kWh)', letterIndex: 'a' },
        { id: 'renewable_pct', label: '% Renewable', letterIndex: 'b' },
      ],
    },
    {
      id: 'distribution',
      label: 'Distribution Center',
      number: 7,
      fields: [
        { id: 'energy_consumed', label: 'Energy Consumed (kWh)', letterIndex: 'a' },
        { id: 'renewable_pct', label: '% Renewable', letterIndex: 'b' },
      ],
    },
  ],
};

// Waste Management - Annual (facility-based, matches WasteManagementTable.tsx)
const wasteManagementMapping: FeatureFieldMapping = {
  featureKey: 'wasteManagement',
  featureLabel: 'Waste Management',
  kpis: [
    {
      id: 'office',
      label: 'Office',
      number: 1,
      fields: [
        { id: 'waste_generated', label: 'Waste Generated (MT)', letterIndex: 'a' },
        { id: 'waste_recycled_pct', label: 'Waste Recycled (%)', letterIndex: 'b' },
      ],
    },
    {
      id: 'stores_coco',
      label: 'Stores (COCO)',
      number: 2,
      fields: [
        { id: 'waste_generated', label: 'Waste Generated (MT)', letterIndex: 'a' },
        { id: 'waste_recycled_pct', label: 'Waste Recycled (%)', letterIndex: 'b' },
      ],
    },
    {
      id: 'warehouses',
      label: 'Warehouses',
      number: 3,
      fields: [
        { id: 'waste_generated', label: 'Waste Generated (MT)', letterIndex: 'a' },
        { id: 'waste_recycled_pct', label: 'Waste Recycled (%)', letterIndex: 'b' },
      ],
    },
    {
      id: 'manufacturing',
      label: 'Manufacturing Plant',
      number: 4,
      fields: [
        { id: 'waste_generated', label: 'Waste Generated (MT)', letterIndex: 'a' },
        { id: 'waste_recycled_pct', label: 'Waste Recycled (%)', letterIndex: 'b' },
      ],
    },
    {
      id: 'dark_stores',
      label: 'Dark Stores',
      number: 5,
      fields: [
        { id: 'waste_generated', label: 'Waste Generated (MT)', letterIndex: 'a' },
        { id: 'waste_recycled_pct', label: 'Waste Recycled (%)', letterIndex: 'b' },
      ],
    },
    {
      id: 'distribution',
      label: 'Distribution Center',
      number: 6,
      fields: [
        { id: 'waste_generated', label: 'Waste Generated (MT)', letterIndex: 'a' },
        { id: 'waste_recycled_pct', label: 'Waste Recycled (%)', letterIndex: 'b' },
      ],
    },
  ],
};

// CSR - Annual
const csrMapping: FeatureFieldMapping = {
  featureKey: 'csr',
  featureLabel: 'CSR',
  kpis: [
    {
      id: 'csr_spend',
      label: 'CSR Spend',
      number: 1,
      fields: [
        { id: 'amount', label: 'Amount (₹)', letterIndex: 'a' },
      ],
    },
    {
      id: 'implementation',
      label: 'Program Implementation',
      number: 2,
      fields: [
        { id: 'type', label: 'Implementation Type', letterIndex: 'a' },
      ],
    },
    {
      id: 'initiatives',
      label: 'CSR Initiatives',
      number: 3,
      fields: [
        { id: 'list', label: 'Initiative List', letterIndex: 'a' },
      ],
    },
  ],
};

// SRI - Annual (8 categories matching SRITable.tsx)
const sriMapping: FeatureFieldMapping = {
  featureKey: 'sri',
  featureLabel: 'Social Return on Investment',
  kpis: [
    {
      id: 'beneficiaries',
      label: 'Beneficiaries',
      number: 1,
      fields: [
        { id: 'total_beneficiaries', label: 'Total Beneficiaries', letterIndex: 'a' },
        { id: 'women_beneficiaries', label: 'Women/Girls Supported', letterIndex: 'b' },
        { id: 'msme_status', label: 'MSME Status', letterIndex: 'c' },
        { id: 'sector', label: 'Sector', letterIndex: 'd' },
      ],
    },
    {
      id: 'jobs',
      label: 'Jobs Created',
      number: 2,
      fields: [
        { id: 'total_jobs', label: 'Total Jobs Created', letterIndex: 'a' },
        { id: 'jobs_male', label: 'Jobs for Male', letterIndex: 'b' },
        { id: 'jobs_female', label: 'Jobs for Female', letterIndex: 'c' },
        { id: 'formal_jobs', label: 'Formal Jobs', letterIndex: 'd' },
        { id: 'informal_jobs', label: 'Informal Jobs', letterIndex: 'e' },
      ],
    },
    {
      id: 'enterprise',
      label: 'Enterprise & Emissions',
      number: 3,
      fields: [
        { id: 'women_led', label: 'Women-led Enterprise', letterIndex: 'a' },
        { id: 'co2_scope1', label: 'CO2 Emissions - Scope 1', letterIndex: 'b' },
        { id: 'co2_scope2', label: 'CO2 Emissions - Scope 2', letterIndex: 'c' },
        { id: 'emissions_initiatives', label: 'Emissions Reduction Initiatives', letterIndex: 'd' },
      ],
    },
    {
      id: 'development',
      label: 'Development Indicators',
      number: 4,
      fields: [
        { id: 'states_impacted', label: 'States Impacted', letterIndex: 'a' },
        { id: 'cities_impacted', label: 'Cities Impacted', letterIndex: 'b' },
        { id: 'villages_impacted', label: 'Villages Impacted', letterIndex: 'c' },
        { id: 'aspirational_districts', label: 'Aspirational Districts', letterIndex: 'd' },
      ],
    },
    {
      id: 'training',
      label: 'Training & Safety',
      number: 5,
      fields: [
        { id: 'vocational_training', label: 'Vocational Training', letterIndex: 'a' },
        { id: 'safety_sessions', label: 'Safety Sessions', letterIndex: 'b' },
        { id: 'ohs_coverage', label: 'OHS Coverage (%)', letterIndex: 'c' },
      ],
    },
    {
      id: 'social',
      label: 'Social Security',
      number: 6,
      fields: [
        { id: 'grievances_resolved', label: 'Grievances Resolved', letterIndex: 'a' },
        { id: 'social_security_coverage', label: 'Social Security Coverage (%)', letterIndex: 'b' },
        { id: 'wage_increase', label: 'Wage Increase (%)', letterIndex: 'c' },
      ],
    },
    {
      id: 'testimonials',
      label: 'Testimonials & Other',
      number: 7,
      excludeFromProgress: true,
      fields: [
        { id: 'testimonials', label: 'Testimonials', letterIndex: 'a' },
        { id: 'other_impact', label: 'Other Impact Metrics', letterIndex: 'b' },
      ],
    },
    {
      id: 'progress',
      label: 'Progress & Milestones',
      number: 8,
      fields: [
        { id: 'stores_locations', label: 'Stores/Locations', letterIndex: 'a' },
        { id: 'product_lines', label: 'Product Lines/SKUs', letterIndex: 'b' },
        { id: 'business_model', label: 'Business Model', letterIndex: 'c' },
      ],
    },
  ],
};

// External Reporting - Annual (8 categories matching ExternalReportingTable.tsx)
const externalReportingMapping: FeatureFieldMapping = {
  featureKey: 'externalReporting',
  featureLabel: 'External Reporting',
  kpis: [
    {
      id: 'beneficiaries',
      label: 'Beneficiaries',
      number: 1,
      fields: [
        { id: 'details', label: 'Details', letterIndex: 'a' },
      ],
    },
    {
      id: 'jobs_created',
      label: 'Jobs created',
      number: 2,
      fields: [
        { id: 'details', label: 'Details', letterIndex: 'a' },
      ],
    },
    {
      id: 'enterprise_emissions',
      label: 'Enterprise and emissions',
      number: 3,
      fields: [
        { id: 'details', label: 'Details', letterIndex: 'a' },
      ],
    },
    {
      id: 'development_indicators',
      label: 'Development Indicators',
      number: 4,
      fields: [
        { id: 'details', label: 'Details', letterIndex: 'a' },
      ],
    },
    {
      id: 'training_safety',
      label: 'Training and safety',
      number: 5,
      fields: [
        { id: 'details', label: 'Details', letterIndex: 'a' },
      ],
    },
    {
      id: 'social_security',
      label: 'Social security',
      number: 6,
      fields: [
        { id: 'details', label: 'Details', letterIndex: 'a' },
      ],
    },
    {
      id: 'testimonials_other',
      label: 'Testimonials and other',
      number: 7,
      fields: [
        { id: 'details', label: 'Details', letterIndex: 'a' },
      ],
    },
    {
      id: 'progress_milestones',
      label: 'Progress and milestones',
      number: 8,
      fields: [
        { id: 'details', label: 'Details', letterIndex: 'a' },
      ],
    },
  ],
};

// ============================================================================
// EXPORTS
// ============================================================================

// Complete mapping of all features
export const FEATURE_FIELD_MAPPINGS: Record<string, FeatureFieldMapping> = {
  // Quarterly
  businessInformation: businessInformationMapping,
  social: socialMapping,
  sourcingFulfillment: sourcingFulfillmentMapping,
  primarySecondaryPackaging: primarySecondaryPackagingMapping,
  fashionMaterials: fashionMaterialsMapping,
  incidentLog: incidentLogMapping,
  productServiceCertifications: awardsMapping,
  healthCare: healthCareMapping,
  // Annual
  operations: operationsMapping,
  certifications: certificationsMapping,
  governancePolicies: governancePoliciesMapping,
  waterManagement: waterManagementMapping,
  energyManagement: energyManagementMapping,
  wasteManagement: wasteManagementMapping,
  csr: csrMapping,
  sri: sriMapping,
  externalReporting: externalReportingMapping,
};

// Helper function to get feature mapping
export const getFeatureMapping = (featureKey: string): FeatureFieldMapping | undefined => {
  return FEATURE_FIELD_MAPPINGS[featureKey];
};

// Helper function to get all KPIs for a feature
export const getFeatureKPIs = (featureKey: string): KPIDefinition[] => {
  const mapping = FEATURE_FIELD_MAPPINGS[featureKey];
  return mapping?.kpis || [];
};

// Helper function to get all fields for a KPI
export const getKPIFields = (featureKey: string, kpiId: string): FieldDefinition[] => {
  const mapping = FEATURE_FIELD_MAPPINGS[featureKey];
  const kpi = mapping?.kpis.find(k => k.id === kpiId);
  return kpi?.fields || [];
};

// Helper to format KPI dropdown option with number
export const formatKPIOption = (kpi: KPIDefinition): string => {
  return `${kpi.number}. ${kpi.label}`;
};

// Helper to format field dropdown option with reference
export const formatFieldOption = (kpiNumber: number, field: FieldDefinition): string => {
  return `${kpiNumber}${field.letterIndex}. ${field.label}`;
};

// Helper to get full field reference string for display
export const getFullFieldReference = (kpiNumber: number, field: FieldDefinition): string => {
  return `${kpiNumber}${field.letterIndex}`;
};

// ============================================================================
// DB KEY RESOLVER — maps UI field IDs to actual database KPI keys
// ============================================================================

/**
 * Resolves the actual database KPI key for a given feature field.
 * FEATURE_FIELD_MAPPINGS uses shorthand field IDs for UI numbering,
 * but kpi_entries stores values with prefixed keys (e.g. employees_wc_male_fulltime).
 * Returns candidate DB keys in order of preference.
 */
const resolveDbKeyCandidates = (featureKey: string, kpiId: string, fieldId: string): string[] => {
  const candidates: string[] = [fieldId];

  switch (featureKey) {
    case 'businessInformation':
      if (fieldId === 'value') candidates.unshift(kpiId);
      break;

    case 'social': {
      const leadershipKpis = new Set(['clevel_composition', 'board_composition', 'compensation']);
      const prefix = leadershipKpis.has(kpiId) ? 'leadership_' : 'employees_';
      candidates.unshift(`${prefix}${fieldId}`);
      break;
    }

    case 'sourcingFulfillment':
      if (kpiId === 'vendor_mis') candidates.unshift(`vendor_mis_${fieldId}`);
      // msme_supplier_percentage, logistics_carbon_initiatives, vendor_practices_* are direct
      break;

    case 'incidentLog':
      if (kpiId !== 'grievances') candidates.unshift(`incident_${kpiId}_${fieldId}`);
      // has_grievances, grievances_list are direct
      break;

    case 'primarySecondaryPackaging':
      if (kpiId === 'approach_vision') {
        candidates.unshift(`food_pkg_basic_approach_${fieldId}`);
      } else if (kpiId === 'total_packaging') {
        candidates.unshift(`food_pkg_basic_total_${fieldId}`);
      } else if (kpiId === 'compliance') {
        candidates.unshift(`food_pkg_basic_compliance_${fieldId}`);
      } else if (kpiId === 'primary_packaging') {
        candidates.unshift(
          `food_pkg_basic_primary_${fieldId}`,
          `food_pkg_basic_primary_breakup_${fieldId}`,
          `food_pkg_basic_primary_recyclability_${fieldId}`,
        );
      } else if (kpiId === 'secondary_packaging') {
        candidates.unshift(
          `food_pkg_detailed_secondary_${fieldId}`,
          `food_pkg_detailed_secondary_breakup_${fieldId}`,
          `food_pkg_detailed_secondary_recyclability_${fieldId}`,
        );
      }
      break;

    case 'fashionMaterials':
      if (kpiId === 'approach_vision') {
        candidates.unshift(`fashion_materials_${fieldId}`, `fashion_${fieldId}`);
      } else if (kpiId === 'materials_overview') {
        candidates.unshift(`fashion_${fieldId}`);
      } else if (kpiId === 'recyclability_textiles') {
        candidates.unshift(`fashion_${fieldId}`);
      } else if (kpiId === 'material_types') {
        candidates.unshift(`fashion_${fieldId}`);
      } else if (kpiId === 'warehouse_packaging') {
        candidates.unshift(`fashion_${fieldId}`, `fashion_warehouse_pkg_${fieldId.replace('warehouse_pkg_', '')}`);
      } else if (kpiId === 'primary_packaging') {
        candidates.unshift(`fashion_${fieldId}`, `fashion_primary_pkg_${fieldId.replace('primary_pkg_', '')}`);
      } else if (kpiId === 'epr_compliance') {
        candidates.unshift(`fashion_${fieldId}`);
      } else if (kpiId === 'secondary_packaging') {
        candidates.unshift(`fashion_${fieldId}`, `fashion_secondary_pkg_${fieldId.replace('secondary_pkg_', '')}`);
      } else {
        candidates.unshift(`fashion_${fieldId}`);
      }
      break;

    case 'productServiceCertifications':
      // Direct: founder_awards_list, media_mentions_list, other_initiatives_list
      break;

    case 'healthCare':
      if (fieldId === 'value') {
        // Healthcare uses direct DB keys: healthcare_consultations_screenings, healthcare_products_services, healthcare_diseases_addressed
        candidates.unshift(`healthcare_${kpiId}`);
        if (kpiId === 'consultations') candidates.unshift('healthcare_consultations_screenings');
        if (kpiId === 'products_services') candidates.unshift('healthcare_products_services');
        if (kpiId === 'diseases_addressed') candidates.unshift('healthcare_diseases_addressed');
      }
      break;

    case 'operations':
      if (fieldId === 'count' || fieldId === 'classification') {
        candidates.unshift(`operations_${kpiId}_${fieldId}`);
      }
      break;

    case 'certifications':
      candidates.unshift(`cert_${kpiId}_${fieldId}`);
      break;

    case 'governancePolicies':
      candidates.unshift(`policy_${kpiId}_${fieldId}`);
      break;

    case 'waterManagement':
      candidates.unshift(`water_detailed_${kpiId}_${fieldId}`);
      break;

    case 'energyManagement':
      candidates.unshift(`energy_detailed_${kpiId}_${fieldId}`);
      break;

    case 'wasteManagement':
      candidates.unshift(`waste_detailed_${kpiId}_${fieldId}`);
      break;

    case 'csr':
      if (fieldId === 'amount') candidates.unshift('csr_amount_spent');
      else if (fieldId === 'type') candidates.unshift('csr_implementation');
      else if (fieldId === 'list') candidates.unshift('csr_initiatives_list');
      else candidates.unshift(`csr_${fieldId}`);
      break;

    case 'sri':
      candidates.unshift(`sri_${fieldId}_curr`, `sri_${fieldId}_prev`, `sri_${fieldId}`);
      break;

    case 'externalReporting':
      if (fieldId === 'details') candidates.unshift(`ext_${kpiId}`);
      else candidates.unshift(`ext_${kpiId}_${fieldId}`);
      break;
  }

  return candidates;
};

/**
 * Resolve a field's value from a company's KPI map.
 * Tries exact candidate keys first, then falls back to fuzzy suffix matching.
 */
export const resolveFieldValue = (
  kpis: Record<string, string>,
  featureKey: string,
  kpiId: string,
  fieldId: string,
): string => {
  const candidates = resolveDbKeyCandidates(featureKey, kpiId, fieldId);

  // Try each candidate key
  for (const key of candidates) {
    if (key in kpis) return kpis[key] || '';
  }

  // Fuzzy fallback: find key ending with _${fieldId} (skip for generic 'value'/'count'/'details')
  const genericIds = new Set(['value', 'count', 'details', 'classification']);
  if (!genericIds.has(fieldId)) {
    const suffix = `_${fieldId}`;
    for (const key of Object.keys(kpis)) {
      if (key.endsWith(suffix)) return kpis[key] || '';
    }
  }

  return '';
};

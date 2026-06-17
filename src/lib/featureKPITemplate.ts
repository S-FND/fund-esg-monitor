import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

// Feature-specific KPI definitions that match exactly what's shown on each feature page
export interface FeatureKPI {
  key: string;
  name: string;
  unit: string;
  description?: string;
}

// Define KPIs for each feature - these match exactly what's displayed on the page
const FEATURE_KPIS: Record<string, FeatureKPI[]> = {
  businessInformation: [
    { key: 'net_revenue', name: 'Net Revenue', unit: '₹ Cr', description: 'Revenue earned from sales after deducting returns, refunds, discounts, and taxes.' },
    { key: 'revenue_tier2_plus', name: '% of revenue from Tier-2+ markets', unit: '%', description: "Tier-2+ markets refer to Niti Aayog's aspirational districts." },
    { key: 'total_customers_served', name: 'No. of total customers served', unit: 'Number' },
    { key: 'unique_female_customers', name: '% of unique female customers', unit: '%' },
    { key: 'businessInformation_additional_comments', name: 'Additional Comments', unit: 'Text (max 300 words)', description: 'Any additional information about business' },
  ],
  social: [
    // White-Collar Employees
    { key: 'employees_wc_male_fulltime', name: 'White-Collar Employees (Male) - Full-time', unit: 'Number' },
    { key: 'employees_wc_male_contractual', name: 'White-Collar Employees (Male) - Contractual', unit: 'Number' },
    { key: 'employees_wc_male_parttime', name: 'White-Collar Employees (Male) - Part-time', unit: 'Number' },
    { key: 'employees_wc_female_fulltime', name: 'White-Collar Employees (Female) - Full-time', unit: 'Number' },
    { key: 'employees_wc_female_contractual', name: 'White-Collar Employees (Female) - Contractual', unit: 'Number' },
    { key: 'employees_wc_female_parttime', name: 'White-Collar Employees (Female) - Part-time', unit: 'Number' },
    { key: 'employees_wc_wages_male', name: 'White-Collar Gross Wages (Male)', unit: '₹ Cr' },
    { key: 'employees_wc_wages_female', name: 'White-Collar Gross Wages (Female)', unit: '₹ Cr' },
    // Blue-Collar Employees
    { key: 'employees_bc_male_fulltime', name: 'Blue-Collar Employees (Male) - Full-time', unit: 'Number' },
    { key: 'employees_bc_male_contractual', name: 'Blue-Collar Employees (Male) - Contractual', unit: 'Number' },
    { key: 'employees_bc_male_parttime', name: 'Blue-Collar Employees (Male) - Part-time', unit: 'Number' },
    { key: 'employees_bc_female_fulltime', name: 'Blue-Collar Employees (Female) - Full-time', unit: 'Number' },
    { key: 'employees_bc_female_contractual', name: 'Blue-Collar Employees (Female) - Contractual', unit: 'Number' },
    { key: 'employees_bc_female_parttime', name: 'Blue-Collar Employees (Female) - Part-time', unit: 'Number' },
    { key: 'employees_bc_wages_male', name: 'Blue-Collar Gross Wages (Male)', unit: '₹ Cr' },
    { key: 'employees_bc_wages_female', name: 'Blue-Collar Gross Wages (Female)', unit: '₹ Cr' },
    // Other Employee Metrics
    { key: 'employees_enps', name: 'Employee Net Promoter Score (eNPS)', unit: 'Score (-100 to 100)' },
    { key: 'employees_pwd_percentage', name: '% Employees with Disabilities (PwD)', unit: '%' },
    { key: 'employees_attrition_rate', name: 'Attrition Rate', unit: '%' },
    // Leadership - C-Level
    { key: 'leadership_clevel_total', name: 'C-Level - Total Executives', unit: 'Number' },
    { key: 'leadership_clevel_female', name: 'C-Level - Female Executives', unit: 'Number' },
    // Leadership - Board
    { key: 'leadership_board_total', name: 'Board - Total Members', unit: 'Number' },
    { key: 'leadership_board_female', name: 'Board - Female Members', unit: 'Number' },
    { key: 'leadership_board_independent', name: 'Board - Independent Members', unit: 'Number' },
    // Compensation
    { key: 'leadership_avg_cxo_compensation', name: 'Average CXO Compensation', unit: '₹ Cr' },
    { key: 'social_additional_comments', name: 'Additional Comments', unit: 'Text (max 300 words)', description: 'Any additional information about employment & compensation' },
  ],
  incidentLog: [
    // 10 Incident Categories matching IncidentsTable.tsx (fields: _cases, _open_cases, _impact)
    // 1. PoSH
    { key: 'incident_posh_cases', name: 'PoSH - Number of Cases', unit: 'Number' },
    { key: 'incident_posh_open_cases', name: 'PoSH - Cases Open/Unresolved', unit: 'Number' },
    { key: 'incident_posh_impact', name: 'PoSH - Impact on Business', unit: 'High/Medium/Low' },
    // 2. Supplier or Vendor Issues
    { key: 'incident_supplier_vendor_cases', name: 'Supplier/Vendor Issues - Number of Cases', unit: 'Number' },
    { key: 'incident_supplier_vendor_open_cases', name: 'Supplier/Vendor Issues - Cases Open/Unresolved', unit: 'Number' },
    { key: 'incident_supplier_vendor_impact', name: 'Supplier/Vendor Issues - Impact on Business', unit: 'High/Medium/Low' },
    // 3. Customer Grievance
    { key: 'incident_customer_grievance_cases', name: 'Customer Grievance - Number of Cases', unit: 'Number' },
    { key: 'incident_customer_grievance_open_cases', name: 'Customer Grievance - Cases Open/Unresolved', unit: 'Number' },
    { key: 'incident_customer_grievance_impact', name: 'Customer Grievance - Impact on Business', unit: 'High/Medium/Low' },
    // 4. Employee Grievance
    { key: 'incident_employee_grievance_cases', name: 'Employee Grievance - Number of Cases', unit: 'Number' },
    { key: 'incident_employee_grievance_open_cases', name: 'Employee Grievance - Cases Open/Unresolved', unit: 'Number' },
    { key: 'incident_employee_grievance_impact', name: 'Employee Grievance - Impact on Business', unit: 'High/Medium/Low' },
    // 5. Environmental
    { key: 'incident_environmental_cases', name: 'Environmental - Number of Cases', unit: 'Number' },
    { key: 'incident_environmental_open_cases', name: 'Environmental - Cases Open/Unresolved', unit: 'Number' },
    { key: 'incident_environmental_impact', name: 'Environmental - Impact on Business', unit: 'High/Medium/Low' },
    // 6. Health & Safety
    { key: 'incident_health_safety_cases', name: 'Health & Safety - Number of Cases', unit: 'Number' },
    { key: 'incident_health_safety_open_cases', name: 'Health & Safety - Cases Open/Unresolved', unit: 'Number' },
    { key: 'incident_health_safety_impact', name: 'Health & Safety - Impact on Business', unit: 'High/Medium/Low' },
    // 7. Security (Data & Privacy Breach)
    { key: 'incident_security_data_privacy_cases', name: 'Security (Data & Privacy) - Number of Cases', unit: 'Number' },
    { key: 'incident_security_data_privacy_open_cases', name: 'Security (Data & Privacy) - Cases Open/Unresolved', unit: 'Number' },
    { key: 'incident_security_data_privacy_impact', name: 'Security (Data & Privacy) - Impact on Business', unit: 'High/Medium/Low' },
    // 8. Negative Media Cases
    { key: 'incident_negative_media_cases', name: 'Negative Media - Number of Cases', unit: 'Number' },
    { key: 'incident_negative_media_open_cases', name: 'Negative Media - Cases Open/Unresolved', unit: 'Number' },
    { key: 'incident_negative_media_impact', name: 'Negative Media - Impact on Business', unit: 'High/Medium/Low' },
    // 9. Anti-bribery & Corruption
    { key: 'incident_anti_bribery_corruption_cases', name: 'Anti-bribery & Corruption - Number of Cases', unit: 'Number' },
    { key: 'incident_anti_bribery_corruption_open_cases', name: 'Anti-bribery & Corruption - Cases Open/Unresolved', unit: 'Number' },
    { key: 'incident_anti_bribery_corruption_impact', name: 'Anti-bribery & Corruption - Impact on Business', unit: 'High/Medium/Low' },
    // 10. Other Regulatory Fines/Legal Liabilities
    { key: 'incident_other_regulatory_cases', name: 'Other Regulatory Fines - Number of Cases', unit: 'Number' },
    { key: 'incident_other_regulatory_open_cases', name: 'Other Regulatory Fines - Cases Open/Unresolved', unit: 'Number' },
    { key: 'incident_other_regulatory_impact', name: 'Other Regulatory Fines - Impact on Business', unit: 'High/Medium/Low' },
    // KPI #11 - Grievances
    { key: 'has_grievances', name: 'Do you have any grievances logged?', unit: 'Yes/No' },
    { key: 'grievances_list', name: 'Grievance Details', unit: 'JSON/Text' },
    { key: 'incidentLog_additional_comments', name: 'Additional Comments', unit: 'Text (max 300 words)', description: 'Any additional information about incidents & grievances' },
  ],
  sourcingFulfillment: [
    // Supplier/Vendor Section
    { key: 'msme_supplier_percentage', name: 'MSME Supplier Percentage', unit: '%' },
    // Vendor MIS - Input Materials
    { key: 'vendor_mis_input_materials_num_vendors', name: 'Input Materials - Number of Vendors', unit: 'Number/N/A' },
    { key: 'vendor_mis_input_materials_pct_international', name: 'Input Materials - % International', unit: '%' },
    { key: 'vendor_mis_input_materials_size', name: 'Input Materials - Typical Nature of Business', unit: 'Dropdown (MNC/Large, SME, Micro, Informal)' },
    { key: 'vendor_mis_input_materials_dei_factors', name: 'Input Materials - DEI Factors', unit: 'Multi-select (Gender, Low Income, Rural, Others)' },
    // Vendor MIS - Manufacturing
    { key: 'vendor_mis_manufacturing_num_vendors', name: 'Manufacturing - Number of Vendors', unit: 'Number/N/A' },
    { key: 'vendor_mis_manufacturing_pct_international', name: 'Manufacturing - % International', unit: '%' },
    { key: 'vendor_mis_manufacturing_size', name: 'Manufacturing - Typical Nature of Business', unit: 'Dropdown (MNC/Large, SME, Micro, Informal)' },
    { key: 'vendor_mis_manufacturing_dei_factors', name: 'Manufacturing - DEI Factors', unit: 'Multi-select (Gender, Low Income, Rural, Others)' },
    // Vendor MIS - Packaging
    { key: 'vendor_mis_packaging_num_vendors', name: 'Packaging - Number of Vendors', unit: 'Number/N/A' },
    { key: 'vendor_mis_packaging_pct_international', name: 'Packaging - % International', unit: '%' },
    { key: 'vendor_mis_packaging_size', name: 'Packaging - Typical Nature of Business', unit: 'Dropdown (MNC/Large, SME, Micro, Informal)' },
    { key: 'vendor_mis_packaging_dei_factors', name: 'Packaging - DEI Factors', unit: 'Multi-select (Gender, Low Income, Rural, Others)' },
    // Vendor MIS - Logistics & Warehousing
    { key: 'vendor_mis_logistics_warehousing_num_vendors', name: 'Logistics & Warehousing - Number of Vendors', unit: 'Number/N/A' },
    { key: 'vendor_mis_logistics_warehousing_pct_international', name: 'Logistics & Warehousing - % International', unit: '%' },
    { key: 'vendor_mis_logistics_warehousing_size', name: 'Logistics & Warehousing - Typical Nature of Business', unit: 'Dropdown (MNC/Large, SME, Micro, Informal)' },
    { key: 'vendor_mis_logistics_warehousing_dei_factors', name: 'Logistics & Warehousing - DEI Factors', unit: 'Multi-select (Gender, Low Income, Rural, Others)' },
    // Vendor MIS - Stores / Clinics
    { key: 'vendor_mis_stores_clinics_num_vendors', name: 'Stores/Clinics - Number of Vendors', unit: 'Number/N/A' },
    { key: 'vendor_mis_stores_clinics_pct_international', name: 'Stores/Clinics - % International', unit: '%' },
    { key: 'vendor_mis_stores_clinics_size', name: 'Stores/Clinics - Typical Nature of Business', unit: 'Dropdown (MNC/Large, SME, Micro, Informal)' },
    { key: 'vendor_mis_stores_clinics_dei_factors', name: 'Stores/Clinics - DEI Factors', unit: 'Multi-select (Gender, Low Income, Rural, Others)' },
    // Logistics & Carbon Emissions
    { key: 'logistics_carbon_initiatives', name: 'Logistics Optimization & Carbon Emissions Initiatives', unit: 'Text (max 300 words)' },
    // Vendor Selection & Management
    { key: 'vendor_practices_description', name: 'Vendor Selection & Management Practices', unit: 'Text (max 300 words)' },
    { key: 'vendor_practices_weblinks', name: 'Vendor Practices - Supporting Weblinks', unit: 'Text (URLs)' },
    { key: 'sourcingFulfillment_additional_comments', name: 'Additional Comments', unit: 'Text (max 300 words)', description: 'Any additional information about sourcing & fulfillment' },
  ],
  primarySecondaryPackaging: [
    // KPI 1 - Approach & Vision
    { key: 'food_pkg_basic_approach_current_approach', name: 'Approach & Vision - Current approach, policy, challenges, achievements, certifications towards sustainable packaging', unit: 'Text (max 300 words)' },
    { key: 'food_pkg_basic_approach_vision_plans', name: 'Approach & Vision - Vision and plans towards sustainable packaging', unit: 'Text (max 300 words)' },
    
    // KPI 2 - Total Packaging
    { key: 'food_pkg_basic_total_total_material_used', name: 'Total amount of packaging material used', unit: 'MT' },
    { key: 'food_pkg_basic_total_total_material_recycled', name: 'Total amount of packaging material recycled', unit: 'MT' },
    
    // KPI 3 - Compliance Details
    { key: 'food_pkg_basic_compliance_epr_targets_cpcb', name: 'EPR Targets as Defined by CPCB (Target based on last completed FY)', unit: 'MT' },
    { key: 'food_pkg_basic_compliance_epr_compliance_pct', name: 'Compliance to EPR targets defined above', unit: '%' },
    { key: 'food_pkg_basic_compliance_voluntary_plastic_neutrality', name: 'Voluntary Plastic Neutrality Initiatives', unit: '%' },
    { key: 'food_pkg_basic_compliance_epr_partner_name', name: 'Name of EPR/Voluntary Plastic Neutrality/program partner(s)', unit: 'Text' },
    { key: 'food_pkg_basic_compliance_waste_expenditure', name: 'Expenditure incurred to manage waste-related initiatives (For the Quarter)', unit: 'INR Cr' },
    
    // KPI 4 - Primary Packaging
    { key: 'food_pkg_basic_primary_primary_total_material', name: 'Primary Packaging - Total amount of packaging material used', unit: 'MT' },
    // Primary Breakup
    { key: 'food_pkg_basic_primary_breakup_primary_plastic_virgin', name: 'Primary Packaging - Plastic (virgin)', unit: 'MT' },
    { key: 'food_pkg_basic_primary_breakup_primary_plastic_recycled', name: 'Primary Packaging - Plastic (recycled)', unit: 'MT' },
    { key: 'food_pkg_basic_primary_breakup_primary_paper_virgin', name: 'Primary Packaging - Paper (virgin)', unit: 'MT' },
    { key: 'food_pkg_basic_primary_breakup_primary_paper_recycled', name: 'Primary Packaging - Paper (recycled)', unit: 'MT' },
    { key: 'food_pkg_basic_primary_breakup_primary_metal', name: 'Primary Packaging - Metal', unit: 'MT' },
    { key: 'food_pkg_basic_primary_breakup_primary_glass', name: 'Primary Packaging - Glass', unit: 'MT' },
    { key: 'food_pkg_basic_primary_breakup_primary_plant_based', name: 'Primary Packaging - Plant based (Hemp, Seaweed, Bamboo etc.), please specify', unit: 'MT' },
    { key: 'food_pkg_basic_primary_breakup_primary_others', name: 'Primary Packaging - Others, please specify', unit: 'MT' },
    // Primary Recyclability
    { key: 'food_pkg_basic_primary_recyclability_primary_mono_materials', name: 'Primary Packaging - Recyclable', unit: '%' },
    { key: 'food_pkg_basic_primary_recyclability_primary_multi_layered', name: 'Primary Packaging - Non-Recyclable', unit: '%' },
    // Primary Top SKUs
    { key: 'food_pkg_basic_primary_plastics_nature_details', name: 'Primary Packaging - Top 3-5 packaging SKUs (Product|Weight|Type|Recyclability)', unit: 'Text' },
    
    // KPI 5 - Secondary Packaging
    { key: 'food_pkg_detailed_secondary_secondary_total_material', name: 'Secondary Packaging - Total amount of packaging material used', unit: 'MT' },
    // Secondary Breakup
    { key: 'food_pkg_detailed_secondary_breakup_secondary_plastic_virgin', name: 'Secondary Packaging - Plastic (virgin)', unit: 'MT' },
    { key: 'food_pkg_detailed_secondary_breakup_secondary_plastic_recycled', name: 'Secondary Packaging - Plastic (recycled)', unit: 'MT' },
    { key: 'food_pkg_detailed_secondary_breakup_secondary_paper_virgin', name: 'Secondary Packaging - Paper (virgin)', unit: 'MT' },
    { key: 'food_pkg_detailed_secondary_breakup_secondary_paper_recycled', name: 'Secondary Packaging - Paper (recycled)', unit: 'MT' },
    { key: 'food_pkg_detailed_secondary_breakup_secondary_metal', name: 'Secondary Packaging - Metal', unit: 'MT' },
    { key: 'food_pkg_detailed_secondary_breakup_secondary_glass', name: 'Secondary Packaging - Glass', unit: 'MT' },
    { key: 'food_pkg_detailed_secondary_breakup_secondary_plant_based', name: 'Secondary Packaging - Plant based (Hemp, Seaweed, Bamboo etc.), please specify', unit: 'MT' },
    { key: 'food_pkg_detailed_secondary_breakup_secondary_others', name: 'Secondary Packaging - Others, please specify', unit: 'MT' },
    // Secondary Recyclability
    { key: 'food_pkg_detailed_secondary_recyclability_secondary_mono_materials', name: 'Secondary Packaging - Recyclable', unit: '%' },
    { key: 'food_pkg_detailed_secondary_recyclability_secondary_multi_layered', name: 'Secondary Packaging - Non-Recyclable', unit: '%' },
    // Secondary Top SKUs
    { key: 'food_pkg_detailed_secondary_plastics_nature_details', name: 'Secondary Packaging - Top 3-5 packaging SKUs (Product|Weight|Type|Recyclability)', unit: 'Text' },
    
    // Additional Comments
    { key: 'primarySecondaryPackaging_additional_comments', name: 'Additional Comments', unit: 'Text (max 300 words)', description: 'Any additional information about packaging' },
  ],
  fashionMaterials: [
    // KPI 1 - Approach & Vision
    { key: 'fashion_materials_approach_vision', name: 'Approach & Vision - Current approach, policy, challenges, achievements', unit: 'Text (max 300 words)' },
    { key: 'fashion_materials_vision_plans', name: 'Approach & Vision - Vision and plans', unit: 'Text (max 300 words)' },
    // KPI 2 - Total Amount of Materials Used
    { key: 'fashion_total_materials_mt', name: 'Total Materials Used', unit: 'meters' },
    { key: 'fashion_sustainable_materials_pct', name: 'Sustainable Materials (%)', unit: '%' },
    // KPI 3 - Recyclability of Textile Materials
    { key: 'fashion_recyclable_materials_pct', name: 'Recyclable Materials (%)', unit: '%' },
    { key: 'fashion_non_recyclable_materials_pct', name: 'Non-Recyclable Materials (%)', unit: '%' },
    // KPI 4 - Type of Textile Materials Sourced (Value meters, auto-calc %)
    { key: 'fashion_material_cotton_mt', name: 'Textile Type - Cotton - Value', unit: 'meters' },
    { key: 'fashion_material_polyester_mt', name: 'Textile Type - Polyester - Value', unit: 'meters' },
    { key: 'fashion_material_nylon_mt', name: 'Textile Type - Nylon - Value', unit: 'meters' },
    { key: 'fashion_material_wool_mt', name: 'Textile Type - Wool - Value', unit: 'meters' },
    { key: 'fashion_material_silk_mt', name: 'Textile Type - Silk - Value', unit: 'meters' },
    { key: 'fashion_material_linen_mt', name: 'Textile Type - Linen - Value', unit: 'meters' },
    { key: 'fashion_material_viscose_mt', name: 'Textile Type - Viscose/Rayon - Value', unit: 'meters' },
    { key: 'fashion_material_elastane_mt', name: 'Textile Type - Elastane/Spandex - Value', unit: 'meters' },
    { key: 'fashion_material_other_mt', name: 'Textile Type - Other - Value', unit: 'meters' },
    // KPI 5 - Warehouse Packaging (Value MT, auto-calc %)
    { key: 'fashion_warehouse_pkg_cardboard_mt', name: 'Warehouse Packaging - Cardboard - Value', unit: 'MT' },
    { key: 'fashion_warehouse_pkg_paper_mt', name: 'Warehouse Packaging - Paper - Value', unit: 'MT' },
    { key: 'fashion_warehouse_pkg_plastic_recyclable_mt', name: 'Warehouse Packaging - Plastic (Recyclable) - Value', unit: 'MT' },
    { key: 'fashion_warehouse_pkg_plastic_non_recyclable_mt', name: 'Warehouse Packaging - Plastic (Non-Recyclable) - Value', unit: 'MT' },
    { key: 'fashion_warehouse_pkg_fabric_mt', name: 'Warehouse Packaging - Fabric/Cloth - Value', unit: 'MT' },
    { key: 'fashion_warehouse_pkg_other_mt', name: 'Warehouse Packaging - Other - Value', unit: 'MT' },
    { key: 'fashion_packaging_reuse_note', name: 'Warehouse Packaging - Note on Reuse of Packaging Materials', unit: 'Text (max 300 words)' },
    // KPI 6 - Primary Packaging (Value MT, auto-calc %)
    { key: 'fashion_primary_pkg_cardboard_mt', name: 'Primary Packaging - Cardboard - Value', unit: 'MT' },
    { key: 'fashion_primary_pkg_paper_mt', name: 'Primary Packaging - Paper - Value', unit: 'MT' },
    { key: 'fashion_primary_pkg_plastic_recyclable_mt', name: 'Primary Packaging - Plastic (Recyclable) - Value', unit: 'MT' },
    { key: 'fashion_primary_pkg_plastic_non_recyclable_mt', name: 'Primary Packaging - Plastic (Non-Recyclable) - Value', unit: 'MT' },
    { key: 'fashion_primary_pkg_fabric_mt', name: 'Primary Packaging - Fabric/Cloth - Value', unit: 'MT' },
    { key: 'fashion_primary_pkg_other_mt', name: 'Primary Packaging - Other - Value', unit: 'MT' },
    // KPI 7 - Compliance Details
    { key: 'fashion_epr_target', name: 'EPR Targets (MT)', unit: 'MT' },
    { key: 'fashion_epr_compliance_pct', name: 'Compliance to EPR (%)', unit: '%' },
    { key: 'fashion_waste_expenditure', name: 'Waste Initiative Expenditure', unit: 'INR Cr' },
    // KPI 8 - Secondary Packaging (Value MT, auto-calc %)
    { key: 'fashion_secondary_pkg_cardboard_mt', name: 'Secondary Packaging - Cardboard - Value', unit: 'MT' },
    { key: 'fashion_secondary_pkg_paper_mt', name: 'Secondary Packaging - Paper - Value', unit: 'MT' },
    { key: 'fashion_secondary_pkg_plastic_recyclable_mt', name: 'Secondary Packaging - Plastic (Recyclable) - Value', unit: 'MT' },
    { key: 'fashion_secondary_pkg_plastic_non_recyclable_mt', name: 'Secondary Packaging - Plastic (Non-Recyclable) - Value', unit: 'MT' },
    { key: 'fashion_secondary_pkg_fabric_mt', name: 'Secondary Packaging - Fabric/Cloth - Value', unit: 'MT' },
    { key: 'fashion_secondary_pkg_other_mt', name: 'Secondary Packaging - Other - Value', unit: 'MT' },
    { key: 'fashionMaterials_additional_comments', name: 'Additional Comments', unit: 'Text (max 300 words)', description: 'Any additional information about fashion materials' },
  ],
  certifications: [
    // Ingredient Certifications
    { key: 'cert_ingredient_self_number', name: 'Ingredient Certifications (Self) - Number', unit: 'Number' },
    { key: 'cert_ingredient_self_names', name: 'Ingredient Certifications (Self) - Certificate Names', unit: 'Text' },
    { key: 'cert_ingredient_self_validity', name: 'Ingredient Certifications (Self) - Validity', unit: 'Text' },
    { key: 'cert_ingredient_self_comments', name: 'Ingredient Certifications (Self) - Comments', unit: 'Text' },
    { key: 'cert_ingredient_supplier_number', name: 'Ingredient Certifications (Supplier) - Number', unit: 'Number' },
    { key: 'cert_ingredient_supplier_names', name: 'Ingredient Certifications (Supplier) - Certificate Names', unit: 'Text' },
    { key: 'cert_ingredient_supplier_validity', name: 'Ingredient Certifications (Supplier) - Validity', unit: 'Text' },
    { key: 'cert_ingredient_supplier_comments', name: 'Ingredient Certifications (Supplier) - Comments', unit: 'Text' },
    // Packaging Certifications
    { key: 'cert_packaging_self_number', name: 'Packaging Certifications (Self) - Number', unit: 'Number' },
    { key: 'cert_packaging_self_names', name: 'Packaging Certifications (Self) - Certificate Names', unit: 'Text' },
    { key: 'cert_packaging_self_validity', name: 'Packaging Certifications (Self) - Validity', unit: 'Text' },
    { key: 'cert_packaging_self_comments', name: 'Packaging Certifications (Self) - Comments', unit: 'Text' },
    { key: 'cert_packaging_supplier_number', name: 'Packaging Certifications (Supplier) - Number', unit: 'Number' },
    { key: 'cert_packaging_supplier_names', name: 'Packaging Certifications (Supplier) - Certificate Names', unit: 'Text' },
    { key: 'cert_packaging_supplier_validity', name: 'Packaging Certifications (Supplier) - Validity', unit: 'Text' },
    { key: 'cert_packaging_supplier_comments', name: 'Packaging Certifications (Supplier) - Comments', unit: 'Text' },
    // Energy Certifications
    { key: 'cert_energy_self_number', name: 'Energy Certifications (Self) - Number', unit: 'Number' },
    { key: 'cert_energy_self_names', name: 'Energy Certifications (Self) - Certificate Names', unit: 'Text' },
    { key: 'cert_energy_self_validity', name: 'Energy Certifications (Self) - Validity', unit: 'Text' },
    { key: 'cert_energy_self_comments', name: 'Energy Certifications (Self) - Comments', unit: 'Text' },
    { key: 'cert_energy_supplier_number', name: 'Energy Certifications (Supplier) - Number', unit: 'Number' },
    { key: 'cert_energy_supplier_names', name: 'Energy Certifications (Supplier) - Certificate Names', unit: 'Text' },
    { key: 'cert_energy_supplier_validity', name: 'Energy Certifications (Supplier) - Validity', unit: 'Text' },
    { key: 'cert_energy_supplier_comments', name: 'Energy Certifications (Supplier) - Comments', unit: 'Text' },
    // Production Certifications
    { key: 'cert_production_self_number', name: 'Production Certifications (Self) - Number', unit: 'Number' },
    { key: 'cert_production_self_names', name: 'Production Certifications (Self) - Certificate Names', unit: 'Text' },
    { key: 'cert_production_self_validity', name: 'Production Certifications (Self) - Validity', unit: 'Text' },
    { key: 'cert_production_self_comments', name: 'Production Certifications (Self) - Comments', unit: 'Text' },
    { key: 'cert_production_supplier_number', name: 'Production Certifications (Supplier) - Number', unit: 'Number' },
    { key: 'cert_production_supplier_names', name: 'Production Certifications (Supplier) - Certificate Names', unit: 'Text' },
    { key: 'cert_production_supplier_validity', name: 'Production Certifications (Supplier) - Validity', unit: 'Text' },
    { key: 'cert_production_supplier_comments', name: 'Production Certifications (Supplier) - Comments', unit: 'Text' },
    // Quality Certifications
    { key: 'cert_quality_self_number', name: 'Quality Certifications (Self) - Number', unit: 'Number' },
    { key: 'cert_quality_self_names', name: 'Quality Certifications (Self) - Certificate Names', unit: 'Text' },
    { key: 'cert_quality_self_validity', name: 'Quality Certifications (Self) - Validity', unit: 'Text' },
    { key: 'cert_quality_self_comments', name: 'Quality Certifications (Self) - Comments', unit: 'Text' },
    { key: 'cert_quality_supplier_number', name: 'Quality Certifications (Supplier) - Number', unit: 'Number' },
    { key: 'cert_quality_supplier_names', name: 'Quality Certifications (Supplier) - Certificate Names', unit: 'Text' },
    { key: 'cert_quality_supplier_validity', name: 'Quality Certifications (Supplier) - Validity', unit: 'Text' },
    { key: 'cert_quality_supplier_comments', name: 'Quality Certifications (Supplier) - Comments', unit: 'Text' },
    // Company Standards Certifications
    { key: 'cert_company_standards_self_number', name: 'Company Standards (Self) - Number', unit: 'Number' },
    { key: 'cert_company_standards_self_names', name: 'Company Standards (Self) - Certificate Names', unit: 'Text' },
    { key: 'cert_company_standards_self_validity', name: 'Company Standards (Self) - Validity', unit: 'Text' },
    { key: 'cert_company_standards_self_comments', name: 'Company Standards (Self) - Comments', unit: 'Text' },
    { key: 'cert_company_standards_supplier_number', name: 'Company Standards (Supplier) - Number', unit: 'Number' },
    { key: 'cert_company_standards_supplier_names', name: 'Company Standards (Supplier) - Certificate Names', unit: 'Text' },
    { key: 'cert_company_standards_supplier_validity', name: 'Company Standards (Supplier) - Validity', unit: 'Text' },
    { key: 'cert_company_standards_supplier_comments', name: 'Company Standards (Supplier) - Comments', unit: 'Text' },
    // Patents/IPs
    { key: 'patents_granted', name: 'Patents Granted', unit: 'Number' },
    { key: 'patents_filed', name: 'Patents Filed', unit: 'Number' },
    { key: 'certifications_additional_comments', name: 'Additional Comments', unit: 'Text (max 300 words)', description: 'Any additional information about certifications' },
  ],
  governancePolicies: [
    // PoSH Policy
    { key: 'policy_posh_in_place', name: 'PoSH Policy - In Place', unit: 'Yes/No' },
    { key: 'policy_posh_training', name: 'PoSH Policy - Employee Training', unit: 'Yes/No' },
    { key: 'policy_posh_last_update', name: 'PoSH Policy - Last Update (MM/YY)', unit: 'Text' },
    // Code of Conduct
    { key: 'policy_code_of_conduct_in_place', name: 'Code of Conduct - In Place', unit: 'Yes/No' },
    { key: 'policy_code_of_conduct_training', name: 'Code of Conduct - Employee Training', unit: 'Yes/No' },
    { key: 'policy_code_of_conduct_last_update', name: 'Code of Conduct - Last Update (MM/YY)', unit: 'Text' },
    // Supplier Code of Conduct
    { key: 'policy_supplier_code_of_conduct_in_place', name: 'Supplier Code of Conduct - In Place', unit: 'Yes/No' },
    { key: 'policy_supplier_code_of_conduct_training', name: 'Supplier Code of Conduct - Employee Training', unit: 'Yes/No' },
    { key: 'policy_supplier_code_of_conduct_last_update', name: 'Supplier Code of Conduct - Last Update (MM/YY)', unit: 'Text' },
    // Health and Safety
    { key: 'policy_health_and_safety_in_place', name: 'Health & Safety Policy - In Place', unit: 'Yes/No' },
    { key: 'policy_health_and_safety_training', name: 'Health & Safety Policy - Employee Training', unit: 'Yes/No' },
    { key: 'policy_health_and_safety_last_update', name: 'Health & Safety Policy - Last Update (MM/YY)', unit: 'Text' },
    // DEI Policy
    { key: 'policy_dei_in_place', name: 'DEI Policy - In Place', unit: 'Yes/No' },
    { key: 'policy_dei_training', name: 'DEI Policy - Employee Training', unit: 'Yes/No' },
    { key: 'policy_dei_last_update', name: 'DEI Policy - Last Update (MM/YY)', unit: 'Text' },
    // HR Policy
    { key: 'policy_hr_in_place', name: 'HR Policy - In Place', unit: 'Yes/No' },
    { key: 'policy_hr_training', name: 'HR Policy - Employee Training', unit: 'Yes/No' },
    { key: 'policy_hr_last_update', name: 'HR Policy - Last Update (MM/YY)', unit: 'Text' },
    // Human Rights
    { key: 'policy_human_rights_in_place', name: 'Human Rights Policy - In Place', unit: 'Yes/No' },
    { key: 'policy_human_rights_training', name: 'Human Rights Policy - Employee Training', unit: 'Yes/No' },
    { key: 'policy_human_rights_last_update', name: 'Human Rights Policy - Last Update (MM/YY)', unit: 'Text' },
    // ESG Policy
    { key: 'policy_esg_in_place', name: 'ESG Policy - In Place', unit: 'Yes/No' },
    { key: 'policy_esg_training', name: 'ESG Policy - Employee Training', unit: 'Yes/No' },
    { key: 'policy_esg_last_update', name: 'ESG Policy - Last Update (MM/YY)', unit: 'Text' },
    // Environment Policy
    { key: 'policy_environment_in_place', name: 'Environment Policy - In Place', unit: 'Yes/No' },
    { key: 'policy_environment_training', name: 'Environment Policy - Employee Training', unit: 'Yes/No' },
    { key: 'policy_environment_last_update', name: 'Environment Policy - Last Update (MM/YY)', unit: 'Text' },
    // Grievance Redressal (Internal)
    { key: 'policy_grievance_internal_in_place', name: 'Grievance Redressal (Internal) - In Place', unit: 'Yes/No' },
    { key: 'policy_grievance_internal_training', name: 'Grievance Redressal (Internal) - Employee Training', unit: 'Yes/No' },
    { key: 'policy_grievance_internal_last_update', name: 'Grievance Redressal (Internal) - Last Update (MM/YY)', unit: 'Text' },
    // Grievance Redressal (External)
    { key: 'policy_grievance_external_in_place', name: 'Grievance Redressal (External) - In Place', unit: 'Yes/No' },
    { key: 'policy_grievance_external_training', name: 'Grievance Redressal (External) - Employee Training', unit: 'Yes/No' },
    { key: 'policy_grievance_external_last_update', name: 'Grievance Redressal (External) - Last Update (MM/YY)', unit: 'Text' },
    // Data Protection
    { key: 'policy_data_protection_in_place', name: 'Data Protection Policy - In Place', unit: 'Yes/No' },
    { key: 'policy_data_protection_training', name: 'Data Protection Policy - Employee Training', unit: 'Yes/No' },
    { key: 'policy_data_protection_last_update', name: 'Data Protection Policy - Last Update (MM/YY)', unit: 'Text' },
    { key: 'governancePolicies_additional_comments', name: 'Additional Comments', unit: 'Text (max 300 words)', description: 'Any additional information about governance policies' },
  ],
  operations: [
    // KPI 1 - MSME Classification
    { key: 'operations_msme_classification', name: 'Udhyam/MSME Certification Classification', unit: 'Dropdown (Micro/Small, Medium)' },
    // KPI 2 - Rented/Owned Corporate Office
    { key: 'operations_rented_owned_corporate_office_count', name: 'Rented/Owned Corporate Office - Count', unit: 'Number' },
    { key: 'operations_rented_owned_corporate_office_na', name: 'Rented/Owned Corporate Office - N/A', unit: 'Yes/No' },
    // KPI 3 - Co-working Corporate Office
    { key: 'operations_coworking_corporate_office_count', name: 'Co-working Corporate Office - Count', unit: 'Number' },
    { key: 'operations_coworking_corporate_office_na', name: 'Co-working Corporate Office - N/A', unit: 'Yes/No' },
    // KPI 4 - Owned Manufacturing Units
    { key: 'operations_owned_manufacturing_units_count', name: 'Owned Manufacturing/Factory Units - Count', unit: 'Number' },
    { key: 'operations_owned_manufacturing_units_na', name: 'Owned Manufacturing/Factory Units - N/A', unit: 'Yes/No' },
    // KPI 5 - Third Party Manufacturing
    { key: 'operations_third_party_manufacturing_count', name: 'Third Party Manufacturing Units - Count', unit: 'Number' },
    { key: 'operations_third_party_manufacturing_na', name: 'Third Party Manufacturing Units - N/A', unit: 'Yes/No' },
    // KPI 6 - Owned Warehouses
    { key: 'operations_owned_warehouses_count', name: 'Owned Warehouses - Count', unit: 'Number' },
    { key: 'operations_owned_warehouses_na', name: 'Owned Warehouses - N/A', unit: 'Yes/No' },
    // KPI 7 - Third Party Logistics
    { key: 'operations_third_party_logistics_count', name: 'Third Party Logistics (incl. Warehouses) - Count', unit: 'Number' },
    { key: 'operations_third_party_logistics_na', name: 'Third Party Logistics (incl. Warehouses) - N/A', unit: 'Yes/No' },
    // KPI 8 - COCO Stores
    { key: 'operations_coco_stores_count', name: 'Company Owned Company Operated (COCO) Stores - Count', unit: 'Number' },
    { key: 'operations_coco_stores_na', name: 'Company Owned Company Operated (COCO) Stores - N/A', unit: 'Yes/No' },
    // KPI 9 - FOCO Stores
    { key: 'operations_foco_stores_count', name: 'Franchisee Owned Company Operated (FOCO) Stores - Count', unit: 'Number' },
    { key: 'operations_foco_stores_na', name: 'Franchisee Owned Company Operated (FOCO) Stores - N/A', unit: 'Yes/No' },
    { key: 'operations_additional_comments', name: 'Additional Comments', unit: 'Text (max 300 words)', description: 'Any additional information about operations' },
  ],
  waterManagement: [
    // Office
    { key: 'water_detailed_office_water_consumed', name: 'Office - Total Water Consumed', unit: 'Thousand m³' },
    { key: 'water_detailed_office_fresh_water_pct', name: 'Office - Fresh Water %', unit: '%' },
    { key: 'water_detailed_office_wastewater_generated', name: 'Office - Wastewater Generated', unit: 'Thousand m³' },
    { key: 'water_detailed_office_wastewater_recycled_pct', name: 'Office - Wastewater Recycled %', unit: '%' },
    { key: 'water_detailed_office_na', name: 'Office - N/A', unit: 'Yes/No' },
    // COCO Stores
    { key: 'water_detailed_stores_coco_water_consumed', name: 'COCO Stores - Total Water Consumed', unit: 'Thousand m³' },
    { key: 'water_detailed_stores_coco_fresh_water_pct', name: 'COCO Stores - Fresh Water %', unit: '%' },
    { key: 'water_detailed_stores_coco_wastewater_generated', name: 'COCO Stores - Wastewater Generated', unit: 'Thousand m³' },
    { key: 'water_detailed_stores_coco_wastewater_recycled_pct', name: 'COCO Stores - Wastewater Recycled %', unit: '%' },
    { key: 'water_detailed_stores_coco_na', name: 'COCO Stores - N/A', unit: 'Yes/No' },
    // Warehouses
    { key: 'water_detailed_warehouses_water_consumed', name: 'Warehouses - Total Water Consumed', unit: 'Thousand m³' },
    { key: 'water_detailed_warehouses_fresh_water_pct', name: 'Warehouses - Fresh Water %', unit: '%' },
    { key: 'water_detailed_warehouses_wastewater_generated', name: 'Warehouses - Wastewater Generated', unit: 'Thousand m³' },
    { key: 'water_detailed_warehouses_wastewater_recycled_pct', name: 'Warehouses - Wastewater Recycled %', unit: '%' },
    { key: 'water_detailed_warehouses_na', name: 'Warehouses - N/A', unit: 'Yes/No' },
    // Manufacturing
    { key: 'water_detailed_manufacturing_water_consumed', name: 'Manufacturing - Total Water Consumed', unit: 'Thousand m³' },
    { key: 'water_detailed_manufacturing_fresh_water_pct', name: 'Manufacturing - Fresh Water %', unit: '%' },
    { key: 'water_detailed_manufacturing_wastewater_generated', name: 'Manufacturing - Wastewater Generated', unit: 'Thousand m³' },
    { key: 'water_detailed_manufacturing_wastewater_recycled_pct', name: 'Manufacturing - Wastewater Recycled %', unit: '%' },
    { key: 'water_detailed_manufacturing_na', name: 'Manufacturing - N/A', unit: 'Yes/No' },
    // Dark Stores
    { key: 'water_detailed_dark_stores_water_consumed', name: 'Dark Stores - Total Water Consumed', unit: 'Thousand m³' },
    { key: 'water_detailed_dark_stores_fresh_water_pct', name: 'Dark Stores - Fresh Water %', unit: '%' },
    { key: 'water_detailed_dark_stores_wastewater_generated', name: 'Dark Stores - Wastewater Generated', unit: 'Thousand m³' },
    { key: 'water_detailed_dark_stores_wastewater_recycled_pct', name: 'Dark Stores - Wastewater Recycled %', unit: '%' },
    { key: 'water_detailed_dark_stores_na', name: 'Dark Stores - N/A', unit: 'Yes/No' },
    // Distribution
    { key: 'water_detailed_distribution_water_consumed', name: 'Distribution - Total Water Consumed', unit: 'Thousand m³' },
    { key: 'water_detailed_distribution_fresh_water_pct', name: 'Distribution - Fresh Water %', unit: '%' },
    { key: 'water_detailed_distribution_wastewater_generated', name: 'Distribution - Wastewater Generated', unit: 'Thousand m³' },
    { key: 'water_detailed_distribution_wastewater_recycled_pct', name: 'Distribution - Wastewater Recycled %', unit: '%' },
    { key: 'water_detailed_distribution_na', name: 'Distribution - N/A', unit: 'Yes/No' },
    { key: 'waterManagement_additional_comments', name: 'Additional Comments', unit: 'Text (max 300 words)', description: 'Any additional information about water management' },
  ],
  energyManagement: [
    // Office
    { key: 'energy_detailed_office_energy_consumed', name: 'Office - Energy Consumed', unit: 'kWh' },
    { key: 'energy_detailed_office_renewable_pct', name: 'Office - Renewable Energy %', unit: '%' },
    { key: 'energy_detailed_office_na', name: 'Office - N/A', unit: 'Yes/No' },
    // COCO Stores
    { key: 'energy_detailed_stores_coco_energy_consumed', name: 'COCO Stores - Energy Consumed', unit: 'kWh' },
    { key: 'energy_detailed_stores_coco_renewable_pct', name: 'COCO Stores - Renewable Energy %', unit: '%' },
    { key: 'energy_detailed_stores_coco_na', name: 'COCO Stores - N/A', unit: 'Yes/No' },
    // Warehouses
    { key: 'energy_detailed_warehouses_energy_consumed', name: 'Warehouses - Energy Consumed', unit: 'kWh' },
    { key: 'energy_detailed_warehouses_renewable_pct', name: 'Warehouses - Renewable Energy %', unit: '%' },
    { key: 'energy_detailed_warehouses_na', name: 'Warehouses - N/A', unit: 'Yes/No' },
    // Manufacturing
    { key: 'energy_detailed_manufacturing_energy_consumed', name: 'Manufacturing - Energy Consumed', unit: 'kWh' },
    { key: 'energy_detailed_manufacturing_renewable_pct', name: 'Manufacturing - Renewable Energy %', unit: '%' },
    { key: 'energy_detailed_manufacturing_na', name: 'Manufacturing - N/A', unit: 'Yes/No' },
    // Data Center
    { key: 'energy_detailed_data_center_energy_consumed', name: 'Data Center - Energy Consumed', unit: 'kWh' },
    { key: 'energy_detailed_data_center_renewable_pct', name: 'Data Center - Renewable Energy %', unit: '%' },
    { key: 'energy_detailed_data_center_na', name: 'Data Center - N/A', unit: 'Yes/No' },
    // Retail
    { key: 'energy_detailed_retail_energy_consumed', name: 'Retail - Energy Consumed', unit: 'kWh' },
    { key: 'energy_detailed_retail_renewable_pct', name: 'Retail - Renewable Energy %', unit: '%' },
    { key: 'energy_detailed_retail_na', name: 'Retail - N/A', unit: 'Yes/No' },
    // Distribution
    { key: 'energy_detailed_distribution_energy_consumed', name: 'Distribution - Energy Consumed', unit: 'kWh' },
    { key: 'energy_detailed_distribution_renewable_pct', name: 'Distribution - Renewable Energy %', unit: '%' },
    { key: 'energy_detailed_distribution_na', name: 'Distribution - N/A', unit: 'Yes/No' },
    { key: 'energyManagement_additional_comments', name: 'Additional Comments', unit: 'Text (max 300 words)', description: 'Any additional information about energy management' },
  ],
  wasteManagement: [
    // Office
    { key: 'waste_detailed_office_waste_generated', name: 'Office - Waste Generated', unit: 'MT' },
    { key: 'waste_detailed_office_waste_recycled_pct', name: 'Office - Waste Recycled %', unit: '%' },
    { key: 'waste_detailed_office_na', name: 'Office - N/A', unit: 'Yes/No' },
    // COCO Stores
    { key: 'waste_detailed_stores_coco_waste_generated', name: 'COCO Stores - Waste Generated', unit: 'MT' },
    { key: 'waste_detailed_stores_coco_waste_recycled_pct', name: 'COCO Stores - Waste Recycled %', unit: '%' },
    { key: 'waste_detailed_stores_coco_na', name: 'COCO Stores - N/A', unit: 'Yes/No' },
    // Warehouses
    { key: 'waste_detailed_warehouses_waste_generated', name: 'Warehouses - Waste Generated', unit: 'MT' },
    { key: 'waste_detailed_warehouses_waste_recycled_pct', name: 'Warehouses - Waste Recycled %', unit: '%' },
    { key: 'waste_detailed_warehouses_na', name: 'Warehouses - N/A', unit: 'Yes/No' },
    // Manufacturing
    { key: 'waste_detailed_manufacturing_waste_generated', name: 'Manufacturing - Waste Generated', unit: 'MT' },
    { key: 'waste_detailed_manufacturing_waste_recycled_pct', name: 'Manufacturing - Waste Recycled %', unit: '%' },
    { key: 'waste_detailed_manufacturing_na', name: 'Manufacturing - N/A', unit: 'Yes/No' },
    // Dark Stores
    { key: 'waste_detailed_dark_stores_waste_generated', name: 'Dark Stores - Waste Generated', unit: 'MT' },
    { key: 'waste_detailed_dark_stores_waste_recycled_pct', name: 'Dark Stores - Waste Recycled %', unit: '%' },
    { key: 'waste_detailed_dark_stores_na', name: 'Dark Stores - N/A', unit: 'Yes/No' },
    // Distribution
    { key: 'waste_detailed_distribution_waste_generated', name: 'Distribution - Waste Generated', unit: 'MT' },
    { key: 'waste_detailed_distribution_waste_recycled_pct', name: 'Distribution - Waste Recycled %', unit: '%' },
    { key: 'waste_detailed_distribution_na', name: 'Distribution - N/A', unit: 'Yes/No' },
    { key: 'wasteManagement_additional_comments', name: 'Additional Comments', unit: 'Text (max 300 words)', description: 'Any additional information about waste management' },
  ],
  csr: [
    { key: 'csr_amount_spent', name: 'CSR Amount Spent', unit: '₹ (Rupees)' },
    { key: 'csr_implementation', name: 'CSR Implementation Mode', unit: 'Dropdown (In-house, With NGO, Both)' },
    { key: 'csr_initiatives_list', name: 'CSR Initiatives', unit: 'JSON/Text' },
    { key: 'csr_additional_comments', name: 'Additional Comments', unit: 'Text (max 300 words)', description: 'Any additional information about CSR' },
  ],
  sri: [
    // Beneficiaries
    { key: 'sri_total_beneficiaries_prev', name: 'Total Beneficiaries (Previous Year)', unit: 'Number' },
    { key: 'sri_total_beneficiaries_curr', name: 'Total Beneficiaries (Current Year)', unit: 'Number' },
    { key: 'sri_total_beneficiaries_details', name: 'Total Beneficiaries - Details', unit: 'Text' },
    { key: 'sri_women_beneficiaries_prev', name: 'Women/Girls Supported (Previous Year)', unit: 'Number' },
    { key: 'sri_women_beneficiaries_curr', name: 'Women/Girls Supported (Current Year)', unit: 'Number' },
    { key: 'sri_women_beneficiaries_details', name: 'Women/Girls Supported - Details', unit: 'Text' },
    { key: 'sri_msme_status_prev', name: 'MSME Status (Previous Year)', unit: 'Yes/No' },
    { key: 'sri_msme_status_curr', name: 'MSME Status (Current Year)', unit: 'Yes/No' },
    { key: 'sri_msme_status_details', name: 'MSME Status - Details', unit: 'Text' },
    { key: 'sri_sector_prev', name: 'Sector (Previous Year)', unit: 'Text' },
    { key: 'sri_sector_curr', name: 'Sector (Current Year)', unit: 'Text' },
    { key: 'sri_sector_details', name: 'Sector - Details', unit: 'Text' },
    // Jobs Created
    { key: 'sri_total_jobs_created_prev', name: 'Total Jobs Created (Previous Year)', unit: 'Number' },
    { key: 'sri_total_jobs_created_curr', name: 'Total Jobs Created (Current Year)', unit: 'Number' },
    { key: 'sri_total_jobs_created_details', name: 'Total Jobs Created - Details', unit: 'Text' },
    { key: 'sri_jobs_male_prev', name: 'Jobs for Male (Previous Year)', unit: 'Number' },
    { key: 'sri_jobs_male_curr', name: 'Jobs for Male (Current Year)', unit: 'Number' },
    { key: 'sri_jobs_male_details', name: 'Jobs for Male - Details', unit: 'Text' },
    { key: 'sri_jobs_female_prev', name: 'Jobs for Female (Previous Year)', unit: 'Number' },
    { key: 'sri_jobs_female_curr', name: 'Jobs for Female (Current Year)', unit: 'Number' },
    { key: 'sri_jobs_female_details', name: 'Jobs for Female - Details', unit: 'Text' },
    { key: 'sri_additional_comments', name: 'Additional Comments', unit: 'Text (max 300 words)', description: 'Any additional information about SRI' },
  ],
  productServiceCertifications: [
    // Awards & Recognitions (stored as JSON lists)
    { key: 'founder_awards_list', name: 'Awards & Recognitions', unit: 'JSON/Text' },
    // Media Mentions
    { key: 'media_mentions_list', name: 'Media Mentions', unit: 'JSON/Text' },
    // Other Initiatives
    { key: 'other_initiatives_list', name: 'Other ESG Initiatives', unit: 'JSON/Text' },
    { key: 'productServiceCertifications_additional_comments', name: 'Additional Comments', unit: 'Text (max 300 words)', description: 'Any additional information about awards & recognitions' },
  ],
  healthCare: [
    { key: 'healthcare_consultations_screenings', name: 'No. of doctor consultations/patient screenings', unit: 'Number', description: 'Total number of doctor consultations or patient screenings conducted' },
    { key: 'healthcare_products_services', name: 'No. of healthcare products/services offered', unit: 'Number', description: 'Count of healthcare products or services offered by the company' },
    { key: 'healthcare_diseases_addressed', name: 'Diseases/conditions addressed', unit: 'Text', description: 'List of diseases or health conditions addressed by your products/services' },
    { key: 'healthCare_additional_comments', name: 'Additional Comments', unit: 'Text (max 300 words)', description: 'Any additional information about healthcare initiatives' },
  ],
  externalReporting: [
    { key: 'ext_beneficiaries', name: 'Beneficiaries', unit: 'Text', description: 'Number of beneficiaries impacted by company activities' },
    { key: 'ext_jobs_created', name: 'Jobs created', unit: 'Text', description: 'Number of jobs created directly or indirectly' },
    { key: 'ext_enterprise_emissions', name: 'Enterprise and emissions', unit: 'Text', description: 'Enterprise-level emissions data and environmental impact' },
    { key: 'ext_development_indicators', name: 'Development Indicators', unit: 'Text', description: 'Key development indicators and metrics' },
    { key: 'ext_training_safety', name: 'Training and safety', unit: 'Text', description: 'Training programs and safety measures implemented' },
    { key: 'ext_social_security', name: 'Social security', unit: 'Text', description: 'Social security provisions for employees' },
    { key: 'ext_testimonials_other', name: 'Testimonials and other', unit: 'Text', description: 'Testimonials and other relevant information' },
    { key: 'ext_progress_milestones', name: 'Progress and milestones', unit: 'Text', description: 'Progress updates and key milestones achieved' },
    { key: 'externalReporting_additional_comments', name: 'Additional Comments', unit: 'Text (max 300 words)', description: 'Any additional information about external reporting' },
  ],
  packagingDetailed: [
    // Secondary Packaging
    { key: 'pkg_detailed_secondary_plastic_mt', name: 'Secondary Pkg - Plastic packaging used', unit: 'MT' },
    { key: 'pkg_detailed_secondary_plastic_cost', name: 'Secondary Pkg - Plastic packaging cost', unit: 'INR Cr' },
    { key: 'pkg_detailed_secondary_non_plastic_mt', name: 'Secondary Pkg - Non-plastic packaging used', unit: 'MT' },
    { key: 'pkg_detailed_secondary_non_plastic_cost', name: 'Secondary Pkg - Non-plastic packaging cost', unit: 'INR Cr' },
    { key: 'pkg_detailed_secondary_recycled_content_pct', name: 'Secondary Pkg - Recycled content %', unit: '%' },
    { key: 'pkg_detailed_secondary_type_description', name: 'Secondary Pkg - Type of packaging used', unit: 'Text' },
    // Tertiary Packaging
    { key: 'pkg_detailed_report_tertiary', name: 'Report Tertiary Packaging', unit: 'Yes/No' },
    { key: 'pkg_detailed_tertiary_plastic_mt', name: 'Tertiary Pkg - Plastic packaging used', unit: 'MT' },
    { key: 'pkg_detailed_tertiary_plastic_cost', name: 'Tertiary Pkg - Plastic packaging cost', unit: 'INR Cr' },
    { key: 'pkg_detailed_tertiary_non_plastic_mt', name: 'Tertiary Pkg - Non-plastic packaging used', unit: 'MT' },
    { key: 'pkg_detailed_tertiary_non_plastic_cost', name: 'Tertiary Pkg - Non-plastic packaging cost', unit: 'INR Cr' },
    { key: 'pkg_detailed_tertiary_recycled_content_pct', name: 'Tertiary Pkg - Recycled content %', unit: '%' },
    { key: 'pkg_detailed_tertiary_type_description', name: 'Tertiary Pkg - Type of packaging used', unit: 'Text' },
    // Waste Management
    { key: 'pkg_detailed_waste_plastic_disposed', name: 'Waste - Plastic waste disposed', unit: 'MT' },
    { key: 'pkg_detailed_waste_plastic_recycled', name: 'Waste - Plastic waste recycled', unit: 'MT' },
    { key: 'pkg_detailed_waste_epr_compliance_cost', name: 'Waste - EPR compliance cost', unit: 'INR Cr' },
    { key: 'pkg_detailed_waste_non_plastic_disposed', name: 'Waste - Non-plastic waste disposed', unit: 'MT' },
    { key: 'pkg_detailed_waste_non_plastic_recycled', name: 'Waste - Non-plastic waste recycled', unit: 'MT' },
    { key: 'packagingDetailed_additional_comments', name: 'Additional Comments', unit: 'Text (max 300 words)', description: 'Any additional information about detailed packaging' },
  ],
  packagingBasic: [
    // Primary Packaging - Plastic focus
    { key: 'pkg_basic_virgin_recyclable_type', name: 'Type of virgin recyclable plastic used', unit: 'Text' },
    { key: 'pkg_basic_virgin_recyclable_mt', name: 'Virgin Recyclable Plastic used', unit: 'MT' },
    { key: 'pkg_basic_virgin_recyclable_cost', name: 'Virgin Recyclable Plastic cost', unit: 'INR Cr' },
    { key: 'pkg_basic_virgin_non_recyclable_type', name: 'Type of virgin non-recyclable plastic used', unit: 'Text' },
    { key: 'pkg_basic_virgin_non_recyclable_mt', name: 'Virgin Non-recyclable Plastic used', unit: 'MT' },
    { key: 'pkg_basic_virgin_non_recyclable_cost', name: 'Virgin Non-recyclable Plastic cost', unit: 'INR Cr' },
    { key: 'pkg_basic_recycled_type_supplier', name: 'Type of recycled plastic & supplier details', unit: 'Text' },
    { key: 'pkg_basic_recycled_mt', name: 'Recycled Plastic used', unit: 'MT' },
    { key: 'pkg_basic_recycled_cost', name: 'Recycled Plastic cost', unit: 'INR Cr' },
    { key: 'packagingBasic_additional_comments', name: 'Additional Comments', unit: 'Text (max 300 words)', description: 'Any additional information about basic packaging' },
  ],
  packagingTertiary: [
    // Tertiary Packaging
    { key: 'pkg_tertiary_plastic_mt', name: 'Tertiary - Plastic packaging used', unit: 'MT' },
    { key: 'pkg_tertiary_plastic_cost', name: 'Tertiary - Plastic packaging cost', unit: 'INR Cr' },
    { key: 'pkg_tertiary_non_plastic_mt', name: 'Tertiary - Non-plastic packaging used', unit: 'MT' },
    { key: 'pkg_tertiary_non_plastic_cost', name: 'Tertiary - Non-plastic packaging cost', unit: 'INR Cr' },
    { key: 'pkg_tertiary_recycled_content_pct', name: 'Tertiary - Recycled content %', unit: '%' },
    { key: 'pkg_tertiary_type_description', name: 'Tertiary - Type of packaging used', unit: 'Text' },
    { key: 'packagingTertiary_additional_comments', name: 'Additional Comments', unit: 'Text (max 300 words)', description: 'Any additional information about tertiary packaging' },
  ],
};

// Export function to get all feature keys that have KPIs defined
export const getAllFeatureKeys = (): string[] => {
  return Object.keys(FEATURE_KPIS);
};

export interface FeatureTemplateDownloadOptions {
  featureKey: string;
  featureLabel: string;
  companyName: string;
  quarter: string;
  year: number;
}

export const downloadFeatureTemplate = (options: FeatureTemplateDownloadOptions): void => {
  const { featureKey, featureLabel, companyName, quarter, year } = options;
  
  // Get KPIs for this feature
  const featureKPIs = FEATURE_KPIS[featureKey] || [];
  
  if (featureKPIs.length === 0) {
    throw new Error(`No KPIs defined for feature: ${featureKey}`);
  }
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Build data rows with the exact columns shown on the page
  const dataRows: (string | number)[][] = [];
  
  // Headers matching the page layout
  const headers = ['Sno', 'KPI ID', 'KPI Name', 'Unit', 'Value'];
  dataRows.push(headers);
  
  // Add KPI rows
  featureKPIs.forEach((kpi, index) => {
    dataRows.push([
      index + 1,      // Sno
      kpi.key,        // KPI ID (for mapping)
      kpi.name,       // KPI Name
      kpi.unit,       // Unit
      '',             // Value (empty for user to fill)
    ]);
  });
  
  // Create main data sheet
  const ws = XLSX.utils.aoa_to_sheet(dataRows);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 6 },   // Sno
    { wch: 50 },  // KPI ID
    { wch: 60 },  // KPI Name
    { wch: 25 },  // Unit
    { wch: 25 },  // Value
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'KPI Data');
  
  // Add instructions sheet
  const instructionsData = [
    [`${featureLabel} - KPI Data Entry Template`],
    [''],
    [`Company: ${companyName}`],
    [`Period: ${quarter} ${year}`],
    [''],
    ['How to fill this template:'],
    ['1. Enter your values in the "Value" column (Column E)'],
    ['2. Do NOT modify the "KPI ID", "KPI Name", or "Unit" columns'],
    ['3. For Yes/No fields, enter "Yes" or "No"'],
    ['4. For numeric values, enter numbers only (no symbols or units)'],
    ['5. For percentages, enter as a number (e.g., 25 for 25%)'],
    ['6. Leave cells empty if data is not available'],
    [''],
    ['After filling, upload this file back in the KPI Entry page.'],
  ];
  
  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
  
  // Generate filename
  const safeCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, '_');
  const safeFeatureName = featureLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${safeCompanyName}_${safeFeatureName}_${quarter}_${year}.xlsx`;
  
  // Download
  XLSX.writeFile(wb, filename);
};

export interface ParsedFeatureEntry {
  sno: number;
  kpiName: string;
  kpiKey: string;
  unit: string;
  value: string;
}

export interface ParseFeatureTemplateResult {
  entries: ParsedFeatureEntry[];
  errors: string[];
  totalRows: number;
}

// Normalize boolean values from Excel
const normalizeBooleanValue = (value: string | number | boolean | undefined | null): string => {
  if (value === undefined || value === null) return '';
  
  const strValue = String(value).trim().toLowerCase();
  
  // Check for Yes/True variants
  if (['yes', 'y', 'true', '1', 'on'].includes(strValue)) {
    return 'true';
  }
  
  // Check for No/False variants
  if (['no', 'n', 'false', '0', 'off'].includes(strValue)) {
    return 'false';
  }
  
  // Return original value if not a boolean
  return String(value).trim();
};

export const parseFeatureTemplateUpload = (file: File, featureKey: string): Promise<ParseFeatureTemplateResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Find the data sheet
        const sheetName = workbook.SheetNames.find(name => 
          name.toLowerCase().includes('data') || name.toLowerCase().includes('kpi')
        ) || workbook.SheetNames[0];
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][];
        
        if (jsonData.length < 2) {
          resolve({ entries: [], errors: ['File is empty or has no data rows'], totalRows: 0 });
          return;
        }
        
        // Find column indices
        const headers = jsonData[0].map(h => String(h || '').toLowerCase().trim());
        const snoIndex = headers.findIndex(h => h === 'sno' || h === 's.no' || h === 's no' || h === '#');
        const kpiIdIndex = headers.findIndex(h => h === 'kpi id' || h === 'kpi_id' || h === 'kpiid');
        const nameIndex = headers.findIndex(h => h.includes('kpi name') || h.includes('kpi') || h === 'name');
        const unitIndex = headers.findIndex(h => h === 'unit' || h.includes('unit'));
        const valueIndex = headers.findIndex(h => h === 'value' || h.includes('value'));
        
        if (kpiIdIndex === -1 && nameIndex === -1) {
          resolve({ entries: [], errors: ['Could not find "KPI ID" or "KPI Name" column'], totalRows: 0 });
          return;
        }
        
        if (valueIndex === -1) {
          resolve({ entries: [], errors: ['Could not find "Value" column'], totalRows: 0 });
          return;
        }
        
        // Get the feature KPIs for mapping
        const featureKPIs = FEATURE_KPIS[featureKey] || [];
        
        const entries: ParsedFeatureEntry[] = [];
        const errors: string[] = [];
        let totalRows = 0;
        
        // Process data rows
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;
          
          totalRows++;
          
          const sno = snoIndex !== -1 ? Number(row[snoIndex]) : i;
          const kpiId = kpiIdIndex !== -1 ? String(row[kpiIdIndex] || '').trim() : '';
          const kpiName = nameIndex !== -1 ? String(row[nameIndex] || '').trim() : '';
          const unit = unitIndex !== -1 ? String(row[unitIndex] || '') : '';
          let value = row[valueIndex];
          
          if (!kpiId && !kpiName) {
            continue;
          }
          
          // Skip rows without values
          if (value === undefined || value === null || String(value).trim() === '') {
            continue;
          }
          
          // Find matching KPI key - prefer kpiId if available
          let matchingKPI = kpiId ? featureKPIs.find(kpi => kpi.key === kpiId) : null;
          
          // Fall back to name matching if no kpiId match
          if (!matchingKPI && kpiName) {
            matchingKPI = featureKPIs.find(kpi => 
              kpi.name.toLowerCase().trim() === kpiName.toLowerCase().trim()
            );
          }
          
          if (!matchingKPI) {
            // Try to use the kpiId directly if it looks like a valid key
            if (kpiId && kpiId.includes('_')) {
              entries.push({
                sno,
                kpiName: kpiName || kpiId,
                kpiKey: kpiId,
                unit,
                value: normalizeBooleanValue(value),
              });
            } else {
              errors.push(`Row ${i + 1}: Could not match KPI "${kpiName || kpiId}"`);
            }
            continue;
          }
          
          // Normalize boolean values for Yes/No fields
          const normalizedValue = matchingKPI.unit.includes('Yes/No') 
            ? normalizeBooleanValue(value)
            : String(value).trim();
          
          entries.push({
            sno,
            kpiName: kpiName || matchingKPI.name,
            kpiKey: matchingKPI.key,
            unit,
            value: normalizedValue,
          });
        }
        
        resolve({
          entries,
          errors,
          totalRows,
        });
      } catch (error) {
        reject(new Error('Failed to parse Excel file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

export const saveFeatureEntriesFromTemplate = async (
  entries: ParsedFeatureEntry[],
  companyId: string,
  quarter: string,
  year: number
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;
  
  for (const entry of entries) {
    try {
      // Use upsert to update or insert
      const { error } = await supabase
        .from('kpi_entries')
        .upsert({
          company_id: companyId,
          kpi_id: entry.kpiKey,
          quarter,
          year,
          value: entry.value,
          submitted_at: new Date().toISOString(),
        }, {
          onConflict: 'company_id,kpi_id,quarter,year',
        });
      
      if (error) {
        console.error('Error saving entry:', error);
        failed++;
      } else {
        success++;
      }
    } catch (err) {
      console.error('Exception saving entry:', err);
      failed++;
    }
  }
  
  return { success, failed };
};

// Get feature KPIs for a given feature key
export const getFeatureKPIs = (featureKey: string): FeatureKPI[] => {
  return FEATURE_KPIS[featureKey] || [];
};

// Check if a feature has custom KPIs defined
export const hasFeatureKPIs = (featureKey: string): boolean => {
  return Object.prototype.hasOwnProperty.call(FEATURE_KPIS, featureKey) && FEATURE_KPIS[featureKey].length > 0;
};

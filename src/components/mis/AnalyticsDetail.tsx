import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAnalyticsDashboardData, AnalyticsFilters, InsightMetrics, CompanyRawMetrics, AggregationMetrics, buildAggregation, deriveInsights } from '@/hooks/useAnalyticsDashboardData';
import { applyEnvironmentPercentileNormalization, computeCrossQuarterVirginReductions } from '@/lib/envScorePercentile';
import { supabase } from '@/integrations/supabase/client';
import { QCategory } from '@/types/esg';
import { computeSummary } from '@/lib/analyticsCalc';
import { exportCSV, exportPDF, exportDetailXLSX, buildFilterSummary, ExportColumn, PDFExportOptions } from '@/lib/exportUtils';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, Download, Users, Info, UserX, FileText, FileSpreadsheet } from 'lucide-react';
import { RATIO_COMPONENT_COLUMNS, CIRCULAR_ECONOMY_FASHION_HEADERS } from '@/lib/ratioComponentColumns';

interface CompanyDataRow {
  brand: string;
  companyId?: string;
  companyName: string;
  industry: string;
  value: string;
  col1?: string;
  col2?: string;
  q1?: string;
  q2?: string;
  q3?: string;
  q4?: string;
  ratioColumns?: Record<string, string>;
  usesFashionPackaging?: boolean;
}

/** Format a number using the Indian numbering system (3-2-2 comma pattern) */
const formatIndianNumber = (num: number, maxFractionDigits = 2): string => {
  const isNeg = num < 0;
  const abs = Math.abs(num);
  const [intPart, decPart] = abs.toFixed(maxFractionDigits).split('.');
  
  // Apply Indian comma grouping: last 3 digits, then groups of 2
  let result = '';
  if (intPart.length <= 3) {
    result = intPart;
  } else {
    const last3 = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    const groups: string[] = [];
    for (let i = remaining.length; i > 0; i -= 2) {
      groups.unshift(remaining.slice(Math.max(0, i - 2), i));
    }
    result = groups.join(',') + ',' + last3;
  }
  
  if (decPart) result += '.' + decPart;
  return (isNeg ? '-' : '') + result;
};

/** Format number — uses Indian system for INR/₹, standard locale for others */
const formatNum = (num: number, unitType: string, maxFractionDigits = 2): string => {
  const isINR = unitType === '₹' || unitType.startsWith('INR');
  if (isINR) return formatIndianNumber(num, maxFractionDigits);
  return num.toLocaleString(undefined, { maximumFractionDigits: maxFractionDigits });
};

/** Insight metric metadata: formula/logic + input fields */
const INSIGHT_FORMULA_MAP: Record<string, { formula: string; inputs: string[] }> = {
  // Sourcing & Fulfillment
  'msme supplier dependency': { formula: 'msme_supplier_percentage (direct)', inputs: ['MSME Supplier Spend %'] },
  'supply chain localization': { formula: '100% − Avg(International % across all vendor categories)', inputs: ['International % per vendor category (Input Materials, Manufacturing, Packaging, Logistics, Stores)'] },
  'dei-compliant vendor': { formula: 'Vendors with DEI factors selected / Total vendors', inputs: ['DEI factors selected per vendor category', 'Total vendor categories with data'] },
  'small-scale vs large-scale': { formula: 'Count vendors by size category (Individual/SME/Micro vs MNC/Large). Ratio = Small / Large', inputs: ['Vendor size classification per category (Individual, SME, Micro, MNC, Large)'] },
  // Employment & Compensation
  'gender diversity ratio': { formula: 'Total Female Employees / Total Male Employees', inputs: ['Total Female Employees', 'Total Male Employees'] },
  'gender pay parity': { formula: '(Sum Female Wages ÷ Avg Female Count) ÷ (Sum Male Wages ÷ Avg Male Count)\nA value of 1.00x indicates full pay parity between genders.\nUses WC + BC employees and wages across Q1-Q4.', inputs: ['Female Gross Wages (WC+BC)', 'Female Employee Count (WC+BC)', 'Male Gross Wages (WC+BC)', 'Male Employee Count (WC+BC)'] },
  'white collar to blue collar': { formula: 'Sum(WC employees) / Sum(BC employees)', inputs: ['White-Collar Employees (Male + Female)', 'Blue-Collar Employees (Male + Female)'] },
  'women in leadership': { formula: 'Female C-Level / Total C-Level', inputs: ['Female C-Level Count', 'Total C-Level Count'] },
  'women in board': { formula: 'Female Board / Total Board', inputs: ['Female Board Members', 'Total Board Members'] },
  'cxo pay ratio': { formula: 'Avg CXO Comp per CXO ÷ Avg WC Employee Comp', inputs: ['Avg CXO Comp per CXO', 'Avg WC Employee Comp'] },
  'pwd inclusion': { formula: 'employees_pwd_percentage vs 1–3% benchmark', inputs: ['PwD Employee Count', 'Total Employees'] },
  // Primary & Secondary Packaging
  '% recyclable vs non-recyclable': { formula: 'Primary Mono-Material Recyclability % (direct from food_pkg_basic_primary_recyclability_primary_mono_materials)', inputs: ['Primary Mono-Material Recyclability %'] },
  'recycled content ratio': { formula: '(Primary Plastic Recycled MT + Secondary Plastic Recycled MT) / Total Plastic MT × 100', inputs: ['Primary Plastic Recycled (MT)', 'Secondary Plastic Recycled (MT)', 'Total Plastic (MT)'] },
  "% reduction in": { formula: "((Base Quarter Virgin Plastic Intensity − Q4 Virgin Plastic Intensity) / Base Quarter Virgin Plastic Intensity) × 100, where Virgin Plastic Intensity = Virgin Plastic (MT) / Net Revenue (₹ Cr). Base Quarter = earliest available quarter with data (Q1 → Q2 → Q3). Positive = reduction, Negative = increase.", inputs: ['Virgin Plastic (MT) per quarter', 'Net Revenue (₹ Cr) per quarter'] },
  'plastic intensity': { formula: 'Total Plastic (MT) / Net Revenue (₹ Cr)', inputs: ['Total Plastic (MT)', 'Net Revenue (₹ Cr)'] },
  'epr compliant': { formula: 'Count of companies with EPR Compliance % > 0 (cumulative across quarters)', inputs: ['EPR Compliance % per company'] },
  'epr compliance gap': { formula: 'EPR Targets (MT) − Total Packaging Recycled (MT)', inputs: ['EPR Targets (MT)', 'Total Packaging Recycled (MT)'] },
  'voluntary plastic initiative': { formula: 'Count of companies with Voluntary Plastic Neutrality % > 0 (cumulative across quarters)', inputs: ['Voluntary Plastic Neutrality % per company'] },
  
  // Incidents & Grievances
  'total incident count': { formula: 'Sum of all incident_*_cases KPIs', inputs: ['Safety Incident Cases', 'Environmental Incident Cases', 'Compliance Incident Cases', 'Other Incident Cases'] },
  'case resolution rate': { formula: '(Total Cases − Total Open Cases) / Total Cases × 100', inputs: ['Total Cases', 'Total Open Cases'] },
  'high-impact incident': { formula: 'Count(High impact cases) / Total cases', inputs: ['High Impact Cases', 'Total Cases'] },
  'posh case intensity': { formula: 'PoSH cases / Total Employees × 1000', inputs: ['PoSH Cases', 'Total Employees'] },
  // HealthCare
  'healthcare access': { formula: 'healthcare_consultations_screenings (direct)', inputs: ['Healthcare Consultations & Screenings Score'] },
  'healthcare products': { formula: 'Sum of healthcare_products_services across reporting companies. Only companies that have filled this KPI are included.', inputs: ['No. of Healthcare Products/Services Offered'] },
  // Governance Policies
  'policy adoption': { formula: 'Count(Policies in place = Yes) / 12 total policies × 100', inputs: ['12 Governance Policies: PoSH, Code of Conduct, Supplier CoC, Health & Safety, DEI, HR, Human Rights, ESG, Environment, Internal Grievance, External Grievance, Data Protection'] },
  'training coverage': { formula: 'Count(Policies with training = Yes) / Count(Policies in place = Yes) × 100', inputs: ['Policies with Employee Training = Yes', 'Policies In Place = Yes'] },
  // Water Management
  'total water consumption': { formula: 'Sum of all water_detailed_*_total_consumed KPIs', inputs: ['Water consumed per facility (KL) across all reporting facilities'] },
  'water recycling rate': { formula: 'Weighted avg of water_detailed_*_wastewater_recycled_pct', inputs: ['Wastewater Recycled % per facility', 'Total water consumed per facility (for weighting)'] },
  // Energy Management
  'total energy consumption': { formula: 'Sum of all energy_detailed_*_energy_consumed KPIs', inputs: ['Electricity consumed per facility (kWh)', 'Fuel consumed per facility (kWh)'] },
  'renewable energy mix': { formula: 'Weighted avg of energy_detailed_*_renewable_pct', inputs: ['Renewable Energy % per facility', 'Total energy consumed per facility (for weighting)'] },
  // Waste Management
  'total waste generated': { formula: 'Sum of all waste_detailed_*_generated KPIs (solid + organic + hazardous + biomedical)', inputs: ['Solid Waste Generated (MT)', 'Organic Waste Generated (MT)', 'Hazardous Waste Generated (MT)', 'Biomedical Waste Generated (MT)'] },
  'waste diversion rate': { formula: 'Weighted avg of waste_detailed_*_recycled_pct across all waste types', inputs: ['Waste Recycled % per type', 'Waste Generated per type (for weighting)'] },
  // CSR
  'csr spend ratio': { formula: '(CSR Amount Spent (₹) / (Net Revenue (₹ Cr) × 1,00,00,000)) × 100', inputs: ['CSR Amount Spent (₹)', 'Net Revenue (INR Cr)'] },
  // Cross-Module Composite Scores
  'esg composite score': { formula: 'E × 35% + S × 25% + G × 40%, where E = Environment Score (100%), S = Social Score (100%), G = Governance Score (100%). If E data is unavailable (Environment Score = 0 with no environmental inputs), E weight is redistributed: S = 25/65 ≈ 38.5%, G = 40/65 ≈ 61.5%. Result 0–100.', inputs: ['Environment Score (E, 35%)', 'Social Score (S, 25%)', 'Governance Score (G, 40%)'] },
  'circular economy': { formula: 'All input fields are first normalised to percentile (0–100, highest raw value = 100, lowest = 0; Plastic Intensity is inverted: lowest = 100).\nNon-Fashion Companies: Virgin Plastic Reduction % (Percentile) × 20% + Plastic Intensity Score (Percentile, inverted) × 30% + Material Recycled % (Percentile) × 20% + max(EPR, VPN) % (Percentile) × 10% + P&S Recycled/Pkg % (Percentile) × 10% + Recyclable % (Percentile) × 10%.\nFashion & Lifestyle Companies: Recyclable Materials % (Percentile) × 40% + Recyclable Packaging % (Percentile) × 40% + Fresh Water Consumed % (Percentile) × 10% + Water Recycled % (Percentile) × 10%.\nResult 0–100.', inputs: ['Virgin Plastic Reduction % (Percentile)', 'Plastic Intensity Score (Percentile, inverted)', 'Material Recycled % (Percentile)', 'EPR/VPN % (Percentile)', 'P&S Recycled/Pkg % (Percentile)', 'Recyclable % (Percentile)', 'Recyclable Materials % (Fashion, Percentile)', 'Recyclable Packaging % (Fashion, Percentile)', 'Water Consumed Fresh % (Fashion, Percentile)', 'Water Recycled % (Fashion, Percentile)'] },
  'environment score': { formula: 'All input fields are first normalised to percentile (0–100, highest raw value = 100, lowest = 0; Plastic Intensity is inverted: lowest = 100).\nNon-Fashion Companies: Virgin Plastic Reduction % (Percentile) × 20% + Plastic Intensity Score (Percentile, inverted) × 30% + Material Recycled % (Percentile) × 20% + max(EPR, VPN) % (Percentile) × 10% + P&S Recycled/Pkg % (Percentile) × 10% + Recyclable % (Percentile) × 10%.\nFashion & Lifestyle Companies: Recyclable Materials % (Percentile) × 40% + Recyclable Packaging % (Percentile) × 40% + Fresh Water Consumed % (Percentile) × 10% + Water Recycled % (Percentile) × 10%.\nResult 0–100.', inputs: ['Virgin Plastic Reduction % (Percentile)', 'Plastic Intensity Score (Percentile, inverted)', 'Material Recycled % (Percentile)', 'EPR/VPN % (Percentile)', 'P&S Recycled/Pkg % (Percentile)', 'Recyclable % (Percentile)', 'Recyclable Materials % (Fashion, Percentile)', 'Recyclable Packaging % (Fashion, Percentile)', 'Water Consumed Fresh % (Fashion, Percentile)', 'Water Recycled % (Fashion, Percentile)'] },
  'social score': { formula: 'Supplier CoC In Place (Yes=100, No=0) × 10% + Supplier CoC Training (Yes=100, No=0) × 10% + DEI Vendor % (Percentile) × 10% + Gender Ratio (Percentile) × 25% + Women Leadership % (Percentile) × 25% + Pay Parity (Percentile) × 20%. DEI Vendor %, Gender Ratio, Women Leadership, and Pay Parity are percentile-normalized (0–100) across the cohort. Companies without Sourcing & Fulfillment feature: DEI Vendor % weights redistributed to gender metrics. Result 0–100.', inputs: ['Supplier CoC In Place (10%)', 'Supplier CoC Training (10%)', 'DEI Vendor % Percentile (10%)', 'Gender Ratio Percentile (25%)', 'Women in Leadership % Percentile (25%)', 'Pay Parity Percentile (20%)'] },
  'supply chain sustainability score': { formula: 'Now part of Social Score (percentile-based). Social Score = Supplier CoC In Place × 10% + Supplier CoC Training × 10% + DEI Vendor % (Pctile) × 10% + Gender Ratio (Pctile) × 25% + Women Leadership % (Pctile) × 25% + Pay Parity (Pctile) × 20%.', inputs: ['Supplier CoC In Place (10%)', 'Supplier CoC Training (10%)', 'DEI Vendor % (10%)', 'Gender Ratio (25%)', 'Women in Leadership % (25%)', 'Pay Parity Index (20%)'] },
  'supply chain sustainability': { formula: 'Now part of Social Score (percentile-based). Social Score = Supplier CoC In Place × 10% + Supplier CoC Training × 10% + DEI Vendor % (Pctile) × 10% + Gender Ratio (Pctile) × 25% + Women Leadership % (Pctile) × 25% + Pay Parity (Pctile) × 20%.', inputs: ['Supplier CoC In Place (10%)', 'Supplier CoC Training (10%)', 'DEI Vendor % (10%)', 'Gender Ratio (25%)', 'Women in Leadership % (25%)', 'Pay Parity Index (20%)'] },
  'dei composite score': { formula: 'Now part of Social Score. Social Score = Supplier CoC In Place × 10% + Supplier CoC Training × 10% + DEI Vendor % × 10% + Gender Ratio × 25% + Women Leadership % × 25% + Pay Parity × 20%.', inputs: ['Supplier CoC In Place (10%)', 'Supplier CoC Training (10%)', 'DEI Vendor % (10%)', 'Gender Ratio (25%)', 'Women in Leadership % (25%)', 'Pay Parity Index (20%)'] },
  'governance score': { formula: 'Weighted score: Policy Adoption % × 40% + Training Coverage % × 40% + (100 − High Impact Cases Unresolved %) × 20%. Result 0–100.', inputs: ['Policy Adoption %', 'Training Coverage %', 'High Impact Cases Unresolved %'] },
  // SROI
  // SROI
  'jobs created per': { formula: 'Total Number of Jobs / Total Revenue', inputs: ['Total Number of Jobs (Headcount)', 'Net Revenue (INR Cr)'] },
  // Packaging intensity
  'plastic per': { formula: 'Total Plastic (Primary+Secondary) / Net Revenue', inputs: ['All Primary Plastic KPIs (MT)', 'All Secondary Plastic KPIs (MT)', 'Net Revenue (INR Cr)'] },
  'packaging per 1k': { formula: 'Total Packaging Material / Total Customers × 1000', inputs: ['All Packaging Material KPIs (MT)', 'Total Customers Served'] },
};

/** Look up insight formula + inputs by matching title keywords */
const findInsightMeta = (title: string): { formula: string; inputs: string[] } | null => {
  const t = title.toLowerCase();
  for (const [key, meta] of Object.entries(INSIGHT_FORMULA_MAP)) {
    if (t.includes(key)) return meta;
  }
  return null;
};

/** Derive a human-readable unit + calculation hint from the metric title */
const deriveUnitInfo = (title: string, isPct?: boolean): { unit: string; formula: string } => {
  const t = title.toLowerCase();

  // Check insight map first for precise formula
  const insight = findInsightMeta(title);
  if (insight) {
    // Still need to derive unit
    const unitGuess = deriveUnitOnly(t, isPct);
    return { unit: unitGuess, formula: insight.formula };
  }

  // Percentage metrics (explicit or inferred)
  if (isPct || t.includes('(%)')) {
    if (t.includes('fresh water')) return { unit: '%', formula: 'Average of per-company fresh-water % across reporting facilities' };
    if (t.includes('wastewater recycled')) return { unit: '%', formula: 'Average of per-company wastewater recycled % across reporting facilities' };
    if (t.includes('waste recycled')) return { unit: '%', formula: 'Average of per-company waste recycled % across reporting facilities' };
    if (t.includes('renewable energy')) return { unit: '%', formula: 'Average of per-company renewable energy % across reporting facilities' };
    if (t.includes('recyclable') || t.includes('recyclability')) return { unit: '%', formula: 'Average of per-company recyclability % (non-zero reporters only)' };
    if (t.includes('sustainable')) return { unit: '%', formula: 'Average of per-company sustainable materials %' };
    if (t.includes('epr') || t.includes('compliance')) return { unit: '%', formula: 'Average of per-company compliance %' };
    return { unit: '%', formula: 'Average of per-company percentages (non-zero reporters only)' };
  }

  // Avg percentage metrics without explicit (%)
  if (t.includes('avg') && (t.includes('recycled') || t.includes('renewable') || t.includes('fresh water'))) {
    return { unit: '%', formula: 'Average of per-company percentages across reporting facilities' };
  }

  // Derived insight percentages
  if (t.includes('gender pay parity')) return { unit: 'x', formula: '(Avg Female Compensation ÷ Avg Male Compensation). A value of 1.00x = full parity. Formula: (Sum Female Wages / Avg Female Count) ÷ (Sum Male Wages / Avg Male Count)' };
  if (t.includes('gender diversity')) return { unit: '%', formula: '(Female Employees / Total Employees) × 100' };
  if (t.includes('women') && t.includes('leadership')) return { unit: '%', formula: '(Women in Leadership / Total Leadership) × 100' };
  if (t.includes('women') && t.includes('board')) return { unit: '%', formula: '(Women on Board / Total Board Members) × 100' };
  if (t.includes('pwd')) return { unit: '%', formula: '(PwD Employees / Total Employees) × 100' };
  if (t.includes('attrition')) return { unit: '%', formula: 'Per-company attrition rate average (non-zero reporters)' };
  if (t.includes('msme') && !t.includes('classification') && !t.includes('micro') && !t.includes('medium')) return { unit: '%', formula: 'Per-company MSME supplier spend percentage average' };
  if (t.includes('local') || t.includes('localization')) return { unit: '%', formula: '100% − Avg(International % across all vendor categories with reported data)' };
  if (t.includes('dei') && t.includes('vendor')) return { unit: '%', formula: '(Vendor categories with DEI factors selected / Total vendor categories with data) × 100' };
  if (t.includes('waste diversion') || t.includes('waste recycling')) return { unit: '%', formula: 'Average of per-company waste recycled/diverted % across reporting facilities' };
  if (t.includes('water recycling')) return { unit: '%', formula: 'Average of per-company wastewater recycled % across reporting facilities' };
  if (t.includes('renewable energy') || t.includes('energy mix')) return { unit: '%', formula: 'Average of per-company renewable energy % across reporting facilities' };
  if (t.includes('recycled content') || t.includes('recycled plastic adoption')) return { unit: '%', formula: 'Average of per-company recycled content ratios' };
  if (t.includes('virgin plastic') && !t.includes('mt') && !t.includes('metric')) return { unit: '%', formula: 'Average of per-company virgin plastic percentages' };
  if (t.includes('training coverage')) return { unit: '%', formula: 'Average of per-company training coverage rates' };
  if (t.includes('policy adoption')) return { unit: '%', formula: '(Policies adopted / Total policies) × 100' };
  if (t.includes('plastic intensity')) return { unit: '%', formula: 'Average of per-company plastic intensity percentages' };
  if (t.includes('mono-material')) return { unit: '%', formula: 'Average of per-company mono-material recyclable percentages' };
  if (t.includes('synthetic') || t.includes('fiber ratio')) return { unit: '%', formula: 'Average of per-company synthetic vs natural fiber ratios' };
  if (t.includes('textile waste rate') || t.includes('post-m') && t.includes('waste')) return { unit: '%', formula: 'Average of per-company textile waste rates' };
  if (t.includes('paper-to-plastic')) return { unit: 'Ratio', formula: 'Average of per-company paper-to-plastic ratios' };
  if (t.includes('enps')) return { unit: '', formula: 'Average eNPS score across reporting companies (rated 0-10)' };
  if (t.includes('healthcare') && t.includes('products')) return { unit: 'Count', formula: 'Sum of per-company reported healthcare products/services offered. Only companies that have filled this KPI are included.' };
  if (t.includes('healthcare') && t.includes('consultations')) return { unit: 'Count', formula: 'Sum of per-company reported doctor consultations and patient screenings. Only companies that have filled this KPI are included.' };
  if (t.includes('healthcare')) return { unit: 'Count', formula: 'Sum of per-company healthcare access counts' };

  // Explicit unit in parentheses — extract and map
  const parenMatch = title.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const raw = parenMatch[1].trim();
    const rl = raw.toLowerCase();
    if (rl.includes('kwh')) return { unit: 'kWh', formula: 'Sum of per-company total energy consumed (electricity + fuel) across all facilities' };
    if (rl.includes('thousand m') || rl === 'kl') return { unit: 'KL', formula: 'Sum of per-company values across all reporting facilities' };
    if (rl.includes('metric ton')) return { unit: 'MT', formula: 'Sum of per-company waste generated across all reporting facilities' };
    if (rl === 'mt') return { unit: 'MT', formula: 'Sum of per-company material quantities in metric tonnes' };
    if (rl === '₹') return { unit: '₹', formula: 'Sum of per-company reported amounts in Rupees' };
    if (rl.includes('inr cr')) return { unit: 'INR Cr', formula: 'Sum of per-company reported amounts in INR Crores' };
    if (rl.includes('inr l') || rl.includes('lakh')) return { unit: 'INR Lakhs', formula: 'Average of per-company compensation in INR Lakhs' };
    return { unit: raw, formula: `Sum of per-company values (${raw})` };
  }

  // CSR spend is in Rupees (not Crores)
  if (t.includes('csr') && (t.includes('spend') || t.includes('spent') || t.includes('amount'))) return { unit: '₹', formula: 'Sum of per-company CSR amount spent in Rupees' };

  // Wages & compensation — in INR Cr
  if (t.includes('wage') || t.includes('gross wage')) return { unit: 'INR Cr', formula: 'Sum of per-company reported wages in INR Crores' };
  if (t.includes('cxo') && t.includes('compensation')) return { unit: 'INR Cr', formula: 'Average of per-company CXO compensation in INR Crores' };
  if (t.includes('employee') && t.includes('compensation')) return { unit: 'INR Cr', formula: 'Average WC employee compensation = WC Gross Wages (INR Cr) / WC Employees' };
  if (t.includes('expenditure')) return { unit: 'INR Cr', formula: 'Sum of per-company expenditure in INR Crores' };
  if (t.includes('spend') || t.includes('spent')) return { unit: '₹', formula: 'Sum of per-company reported amounts in Rupees' };
  if (t.includes('jobs per') && t.includes('revenue')) return { unit: '# of Jobs', formula: 'Avg Total Employees (Q1-Q4) / Sum Net Revenue (₹ Cr) across Q1-Q4' };
  if (t.includes('revenue') && !t.includes('per') && !t.includes('jobs')) return { unit: 'INR Cr', formula: 'Sum of per-company revenue in INR Crores' };

  // Water / energy / waste totals (no parens in title)
  if (t.includes('water consumption') || t.includes('water consumed')) return { unit: 'KL', formula: 'Sum of per-company total water consumed across all facilities' };
  if (t.includes('wastewater generation') || t.includes('wastewater generated')) return { unit: 'KL', formula: 'Sum of per-company wastewater generated across all facilities' };
  if (t.includes('energy consumption') || t.includes('energy consumed')) return { unit: 'kWh', formula: 'Sum of per-company total energy consumed (electricity + fuel) across all facilities' };
  if (t.includes('waste generated')) return { unit: 'MT', formula: 'Sum of per-company waste generated across all reporting facilities' };

  // Packaging materials
  if (t.includes('packaging') || t.includes('material') || t.includes('plastic') || t.includes('paper') || t.includes('metal') || t.includes('glass') || t.includes('plant-based') || t.includes('textile')) {
    // Vendor count fields should NOT be treated as MT
    if (t.includes('vendor') && t.includes('count')) return { unit: 'Count', formula: 'Sum of per-company vendor counts' };
    if (t.includes('mt') || t.includes('metric ton')) return { unit: 'MT', formula: 'Sum of per-company material quantities in metric tonnes' };
    return { unit: 'MT', formula: 'Sum of per-company material quantities in metric tonnes' };
  }

  // EPR targets
  if (t.includes('epr') && t.includes('target')) return { unit: 'MT', formula: 'Sum of per-company EPR targets in metric tonnes' };

  // Plastic reduction
  if (t.includes('reduction') && t.includes('plastic')) return { unit: '%', formula: '((Q1 Plastic Intensity − Q4 Plastic Intensity) / Q1 Plastic Intensity) × 100' };

  // Cross-module composite scores (must be before generic ratio/index/score)
  if (t.includes('esg composite score')) return { unit: 'Score', formula: 'E × 35% + S × 25% + G × 40%; E = Environment Score, S = Social Score, G = Governance Score' };
  if (t.includes('environment score') || t.includes('circular economy')) return { unit: 'Score', formula: 'Non-Fashion: Virgin Plastic Red. × 20% + Plastic Intensity × 30% + Material Recycled × 20% + EPR/VPN × 10% + P&S Recycled/Pkg × 10% + Recyclable × 10%. Fashion: Recyclable Materials × 40% + Recyclable Pkg × 40% + Water Consumed (Fresh %) × 10% + Water Recycled × 10%' };
  if (t.includes('social score')) return { unit: 'Score', formula: 'Supplier CoC (binary) × 10% + Training (binary) × 10% + DEI Vendor % (Pctile) × 10% + Gender Ratio (Pctile) × 25% + Women Leadership (Pctile) × 25% + Pay Parity (Pctile) × 20%. Companies without Sourcing feature: CoC weights redistributed.' };
  if (t.includes('supply chain sustainability score')) return { unit: 'Score', formula: 'Now Social Score (percentile-based)' };
  if (t.includes('dei composite score')) return { unit: 'Score', formula: 'Now Social Score (percentile-based)' };
  if (t.includes('governance score')) return { unit: 'Score', formula: 'Policy Adoption × 40% + Training × 40% + (100 − High Impact Unresolved %) × 20%' };

  // Ratio / index metrics
  if (t.includes('ratio') || t.includes('index') || t.includes('score')) {
    if (t.includes('pay parity') || t.includes('pay ratio')) return { unit: 'Ratio', formula: 'Average of per-company pay ratios (non-zero reporters)' };
    if (t.includes('cxo')) return { unit: 'x', formula: 'Avg CXO Comp per CXO ÷ Avg WC Employee Comp' };
    if (t.includes('wc:bc') || t.includes('wc to bc')) return { unit: 'Ratio', formula: 'Average of per-company white-collar to blue-collar ratios' };
    if (t.includes('jobs') && t.includes('revenue')) return { unit: '# of Jobs', formula: 'Total Number of Jobs / Total Revenue' };
    if (t.includes('supply chain') && t.includes('sustainability')) return { unit: '/100', formula: '(MSME Supplier Spend % + DEI-Compliant Vendor % + Supply Chain Localization Index %) / 3' };
    if (t.includes('small') && t.includes('large')) return { unit: '', formula: 'Count of vendor categories by size: Small-scale (Individual/SME/Micro) vs Large-scale (MNC/Large). Ratio = Small / Large' };
    return { unit: 'Score', formula: 'Average of per-company scores (non-zero reporters only)' };
  }

  // Incident / case counts
  if (t.includes('incident') || t.includes('posh') || t.includes('grievance') || t.includes('case') || t.includes('high impact') || t.includes('open') || t.includes('unresolved')) {
    if (t.includes('resolution') || t.includes('ratio')) return { unit: '%', formula: 'Average of per-company case resolution rates' };
    if (t.includes('intensity')) return { unit: 'Count', formula: 'PoSH cases / Total Employees × 1000' };
    return { unit: 'Count', formula: 'Sum of per-company reported incident/case counts' };
  }

  // EPR & Voluntary Plastic — company counts (no "Companies" unit in detail view)
  if (t.includes('epr compliant')) return { unit: 'Count', formula: 'Count of companies with EPR Compliance % > 0 (cumulative across quarters)' };
  if (t.includes('voluntary plastic initiative')) return { unit: 'Count', formula: 'Count of companies with Voluntary Plastic Neutrality % > 0 (cumulative across quarters)' };
  // EPR/Plastic Neutrality Partner Names — text list, not MT
  if (t.includes('partner name')) return { unit: 'Text', formula: 'List of EPR / Voluntary Plastic Neutrality partner names per company. Shows count of companies with a partner mentioned.' };

  // Count / headcount
  if (t.includes('count') || t.includes('number') || t.includes('companies')) {
    if (t.includes('award') || t.includes('media')) return { unit: 'Count', formula: 'Sum of per-company counts (parsed from reported lists)' };
    return { unit: 'Count', formula: 'Sum of per-company values' };
  }

  // Employee headcount fields
  if (t.includes('employee') || t.includes('workforce') || t.includes('male') || t.includes('female') || t.includes('collar') ||
      t.includes('full-time') || t.includes('contractual') || t.includes('part-time') || t.includes('total employment') ||
      t.includes('board') || t.includes('c-level') || t.includes('leadership') || t.includes('independent member')) {
    return { unit: 'Headcount', formula: 'Sum of per-company employee counts' };
  }

  // Awards & Media Mentions
  if (t.includes('total awards')) return { unit: 'Text', formula: 'Award Title — Award Description for each company' };
  if (t.includes('total media mentions') || t.includes('media mention')) return { unit: 'Text', formula: 'Title — Relevant Link for each company' };

  // Initiatives / text-based
  if (t.includes('initiative') || t.includes('certificate') || t.includes('certification')) {
    return { unit: 'Text', formula: 'List of reported initiative/certificate names per company' };
  }

  // CSR spend ratio
  if (t.includes('csr') && t.includes('ratio')) return { unit: 'Ratio', formula: '(CSR Spend / Revenue) × 100' };

  // MSME classification
  if (t.includes('micro') || t.includes('small') || t.includes('medium')) return { unit: 'Count', formula: 'Count of companies in this MSME classification' };

  return { unit: '', formula: 'Sum of per-company reported values' };
};

/** Unit-only derivation helper (no formula) */
const deriveUnitOnly = (t: string, isPct?: boolean): string => {
  // Plastic reduction
  if (t.includes('reduction') && t.includes('plastic')) return '%';
  // Gender Pay Parity Index uses 'x' unit (not %)
  if (t.includes('gender pay parity')) return 'x';
  // Cross-module composite scores
  if (t.includes('esg composite') || t.includes('circular economy') || t.includes('supply chain sustainability') || t.includes('dei composite') || t === 'governance score') return 'Score';
  if (isPct || t.includes('(%)') || t.includes('ratio') && !t.includes('pay') && !t.includes('cxo') && !t.includes('wc') && !t.includes('small') && !t.includes('vendor mix')) {
    if (t.includes('paper-to-plastic')) return 'Ratio';
    return '%';
  }
  if (t.includes('mt plastic per') && t.includes('revenue')) return 'MT / ₹ Cr';
  if (t.includes('plastic per') && t.includes('revenue')) return 'MT/₹Cr';
  if (t.includes('mt packaging per') && t.includes('customer')) return 'MT / 1000 cust';
  if (t.includes('jobs created per') && t.includes('revenue')) return '# of Jobs';
  if (t.includes('jobs per') && t.includes('revenue')) return '# of Jobs';
  if (t.includes('intensity') && t.includes('posh')) return 'Count';
  if (t.includes('incident count')) return 'Count';
  if (t.includes('epr compliant')) return 'Count';
  if (t.includes('voluntary plastic initiative')) return 'Count';
  if (t.includes('partner name')) return 'Text';
  if (t.includes('healthcare')) return 'Count';
  if (t.includes('water consumption')) return 'KL';
  if (t.includes('energy consumption')) return 'kWh';
  if (t.includes('waste generated')) return 'MT';
  if (t.includes('cxo pay ratio')) return 'x';
  if (t.includes('white collar to blue collar')) return 'Ratio';
  if (t.includes('small-scale vs large-scale') || t.includes('small-scale') && t.includes('vendor mix')) return '';
  if (t.includes('plastic intensity') && t.includes('revenue')) return 'MT/₹Cr';
  if (t.includes('csr spend ratio')) return 'Ratio';
  return '%';
};

const AnalyticsDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMissing, setShowMissing] = useState(false);
  const rawState = location.state as {
    title: string;
    featureLabel: string;
    companyData: CompanyDataRow[];
    filters: any;
    isPct?: boolean;
    unit?: string;
    formula?: string;
    allFilteredCompanies?: { brand: string; companyName: string; industry: string }[];
    hasQuarterlyColumns?: boolean;
    ratioColumnHeaders?: string[];
    sourceKpiKey?: string;
    sourceInsightKey?: string;
    sourceCalcId?: string;
    hideNotConsidered?: boolean;
    lowCompletenessBrands?: string[];
  } | null;

  const state = rawState;

  // Determine context-aware defaults for filters
  const isQuarterlyView = state?.filters?.period === 'quarterly';
  const contextQuarter = state?.filters?.quarter || 'Q4';
  const contextYear = state?.filters?.year ? String(state.filters.year) : '2025';

  // Auto-detect quarterly data availability from rows (initial check from state)
  const stateHasQuarterly = useMemo(() => {
    if (!state) return false;
    return state.hasQuarterlyColumns || state.companyData.some(r => r.q1 || r.q2 || r.q3 || r.q4);
  }, [state]);

  // Initialize filters
  const [filterQuarter, setFilterQuarter] = useState<string>(isQuarterlyView ? contextQuarter : 'all');
  const [filterYear, setFilterYear] = useState<string>(contextYear);
  const [filterQCategory, setFilterQCategory] = useState<string>(state?.filters?.qCategory || 'all');

  // Determine if we need to re-fetch (year changed from original)
  const yearChanged = filterYear !== contextYear;
  const canRefetch = !!(state?.sourceKpiKey || state?.sourceInsightKey || state?.sourceCalcId);

  // Always fetch with period='annual' so quarterlyPerQuarterRawData is built for Q1-Q4 breakdown
  const detailFetchFilters: AnalyticsFilters = useMemo(() => {
    return {
      period: 'annual' as const,
      quarter: state?.filters?.quarter,
      year: parseInt(filterYear),
      industry: state?.filters?.industry,
      fund: state?.filters?.fund,
      revenueStage: state?.filters?.revenueStage,
      companyId: state?.filters?.companyId,
      qCategory: filterQCategory === 'all' ? undefined : filterQCategory as QCategory,
    };
  }, [state, filterYear, filterQCategory]);

  // Always fetch data — forces annual mode so per-quarter breakdowns are available
  const { data: freshData, isLoading: isRefetching } = useAnalyticsDashboardData(detailFetchFilters);

  // Fetch feature-enabled company IDs so the detail rebuild matches the dashboard scoping
  const [featureEnabledCompanyIds, setFeatureEnabledCompanyIds] = useState<Set<string> | null>(null);
  useEffect(() => {
    const featureKey = state?.filters?.feature;
    if (!featureKey) { setFeatureEnabledCompanyIds(null); return; }
    const fetchIds = async () => {
      // For packaging analytics, also include fashionMaterials companies
      const featureKeys = featureKey === 'primarySecondaryPackaging'
        ? ['primarySecondaryPackaging', 'fashionMaterials']
        : [featureKey];
      const { data } = await supabase
        .from('company_feature_settings')
        .select('company_id')
        .in('feature_key', featureKeys)
        .eq('enabled', true);
      if (data && data.length > 0) {
        setFeatureEnabledCompanyIds(new Set(data.map(d => d.company_id)));
      }
    };
    fetchIds();
  }, [state?.filters?.feature]);

  // Helper: filter raw data to only feature-enabled companies (when available)
  const applyFeatureCompanyFilter = (data: CompanyRawMetrics[]): CompanyRawMetrics[] => {
    if (!featureEnabledCompanyIds || featureEnabledCompanyIds.size === 0) return data;
    return data.filter(c => featureEnabledCompanyIds.has(c.companyId));
  };

  // ── Calc function registry for sourceCalcId-based rebuilds ──
  const resolveCalcFn = (calcId: string): ((c: CompanyRawMetrics) => number) | null => {
    const parseNum = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };

    // "agg:fieldName" → direct aggregation field lookup
    if (calcId.startsWith('agg:')) {
      const field = calcId.slice(4) as keyof AggregationMetrics;
      return (c) => (c.aggregation[field] as number) || 0;
    }

    // "calc:id" → replicated calc functions
    const WATER_FACILITIES = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'dark_stores', 'distribution'];
    const ENERGY_FACILITIES = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'data_center', 'retail', 'distribution'];
    const WASTE_FACILITIES = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'dark_stores', 'distribution'];

    const calcMap: Record<string, (c: CompanyRawMetrics) => number> = {
      'calc:highImpactIncidents': (c) => {
        const INCIDENT_TYPES = ['posh', 'supplier_vendor', 'customer_grievance', 'employee_grievance', 'environmental', 'health_safety', 'security_data_privacy', 'negative_media', 'anti_bribery_corruption', 'other_regulatory'];
        let total = 0;
        INCIDENT_TYPES.forEach(type => {
          const cases = parseNum(c.kpis[`incident_${type}_cases`]);
          const impact = (c.kpis[`incident_${type}_impact`] || '').toLowerCase().trim();
          if (impact.includes('high')) total += cases;
        });
        return total;
      },
      'calc:waterConsumed': (c) => {
        let total = 0;
        WATER_FACILITIES.forEach(f => { total += parseNum(c.kpis[`water_detailed_${f}_water_consumed`]); });
        return total;
      },
      'calc:freshWater': (c) => {
        let sum = 0, count = 0;
        WATER_FACILITIES.forEach(f => {
          const consumed = parseNum(c.kpis[`water_detailed_${f}_water_consumed`]);
          const pct = parseNum(c.kpis[`water_detailed_${f}_fresh_water_pct`]);
          if (consumed > 0 && pct > 0) { sum += pct; count++; }
        });
        return count > 0 ? Math.round(sum / count * 100) / 100 : 0;
      },
      'calc:wastewaterGen': (c) => {
        let total = 0;
        WATER_FACILITIES.forEach(f => { total += parseNum(c.kpis[`water_detailed_${f}_wastewater_generated`]); });
        return total;
      },
      'calc:wastewaterRecycled': (c) => {
        const pcts = WATER_FACILITIES.map(f => parseNum(c.kpis[`water_detailed_${f}_wastewater_recycled_pct`])).filter(v => v > 0);
        return pcts.length > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length * 100) / 100 : 0;
      },
      'calc:energyConsumed': (c) => {
        let total = 0;
        ENERGY_FACILITIES.forEach(f => { total += parseNum(c.kpis[`energy_detailed_${f}_energy_consumed`]); });
        return total;
      },
      'calc:renewableEnergy': (c) => {
        let sum = 0, count = 0;
        ENERGY_FACILITIES.forEach(f => {
          const consumed = parseNum(c.kpis[`energy_detailed_${f}_energy_consumed`]);
          const renew = parseNum(c.kpis[`energy_detailed_${f}_renewable_pct`]);
          if (consumed > 0 && renew > 0) { sum += renew; count++; }
        });
        return count > 0 ? Math.round(sum / count * 100) / 100 : 0;
      },
      'calc:wasteGen': (c) => {
        let total = 0;
        WASTE_FACILITIES.forEach(f => { total += parseNum(c.kpis[`waste_detailed_${f}_waste_generated`]); });
        return total;
      },
      'calc:wasteRecycled': (c) => {
        let sum = 0, count = 0;
        WASTE_FACILITIES.forEach(f => {
          const gen = parseNum(c.kpis[`waste_detailed_${f}_waste_generated`]);
          const rec = parseNum(c.kpis[`waste_detailed_${f}_waste_recycled_pct`]);
          if (gen > 0 && rec > 0) { sum += rec; count++; }
        });
        return count > 0 ? Math.round(sum / count * 100) / 100 : 0;
      },
      'calc:mtPackagingPer1000Customers': (c) => {
        const totalPkg = parseNum(c.kpis['food_pkg_basic_total_total_material_used']);
        const totalCust = parseNum(c.kpis['total_customers_served']);
        return totalCust > 0 ? Math.round((totalPkg / totalCust) * 1000 * 100) / 100 : 0;
      },
      'calc:mtPlasticPerCrRevenue': (c) => {
        const p = (k: string) => parseNum(c.kpis[k]);
        const totalPlastic = p('food_pkg_basic_primary_breakup_primary_plastic_virgin') + p('food_pkg_basic_primary_breakup_primary_plastic_recycled') + p('food_pkg_detailed_secondary_breakup_secondary_plastic_virgin') + p('food_pkg_detailed_secondary_breakup_secondary_plastic_recycled') + p('fashion_primary_pkg_plastic_recyclable_mt') + p('fashion_primary_pkg_plastic_non_recyclable_mt') + p('fashion_secondary_pkg_plastic_recyclable_mt') + p('fashion_secondary_pkg_plastic_non_recyclable_mt') + p('fashion_warehouse_pkg_plastic_recyclable_mt') + p('fashion_warehouse_pkg_plastic_non_recyclable_mt');
        const rev = p('net_revenue');
        return rev > 0 ? Math.round((totalPlastic / rev) * 100) / 100 : 0;
      },
      'calc:eprComplianceGapFashion': (c) => {
        const target = parseNum(c.kpis['fashion_epr_target']);
        const actual = parseNum(c.kpis['fashion_epr_compliance_pct']);
        return Math.round((target - actual) * 100) / 100;
      },
      'calc:avgWcWagePerEmployee': (c) => {
        const wcEmp = parseNum(c.kpis['employees_wc_male_fulltime']) + parseNum(c.kpis['employees_wc_male_contractual']) + parseNum(c.kpis['employees_wc_male_parttime']) +
          parseNum(c.kpis['employees_wc_female_fulltime']) + parseNum(c.kpis['employees_wc_female_contractual']) + parseNum(c.kpis['employees_wc_female_parttime']);
        const wcW = parseNum(c.kpis['employees_wc_wages_male']) + parseNum(c.kpis['employees_wc_wages_female']);
        return wcEmp > 0 && wcW > 0 ? Math.round((wcW / wcEmp) * 100) / 100 : 0;
      },
      'calc:avgBcWagePerEmployee': (c) => {
        const bcEmp = parseNum(c.kpis['employees_bc_male_fulltime']) + parseNum(c.kpis['employees_bc_male_contractual']) + parseNum(c.kpis['employees_bc_male_parttime']) +
          parseNum(c.kpis['employees_bc_female_fulltime']) + parseNum(c.kpis['employees_bc_female_contractual']) + parseNum(c.kpis['employees_bc_female_parttime']);
        const bcW = parseNum(c.kpis['employees_bc_wages_male']) + parseNum(c.kpis['employees_bc_wages_female']);
        return bcEmp > 0 && bcW > 0 ? Math.round((bcW / bcEmp) * 100) / 100 : 0;
      },
      'calc:avgEmployeeCompensation': (c) => {
        const wcEmpKeys = ['employees_wc_male_fulltime', 'employees_wc_male_contractual', 'employees_wc_male_parttime', 'employees_wc_female_fulltime', 'employees_wc_female_contractual', 'employees_wc_female_parttime'];
        const totalEmp = wcEmpKeys.reduce((s, k) => s + parseNum(c.kpis[k]), 0);
        const totalWages = parseNum(c.kpis['employees_wc_wages_male']) + parseNum(c.kpis['employees_wc_wages_female']);
        return totalEmp > 0 ? Math.round((totalWages / totalEmp) * 100) / 100 : 0;
      },
    };

    return calcMap[calcId] || null;
  };

  // Rebuild company data from fresh data with quarterly breakdowns
  const rebuiltCompanyData = useMemo(() => {
    if (!freshData || !state || !canRefetch) return null;

    const sourceKpiKey = state.sourceKpiKey;
    const sourceInsightKey = state.sourceInsightKey as keyof InsightMetrics | undefined;
    const sourceCalcId = state.sourceCalcId;

    if (sourceKpiKey) {
      // Headcount KPI keys use Q4 snapshot as the primary "Value" column
      const q4SnapshotKeys = new Set([
        'employees_wc_male_fulltime', 'employees_wc_male_contractual', 'employees_wc_male_parttime',
        'employees_wc_female_fulltime', 'employees_wc_female_contractual', 'employees_wc_female_parttime',
        'employees_bc_male_fulltime', 'employees_bc_male_contractual', 'employees_bc_male_parttime',
        'employees_bc_female_fulltime', 'employees_bc_female_contractual', 'employees_bc_female_parttime',
        'leadership_clevel_total', 'leadership_clevel_male', 'leadership_clevel_female',
        'leadership_board_total', 'leadership_board_male', 'leadership_board_female', 'leadership_board_independent',
        // Vendor MIS vendor counts use Q4 snapshot
        'vendor_mis_input_materials_num_vendors', 'vendor_mis_manufacturing_num_vendors',
        'vendor_mis_packaging_num_vendors', 'vendor_mis_logistics_warehousing_num_vendors',
        'vendor_mis_stores_clinics_num_vendors',
      ]);
      // Vendor count fields: exclude 0/NA/N/A from data rows (move to "Not Considered")
      const isVendorCountKey = sourceKpiKey.startsWith('vendor_mis_') && sourceKpiKey.endsWith('_num_vendors');
      const useQ4ForValue = q4SnapshotKeys.has(sourceKpiKey) && freshData.quarterlyPerQuarterRawData?.['Q4'];

      // Use quarterlyCombined for the main value (annual aggregate), but fall back to
      // companyRawData (FY) when the specific KPI has no data in quarterly combined
      // (e.g. CSR fields that are stored as FY-only entries).
      let rawData = applyFeatureCompanyFilter(freshData.quarterlyCombinedRawData || freshData.companyRawData);
      const hasDataInQuarterly = rawData.some(c => {
        const val = c.kpis[sourceKpiKey];
        return val !== undefined && val !== null && val.trim() !== '';
      });
      if (!hasDataInQuarterly && freshData.companyRawData) {
        rawData = applyFeatureCompanyFilter(freshData.companyRawData);
      }

      // Apply feature-specific scoping for sourceKpiKey-based rebuilds
      const featureFilter = state.filters?.feature;
      const kpiFeaturePrefixMap: Record<string, string[]> = {
        primarySecondaryPackaging: ['food_pkg_', 'fashion_primary_pkg_', 'fashion_secondary_pkg_', 'fashion_warehouse_pkg_'],
        fashionMaterials: ['fashion_'],
        wasteManagement: ['waste_detailed_'],
        waterManagement: ['water_detailed_', 'energy_detailed_'],
        energyManagement: ['energy_detailed_', 'water_detailed_'],
        governancePolicies: ['policy_'],
      };
      const kpiFeaturePrefixes = featureFilter ? kpiFeaturePrefixMap[featureFilter] : undefined;
      if (kpiFeaturePrefixes) {
        rawData = rawData.filter(c => {
          const keys = Object.keys(c.kpis).filter(k => c.kpis[k]?.trim());
          return keys.some(k => kpiFeaturePrefixes.some(p => k.startsWith(p)));
        });
      }

      // For Q4 snapshot metrics, use Q4 data as the source for filtering & value
      let q4Source = useQ4ForValue ? (freshData.quarterlyPerQuarterRawData!['Q4'] || []) : null;
      if (q4Source && kpiFeaturePrefixes) {
        q4Source = q4Source.filter(c => {
          const keys = Object.keys(c.kpis).filter(k => c.kpis[k]?.trim());
          return keys.some(k => kpiFeaturePrefixes.some(p => k.startsWith(p)));
        });
      }
      const valueSource = q4Source || rawData;

      // KPI keys where annual Value = SUM of quarterly values (not the averaged combined value)
      const sumNotAvgKeys = new Set(['leadership_avg_cxo_compensation']);

      const rows: CompanyDataRow[] = valueSource
        .filter(c => {
          const val = c.kpis[sourceKpiKey];
          if (val === undefined || val === null || val.trim() === '') return false;
          // For vendor count fields, exclude 0/NA/N/A (they go to "Not Considered")
          if (isVendorCountKey) {
            const trimmed = val.trim().toLowerCase();
            if (trimmed === '0' || trimmed === 'na' || trimmed === 'n/a') return false;
          }
          return true;
        })
        .map(c => {
          const rawMainVal = c.kpis[sourceKpiKey] || '';
          const parsedMain = parseFloat(rawMainVal);
          const row: CompanyDataRow = {
            brand: c.brand,
            companyName: c.companyName,
            industry: c.industry,
            value: !isNaN(parsedMain) ? String(parsedMain) : rawMainVal,
          };
          // Add quarterly breakdown
          if (freshData.quarterlyPerQuarterRawData) {
            let qSum = 0;
            let qCount = 0;
            ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
              const qData = freshData.quarterlyPerQuarterRawData![q] || [];
              const match = qData.find(qc => qc.companyId === c.companyId);
              if (match) {
                const rawVal = match.kpis[sourceKpiKey];
                if (rawVal !== undefined && rawVal !== null && rawVal.trim() !== '') {
                  const parsed = parseFloat(rawVal);
                  (row as any)[q.toLowerCase()] = !isNaN(parsed) ? String(parsed) : rawVal;
                  if (!isNaN(parsed)) { qSum += parsed; qCount++; }
                } else {
                  (row as any)[q.toLowerCase()] = '';
                }
              }
            });
            // Override Value with sum of quarterly values for specific KPIs
            if (sumNotAvgKeys.has(sourceKpiKey) && qCount > 0) {
              row.value = String(Math.round(qSum * 100) / 100);
            }
          }
          return row;
        });
      return rows;
    }
    // Annual-only insight keys that don't have quarterly breakdowns
    const annualOnlyInsightKeysSet = new Set([
      'esgCompositeScore', 'circularEconomyIndex', 'supplyChainSustainabilityScore',
      'governanceScore', 'deiCompositeScore',
      // Water, Energy, Waste metrics are FY-only
      'waterRecyclingRate', 'totalWaterConsumption', 'totalEnergyConsumption',
      'renewableEnergyMix', 'wasteDiversionRate', 'totalWasteGeneratedInsight',
    ]);

    if (sourceInsightKey) {
      const isAnnualOnlyInsight = annualOnlyInsightKeysSet.has(sourceInsightKey as string);
      let rawData = applyFeatureCompanyFilter(freshData.quarterlyCombinedRawData || freshData.companyRawData);

      // For CSR, check if quarterly combined data has CSR entries; if not, fall back to FY
      if (sourceInsightKey === 'csrSpendRatio' && freshData.companyRawData) {
        const hasCSRInQuarterly = rawData.some(c => {
          const v = parseFloat(c.kpis['csr_amount_spent'] || '0') || 0;
          return v > 0;
        });
        if (!hasCSRInQuarterly) {
          rawData = applyFeatureCompanyFilter(freshData.companyRawData);
        }
      }

      // Annual-only metrics (Water, Energy, Waste) are stored as FY-only.
      // quarterlyCombinedRawData (Q1-Q4 combined) won't have this data,
      // so fall back to companyRawData (FY) which has it.
      if (annualOnlyInsightKeysSet.has(sourceInsightKey) && freshData.companyRawData) {
        const checkKey = sourceInsightKey === 'waterRecyclingRate' || sourceInsightKey === 'totalWaterConsumption' ? 'water_detailed_office_water_consumed'
          : sourceInsightKey === 'totalEnergyConsumption' || sourceInsightKey === 'renewableEnergyMix' ? 'energy_detailed_office_energy_consumed'
          : sourceInsightKey === 'wasteDiversionRate' || sourceInsightKey === 'totalWasteGeneratedInsight' ? 'waste_detailed_office_waste_generated'
          : sourceInsightKey === 'policyAdoptionRate' || sourceInsightKey === 'trainingCoverageRate' ? 'policy_posh_in_place'
          : sourceInsightKey === 'esgCompositeScore' || sourceInsightKey === 'circularEconomyIndex' ? 'waste_detailed_office_waste_generated'
          : sourceInsightKey === 'supplyChainSustainabilityScore' || sourceInsightKey === 'governanceScore' ? 'policy_supplier_code_of_conduct_in_place'
          : sourceInsightKey === 'deiCompositeScore' ? 'employees_wc_male_fulltime'
          : 'waste_detailed_office_waste_generated';
        const hasDataInQuarterly = rawData.some(c => {
          const v = parseFloat(c.kpis[checkKey] || '0') || 0;
          return v > 0;
        });
        if (!hasDataInQuarterly) {
          rawData = applyFeatureCompanyFilter(freshData.companyRawData);
        }
      }

      // Scope to feature-specific companies so detail page only includes
      // companies that actually have data for the relevant module.
      const featureFilter = state.filters?.feature;
      const insightFeaturePrefixMap: Record<string, string[]> = {
        primarySecondaryPackaging: ['food_pkg_', 'fashion_primary_pkg_', 'fashion_secondary_pkg_', 'fashion_warehouse_pkg_'],
        fashionMaterials: ['fashion_'],
        wasteManagement: ['waste_detailed_'],
        waterManagement: ['water_detailed_', 'energy_detailed_'],
        energyManagement: ['energy_detailed_', 'water_detailed_'],
        governancePolicies: ['policy_'],
      };
      const insightFeaturePrefixes = featureFilter ? insightFeaturePrefixMap[featureFilter] : undefined;
      if (insightFeaturePrefixes) {
        rawData = rawData.filter(c => {
          const keys = Object.keys(c.kpis).filter(k => c.kpis[k]?.trim());
          return keys.some(k => insightFeaturePrefixes.some(p => k.startsWith(p)));
        });
      }

      // For csrSpendRatio, build quarterly-summed revenue lookup
      const revenueByCompany = new Map<string, number>();
      if (sourceInsightKey === 'csrSpendRatio' && freshData.quarterlyPerQuarterRawData) {
        Object.values(freshData.quarterlyPerQuarterRawData).forEach(qArr => {
          for (const qc of qArr) {
            const rev = parseFloat(qc.kpis['net_revenue'] || '0') || 0;
            revenueByCompany.set(qc.companyId, (revenueByCompany.get(qc.companyId) || 0) + rev);
          }
        });
      }

      // For plasticReductionPct, compute base/Q4 plastic intensity from quarterly data (base = earliest of Q1→Q2→Q3)
      const plasticIntensityMap = new Map<string, { base: number; q4: number; baseVirginMT: number; q4VirginMT: number; baseQuarter: string }>();
      if (sourceInsightKey === 'plasticReductionPct' && freshData.quarterlyPerQuarterRawData) {
        const parseNum = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
        const VIRGIN_PLASTIC_KEYS = [
          'food_pkg_basic_primary_breakup_primary_plastic_virgin',
          'food_pkg_detailed_secondary_breakup_secondary_plastic_virgin',
          'fashion_primary_pkg_plastic_recyclable_mt',
          'fashion_primary_pkg_plastic_non_recyclable_mt',
          'fashion_warehouse_pkg_plastic_recyclable_mt',
          'fashion_warehouse_pkg_plastic_non_recyclable_mt',
          'fashion_secondary_pkg_plastic_recyclable_mt',
          'fashion_secondary_pkg_plastic_non_recyclable_mt',
        ];
        const hasPlasticData = (kpis: Record<string, string | undefined>) =>
          VIRGIN_PLASTIC_KEYS.some(k => kpis[k] !== undefined && kpis[k] !== '' && kpis[k] !== null);
        const getVirginPlasticMT = (kpis: Record<string, string | undefined>) =>
          VIRGIN_PLASTIC_KEYS.reduce((sum, k) => sum + parseNum(kpis[k]), 0);
        const getPlasticIntensity = (kpis: Record<string, string | undefined>) => {
          const virginMT = getVirginPlasticMT(kpis);
          const revenue = parseNum(kpis['net_revenue']);
          return revenue > 0 ? virginMT / revenue : 0;
        };
        // Apply feature filter to quarterly data to match stat card scoping
        const featureFilter = (c: CompanyRawMetrics) =>
          !featureEnabledCompanyIds || featureEnabledCompanyIds.size === 0 || featureEnabledCompanyIds.has(c.companyId);

        // Build base quarter data: use earliest available quarter (Q1 → Q2 → Q3) per company
        const baseQuarterData = new Map<string, { intensity: number; virginMT: number; quarter: string }>();
        ['Q1', 'Q2', 'Q3'].forEach(q => {
          const qData = (freshData.quarterlyPerQuarterRawData![q] || []).filter(featureFilter);
          qData.forEach(c => {
            if (!baseQuarterData.has(c.companyId) && hasPlasticData(c.kpis)) {
              baseQuarterData.set(c.companyId, { intensity: getPlasticIntensity(c.kpis), virginMT: getVirginPlasticMT(c.kpis), quarter: q });
            }
          });
        });

        const q4Data = (freshData.quarterlyPerQuarterRawData['Q4'] || []).filter(featureFilter);
        const q4Map = new Map(q4Data.filter(c => hasPlasticData(c.kpis)).map(c => [c.companyId, { intensity: getPlasticIntensity(c.kpis), virginMT: getVirginPlasticMT(c.kpis) }]));
        const q4HasData = new Map(q4Data.map(c => [c.companyId, hasPlasticData(c.kpis)]));

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
          const baseVM = baseData?.virginMT || 0;
          const q4VM = q4Map.get(id)?.virginMT || 0;
          plasticIntensityMap.set(id, { base: baseInt, q4: q4Int, baseVirginMT: baseVM, q4VirginMT: q4VM, baseQuarter: baseData?.quarter || 'Q1' });
        });
      }

      // For plasticReductionPct, build rows from cross-quarter data instead of single-quarter insights
      if (sourceInsightKey === 'plasticReductionPct' && plasticIntensityMap.size > 0) {
        const r2local = (v: number) => Math.round(v * 100) / 100;
        // Build brandMap only from feature-filtered rawData (do NOT add unfiltered quarterly data)
        const brandMap = new Map(rawData.map(c => [c.companyId, { brand: c.brand, companyName: c.companyName, industry: c.industry }]));
        // Also add from feature-filtered quarterly data to ensure brand info is complete
        if (freshData.quarterlyPerQuarterRawData) {
          const featureFilter = (c: CompanyRawMetrics) =>
            !featureEnabledCompanyIds || featureEnabledCompanyIds.size === 0 || featureEnabledCompanyIds.has(c.companyId);
          ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
            (freshData.quarterlyPerQuarterRawData![q] || []).filter(featureFilter).forEach(c => {
              if (!brandMap.has(c.companyId)) brandMap.set(c.companyId, { brand: c.brand, companyName: c.companyName, industry: c.industry });
            });
          });
        }
        const plasticRows: CompanyDataRow[] = [];
        plasticIntensityMap.forEach((vals, id) => {
          const info = brandMap.get(id);
          if (!info) return;
          const reduction = vals.base > 0 ? ((vals.base - vals.q4) / vals.base) * 100 : 0;
          const bq = vals.baseQuarter;
          plasticRows.push({
            brand: info.brand,
            companyName: info.companyName,
            industry: info.industry,
            value: r2local(reduction).toFixed(2),
            ratioColumns: {
              [`${bq} Virgin Plastic (MT)`]: r2local(vals.baseVirginMT).toFixed(4),
              'Q4 Virgin Plastic (MT)': r2local(vals.q4VirginMT).toFixed(4),
              [`${bq} Plastic Intensity`]: r2local(vals.base).toFixed(4),
              'Q4 Plastic Intensity': r2local(vals.q4).toFixed(4),
            },
          });
        });
        return plasticRows;
      }

      // For jobsPerCrRevenue, compute from avg headcount / total revenue per company
      const jobsPerCrQuarterlyAvg = new Map<string, number>();
      if (sourceInsightKey === 'jobsPerCrRevenue' && freshData.quarterlyPerQuarterRawData) {
        const pnJ = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
        const empKeysJ = ['employees_wc_male_fulltime', 'employees_wc_male_contractual', 'employees_wc_male_parttime', 'employees_wc_female_fulltime', 'employees_wc_female_contractual', 'employees_wc_female_parttime', 'employees_bc_male_fulltime', 'employees_bc_male_contractual', 'employees_bc_male_parttime', 'employees_bc_female_fulltime', 'employees_bc_female_contractual', 'employees_bc_female_parttime'];
        const allIds = new Set(rawData.map(c => c.companyId));
        allIds.forEach(id => {
          const qEmpTotals: number[] = [];
          let qRevSum = 0;
          ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
            const qArr = freshData.quarterlyPerQuarterRawData![q] || [];
            const qc = qArr.find(x => x.companyId === id);
            if (qc) {
              const qEmp = empKeysJ.reduce((s, k) => s + pnJ(qc.kpis[k]), 0);
              if (qEmp > 0) qEmpTotals.push(qEmp);
              qRevSum += pnJ(qc.kpis['net_revenue']);
            }
          });
          const avgEmp = qEmpTotals.length > 0 ? qEmpTotals.reduce((a, b) => a + b, 0) / qEmpTotals.length : 0;
          if (avgEmp > 0 && qRevSum > 0) jobsPerCrQuarterlyAvg.set(id, Math.round((avgEmp / qRevSum) * 100) / 100);
        });
      }

      // For genderPayParityIndex, compute formula-based value from aggregated inputs
      // Value = (sumFemWages / avgFemCount) / (sumMaleWages / avgMaleCount) * 100
      const payParityQuarterlyAvg = new Map<string, number>();
      if (sourceInsightKey === 'genderPayParityIndex' && freshData.quarterlyPerQuarterRawData) {
        const allIds = new Set(rawData.map(c => c.companyId));
        const pn2 = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
        allIds.forEach(id => {
          let fWS = 0, mWS = 0;
          const fCs: number[] = [], mCs: number[] = [];
          ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
            const qArr = freshData.quarterlyPerQuarterRawData![q] || [];
            const qc = qArr.find(x => x.companyId === id);
            if (qc) {
              fWS += pn2(qc.kpis['employees_wc_wages_female']) + pn2(qc.kpis['employees_bc_wages_female']);
              mWS += pn2(qc.kpis['employees_wc_wages_male']) + pn2(qc.kpis['employees_bc_wages_male']);
              const fc = pn2(qc.kpis['employees_wc_female_fulltime']) + pn2(qc.kpis['employees_wc_female_contractual']) + pn2(qc.kpis['employees_wc_female_parttime']) + pn2(qc.kpis['employees_bc_female_fulltime']) + pn2(qc.kpis['employees_bc_female_contractual']) + pn2(qc.kpis['employees_bc_female_parttime']);
              const mc = pn2(qc.kpis['employees_wc_male_fulltime']) + pn2(qc.kpis['employees_wc_male_contractual']) + pn2(qc.kpis['employees_wc_male_parttime']) + pn2(qc.kpis['employees_bc_male_fulltime']) + pn2(qc.kpis['employees_bc_male_contractual']) + pn2(qc.kpis['employees_bc_male_parttime']);
              if (fc > 0) fCs.push(fc);
              if (mc > 0) mCs.push(mc);
            }
          });
          const avgFC = fCs.length > 0 ? fCs.reduce((a, b) => a + b, 0) / fCs.length : 0;
          const avgMC = mCs.length > 0 ? mCs.reduce((a, b) => a + b, 0) / mCs.length : 0;
          if (fWS > 0 && avgFC > 0 && mWS > 0 && avgMC > 0) {
            payParityQuarterlyAvg.set(id, Math.round(((fWS / avgFC) / (mWS / avgMC)) * 100) / 100);
          }
        });
      }

      // For cxoPayRatio, compute formula-based value: Avg CXO per CXO (avg) / Avg WC Employee Comp (avg)
      const cxoPayRatioQuarterlyAvg = new Map<string, number>();
      if (sourceInsightKey === 'cxoPayRatio' && freshData.quarterlyPerQuarterRawData) {
        const allIds = new Set(rawData.map(c => c.companyId));
        const pn3 = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
        allIds.forEach(id => {
          const cxoPerCxoComps: number[] = [];
          const employeeComps: number[] = [];
          ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
            const qArr = freshData.quarterlyPerQuarterRawData![q] || [];
            const qc = qArr.find(x => x.companyId === id);
            if (qc) {
              const totalCxoComp = pn3(qc.kpis['leadership_avg_cxo_compensation']);
              const totalExecs = pn3(qc.kpis['leadership_clevel_total']);
              if (totalExecs > 0) cxoPerCxoComps.push(totalCxoComp / totalExecs);
              // WC-only Employee comp
              const p = (k: string) => pn3(qc.kpis[k]);
              const wcEmp = p('employees_wc_male_fulltime') + p('employees_wc_male_contractual') + p('employees_wc_male_parttime') + p('employees_wc_female_fulltime') + p('employees_wc_female_contractual') + p('employees_wc_female_parttime');
              const wcWages = p('employees_wc_wages_male') + p('employees_wc_wages_female');
              if (wcEmp > 0) employeeComps.push(wcWages / wcEmp);
            }
          });
          const avgCxoPerCxo = cxoPerCxoComps.length > 0 ? cxoPerCxoComps.reduce((a, b) => a + b, 0) / cxoPerCxoComps.length : 0;
          const avgEmpComp = employeeComps.length > 0 ? employeeComps.reduce((a, b) => a + b, 0) / employeeComps.length : 0;
          if (avgCxoPerCxo > 0 && avgEmpComp > 0) {
            cxoPayRatioQuarterlyAvg.set(id, Math.round((avgCxoPerCxo / avgEmpComp) * 100) / 100);
          }
        });
      }

      // so they appear in "Not Considered" on the detail page
      const INSIGHT_RELEVANCE_KPIS: Record<string, (c: CompanyRawMetrics) => boolean> = {
        // Water & Energy Management
        waterRecyclingRate: (c) => Object.keys(c.kpis).some(k => k.startsWith('water_detailed_')),
        totalWaterConsumption: (c) => Object.keys(c.kpis).some(k => k.startsWith('water_detailed_')),
        totalEnergyConsumption: (c) => Object.keys(c.kpis).some(k => k.startsWith('energy_detailed_')),
        renewableEnergyMix: (c) => Object.keys(c.kpis).some(k => k.startsWith('energy_detailed_')),
        // Waste Management — match stat card: only include companies with actual waste generated > 0
        wasteDiversionRate: (c) => {
          const pn = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
          const facilities = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'dark_stores', 'distribution'];
          return facilities.some(f => pn(c.kpis[`waste_detailed_${f}_waste_generated`]) > 0);
        },
        totalWasteGeneratedInsight: (c) => {
          const pn = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
          const facilities = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'dark_stores', 'distribution'];
          return facilities.some(f => pn(c.kpis[`waste_detailed_${f}_waste_generated`]) > 0);
        },
        totalWasteGenerated: (c) => {
          const pn = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
          const facilities = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'dark_stores', 'distribution'];
          return facilities.some(f => pn(c.kpis[`waste_detailed_${f}_waste_generated`]) > 0);
        },
        policyAdoptionRate: (c) => Object.keys(c.kpis).some(k => k.startsWith('policy_')),
        trainingCoverageRate: (c) => Object.keys(c.kpis).some(k => k.startsWith('policy_')),
        csrSpendRatio: (c) => !!(c.kpis['csr_amount_spent']?.trim()),
        healthcareAccessScale: (c) => !!(c.kpis['healthcare_consultations_screenings']?.trim() || c.kpis['healthcare_products_services']?.trim()),
        virginPlasticPct: (c) => Object.keys(c.kpis).some(k => k.startsWith('food_pkg_') || k.startsWith('fashion_primary_pkg_') || k.startsWith('fashion_secondary_pkg_') || k.startsWith('fashion_warehouse_pkg_')),
        recycledContentRatio: (c) => Object.keys(c.kpis).some(k => k.startsWith('food_pkg_') || k.startsWith('fashion_primary_pkg_') || k.startsWith('fashion_secondary_pkg_') || k.startsWith('fashion_warehouse_pkg_')),
        mtPlasticPerCrRevenue: (c) => Object.keys(c.kpis).some(k => k.startsWith('food_pkg_') || k.startsWith('fashion_primary_pkg_') || k.startsWith('fashion_secondary_pkg_') || k.startsWith('fashion_warehouse_pkg_')),
        mtPackagingPer1000Customers: (c) => Object.keys(c.kpis).some(k => k.startsWith('food_pkg_') || k.startsWith('fashion_primary_pkg_') || k.startsWith('fashion_secondary_pkg_') || k.startsWith('fashion_warehouse_pkg_')),
        eprComplianceRate: (c) => Object.keys(c.kpis).some(k => k.startsWith('food_pkg_')),
        virginPlasticVsNonPlasticPrimary: (c) => Object.keys(c.kpis).some(k => k.startsWith('food_pkg_')),
        virginPlasticVsNonPlasticSecondary: (c) => Object.keys(c.kpis).some(k => k.startsWith('food_pkg_')),
        recyclableVsNonRecyclablePrimary: (c) => Object.keys(c.kpis).some(k => k.startsWith('food_pkg_') || k.startsWith('fashion_primary_pkg_')),
        voluntaryPlasticNeutralityRate: (c) => Object.keys(c.kpis).some(k => k.startsWith('food_pkg_')),
        // Incidents & Grievances: exclude companies without incident data
        caseResolutionRate: (c) => Object.keys(c.kpis).some(k => k.startsWith('incident_') && k.endsWith('_cases') && c.kpis[k]?.trim() !== '' && c.kpis[k] !== '0'),
        highImpactIncidentRatio: (c) => Object.keys(c.kpis).some(k => k.startsWith('incident_') && k.endsWith('_cases') && c.kpis[k]?.trim() !== '' && c.kpis[k] !== '0'),
        poshCaseIntensity: (c) => Object.keys(c.kpis).some(k => k.startsWith('incident_') && k.endsWith('_cases') && c.kpis[k]?.trim() !== ''),
        totalIncidentCount: (c) => Object.keys(c.kpis).some(k => k.startsWith('incident_') && k.endsWith('_cases') && c.kpis[k]?.trim() !== ''),
        // Sourcing & Fulfillment: exclude companies without vendor/MSME data
        supplyChainSustainabilityScore: (c) => {
          const hasVendor = Object.keys(c.kpis).some(k => k.startsWith('vendor_mis_') && k.endsWith('_num_vendors') && c.kpis[k]?.trim() !== '' && c.kpis[k] !== '0' && c.kpis[k]?.trim().toLowerCase() !== 'na' && c.kpis[k]?.trim().toLowerCase() !== 'n/a');
          const hasMsme = !!(c.kpis['msme_supplier_percentage']?.trim());
          return hasVendor || hasMsme;
        },
        msmeSupplierDependencyRatio: (c) => !!(c.kpis['msme_supplier_percentage']?.trim()),
        supplyChainLocalizationIndex: (c) => Object.keys(c.kpis).some(k => k.startsWith('vendor_mis_') && k.endsWith('_num_vendors') && c.kpis[k]?.trim() !== '' && c.kpis[k] !== '0' && c.kpis[k]?.trim().toLowerCase() !== 'na' && c.kpis[k]?.trim().toLowerCase() !== 'n/a'),
        deiCompliantVendorPct: (c) => Object.keys(c.kpis).some(k => k.startsWith('vendor_mis_') && k.endsWith('_num_vendors') && c.kpis[k]?.trim() !== '' && c.kpis[k] !== '0' && c.kpis[k]?.trim().toLowerCase() !== 'na' && c.kpis[k]?.trim().toLowerCase() !== 'n/a'),
        smallVsLargeVendorMix: (c) => Object.keys(c.kpis).some(k => k.startsWith('vendor_mis_') && k.endsWith('_num_vendors') && c.kpis[k]?.trim() !== '' && c.kpis[k] !== '0' && c.kpis[k]?.trim().toLowerCase() !== 'na' && c.kpis[k]?.trim().toLowerCase() !== 'n/a'),
        // CXO Pay Ratio: exclude companies with 0 WC Employee Comp
        cxoPayRatio: (c) => {
          const pnR = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
          const wcEmp = pnR(c.kpis['employees_wc_male_fulltime']) + pnR(c.kpis['employees_wc_male_contractual']) + pnR(c.kpis['employees_wc_male_parttime']) +
            pnR(c.kpis['employees_wc_female_fulltime']) + pnR(c.kpis['employees_wc_female_contractual']) + pnR(c.kpis['employees_wc_female_parttime']);
          const wcWages = pnR(c.kpis['employees_wc_wages_male']) + pnR(c.kpis['employees_wc_wages_female']);
          const avgWcEmpComp = wcEmp > 0 ? wcWages / wcEmp : 0;
          return avgWcEmpComp > 0 && !!(c.kpis['leadership_avg_cxo_compensation']?.trim());
        },
      };
      const relevanceCheck = INSIGHT_RELEVANCE_KPIS[sourceInsightKey as string];

      let rows: CompanyDataRow[] = rawData
        .filter(c => {
          let val = c.insights[sourceInsightKey] as number;
          // Recompute csrSpendRatio with quarterly-summed revenue
          if (sourceInsightKey === 'csrSpendRatio' && revenueByCompany.size > 0) {
            const csrSpend = parseFloat(c.kpis['csr_amount_spent'] || '0') || 0;
            const totalRev = revenueByCompany.get(c.companyId) || 0;
            val = totalRev > 0 ? (csrSpend / (totalRev * 1e7)) * 100 : 0;
          }
          if (sourceInsightKey === 'jobsPerCrRevenue' && jobsPerCrQuarterlyAvg.size > 0) {
            val = jobsPerCrQuarterlyAvg.get(c.companyId) ?? val;
          }
          if (sourceInsightKey === 'genderPayParityIndex' && payParityQuarterlyAvg.size > 0) {
            val = payParityQuarterlyAvg.get(c.companyId) ?? val;
          }
          if (sourceInsightKey === 'cxoPayRatio' && cxoPayRatioQuarterlyAvg.size > 0) {
            val = cxoPayRatioQuarterlyAvg.get(c.companyId) ?? val;
          }
          // Use pre-computed percentile-normalized insights for composite scores
          // (circularEconomyIndex, deiCompositeScore, esgCompositeScore are percentile-based
          //  and must NOT be recomputed via deriveInsights which gives raw scores)
          if (
            (sourceInsightKey === 'esgCompositeScore' || sourceInsightKey === 'circularEconomyIndex' || sourceInsightKey === 'deiCompositeScore' || sourceInsightKey === 'supplyChainSustainabilityScore' || sourceInsightKey === 'governanceScore') &&
            freshData.quarterlyCombinedRawData && freshData.companyRawData
          ) {
            const qcMatch = freshData.quarterlyCombinedRawData.find(x => x.companyId === c.companyId);
            const fyMatch = freshData.companyRawData.find(x => x.companyId === c.companyId);
            // For percentile-based scores, use pre-computed insights (already normalized)
            const preComputedInsights = qcMatch?.insights || fyMatch?.insights;
            if (preComputedInsights && (preComputedInsights as any)[sourceInsightKey] !== undefined) {
              val = (preComputedInsights as any)[sourceInsightKey] as number;
            } else {
              // Fallback for governanceScore (not percentile-based): recompute from merged KPIs
              const mergedKpis: Record<string, string> = {};
              if (fyMatch) Object.entries(fyMatch.kpis).forEach(([k, v]) => { if (v && v.trim()) mergedKpis[k] = v; });
              if (qcMatch) Object.entries(qcMatch.kpis).forEach(([k, v]) => { if (v && v.trim()) mergedKpis[k] = v; });
              const mergedAgg = buildAggregation(mergedKpis);
              const mergedInsights = deriveInsights(mergedAgg, c.industry, c.usesFashionPackaging);
              val = mergedInsights[sourceInsightKey] as number;
            }
          }
          if (val === undefined || val === null || isNaN(val)) return false;
          // Apply relevance check: exclude companies without the required KPI data
          if (relevanceCheck && !relevanceCheck(c)) return false;
          return true;
        })
        .map(c => {
          let val = c.insights[sourceInsightKey] as number;
          // Recompute csrSpendRatio with quarterly-summed revenue
          if (sourceInsightKey === 'csrSpendRatio' && revenueByCompany.size > 0) {
            const csrSpend = parseFloat(c.kpis['csr_amount_spent'] || '0') || 0;
            const totalRev = revenueByCompany.get(c.companyId) || 0;
            val = totalRev > 0 ? Math.round((csrSpend / (totalRev * 1e7)) * 100 * 10000) / 10000 : 0;
          }
          // Use avg of quarterly values for jobsPerCrRevenue
          if (sourceInsightKey === 'jobsPerCrRevenue' && jobsPerCrQuarterlyAvg.size > 0) {
            val = jobsPerCrQuarterlyAvg.get(c.companyId) ?? val;
          }
          // Use avg of quarterly values for genderPayParityIndex
          if (sourceInsightKey === 'genderPayParityIndex' && payParityQuarterlyAvg.size > 0) {
            val = payParityQuarterlyAvg.get(c.companyId) ?? val;
          }
          // Use formula-based value for cxoPayRatio
          if (sourceInsightKey === 'cxoPayRatio' && cxoPayRatioQuarterlyAvg.size > 0) {
            val = cxoPayRatioQuarterlyAvg.get(c.companyId) ?? val;
          }
          // Use pre-computed percentile-normalized insights for composite scores
          if (
            (sourceInsightKey === 'esgCompositeScore' || sourceInsightKey === 'circularEconomyIndex' || sourceInsightKey === 'deiCompositeScore' || sourceInsightKey === 'supplyChainSustainabilityScore' || sourceInsightKey === 'governanceScore') &&
            freshData.quarterlyCombinedRawData && freshData.companyRawData
          ) {
            const qcMatch = freshData.quarterlyCombinedRawData.find(x => x.companyId === c.companyId);
            const fyMatch = freshData.companyRawData.find(x => x.companyId === c.companyId);
            const preComputedInsights = qcMatch?.insights || fyMatch?.insights;
            if (preComputedInsights && (preComputedInsights as any)[sourceInsightKey] !== undefined) {
              val = (preComputedInsights as any)[sourceInsightKey] as number;
            } else {
              const mergedKpis: Record<string, string> = {};
              if (fyMatch) Object.entries(fyMatch.kpis).forEach(([k, v]) => { if (v && v.trim()) mergedKpis[k] = v; });
              if (qcMatch) Object.entries(qcMatch.kpis).forEach(([k, v]) => { if (v && v.trim()) mergedKpis[k] = v; });
              const mergedAgg = buildAggregation(mergedKpis);
              const mergedInsights = deriveInsights(mergedAgg, c.industry, c.usesFashionPackaging);
              val = mergedInsights[sourceInsightKey] as number;
            }
          }
          const row: CompanyDataRow = {
            brand: c.brand,
            companyId: c.companyId,
            companyName: c.companyName,
            industry: c.industry,
            value: val.toFixed(4),
            usesFashionPackaging: c.usesFashionPackaging,
          };
          // Add ratio component columns (input fields) for consolidated view
          const ratioConfig = RATIO_COMPONENT_COLUMNS[sourceInsightKey as string];
          if (ratioConfig) {
            // For csrSpendRatio, inject quarterly-summed revenue
            if (sourceInsightKey === 'csrSpendRatio' && revenueByCompany.size > 0) {
              const enrichedC = { kpis: { ...c.kpis, net_revenue: String(revenueByCompany.get(c.companyId) || 0) } };
              row.ratioColumns = ratioConfig.getValues(enrichedC);
            } else if (sourceInsightKey === 'jobsPerCrRevenue' && freshData.quarterlyPerQuarterRawData) {
              // Total Employees = average of Q1-Q4 headcount; Net Revenue = sum of Q1-Q4
              const empKeys = ['employees_wc_male_fulltime', 'employees_wc_male_contractual', 'employees_wc_male_parttime', 'employees_wc_female_fulltime', 'employees_wc_female_contractual', 'employees_wc_female_parttime', 'employees_bc_male_fulltime', 'employees_bc_male_contractual', 'employees_bc_male_parttime', 'employees_bc_female_fulltime', 'employees_bc_female_contractual', 'employees_bc_female_parttime'];
              const pn = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
              const qEmpTotals: number[] = [];
              let qRevSum = 0;
              ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
                const qArr = freshData.quarterlyPerQuarterRawData![q] || [];
                const qc = qArr.find(x => x.companyId === c.companyId);
                if (qc) {
                  const qEmp = empKeys.reduce((s, k) => s + pn(qc.kpis[k]), 0);
                  if (qEmp > 0) qEmpTotals.push(qEmp);
                  qRevSum += pn(qc.kpis['net_revenue']);
                }
              });
              const avgEmp = qEmpTotals.length > 0 ? Math.round(qEmpTotals.reduce((a, b) => a + b, 0) / qEmpTotals.length) : 0;
              row.ratioColumns = { 'Total Employees': String(avgEmp), 'Net Revenue (₹ Cr)': String(Math.round(qRevSum * 100) / 100) };
            } else if (sourceInsightKey === 'genderPayParityIndex' && freshData.quarterlyPerQuarterRawData) {
              // Female/Male Wages = sum of Q1-Q4; Female/Male Count = average of Q1-Q4
              // Uses TOTAL (WC+BC) wages and counts
              const pn = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
              let fWagesSum = 0, mWagesSum = 0;
              const fCounts: number[] = [], mCounts: number[] = [];
              ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
                const qArr = freshData.quarterlyPerQuarterRawData![q] || [];
                const qc = qArr.find(x => x.companyId === c.companyId);
                if (qc) {
                  fWagesSum += pn(qc.kpis['employees_wc_wages_female']) + pn(qc.kpis['employees_bc_wages_female']);
                  mWagesSum += pn(qc.kpis['employees_wc_wages_male']) + pn(qc.kpis['employees_bc_wages_male']);
                  const fc = pn(qc.kpis['employees_wc_female_fulltime']) + pn(qc.kpis['employees_wc_female_contractual']) + pn(qc.kpis['employees_wc_female_parttime']) + pn(qc.kpis['employees_bc_female_fulltime']) + pn(qc.kpis['employees_bc_female_contractual']) + pn(qc.kpis['employees_bc_female_parttime']);
                  const mc = pn(qc.kpis['employees_wc_male_fulltime']) + pn(qc.kpis['employees_wc_male_contractual']) + pn(qc.kpis['employees_wc_male_parttime']) + pn(qc.kpis['employees_bc_male_fulltime']) + pn(qc.kpis['employees_bc_male_contractual']) + pn(qc.kpis['employees_bc_male_parttime']);
                  if (fc > 0) fCounts.push(fc);
                  if (mc > 0) mCounts.push(mc);
                }
              });
              const avgFC = fCounts.length > 0 ? Math.round(fCounts.reduce((a, b) => a + b, 0) / fCounts.length) : 0;
              const avgMC = mCounts.length > 0 ? Math.round(mCounts.reduce((a, b) => a + b, 0) / mCounts.length) : 0;
              row.ratioColumns = {
                'Female Wages': String(Math.round(fWagesSum * 100) / 100),
                'Female Count': String(avgFC),
                'Male Wages': String(Math.round(mWagesSum * 100) / 100),
                'Male Count': String(avgMC),
              };
            } else if (sourceInsightKey === 'cxoPayRatio' && freshData.quarterlyPerQuarterRawData) {
              // CXO Pay Ratio = Avg CXO Comp per CXO ÷ Avg WC Employee Comp
              // Ratio columns: avg CXO comp per CXO across quarters, avg WC Employee comp across quarters
              const pn = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
              const employeeComps: number[] = [];
              const cxoPerCxoComps: number[] = [];
              ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
                const qArr = freshData.quarterlyPerQuarterRawData![q] || [];
                const qc = qArr.find(x => x.companyId === c.companyId);
                if (qc) {
                  // Avg CXO comp per CXO
                  const totalCxoComp = pn(qc.kpis['leadership_avg_cxo_compensation']);
                  const totalExecs = pn(qc.kpis['leadership_clevel_total']);
                  if (totalExecs > 0) cxoPerCxoComps.push(totalCxoComp / totalExecs);
                  // Avg WC Employee comp (WC-only)
                  const p = (k: string) => pn(qc.kpis[k]);
                  const wcEmp = p('employees_wc_male_fulltime') + p('employees_wc_male_contractual') + p('employees_wc_male_parttime') + p('employees_wc_female_fulltime') + p('employees_wc_female_contractual') + p('employees_wc_female_parttime');
                  const wcWages = p('employees_wc_wages_male') + p('employees_wc_wages_female');
                  if (wcEmp > 0) employeeComps.push(wcWages / wcEmp);
                }
              });
              const avgCxoPerCxo = cxoPerCxoComps.length > 0 ? cxoPerCxoComps.reduce((a, b) => a + b, 0) / cxoPerCxoComps.length : 0;
              const avgEmpComp = employeeComps.length > 0 ? employeeComps.reduce((a, b) => a + b, 0) / employeeComps.length : 0;
              row.ratioColumns = {
                'Avg CXO Comp per CXO (INR Cr)': String(Math.round(avgCxoPerCxo * 100) / 100),
                'Avg WC Employee Comp (INR Cr)': String(Math.round(avgEmpComp * 100) / 100),
              };
              // Exclude companies with 0 Avg WC Employee Comp — they'll appear in "Not Considered"
              if (avgEmpComp === 0) {
                row.value = '';
              }
            } else if (
              (sourceInsightKey === 'esgCompositeScore' || sourceInsightKey === 'circularEconomyIndex' || sourceInsightKey === 'deiCompositeScore' || sourceInsightKey === 'supplyChainSustainabilityScore' || sourceInsightKey === 'governanceScore') &&
              freshData.quarterlyCombinedRawData && freshData.companyRawData
            ) {
              // These composite scores span multiple features: employee/packaging data is quarterly,
              // facility/policy data is FY-only. Merge both data sources for complete KPIs.
              const qcMatch = freshData.quarterlyCombinedRawData.find(x => x.companyId === c.companyId);
              const fyMatch = freshData.companyRawData.find(x => x.companyId === c.companyId);
              const mergedKpis: Record<string, string> = {};
              // Start with FY data (facility, policy, etc.)
              if (fyMatch) Object.entries(fyMatch.kpis).forEach(([k, v]) => { if (v && v.trim()) mergedKpis[k] = v; });
              // Overlay quarterly combined data (employee, packaging — takes priority for shared keys)
              if (qcMatch) Object.entries(qcMatch.kpis).forEach(([k, v]) => { if (v && v.trim()) mergedKpis[k] = v; });
              // Pass insights for composite score ratio columns (ESG uses pre-computed E/S/G)
              const insightsForRatio = (qcMatch as any)?.insights || (fyMatch as any)?.insights || c.insights;
              row.ratioColumns = ratioConfig.getValues({ kpis: mergedKpis, industry: c.industry, insights: insightsForRatio, hasEnvironmentFeature: c.hasEnvironmentFeature });
            } else if (sourceInsightKey === 'genderPayParityIndex' && !freshData.quarterlyPerQuarterRawData) {
              // Fallback: quarterlyPerQuarterRawData not available but quarterlyCombinedRawData has summed counts.
              // Estimate averaged counts by dividing summed counts by the number of quarters with data.
              const pnFb = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
              const femaleWages = pnFb('employees_wc_wages_female') + pnFb('employees_bc_wages_female');
              const maleWages = pnFb('employees_wc_wages_male') + pnFb('employees_bc_wages_male');
              // Determine how many quarters had data by checking if per-quarter entries exist
              // For combined data, counts are summed — estimate quarters from available data patterns
              const femaleCountSum = pnFb('employees_wc_female_fulltime') + pnFb('employees_wc_female_contractual') + pnFb('employees_wc_female_parttime') + pnFb('employees_bc_female_fulltime') + pnFb('employees_bc_female_contractual') + pnFb('employees_bc_female_parttime');
              const maleCountSum = pnFb('employees_wc_male_fulltime') + pnFb('employees_wc_male_contractual') + pnFb('employees_wc_male_parttime') + pnFb('employees_bc_male_fulltime') + pnFb('employees_bc_male_contractual') + pnFb('employees_bc_male_parttime');
              // Without per-quarter data we can't know exact quarter count; use raw values as best estimate
              row.ratioColumns = {
                'Female Wages': String(Math.round(femaleWages * 100) / 100),
                'Female Count': String(Math.round(femaleCountSum)),
                'Male Wages': String(Math.round(maleWages * 100) / 100),
                'Male Count': String(Math.round(maleCountSum)),
              };
            } else {
              row.ratioColumns = ratioConfig.getValues(c);
            }
          }
          // Add quarterly breakdown from per-quarter data
          // For composite scores (ESG, Governance, DEI, etc.), merge each quarter's data with FY
          // to compute per-quarter scores even though the overall metric is "annual-only"
          const compositeScoreKeys = new Set(['esgCompositeScore', 'circularEconomyIndex', 'deiCompositeScore', 'supplyChainSustainabilityScore', 'governanceScore']);
          const isCompositeScore = compositeScoreKeys.has(sourceInsightKey as string);
          if (freshData.quarterlyPerQuarterRawData && (!isAnnualOnlyInsight || isCompositeScore)) {
            ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
              const qData = freshData.quarterlyPerQuarterRawData![q] || [];
              const match = qData.find(qc => qc.companyId === c.companyId);
              if (match) {
                let qVal: number;
                if (isCompositeScore && freshData.companyRawData) {
                  // For composite scores, only compute per-quarter value if the quarter
                  // has actual KPI data. Without quarterly data, merging FY governance
                  // produces misleading non-zero scores (e.g., governance incident bonus).
                  const hasQuarterlyData = Object.keys(match.kpis).length > 0;
                  if (!hasQuarterlyData) {
                    (row as any)[q.toLowerCase()] = '';
                    return;
                  }

                  // For Environment Score (circularEconomyIndex), additionally check
                  // for actual packaging KPI data. Companies with only business info
                  // KPIs but no packaging data get a misleading 30 from the Plastic
                  // Intensity floor (100 * 0.30) when all packaging values are zero.
                  if (sourceInsightKey === 'circularEconomyIndex') {
                    const hasPackagingData = Object.keys(match.kpis).some(k =>
                      k.startsWith('food_pkg_') || k.startsWith('fashion_pkg_') || k.startsWith('fashion_materials_')
                    );
                    if (!hasPackagingData) {
                      (row as any)[q.toLowerCase()] = '';
                      return;
                    }
                  }

                  // Merge FY (policy/facility) data with this quarter's data to get accurate per-quarter score
                  const fyMatch = freshData.companyRawData.find(x => x.companyId === c.companyId);
                  const perQMerged: Record<string, string> = {};
                  if (fyMatch) Object.entries(fyMatch.kpis).forEach(([k, v]) => { if (v && v.trim()) perQMerged[k] = v; });
                  Object.entries(match.kpis).forEach(([k, v]) => { if (v && v.trim()) perQMerged[k] = v; });
                  const perQAgg = buildAggregation(perQMerged);
                  const perQInsights = deriveInsights(perQAgg, c.industry);
                  qVal = perQInsights[sourceInsightKey] as number;
                } else {
                  qVal = match.insights[sourceInsightKey] as number;
                }
                // For genderPayParityIndex, show blank only when truly undefined/NaN (0 is valid)
                if (sourceInsightKey === 'genderPayParityIndex' && (qVal === undefined || qVal === null || isNaN(qVal))) {
                  (row as any)[q.toLowerCase()] = '';
                } else {
                  (row as any)[q.toLowerCase()] = qVal !== undefined && !isNaN(qVal) ? qVal.toFixed(2) : '';
                }
              }
            });
          }
          return row;
        });

      // ── Percentile normalization for Environment Score ──
      if (sourceInsightKey === 'circularEconomyIndex') {
        // Collect all companies' merged KPIs for percentile computation
        const allCompaniesForPercentile = (freshData.quarterlyCombinedRawData || freshData.companyRawData || [])
          .filter(c => Object.keys(c.kpis).length > 0)
          .map(c => {
            // Merge FY + quarterly data (same logic as row construction)
            const qcMatch = freshData.quarterlyCombinedRawData?.find(x => x.companyId === c.companyId);
            const fyMatch = freshData.companyRawData?.find(x => x.companyId === c.companyId);
            const mergedKpis: Record<string, string> = {};
            if (fyMatch) Object.entries(fyMatch.kpis).forEach(([k, v]) => { if (v && v.trim()) mergedKpis[k] = v; });
            if (qcMatch) Object.entries(qcMatch.kpis).forEach(([k, v]) => { if (v && v.trim()) mergedKpis[k] = v; });
            return {
              companyId: c.companyId,
              kpis: Object.keys(mergedKpis).length > 0 ? mergedKpis : c.kpis,
              insights: { ...c.insights },
              usesFashionPackaging: c.usesFashionPackaging,
              hasWaterFeature: (c as any).hasWaterFeature,
              hasEnvironmentFeature: c.hasEnvironmentFeature,
            };
          });

        // Compute cross-quarter virgin plastic reduction for percentile normalization
        let detailVirginReductions: Map<string, number> | undefined;
        if (freshData.quarterlyPerQuarterRawData) {
          const detailPerQ: Record<string, Array<{ companyId: string; kpis: Record<string, string> }>> = {};
          ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
            detailPerQ[q] = (freshData.quarterlyPerQuarterRawData![q] || []).map(c => ({
              companyId: c.companyId,
              kpis: c.kpis,
            }));
          });
          detailVirginReductions = computeCrossQuarterVirginReductions(detailPerQ);
        }
        const percentileMap = applyEnvironmentPercentileNormalization(allCompaniesForPercentile, detailVirginReductions);

        // Update rows with percentile values
        rows.forEach(row => {
          const pctls = percentileMap.get(row.companyId || '');
          if (pctls) {
            row.ratioColumns = Object.fromEntries(
              Object.entries(pctls).map(([k, v]) => [k, String(Math.round(v * 100) / 100)])
            );
            const compMatch = allCompaniesForPercentile.find(c => c.companyId === row.companyId);
            if (compMatch) {
              row.value = compMatch.insights.circularEconomyIndex.toFixed(4);
            }
          } else if (row.companyId) {
            // Company without feature / no data — show blank ratio columns
            row.ratioColumns = {};
          }
        });

        // Remove companies without env features from the table — they belong in "Not Considered"
        const envFilteredRows = rows.filter(row => {
          if (!row.companyId) return true;
          const compMatch = (freshData.quarterlyCombinedRawData || freshData.companyRawData || [])
            .find(c => c.companyId === row.companyId);
          return compMatch?.hasEnvironmentFeature !== false;
        });
        rows = envFilteredRows;

        // Sort companies with score 0 (no env data) to the bottom of the table
        rows.sort((a, b) => {
          const aVal = parseFloat(a.value) || 0;
          const bVal = parseFloat(b.value) || 0;
          if (aVal === 0 && bVal !== 0) return 1;
          if (aVal !== 0 && bVal === 0) return -1;
          return bVal - aVal; // Higher scores first
        });
      }

      return rows;
    }

    // sourceCalcId-based rebuild (aggregation fields or replicated calc functions)
    if (sourceCalcId) {
      const calcFn = resolveCalcFn(sourceCalcId);
      if (!calcFn) return null;

      // Headcount calc IDs that should use Q4 snapshot as the Value column
      const q4SnapshotCalcIds = new Set([
        'agg:totalWcEmployees', 'agg:totalBcEmployees', 'agg:totalEmployment',
        'agg:totalCLevel', 'agg:totalBoard',
      ]);
      const useQ4ForCalcValue = q4SnapshotCalcIds.has(sourceCalcId) && freshData.quarterlyPerQuarterRawData?.['Q4'];

      // Annual-only calc IDs: these metrics exist ONLY in FY entries,
      // never in Q1-Q4. Skip quarterlyCombinedRawData entirely for these.
      const annualOnlyCalcIds = new Set<string>([
        'calc:waterConsumed', 'calc:freshWater', 'calc:wastewaterGen', 'calc:wastewaterRecycled',
        'calc:energyConsumed', 'calc:renewableEnergy',
        'calc:wasteGen', 'calc:wasteRecycled',
      ]);
      const isAnnualOnly = annualOnlyCalcIds.has(sourceCalcId);

      // For Q4 snapshot calc IDs, use Q4 per-quarter data as the primary source
      // For annual-only metrics, go straight to companyRawData (FY);
      // for others, try quarterlyCombinedRawData first.
      let preferredRaw = applyFeatureCompanyFilter(useQ4ForCalcValue
        ? (freshData.quarterlyPerQuarterRawData!['Q4'] || [])
        : isAnnualOnly
          ? freshData.companyRawData
          : (freshData.quarterlyCombinedRawData || freshData.companyRawData));

      // Scope to feature-specific companies
      const featureFilter = state.filters?.feature;
      const featurePrefixMap: Record<string, string[]> = {
        primarySecondaryPackaging: ['food_pkg_', 'fashion_primary_pkg_', 'fashion_secondary_pkg_', 'fashion_warehouse_pkg_'],
        fashionMaterials: ['fashion_'],
        wasteManagement: ['waste_detailed_'],
        waterManagement: ['water_detailed_', 'energy_detailed_'],
        energyManagement: ['energy_detailed_', 'water_detailed_'],
        governancePolicies: ['policy_'],
      };
      const featurePrefixes = featureFilter ? featurePrefixMap[featureFilter] : undefined;
      if (featurePrefixes) {
        preferredRaw = preferredRaw.filter(c => {
          const keys = Object.keys(c.kpis).filter(k => c.kpis[k]?.trim());
          return keys.some(k => featurePrefixes.some(p => k.startsWith(p)));
        });
      }
      const hasDataInPreferred = preferredRaw.some(c => { const v = calcFn(c); return !isNaN(v) && v !== 0; });
      const rawData = hasDataInPreferred ? preferredRaw : applyFeatureCompanyFilter(featurePrefixes
        ? freshData.companyRawData.filter(c => Object.keys(c.kpis).some(k => featurePrefixes.some(p => k.startsWith(p)) && c.kpis[k]?.trim()))
        : freshData.companyRawData);

      // Relevance check for calc IDs: exclude companies without the required KPI data
      // so they correctly appear in the "Not Considered" list on the detail page
      const CALC_RELEVANCE: Record<string, (c: CompanyRawMetrics) => boolean> = {
        'agg:totalIncidents': (c) => Object.keys(c.kpis).some(k => k.startsWith('incident_') && k.endsWith('_cases') && c.kpis[k]?.trim() !== ''),
        'agg:totalOpenCases': (c) => Object.keys(c.kpis).some(k => k.startsWith('incident_') && k.endsWith('_cases') && c.kpis[k]?.trim() !== ''),
        'agg:poshCases': (c) => Object.keys(c.kpis).some(k => k.startsWith('incident_') && k.endsWith('_cases') && c.kpis[k]?.trim() !== ''),
        'calc:highImpactIncidents': (c) => Object.keys(c.kpis).some(k => k.startsWith('incident_') && k.endsWith('_cases') && c.kpis[k]?.trim() !== ''),
      };
      const calcRelevanceCheck = CALC_RELEVANCE[sourceCalcId];

      // Calc IDs where value=0 means "no data reported" (facility-based % metrics)
      // These must exclude zero-value companies to match stat card averages
      const excludeZeroCalcIds = new Set([
        'calc:freshWater', 'calc:renewableEnergy', 'calc:wasteRecycled',
        'calc:wastewaterRecycled',
      ]);
      const shouldExcludeZero = excludeZeroCalcIds.has(sourceCalcId);

      const rows: CompanyDataRow[] = rawData
        .filter(c => {
          const val = calcFn(c);
          if (isNaN(val)) return false;
          if (shouldExcludeZero && val === 0) return false;
          if (calcRelevanceCheck && !calcRelevanceCheck(c)) return false;
          return true;
        })
        .map(c => {
          const parseNum = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
          const r2local = (v: number) => Math.round(v * 100) / 100;
          // For highImpactIncidents in combined view, recompute by summing per-quarter values
          // because the combined data takes the latest impact value, losing per-quarter granularity
          let computedValue = calcFn(c);
          if (sourceCalcId === 'calc:highImpactIncidents' && freshData.quarterlyPerQuarterRawData) {
            let perQuarterSum = 0;
            let hasAnyQuarterData = false;
            ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
              const qData = freshData.quarterlyPerQuarterRawData![q] || [];
              const match = qData.find(qc => qc.companyId === c.companyId);
              if (match) {
                const qVal = calcFn(match);
                if (!isNaN(qVal)) { perQuarterSum += qVal; hasAnyQuarterData = true; }
              }
            });
            if (hasAnyQuarterData) computedValue = perQuarterSum;
          }
          const row: CompanyDataRow = {
            brand: c.brand,
            companyName: c.companyName,
            industry: c.industry,
            value: String(computedValue),
          };
          // Add ratio component columns from shared registry (strip 'calc:' prefix to match key)
          const ratioKey = sourceCalcId.replace(/^calc:/, '');
          const ratioConfig = RATIO_COMPONENT_COLUMNS[ratioKey];
          if (ratioConfig) {
            row.ratioColumns = ratioConfig.getValues(c);
          }
          // Add facility-level ratio columns for energy calc IDs
          if (sourceCalcId === 'calc:energyConsumed' || sourceCalcId === 'calc:renewableEnergy') {
            const facilities = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'data_center', 'retail', 'distribution'];
            const facilityLabels: Record<string, string> = { office: 'Office', stores_coco: 'Stores (CoCo)', warehouses: 'Warehouses', manufacturing: 'Manufacturing', data_center: 'Data Center', retail: 'Retail Outlets', distribution: 'Distribution' };
            const cols: Record<string, string> = {};
            facilities.forEach(f => {
              const label = facilityLabels[f];
              const consumed = parseNum(c.kpis[`energy_detailed_${f}_energy_consumed`]);
              const renew = parseNum(c.kpis[`energy_detailed_${f}_renewable_pct`]);
              if (sourceCalcId === 'calc:energyConsumed') {
                cols[`${label} Energy (kWh)`] = String(r2local(consumed));
                cols[`${label} Renewable (%)`] = String(r2local(renew));
              } else {
                cols[`${label} Renewable (%)`] = String(r2local(renew));
                cols[`${label} Energy (kWh)`] = String(r2local(consumed));
              }
            });
            row.ratioColumns = cols;
          }
          // Add facility-level ratio columns for waste calc IDs
          if (sourceCalcId === 'calc:wasteGen' || sourceCalcId === 'calc:wasteRecycled') {
            const wasteFacilities = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'dark_stores', 'distribution'];
            const wasteFacilityLabels: Record<string, string> = { office: 'Office', stores_coco: 'Stores (CoCo)', warehouses: 'Warehouses', manufacturing: 'Manufacturing', dark_stores: 'Dark Stores', distribution: 'Distribution' };
            const cols: Record<string, string> = {};
            wasteFacilities.forEach(f => {
              const label = wasteFacilityLabels[f];
              const gen = parseNum(c.kpis[`waste_detailed_${f}_waste_generated`]);
              const rec = parseNum(c.kpis[`waste_detailed_${f}_waste_recycled_pct`]);
              if (sourceCalcId === 'calc:wasteGen') {
                cols[`${label} Waste (MT)`] = String(r2local(gen));
                cols[`${label} Recycled (%)`] = String(r2local(rec));
              } else {
                cols[`${label} Recycled (%)`] = String(r2local(rec));
                cols[`${label} Waste (MT)`] = String(r2local(gen));
              }
            });
            row.ratioColumns = cols;
          }
          // Add quarterly breakdown (skip for annual-only calc IDs - no quarterly data exists)
          if (freshData.quarterlyPerQuarterRawData && !isAnnualOnly) {
            const qVals: number[] = [];
            ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
              const qData = freshData.quarterlyPerQuarterRawData![q] || [];
              const match = qData.find(qc => qc.companyId === c.companyId);
              if (match) {
                const val = calcFn(match);
                if (!isNaN(val) && val !== 0) { qVals.push(val); }
                (row as any)[q.toLowerCase()] = !isNaN(val) ? String(val) : '';
              }
            });
            // For avg-per-employee/compensation calcs, override value with AVERAGE of Q1-Q4 ratios
            const avgCalcIds = new Set(['calc:avgWcWagePerEmployee', 'calc:avgBcWagePerEmployee', 'calc:avgEmployeeCompensation']);
            if (avgCalcIds.has(sourceCalcId) && qVals.length > 0) {
              row.value = String(Math.round((qVals.reduce((a, b) => a + b, 0) / qVals.length) * 100) / 100);
            }
          }
          return row;
        });
      return rows;
    }

    return null;
  }, [freshData, state, canRefetch, featureEnabledCompanyIds]);

  // Use rebuilt data when available, otherwise original state data.
  // Safety: if rebuild produced an empty array but state has data, prefer state data.
  const activeCompanyData = (rebuiltCompanyData && rebuiltCompanyData.length > 0)
    ? rebuiltCompanyData
    : (state?.companyData || []);

  // Auto-detect quarterly data from both state and rebuilt data
  // Auto-detect meaningful quarterly data (exclude all-zero quarterly values)
  const autoHasQuarterly = stateHasQuarterly || activeCompanyData.some(r => {
    const qVals = [r.q1, r.q2, r.q3, r.q4].filter(v => v && v !== '' && v !== '0' && v !== '0.00');
    return qVals.length > 0;
  });

  // Apply quarter filter
  const filteredCompanyData = useMemo(() => {
    let data = activeCompanyData;

    // Quarter filter: replace main value with quarter-specific value when quarterly data is available
    const hasQCols = data.some(r => r.q1 || r.q2 || r.q3 || r.q4);
    if (filterQuarter !== 'all' && hasQCols) {
      const qKey = filterQuarter.toLowerCase() as 'q1' | 'q2' | 'q3' | 'q4';
      const sourceInsightKey = state?.sourceInsightKey;

      // For genderPayParityIndex, recalculate ratio columns using only the selected quarter's data
      const perQRatioMap = new Map<string, Record<string, string>>();
      if (sourceInsightKey === 'genderPayParityIndex' && freshData?.quarterlyPerQuarterRawData) {
        const qArr = freshData.quarterlyPerQuarterRawData[filterQuarter] || [];
        const pn = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
        qArr.forEach(qc => {
          const fWages = pn(qc.kpis['employees_wc_wages_female']) + pn(qc.kpis['employees_bc_wages_female']);
          const mWages = pn(qc.kpis['employees_wc_wages_male']) + pn(qc.kpis['employees_bc_wages_male']);
          const fc = pn(qc.kpis['employees_wc_female_fulltime']) + pn(qc.kpis['employees_wc_female_contractual']) + pn(qc.kpis['employees_wc_female_parttime']) + pn(qc.kpis['employees_bc_female_fulltime']) + pn(qc.kpis['employees_bc_female_contractual']) + pn(qc.kpis['employees_bc_female_parttime']);
          const mc = pn(qc.kpis['employees_wc_male_fulltime']) + pn(qc.kpis['employees_wc_male_contractual']) + pn(qc.kpis['employees_wc_male_parttime']) + pn(qc.kpis['employees_bc_male_fulltime']) + pn(qc.kpis['employees_bc_male_contractual']) + pn(qc.kpis['employees_bc_male_parttime']);
          perQRatioMap.set(qc.companyId, {
            'Female Wages': String(Math.round(fWages * 100) / 100),
            'Female Count': String(Math.round(fc)),
            'Male Wages': String(Math.round(mWages * 100) / 100),
            'Male Count': String(Math.round(mc)),
          });
        });
      }

      // For jobsPerCrRevenue, recalculate ratio columns for the selected quarter
      const perQJobsRatioMap = new Map<string, Record<string, string>>();
      if (sourceInsightKey === 'jobsPerCrRevenue' && freshData?.quarterlyPerQuarterRawData) {
        const qArr = freshData.quarterlyPerQuarterRawData[filterQuarter] || [];
        const pn = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
        const empKeysQ = ['employees_wc_male_fulltime', 'employees_wc_male_contractual', 'employees_wc_male_parttime', 'employees_wc_female_fulltime', 'employees_wc_female_contractual', 'employees_wc_female_parttime', 'employees_bc_male_fulltime', 'employees_bc_male_contractual', 'employees_bc_male_parttime', 'employees_bc_female_fulltime', 'employees_bc_female_contractual', 'employees_bc_female_parttime'];
        qArr.forEach(qc => {
          const qEmp = empKeysQ.reduce((s, k) => s + pn(qc.kpis[k]), 0);
          const qRev = pn(qc.kpis['net_revenue']);
          perQJobsRatioMap.set(qc.companyId, {
            'Total Employees': String(Math.round(qEmp)),
            'Net Revenue (₹ Cr)': String(Math.round(qRev * 100) / 100),
          });
        });
      }

      data = data
        .map(row => {
          const updated: CompanyDataRow = {
            ...row,
            value: row[qKey] || '',
          };
          // Swap ratio columns for genderPayParityIndex per quarter
          if (sourceInsightKey === 'genderPayParityIndex' && perQRatioMap.size > 0) {
            const matchedCompanyId = row.companyId
              || freshData?.quarterlyPerQuarterRawData?.[filterQuarter]?.find(qc => qc.brand === row.brand)?.companyId;
            if (matchedCompanyId && perQRatioMap.has(matchedCompanyId)) {
              updated.ratioColumns = perQRatioMap.get(matchedCompanyId);
            }
          }
          // Swap ratio columns for jobsPerCrRevenue per quarter
          if (sourceInsightKey === 'jobsPerCrRevenue' && perQJobsRatioMap.size > 0) {
            const matchedCompanyId = row.companyId
              || freshData?.quarterlyPerQuarterRawData?.[filterQuarter]?.find(qc => qc.brand === row.brand)?.companyId;
            if (matchedCompanyId && perQJobsRatioMap.has(matchedCompanyId)) {
              updated.ratioColumns = perQJobsRatioMap.get(matchedCompanyId);
            }
          }
          return updated;
        })
        .filter(row => {
          return row.value !== undefined && row.value !== null && row.value !== '' && row.value !== '—';
        });
    }

    return data;
  }, [activeCompanyData, filterQuarter, state?.sourceInsightKey, freshData]);

  if (!state) {
    return (
      <DashboardLayout>
        <PageHeader title="Analytics Detail" subtitle="No data available" />
        <Card className="mt-4">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No analytics data to display. Please navigate from the dashboard.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const { title, featureLabel, companyData, filters, isPct, allFilteredCompanies } = state;
  // Derive ratioColumnHeaders from state, shared registry, or calc-based facility headers
  const facilityLabels = ['Office', 'Stores (CoCo)', 'Warehouses', 'Manufacturing', 'Data Center', 'Retail Outlets', 'Distribution'];
  const wasteFacilityLabels = ['Office', 'Stores (CoCo)', 'Warehouses', 'Manufacturing', 'Dark Stores', 'Distribution'];
  const calcIdHeaders: Record<string, string[]> = {
    'calc:energyConsumed': facilityLabels.flatMap(l => [`${l} Energy (kWh)`, `${l} Renewable (%)`]),
    'calc:renewableEnergy': facilityLabels.flatMap(l => [`${l} Renewable (%)`, `${l} Energy (kWh)`]),
    'calc:wasteGen': wasteFacilityLabels.flatMap(l => [`${l} Waste (MT)`, `${l} Recycled (%)`]),
    'calc:wasteRecycled': wasteFacilityLabels.flatMap(l => [`${l} Recycled (%)`, `${l} Waste (MT)`]),
  };
  const calcRatioKey = state.sourceCalcId?.replace(/^calc:/, '');
  const ratioColumnHeaders = state.ratioColumnHeaders
    || (state.sourceInsightKey && RATIO_COMPONENT_COLUMNS[state.sourceInsightKey] ? RATIO_COMPONENT_COLUMNS[state.sourceInsightKey].headers : undefined)
    || (calcRatioKey && RATIO_COMPONENT_COLUMNS[calcRatioKey] ? RATIO_COMPONENT_COLUMNS[calcRatioKey].headers : undefined)
    || (state.sourceCalcId && calcIdHeaders[state.sourceCalcId] ? calcIdHeaders[state.sourceCalcId] : undefined);
  const isOperationsFeature = filters?.feature === 'operations';

  // Compute companies NOT considered (in allFilteredCompanies but not in active data)
  // Special case: ESG Composite detail keeps no-env-feature companies in the table,
  // but they must still be counted under "Not Considered".
  const consideredBrands = new Set(activeCompanyData.map(c => c.brand));
  const envFeatureMissingBrands = new Set(
    state?.sourceInsightKey === 'esgCompositeScore'
      ? activeCompanyData
          .filter(c => c.ratioColumns?.['E Score (35%)'] === 'N/A')
          .map(c => c.brand)
      : []
  );
  const missingCompanies: CompanyDataRow[] = (allFilteredCompanies || [])
    .filter(c => !consideredBrands.has(c.brand) || envFeatureMissingBrands.has(c.brand))
    .map(c => ({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: 'Not filled' }));

  const derived = deriveUnitInfo(title, isPct);
  const unit = state.unit || derived.unit;
  const formula = state.formula || derived.formula;

  const tLower = title.toLowerCase();
  const isMsmeMetric = tLower.includes('micro/small') || tLower.includes('number of medium');
  const isAwards = tLower.includes('total awards');
  const isMedia = tLower.includes('total media mentions') || tLower.includes('media mention');
  const isTextFieldResponses = tLower === 'text field responses';
  const textFieldHasValidity = isTextFieldResponses && filteredCompanyData.some(r => r.col2 && r.col2 !== '—');
  const isAdditionalComments = tLower === 'additional comments';
  const isAwardsOrMedia = isAwards || isMedia;

  // Sort by numeric value — ascending for intensity/cost metrics, descending for others
  const isAscendingMetric = title.toLowerCase().includes('plastic per') || title.toLowerCase().includes('intensity');
  const sortedData = [...filteredCompanyData].sort((a, b) => {
    const aNum = parseFloat(a.value);
    const bNum = parseFloat(b.value);
    if (!isNaN(aNum) && !isNaN(bNum)) return isAscendingMetric ? aNum - bNum : bNum - aNum;
    return a.brand.localeCompare(b.brand);
  });

  // Display data: either the companies with data, or missing companies
  const displayData = showMissing ? missingCompanies : sortedData;

  const summary = computeSummary(sortedData.map(d => parseFloat(d.value)), !!isPct);
  const { total, avg, max, min, isNumeric } = summary;

  const formatValue = (val: string, includeUnit = true) => {
    if (!val || val === '—') return '—';
    const num = parseFloat(val);
    if (isNaN(num)) return val; // text value (e.g. initiative names)
    const formatted = formatNum(num, unit);
    if (!includeUnit) return formatted;
    if (unit === '%') return `${formatted}%`;
    if (unit === '₹') return `₹${formatted}`;
    if (unit === 'x') return `${formatted}x`;
    if (unit === 'Ratio') return `${formatted} (ratio)`;
    if (unit === 'Headcount') return `${formatted} employees`;
    if (unit === 'Count') return formatted;
    if (unit === 'Score') return formatted;
    if (unit === '' || unit === 'Number') return formatted;
    if (unit === 'Text') return val;
    // Units like kWh, MT, KL, INR Cr, INR Lakhs, Jobs/₹Cr
    return `${formatted} ${unit}`;
  };

  // Build export columns dynamically based on current view
  const buildExportColumns = (): ExportColumn[] => {
    const cols: ExportColumn[] = [
      { header: 'Brand', accessor: (d: any) => d.brand },
      { header: 'Industry', accessor: (d: any) => d.industry },
      { header: (isAdditionalComments || isTextFieldResponses) ? 'Response' : `Value (${unit})`, accessor: (d: any) => d.value },
    ];
    if (autoHasQuarterly) {
      cols.push(
        { header: 'Q1', accessor: (d: any) => d.q1 || '' },
        { header: 'Q2', accessor: (d: any) => d.q2 || '' },
        { header: 'Q3', accessor: (d: any) => d.q3 || '' },
        { header: 'Q4', accessor: (d: any) => d.q4 || '' },
      );
    }
    if (ratioColumnHeaders) {
      ratioColumnHeaders.forEach(h => {
        cols.push({ header: h, accessor: (d: any) => d.ratioColumns?.[h] || '' });
      });
    }
    if (isAwards) {
      cols.push({ header: 'Award Title', accessor: (d: any) => d.col1 || '' });
      cols.push({ header: 'Award Description', accessor: (d: any) => d.col2 || '' });
    }
    if (isMedia) {
      cols.push({ header: 'Title', accessor: (d: any) => d.col1 || '' });
      cols.push({ header: 'Relevant Link', accessor: (d: any) => d.col2 || '' });
    }
    if (isTextFieldResponses) {
      cols.push({ header: 'Field', accessor: (d: any) => d.col1 || '' });
      if (textFieldHasValidity) {
        cols.push({ header: 'Validity', accessor: (d: any) => d.col2 || '' });
      }
    }
    return cols;
  };

  const handleExportExcel = () => {
    const safeName = title.replace(/[^a-zA-Z0-9]/g, '_');
    const summaryCards: { label: string; value: string }[] = [];
    if (isNumeric) {
      if (!isPct && !state?.sourceInsightKey) summaryCards.push({ label: 'Total', value: total.toFixed(2) });
      summaryCards.push({ label: 'Average', value: avg.toFixed(2) });
      summaryCards.push({ label: 'Highest', value: max.toFixed(2) });
      summaryCards.push({ label: 'Lowest', value: min.toFixed(2) });
      summaryCards.push({ label: 'Companies', value: String(filteredCompanyData.length) });
    }
    exportDetailXLSX(safeName, buildExportColumns(), sortedData, {
      title,
      summaryCards,
    });
  };

  const handleExportPDF = () => {
    const safeName = title.replace(/[^a-zA-Z0-9]/g, '_');
    const summaryCards: { label: string; value: string }[] = [];
    if (isNumeric) {
      if (!isPct && !state?.sourceInsightKey) summaryCards.push({ label: 'Total', value: formatValue(total.toFixed(2)) });
      summaryCards.push({ label: 'Average', value: formatValue(avg.toFixed(2)) });
      summaryCards.push({ label: 'Highest', value: formatValue(max.toFixed(2)) });
      summaryCards.push({ label: 'Lowest', value: formatValue(min.toFixed(2)) });
      summaryCards.push({ label: 'Companies', value: String(filteredCompanyData.length) });
    }
    exportPDF(safeName, {
      title,
      subtitle: featureLabel,
      filterSummary: buildFilterSummary({ ...filters, ...(filterQuarter !== 'all' ? { quarter: filterQuarter } : {}), year: parseInt(filterYear) }),
      columns: buildExportColumns(),
      rows: sortedData,
      summaryCards,
    });
  };

  const periodLabel = filters?.quarterlyKpiCombined
    ? `Q1-Q4 Combined ${filterYear}`
    : filters?.period === 'quarterly' 
      ? `${filterQuarter !== 'all' ? filterQuarter : filters.quarter} ${filterYear}` 
      : `Annual ${filterYear}`;
  const isLoadingFresh = isRefetching;

  return (
    <DashboardLayout>
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={() => {
          const p = new URLSearchParams();
          if (filters?.period) p.set('period', filters.period);
          if (filters?.quarter) p.set('quarter', filters.quarter);
          if (filters?.year) p.set('year', String(filters.year));
          if (filters?.feature) p.set('feature', filters.feature);
          if (filters?.industry) p.set('industry', filters.industry);
          if (filters?.fund) p.set('fund', filters.fund);
          if (filters?.revenueStage) p.set('revenueStage', filters.revenueStage);
          if (filters?.qCategory) p.set('qCategory', filters.qCategory);
          if (filters?.companyId) p.set('companyId', filters.companyId);
          if (state?.sourceInsightKey) p.set('tab', 'insight');
          navigate(`/admin/dashboard?${p.toString()}`);
        }}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <Badge variant="outline" className="text-xs">{featureLabel}</Badge>
            <Badge variant="secondary" className="text-xs">{periodLabel}</Badge>
            <Badge variant="secondary" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              n={filteredCompanyData.length}
            </Badge>
            <Badge variant="outline" className="text-xs font-mono">{unit}</Badge>
            {isLoadingFresh && <Badge variant="secondary" className="text-xs animate-pulse">Loading {filterYear} data…</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Quarter filter: always shown */}
          <Select 
            value={filterQuarter} 
            onValueChange={setFilterQuarter}
          >
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue placeholder="Quarter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quarters</SelectItem>
              <SelectItem value="Q1">Q1</SelectItem>
              <SelectItem value="Q2">Q2</SelectItem>
              <SelectItem value="Q3">Q3</SelectItem>
              <SelectItem value="Q4">Q4</SelectItem>
            </SelectContent>
          </Select>
          {/* Year filter: enabled with available years */}
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="h-8 w-[90px] text-xs">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
          {/* Q Category filter */}
          <Select value={filterQCategory} onValueChange={setFilterQCategory}>
            <SelectTrigger className="h-8 w-[90px] text-xs">
              <SelectValue placeholder="Q Cat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Q Cat</SelectItem>
              <SelectItem value="Q">Q</SelectItem>
              <SelectItem value="Q1">Q1</SelectItem>
              <SelectItem value="Q2">Q2</SelectItem>
              <SelectItem value="Q3">Q3</SelectItem>
              <SelectItem value="Early">Early</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Calculation methodology — hide for text/comment detail views and partner name lists */}
      {!isTextFieldResponses && !isAdditionalComments && !isAwardsOrMedia && !tLower.includes('partner name') && (() => {
        const insightMeta = findInsightMeta(title);
        return (
          <Card className="mb-4 bg-muted/30 border-dashed">
            <CardContent className="py-3 px-4 flex items-start gap-2">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">Calculation Method</p>
                <p className="text-sm font-medium mt-0.5 whitespace-pre-line">{formula}</p>
                <p className="text-xs text-muted-foreground mt-1">Unit: <span className="font-mono font-medium">{unit}</span></p>
                {insightMeta && insightMeta.inputs.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-dashed border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Input Fields Used</p>
                    <div className="flex flex-wrap gap-1.5">
                      {insightMeta.inputs.map((input, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] font-normal">
                          {input}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Summary stats */}
      {isNumeric && !isTextFieldResponses && !isAdditionalComments && (() => {
        const isCompanyCountMetric = tLower.includes('compliant companies') || tLower.includes('initiative companies') || tLower.includes('partner');
        const statCards = isCompanyCountMetric ? [
          { label: 'Companies', value: String(filteredCompanyData.length) },
        ] : [
          ...(!isPct && !state?.sourceInsightKey ? [{ label: 'Total', value: formatValue(total.toFixed(isOperationsFeature ? 0 : 2)) }] : []),
          ...(!isOperationsFeature ? [{ label: 'Average', value: formatValue(avg.toFixed(2)) }] : []),
          { label: 'Highest', value: formatValue(max.toFixed(isOperationsFeature ? 0 : 2)) },
          { label: 'Lowest', value: formatValue(min.toFixed(isOperationsFeature ? 0 : 2)) },
        ];
        return (
        <div className={`grid gap-3 mb-4 ${isPct || state?.sourceInsightKey || isCompanyCountMetric ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-5'}`}>
          {statCards.map(stat => (
            <Card key={stat.label}>
              <CardContent className="pt-3 pb-2">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
          {missingCompanies.length > 0 && !isMsmeMetric && !state?.hideNotConsidered && (
            <Card
              className={`cursor-pointer hover:shadow-md transition-shadow ${showMissing ? 'border-destructive/50 bg-destructive/5' : ''}`}
              onClick={() => setShowMissing(!showMissing)}
            >
              <CardContent className="pt-3 pb-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <UserX className="w-3.5 h-3.5 text-destructive" />
                  <p className="text-xs text-muted-foreground">Not Considered</p>
                </div>
                <p className="text-lg font-bold text-destructive">{missingCompanies.length}</p>
                <p className="text-[10px] text-muted-foreground">companies · KPI not filled</p>
              </CardContent>
            </Card>
          )}
        </div>
        );
      })()}

      {/* Not-considered card when no numeric stats */}
      {!isNumeric && missingCompanies.length > 0 && !isMsmeMetric && !state?.hideNotConsidered && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Card
            className={`cursor-pointer hover:shadow-md transition-shadow ${showMissing ? 'border-destructive/50 bg-destructive/5' : ''}`}
            onClick={() => setShowMissing(!showMissing)}
          >
            <CardContent className="pt-3 pb-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <UserX className="w-3.5 h-3.5 text-destructive" />
                <p className="text-xs text-muted-foreground">Not Considered</p>
              </div>
              <p className="text-lg font-bold text-destructive">{missingCompanies.length}</p>
              <p className="text-[10px] text-muted-foreground">companies · KPI not filled</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Company-wise table */}
      {(() => {
        const isCircularEconomy = state?.sourceInsightKey === 'circularEconomyIndex';
        const nonFashionHeaders = ratioColumnHeaders; // default headers from config
        const fashionHeaders = CIRCULAR_ECONOMY_FASHION_HEADERS;

        const renderCompanyTable = (
          tableData: typeof displayData,
          tableLabel: string,
          headers: string[] | undefined,
          showSubTotal: boolean,
        ) => (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  {showMissing ? 'Companies Not Considered (KPI Not Filled)' : tableLabel}
                </CardTitle>
                {showMissing && (
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setShowMissing(false)}>
                    ← Back to data
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto max-h-[60vh]">
                <Table>
                  <TableHeader>
                     <TableRow>
                       <TableHead className="w-8 text-xs">#</TableHead>
                       <TableHead className="text-xs">Brand</TableHead>
                       <TableHead className="text-xs">Industry</TableHead>
                       <TableHead className={`text-xs ${(isAdditionalComments || isTextFieldResponses) ? '' : 'text-right'}`}>{showMissing ? 'Status' : (isAdditionalComments) ? 'Response' : isTextFieldResponses ? (textFieldHasValidity ? 'Response (Name)' : 'Response') : 'Value'}</TableHead>
                       {!showMissing && autoHasQuarterly && <>
                         <TableHead className="text-xs text-right">Q1</TableHead>
                         <TableHead className="text-xs text-right">Q2</TableHead>
                         <TableHead className="text-xs text-right">Q3</TableHead>
                         <TableHead className="text-xs text-right">Q4</TableHead>
                       </>}
                       {!showMissing && headers && headers.map(h => (
                         <TableHead key={h} className="text-xs text-right">{h}</TableHead>
                       ))}
                       {!showMissing && isAwards && <><TableHead className="text-xs">Award Title</TableHead><TableHead className="text-xs">Award Description</TableHead></>}
                       {!showMissing && isMedia && <><TableHead className="text-xs">Title</TableHead><TableHead className="text-xs">Relevant Link</TableHead></>}
                       {!showMissing && isTextFieldResponses && <TableHead className="text-xs">Field</TableHead>}
                       {!showMissing && textFieldHasValidity && <TableHead className="text-xs">Validity</TableHead>}
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={4 + (autoHasQuarterly ? 4 : 0) + (headers?.length || 0) + ((isAwards || isMedia) ? 2 : 0) + (isTextFieldResponses ? 1 : 0) + (textFieldHasValidity ? 1 : 0)} className="text-center text-muted-foreground py-8">
                           {showMissing ? 'All companies have filled this KPI' : 'No company data available for this metric'}
                         </TableCell>
                       </TableRow>
                    ) : (
                      tableData.map((row, i) => {
                         const isLowCompleteness = state?.lowCompletenessBrands?.includes(row.brand);
                         return (
                         <TableRow key={`${row.brand}-${i}`} className={showMissing ? 'bg-destructive/5' : ''}>
                           <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                           <TableCell className={`text-xs font-medium ${isLowCompleteness ? 'text-red-600 dark:text-red-400' : ''}`}>
                             {row.brand}
                           </TableCell>
                           <TableCell className="text-xs">
                             <Badge variant="outline" className="text-[10px]">{row.industry}</Badge>
                           </TableCell>
                           <TableCell className={`text-xs ${(isAdditionalComments || isTextFieldResponses) ? 'whitespace-pre-wrap break-words max-w-md' : 'text-right font-mono'}`}>
                             {showMissing ? (
                               <Badge variant="destructive" className="text-[10px]">Not filled</Badge>
                             ) : (isAdditionalComments || isTextFieldResponses) ? (
                               row.value || '—'
                             ) : (
                               formatValue(row.value, false) || '—'
                             )}
                           </TableCell>
                           {!showMissing && autoHasQuarterly && <>
                             <TableCell className="text-xs text-right font-mono">{formatValue(row.q1 || '', false) || '—'}</TableCell>
                             <TableCell className="text-xs text-right font-mono">{formatValue(row.q2 || '', false) || '—'}</TableCell>
                             <TableCell className="text-xs text-right font-mono">{formatValue(row.q3 || '', false) || '—'}</TableCell>
                             <TableCell className="text-xs text-right font-mono">{formatValue(row.q4 || '', false) || '—'}</TableCell>
                           </>}
                            {!showMissing && headers && headers.map(h => {
                               const cellVal = row.ratioColumns?.[h] || '';
                               const isNA = cellVal === '-1' || cellVal === 'N/A' || cellVal === 'NA';
                               return <TableCell key={h} className={`text-xs text-right font-mono ${isNA ? 'text-muted-foreground italic' : ''}`}>{isNA ? 'NA' : (formatValue(cellVal, false) || '—')}</TableCell>;
                            })}
                           {!showMissing && isAwards && <><TableCell className="text-xs whitespace-pre-wrap break-words max-w-xs">{row.col1 || '—'}</TableCell><TableCell className="text-xs whitespace-pre-wrap break-words max-w-xs">{row.col2 || '—'}</TableCell></>}
                           {!showMissing && isMedia && <><TableCell className="text-xs whitespace-pre-wrap break-words max-w-xs">{row.col1 || '—'}</TableCell><TableCell className="text-xs whitespace-pre-wrap break-words max-w-xs">{row.col2 || '—'}</TableCell></>}
                           {!showMissing && isTextFieldResponses && <TableCell className="text-xs whitespace-pre-wrap break-words max-w-xs">{row.col1 || '—'}</TableCell>}
                           {!showMissing && textFieldHasValidity && <TableCell className="text-xs whitespace-pre-wrap break-words max-w-xs">{row.col2 || '—'}</TableCell>}
                         </TableRow>
                         );
                      })
                    )}
                    {/* Sub-total row for insight metrics with ratio columns */}
                    {showSubTotal && !showMissing && state?.sourceInsightKey && headers && tableData.length > 0 && (() => {
                      const SUB_TOTAL_INSIGHTS = new Set([
                        'recycledContentRatio', 'mtPlasticPerCrRevenue', 'eprComplianceRate', 'eprComplianceGap',
                        'recyclableVsNonRecyclablePrimary', 'syntheticVsNaturalFiberRatio', 'monoMaterialRecyclablePct',
                        'recycledPlasticAdoptionFashion',
                      ]);
                      if (!SUB_TOTAL_INSIGHTS.has(state.sourceInsightKey)) return null;
                      const colSums: Record<string, number> = {};
                      headers.forEach(h => { colSums[h] = 0; });
                      tableData.forEach(row => {
                        headers.forEach(h => {
                          colSums[h] += parseFloat(row.ratioColumns?.[h] || '0') || 0;
                        });
                      });
                      const valueSum = tableData.reduce((s, r) => s + (parseFloat(r.value) || 0), 0);
                      return (
                        <TableRow className="bg-muted/50 font-semibold border-t-2">
                          <TableCell className="text-xs"></TableCell>
                          <TableCell className="text-xs font-bold" colSpan={2}>Responses (Sub-Total)</TableCell>
                          <TableCell className="text-xs text-right font-mono font-bold">{formatValue(valueSum.toFixed(2), false)}</TableCell>
                          {autoHasQuarterly && <><TableCell /><TableCell /><TableCell /><TableCell /></>}
                          {headers.map(h => (
                            <TableCell key={h} className="text-xs text-right font-mono font-bold">{formatValue(colSums[h].toFixed(2), false)}</TableCell>
                          ))}
                        </TableRow>
                      );
                    })()}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );

        if (isCircularEconomy && !showMissing) {
          const nonFashionData = displayData.filter(r => !r.usesFashionPackaging);
          const fashionData = displayData.filter(r => r.usesFashionPackaging);
          return (
            <>
              {renderCompanyTable(nonFashionData, 'Non-Fashion Companies', nonFashionHeaders, true)}
              {renderCompanyTable(fashionData, 'Fashion & Lifestyle Companies', fashionHeaders, false)}
            </>
          );
        }

        return renderCompanyTable(displayData, showMissing ? 'Companies Not Considered (KPI Not Filled)' : 'Company-wise Data', ratioColumnHeaders, true);
      })()}
    </DashboardLayout>
  );
};

export default AnalyticsDetail;

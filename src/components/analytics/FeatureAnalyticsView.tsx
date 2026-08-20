import { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FEATURE_FIELD_MAPPINGS } from '@/lib/featureFieldMapping';
import { CompanyRawMetrics, InsightMetrics, AggregationMetrics } from '@/hooks/useAnalyticsDashboardData';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { computeSummary } from '@/lib/analyticsCalc';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import { Users, ExternalLink, TrendingUp, Hash, Droplets, Zap, Trash2, ShieldCheck, LineChart, BarChart3 } from 'lucide-react';
import { TextResponsesSection } from './TextResponsesSection';

interface FeatureAnalyticsViewProps {
  featureKey: string;
  companyRawData: CompanyRawMetrics[];
  currentInsights: InsightMetrics;
  currentAggregation: AggregationMetrics;
  filters: any;
  quarterlyPerQuarterRawData?: Record<string, CompanyRawMetrics[]>;
  allCompanyRawData?: CompanyRawMetrics[];
}

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

const COLORS = [
  'hsl(160, 84%, 39%)', 'hsl(217, 91%, 60%)', 'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 60%)', 'hsl(340, 75%, 55%)', 'hsl(200, 70%, 50%)',
  'hsl(160, 60%, 50%)', 'hsl(30, 80%, 55%)', 'hsl(260, 60%, 55%)',
  'hsl(10, 75%, 55%)', 'hsl(180, 60%, 45%)', 'hsl(300, 50%, 55%)',
];

import { FEATURE_INSIGHT_METRICS } from '@/lib/featureInsightMetrics';

const r2 = (v: number): number => Math.round(v * 100) / 100;

const fmtWithCommas = (num: number, decimals = 2): string => {
  const parts = num.toFixed(decimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

const fmt = (v: number, unit = '') => {
  const rounded = r2(v);
  if (Math.abs(rounded) >= 10000) return `${fmtWithCommas(rounded / 1000)}K${unit}`;
  return `${fmtWithCommas(rounded)}${unit}`;
};

const isPercentField = (fieldLabel: string, fieldId: string): boolean => {
  const label = fieldLabel.toLowerCase();
  const id = fieldId.toLowerCase();
  return label.includes('%') || label.includes('percentage') || label.includes('pct') ||
    label.includes('rate') || label.includes('ratio') ||
    id.includes('_pct') || id.includes('percentage') || id.includes('recyclability') ||
    id.includes('_rate') || id.includes('_ratio');
};

const isCategoricalField = (fieldId: string): boolean => {
  return fieldId.includes('_size') || fieldId.includes('_dei_factors') ||
    fieldId.includes('_impact') || fieldId.includes('description') ||
    fieldId.includes('_list') || fieldId.includes('_names') ||
    fieldId.includes('_validity') || fieldId.includes('weblinks') ||
    fieldId.includes('_note') || fieldId.includes('classification') ||
    fieldId.includes('partner_name') || fieldId.includes('_comments') ||
    fieldId.includes('last_update') || fieldId.includes('_initiatives');
};

// Features that should NOT show graphs in the aggregation section
const NO_GRAPH_FEATURES = new Set(['businessInformation', 'operations', 'certifications', 'governancePolicies', 'social', 'primarySecondaryPackaging', 'fashionMaterials', 'sourcingFulfillment', 'waterManagement', 'wasteManagement']);
// Features where Derived Insights section should NOT show consolidated/timeline graphs
const NO_INSIGHT_GRAPH_FEATURES = new Set<string>([]);

const CUSTOM_SUMMARY_FEATURES = new Set(['incidentLog', 'productServiceCertifications', 'governancePolicies', 'csr', 'operations', 'waterManagement', 'wasteManagement']);

// Helper: count isYes across companies for a KPI key
const isYes = (val: string | null | undefined): boolean => {
  if (!val) return false;
  const v = val.toLowerCase().trim();
  return v === 'yes' || v === 'y' || v === 'true' || v === '1';
};

const POLICIES_LIST = [
  { key: 'posh', label: 'PoSH Policy' },
  { key: 'code_of_conduct', label: 'Code of Conduct' },
  { key: 'supplier_code_of_conduct', label: 'Supplier Code of Conduct' },
  { key: 'health_and_safety', label: 'Health & Safety Policy' },
  { key: 'dei', label: 'DEI Policy' },
  { key: 'hr', label: 'HR Policy' },
  { key: 'human_rights', label: 'Human Rights Policy' },
  { key: 'esg', label: 'ESG Policy' },
  { key: 'environment', label: 'Environment Policy' },
  { key: 'grievance_internal', label: 'Grievance Redressal (Internal)' },
  { key: 'grievance_external', label: 'Grievance Redressal (External)' },
  { key: 'data_protection', label: 'Data Protection Policy' },
];

// ─── Stat Card ───
const MetricCard = ({ label, value, subtitle, onClick }: { label: string; value: string | number; subtitle?: string; onClick?: () => void }) => {
  const displayVal = typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value;
  return (
    <Card className={`hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <CardContent className="pt-3 pb-2">
        <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
        <p className="text-lg font-bold">{displayVal}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
};

// ─── Section Header ───
const SectionHeader = ({ title, n, icon: Icon }: { title: string; n?: number; icon?: any }) => (
  <div className="flex items-center gap-2 mb-3">
    {Icon && <Icon className="w-4 h-4 text-primary" />}
    <h3 className="text-sm font-semibold">{title}</h3>
    {n !== undefined && (
      <Badge variant="outline" className="text-xs">
        <Users className="w-3 h-3 mr-1" />n={n}
      </Badge>
    )}
  </div>
);

export const FeatureAnalyticsView = ({
  featureKey, companyRawData, currentInsights, currentAggregation, filters, quarterlyPerQuarterRawData, allCompanyRawData
}: FeatureAnalyticsViewProps) => {
 
  const navigate = useNavigate();
  const mapping = FEATURE_FIELD_MAPPINGS[featureKey];

  // Fetch companies that have this feature enabled
  // For packaging analytics, also include fashionMaterials companies (they contribute fashion packaging data)
  const [featureEnabledCompanyIds, setFeatureEnabledCompanyIds] = useState<Set<string> | null>(null);
  useEffect(() => {
    const fetchFeatureCompanies = async () => {
      const featureKeys = featureKey === 'primarySecondaryPackaging'
        ? ['primarySecondaryPackaging', 'fashionMaterials']
        : [featureKey];

      const data = await http
        .get<{ company_id: string; feature_key: string }[]>(
          'mis/company-feature-settings'
        );

      if (data) {
        //console.log('getting company profile data data',data);
        // setFeatureEnabledCompanyIds(new Set(data.map((d) => d.company_id)));
      }
    };
    fetchFeatureCompanies();
  }, [featureKey]);

  // Filter companyRawData to only companies with this feature enabled
  // Fall back to all companies if no feature assignments found (core features like Incidents)
  const featureCompanyRawData = useMemo(() => {
    if (!featureEnabledCompanyIds || featureEnabledCompanyIds.size === 0) return companyRawData;
    return companyRawData.filter(c => featureEnabledCompanyIds.has(c.companyId));
  }, [companyRawData, featureEnabledCompanyIds]);

  // Filter allCompanyRawData to only companies with this feature enabled (for comparison averages)
  const featureAllCompanyRawData = useMemo(() => {
    if (!allCompanyRawData) return undefined;
    if (!featureEnabledCompanyIds || featureEnabledCompanyIds.size === 0) return allCompanyRawData;
    return allCompanyRawData.filter(c => featureEnabledCompanyIds.has(c.companyId));
  }, [allCompanyRawData, featureEnabledCompanyIds]);

  // Filter quarterly per-quarter data similarly
  const featureQuarterlyPerQuarterRawData = useMemo(() => {
    if (!quarterlyPerQuarterRawData || !featureEnabledCompanyIds) return quarterlyPerQuarterRawData;
    const filtered: Record<string, CompanyRawMetrics[]> = {};
    Object.entries(quarterlyPerQuarterRawData).forEach(([q, data]) => {
      filtered[q] = data.filter(c => featureEnabledCompanyIds.has(c.companyId));
    });
    return filtered;
  }, [quarterlyPerQuarterRawData, featureEnabledCompanyIds]);

  const kpiAnalytics = useMemo(() => {
    if (!mapping) return [];

    return mapping.kpis.map(kpi => {
      const fieldAnalytics = kpi.fields
        .filter(field => !isCategoricalField(field.id))
        .map(field => {
          const perCompany: { brand: string; companyName: string; industry: string; value: string; numValue: number }[] = [];
          const isPct = isPercentField(field.label, field.id);

          companyRawData.forEach(company => {
            const possibleKeys = [
              field.id,
              kpi.id,
              `${kpi.id}_${field.id}`,
              `${mapping.featureKey}_${kpi.id}_${field.id}`,
            ];

            let rawValue = '';
            for (const key of possibleKeys) {
              if (company.kpis[key] && company.kpis[key].trim() !== '') {
                rawValue = company.kpis[key];
                break;
              }
            }

            if (!rawValue) {
              const matchingKey = Object.keys(company.kpis).find(k =>
                k.includes(kpi.id) && k.includes(field.id) && company.kpis[k]?.trim()
              );
              if (matchingKey) rawValue = company.kpis[matchingKey];
            }

            if (rawValue) {
              const numValue = parseFloat(rawValue);
              perCompany.push({
                brand: company.brand,
                companyName: company.companyName,
                industry: company.industry,
                value: rawValue,
                numValue,
              });
            }
          });

          // Tag with source KPI key so detail page can re-fetch Q1-Q4 breakdown
          const actualKpiKey = `${kpi.id}_${field.id}`;
          (perCompany as any)._sourceKpiKey = actualKpiKey;

          const summary = computeSummary(perCompany.map(c => c.numValue), isPct);
          const primaryValue = isPct ? summary.avg : summary.total;

          return { field, perCompany, n: perCompany.length, total: summary.total, avg: summary.avg, primaryValue, isPct, isNumeric: summary.isNumeric };
        });

      return { kpi, fieldAnalytics };
    });
  }, [mapping, companyRawData]);

  // Build a simple list of all filtered companies for "not considered" tracking on detail page
  // Use featureCompanyRawData so only companies assigned to the feature are in the denominator
  const allFilteredCompanies = useMemo(() => featureCompanyRawData.map(c => ({
    brand: c.brand, companyName: c.companyName, industry: c.industry,
  })), [featureCompanyRawData]);

  const insightMetrics = FEATURE_INSIGHT_METRICS[featureKey] || [];

  console.log('insightMetrics :: ',insightMetrics)

  // Pre-compute Q4 vendor MIS analytics for Sourcing & Fulfillment (must be before conditional returns)
  // Only vendor count (num_vendors) fields use Q4 snapshot. % International fields use regular
  // kpiAnalytics (annual combined data) to stay consistent with the detail page.
  const vendorMisQ4Analytics = useMemo(() => {
    if (featureKey !== 'sourcingFulfillment') return null;
    const isAnnualWithQ = !!featureQuarterlyPerQuarterRawData && Object.keys(featureQuarterlyPerQuarterRawData).length > 0;
    const q4Src = isAnnualWithQ ? (featureQuarterlyPerQuarterRawData!['Q4'] || []) : null;
    if (!q4Src || !mapping) return null;
    const filtered = kpiAnalytics.filter(({ kpi }) => kpi.id !== 'suppliers_vendors');
    // Get the original vendor_mis field analytics from kpiAnalytics for pct_international fields
    const originalVendorMis = kpiAnalytics.find(({ kpi }) => kpi.id === 'vendor_mis');
    return filtered.map(({ kpi, fieldAnalytics }) => {
      if (kpi.id !== 'vendor_mis') return { kpi, fieldAnalytics };
      const rebuiltFields = kpi.fields
        .filter((field: any) => !isCategoricalField(field.id))
        .map((field: any) => {
          const actualKpiKey = `vendor_mis_${field.id}`;
          const isVendorCount = field.id.endsWith('_num_vendors');

          // For pct_international fields, use the original kpiAnalytics data (annual combined)
          // to stay consistent with detail page which re-fetches using _sourceKpiKey
          if (!isVendorCount && originalVendorMis) {
            const originalField = originalVendorMis.fieldAnalytics.find((fa: any) => fa.field.id === field.id);
            if (originalField) return originalField;
          }

          // For num_vendors fields, use Q4 snapshot
          const perCompany: any[] = [];
          const isPct = isPercentField(field.label, field.id);
          const isVendorCountField = field.id.endsWith('_num_vendors');
          const totalQ4Companies = q4Src.length;
          q4Src.forEach((company: CompanyRawMetrics) => {
            const possibleKeys = [field.id, kpi.id, `${kpi.id}_${field.id}`, actualKpiKey];
            let rawValue = '';
            for (const key of possibleKeys) {
              if (company.kpis[key] && company.kpis[key].trim() !== '') { rawValue = company.kpis[key]; break; }
            }
            if (!rawValue) {
              const matchingKey = Object.keys(company.kpis).find(k => k.includes(kpi.id) && k.includes(field.id) && company.kpis[k]?.trim());
              if (matchingKey) rawValue = company.kpis[matchingKey];
            }
            if (rawValue) {
              // For vendor count fields, exclude "0", "NA", "N/A" values
              if (isVendorCountField) {
                const trimmed = rawValue.trim().toLowerCase();
                if (trimmed === '0' || trimmed === 'na' || trimmed === 'n/a') return;
              }
              const numValue = parseFloat(rawValue);
              const row: any = { brand: company.brand, companyName: company.companyName, industry: company.industry, value: rawValue, numValue };
              // Add Q1-Q4 quarterly values
              if (featureQuarterlyPerQuarterRawData) {
                ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
                  const qData = featureQuarterlyPerQuarterRawData[q] || [];
                  const match = qData.find(c => c.brand === company.brand);
                  if (match) {
                    const qVal = match.kpis[actualKpiKey];
                    row[q.toLowerCase()] = (qVal !== undefined && qVal !== null && qVal.trim() !== '') ? qVal : '';
                  }
                });
              }
              perCompany.push(row);
            }
          });
          // Tag with source KPI key for detail page re-fetching
          (perCompany as any)._sourceKpiKey = actualKpiKey;
          const summary = computeSummary(perCompany.map((c: any) => c.numValue), isPct);
          const primaryValue = isPct ? summary.avg : summary.total;
          const notConsidered = isVendorCountField ? totalQ4Companies - perCompany.length : undefined;
          return { field, perCompany, n: perCompany.length, total: summary.total, avg: summary.avg, primaryValue, isPct, isNumeric: summary.isNumeric, notConsidered };
        });
      return { kpi, fieldAnalytics: rebuiltFields };
    });
  }, [featureKey, featureQuarterlyPerQuarterRawData, kpiAnalytics, mapping]);

  if (!mapping) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No mapping found for this feature.</p>;
  }

  // Show "no data" message when a single company is selected but has no entries for this feature
  const isSingleCompanySelected = !!filters?.companyId;
  const singleCompanyHasData = isSingleCompanySelected
    ? featureCompanyRawData.some(c => c.companyId === filters.companyId && Object.keys(c.kpis).length > 0)
    : true;

  if (isSingleCompanySelected && !singleCompanyHasData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">No data available for the selected company in this feature.</p>
        </CardContent>
      </Card>
    );
  }

  // Helper to enrich company data rows with Q1-Q4 quarterly values for a given KPI key
  const enrichWithQuarterly = (rows: { brand: string; companyName: string; industry: string; value: string;[k: string]: any }[], kpiKey: string) => {
    if (!featureQuarterlyPerQuarterRawData) {
      // Tag with source key even when no quarterly data
      (rows as any)._sourceKpiKey = kpiKey;
      return rows;
    }
    const result = rows.map(row => {
      const enriched = { ...row };
      ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
        const qData = featureQuarterlyPerQuarterRawData[q] || [];
        const match = qData.find(c => c.brand === row.brand);
        if (match) {
          const rawVal = match.kpis[kpiKey];
          if (rawVal !== undefined && rawVal !== null && rawVal.trim() !== '') {
            const val = parseFloat(rawVal);
            enriched[q.toLowerCase()] = !isNaN(val) ? String(val) : '';
          } else {
            enriched[q.toLowerCase()] = '';
          }
        }
      });
      return enriched;
    });
    // Tag the result array with source KPI key for detail page re-fetching
    (result as any)._sourceKpiKey = kpiKey;
    return result;
  };

  // Helper to enrich calculated company data with Q1-Q4 using a calc function
  // Optional calcId tags the array so the detail page can reconstruct quarterly data
  const enrichCalcWithQuarterly = (rows: { brand: string; companyName: string; industry: string; value: string;[k: string]: any }[], calcFn: (c: CompanyRawMetrics) => number, calcId?: string) => {
    if (!featureQuarterlyPerQuarterRawData) {
      // Tag with calcId even when no quarterly data so detail page can rebuild
      if (calcId) (rows as any)._sourceCalcId = calcId;
      return rows;
    }
    const result = rows.map(row => {
      const enriched = { ...row };
      ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
        const qData = featureQuarterlyPerQuarterRawData[q] || [];
        const match = qData.find(c => c.brand === row.brand);
        if (match) {
          const val = calcFn(match);
          enriched[q.toLowerCase()] = !isNaN(val) ? String(val) : '';
        }
      });
      return enriched;
    });
    if (calcId) (result as any)._sourceCalcId = calcId;
    return result;
  };

  const handleCardClick = (title: string, companyData: { brand: string; companyName: string; industry: string; value: string; col1?: string; col2?: string; q1?: string; q2?: string; q3?: string; q4?: string; ratioColumns?: Record<string, string> }[], isPct = false, extra?: { hasQuarterlyColumns?: boolean; ratioColumnHeaders?: string[]; sourceInsightKey?: string; unit?: string }) => {
    // Auto-detect quarterly columns if any row has q1-q4 data
    const autoHasQuarterly = companyData.some(r => r.q1 || r.q2 || r.q3 || r.q4);
    const mergedExtra = { ...extra };
    if (autoHasQuarterly && !mergedExtra.hasQuarterlyColumns) {
      mergedExtra.hasQuarterlyColumns = true;
    }
    // Extract source KPI key if tagged on the array
    const sourceKpiKey = (companyData as any)._sourceKpiKey as string | undefined;
    const sourceCalcId = (companyData as any)._sourceCalcId as string | undefined;
    const sourceInsightKey = mergedExtra.sourceInsightKey;
    navigate('/mis/analytics-detail', {
      state: { title, featureLabel: mapping.featureLabel, companyData, filters: { ...filters, feature: featureKey }, isPct, allFilteredCompanies, ...mergedExtra, sourceKpiKey, sourceInsightKey, sourceCalcId },
    });
  };

  const showGraphs = !NO_GRAPH_FEATURES.has(featureKey);

  // ═══════════════════════════════════════════════════════════════
  // CUSTOM RENDERERS
  // ═══════════════════════════════════════════════════════════════

  // ─── Employment & Compensation ───
  if (featureKey === 'social') {
    const parseNum = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
    const fmtInt = (v: number) => { if (Math.abs(v) >= 10000) return `${fmtWithCommas(v / 1000, 0)}K`; return Math.round(v).toLocaleString(); };
    // For annual view with quarterly data, use Q4 snapshot for headcount
    const isAnnualWithQuarters = !!featureQuarterlyPerQuarterRawData && Object.keys(featureQuarterlyPerQuarterRawData).length > 0;
    const q4Data = isAnnualWithQuarters ? (featureQuarterlyPerQuarterRawData!['Q4'] || []) : null;
    // k: sum across companies. For headcount in annual view, use Q4 snapshot
    const k = (key: string) => companyRawData.reduce((s, c) => s + parseNum(c.kpis[key]), 0);
    const kQ4 = (key: string) => q4Data ? q4Data.reduce((s, c) => s + parseNum(c.kpis[key]), 0) : k(key);
    const companyVal = (key: string) => enrichWithQuarterly(companyRawData
      .filter(c => c.kpis[key] !== undefined && c.kpis[key] !== null && c.kpis[key]?.trim() !== '')
      .map(c => ({
        brand: c.brand, companyName: c.companyName, industry: c.industry,
        value: String(parseNum(c.kpis[key])),
      })), key);
    // For headcount in annual view: use Q4 values as the main "Value" column
    const companyValQ4 = (key: string) => {
      if (!q4Data) return companyVal(key);
      return enrichWithQuarterly(q4Data
        .filter(c => c.kpis[key] !== undefined && c.kpis[key] !== null && c.kpis[key]?.trim() !== '')
        .map(c => ({
          brand: c.brand, companyName: c.companyName, industry: c.industry,
          value: String(parseNum(c.kpis[key])),
        })), key);
    };
    const companyCalcQ4 = (fn: (c: CompanyRawMetrics) => number, calcId?: string) => {
      if (!q4Data) return companyCalc(fn, calcId);
      const rows = q4Data
        .filter(c => Object.keys(c.kpis).length > 0)
        .map(c => ({
          brand: c.brand, companyName: c.companyName, industry: c.industry,
          value: String(fn(c)),
        }))
        .filter(c => c.value !== 'NaN' && c.value !== 'undefined' && c.value !== 'null');
      return enrichCalcWithQuarterly(rows, fn, calcId);
    };
    const companyCalc = (fn: (c: CompanyRawMetrics) => number, calcId?: string) => {
      const rows = companyRawData
        .filter(c => Object.keys(c.kpis).length > 0)
        .map(c => ({
          brand: c.brand, companyName: c.companyName, industry: c.industry,
          value: String(fn(c)),
        }))
        .filter(c => c.value !== 'NaN' && c.value !== 'undefined' && c.value !== 'null');
      return enrichCalcWithQuarterly(rows, fn, calcId);
    };

    // WC employees — use Q4 for headcount in annual
    const wcMaleF = kQ4('employees_wc_male_fulltime');
    const wcMaleC = kQ4('employees_wc_male_contractual');
    const wcMaleP = kQ4('employees_wc_male_parttime');
    const wcFemaleF = kQ4('employees_wc_female_fulltime');
    const wcFemaleC = kQ4('employees_wc_female_contractual');
    const wcFemaleP = kQ4('employees_wc_female_parttime');
    const wcTotal = wcMaleF + wcMaleC + wcMaleP + wcFemaleF + wcFemaleC + wcFemaleP;

    // BC employees — use Q4 for headcount in annual
    const bcMaleF = kQ4('employees_bc_male_fulltime');
    const bcMaleC = kQ4('employees_bc_male_contractual');
    const bcMaleP = kQ4('employees_bc_male_parttime');
    const bcFemaleF = kQ4('employees_bc_female_fulltime');
    const bcFemaleC = kQ4('employees_bc_female_contractual');
    const bcFemaleP = kQ4('employees_bc_female_parttime');
    const bcTotal = bcMaleF + bcMaleC + bcMaleP + bcFemaleF + bcFemaleC + bcFemaleP;

    // Overall
    const totalEmployment = wcTotal + bcTotal;

    // C-Level — use Q4 for headcount in annual
    const cLevelTotal = kQ4('leadership_clevel_total');
    const cLevelFemale = kQ4('leadership_clevel_female');

    // Board — use Q4 for headcount in annual
    const boardTotal = kQ4('leadership_board_total');
    const boardFemale = kQ4('leadership_board_female');
    const boardIndependent = kQ4('leadership_board_independent');

    // WC Wages — for annual, compute avg of quarterly (wages/employees) per company, then portfolio avg
    // For quarterly, just sum
    let wcWagesM: number, wcWagesF: number, wcWagesTotal: number;
    let bcWagesM: number, bcWagesF: number, bcWagesTotal: number;
    let totalGrossWages: number;
    // Avg wage per employee (for stat card): avg of quarterly ratios
    let avgWcWagePerEmployee = 0;
    let avgBcWagePerEmployee = 0;

    if (isAnnualWithQuarters) {
      // For wage stat cards in annual: compute avg of quarterly (wages / employees) across Q1-Q4
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

      // WC: per-company avg quarterly wage-per-employee, then portfolio avg
      const wcWagePerEmpByCompany: number[] = [];
      const bcWagePerEmpByCompany: number[] = [];
      const allCompanyIds = new Set(companyRawData.map(c => c.companyId));

      allCompanyIds.forEach(companyId => {
        const wcQuarterlyRatios: number[] = [];
        const bcQuarterlyRatios: number[] = [];
        quarters.forEach(q => {
          const qArr = featureQuarterlyPerQuarterRawData![q] || [];
          const c = qArr.find(x => x.companyId === companyId);
          if (!c) return;
          const wcEmp = parseNum(c.kpis['employees_wc_male_fulltime']) + parseNum(c.kpis['employees_wc_male_contractual']) + parseNum(c.kpis['employees_wc_male_parttime']) +
            parseNum(c.kpis['employees_wc_female_fulltime']) + parseNum(c.kpis['employees_wc_female_contractual']) + parseNum(c.kpis['employees_wc_female_parttime']);
          const wcW = parseNum(c.kpis['employees_wc_wages_male']) + parseNum(c.kpis['employees_wc_wages_female']);
          if (wcEmp > 0 && wcW > 0) wcQuarterlyRatios.push(wcW / wcEmp);
          const bcEmp = parseNum(c.kpis['employees_bc_male_fulltime']) + parseNum(c.kpis['employees_bc_male_contractual']) + parseNum(c.kpis['employees_bc_male_parttime']) +
            parseNum(c.kpis['employees_bc_female_fulltime']) + parseNum(c.kpis['employees_bc_female_contractual']) + parseNum(c.kpis['employees_bc_female_parttime']);
          const bcW = parseNum(c.kpis['employees_bc_wages_male']) + parseNum(c.kpis['employees_bc_wages_female']);
          if (bcEmp > 0 && bcW > 0) bcQuarterlyRatios.push(bcW / bcEmp);
        });
        if (wcQuarterlyRatios.length > 0) wcWagePerEmpByCompany.push(wcQuarterlyRatios.reduce((a, b) => a + b, 0) / wcQuarterlyRatios.length);
        if (bcQuarterlyRatios.length > 0) bcWagePerEmpByCompany.push(bcQuarterlyRatios.reduce((a, b) => a + b, 0) / bcQuarterlyRatios.length);
      });

      avgWcWagePerEmployee = wcWagePerEmpByCompany.length > 0 ? wcWagePerEmpByCompany.reduce((a, b) => a + b, 0) / wcWagePerEmpByCompany.length : 0;
      avgBcWagePerEmployee = bcWagePerEmpByCompany.length > 0 ? bcWagePerEmpByCompany.reduce((a, b) => a + b, 0) / bcWagePerEmpByCompany.length : 0;

      // Still compute raw totals for individual wage cards (Male/Female breakdowns) using combined data
      wcWagesM = k('employees_wc_wages_male');
      wcWagesF = k('employees_wc_wages_female');
      wcWagesTotal = wcWagesM + wcWagesF;
      bcWagesM = k('employees_bc_wages_male');
      bcWagesF = k('employees_bc_wages_female');
      bcWagesTotal = bcWagesM + bcWagesF;
      totalGrossWages = wcWagesTotal + bcWagesTotal;
    } else {
      wcWagesM = k('employees_wc_wages_male');
      wcWagesF = k('employees_wc_wages_female');
      wcWagesTotal = wcWagesM + wcWagesF;
      bcWagesM = k('employees_bc_wages_male');
      bcWagesF = k('employees_bc_wages_female');
      bcWagesTotal = bcWagesM + bcWagesF;
      totalGrossWages = wcWagesTotal + bcWagesTotal;
    }

    // Compensation — compute averages to match detail view (simple avg of per-company values)
    // For annual view with quarterly data, sum Q1-Q4 CXO comp per company (matching detail page sumNotAvgKeys logic)
    const cxoCompVals = (() => {
      if (isAnnualWithQuarters && featureQuarterlyPerQuarterRawData) {
        const companyTotals: number[] = [];
        const allIds = new Set(companyRawData.map(c => c.companyId));
        allIds.forEach(id => {
          let total = 0;
          let hasData = false;
          ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
            const qArr = featureQuarterlyPerQuarterRawData[q] || [];
            const qc = qArr.find(x => x.companyId === id);
            if (qc) {
              const val = qc.kpis['leadership_avg_cxo_compensation'];
              if (val !== undefined && val !== null && val.trim() !== '') {
                total += parseNum(val);
                hasData = true;
              }
            }
          });
          if (hasData) companyTotals.push(total);
        });
        return companyTotals;
      }
      return companyRawData
        .filter(c => c.kpis['leadership_avg_cxo_compensation'] !== undefined && c.kpis['leadership_avg_cxo_compensation'] !== null && c.kpis['leadership_avg_cxo_compensation']?.trim() !== '')
        .map(c => parseNum(c.kpis['leadership_avg_cxo_compensation']));
    })();
    const avgCxoComp = cxoCompVals.length > 0 ? cxoCompVals.reduce((a, b) => a + b, 0) / cxoCompVals.length : 0;

    const empCompVals = companyRawData
      .filter(c => Object.keys(c.kpis).length > 0)
      .map(c => {
        const emp = parseNum(c.kpis['employees_wc_male_fulltime']) + parseNum(c.kpis['employees_wc_male_contractual']) + parseNum(c.kpis['employees_wc_male_parttime']) +
          parseNum(c.kpis['employees_wc_female_fulltime']) + parseNum(c.kpis['employees_wc_female_contractual']) + parseNum(c.kpis['employees_wc_female_parttime']);
        const wages = parseNum(c.kpis['employees_wc_wages_male']) + parseNum(c.kpis['employees_wc_wages_female']);
        return emp > 0 ? wages / emp : 0;
      })
      .filter(v => !isNaN(v));
    const avgEmpComp = empCompVals.length > 0 ? empCompVals.reduce((a, b) => a + b, 0) / empCompVals.length : 0;

    return (
      <div className="space-y-4">
        {/* Derived Insights */}
        {insightMetrics.length > 0 && (
          <InsightSection insightMetrics={insightMetrics} currentInsights={currentInsights} companyRawData={featureCompanyRawData} handleCardClick={handleCardClick} quarterlyPerQuarterRawData={featureQuarterlyPerQuarterRawData} featureKey={featureKey} filters={filters} allCompanyRawData={featureAllCompanyRawData} />
        )}

        {/* 1. White-Collar Employees */}
        <section>
          <SectionHeader title="1. White-Collar Employees (Excl. C-Level & Board)" n={companyRawData.length} icon={Users} />
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <MetricCard label="Male (Full-Time)" value={fmtInt(wcMaleF)} onClick={() => handleCardClick('White Collar Male (Full-Time)', companyValQ4('employees_wc_male_fulltime'))} />
            <MetricCard label="Male (Contractual)" value={fmtInt(wcMaleC)} onClick={() => handleCardClick('White Collar Male (Contractual)', companyValQ4('employees_wc_male_contractual'))} />
            <MetricCard label="Male (Part-Time)" value={fmtInt(wcMaleP)} onClick={() => handleCardClick('White Collar Male (Part-Time)', companyValQ4('employees_wc_male_parttime'))} />
            <MetricCard label="Female (Full-Time)" value={fmtInt(wcFemaleF)} onClick={() => handleCardClick('White Collar Female (Full-Time)', companyValQ4('employees_wc_female_fulltime'))} />
            <MetricCard label="Female (Contractual)" value={fmtInt(wcFemaleC)} onClick={() => handleCardClick('White Collar Female (Contractual)', companyValQ4('employees_wc_female_contractual'))} />
            <MetricCard label="Female (Part-Time)" value={fmtInt(wcFemaleP)} onClick={() => handleCardClick('White Collar Female (Part-Time)', companyValQ4('employees_wc_female_parttime'))} />
            <MetricCard label="Total White-Collar" value={fmtInt(wcTotal)} onClick={() => handleCardClick('Total White-Collar Employees', companyCalcQ4(c => {
              return parseNum(c.kpis['employees_wc_male_fulltime']) + parseNum(c.kpis['employees_wc_male_contractual']) + parseNum(c.kpis['employees_wc_male_parttime']) +
                parseNum(c.kpis['employees_wc_female_fulltime']) + parseNum(c.kpis['employees_wc_female_contractual']) + parseNum(c.kpis['employees_wc_female_parttime']);
            }, 'agg:totalWcEmployees'))} />
          </div>
        </section>

        {/* 2. White-Collar Wages */}
        <section>
          <SectionHeader title="2. White-Collar Wages (Excl. C-Level & Board)" n={companyRawData.length} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <MetricCard label="Total Male White Collar Wages (INR Cr)" value={fmt(wcWagesM)} onClick={() => handleCardClick('Male White-Collar Wages', companyVal('employees_wc_wages_male'))} />
            <MetricCard label="Total Female White Collar Wages (INR Cr)" value={fmt(wcWagesF)} onClick={() => handleCardClick('Female White-Collar Wages', companyVal('employees_wc_wages_female'))} />
            <MetricCard label="Total White Collar Wages (INR Cr)" value={fmt(wcWagesTotal)} onClick={() => handleCardClick('Total White-Collar Wages', companyCalc(c => parseNum(c.kpis['employees_wc_wages_male']) + parseNum(c.kpis['employees_wc_wages_female']), 'agg:totalWcWages'))} />
            {isAnnualWithQuarters && (
              <MetricCard label="Avg WC Wage per Employee (INR Cr)" value={fmt(avgWcWagePerEmployee)} subtitle="Avg of Q1-Q4 ratios" onClick={() => {
                const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
                const allCompanyIds = new Set(featureCompanyRawData.map(c => c.companyId));
                const rows: { brand: string; companyName: string; industry: string; value: string; q1?: string; q2?: string; q3?: string; q4?: string }[] = [];
                allCompanyIds.forEach(companyId => {
                  const cInfo = featureCompanyRawData.find(c => c.companyId === companyId);
                  if (!cInfo) return;
                  const qRatios: Record<string, number> = {};
                  const validRatios: number[] = [];
                  quarters.forEach(q => {
                    const qArr = featureQuarterlyPerQuarterRawData![q] || [];
                    const c = qArr.find(x => x.companyId === companyId);
                    if (!c) return;
                    const wcEmp = parseNum(c.kpis['employees_wc_male_fulltime']) + parseNum(c.kpis['employees_wc_male_contractual']) + parseNum(c.kpis['employees_wc_male_parttime']) +
                      parseNum(c.kpis['employees_wc_female_fulltime']) + parseNum(c.kpis['employees_wc_female_contractual']) + parseNum(c.kpis['employees_wc_female_parttime']);
                    const wcW = parseNum(c.kpis['employees_wc_wages_male']) + parseNum(c.kpis['employees_wc_wages_female']);
                    if (wcEmp > 0 && wcW > 0) { const r = wcW / wcEmp; qRatios[q.toLowerCase()] = r; validRatios.push(r); }
                  });
                  if (validRatios.length > 0) {
                    const sum = validRatios.reduce((a, b) => a + b, 0);
                    const avgRatio = sum / validRatios.length;
                    rows.push({ brand: cInfo.brand, companyName: cInfo.companyName, industry: cInfo.industry, value: String(Math.round(avgRatio * 100) / 100), q1: qRatios['q1'] !== undefined ? String(Math.round(qRatios['q1'] * 100) / 100) : '', q2: qRatios['q2'] !== undefined ? String(Math.round(qRatios['q2'] * 100) / 100) : '', q3: qRatios['q3'] !== undefined ? String(Math.round(qRatios['q3'] * 100) / 100) : '', q4: qRatios['q4'] !== undefined ? String(Math.round(qRatios['q4'] * 100) / 100) : '' });
                  }
                });
                (rows as any)._sourceCalcId = 'calc:avgWcWagePerEmployee';
                handleCardClick('Avg WC Wage per Employee (INR Cr)', rows, false, { hasQuarterlyColumns: true });
              }} />
            )}
          </div>
        </section>

        {/* 3. Blue-Collar Employees */}
        <section>
          <SectionHeader title="3. Blue-Collar Employees" n={companyRawData.length} icon={Users} />
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <MetricCard label="Male (Full-Time)" value={fmtInt(bcMaleF)} onClick={() => handleCardClick('Blue Collar Male (Full-Time)', companyValQ4('employees_bc_male_fulltime'))} />
            <MetricCard label="Male (Contractual)" value={fmtInt(bcMaleC)} onClick={() => handleCardClick('Blue Collar Male (Contractual)', companyValQ4('employees_bc_male_contractual'))} />
            <MetricCard label="Male (Part-Time)" value={fmtInt(bcMaleP)} onClick={() => handleCardClick('Blue Collar Male (Part-Time)', companyValQ4('employees_bc_male_parttime'))} />
            <MetricCard label="Female (Full-Time)" value={fmtInt(bcFemaleF)} onClick={() => handleCardClick('Blue Collar Female (Full-Time)', companyValQ4('employees_bc_female_fulltime'))} />
            <MetricCard label="Female (Contractual)" value={fmtInt(bcFemaleC)} onClick={() => handleCardClick('Blue Collar Female (Contractual)', companyValQ4('employees_bc_female_contractual'))} />
            <MetricCard label="Female (Part-Time)" value={fmtInt(bcFemaleP)} onClick={() => handleCardClick('Blue Collar Female (Part-Time)', companyValQ4('employees_bc_female_parttime'))} />
            <MetricCard label="Total Blue-Collar" value={fmtInt(bcTotal)} onClick={() => handleCardClick('Total Blue-Collar Employees', companyCalcQ4(c => {
              return parseNum(c.kpis['employees_bc_male_fulltime']) + parseNum(c.kpis['employees_bc_male_contractual']) + parseNum(c.kpis['employees_bc_male_parttime']) +
                parseNum(c.kpis['employees_bc_female_fulltime']) + parseNum(c.kpis['employees_bc_female_contractual']) + parseNum(c.kpis['employees_bc_female_parttime']);
            }, 'agg:totalBcEmployees'))} />
          </div>
        </section>

        {/* 4. Blue-Collar Gross Wages */}
        <section>
          <SectionHeader title="4. Blue-Collar Gross Wages" n={companyRawData.length} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <MetricCard label="Total Male Blue Collar Wages (INR Cr)" value={fmt(bcWagesM)} onClick={() => handleCardClick('Male Blue-Collar Wages', companyVal('employees_bc_wages_male'))} />
            <MetricCard label="Total Female Blue Collar Wages (INR Cr)" value={fmt(bcWagesF)} onClick={() => handleCardClick('Female Blue-Collar Wages', companyVal('employees_bc_wages_female'))} />
            <MetricCard label="Total Blue Collar Wages (INR Cr)" value={fmt(bcWagesTotal)} onClick={() => handleCardClick('Total Blue-Collar Wages', companyCalc(c => parseNum(c.kpis['employees_bc_wages_male']) + parseNum(c.kpis['employees_bc_wages_female']), 'agg:totalBcWages'))} />
            {isAnnualWithQuarters && (
              <MetricCard label="Avg BC Wage per Employee (INR Cr)" value={fmt(avgBcWagePerEmployee)} subtitle="Avg of Q1-Q4 ratios" onClick={() => {
                const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
                const allCompanyIds = new Set(featureCompanyRawData.map(c => c.companyId));
                const rows: { brand: string; companyName: string; industry: string; value: string; q1?: string; q2?: string; q3?: string; q4?: string }[] = [];
                allCompanyIds.forEach(companyId => {
                  const cInfo = featureCompanyRawData.find(c => c.companyId === companyId);
                  if (!cInfo) return;
                  const qRatios: Record<string, number> = {};
                  const validRatios: number[] = [];
                  quarters.forEach(q => {
                    const qArr = featureQuarterlyPerQuarterRawData![q] || [];
                    const c = qArr.find(x => x.companyId === companyId);
                    if (!c) return;
                    const bcEmp = parseNum(c.kpis['employees_bc_male_fulltime']) + parseNum(c.kpis['employees_bc_male_contractual']) + parseNum(c.kpis['employees_bc_male_parttime']) +
                      parseNum(c.kpis['employees_bc_female_fulltime']) + parseNum(c.kpis['employees_bc_female_contractual']) + parseNum(c.kpis['employees_bc_female_parttime']);
                    const bcW = parseNum(c.kpis['employees_bc_wages_male']) + parseNum(c.kpis['employees_bc_wages_female']);
                    if (bcEmp > 0 && bcW > 0) { const r = bcW / bcEmp; qRatios[q.toLowerCase()] = r; validRatios.push(r); }
                  });
                  if (validRatios.length > 0) {
                    const sum = validRatios.reduce((a, b) => a + b, 0);
                    const avgRatio = sum / validRatios.length;
                    rows.push({ brand: cInfo.brand, companyName: cInfo.companyName, industry: cInfo.industry, value: String(Math.round(avgRatio * 100) / 100), q1: qRatios['q1'] !== undefined ? String(Math.round(qRatios['q1'] * 100) / 100) : '', q2: qRatios['q2'] !== undefined ? String(Math.round(qRatios['q2'] * 100) / 100) : '', q3: qRatios['q3'] !== undefined ? String(Math.round(qRatios['q3'] * 100) / 100) : '', q4: qRatios['q4'] !== undefined ? String(Math.round(qRatios['q4'] * 100) / 100) : '' });
                  }
                });
                (rows as any)._sourceCalcId = 'calc:avgBcWagePerEmployee';
                handleCardClick('Avg BC Wage per Employee (INR Cr)', rows, false, { hasQuarterlyColumns: true });
              }} />
            )}
          </div>
        </section>

        {/* 5. Overall Workforce & Compensation */}
        <section>
          <SectionHeader title="5. Overall Workforce & Compensation" n={companyRawData.length} icon={Users} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <MetricCard label="Total Employment (White Collar + Blue Collar)" value={fmtInt(totalEmployment)} onClick={() => handleCardClick('Total Employment', companyCalcQ4(c => {
              const wc = parseNum(c.kpis['employees_wc_male_fulltime']) + parseNum(c.kpis['employees_wc_male_contractual']) + parseNum(c.kpis['employees_wc_male_parttime']) +
                parseNum(c.kpis['employees_wc_female_fulltime']) + parseNum(c.kpis['employees_wc_female_contractual']) + parseNum(c.kpis['employees_wc_female_parttime']);
              const bc = parseNum(c.kpis['employees_bc_male_fulltime']) + parseNum(c.kpis['employees_bc_male_contractual']) + parseNum(c.kpis['employees_bc_male_parttime']) +
                parseNum(c.kpis['employees_bc_female_fulltime']) + parseNum(c.kpis['employees_bc_female_contractual']) + parseNum(c.kpis['employees_bc_female_parttime']);
              return wc + bc;
            }, 'agg:totalEmployment'))} />
            <MetricCard label="Total Gross Wages (White Collar + Blue Collar)" value={fmt(totalGrossWages)} onClick={() => handleCardClick('Total Gross Wages', companyCalc(c => {
              return parseNum(c.kpis['employees_wc_wages_male']) + parseNum(c.kpis['employees_wc_wages_female']) +
                parseNum(c.kpis['employees_bc_wages_male']) + parseNum(c.kpis['employees_bc_wages_female']);
            }, 'agg:totalGrossWages'))} />
          </div>
        </section>

        {/* 6. eNPS */}
        <section>
          <SectionHeader title="6. Employee Net Promoter Score (eNPS)" n={companyRawData.length} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <MetricCard label="eNPS (out of 10)" value={fmt((() => { const vals = companyRawData.filter(c => c.kpis['employees_enps'] !== undefined && c.kpis['employees_enps'] !== null && c.kpis['employees_enps']?.trim() !== '' && !isNaN(parseFloat(c.kpis['employees_enps']))).map(c => parseNum(c.kpis['employees_enps'])); return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0; })())} subtitle="Avg" onClick={() => handleCardClick('Employee Net Promoter Score (eNPS)', companyRawData.filter(c => c.kpis['employees_enps'] !== undefined && c.kpis['employees_enps'] !== null && c.kpis['employees_enps']?.trim() !== '').map(c => ({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: c.kpis['employees_enps'] })))} />
          </div>
        </section>

        {/* 7. PwD % */}
        <section>
          <SectionHeader title="7. Percentage of PwDs" n={companyRawData.length} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <MetricCard label="PwD %" value={fmt((() => { const rows = companyRawData.filter(c => c.kpis['employees_pwd_percentage'] !== undefined && c.kpis['employees_pwd_percentage'] !== null && c.kpis['employees_pwd_percentage']?.trim() !== ''); const vals = rows.map(c => parseNum(c.kpis['employees_pwd_percentage'])); return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0; })(), '%')} subtitle="Avg" onClick={() => handleCardClick('Percentage of PwDs (%)', companyVal('employees_pwd_percentage'), true)} />
          </div>
        </section>

        {/* 8. Attrition Rate */}
        <section>
          <SectionHeader title="8. Attrition Rate" n={companyRawData.length} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <MetricCard label="Attrition Rate" value={fmt((() => { const rows = companyRawData.filter(c => c.kpis['employees_attrition_rate'] !== undefined && c.kpis['employees_attrition_rate'] !== null && c.kpis['employees_attrition_rate']?.trim() !== ''); const vals = rows.map(c => parseNum(c.kpis['employees_attrition_rate'])); return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0; })(), '%')} subtitle="Avg" onClick={() => handleCardClick('Attrition Rate (%)', companyVal('employees_attrition_rate'), true)} />
          </div>
        </section>

        {/* 9. C-Level */}
        <section>
          <SectionHeader title="9. C-Level" n={companyRawData.length} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <MetricCard label="Total Executives" value={fmtInt(cLevelTotal)} onClick={() => handleCardClick('C-Level Total Executives', companyValQ4('leadership_clevel_total'))} />
            <MetricCard label="Female Executives" value={fmtInt(cLevelFemale)} onClick={() => handleCardClick('C-Level Female Executives', companyValQ4('leadership_clevel_female'))} />
          </div>
        </section>

        {/* 10. Board */}
        <section>
          <SectionHeader title="10. Board" n={companyRawData.length} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <MetricCard label="Total Members" value={fmtInt(boardTotal)} onClick={() => handleCardClick('Board Total Members', companyValQ4('leadership_board_total'))} />
            <MetricCard label="Female Members" value={fmtInt(boardFemale)} onClick={() => handleCardClick('Board Female Members', companyValQ4('leadership_board_female'))} />
            <MetricCard label="Independent Members" value={fmtInt(boardIndependent)} onClick={() => handleCardClick('Board Independent Members', companyValQ4('leadership_board_independent'))} />
          </div>
        </section>

        {/* 11. Compensation Metrics */}
        <section>
          <SectionHeader title="11. Compensation" n={companyRawData.length} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <MetricCard label="Average CXO Compensation (INR Cr)" value={fmt(avgCxoComp)} onClick={() => {
              // In annual view, override combined (averaged) value with sum of Q1-Q4 per company
              if (isAnnualWithQuarters && featureQuarterlyPerQuarterRawData) {
                const cxoKey = 'leadership_avg_cxo_compensation';
                const rows = companyRawData
                  .filter(c => c.kpis[cxoKey] !== undefined && c.kpis[cxoKey] !== null && c.kpis[cxoKey]?.trim() !== '')
                  .map(c => {
                    let qSum = 0;
                    const row: any = { brand: c.brand, companyName: c.companyName, industry: c.industry, value: '0' };
                    ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
                      const qData = featureQuarterlyPerQuarterRawData[q] || [];
                      const match = qData.find(qc => qc.companyId === c.companyId);
                      const qVal = match ? parseNum(match.kpis[cxoKey]) : 0;
                      row[q.toLowerCase()] = String(qVal);
                      qSum += qVal;
                    });
                    row.value = String(r2(qSum));
                    return row;
                  })
                  .filter((r: any) => r.value !== '0' && r.value !== 'NaN');
                (rows as any)._sourceKpiKey = cxoKey;
                handleCardClick('Average CXO Compensation', rows);
              } else {
                handleCardClick('Average CXO Compensation', companyVal('leadership_avg_cxo_compensation'));
              }
            }} />
            <MetricCard label="Average Employee Compensation (INR Cr)" value={fmt(avgEmpComp)} onClick={() => handleCardClick('Average Employee Compensation', companyCalc(c => {
              const emp = parseNum(c.kpis['employees_wc_male_fulltime']) + parseNum(c.kpis['employees_wc_male_contractual']) + parseNum(c.kpis['employees_wc_male_parttime']) +
                parseNum(c.kpis['employees_wc_female_fulltime']) + parseNum(c.kpis['employees_wc_female_contractual']) + parseNum(c.kpis['employees_wc_female_parttime']);
              const wages = parseNum(c.kpis['employees_wc_wages_male']) + parseNum(c.kpis['employees_wc_wages_female']);
              return emp > 0 ? wages / emp : 0;
            }, 'calc:avgEmployeeCompensation'))} />
          </div>
        </section>

        <TextResponsesSection featureKey={featureKey} companyRawData={companyRawData} onDrillDown={handleCardClick} />
      </div>
    );
  }

  // ─── Sourcing & Fulfillment ───
  if (featureKey === 'sourcingFulfillment') {
    // Filter out KPI 1 (Suppliers or Vendors) — removed from aggregation
    const filteredKpiAnalytics = kpiAnalytics.filter(({ kpi }) => kpi.id !== 'suppliers_vendors');

    // For non-annual view, post-process filteredKpiAnalytics to exclude 0/NA/N/A from vendor count fields
    const postProcessedAnalytics = (() => {
      if (vendorMisQ4Analytics) return vendorMisQ4Analytics;
      const totalCompanies = featureCompanyRawData.length;
      return filteredKpiAnalytics.map(({ kpi, fieldAnalytics }) => {
        if (kpi.id !== 'vendor_mis') return { kpi, fieldAnalytics };
        const rebuiltFields = fieldAnalytics.map((fa: any) => {
          if (!fa.field.id.endsWith('_num_vendors')) return fa;
          const filtered = fa.perCompany.filter((c: any) => {
            const trimmed = String(c.value).trim().toLowerCase();
            return trimmed !== '0' && trimmed !== 'na' && trimmed !== 'n/a';
          });
          (filtered as any)._sourceKpiKey = (fa.perCompany as any)?._sourceKpiKey;
          const summary = computeSummary(filtered.map((c: any) => c.numValue), fa.isPct);
          const primaryValue = fa.isPct ? summary.avg : summary.total;
          return { ...fa, perCompany: filtered, n: filtered.length, total: summary.total, avg: summary.avg, primaryValue, notConsidered: totalCompanies - filtered.length };
        });
        return { kpi, fieldAnalytics: rebuiltFields };
      });
    })();

    return (
      <div className="space-y-4">
        {insightMetrics.length > 0 && (
          <InsightSection insightMetrics={insightMetrics} currentInsights={currentInsights} companyRawData={featureCompanyRawData} handleCardClick={handleCardClick} quarterlyPerQuarterRawData={featureQuarterlyPerQuarterRawData} featureKey={featureKey} filters={filters} allCompanyRawData={featureAllCompanyRawData} />
        )}

        {/* Default KPI breakdown — excludes Suppliers/Vendors (#1) and uses Q4 for Vendor MIS (#2) */}
        <DefaultKPIRenderer kpiAnalytics={postProcessedAnalytics} showGraphs={showGraphs} handleCardClick={handleCardClick} mapping={mapping} />

        <TextResponsesSection featureKey={featureKey} companyRawData={companyRawData} onDrillDown={handleCardClick} />
      </div>
    );
  }

  // ─── Incidents & Grievances ───
  if (featureKey === 'incidentLog') {
    // Compute high impact cases properly: count cases where any incident type has 'high' impact
    const computeHighImpact = (c: CompanyRawMetrics) => {
      const INCIDENT_TYPES = ['posh', 'supplier_vendor', 'customer_grievance', 'employee_grievance', 'environmental', 'health_safety', 'security_data_privacy', 'negative_media', 'anti_bribery_corruption', 'other_regulatory'];
      let total = 0;
      INCIDENT_TYPES.forEach(type => {
        const cases = parseFloat(c.kpis[`incident_${type}_cases`] || '0') || 0;
        const impact = (c.kpis[`incident_${type}_impact`] || '').toLowerCase().trim();
        if (impact.includes('high')) total += cases;
      });
      return total;
    };
    // Use feature-scoped data for correct "Not Considered" tracking
    const incidentData = featureCompanyRawData;
    const totalHighImpact = incidentData.reduce((s, c) => s + computeHighImpact(c), 0);
    // Companies that have filled at least one incident KPI
    const incidentFilledFilter = (c: CompanyRawMetrics) => Object.keys(c.kpis).some(k => k.startsWith('incident_') && k.endsWith('_cases') && c.kpis[k]?.trim() !== '');
    const filledCompanies = incidentData.filter(incidentFilledFilter);
    const notConsideredCount = incidentData.length - filledCompanies.length;

    // Build drill-down data including only companies that filled incident KPIs
    const buildIncidentDrill = (valueFn: (c: CompanyRawMetrics) => number, calcId: string) => {
      return enrichCalcWithQuarterly(
        filledCompanies.map(c => ({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: String(valueFn(c)) })),
        valueFn,
        calcId
      );
    };

    return (
      <div className="space-y-4">
        {insightMetrics.length > 0 && (
          <InsightSection insightMetrics={insightMetrics} currentInsights={currentInsights} companyRawData={featureCompanyRawData} handleCardClick={handleCardClick} quarterlyPerQuarterRawData={featureQuarterlyPerQuarterRawData} featureKey={featureKey} filters={filters} allCompanyRawData={featureAllCompanyRawData} />
        )}
        <section>
          <SectionHeader title="Summary" n={incidentData.length} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Total Cases" value={currentAggregation.totalIncidents}
              subtitle={`n=${filledCompanies.filter(c => c.aggregation.totalIncidents > 0).length}${notConsideredCount > 0 ? ` · ${notConsideredCount} not filled` : ''}`}
              onClick={() => handleCardClick('Total Cases', buildIncidentDrill(c => c.aggregation.totalIncidents, 'agg:totalIncidents'))} />
            <MetricCard label="High Impact Cases" value={totalHighImpact}
              subtitle={`n=${filledCompanies.filter(c => computeHighImpact(c) > 0).length}${notConsideredCount > 0 ? ` · ${notConsideredCount} not filled` : ''}`}
              onClick={() => handleCardClick('High Impact Cases', buildIncidentDrill(computeHighImpact, 'calc:highImpactIncidents'))} />
            <MetricCard label="Open/Unresolved Cases" value={currentAggregation.totalOpenCases}
              subtitle={notConsideredCount > 0 ? `${notConsideredCount} not filled` : undefined}
              onClick={() => handleCardClick('Open/Unresolved Cases', buildIncidentDrill(c => c.aggregation.totalOpenCases, 'agg:totalOpenCases'))} />
            <MetricCard label="PoSH Cases" value={currentAggregation.poshCases}
              subtitle={notConsideredCount > 0 ? `${notConsideredCount} not filled` : undefined}
              onClick={() => handleCardClick('PoSH Cases', buildIncidentDrill(c => c.aggregation.poshCases, 'agg:poshCases'))} />
          </div>
        </section>
        <TextResponsesSection featureKey={featureKey} companyRawData={incidentData} onDrillDown={handleCardClick} />
      </div>
    );
  }

  // ─── Awards & Recognitions ───
  if (featureKey === 'productServiceCertifications') {
    const awardsDrillDown: { brand: string; companyName: string; industry: string; value: string; col1?: string; col2?: string }[] = [];
    const mediaDrillDown: { brand: string; companyName: string; industry: string; value: string; col1?: string; col2?: string }[] = [];
    let awardsCount = 0;
    let mediaCount = 0;
    companyRawData.forEach(c => {
      const awardsRaw = c.kpis['founder_awards_list'] || c.kpis['awards_founder_awards_list'] || '';
      let aCount = 0;
      let awardTitlesStr = '';
      let awardDescsStr = '';
      try {
        const p = JSON.parse(awardsRaw);
        if (Array.isArray(p)) {
          const valid = p.filter((a: any) => a.title?.trim());
          aCount = valid.length;
          if (aCount > 0) {
            awardTitlesStr = valid.map((a: any, i: number) => `${i + 1}. ${a.title?.trim() || ''}`).join(' | ');
            awardDescsStr = valid.map((a: any, i: number) => `${i + 1}. ${a.description?.trim() || '—'}`).join(' | ');
          }
        }
      } catch {
        if (awardsRaw.trim()) { aCount = 1; awardTitlesStr = awardsRaw.trim(); awardDescsStr = '—'; }
      }
      if (aCount > 0) {
        awardsCount += aCount;
        awardsDrillDown.push({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: String(aCount), col1: awardTitlesStr, col2: awardDescsStr });
      }

      const mediaRaw = c.kpis['media_mentions_list'] || c.kpis['media_mentions_media_mentions_list'] || '';
      let mCount = 0;
      let mediaTitlesStr = '';
      let mediaLinksStr = '';
      try {
        const p = JSON.parse(mediaRaw);
        if (Array.isArray(p)) {
          const valid = p.filter((a: any) => a.title?.trim() || a.source?.trim() || a.link?.trim());
          mCount = valid.length;
          if (mCount > 0) {
            mediaTitlesStr = valid.map((m: any, i: number) => `${i + 1}. ${m.title?.trim() || m.source?.trim() || '—'}`).join(' | ');
            mediaLinksStr = valid.map((m: any, i: number) => `${i + 1}. ${m.link?.trim() || '—'}`).join(' | ');
          }
        }
      } catch {
        if (mediaRaw.trim()) { mCount = 1; mediaTitlesStr = mediaRaw.trim(); mediaLinksStr = '—'; }
      }
      if (mCount > 0) {
        mediaCount += mCount;
        mediaDrillDown.push({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: String(mCount), col1: mediaTitlesStr, col2: mediaLinksStr });
      }
    });
    return (
      <div className="space-y-4">
        <SectionHeader title="Awards & Recognitions" n={companyRawData.length} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Total Awards" value={awardsCount} onClick={() => handleCardClick('Total Awards', awardsDrillDown)} />
          <MetricCard label="Total Media Mentions" value={mediaCount} onClick={() => handleCardClick('Total Media Mentions', mediaDrillDown)} />
        </div>
        <TextResponsesSection featureKey={featureKey} companyRawData={companyRawData} onDrillDown={handleCardClick} />
      </div>
    );
  }

  // ─── Governance Policies ───
  if (featureKey === 'governancePolicies') {
    return (
      <div className="space-y-4">
        {insightMetrics.length > 0 && (
          <InsightSection insightMetrics={insightMetrics} currentInsights={currentInsights} companyRawData={featureCompanyRawData} handleCardClick={handleCardClick} quarterlyPerQuarterRawData={featureQuarterlyPerQuarterRawData} featureKey={featureKey} filters={filters} allCompanyRawData={featureAllCompanyRawData} />
        )}
        <SectionHeader title="Governance Policies" n={companyRawData.length} icon={ShieldCheck} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {POLICIES_LIST.map(policy => {
            const inPlaceCount = companyRawData.filter(c => isYes(c.kpis[`policy_${policy.key}_in_place`])).length;
            const trainingCount = companyRawData.filter(c => isYes(c.kpis[`policy_${policy.key}_training`])).length;
            return (
              <Card key={policy.key} className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleCardClick(policy.label, companyRawData.map(c => ({
                  brand: c.brand, companyName: c.companyName, industry: c.industry,
                  value: `In Place: ${isYes(c.kpis[`policy_${policy.key}_in_place`]) ? 'Yes' : 'No'}, Training: ${isYes(c.kpis[`policy_${policy.key}_training`]) ? 'Yes' : 'No'}`,
                })))}>
                <CardContent className="pt-3 pb-2">
                  <p className="text-xs font-medium mb-2">{policy.label}</p>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground">In Place</p>
                      <p className="text-lg font-bold">{inPlaceCount}<span className="text-xs text-muted-foreground font-normal">/{companyRawData.length}</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Employee Training</p>
                      <p className="text-lg font-bold">{trainingCount}<span className="text-xs text-muted-foreground font-normal">/{companyRawData.length}</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <TextResponsesSection featureKey={featureKey} companyRawData={companyRawData} onDrillDown={handleCardClick} />
      </div>
    );
  }

  // ─── Operations ───
  if (featureKey === 'operations') {
    // MSME classification counts
    const microSmallCount = companyRawData.filter(c => {
      const val = (c.kpis['operations_msme_classification'] || '').toLowerCase();
      return val.includes('micro') || val.includes('small');
    }).length;
    const mediumCount = companyRawData.filter(c => {
      const val = (c.kpis['operations_msme_classification'] || '').toLowerCase();
      return val.includes('medium');
    }).length;

    const microSmallDrillDown = companyRawData.filter(c => {
      const val = (c.kpis['operations_msme_classification'] || '').toLowerCase();
      return val.includes('micro') || val.includes('small');
    }).map(c => ({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: c.kpis['operations_msme_classification'] || 'Micro/Small' }));

    const mediumDrillDown = companyRawData.filter(c => {
      const val = (c.kpis['operations_msme_classification'] || '').toLowerCase();
      return val.includes('medium');
    }).map(c => ({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: c.kpis['operations_msme_classification'] || 'Medium' }));

    return (
      <div className="space-y-4">
        <section className="space-y-3">
          <SectionHeader title="Operations" n={companyRawData.length} />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {/* MSME Classification cards */}
            <MetricCard label="1. Micro/Small" value={microSmallCount} onClick={() => handleCardClick('Number of Micro/Small', microSmallDrillDown)} />
            <MetricCard label="1. Medium" value={mediumCount} onClick={() => handleCardClick('Number of Medium', mediumDrillDown)} />
            {/* Remaining Operations KPIs inline */}
            {kpiAnalytics.flatMap(({ kpi, fieldAnalytics }) => {
              const numericFields = fieldAnalytics.filter((fa: any) => fa.isNumeric && fa.n > 0);
              if (numericFields.length === 0) return [];
              const fmtIntOps = (v: number) => Math.round(v).toLocaleString();
              return numericFields.map(({ field, perCompany, n, primaryValue, isPct }: any) => (
                <Card
                  key={field.id}
                  className="hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => handleCardClick(`${kpi.label} — ${field.label}`, perCompany, isPct)}
                >
                  <CardContent className="pt-3 pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] text-muted-foreground leading-tight flex-1">{kpi.number}. {kpi.label}</p>
                      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0" />
                    </div>
                    <p className="text-lg font-bold">{fmtIntOps(primaryValue)}</p>
                    <p className="text-[10px] text-muted-foreground">{isPct ? 'Avg' : 'Total'} · n={n}</p>
                  </CardContent>
                </Card>
              ));
            })}
          </div>
        </section>
        <TextResponsesSection featureKey={featureKey} companyRawData={companyRawData} onDrillDown={handleCardClick} />
      </div>
    );
  }

  // ─── Certifications ───
  if (featureKey === 'certifications') {
    const CERT_CATEGORIES = [
      { key: 'ingredient', label: 'Ingredient Certifications' },
      { key: 'packaging', label: 'Packaging Certifications' },
      { key: 'energy', label: 'Energy Certifications' },
      { key: 'production', label: 'Production Certifications' },
      { key: 'quality', label: 'Quality Certifications' },
      { key: 'company_standards', label: 'Company Standards' },
    ];
    const parseNum = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };

    return (
      <div className="space-y-4">
        <SectionHeader title="Product/Service Certifications" n={companyRawData.length} icon={ShieldCheck} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {CERT_CATEGORIES.map(cat => {
            const selfTotal = companyRawData.reduce((s, c) => s + parseNum(c.kpis[`cert_${cat.key}_self_number`]), 0);
            const supplierTotal = companyRawData.reduce((s, c) => s + parseNum(c.kpis[`cert_${cat.key}_supplier_number`]), 0);
            // Build drill-down data with cert names next to company
            const drillDown = companyRawData.map(c => {
              const selfNames = c.kpis[`cert_${cat.key}_self_names`] || '';
              const supplierNames = c.kpis[`cert_${cat.key}_supplier_names`] || '';
              const selfNum = parseNum(c.kpis[`cert_${cat.key}_self_number`]);
              const supplierNum = parseNum(c.kpis[`cert_${cat.key}_supplier_number`]);
              const parts: string[] = [];
              if (selfNum > 0) parts.push(`Self(${selfNum}): ${selfNames || 'N/A'}`);
              if (supplierNum > 0) parts.push(`Supplier(${supplierNum}): ${supplierNames || 'N/A'}`);
              return { brand: c.brand, companyName: c.companyName, industry: c.industry, value: parts.join(' | ') || '—' };
            }).filter(c => c.value !== '—');

            return (
              <Card key={cat.key} className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleCardClick(cat.label, drillDown)}>
                <CardContent className="pt-3 pb-2">
                  <p className="text-xs font-medium mb-2">{cat.label}</p>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Self</p>
                      <p className="text-lg font-bold">{selfTotal}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Supplier</p>
                      <p className="text-lg font-bold">{supplierTotal}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Patents/IPs Section */}
        {(() => {
          const totalGranted = companyRawData.reduce((s, c) => s + parseNum(c.kpis['patents_granted']), 0);
          const totalFiled = companyRawData.reduce((s, c) => s + parseNum(c.kpis['patents_filed']), 0);
          const patentDrillDown = companyRawData.map(c => {
            const granted = parseNum(c.kpis['patents_granted']);
            const filed = parseNum(c.kpis['patents_filed']);
            if (granted === 0 && filed === 0) return null;
            const parts: string[] = [];
            if (granted > 0) parts.push(`Granted: ${granted}`);
            if (filed > 0) parts.push(`Filed: ${filed}`);
            return { brand: c.brand, companyName: c.companyName, industry: c.industry, value: parts.join(' | ') };
          }).filter(Boolean) as { brand: string; companyName: string; industry: string; value: string }[];

          return (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">No. of Patents / IPs</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <Card className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleCardClick('Patents/IPs - Granted', companyRawData.filter(c => parseNum(c.kpis['patents_granted']) > 0).map(c => ({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: String(parseNum(c.kpis['patents_granted'])) })))}>
                  <CardContent className="pt-3 pb-2">
                    <p className="text-[10px] text-muted-foreground">Granted</p>
                    <p className="text-lg font-bold">{totalGranted}</p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleCardClick('Patents/IPs - Filed', companyRawData.filter(c => parseNum(c.kpis['patents_filed']) > 0).map(c => ({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: String(parseNum(c.kpis['patents_filed'])) })))}>
                  <CardContent className="pt-3 pb-2">
                    <p className="text-[10px] text-muted-foreground">Filed</p>
                    <p className="text-lg font-bold">{totalFiled}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })()}
        <TextResponsesSection featureKey={featureKey} companyRawData={companyRawData} onDrillDown={handleCardClick} />
      </div>
    );
  }

  // ─── Water & Energy Management ───
  if (featureKey === 'waterManagement') {
    const WATER_FACILITIES = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'dark_stores', 'distribution'];
    const parseNum = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };

    // Build per-company drill-down data for water metrics
    const waterConsumedDrill: { brand: string; companyName: string; industry: string; value: string }[] = [];
    const freshWaterDrill: { brand: string; companyName: string; industry: string; value: string }[] = [];
    const wastewaterGenDrill: { brand: string; companyName: string; industry: string; value: string }[] = [];
    const wastewaterRecycledDrill: { brand: string; companyName: string; industry: string; value: string }[] = [];
    const energyConsumedDrill: { brand: string; companyName: string; industry: string; value: string; ratioColumns?: Record<string, string> }[] = [];
    const renewableEnergyDrill: { brand: string; companyName: string; industry: string; value: string; ratioColumns?: Record<string, string> }[] = [];

    let totalFreshWaterPctSum = 0;
    let freshWaterFacilityCount = 0;
    let totalWastewaterGeneration = 0;

    featureCompanyRawData.forEach(c => {
      let companyWater = 0;
      let companyWastewater = 0;
      let companyFreshPctSum = 0;
      let companyFreshCount = 0;
      WATER_FACILITIES.forEach(f => {
        const consumed = parseNum(c.kpis[`water_detailed_${f}_water_consumed`]);
        companyWater += consumed;
        const freshPct = parseNum(c.kpis[`water_detailed_${f}_fresh_water_pct`]);
        if (consumed > 0 && freshPct > 0) {
          totalFreshWaterPctSum += freshPct;
          freshWaterFacilityCount++;
          companyFreshPctSum += freshPct;
          companyFreshCount++;
        }
        const ww = parseNum(c.kpis[`water_detailed_${f}_wastewater_generated`]);
        companyWastewater += ww;
        if (ww > 0) totalWastewaterGeneration += ww;
      });
      if (companyWater > 0) waterConsumedDrill.push({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: String(r2(companyWater)) });
      if (companyFreshCount > 0) freshWaterDrill.push({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: String(r2(companyFreshPctSum / companyFreshCount)) });
      if (companyWastewater > 0) wastewaterGenDrill.push({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: String(r2(companyWastewater)) });

      // Wastewater recycled % - check for any facility with recycled pct
      const recycledPcts = WATER_FACILITIES.map(f => parseNum(c.kpis[`water_detailed_${f}_wastewater_recycled_pct`])).filter(v => v > 0);
      if (recycledPcts.length > 0) {
        const avg = recycledPcts.reduce((a, b) => a + b, 0) / recycledPcts.length;
        wastewaterRecycledDrill.push({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: String(r2(avg)) });
      }

      // Energy: sum across facilities
      const ENERGY_FACILITIES = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'data_center', 'retail', 'distribution'];
      const ENERGY_FACILITY_LABELS: Record<string, string> = { office: 'Office', stores_coco: 'Stores (CoCo)', warehouses: 'Warehouses', manufacturing: 'Manufacturing', data_center: 'Data Center', retail: 'Retail Outlets', distribution: 'Distribution' };
      let companyEnergy = 0;
      let companyRenewSum = 0;
      let companyRenewCount = 0;
      const energyFacilityValues: Record<string, string> = {};
      const renewFacilityValues: Record<string, string> = {};
      ENERGY_FACILITIES.forEach(f => {
        const consumed = parseNum(c.kpis[`energy_detailed_${f}_energy_consumed`]);
        companyEnergy += consumed;
        const label = ENERGY_FACILITY_LABELS[f] || f;
        energyFacilityValues[`${label} Energy (kWh)`] = String(r2(consumed));
        const renew = parseNum(c.kpis[`energy_detailed_${f}_renewable_pct`]);
        energyFacilityValues[`${label} Renewable (%)`] = String(r2(renew));
        if (consumed > 0 && renew > 0) { companyRenewSum += renew; companyRenewCount++; }
        renewFacilityValues[`${label} Renewable (%)`] = String(r2(renew));
        renewFacilityValues[`${label} Energy (kWh)`] = String(r2(consumed));
      });
      if (companyEnergy > 0) energyConsumedDrill.push({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: String(r2(companyEnergy)), ratioColumns: energyFacilityValues });
      if (companyRenewCount > 0) renewableEnergyDrill.push({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: String(r2(companyRenewSum / companyRenewCount)), ratioColumns: renewFacilityValues });
    });

    const avgFreshWaterPct = freshWaterDrill.length > 0 ? r2(freshWaterDrill.reduce((s, d) => s + parseFloat(d.value), 0) / freshWaterDrill.length) : 0;

    // Calc functions for quarterly enrichment
    const calcWaterConsumed = (c: CompanyRawMetrics) => {
      let total = 0;
      WATER_FACILITIES.forEach(f => { total += parseNum(c.kpis[`water_detailed_${f}_water_consumed`]); });
      return total;
    };
    const calcFreshWater = (c: CompanyRawMetrics) => {
      let sum = 0, count = 0;
      WATER_FACILITIES.forEach(f => {
        const consumed = parseNum(c.kpis[`water_detailed_${f}_water_consumed`]);
        const pct = parseNum(c.kpis[`water_detailed_${f}_fresh_water_pct`]);
        if (consumed > 0 && pct > 0) { sum += pct; count++; }
      });
      return count > 0 ? r2(sum / count) : 0;
    };
    const calcWastewaterGen = (c: CompanyRawMetrics) => {
      let total = 0;
      WATER_FACILITIES.forEach(f => { total += parseNum(c.kpis[`water_detailed_${f}_wastewater_generated`]); });
      return total;
    };
    const calcWastewaterRecycled = (c: CompanyRawMetrics) => {
      const pcts = WATER_FACILITIES.map(f => parseNum(c.kpis[`water_detailed_${f}_wastewater_recycled_pct`])).filter(v => v > 0);
      return pcts.length > 0 ? r2(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
    };
    const ENERGY_FACILITIES_LIST = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'data_center', 'retail', 'distribution'];
    const calcEnergyConsumed = (c: CompanyRawMetrics) => {
      let total = 0;
      ENERGY_FACILITIES_LIST.forEach(f => { total += parseNum(c.kpis[`energy_detailed_${f}_energy_consumed`]); });
      return total;
    };
    const calcRenewableEnergy = (c: CompanyRawMetrics) => {
      let sum = 0, count = 0;
      ENERGY_FACILITIES_LIST.forEach(f => {
        const consumed = parseNum(c.kpis[`energy_detailed_${f}_energy_consumed`]);
        const renew = parseNum(c.kpis[`energy_detailed_${f}_renewable_pct`]);
        if (consumed > 0 && renew > 0) { sum += renew; count++; }
      });
      return count > 0 ? r2(sum / count) : 0;
    };

    const enrichedWaterConsumedDrill = enrichCalcWithQuarterly(waterConsumedDrill, calcWaterConsumed, 'calc:waterConsumed');
    const enrichedFreshWaterDrill = enrichCalcWithQuarterly(freshWaterDrill, calcFreshWater, 'calc:freshWater');
    const enrichedWastewaterGenDrill = enrichCalcWithQuarterly(wastewaterGenDrill, calcWastewaterGen, 'calc:wastewaterGen');
    const enrichedWastewaterRecycledDrill = enrichCalcWithQuarterly(wastewaterRecycledDrill, calcWastewaterRecycled, 'calc:wastewaterRecycled');
    const enrichedEnergyConsumedDrill = enrichCalcWithQuarterly(energyConsumedDrill, calcEnergyConsumed, 'calc:energyConsumed');
    const enrichedRenewableEnergyDrill = enrichCalcWithQuarterly(renewableEnergyDrill, calcRenewableEnergy, 'calc:renewableEnergy');

    return (
      <div className="space-y-4">
        {insightMetrics.length > 0 && (
          <InsightSection insightMetrics={insightMetrics} currentInsights={currentInsights} companyRawData={featureCompanyRawData} handleCardClick={handleCardClick} quarterlyPerQuarterRawData={featureQuarterlyPerQuarterRawData} featureKey={featureKey} filters={filters} allCompanyRawData={featureAllCompanyRawData} />
        )}
        {/* Water Management Summary */}
        <section>
          <SectionHeader title="Water Management" n={waterConsumedDrill.length} icon={Droplets} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Total Water Consumed (thousand m³)" value={fmt(waterConsumedDrill.reduce((s, d) => s + parseFloat(d.value), 0))} onClick={() => handleCardClick('Total Water Consumed (thousand m³)', enrichedWaterConsumedDrill)} />
            <MetricCard label="Avg. Fresh Water Consumed (%)" value={fmt(avgFreshWaterPct, '%')} onClick={() => handleCardClick('Avg. Fresh Water Consumed (%)', enrichedFreshWaterDrill)} />
            <MetricCard label="Total Wastewater Generation (thousand m³)" value={fmt(totalWastewaterGeneration)} onClick={() => handleCardClick('Total Wastewater Generation (thousand m³)', enrichedWastewaterGenDrill)} />
            <MetricCard label="Avg. Wastewater Recycled (%)" value={fmt(wastewaterRecycledDrill.length > 0 ? r2(wastewaterRecycledDrill.reduce((s, d) => s + parseFloat(d.value), 0) / wastewaterRecycledDrill.length) : 0, '%')} onClick={() => handleCardClick('Avg. Wastewater Recycled (%)', enrichedWastewaterRecycledDrill)} />
          </div>
        </section>

        {/* Energy Management Summary */}
        <section>
          <SectionHeader title="Energy Management" n={energyConsumedDrill.length} icon={Zap} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Total Energy Consumed (kWh)" value={fmt(energyConsumedDrill.reduce((s, d) => s + parseFloat(d.value), 0))} onClick={() => {
              const facilityLabels = ['Office', 'Stores (CoCo)', 'Warehouses', 'Manufacturing', 'Data Center', 'Retail Outlets', 'Distribution'];
              const headers = facilityLabels.flatMap(l => [`${l} Energy (kWh)`, `${l} Renewable (%)`]);
              handleCardClick('Total Energy Consumed (kWh)', enrichedEnergyConsumedDrill, false, { ratioColumnHeaders: headers });
            }} />
            <MetricCard label="Avg. Renewable Energy (%)" value={fmt(renewableEnergyDrill.length > 0 ? r2(renewableEnergyDrill.reduce((s, d) => s + parseFloat(d.value), 0) / renewableEnergyDrill.length) : 0, '%')} onClick={() => {
              const facilityLabels = ['Office', 'Stores (CoCo)', 'Warehouses', 'Manufacturing', 'Data Center', 'Retail Outlets', 'Distribution'];
              const headers = facilityLabels.flatMap(l => [`${l} Renewable (%)`, `${l} Energy (kWh)`]);
              handleCardClick('Avg. Renewable Energy (%)', enrichedRenewableEnergyDrill, true, { ratioColumnHeaders: headers });
            }} />
          </div>
        </section>

        <TextResponsesSection featureKey={featureKey} companyRawData={companyRawData} onDrillDown={handleCardClick} additionalCommentKeys={['energyManagement']} />
      </div>
    );
  }

  // ─── Waste Management ───
  if (featureKey === 'wasteManagement') {
    const parseNum = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
    const WASTE_FACILITIES = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'dark_stores', 'distribution'];
    const wasteGenDrill: { brand: string; companyName: string; industry: string; value: string }[] = [];
    const wasteRecycledDrill: { brand: string; companyName: string; industry: string; value: string }[] = [];
    featureCompanyRawData.forEach(c => {
      let companyWaste = 0;
      let companyRecycledSum = 0;
      let companyRecycledCount = 0;
      WASTE_FACILITIES.forEach(f => {
        const gen = parseNum(c.kpis[`waste_detailed_${f}_waste_generated`]);
        companyWaste += gen;
        const rec = parseNum(c.kpis[`waste_detailed_${f}_waste_recycled_pct`]);
        if (gen > 0 && rec > 0) { companyRecycledSum += rec; companyRecycledCount++; }
      });
      if (companyWaste > 0) wasteGenDrill.push({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: String(r2(companyWaste)) });
      if (companyRecycledCount > 0) wasteRecycledDrill.push({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: String(r2(companyRecycledSum / companyRecycledCount)) });
    });

    const calcWasteGen = (c: CompanyRawMetrics) => {
      let total = 0;
      WASTE_FACILITIES.forEach(f => { total += parseNum(c.kpis[`waste_detailed_${f}_waste_generated`]); });
      return total;
    };
    const calcWasteRecycled = (c: CompanyRawMetrics) => {
      let sum = 0, count = 0;
      WASTE_FACILITIES.forEach(f => {
        const gen = parseNum(c.kpis[`waste_detailed_${f}_waste_generated`]);
        const rec = parseNum(c.kpis[`waste_detailed_${f}_waste_recycled_pct`]);
        if (gen > 0 && rec > 0) { sum += rec; count++; }
      });
      return count > 0 ? r2(sum / count) : 0;
    };

    const enrichedWasteGenDrill = enrichCalcWithQuarterly(wasteGenDrill, calcWasteGen, 'calc:wasteGen');
    const enrichedWasteRecycledDrill = enrichCalcWithQuarterly(wasteRecycledDrill, calcWasteRecycled, 'calc:wasteRecycled');

    return (
      <div className="space-y-4">
        {insightMetrics.length > 0 && (
          <InsightSection insightMetrics={insightMetrics} currentInsights={currentInsights} companyRawData={featureCompanyRawData} handleCardClick={handleCardClick} quarterlyPerQuarterRawData={featureQuarterlyPerQuarterRawData} featureKey={featureKey} filters={filters} allCompanyRawData={featureAllCompanyRawData} />
        )}
        <section>
          <SectionHeader title="Waste Management" n={wasteGenDrill.length} icon={Trash2} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Total Waste Generated (metric tonnes)" value={fmt(wasteGenDrill.reduce((s, d) => s + parseFloat(d.value), 0))} onClick={() => handleCardClick('Total Waste Generated (metric tonnes)', enrichedWasteGenDrill)} />
            <MetricCard label="Avg. Waste Recycled (%)" value={fmt(wasteRecycledDrill.length > 0 ? r2(wasteRecycledDrill.reduce((s, d) => s + parseFloat(d.value), 0) / wasteRecycledDrill.length) : 0, '%')} onClick={() => handleCardClick('Avg. Waste Recycled (%)', enrichedWasteRecycledDrill)} />
          </div>
        </section>

        <TextResponsesSection featureKey={featureKey} companyRawData={companyRawData} onDrillDown={handleCardClick} />
      </div>
    );
  }

  // ─── CSR ───
  if (featureKey === 'csr') {
    const parseNum = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
    const companiesWithCSR = companyRawData.filter(c => {
      const amount = parseNum(c.kpis['csr_amount_spent']);
      return amount > 0;
    });
    const totalCSRSpend = companiesWithCSR.reduce((sum, c) => {
      return sum + parseNum(c.kpis['csr_amount_spent']);
    }, 0);

    // Parse initiative JSON to extract description & impact per company
    const initiativeData = companyRawData.map(c => {
      const raw = c.kpis['csr_initiatives_list'] || c.kpis['csr_csr_initiatives_list'] || '';
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) return null;
        const parts = parsed.map((item: { description?: string; impact?: string }) => {
          const desc = item.description?.trim();
          const impact = item.impact?.trim();
          if (desc && impact) return `${desc} — Impact: ${impact}`;
          if (desc) return desc;
          if (impact) return `Impact: ${impact}`;
          return null;
        }).filter(Boolean);
        if (parts.length === 0) return null;
        return { brand: c.brand, companyName: c.companyName, industry: c.industry, value: parts.join('; ') };
      } catch {
        // Not JSON, treat as plain text
        return { brand: c.brand, companyName: c.companyName, industry: c.industry, value: raw };
      }
    }).filter(Boolean) as { brand: string; companyName: string; industry: string; value: string }[];

    // Amount drill-down: show each company's spend
    const amountData = enrichWithQuarterly(companiesWithCSR.map(c => ({
      brand: c.brand, companyName: c.companyName, industry: c.industry,
      value: String(r2(parseNum(c.kpis['csr_amount_spent']))),
    })), 'csr_amount_spent');

    return (
      <div className="space-y-4">
        {insightMetrics.length > 0 && (
          <InsightSection insightMetrics={insightMetrics} currentInsights={currentInsights} companyRawData={featureCompanyRawData} handleCardClick={handleCardClick} quarterlyPerQuarterRawData={featureQuarterlyPerQuarterRawData} featureKey={featureKey} filters={filters} allCompanyRawData={featureAllCompanyRawData} />
        )}
        <section>
          <SectionHeader title="CSR" n={companiesWithCSR.length} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Companies with CSR" value={companiesWithCSR.length} subtitle={`of ${featureCompanyRawData.length} total`}
              onClick={() => handleCardClick('CSR Initiatives', initiativeData)} />
            <MetricCard label="Amount Spent (₹)" value={fmt(totalCSRSpend)}
              onClick={() => handleCardClick('CSR Amount Spent (₹)', amountData)} />
          </div>
        </section>

        <TextResponsesSection featureKey={featureKey} companyRawData={companyRawData} onDrillDown={handleCardClick} />
      </div>
    );
  }

  // ─── Primary & Secondary Packaging ───
  if (featureKey === 'primarySecondaryPackaging') {
    // Use feature-filtered data consistently so stat cards match detail views
    console.log('primary and secondary :: featureCompanyRawData => ',featureCompanyRawData)
    const pkgData = featureCompanyRawData;
    const parseNum = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
    const k = (key: string) => pkgData.reduce((s, c) => s + parseNum(c.kpis[key]), 0);
    // Sum multiple keys together
    const kMulti = (...keys: string[]) => pkgData.reduce((s, c) => s + keys.reduce((ks, key) => ks + parseNum(c.kpis[key]), 0), 0);
    const companyVal = (key: string) => enrichWithQuarterly(pkgData
      .filter(c => c.kpis[key] !== undefined && c.kpis[key] !== null && c.kpis[key]?.trim() !== '')
      .map(c => ({
        brand: c.brand, companyName: c.companyName, industry: c.industry,
        value: String(parseNum(c.kpis[key])),
      })), key);
    // Combined company values from multiple keys (summed per company)
    // Enriches quarterly data by summing all keys per quarter (not just keys[0])
    const companyValMulti = (label: string, ...keys: string[]) => {
      const seen = new Set<string>();
      const results: { brand: string; companyName: string; industry: string; value: string;[k: string]: any }[] = [];
      pkgData.forEach(c => {
        const total = keys.reduce((s, key) => s + parseNum(c.kpis[key]), 0);
        if (total > 0 && !seen.has(c.companyName)) {
          seen.add(c.companyName);
          const row: any = { brand: c.brand, companyName: c.companyName, industry: c.industry, value: String(Math.round(total * 100) / 100) };
          // Add quarterly values by summing all keys per quarter
          if (featureQuarterlyPerQuarterRawData) {
            ['Q1','Q2','Q3', 'Q4'].forEach(q => {
              const qData = featureQuarterlyPerQuarterRawData[q] || [];
              const match = qData.find(qc => qc.brand === c.brand);
              if (match) {
                const qTotal = keys.reduce((s, key) => s + parseNum(match.kpis[key]), 0);
                row[q.toLowerCase()] = qTotal > 0 ? String(Math.round(qTotal * 100) / 100) : '';
              }
            });
          }
          results.push(row);
        }
      });
      // Do NOT tag with _sourceKpiKey — multi-key sums can't be reconstructed from a single key
      return results;
    };
    const avgPct = (key: string) => {
      const vals = pkgData.filter(c => c.kpis[key] !== undefined && c.kpis[key] !== null && c.kpis[key]?.trim() !== '').map(c => parseNum(c.kpis[key]));
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };
    const companyPctVal = (key: string) => enrichWithQuarterly(pkgData
      .filter(c => c.kpis[key] !== undefined && c.kpis[key] !== null && c.kpis[key]?.trim() !== '')
      .map(c => ({
        brand: c.brand, companyName: c.companyName, industry: c.industry,
        value: String(parseNum(c.kpis[key])),
      })), key);

    // 2. Total Packaging (totalMaterialUsed computed after primaryTotal & secTotal below)
    const totalMaterialRecycled = k('food_pkg_basic_total_total_material_recycled');

    // 4. Primary Packaging — combine with Fashion Primary (section 6) MT values
    // Mapping: fashion cardboard→paper_recycled, paper→paper_virgin, plastic_recyclable+non_recyclable→plastic_virgin, fabric+other→others
    const priPlasticVirgin = kMulti('food_pkg_basic_primary_breakup_primary_plastic_virgin', 'fashion_primary_pkg_plastic_recyclable_mt', 'fashion_primary_pkg_plastic_non_recyclable_mt');
    const priPlasticRecycled = k('food_pkg_basic_primary_breakup_primary_plastic_recycled');
    const priPaperVirgin = kMulti('food_pkg_basic_primary_breakup_primary_paper_virgin', 'fashion_primary_pkg_paper_mt');
    const priPaperRecycled = kMulti('food_pkg_basic_primary_breakup_primary_paper_recycled', 'fashion_primary_pkg_cardboard_mt');
    const priMetal = k('food_pkg_basic_primary_breakup_primary_metal');
    const priGlass = k('food_pkg_basic_primary_breakup_primary_glass');
    const priPlantBased = k('food_pkg_basic_primary_breakup_primary_plant_based');
    const priOthers = kMulti('food_pkg_basic_primary_breakup_primary_others', 'fashion_primary_pkg_fabric_mt', 'fashion_primary_pkg_other_mt');
    const primaryTotal = priPlasticVirgin + priPlasticRecycled + priPaperVirgin + priPaperRecycled + priMetal + priGlass + priPlantBased + priOthers;
    // Weighted average: Recyclable% × MT per company / total MT across companies
    // For Fashion companies, derive recyclable % from material breakup
    const priRecyclablePct = (() => {
      let weightedSum = 0, totalMT = 0;
      pkgData.forEach(c => {
        // Check direct food recyclable %
        let pct = parseNum(c.kpis['food_pkg_basic_primary_recyclability_primary_mono_materials']);
        let mt = parseNum(c.kpis['food_pkg_basic_primary_primary_total_material']);
        // Fashion fallback: derive from material breakup
        if (pct === 0 && mt === 0) {
          const fashPriKeys = ['cardboard', 'paper', 'plastic_recyclable', 'plastic_non_recyclable', 'fabric', 'other'];
          const fashPriTotal = fashPriKeys.reduce((s, k) => s + parseNum(c.kpis[`fashion_primary_pkg_${k}_mt`]), 0);
          if (fashPriTotal > 0) {
            const recyclable = parseNum(c.kpis['fashion_primary_pkg_plastic_recyclable_mt']) + parseNum(c.kpis['fashion_primary_pkg_cardboard_mt']) +
              parseNum(c.kpis['fashion_primary_pkg_paper_mt']) + parseNum(c.kpis['fashion_primary_pkg_fabric_mt']);
            pct = (recyclable / fashPriTotal) * 100;
            mt = fashPriTotal;
          }
        }
        if (mt > 0 && pct >= 0) {
          weightedSum += pct * mt;
          totalMT += mt;
        }
      });
      return totalMT > 0 ? weightedSum / totalMT : 0;
    })();
    const priNonRecyclablePct = priRecyclablePct > 0 ? 100 - priRecyclablePct : 0;

    // 5. Secondary Packaging — combine with Fashion Warehouse (section 5) + Fashion Secondary (section 8) MT values
    const secPlasticVirgin = kMulti('food_pkg_detailed_secondary_breakup_secondary_plastic_virgin', 'fashion_warehouse_pkg_plastic_recyclable_mt', 'fashion_warehouse_pkg_plastic_non_recyclable_mt', 'fashion_secondary_pkg_plastic_recyclable_mt', 'fashion_secondary_pkg_plastic_non_recyclable_mt');
    const secPlasticRecycled = k('food_pkg_detailed_secondary_breakup_secondary_plastic_recycled');
    const secPaperVirgin = kMulti('food_pkg_detailed_secondary_breakup_secondary_paper_virgin', 'fashion_warehouse_pkg_paper_mt', 'fashion_secondary_pkg_paper_mt');
    const secPaperRecycled = kMulti('food_pkg_detailed_secondary_breakup_secondary_paper_recycled', 'fashion_warehouse_pkg_cardboard_mt', 'fashion_secondary_pkg_cardboard_mt');
    const secMetal = k('food_pkg_detailed_secondary_breakup_secondary_metal');
    const secGlass = k('food_pkg_detailed_secondary_breakup_secondary_glass');
    const secPlantBased = k('food_pkg_detailed_secondary_breakup_secondary_plant_based');
    const secOthers = kMulti('food_pkg_detailed_secondary_breakup_secondary_others', 'fashion_warehouse_pkg_fabric_mt', 'fashion_warehouse_pkg_other_mt', 'fashion_secondary_pkg_fabric_mt', 'fashion_secondary_pkg_other_mt');
    const secTotal = secPlasticVirgin + secPlasticRecycled + secPaperVirgin + secPaperRecycled + secMetal + secGlass + secPlantBased + secOthers;
    const totalMaterialUsed = primaryTotal + secTotal;
    const secRecyclablePct = (() => {
      let weightedSum = 0, totalMT = 0;
      pkgData.forEach(c => {
        // Check direct food recyclable %
        let pct = parseNum(c.kpis['food_pkg_detailed_secondary_recyclability_secondary_mono_materials']);
        let mt = parseNum(c.kpis['food_pkg_detailed_secondary_secondary_total_material']);
        // Fashion fallback: derive from warehouse + secondary material breakup
        if (pct === 0 && mt === 0) {
          const matKeys = ['cardboard', 'paper', 'plastic_recyclable', 'plastic_non_recyclable', 'fabric', 'other'];
          let fashSecTotal = 0, fashSecRecyclable = 0;
          matKeys.forEach(k => {
            fashSecTotal += parseNum(c.kpis[`fashion_warehouse_pkg_${k}_mt`]) + parseNum(c.kpis[`fashion_secondary_pkg_${k}_mt`]);
          });
          if (fashSecTotal > 0) {
            ['plastic_recyclable', 'cardboard', 'paper', 'fabric'].forEach(k => {
              fashSecRecyclable += parseNum(c.kpis[`fashion_warehouse_pkg_${k}_mt`]) + parseNum(c.kpis[`fashion_secondary_pkg_${k}_mt`]);
            });
            pct = (fashSecRecyclable / fashSecTotal) * 100;
            mt = fashSecTotal;
          }
        }
        if (mt > 0 && pct >= 0) {
          weightedSum += pct * mt;
          totalMT += mt;
        }
      });
      return totalMT > 0 ? weightedSum / totalMT : 0;
    })();
    const secNonRecyclablePct = secRecyclablePct > 0 ? 100 - secRecyclablePct : 0;
    console.log('pkgData :: ',pkgData)
    return (
      <div className="space-y-4">
        {insightMetrics.length > 0 && (
          <InsightSection insightMetrics={insightMetrics} currentInsights={currentInsights} companyRawData={featureCompanyRawData} handleCardClick={handleCardClick} quarterlyPerQuarterRawData={featureQuarterlyPerQuarterRawData} featureKey={featureKey} filters={filters} allCompanyRawData={featureAllCompanyRawData} />
        )}

        {/* 2. Total Packaging */}
        <section>
          <SectionHeader title="2. Total Packaging" n={pkgData.length} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <MetricCard label="Total Material Used (MT)" value={fmt(totalMaterialUsed)} onClick={() => handleCardClick('Total Packaging Material Used (MT)', pkgData.map(c => {
              const p = (key: string) => parseNum(c.kpis[key]);
              const pri = p('food_pkg_basic_primary_breakup_primary_plastic_virgin') + p('fashion_primary_pkg_plastic_recyclable_mt') + p('fashion_primary_pkg_plastic_non_recyclable_mt')
                + p('food_pkg_basic_primary_breakup_primary_plastic_recycled') + p('fashion_primary_pkg_recycled_plastic_mt')
                + p('food_pkg_basic_primary_breakup_primary_paper_virgin') + p('fashion_primary_pkg_paper_cardboard_mt')
                + p('food_pkg_basic_primary_breakup_primary_paper_recycled') + p('fashion_primary_pkg_recycled_paper_mt')
                + p('food_pkg_basic_primary_breakup_primary_metal') + p('fashion_primary_pkg_metal_mt')
                + p('food_pkg_basic_primary_breakup_primary_glass') + p('fashion_primary_pkg_glass_mt')
                + p('food_pkg_basic_primary_breakup_primary_plant_based')
                + p('food_pkg_basic_primary_breakup_primary_others') + p('fashion_primary_pkg_fabric_mt') + p('fashion_primary_pkg_other_mt');
              const sec = p('food_pkg_detailed_secondary_breakup_secondary_plastic_virgin') + p('fashion_warehouse_pkg_plastic_recyclable_mt') + p('fashion_warehouse_pkg_plastic_non_recyclable_mt') + p('fashion_secondary_pkg_plastic_recyclable_mt') + p('fashion_secondary_pkg_plastic_non_recyclable_mt')
                + p('food_pkg_detailed_secondary_breakup_secondary_plastic_recycled') + p('fashion_warehouse_pkg_recycled_plastic_mt') + p('fashion_secondary_pkg_recycled_plastic_mt')
                + p('food_pkg_detailed_secondary_breakup_secondary_paper_virgin') + p('fashion_warehouse_pkg_cardboard_mt') + p('fashion_warehouse_pkg_paper_mt') + p('fashion_secondary_pkg_cardboard_mt') + p('fashion_secondary_pkg_paper_mt')
                + p('food_pkg_detailed_secondary_breakup_secondary_paper_recycled') + p('fashion_warehouse_pkg_recycled_paper_mt') + p('fashion_secondary_pkg_recycled_paper_mt')
                + p('food_pkg_detailed_secondary_breakup_secondary_metal') + p('fashion_warehouse_pkg_metal_mt') + p('fashion_secondary_pkg_metal_mt')
                + p('food_pkg_detailed_secondary_breakup_secondary_glass') + p('fashion_warehouse_pkg_glass_mt') + p('fashion_secondary_pkg_glass_mt')
                + p('food_pkg_detailed_secondary_breakup_secondary_plant_based')
                + p('food_pkg_detailed_secondary_breakup_secondary_others') + p('fashion_warehouse_pkg_fabric_mt') + p('fashion_warehouse_pkg_other_mt') + p('fashion_secondary_pkg_fabric_mt') + p('fashion_secondary_pkg_other_mt');
              return { brand: c.brand, companyName: c.companyName, industry: c.industry, value: String(r2(pri + sec)) };
            }).filter(c => parseFloat(c.value) > 0))} />
            <MetricCard label="Total Material Recycled (MT)" value={fmt(totalMaterialRecycled)} onClick={() => handleCardClick('Total Packaging Material Recycled (MT)', companyVal('food_pkg_basic_total_total_material_recycled'))} />
          </div>
        </section>

        {/* 3. Compliance Details */}
        <section>
          <SectionHeader title="3. Compliance Details" n={pkgData.length} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCard label="EPR Targets CPCB (MT)" value={fmt(k('food_pkg_basic_compliance_epr_targets_cpcb'))} onClick={() => handleCardClick('EPR Targets as Defined by CPCB (MT)', companyVal('food_pkg_basic_compliance_epr_targets_cpcb'))} />
            <MetricCard label="EPR Compliant Companies" value={(() => { return pkgData.filter(c => { const v = parseNum(c.kpis['food_pkg_basic_compliance_epr_compliance_pct']); return v > 0; }).length; })()} subtitle="companies" onClick={() => { const eprKey = 'food_pkg_basic_compliance_epr_compliance_pct'; const filtered = pkgData.filter(c => parseNum(c.kpis[eprKey]) > 0).map(c => { const row: any = { brand: c.brand, companyName: c.companyName, industry: c.industry, value: '0' }; if (featureQuarterlyPerQuarterRawData) { let qSum = 0;['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => { const qData = featureQuarterlyPerQuarterRawData[q] || []; const match = qData.find(qc => qc.brand === c.brand); const qVal = match ? parseNum(match.kpis[eprKey]) : 0; row[q.toLowerCase()] = String(qVal); qSum += qVal; }); row.value = String(r2(qSum)); } else { row.value = c.kpis[eprKey] || '0'; } return row; }); handleCardClick('EPR Compliant Companies', filtered); }} />
            <MetricCard label="Voluntary Plastic Initiative Companies" value={(() => { return pkgData.filter(c => { const v = parseNum(c.kpis['food_pkg_basic_compliance_voluntary_plastic_neutrality']); return v > 0; }).length; })()} subtitle="companies" onClick={() => { const vpKey = 'food_pkg_basic_compliance_voluntary_plastic_neutrality'; const filtered = pkgData.filter(c => parseNum(c.kpis[vpKey]) > 0).map(c => { const row: any = { brand: c.brand, companyName: c.companyName, industry: c.industry, value: '0' }; if (featureQuarterlyPerQuarterRawData) { let qSum = 0;['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => { const qData = featureQuarterlyPerQuarterRawData[q] || []; const match = qData.find(qc => qc.brand === c.brand); const qVal = match ? parseNum(match.kpis[vpKey]) : 0; row[q.toLowerCase()] = String(qVal); qSum += qVal; }); row.value = String(r2(qSum)); } else { row.value = c.kpis[vpKey] || '0'; } return row; }); handleCardClick('Voluntary Plastic Initiative Companies', filtered); }} />
            <MetricCard label="EPR Partner(s)" value={(() => { const isValidPartner = (v: string | undefined) => { const t = (v || '').trim().toLowerCase(); return t && t !== '0' && t !== 'na' && t !== 'n/a' && t !== '—'; }; return pkgData.filter(c => isValidPartner(c.kpis['food_pkg_basic_compliance_epr_partner_name'])).length; })()} subtitle="companies" onClick={() => { const isValidPartner = (v: string | undefined) => { const t = (v || '').trim().toLowerCase(); return t && t !== '0' && t !== 'na' && t !== 'n/a' && t !== '—'; }; handleCardClick('EPR/Plastic Neutrality Partner Names', pkgData.filter(c => isValidPartner(c.kpis['food_pkg_basic_compliance_epr_partner_name'])).map(c => ({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: c.kpis['food_pkg_basic_compliance_epr_partner_name'] || '—' }))); }} />
            <MetricCard label="Waste Expenditure (INR Cr)" value={fmt(k('food_pkg_basic_compliance_waste_expenditure'))} onClick={() => handleCardClick('Waste Initiative Expenditure (INR Cr)', companyVal('food_pkg_basic_compliance_waste_expenditure'))} />
          </div>
        </section>

        {/* 4. Primary Packaging (includes Fashion Primary Packaging) */}
        <section>
          <SectionHeader title="4. Primary Packaging" n={pkgData.length} />
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <MetricCard label="Total Primary Material (MT)" value={fmt(primaryTotal)} onClick={() => handleCardClick('Total Primary Packaging (MT)', pkgData.map(c => {
              const p = (key: string) => parseNum(c.kpis[key]);
              const total = p('food_pkg_basic_primary_breakup_primary_plastic_virgin') + p('fashion_primary_pkg_plastic_recyclable_mt') + p('fashion_primary_pkg_plastic_non_recyclable_mt')
                + p('food_pkg_basic_primary_breakup_primary_plastic_recycled')
                + p('food_pkg_basic_primary_breakup_primary_paper_virgin') + p('fashion_primary_pkg_paper_mt')
                + p('food_pkg_basic_primary_breakup_primary_paper_recycled') + p('fashion_primary_pkg_cardboard_mt')
                + p('food_pkg_basic_primary_breakup_primary_metal')
                + p('food_pkg_basic_primary_breakup_primary_glass')
                + p('food_pkg_basic_primary_breakup_primary_plant_based')
                + p('food_pkg_basic_primary_breakup_primary_others') + p('fashion_primary_pkg_fabric_mt') + p('fashion_primary_pkg_other_mt');
              return { brand: c.brand, companyName: c.companyName, industry: c.industry, value: String(r2(total)) };
            }))} />
            <MetricCard label="Plastic Virgin (MT) ysssss" value={fmt(priPlasticVirgin)} onClick={() => handleCardClick('Primary — Plastic Virgin (MT)', companyValMulti('Primary — Plastic Virgin (MT)', 'food_pkg_basic_primary_breakup_primary_plastic_virgin', 'fashion_primary_pkg_plastic_recyclable_mt', 'fashion_primary_pkg_plastic_non_recyclable_mt'))} />
            <MetricCard label="Plastic Recycled (MT) yssss" value={fmt(priPlasticRecycled)} onClick={() => handleCardClick('Primary — Plastic Recycled (MT)', companyVal('food_pkg_basic_primary_breakup_primary_plastic_recycled'))} />
            <MetricCard label="Paper Virgin (MT)" value={fmt(priPaperVirgin)} onClick={() => handleCardClick('Primary — Paper Virgin (MT)', companyValMulti('Primary — Paper Virgin (MT)', 'food_pkg_basic_primary_breakup_primary_paper_virgin', 'fashion_primary_pkg_paper_mt'))} />
            <MetricCard label="Paper Recycled (MT)" value={fmt(priPaperRecycled)} onClick={() => handleCardClick('Primary — Paper Recycled (MT)', companyValMulti('Primary — Paper Recycled (MT)', 'food_pkg_basic_primary_breakup_primary_paper_recycled', 'fashion_primary_pkg_cardboard_mt'))} />
            <MetricCard label="Metal (MT)" value={fmt(priMetal)} onClick={() => handleCardClick('Primary — Metal (MT)', companyVal('food_pkg_basic_primary_breakup_primary_metal'))} />
            <MetricCard label="Glass (MT)" value={fmt(priGlass)} onClick={() => handleCardClick('Primary — Glass (MT)', companyVal('food_pkg_basic_primary_breakup_primary_glass'))} />
            <MetricCard label="Plant-Based (MT)" value={fmt(priPlantBased)} onClick={() => handleCardClick('Primary — Plant-Based (MT)', companyVal('food_pkg_basic_primary_breakup_primary_plant_based'))} />
            <MetricCard label="Others (MT)" value={fmt(priOthers)} onClick={() => handleCardClick('Primary — Others (MT)', companyValMulti('Primary — Others (MT)', 'food_pkg_basic_primary_breakup_primary_others', 'fashion_primary_pkg_fabric_mt', 'fashion_primary_pkg_other_mt'))} />
            <MetricCard label="Recyclable Packaging (%)" value={fmt(priRecyclablePct, '%')} subtitle="Wt. Avg" onClick={() => handleCardClick('Primary — Recyclable Packaging (%)', pkgData.map(c => {
              let pct = parseNum(c.kpis['food_pkg_basic_primary_recyclability_primary_mono_materials']);
              let hasData = !!c.kpis['food_pkg_basic_primary_recyclability_primary_mono_materials']?.trim();
              if (!hasData) {
                const fashPriKeys = ['cardboard', 'paper', 'plastic_recyclable', 'plastic_non_recyclable', 'fabric', 'other'];
                const total = fashPriKeys.reduce((s, k) => s + parseNum(c.kpis[`fashion_primary_pkg_${k}_mt`]), 0);
                if (total > 0) {
                  const recyclable = parseNum(c.kpis['fashion_primary_pkg_plastic_recyclable_mt']) + parseNum(c.kpis['fashion_primary_pkg_cardboard_mt']) + parseNum(c.kpis['fashion_primary_pkg_paper_mt']) + parseNum(c.kpis['fashion_primary_pkg_fabric_mt']);
                  pct = (recyclable / total) * 100; hasData = true;
                }
              }
              return { brand: c.brand, companyName: c.companyName, industry: c.industry, value: hasData ? String(Math.round(pct * 100) / 100) : '' };
            }), true)} />
            <MetricCard label="Non-Recyclable Packaging (%)" value={fmt(priNonRecyclablePct, '%')} subtitle="Wt. Avg" onClick={() => handleCardClick('Primary — Non-Recyclable Packaging (%)', pkgData.map(c => {
              let recyclable = parseNum(c.kpis['food_pkg_basic_primary_recyclability_primary_mono_materials']);
              let hasData = !!c.kpis['food_pkg_basic_primary_recyclability_primary_mono_materials']?.trim();
              if (!hasData) {
                const fashPriKeys = ['cardboard', 'paper', 'plastic_recyclable', 'plastic_non_recyclable', 'fabric', 'other'];
                const total = fashPriKeys.reduce((s, k) => s + parseNum(c.kpis[`fashion_primary_pkg_${k}_mt`]), 0);
                if (total > 0) {
                  const rec = parseNum(c.kpis['fashion_primary_pkg_plastic_recyclable_mt']) + parseNum(c.kpis['fashion_primary_pkg_cardboard_mt']) + parseNum(c.kpis['fashion_primary_pkg_paper_mt']) + parseNum(c.kpis['fashion_primary_pkg_fabric_mt']);
                  recyclable = (rec / total) * 100; hasData = true;
                }
              }
              return { brand: c.brand, companyName: c.companyName, industry: c.industry, value: hasData ? String(Math.round((100 - recyclable) * 100) / 100) : '' };
            }), true)} />
          </div>
          {/* Primary Packaging — Stacked Bar Chart (MT) */}
          {(() => {
            const priBarData = pkgData.map(c => {
              const p2 = (k2: string) => parseNum(c.kpis[k2]);
              const plasticVirgin = p2('food_pkg_basic_primary_breakup_primary_plastic_virgin') + p2('fashion_primary_pkg_plastic_recyclable_mt') + p2('fashion_primary_pkg_plastic_non_recyclable_mt');
              const plasticRecycled = p2('food_pkg_basic_primary_breakup_primary_plastic_recycled');
              const paperVirgin = p2('food_pkg_basic_primary_breakup_primary_paper_virgin') + p2('fashion_primary_pkg_paper_mt');
              const paperRecycled = p2('food_pkg_basic_primary_breakup_primary_paper_recycled') + p2('fashion_primary_pkg_cardboard_mt');
              const metal = p2('food_pkg_basic_primary_breakup_primary_metal');
              const glass = p2('food_pkg_basic_primary_breakup_primary_glass');
              const plantBased = p2('food_pkg_basic_primary_breakup_primary_plant_based');
              const others = p2('food_pkg_basic_primary_breakup_primary_others') + p2('fashion_primary_pkg_fabric_mt') + p2('fashion_primary_pkg_other_mt');
              const total = plasticVirgin + plasticRecycled + paperVirgin + paperRecycled + metal + glass + plantBased + others;
              if (total <= 0) return null;
              return { brand: c.brand, 'Plastic Virgin': r2(plasticVirgin), 'Plastic Recycled': r2(plasticRecycled), 'Paper Virgin': r2(paperVirgin), 'Paper Recycled': r2(paperRecycled), 'Metal': r2(metal), 'Glass': r2(glass), 'Plant-Based': r2(plantBased), 'Others': r2(others), total: r2(total) };
            }).filter(Boolean).sort((a: any, b: any) => b.total - a.total).slice(0, 15);
            if (priBarData.length === 0) return null;
            return (
              <Card className="mt-3">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Primary Packaging — Material Breakdown (MT)</CardTitle>
                    <Badge variant="secondary" className="text-[10px]">n={priBarData.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={Math.max(200, priBarData.length * 32)}>
                    <BarChart data={priBarData} layout="vertical" margin={{ left: 100, right: 10 }} barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis type="category" dataKey="brand" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} width={90} interval={0} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [`${r2(v)} MT`, name]} />
                      <Legend verticalAlign="top" height={36} formatter={(value) => <span className="text-[10px]">{value}</span>} />
                      <Bar dataKey="Plastic Virgin" stackId="a" fill="hsl(0, 72%, 51%)" />
                      <Bar dataKey="Plastic Recycled" stackId="a" fill="hsl(160, 84%, 39%)" />
                      <Bar dataKey="Paper Virgin" stackId="a" fill="hsl(38, 92%, 50%)" />
                      <Bar dataKey="Paper Recycled" stackId="a" fill="hsl(45, 85%, 65%)" />
                      <Bar dataKey="Metal" stackId="a" fill="hsl(217, 91%, 60%)" />
                      <Bar dataKey="Glass" stackId="a" fill="hsl(280, 65%, 60%)" />
                      <Bar dataKey="Plant-Based" stackId="a" fill="hsl(120, 50%, 50%)" />
                      <Bar dataKey="Others" stackId="a" fill="hsl(30, 50%, 55%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            );
          })()}
        </section>

        {/* 5. Secondary Packaging (includes Fashion Warehouse + Fashion Secondary Packaging) */}
        <section>
          <SectionHeader title="5. Secondary Packaging" n={pkgData.length} />
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <MetricCard label="Total Secondary Material (MT)" value={fmt(secTotal)} onClick={() => handleCardClick('Total Secondary Packaging (MT)', pkgData.map(c => {
              const p = (key: string) => parseNum(c.kpis[key]);
              const total = p('food_pkg_detailed_secondary_breakup_secondary_plastic_virgin') + p('fashion_warehouse_pkg_plastic_recyclable_mt') + p('fashion_warehouse_pkg_plastic_non_recyclable_mt') + p('fashion_secondary_pkg_plastic_recyclable_mt') + p('fashion_secondary_pkg_plastic_non_recyclable_mt')
                + p('food_pkg_detailed_secondary_breakup_secondary_plastic_recycled')
                + p('food_pkg_detailed_secondary_breakup_secondary_paper_virgin') + p('fashion_warehouse_pkg_paper_mt') + p('fashion_secondary_pkg_paper_mt')
                + p('food_pkg_detailed_secondary_breakup_secondary_paper_recycled') + p('fashion_warehouse_pkg_cardboard_mt') + p('fashion_secondary_pkg_cardboard_mt')
                + p('food_pkg_detailed_secondary_breakup_secondary_metal')
                + p('food_pkg_detailed_secondary_breakup_secondary_glass')
                + p('food_pkg_detailed_secondary_breakup_secondary_plant_based')
                + p('food_pkg_detailed_secondary_breakup_secondary_others') + p('fashion_warehouse_pkg_fabric_mt') + p('fashion_warehouse_pkg_other_mt') + p('fashion_secondary_pkg_fabric_mt') + p('fashion_secondary_pkg_other_mt');
              return { brand: c.brand, companyName: c.companyName, industry: c.industry, value: String(r2(total)) };
            }))} />
            <MetricCard label="Plastic Virgin (MT)" value={fmt(secPlasticVirgin)} onClick={() => handleCardClick('Secondary — Plastic Virgin (MT)', companyValMulti('Secondary — Plastic Virgin (MT)', 'food_pkg_detailed_secondary_breakup_secondary_plastic_virgin', 'fashion_warehouse_pkg_plastic_recyclable_mt', 'fashion_warehouse_pkg_plastic_non_recyclable_mt', 'fashion_secondary_pkg_plastic_recyclable_mt', 'fashion_secondary_pkg_plastic_non_recyclable_mt'))} />
            <MetricCard label="Plastic Recycled (MT)" value={fmt(secPlasticRecycled)} onClick={() => handleCardClick('Secondary — Plastic Recycled (MT)', companyVal('food_pkg_detailed_secondary_breakup_secondary_plastic_recycled'))} />
            <MetricCard label="Paper Virgin (MT)" value={fmt(secPaperVirgin)} onClick={() => handleCardClick('Secondary — Paper Virgin (MT)', companyValMulti('Secondary — Paper Virgin (MT)', 'food_pkg_detailed_secondary_breakup_secondary_paper_virgin', 'fashion_warehouse_pkg_paper_mt', 'fashion_secondary_pkg_paper_mt'))} />
            <MetricCard label="Paper Recycled (MT)" value={fmt(secPaperRecycled)} onClick={() => handleCardClick('Secondary — Paper Recycled (MT)', companyValMulti('Secondary — Paper Recycled (MT)', 'food_pkg_detailed_secondary_breakup_secondary_paper_recycled', 'fashion_warehouse_pkg_cardboard_mt', 'fashion_secondary_pkg_cardboard_mt'))} />
            <MetricCard label="Metal (MT)" value={fmt(secMetal)} onClick={() => handleCardClick('Secondary — Metal (MT)', companyVal('food_pkg_detailed_secondary_breakup_secondary_metal'))} />
            <MetricCard label="Glass (MT)" value={fmt(secGlass)} onClick={() => handleCardClick('Secondary — Glass (MT)', companyVal('food_pkg_detailed_secondary_breakup_secondary_glass'))} />
            <MetricCard label="Plant-Based (MT)" value={fmt(secPlantBased)} onClick={() => handleCardClick('Secondary — Plant-Based (MT)', companyVal('food_pkg_detailed_secondary_breakup_secondary_plant_based'))} />
            <MetricCard label="Others (MT)" value={fmt(secOthers)} onClick={() => handleCardClick('Secondary — Others (MT)', companyValMulti('Secondary — Others (MT)', 'food_pkg_detailed_secondary_breakup_secondary_others', 'fashion_warehouse_pkg_fabric_mt', 'fashion_warehouse_pkg_other_mt', 'fashion_secondary_pkg_fabric_mt', 'fashion_secondary_pkg_other_mt'))} />
            <MetricCard label="Recyclable Packaging (%)" value={fmt(secRecyclablePct, '%')} subtitle="Wt. Avg" onClick={() => handleCardClick('Secondary — Recyclable Packaging (%)', pkgData.map(c => {
              let pct = parseNum(c.kpis['food_pkg_detailed_secondary_recyclability_secondary_mono_materials']);
              let hasData = !!c.kpis['food_pkg_detailed_secondary_recyclability_secondary_mono_materials']?.trim();
              if (!hasData) {
                const matKeys = ['cardboard', 'paper', 'plastic_recyclable', 'plastic_non_recyclable', 'fabric', 'other'];
                let total = 0; matKeys.forEach(k => { total += parseNum(c.kpis[`fashion_warehouse_pkg_${k}_mt`]) + parseNum(c.kpis[`fashion_secondary_pkg_${k}_mt`]); });
                if (total > 0) {
                  let rec = 0;['plastic_recyclable', 'cardboard', 'paper', 'fabric'].forEach(k => { rec += parseNum(c.kpis[`fashion_warehouse_pkg_${k}_mt`]) + parseNum(c.kpis[`fashion_secondary_pkg_${k}_mt`]); });
                  pct = (rec / total) * 100; hasData = true;
                }
              }
              return { brand: c.brand, companyName: c.companyName, industry: c.industry, value: hasData ? String(Math.round(pct * 100) / 100) : '' };
            }), true)} />
            <MetricCard label="Non-Recyclable Packaging (%)" value={fmt(secNonRecyclablePct, '%')} subtitle="Wt. Avg" onClick={() => handleCardClick('Secondary — Non-Recyclable Packaging (%)', pkgData.map(c => {
              let recyclable = parseNum(c.kpis['food_pkg_detailed_secondary_recyclability_secondary_mono_materials']);
              let hasData = !!c.kpis['food_pkg_detailed_secondary_recyclability_secondary_mono_materials']?.trim();
              if (!hasData) {
                const matKeys = ['cardboard', 'paper', 'plastic_recyclable', 'plastic_non_recyclable', 'fabric', 'other'];
                let total = 0; matKeys.forEach(k => { total += parseNum(c.kpis[`fashion_warehouse_pkg_${k}_mt`]) + parseNum(c.kpis[`fashion_secondary_pkg_${k}_mt`]); });
                if (total > 0) {
                  let rec = 0;['plastic_recyclable', 'cardboard', 'paper', 'fabric'].forEach(k => { rec += parseNum(c.kpis[`fashion_warehouse_pkg_${k}_mt`]) + parseNum(c.kpis[`fashion_secondary_pkg_${k}_mt`]); });
                  recyclable = (rec / total) * 100; hasData = true;
                }
              }
              return { brand: c.brand, companyName: c.companyName, industry: c.industry, value: hasData ? String(Math.round((100 - recyclable) * 100) / 100) : '' };
            }), true)} />
          </div>
          {/* Secondary Packaging — Stacked Bar Chart (MT) */}
          {(() => {
            const secBarData = pkgData.map(c => {
              const p2 = (k2: string) => parseNum(c.kpis[k2]);
              const plasticVirgin = p2('food_pkg_detailed_secondary_breakup_secondary_plastic_virgin') + p2('fashion_warehouse_pkg_plastic_recyclable_mt') + p2('fashion_warehouse_pkg_plastic_non_recyclable_mt') + p2('fashion_secondary_pkg_plastic_recyclable_mt') + p2('fashion_secondary_pkg_plastic_non_recyclable_mt');
              const plasticRecycled = p2('food_pkg_detailed_secondary_breakup_secondary_plastic_recycled');
              const paperVirgin = p2('food_pkg_detailed_secondary_breakup_secondary_paper_virgin') + p2('fashion_warehouse_pkg_paper_mt') + p2('fashion_secondary_pkg_paper_mt');
              const paperRecycled = p2('food_pkg_detailed_secondary_breakup_secondary_paper_recycled') + p2('fashion_warehouse_pkg_cardboard_mt') + p2('fashion_secondary_pkg_cardboard_mt');
              const metal = p2('food_pkg_detailed_secondary_breakup_secondary_metal');
              const glass = p2('food_pkg_detailed_secondary_breakup_secondary_glass');
              const plantBased = p2('food_pkg_detailed_secondary_breakup_secondary_plant_based');
              const others = p2('food_pkg_detailed_secondary_breakup_secondary_others') + p2('fashion_warehouse_pkg_fabric_mt') + p2('fashion_warehouse_pkg_other_mt') + p2('fashion_secondary_pkg_fabric_mt') + p2('fashion_secondary_pkg_other_mt');
              const total = plasticVirgin + plasticRecycled + paperVirgin + paperRecycled + metal + glass + plantBased + others;
              if (total <= 0) return null;
              return { brand: c.brand, 'Plastic Virgin': r2(plasticVirgin), 'Plastic Recycled': r2(plasticRecycled), 'Paper Virgin': r2(paperVirgin), 'Paper Recycled': r2(paperRecycled), 'Metal': r2(metal), 'Glass': r2(glass), 'Plant-Based': r2(plantBased), 'Others': r2(others), total: r2(total) };
            }).filter(Boolean).sort((a: any, b: any) => b.total - a.total).slice(0, 15);
            if (secBarData.length === 0) return null;
            return (
              <Card className="mt-3">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Secondary Packaging — Material Breakdown (MT)</CardTitle>
                    <Badge variant="secondary" className="text-[10px]">n={secBarData.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={Math.max(200, secBarData.length * 32)}>
                    <BarChart data={secBarData} layout="vertical" margin={{ left: 100, right: 10 }} barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis type="category" dataKey="brand" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} width={90} interval={0} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [`${r2(v)} MT`, name]} />
                      <Legend verticalAlign="top" height={36} formatter={(value) => <span className="text-[10px]">{value}</span>} />
                      <Bar dataKey="Plastic Virgin" stackId="a" fill="hsl(0, 72%, 51%)" />
                      <Bar dataKey="Plastic Recycled" stackId="a" fill="hsl(160, 84%, 39%)" />
                      <Bar dataKey="Paper Virgin" stackId="a" fill="hsl(38, 92%, 50%)" />
                      <Bar dataKey="Paper Recycled" stackId="a" fill="hsl(45, 85%, 65%)" />
                      <Bar dataKey="Metal" stackId="a" fill="hsl(217, 91%, 60%)" />
                      <Bar dataKey="Glass" stackId="a" fill="hsl(280, 65%, 60%)" />
                      <Bar dataKey="Plant-Based" stackId="a" fill="hsl(120, 50%, 50%)" />
                      <Bar dataKey="Others" stackId="a" fill="hsl(30, 50%, 55%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            );
          })()}
        </section>

        {/* Compliance + other KPIs via default renderer (excluding approach_vision, total, primary, secondary already shown) */}
        <DefaultKPIRenderer
          kpiAnalytics={kpiAnalytics.filter(({ kpi }) => !['approach_vision', 'total_packaging', 'primary_packaging', 'secondary_packaging', 'compliance_details'].includes(kpi.id) && !kpi.id.includes('compliance'))}
          showGraphs={false}
          handleCardClick={handleCardClick}
          mapping={mapping}
        />

        <TextResponsesSection featureKey={featureKey} companyRawData={companyRawData} onDrillDown={handleCardClick} />
      </div>
    );
  }

  // ─── Materials & Packaging (Fashion) ───
  if (featureKey === 'fashionMaterials') {
    const parseNum = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
    // Only count companies that actually have fashion-related data
    const hasFashionData = (c: CompanyRawMetrics) => {
      const keys = Object.keys(c.kpis).filter(k => c.kpis[k]?.trim());
      return keys.some(k => k.startsWith('fashion_'));
    };
    const fashionCompanies = companyRawData.filter(hasFashionData);
    const fashionN = fashionCompanies.length;
    // Scope quarterly data to fashion companies for insight graphs
    const fashionQuarterlyData = featureQuarterlyPerQuarterRawData
      ? Object.fromEntries(Object.entries(featureQuarterlyPerQuarterRawData).map(([q, data]) => [q, data.filter(hasFashionData)]))
      : undefined;
    const k = (key: string) => companyRawData.reduce((s, c) => s + parseNum(c.kpis[key]), 0);
    const companyVal = (key: string) => enrichWithQuarterly(companyRawData
      .filter(c => c.kpis[key] !== undefined && c.kpis[key] !== null && c.kpis[key]?.trim() !== '')
      .map(c => ({
        brand: c.brand, companyName: c.companyName, industry: c.industry,
        value: String(parseNum(c.kpis[key])),
      })), key);
    const avgPct = (key: string) => {
      const vals = companyRawData.filter(c => c.kpis[key] !== undefined && c.kpis[key] !== null && c.kpis[key]?.trim() !== '').map(c => parseNum(c.kpis[key]));
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    // 2. Total Materials Consumption
    const totalMaterialsMT = k('fashion_total_materials_mt');
    const sustainablePct = avgPct('fashion_sustainable_materials_pct');

    // 3. Recyclability of Textile Materials
    const recyclablePct = avgPct('fashion_recyclable_materials_pct');
    const nonRecyclablePct = avgPct('fashion_non_recyclable_materials_pct');

    // 4. Textile Materials
    const TEXTILES = [
      { key: 'cotton', label: 'Cotton' },
      { key: 'polyester', label: 'Polyester' },
      { key: 'nylon', label: 'Nylon' },
      { key: 'wool', label: 'Wool' },
      { key: 'silk', label: 'Silk' },
      { key: 'linen', label: 'Linen' },
      { key: 'viscose', label: 'Viscose/Rayon' },
      { key: 'elastane', label: 'Elastane/Spandex' },
      { key: 'other', label: 'Other' },
    ];

    // 5/6/8 Packaging materials
    const PKG_MATS = [
      { key: 'cardboard', label: 'Cardboard' },
      { key: 'paper', label: 'Paper' },
      { key: 'plastic_recyclable', label: 'Plastic (Recyclable)' },
      { key: 'plastic_non_recyclable', label: 'Plastic (Non-Recyclable)' },
      { key: 'fabric', label: 'Fabric/Cloth' },
      { key: 'other', label: 'Other' },
    ];

    // Helper: avg pct across companies for packaging breakup (auto-calculated %)
    const pkgAvgPct = (prefix: string, matKey: string) => {
      const vals = companyRawData.map(c => {
        const totalMT = PKG_MATS.reduce((s, m) => s + parseNum(c.kpis[`${prefix}${m.key}_mt`]), 0);
        const matMT = parseNum(c.kpis[`${prefix}${matKey}_mt`]);
        return totalMT > 0 ? (matMT / totalMT) * 100 : 0;
      }).filter(v => v > 0);
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    // 7. Compliance Details
    const fashionEprTarget = k('fashion_epr_target');
    const fashionEprPct = avgPct('fashion_epr_compliance_pct');
    const fashionWasteExpenditure = k('fashion_waste_expenditure');
    const companyPctVal = (key: string) => enrichWithQuarterly(companyRawData.map(c => ({
      brand: c.brand, companyName: c.companyName, industry: c.industry,
      value: String(parseNum(c.kpis[key])),
    })), key);

    return (
      <div className="space-y-4">
        {insightMetrics.length > 0 && (
          <InsightSection insightMetrics={insightMetrics} currentInsights={currentInsights} companyRawData={fashionCompanies} handleCardClick={handleCardClick} quarterlyPerQuarterRawData={fashionQuarterlyData} featureKey={featureKey} totalCompanyCount={featureCompanyRawData.length} filters={filters} allCompanyRawData={featureAllCompanyRawData} />
        )}

        {/* 2. Total Materials Consumption */}
        <section>
          <SectionHeader title="2. Total Materials Consumption" n={fashionN} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <MetricCard label="Total Materials Used (meters)" value={fmt(totalMaterialsMT)} onClick={() => handleCardClick('Total Materials Used (meters)', companyVal('fashion_total_materials_mt'))} />
            <MetricCard label="Sustainable Materials (%)" value={fmt(sustainablePct, '%')} subtitle="Avg" onClick={() => handleCardClick('Sustainable Materials (%)', companyVal('fashion_sustainable_materials_pct'), true)} />
          </div>
        </section>

        {/* 3. Recyclability of Textile Materials */}
        <section>
          <SectionHeader title="3. Recyclability of Textile Materials (%)" n={fashionN} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <MetricCard label="Recyclable Materials (%)" value={fmt(recyclablePct, '%')} subtitle="Avg" onClick={() => handleCardClick('Recyclable Materials (%)', companyVal('fashion_recyclable_materials_pct'), true)} />
            <MetricCard label="Non-Recyclable Materials (%)" value={fmt(nonRecyclablePct, '%')} subtitle="Avg" onClick={() => handleCardClick('Non-Recyclable Materials (%)', companyVal('fashion_non_recyclable_materials_pct'), true)} />
          </div>
        </section>

        {/* 4. Type of Textile Materials Sourced */}
        <section>
          <SectionHeader title="4. Type of Textile Materials Sourced (meters)" n={fashionN} />
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {TEXTILES.map(t => (
              <MetricCard key={t.key} label={`${t.label} (meters)`} value={fmt(k(`fashion_material_${t.key}_mt`))} onClick={() => handleCardClick(`Textile — ${t.label} (meters)`, companyVal(`fashion_material_${t.key}_mt`))} />
            ))}
          </div>
        </section>

        {/* Sections 5 (Warehouse), 6 (Primary), 8 (Secondary) packaging moved to Primary & Secondary Packaging feature */}

        {/* Remaining KPIs via default renderer */}
        <DefaultKPIRenderer kpiAnalytics={kpiAnalytics.filter(({ kpi }) => !kpi.id.includes('approach_vision') && !kpi.id.includes('compliance'))} showGraphs={false} handleCardClick={handleCardClick} mapping={mapping} />

        <TextResponsesSection featureKey={featureKey} companyRawData={companyRawData} onDrillDown={handleCardClick} />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // BUSINESS INFORMATION — compact 4-card grid
  // ═══════════════════════════════════════════════════════════════
  if (featureKey === 'businessInformation') {
    // Flatten all numeric fields across all KPIs into a single grid
    const allFields = kpiAnalytics.flatMap(({ kpi, fieldAnalytics }) =>
      fieldAnalytics
        .filter((fa: any) => fa.isNumeric && fa.n > 0)
        .map((fa: any) => ({ ...fa, kpi }))
    );

    return (
      <div className="space-y-4">
        {insightMetrics.length > 0 && (
          <InsightSection insightMetrics={insightMetrics} currentInsights={currentInsights} companyRawData={featureCompanyRawData} handleCardClick={handleCardClick} quarterlyPerQuarterRawData={featureQuarterlyPerQuarterRawData} featureKey={featureKey} filters={filters} allCompanyRawData={featureAllCompanyRawData} />
        )}

        <section>
          <SectionHeader title="Business Information" n={companyRawData.length} icon={TrendingUp} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {allFields.map(({ field, perCompany, n, primaryValue, isPct, kpi }: any) => {
              const enrichedData = enrichWithQuarterly(perCompany, kpi.id);
              return (
                <Card
                  key={`${kpi.id}-${field.id}`}
                  className="hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => handleCardClick(`${kpi.label} — ${field.label}`, enrichedData, isPct)}
                >
                  <CardContent className="pt-3 pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] text-muted-foreground leading-tight flex-1">{kpi.label}</p>
                      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0" />
                    </div>

                    <p className="text-[10px] text-muted-foreground">{field.label}</p>
                    <p className="text-lg font-bold">{fmt(primaryValue, isPct ? '%' : '')}</p>
                    <p className="text-[10px] text-muted-foreground">{isPct ? 'Avg' : 'Total'} · n={n}</p>
                  </CardContent>
                </Card>
              );
            })}

          </div>
        </section>
        <TextResponsesSection featureKey={featureKey} companyRawData={companyRawData} onDrillDown={handleCardClick} />
      </div>
    );
  }

  // ─── Healthcare ───
  if (featureKey === 'healthCare') {
    const parseNum = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
    const fmtIntLocal = (v: number) => { if (Math.abs(v) >= 10000) return `${fmtWithCommas(v / 1000, 0)}K`; return Math.round(v).toLocaleString(); };

    // Use Q4 data when available (annual/combined view), otherwise use combined data
    const isAnnualWithQ = !!featureQuarterlyPerQuarterRawData && Object.keys(featureQuarterlyPerQuarterRawData).length > 0;
    const q4HealthData = isAnnualWithQ ? (featureQuarterlyPerQuarterRawData!['Q4'] || []) : null;
    const healthData = q4HealthData || featureCompanyRawData;

    const consultations = healthData.reduce((s, c) => s + parseNum(c.kpis['healthcare_consultations_screenings']), 0);
    const products = healthData.reduce((s, c) => s + parseNum(c.kpis['healthcare_products_services']), 0);

    const consultFilled = healthData.filter(c => c.kpis['healthcare_consultations_screenings']?.trim());
    const productsFilled = healthData.filter(c => c.kpis['healthcare_products_services']?.trim());
    // Use the full feature-assigned population for "not filled" denominator
    const totalAssigned = featureCompanyRawData.length;
    const consultNotFilled = totalAssigned - consultFilled.length;
    const productsNotFilled = totalAssigned - productsFilled.length;

    // Build drill-down data with Q1-Q4 enrichment
    const consultDrillBase = consultFilled.map(c => ({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: String(parseNum(c.kpis['healthcare_consultations_screenings'])) }));
    const productsDrillBase = productsFilled.map(c => ({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: String(parseNum(c.kpis['healthcare_products_services'])) }));

    // Enrich with quarterly values
    const enrichHealthDrill = (drill: typeof consultDrillBase, kpiKey: string) => {
      if (!featureQuarterlyPerQuarterRawData) return enrichWithQuarterly(drill, kpiKey);
      return drill.map(row => {
        const enriched: any = { ...row };
        ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
          const qData = featureQuarterlyPerQuarterRawData![q] || [];
          const match = qData.find(c => c.brand === row.brand);
          if (match) {
            const val = match.kpis[kpiKey];
            enriched[q.toLowerCase()] = (val !== undefined && val !== null && val.trim() !== '') ? val : '';
          }
        });
        return enriched;
      });
    };

    const consultDrill = enrichHealthDrill(consultDrillBase, 'healthcare_consultations_screenings');
    const productsDrill = enrichHealthDrill(productsDrillBase, 'healthcare_products_services');

    return (
      <div className="space-y-4">
        {insightMetrics.length > 0 && (
          <InsightSection insightMetrics={insightMetrics} currentInsights={currentInsights} companyRawData={featureCompanyRawData} handleCardClick={handleCardClick} quarterlyPerQuarterRawData={featureQuarterlyPerQuarterRawData} featureKey={featureKey} filters={filters} allCompanyRawData={featureAllCompanyRawData} />
        )}
        <section>
          <SectionHeader title="Healthcare" n={totalAssigned} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="No. of Doctor Consultations / Patient Screenings" value={fmtIntLocal(consultations)}
              subtitle={`n=${consultFilled.length}${consultNotFilled > 0 ? ` · ${consultNotFilled} not filled` : ''}`}
              onClick={() => handleCardClick('No. of Doctor Consultations / Patient Screenings', consultDrill)} />
            <MetricCard label="No. of Healthcare Products / Services Offered" value={fmtIntLocal(products)}
              subtitle={`n=${productsFilled.length}${productsNotFilled > 0 ? ` · ${productsNotFilled} not filled` : ''}`}
              onClick={() => handleCardClick('No. of Healthcare Products / Services Offered', productsDrill)} />
          </div>
        </section>
        <DefaultKPIRenderer kpiAnalytics={kpiAnalytics} showGraphs={showGraphs} handleCardClick={handleCardClick} mapping={mapping} />
        <TextResponsesSection featureKey={featureKey} companyRawData={healthData} onDrillDown={handleCardClick} />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // DEFAULT RENDERING
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="space-y-4">
      {insightMetrics.length > 0 && (
        <InsightSection insightMetrics={insightMetrics} currentInsights={currentInsights} companyRawData={featureCompanyRawData} handleCardClick={handleCardClick} quarterlyPerQuarterRawData={featureQuarterlyPerQuarterRawData} featureKey={featureKey} filters={filters} allCompanyRawData={featureAllCompanyRawData} />
      )}
      <DefaultKPIRenderer kpiAnalytics={kpiAnalytics} showGraphs={showGraphs} handleCardClick={handleCardClick} mapping={mapping} />
      <TextResponsesSection featureKey={featureKey} companyRawData={companyRawData} onDrillDown={handleCardClick} />
    </div>
  );
};

// ─── Operations KPI Renderer (all cards horizontal, no graphs, integer values) ───
const OperationsKPIRenderer = ({
  kpiAnalytics,
  handleCardClick,
  mapping,
}: {
  kpiAnalytics: { kpi: any; fieldAnalytics: any[] }[];
  handleCardClick: (title: string, data: any[], isPct?: boolean) => void;
  mapping: any;
}) => {
  const fmtIntOps = (v: number) => Math.round(v).toLocaleString();
  return (
    <>
      {kpiAnalytics.map(({ kpi, fieldAnalytics }) => {
        const numericFields = fieldAnalytics.filter((fa: any) => fa.isNumeric && fa.n > 0);
        const hasAnyData = fieldAnalytics.some((fa: any) => fa.n > 0);
        if (!hasAnyData) return null;

        return (
          <section key={kpi.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{kpi.number}. {kpi.label}</h3>
              {hasAnyData && (
                <Badge variant="outline" className="text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  n={Math.max(...fieldAnalytics.map((fa: any) => fa.n))}
                </Badge>
              )}
            </div>

            {numericFields.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {numericFields.map(({ field, perCompany, n, primaryValue, isPct }: any) => (
                  <Card
                    key={field.id}
                    className="hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => handleCardClick(`${kpi.label} — ${field.label}`, perCompany, isPct)}
                  >
                    <CardContent className="pt-3 pb-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[11px] text-muted-foreground leading-tight flex-1">{field.label}</p>
                        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0" />
                      </div>
                      <p className="text-lg font-bold">{fmtIntOps(primaryValue)}</p>
                      <p className="text-[10px] text-muted-foreground">{isPct ? 'Avg' : 'Total'} · n={n}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </>
  );
};

// ─── Default KPI Renderer (stat cards + optional charts) ───
const DefaultKPIRenderer = ({
  kpiAnalytics,
  showGraphs,
  handleCardClick,
  mapping,
}: {
  kpiAnalytics: { kpi: any; fieldAnalytics: any[] }[];
  showGraphs: boolean;
  handleCardClick: (title: string, data: any[], isPct?: boolean) => void;
  mapping: any;
}) => {
  return (
    <>
      {kpiAnalytics.map(({ kpi, fieldAnalytics }) => {
        const numericFields = fieldAnalytics.filter((fa: any) => fa.isNumeric && fa.n > 0);
        const hasAnyData = fieldAnalytics.some((fa: any) => fa.n > 0);
        if (!hasAnyData) return null;

        return (
          <section key={kpi.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{kpi.number}. {kpi.label}</h3>
              {hasAnyData && (
                <Badge variant="outline" className="text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  n={Math.max(...fieldAnalytics.map((fa: any) => fa.n))}
                </Badge>
              )}
            </div>

            {numericFields.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {numericFields.map(({ field, perCompany, n, primaryValue, isPct, notConsidered }: any) => {
                  const isCountField = field.id.endsWith('_num_vendors');
                  const displayValue = isCountField ? Math.round(primaryValue).toLocaleString() : fmt(primaryValue, isPct ? '%' : '');
                  return (
                    <Card
                      key={field.id}
                      className="hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => handleCardClick(`${kpi.label} — ${field.label}`, perCompany, isPct)}
                    >
                      <CardContent className="pt-3 pb-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[11px] text-muted-foreground leading-tight flex-1">{field.label}</p>
                          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0" />
                        </div>
                        <p className="text-lg font-bold">{displayValue}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {isPct ? 'Avg' : 'Total'} · n={n}
                          {notConsidered != null && notConsidered > 0 ? ` · ${notConsidered} not considered` : ''}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {showGraphs && numericFields.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {numericFields.map(({ field, perCompany, n, isPct }: any) => {
                  const chartData = perCompany
                    .filter((c: any) => c.numValue > 0)
                    .sort((a: any, b: any) => b.numValue - a.numValue)
                    .slice(0, 10);
                  if (chartData.length < 2) return null;

                  return (
                    <Card key={`chart-${field.id}`} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleCardClick(`${kpi.label} — ${field.label}`, perCompany, isPct)}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            {field.label}
                          </CardTitle>
                          <Badge variant="secondary" className="text-[10px]">n={n}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 32)}>
                          <BarChart data={chartData} layout="vertical" margin={{ left: 100, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => fmt(v)} />
                            <YAxis type="category" dataKey="brand" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} width={90} interval={0} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [fmt(value), field.label]} />
                            <Bar dataKey="numValue" name={field.label} radius={[0, 4, 4, 0]}>
                              {chartData.map((_: any, i: number) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </>
  );
};

const QUARTER_COLORS: Record<string, string> = {
  Q1: 'hsl(217, 91%, 60%)',
  Q2: 'hsl(160, 84%, 39%)',
  Q3: 'hsl(38, 92%, 50%)',
  Q4: 'hsl(280, 65%, 60%)',
};

// Features that show Top 5 instead of Top 10 in insight graphs
const TOP5_FEATURES = new Set(['waterManagement', 'wasteManagement']);

// Ratio metric component column definitions — imported from shared module
import { RATIO_COMPONENT_COLUMNS } from '@/lib/ratioComponentColumns';
import { http } from '@/utils/httpInterceptor';

// ─── Insight Section ───
const InsightSection = ({
  insightMetrics,
  currentInsights,
  companyRawData,
  handleCardClick,
  quarterlyPerQuarterRawData,
  featureKey,
  totalCompanyCount,
  filters,
  allCompanyRawData,
}: {
  insightMetrics: { label: string; key: keyof InsightMetrics; unit: string }[];
  currentInsights: InsightMetrics;
  companyRawData: CompanyRawMetrics[];
  handleCardClick: (title: string, data: { brand: string; companyName: string; industry: string; value: string; q1?: string; q2?: string; q3?: string; q4?: string; ratioColumns?: Record<string, string> }[], isPct?: boolean, extra?: { hasQuarterlyColumns?: boolean; ratioColumnHeaders?: string[]; sourceInsightKey?: string; unit?: string }) => void;
  quarterlyPerQuarterRawData?: Record<string, CompanyRawMetrics[]>;
  featureKey?: string;
  totalCompanyCount?: number;
  filters?: any;
  allCompanyRawData?: CompanyRawMetrics[];
}) => {
  console.log("insightMetrics :: insightMetrics")
  console.log('quarterlyPerQuarterRawData',quarterlyPerQuarterRawData)
  const isSingleCompany = !!filters?.companyId;
  const [graphMode, setGraphMode] = useState<'consolidated' | 'timeline'>(isSingleCompany && !!quarterlyPerQuarterRawData ? 'timeline' : 'consolidated');
  const hasTimelineData = !!quarterlyPerQuarterRawData;
  // Per-metric topN override: PwD Inclusion Rate shows top 5
  const TOP5_METRICS = new Set(['pwdInclusionRate']);
  const getTopN = (metricKey: string) => TOP5_METRICS.has(metricKey) ? 5 : (TOP5_FEATURES.has(featureKey || '') ? 5 : 10);
  const topN = TOP5_FEATURES.has(featureKey || '') ? 5 : 10;

  // ── Build quarterly-summed revenue map for CSR Spend Ratio ──
  const csrRevenueMap = useMemo(() => {
    if (!quarterlyPerQuarterRawData) return null;
    const map = new Map<string, number>();
    Object.values(quarterlyPerQuarterRawData).forEach(qArr => {
      for (const qc of qArr) {
        const rev = parseFloat(qc.kpis['net_revenue'] || '0') || 0;
        map.set(qc.companyId, (map.get(qc.companyId) || 0) + rev);
      }
    });
    return map.size > 0 ? map : null;
  }, [quarterlyPerQuarterRawData]);

  // ── Jobs per Cr Revenue: compute from avg headcount / total revenue per company ──
  const jobsPerCrQuarterlyMap = useMemo(() => {
    if (!quarterlyPerQuarterRawData) return null;
    const map = new Map<string, number>();
    const pn = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
    const empKeys = ['employees_wc_male_fulltime', 'employees_wc_male_contractual', 'employees_wc_male_parttime', 'employees_wc_female_fulltime', 'employees_wc_female_contractual', 'employees_wc_female_parttime', 'employees_bc_male_fulltime', 'employees_bc_male_contractual', 'employees_bc_male_parttime', 'employees_bc_female_fulltime', 'employees_bc_female_contractual', 'employees_bc_female_parttime'];
    const allIds = new Set(companyRawData.map(c => c.companyId));
    allIds.forEach(id => {
      const qEmpTotals: number[] = [];
      let qRevSum = 0;
      ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
        const qArr = quarterlyPerQuarterRawData[q] || [];
        const qc = qArr.find(x => x.companyId === id);
        if (qc) {
          const qEmp = empKeys.reduce((s, k) => s + pn(qc.kpis[k]), 0);
          if (qEmp > 0) qEmpTotals.push(qEmp);
          qRevSum += pn(qc.kpis['net_revenue']);
        }
      });
      const avgEmp = qEmpTotals.length > 0 ? qEmpTotals.reduce((a, b) => a + b, 0) / qEmpTotals.length : 0;
      if (avgEmp > 0 && qRevSum > 0) {
        map.set(id, r2(avgEmp / qRevSum));
      }
    });
    return map.size > 0 ? map : null;
  }, [quarterlyPerQuarterRawData, companyRawData]);

  // ── Gender Pay Parity Index: formula-based value from aggregated inputs ──
  const payParityQuarterlyMap = useMemo(() => {
    if (!quarterlyPerQuarterRawData) return null;
    const map = new Map<string, number>();
    const pn = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
    const allIds = new Set(companyRawData.map(c => c.companyId));
    allIds.forEach(id => {
      let fWS = 0, mWS = 0;
      const fCs: number[] = [], mCs: number[] = [];
      ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
        const qArr = quarterlyPerQuarterRawData[q] || [];
        const qc = qArr.find(x => x.companyId === id);
        if (qc) {
          fWS += pn(qc.kpis['employees_wc_wages_female']) + pn(qc.kpis['employees_bc_wages_female']);
          mWS += pn(qc.kpis['employees_wc_wages_male']) + pn(qc.kpis['employees_bc_wages_male']);
          const fc = pn(qc.kpis['employees_wc_female_fulltime']) + pn(qc.kpis['employees_wc_female_contractual']) + pn(qc.kpis['employees_wc_female_parttime']) + pn(qc.kpis['employees_bc_female_fulltime']) + pn(qc.kpis['employees_bc_female_contractual']) + pn(qc.kpis['employees_bc_female_parttime']);
          const mc = pn(qc.kpis['employees_wc_male_fulltime']) + pn(qc.kpis['employees_wc_male_contractual']) + pn(qc.kpis['employees_wc_male_parttime']) + pn(qc.kpis['employees_bc_male_fulltime']) + pn(qc.kpis['employees_bc_male_contractual']) + pn(qc.kpis['employees_bc_male_parttime']);
          if (fc > 0) fCs.push(fc);
          if (mc > 0) mCs.push(mc);
        }
      });
      const avgFC = fCs.length > 0 ? fCs.reduce((a, b) => a + b, 0) / fCs.length : 0;
      const avgMC = mCs.length > 0 ? mCs.reduce((a, b) => a + b, 0) / mCs.length : 0;
      if (fWS > 0 && avgFC > 0 && mWS > 0 && avgMC > 0) {
        map.set(id, Math.round(((fWS / avgFC) / (mWS / avgMC)) * 100) / 100);
      }
    });
    return map.size > 0 ? map : null;
  }, [quarterlyPerQuarterRawData, companyRawData]);

  // ── CXO Pay Ratio: formula-based from aggregated inputs ──
  // CXO Pay Ratio = (Sum(CXO Comp Q1-Q4) / Avg(Total Executives Q1-Q4)) / (Avg WC Employee Comp Q1-Q4)
  const cxoPayRatioQuarterlyMap = useMemo(() => {
    if (!quarterlyPerQuarterRawData) return null;
    const map = new Map<string, number>();
    const pn = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
    const allIds = new Set(companyRawData.map(c => c.companyId));
    allIds.forEach(id => {
      const cxoPerCxoComps: number[] = [];
      const wcEmpComps: number[] = [];
      ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
        const qArr = quarterlyPerQuarterRawData[q] || [];
        const qc = qArr.find(x => x.companyId === id);
        if (qc) {
          const totalCxoComp = pn(qc.kpis['leadership_avg_cxo_compensation']);
          const totalExecs = pn(qc.kpis['leadership_clevel_total']);
          if (totalExecs > 0) cxoPerCxoComps.push(totalCxoComp / totalExecs);
          // WC-only employee comp
          const wcEmp = pn(qc.kpis['employees_wc_male_fulltime']) + pn(qc.kpis['employees_wc_male_contractual']) + pn(qc.kpis['employees_wc_male_parttime']) +
            pn(qc.kpis['employees_wc_female_fulltime']) + pn(qc.kpis['employees_wc_female_contractual']) + pn(qc.kpis['employees_wc_female_parttime']);
          const wcWages = pn(qc.kpis['employees_wc_wages_male']) + pn(qc.kpis['employees_wc_wages_female']);
          if (wcEmp > 0) wcEmpComps.push(wcWages / wcEmp);
        }
      });
      const avgCxoPerCxo = cxoPerCxoComps.length > 0 ? cxoPerCxoComps.reduce((a, b) => a + b, 0) / cxoPerCxoComps.length : 0;
      const avgWcEmpComp = wcEmpComps.length > 0 ? wcEmpComps.reduce((a, b) => a + b, 0) / wcEmpComps.length : 0;
      if (avgCxoPerCxo > 0 && avgWcEmpComp > 0) {
        map.set(id, Math.round((avgCxoPerCxo / avgWcEmpComp) * 100) / 100);
      }
    });
    return map.size > 0 ? map : null;
  }, [quarterlyPerQuarterRawData, companyRawData]);

  const plasticReductionData = useMemo(() => {
    if (!quarterlyPerQuarterRawData) return null;
    const q4Data = quarterlyPerQuarterRawData['Q4'] || [];
    console.log('q4Data :: ',q4Data)
    const parseNum = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };

    // All virgin plastic KPI keys (food + fashion)
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

    // Check if a company actually has virgin plastic packaging data filled (not blank)
    const hasPlasticData = (c: CompanyRawMetrics) => {
      console.log('Company ID:', c.companyId);
      let filtered=VIRGIN_PLASTIC_KEYS.filter((v)=> c.kpis[v]);
      console.log('filtered :: ',filtered)
      return VIRGIN_PLASTIC_KEYS.some(k => c.kpis[k] !== undefined && c.kpis[k] !== null && c.kpis[k]?.trim() !== '');
    };

    // Get total virgin plastic (MT) for a company
    const getVirginPlasticMT = (c: CompanyRawMetrics) => {
      let filtered=VIRGIN_PLASTIC_KEYS.filter((v)=> c.kpis[v]);
      console.log('filtered :: ',filtered)
      console.log('VIRGIN_PLASTIC_KEYS.reduce((sum, k) => sum + parseNum(c.kpis[k]), 0);',VIRGIN_PLASTIC_KEYS.reduce((sum, k) => sum + parseNum(c.kpis[k]), 0));
      return VIRGIN_PLASTIC_KEYS.reduce((sum, k) => sum + parseNum(c.kpis[k]), 0);
    };

    const getPlasticIntensity = (c: CompanyRawMetrics) => {
      const plasticVirgin = getVirginPlasticMT(c);
      const revenue = parseNum(c.kpis['net_revenue']);
      return revenue > 0 ? plasticVirgin / revenue : 0;
    };

    // Build base quarter data: use earliest available quarter (Q1 → Q2 → Q3) per company
    const baseQuarterData = new Map<string, { intensity: number; virginMT: number; quarter: string; company: CompanyRawMetrics }>();
    ['Q1', 'Q2', 'Q3'].forEach(q => {
      const qData = quarterlyPerQuarterRawData[q] || [];
      qData.forEach(c => {
        console.log('baseQuarterData :: q => ',q,'Company Id :: ',c.companyId)
        if (!baseQuarterData.has(c.companyId) && hasPlasticData(c)) {
          baseQuarterData.set(c.companyId, { intensity: getPlasticIntensity(c), virginMT: getVirginPlasticMT(c), quarter: q, company: c });
        }
      });
    });

    const q4Map = new Map(q4Data.map(c => [c.companyId, { intensity: getPlasticIntensity(c), virginMT: getVirginPlasticMT(c), company: c }]));
    const q4HasData = new Map(q4Data.map(c => [c.companyId, hasPlasticData(c)]));
    console.log('q4HasData :: ',q4HasData)
    const companies: { brand: string; companyName: string; industry: string; value: string; numValue: number; ratioColumns?: Record<string, string> }[] = [];
    const allCompanyIds = new Set([...baseQuarterData.keys(), ...q4Map.keys()]);
    const brandMap = new Map<string, { brand: string; companyName: string; industry: string }>();
    ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
      (quarterlyPerQuarterRawData[q] || []).forEach((c: CompanyRawMetrics) => {
        if (!brandMap.has(c.companyId)) brandMap.set(c.companyId, { brand: c.brand, companyName: c.companyName, industry: c.industry });
      });
    });

    allCompanyIds.forEach(id => {
      const baseData = baseQuarterData.get(id);
      const baseInt = baseData?.intensity || 0;
      const baseFilled = !!baseData;
      const q4Int = q4Map.get(id)?.intensity || 0;
      const q4Filled = q4HasData.get(id) || false;

      // Skip if neither base quarter nor Q4 has plastic data filled
      if (!baseFilled && !q4Filled) return;

      // Skip only if both are zero AND Q4 wasn't actually filled
      if (baseInt === 0 && q4Int === 0 && !q4Filled) return;

      // If base > 0 but Q4 has no data filled (blank), skip — company didn't report Q4
      if (baseInt > 0 && q4Int === 0 && !q4Filled) return;

      const reduction = baseInt > 0 ? ((baseInt - q4Int) / baseInt) * 100 : 0;
      const baseQ = baseData?.quarter || 'Q1';

      const info = brandMap.get(id);
      if (info) {
        companies.push({ ...info, value: r2(reduction).toFixed(2), numValue: r2(reduction), ratioColumns: { [`${baseQ} Virgin Plastic (MT)`]: r2(baseData?.virginMT || 0).toFixed(4), 'Q4 Virgin Plastic (MT)': r2(q4Map.get(id)?.virginMT || 0).toFixed(4), [`${baseQ} Plastic Intensity`]: r2(baseInt).toFixed(4), 'Q4 Plastic Intensity': r2(q4Int).toFixed(4) } });
      }
    });

    const avg = companies.length > 0 ? r2(companies.reduce((s, c) => s + c.numValue, 0) / companies.length) : 0;
    return { companies, avg, n: companies.length };
  }, [quarterlyPerQuarterRawData]);

  const isCsrFeature = featureKey === 'csr';

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-sm font-semibold">Derived Insights</h3>
        <Badge variant="outline" className="text-xs">Auto-calculated</Badge>
        <Badge variant="secondary" className="text-[10px]">n={totalCompanyCount ?? companyRawData.length}</Badge>

        {hasTimelineData && !NO_INSIGHT_GRAPH_FEATURES.has(featureKey || '') && (
          <ToggleGroup
            type="single"
            value={graphMode}
            onValueChange={(v) => { if (v) setGraphMode(v as 'consolidated' | 'timeline'); }}
            size="sm"
            variant="outline"
            className="ml-auto"
          >
            <ToggleGroupItem value="consolidated" className="text-xs gap-1 h-7 px-2.5">
              <BarChart3 className="w-3 h-3" />
              Consolidated
            </ToggleGroupItem>
            <ToggleGroupItem value="timeline" className="text-xs gap-1 h-7 px-2.5">
              <LineChart className="w-3 h-3" />
              Timeline
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>

      {/* No data message for single company with no entries */}
      {isSingleCompany && companyRawData.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No data available for the selected company in this feature.
          </CardContent>
        </Card>
      )}

      {/* Graphs + Stat cards: for CSR side-by-side, otherwise stacked */}
      <div className={isCsrFeature ? 'flex flex-col lg:flex-row gap-3' : 'contents'}>
        {/* Graphs */}
        {companyRawData.length >= 1 && !NO_INSIGHT_GRAPH_FEATURES.has(featureKey || '') && (
          <div className={isCsrFeature ? 'flex-[3] min-w-0' : 'grid grid-cols-1 lg:grid-cols-2 gap-3'}>
            {insightMetrics.map((metric) => {
              // Relevance check for graph data — defined early so both timeline & consolidated can use it
              const graphRelevanceCheckMap: Record<string, (c: CompanyRawMetrics) => boolean> = {
                caseResolutionRate: (c) => Object.keys(c.kpis).some(k => k.startsWith('incident_') && k.endsWith('_cases') && c.kpis[k]?.trim() !== '' && c.kpis[k] !== '0'),
                highImpactIncidentRatio: (c) => Object.keys(c.kpis).some(k => k.startsWith('incident_') && k.endsWith('_cases') && c.kpis[k]?.trim() !== '' && c.kpis[k] !== '0'),
                poshCaseIntensity: (c) => Object.keys(c.kpis).some(k => k.startsWith('incident_') && k.endsWith('_cases') && c.kpis[k]?.trim() !== ''),
                totalIncidentCount: (c) => Object.keys(c.kpis).some(k => k.startsWith('incident_') && k.endsWith('_cases') && c.kpis[k]?.trim() !== ''),
                supplyChainLocalizationIndex: (c) => Object.keys(c.kpis).some(k => k.startsWith('vendor_mis_') && k.endsWith('_num_vendors') && c.kpis[k]?.trim() !== '' && c.kpis[k] !== '0' && c.kpis[k]?.trim().toLowerCase() !== 'na' && c.kpis[k]?.trim().toLowerCase() !== 'n/a'),
                msmeSupplierDependencyRatio: (c) => !!(c.kpis['msme_supplier_percentage']?.trim()),
                deiCompliantVendorPct: (c) => Object.keys(c.kpis).some(k => k.startsWith('vendor_mis_') && k.endsWith('_num_vendors') && c.kpis[k]?.trim() !== '' && c.kpis[k] !== '0' && c.kpis[k]?.trim().toLowerCase() !== 'na' && c.kpis[k]?.trim().toLowerCase() !== 'n/a'),
                smallVsLargeVendorMix: (c) => Object.keys(c.kpis).some(k => k.startsWith('vendor_mis_') && k.endsWith('_num_vendors') && c.kpis[k]?.trim() !== '' && c.kpis[k] !== '0' && c.kpis[k]?.trim().toLowerCase() !== 'na' && c.kpis[k]?.trim().toLowerCase() !== 'n/a'),
              };
              const graphRelCheck = graphRelevanceCheckMap[metric.key as string];

              if (graphMode === 'timeline' && hasTimelineData) {
                // Special handling for plasticReductionPct in timeline mode:
                // Show per-quarter plastic intensity instead of the cross-quarter reduction %
                if (metric.key === 'plasticReductionPct') {
                  const parseNum2 = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
                  const getPlasticIntensity = (c: CompanyRawMetrics) => {
                    const plasticVirgin = parseNum2(c.kpis['food_pkg_basic_primary_breakup_primary_plastic_virgin'])
                      + parseNum2(c.kpis['food_pkg_detailed_secondary_breakup_secondary_plastic_virgin'])
                      + parseNum2(c.kpis['fashion_primary_pkg_plastic_recyclable_mt'])
                      + parseNum2(c.kpis['fashion_primary_pkg_plastic_non_recyclable_mt'])
                      + parseNum2(c.kpis['fashion_warehouse_pkg_plastic_recyclable_mt'])
                      + parseNum2(c.kpis['fashion_warehouse_pkg_plastic_non_recyclable_mt'])
                      + parseNum2(c.kpis['fashion_secondary_pkg_plastic_recyclable_mt'])
                      + parseNum2(c.kpis['fashion_secondary_pkg_plastic_non_recyclable_mt']);
                    const revenue = parseNum2(c.kpis['net_revenue']);
                    return revenue > 0 ? plasticVirgin / revenue : 0;
                  };
                  const qrts = ['Q1', 'Q2', 'Q3', 'Q4'];
                  const qAvgs: { quarter: string; value: number; n: number }[] = [];
                  const cMap = new Map<string, { brand: string; companyName: string; industry: string; companyId: string; Q1: number; Q2: number; Q3: number; Q4: number; avg: number }>();

                  qrts.forEach(q => {
                    const qData = quarterlyPerQuarterRawData![q] || [];
                    const relevantData = isSingleCompany ? qData.filter(c => c.companyId === filters.companyId) : qData;
                    const vals: number[] = [];
                    relevantData.forEach(c => {
                      const intensity = getPlasticIntensity(c);
                      if (intensity === 0) return;
                      vals.push(r2(intensity * 100));
                      if (!cMap.has(c.companyId)) {
                        cMap.set(c.companyId, { brand: c.brand, companyName: c.companyName, industry: c.industry, companyId: c.companyId, Q1: 0, Q2: 0, Q3: 0, Q4: 0, avg: 0 });
                      }
                      const entry = cMap.get(c.companyId)!;
                      (entry as any)[q] = r2(intensity * 100);
                    });
                    const avg = vals.length > 0 ? r2(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
                    qAvgs.push({ quarter: q, value: avg, n: vals.length });
                  });

                  const allTlCompanies = Array.from(cMap.values()).map(c => {
                    const vals = [c.Q1, c.Q2, c.Q3, c.Q4].filter(v => v !== 0);
                    c.avg = vals.length > 0 ? r2(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
                    return c;
                  }).filter(c => c.avg !== 0).sort((a, b) => b.avg - a.avg);

                  const hasData2 = qAvgs.some(q => q.value !== 0);
                  if (!hasData2) return null;

                  const totalN2 = allTlCompanies.length;
                  const tlCompanyData = allTlCompanies.map(c => ({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: c.avg.toFixed(2), q1: c.Q1 ? c.Q1.toFixed(2) : '', q2: c.Q2 ? c.Q2.toFixed(2) : '', q3: c.Q3 ? c.Q3.toFixed(2) : '', q4: c.Q4 ? c.Q4.toFixed(2) : '' }));

                  return (
                    <Card key={metric.key} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleCardClick('Plastic Intensity (per quarter)', tlCompanyData, true, { hasQuarterlyColumns: true, sourceInsightKey: metric.key })}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            {metric.label}
                          </CardTitle>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="text-[10px]">n={totalN2}</Badge>
                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{isSingleCompany ? 'Company quarterly plastic intensity' : 'Portfolio avg plastic intensity (MT/₹Cr × 100) across quarters'}</p>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={qAvgs} margin={{ left: 20, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toFixed(2), 'Avg Intensity']} />
                            <Bar dataKey="value" name="Avg Intensity" radius={[4, 4, 0, 0]}>
                              {qAvgs.map((entry, i) => (
                                <Cell key={i} fill={(QUARTER_COLORS as any)[entry.quarter] || COLORS[i % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  );
                }

                // Special timeline rendering for recycledContentRatio: company-wise grouped bar per quarter
                if (metric.key === 'recycledContentRatio' && quarterlyPerQuarterRawData) {
                  const qrts = ['Q1', 'Q2', 'Q3', 'Q4'];
                  // Build per-company per-quarter plastic data
                  const companyQMap = new Map<string, { brand: string; companyName: string; industry: string; quarters: Record<string, { primaryRecycled: number; secondaryRecycled: number; totalPlastic: number }> }>();
                  qrts.forEach(q => {
                    const qData = quarterlyPerQuarterRawData![q] || [];
                    const relevantData = isSingleCompany ? qData.filter(c => c.companyId === filters.companyId) : qData;
                    relevantData.forEach(c => {
                      if (!Object.keys(c.kpis).some(k => k.startsWith('food_pkg_') || k.startsWith('fashion_primary_pkg_') || k.startsWith('fashion_secondary_pkg_') || k.startsWith('fashion_warehouse_pkg_'))) return;
                      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
                      const primaryRecycled = p('food_pkg_basic_primary_breakup_primary_plastic_recycled');
                      const secondaryRecycled = p('food_pkg_detailed_secondary_breakup_secondary_plastic_recycled');
                      const totalPlastic = p('food_pkg_basic_primary_breakup_primary_plastic_virgin') + p('food_pkg_basic_primary_breakup_primary_plastic_recycled')
                        + p('food_pkg_detailed_secondary_breakup_secondary_plastic_virgin') + p('food_pkg_detailed_secondary_breakup_secondary_plastic_recycled')
                        + p('fashion_primary_pkg_plastic_recyclable_mt') + p('fashion_primary_pkg_plastic_non_recyclable_mt')
                        + p('fashion_secondary_pkg_plastic_recyclable_mt') + p('fashion_secondary_pkg_plastic_non_recyclable_mt')
                        + p('fashion_warehouse_pkg_plastic_recyclable_mt') + p('fashion_warehouse_pkg_plastic_non_recyclable_mt');
                      if (totalPlastic <= 0) return;
                      if (!companyQMap.has(c.companyId)) companyQMap.set(c.companyId, { brand: c.brand, companyName: c.companyName, industry: c.industry, quarters: {} });
                      const entry = companyQMap.get(c.companyId)!;
                      entry.quarters[q] = { primaryRecycled: r2(primaryRecycled), secondaryRecycled: r2(secondaryRecycled), totalPlastic: r2(totalPlastic) };
                    });
                  });
                  // Build quarterly chart data with per-company values
                  const companies = Array.from(companyQMap.values()).sort((a, b) => a.brand.localeCompare(b.brand));
                  const qChartData = qrts.map(q => {
                    const entry: any = { quarter: q };
                    companies.forEach(comp => {
                      const d = comp.quarters[q];
                      entry[`${comp.brand} Primary Recycled`] = d ? d.primaryRecycled : 0;
                      entry[`${comp.brand} Secondary Recycled`] = d ? d.secondaryRecycled : 0;
                      entry[`${comp.brand} Total Plastic`] = d ? d.totalPlastic : 0;
                    });
                    return entry;
                  });
                  const hasData3 = companies.length > 0;
                  if (!hasData3) return null;
                  // Build company data for detail view
                  const tlCompanies3 = companies.map(c => {
                    const qVals = qrts.map(q => {
                      const d = c.quarters[q];
                      if (!d) return 0;
                      return d.totalPlastic > 0 ? r2(((d.primaryRecycled + d.secondaryRecycled) / d.totalPlastic) * 100) : 0;
                    });
                    const nonZero = qVals.filter(v => v !== 0);
                    const avg = nonZero.length > 0 ? r2(nonZero.reduce((s, v) => s + v, 0) / nonZero.length) : 0;
                    return { brand: c.brand, companyName: c.companyName, industry: c.industry, value: avg.toFixed(2), q1: qVals[0] ? qVals[0].toFixed(2) : '', q2: qVals[1] ? qVals[1].toFixed(2) : '', q3: qVals[2] ? qVals[2].toFixed(2) : '', q4: qVals[3] ? qVals[3].toFixed(2) : '' };
                  }).filter(c => c.value !== '0.00');

                  // For timeline, show stacked Primary & Secondary Plastic Recycled per quarter
                  const summaryData = qrts.map(q => {
                    let priTotal = 0, secTotal = 0, totalP = 0;
                    companies.forEach(comp => {
                      const d = comp.quarters[q];
                      if (d) { priTotal += d.primaryRecycled; secTotal += d.secondaryRecycled; totalP += d.totalPlastic; }
                    });
                    const virgin = r2(Math.max(0, totalP - priTotal - secTotal));
                    return { quarter: q, 'Primary Plastic Recycled (MT)': r2(priTotal), 'Secondary Plastic Recycled (MT)': r2(secTotal), '_virginPlastic': virgin, 'Total Plastic (MT)': r2(totalP) };
                  });
                  const hasTimelineData = summaryData.some(d => d['Primary Plastic Recycled (MT)'] > 0 || d['Secondary Plastic Recycled (MT)'] > 0 || d['Total Plastic (MT)'] > 0);
                  if (!hasTimelineData) return null;

                  const TLStackedLabel = (props: any) => {
                    const { x, y, width, height, value, dataKey } = props;
                    if (!value || value === 0 || height < 12) return null;
                    const displayValue = dataKey === '_virginPlastic' ? r2(props.payload?.['Total Plastic (MT)'] ?? value) : r2(value);
                    return (
                      <text x={x + width / 2} y={y + height / 2} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                        {displayValue}
                      </text>
                    );
                  };

                  return (
                    <Card key={metric.key} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleCardClick(metric.label, tlCompanies3, true, { hasQuarterlyColumns: true, sourceInsightKey: metric.key })}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Recycled Content Ratio — Quarterly Trend</CardTitle>
                          <Badge variant="secondary" className="text-[10px]">n={tlCompanies3.length}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Primary Plastic Recycled (MT), Secondary Plastic Recycled (MT) & Total Plastic (MT) per quarter</p>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart data={summaryData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }} barSize={48}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="quarter" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} label={{ value: 'MT', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string, _props: any) => {
                              if (name === '_virginPlastic') {
                                const total = _props?.payload?.['Total Plastic (MT)'] ?? v;
                                return [`${r2(total)} MT`, 'Total Plastic (MT)'];
                              }
                              return [`${r2(v)} MT`, name];
                            }} />
                            <Legend verticalAlign="top" height={36} formatter={(value) => <span className="text-[10px]">{value === '_virginPlastic' ? 'Total Plastic (MT)' : value}</span>} />
                            <Bar dataKey="Primary Plastic Recycled (MT)" stackId="a" fill="hsl(160, 84%, 39%)" radius={[0, 0, 0, 0]} label={<TLStackedLabel />} />
                            <Bar dataKey="Secondary Plastic Recycled (MT)" stackId="a" fill="hsl(200, 40%, 55%)" radius={[0, 0, 0, 0]} label={<TLStackedLabel />} />
                            <Bar dataKey="_virginPlastic" name="_virginPlastic" stackId="a" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} label={<TLStackedLabel />} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  );
                }

                // Timeline mode: show quarterly values
                const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
                const quarterlyAvgs: { quarter: string; value: number; n: number }[] = [];
                const companyMap = new Map<string, { brand: string; companyName: string; industry: string; companyId: string; Q1: number; Q2: number; Q3: number; Q4: number; avg: number }>();

                quarters.forEach(q => {
                  const qData = quarterlyPerQuarterRawData![q] || [];
                  // If single company selected, filter to just that company
                  const relevantData = isSingleCompany ? qData.filter(c => c.companyId === filters.companyId) : qData;
                  const vals: number[] = [];
                  relevantData.forEach(c => {
                    if (graphRelCheck && !graphRelCheck(c)) return;
                    const val = c.insights[metric.key] as number;
                    if (val === undefined || val === null || isNaN(val)) return;
                    vals.push(val);
                    if (!companyMap.has(c.companyId)) {
                      companyMap.set(c.companyId, { brand: c.brand, companyName: c.companyName, industry: c.industry, companyId: c.companyId, Q1: 0, Q2: 0, Q3: 0, Q4: 0, avg: 0 });
                    }
                    const entry = companyMap.get(c.companyId)!;
                    (entry as any)[q] = r2(val);
                  });
                  const avg = vals.length > 0 ? r2(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
                  quarterlyAvgs.push({ quarter: q, value: avg, n: vals.length });
                });

                // Calculate per-company averages for the detail table
                const allTimelineCompanies = Array.from(companyMap.values()).map(c => {
                  const vals = [c.Q1, c.Q2, c.Q3, c.Q4].filter(v => v !== 0);
                  c.avg = vals.length > 0 ? r2(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
                  return c;
                }).filter(c => c.avg !== 0).sort((a, b) => b.avg - a.avg);

                const hasData = quarterlyAvgs.some(q => q.value !== 0);
                if (!hasData) return null;

                const totalN = allTimelineCompanies.length;
                // Build company-level data for click-through with Q1-Q4 columns (skip for CSR Spend Ratio)
                const timelineCompanyData = allTimelineCompanies.map(c => ({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: c.avg.toFixed(2), ...((metric.key !== 'csrSpendRatio') && { q1: c.Q1 ? c.Q1.toFixed(2) : '', q2: c.Q2 ? c.Q2.toFixed(2) : '', q3: c.Q3 ? c.Q3.toFixed(2) : '', q4: c.Q4 ? c.Q4.toFixed(2) : '' }) }));
                const isPctMetric = metric.unit === '%' || metric.unit.includes('ratio') || metric.unit.includes('/100');

                return (
                  <Card key={metric.key} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleCardClick(metric.label, timelineCompanyData, isPctMetric, { hasQuarterlyColumns: metric.key !== 'csrSpendRatio', sourceInsightKey: metric.key })}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          {metric.label}
                        </CardTitle>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="text-[10px]">n={totalN}</Badge>
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{isSingleCompany ? 'Company quarterly values' : 'Portfolio average across quarters'}</p>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={quarterlyAvgs} margin={{ left: 20, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v: number) => metric.unit === '%' ? `${Math.round(v)}%` : String(Math.round(v))} domain={metric.unit === '%' ? [0, 100] : undefined} ticks={metric.unit === '%' ? [0, 25, 50, 75, 100] : undefined} allowDecimals={false} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v, metric.unit), 'Avg']} />
                          <Bar dataKey="value" name="Avg" radius={[4, 4, 0, 0]}>
                            {quarterlyAvgs.map((entry, i) => (
                              <Cell key={i} fill={(QUARTER_COLORS as any)[entry.quarter] || COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                );
              }

              // Consolidated mode (default): top 10 companies
              // Special handling for plasticReductionPct which uses cross-quarter data
              if (metric.key === 'plasticReductionPct' && plasticReductionData) {
                console.log('plasticReductionData :: ',plasticReductionData)
                const sorted = [...plasticReductionData.companies].sort((a, b) => b.numValue - a.numValue);
                if (!isSingleCompany && sorted.length < 2) return null;
                const chartData = sorted.slice(0, topN);
                return (
                  <Card key={metric.key} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => { const allHeaders = new Set<string>(); plasticReductionData.companies.forEach(c => { if (c.ratioColumns) Object.keys(c.ratioColumns).forEach(h => allHeaders.add(h)); }); handleCardClick(metric.label, plasticReductionData.companies.map(c => ({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: c.value, ratioColumns: c.ratioColumns })), true, { ratioColumnHeaders: Array.from(allHeaders), sourceInsightKey: metric.key }); }}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          {metric.label}
                        </CardTitle>
                        <Badge variant="secondary" className="text-[10px]">{sorted.length > topN ? `Top ${topN} of ` : ''}n={sorted.length}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Q1 Plastic Intensity − Q4 Plastic Intensity (% change)</p>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 32)}>
                        <BarChart data={chartData} layout="vertical" margin={{ left: 100, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis type="category" dataKey="brand" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} width={90} interval={0} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v, '%'), metric.label]} />
                          <Bar dataKey="numValue" name={metric.label} radius={[0, 4, 4, 0]}>
                            {chartData.map((entry: any, i: number) => (
                              <Cell key={i} fill={entry.numValue >= 0 ? 'hsl(160, 84%, 39%)' : 'hsl(0, 72%, 51%)'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                );
              }

              // Skip plasticReductionPct if no cross-quarter data
              if (metric.key === 'plasticReductionPct' && !plasticReductionData) return null;

              // graphRelCheck already defined at the top of the map callback

              const allCompanyData = companyRawData
                .map(c => {
                  let val = c.insights[metric.key] as number;
                  if (metric.key === 'csrSpendRatio' && csrRevenueMap) {
                    const csrSpend = parseFloat(c.kpis['csr_amount_spent'] || '0') || 0;
                    const totalRev = csrRevenueMap.get(c.companyId) || 0;
                    val = totalRev > 0 ? Math.round((csrSpend / (totalRev * 1e7)) * 100 * 10000) / 10000 : 0;
                  }
                  if (metric.key === 'jobsPerCrRevenue' && jobsPerCrQuarterlyMap) {
                    val = jobsPerCrQuarterlyMap.get(c.companyId) ?? val;
                  }
                  if (metric.key === 'genderPayParityIndex' && payParityQuarterlyMap) {
                    val = payParityQuarterlyMap.get(c.companyId) ?? val;
                  }
                  if (metric.key === 'cxoPayRatio' && cxoPayRatioQuarterlyMap) {
                    val = cxoPayRatioQuarterlyMap.get(c.companyId) ?? val;
                  }
                  return { brand: c.brand, companyName: c.companyName, industry: c.industry, companyId: c.companyId, value: val, hasData: Object.keys(c.kpis).length > 0, rawData: c };
                })
                .filter(c => {
                  if (!c.hasData || c.value === undefined || c.value === null || isNaN(c.value)) return false;
                  if (graphRelCheck && !graphRelCheck(c.rawData)) return false;
                  return true;
                })
                .sort((a, b) => b.value - a.value);
              if (!isSingleCompany && allCompanyData.length < 2) return null;
              const metricTopN = getTopN(metric.key);
              const chartData = allCompanyData.slice(0, metricTopN);

              // Build consolidated click-through handler (shared between chart types)
              const onConsolidatedClick = () => {
                const isPctMetric = metric.unit === '%' || metric.unit.includes('ratio') || metric.unit.includes('/100');
                const ratioConfig = RATIO_COMPONENT_COLUMNS[metric.key as string];
                const revenueByCompany = csrRevenueMap;
                const consolidatedData = companyRawData
                  .filter(c => {
                    if (Object.keys(c.kpis).length === 0) return false;
                    if (graphRelCheck && !graphRelCheck(c)) return false;
                    if (graphRelCheck && !graphRelCheck(c)) return false;
                    let val = c.insights[metric.key] as number;
                    if (metric.key === 'csrSpendRatio' && revenueByCompany) {
                      const csrSpend = parseFloat(c.kpis['csr_amount_spent'] || '0') || 0;
                      const totalRev = revenueByCompany.get(c.companyId) || 0;
                      val = totalRev > 0 ? (csrSpend / (totalRev * 1e7)) * 100 : 0;
                    }
                    return val !== undefined && val !== null && !isNaN(val);
                  })
                  .map(c => {
                    let val = c.insights[metric.key] as number;
                    if (metric.key === 'csrSpendRatio' && revenueByCompany) {
                      const csrSpend = parseFloat(c.kpis['csr_amount_spent'] || '0') || 0;
                      const totalRev = revenueByCompany.get(c.companyId) || 0;
                      val = totalRev > 0 ? Math.round((csrSpend / (totalRev * 1e7)) * 100 * 10000) / 10000 : 0;
                    }
                    if (metric.key === 'jobsPerCrRevenue' && jobsPerCrQuarterlyMap) {
                      val = jobsPerCrQuarterlyMap.get(c.companyId) ?? val;
                    }
                    if (metric.key === 'genderPayParityIndex' && payParityQuarterlyMap) {
                      val = payParityQuarterlyMap.get(c.companyId) ?? val;
                    }
                    if (metric.key === 'cxoPayRatio' && cxoPayRatioQuarterlyMap) {
                      val = cxoPayRatioQuarterlyMap.get(c.companyId) ?? val;
                    }
                    const row: any = { brand: c.brand, companyName: c.companyName, industry: c.industry, value: val.toFixed(4) };
                    // Add quarterly columns for sourcing metrics (skip for CSR Spend Ratio)
                    if (quarterlyPerQuarterRawData && metric.key !== 'csrSpendRatio') {
                      ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
                        const qData = quarterlyPerQuarterRawData[q] || [];
                        const qCompany = qData.find(qc => qc.companyId === c.companyId);
                        const qVal = qCompany?.insights[metric.key] as number;
                        row[q.toLowerCase()] = qVal !== undefined && !isNaN(qVal) ? qVal.toFixed(2) : '';
                      });
                    }
                    if (ratioConfig) {
                      if (metric.key === 'csrSpendRatio' && revenueByCompany) {
                        const enrichedC = { kpis: { ...c.kpis, net_revenue: String(revenueByCompany.get(c.companyId) || 0) } };
                        row.ratioColumns = ratioConfig.getValues(enrichedC);
                      } else if (metric.key === 'jobsPerCrRevenue' && quarterlyPerQuarterRawData) {
                        // Total Employees = average of Q1-Q4 headcount; Net Revenue = sum of Q1-Q4
                        const pn = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
                        const empKeys = ['employees_wc_male_fulltime', 'employees_wc_male_contractual', 'employees_wc_male_parttime', 'employees_wc_female_fulltime', 'employees_wc_female_contractual', 'employees_wc_female_parttime', 'employees_bc_male_fulltime', 'employees_bc_male_contractual', 'employees_bc_male_parttime', 'employees_bc_female_fulltime', 'employees_bc_female_contractual', 'employees_bc_female_parttime'];
                        const qEmpTotals: number[] = [];
                        let qRevSum = 0;
                        ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
                          const qc = (quarterlyPerQuarterRawData[q] || []).find(x => x.companyId === c.companyId);
                          if (qc) {
                            const qEmp = empKeys.reduce((s, k) => s + pn(qc.kpis[k]), 0);
                            if (qEmp > 0) qEmpTotals.push(qEmp);
                            qRevSum += pn(qc.kpis['net_revenue']);
                          }
                        });
                        const avgEmp = qEmpTotals.length > 0 ? Math.round(qEmpTotals.reduce((a, b) => a + b, 0) / qEmpTotals.length) : 0;
                        row.ratioColumns = { 'Total Employees': String(avgEmp), 'Net Revenue (₹ Cr)': String(Math.round(qRevSum * 100) / 100) };
                      } else if (metric.key === 'genderPayParityIndex' && quarterlyPerQuarterRawData) {
                        // Use quarterly reconstruction: wages summed, counts averaged
                        const pn = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
                        let fWS = 0, mWS = 0; const fCs: number[] = [], mCs: number[] = [];
                        ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
                          const qc = (quarterlyPerQuarterRawData[q] || []).find(x => x.companyId === c.companyId);
                          if (qc) {
                            fWS += pn(qc.kpis['employees_wc_wages_female']) + pn(qc.kpis['employees_bc_wages_female']);
                            mWS += pn(qc.kpis['employees_wc_wages_male']) + pn(qc.kpis['employees_bc_wages_male']);
                            const fc = pn(qc.kpis['employees_wc_female_fulltime']) + pn(qc.kpis['employees_wc_female_contractual']) + pn(qc.kpis['employees_wc_female_parttime']) + pn(qc.kpis['employees_bc_female_fulltime']) + pn(qc.kpis['employees_bc_female_contractual']) + pn(qc.kpis['employees_bc_female_parttime']);
                            const mc = pn(qc.kpis['employees_wc_male_fulltime']) + pn(qc.kpis['employees_wc_male_contractual']) + pn(qc.kpis['employees_wc_male_parttime']) + pn(qc.kpis['employees_bc_male_fulltime']) + pn(qc.kpis['employees_bc_male_contractual']) + pn(qc.kpis['employees_bc_male_parttime']);
                            if (fc > 0) fCs.push(fc); if (mc > 0) mCs.push(mc);
                          }
                        });
                        row.ratioColumns = {
                          'Female Wages': String(Math.round(fWS * 100) / 100),
                          'Female Count': String(fCs.length > 0 ? Math.round(fCs.reduce((a, b) => a + b, 0) / fCs.length) : 0),
                          'Male Wages': String(Math.round(mWS * 100) / 100),
                          'Male Count': String(mCs.length > 0 ? Math.round(mCs.reduce((a, b) => a + b, 0) / mCs.length) : 0),
                        };
                      } else if (metric.key === 'cxoPayRatio' && quarterlyPerQuarterRawData) {
                        // CXO Pay Ratio ratio columns: Avg CXO Comp per CXO, Avg WC Employee Comp
                        const pn = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
                        let cxoCompSum = 0;
                        const execCounts: number[] = [];
                        const wcEmpComps: number[] = [];
                        ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
                          const qc = (quarterlyPerQuarterRawData[q] || []).find(x => x.companyId === c.companyId);
                          if (qc) {
                            cxoCompSum += pn(qc.kpis['leadership_avg_cxo_compensation']);
                            const execs = pn(qc.kpis['leadership_clevel_total']);
                            if (execs > 0) execCounts.push(execs);
                            const wcEmp = pn(qc.kpis['employees_wc_male_fulltime']) + pn(qc.kpis['employees_wc_male_contractual']) + pn(qc.kpis['employees_wc_male_parttime']) +
                              pn(qc.kpis['employees_wc_female_fulltime']) + pn(qc.kpis['employees_wc_female_contractual']) + pn(qc.kpis['employees_wc_female_parttime']);
                            const wcWages = pn(qc.kpis['employees_wc_wages_male']) + pn(qc.kpis['employees_wc_wages_female']);
                            if (wcEmp > 0) wcEmpComps.push(wcWages / wcEmp);
                          }
                        });
                        const avgExecs = execCounts.length > 0 ? Math.round(execCounts.reduce((a, b) => a + b, 0) / execCounts.length) : 0;
                        const avgCxoPerCxo = cxoCompSum > 0 && avgExecs > 0 ? cxoCompSum / avgExecs : 0;
                        const avgWcEmpComp = wcEmpComps.length > 0 ? wcEmpComps.reduce((a, b) => a + b, 0) / wcEmpComps.length : 0;
                        row.ratioColumns = {
                          'Avg CXO Comp per CXO (INR Cr)': String(Math.round(avgCxoPerCxo * 100) / 100),
                          'Avg WC Employee Comp (INR Cr)': String(Math.round(avgWcEmpComp * 100) / 100),
                        };
                      } else {
                        row.ratioColumns = ratioConfig.getValues(c);
                      }
                    }
                    return row;
                  });
                const extra: any = { sourceInsightKey: metric.key, unit: metric.unit };
                if (quarterlyPerQuarterRawData && metric.key !== 'csrSpendRatio') extra.hasQuarterlyColumns = true;
                if (ratioConfig) extra.ratioColumnHeaders = ratioConfig.headers;
                handleCardClick(metric.label, consolidatedData, isPctMetric, extra);
              };

              // DEI-Compliant Vendor % — render as pie chart
              if (metric.key === 'deiCompliantVendorPct') {
                const VENDOR_CATS_PIE = ['input_materials', 'manufacturing', 'packaging', 'logistics_warehousing', 'stores_clinics'];
                let totalDeiCats = 0, totalNonDeiCats = 0;
                companyRawData.forEach(c => {
                  VENDOR_CATS_PIE.forEach(cat => {
                    const numV = c.kpis[`vendor_mis_${cat}_num_vendors`];
                    if (!numV || !numV.trim() || numV === '0' || numV.toLowerCase() === 'n/a') return;
                    const deiRaw = c.kpis[`vendor_mis_${cat}_dei_factors`] || '';
                    let hasDei = false;
                    try { const parsed = JSON.parse(deiRaw); if (Array.isArray(parsed) && parsed.length > 0) hasDei = true; } catch { if (deiRaw.trim()) hasDei = true; }
                    if (hasDei) totalDeiCats++; else totalNonDeiCats++;
                  });
                });
                const pieData = [
                  { name: 'DEI-Compliant', value: totalDeiCats, color: 'hsl(160, 84%, 39%)' },
                  { name: 'Non-DEI', value: totalNonDeiCats, color: 'hsl(38, 92%, 50%)' },
                ].filter(d => d.value > 0);
                if (pieData.length === 0) return null;
                return (
                  <Card key={metric.key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={onConsolidatedClick}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />{metric.label}</CardTitle>
                        <Badge variant="secondary" className="text-[10px]">n={allCompanyData.length}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, percent, cx, cy, midAngle, outerRadius: oR }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = (oR || 90) + 18;
                            const x = (cx || 0) + radius * Math.cos(-midAngle * RADIAN);
                            const y = (cy || 0) + radius * Math.sin(-midAngle * RADIAN);
                            return <text x={x} y={y} textAnchor={x > (cx || 0) ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fill="hsl(var(--foreground))">{name} {(percent * 100).toFixed(0)}%</text>;
                          }}>
                            {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [v, name]} />
                          <Legend verticalAlign="bottom" height={30} formatter={(value) => <span className="text-xs">{value}</span>} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                );
              }

              // ── Single company comparison: company vs industry avg vs portfolio avg ──
              if (isSingleCompany && allCompanyRawData && allCompanyRawData.length > 0) {
                const companyEntry = allCompanyData[0];
                if (!companyEntry) return null;
                const companyValue = companyEntry.value;
                const companyIndustry = companyEntry.industry;

                // Compute values for all companies in the portfolio using same logic
                const getMetricValue = (c: CompanyRawMetrics): number | null => {
                  let val = c.insights[metric.key] as number;
                  if (metric.key === 'csrSpendRatio' && csrRevenueMap) {
                    const csrSpend = parseFloat(c.kpis['csr_amount_spent'] || '0') || 0;
                    const totalRev = csrRevenueMap.get(c.companyId) || 0;
                    val = totalRev > 0 ? Math.round((csrSpend / (totalRev * 1e7)) * 100 * 10000) / 10000 : 0;
                  }
                  if (val === undefined || val === null || isNaN(val)) return null;
                  if (Object.keys(c.kpis).length === 0) return null;
                  if (graphRelCheck && !graphRelCheck(c)) return null;
                  return val;
                };

                // Industry average
                const industryCompanies = allCompanyRawData.filter(c => c.industry === companyIndustry);
                const industryVals = industryCompanies.map(c => getMetricValue(c)).filter((v): v is number => v !== null);
                const industryAvg = industryVals.length > 0 ? r2(industryVals.reduce((s, v) => s + v, 0) / industryVals.length) : 0;

                // Portfolio average
                const allVals = allCompanyRawData.map(c => getMetricValue(c)).filter((v): v is number => v !== null);
                const portfolioAvg = allVals.length > 0 ? r2(allVals.reduce((s, v) => s + v, 0) / allVals.length) : 0;

                const comparisonData = [
                  { name: companyEntry.brand, value: r2(companyValue), fill: 'hsl(217, 91%, 60%)' },
                  { name: `${companyIndustry} Avg`, value: industryAvg, fill: 'hsl(38, 92%, 50%)' },
                  { name: 'Portfolio Avg', value: portfolioAvg, fill: 'hsl(160, 84%, 39%)' },
                ];

                return (
                  <Card key={metric.key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={onConsolidatedClick}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          {metric.label}
                        </CardTitle>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px]">vs Industry & Portfolio</Badge>
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {companyEntry.brand} vs {companyIndustry} avg (n={industryVals.length}) vs Portfolio avg (n={allVals.length})
                      </p>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={comparisonData} margin={{ left: 10, right: 10, top: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval={0} />
                          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v < 0.01 && v > 0 ? `${v.toFixed(4)}${metric.unit}` : fmt(v, metric.unit), metric.label]} />
                          <Bar dataKey="value" name={metric.label} radius={[4, 4, 0, 0]}>
                            {comparisonData.map((entry, i) => (
                              <Cell key={i} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                );
              }

              // Special rendering for recycledContentRatio: horizontal stacked bar showing Primary & Secondary Recycled %
              if (metric.key === 'recycledContentRatio') {
                const companyPlasticData: { brand: string; companyName: string; industry: string; 'Primary Recycled (%)': number; 'Secondary Recycled (%)': number; 'Remaining (%)': number; value: number }[] = [];
                companyRawData.forEach(c => {
                  if (!Object.keys(c.kpis).some(k => k.startsWith('food_pkg_') || k.startsWith('fashion_primary_pkg_') || k.startsWith('fashion_secondary_pkg_') || k.startsWith('fashion_warehouse_pkg_'))) return;
                  const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
                  const primaryRecycled = p('food_pkg_basic_primary_breakup_primary_plastic_recycled');
                  const secondaryRecycled = p('food_pkg_detailed_secondary_breakup_secondary_plastic_recycled');
                  const totalPlastic = p('food_pkg_basic_primary_breakup_primary_plastic_virgin') + p('food_pkg_basic_primary_breakup_primary_plastic_recycled')
                    + p('food_pkg_detailed_secondary_breakup_secondary_plastic_virgin') + p('food_pkg_detailed_secondary_breakup_secondary_plastic_recycled')
                    + p('fashion_primary_pkg_plastic_recyclable_mt') + p('fashion_primary_pkg_plastic_non_recyclable_mt')
                    + p('fashion_secondary_pkg_plastic_recyclable_mt') + p('fashion_secondary_pkg_plastic_non_recyclable_mt')
                    + p('fashion_warehouse_pkg_plastic_recyclable_mt') + p('fashion_warehouse_pkg_plastic_non_recyclable_mt');
                  if (totalPlastic <= 0 && primaryRecycled <= 0 && secondaryRecycled <= 0) return;
                  const priPct = totalPlastic > 0 ? r2((primaryRecycled / totalPlastic) * 100) : 0;
                  const secPct = totalPlastic > 0 ? r2((secondaryRecycled / totalPlastic) * 100) : 0;
                  const remaining = r2(Math.max(0, 100 - priPct - secPct));
                  const ratio = priPct + secPct;
                  companyPlasticData.push({
                    brand: c.brand,
                    companyName: c.companyName,
                    industry: c.industry,
                    'Primary Recycled (%)': priPct,
                    'Secondary Recycled (%)': secPct,
                    'Remaining (%)': remaining,
                    value: ratio,
                  });
                });
                companyPlasticData.sort((a, b) => b.value - a.value);
                if (companyPlasticData.length === 0) return null;
                const chartData = companyPlasticData.slice(0, topN);

                return (
                  <Card key={metric.key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={onConsolidatedClick}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Recycled Content Ratio — Plastic Breakdown by Company</CardTitle>
                        <Badge variant="secondary" className="text-[10px]">{companyPlasticData.length > topN ? `Top ${topN} of ` : ''}n={companyPlasticData.length}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Primary Plastic Recycled (%) & Secondary Plastic Recycled (%) per company</p>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 32)}>
                        <BarChart data={chartData} layout="vertical" margin={{ left: 100, right: 10 }} barSize={20}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v: number) => `${Math.round(v)}%`} />
                          <YAxis type="category" dataKey="brand" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} width={90} interval={0} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]} />
                          <Legend verticalAlign="top" height={36} formatter={(value) => <span className="text-[10px]">{value}</span>} />
                          <Bar dataKey="Primary Recycled (%)" stackId="a" fill="hsl(160, 84%, 39%)" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="Secondary Recycled (%)" stackId="a" fill="hsl(200, 40%, 55%)" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="Remaining (%)" stackId="a" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                );
              }

              // CSR Spend Ratio: use reduced scale with 4-decimal tick formatting
              // Special rendering for recyclableVsNonRecyclablePrimary: 100% stacked horizontal bar
              if (metric.key === 'recyclableVsNonRecyclablePrimary') {
                const parseNum2 = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
                const recyclableData: { brand: string; 'Recyclable (%)': number; 'Non-Recyclable (%)': number }[] = [];
                companyRawData.forEach(c => {
                  let recyclable = parseNum2(c.kpis['food_pkg_basic_primary_recyclability_primary_mono_materials']);
                  let hasData = !!c.kpis['food_pkg_basic_primary_recyclability_primary_mono_materials']?.trim();
                  if (!hasData) {
                    const fashPriKeys = ['cardboard', 'paper', 'plastic_recyclable', 'plastic_non_recyclable', 'fabric', 'other'];
                    const total = fashPriKeys.reduce((s, k2) => s + parseNum2(c.kpis[`fashion_primary_pkg_${k2}_mt`]), 0);
                    if (total > 0) {
                      const rec = parseNum2(c.kpis['fashion_primary_pkg_plastic_recyclable_mt']) + parseNum2(c.kpis['fashion_primary_pkg_cardboard_mt']) + parseNum2(c.kpis['fashion_primary_pkg_paper_mt']) + parseNum2(c.kpis['fashion_primary_pkg_fabric_mt']);
                      recyclable = (rec / total) * 100; hasData = true;
                    }
                  }
                  if (!hasData) return;
                  recyclableData.push({
                    brand: c.brand,
                    'Recyclable (%)': r2(Math.min(100, recyclable)),
                    'Non-Recyclable (%)': r2(Math.max(0, 100 - recyclable)),
                  });
                });
                recyclableData.sort((a, b) => b['Recyclable (%)'] - a['Recyclable (%)']);
                if (recyclableData.length === 0) return null;
                const rChartData = recyclableData.slice(0, topN);

                return (
                  <Card key={metric.key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={onConsolidatedClick}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />{metric.label}</CardTitle>
                        <Badge variant="secondary" className="text-[10px]">{recyclableData.length > topN ? `Top ${topN} of ` : ''}n={recyclableData.length}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">100% split: Recyclable vs Non-Recyclable per company</p>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={Math.max(200, rChartData.length * 32)}>
                        <BarChart data={rChartData} layout="vertical" margin={{ left: 100, right: 10 }} barSize={20}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v: number) => `${v}%`} />
                          <YAxis type="category" dataKey="brand" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} width={90} interval={0} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]} />
                          <Legend verticalAlign="top" height={36} formatter={(value) => <span className="text-[10px]">{value}</span>} />
                          <Bar dataKey="Recyclable (%)" stackId="a" fill="hsl(160, 84%, 39%)" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="Non-Recyclable (%)" stackId="a" fill="hsl(0, 72%, 51%)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                );
              }

              const isSmallScale = metric.key === 'csrSpendRatio' && chartData.length > 0 && Math.max(...chartData.map((c: any) => c.value)) < 1;
              // CSR Spend Ratio: compact graph with reduced height
              const isCsrGraph = metric.key === 'csrSpendRatio';
              return (
                <Card key={metric.key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={onConsolidatedClick}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        {metric.label}
                      </CardTitle>
                      <Badge variant="secondary" className="text-[10px]">{allCompanyData.length > metricTopN ? `Top ${metricTopN} of ` : ''}n={allCompanyData.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={isCsrGraph ? Math.max(180, Math.min(chartData.length * 28, 320)) : Math.max(200, chartData.length * 32)}>
                      <BarChart data={chartData} layout="vertical" margin={{ left: 100, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          type="number"
                          domain={[0, isSmallScale ? 'dataMax + 0.001' : 'auto']}
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          tickFormatter={isSmallScale ? (v: number) => v.toFixed(4) : undefined}
                        />
                        <YAxis type="category" dataKey="brand" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} width={90} interval={0} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v < 0.01 && v > 0 ? `${v.toFixed(4)}${metric.unit}` : fmt(v, metric.unit), metric.label]} />
                        <Bar dataKey="value" name={metric.label} radius={[0, 4, 4, 0]}>
                          {chartData.map((_: any, i: number) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Stat cards — hidden for CSR since they're rendered alongside the graph */}
        <div className={isCsrFeature ? 'flex-[2] space-y-3' : 'grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3'}>
          {insightMetrics.map(metric => {
            // Special handling for plasticReductionPct
            if (metric.key === 'plasticReductionPct') {
              if (!plasticReductionData || plasticReductionData.n === 0) return null;
              const drillData = plasticReductionData.companies.map(c => ({ brand: c.brand, companyName: c.companyName, industry: c.industry, value: c.value, ratioColumns: c.ratioColumns }));
              return (
                <Card key={metric.key} className="hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => { const allHeaders = new Set<string>(); drillData.forEach(c => { if (c.ratioColumns) Object.keys(c.ratioColumns).forEach(h => allHeaders.add(h)); }); handleCardClick(metric.label, drillData, true, { ratioColumnHeaders: Array.from(allHeaders), sourceInsightKey: metric.key }); }}>
                  <CardContent className="pt-3 pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] text-muted-foreground leading-tight flex-1">{metric.label}</p>
                      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0" />
                    </div>
                    <p className={`text-lg font-bold ${plasticReductionData.avg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {plasticReductionData.avg >= 0 ? '↓' : '↑'} {fmt(Math.abs(plasticReductionData.avg), '%')}
                    </p>
                    <p className="text-[10px] text-muted-foreground">n={plasticReductionData.n} · Q1→Q4</p>
                  </CardContent>
                </Card>
              );
            }

            // For csrSpendRatio in annual view, per-company FY data has no net_revenue.
            // Build a revenue lookup from quarterly data to recompute per-company ratios.
            const revenueByCompany = new Map<string, number>();
            if (metric.key === 'csrSpendRatio' && quarterlyPerQuarterRawData) {
              Object.values(quarterlyPerQuarterRawData).forEach(qArr => {
                for (const qc of qArr) {
                  const rev = parseFloat(qc.kpis['net_revenue'] || '0') || 0;
                  revenueByCompany.set(qc.companyId, (revenueByCompany.get(qc.companyId) || 0) + rev);
                }
              });
            }

            // For jobsPerCrRevenue in annual view: compute from avg headcount / total revenue
            const jobsPerCrQuarterlyAvg = new Map<string, number>();
            if (metric.key === 'jobsPerCrRevenue' && quarterlyPerQuarterRawData) {
              const pnJ = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
              const empKeysJ = ['employees_wc_male_fulltime', 'employees_wc_male_contractual', 'employees_wc_male_parttime', 'employees_wc_female_fulltime', 'employees_wc_female_contractual', 'employees_wc_female_parttime', 'employees_bc_male_fulltime', 'employees_bc_male_contractual', 'employees_bc_male_parttime', 'employees_bc_female_fulltime', 'employees_bc_female_contractual', 'employees_bc_female_parttime'];
              const allIds = new Set(companyRawData.map(c => c.companyId));
              allIds.forEach(id => {
                const qEmpTotals: number[] = [];
                let qRevSum = 0;
                ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
                  const qArr = quarterlyPerQuarterRawData[q] || [];
                  const qc = qArr.find(x => x.companyId === id);
                  if (qc) {
                    const qEmp = empKeysJ.reduce((s, k) => s + pnJ(qc.kpis[k]), 0);
                    if (qEmp > 0) qEmpTotals.push(qEmp);
                    qRevSum += pnJ(qc.kpis['net_revenue']);
                  }
                });
                const avgEmp = qEmpTotals.length > 0 ? qEmpTotals.reduce((a, b) => a + b, 0) / qEmpTotals.length : 0;
                if (avgEmp > 0 && qRevSum > 0) jobsPerCrQuarterlyAvg.set(id, r2(avgEmp / qRevSum));
              });
            }

            // For genderPayParityIndex in annual view: compute formula-based value from aggregated inputs
            const payParityQuarterlyAvg = new Map<string, number>();
            if (metric.key === 'genderPayParityIndex' && quarterlyPerQuarterRawData) {
              const pn3 = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
              const allIds = new Set(companyRawData.map(c => c.companyId));
              allIds.forEach(id => {
                let fWS = 0, mWS = 0;
                const fCs: number[] = [], mCs: number[] = [];
                ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
                  const qArr = quarterlyPerQuarterRawData[q] || [];
                  const qc = qArr.find(x => x.companyId === id);
                  if (qc) {
                    fWS += pn3(qc.kpis['employees_wc_wages_female']) + pn3(qc.kpis['employees_bc_wages_female']);
                    mWS += pn3(qc.kpis['employees_wc_wages_male']) + pn3(qc.kpis['employees_bc_wages_male']);
                    const fc = pn3(qc.kpis['employees_wc_female_fulltime']) + pn3(qc.kpis['employees_wc_female_contractual']) + pn3(qc.kpis['employees_wc_female_parttime']) + pn3(qc.kpis['employees_bc_female_fulltime']) + pn3(qc.kpis['employees_bc_female_contractual']) + pn3(qc.kpis['employees_bc_female_parttime']);
                    const mc = pn3(qc.kpis['employees_wc_male_fulltime']) + pn3(qc.kpis['employees_wc_male_contractual']) + pn3(qc.kpis['employees_wc_male_parttime']) + pn3(qc.kpis['employees_bc_male_fulltime']) + pn3(qc.kpis['employees_bc_male_contractual']) + pn3(qc.kpis['employees_bc_male_parttime']);
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

            // For cxoPayRatio in annual view: compute formula-based value from aggregated inputs
            const cxoPayRatioQuarterlyAvg = new Map<string, number>();
            if (metric.key === 'cxoPayRatio' && quarterlyPerQuarterRawData) {
              const pnC = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
              const allIds = new Set(companyRawData.map(c => c.companyId));
              allIds.forEach(id => {
                const cxoPerCxoComps: number[] = [];
                const wcEmpComps: number[] = [];
                ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
                  const qArr = quarterlyPerQuarterRawData[q] || [];
                  const qc = qArr.find(x => x.companyId === id);
                  if (qc) {
                    const totalCxoComp = pnC(qc.kpis['leadership_avg_cxo_compensation']);
                    const totalExecs = pnC(qc.kpis['leadership_clevel_total']);
                    if (totalExecs > 0) cxoPerCxoComps.push(totalCxoComp / totalExecs);
                    const wcEmp = pnC(qc.kpis['employees_wc_male_fulltime']) + pnC(qc.kpis['employees_wc_male_contractual']) + pnC(qc.kpis['employees_wc_male_parttime']) +
                      pnC(qc.kpis['employees_wc_female_fulltime']) + pnC(qc.kpis['employees_wc_female_contractual']) + pnC(qc.kpis['employees_wc_female_parttime']);
                    const wcWages = pnC(qc.kpis['employees_wc_wages_male']) + pnC(qc.kpis['employees_wc_wages_female']);
                    if (wcEmp > 0) wcEmpComps.push(wcWages / wcEmp);
                  }
                });
                const avgCxoPerCxo = cxoPerCxoComps.length > 0 ? cxoPerCxoComps.reduce((a, b) => a + b, 0) / cxoPerCxoComps.length : 0;
                const avgWcEmpComp = wcEmpComps.length > 0 ? wcEmpComps.reduce((a, b) => a + b, 0) / wcEmpComps.length : 0;
                if (avgCxoPerCxo > 0 && avgWcEmpComp > 0) {
                  cxoPayRatioQuarterlyAvg.set(id, Math.round((avgCxoPerCxo / avgWcEmpComp) * 100) / 100);
                }
              });
            }

            // Relevance check: exclude companies that don't have the required KPI data
            // so they appear in "Not Considered" on the detail page
            const INSIGHT_RELEVANCE_KPIS: Record<string, (c: CompanyRawMetrics) => boolean> = {
              // Water & Energy Management
              waterRecyclingRate: (c) => Object.keys(c.kpis).some(k => k.startsWith('water_detailed_')),
              totalWaterConsumption: (c) => Object.keys(c.kpis).some(k => k.startsWith('water_detailed_')),
              totalEnergyConsumption: (c) => Object.keys(c.kpis).some(k => k.startsWith('energy_detailed_')),
              renewableEnergyMix: (c) => Object.keys(c.kpis).some(k => k.startsWith('energy_detailed_')),
              // Waste Management — match drill-down: only include companies with actual waste generated > 0
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
              eprComplianceRate: (c) => parseFloat(c.kpis['food_pkg_basic_compliance_epr_compliance_pct'] || '0') > 0,
              recyclableVsNonRecyclablePrimary: (c) => Object.keys(c.kpis).some(k => k.startsWith('food_pkg_') || k.startsWith('fashion_primary_pkg_')),
              voluntaryPlasticNeutralityRate: (c) => parseFloat(c.kpis['food_pkg_basic_compliance_voluntary_plastic_neutrality'] || '0') > 0,
              // Incidents & Grievances: exclude companies with no incident data
              caseResolutionRate: (c) => Object.keys(c.kpis).some(k => k.startsWith('incident_') && k.endsWith('_cases') && c.kpis[k]?.trim() !== '' && c.kpis[k] !== '0'),
              highImpactIncidentRatio: (c) => Object.keys(c.kpis).some(k => k.startsWith('incident_') && k.endsWith('_cases') && c.kpis[k]?.trim() !== '' && c.kpis[k] !== '0'),
              poshCaseIntensity: (c) => Object.keys(c.kpis).some(k => k.startsWith('incident_') && k.endsWith('_cases') && c.kpis[k]?.trim() !== ''),
              totalIncidentCount: (c) => Object.keys(c.kpis).some(k => k.startsWith('incident_') && k.endsWith('_cases') && c.kpis[k]?.trim() !== ''),
              // Supply chain: exclude companies with no vendor/MSME data
              msmeSupplierDependencyRatio: (c) => !!(c.kpis['msme_supplier_percentage']?.trim()),
              supplyChainLocalizationIndex: (c) => Object.keys(c.kpis).some(k => k.startsWith('vendor_mis_') && k.endsWith('_num_vendors') && c.kpis[k]?.trim() !== '' && c.kpis[k] !== '0' && c.kpis[k]?.trim().toLowerCase() !== 'na' && c.kpis[k]?.trim().toLowerCase() !== 'n/a'),
              deiCompliantVendorPct: (c) => Object.keys(c.kpis).some(k => k.startsWith('vendor_mis_') && k.endsWith('_num_vendors') && c.kpis[k]?.trim() !== '' && c.kpis[k] !== '0' && c.kpis[k]?.trim().toLowerCase() !== 'na' && c.kpis[k]?.trim().toLowerCase() !== 'n/a'),
              smallVsLargeVendorMix: (c) => Object.keys(c.kpis).some(k => k.startsWith('vendor_mis_') && k.endsWith('_num_vendors') && c.kpis[k]?.trim() !== '' && c.kpis[k] !== '0' && c.kpis[k]?.trim().toLowerCase() !== 'na' && c.kpis[k]?.trim().toLowerCase() !== 'n/a'),
              // CXO Pay Ratio: exclude companies with 0 WC Employee Comp (denominator)
              cxoPayRatio: (c) => {
                const pn = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
                const wcEmp = pn(c.kpis['employees_wc_male_fulltime']) + pn(c.kpis['employees_wc_male_contractual']) + pn(c.kpis['employees_wc_male_parttime']) +
                  pn(c.kpis['employees_wc_female_fulltime']) + pn(c.kpis['employees_wc_female_contractual']) + pn(c.kpis['employees_wc_female_parttime']);
                const wcWages = pn(c.kpis['employees_wc_wages_male']) + pn(c.kpis['employees_wc_wages_female']);
                const avgWcEmpComp = wcEmp > 0 ? wcWages / wcEmp : 0;
                return avgWcEmpComp > 0 && !!(c.kpis['leadership_avg_cxo_compensation']?.trim());
              },
            };
            const relevanceCheck = INSIGHT_RELEVANCE_KPIS[metric.key as string];

            const companyValues = companyRawData
              .map(c => {
                let val = c.insights[metric.key] as number;
                // Recompute csrSpendRatio with correct revenue & unit conversion
                if (metric.key === 'csrSpendRatio' && revenueByCompany.size > 0) {
                  const csrSpend = parseFloat(c.kpis['csr_amount_spent'] || '0') || 0;
                  const totalRev = revenueByCompany.get(c.companyId) || 0;
                  val = totalRev > 0 ? Math.round((csrSpend / (totalRev * 1e7)) * 100 * 10000) / 10000 : 0;
                }
                // Use avg of quarterly values for jobsPerCrRevenue
                if (metric.key === 'jobsPerCrRevenue' && jobsPerCrQuarterlyAvg.size > 0) {
                  val = jobsPerCrQuarterlyAvg.get(c.companyId) ?? val;
                }
                // Use avg of quarterly values for genderPayParityIndex
                if (metric.key === 'genderPayParityIndex' && payParityQuarterlyAvg.size > 0) {
                  val = payParityQuarterlyAvg.get(c.companyId) ?? val;
                }
                // Use avg of quarterly values for cxoPayRatio
                if (metric.key === 'cxoPayRatio' && cxoPayRatioQuarterlyAvg.size > 0) {
                  val = cxoPayRatioQuarterlyAvg.get(c.companyId) ?? val;
                }
                return { brand: c.brand, companyName: c.companyName, industry: c.industry, companyId: c.companyId, val, hasData: Object.keys(c.kpis).length > 0, rawData: c };
              })
              .filter(c => {
                if (!c.hasData || c.val === undefined || c.val === null || isNaN(c.val)) return false;
                // Apply relevance check: exclude companies without the required KPI data
                if (relevanceCheck && !relevanceCheck(c.rawData)) return false;
                return true;
              });
            const value = companyValues.length > 0
              ? companyValues.reduce((s, c) => s + c.val, 0) / companyValues.length
              : (currentInsights[metric.key] as number);

            // Enrich with Q1-Q4 data if available
            const ratioConfig = RATIO_COMPONENT_COLUMNS[metric.key as string];
            const companyData = companyValues.map(c => {
              const row: any = { brand: c.brand, companyName: c.companyName, industry: c.industry, value: c.val.toFixed(4) };
              // Add quarterly values
              if (quarterlyPerQuarterRawData && metric.key !== 'csrSpendRatio') {
                ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
                  const qData = quarterlyPerQuarterRawData[q] || [];
                  const qCompany = qData.find(qc => qc.companyId === c.companyId);
                  const qVal = qCompany?.insights[metric.key] as number;
                  row[q.toLowerCase()] = qVal !== undefined && !isNaN(qVal) ? qVal.toFixed(2) : '';
                });
              }
              // Add ratio component columns
              if (ratioConfig) {
                // For csrSpendRatio, inject quarterly-summed revenue into rawData
                if (metric.key === 'csrSpendRatio' && revenueByCompany.size > 0) {
                  const enrichedRaw = { ...c.rawData, kpis: { ...c.rawData.kpis, net_revenue: String(revenueByCompany.get(c.companyId) || 0) } };
                  row.ratioColumns = ratioConfig.getValues(enrichedRaw as CompanyRawMetrics);
                } else if (metric.key === 'genderPayParityIndex' && quarterlyPerQuarterRawData) {
                  // Use quarterly reconstruction: wages summed, counts averaged (consistent with detail page)
                  const pn = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
                  let fWS = 0, mWS = 0; const fCs: number[] = [], mCs: number[] = [];
                  ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
                    const qc = (quarterlyPerQuarterRawData[q] || []).find(x => x.companyId === c.companyId);
                    if (qc) {
                      fWS += pn(qc.kpis['employees_wc_wages_female']) + pn(qc.kpis['employees_bc_wages_female']);
                      mWS += pn(qc.kpis['employees_wc_wages_male']) + pn(qc.kpis['employees_bc_wages_male']);
                      const fc = pn(qc.kpis['employees_wc_female_fulltime']) + pn(qc.kpis['employees_wc_female_contractual']) + pn(qc.kpis['employees_wc_female_parttime']) + pn(qc.kpis['employees_bc_female_fulltime']) + pn(qc.kpis['employees_bc_female_contractual']) + pn(qc.kpis['employees_bc_female_parttime']);
                      const mc = pn(qc.kpis['employees_wc_male_fulltime']) + pn(qc.kpis['employees_wc_male_contractual']) + pn(qc.kpis['employees_wc_male_parttime']) + pn(qc.kpis['employees_bc_male_fulltime']) + pn(qc.kpis['employees_bc_male_contractual']) + pn(qc.kpis['employees_bc_male_parttime']);
                      if (fc > 0) fCs.push(fc); if (mc > 0) mCs.push(mc);
                    }
                  });
                  row.ratioColumns = {
                    'Female Wages': String(Math.round(fWS * 100) / 100),
                    'Female Count': String(fCs.length > 0 ? Math.round(fCs.reduce((a, b) => a + b, 0) / fCs.length) : 0),
                    'Male Wages': String(Math.round(mWS * 100) / 100),
                    'Male Count': String(mCs.length > 0 ? Math.round(mCs.reduce((a, b) => a + b, 0) / mCs.length) : 0),
                  };
                } else {
                  row.ratioColumns = ratioConfig.getValues(c.rawData);
                }
              }
              return row;
            });
            // Tag with sourceCalcId for metrics that need detail page reconstruction
            if (metric.key === 'mtPackagingPer1000Customers') {
              (companyData as any)._sourceCalcId = 'calc:mtPackagingPer1000Customers';
            }
            if (metric.key === 'mtPlasticPerCrRevenue') {
              (companyData as any)._sourceCalcId = 'calc:mtPlasticPerCrRevenue';
            }
            if (metric.key === 'eprComplianceGapFashion') {
              (companyData as any)._sourceCalcId = 'calc:eprComplianceGapFashion';
            }
            const isPctMetric = metric.unit === '%' || metric.unit.includes('ratio') || metric.unit.includes('/100');
            const hasQCols = !!quarterlyPerQuarterRawData && metric.key !== 'csrSpendRatio';
            const extra: any = { sourceInsightKey: metric.key, unit: metric.unit };
            if (hasQCols) extra.hasQuarterlyColumns = true;
            if (ratioConfig) extra.ratioColumnHeaders = ratioConfig.headers;

            return (
              <Card key={metric.key} className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => handleCardClick(metric.label, companyData, isPctMetric, extra)}>
                <CardContent className="pt-3 pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] text-muted-foreground leading-tight flex-1">{metric.label}</p>
                    <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0" />
                  </div>
                  <p className="text-lg font-bold">{value < 0.01 && value > 0 ? `${value.toFixed(4)}${metric.unit}` : fmt(value, metric.unit)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    n={companyValues.length}
                    {companyRawData.length - companyValues.length > 0 && ` · ${companyRawData.length - companyValues.length} not filled`}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
// import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAnalyticsDashboardData, AnalyticsFilters } from '@/hooks/useAnalyticsDashboardData';
import { FeatureAnalyticsView } from '@/components/analytics/FeatureAnalyticsView';
import { InsightTab } from '@/components/analytics/InsightTab';
import { exportCSV, exportTransposedCSV, exportPDF, exportXLSX, captureCharts, buildFilterSummary, ExportColumn } from '@/lib/exportUtils';
import { buildAllFeatureCharts, renderFeatureChartsInPDF } from '@/lib/pdfChartRenderer';
import { FEATURE_INSIGHT_METRICS, FEATURE_AGGREGATION_EXPORTS } from '@/lib/featureInsightMetrics';
import { BarChart3, Lightbulb, Building2, Calendar, Layers, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Industry, Fund, RevenueStage, QCategory } from '@/types/esg';
import { FEATURE_FIELD_MAPPINGS, resolveFieldValue } from '@/lib/featureFieldMapping';
import { mockCompanies } from '@/data/mockData';
import { useQuery } from '@tanstack/react-query';
// import { supabase } from '@/integrations/supabase/client';
import { http } from '@/utils/httpInterceptor';

const INDUSTRIES: Industry[] = ['Beauty & Personal Care', 'Fashion & Lifestyle', 'Health & Wellness', 'Food & Beverage', 'Home & Décor', 'Platform Enablers'];
const FUNDS: Fund[] = ['Fund I', 'Fund II', 'Fund III', 'Fund IV'];
const REVENUE_STAGES: RevenueStage[] = ['0-50', '50-100', '100-500', '500+'];
const Q_CATEGORIES: QCategory[] = ['Q', 'Q1', 'Q2', 'Q3', 'Early'];
const YEARS = [2023, 2024, 2025];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

/** Read dashboard filters from URL search params so navigate(-1) restores them */
const filtersFromParams = (sp: URLSearchParams): { filters: AnalyticsFilters; feature: string } => {
  return {
    filters: {
      period: (sp.get('period') as 'quarterly' | 'annual') || 'annual',
      quarter: sp.get('quarter') || 'Q1',
      year: parseInt(sp.get('year') || '2025', 10),
      industry: (sp.get('industry') as Industry) || undefined,
      fund: (sp.get('fund') as Fund) || undefined,
      revenueStage: (sp.get('revenueStage') as RevenueStage) || undefined,
      companyId: sp.get('companyId') || undefined,
      qCategory: (sp.get('qCategory') as QCategory) || undefined,
      firesidePOC: sp.get('firesidePOC') || undefined,
    },
    feature: sp.get('feature') || '',
  };
};

const QUARTERLY_FEATURES = [
  { key: 'businessInformation', label: 'Business Information' },
  { key: 'social', label: 'Employment & Compensation' },
  { key: 'sourcingFulfillment', label: 'Sourcing & Fulfillment' },
  { key: 'primarySecondaryPackaging', label: 'Primary & Secondary Packaging' },
  { key: 'fashionMaterials', label: 'Materials & Packaging (Fashion)' },
  { key: 'incidentLog', label: 'Incidents & Grievances' },
  { key: 'productServiceCertifications', label: 'Awards & Recognitions' },
  { key: 'healthCare', label: 'Healthcare' },
];

// DB key prefixes used to detect whether a company has data for a given feature.
// These match the actual kpi_id values stored in kpi_entries, NOT the mapping KPI ids.
const FEATURE_DB_KEY_PREFIXES: Record<string, string[]> = {
  businessInformation: ['net_revenue', 'revenue_tier2_plus', 'total_customers_served', 'unique_female_customers'],
  social: ['employees_', 'leadership_', 'employees_enps', 'employees_pwd_percentage', 'employees_attrition_rate'],
  sourcingFulfillment: ['msme_supplier_percentage', 'vendor_mis_', 'vendor_practices_'],
  primarySecondaryPackaging: ['food_pkg_'],
  fashionMaterials: ['fashion_'],
  incidentLog: ['incident_', 'has_grievances', 'grievances_'],
  productServiceCertifications: ['founder_awards_', 'media_mentions_', 'brand_awards_'],
  healthCare: ['healthcare_'],
  operations: ['operations_', 'stores_count', 'warehouses_count', 'manufacturing_units'],
  certifications: ['cert_'],
  governancePolicies: ['policy_'],
  waterManagement: ['water_detailed_', 'energy_detailed_'],
  wasteManagement: ['waste_detailed_'],
  csr: ['csr_'],
};

const ANNUAL_FEATURES = [
  { key: 'operations', label: 'Operations' },
  { key: 'certifications', label: 'Product/Service Certifications' },
  { key: 'governancePolicies', label: 'Governance Policies' },
  { key: 'waterManagement', label: 'Water & Energy Management' },
  { key: 'wasteManagement', label: 'Waste Management' },
  { key: 'csr', label: 'CSR' },
];

const renderFeatureCard = (
  feature: { key: string; label: string },
  data: any,
  featureEnabledMap: Map<string, Set<string>>,
  handleSelectFeature: (feat: string) => void,
  useQuarterlyCombined?: boolean,
) => {
  const mapping = FEATURE_FIELD_MAPPINGS[feature.key];
  const kpiCount = mapping?.kpis.filter((k: any) => !k.excludeFromProgress).length || 0;
  const filteredIds = new Set(data.filteredCompanies.map((c: any) => c.id));
  const enabledForFeature = featureEnabledMap.get(feature.key);
  const applicableCompanyCount = enabledForFeature
    ? [...enabledForFeature].filter(id => filteredIds.has(id)).length
    : filteredIds.size;
  const dbPrefixes = FEATURE_DB_KEY_PREFIXES[feature.key] || [];
  // Use quarterlyCombinedRawData for quarterly features in annual view
  const rawDataSource = useQuarterlyCombined && data.quarterlyCombinedRawData
    ? data.quarterlyCombinedRawData
    : data.companyRawData;
  const companiesWithData = rawDataSource.filter((c: any) => {
    if (!mapping) return false;
    if (enabledForFeature && !enabledForFeature.has(c.companyId)) return false;
    const filledKeys = Object.keys(c.kpis).filter((k: string) => c.kpis[k]?.trim());
    return dbPrefixes.some((prefix: string) =>
      prefix.endsWith('_')
        ? filledKeys.some((k: string) => k.startsWith(prefix))
        : filledKeys.includes(prefix)
    );
  }).length;

  return (
    <Card
      key={feature.key}
      className="hover:shadow-md transition-all cursor-pointer hover:border-primary/50"
      onClick={() => handleSelectFeature(feature.key)}
    >
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">{feature.label}</h3>
          <Badge variant="secondary" className="text-[10px]">n={companiesWithData}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{kpiCount} KPIs</p>
        <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${applicableCompanyCount > 0 ? (companiesWithData / applicableCompanyCount) * 100 : 0}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {companiesWithData}/{applicableCompanyCount} companies with data
        </p>
      </CardContent>
    </Card>
  );
};
// ─── Insight metric labels for export ───
const INSIGHT_EXPORT_KEYS: { key: keyof import('@/hooks/useAnalyticsDashboardData').InsightMetrics; label: string }[] = [
  { key: 'esgCompositeScore', label: 'ESG Composite Score' },
  { key: 'socialScore', label: 'Social Score' },
  { key: 'circularEconomyIndex', label: 'Environment Score' },
  { key: 'governanceScore', label: 'Governance Score' },
  { key: 'genderDiversityRatio', label: 'Gender Diversity Ratio' },
  { key: 'womenInLeadershipPct', label: 'Women in Leadership %' },
  { key: 'womenInBoardPct', label: 'Women in Board %' },
  { key: 'pwdInclusionRate', label: 'PwD Inclusion Rate' },
  { key: 'cxoPayRatio', label: 'CXO Pay Ratio' },
  { key: 'jobsPerCrRevenue', label: 'Jobs per Cr Revenue' },
  { key: 'virginPlasticPct', label: 'Virgin Plastic %' },
  { key: 'recycledContentRatio', label: 'Recycled Content Ratio' },
  { key: 'plasticIntensityPerCrRevenue', label: 'Plastic Intensity per Cr Revenue' },
  { key: 'eprComplianceRate', label: 'EPR Compliance Rate' },
  { key: 'caseResolutionRate', label: 'Case Resolution Rate' },
  { key: 'highImpactIncidentRatio', label: 'High Impact Incident Ratio' },
  { key: 'policyAdoptionRate', label: 'Policy Adoption Rate' },
  { key: 'waterRecyclingRate', label: 'Water Recycling Rate' },
  { key: 'renewableEnergyMix', label: 'Renewable Energy Mix' },
  { key: 'wasteDiversionRate', label: 'Waste Diversion Rate' },
  { key: 'csrSpendRatio', label: 'CSR Spend Ratio' },
];

/**
 * Build comprehensive export columns and row data covering ALL features + insight metrics.
 * When a specific feature is selected, exports that feature's KPIs only.
 * When no feature is selected, exports ALL feature KPIs grouped by feature + all insight scores.
 */
const buildComprehensiveExportData = (
  data: any,
  filters: AnalyticsFilters,
  selectedFeature: string,
  availableFeatures: { key: string; label: string }[],
) => {
  const cols: ExportColumn[] = [
    { header: 'Brand', accessor: (c: any) => c.brand },
    { header: 'Industry', accessor: (c: any) => c.industry },
    { header: 'Revenue Stage', accessor: (c: any) => c.revenueStage },
    { header: 'KPIs Filled', accessor: (c: any) => String(Object.keys(c.kpis).filter((k: string) => c.kpis[k]?.trim()).length) },
  ];

  if (selectedFeature) {
    // Single feature — export all its KPIs (no 20-KPI limit)
    const mapping = FEATURE_FIELD_MAPPINGS[selectedFeature];
    if (mapping) {
      mapping.kpis.forEach((kpi: any) => {
        if (kpi.fields && kpi.fields.length > 0) {
          kpi.fields.forEach((field: any) => {
            cols.push({
              header: `[${mapping.featureLabel}] ${kpi.label} — ${field.label}`,
              accessor: (c: any) => resolveFieldValue(c.kpis, selectedFeature, kpi.id, field.id),
            });
          });
        } else {
          cols.push({
            header: `[${mapping.featureLabel}] ${kpi.label}`,
            accessor: (c: any) => resolveFieldValue(c.kpis, selectedFeature, kpi.id, kpi.id),
          });
        }
      });
    }

    // Add feature-specific aggregation computed metrics
    const aggMetrics = FEATURE_AGGREGATION_EXPORTS[selectedFeature];
    if (aggMetrics) {
      aggMetrics.forEach(m => {
        cols.push({
          header: `[Stat Card] ${m.label}`,
          accessor: (c: any) => m.getValue(c),
        });
      });
    }

    // Add feature-specific derived insight metrics per company
    const featureInsights = FEATURE_INSIGHT_METRICS[selectedFeature];
    if (featureInsights) {
      featureInsights.forEach(metric => {
        cols.push({
          header: `[Derived Insight] ${metric.label}`,
          accessor: (c: any) => {
            const val = c.insights?.[metric.key];
            return val != null && !isNaN(val) ? String(Math.round(val * 10000) / 10000) : '';
          },
        });
      });
    }
  } else {
    // All features — export every feature's KPIs grouped by feature label
    const allFeatureKeys = filters.period === 'quarterly'
      ? QUARTERLY_FEATURES
      : [...QUARTERLY_FEATURES, ...ANNUAL_FEATURES];

    for (const feature of allFeatureKeys) {
      const mapping = FEATURE_FIELD_MAPPINGS[feature.key];
      if (!mapping) continue;
      mapping.kpis.forEach((kpi: any) => {
        if (kpi.fields && kpi.fields.length > 0) {
          kpi.fields.forEach((field: any) => {
            cols.push({
              header: `[${feature.label}] ${kpi.label} — ${field.label}`,
              accessor: (c: any) => resolveFieldValue(c.kpis, feature.key, kpi.id, field.id),
            });
          });
        } else {
          cols.push({
            header: `[${feature.label}] ${kpi.label}`,
            accessor: (c: any) => resolveFieldValue(c.kpis, feature.key, kpi.id, kpi.id),
          });
        }
      });

      // Add aggregation metrics for each feature
      const aggMetrics = FEATURE_AGGREGATION_EXPORTS[feature.key];
      if (aggMetrics) {
        aggMetrics.forEach(m => {
          cols.push({
            header: `[${feature.label} — Stat Card] ${m.label}`,
            accessor: (c: any) => m.getValue(c),
          });
        });
      }

      // Add derived insight metrics for each feature
      const featureInsights = FEATURE_INSIGHT_METRICS[feature.key];
      if (featureInsights) {
        featureInsights.forEach(metric => {
          cols.push({
            header: `[${feature.label} — Derived Insight] ${metric.label}`,
            accessor: (c: any) => {
              const val = c.insights?.[metric.key];
              return val != null && !isNaN(val) ? String(Math.round(val * 10000) / 10000) : '';
            },
          });
        });
      }
    }

    // Append cross-module insight metrics (composite scores)
    for (const im of INSIGHT_EXPORT_KEYS) {
      cols.push({
        header: `[Cross-Module Insight] ${im.label}`,
        accessor: (c: any) => {
          const val = c.insights?.[im.key];
          return val != null ? String(Math.round(val * 100) / 100) : '';
        },
      });
    }
  }

  // Choose the right data source
  const rawData = (filters.period === 'annual' && selectedFeature && QUARTERLY_FEATURES.some(f => f.key === selectedFeature) && data.quarterlyCombinedRawData)
    ? data.quarterlyCombinedRawData
    : (filters.period === 'annual' && !selectedFeature && data.quarterlyCombinedRawData)
      // For "all features" annual export, merge quarterly combined data into annual data
      ? mergeRawDataSources(data.companyRawData, data.quarterlyCombinedRawData)
      : data.companyRawData;

  return { cols, rawData };
};

/**
 * Merge annual and quarterly-combined raw data so each company row has KPIs from both sources.
 */
const mergeRawDataSources = (annualData: any[], quarterlyCombinedData: any[]): any[] => {
  const qcMap = new Map<string, any>();
  for (const c of (quarterlyCombinedData || [])) {
    qcMap.set(c.companyId, c);
  }
  return annualData.map((c: any) => {
    const qc = qcMap.get(c.companyId);
    if (!qc) return c;
    return {
      ...c,
      kpis: { ...c.kpis, ...qc.kpis },
      insights: { ...c.insights, ...qc.insights },
    };
  });
};
const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = filtersFromParams(searchParams);
  const [filters, setFilters] = useState<AnalyticsFilters>(initial.filters);
  const [selectedFeature, setSelectedFeature] = useState<string>(initial.feature);

  // Sync state → URL search params (replace, not push, to avoid polluting history)
  const syncParams = useCallback((f: AnalyticsFilters, feat: string) => {
    const p: Record<string, string> = {
      period: f.period,
      quarter: f.quarter || '',
      year: f.year.toString(),
    };
    if (f.industry) p.industry = f.industry;
    if (f.fund) p.fund = f.fund;
    if (f.revenueStage) p.revenueStage = f.revenueStage;
    if (f.qCategory) p.qCategory = f.qCategory;
    if (f.firesidePOC) p.firesidePOC = f.firesidePOC;
    if (f.companyId) p.companyId = f.companyId;
    if (feat) p.feature = feat;
    setSearchParams(p, { replace: true });
  }, [setSearchParams]);

  const updateFilter = <K extends keyof AnalyticsFilters>(key: K, value: AnalyticsFilters[K]) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      const feat = key === 'period' ? '' : selectedFeature;
      if (key === 'period') setSelectedFeature('');
      syncParams(next, feat);
      return next;
    });
  };

  const handleSelectFeature = (feat: string) => {
    setSelectedFeature(feat);
    syncParams(filters, feat);
  };

  const { data, isLoading, error } = useAnalyticsDashboardData(filters);

  // ─── Build detail tables for PDF export (derived insights + aggregation per-company) ───
  const buildPDFDetailTables = (rawData: any[], featureKeys: { key: string; label: string }[]): import('@/lib/exportUtils').PDFDetailTable[] => {
    const tables: import('@/lib/exportUtils').PDFDetailTable[] = [];

    for (const feature of featureKeys) {
      // Derived insight detail tables
      const featureInsights = FEATURE_INSIGHT_METRICS[feature.key];
      if (featureInsights) {
        for (const metric of featureInsights) {
          const rows = rawData
            .filter(c => {
              const val = c.insights?.[metric.key];
              return val != null && !isNaN(val) && (val !== 0 || metric.unit !== '%');
            })
            .map(c => ({
              brand: c.brand,
              value: String(Math.round((c.insights?.[metric.key] ?? 0) * 10000) / 10000),
            }))
            .sort((a, b) => parseFloat(b.value) - parseFloat(a.value));

          if (rows.length > 0) {
            const vals = rows.map(r => parseFloat(r.value));
            const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
            tables.push({
              sectionTitle: `${feature.label} — Derived Insights`,
              metricTitle: metric.label,
              unit: metric.unit,
              rows,
              summary: { label: 'Average', value: String(Math.round(avg * 10000) / 10000) },
            });
          }
        }
      }

      // Aggregation stat card detail tables
      const aggMetrics = FEATURE_AGGREGATION_EXPORTS[feature.key];
      if (aggMetrics) {
        for (const m of aggMetrics) {
          const rows = rawData
            .filter(c => {
              const val = m.getValue(c);
              return val && val.trim() !== '' && val !== '0' && val !== 'NaN';
            })
            .map(c => ({ brand: c.brand, value: m.getValue(c) }))
            .sort((a, b) => parseFloat(b.value) - parseFloat(a.value));

          if (rows.length > 0) {
            const numVals = rows.map(r => parseFloat(r.value)).filter(v => !isNaN(v));
            const total = numVals.reduce((s, v) => s + v, 0);
            tables.push({
              sectionTitle: `${feature.label} — Stat Cards`,
              metricTitle: m.label,
              unit: '',
              rows,
              summary: { label: 'Total', value: String(Math.round(total * 100) / 100) },
            });
          }
        }
      }
    }

    return tables;
  };

  // Fetch per-feature enabled company counts
  const { data: featureSettings } = useQuery({
    queryKey: ['company-feature-settings-for-dashboard'],
    queryFn: async () => {
      // const { data, error } = await supabase
      //   .from('company_feature_settings')
      //   .select('company_id, feature_key, enabled')
      //   .eq('enabled', true);
      // if (error) throw error;
      // return data || [];
      debugger;
      const data=await http.get("mis/company-feature-settings?enabled=true");
      if (data.error) throw data.error;
      if(data.data){
        return data.data;
      }
    },
  });

  // Build a map: featureKey -> Set of company IDs that have it enabled
  const featureEnabledMap = new Map<string, Set<string>>();
  if (featureSettings) {
    for (const s of featureSettings) {
      if (!featureEnabledMap.has(s.feature_key)) featureEnabledMap.set(s.feature_key, new Set());
      featureEnabledMap.get(s.feature_key)!.add(s.company_id);
    }
  }

  const availableFeatures = filters.period === 'quarterly' ? QUARTERLY_FEATURES : [...QUARTERLY_FEATURES, ...ANNUAL_FEATURES];

  // Get filtered company list for dropdown (apply industry/fund/revenue filters)
  const companyOptions = mockCompanies.filter(c => {
    if (filters.industry && c.industry !== filters.industry) return false;
    if (filters.fund && c.fund !== filters.fund) return false;
    if (filters.revenueStage && c.revenueStage !== filters.revenueStage) return false;
    if (filters.qCategory && c.qCategory !== filters.qCategory) return false;
    if (filters.firesidePOC && c.fl !== filters.firesidePOC) return false;
    return true;
  });

  // Build sorted unique list of Fireside POCs from invested companies
  const firesidePOCOptions = Array.from(
    new Set(
      mockCompanies
        .filter(c => c.investmentStatus === 'Invested' && c.fl && c.fl !== 'Demo User')
        .map(c => c.fl as string)
    )
  ).sort();

  if (error) {
    return (
      // <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Analytics Dashboard" subtitle="Portfolio ESG Intelligence" />
        <Card className="mt-4">
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-destructive">Error loading dashboard data. Please try again.</p>
          </CardContent>
        </Card>
      </div>
      // </DashboardLayout>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics Dashboard"
        subtitle="Investment-Grade ESG Intelligence"
      />

      {/* ─── Filter Bar ─── */}
      <div className="flex flex-wrap items-center gap-3 mt-4 p-3 rounded-lg bg-muted/50 border border-border">
        <Calendar className="w-4 h-4 text-muted-foreground" />

        {/* Period Toggle */}
        <div className="flex gap-1 bg-background rounded-md p-0.5 border border-border">
          <button
            onClick={() => { updateFilter('period', 'quarterly'); setSelectedFeature(''); }}
            className={`px-3 py-1 text-xs rounded transition-colors ${filters.period === 'quarterly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Quarterly
          </button>
          <button
            onClick={() => { updateFilter('period', 'annual'); setSelectedFeature(''); }}
            className={`px-3 py-1 text-xs rounded transition-colors ${filters.period === 'annual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Annual
          </button>
        </div>

        {/* Quarter (only for quarterly) */}
        {filters.period === 'quarterly' && (
          <Select value={filters.quarter} onValueChange={v => updateFilter('quarter', v)}>
            <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {QUARTERS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {/* Year */}
        <Select value={filters.year.toString()} onValueChange={v => updateFilter('year', parseInt(v))}>
          <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="h-4 w-px bg-border" />

        {/* Industry Filter */}
        <Select value={filters.industry || 'all'} onValueChange={v => updateFilter('industry', v === 'all' ? undefined : v as Industry)}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All Industries" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Fund Filter */}
        <Select value={filters.fund || 'all'} onValueChange={v => updateFilter('fund', v === 'all' ? undefined : v as Fund)}>
          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="All Funds" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Funds</SelectItem>
            {FUNDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Revenue Filter */}
        <Select value={filters.revenueStage || 'all'} onValueChange={v => updateFilter('revenueStage', v === 'all' ? undefined : v as RevenueStage)}>
          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="All Revenue" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Revenue</SelectItem>
            {REVENUE_STAGES.map(r => <SelectItem key={r} value={r}>₹{r} Cr</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Q Category Filter */}
        <Select value={filters.qCategory || 'all'} onValueChange={v => updateFilter('qCategory', v === 'all' ? undefined : v as QCategory)}>
          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="All Q Cat" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Q Cat</SelectItem>
            {Q_CATEGORIES.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Fireside POC Filter */}
        <Select value={filters.firesidePOC || 'all'} onValueChange={v => updateFilter('firesidePOC', v === 'all' ? undefined : v)}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All Fireside POCs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fireside POCs</SelectItem>
            {firesidePOCOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="h-4 w-px bg-border" />

        {/* Company Filter */}
        <Select value={filters.companyId || 'all'} onValueChange={v => updateFilter('companyId', v === 'all' ? undefined : v)}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All Companies" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companyOptions.map(c => <SelectItem key={c.id} value={c.id}>{c.brand}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          {data && (
            <>
              <Badge variant="secondary" className="text-xs">
                <Building2 className="w-3 h-3 mr-1" />
                {data.companyCount} companies
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    const featureLabel = selectedFeature
                      ? (availableFeatures.find(f => f.key === selectedFeature)?.label || selectedFeature)
                      : 'Complete_Analytics';
                    // Build comprehensive columns & row data covering all features + insights
                    const { cols, rawData } = buildComprehensiveExportData(data, filters, selectedFeature, availableFeatures);
                    const safeName = `${featureLabel}_${filters.period}_${filters.year}`.replace(/[^a-zA-Z0-9]/g, '_');
                    exportXLSX(safeName, cols, rawData, {
                      transposed: true,
                      sheetName: featureLabel.slice(0, 31),
                      summaryCards: [
                        { label: 'Companies', value: String(data.companyCount) },
                        { label: 'Net Revenue', value: `₹${Math.round(data.current.netRevenue).toLocaleString()} Cr` },
                        { label: 'Period', value: buildFilterSummary(filters) },
                      ],
                    });
                  }}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => {
                    const featureLabel = selectedFeature
                      ? (availableFeatures.find(f => f.key === selectedFeature)?.label || selectedFeature)
                      : 'Complete_Analytics';
                    const { cols, rawData } = buildComprehensiveExportData(data, filters, selectedFeature, availableFeatures);
                    const summaryCards = [
                      { label: 'Companies', value: String(data.companyCount) },
                      { label: 'Net Revenue', value: `₹${Math.round(data.current.netRevenue).toLocaleString()} Cr` },
                    ];
                    // Capture visible charts from DOM
                    const chartImages = await captureCharts();

                    // Build programmatic charts for all features
                    const chartFeatures = selectedFeature
                      ? [{ key: selectedFeature, label: availableFeatures.find(f => f.key === selectedFeature)?.label || selectedFeature }]
                      : (filters.period === 'quarterly' ? QUARTERLY_FEATURES : [...QUARTERLY_FEATURES, ...ANNUAL_FEATURES]);
                    const chartRawData = (filters.period === 'annual' && !selectedFeature && data.quarterlyCombinedRawData)
                      ? mergeRawDataSources(data.companyRawData, data.quarterlyCombinedRawData)
                      : (filters.period === 'annual' && selectedFeature && QUARTERLY_FEATURES.some(f => f.key === selectedFeature) && data.quarterlyCombinedRawData)
                        ? data.quarterlyCombinedRawData
                        : data.companyRawData;
                    const featureChartSections = buildAllFeatureCharts(chartRawData, chartFeatures);

                    // Build per-metric detail tables for PDF
                    const detailTables = buildPDFDetailTables(chartRawData, chartFeatures);

                    const safeName = `${featureLabel}_${filters.period}_${filters.year}`.replace(/[^a-zA-Z0-9]/g, '_');
                    exportPDF(safeName, {
                      title: `${featureLabel} — Analytics Report`,
                      subtitle: `Fireside Ventures ESG Dashboard`,
                      filterSummary: buildFilterSummary(filters),
                      columns: cols,
                      rows: rawData,
                      summaryCards,
                      chartImages,
                      featureChartSections,
                      detailTables,
                    });
                  }}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* ─── Feature Selector ─── */}
      <div className="flex items-center gap-3 mt-3 p-3 rounded-lg bg-muted/30 border border-border">
        <Layers className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Feature:</span>
        <Select
          value={selectedFeature || 'overview'}
          onValueChange={v => handleSelectFeature(v === 'overview' ? '' : v)}
        >
          <SelectTrigger className="w-64 h-8 text-xs"><SelectValue placeholder="Select Feature" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="overview">📊 Overview (All Features)</SelectItem>
            {filters.period === 'annual' && (
              <>
                <SelectItem disabled value="__quarterly_header" className="text-xs font-semibold text-muted-foreground">— Quarterly KPIs (Q1-Q4 Combined) —</SelectItem>
                {QUARTERLY_FEATURES.map(f => (
                  <SelectItem key={f.key} value={f.key}>{f.label} (Q1-Q4)</SelectItem>
                ))}
                <SelectItem disabled value="__annual_header" className="text-xs font-semibold text-muted-foreground">— Annual KPIs —</SelectItem>
                {ANNUAL_FEATURES.map(f => (
                  <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                ))}
              </>
            )}
            {filters.period === 'quarterly' && availableFeatures.map(f => (
              <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Removed quarterly KPIs dropdown — now shown as cards in overview */}

        {selectedFeature && (
          <Badge variant="outline" className="text-xs">
            {availableFeatures.find(f => f.key === selectedFeature)?.label}
            {filters.period === 'annual' && QUARTERLY_FEATURES.some(f => f.key === selectedFeature) && ' (Q1-Q4)'}
          </Badge>
        )}
      </div>

      {/* ─── Main Content ─── */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        selectedFeature ? (
          /* Feature-specific view */
          <div className="mt-4">
            <FeatureAnalyticsView
              featureKey={selectedFeature}
              companyRawData={
                filters.period === 'annual' && QUARTERLY_FEATURES.some(f => f.key === selectedFeature) && data.quarterlyCombinedRawData
                  ? data.quarterlyCombinedRawData
                  : data.companyRawData
              }
              currentInsights={
                filters.period === 'annual' && QUARTERLY_FEATURES.some(f => f.key === selectedFeature) && data.quarterlyCombinedInsights
                  ? data.quarterlyCombinedInsights
                  : data.currentInsights
              }
              currentAggregation={
                filters.period === 'annual' && QUARTERLY_FEATURES.some(f => f.key === selectedFeature) && data.quarterlyCombinedAggregation
                  ? data.quarterlyCombinedAggregation
                  : data.current
              }
              filters={{
                ...filters,
                ...(filters.period === 'annual' && QUARTERLY_FEATURES.some(f => f.key === selectedFeature)
                  ? { quarterlyKpiCombined: true }
                  : {}
                ),
              }}
              quarterlyPerQuarterRawData={
                (filters.period === 'annual' && (QUARTERLY_FEATURES.some(f => f.key === selectedFeature) || selectedFeature === 'csr'))
                  || (filters.period === 'quarterly' && selectedFeature === 'primarySecondaryPackaging')
                  ? data.quarterlyPerQuarterRawData
                  : undefined
              }
              allCompanyRawData={
                filters.period === 'annual' && QUARTERLY_FEATURES.some(f => f.key === selectedFeature) && data.allQuarterlyCombinedRawData
                  ? data.allQuarterlyCombinedRawData
                  : data.allCompanyRawData
              }
            />
          </div>
        ) : (
          /* Overview with tabs */
          <Tabs value={searchParams.get('tab') || 'insight'} onValueChange={(v) => { const sp = new URLSearchParams(searchParams); sp.set('tab', v); setSearchParams(sp, { replace: true }); }} className="mt-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="aggregation" className="flex items-center gap-1.5 text-xs">
                <BarChart3 className="w-3.5 h-3.5" />
                Aggregation
              </TabsTrigger>
              <TabsTrigger value="insight" className="flex items-center gap-1.5 text-xs">
                <Lightbulb className="w-3.5 h-3.5" />
                Insight
              </TabsTrigger>
            </TabsList>

            <TabsContent value="aggregation" className="mt-4">
              {/* Feature overview cards - click to select feature */}
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select a feature from the dropdown above or click below to view detailed KPI analytics.
                </p>

                {/* In annual view, show quarterly + annual sections separately */}
                {filters.period === 'annual' && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Quarterly KPIs (Q1-Q4 Combined)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {QUARTERLY_FEATURES.map(feature => renderFeatureCard(feature, data, featureEnabledMap, handleSelectFeature, true))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Annual KPIs</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {ANNUAL_FEATURES.map(feature => renderFeatureCard(feature, data, featureEnabledMap, handleSelectFeature))}
                      </div>
                    </div>
                  </>
                )}

                {/* In quarterly view, show all features in one grid */}
                {filters.period === 'quarterly' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableFeatures.map(feature => renderFeatureCard(feature, data, featureEnabledMap, handleSelectFeature))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="insight" className="mt-4">
              <InsightTab
                insights={
                  filters.period === 'annual' && data.quarterlyCombinedInsights
                    ? {
                      ...data.currentInsights,
                      // Composite scores depend on quarterly employment data — overlay them
                      deiCompositeScore: data.quarterlyCombinedInsights.deiCompositeScore,
                      socialScore: data.quarterlyCombinedInsights.socialScore,
                      esgCompositeScore: data.quarterlyCombinedInsights.esgCompositeScore,
                      supplyChainSustainabilityScore: data.quarterlyCombinedInsights.supplyChainSustainabilityScore,
                      circularEconomyIndex: data.quarterlyCombinedInsights.circularEconomyIndex,
                      governanceScore: data.quarterlyCombinedInsights.governanceScore,
                      // Employment-derived metrics
                      genderDiversityRatio: data.quarterlyCombinedInsights.genderDiversityRatio,
                      womenInLeadershipPct: data.quarterlyCombinedInsights.womenInLeadershipPct,
                      pwdInclusionRate: data.quarterlyCombinedInsights.pwdInclusionRate,
                      cxoPayRatio: data.quarterlyCombinedInsights.cxoPayRatio,
                      jobsPerCrRevenue: data.quarterlyCombinedInsights.jobsPerCrRevenue,
                      caseResolutionRate: data.quarterlyCombinedInsights.caseResolutionRate,
                      highImpactIncidentRatio: data.quarterlyCombinedInsights.highImpactIncidentRatio,
                      poshCaseIntensity: data.quarterlyCombinedInsights.poshCaseIntensity,
                      // CSR ratio needs annual spend + quarterly revenue
                      csrSpendRatio: (() => {
                        const annualCsrSpend = data.current?.csrSpendAmount ?? 0;
                        const qRevenue = data.quarterlyCombinedAggregation?.netRevenue ?? 0;
                        return qRevenue > 0 ? Math.round((annualCsrSpend / (qRevenue * 1e7)) * 100 * 10000) / 10000 : 0;
                      })(),
                    }
                    : data.currentInsights
                }
                timeSeries={data.timeSeries}
                companyRawData={
                  filters.period === 'annual' && data.quarterlyCombinedRawData
                    ? data.quarterlyCombinedRawData
                    : data.companyRawData
                }
                companyCount={data.companyCount}
                filters={filters}
              />
            </TabsContent>
          </Tabs>
        )
      ) : null}
    </div>
  );
};

export default AdminDashboard;

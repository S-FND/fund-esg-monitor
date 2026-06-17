import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
// import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { mockCompanies, generateUniquePassword } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, Filter, Trash2, Eye, Building2, Key, Loader2, Download, FileSpreadsheet, FileText, FileJson } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import * as XLSX from 'xlsx';
import { GenerateEmailDialog } from '@/components/GenerateEmailDialog';
import { Industry, RevenueStage, Company, Fund, FiresideCategory, QCategory } from '@/types/esg';
import { AddCompanyDialog } from '@/components/AddCompanyDialog';
import { CompanyCredentialsDialog } from '@/components/CompanyCredentialsDialog';
import { CompletionRing } from '@/components/CompletionRing';
import { toast } from 'sonner';
import { FEATURE_FIELD_MAPPINGS } from '@/lib/featureFieldMapping';
import { QUARTERLY_FEATURES, ANNUAL_FEATURES } from '@/hooks/useCompanyFeatures';
import { isCompanyExcluded } from '@/lib/companyExclusions';
import { http } from '@/utils/httpInterceptor';

// All possible feature keys categorized (same as useAllQuartersProgress)
const ALL_QUARTERLY_FEATURES = [
  'businessInformation', 'social', 'sourcingFulfillment',
  'primarySecondaryPackaging', 'fashionMaterials', 'incidentLog',
  'productServiceCertifications', 'healthCare',
];

const ALL_ANNUAL_FEATURES = [
  'operations', 'governancePolicies', 'certifications', 'csr',
  'sri', 'externalReporting', 'energyManagement', 'waterManagement', 'wasteManagement',
];

// Known generic field IDs (same as useAllQuartersProgress)
const GENERIC_FIELD_IDS = new Set([
  'cases', 'open_cases', 'impact', 'value', 'count', 'in_place', 'details',
  'type', 'amount', 'list', 'self_number', 'self_names', 'self_validity',
  'supplier_number', 'supplier_names', 'supplier_validity', 'training',
  'training_count', 'total_weight', 'plastic_weight', 'recycled_content',
  'recyclable_pct', 'recycled_pct', 'energy_consumed', 'renewable_pct',
  'water_consumed', 'fresh_water_pct', 'rainwater_pct',
  'epr_targets', 'epr_compliance_pct',
  'waste_generated', 'waste_recycled_pct', 'na',
]);

const isKPIGroupFilled = (
  kpi: { id: string; fields: { id: string }[] },
  entries: { kpi_id: string; value: string | null }[]
): boolean => {
  const validEntries = entries.filter(
    e => e.value !== null && e.value !== '' && e.value.trim() !== ''
  );
  return kpi.fields.some(field => {
    return validEntries.some(entry => {
      if (entry.kpi_id === field.id) return true;
      if (GENERIC_FIELD_IDS.has(field.id)) {
        return entry.kpi_id.includes(kpi.id) &&
          (entry.kpi_id.includes(field.id) || entry.kpi_id.endsWith(`_${field.id}`));
      }
      if (entry.kpi_id.endsWith(`_${field.id}`)) return true;
      if (field.id.length >= 12 && entry.kpi_id.includes(field.id)) return true;
      return false;
    });
  });
};

const countFilledKPIs = (
  featureKeys: string[],
  entries: { kpi_id: string; value: string | null }[]
): number => {
  let count = 0;
  for (const featureKey of featureKeys) {
    const mapping = FEATURE_FIELD_MAPPINGS[featureKey];
    if (!mapping) continue;
    for (const kpi of mapping.kpis) {
      if (kpi.excludeFromProgress) continue;
      if (isKPIGroupFilled(kpi, entries)) {
        count++;
      }
    }
  }
  return count;
};

// Interface for company progress
interface CompanyProgress {
  total: number;
  filled: number;
  percentage: number;
  periodsSubmitted: number; // how many considered periods have at least one submitted entry
  consideredPeriods: number; // denominator after quarter exclusions
}

const Portfolio = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [fundFilter, setFundFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [qCategoryFilter, setQCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>(mockCompanies.filter(c => c.investmentStatus === 'Invested'));
  const [companyProgress, setCompanyProgress] = useState<Record<string, CompanyProgress>>({});
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [progressError, setProgressError] = useState<string | null>(null);




  const funds: Fund[] = ['Fund I', 'Fund II', 'Fund III', 'Fund IV'];
  const qCategories: QCategory[] = ['Q', 'Q1', 'Q2', 'Q3', 'Early'];

  const industries: FiresideCategory[] = [
    'Beauty & Personal Care',
    'Fashion & Lifestyle',
    'Health & Wellness',
    'Food & Beverage',
    'Home & Décor',
    'Platform Enablers',
  ];

  // Helper to get KPI count for a feature from FEATURE_FIELD_MAPPINGS (same source as Feature Management)
  const getFeatureKPICount = (featureKey: string): number => {
    const mapping = FEATURE_FIELD_MAPPINGS[featureKey];
    if (!mapping) return 0;
    return mapping.kpis.filter(kpi => !kpi.excludeFromProgress).length;
  };

  // Calculate total KPIs from FEATURE_FIELD_MAPPINGS (same source as Feature Management)
  const totalKPIs = useMemo(() => {
    let total = 0;

    QUARTERLY_FEATURES.forEach(feature => {
      total += getFeatureKPICount(feature.key);
    });

    ANNUAL_FEATURES.forEach(feature => {
      total += getFeatureKPICount(feature.key);
    });

    return total;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProgressData = async () => {
      setIsLoadingProgress(true);
      setProgressError(null); // assumes you have an error state

      try {
        // ✅ Single batched query for all companies — no N+1
        const companyIds = companies.map(c => c.id);

        const [featureResult, entriesResult] = await Promise.all([
          http.get('mis/company-feature-settings?enabled=true'),
          http.get('mis/kpi-entries?year=2025')
          // supabase
          //   .from('kpi_entries')
          //   .select('company_id, kpi_id, quarter, value, submitted_at')
          //   .in('company_id', companyIds)
          //   .eq('year', 2025),
        ]);

        // ✅ Explicit error handling — distinguish DB failure from empty data
        if (featureResult.error) throw new Error(`Failed to load feature settings: ${featureResult.error.message}`);
        if (entriesResult.error) throw new Error(`Failed to load KPI entries: ${entriesResult.error.message}`);

        // ✅ Group fetched data by company_id in JS instead of per-company queries
        const featuresByCompany = new Map<string, Set<string>>();
        for (const row of featureResult.data ?? []) {
          if (!featuresByCompany.has(row.company_id)) {
            featuresByCompany.set(row.company_id, new Set());
          }
          featuresByCompany.get(row.company_id)!.add(row.feature_key);
        }

        const entriesByCompany = new Map<string, typeof entriesResult.data>();
        for (const row of entriesResult.data ?? []) {
          if (!entriesByCompany.has(row.company_id)) {
            entriesByCompany.set(row.company_id, []);
          }
          entriesByCompany.get(row.company_id)!.push(row);
        }

        const progressMap: Record<string, CompanyProgress> = {};

        for (const company of companies) {
          const enabledKeys = featuresByCompany.get(company.id);

          // ✅ Distinguish "no features configured" from "query failed"
          // If enabledKeys is undefined, the company truly had no rows returned;
          // treat as no features rather than silently falling back to ALL features.
          const hasFeatureData = enabledKeys !== undefined;

          const quarterlyFeatures = hasFeatureData
            ? ALL_QUARTERLY_FEATURES.filter(k => enabledKeys!.has(k))
            : [];
          const annualFeatures = hasFeatureData
            ? ALL_ANNUAL_FEATURES.filter(k => enabledKeys!.has(k))
            : [];

          const quarterlyTotal = quarterlyFeatures.reduce((sum, k) => {
            const m = FEATURE_FIELD_MAPPINGS[k];
            return sum + (m ? m.kpis.filter(kpi => !kpi.excludeFromProgress).length : 0);
          }, 0);

          const annualTotal = annualFeatures.reduce((sum, k) => {
            const m = FEATURE_FIELD_MAPPINGS[k];
            return sum + (m ? m.kpis.filter(kpi => !kpi.excludeFromProgress).length : 0);
          }, 0);

          const allEntries = entriesByCompany.get(company.id) ?? [];

          let totalFilled = 0;
          let totalAssigned = 0;
          let periodsSubmitted = 0;
          let consideredPeriods = 0;

          const periods = ['Q1', 'Q2', 'Q3', 'Q4', 'FY'] as const;

          for (const period of periods) {
            if (isCompanyExcluded(company.id, period, 2025)) continue;

            consideredPeriods++;

            const periodEntries = allEntries.filter(e => e.quarter === period);

            // ✅ Comment explains intentional "any submitted entry = period submitted" logic
            const hasSubmitted = periodEntries.some(e => e.submitted_at !== null);
            if (hasSubmitted) periodsSubmitted++;

            const isAnnual = period === 'FY';
            const features = isAnnual ? annualFeatures : quarterlyFeatures;
            const expected = isAnnual ? annualTotal : quarterlyTotal;

            const filled = countFilledKPIs(features, periodEntries);

            // ✅ Assert filled never exceeds expected — surface overcounting bugs
            if (filled > expected) {
              console.warn(
                `[progress] countFilledKPIs overcounted for company=${company.id} period=${period}: filled=${filled} > expected=${expected}`
              );
            }

            totalFilled += filled;
            totalAssigned += expected;
          }

          progressMap[company.id] = {
            total: totalAssigned,
            filled: totalFilled,
            // ✅ No Math.min clamp — warn above surfaces the real bug instead of hiding it
            percentage: totalAssigned > 0
              ? Math.round((totalFilled / totalAssigned) * 100)
              : 0,
            periodsSubmitted,
            consideredPeriods,
          };
        }

        // ✅ Stale/unmounted guard — don't set state if effect was cleaned up
        if (!cancelled) {
          setCompanyProgress(progressMap);
        }
      } catch (error) {
        console.error('Error loading progress:', error);
        if (!cancelled) {
          // ✅ Surface error to UI — users see something instead of silent failure
          setProgressError(error instanceof Error ? error.message : 'Failed to load progress data');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingProgress(false);
        }
      }
    };

    loadProgressData();

    // ✅ Cleanup cancels in-flight state updates if companies changes mid-fetch
    return () => {
      cancelled = true;
    };
  }, [companies]); // isCompanyExcluded and countFilledKPIs assumed stable (module-level or useCallback)

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = company.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.companyCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFund = fundFilter === 'all' || company.fund === fundFilter;
    const matchesIndustry = industryFilter === 'all' || company.firesideCategory === industryFilter;
    const matchesQCategory = qCategoryFilter === 'all' || company.qCategory === qCategoryFilter;

    let matchesStatus = true;
    if (statusFilter !== 'all') {
      const completion = companyProgress[company.id];
      if (statusFilter === 'complete') matchesStatus = completion?.percentage === 100;
      if (statusFilter === 'pending') matchesStatus = completion?.percentage < 100 && completion?.percentage > 0;
      if (statusFilter === 'not-started') matchesStatus = !completion || completion.percentage === 0;
    }

    return matchesSearch && matchesFund && matchesIndustry && matchesQCategory && matchesStatus;
  });

  const handleCompanyAdded = (newCompanyData: {
    name: string;
    industry: Industry;
    revenueStage: RevenueStage;
    contactEmail: string;
    loginEmail: string;
    password: string;
  }) => {
    const newCompanyCode = `FS${String(companies.length + 1).padStart(3, '0')}`;
    const newCompany: Company = {
      id: `company-${Date.now()}`,
      companyCode: newCompanyCode,
      name: newCompanyData.name,
      brand: newCompanyData.name, // Use name as brand for new companies
      fund: 'Fund IV',
      fundCategory: 'CAT II',
      firesideCategory: 'Beauty & Personal Care',
      internalCategory: newCompanyData.industry as Company['internalCategory'],
      investmentStatus: 'Invested',
      industry: newCompanyData.industry,
      revenueStage: newCompanyData.revenueStage,
      contactEmail: newCompanyData.contactEmail,
      loginPassword: generateUniquePassword(newCompanyCode, companies.length),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCompanies(prev => [...prev, newCompany]);
  };

  const handleDeleteCompany = () => {
    if (companyToDelete) {
      setCompanies(prev => prev.filter(c => c.id !== companyToDelete.id));
      toast.success(`${companyToDelete.name} removed from portfolio`);
      setCompanyToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleResetPassword = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      // Reset to the original unique password from static mapping
      const originalPassword = generateUniquePassword(company.companyCode);
      setCompanies(prev => prev.map(c =>
        c.id === companyId
          ? { ...c, loginPassword: originalPassword }
          : c
      ));
    }
  };

  const stats = {
    total: companies.length,
    complete: Object.values(companyProgress).filter(s => s.percentage === 100).length,
    pending: Object.values(companyProgress).filter(s => s.percentage > 0 && s.percentage < 100).length,
    notStarted: companies.length - Object.values(companyProgress).filter(s => s.percentage > 0).length,
  };

  const formatRevenue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    if (value === 0) return '₹0 Cr';
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K Cr`;
    return `₹${value} Cr`;
  };

  // ===== All-companies export =====
  const [isExporting, setIsExporting] = useState(false);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const buildExportDataset = async () => {
    const targets = filteredCompanies;
    const ids = targets.map(c => c.id);

    // const [entriesRes, featuresRes, profilesRes, kpiRes] = await Promise.all([
    //   supabase.from('kpi_entries').select('company_id, kpi_id, quarter, year, value, submitted_at').in('company_id', ids),
    //   supabase.from('company_feature_settings').select('company_id, feature_key, enabled, is_optional').in('company_id', ids),
    //   supabase.from('company_profiles').select('company_id, industry, revenue_stage, internal_category').in('company_id', ids),
    //   supabase.from('kpi_master').select('id, name, esg, category, sub_category, period, feature_module'),
    // ]);
    const [entriesRes, featuresRes, profilesRes, kpiRes] = await Promise.all([
      http.get(`/mis/kpi-entries?companyIds=${ids.join(',')}`),
      http.get(`/mis/company-feature-settings?companyIds=${ids.join(',')}`),
      http.get(`/mis/company-profiles?companyIds=${ids.join(',')}`),
      http.get('/mis/kpi-master'),
    ]);
    
    const entries = entriesRes.data ?? [];
    const features = featuresRes.data ?? [];
    const profiles = profilesRes.data ?? [];
    const kpis = kpiRes.data ?? [];

    const kpiById = new Map((kpiRes.data || []).map((k: any) => [k.id, k]));
    const profileByCompany = new Map((profilesRes.data || []).map((p: any) => [p.company_id, p]));
    const entriesByCompany = new Map<string, any[]>();
    (entriesRes.data || []).forEach((e: any) => {
      const arr = entriesByCompany.get(e.company_id) || [];
      arr.push(e);
      entriesByCompany.set(e.company_id, arr);
    });
    const featuresByCompany = new Map<string, any[]>();
    (featuresRes.data || []).forEach((f: any) => {
      const arr = featuresByCompany.get(f.company_id) || [];
      arr.push(f);
      featuresByCompany.set(f.company_id, arr);
    });

    // Flat rows: one per KPI entry
    const flatRows = targets.flatMap(c => {
      const entries = entriesByCompany.get(c.id) || [];
      const profile = profileByCompany.get(c.id);
      const progress = companyProgress[c.id];
      return entries.map(e => {
        const k: any = kpiById.get(e.kpi_id) || {};
        return {
          'Company ID': c.companyCode,
          'Brand': c.brand,
          'Legal Name': c.name,
          'Fund': c.fund,
          'Fireside Category': c.firesideCategory,
          'Internal Category': profile['internal_category'] ?? c.internalCategory ?? '',
          'Industry': profile['industry'] ?? c.industry,
          'Revenue Stage': profile['revenue_stage'] ?? c.revenueStage,
          'Q Category': c.qCategory ?? '',
          'Investment Status': c.investmentStatus,
          'Revenue FY24-25 (Cr)': c.revenueFY2425 ?? '',
          'ARR JAS 2025 (Cr)': c.arrJAS2025 ?? '',
          'Progress %': progress?.percentage ?? '',
          'Periods Submitted': progress?.periodsSubmitted ?? '',
          'Year': e.year,
          'Quarter': e.quarter,
          'KPI ID': e.kpi_id,
          'KPI Name': k.name ?? '',
          'ESG': k.esg ?? '',
          'Category': k.category ?? '',
          'Sub-Category': k.sub_category ?? '',
          'Period': k.period ?? '',
          'Feature Module': k.feature_module ?? '',
          'Value': e.value ?? '',
          'Submitted At': e.submitted_at ?? '',
        };
      });
    });

    // Company-level summary rows (one per company, no KPIs)
    const companyRows = targets.map(c => {
      const profile = profileByCompany.get(c.id);
      const progress = companyProgress[c.id];
      const enabled = (featuresByCompany.get(c.id) || []).filter(f => f.enabled).map(f => f.feature_key);
      return {
        'Company ID': c.companyCode,
        'Brand': c.brand,
        'Legal Name': c.name,
        'Fund': c.fund,
        'Fireside Category': c.firesideCategory,
        'Internal Category': profile['internal_category'] ?? c.internalCategory ?? '',
        'Industry': profile['industry'] ?? c.industry,
        'Revenue Stage': profile['revenue_stage'] ?? c.revenueStage,
        'Q Category': c.qCategory ?? '',
        'Investment Status': c.investmentStatus,
        'Founder': c.founder?.name ?? '',
        'Founder Email': c.founder?.email ?? '',
        'ESG Connect': c.esgConnect?.name ?? '',
        'ESG Connect Email': c.esgConnect?.email ?? '',
        'Contact Email': c.contactEmail,
        'Revenue FY24-25 (Cr)': c.revenueFY2425 ?? '',
        'ARR JAS 2025 (Cr)': c.arrJAS2025 ?? '',
        'Progress %': progress?.percentage ?? '',
        'Periods Submitted': progress?.periodsSubmitted ?? '',
        'Enabled Features': enabled.join('; '),
      };
    });

    return { targets, flatRows, companyRows, entriesByCompany, featuresByCompany, profileByCompany, kpiById };
  };

  const handleExportAll = async (format: 'csv' | 'json' | 'xlsx') => {
    if (isExporting) return;
    setIsExporting(true);
    const stamp = new Date().toISOString().slice(0, 10);
    try {
      const { targets, flatRows, companyRows, entriesByCompany, featuresByCompany, profileByCompany, kpiById } = await buildExportDataset();

      if (format === 'csv') {
        const headers = Object.keys(flatRows[0] || companyRows[0] || {});
        const escape = (v: unknown) => {
          const s = v == null ? '' : String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const rowsToWrite = flatRows.length ? flatRows : companyRows;
        const csv = [
          headers.join(','),
          ...rowsToWrite.map(r => headers.map(h => escape((r as any)[h])).join(',')),
        ].join('\n');
        downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `Portfolio_Export_${stamp}.csv`);
      } else if (format === 'xlsx') {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(companyRows), 'Companies');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flatRows), 'KPI Entries');
        XLSX.writeFile(wb, `Portfolio_Export_${stamp}.xlsx`);
      } else {
        const payload = {
          exportedAt: new Date().toISOString(),
          companyCount: targets.length,
          companies: targets.map(c => {
            const profile = profileByCompany.get(c.id);
            const progress = companyProgress[c.id];
            const entries = (entriesByCompany.get(c.id) || []).map(e => {
              const k: any = kpiById.get(e.kpi_id) || {};
              return {
                year: e.year,
                quarter: e.quarter,
                kpiId: e.kpi_id,
                kpiName: k.name ?? '',
                esg: k.esg ?? '',
                category: k.category ?? '',
                subCategory: k.sub_category ?? '',
                period: k.period ?? '',
                featureModule: k.feature_module ?? '',
                value: e.value,
                submittedAt: e.submitted_at,
              };
            });
            const features = (featuresByCompany.get(c.id) || []).map(f => ({
              key: f.feature_key, enabled: f.enabled, isOptional: f.is_optional,
            }));
            return {
              ...c,
              loginPassword: undefined,
              profile,
              progress,
              features,
              kpiEntries: entries,
            };
          }),
        };
        downloadBlob(
          new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
          `Portfolio_Export_${stamp}.json`
        );
      }

      toast.success(`Exported ${targets.length} companies as ${format.toUpperCase()}`);
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolio Companies"
        subtitle="Manage and track ESG data across your portfolio"
        actions={
          <div className="flex gap-2">
            <GenerateEmailDialog />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isExporting}>
                  {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Export All
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExportAll('xlsx')}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportAll('csv')}>
                  <FileText className="w-4 h-4 mr-2" /> CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportAll('json')}>
                  <FileJson className="w-4 h-4 mr-2" /> JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={() => setCredentialsDialogOpen(true)}>
              <Key className="w-4 h-4 mr-2" />
              View Credentials
            </Button>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
          </div>
        }
      />

      <AddCompanyDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onCompanyAdded={handleCompanyAdded}
      />

      <CompanyCredentialsDialog
        open={credentialsDialogOpen}
        onOpenChange={setCredentialsDialogOpen}
        companies={companies}
        onResetPassword={handleResetPassword}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{companyToDelete?.name}</strong> from the portfolio? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCompany} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick Stats */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          className="cursor-pointer px-3 py-1.5 text-xs"
          onClick={() => setStatusFilter('all')}
        >
          All ({stats.total})
        </Badge>
        <Badge
          variant={statusFilter === 'complete' ? 'default' : 'outline'}
          className="cursor-pointer px-3 py-1.5 text-xs"
          onClick={() => setStatusFilter('complete')}
        >
          Complete ({stats.complete})
        </Badge>
        <Badge
          variant={statusFilter === 'pending' ? 'destructive' : 'outline'}
          className="cursor-pointer px-3 py-1.5 text-xs"
          onClick={() => setStatusFilter('pending')}
        >
          In Progress ({stats.pending})
        </Badge>
        <Badge
          variant={statusFilter === 'not-started' ? 'destructive' : 'outline'}
          className="cursor-pointer px-3 py-1.5 text-xs"
          onClick={() => setStatusFilter('not-started')}
        >
          Not Started ({stats.notStarted})
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={fundFilter} onValueChange={setFundFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Fund" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Funds</SelectItem>
            {funds.map((fund) => (
              <SelectItem key={fund} value={fund}>
                {fund}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {industries.map((industry) => (
              <SelectItem key={industry} value={industry}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={qCategoryFilter} onValueChange={setQCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Q Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Q Categories</SelectItem>
            {qCategories.map((qCat) => (
              <SelectItem key={qCat} value={qCat}>
                {qCat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Company List Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Fund</TableHead>
              <TableHead>Q Category</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead className="text-right">FY25 Revenue</TableHead>
              <TableHead className="text-center">Progress</TableHead>
              <TableHead className="text-center">Submitted</TableHead>
              <TableHead className="text-center">KPIs Filled</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompanies.map((company) => {
              const completion = companyProgress[company.id] || {
                total: totalKPIs,
                filled: 0,
                percentage: 0,
                periodsSubmitted: 0,
                consideredPeriods: 5,
              };

              return (
                <TableRow key={company.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{company.brand}</p>
                        <p className="text-xs text-muted-foreground">
                          {company.name} • <code className="bg-muted px-1.5 py-0.5 rounded">{company.companyCode}</code>
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {company.fund}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-medium">
                      {company.qCategory || '—'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {company.firesideCategory}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatRevenue(company.revenueFY2425)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      {isLoadingProgress ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : (
                        <CompletionRing percentage={completion.percentage} size="sm" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={completion.periodsSubmitted === completion.consideredPeriods ? 'default' : completion.periodsSubmitted > 0 ? 'destructive' : 'outline'}
                      className="text-xs font-medium"
                    >
                      {completion.periodsSubmitted}/{completion.consideredPeriods}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium">{completion.filled}/{completion.total}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/portfolio/${company.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setCompanyToDelete(company);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No companies found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Portfolio;

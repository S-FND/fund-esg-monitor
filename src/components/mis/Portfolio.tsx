import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { cn } from '@/lib/utils';

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

// const isKPIGroupFilled = (
//   kpi: { id: string; fields: { id: string }[] },
//   entries: { kpi_id: string; value: string | null }[]
// ): boolean => {
//   const validEntries = entries.filter(
//     e => e.value !== null && e.value !== '' && e.value.trim() !== ''
//   );
//   return kpi.fields.some(field => {
//     return validEntries.some(entry => {
//       if (entry.kpi_id === field.id) return true;
//       if (GENERIC_FIELD_IDS.has(field.id)) {
//         return entry.kpi_id.includes(kpi.id) &&
//           (entry.kpi_id.includes(field.id) || entry.kpi_id.endsWith(`_${field.id}`));
//       }
//       if (entry.kpi_id.endsWith(`_${field.id}`)) return true;
//       if (field.id.length >= 12 && entry.kpi_id.includes(field.id)) return true;
//       return false;
//     });
//   });
// };

const isKPIGroupFilled = (
  kpi: { id: string; fields: { id: string }[] },
  entries: { kpi_id: string; value: string | null }[]
): boolean => {
  const validEntries = entries.filter(
    e => e.value !== null && e.value !== '' && e.value.trim() !== '' && !e.kpi_id.endsWith('_additional_comments')
  );

  // Direct match: entry kpi_id equals the KPI group id itself
  // Handles simple single-field KPIs like net_revenue, revenue_tier2_plus
  if (validEntries.some(entry => entry.kpi_id === kpi.id)) return true;

  return kpi.fields.some(field => {
    return validEntries.some(entry => {
      // Exact match on field id
      if (entry.kpi_id === field.id) return true;

      // Composite key: kpi_id + field_id (e.g., employees_wc_male_fulltime)
      if (entry.kpi_id === `${kpi.id}_${field.id}`) return true;

      // For generic/shared field IDs, require the entry also contains the KPI id
      if (GENERIC_FIELD_IDS.has(field.id)) {
        return entry.kpi_id.includes(kpi.id) && 
          (entry.kpi_id.includes(field.id) || entry.kpi_id.endsWith(`_${field.id}`));
      }

      // For unique field IDs, suffix match is safe
      if (entry.kpi_id.endsWith(`_${field.id}`)) return true;

      // Long field IDs (>=12 chars) are unique enough for includes
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

// Helper to map snake_case from API to camelCase for Company type
const mapApiCompanyToCompany = (apiCompany: any): Company => {
  return {
    id: apiCompany.companyId || apiCompany.id,
    companyCode: apiCompany.companyCode || apiCompany.company_code || '',
    brand: apiCompany.brand || '',
    name: apiCompany.legal_name || apiCompany.name || '',
    fund: apiCompany.fund || 'Fund I',
    fundCategory: apiCompany.fund_category || '',
    firesideCategory: apiCompany.fireside_category || '',
    internalCategory: apiCompany.internal_category || '',
    investmentStatus: apiCompany.investment_status || 'Invested',
    industry: apiCompany.industry || '',
    revenueStage: apiCompany.revenue_stage || '0-50',
    contactEmail: apiCompany.contact_email || '',
    company_id: apiCompany.company_id || '',
    loginPassword: apiCompany.login_password || '',
    createdAt: apiCompany.created_at || new Date().toISOString().split('T')[0],
    revenueFY2425: apiCompany.revenue_fy24_25_cr ? parseFloat(apiCompany.revenue_fy24_25_cr) : undefined,
    arrJAS2025: apiCompany.arr_jas_2025_cr ? parseFloat(apiCompany.arr_jas_2025_cr) : undefined,
    qCategory: apiCompany.q_category || '',
    fl: apiCompany.fl || '',
    founder: {
      name: apiCompany.founder || '',
      email: apiCompany.founder_email || '',
    },
    esgConnect: {
      name: apiCompany.esg_connect || '',
      email: apiCompany.esg_connect_email || '',
    },
  };
};

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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [companyProgress, setCompanyProgress] = useState<Record<string, CompanyProgress>>({});
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<string>('2026'); // Default year filter

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

  // Fetch companies from API
  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoadingCompanies(true);
      setCompaniesError(null);
      try {
        const response = await http.get('mis/companies?investmentStatus=Invested');
        console.log('Companies API response:', response);
        
        if (response.data && Array.isArray(response.data)) {
          // Map snake_case to camelCase
          const mappedCompanies = response.data.map(mapApiCompanyToCompany);
          setCompanies(mappedCompanies);
        } else {
          setCompanies([]);
          setCompaniesError('No companies found');
        }
      } catch (err) {
        console.error('Failed to load companies:', err);
        setCompaniesError(err instanceof Error ? err.message : 'Failed to load companies');
        toast.error('Could not load portfolio companies.');
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, []);

  // Helper to get KPI count for a feature from FEATURE_FIELD_MAPPINGS
  const getFeatureKPICount = (featureKey: string): number => {
    const mapping = FEATURE_FIELD_MAPPINGS[featureKey];
    if (!mapping) return 0;
    return mapping.kpis.filter(kpi => !kpi.excludeFromProgress).length;
  };

  // Calculate total KPIs from FEATURE_FIELD_MAPPINGS
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

  // Load progress data
  useEffect(() => {
    let cancelled = false;

    const loadProgressData = async () => {
      if (companies.length === 0) {
        setIsLoadingProgress(false);
        return;
      }
    
      setIsLoadingProgress(true);
      setProgressError(null);
    
      try {
        // Get all entries for the year
        const [featureResult, entriesResult] = await Promise.all([
          http.get('mis/company-feature-settings?enabled=true'),
          http.get(`mis/kpi-entries?year=${filterYear}`)
        ]);
    
        console.log('📊 Total entries:', entriesResult.data?.length || 0);
        console.log('📊 Total companies:', companies.length);
    
        // Group features by company_id (from feature settings)
        const featuresByCompany = new Map<string, Set<string>>();
        for (const row of featureResult.data ?? []) {
          const companyId = row.company_id || row.companyId;
          if (companyId) {
            if (!featuresByCompany.has(companyId)) {
              featuresByCompany.set(companyId, new Set());
            }
            featuresByCompany.get(companyId)!.add(row.feature_key);
          }
        }
    
        // ✅ FIX: Group entries by companyId (e.g., "company-1", "company-2")
        const entriesByCompany = new Map<string, any[]>();
        for (const row of entriesResult.data ?? []) {
          const companyId = row.companyId; // ✅ Use companyId from entry
          if (companyId) {
            if (!entriesByCompany.has(companyId)) {
              entriesByCompany.set(companyId, []);
            }
            entriesByCompany.get(companyId)!.push(row);
          }
        }
    
        console.log('📊 Company IDs in entries:', Array.from(entriesByCompany.keys()));
    
        const progressMap: Record<string, CompanyProgress> = {};
    
        // Determine periods based on year
        const getPeriodsForYear = (year: string): string[] => {
          const yearNum = parseInt(year);
          if (yearNum <= 2024) {
            return ['Q1', 'Q2', 'Q3', 'Q4'];
          } else if (yearNum === 2025) {
            return ['Q1', 'Q2', 'Q3', 'Q4', 'FY'];
          } else {
            // For 2026+, get unique quarters from entries
            const quarters = new Set<string>();
            for (const entries of entriesByCompany.values()) {
              for (const entry of entries) {
                if (entry.quarter && entry.quarter !== 'FY') {
                  quarters.add(entry.quarter);
                }
              }
            }
            // return quarters.size > 0 ? Array.from(quarters).sort() : ['Q1', 'Q2', 'Q3', 'Q4']; // stattic for 2026 Q1
            return ['Q1'];
          }
        };
    
        const periods = getPeriodsForYear(filterYear);
        console.log(`📊 Periods for ${filterYear}:`, periods);
    
        for (const company of companies) {
          // ✅ FIX: Use company.company_id to match with entry.companyId
          const companyId = company.company_id; // e.g., "company-2"
          
          // Log for debugging
          console.log(`🔍 Company: ${company.brand}, company_id: ${companyId}`);
    
          const enabledKeys = featuresByCompany.get(companyId);
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
    
          // ✅ Get entries for this company using the company_id
          const allEntries = entriesByCompany.get(companyId) ?? [];
          
          console.log(`📊 ${company.brand}: ${allEntries.length} entries found`);
    
          let totalFilled = 0;
          let totalAssigned = 0;
          let periodsSubmitted = 0;
          let consideredPeriods = 0;
    
          for (const period of periods) {
            if (isCompanyExcluded(companyId, period, Number(filterYear))) {
              continue;
            }
    
            consideredPeriods++;
    
            const periodEntries = allEntries.filter(e => e.quarter === period);
    
            const hasSubmitted = periodEntries.some(e => e.submitted_at !== null);
            if (hasSubmitted) periodsSubmitted++;
    
            const isAnnual = period === 'FY';
            const features = isAnnual ? annualFeatures : quarterlyFeatures;
            const expected = isAnnual ? annualTotal : quarterlyTotal;
    
            const filled = countFilledKPIs(features, periodEntries);
    
            if (filled > expected) {
              console.warn(
                `[progress] Overcount for company=${companyId} period=${period}: filled=${filled} > expected=${expected}`
              );
            }
    
            totalFilled += filled;
            totalAssigned += expected;
          }
    
          if (consideredPeriods === 0) {
            consideredPeriods = periods.length;
          }
    
          progressMap[company.id] = {
            total: totalAssigned,
            filled: totalFilled,
            percentage: totalAssigned > 0
              ? Math.round((totalFilled / totalAssigned) * 100)
              : 0,
            periodsSubmitted,
            consideredPeriods: consideredPeriods,
          };
        }
    
        if (!cancelled) {
          setCompanyProgress(progressMap);
          console.log('✅ Progress updated:', progressMap);
        }
      } catch (error) {
        console.error('Error loading progress:', error);
        if (!cancelled) {
          setProgressError(error instanceof Error ? error.message : 'Failed to load progress data');
          toast.error('Failed to load progress data');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingProgress(false);
        }
      }
    };

    loadProgressData();

    return () => {
      cancelled = true;
    };
  }, [companies, filterYear]);

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
    company_id: string;
    loginEmail: string;
    password: string;
  }) => {
    const newCompanyCode = `FS${String(companies.length + 1).padStart(3, '0')}`;
    const newCompany: Company = {
      id: `company-${Date.now()}`,
      companyCode: newCompanyCode,
      name: newCompanyData.name,
      brand: newCompanyData.name,
      fund: 'Fund IV',
      fundCategory: 'CAT II',
      firesideCategory: 'Beauty & Personal Care',
      internalCategory: newCompanyData.industry as Company['internalCategory'],
      investmentStatus: 'Invested',
      industry: newCompanyData.industry,
      revenueStage: newCompanyData.revenueStage,
      contactEmail: newCompanyData.contactEmail,
      company_id: newCompanyData.company_id,
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

    const [entriesRes, featuresRes, profilesRes, kpiRes] = await Promise.all([
      http.get(`mis/kpi-entries?companyIds=${ids.join(',')}`),
      http.get(`mis/company-feature-settings?companyIds=${ids.join(',')}`),
      http.get(`mis/company-profiles?companyIds=${ids.join(',')}`),
      http.get('mis/kpi-masters'),
    ]);

    const entries = entriesRes.data ?? [];
    const features = featuresRes.data ?? [];
    const profiles = profilesRes.data ?? [];
    const kpis = kpiRes.data ?? [];

    const kpiById = new Map((kpiRes.data || []).map((k: any) => [k.id, k]));
    const profileByCompany = new Map((profilesRes.data || []).map((p: any) => [p.company_id, p]));
    const entriesByCompany = new Map<string, any[]>();
    (entriesRes.data || []).forEach((e: any) => {
      const companyId = e.company_id || e.companyId;
      const arr = entriesByCompany.get(companyId) || [];
      arr.push(e);
      entriesByCompany.set(companyId, arr);
    });
    const featuresByCompany = new Map<string, any[]>();
    (featuresRes.data || []).forEach((f: any) => {
      const companyId = f.company_id || f.companyId;
      const arr = featuresByCompany.get(companyId) || [];
      arr.push(f);
      featuresByCompany.set(companyId, arr);
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
          'Internal Category': profile?.['internal_category'] ?? c.internalCategory ?? '',
          'Industry': profile?.['industry'] ?? c.industry,
          'Revenue Stage': profile?.['revenue_stage'] ?? c.revenueStage,
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

    // Company-level summary rows
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
        'Internal Category': profile?.['internal_category'] ?? c.internalCategory ?? '',
        'Industry': profile?.['industry'] ?? c.industry,
        'Revenue Stage': profile?.['revenue_stage'] ?? c.revenueStage,
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

  // Loading state
  if (isLoadingCompanies) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Portfolio Companies"
          subtitle="Manage and track ESG data across your portfolio"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" disabled>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </Button>
            </div>
          }
        />
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (companiesError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Portfolio Companies"
          subtitle="Manage and track ESG data across your portfolio"
        />
        <div className="flex justify-center py-12">
          <div className="text-center">
            <p className="text-red-500">Error loading companies: {companiesError}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
        
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2026">2026</SelectItem>
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
                consideredPeriods: filterYear == '2025' ? 5 : 1,
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
                      variant="outline"
                      className={cn(
                        "text-xs font-medium",
                        completion.periodsSubmitted === completion.consideredPeriods
                          ? "border-green-400 text-green-600 bg-green-50"
                          : completion.periodsSubmitted > 0
                            ? "border-orange-400 text-orange-500 bg-orange-50"
                            : "border-gray-300 text-gray-500 bg-gray-50"
                      )}
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
                        onClick={() => navigate(`/mis/portfolio/${company.company_id}`)}
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
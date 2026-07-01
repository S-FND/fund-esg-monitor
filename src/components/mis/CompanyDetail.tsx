import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAllQuartersProgress } from '@/hooks/useAllQuartersProgress';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CompletionRing } from '@/components/CompletionRing';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { mockCompanies } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { RevenueStage, Industry, KPI, ESGCategory, CoreLevel, KPIIndustry, InternalCategory, mapIndustryToKPIIndustries } from '@/types/esg';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Calendar,
  FileSpreadsheet,
  Pencil,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  Loader2,
  FileText,
  FileJson,
} from 'lucide-react';
import { QUARTERLY_FEATURES, ANNUAL_FEATURES } from '@/hooks/useCompanyFeatures';
import { getFeatureKPIs, FeatureKPI } from '@/lib/featureKPITemplate';
import { EDIT_RIGHTS_PAUSED } from '@/lib/companyAccessControl';
import { http } from '@/utils/httpInterceptor';
import { error } from 'console';

// Helper to convert database KPI to app KPI type
interface DBKPIMaster {
  id: string;
  name: string;
  esg: string;
  category: string;
  sub_category: string | null;
  metric_type: string | null;
  period: string | null;
  definition: string | null;
  frequency: string | null;
  core_level: string | null;
  revenue_stages: string[] | null;
  industries: string[] | null;
  is_custom: boolean | null;
  feature_module: string | null;
  created_at: string;
}

interface KPIEntry {
  kpi_id: string;
  value: string | null;
  quarter: string;
  year: number;
  submitted_at: string | null;
}

interface KPIOverride {
  id: string;
  company_id: string;
  kpi_id: string;
  core_level_override: 'Mandatory' | 'Optional';
}

const dbToKPI = (row: DBKPIMaster): KPI => {
  const parseCoreLevel = (level: string | null): CoreLevel => {
    if (!level) return 1;
    const normalized = level.toLowerCase();
    if (normalized.includes('mandatory') || normalized.includes('core 1')) return 1;
    return 2; // Everything else maps to Optional
  };

  return {
    id: row.id,
    name: row.name,
    esg: row.esg as ESGCategory,
    category: row.category,
    subCategory: row.sub_category || '',
    metricType: row.metric_type || '',
    period: (row.period === 'Annual' ? 'Annual' : 'Quarterly') as 'Quarterly' | 'Annual',
    definition: row.definition || '',
    frequency: row.frequency || row.period || 'Quarterly',
    revenueStages: (row.revenue_stages || []) as RevenueStage[],
    industries: (row.industries || []) as KPIIndustry[],
    coreLevel: parseCoreLevel(row.core_level),
    featureModule: row.feature_module as any,
    createdAt: row.created_at,
    quarter: 'Q4',
    year: 2024,
  };
};

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4', 'AY'];
const YEARS = [2026,2025, 2024, 2023, 2022, 2021];

// Helper to format JSON values for display
const formatDisplayValue = (value: string): string => {
  if (!value) return '';
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return 'None added';
      return parsed.map((item: any, i: number) => {
        // Handle awards
        if (item.title) return `${i + 1}. ${item.title}${item.year ? ` (${item.year})` : ''}${item.description ? ` - ${item.description}` : ''}`;
        // Handle media mentions
        if (item.source) return `${i + 1}. ${item.title || 'Untitled'}${item.source ? ` — ${item.source}` : ''}${item.link ? ` [${item.link}]` : ''}`;
        // Handle initiatives (CSR/other)
        if (item.description || item.backgroundAndProblem) return `${i + 1}. ${item.description || item.backgroundAndProblem || ''}${item.impact || item.impactAndOutcomes ? ` → Impact: ${item.impact || item.impactAndOutcomes}` : ''}`;
        // Handle grievances
        if (item.stakeholder) return `${i + 1}. [${item.stakeholder}] ${item.details || ''}`;
        return `${i + 1}. ${JSON.stringify(item)}`;
      }).join('\n');
    }
  } catch {
    // Not JSON, return as-is
  }
  return value;
};

// Expandable row component for long text values
const ExpandableKPIRow = ({ kpi, hasValue }: { kpi: { key: string; name: string; unit: string; value: string }; hasValue: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const displayValue = hasValue ? formatDisplayValue(kpi.value) : '';
  const isLongText = hasValue && displayValue.length > 50;

  return (
    <tr key={kpi.key} className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <p className="font-medium text-sm">{kpi.name}</p>
      </td>
      <td className="px-4 py-3">
        <Badge variant="outline" className="text-xs">
          {kpi.unit}
        </Badge>
      </td>
      <td className="px-4 py-3 max-w-[400px]">
        {hasValue ? (
          <div>
            <span className={`font-medium text-sm ${expanded ? 'whitespace-pre-wrap break-words' : 'line-clamp-1'}`}>
              {expanded ? displayValue : (displayValue.length > 50 ? `${displayValue.substring(0, 50)}...` : displayValue)}
            </span>
            {isLongText && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-0.5 text-xs text-primary hover:underline mt-1"
              >
                {expanded ? (
                  <>Show less <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>View all <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground italic text-sm">Not filled</span>
        )}
      </td>
      <td className="px-4 py-3">
        {hasValue ? (
          <div className="flex items-center gap-1.5" style={{ color: "hsl(142, 72%, 29%)" }}>
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-medium">Filled</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5" style={{ color: "hsl(38, 92%, 50%)" }}>
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">Pending</span>
          </div>
        )}
      </td>
    </tr>
  );
};

// EditDataButton removed – inline editing is now managed via local state in CompanyDetail

const CompanyDetail = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();

  // Loading states
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingKPIs, setIsLoadingKPIs] = useState(true);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [allQuarterEntries, setAllQuarterEntries] = useState<Record<string, Record<string, KPIEntry>>>({});

  // Data states
  const [allKPIs, setAllKPIs] = useState<KPI[]>([]);
  const [companyProfile, setCompanyProfile] = useState<{ revenueStage: RevenueStage; industry: Industry; internalCategory?: InternalCategory } | null>(null);
  const [kpiEntries, setKpiEntries] = useState<Record<string, KPIEntry>>({});
  const [kpiOverrides, setKpiOverrides] = useState<Record<string, KPIOverride>>({});
  const [featureSettings, setFeatureSettings] = useState<Record<string, { enabled: boolean; isOptional: boolean }>>({});
  const [isLoadingOverrides, setIsLoadingOverrides] = useState(true);

  // Edit core level state
  const [editingKpiId, setEditingKpiId] = useState<string | null>(null);
  const [isSavingOverride, setIsSavingOverride] = useState(false);

  // Inline KPI editing state
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [isSavingInline, setIsSavingInline] = useState(false);
  const [progressRefreshKey, setProgressRefreshKey] = useState(0);

  // Filter states
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Period selector states
  const [selectedQuarter, setSelectedQuarter] = useState<string>('Q4');
  const [selectedYear, setSelectedYear] = useState<number>(2025);

  // Edit profile dialog states
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editIndustry, setEditIndustry] = useState<Industry>('Beauty & Personal Care');
  const [editRevenueStage, setEditRevenueStage] = useState<RevenueStage>('0-50');
  const [editInternalCategory, setEditInternalCategory] = useState<InternalCategory>('BPC');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const industries: Industry[] = [
    'Beauty & Personal Care',
    'Fashion & Lifestyle',
    'Health & Wellness',
    'Food & Beverage',
    'Home & Décor',
    'Platform Enablers'
  ];

  const revenueStages: RevenueStage[] = ['0-50', '50-100', '100-500', '500+'];

  const internalCategories: InternalCategory[] = [
    'BPC',
    'Devices (incl. Healthcare)',
    'F&B (incl. nutra health)',
    'Fashion',
    'Home',
    'Services (incl. Health)',
    'Gaming/Platform/Others',
    'BPC + F&B (incl. nutra health) + Services',
    'BPC + Platform',
    'Devices (incl. Healthcare) + Services',
    'Gaming/Platform/Others + Services'
  ];

  // Get company from mock data
  const company = mockCompanies.find(c => c.id === companyId);

  // Load KPIs from database
  useEffect(() => {
    const loadKPIs = async () => {
      try {
        // const { data, error } = await supabase
        //   .from('kpi_master')
        //   .select('*')
        //   .order('created_at', { ascending: true });

        const { data: { data: kpis } } = await http.get<{ data: DBKPIMaster[] }>("mis/kpi-masters");

        if (!kpis) throw new Error("Failed to load KPIs");

        setAllKPIs(kpis.map(dbToKPI));


        // if (data) {
        //   const mappedKPIs = (data.data as DBKPIMaster[]).map(dbToKPI);
        //   setAllKPIs(mappedKPIs);
        // }
      } catch (error) {
        console.error('Error loading KPIs:', error);
      } finally {
        setIsLoadingKPIs(false);
      }
    };

    loadKPIs();
  }, []);

  // Load company profile from database
  useEffect(() => {
    const loadProfile = async () => {
      if (!companyId) return;

      try {
        // const { data, error } = await supabase
        //   .from('company_profiles')
        //   .select('revenue_stage, industry, internal_category')
        //   .eq('company_id', companyId)
        //   .maybeSingle();

        let companyProfileResponse = await http.get<{ revenue_stage: RevenueStage; industry: Industry; internal_category?: InternalCategory }>(`mis/company-profiles?companyId=${companyId}`);

        // if (error) throw error;
        const data = companyProfileResponse.data;
        if (data) {
          setCompanyProfile({
            revenueStage: data[0].revenue_stage as RevenueStage,
            industry: data[0].industry as Industry,
            internalCategory: data[0].internal_category as InternalCategory | undefined,
          });
        } else if (company) {
          // Fallback to mock data if no profile in database
          setCompanyProfile({
            revenueStage: company.revenueStage as RevenueStage,
            industry: company.industry as Industry,
            internalCategory: company.internalCategory as InternalCategory,
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [companyId, company]);

  // Load KPI entries from database for selected period
  useEffect(() => {
    const loadEntries = async () => {
      if (!companyId) return;
      setIsLoadingEntries(true);

      try {
        // Load entries for all quarters of the selected year
        // const { data, error } = await supabase
        //   .from('kpi_entries')
        //   .select('kpi_id, value, quarter, year, submitted_at')
        //   .eq('company_id', companyId)
        //   .eq('year', selectedYear);

        const { data, error } = await http.get(`mis/kpi-entries?companyId=${companyId}&year=${selectedYear}`);

        if (error) throw error;


        if (data) {
          // Group by quarter
          const byQuarter: Record<string, Record<string, KPIEntry>> = {};
          data.forEach(entry => {
            if (!byQuarter[entry.quarter]) byQuarter[entry.quarter] = {};
            byQuarter[entry.quarter][entry.kpi_id] = entry;
          });
          setAllQuarterEntries(byQuarter);
          // Set selected quarter entries for the detail view
          setKpiEntries(byQuarter[selectedQuarter] || {});
        }
      } catch (error) {
        console.error('Error loading entries:', error);
      } finally {
        setIsLoadingEntries(false);
      }
    };

    loadEntries();
  }, [companyId, selectedYear]);

  // Update kpiEntries when selectedQuarter changes (without re-fetching)
  // AY maps to 'FY' in the database
  useEffect(() => {
    const dbQuarter = selectedQuarter === 'AY' ? 'FY' : selectedQuarter;
    setKpiEntries(allQuarterEntries[dbQuarter] || {});
  }, [selectedQuarter, allQuarterEntries]);

  // Load KPI overrides for this company
  useEffect(() => {
    const loadOverrides = async () => {
      if (!companyId) return;

      try {
        // const { data, error } = await supabase
        //   .from('company_kpi_overrides')
        //   .select('*')
        //   .eq('company_id', companyId);

        const { data, error } = await http.get<{ data: KPIOverride[] }>(`mis/company-kpi-overrides?companyId=${companyId}`);

        if (error) throw error;

        if (data && data.data) {
          const overridesMap: Record<string, KPIOverride> = {};
          data.data.forEach(override => {
            overridesMap[override.kpi_id] = override as KPIOverride;
          });
          setKpiOverrides(overridesMap);
        }
      } catch (error) {
        console.error('Error loading KPI overrides:', error);
      } finally {
        setIsLoadingOverrides(false);
      }
    };

    loadOverrides();
  }, [companyId]);

  // Load feature settings for this company
  useEffect(() => {
    const loadFeatureSettings = async () => {
      if (!companyId) return;

      try {
        // const { data, error } = await supabase
        //   .from('company_feature_settings')
        //   .select('feature_key, enabled, is_optional')
        //   .eq('company_id', companyId);

        const { data, error } = await http.get< { feature_key: string; enabled: boolean; is_optional: boolean }[] >(`mis/company-feature-settings?companyId=${companyId}`);

        if (error) throw error;
        if (data ) {
          const settingsMap: Record<string, { enabled: boolean; isOptional: boolean }> = {};
          data.forEach(setting => {
            settingsMap[setting.feature_key] = {
              enabled: setting.enabled,
              isOptional: setting.is_optional
            };
          });
          setFeatureSettings(settingsMap);
        }
      } catch (error) {
        console.error('Error loading feature settings:', error);
      }
    };

    loadFeatureSettings();
  }, [companyId]);

  // Get effective core level for a KPI (considering overrides and feature settings)
  const getEffectiveCoreLevel = (kpi: KPI): CoreLevel => {
    // First check for direct KPI override
    const override = kpiOverrides[kpi.id];
    if (override) {
      return override.core_level_override === 'Mandatory' ? 1 : 2;
    }

    // Then check if the feature module is marked as optional
    if (kpi.featureModule) {
      const featureSetting = featureSettings[kpi.featureModule];
      if (featureSetting?.isOptional) {
        return 2; // Feature is optional, so all its KPIs are optional
      }
    }

    // Fall back to the master KPI core level
    return kpi.coreLevel;
  };

  // Handle saving core level override
  const handleSaveCoreOverride = async (kpiId: string, newCoreLevel: 'Mandatory' | 'Optional') => {
    if (EDIT_RIGHTS_PAUSED) {
      toast.error('Editing is paused for all users until further notice.');
      setEditingKpiId(null);
      return;
    }
    if (!companyId) return;

    setIsSavingOverride(true);
    try {
      const existingOverride = kpiOverrides[kpiId];

      // Get the KPI's original core level from master
      const kpi = allKPIs.find(k => k.id === kpiId);
      const masterCoreLevel = kpi?.coreLevel === 1 ? 'Mandatory' : 'Optional';

      // Check if the feature makes it optional
      let featureMakesOptional = false;
      if (kpi?.featureModule) {
        const featureSetting = featureSettings[kpi.featureModule];
        featureMakesOptional = featureSetting?.isOptional || false;
      }

      // Determine if we need to keep, update, or delete the override
      const effectiveDefault = featureMakesOptional ? 'Optional' : masterCoreLevel;

      if (newCoreLevel === effectiveDefault && !existingOverride) {
        // No change needed, already at default
        setEditingKpiId(null);
        return;
      }

      if (newCoreLevel === effectiveDefault && existingOverride) {
        // Delete the override as it matches the default now
        // const { error } = await supabase
        //   .from('company_kpi_overrides')
        //   .delete()
        //   .eq('id', existingOverride.id);

        const { error } = await http.delete(`mis/company-kpi-overrides?overrideId=${existingOverride.id}`);

        if (error) throw error;

        // Remove from local state
        const updatedOverrides = { ...kpiOverrides };
        delete updatedOverrides[kpiId];
        setKpiOverrides(updatedOverrides);

        toast.success('Core level reset to default');
      } else {
        // Upsert the override
        const { data, error } = await http.put(`mis/company-kpi-overrides?overrideId=${existingOverride.id}`, {
          company_id: companyId,
          kpi_id: kpiId,
          core_level_override: newCoreLevel,
          updated_at: new Date().toISOString()
        });

        if (error) throw error;

        // Update local state
        setKpiOverrides(prev => ({
          ...prev,
          [kpiId]: data as KPIOverride
        }));

        toast.success(`KPI set to ${newCoreLevel}`);
      }

      setEditingKpiId(null);
    } catch (error) {
      console.error('Error saving core level override:', error);
      toast.error('Failed to update core level');
    } finally {
      setIsSavingOverride(false);
    }
  };

  // Open edit dialog with current values
  const handleOpenEditProfile = () => {
    if (companyProfile) {
      setEditIndustry(companyProfile.industry);
      setEditRevenueStage(companyProfile.revenueStage);
      setEditInternalCategory(companyProfile.internalCategory || company?.internalCategory || 'BPC');
    } else if (company) {
      setEditIndustry(company.industry);
      setEditRevenueStage(company.revenueStage);
      setEditInternalCategory(company.internalCategory || 'BPC');
    }
    setIsEditProfileOpen(true);
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    if (EDIT_RIGHTS_PAUSED) {
      toast.error('Editing is paused for all users until further notice.');
      setIsEditProfileOpen(false);
      return;
    }
    if (!companyId) return;

    setIsSavingProfile(true);
    try {
      // const { error } = await supabase
      //   .from('company_profiles')
      //   .upsert({
      //     company_id: companyId,
      //     industry: editIndustry,
      //     revenue_stage: editRevenueStage,
      //     internal_category: editInternalCategory,
      //     updated_at: new Date().toISOString()
      //   }, { onConflict: 'company_id' });

      const { error: httpError } = await http.put(`mis/company-profiles?companyId=${companyId}`, {
        industry: editIndustry,
        revenue_stage: editRevenueStage,
        internal_category: editInternalCategory
      });

      if (httpError) throw httpError;

      setCompanyProfile({
        industry: editIndustry,
        revenueStage: editRevenueStage,
        internalCategory: editInternalCategory
      });

      toast.success('Company profile updated successfully');
      setIsEditProfileOpen(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update company profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Start inline editing – snapshot current values
  const handleStartInlineEdit = () => {
    if (EDIT_RIGHTS_PAUSED) {
      toast.error('Editing is paused for all users until further notice.');
      return;
    }
    const snapshot: Record<string, string> = {};
    featureKPIs.forEach(f => {
      const entry = kpiEntries[f.kpi.key];
      if (entry?.value) snapshot[f.kpi.key] = entry.value;
    });
    setEditedValues(snapshot);
    setIsInlineEditing(true);
  };

  // Cancel inline editing
  const handleCancelInlineEdit = () => {
    setIsInlineEditing(false);
    setEditedValues({});
  };

  // Save inline edited values
  const handleSaveInlineEdit = async () => {
    if (EDIT_RIGHTS_PAUSED) {
      toast.error('Editing is paused for all users until further notice.');
      setIsInlineEditing(false);
      setEditedValues({});
      return;
    }
    if (!companyId) return;
    setIsSavingInline(true);

    // Snapshot for rollback on error
    const prevKpiEntries = { ...kpiEntries };
    const prevAllQuarterEntries = JSON.parse(JSON.stringify(allQuarterEntries));

    try {
      const dbQuarter = selectedQuarter === 'AY' ? 'FY' : selectedQuarter;
      const upserts: { company_id: string; kpi_id: string; quarter: string; year: number; value: string; updated_at: string; submitted_at: string }[] = [];
      const now = new Date().toISOString();

      // Only process keys the admin actually edited
      Object.keys(editedValues).forEach(key => {
        const currentVal = kpiEntries[key]?.value || '';
        const newVal = editedValues[key] ?? '';
        if (newVal !== currentVal) {
          upserts.push({
            company_id: companyId,
            kpi_id: key,
            quarter: dbQuarter,
            year: selectedYear,
            value: newVal || null as any,
            updated_at: now,
            submitted_at: now,
          });
        }
      });

      if (upserts.length === 0) {
        toast.info('No changes to save');
        setIsInlineEditing(false);
        return;
      }

      // Optimistically update local state
      const updatedEntries = { ...kpiEntries };
      upserts.forEach(u => {
        updatedEntries[u.kpi_id] = {
          kpi_id: u.kpi_id,
          value: u.value,
          quarter: u.quarter,
          year: u.year,
          submitted_at: now,
        };
      });
      setKpiEntries(updatedEntries);

      const updatedAll = { ...allQuarterEntries };
      if (!updatedAll[dbQuarter]) updatedAll[dbQuarter] = {};
      upserts.forEach(u => {
        updatedAll[dbQuarter][u.kpi_id] = {
          kpi_id: u.kpi_id,
          value: u.value,
          quarter: u.quarter,
          year: u.year,
          submitted_at: now,
        };
      });
      setAllQuarterEntries(updatedAll);

      // Persist to database
      // const { error } = await supabase
      //   .from('kpi_entries')
      //   .upsert(upserts, { onConflict: 'company_id,kpi_id,quarter,year' });
      const { error } = await http.post(`mis/kpi-entries`, { entries: upserts });

      if (error) throw error;

      // Re-fetch from database to ensure full consistency
      // const { data: freshData } = await supabase
      //   .from('kpi_entries')
      //   .select('kpi_id, value, quarter, year, submitted_at')
      //   .eq('company_id', companyId)
      //   .eq('year', selectedYear);

      const { data: freshData } = await http.get<{ data: KPIEntry[] }>(`mis/kpi-entries?companyId=${companyId}&year=${selectedYear}`);

      if (freshData.data) {
        const byQuarter: Record<string, Record<string, KPIEntry>> = {};
        freshData.data.forEach(entry => {
          if (!byQuarter[entry.quarter]) byQuarter[entry.quarter] = {};
          byQuarter[entry.quarter][entry.kpi_id] = entry;
        });
        setAllQuarterEntries(byQuarter);
        setKpiEntries(byQuarter[dbQuarter] || {});
      }

      toast.success(`${upserts.length} KPI value(s) saved`);
      setIsInlineEditing(false);
      setEditedValues({});
      setProgressRefreshKey(k => k + 1);
    } catch (error) {
      console.error('Error saving inline edits:', error);
      // Rollback to previous state
      setKpiEntries(prevKpiEntries);
      setAllQuarterEntries(prevAllQuarterEntries);
      toast.error('Failed to save changes. Data has been restored.');
    } finally {
      setIsSavingInline(false);
    }
  };

  // Export KPI data as Excel
  const exportToExcel = () => {
    const exportData = filteredFeatureKPIs.map(f => {
      const entry = kpiEntries[f.kpi.key];
      return {
        'Feature': f.featureLabel,
        'KPI Name': f.kpi.name,
        'Unit': f.kpi.unit,
        'Type': f.isOptional ? 'Optional' : 'Mandatory',
        'Value': entry?.value || '',
        'Status': entry?.value ? 'Filled' : 'Pending',
        'Quarter': selectedQuarter,
        'Year': selectedYear.toString(),
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'KPI Data');

    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, { wch: 50 }, { wch: 20 },
      { wch: 12 }, { wch: 20 }, { wch: 10 },
      { wch: 10 }, { wch: 10 }
    ];

    const companyName = company?.name || 'Company';
    XLSX.writeFile(wb, `${companyName}_KPI_Data_${selectedQuarter}_${selectedYear}.xlsx`);
  };

  // Trigger a browser download for a generated blob
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

  // Export currently visible KPI rows as CSV
  const exportToCSV = () => {
    const rows = filteredFeatureKPIs.map(f => {
      const entry = kpiEntries[f.kpi.key];
      return {
        Feature: f.featureLabel,
        'KPI Name': f.kpi.name,
        Unit: f.kpi.unit ?? '',
        Type: f.isOptional ? 'Optional' : 'Mandatory',
        Value: entry?.value ?? '',
        Status: entry?.value ? 'Filled' : 'Pending',
        Quarter: selectedQuarter,
        Year: String(selectedYear),
      };
    });

    const headers = Object.keys(rows[0] ?? {
      Feature: '', 'KPI Name': '', Unit: '', Type: '', Value: '', Status: '', Quarter: '', Year: '',
    });
    const escape = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => escape((r as Record<string, unknown>)[h])).join(',')),
    ].join('\n');

    const companyName = company?.name || 'Company';
    downloadBlob(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
      `${companyName}_KPI_Data_${selectedQuarter}_${selectedYear}.csv`
    );
    toast.success('CSV exported');
  };

  // Export the full company profile + all-period KPI entries as JSON
  const exportToJSON = () => {
    if (!company) return;

    // Build a name lookup so JSON entries are human-readable
    const kpiNameById = new Map(allKPIs.map(k => [k.id, k.name]));

    const entriesByPeriod: Record<string, Array<{
      kpiId: string;
      kpiName: string;
      value: string | null;
      submittedAt: string | null;
    }>> = {};
    Object.entries(allQuarterEntries).forEach(([period, byKpi]) => {
      entriesByPeriod[period] = Object.values(byKpi).map(e => ({
        kpiId: e.kpi_id,
        kpiName: kpiNameById.get(e.kpi_id) ?? '',
        value: e.value,
        submittedAt: e.submitted_at,
      }));
    });

    const payload = {
      exportedAt: new Date().toISOString(),
      company: {
        ...company,
        loginPassword: undefined, // never export credentials
      },
      profile: companyProfile,
      featureSettings,
      kpiOverrides,
      kpiEntriesByPeriod: entriesByPeriod,
      currentView: {
        quarter: selectedQuarter,
        year: selectedYear,
        rows: filteredFeatureKPIs.map(f => {
          const entry = kpiEntries[f.kpi.key];
          return {
            feature: f.featureLabel,
            kpiName: f.kpi.name,
            unit: f.kpi.unit ?? '',
            type: f.isOptional ? 'Optional' : 'Mandatory',
            value: entry?.value ?? null,
            status: entry?.value ? 'Filled' : 'Pending',
          };
        }),
      },
    };

    const companyName = company.name || 'Company';
    downloadBlob(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
      `${companyName}_FullExport_${selectedQuarter}_${selectedYear}.json`
    );
    toast.success('JSON exported');
  };

  // Determine which feature sets to show based on selected quarter
  const isAnnualSelected = selectedQuarter === 'AY';
  const relevantFeatures = isAnnualSelected ? ANNUAL_FEATURES : QUARTERLY_FEATURES;

  // Use feature template KPIs - same as what company users see
  // Filter by quarterly or annual based on selected period
  const featureKPIs = useMemo(() => {
    const allFeatureKPIs: { feature: string; featureLabel: string; kpi: FeatureKPI; isOptional: boolean }[] = [];

    relevantFeatures.forEach(feature => {
      const setting = featureSettings[feature.key];
      const isEnabled = setting?.enabled ?? true;
      const isOptional = setting?.isOptional ?? false;

      if (isEnabled) {
        const kpis = getFeatureKPIs(feature.key);
        kpis.forEach((kpi: FeatureKPI) => {
          allFeatureKPIs.push({
            feature: feature.key,
            featureLabel: feature.label,
            kpi,
            isOptional
          });
        });
      }
    });
    return allFeatureKPIs;
  }, [featureSettings, relevantFeatures]);

  // Calculate progress using feature template KPIs
  const progressStats = useMemo(() => {
    const total = featureKPIs.length;
    const filled = featureKPIs.filter(f => {
      const entry = kpiEntries[f.kpi.key];
      return entry?.value && entry.value.trim() !== '';
    }).length;

    const mandatoryKPIs = featureKPIs.filter(f => !f.isOptional);
    const core1Total = mandatoryKPIs.length;
    const core1Filled = mandatoryKPIs.filter(f => {
      const entry = kpiEntries[f.kpi.key];
      return entry?.value && entry.value.trim() !== '';
    }).length;

    const optionalKPIs = featureKPIs.filter(f => f.isOptional);
    const core2Total = optionalKPIs.length;
    const core2Filled = optionalKPIs.filter(f => {
      const entry = kpiEntries[f.kpi.key];
      return entry?.value && entry.value.trim() !== '';
    }).length;

    return {
      total,
      filled,
      percentage: total > 0 ? Math.round((filled / total) * 100) : 0,
      core1: { total: core1Total, filled: core1Filled },
      core2: { total: core2Total, filled: core2Filled },
    };
  }, [featureKPIs, kpiEntries]);

  // Use the same hook as company dashboard for consistent KPI group counting
  const allQuartersProgress = useAllQuartersProgress(companyId || '', selectedYear, progressRefreshKey, true);

  // Calculate per-quarter progress (Q1-Q4 + AY) using the same logic as company dashboard
  const quarterlyProgress = useMemo(() => {
    const periods = ['Q1', 'Q2', 'Q3', 'Q4', 'FY'];
    return periods.map(p => {
      const data = allQuartersProgress.quarters[p];
      return {
        quarter: p === 'FY' ? 'AY' : p,
        filled: data?.filled || 0,
        total: data?.total || 0,
        percentage: data?.percentage || 0,
      };
    });
  }, [allQuartersProgress]);

  // Filter and search feature KPIs
  const filteredFeatureKPIs = useMemo(() => {
    return featureKPIs.filter(f => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return f.kpi.name.toLowerCase().includes(query) ||
          f.featureLabel.toLowerCase().includes(query);
      }

      return true;
    });
  }, [featureKPIs, searchQuery]);

  // Get feature label map for display
  const featureLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    [...QUARTERLY_FEATURES, ...ANNUAL_FEATURES].forEach(f => {
      map[f.key] = f.label;
    });
    return map;
  }, []);

  // Map database feature_module values to feature keys used in navigation
  const dbFeatureModuleToFeatureKey: Record<string, string> = useMemo(() => ({
    // Quarterly mappings
    'businessInformation': 'businessInformation',
    'sourcingFulfillment': 'sourcingFulfillment',
    'social': 'social',
    'socialDetailed': 'social',
    'primarySecondaryPackaging': 'primarySecondaryPackaging',
    'packagingBasic': 'primarySecondaryPackaging',
    'packagingDetailed': 'primarySecondaryPackaging',
    'packagingTertiary': 'primarySecondaryPackaging',
    'fashionMaterials': 'fashionMaterials',
    'incidentLog': 'incidentLog',
    'productServiceCertifications': 'productServiceCertifications',
    'awardsRecognitions': 'productServiceCertifications',
    // Annual mappings
    'operations': 'operations',
    'certifications': 'certifications',
    'governancePolicies': 'governancePolicies',
    'waterManagement': 'waterManagement',
    'waterDetailed': 'waterManagement',
    'energyManagement': 'energyManagement',
    'energyDetailed': 'energyManagement',
    'wasteManagement': 'wasteManagement',
    'wasteDetailed': 'wasteManagement',
    'csr': 'csr',
    'externalReporting': 'externalReporting',
    'sri': 'csr',
    // Legacy/misc
    'environmental': 'operations',
    'marketing': 'businessInformation',
    'policies': 'governancePolicies',
    'grievances': 'incidentLog',
  }), []);

  // Define feature order (Quarterly first, then Annual) - matches company sidebar
  const orderedFeatureKeys = useMemo(() => {
    return [...QUARTERLY_FEATURES, ...ANNUAL_FEATURES].map(f => f.key);
  }, []);

  // Get KPI ordering within each feature from the template
  const getKPIOrderInFeature = useMemo(() => {
    const orderMaps: Record<string, Map<string, number>> = {};
    [...QUARTERLY_FEATURES, ...ANNUAL_FEATURES].forEach(feature => {
      const featureKPIs = getFeatureKPIs(feature.key);
      const orderMap = new Map<string, number>();
      featureKPIs.forEach((kpi: FeatureKPI, index: number) => {
        orderMap.set(kpi.key, index);
        // Also map by name for fallback matching
        orderMap.set(kpi.name.toLowerCase(), index);
      });
      orderMaps[feature.key] = orderMap;
    });
    return orderMaps;
  }, []);

  // Group feature KPIs by feature for display
  const groupedKPIs = useMemo(() => {
    const groups: { featureKey: string; label: string; kpis: { key: string; name: string; unit: string; isOptional: boolean; value: string }[] }[] = [];
    const featureToKPIs: Record<string, { key: string; name: string; unit: string; isOptional: boolean; value: string }[]> = {};

    // Group filtered KPIs by feature
    filteredFeatureKPIs.forEach(f => {
      if (!featureToKPIs[f.feature]) {
        featureToKPIs[f.feature] = [];
      }
      const entry = kpiEntries[f.kpi.key];
      featureToKPIs[f.feature].push({
        key: f.kpi.key,
        name: f.kpi.name,
        unit: f.kpi.unit,
        isOptional: f.isOptional,
        value: entry?.value || ''
      });
    });

    // Build groups in feature order
    orderedFeatureKeys.forEach(featureKey => {
      const kpis = featureToKPIs[featureKey];
      if (kpis && kpis.length > 0) {
        groups.push({
          featureKey,
          label: featureLabelMap[featureKey] || featureKey,
          kpis
        });
      }
    });

    return groups;
  }, [filteredFeatureKPIs, kpiEntries, orderedFeatureKeys, featureLabelMap]);

  const isLoading = isLoadingProfile || isLoadingKPIs || isLoadingEntries || isLoadingOverrides;

  if (!company && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Company Not Found</h2>
              <p className="text-muted-foreground mb-4">The company you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/mis/portfolio')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Portfolio
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <PageHeader
          title={company?.name || 'Company Details'}
          subtitle={`ESG KPI Data for ${company?.name || 'company'}`}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/mis/portfolio')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Portfolio
              </Button>
              {EDIT_RIGHTS_PAUSED ? (
                <Badge variant="outline" className="text-xs">
                  Editing paused — view only
                </Badge>
              ) : isInlineEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancelInlineEdit} disabled={isSavingInline}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveInlineEdit} disabled={isSavingInline}>
                    {isSavingInline ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={handleStartInlineEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Data
                </Button>
              )}
            </div>
          }
        />



        {/* Company Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Company Info Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="w-5 h-5 text-primary" />
                  Company Profile
                </CardTitle>
                {!isLoading && !EDIT_RIGHTS_PAUSED && (
                  <Button variant="ghost" size="sm" onClick={handleOpenEditProfile}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-6 w-2/3" />
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Industry</p>
                    <p className="font-medium">{companyProfile?.industry || company?.firesideCategory}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Internal Category</p>
                    <p className="font-medium text-sm">{companyProfile?.internalCategory || company?.internalCategory}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue Stage</p>
                    <p className="font-medium">₹{companyProfile?.revenueStage || company?.revenueStage} Cr</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fund</p>
                    <p className="font-medium">{company?.fund}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium">{company?.contactEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium">{company?.createdAt}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Edit Profile Dialog */}
          <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Company Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-industry">Industry</Label>
                  <Select value={editIndustry} onValueChange={(v) => setEditIndustry(v as Industry)}>
                    <SelectTrigger id="edit-industry">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map(ind => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-internal">Internal Category</Label>
                  <Select value={editInternalCategory} onValueChange={(v) => setEditInternalCategory(v as InternalCategory)}>
                    <SelectTrigger id="edit-internal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {internalCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-revenue">Revenue Stage</Label>
                  <Select value={editRevenueStage} onValueChange={(v) => setEditRevenueStage(v as RevenueStage)}>
                    <SelectTrigger id="edit-revenue">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {revenueStages.map(stage => (
                        <SelectItem key={stage} value={stage}>₹{stage} Cr</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Progress Overview Card */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">KPI Progress Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Overall Progress */}
                    <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                      <CompletionRing percentage={allQuartersProgress.overallPercentage} size="md" />
                      <p className="text-sm text-muted-foreground mt-2">Overall Progress</p>
                      <p className="text-sm font-medium">{allQuartersProgress.totalFilled}/{allQuartersProgress.totalAssigned} KPIs filled</p>
                    </div>

                    {/* Total KPIs */}
                    <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-3xl font-bold text-primary">{allQuartersProgress.totalAssigned}</div>
                      <p className="text-sm text-muted-foreground mt-1">Total KPIs</p>
                      <Progress
                        value={allQuartersProgress.totalAssigned > 0 ? (allQuartersProgress.totalFilled / allQuartersProgress.totalAssigned) * 100 : 0}
                        className="h-2 mt-3 w-full max-w-32"
                      />
                    </div>
                  </div>

                  {/* Quarterly Progress */}
                  <div className="grid grid-cols-5 gap-3">
                    {quarterlyProgress.map(q => (
                      <div key={q.quarter} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{q.quarter}</span>
                          <span className="text-xs text-muted-foreground">{q.percentage}%</span>
                        </div>
                        <Progress value={q.percentage} className="h-1.5" />
                        <p className="text-xs text-muted-foreground mt-1">{q.filled}/{q.total}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

            </CardContent>
          </Card>
        </div>

        {/* KPI Data Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <CardTitle className="text-lg">KPI Entries</CardTitle>

                {/* Period Selector */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUARTERS.map(q => (
                        <SelectItem key={q} value={q}>{q === 'AY' ? 'AY (Annual)' : q}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map(y => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filters and Export */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search KPIs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-2 border-l pl-3 ml-1">
                  <Button variant="outline" size="sm" onClick={exportToExcel} className="gap-1.5">
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-1.5">
                    <FileText className="w-4 h-4" />
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToJSON} className="gap-1.5">
                    <FileJson className="w-4 h-4" />
                    JSON
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all" className="gap-2">
                  All KPIs
                  <Badge variant="secondary" className="ml-1">{featureKPIs.length}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredFeatureKPIs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No KPIs found matching your filters.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {groupedKPIs.map(({ featureKey, label, kpis }) => (
                      <div key={featureKey} className="space-y-2">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                          {label}
                        </h3>
                        <div className="rounded-lg border overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="text-left px-4 py-3 text-sm font-medium">KPI Name</th>
                                <th className="text-left px-4 py-3 text-sm font-medium w-32">Unit</th>
                                <th className="text-left px-4 py-3 text-sm font-medium w-40">Value</th>
                                <th className="text-left px-4 py-3 text-sm font-medium w-24">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {kpis.map(kpi => {
                                const hasValue = kpi.value && kpi.value.trim() !== '';

                                if (isInlineEditing) {
                                  const editVal = editedValues[kpi.key] ?? kpi.value ?? '';
                                  return (
                                    <tr key={kpi.key} className="hover:bg-muted/30 transition-colors">
                                      <td className="px-4 py-3">
                                        <p className="font-medium text-sm">{kpi.name}</p>
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge variant="outline" className="text-xs">{kpi.unit}</Badge>
                                      </td>
                                      <td className="px-4 py-3">
                                        <Input
                                          value={editVal}
                                          onChange={(e) => setEditedValues(prev => ({ ...prev, [kpi.key]: e.target.value }))}
                                          className="h-8 text-sm"
                                          placeholder="Enter value..."
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        {(editedValues[kpi.key] ?? kpi.value ?? '').trim() ? (
                                          <div className="flex items-center gap-1.5 text-status-success">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span className="text-xs font-medium">Filled</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1.5 text-status-warning">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span className="text-xs font-medium">Pending</span>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                }

                                return (
                                  <ExpandableKPIRow key={kpi.key} kpi={kpi} hasValue={hasValue} />
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyDetail;

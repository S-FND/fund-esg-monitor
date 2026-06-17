import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ESGCategory, CoreLevel, RevenueStage, Industry } from '@/types/esg';
import { mockCompanies } from '@/data/mockData';

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
  created_at: string;
  updated_at: string;
}

interface DashboardKPI {
  id: string;
  name: string;
  esg: ESGCategory;
  category: string;
  subCategory?: string;
  coreLevel?: CoreLevel;
  revenueStages: string[];
  industries: string[];
}

const dbToKPI = (row: DBKPIMaster): DashboardKPI => {
  // Map core level: "Mandatory" -> 1, "Optional" -> 2
  let coreLevelNum: CoreLevel | undefined;
  if (row.core_level) {
    const normalized = row.core_level.toLowerCase();
    if (normalized.includes('mandatory') || normalized.includes('core 1')) {
      coreLevelNum = 1;
    } else if (normalized.includes('optional') || normalized.includes('core 2') || normalized.includes('core 3')) {
      coreLevelNum = 2;
    }
  }
  return {
    id: row.id,
    name: row.name,
    esg: row.esg as ESGCategory,
    category: row.category,
    subCategory: row.sub_category || undefined,
    coreLevel: coreLevelNum,
    revenueStages: row.revenue_stages || [],
    industries: row.industries || [],
  };
};

interface CompanyProfile {
  revenueStage: string | null;
  industry: string | null;
}

interface KPIProgressData {
  total: number;
  filled: number;
  core1Total: number;
  core1Filled: number;
  core2Total: number;
  core2Filled: number;
  percentage: number;
  esgBreakdown: {
    E: { total: number; filled: number };
    S: { total: number; filled: number };
    G: { total: number; filled: number };
  };
  pendingCore1KPIs: DashboardKPI[];
  isLoading: boolean;
}

export const useCompanyKPIProgress = (companyId: string, quarter: string = 'Q4', year: number = 2025): KPIProgressData => {
  const [allKPIs, setAllKPIs] = useState<DashboardKPI[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({ revenueStage: null, industry: null });
  const [filledKPIIds, setFilledKPIIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load all KPIs
  useEffect(() => {
    const loadKPIs = async () => {
      try {
        const { data, error } = await supabase
          .from('kpi_master')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
          const mappedKPIs = (data as DBKPIMaster[]).map(dbToKPI);
          setAllKPIs(mappedKPIs);
        }
      } catch (error) {
        console.error('Error loading KPIs:', error);
      }
    };

    loadKPIs();
  }, []);

  // Load company profile - fall back to mock data if not in database
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('company_profiles')
          .select('revenue_stage, industry')
          .eq('company_id', companyId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setCompanyProfile({
            revenueStage: data.revenue_stage,
            industry: data.industry,
          });
        } else {
          // Fallback to mock data for companies not yet in database
          const mockCompany = mockCompanies.find(c => c.id === companyId);
          if (mockCompany) {
            setCompanyProfile({
              revenueStage: mockCompany.revenueStage,
              industry: mockCompany.industry,
            });
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        // Fallback to mock data on error
        const mockCompany = mockCompanies.find(c => c.id === companyId);
        if (mockCompany) {
          setCompanyProfile({
            revenueStage: mockCompany.revenueStage,
            industry: mockCompany.industry,
          });
        }
      }
    };

    loadProfile();
  }, [companyId]);

  // Load filled KPI entries
  useEffect(() => {
    const loadEntries = async () => {
      if (allKPIs.length === 0) return;

      try {
        const { data, error } = await supabase
          .from('kpi_entries')
          .select('kpi_id, value')
          .eq('company_id', companyId)
          .eq('quarter', quarter)
          .eq('year', year);

        if (error) throw error;

        if (data) {
          // Only count entries that have a non-empty value
          const filledIds = new Set(
            data
              .filter(entry => entry.value !== null && entry.value !== '')
              .map(entry => entry.kpi_id)
          );
          setFilledKPIIds(filledIds);
        }
      } catch (error) {
        console.error('Error loading entries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, [companyId, quarter, year, allKPIs]);

  // Calculate applicable KPIs based on company profile
  const applicableKPIs = useMemo(() => {
    if (!companyProfile.revenueStage || !companyProfile.industry) {
      return [];
    }

    return allKPIs.filter(kpi => {
      const stageMatch = kpi.revenueStages.length === 0 || kpi.revenueStages.includes(companyProfile.revenueStage!);
      const industryMatch = kpi.industries.length === 0 || kpi.industries.includes(companyProfile.industry!);
      return stageMatch && industryMatch;
    });
  }, [allKPIs, companyProfile]);

  // Calculate progress metrics
  const progressData = useMemo(() => {
    const total = applicableKPIs.length;
    const filled = applicableKPIs.filter(kpi => filledKPIIds.has(kpi.id)).length;
    
    const core1KPIs = applicableKPIs.filter(kpi => kpi.coreLevel === 1);
    const core1Total = core1KPIs.length;
    const core1Filled = core1KPIs.filter(kpi => filledKPIIds.has(kpi.id)).length;

    // Optional KPIs are core level 2 (already normalized from Core 2/3)
    const core2KPIs = applicableKPIs.filter(kpi => kpi.coreLevel === 2);
    const core2Total = core2KPIs.length;
    const core2Filled = core2KPIs.filter(kpi => filledKPIIds.has(kpi.id)).length;

    const esgBreakdown = {
      E: {
        total: applicableKPIs.filter(k => k.esg === 'E').length,
        filled: applicableKPIs.filter(k => k.esg === 'E' && filledKPIIds.has(k.id)).length,
      },
      S: {
        total: applicableKPIs.filter(k => k.esg === 'S').length,
        filled: applicableKPIs.filter(k => k.esg === 'S' && filledKPIIds.has(k.id)).length,
      },
      G: {
        total: applicableKPIs.filter(k => k.esg === 'G').length,
        filled: applicableKPIs.filter(k => k.esg === 'G' && filledKPIIds.has(k.id)).length,
      },
    };

    const pendingCore1KPIs = core1KPIs.filter(kpi => !filledKPIIds.has(kpi.id));

    return {
      total,
      filled,
      core1Total,
      core1Filled,
      core2Total,
      core2Filled,
      percentage: total > 0 ? Math.round((filled / total) * 100) : 0,
      esgBreakdown,
      pendingCore1KPIs,
      isLoading,
    };
  }, [applicableKPIs, filledKPIIds, isLoading]);

  return progressData;
};

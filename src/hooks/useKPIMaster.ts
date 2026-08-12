import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KPI, ESGCategory, CoreLevel, RevenueStage, KPIIndustry, FeatureModule } from '@/types/esg';
import { toast } from 'sonner';
import { NewKPIData } from '@/components/AddKPIDialog';
import { EDIT_RIGHTS_PAUSED } from '@/lib/companyAccessControl';

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
  target_companies: string[] | null;
  feature_module: string | null;
}

// Convert database row to KPI type
const dbToKPI = (row: DBKPIMaster): KPI => {
  const parseCoreLevel = (level: string | null): CoreLevel => {
    if (!level) return 1;
    const normalized = level.toLowerCase();
    if (normalized.includes('mandatory') || normalized.includes('core 1')) return 1;
    return 2; // Everything else (Core 2, Core 3, Optional) maps to Optional (2)
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
    createdAt: row.created_at,
    quarter: 'Q4',
    year: 2025,
    targetCompanies: row.target_companies || undefined,
    featureModule: row.feature_module as FeatureModule | undefined,
  };
};

// Convert KPI to database format
const kpiToDB = (kpi: NewKPIData, isCustom: boolean = true) => {
  const coreLevelMap: Record<CoreLevel, string> = {
    1: 'Mandatory',
    2: 'Optional',
  };

  return {
    name: kpi.name,
    esg: kpi.esg,
    category: kpi.category,
    sub_category: kpi.subCategory || null,
    metric_type: kpi.metricType || null,
    period: kpi.period || null,
    definition: kpi.definition || null,
    frequency: kpi.period || null,
    core_level: coreLevelMap[kpi.coreLevel],
    revenue_stages: kpi.revenueStages,
    industries: kpi.industries,
    is_custom: isCustom,
    target_companies: kpi.targetCompanies?.length ? kpi.targetCompanies : null,
    feature_module: kpi.featureModule || null,
  };
};

export const useKPIMaster = () => {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all KPIs from database
  const fetchKPIs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('kpi_master')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mappedKPIs = (data as DBKPIMaster[]).map(dbToKPI);
      setKpis(mappedKPIs);
    } catch (err) {
      console.error('Error fetching KPIs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch KPIs');
    } finally {
      setLoading(false);
    }
  };

  // Add a new KPI
  const addKPI = async (kpiData: NewKPIData): Promise<boolean> => {
    if (EDIT_RIGHTS_PAUSED) {
      toast.error('Editing is paused for all users until further notice.');
      return false;
    }
    try {
      const dbData = kpiToDB(kpiData, true);
      
      const { data, error } = await supabase
        .from('kpi_master')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;

      const newKPI = dbToKPI(data as DBKPIMaster);
      setKpis(prev => [...prev, newKPI]);
      toast.success('KPI added successfully');
      return true;
    } catch (err) {
      console.error('Error adding KPI:', err);
      toast.error('Failed to add KPI');
      return false;
    }
  };

  // Update an existing KPI
  const updateKPI = async (kpi: KPI): Promise<boolean> => {
    if (EDIT_RIGHTS_PAUSED) {
      toast.error('Editing is paused for all users until further notice.');
      return false;
    }
    try {
      const coreLevelMap: Record<CoreLevel, string> = {
        1: 'Mandatory',
        2: 'Optional',
      };

      const { error } = await supabase
        .from('kpi_master')
        .update({
          name: kpi.name,
          esg: kpi.esg,
          category: kpi.category,
          sub_category: kpi.subCategory || null,
          metric_type: kpi.metricType || null,
          period: kpi.period || null,
          definition: kpi.definition || null,
          frequency: kpi.frequency || null,
          core_level: coreLevelMap[kpi.coreLevel],
          revenue_stages: kpi.revenueStages,
          industries: kpi.industries,
        })
        .eq('id', kpi.id);

      if (error) throw error;

      setKpis(prev => prev.map(k => k.id === kpi.id ? kpi : k));
      toast.success('KPI updated successfully');
      return true;
    } catch (err) {
      console.error('Error updating KPI:', err);
      toast.error('Failed to update KPI');
      return false;
    }
  };

  // Delete a KPI
  const deleteKPI = async (kpiId: string): Promise<boolean> => {
    if (EDIT_RIGHTS_PAUSED) {
      toast.error('Editing is paused for all users until further notice.');
      return false;
    }
    try {
      const { error } = await supabase
        .from('kpi_master')
        .delete()
        .eq('id', kpiId);

      if (error) throw error;

      setKpis(prev => prev.filter(k => k.id !== kpiId));
      toast.success('KPI deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting KPI:', err);
      toast.error('Failed to delete KPI');
      return false;
    }
  };

  // Bulk import KPIs
  const importKPIs = async (importedKPIs: KPI[], replaceAll: boolean): Promise<boolean> => {
    if (EDIT_RIGHTS_PAUSED) {
      toast.error('Editing is paused for all users until further notice.');
      return false;
    }
    try {
      if (replaceAll) {
        // Delete all existing KPIs first
        const { error: deleteError } = await supabase
          .from('kpi_master')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (deleteError) throw deleteError;
      }

      // Insert new KPIs
      const dbData = importedKPIs.map(kpi => ({
        name: kpi.name,
        esg: kpi.esg,
        category: kpi.category,
        sub_category: kpi.subCategory || null,
        metric_type: kpi.metricType || null,
        period: kpi.period || null,
        definition: kpi.definition || null,
        frequency: kpi.frequency || null,
        core_level: `Core ${kpi.coreLevel}`,
        revenue_stages: kpi.revenueStages,
        industries: kpi.industries,
        is_custom: true,
      }));

      const { error: insertError } = await supabase
        .from('kpi_master')
        .insert(dbData);

      if (insertError) throw insertError;

      // Refresh the list
      await fetchKPIs();
      return true;
    } catch (err) {
      console.error('Error importing KPIs:', err);
      toast.error('Failed to import KPIs');
      return false;
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

  return {
    kpis,
    loading,
    error,
    fetchKPIs,
    addKPI,
    updateKPI,
    deleteKPI,
    importKPIs,
  };
};

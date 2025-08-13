import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface KPI {
  id?: string;
  kpi_name: string;
  kpi_value: number;
  target_value?: number;
  unit?: string;
  reporting_period?: string;
}

export function useCompanyKPIs(companyId?: string) {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load existing KPIs for a company
  useEffect(() => {
    if (companyId) {
      loadKPIs();
    }
  }, [companyId]);

  const loadKPIs = async () => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      const { data: existingKPIs, error } = await supabase
        .from('company_kpis')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setKpis(existingKPIs || []);
    } catch (error) {
      console.error('Error loading KPIs:', error);
      toast({
        title: "Error",
        description: "Failed to load existing KPIs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveKPI = async (kpi: Omit<KPI, 'id'>) => {
    if (!companyId) {
      toast({
        title: "No Company Selected",
        description: "Cannot save KPI without a company.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to save KPIs.",
          variant: "destructive",
        });
        return false;
      }

      // Get user's profile to get tenant_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.tenant_id) {
        toast({
          title: "Error",
          description: "Unable to determine your organization.",
          variant: "destructive",
        });
        return false;
      }

      // Insert new KPI
      const { data, error } = await supabase
        .from('company_kpis')
        .insert({
          ...kpi,
          company_id: companyId,
          tenant_id: profile.tenant_id,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setKpis(prev => [data, ...prev]);
      
      toast({
        title: "KPI Saved",
        description: "KPI has been successfully saved.",
      });
      return true;
    } catch (error) {
      console.error('Error saving KPI:', error);
      toast({
        title: "Error",
        description: "Failed to save KPI. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateKPI = async (kpiId: string, updates: Partial<KPI>) => {
    try {
      const { error } = await supabase
        .from('company_kpis')
        .update(updates)
        .eq('id', kpiId);

      if (error) throw error;

      setKpis(prev => prev.map(kpi => 
        kpi.id === kpiId ? { ...kpi, ...updates } : kpi
      ));

      toast({
        title: "KPI Updated",
        description: "KPI has been successfully updated.",
      });
      return true;
    } catch (error) {
      console.error('Error updating KPI:', error);
      toast({
        title: "Error",
        description: "Failed to update KPI. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteKPI = async (kpiId: string) => {
    try {
      const { error } = await supabase
        .from('company_kpis')
        .delete()
        .eq('id', kpiId);

      if (error) throw error;

      setKpis(prev => prev.filter(kpi => kpi.id !== kpiId));

      toast({
        title: "KPI Deleted",
        description: "KPI has been successfully deleted.",
      });
      return true;
    } catch (error) {
      console.error('Error deleting KPI:', error);
      toast({
        title: "Error",
        description: "Failed to delete KPI. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    kpis,
    loading,
    saveKPI,
    updateKPI,
    deleteKPI,
    loadKPIs
  };
}
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CoreLevel, KPI } from '@/types/esg';

interface KPIOverride {
  id: string;
  company_id: string;
  kpi_id: string;
  core_level_override: 'Mandatory' | 'Optional';
}

interface FeatureSetting {
  enabled: boolean;
  isOptional: boolean;
}

export const useCompanyKPIOverrides = (companyId: string) => {
  const [kpiOverrides, setKpiOverrides] = useState<Record<string, KPIOverride>>({});
  const [featureSettings, setFeatureSettings] = useState<Record<string, FeatureSetting>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load KPI overrides for this company
  useEffect(() => {
    const loadOverrides = async () => {
      if (!companyId) {
        setIsLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('company_kpi_overrides')
          .select('*')
          .eq('company_id', companyId);

        if (error) throw error;

        if (data) {
          const overridesMap: Record<string, KPIOverride> = {};
          data.forEach(override => {
            overridesMap[override.kpi_id] = override as KPIOverride;
          });
          setKpiOverrides(overridesMap);
        }
      } catch (error) {
        console.error('Error loading KPI overrides:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOverrides();
  }, [companyId]);

  // Load feature settings for this company
  useEffect(() => {
    const loadFeatureSettings = async () => {
      if (!companyId) return;
      
      try {
        const { data, error } = await supabase
          .from('company_feature_settings')
          .select('feature_key, enabled, is_optional')
          .eq('company_id', companyId);

        if (error) throw error;

        if (data) {
          const settingsMap: Record<string, FeatureSetting> = {};
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
  const getEffectiveCoreLevel = useCallback((kpi: KPI): CoreLevel => {
    // First check for direct KPI override (highest priority)
    const override = kpiOverrides[kpi.id];
    if (override) {
      return override.core_level_override === 'Mandatory' ? 1 : 2;
    }
    
    // Then check if the feature module is marked as optional
    if (kpi.featureModule) {
      const featureSetting = featureSettings[kpi.featureModule];
      if (featureSetting?.isOptional) {
        return 2; // Feature is optional, so all its KPIs are optional by default
      }
    }
    
    // Fall back to the master KPI core level
    return kpi.coreLevel;
  }, [kpiOverrides, featureSettings]);

  // Check if a specific KPI has an override
  const hasOverride = useCallback((kpiId: string): boolean => {
    return !!kpiOverrides[kpiId];
  }, [kpiOverrides]);

  return {
    kpiOverrides,
    featureSettings,
    isLoading,
    getEffectiveCoreLevel,
    hasOverride,
  };
};

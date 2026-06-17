import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EDIT_RIGHTS_PAUSED } from '@/lib/companyAccessControl';

// Feature modules configuration
export const QUARTERLY_FEATURES = [
  { key: 'businessInformation', label: 'Business Information', type: 'quarterly' as const, description: 'Tell us more about business and customers' },
  { key: 'sourcingFulfillment', label: 'Sourcing & Fulfillment', type: 'quarterly' as const, description: 'Tell us more about ethical sourcing and responsible fulfillment practices' },
  { key: 'social', label: 'Employment & Compensation', type: 'quarterly' as const, description: 'Tell us more about fair wages, benefits, and workforce stability.' },
  { key: 'primarySecondaryPackaging', label: 'Primary & Secondary Packaging', type: 'quarterly' as const, description: 'Tell us more about packaging footprint and reduction opportunities.' },
  { key: 'fashionMaterials', label: 'Materials & Packaging (Fashion)', type: 'quarterly' as const, description: 'Tell us more about material choices, sourcing, and environmental impact.' },
  { key: 'incidentLog', label: 'Incidents & Grievances', type: 'quarterly' as const, description: 'Tell us more about complaints, resolution processes, and risk management.' },
  { key: 'productServiceCertifications', label: 'Awards & Recognitions', type: 'quarterly' as const, description: 'Tell us more about your initiatives & recognitions.' },
  { key: 'healthCare', label: 'HealthCare', type: 'quarterly' as const, description: 'Tell us more about healthcare services and patient outreach.' },
] as const;

export const ANNUAL_FEATURES = [
  { key: 'operations', label: 'Operations', type: 'annual' as const, description: 'Tell us more about operational footprint.' },
  { key: 'certifications', label: 'Certifications', type: 'annual' as const, description: 'Tell us more about compliance, standards, and credible ESG benchmarks.' },
  { key: 'governancePolicies', label: 'Governance Policies', type: 'annual' as const, description: 'Tell us more about oversight, ethics, and decision-making frameworks.' },
  { key: 'waterManagement', label: 'Water Management', type: 'annual' as const, description: 'Tell us more about water usage, efficiency, and conservation efforts.' },
  { key: 'energyManagement', label: 'Energy Management', type: 'annual' as const, description: 'Tell us more about energy consumption and renewable adoption.' },
  { key: 'wasteManagement', label: 'Waste Management', type: 'annual' as const, description: 'Tell us more about waste reduction & recycling practices.' },
  { key: 'csr', label: 'CSR', type: 'annual' as const, description: 'Tell us more about your CSR initiatives.' },
  { key: 'sri', label: 'Social Return on Investment', type: 'annual' as const, description: 'Tell us more about your social impact metrics.' },
  { key: 'externalReporting', label: 'External Reporting 1', type: 'annual' as const, description: 'Reporting requirement driven by investors' },
] as const;

export const ALL_FEATURES = [...QUARTERLY_FEATURES, ...ANNUAL_FEATURES];

export type FeatureKey = typeof ALL_FEATURES[number]['key'];
export type FeatureType = 'quarterly' | 'annual';

export interface CompanyFeatureSetting {
  id: string;
  company_id: string;
  feature_key: string;
  feature_type: FeatureType;
  enabled: boolean;
  is_optional: boolean;
}

export const useCompanyFeatures = (companyId?: string) => {
  const [features, setFeatures] = useState<CompanyFeatureSetting[]>([]);
  const [pendingChanges, setPendingChanges] = useState<Map<string, Partial<CompanyFeatureSetting>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatures = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('company_feature_settings')
        .select('*')
        .eq('company_id', companyId);

      if (fetchError) throw fetchError;

      // Get the set of current feature keys
      const currentFeatureKeys = new Set(ALL_FEATURES.map(f => f.key));
      
      // Check if we have all the current feature keys in the database
      const existingKeys = new Set((data || []).map(d => d.feature_key));
      const missingKeys = ALL_FEATURES.filter(f => !existingKeys.has(f.key));

      // If no features exist or there are missing keys, upsert the features
      if (!data || data.length === 0 || missingKeys.length > 0) {
        // Create default features for all keys (will upsert)
        const defaultFeatures = ALL_FEATURES.map((f) => {
          // Check if this feature already exists (for existing keys, preserve their settings)
          const existing = (data || []).find(d => d.feature_key === f.key);
          return {
            company_id: companyId,
            feature_key: f.key,
            feature_type: f.type,
            enabled: existing?.enabled ?? true, // Preserve existing or default to enabled
            is_optional: (existing as any)?.is_optional ?? false, // Preserve existing or default to mandatory
          };
        });

        // Use upsert to handle both insert and update
        const { data: upsertedData, error: upsertError } = await supabase
          .from('company_feature_settings')
          .upsert(defaultFeatures, { 
            onConflict: 'company_id,feature_key',
            ignoreDuplicates: false 
          })
          .select();

        if (upsertError) throw upsertError;
        
        const typedData = (upsertedData || []).map((item) => ({
          ...item,
          feature_type: item.feature_type as FeatureType,
          is_optional: item.is_optional ?? false,
        }));
        setFeatures(typedData);
      } else {
        // Filter to only include features that are in our current feature list
        const validData = data.filter(d => currentFeatureKeys.has(d.feature_key as FeatureKey));
        const typedData = validData.map((item) => ({
          ...item,
          feature_type: item.feature_type as FeatureType,
          is_optional: (item as any).is_optional ?? false,
        }));
        setFeatures(typedData);
      }
      // Clear pending changes when data is freshly loaded
      setPendingChanges(new Map());
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching company features:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  // Local toggle - doesn't save to DB immediately
  const toggleFeature = (featureKey: string, enabled: boolean) => {
    if (EDIT_RIGHTS_PAUSED) {
      toast.error('Editing is paused for all users until further notice.');
      return;
    }
    if (!companyId) return;

    setPendingChanges((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(featureKey) || {};
      newMap.set(featureKey, { ...existing, enabled });
      return newMap;
    });
  };

  // Local optional toggle - doesn't save to DB immediately
  const setFeatureOptional = (featureKey: string, isOptional: boolean) => {
    if (EDIT_RIGHTS_PAUSED) {
      toast.error('Editing is paused for all users until further notice.');
      return;
    }
    if (!companyId) return;

    setPendingChanges((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(featureKey) || {};
      newMap.set(featureKey, { ...existing, is_optional: isOptional });
      return newMap;
    });
  };

  // Save all pending changes to the database
  const saveChanges = async () => {
    if (EDIT_RIGHTS_PAUSED) {
      toast.error('Editing is paused for all users until further notice.');
      return false;
    }
    if (!companyId || pendingChanges.size === 0) return true;

    try {
      setSaving(true);
      
      // Process each pending change
      for (const [featureKey, changes] of pendingChanges.entries()) {
        const { error: updateError } = await supabase
          .from('company_feature_settings')
          .update(changes)
          .eq('company_id', companyId)
          .eq('feature_key', featureKey);

        if (updateError) throw updateError;
      }

      // Update local state with all changes
      setFeatures((prev) =>
        prev.map((f) => {
          const changes = pendingChanges.get(f.feature_key);
          if (changes) {
            return { ...f, ...changes };
          }
          return f;
        })
      );

      setPendingChanges(new Map());
      toast.success('Feature settings saved successfully');
      return true;
    } catch (err: any) {
      toast.error('Failed to save feature settings');
      console.error('Error saving features:', err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Discard all pending changes
  const discardChanges = () => {
    setPendingChanges(new Map());
  };

  // Get effective value considering pending changes
  const isFeatureEnabled = (featureKey: string): boolean => {
    const pendingChange = pendingChanges.get(featureKey);
    if (pendingChange?.enabled !== undefined) {
      return pendingChange.enabled;
    }
    const feature = features.find((f) => f.feature_key === featureKey);
    return feature?.enabled ?? true; // Default to enabled for testing
  };

  const isFeatureOptional = (featureKey: string): boolean => {
    const pendingChange = pendingChanges.get(featureKey);
    if (pendingChange?.is_optional !== undefined) {
      return pendingChange.is_optional;
    }
    const feature = features.find((f) => f.feature_key === featureKey);
    return feature?.is_optional ?? false;
  };

  const getEnabledFeatures = (type?: FeatureType): string[] => {
    return features
      .filter((f) => {
        const pendingChange = pendingChanges.get(f.feature_key);
        const enabled = pendingChange?.enabled !== undefined ? pendingChange.enabled : f.enabled;
        return enabled && (!type || f.feature_type === type);
      })
      .map((f) => f.feature_key);
  };

  const hasUnsavedChanges = pendingChanges.size > 0;

  return {
    features,
    loading,
    saving,
    error,
    toggleFeature,
    setFeatureOptional,
    isFeatureEnabled,
    isFeatureOptional,
    getEnabledFeatures,
    saveChanges,
    discardChanges,
    hasUnsavedChanges,
    refetch: fetchFeatures,
  };
};

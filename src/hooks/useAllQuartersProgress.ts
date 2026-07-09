import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FEATURE_FIELD_MAPPINGS } from '@/lib/featureFieldMapping';
import { isCompanyExcluded } from '@/lib/companyExclusions';
import { useAsOf, isPeriodAfterCutoff } from '@/contexts/AsOfContext';
import { http } from '@/utils/httpInterceptor';

interface QuarterProgress {
  quarter: string;
  total: number;
  filled: number;
  percentage: number;
}

interface AllQuartersProgressData {
  quarters: Record<string, QuarterProgress>;
  overallPercentage: number;
  totalFilled: number;
  totalAssigned: number;
  isLoading: boolean;
}

const PERIODS = ['Q1', 'Q2', 'Q3', 'Q4', 'FY'];

// All possible feature keys categorized
const ALL_QUARTERLY_FEATURES = [
  'businessInformation', 'social', 'sourcingFulfillment',
  'primarySecondaryPackaging', 'fashionMaterials', 'incidentLog',
  'productServiceCertifications', 'healthCare',
];

const ALL_ANNUAL_FEATURES = [
  'operations', 'governancePolicies', 'certifications', 'csr',
  'sri', 'externalReporting', 'energyManagement', 'waterManagement', 'wasteManagement',
];

// Get total KPI count for a set of features (excluding text/auto-calculated KPIs)
const getFeatureKPICount = (featureKeys: string[]): number => {
  let count = 0;
  for (const key of featureKeys) {
    const mapping = FEATURE_FIELD_MAPPINGS[key];
    if (mapping) {
      count += mapping.kpis.filter(kpi => !kpi.excludeFromProgress).length;
    }
  }
  return count;
};

// Known generic field IDs that appear across multiple KPI groups
const GENERIC_FIELD_IDS = new Set([
  'cases', 'open_cases', 'impact', 'value', 'count', 'in_place', 'details',
  'type', 'amount', 'list', 'self_number', 'self_names', 'self_validity',
  'supplier_number', 'supplier_names', 'supplier_validity', 'training',
  'training_count', 'total_weight', 'plastic_weight', 'recycled_content',
  'recyclable_pct', 'recycled_pct', 'energy_consumed', 'renewable_pct',
  'water_consumed', 'fresh_water_pct', 'rainwater_pct',
  'epr_targets', 'epr_compliance_pct',
  'waste_generated', 'waste_recycled_pct', 'na',
  'last_update',
]);

// Check if a specific KPI group has any filled data
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

// Count filled KPIs for a set of features
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

export const useAllQuartersProgress = (companyId: string, year: number = 2025, refreshKey: number = 0, applyExclusions: boolean = true): AllQuartersProgressData => {
  
  const [allEntries, setAllEntries] = useState<{ kpi_id: string; quarter: string; value: string | null }[]>([]);
  const [enabledFeatures, setEnabledFeatures] = useState<{ feature_key: string; feature_type: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { asOf } = useAsOf();

  // Load entries and company feature settings
  useEffect(() => {
    //console.log('Loading data for companyId in useAllQuartersProgress:', companyId, 'year:', year);
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch entries and feature settings in parallel
        // const [entriesResult, featuresResult] = await Promise.all([
        //   supabase
        //     .from('kpi_entries')
        //     .select('kpi_id, quarter, value')
        //     .eq('company_id', companyId)
        //     .eq('year', year),
        //   supabase
        //     .from('company_feature_settings')
        //     .select('feature_key, feature_type, enabled')
        //     .eq('company_id', companyId)
        //     .eq('enabled', true),
        // ]);

        let entryData= await http.get<{ kpi_id: string; quarter: string; value: string | null }[]>(`mis/kpi-entries?companyId=${companyId}&year=${year}`);
        let featuresData= await http.get<{ feature_key: string; feature_type: string; enabled: boolean }[]>(`mis/company-feature-settings?companyId=${companyId}`);

        let entriesResult=entryData.data ? { data: entryData.data, error: null } : { data: null, error: new Error('Failed to load entries') };
        let featuresResult=featuresData.data ? { data: featuresData.data.filter(f => f.enabled), error: null } : { data: null, error: new Error('Failed to load features') };
        if (entriesResult.error) throw entriesResult.error;
        if (featuresResult.error) throw featuresResult.error;
        // //console.log('Loaded entries:', entriesResult.data);
        // //console.log('Loaded features:', featuresResult.data);
        //console.log('Loaded entries:', entriesResult.data);
        //console.log('Loaded features:', featuresResult.data);

        setAllEntries(entriesResult.data || []);
        setEnabledFeatures(featuresResult.data || []);
      } catch (error) {
        console.error('Error loading entries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Listen for visibility changes to refresh data
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [companyId, year, refreshKey]);

  // Calculate progress per quarter using company-specific enabled features
  const progressData = useMemo(() => {
    const quarters: Record<string, QuarterProgress> = {};
    let totalFilledSum = 0;
    let totalAssignedSum = 0;

    // Filter features to only those enabled for this company
    const enabledKeys = new Set(enabledFeatures.map(f => f.feature_key));
    const quarterlyFeatures = ALL_QUARTERLY_FEATURES.filter(k => enabledKeys.has(k));
    const annualFeatures = ALL_ANNUAL_FEATURES.filter(k => enabledKeys.has(k));

    // If no features loaded yet (but not loading), use all features as fallback
    const effectiveQuarterly = enabledFeatures.length > 0 ? quarterlyFeatures : ALL_QUARTERLY_FEATURES;
    const effectiveAnnual = enabledFeatures.length > 0 ? annualFeatures : ALL_ANNUAL_FEATURES;

    const quarterlyTotal = getFeatureKPICount(effectiveQuarterly);
    const annualTotal = getFeatureKPICount(effectiveAnnual);
    //console.log('Effective quarterly features:', effectiveQuarterly);
    //console.log('Effective annual features:', effectiveAnnual);
    //console.log('Quarterly total KPIs:', quarterlyTotal);
    //console.log('Annual total KPIs:', annualTotal);
    PERIODS.forEach(period => {
      // Skip excluded quarters for this company
      // Skip periods past the "As of" cutoff so the snapshot reflects what was available then.
      const pastCutoff = isPeriodAfterCutoff(period, year, asOf);
      if (pastCutoff || (applyExclusions && isCompanyExcluded(companyId, period))) {
        quarters[period] = {
          quarter: period,
          total: 0,
          filled: 0,
          percentage: 0,
        };
        return;
      }
      //console.log("allEntries length:", allEntries.length, "for period:", period, "year:", year);
      const periodEntries = allEntries.filter(entry => entry.quarter === period);
      //console.log(`Entries for ${period} ${year}:`, periodEntries.length, periodEntries);
      
      const featuresToCount = period === 'FY' ? effectiveAnnual : effectiveQuarterly;
      const expectedTotal = period === 'FY' ? annualTotal : quarterlyTotal;
      
      const filledCount = countFilledKPIs(featuresToCount, periodEntries);
      
      const percentage = expectedTotal > 0 
        ? Math.min(100, Math.round((filledCount / expectedTotal) * 100))
        : 0;

      quarters[period] = {
        quarter: period,
        total: expectedTotal,
        filled: filledCount,
        percentage,
      };

      totalFilledSum += filledCount;
      totalAssignedSum += expectedTotal;
    });

    const overallPercentage = totalAssignedSum > 0 
      ? Math.min(100, Math.round((totalFilledSum / totalAssignedSum) * 100))
      : 0;

    return {
      quarters,
      overallPercentage,
      totalFilled: totalFilledSum,
      totalAssigned: totalAssignedSum,
      isLoading,
    };
  }, [allEntries, enabledFeatures, isLoading, asOf?.month, asOf?.year, year, companyId, applyExclusions]);

  return progressData;
};

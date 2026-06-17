import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AutoSaveOptions {
  companyId: string;
  quarter: string;
  year: number;
  debounceMs?: number;
  isAnnual?: boolean;
  featureKey?: string;
}

// Sourcing & Fulfillment KPI prefixes that should be pre-filled to all quarters
const SOURCING_PREFIXES = [
  'msme_supplier_percentage',
  'vendor_mis_',
  'vendor_practices_',
  'logistics_carbon_',
];

const isSourcingKPI = (kpiId: string): boolean => {
  return SOURCING_PREFIXES.some(prefix => kpiId.startsWith(prefix));
};

export const useAutoSaveKPI = (options: AutoSaveOptions) => {
  const { companyId, quarter, year, debounceMs = 1500, isAnnual = false, featureKey } = options;
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSavesRef = useRef<Map<string, string>>(new Map());
  const isSavingRef = useRef(false);
  const lastSavedRef = useRef<Date | null>(null);

  const performSave = useCallback(async () => {
    if (pendingSavesRef.current.size === 0 || isSavingRef.current) return;
    
    isSavingRef.current = true;
    const entriesToSave = new Map(pendingSavesRef.current);
    pendingSavesRef.current.clear();

    try {
      const entries = Array.from(entriesToSave.entries()).map(([kpiId, value]) => ({
        company_id: companyId,
        kpi_id: kpiId,
        value: String(value),
        quarter: isAnnual ? 'FY' : quarter,
        year: year,
      }));

      const { error } = await supabase
        .from('kpi_entries')
        .upsert(entries, {
          onConflict: 'company_id,kpi_id,quarter,year'
        });

      if (error) throw error;
      
      // For Sourcing & Fulfillment feature, also save to all other quarters in the same FY
      if (featureKey === 'sourcingFulfillment' && !isAnnual) {
        const allQuarters = ['Q1', 'Q2', 'Q3', 'Q4'];
        const otherQuarters = allQuarters.filter(q => q !== quarter);
        
        // Only pre-fill Sourcing & Fulfillment specific KPIs
        const sourcingEntries = entries.filter(e => isSourcingKPI(e.kpi_id));
        
        if (sourcingEntries.length > 0) {
          for (const otherQuarter of otherQuarters) {
            const otherQuarterEntries = sourcingEntries.map(e => ({
              ...e,
              quarter: otherQuarter,
            }));
            
            // Use upsert to avoid overwriting manually entered data
            // Only insert if no value exists for that quarter
            for (const entry of otherQuarterEntries) {
              const { data: existing } = await supabase
                .from('kpi_entries')
                .select('value')
                .eq('company_id', entry.company_id)
                .eq('kpi_id', entry.kpi_id)
                .eq('quarter', entry.quarter)
                .eq('year', entry.year)
                .maybeSingle();
              
              // Only insert if no existing value or existing value is empty
              if (!existing || !existing.value || existing.value.trim() === '') {
                await supabase
                  .from('kpi_entries')
                  .upsert([entry], {
                    onConflict: 'company_id,kpi_id,quarter,year'
                  });
              }
            }
          }
        }
      }
      
      lastSavedRef.current = new Date();
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Re-add failed entries back to pending
      entriesToSave.forEach((value, key) => {
        pendingSavesRef.current.set(key, value);
      });
      toast.error('Failed to auto-save. Retrying...');
    } finally {
      isSavingRef.current = false;
    }
  }, [companyId, quarter, year, isAnnual, featureKey]);

  const queueSave = useCallback((kpiId: string, value: string | number | boolean) => {
    pendingSavesRef.current.set(kpiId, String(value));

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);
  }, [debounceMs, performSave]);

  // Save any pending changes on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (pendingSavesRef.current.size > 0) {
        performSave();
      }
    };
  }, [performSave]);

  return {
    queueSave,
    lastSaved: lastSavedRef.current,
    hasPendingChanges: pendingSavesRef.current.size > 0,
  };
};

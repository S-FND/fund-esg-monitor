import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QuarterDataStatus {
  hasData: boolean;
  entryCount: number;
  isLoading: boolean;
}

interface QuarterlyDataStatus {
  Q1: QuarterDataStatus;
  Q2: QuarterDataStatus;
  Q3: QuarterDataStatus;
  Q4: QuarterDataStatus;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const defaultStatus: QuarterDataStatus = {
  hasData: false,
  entryCount: 0,
  isLoading: true,
};

export const useQuarterlyDataStatus = (companyId: string, year: number): QuarterlyDataStatus => {
  const [status, setStatus] = useState<QuarterlyDataStatus>({
    Q1: { ...defaultStatus },
    Q2: { ...defaultStatus },
    Q3: { ...defaultStatus },
    Q4: { ...defaultStatus },
    isLoading: true,
    refetch: async () => {},
  });
  
  const isMounted = useRef(true);

  const fetchStatus = useCallback(async () => {
    if (!companyId) return;

    try {
      // Fetch entries for all quarters in this year
      const { data, error } = await supabase
        .from('kpi_entries')
        .select('quarter, kpi_id, value')
        .eq('company_id', companyId)
        .eq('year', year)
        .in('quarter', ['Q1', 'Q2', 'Q3', 'Q4']);

      if (error) throw error;
      
      if (!isMounted.current) return;

      // Count non-empty entries per quarter
      const quarterCounts: Record<string, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
      
      data?.forEach(entry => {
        // Only count entries with actual values
        if (entry.value && entry.value.trim() !== '') {
          quarterCounts[entry.quarter] = (quarterCounts[entry.quarter] || 0) + 1;
        }
      });

      setStatus({
        Q1: { hasData: quarterCounts.Q1 > 0, entryCount: quarterCounts.Q1, isLoading: false },
        Q2: { hasData: quarterCounts.Q2 > 0, entryCount: quarterCounts.Q2, isLoading: false },
        Q3: { hasData: quarterCounts.Q3 > 0, entryCount: quarterCounts.Q3, isLoading: false },
        Q4: { hasData: quarterCounts.Q4 > 0, entryCount: quarterCounts.Q4, isLoading: false },
        isLoading: false,
        refetch: fetchStatus,
      });
    } catch (error) {
      console.error('Error fetching quarterly data status:', error);
      if (isMounted.current) {
        setStatus(prev => ({
          ...prev,
          isLoading: false,
          refetch: fetchStatus,
        }));
      }
    }
  }, [companyId, year]);

  // Refetch on mount and when dependencies change
  useEffect(() => {
    isMounted.current = true;
    fetchStatus();
    
    return () => {
      isMounted.current = false;
    };
  }, [fetchStatus]);

  // Refetch when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchStatus]);

  return status;
};

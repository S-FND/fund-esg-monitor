// hooks/useDashboardData.ts
import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../services/dashboardApi.js';
import { DashboardData, DashboardParams, SDGStrategyData, RiskData, NonComplianceData, ESG_MeterData, BoardMeetingData } from '../types/dashboard.types';

interface UseDashboardDataReturn {
  loading: boolean;
  data: DashboardData | null;
  error: string | null;
  fetchData: (params: DashboardParams) => Promise<void>;
  sdgData: SDGStrategyData[];
  riskData: RiskData | null;
  nonComplianceData: NonComplianceData[];
  esgMeterData: ESG_MeterData | null;
  boardMeetingsData: BoardMeetingData[];
}

export const useDashboardData = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (params: DashboardParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await dashboardApi.getInvestorDashboardData(params);
      if (response) {
        setData(response);
      } else {
        setError('Failed to fetch dashboard data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const sdgData = data?.dashboardOtherData?.dashboardSDGStratgyData || [];
  const riskData = data?.dashboardOtherData?.dashboardRiskData || null;
  const nonComplianceData = data?.dashboardOtherData?.dashboardNonComplianceData || [];
  const esgMeterData = data?.dashboardOtherData?.dashboardEsgMeterData || null;
  const boardMeetingsData = data?.percentage_of_board || [];

  return {
    loading,
    data,
    error,
    fetchData,
    sdgData,
    riskData,
    nonComplianceData,
    esgMeterData,
    boardMeetingsData
  };
};
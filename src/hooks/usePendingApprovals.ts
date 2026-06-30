import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RevenueStageRequest {
  id: string;
  company_id: string;
  company_name: string;
  current_stage: string;
  requested_stage: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export const usePendingApprovals = () => {
  const [requests, setRequests] = useState<RevenueStageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('revenue_stage_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;

      const typedData = (data || []).map((item) => ({
        ...item,
        status: item.status as 'pending' | 'approved' | 'rejected',
      }));
      
      setRequests(typedData);
      setPendingCount(typedData.filter(r => r.status === 'pending').length);
    } catch (err) {
      console.error('Error fetching approval requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const approveRequest = async (requestId: string, reviewedBy: string) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return false;

      // Update request status
      const { error: updateError } = await supabase
        .from('revenue_stage_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewedBy,
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Update company profile with new revenue stage
      const { error: profileError } = await supabase
        .from('company_profiles')
        .update({ revenue_stage: request.requested_stage })
        .eq('company_id', request.company_id);

      if (profileError) throw profileError;

      await fetchRequests();
      return true;
    } catch (err) {
      console.error('Error approving request:', err);
      return false;
    }
  };

  const rejectRequest = async (requestId: string, reviewedBy: string) => {
    try {
      const { error } = await supabase
        .from('revenue_stage_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewedBy,
        })
        .eq('id', requestId);

      if (error) throw error;

      await fetchRequests();
      return true;
    } catch (err) {
      console.error('Error rejecting request:', err);
      return false;
    }
  };

  const createRequest = async (
    companyId: string,
    companyName: string,
    currentStage: string,
    requestedStage: string
  ) => {
    try {
      // Check if there's already a pending request for this company
      const existing = requests.find(
        r => r.company_id === companyId && r.status === 'pending'
      );
      
      if (existing) {
        // Update existing request
        const { error } = await supabase
          .from('revenue_stage_requests')
          .update({
            current_stage: currentStage,
            requested_stage: requestedStage,
            requested_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new request
        const { error } = await supabase
          .from('revenue_stage_requests')
          .insert({
            company_id: companyId,
            company_name: companyName,
            current_stage: currentStage,
            requested_stage: requestedStage,
          });

        if (error) throw error;
      }

      await fetchRequests();
      return true;
    } catch (err) {
      console.error('Error creating request:', err);
      return false;
    }
  };

  const getCompanyPendingRequest = (companyId: string) => {
    return requests.find(r => r.company_id === companyId && r.status === 'pending');
  };

  return {
    requests,
    loading,
    pendingCount,
    approveRequest,
    rejectRequest,
    createRequest,
    getCompanyPendingRequest,
    refetch: fetchRequests,
  };
};

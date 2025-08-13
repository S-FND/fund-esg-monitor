import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PreScreeningResponse {
  questionId: string;
  response: string;
  score: number;
  remarks: string;
}

export function usePreScreeningDatabase(companyId?: string) {
  const [responses, setResponses] = useState<Record<string, PreScreeningResponse>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load existing responses for a company
  useEffect(() => {
    if (companyId) {
      loadResponses();
    }
  }, [companyId]);

  const loadResponses = async () => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      const { data: existingResponses, error } = await supabase
        .from('esg_responses')
        .select('*')
        .eq('company_id', companyId)
        .eq('category', 'prescreening');

      if (error) throw error;

      const responseMap: Record<string, PreScreeningResponse> = {};
      existingResponses?.forEach(response => {
        responseMap[response.question_id] = {
          questionId: response.question_id,
          response: response.response_value || 'No',
          score: response.score || 0,
          remarks: response.subcategory || ''
        };
      });

      setResponses(responseMap);
    } catch (error) {
      console.error('Error loading pre-screening responses:', error);
      toast({
        title: "Error",
        description: "Failed to load existing responses.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveResponses = async (allResponses: Record<string, PreScreeningResponse>) => {
    if (!companyId) {
      toast({
        title: "No Company Selected",
        description: "Cannot save responses without a company.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to save responses.",
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

      // Delete existing responses for this company and category
      await supabase
        .from('esg_responses')
        .delete()
        .eq('company_id', companyId)
        .eq('category', 'prescreening');

      // Insert new responses
      const responsesData = Object.values(allResponses).map(response => ({
        company_id: companyId,
        tenant_id: profile.tenant_id,
        question_id: response.questionId,
        category: 'prescreening',
        subcategory: response.remarks,
        response_value: response.response,
        score: response.score,
        created_by: user.id
      }));

      if (responsesData.length > 0) {
        const { error } = await supabase
          .from('esg_responses')
          .insert(responsesData);

        if (error) throw error;
      }

      toast({
        title: "Responses Saved",
        description: "Pre-screening responses have been successfully saved.",
      });
      return true;
    } catch (error) {
      console.error('Error saving pre-screening responses:', error);
      toast({
        title: "Error",
        description: "Failed to save responses. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    responses,
    setResponses,
    loading,
    saveResponses,
    loadResponses
  };
}
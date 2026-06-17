import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TicketStatus } from '@/types/esg';

export interface SupportTicket {
  id: string;
  company_id: string;
  company_name?: string;
  submitted_by: string;
  ticket_type: 'technical' | 'query';
  subject: string;
  description: string;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high';
  attachment_url?: string;
  resolved_at?: string;
  resolved_by?: string;
  admin_notes?: string;
  feature_tab?: string;
  kpi_reference?: string;
  field_reference?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
}

interface CreateTicketData {
  company_id: string;
  company_name?: string;
  submitted_by: string;
  ticket_type: 'technical' | 'query';
  subject: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
  feature_tab?: string;
  kpi_reference?: string;
  field_reference?: string;
  contact_email?: string;
  contact_phone?: string;
}

interface UpdateTicketData {
  status?: TicketStatus;
  admin_notes?: string;
  resolved_at?: string;
  resolved_by?: string;
}

export const useSupportTickets = (companyId?: string, fetchAll: boolean = false) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      // If not fetching all, filter by company_id
      if (!fetchAll && companyId) {
        query = query.eq('company_id', companyId);
      } else if (!fetchAll && !companyId) {
        setLoading(false);
        return;
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Map status values for backward compatibility
      const mappedData = (data || []).map(ticket => ({
        ...ticket,
        status: ticket.status === 'in_progress' ? 'work_in_progress' : ticket.status
      })) as SupportTicket[];
      
      setTickets(mappedData);
    } catch (err: any) {
      console.error('Error fetching support tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId, fetchAll]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const createTicket = async (data: CreateTicketData): Promise<boolean> => {
    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('support_tickets')
        .insert([data]);

      if (error) throw error;

      toast.success('Your issue has been submitted successfully. Our team will get back to you soon.');
      await fetchTickets();
      return true;
    } catch (err: any) {
      console.error('Error creating ticket:', err);
      toast.error('Failed to submit ticket');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const updateTicket = async (ticketId: string, data: UpdateTicketData): Promise<boolean> => {
    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('support_tickets')
        .update(data)
        .eq('id', ticketId);

      if (error) throw error;

      toast.success('Ticket updated successfully');
      await fetchTickets();
      return true;
    } catch (err: any) {
      console.error('Error updating ticket:', err);
      toast.error('Failed to update ticket');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    tickets,
    loading,
    submitting,
    createTicket,
    updateTicket,
    refetch: fetchTickets,
  };
};

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
}

export const useAdminSettings = () => {
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*');

      if (error) throw error;
      setSettings(data || []);
    } catch (err: any) {
      console.error('Error fetching admin settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getSetting = (key: string): string | null => {
    const setting = settings.find(s => s.setting_key === key);
    return setting?.setting_value || null;
  };

  const updateSetting = async (key: string, value: string | null): Promise<boolean> => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('admin_settings')
        .update({ setting_value: value })
        .eq('setting_key', key);

      if (error) throw error;

      setSettings(prev => 
        prev.map(s => s.setting_key === key ? { ...s, setting_value: value } : s)
      );
      
      toast.success('Setting updated successfully');
      return true;
    } catch (err: any) {
      console.error('Error updating setting:', err);
      toast.error('Failed to update setting');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const getDataCollectionDueDate = (): Date | null => {
    const dateStr = getSetting('data_collection_due_date');
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  const setDataCollectionDueDate = async (date: Date | null): Promise<boolean> => {
    const value = date ? date.toISOString() : null;
    return updateSetting('data_collection_due_date', value);
  };

  return {
    settings,
    loading,
    saving,
    getSetting,
    updateSetting,
    getDataCollectionDueDate,
    setDataCollectionDueDate,
    refetch: fetchSettings,
  };
};

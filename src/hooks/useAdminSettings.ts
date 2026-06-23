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

  // ─── Published Score Period ───
  // The reporting period whose scores/grades/percentiles/rankings/recommendations
  // are currently shown on company dashboards. Defaults to Q4 2025 until an admin
  // explicitly publishes a new period (typically after JFM 2026 submissions close).
  const getPublishedPeriod = (): { year: number; quarter: string } => {
    const raw = getSetting('published_score_period');
    if (!raw) return { year: 2025, quarter: 'FY' };
    try {
      const parsed = JSON.parse(raw);
      const y = Number(parsed?.year);
      const q = String(parsed?.quarter || 'FY');
      if (!Number.isFinite(y)) return { year: 2025, quarter: 'FY' };
      return { year: y, quarter: q };
    } catch {
      return { year: 2025, quarter: 'FY' };
    }
  };

  const getPublishedAt = (): Date | null => {
    const s = getSetting('published_score_at');
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  const getPublishedBy = (): string | null => getSetting('published_score_by');

  const publishPeriod = async (
    year: number,
    quarter: string,
    publishedBy?: string,
  ): Promise<boolean> => {
    const ok1 = await updateSetting('published_score_period', JSON.stringify({ year, quarter }));
    const ok2 = await updateSetting('published_score_at', new Date().toISOString());
    const ok3 = await updateSetting('published_score_by', publishedBy || 'Fireside Admin');
    return ok1 && ok2 && ok3;
  }


  return {
    settings,
    loading,
    saving,
    getSetting,
    updateSetting,
    getDataCollectionDueDate,
    setDataCollectionDueDate,
    getPublishedPeriod,
    getPublishedAt,
    getPublishedBy,
    publishPeriod,
    refetch: fetchSettings
  };
};

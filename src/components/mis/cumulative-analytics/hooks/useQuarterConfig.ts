/**
 * useQuarterConfig — React hook exposing the centrally managed quarter
 * configuration. Any UI selector, filter, or analytics module that needs to
 * know "which quarters exist / are enabled" should consume this hook so we
 * never hardcode quarter labels.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  addYear,
  fetchQuarterConfiguration,
  listEnabledQuarterLabels,
  listEnabledSlices,
  listQuarters,
  listYears,
  saveQuarterConfiguration,
  toggleQuarter,
  withDefaultsMerged,
  type EnabledSlice,
  type QuarterConfiguration,
} from '../services/quarterConfig';

export interface UseQuarterConfig {
  config: QuarterConfiguration;
  loading: boolean;
  saving: boolean;
  years: number[];
  enabledSlices: EnabledSlice[];
  enabledQuarters: string[];
  quartersFor: (year: number) => string[];
  setQuarterEnabled: (year: number, quarter: string, enabled: boolean) => Promise<void>;
  addYear: (year: number, quarters?: string[]) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useQuarterConfig(): UseQuarterConfig {
  const [config, setConfig] = useState<QuarterConfiguration>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await fetchQuarterConfiguration();
      setConfig(withDefaultsMerged(raw));
    } catch (e: any) {
      console.error('quarterConfig load failed', e);
      toast.error('Failed to load quarter configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const persist = useCallback(async (next: QuarterConfiguration) => {
    setSaving(true);
    try {
      await saveQuarterConfiguration(next);
      setConfig(next);
    } catch (e: any) {
      console.error('quarterConfig save failed', e);
      toast.error('Failed to save quarter configuration');
      throw e;
    } finally {
      setSaving(false);
    }
  }, []);

  const setQuarterEnabled = useCallback(async (year: number, quarter: string, enabled: boolean) => {
    await persist(toggleQuarter(config, year, quarter, enabled));
  }, [config, persist]);

  const addYearFn = useCallback(async (year: number, quarters?: string[]) => {
    await persist(addYear(config, year, quarters));
  }, [config, persist]);

  const years = useMemo(() => listYears(config), [config]);
  const enabledSlices = useMemo(() => listEnabledSlices(config), [config]);
  const enabledQuarters = useMemo(() => listEnabledQuarterLabels(config), [config]);
  const quartersFor = useCallback((year: number) => listQuarters(config, year), [config]);

  return {
    config,
    loading,
    saving,
    years,
    enabledSlices,
    enabledQuarters,
    quartersFor,
    setQuarterEnabled,
    addYear: addYearFn,
    refetch: load,
  };
}

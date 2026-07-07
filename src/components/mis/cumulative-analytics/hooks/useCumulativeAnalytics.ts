/**
 * useCumulativeAnalytics
 * ─────────────────────────────────────────────────────────────────────────────
 * Orchestrates the cumulative analytics pipeline:
 *   1. Reads centrally-managed enabled quarters via `useQuarterConfig`.
 *   2. Fetches the raw KPI entries across those slices (once, cached in state).
 *   3. Fetches per-company feature enablement.
 *   4. Runs the aggregation, scoring and ranking utilities.
 *
 * Every expensive step is memoized on its inputs so filter changes don't
 * refetch, and the raw fetch re-runs only when the enabled-slice set changes.
 */
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mockCompanies } from '@/data/mockData';
import { isCompanyExcluded } from '@/lib/companyExclusions';
import { useQuarterConfig } from '@/hooks/useQuarterConfig';
import { fetchCumulativeEntries } from '../services/cumulativeDataService';
import { aggregateCumulative } from '../utils/cumulativeAggregation';
import { rankCumulative } from '../utils/cumulativeRanking';
import { scoreCumulative } from '../utils/cumulativeScore';
import type {
  AnalyticsContext,
  CumulativeAnalyticsResult,
  KPIEntryInput,
  PortfolioRankingsResult,
  PortfolioScoreOutput,
} from '../lib/portfolio-helpers';

export interface CumulativeFilters {
  industry?: string;
  fund?: string;
  revenueStage?: string;
  qCategory?: string;
  firesidePOC?: string;
  companyId?: string;
}

export interface CumulativeAnalyticsData {
  analytics: CumulativeAnalyticsResult;
  scores: PortfolioScoreOutput;
  rankings: PortfolioRankingsResult;
}

async function fetchFeatureFlagsMap(): Promise<Record<string, Record<string, boolean>>> {
  const { data, error } = await supabase
    .from('company_feature_settings')
    .select('company_id, feature_key, enabled');
  if (error) throw error;
  const map: Record<string, Record<string, boolean>> = {};
  for (const r of data ?? []) {
    if (!map[r.company_id]) map[r.company_id] = {};
    map[r.company_id][r.feature_key] = !!r.enabled;
  }
  return map;
}

export function useCumulativeAnalytics(filters: CumulativeFilters) {
  const { enabledSlices, loading: cfgLoading } = useQuarterConfig();
  const [entries, setEntries] = useState<KPIEntryInput[]>([]);
  const [features, setFeatures] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable key for the enabled-slice set — re-fetch only when the set actually changes.
  const sliceKey = useMemo(
    () => enabledSlices.map(s => `${s.year}-${s.quarter}`).sort().join('|'),
    [enabledSlices],
  );

  useEffect(() => {
    fetchFeatureFlagsMap().then(setFeatures).catch(e => setError(String(e)));
  }, []);

  useEffect(() => {
    if (cfgLoading) return;
    if (enabledSlices.length === 0) {
      setEntries([]);
      return;
    }
    setLoading(true);
    setError(null);
    fetchCumulativeEntries(enabledSlices)
      .then(setEntries)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
    // sliceKey drives refetch; enabledSlices identity may flip without change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliceKey, cfgLoading]);

  // Only companies that actually reported at least one KPI in the enabled window
  // participate in the cumulative view. Makes averages/rankings robust when the
  // portfolio size differs across years (e.g. 2025=39, 2026=41).
  const reportingIds = useMemo(() => {
    const s = new Set<string>();
    for (const e of entries) s.add(e.companyId);
    return s;
  }, [entries]);

  const context: AnalyticsContext = useMemo(() => {
    const invested = mockCompanies.filter(c => {
      if ((c as any).investmentStatus !== 'Invested') return false;
      const excludedFromAll =
        enabledSlices.length > 0 &&
        enabledSlices.every(s => isCompanyExcluded(c.id, s.quarter, s.year));
      if (excludedFromAll) return false;
      if (reportingIds.size > 0 && !reportingIds.has(c.id)) return false;
      if (filters.industry && (c as any).industry !== filters.industry) return false;
      if (filters.fund && (c as any).fund !== filters.fund) return false;
      if (filters.revenueStage && (c as any).revenueStage !== filters.revenueStage) return false;
      if (filters.qCategory && (c as any).qCategory !== filters.qCategory) return false;
      if (filters.firesidePOC && (c as any).fl !== filters.firesidePOC) return false;
      if (filters.companyId && c.id !== filters.companyId) return false;
      return true;
    });
    return {
      companies: invested.map(c => ({
        id: c.id,
        name: c.name,
        brand: c.brand,
        industry: c.industry,
        revenueStage: c.revenueStage,
        features: features[c.id] ?? {},
      })),
    };
  }, [enabledSlices, features, reportingIds, filters.industry, filters.fund, filters.revenueStage, filters.qCategory, filters.firesidePOC, filters.companyId]);

  const data: CumulativeAnalyticsData | null = useMemo(() => {
    if (loading || cfgLoading) return null;
    if (context.companies.length === 0 || entries.length === 0) return null;
    const analytics = aggregateCumulative({ entries, context });
    const scores = scoreCumulative({ entries, companies: context.companies, enabledSlices });
    const rankings = rankCumulative({ entries, companies: context.companies, enabledSlices });
    return { analytics, scores, rankings };
  }, [entries, context, enabledSlices, loading, cfgLoading]);

  return {
    data,
    loading: loading || cfgLoading,
    error,
    enabledSlices,
    companyCount: context.companies.length,
  };
}



/**
 * CumulativeAnalytics — top-level page for the cumulative analytics feature.
 * ─────────────────────────────────────────────────────────────────────────────
 * Design parity with `/admin/dashboard`: same DashboardLayout, PageHeader,
 * filter row, tabs (Aggregation / Insight) and reusable panels
 * (PortfolioStatCards, ESGCompositePanel, CompanyRankingsPanel).
 *
 * Data source is 100% cumulative — driven off the enabled quarters returned
 * by `useQuarterConfig`. When the admin toggles a quarter in Settings, the
 * cumulative view updates automatically.
 */
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Lightbulb, Building2, Layers } from 'lucide-react';
import { mockCompanies } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';

import { PortfolioStatCards } from '../components/PortfolioStatCards';
import { ESGCompositePanel } from '../components/ESGCompositePanel';
import { CompanyRankingsPanel } from '../components/CompanyRankingsPanel';
import { EnabledSlicesBadge } from '../components/EnabledSlicesBadge';
import {
  useCumulativeAnalytics,
  type CumulativeFilters,
  type FeatureFlagsMap,
} from '../hooks/useCumulativeAnalytics';
import type { KPIEntryInput } from '../lib/portfolio-helpers';
import { http } from '@/utils/httpInterceptor';

const INDUSTRIES = ['Beauty & Personal Care', 'Fashion & Lifestyle', 'Health & Wellness', 'Food & Beverage', 'Home & Décor', 'Platform Enablers'] as const;
const FUNDS = ['Fund I', 'Fund II', 'Fund III', 'Fund IV'] as const;
const REVENUE_STAGES = ['0-50', '50-100', '100-500', '500+'] as const;
const Q_CATEGORIES = ['Q', 'Q1', 'Q2', 'Q3', 'Early'] as const;

const PAGE = 1000;
async function fetchAllEntries(): Promise<KPIEntryInput[]> {
  const out: KPIEntryInput[] = [];
  let from = 0;
  let data=await http.get(`mis/kpi-entries`);
  if(data.error) throw data.error;
  for (const r of data.data ?? []) {
      out.push({
        companyId: r.companyId,
        kpiId: r.kpi_id,
        value: r.value,
        quarter: r.quarter,
        year: r.year,
        submittedAt: (r as any).submitted_at ?? null,
      });
    }
  return out;
}
async function fetchAllFeatures(): Promise<FeatureFlagsMap> {
  const data=await http.get(`mis/company-feature-settings`);
  if (data.error) throw data.error;
  if (!data.data) return {};
  const map: FeatureFlagsMap = {};
  for (const r of data.data ?? []) {
    if (!map[r.companyId]) map[r.companyId] = {};
    map[r.companyId][r.feature_key] = !!r.enabled;
  }
  return map;
}



const CumulativeAnalytics = ({adminfilters}) => {
  const [filters, setFilters] = useState<CumulativeFilters>(adminfilters || {});
  const [tab, setTab] = useState<'aggregation' | 'insight'>('insight');
  const [allEntries, setAllEntries] = useState<KPIEntryInput[]>([]);
  const [allFeatures, setAllFeatures] = useState<FeatureFlagsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAllEntries(), fetchAllFeatures()])
      .then(([e, f]) => { setAllEntries(e); setAllFeatures(f); })
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  const { data, enabledSlices, companyCount } = useCumulativeAnalytics({
    allEntries,
    allFeatures,
    filters,
  });

  const update = <K extends keyof CumulativeFilters>(k: K, v: CumulativeFilters[K]) =>
    setFilters(prev => ({ ...prev, [k]: v }));

  const firesidePOCOptions = useMemo(
    () =>
      Array.from(
        new Set(
          mockCompanies
            .filter(c => (c as any).investmentStatus === 'Invested' && (c as any).fl && (c as any).fl !== 'Demo User')
            .map(c => (c as any).fl as string),
        ),
      ).sort(),
    [],
  );

  const companyOptions = useMemo(
    () =>
      mockCompanies
        .filter(c => (c as any).investmentStatus === 'Invested')
        .map(c => ({ id: c.id, brand: c.brand })),
    [],
  );

  const cumulativeLabel = useMemo(() => {
    if (enabledSlices.length === 0) return 'Cumulative';
    const years = Array.from(new Set(enabledSlices.map(s => s.year))).sort();
    return `Cumulative (${years.join(', ')})`;
  }, [enabledSlices]);

  return (
    <div>

      {error && <div className="text-sm text-rose-600 mb-3">{error}</div>}

      

      {/* ─── Configuration banner ─── */}
      {/* <div className="flex items-center gap-3 mt-2 p-3 rounded-lg bg-muted/30 border border-border">
        <Layers className="w-4 h-4 text-muted-foreground" />
        <EnabledSlicesBadge slices={enabledSlices} />
      </div> */}

      {/* ─── Tabs ─── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !data ? (
        <div className="mt-6 text-sm text-muted-foreground">
          No cumulative data available for the current selection.
        </div>
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'aggregation' | 'insight')} className="mt-4">
          {/* <TabsList className="grid w-full max-w-md grid-cols-2"> */}
            {/* <TabsTrigger value="aggregation" className="flex items-center gap-1.5 text-xs">
              <BarChart3 className="w-3.5 h-3.5" />
              Aggregation
            </TabsTrigger> */}
            {/* <TabsTrigger value="insight" className="flex items-center gap-1.5 text-xs">
              <Lightbulb className="w-3.5 h-3.5" />
              Insight
            </TabsTrigger> */}
          {/* </TabsList> */}

          {/* <TabsContent value="aggregation" className="mt-4 space-y-6">
            <PortfolioStatCards
              result={data.analytics}
              label={cumulativeLabel}
              scoreAverages={{
                compositeScore: data.scores.summary.averages.compositeScore ?? 0,
                environmentScore: data.scores.summary.averages.environmentScore ?? 0,
                socialScore: data.scores.summary.averages.socialScore ?? 0,
                governanceScore: data.scores.summary.averages.governanceScore ?? 0,
              }}
            />

            <ESGCompositePanel
              result={data.analytics}
              scoreAverages={{
                compositeScore: data.scores.summary.averages.compositeScore ?? 0,
                environmentScore: data.scores.summary.averages.environmentScore ?? 0,
                socialScore: data.scores.summary.averages.socialScore ?? 0,
                governanceScore: data.scores.summary.averages.governanceScore ?? 0,
              }}
            />
          </TabsContent> */}

          <TabsContent value="insight">
            <CompanyRankingsPanel rankings={data.rankings.perCompany} />
            <ESGCompositePanel
              result={data.analytics}
              scoreAverages={{
                compositeScore: data.scores.summary.averages.compositeScore ?? 0,
                environmentScore: data.scores.summary.averages.environmentScore ?? 0,
                socialScore: data.scores.summary.averages.socialScore ?? 0,
                governanceScore: data.scores.summary.averages.governanceScore ?? 0,
              }}
            />
            
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default CumulativeAnalytics;





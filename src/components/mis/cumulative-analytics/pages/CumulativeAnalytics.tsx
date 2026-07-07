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
import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Lightbulb, Building2, Layers } from 'lucide-react';
import { mockCompanies } from '@/data/mockData';

import { PortfolioStatCards } from '../components/PortfolioStatCards';
import { ESGCompositePanel } from '../components/ESGCompositePanel';
import { CompanyRankingsPanel } from '../components/CompanyRankingsPanel';
import { EnabledSlicesBadge } from '../components/EnabledSlicesBadge';
import { useCumulativeAnalytics, type CumulativeFilters } from '../hooks/useCumulativeAnalytics';

const INDUSTRIES = ['Beauty & Personal Care', 'Fashion & Lifestyle', 'Health & Wellness', 'Food & Beverage', 'Home & Décor', 'Platform Enablers'] as const;
const FUNDS = ['Fund I', 'Fund II', 'Fund III', 'Fund IV'] as const;
const REVENUE_STAGES = ['0-50', '50-100', '100-500', '500+'] as const;
const Q_CATEGORIES = ['Q', 'Q1', 'Q2', 'Q3', 'Early'] as const;

const CumulativeAnalytics = () => {
  const [filters, setFilters] = useState<CumulativeFilters>({});
  const [tab, setTab] = useState<'aggregation' | 'insight'>('aggregation');

  const { data, loading, error, enabledSlices, companyCount } = useCumulativeAnalytics(filters);

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
    <DashboardLayout>
      <PageHeader
        title="Cumulative Analytics"
        subtitle="Portfolio performance aggregated across all enabled reporting quarters"
      />

      {error && <div className="text-sm text-rose-600 mb-3">{error}</div>}

      {/* ─── Filter Row (mirrors /admin/dashboard) ─── */}
      <div className="flex flex-wrap items-center gap-2 mt-2 mb-3">
        <Select value={filters.industry ?? 'all'} onValueChange={v => update('industry', v === 'all' ? undefined : v)}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All Industries" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.fund ?? 'all'} onValueChange={v => update('fund', v === 'all' ? undefined : v)}>
          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="All Funds" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Funds</SelectItem>
            {FUNDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.revenueStage ?? 'all'} onValueChange={v => update('revenueStage', v === 'all' ? undefined : v)}>
          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="All Revenue" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Revenue</SelectItem>
            {REVENUE_STAGES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.qCategory ?? 'all'} onValueChange={v => update('qCategory', v === 'all' ? undefined : v)}>
          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="All Q Cat" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Q Cat</SelectItem>
            {Q_CATEGORIES.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.firesidePOC ?? 'all'} onValueChange={v => update('firesidePOC', v === 'all' ? undefined : v)}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All Fireside POCs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fireside POCs</SelectItem>
            {firesidePOCOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="h-4 w-px bg-border" />

        <Select value={filters.companyId ?? 'all'} onValueChange={v => update('companyId', v === 'all' ? undefined : v)}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All Companies" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companyOptions.map(c => <SelectItem key={c.id} value={c.id}>{c.brand}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            <Building2 className="w-3 h-3 mr-1" />
            {companyCount} companies
          </Badge>
        </div>
      </div>

      {/* ─── Configuration banner ─── */}
      <div className="flex items-center gap-3 mt-2 p-3 rounded-lg bg-muted/30 border border-border">
        <Layers className="w-4 h-4 text-muted-foreground" />
        <EnabledSlicesBadge slices={enabledSlices} />
      </div>

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
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="aggregation" className="flex items-center gap-1.5 text-xs">
              <BarChart3 className="w-3.5 h-3.5" />
              Aggregation
            </TabsTrigger>
            <TabsTrigger value="insight" className="flex items-center gap-1.5 text-xs">
              <Lightbulb className="w-3.5 h-3.5" />
              Insight
            </TabsTrigger>
          </TabsList>

          <TabsContent value="aggregation" className="mt-4 space-y-6">
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

            <ESGCompositePanel result={data.analytics} />
          </TabsContent>

          <TabsContent value="insight" className="mt-4 space-y-6">
            <ESGCompositePanel result={data.analytics} />
            <CompanyRankingsPanel rankings={data.rankings.perCompany} />
          </TabsContent>
        </Tabs>
      )}
    </DashboardLayout>
  );
};

export default CumulativeAnalytics;

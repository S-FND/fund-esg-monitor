import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BarChart3, Leaf, Users, ShieldCheck } from 'lucide-react';
import type { AnalyticsResult } from '../lib/portfolio-helpers';
import type { CompanyRawMetrics } from './panelTypes';

type BucketKey = 'AA' | 'A' | 'BB' | 'B' | 'C';
type PillarKey = 'composite' | 'env' | 'social' | 'gov';

const BUCKETS: { key: BucketKey; header: string; card: string; row: string; nameTone?: string }[] = [
  { key: 'AA', header: 'bg-emerald-500 text-white', card: 'border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900', row: 'bg-emerald-50/60 dark:bg-emerald-950/20' },
  { key: 'A',  header: 'bg-blue-500 text-white',    card: 'border-blue-200 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-900',           row: 'bg-blue-50/60 dark:bg-blue-950/20' },
  { key: 'BB', header: 'bg-amber-400 text-white',   card: 'border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900',      row: 'bg-amber-50/60 dark:bg-amber-950/20' },
  { key: 'B',  header: 'bg-orange-500 text-white',  card: 'border-orange-200 bg-orange-50/40 dark:bg-orange-950/20 dark:border-orange-900',   row: 'bg-orange-50/60 dark:bg-orange-950/20', nameTone: 'text-orange-700 dark:text-orange-400' },
  { key: 'C',  header: 'bg-rose-500 text-white',    card: 'border-rose-200 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-900',           row: 'bg-rose-50/60 dark:bg-rose-950/20',     nameTone: 'text-rose-700 dark:text-rose-400' },
];

const PILLAR_LABEL: Record<PillarKey, string> = {
  composite: 'ESG Composite Score',
  env: 'Environment Score',
  social: 'Social Score',
  gov: 'Governance Score',
};

const mean = (arr: number[]) => (arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);
const r1 = (v: number) => Math.round(v * 10) / 10;

// Match Admin Dashboard ESGCategoryBreakdown: bucket by percentile rank within the cohort.
const assignPercentiles = (items: { name: string; score: number }[]) => {
  if (items.length === 0) return [];
  if (items.length === 1) return [{ ...items[0], percentile: 99 }];
  const sorted = [...items].sort((a, b) => {
    const diff = a.score - b.score;
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });
  const n = sorted.length;
  return sorted.map((c, idx) => ({
    ...c,
    percentile: Math.max(1, Math.min(99, Math.round(((idx + 1) / n) * 99))),
  }));
};
const gradeOfPercentile = (p: number): BucketKey => {
  if (p >= 80) return 'AA';
  if (p >= 60) return 'A';
  if (p >= 40) return 'BB';
  if (p >= 20) return 'B';
  return 'C';
};

interface Props {
  result: AnalyticsResult;
  scoreAverages?: {
    compositeScore: number;
    environmentScore: number;
    socialScore: number;
    governanceScore: number;
  };
  /**
   * When provided, sources ESG composite/E/S/G values from the Admin Dashboard's
   * pipeline (useAnalyticsDashboardData → per-company insights), so the snapshot
   * numbers match the Admin Dashboard exactly. Falls back to the independent
   * scoring engine when omitted.
   */
  companyRawData?: CompanyRawMetrics[];
}

export const ESGCompositePanel = ({ result, scoreAverages, companyRawData }: Props) => {
  // ── Path A: reuse Admin Dashboard's data (preferred) ─────────────────────
  if (companyRawData && companyRawData.length > 0) {
    const submitting = companyRawData.filter(c => Object.keys(c.kpis).length > 0);
    const envEligible = submitting.filter(c => c.hasEnvironmentFeature);
    const submittingCount = submitting.length;

    const avgInsight = (key: keyof CompanyRawMetrics['insights'], pool = submitting) => {
      const vals = pool
        .map(c => c.insights[key] as number)
        .filter(v => v !== undefined && v !== null && !isNaN(v as number));
      return vals.length > 0 ? r1(vals.reduce((s, v) => s + (v as number), 0) / vals.length) : 0;
    };

    const composite = avgInsight('esgCompositeScore');
    const environment = avgInsight('circularEconomyIndex', envEligible);
    const social = avgInsight('socialScore');
    const governance = avgInsight('governanceScore');

    const headers = [
      { key: 'composite' as PillarKey, label: 'ESG Composite Score', value: composite, n: submittingCount, icon: BarChart3,   card: 'border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20', iconColor: 'text-emerald-500' },
      { key: 'env' as PillarKey,       label: 'Environment Score',   value: environment, n: envEligible.length, icon: Leaf,   card: 'border-amber-200 bg-amber-50/60 dark:bg-amber-950/20',    iconColor: 'text-amber-500' },
      { key: 'social' as PillarKey,    label: 'Social Score',        value: social, n: submittingCount, icon: Users,          card: 'border-blue-200 bg-blue-50/60 dark:bg-blue-950/20',       iconColor: 'text-blue-500' },
      { key: 'gov' as PillarKey,       label: 'Governance Score',    value: governance, n: submittingCount, icon: ShieldCheck, card: 'border-purple-200 bg-purple-50/60 dark:bg-purple-950/20', iconColor: 'text-purple-500' },
    ];

    // Per-pillar item sources for the category breakdown.
    const itemsByPillar: Record<PillarKey, { name: string; score: number }[]> = {
      composite: submitting.map(c => ({ name: c.brand || c.companyName, score: (c.insights.esgCompositeScore as number) ?? 0 })),
      env:       envEligible.map(c => ({ name: c.brand || c.companyName, score: (c.insights.circularEconomyIndex as number) ?? 0 })),
      social:    submitting.map(c => ({ name: c.brand || c.companyName, score: (c.insights.socialScore as number) ?? 0 })),
      gov:       submitting.map(c => ({ name: c.brand || c.companyName, score: (c.insights.governanceScore as number) ?? 0 })),
    };

    return renderPanel({ headers, itemsByPillar, n: submittingCount, footnote: 'Sourced from Admin Dashboard pipeline (per-company insights).' });
  }

  // ── Path B: fallback to independent engine ───────────────────────────────
  const companies = result.companies;
  const n = companies.length;
  const envCompanies = companies.filter(c => c.hasEnvironmentFeature);
  const composite = scoreAverages ? r1(scoreAverages.compositeScore) : r1(mean(companies.map(c => c.scores.compositeScore)));
  const environment = scoreAverages ? r1(scoreAverages.environmentScore) : r1(mean(envCompanies.map(c => c.scores.environmentScore)));
  const social = scoreAverages ? r1(scoreAverages.socialScore) : r1(mean(companies.map(c => c.scores.socialScore)));
  const governance = scoreAverages ? r1(scoreAverages.governanceScore) : r1(mean(companies.map(c => c.scores.governanceScore)));

  const headers = [
    { key: 'composite' as PillarKey, label: 'ESG Composite Score', value: composite, n, icon: BarChart3,   card: 'border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20', iconColor: 'text-emerald-500' },
    { key: 'env' as PillarKey,       label: 'Environment Score',   value: environment, n: envCompanies.length, icon: Leaf, card: 'border-amber-200 bg-amber-50/60 dark:bg-amber-950/20', iconColor: 'text-amber-500' },
    { key: 'social' as PillarKey,    label: 'Social Score',        value: social, n, icon: Users,          card: 'border-blue-200 bg-blue-50/60 dark:bg-blue-950/20', iconColor: 'text-blue-500' },
    { key: 'gov' as PillarKey,       label: 'Governance Score',    value: governance, n, icon: ShieldCheck, card: 'border-purple-200 bg-purple-50/60 dark:bg-purple-950/20', iconColor: 'text-purple-500' },
  ];
  const itemsByPillar: Record<PillarKey, { name: string; score: number }[]> = {
    composite: companies.map(c => ({ name: c.companyName, score: c.scores.compositeScore })),
    env:       envCompanies.map(c => ({ name: c.companyName, score: c.scores.environmentScore })),
    social:    companies.map(c => ({ name: c.companyName, score: c.scores.socialScore })),
    gov:       companies.map(c => ({ name: c.companyName, score: c.scores.governanceScore })),
  };

  return renderPanel({ headers, itemsByPillar, n });
};

function renderPanel({
  headers,
  itemsByPillar,
  n,
  footnote,
}: {
  headers: { key: PillarKey; label: string; value: number; n: number; icon: React.ComponentType<{ className?: string }>; card: string; iconColor: string }[];
  itemsByPillar: Record<PillarKey, { name: string; score: number }[]>;
  n: number;
  footnote?: string;
}) {
  return (
    <ESGCompositePanelInner
      headers={headers}
      itemsByPillar={itemsByPillar}
      n={n}
      footnote={footnote}
    />
  );
}

function ESGCompositePanelInner({
  headers,
  itemsByPillar,
  n,
  footnote,
}: {
  headers: { key: PillarKey; label: string; value: number; n: number; icon: React.ComponentType<{ className?: string }>; card: string; iconColor: string }[];
  itemsByPillar: Record<PillarKey, { name: string; score: number }[]>;
  n: number;
  footnote?: string;
}) {
  const [selectedPillar, setSelectedPillar] = useState<PillarKey>('composite');

  const activeItems = itemsByPillar[selectedPillar];
  const ranked = assignPercentiles(activeItems);
  const grouped: Record<BucketKey, { name: string; score: number; percentile: number }[]> = { AA: [], A: [], BB: [], B: [], C: [] };
  ranked.forEach(it => grouped[gradeOfPercentile(it.percentile)].push(it));
  for (const k of Object.keys(grouped) as BucketKey[]) grouped[k].sort((a, b) => b.percentile - a.percentile);
  const activeN = activeItems.length;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-emerald-500" />
        <h2 className="text-base font-semibold">Cross-Module: ESG Composite Scores</h2>
        <Badge variant="outline" className="text-[10px]">Auto-calculated</Badge>
        <Badge variant="secondary" className="text-[10px] ml-1">n={n}</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {headers.map(h => {
          const Icon = h.icon;
          const active = h.key === selectedPillar;
          return (
            <Card
              key={h.key}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedPillar(h.key)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPillar(h.key); } }}
              className={`${h.card} cursor-pointer transition-all hover:shadow-md ${active ? 'ring-2 ring-primary/40' : ''}`}
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{h.label}</span>
                  <Icon className={`w-4 h-4 ${h.iconColor}`} />
                </div>
                <div className="text-2xl font-bold tabular-nums">
                  {h.value.toFixed(1)}
                  <span className="text-xs text-muted-foreground ml-1 font-normal">/ 100</span>
                </div>
                <Badge variant="outline" className="mt-1 text-[10px]">n={h.n}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CategoryBreakdownCard
        pillarLabel={PILLAR_LABEL[selectedPillar]}
        pillarKey={selectedPillar}
        grouped={grouped}
        n={activeN}
        footnote={footnote}
      />
    </section>
  );
}

function CategoryBreakdownCard({
  pillarLabel,
  pillarKey,
  grouped,
  n,
  footnote,
}: {
  pillarLabel: string;
  pillarKey: PillarKey;
  grouped: Record<BucketKey, { name: string; score: number; percentile: number }[]>;
  n: number;
  footnote?: string;
}) {
  const [showScores, setShowScores] = useState(false);
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{pillarLabel} — Category Breakdown</h3>
            <Badge variant="secondary" className="text-[10px]">n={n}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="cum-show-scores" checked={showScores} onCheckedChange={setShowScores} />
            <Label htmlFor="cum-show-scores" className="text-xs cursor-pointer">Show Scores</Label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {BUCKETS.map(b => {
            const items = grouped[b.key];
            return (
              <div key={b.key} className={`rounded-md border ${b.card} overflow-hidden`}>
                <div className={`text-center py-1.5 font-semibold text-sm ${b.header}`}>{b.key}</div>
                <div className="divide-y divide-border/50">
                  {items.length === 0 && (
                    <div className="text-[11px] text-muted-foreground text-center py-4">—</div>
                  )}
                  {items.map(it => (
                    <div
                      key={it.name}
                      className={`flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs ${b.row}`}
                      title={`${it.name} · ${it.score.toFixed(1)} · P${it.percentile}`}
                    >
                      <span className={`truncate font-medium ${b.nameTone ?? ''}`}>{it.name}</span>
                      {showScores && (
                        <span className="ml-1 text-[10px] font-semibold text-foreground/80 tabular-nums shrink-0">
                          {it.score.toFixed(1)} <span className="opacity-70">P{it.percentile}</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-center py-1.5 text-[10px] text-muted-foreground bg-background/60">
                  {items.length} {items.length === 1 ? 'company' : 'companies'}
                </div>
              </div>
            );
          })}
        </div>

        {/* {pillarKey === 'composite' && (
          <div className="mt-3 rounded-md border border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900 p-2.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                C Category — Red Highlight Logic
              </span>
              <Badge variant="outline" className="text-[10px] border-rose-300 text-rose-700 dark:text-rose-400">
                {grouped.C.length} {grouped.C.length === 1 ? 'company' : 'companies'}
              </Badge>
            </div>
            <ol className="text-[11px] text-muted-foreground space-y-0.5 list-decimal list-inside">
              <li>
                Compute each company's <span className="font-medium text-foreground">ESG Composite Score</span> =
                0.35·E + 0.25·S + 0.40·G (E-weight redistributed to S &amp; G if no Environment feature).
              </li>
              <li>
                Sort all n={n} companies ascending by composite score (ties broken alphabetically by name).
              </li>
              <li>
                Assign percentile P<sub>i</sub> = max(1, min(99, round(i / n × 99))), where i is the 1-indexed rank.
              </li>
              <li>
                Grade thresholds: <span className="font-medium">AA</span> P≥80 · <span className="font-medium">A</span> 60–79 ·
                <span className="font-medium"> BB</span> 40–59 · <span className="font-medium">B</span> 20–39 ·
                <span className="font-semibold text-rose-700 dark:text-rose-400"> C</span> P&lt;20.
              </li>
              <li>
                Companies falling in the <span className="font-semibold text-rose-700 dark:text-rose-400">bottom ~20th percentile</span> of
                composite score are rendered in the <span className="font-semibold text-rose-700 dark:text-rose-400">red C bucket</span>,
                flagging them as portfolio laggards requiring attention.
              </li>
            </ol>
          </div>
        )} */}

        {footnote && <p className="text-[10px] text-muted-foreground mt-2">{footnote}</p>}
      </CardContent>
    </Card>
  );
}

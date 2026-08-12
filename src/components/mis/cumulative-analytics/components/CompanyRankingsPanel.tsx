import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Trophy, CheckCircle2, RefreshCw, Clock } from 'lucide-react';
import type { CompanyRanking } from './panelTypes';

type BucketKey = 'AA' | 'A' | 'BB' | 'B' | 'C';

const BUCKETS: { key: BucketKey; label: string; min: number; header: string; card: string; row: string }[] = [
  { key: 'AA', label: 'AA', min: 80, header: 'bg-emerald-500 text-white', card: 'border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900', row: 'bg-emerald-50/60 dark:bg-emerald-950/20' },
  { key: 'A',  label: 'A',  min: 60, header: 'bg-blue-500 text-white',    card: 'border-blue-200 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-900',        row: 'bg-blue-50/60 dark:bg-blue-950/20' },
  { key: 'BB', label: 'BB', min: 40, header: 'bg-amber-400 text-white',   card: 'border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900',   row: 'bg-amber-50/60 dark:bg-amber-950/20' },
  { key: 'B',  label: 'B',  min: 20, header: 'bg-orange-500 text-white',  card: 'border-orange-200 bg-orange-50/40 dark:bg-orange-950/20 dark:border-orange-900', row: 'bg-orange-50/60 dark:bg-orange-950/20' },
  { key: 'C',  label: 'C',  min: 0,  header: 'bg-rose-500 text-white',    card: 'border-rose-200 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-900',       row: 'bg-rose-50/60 dark:bg-rose-950/20' },
];

const gradeOf = (v: number): BucketKey => {
  for (const b of BUCKETS) if (v >= b.min) return b.key;
  return 'C';
};

type Metric = 'average' | 'completeness' | 'consistency' | 'timeliness';

const METRIC_META: Record<Metric, { label: string; icon: React.ComponentType<{ className?: string }>; card: string; iconColor: string; getScore: (r: CompanyRanking) => number }> = {
  average:      { label: 'Responsiveness Score', icon: Trophy,        card: 'border-purple-200 bg-purple-50/60 dark:bg-purple-950/20', iconColor: 'text-purple-500',  getScore: r => (r.completionPct + r.consistencyPct + r.timelinessScore) / 3 },
  completeness: { label: 'Completeness',          icon: CheckCircle2,  card: 'border-amber-200 bg-amber-50/60 dark:bg-amber-950/20',    iconColor: 'text-amber-500',   getScore: r => r.completionPct },
  consistency:  { label: 'Consistency',           icon: RefreshCw,     card: 'border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20', iconColor: 'text-emerald-500', getScore: r => r.consistencyPct },
  timeliness:   { label: 'Timeliness',            icon: Clock,         card: 'border-blue-200 bg-blue-50/60 dark:bg-blue-950/20',      iconColor: 'text-blue-500',    getScore: r => r.timelinessScore },
};

const avgNum = (arr: number[]) => (arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);
const r1 = (v: number) => Math.round(v * 10) / 10;

const assignPercentiles = (items: { name: string; score: number }[]) => {
  if (items.length === 0) return [];
  if (items.length === 1) return [{ ...items[0], percentile: 99 }];
  return [...items]
    .sort((a, b) => {
      const diff = a.score - b.score;
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    })
    .map((item, idx) => ({
      ...item,
      percentile: Math.max(1, Math.min(99, Math.round(((idx + 1) / items.length) * 99))),
    }));
};

interface Props {
  rankings: CompanyRanking[];
  metric?: Metric;
  onMetricChange?: (m: Metric) => void;
  showScores?: boolean;
}

export const CompanyRankingsPanel = ({ rankings, metric: metricProp = 'average', onMetricChange }: Props) => {
  const [showScores, setShowScores] = useState(false);
  const [internalMetric, setInternalMetric] = useState<Metric>(metricProp);
  const metric = onMetricChange ? metricProp : internalMetric;
  const selectMetric = (m: Metric) => {
    if (onMetricChange) onMetricChange(m);
    else setInternalMetric(m);
  };
  const n = rankings.length;

  const avgCompleteness = r1(avgNum(rankings.map(r => r.completionPct)));
  const avgConsistency = r1(avgNum(rankings.map(r => r.consistencyPct)));
  const avgTimeliness = r1(avgNum(rankings.map(r => r.timelinessScore)));
  const avgOverall = r1((avgCompleteness + avgConsistency + avgTimeliness) / 3);
  const headerValues: Record<Metric, number> = {
    average: avgOverall,
    completeness: avgCompleteness,
    consistency: avgConsistency,
    timeliness: avgTimeliness,
  };

  // Match Admin Dashboard's breakdown: bucket raw scores by percentile within the filtered cohort.
  const grouped: Record<BucketKey, { name: string; score: number; percentile: number }[]> = { AA: [], A: [], BB: [], B: [], C: [] };
  const rawScores = rankings.map(r => ({ name: r.brand || r.companyName, score: METRIC_META[metric].getScore(r) }));
  assignPercentiles(rawScores).forEach(r => {
    grouped[gradeOf(r.percentile)].push({ name: r.name, score: r.score, percentile: r.percentile });
  });
  for (const k of Object.keys(grouped) as BucketKey[]) {
    grouped[k].sort((a, b) => b.score - a.score);
  }

  const headerCards: Metric[] = ['average', 'completeness', 'consistency', 'timeliness'];

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-500" />
        <h2 className="text-base font-semibold">Responsiveness Score</h2>
        <Badge variant="outline" className="text-[10px]">Completeness · Consistency · Timeliness</Badge>
        <Badge variant="secondary" className="text-[10px] ml-1">n={n}</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {headerCards.map(k => {
          const meta = METRIC_META[k];
          const Icon = meta.icon;
          const value = headerValues[k];
          const active = k === metric;
          return (
            <Card
              key={k}
              role="button"
              tabIndex={0}
              onClick={() => selectMetric(k)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectMetric(k); } }}
              className={`${meta.card} cursor-pointer transition-all hover:shadow-md ${active ? 'ring-2 ring-primary/40' : ''}`}
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{meta.label}</span>
                  <Icon className={`w-4 h-4 ${meta.iconColor}`} />
                </div>
                <div className="text-2xl font-bold tabular-nums">
                  {value.toFixed(1)}
                  <span className="text-xs text-muted-foreground ml-1 font-normal">avg score</span>
                </div>
                <Badge variant="outline" className="mt-1 text-[10px]">n={n}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2 gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{METRIC_META[metric].label} — Grade Breakdown</h3>
              <Badge variant="secondary" className="text-[10px]">n={n}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="cum-rank-show-scores" checked={showScores} onCheckedChange={setShowScores} />
              <Label htmlFor="cum-rank-show-scores" className="text-xs cursor-pointer">Show Scores</Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {BUCKETS.map(b => {
              const items = grouped[b.key];
              return (
                <div key={b.key} className={`rounded-md border ${b.card} overflow-hidden`}>
                  <div className={`text-center py-1.5 font-semibold text-sm ${b.header}`}>{b.label}</div>
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
                        <span className="truncate font-medium">{it.name}</span>
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
        </CardContent>
      </Card>
    </section>
  );
};

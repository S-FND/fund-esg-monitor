import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Trophy, BarChart3, Leaf, UsersRound, Shield, CheckCircle2, RefreshCw, Clock, ChevronDown, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolioRankings } from "@/hooks/usePortfolioRankings";
import { usePortfolioRankingsV1 } from "@/hooks/usePortfolioRankingsV1";
import { useAnalyticsDashboardData, InsightMetrics, AnalyticsFilters, CompanyRawMetrics } from "@/hooks/useAnalyticsDashboardData";

// ──── Types ────

interface TrendsTabProps {
  /** Base period to compare FROM — e.g. { period: 'quarterly', quarter: 'Q1', year: 2025 } or { period: 'annual', year: 2025 } */
  periodAFilters: AnalyticsFilters;
  /** Period to compare TO — e.g. { period: 'quarterly', quarter: 'Q1', year: 2026 } */
  periodBFilters: AnalyticsFilters;
  newInsight?: boolean;
}

type Trend = 'up' | 'down' | 'stable' | 'new';

interface BreakdownCompany {
  brand: string;
  score: number;
  previousScore?: number; // undefined when there's no prior-period data (trend === 'new')
  trend: Trend;
}

const TREND_THRESHOLD = 0.5;

function computeTrend(current: number | undefined, previous: number | undefined): Trend {
  if (current === undefined || previous === undefined || isNaN(current) || isNaN(previous)) return 'new';
  const delta = current - previous;
  if (Math.abs(delta) < TREND_THRESHOLD) return 'stable';
  return delta > 0 ? 'up' : 'down';
}

function periodLabel(filters: AnalyticsFilters): string {
  return filters.period === 'annual' ? `AY ${filters.year}` : `${filters.quarter || 'Q1'} ${filters.year}`;
}

// ──── Trend icon ────

const TrendIcon = ({ trend }: { trend: Trend }) => {
  if (trend === 'new') return null;
  if (trend === 'up') return <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" aria-label="Improved" />;
  if (trend === 'down') return <TrendingDown className="w-3 h-3 text-red-600 shrink-0" aria-label="Declined" />;
  return <Minus className="w-3 h-3 text-muted-foreground shrink-0" aria-label="No significant change" />;
};

// ──── Grade categories ────

const CATEGORIES = [
  { key: 'AA', label: 'AA', range: '80–100', color: 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700', headerBg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' },
  { key: 'A', label: 'A', range: '60–79', color: 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700', headerBg: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300' },
  { key: 'BB', label: 'BB', range: '40–59', color: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700', headerBg: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300' },
  { key: 'B', label: 'B', range: '20–39', color: 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700', headerBg: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-300' },
  { key: 'C', label: 'C', range: '0–19', color: 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-700', headerBg: 'bg-red-500', text: 'text-red-700 dark:text-red-300' },
];

const assignPercentiles = <T extends { brand: string; score: number }>(companies: T[]): (T & { percentile: number })[] => {
  if (companies.length === 0) return [];
  if (companies.length === 1) return [{ ...companies[0], percentile: 99 }];
  const sorted = [...companies].sort((a, b) => {
    const diff = a.score - b.score;
    return diff !== 0 ? diff : a.brand.localeCompare(b.brand);
  });
  const n = sorted.length;
  return sorted.map((c, idx) => ({ ...c, percentile: Math.max(1, Math.min(99, Math.round(((idx + 1) / n) * 99))) }));
};

const getCategoryForPercentile = (percentile: number): string => {
  if (percentile >= 80) return 'AA';
  if (percentile >= 60) return 'A';
  if (percentile >= 40) return 'BB';
  if (percentile >= 20) return 'B';
  return 'C';
};

// ──── Inline breakdown grid ────

const TrendBreakdownGrid = ({ title, companies, onClose }: { title: string; companies: BreakdownCompany[]; onClose: () => void }) => {
  const [showScores, setShowScores] = useState(false);
  const withPercentiles = assignPercentiles(companies);
  const categorized = CATEGORIES.map(cat => ({
    ...cat,
    companies: withPercentiles.filter(c => getCategoryForPercentile(c.percentile) === cat.key).sort((a, b) => b.percentile - a.percentile),
  }));

  return (
    <Card className="border-primary/20 shadow-md animate-in slide-in-from-top-2 duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">{title} — Grade Breakdown</CardTitle>
            <Badge variant="secondary" className="text-[10px]">n={companies.length}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch id={`show-scores-${title}`} checked={showScores} onCheckedChange={setShowScores} />
              <Label htmlFor={`show-scores-${title}`} className="text-xs cursor-pointer">Show Scores</Label>
            </div>
            <button onClick={onClose} className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground">✕</button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2">
          {categorized.map(cat => (
            <div key={cat.key} className={`rounded-lg border ${cat.color} overflow-hidden`}>
              <div className={`${cat.headerBg} px-3 py-2 text-white text-center`}>
                <span className="text-sm font-bold">{cat.label}</span>
                {showScores && <div className="text-[10px] opacity-90">{cat.range}</div>}
              </div>
              <div className="p-2 space-y-1 min-h-[60px]">
                {cat.companies.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-2 italic">No companies</p>
                ) : (
                  cat.companies.map(c => (
                    <div key={c.brand} className="flex items-center justify-between px-2 py-1 rounded text-xs bg-background/60 hover:bg-background transition-colors">
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-medium flex items-center gap-1">
                          {c.brand}
                          <TrendIcon trend={c.trend} />
                        </span>
                        {/* {showScores && c.trend !== 'new' && c.previousScore !== undefined && (
                          <span className={`text-[10px] leading-tight ${
                            c.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400'
                            : c.trend === 'down' ? 'text-red-600 dark:text-red-400'
                            : 'text-muted-foreground'
                          }`}>
                            {c.previousScore.toFixed(1)} → {c.score.toFixed(1)}
                          </span>
                        )} */}
                      </div>
                      {showScores && (
                        <span className={`ml-1 text-[10px] font-semibold ${cat.text} shrink-0`}>
                          {c.score.toFixed(1)} <span className="opacity-70">P{c.percentile}</span>
                        </span>
                      )}
                    </div>
                  ))
                )}
                {cat.companies.length > 0 && (
                  <div className="text-center pt-1"><Badge variant="outline" className="text-[9px]">{cat.companies.length} companies</Badge></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ──── Main component ────

export const TrendsTab = ({ periodAFilters, periodBFilters, newInsight = false }: TrendsTabProps) => {
  const [expandedScore, setExpandedScore] = useState<string | null>('esgCompositeScore');
  const [expandedRanking, setExpandedRanking] = useState<string | null>('overall');

  // ── Period A rankings ──
  const rankingsAV1 = usePortfolioRankings(periodAFilters.year, periodAFilters.quarter || "FY", periodAFilters.cumulative);
  const rankingsAV2 = usePortfolioRankingsV1(periodAFilters.year, periodAFilters.quarter || "FY", periodAFilters.cumulative);
  const { rankings: allRankingsA, isLoading: rankingsALoading } = newInsight ? rankingsAV2 : rankingsAV1;

  // ── Period B rankings ──
  const rankingsBV1 = usePortfolioRankings(periodBFilters.year, periodBFilters.quarter || "FY", periodBFilters.cumulative);
  const rankingsBV2 = usePortfolioRankingsV1(periodBFilters.year, periodBFilters.quarter || "FY", periodBFilters.cumulative);
  const { rankings: allRankingsB, isLoading: rankingsBLoading } = newInsight ? rankingsBV2 : rankingsBV1;

  const rankingsAByBrand = useMemo(() => {
    const map = new Map<string, typeof allRankingsA[0]>();
    allRankingsA.forEach(r => map.set(r.brand, r));
    return map;
  }, [allRankingsA]);

  // ── Period A & B full analytics data (for ESG insights + companyRawData) ──
  const { data: analyticsA, isLoading: analyticsALoading } = useAnalyticsDashboardData(periodAFilters);
  const { data: analyticsB, isLoading: analyticsBLoading } = useAnalyticsDashboardData(periodBFilters);

  const companyRawDataA = analyticsA?.companyRawData || [];
  const companyRawDataB = analyticsB?.companyRawData || [];

  const companyRawDataAByBrand = useMemo(() => {
    const map = new Map<string, CompanyRawMetrics>();
    companyRawDataA.forEach(c => map.set(c.brand, c));
    return map;
  }, [companyRawDataA]);

  // ── Company pools — comparisons are driven by Period B's (target) company set ──
  const submittingCompaniesB = companyRawDataB.filter(c => Object.keys(c.kpis).length > 0);
  const submittingCountB = submittingCompaniesB.length;
  const envEligibleCompaniesB = submittingCompaniesB.filter(c => c.hasEnvironmentFeature);

  const submittingCompaniesA = companyRawDataA.filter(c => Object.keys(c.kpis).length > 0);
  const envEligibleCompaniesA = submittingCompaniesA.filter(c => c.hasEnvironmentFeature);

  // ── Per-company composite score averages ──
  const computeAvg = (pool: CompanyRawMetrics[], key: keyof InsightMetrics): number | undefined => {
    if (pool.length === 0) return undefined;
    const vals = pool.map(c => c.insights[key] as number).filter(v => v !== undefined && v !== null && !isNaN(v));
    return vals.length > 0 ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : undefined;
  };

  const scoresB = {
    esgCompositeScore: computeAvg(submittingCompaniesB, 'esgCompositeScore') ?? 0,
    circularEconomyIndex: computeAvg(envEligibleCompaniesB, 'circularEconomyIndex') ?? 0,
    socialScore: computeAvg(submittingCompaniesB, 'socialScore') ?? 0,
    governanceScore: computeAvg(submittingCompaniesB, 'governanceScore') ?? 0,
  };
  const scoresA = {
    esgCompositeScore: computeAvg(submittingCompaniesA, 'esgCompositeScore'),
    circularEconomyIndex: computeAvg(envEligibleCompaniesA, 'circularEconomyIndex'),
    socialScore: computeAvg(submittingCompaniesA, 'socialScore'),
    governanceScore: computeAvg(submittingCompaniesA, 'governanceScore'),
  };

  // ── Rankings with computed averages (Period B is the displayed set; A is the comparison baseline) ──
  const rankingsWithAvg = allRankingsB.map(r => {
    const averagePercentile = Math.round((r.completenessPercentile + r.consistencyPercentile + r.timelinessPercentile) / 3);
    const averageScore = Math.round(((r.completionPct + r.consistencyPct + r.timelinessScore) / 3) * 10) / 10;
    const a = rankingsAByBrand.get(r.brand);
    const aAverageScore = a ? Math.round(((a.completionPct + a.consistencyPct + a.timelinessScore) / 3) * 10) / 10 : undefined;
    return { ...r, averagePercentile, averageScore, a, aAverageScore };
  });

  const avgCompletenessB = rankingsWithAvg.length > 0 ? Math.round(rankingsWithAvg.reduce((s, r) => s + r.completionPct, 0) / rankingsWithAvg.length * 10) / 10 : 0;
  const avgConsistencyB = rankingsWithAvg.length > 0 ? Math.round(rankingsWithAvg.reduce((s, r) => s + r.consistencyPct, 0) / rankingsWithAvg.length * 10) / 10 : 0;
  const avgTimelinessB = rankingsWithAvg.length > 0 ? Math.round(rankingsWithAvg.reduce((s, r) => s + r.timelinessScore, 0) / rankingsWithAvg.length * 10) / 10 : 0;
  const avgOverallB = Math.round((avgCompletenessB + avgConsistencyB + avgTimelinessB) / 3 * 10) / 10;

  const avgCompletenessA = allRankingsA.length > 0 ? Math.round(allRankingsA.reduce((s, r) => s + r.completionPct, 0) / allRankingsA.length * 10) / 10 : undefined;
  const avgConsistencyA = allRankingsA.length > 0 ? Math.round(allRankingsA.reduce((s, r) => s + r.consistencyPct, 0) / allRankingsA.length * 10) / 10 : undefined;
  const avgTimelinessA = allRankingsA.length > 0 ? Math.round(allRankingsA.reduce((s, r) => s + r.timelinessScore, 0) / allRankingsA.length * 10) / 10 : undefined;
  const avgOverallA = (avgCompletenessA !== undefined && avgConsistencyA !== undefined && avgTimelinessA !== undefined)
    ? Math.round((avgCompletenessA + avgConsistencyA + avgTimelinessA) / 3 * 10) / 10 : undefined;

  const rankingCards = [
    { key: 'overall', label: 'Overall Ranking Score', value: avgOverallB, prevValue: avgOverallA, scoreKey: 'averageScore' as const, icon: <Trophy className="w-4 h-4 text-purple-600" />, color: 'border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20', large: true },
    { key: 'completeness', label: 'Completeness', value: avgCompletenessB, prevValue: avgCompletenessA, scoreKey: 'completionPct' as const, icon: <CheckCircle2 className="w-4 h-4 text-amber-600" />, color: 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10', large: false },
    { key: 'consistency', label: 'Consistency', value: avgConsistencyB, prevValue: avgConsistencyA, scoreKey: 'consistencyPct' as const, icon: <RefreshCw className="w-4 h-4 text-emerald-600" />, color: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10', large: false },
    { key: 'timeliness', label: 'Timeliness', value: avgTimelinessB, prevValue: avgTimelinessA, scoreKey: 'timelinessScore' as const, icon: <Clock className="w-4 h-4 text-blue-600" />, color: 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10', large: false },
  ];

  const esgCards = [
    { key: 'esgCompositeScore', label: 'ESG Performance Composite Score', value: scoresB.esgCompositeScore, prevValue: scoresA.esgCompositeScore, insightKey: 'esgCompositeScore' as const, icon: <BarChart3 className="w-4 h-4 text-emerald-600" />, color: 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20', large: true, count: submittingCountB, pool: submittingCompaniesB },
    { key: 'circularEconomyIndex', label: 'Environment Score', value: scoresB.circularEconomyIndex, prevValue: scoresA.circularEconomyIndex, insightKey: 'circularEconomyIndex' as const, icon: <Leaf className="w-4 h-4 text-amber-600" />, color: 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10', large: false, count: envEligibleCompaniesB.length, pool: envEligibleCompaniesB },
    { key: 'socialScore', label: 'Social Score', value: scoresB.socialScore, prevValue: scoresA.socialScore, insightKey: 'socialScore' as const, icon: <UsersRound className="w-4 h-4 text-blue-600" />, color: 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10', large: false, count: submittingCountB, pool: submittingCompaniesB },
    { key: 'governanceScore', label: 'Governance Score', value: scoresB.governanceScore, prevValue: scoresA.governanceScore, insightKey: 'governanceScore' as const, icon: <Shield className="w-4 h-4 text-purple-600" />, color: 'border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/10', large: false, count: submittingCountB, pool: submittingCompaniesB },
  ];

  const isLoading = rankingsALoading || rankingsBLoading || analyticsALoading || analyticsBLoading;

  return (
    <div className="space-y-6">

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Comparing</span>
        <Badge variant="outline">{periodLabel(periodAFilters)}</Badge>
        <span>→</span>
        <Badge variant="outline">{periodLabel(periodBFilters)}</Badge>
      </div>

      {/* ─── Responsiveness Score ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-semibold">Responsiveness Score — Trends</h2>
          <Badge variant="outline" className="text-xs">Completeness · Consistency · Timeliness</Badge>
          <Badge variant="secondary" className="text-xs"><Users className="w-3 h-3 mr-1" />n={rankingsWithAvg.length}</Badge>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-4 gap-3 mb-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
        ) : rankingsWithAvg.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No company data available for rankings.</CardContent></Card>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-3 mb-3">
              {rankingCards.map(card => {
                const isExpanded = expandedRanking === card.key;
                const trend = computeTrend(card.value, card.prevValue);
                return (
                  <Card key={card.key} className={`cursor-pointer transition-all hover:shadow-md ${card.color} ${isExpanded ? 'ring-2 ring-primary/40' : ''}`} onClick={() => setExpandedRanking(isExpanded ? null : card.key)}>
                    <CardContent className={card.large ? 'pt-4 pb-3' : 'pt-3 pb-2'}>
                      <div className="flex items-center justify-between mb-1">
                        <p className={`${card.large ? 'text-xs' : 'text-[11px]'} font-medium text-muted-foreground`}>{card.label}</p>
                        <div className="flex items-center gap-1.5">{card.icon}<ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></div>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className={`${card.large ? 'text-3xl' : 'text-2xl'} font-bold`}>{card.value.toFixed(1)}</span>
                        <TrendIcon trend={trend} />
                        <span className="text-xs text-muted-foreground mb-1">avg score</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] mt-1">n={rankingsWithAvg.length}</Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {expandedRanking && (() => {
              const config = rankingCards.find(c => c.key === expandedRanking);
              if (!config) return null;
              const companiesForBreakdown: BreakdownCompany[] = rankingsWithAvg.map(r => {
                const current = (r as any)[config.scoreKey] as number;
                const prevValue = config.scoreKey === 'averageScore' ? r.aAverageScore : (r.a as any)?.[config.scoreKey];
                return {
                  brand: r.brand,
                  score: current,
                  previousScore: prevValue,
                  trend: computeTrend(current, prevValue),
                };
              });
              return <div className="mb-3"><TrendBreakdownGrid title={config.label} companies={companiesForBreakdown} onClose={() => setExpandedRanking(null)} /></div>;
            })()}
          </>
        )}
      </section>

      {/* ─── ESG Composite Scores ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold">Cross-Module: ESG Performance — Trends</h2>
          <Badge variant="outline" className="text-xs">Auto-calculated</Badge>
          <Badge variant="secondary" className="text-xs"><Users className="w-3 h-3 mr-1" />n={submittingCountB}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {esgCards.map(card => {
            const isExpanded = expandedScore === card.key;
            const trend = computeTrend(card.value, card.prevValue);
            return (
              <Card key={card.key} className={`cursor-pointer transition-all hover:shadow-md ${card.color} ${isExpanded ? 'ring-2 ring-primary/40' : ''}`} onClick={() => setExpandedScore(isExpanded ? null : card.key)}>
                <CardContent className={card.large ? 'pt-4 pb-3' : 'pt-3 pb-2'}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={`${card.large ? 'text-xs' : 'text-[11px]'} font-medium text-muted-foreground`}>{card.label}</p>
                    <div className="flex items-center gap-1.5">{card.icon}<ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></div>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className={`${card.large ? 'text-3xl' : 'text-2xl'} font-bold`}>{(card.value ?? 0).toFixed(1)}</span>
                    <TrendIcon trend={trend} />
                    <span className="text-xs text-muted-foreground mb-1">/ 100</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] mt-1.5">n={card.count}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {expandedScore && (() => {
          const config = esgCards.find(c => c.key === expandedScore);
          if (!config) return null;
          const companiesForBreakdown: BreakdownCompany[] = config.pool
            .filter(c => c.insights[config.insightKey] !== undefined && !isNaN(c.insights[config.insightKey] as number))
            .map(c => {
              const current = c.insights[config.insightKey] as number;
              const prevCompany = companyRawDataAByBrand.get(c.brand);
              const prevValue = prevCompany?.insights[config.insightKey] as number | undefined;
              return {
                brand: c.brand,
                score: current,
                previousScore: prevValue,
                trend: computeTrend(current, prevValue),
              };
            });
          return <div className="mt-3"><TrendBreakdownGrid title={config.label} companies={companiesForBreakdown} onClose={() => setExpandedScore(null)} /></div>;
        })()}
      </section>

    </div>
  );
};
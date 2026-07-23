// // TrendsComparisonPage.tsx

// import { useState } from "react";
// import { ArrowRight } from "lucide-react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";
// import { AnalyticsFilters } from "@/hooks/useAnalyticsDashboardData";
// import { TrendsTab } from "./TrendsTab"; // adjust path to wherever you saved it

// // ──── Config — adjust to match your app's actual available years/quarters ────
// const AVAILABLE_YEARS = [2024, 2025, 2026];
// const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

// interface PeriodSelection {
//   periodType: 'quarterly' | 'annual';
//   quarter: string;
//   year: number;
// }

// const defaultPeriodA: PeriodSelection = { periodType: 'quarterly', quarter: 'Q1', year: 2025 };
// const defaultPeriodB: PeriodSelection = { periodType: 'quarterly', quarter: 'Q1', year: 2026 };

// function toFilters(sel: PeriodSelection): AnalyticsFilters {
//   return {
//     period: sel.periodType,
//     year: sel.year,
//     quarter: sel.periodType === 'quarterly' ? sel.quarter : undefined,
//     cumulative: false,
//   };
// }

// // ──── Single period selector (reused for both A and B) ────

// const PeriodSelector = ({
//   label,
//   value,
//   onChange,
// }: {
//   label: string;
//   value: PeriodSelection;
//   onChange: (next: PeriodSelection) => void;
// }) => {
//   return (
//     <div className="flex flex-col gap-2 min-w-[220px]">
//       <Label className="text-xs text-muted-foreground">{label}</Label>
//       <div className="flex gap-2">
//         <Select
//           value={value.periodType}
//           onValueChange={(v: 'quarterly' | 'annual') => onChange({ ...value, periodType: v })}
//         >
//           <SelectTrigger className="w-[110px]">
//             <SelectValue />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="quarterly">Quarterly</SelectItem>
//             <SelectItem value="annual">Annual</SelectItem>
//           </SelectContent>
//         </Select>

//         {value.periodType === 'quarterly' && (
//           <Select
//             value={value.quarter}
//             onValueChange={(v) => onChange({ ...value, quarter: v })}
//           >
//             <SelectTrigger className="w-[80px]">
//               <SelectValue />
//             </SelectTrigger>
//             <SelectContent>
//               {QUARTERS.map(q => (
//                 <SelectItem key={q} value={q}>{q}</SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         )}

//         <Select
//           value={String(value.year)}
//           onValueChange={(v) => onChange({ ...value, year: Number(v) })}
//         >
//           <SelectTrigger className="w-[90px]">
//             <SelectValue />
//           </SelectTrigger>
//           <SelectContent>
//             {AVAILABLE_YEARS.map(y => (
//               <SelectItem key={y} value={String(y)}>{y}</SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       </div>
//     </div>
//   );
// };

// // ──── Main page: selectors + comparison result ────

// interface TrendsComparisonPageProps {
//   newInsight?: boolean;
// }

// export const TrendsComparisonPage = ({ newInsight = false }: TrendsComparisonPageProps) => {
//   const [periodA, setPeriodA] = useState<PeriodSelection>(defaultPeriodA);
//   const [periodB, setPeriodB] = useState<PeriodSelection>(defaultPeriodB);

//   // "Applied" state — comparison only recomputes when the user clicks Compare,
//   // not on every dropdown change (avoids re-fetching on every intermediate selection).
//   const [appliedA, setAppliedA] = useState<PeriodSelection>(defaultPeriodA);
//   const [appliedB, setAppliedB] = useState<PeriodSelection>(defaultPeriodB);

//   const handleCompare = () => {
//     setAppliedA(periodA);
//     setAppliedB(periodB);
//   };

//   const isSamePeriod =
//     periodA.periodType === periodB.periodType &&
//     periodA.year === periodB.year &&
//     (periodA.periodType === 'annual' || periodA.quarter === periodB.quarter);

//   return (
//     <div className="space-y-6">
//       <Card>
//         <CardContent className="pt-4 pb-4">
//           <div className="flex items-end gap-4 flex-wrap">
//             <PeriodSelector label="Compare from" value={periodA} onChange={setPeriodA} />
//             <ArrowRight className="w-4 h-4 text-muted-foreground mb-2.5 shrink-0" />
//             <PeriodSelector label="Compare to" value={periodB} onChange={setPeriodB} />
//             <Button onClick={handleCompare} disabled={isSamePeriod} className="mb-0">
//               Compare
//             </Button>
//           </div>
//           {isSamePeriod && (
//             <p className="text-xs text-muted-foreground mt-2">
//               Select two different periods to compare.
//             </p>
//           )}
//         </CardContent>
//       </Card>

//       <TrendsTab
//         periodAFilters={toFilters(appliedA)}
//         periodBFilters={toFilters(appliedB)}
//         newInsight={newInsight}
//       />
//     </div>
//   );
// };

// TrendsComparisonPage.tsx

import { useMemo, useState } from "react";
import { ArrowRight, TrendingUp, TrendingDown, Minus, Trophy, BarChart3, Leaf, UsersRound, Shield, CheckCircle2, RefreshCw, Clock, ChevronDown, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AnalyticsFilters, InsightMetrics, CompanyRawMetrics, useAnalyticsDashboardData } from "@/hooks/useAnalyticsDashboardData";
import { usePortfolioRankings } from "@/hooks/usePortfolioRankings";
import { usePortfolioRankingsV1 } from "@/hooks/usePortfolioRankingsV1";
import { Fund, Industry, QCategory, RevenueStage } from "@/types/esg";

// ──── Config — adjust to match your app's actual available years/quarters ────
const AVAILABLE_YEARS = [2024, 2025, 2026];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

interface PeriodSelection {
  periodType: 'quarterly' | 'annual';
  quarter: string;
  year: number;
  industry?: Industry;
  fund?: Fund;
  revenueStage?: RevenueStage;
  companyId?: string;
  qCategory?: QCategory;
  firesidePOC?: string;
}

const defaultPeriodA: PeriodSelection = { periodType: 'quarterly', quarter: 'Q1', year: 2025 };
const defaultPeriodB: PeriodSelection = { periodType: 'quarterly', quarter: 'Q1', year: 2026 };

function toFilters(sel: PeriodSelection): AnalyticsFilters {
  return {
    period: sel.periodType,
    year: sel.year,
    quarter: sel.periodType === 'quarterly' ? sel.quarter : undefined,
    cumulative: false,
    industry: sel.industry,
    fund: sel.fund,
    revenueStage: sel.revenueStage,
    companyId: sel.companyId,
    qCategory: sel.qCategory,
    firesidePOC: sel.firesidePOC,

  };
}

function periodLabel(filters: AnalyticsFilters): string {
  return filters.period === 'annual' ? `AY ${filters.year}` : `${filters.quarter || 'Q1'} ${filters.year}`;
}

// ──── Grade / trend types & helpers ────

type Trend = 'up' | 'down' | 'stable' | 'new';

interface BreakdownCompany {
  brand: string;
  score: number;
  previousScore?: number; // undefined when there's no prior-period data
}

const TrendIcon = ({ trend }: { trend: Trend }) => {
  if (trend === 'new') return null;
  if (trend === 'up') return <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" aria-label="Upgraded" />;
  if (trend === 'down') return <TrendingDown className="w-3 h-3 text-red-600 shrink-0" aria-label="Downgraded" />;
  return <Minus className="w-3 h-3 text-muted-foreground shrink-0" aria-label="No grade change" />;
};

const CATEGORIES = [
  { key: 'AA', label: 'AA', range: '80–100', color: 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700', headerBg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' },
  { key: 'A', label: 'A', range: '60–79', color: 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700', headerBg: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300' },
  { key: 'BB', label: 'BB', range: '40–59', color: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700', headerBg: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300' },
  { key: 'B', label: 'B', range: '20–39', color: 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700', headerBg: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-300' },
  { key: 'C', label: 'C', range: '0–19', color: 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-700', headerBg: 'bg-red-500', text: 'text-red-700 dark:text-red-300' },
];

// Rank order for grade bands — higher number = better grade. Used to determine upgrade vs downgrade.
const CATEGORY_RANK: Record<string, number> = { AA: 5, A: 4, BB: 3, B: 2, C: 1 };

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

// ──── Inline breakdown grid (grade-band trend only) ────

const TrendBreakdownGrid = ({ title, companies, onClose }: { title: string; companies: BreakdownCompany[]; onClose: () => void }) => {
  const [showScores, setShowScores] = useState(false);

  // Current-period grades (ranked among this pool)
  const withPercentiles = assignPercentiles(companies);

  // Previous-period grades — rank the SAME pool on previousScore to get each company's prior grade + percentile
  const prevPool = companies
    .filter(c => c.previousScore !== undefined && !isNaN(c.previousScore as number))
    .map(c => ({ brand: c.brand, score: c.previousScore as number }));
  const prevWithPercentiles = assignPercentiles(prevPool);
  const prevDataByBrand = new Map(
    prevWithPercentiles.map(c => [c.brand, { category: getCategoryForPercentile(c.percentile), percentile: c.percentile }])
  );

  // Trend is based ONLY on grade-band movement (AA/A/BB/B/C), not raw score delta.
  // Same band => stable, regardless of how much the underlying score moved within that band.
  const computeCategoryTrend = (currentCategory: string, brand: string): Trend => {
    const prev = prevDataByBrand.get(brand);
    if (!prev) return 'new';
    const curRank = CATEGORY_RANK[currentCategory];
    const prevRank = CATEGORY_RANK[prev.category];
    if (curRank === prevRank) return 'stable';
    return curRank > prevRank ? 'up' : 'down';
  };

  const categorized = CATEGORIES.map(cat => ({
    ...cat,
    companies: withPercentiles
      .filter(c => getCategoryForPercentile(c.percentile) === cat.key)
      .map(c => {
        const prev = prevDataByBrand.get(c.brand);
        return {
          ...c,
          trend: computeCategoryTrend(cat.key, c.brand),
          prevCategory: prev?.category,
          prevPercentile: prev?.percentile,
        };
      })
      .sort((a, b) => b.percentile - a.percentile),
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
                        {showScores && c.previousScore !== undefined && (
                          <span className={`text-[10px] leading-tight ${c.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400'
                            : c.trend === 'down' ? 'text-red-600 dark:text-red-400'
                              : 'text-muted-foreground'
                            }`}>
                            {c.previousScore.toFixed(1)} → {c.score.toFixed(1)}
                            {c.prevPercentile !== undefined && (
                              <> &nbsp;(P{c.prevPercentile} → P{c.percentile})</>
                            )}
                          </span>
                        )}
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

// ──── Single period selector (reused for both A and B) ────

const PeriodSelector = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: PeriodSelection;
  onChange: (next: PeriodSelection) => void;
}) => {
  return (
    <div className="flex flex-col gap-2 min-w-[220px]">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        {/* <Select
          value={value.periodType}
          onValueChange={(v: 'quarterly' | 'annual') => onChange({ ...value, periodType: v })}
        >
          <SelectTrigger className="w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="annual">Annual</SelectItem>
          </SelectContent>
        </Select> */}

        {value.periodType === 'quarterly' && (
          <Select
            value={value.quarter}
            onValueChange={(v) => onChange({ ...value, quarter: v })}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUARTERS.map(q => (
                <SelectItem key={q} value={q}>{q}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={String(value.year)}
          onValueChange={(v) => onChange({ ...value, year: Number(v) })}
        >
          <SelectTrigger className="w-[90px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_YEARS.map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

// ──── Main page: selectors + comparison result ────

interface TrendsComparisonPageProps {
  filters?: AnalyticsFilters;
  newInsight?: boolean;
  showTrends?: boolean;
  setShowTrends?: (value: boolean) => void;
}

export const TrendsComparisonPage = ({ filters, newInsight = false,showTrends,setShowTrends }: TrendsComparisonPageProps) => {
  const [periodA, setPeriodA] = useState<PeriodSelection>({ ...filters, ...defaultPeriodA });
  const [periodB, setPeriodB] = useState<PeriodSelection>({ ...filters, ...defaultPeriodB });
  console.log('TrendsComparisonPage called with filters:', filters, 'periodA:', periodA, 'periodB:', periodB);
  // "Applied" state — comparison only recomputes when the user clicks Compare,
  // not on every dropdown change (avoids re-fetching on every intermediate selection).
  const [appliedA, setAppliedA] = useState<PeriodSelection>({ ...filters, ...defaultPeriodA });
  const [appliedB, setAppliedB] = useState<PeriodSelection>({ ...filters, ...defaultPeriodB });

  const [expandedScore, setExpandedScore] = useState<string | null>('esgCompositeScore');
  const [expandedRanking, setExpandedRanking] = useState<string | null>('overall');

  const handleCompare = () => {
    setAppliedA(periodA);
    setAppliedB(periodB);
  };

  const isSamePeriod =
    periodA.periodType === periodB.periodType &&
    periodA.year === periodB.year &&
    (periodA.periodType === 'annual' || periodA.quarter === periodB.quarter);

  const periodAFilters = toFilters(appliedA);
  const periodBFilters = toFilters(appliedB);

  // ── Period A rankings ──
  const rankingsAV1 = usePortfolioRankings(periodAFilters.year, periodAFilters.quarter || "FY", periodAFilters.cumulative, null, filters);
  const rankingsAV2 = usePortfolioRankingsV1(periodAFilters.year, periodAFilters.quarter || "FY", periodAFilters.cumulative, filters);
  const { rankings: allRankingsA, isLoading: rankingsALoading } = newInsight ? rankingsAV2 : rankingsAV1;

  // ── Period B rankings ──
  const rankingsBV1 = usePortfolioRankings(periodBFilters.year, periodBFilters.quarter || "FY", periodBFilters.cumulative, null, filters);
  const rankingsBV2 = usePortfolioRankingsV1(periodBFilters.year, periodBFilters.quarter || "FY", periodBFilters.cumulative, filters);
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

  console.log("Rankings A:", allRankingsA);
  console.log("Rankings B:", allRankingsB);
  console.log("Company Raw Data A:", companyRawDataA);
  console.log("Company Raw Data B:", companyRawDataB);

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
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-end gap-4 flex-wrap">
            <PeriodSelector label="Compare from" value={periodA} onChange={setPeriodA} />
            <ArrowRight className="w-4 h-4 text-muted-foreground mb-2.5 shrink-0" />
            <PeriodSelector label="Compare to" value={periodB} onChange={setPeriodB} />
            <Button onClick={handleCompare} disabled={isSamePeriod} className="mb-0">
              Compare
            </Button>
          </div>
          {isSamePeriod && (
            <p className="text-xs text-muted-foreground mt-2">
              Select two different periods to compare.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Comparing</span>
        <Badge variant="outline">{periodLabel(periodAFilters)}</Badge>
        <span>→</span>
        <Badge variant="outline">{periodLabel(periodBFilters)}</Badge>
      </div>

      {/* ─── Responsiveness Score ─────────────────────────────────────────── */}
      <section>
        {/* <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-semibold">Responsiveness Score — Trends</h2>
          <Badge variant="outline" className="text-xs">Completeness · Consistency · Timeliness</Badge>
          <Badge variant="secondary" className="text-xs"><Users className="w-3 h-3 mr-1" />n={rankingsWithAvg.length}</Badge>
        </div> */}

        <div className="flex items-center justify-between mb-3">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() =>{} }
          >
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-semibold group-hover:underline">
              Responsiveness Score — Trends
            </h2>

            <Badge variant="outline" className="text-xs">
              Completeness · Consistency · Timeliness
            </Badge>

            <Badge variant="secondary" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              n={rankingsWithAvg.length}
            </Badge>
          </div>

          {/* Toggle */}
          <div className="flex items-center gap-2">
            <span
              className={`text-sm ${!showTrends ? "font-semibold text-foreground" : "text-muted-foreground"
                }`}
            >
              Insights
            </span>

            <Switch
              checked={showTrends}
              onCheckedChange={setShowTrends}
            />

            <span
              className={`text-sm ${showTrends ? "font-semibold text-foreground" : "text-muted-foreground"
                }`}
            >
              Trends
            </span>
          </div>
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
                return (
                  <Card key={card.key} className={`cursor-pointer transition-all hover:shadow-md ${card.color} ${isExpanded ? 'ring-2 ring-primary/40' : ''}`} onClick={() => setExpandedRanking(isExpanded ? null : card.key)}>
                    <CardContent className={card.large ? 'pt-4 pb-3' : 'pt-3 pb-2'}>
                      <div className="flex items-center justify-between mb-1">
                        <p className={`${card.large ? 'text-xs' : 'text-[11px]'} font-medium text-muted-foreground`}>{card.label}</p>
                        <div className="flex items-center gap-1.5">{card.icon}<ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></div>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className={`${card.large ? 'text-3xl' : 'text-2xl'} font-bold`}>{card.value.toFixed(1)}</span>
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
            return (
              <Card key={card.key} className={`cursor-pointer transition-all hover:shadow-md ${card.color} ${isExpanded ? 'ring-2 ring-primary/40' : ''}`} onClick={() => setExpandedScore(isExpanded ? null : card.key)}>
                <CardContent className={card.large ? 'pt-4 pb-3' : 'pt-3 pb-2'}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={`${card.large ? 'text-xs' : 'text-[11px]'} font-medium text-muted-foreground`}>{card.label}</p>
                    <div className="flex items-center gap-1.5">{card.icon}<ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></div>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className={`${card.large ? 'text-3xl' : 'text-2xl'} font-bold`}>{(card.value ?? 0).toFixed(1)}</span>
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
              };
            });
          return <div className="mt-3"><TrendBreakdownGrid title={config.label} companies={companiesForBreakdown} onClose={() => setExpandedScore(null)} /></div>;
        })()}
      </section>
    </div>
  );
};
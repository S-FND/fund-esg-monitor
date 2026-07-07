import { useState, useMemo } from 'react';
import { RATIO_COMPONENT_COLUMNS } from '@/lib/ratioComponentColumns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InsightMetrics, TimeSeriesPoint, CompanyRawMetrics } from '@/hooks/useAnalyticsDashboardData';
import { usePortfolioRankings } from '@/hooks/usePortfolioRankings';
import { ESGCategoryBreakdown } from './ESGCategoryBreakdown';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  BarChart3, Users, CheckCircle2, RefreshCw, Clock, Trophy,
  Leaf, UsersRound, Shield, ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import CompanyDashboard from '../mis/CompanyDashboard';
import { mockCompanies } from '@/data/mockData';
import { usePortfolioRankingsV1 } from '@/hooks/usePortfolioRankingsV1';
// ─── Types ───────────────────────────────────────────────────────────────────

interface InsightTabProps {
  insights: InsightMetrics;
  timeSeries: TimeSeriesPoint[];
  companyRawData: CompanyRawMetrics[];
  companyCount: number;
  filters: any;
  newInsight:Boolean
}

// ─── Constants ───────────────────────────────────────────────────────────────

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getOrdinalSuffix = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const PercentileBadge = ({ value, type }: { value: number; type: 'completeness' | 'consistency' | 'timeliness' }) => {
  const colorMap = {
    completeness: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-300', bar: 'bg-amber-400' },
    consistency:  { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', bar: 'bg-emerald-400' },
    timeliness:   { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-300', bar: 'bg-blue-400' },
  };
  const c = colorMap[type];
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${c.bg}`}>
      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-semibold ${c.text}`}>{value}{getOrdinalSuffix(value)}</span>
    </div>
  );
};

// ─── Public export: pure router — ZERO hooks ─────────────────────────────────
// This wrapper contains no hooks so React never sees a hook-count mismatch
// when filters.companyId changes between renders.

export const InsightTab = (props: InsightTabProps) => {
    console.log('InsightTab props:', { insights: props.insights, timeSeries: props.timeSeries, companyRawData: props.companyRawData, companyCount: props.companyCount, filters: props.filters });
  if (props.filters?.companyId) {
    const companyName =
      mockCompanies.find(c => c.id === props.filters.companyId)?.brand || 'Company';
    return (
      <CompanyDashboard
        companyId={props.filters.companyId}
        companyName={companyName}
        filters={props.filters}
      />
    );
  }
  return <InsightTabInner {...props} />;
};

// ─── Private inner component: all hooks always called in the same order ──────

const InsightTabInner = ({
  insights,
  timeSeries,
  companyRawData,
  companyCount,
  filters,
  newInsight=false
}: InsightTabProps) => {
  const navigate = useNavigate();

  // // ── Rankings ──
  // const { rankings: allRankings, isLoading: rankingsLoading } = usePortfolioRankings(
  //   filters.year,
  //   filters.quarter || 'Q4',
  //   filters.cumulative,
  // );

  const rankingsV1 = usePortfolioRankings(
    filters.year,
    filters.quarter || "Q4",
    filters.cumulative
  );
  
  const rankingsV2 = usePortfolioRankingsV1(
    filters.year,
    filters.quarter || "Q4",
    filters.cumulative
  );
  
  const {
    rankings: allRankings,
    isLoading: rankingsLoading,
  } = newInsight ? rankingsV2 : rankingsV1;
  
  const filteredBrandSet = useMemo(
    () => new Set(companyRawData.map(c => c.brand)),
    [companyRawData],
  );
  const rankings = useMemo(
    () => allRankings.filter(r => filteredBrandSet.has(r.brand)),
    [allRankings, filteredBrandSet],
  );

  // ── Local UI state ──
  const [rankOrder,    setRankOrder]    = useState<'first-last' | 'last-first'>('first-last');
  const [rankSortCol,  setRankSortCol]  = useState<'completeness' | 'consistency' | 'timeliness' | 'average'>('completeness');
  const [expandedScore,   setExpandedScore]   = useState<string | null>('esgCompositeScore');
  const [expandedRanking, setExpandedRanking] = useState<string | null>('overall');
  const [trendView,    setTrendView]    = useState<'quarterly' | 'annual'>('quarterly');

  // ── Company pools ──
  const submittingCompanies = companyRawData.filter(c => Object.keys(c.kpis).length > 0);
  const submittingCount     = submittingCompanies.length;
  const envEligibleCompanies = submittingCompanies.filter(c => c.hasEnvironmentFeature);

  // ── Per-company composite score averages ──
  const computePerCompanyAvg = (
    key: keyof InsightMetrics,
    companies?: typeof submittingCompanies,
  ): number => {
    const pool = companies || submittingCompanies;
    const vals = pool
      .map(c => c.insights[key] as number)
      .filter(v => v !== undefined && v !== null && !isNaN(v));
    return vals.length > 0
      ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10
      : 0;
  };

  const perCompanyScores = {
    esgCompositeScore:   computePerCompanyAvg('esgCompositeScore'),
    circularEconomyIndex: computePerCompanyAvg('circularEconomyIndex', envEligibleCompanies),
    socialScore:         computePerCompanyAvg('socialScore'),
    governanceScore:     computePerCompanyAvg('governanceScore'),
  };

  // ── Low-completeness brands per ESG category ──
  const lowCompletenessMap = useMemo(() => {
    const map: Record<string, Set<string>> = {
      esgCompositeScore:    new Set<string>(),
      circularEconomyIndex: new Set<string>(),
      socialScore:          new Set<string>(),
      governanceScore:      new Set<string>(),
    };
    for (const r of rankings) {
      if (r.esgCompleteness.overall < 30) map.esgCompositeScore.add(r.brand);
      if (r.esgCompleteness.E       < 30) map.circularEconomyIndex.add(r.brand);
      if (r.esgCompleteness.S       < 30) map.socialScore.add(r.brand);
      if (r.esgCompleteness.G       < 30) map.governanceScore.add(r.brand);
    }
    return map;
  }, [rankings]);

  // ── All companies list (for "Not Considered" tracking) ──
  const allFilteredCompanies = companyRawData.map(c => ({
    brand: c.brand,
    companyName: c.companyName,
    industry: c.industry,
  }));

  // ── Rankings with computed averages ──
  const rankingsWithAvg = rankings.map(r => ({
    ...r,
    averagePercentile: Math.round(
      (r.completenessPercentile + r.consistencyPercentile + r.timelinessPercentile) / 3,
    ),
    averageScore: Math.round(
      ((r.completionPct + r.consistencyPct + r.timelinessScore) / 3) * 10,
    ) / 10,
  }));

  const sortedRankings = useMemo(() => {
    const keyMap: Record<string, string> = {
      completeness: 'completenessPercentile',
      consistency:  'consistencyPercentile',
      timeliness:   'timelinessPercentile',
      average:      'averagePercentile',
    };
    const key = keyMap[rankSortCol];
    return [...rankingsWithAvg].sort((a, b) => {
      const diff = (a as any)[key] - (b as any)[key];
      return rankOrder === 'first-last' ? -diff : diff;
    });
  }, [rankingsWithAvg, rankSortCol, rankOrder]);

  // ── Score trends ──
  const allTrends = useMemo(() =>
    [...timeSeries]
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        const qOrder: Record<string, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4, FY: 5 };
        return (qOrder[a.quarter] || 0) - (qOrder[b.quarter] || 0);
      })
      .map(t => ({
        period:     t.period,
        quarter:    t.quarter,
        esg:        t.perCompanyInsights.esgCompositeScore,
        circular:   t.perCompanyInsights.circularEconomyIndex,
        social:     t.perCompanyInsights.socialScore,
        governance: t.perCompanyInsights.governanceScore,
      })),
    [timeSeries],
  );

  const insightTrends = trendView === 'quarterly'
    ? allTrends.filter(t => t.quarter !== 'FY')
    : allTrends.filter(t => t.quarter === 'FY');

  // ── Handlers ──
  const handleDrillDown = (
    title: string,
    key: keyof InsightMetrics,
    filterBrands?: string[],
  ) => {
    const ratioConfig = RATIO_COMPONENT_COLUMNS[key as string];
    const pool = key === 'circularEconomyIndex' ? envEligibleCompanies : submittingCompanies;
    const companyData = pool
      .filter(c =>
        c.insights[key] !== undefined &&
        c.insights[key] !== null &&
        !isNaN(c.insights[key] as number),
      )
      .filter(c => !filterBrands || filterBrands.includes(c.brand))
      .map(c => {
        const row: any = {
          brand:       c.brand,
          companyName: c.companyName,
          industry:    c.industry,
          value:       (c.insights[key] as number).toFixed(2),
        };
        if (ratioConfig) row.ratioColumns = ratioConfig.getValues(c);
        return row;
      });

    const extra: any = { sourceInsightKey: key };
    if (ratioConfig) extra.ratioColumnHeaders = ratioConfig.headers;

    const lowBrands = lowCompletenessMap[key as string] || new Set();
    navigate('/mis/analytics-detail', {
      state: {
        title,
        featureLabel: 'Cross-Module: ESG',
        companyData,
        filters,
        isPct: false,
        allFilteredCompanies,
        lowCompletenessBrands: Array.from(lowBrands),
        ...extra,
      },
    });
  };

  const handleRankingCategoryDrillDown = (
    metricKey: string,
    metricLabel: string,
    categoryLabel: string,
    companyBrands: string[],
  ) => {
    const percentileKeyMap: Record<string, string> = {
      overall:      'averagePercentile',
      completeness: 'completenessPercentile',
      consistency:  'consistencyPercentile',
      timeliness:   'timelinessPercentile',
    };
    const rawKeyMap: Record<string, string[]> = {
      overall:      ['completionPct', 'consistencyPct', 'timelinessScore'],
      completeness: ['completionPct'],
      consistency:  ['consistencyPct'],
      timeliness:   ['timelinessScore'],
    };
    const headerMap: Record<string, string[]> = {
      overall:      ['Completeness %', 'Consistency %', 'Timeliness Score', 'Avg Percentile'],
      completeness: ['Completion %', 'Percentile'],
      consistency:  ['Consistency %', 'Percentile'],
      timeliness:   ['Timeliness Score', 'Percentile'],
    };

    const pKey    = percentileKeyMap[metricKey] || 'averagePercentile';
    const rawKeys = rawKeyMap[metricKey] || [];
    const headers = headerMap[metricKey] || [];

    const useAllCompanies  = metricKey === 'timeliness';
    const filteredRankings = useAllCompanies
      ? rankingsWithAvg
      : rankingsWithAvg.filter(r => companyBrands.includes(r.brand));

    const companyData = filteredRankings.map(r => {
      const ratioColumns: Record<string, string> = {};
      if (metricKey === 'overall') {
        ratioColumns['Completeness %']   = r.completionPct.toFixed(1);
        ratioColumns['Consistency %']    = r.consistencyPct.toFixed(1);
        ratioColumns['Timeliness Score'] = r.timelinessScore.toFixed(1);
        ratioColumns['Avg Percentile']   = String(r.averagePercentile);
      } else {
        ratioColumns[headers[0]] = (r as any)[rawKeys[0]]?.toFixed(1) || '0';
        ratioColumns[headers[1]] = String((r as any)[pKey] || 0);
      }
      return {
        brand:       r.brand,
        companyName: r.companyName || r.brand,
        industry:    r.industry,
        value:       String((r as any)[pKey] || 0),
        ratioColumns,
      };
    });

    navigate('/mis/analytics-detail', {
      state: {
        title:               `${metricLabel} — Category ${categoryLabel}`,
        featureLabel:        'Responsiveness Score',
        companyData,
        filters,
        isPct:               false,
        allFilteredCompanies: useAllCompanies
          ? filteredRankings.map(r => r.brand)
          : allFilteredCompanies,
        ratioColumnHeaders:  headers,
        sourceInsightKey:    'rankings',
        hideNotConsidered:   useAllCompanies,
      },
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  // Ranking card config
  const avgCompleteness = rankingsWithAvg.length > 0
    ? Math.round(rankingsWithAvg.reduce((s, r) => s + r.completionPct,  0) / rankingsWithAvg.length * 10) / 10
    : 0;
  const avgConsistency = rankingsWithAvg.length > 0
    ? Math.round(rankingsWithAvg.reduce((s, r) => s + r.consistencyPct, 0) / rankingsWithAvg.length * 10) / 10
    : 0;
  const avgTimeliness = rankingsWithAvg.length > 0
    ? Math.round(rankingsWithAvg.reduce((s, r) => s + r.timelinessScore, 0) / rankingsWithAvg.length * 10) / 10
    : 0;
  const avgOverall = Math.round((avgCompleteness + avgConsistency + avgTimeliness) / 3 * 10) / 10;

  const rankingCards = [
    { key: 'overall',      label: 'Overall Ranking Score', value: avgOverall,      scoreKey: 'averageScore',    icon: <Trophy        className="w-4 h-4 text-purple-600" />, color: 'border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20', large: true  },
    { key: 'completeness', label: 'Completeness',          value: avgCompleteness, scoreKey: 'completionPct',   icon: <CheckCircle2  className="w-4 h-4 text-amber-600"  />, color: 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10',   large: false },
    { key: 'consistency',  label: 'Consistency',           value: avgConsistency,  scoreKey: 'consistencyPct',  icon: <RefreshCw     className="w-4 h-4 text-emerald-600"/>, color: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10', large: false },
    { key: 'timeliness',   label: 'Timeliness',            value: avgTimeliness,   scoreKey: 'timelinessScore', icon: <Clock         className="w-4 h-4 text-blue-600"   />, color: 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10',     large: false },
  ];

  const esgCards = [
    { key: 'esgCompositeScore',    label: 'ESG Performance Composite Score', value: perCompanyScores.esgCompositeScore,    icon: <BarChart3   className="w-4 h-4 text-emerald-600" />, color: 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20', large: true,  count: submittingCount           },
    { key: 'circularEconomyIndex', label: 'Environment Score',               value: perCompanyScores.circularEconomyIndex, icon: <Leaf        className="w-4 h-4 text-amber-600"  />, color: 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10',         large: false, count: envEligibleCompanies.length },
    { key: 'socialScore',          label: 'Social Score',                    value: perCompanyScores.socialScore,          icon: <UsersRound  className="w-4 h-4 text-blue-600"   />, color: 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10',             large: false, count: submittingCount           },
    { key: 'governanceScore',      label: 'Governance Score',                value: perCompanyScores.governanceScore,      icon: <Shield      className="w-4 h-4 text-purple-600" />, color: 'border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/10',     large: false, count: submittingCount           },
  ];

  return (
    <div className="space-y-6">

      {/* ─── Responsiveness Score ─────────────────────────────────────────── */}
      <section>
        <div
          className="flex items-center gap-2 mb-3 cursor-pointer group"
          onClick={() => navigate(`/mis/company-rankings?year=${filters.year}&quarter=${filters.quarter || 'Q4'}`)}
        >
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-semibold group-hover:underline">Responsiveness Score</h2>
          <Badge variant="outline" className="text-xs">Completeness · Consistency · Timeliness</Badge>
          <Badge variant="secondary" className="text-xs">
            <Users className="w-3 h-3 mr-1" />
            n={rankings.length}
          </Badge>
        </div>

        {rankingsLoading ? (
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        ) : rankings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              No company data available for rankings.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Ranking stat cards */}
            <div className="grid grid-cols-4 gap-3 mb-3">
              {rankingCards.map(card => {
                const isExpanded = expandedRanking === card.key;
                return (
                  <Card
                    key={card.key}
                    className={`cursor-pointer transition-all hover:shadow-md ${card.color} ${isExpanded ? 'ring-2 ring-primary/40' : ''}`}
                    onClick={() => setExpandedRanking(isExpanded ? null : card.key)}
                  >
                    <CardContent className={card.large ? 'pt-4 pb-3' : 'pt-3 pb-2'}>
                      <div className="flex items-center justify-between mb-1">
                        <p className={`${card.large ? 'text-xs' : 'text-[11px]'} font-medium text-muted-foreground`}>
                          {card.label}
                        </p>
                        <div className="flex items-center gap-1.5">
                          {card.icon}
                          <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className={`${card.large ? 'text-3xl' : 'text-2xl'} font-bold`}>
                          {card.value.toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground mb-1">avg score</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] mt-1">n={rankings.length}</Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Inline category breakdown for rankings */}
            {expandedRanking && (() => {
              const config = rankingCards.find(c => c.key === expandedRanking);
              if (!config) return null;
              const companiesForBreakdown = rankingsWithAvg.map(r => ({
                brand: r.brand,
                score: (r as any)[config.scoreKey] as number,
              }));
              return (
                <div className="mb-3">
                  <ESGCategoryBreakdown
                    title={config.label}
                    companies={companiesForBreakdown}
                    onClose={() => setExpandedRanking(null)}
                    onCategoryClick={(catKey, catLabel, brands) =>
                      handleRankingCategoryDrillDown(config.key, config.label, catLabel, brands)
                    }
                  />
                </div>
              );
            })()}
          </>
        )}
      </section>

      {/* ─── ESG Composite Scores ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold">Cross-Module: ESG Performance Composite Scores</h2>
          <Badge variant="outline" className="text-xs">Auto-calculated</Badge>
          <Badge variant="secondary" className="text-xs">
            <Users className="w-3 h-3 mr-1" />
            n={submittingCount}
          </Badge>
        </div>

        {/* ESG stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {esgCards.map(card => {
            const isExpanded = expandedScore === card.key;
            return (
              <Card
                key={card.key}
                className={`cursor-pointer transition-all hover:shadow-md ${card.color} ${isExpanded ? 'ring-2 ring-primary/40' : ''}`}
                onClick={() => setExpandedScore(isExpanded ? null : card.key)}
              >
                <CardContent className={card.large ? 'pt-4 pb-3' : 'pt-3 pb-2'}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={`${card.large ? 'text-xs' : 'text-[11px]'} font-medium text-muted-foreground`}>
                      {card.label}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {card.icon}
                      <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className={`${card.large ? 'text-3xl' : 'text-2xl'} font-bold`}>
                      {(card.value ?? 0).toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground mb-1">/ 100</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] mt-1.5">n={card.count}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Inline category breakdown for ESG scores */}
        {expandedScore && (() => {
          const scoreMap: Record<string, { title: string; insightKey: keyof InsightMetrics }> = {
            esgCompositeScore:    { title: 'ESG Performance Composite Score', insightKey: 'esgCompositeScore'    },
            circularEconomyIndex: { title: 'Environment Score',               insightKey: 'circularEconomyIndex' },
            socialScore:          { title: 'Social Score',                    insightKey: 'socialScore'          },
            governanceScore:      { title: 'Governance Score',                insightKey: 'governanceScore'      },
          };
          const config = scoreMap[expandedScore];
          if (!config) return null;
          const pool = expandedScore === 'circularEconomyIndex' ? envEligibleCompanies : submittingCompanies;
          const companiesForBreakdown = pool
            .filter(c =>
              c.insights[config.insightKey] !== undefined &&
              !isNaN(c.insights[config.insightKey] as number),
            )
            .map(c => ({ brand: c.brand, score: c.insights[config.insightKey] as number }));
          return (
            <div className="mt-3">
              <ESGCategoryBreakdown
                title={config.title}
                companies={companiesForBreakdown}
                onClose={() => setExpandedScore(null)}
                lowCompletenessBrands={lowCompletenessMap[expandedScore]}
                onCategoryClick={(catKey, catLabel, brands) =>
                  handleDrillDown(`${config.title} — Grade ${catLabel}`, config.insightKey, brands)
                }
                
              />
            </div>
          );
        })()}

        {/* Score Trends */}
        <div className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Score Trends</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-md border border-border overflow-hidden text-xs">
                    <button
                      className={`px-3 py-1 transition-colors ${trendView === 'quarterly' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                      onClick={() => setTrendView('quarterly')}
                    >
                      Quarterly
                    </button>
                    <button
                      className={`px-3 py-1 transition-colors ${trendView === 'annual' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                      onClick={() => setTrendView('annual')}
                    >
                      Annual
                    </button>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">n={submittingCount}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {insightTrends.length === 0 ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  No {trendView === 'quarterly' ? 'quarterly' : 'annual'} data available for the selected period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart
                    data={insightTrends}
                    onClick={() => handleDrillDown('ESG Performance Composite Score', 'esgCompositeScore')}
                    style={{ cursor: 'pointer' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="esg"        name="ESG Score"          stroke="hsl(160, 84%, 39%)" strokeWidth={2} />
                    <Line type="monotone" dataKey="circular"   name="Environment Score"  stroke="hsl(38, 92%, 50%)"  strokeWidth={2} />
                    <Line type="monotone" dataKey="social"     name="Social Score"       stroke="hsl(217, 91%, 60%)" strokeWidth={2} />
                    <Line type="monotone" dataKey="governance" name="Governance Score"   stroke="hsl(280, 65%, 50%)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

    </div>
  );
};

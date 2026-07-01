import { useState, useMemo } from 'react';
import { RATIO_COMPONENT_COLUMNS } from '@/lib/ratioComponentColumns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InsightMetrics, TimeSeriesPoint, CompanyRawMetrics } from '@/hooks/useAnalyticsDashboardData';
import { usePortfolioRankings } from '@/hooks/usePortfolioRankings';
import { ESGCategoryBreakdown } from './ESGCategoryBreakdown';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell
} from 'recharts';
import { BarChart3, Users, ExternalLink, CheckCircle2, RefreshCw, Clock, Trophy, ArrowDown, ArrowUp, ArrowUpDown, Leaf, UsersRound, Shield, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import CompanyDashboard from '../mis/CompanyDashboard';
import { mockCompanies } from '@/data/mockData';

interface InsightTabProps {
  insights: InsightMetrics;
  timeSeries: TimeSeriesPoint[];
  companyRawData: CompanyRawMetrics[];
  companyCount: number;
  filters: any;
}

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

const COLORS = [
  'hsl(160, 84%, 39%)', 'hsl(217, 91%, 60%)', 'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 60%)', 'hsl(340, 75%, 55%)', 'hsl(200, 70%, 50%)',
];

/* GaugeCard removed — replaced by inline stat cards */

const getOrdinalSuffix = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

const PercentileBadge = ({ value, type }: { value: number; type: 'completeness' | 'consistency' | 'timeliness' }) => {
  const colorMap = {
    completeness: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-300', bar: 'bg-amber-400' },
    consistency: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', bar: 'bg-emerald-400' },
    timeliness: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-300', bar: 'bg-blue-400' },
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

export const InsightTabv1 = ({ insights, timeSeries, companyRawData, companyCount, filters }: InsightTabProps) => {
  console.log('InsightTab props:', { insights, timeSeries, companyRawData, companyCount, filters });
  const navigate = useNavigate();
  if (filters?.companyId) {
    return (
      <CompanyDashboard
        companyId={filters.companyId}
        companyName={mockCompanies.find(c => c.id === filters.companyId)?.brand || 'Company'}
        filters={filters}
      />
    );
  }
  const { rankings: allRankings, isLoading: rankingsLoading } = usePortfolioRankings(filters.year, filters.quarter || 'Q4');
  // Restrict rankings to companies in the currently filtered scope (industry, fund, revenue stage, Q category, Fireside POC, company)
  const filteredBrandSet = useMemo(() => new Set(companyRawData.map(c => c.brand)), [companyRawData]);
  const rankings = useMemo(
    () => allRankings.filter(r => filteredBrandSet.has(r.brand)),
    [allRankings, filteredBrandSet]
  );
  const [rankOrder, setRankOrder] = useState<'first-last' | 'last-first'>('first-last');
  const [rankSortCol, setRankSortCol] = useState<'completeness' | 'consistency' | 'timeliness' | 'average'>('completeness');
  const [expandedScore, setExpandedScore] = useState<string | null>('esgCompositeScore');
  const [expandedRanking, setExpandedRanking] = useState<string | null>('overall');
  const [trendView, setTrendView] = useState<'quarterly' | 'annual'>('quarterly');
  
  // Companies that actually submitted data (have at least one KPI entry)
  const submittingCompanies = companyRawData.filter(c => Object.keys(c.kpis).length > 0);
  const submittingCount = submittingCompanies.length;

  // Companies eligible for Environment Score (must have at least one env feature active)
  const envEligibleCompanies = submittingCompanies.filter(c => c.hasEnvironmentFeature);

  // Compute per-company averages for composite scores (to match detail view)
  const computePerCompanyAvg = (key: keyof InsightMetrics, companies?: typeof submittingCompanies): number => {
    const pool = companies || submittingCompanies;
    const vals = pool
      .map(c => c.insights[key] as number)
      .filter(v => v !== undefined && v !== null && !isNaN(v));
    return vals.length > 0 ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : 0;
  };
  const perCompanyScores = {
    esgCompositeScore: computePerCompanyAvg('esgCompositeScore'),
    circularEconomyIndex: computePerCompanyAvg('circularEconomyIndex', envEligibleCompanies),
    socialScore: computePerCompanyAvg('socialScore'),
    governanceScore: computePerCompanyAvg('governanceScore'),
  };

  // Compute low-completeness brand sets (<30%) per ESG category from rankings
  const lowCompletenessMap = useMemo(() => {
    const map: Record<string, Set<string>> = {
      esgCompositeScore: new Set<string>(),
      circularEconomyIndex: new Set<string>(),
      socialScore: new Set<string>(),
      governanceScore: new Set<string>(),
    };
    for (const r of rankings) {
      if (r.esgCompleteness.overall < 30) map.esgCompositeScore.add(r.brand);
      if (r.esgCompleteness.E < 30) map.circularEconomyIndex.add(r.brand);
      if (r.esgCompleteness.S < 30) map.socialScore.add(r.brand);
      if (r.esgCompleteness.G < 30) map.governanceScore.add(r.brand);
    }
    return map;
  }, [rankings]);

  // Build list of all companies for "not considered" tracking
  const allFilteredCompanies = companyRawData.map(c => ({
    brand: c.brand, companyName: c.companyName, industry: c.industry,
  }));

  const handleDrillDown = (title: string, key: keyof InsightMetrics, filterBrands?: string[]) => {
    const ratioConfig = RATIO_COMPONENT_COLUMNS[key as string];
    // For Environment Score, only include companies with active env features
    const pool = key === 'circularEconomyIndex' ? envEligibleCompanies : submittingCompanies;
    const companyData = pool
      .filter(c => c.insights[key] !== undefined && c.insights[key] !== null && !isNaN(c.insights[key] as number))
      .filter(c => !filterBrands || filterBrands.includes(c.brand))
      .map(c => {
        const row: any = {
          brand: c.brand,
          companyName: c.companyName,
          industry: c.industry,
          value: (c.insights[key] as number).toFixed(2),
        };
        if (ratioConfig) {
          row.ratioColumns = ratioConfig.getValues(c);
        }
        return row;
      });
    const extra: any = { sourceInsightKey: key };
    if (ratioConfig) extra.ratioColumnHeaders = ratioConfig.headers;
    // For Environment Score, include all filtered companies so brands without env features
    // appear in the detail view's "Not Considered" stat card
    const scopedAllCompanies = allFilteredCompanies;
    const lowBrands = lowCompletenessMap[key as string] || new Set();
    navigate('/mis/analytics-detail', {
      state: {
        title,
        featureLabel: 'Cross-Module: ESG',
        companyData,
        filters,
        isPct: false,
        allFilteredCompanies: scopedAllCompanies,
        lowCompletenessBrands: Array.from(lowBrands),
        ...extra,
      },
    });
  };

  const handleRankingCategoryDrillDown = (metricKey: string, metricLabel: string, categoryLabel: string, companyBrands: string[]) => {
    const percentileKeyMap: Record<string, string> = {
      overall: 'averagePercentile',
      completeness: 'completenessPercentile',
      consistency: 'consistencyPercentile',
      timeliness: 'timelinessPercentile',
    };
    const rawKeyMap: Record<string, string[]> = {
      overall: ['completionPct', 'consistencyPct', 'timelinessScore'],
      completeness: ['completionPct'],
      consistency: ['consistencyPct'],
      timeliness: ['timelinessScore'],
    };
    const headerMap: Record<string, string[]> = {
      overall: ['Completeness %', 'Consistency %', 'Timeliness Score', 'Avg Percentile'],
      completeness: ['Completion %', 'Percentile'],
      consistency: ['Consistency %', 'Percentile'],
      timeliness: ['Timeliness Score', 'Percentile'],
    };
    const pKey = percentileKeyMap[metricKey] || 'averagePercentile';
    const rawKeys = rawKeyMap[metricKey] || [];
    const headers = headerMap[metricKey] || [];

    // For timeliness, show ALL companies (not just the clicked category)
    const useAllCompanies = metricKey === 'timeliness';
    const filteredRankings = useAllCompanies
      ? rankingsWithAvg
      : rankingsWithAvg.filter(r => companyBrands.includes(r.brand));
    const companyData = filteredRankings.map(r => {
      const ratioColumns: Record<string, string> = {};
      if (metricKey === 'overall') {
        ratioColumns['Completeness %'] = r.completionPct.toFixed(1);
        ratioColumns['Consistency %'] = r.consistencyPct.toFixed(1);
        ratioColumns['Timeliness Score'] = r.timelinessScore.toFixed(1);
        ratioColumns['Avg Percentile'] = String(r.averagePercentile);
      } else {
        const rawKey = rawKeys[0];
        ratioColumns[headers[0]] = (r as any)[rawKey]?.toFixed(1) || '0';
        ratioColumns[headers[1]] = String((r as any)[pKey] || 0);
      }
      return {
        brand: r.brand,
        companyName: r.companyName || r.brand,
        industry: r.industry,
        value: String((r as any)[pKey] || 0),
        ratioColumns,
      };
    });

    const formulaMap: Record<string, string> = {
      overall: 'Average of Completeness, Consistency, and Timeliness percentiles. Each metric is ranked across all portfolio companies.',
      completeness: 'Total KPIs filled across all periods / Total expected KPIs × 100. Excluded quarters are adjusted.',
      consistency: 'For each quarterly KPI: count of quarters with data / eligible quarters. Averaged across all KPIs.',
      timeliness: 'Based on latest first-submission date across all periods (Q1–Q4, FY) vs deadline tiers: ≤ Feb 4 = 100, Feb 5–20 = 90–100 (linear decay), Feb 21–24 = 70–90 (steeper decay), after Feb 24 = 70 minus 1 pt/day. No submissions before March 3 cutoff = 0.\n\nUnit: Score (0–100)',
    };

    navigate('/mis/analytics-detail', {
      state: {
        title: `${metricLabel} — Category ${categoryLabel}`,
        featureLabel: 'Responsiveness Score',
        companyData,
        filters,
        isPct: false,
        // For timeliness, pass all companies so none show as "Not Considered"
        allFilteredCompanies: useAllCompanies ? filteredRankings.map(r => r.brand) : allFilteredCompanies,
        ratioColumnHeaders: headers,
        sourceInsightKey: 'rankings',
        hideNotConsidered: useAllCompanies,
      },
    });
  };

  // Fix Score Trends axis order: sort chronologically (Q4 2024, Q1 2025, Q2 2025, ...)
  // Use perCompanyInsights (per-company averaged) to match stat card values
  const allTrends = [...timeSeries]
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const qOrder: Record<string, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4, FY: 5 };
      return (qOrder[a.quarter] || 0) - (qOrder[b.quarter] || 0);
    })
    .map(t => ({
      period: t.period,
      quarter: t.quarter,
      esg: t.perCompanyInsights.esgCompositeScore,
      circular: t.perCompanyInsights.circularEconomyIndex,
      social: t.perCompanyInsights.socialScore,
      governance: t.perCompanyInsights.governanceScore,
    }));

  // Filter trends based on trendView toggle
  const insightTrends = trendView === 'quarterly'
    ? allTrends.filter(t => t.quarter !== 'FY')
    : allTrends.filter(t => t.quarter === 'FY');

  // Per-company composite scores for bar chart — Top 10 only
  const companyScores = submittingCompanies
    .map(c => ({
      brand: c.brand,
      esg: c.insights.esgCompositeScore,
      circular: c.insights.circularEconomyIndex,
      social: c.insights.socialScore,
      governance: c.insights.governanceScore,
    }))
    .sort((a, b) => b.esg - a.esg);

  // Sorted rankings for display with average
  const rankingsWithAvg = rankings.map(r => ({
    ...r,
    averagePercentile: Math.round((r.completenessPercentile + r.consistencyPercentile + r.timelinessPercentile) / 3),
    averageScore: Math.round((r.completionPct + r.consistencyPct + r.timelinessScore) / 3 * 10) / 10,
  }));
  const sortedRankings = [...rankingsWithAvg]
    .sort((a, b) => {
      const keyMap: Record<string, string> = { completeness: 'completenessPercentile', consistency: 'consistencyPercentile', timeliness: 'timelinessPercentile', average: 'averagePercentile' };
      const key = keyMap[rankSortCol];
      const diff = (a as any)[key] - (b as any)[key];
      return rankOrder === 'first-last' ? -diff : diff;
    });

  return (
    <div className="space-y-6">
      {/* ─── Company Rankings ─── */}
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
            {/* Ranking Stat Cards */}
            {(() => {
              // Actual score averages (not percentile averages)
              const avgCompleteness = Math.round(rankingsWithAvg.reduce((s, r) => s + r.completionPct, 0) / rankingsWithAvg.length * 10) / 10;
              const avgConsistency = Math.round(rankingsWithAvg.reduce((s, r) => s + r.consistencyPct, 0) / rankingsWithAvg.length * 10) / 10;
              const avgTimeliness = Math.round(rankingsWithAvg.reduce((s, r) => s + r.timelinessScore, 0) / rankingsWithAvg.length * 10) / 10;
              const avgOverall = Math.round((avgCompleteness + avgConsistency + avgTimeliness) / 3 * 10) / 10;

              // Score keys map actual raw scores for category breakdown
              const scoreKeyMap: Record<string, string> = {
                overall: 'averageScore',
                completeness: 'completionPct',
                consistency: 'consistencyPct',
                timeliness: 'timelinessScore',
              };

              const rankingCards = [
                { key: 'overall', label: 'Overall Ranking Score', value: avgOverall, icon: <Trophy className="w-4 h-4 text-purple-600" />, color: 'border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20', scoreKey: 'averageScore', large: true },
                { key: 'completeness', label: 'Completeness', value: avgCompleteness, icon: <CheckCircle2 className="w-4 h-4 text-amber-600" />, color: 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10', scoreKey: 'completionPct', large: false },
                { key: 'consistency', label: 'Consistency', value: avgConsistency, icon: <RefreshCw className="w-4 h-4 text-emerald-600" />, color: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10', scoreKey: 'consistencyPct', large: false },
                { key: 'timeliness', label: 'Timeliness', value: avgTimeliness, icon: <Clock className="w-4 h-4 text-blue-600" />, color: 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10', scoreKey: 'timelinessScore', large: false },
              ];

              return (
                <>
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    {rankingCards.map(card => {
                      const isExpanded = expandedRanking === card.key;
                      return (
                        <Card
                          key={card.key}
                          className={`cursor-pointer transition-all hover:shadow-md ${card.color} ${isExpanded ? 'ring-2 ring-primary/40' : ''}`}
                          onClick={() => setExpandedRanking(isExpanded ? null : card.key)}
                        >
                          <CardContent className={`${card.large ? 'pt-4 pb-3' : 'pt-3 pb-2'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <p className={`${card.large ? 'text-xs' : 'text-[11px]'} font-medium text-muted-foreground`}>{card.label}</p>
                              <div className="flex items-center gap-1.5">
                                {card.icon}
                                <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                            </div>
                            <div className="flex items-end gap-2">
                              <span className={`${card.large ? 'text-3xl' : 'text-2xl'} font-bold`}>{card.value.toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground mb-1">avg score</span>
                            </div>
                            <Badge variant="secondary" className="text-[10px] mt-1">n={rankings.length}</Badge>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Inline Category Breakdown for Rankings */}
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
                          onCategoryClick={(catKey, catLabel, brands) => {
                            handleRankingCategoryDrillDown(config.key, config.label, catLabel, brands);
                          }}
                        />
                      </div>
                    );
                  })()}
                </>
              );
            })()}
          </>
        )}
      </section>

      {/* ─── Cross-Module: ESG Composite Scores ─── */}
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

        {/* ESG Stat Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* ESG Composite - Larger card spanning or visually prominent */}
          {[
            { key: 'esgCompositeScore', label: 'ESG Performance Composite Score', value: perCompanyScores.esgCompositeScore, icon: <BarChart3 className="w-4 h-4 text-emerald-600" />, color: 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20', large: true, count: submittingCount },
            { key: 'circularEconomyIndex', label: 'Environment Score', value: perCompanyScores.circularEconomyIndex, icon: <Leaf className="w-4 h-4 text-amber-600" />, color: 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10', large: false, count: envEligibleCompanies.length },
            { key: 'socialScore', label: 'Social Score', value: perCompanyScores.socialScore, icon: <UsersRound className="w-4 h-4 text-blue-600" />, color: 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10', large: false, count: submittingCount },
            { key: 'governanceScore', label: 'Governance Score', value: perCompanyScores.governanceScore, icon: <Shield className="w-4 h-4 text-purple-600" />, color: 'border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/10', large: false, count: submittingCount },
          ].map(card => {
            const isExpanded = expandedScore === card.key;
            return (
              <Card
                key={card.key}
                className={`cursor-pointer transition-all hover:shadow-md ${card.color} ${isExpanded ? 'ring-2 ring-primary/40' : ''} ${card.large ? 'md:row-span-1' : ''}`}
                onClick={() => setExpandedScore(isExpanded ? null : card.key)}
              >
                <CardContent className={`${card.large ? 'pt-4 pb-3' : 'pt-3 pb-2'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={`${card.large ? 'text-xs' : 'text-[11px]'} font-medium text-muted-foreground`}>{card.label}</p>
                    <div className="flex items-center gap-1.5">
                      {card.icon}
                      <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
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

        {/* Inline Category Breakdown */}
        {expandedScore && (() => {
          const scoreMap: Record<string, { title: string; insightKey: keyof InsightMetrics }> = {
            esgCompositeScore: { title: 'ESG Performance Composite Score', insightKey: 'esgCompositeScore' },
            circularEconomyIndex: { title: 'Environment Score', insightKey: 'circularEconomyIndex' },
            socialScore: { title: 'Social Score', insightKey: 'socialScore' },
            governanceScore: { title: 'Governance Score', insightKey: 'governanceScore' },
          };
          console.log('Expanded Score:', expandedScore);
          const config = scoreMap[expandedScore];
          if (!config) return null;
          const pool = expandedScore === 'circularEconomyIndex' ? envEligibleCompanies : submittingCompanies;
          const companiesForBreakdown = pool
            .filter(c => c.insights[config.insightKey] !== undefined && !isNaN(c.insights[config.insightKey] as number))
            .map(c => ({ brand: c.brand, score: c.insights[config.insightKey] as number }));
          return (
            <div className="mt-3">
              <ESGCategoryBreakdown
                title={config.title}
                companies={companiesForBreakdown}
                onClose={() => setExpandedScore(null)}
                lowCompletenessBrands={lowCompletenessMap[expandedScore]}
                onCategoryClick={(catKey, catLabel, brands) => {
                  handleDrillDown(`${config.title} — Category ${catLabel}`, config.insightKey, brands);
                }}
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
                  <LineChart data={insightTrends} onClick={() => handleDrillDown('ESG Performance Composite Score', 'esgCompositeScore')} style={{ cursor: 'pointer' }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="esg" name="ESG Score" stroke="hsl(160, 84%, 39%)" strokeWidth={2} />
                    <Line type="monotone" dataKey="circular" name="Environment Score" stroke="hsl(38, 92%, 50%)" strokeWidth={2} />
                    <Line type="monotone" dataKey="social" name="Social Score" stroke="hsl(217, 91%, 60%)" strokeWidth={2} />
                    <Line type="monotone" dataKey="governance" name="Governance Score" stroke="hsl(280, 65%, 50%)" strokeWidth={2} />
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

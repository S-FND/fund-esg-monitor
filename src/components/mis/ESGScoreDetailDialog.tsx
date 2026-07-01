import { useState, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Leaf, UsersRound, Shield, Info, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAnalyticsDashboardData, CompanyRawMetrics } from '@/hooks/useAnalyticsDashboardData';
import {
  extractNonFashionRawComponents,
  extractFashionRawComponents,
  extractSocialRawComponents,
  applyEnvironmentPercentileNormalization,
  applySocialScorePercentileNormalization,
  computeCrossQuarterVirginReductions,
  EnvCompanyData,
} from '@/lib/envScorePercentile';
import { RATIO_COMPONENT_COLUMNS } from '@/lib/ratioComponentColumns';
import { mockCompanies } from '@/data/mockData';
import { getMetricDisplayName } from '@/lib/metricDisplayNames';

type ScoreType = 'environment' | 'social' | 'governance' | 'composite';

interface ESGScoreDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scoreType: ScoreType;
  companyId: string;
  year: number;
  dashboardViewMode?: 'percentile' | 'category';
  kpiEntries:{ companyId: string; kpi_id: string; value: string | null; quarter: string; year: number }[];
  features:{ companyId: string; feature_key: string, enabled: boolean }[]
}

const getGradeFromValue = (value: number): { grade: string; color: string } => {
  if (value >= 80) return { grade: 'AA', color: 'hsl(160, 60%, 40%)' };
  if (value >= 60) return { grade: 'A', color: 'hsl(217, 91%, 50%)' };
  if (value >= 40) return { grade: 'BB', color: 'hsl(38, 92%, 50%)' };
  if (value >= 20) return { grade: 'B', color: 'hsl(25, 95%, 53%)' };
  return { grade: 'C', color: 'hsl(0, 72%, 51%)' };
};

const getGradeBadgeClass = (grade: string): string => {
  switch (grade) {
    case 'AA': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
    case 'A': return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
    case 'BB': return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
    case 'B': return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300';
    case 'C': return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
    default: return '';
  }
};

const SCORE_CONFIG: Record<ScoreType, { title: string; icon: React.ReactNode; color: string }> = {
  composite: { title: 'ESG Composite Score Breakdown', icon: <BarChart3 className="w-5 h-5 text-emerald-600" />, color: 'hsl(160, 60%, 45%)' },
  environment: { title: 'Environment Score Breakdown', icon: <Leaf className="w-5 h-5 text-amber-600" />, color: 'hsl(38, 92%, 50%)' },
  social: { title: 'Social Score Breakdown', icon: <UsersRound className="w-5 h-5 text-blue-600" />, color: 'hsl(217, 91%, 60%)' },
  governance: { title: 'Governance Score Breakdown', icon: <Shield className="w-5 h-5 text-purple-600" />, color: 'hsl(280, 65%, 60%)' },
};

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

const METRIC_TOOLTIPS: Record<string, string> = {
  // Environment – Non-Fashion
  'Virgin Plastic Reduction %': 'Cross-quarter reduction in virgin plastic usage. Weight: 20% of Environment Score. Percentile: min-max normalized including negative values.',
  'Plastic Intensity Score': 'Plastic consumed per ₹ Cr revenue (MT/₹Cr). Weight: 30% of Environment Score. Inverted percentile: lower intensity = higher rank.',
  'Material Recycled %': 'Percentage of materials recycled. Weight: 20% of Environment Score. Percentile-normalized across the cohort.',
  'EPR/VPN %': 'Max of EPR Compliance or Voluntary Plastic Neutrality. Weight: 10% of Environment Score. Shown only if data exists.',
  'P&S Recycled/Pkg %': 'Sum of recycled plastic/paper, glass, metal & plant-based as % of total packaging. Weight: 10% of Environment Score.',
  'Recyclable %': 'Percentage of packaging that is recyclable. Weight: 10% of Environment Score.',
  // Environment – Fashion
  'Recyclable Materials %': 'Percentage of recyclable materials used. Weight: 40% (or 50% without Water Mgmt) of Environment Score.',
  'Recyclable Packaging %': 'Percentage of recyclable packaging. Weight: 40% (or 50% without Water Mgmt) of Environment Score.',
  'Fresh Water Consumed %': 'Fresh water consumed as a proportion. Weight: 10% of Environment Score (Fashion with Water Mgmt only).',
  'Water Recycled %': 'Percentage of water recycled. Weight: 10% of Environment Score (Fashion with Water Mgmt only).',
  // Social
  'Supplier CoC In Place': 'Whether Supplier Code of Conduct is in place (Yes=100, No=0). Part of the Social Score for companies with Sourcing & Fulfillment.',
  'Supplier CoC Training': 'Whether Supplier CoC training is conducted (Yes=100, No=0). Part of the Social Score for companies with Sourcing & Fulfillment.',
  'DEI Vendor %': 'Percentage of DEI-compliant vendors. Percentile-normalized across the cohort.',
  'Gender Ratio': 'Female-to-male employee ratio. Percentile-normalized: higher ratio = higher rank.',
  'Women Leadership %': 'Percentage of women in leadership roles. Percentile-normalized across the cohort.',
  'Pay Parity': 'Female-to-male average pay ratio. Percentile-normalized: higher parity = higher rank.',
  // Governance (absolute scoring, no percentiles)
  'Policy Adoption %': 'Adoption rate across 12 tracked governance policies. Weight: 40% of Governance Score.',
  'Training Coverage %': 'Percentage of employees covered by compliance training. Weight: 40% of Governance Score.',
  'High Impact Unresolved %': 'Percentage of high-impact incidents unresolved. Weight: 20% of Governance Score. Inverted: lower = better.',
};

/**
 * Given a set of CompanyRawMetrics, re-apply percentile normalization
 * and return a Map of companyId → { metricName → percentile value }.
 */
function computeEnvPercentiles(allCompanies: CompanyRawMetrics[], preComputedVirginReductions?: Map<string, number>): Map<string, Record<string, number>> {
  // Clone insights to avoid mutating original data
  const envData: EnvCompanyData[] = allCompanies.map(c => ({
    companyId: c.companyId,
    kpis: c.kpis,
    insights: { ...c.insights },
    usesFashionPackaging: c.usesFashionPackaging,
    hasWaterFeature: (c as any).hasWaterFeature,
    hasEnvironmentFeature: c.hasEnvironmentFeature,
  }));
  return applyEnvironmentPercentileNormalization(envData, preComputedVirginReductions);
}

function computeSocialPercentiles(allCompanies: CompanyRawMetrics[], sourcingIds: Set<string>): Map<string, Record<string, number>> {
  const envData: EnvCompanyData[] = allCompanies.map(c => ({
    companyId: c.companyId,
    kpis: c.kpis,
    insights: { ...c.insights },
    usesFashionPackaging: c.usesFashionPackaging,
    hasWaterFeature: (c as any).hasWaterFeature,
    hasEnvironmentFeature: c.hasEnvironmentFeature,
  }));
  applySocialScorePercentileNormalization(envData, sourcingIds);
  
  const result = new Map<string, Record<string, number>>();
  envData.forEach(c => {
    const sp = (c.insights as any)?._socialPercentiles;
    if (sp) {
      result.set(c.companyId, {
        'Supplier CoC In Place': sp.cocInPlace ?? 0,
        'Supplier CoC Training': sp.cocTraining ?? 0,
        'DEI Vendor %': sp.deiPctile ?? 0,
        'Gender Ratio': sp.genderRatioPctile ?? 0,
        'Women Leadership %': sp.womenLeadPctile ?? 0,
        'Pay Parity': sp.payParityPctile ?? 0,
        _hasSourcing: sp.hasSourcing ? 1 : 0,
      });
    }
  });
  return result;
}

function computeGovPercentiles(allCompanies: CompanyRawMetrics[]): Map<string, Record<string, number>> {
  const metricNames = ['Policy Adoption %', 'Training Coverage %', 'High Impact Unresolved %'];
  // Collect raw values per company
  const rawMap = new Map<string, Record<string, number>>();
  allCompanies.forEach(c => {
    const govComps = RATIO_COMPONENT_COLUMNS.governanceScore.getValues(c);
    const vals: Record<string, number> = {};
    metricNames.forEach(m => { vals[m] = parseFloat(govComps[m] || '0') || 0; });
    rawMap.set(c.companyId, vals);
  });

  // Min-max percentile normalization per metric across the cohort
  const result = new Map<string, Record<string, number>>();
  allCompanies.forEach(c => result.set(c.companyId, {}));

  metricNames.forEach(metric => {
    const vals = Array.from(rawMap.values()).map(v => v[metric]).filter(v => v > 0);
    const min = vals.length > 0 ? Math.min(...vals) : 0;
    const max = vals.length > 0 ? Math.max(...vals) : 0;
    const range = max - min;
    // "High Impact Unresolved %" is inverted: lower is better
    const inverted = metric === 'High Impact Unresolved %';

    rawMap.forEach((raw, cId) => {
      const v = raw[metric];
      let pctile = 0;
      if (inverted && v === 0) {
        // 0 unresolved high-impact incidents is the best possible outcome → 100
        pctile = 100;
      } else if (v > 0 && range > 0) {
        pctile = inverted
          ? ((max - v) / range) * 100
          : ((v - min) / range) * 100;
      } else if (v > 0 && range === 0) {
        pctile = 100;
      }
      result.get(cId)![metric] = Math.round(pctile * 10) / 10;
    });
  });

  return result;
}

export const ESGScoreDetailDialog = ({ open, onOpenChange, scoreType, companyId, year, dashboardViewMode = 'percentile',kpiEntries,features }: ESGScoreDetailDialogProps) => {
  // debugger;
  const isCategoryView = dashboardViewMode === 'category';
  // Force annual view for all score types (quarterly toggle removed from composite)
  const [viewMode, setViewMode] = useState<'quarterly' | 'annual'>('annual');
  const config = SCORE_CONFIG[scoreType];

  // Fetch data for all companies (no companyId filter) for each quarter
  const q1Data = useAnalyticsDashboardData({ period: 'quarterly', quarter: 'Q1', year },kpiEntries,features);
  const q2Data = useAnalyticsDashboardData({ period: 'quarterly', quarter: 'Q2', year },kpiEntries,features);
  const q3Data = useAnalyticsDashboardData({ period: 'quarterly', quarter: 'Q3', year },kpiEntries,features);
  const q4Data = useAnalyticsDashboardData({ period: 'quarterly', quarter: 'Q4', year },kpiEntries,features);
  const annualData = useAnalyticsDashboardData({ period: 'annual', year },kpiEntries,features);
  console.log('Fetched analytics data for ESGScoreDetailDialog', { annualData });

  const isLoading = q1Data.isLoading || q2Data.isLoading || q3Data.isLoading || q4Data.isLoading || annualData.isLoading;

  const companyMeta = useMemo(() => mockCompanies.find(c => c.id === companyId), [companyId]);

  // Build sourcingCompanyIds from the features that are already fetched in the analytics data
  // We'll detect from social percentiles which companies have sourcing
  const sourcingCompanyIds = useMemo(() => {
    const ids = new Set<string>();
    const rawData = q4Data.data?.companyRawData || [];
    rawData.forEach(c => {
      const sp = (c.insights as any)?._socialPercentiles;
      if (sp?.hasSourcing) ids.add(c.companyId);
    });
    return ids;
  }, [q4Data.data]);

  const chartData = useMemo(() => {
    if (isLoading) return null;

    const quarterDatasets = [
      { q: 'Q1', rawData: q1Data.data?.companyRawData },
      { q: 'Q2', rawData: q2Data.data?.companyRawData },
      { q: 'Q3', rawData: q3Data.data?.companyRawData },
      { q: 'Q4', rawData: q4Data.data?.companyRawData },
    ];

    const industry = companyMeta?.industry;
    const revenueStage = companyMeta?.revenueStage;

    // For composite, we show E/S/G scores directly — no percentile computation needed
    if (scoreType === 'composite') {
      
      const compositeMetrics = ['Environment Score', 'Social Score', 'Governance Score'];
      const getScoreKey = (m: string): string =>
        m === 'Environment Score' ? 'circularEconomyIndex' :
        m === 'Social Score' ? 'socialScore' : 'governanceScore';

      const computeGroupAvgComposite = (
        allCos: CompanyRawMetrics[] | undefined,
        scoreKey: string,
        groupType: 'industry' | 'revenue',
        groupValue: string | undefined,
      ): { avg: number; count: number } => {
        console.log(`Computing group average for composite metric ${scoreKey} by ${groupType}  ===== ${groupValue}`, { allCos, scoreKey, groupType, groupValue });
        if (!allCos || !groupValue) return { avg: 0, count: 0 };
        const group = allCos.filter(c =>
          groupType === 'industry' ? c.industry === groupValue : c.revenueStage === groupValue
        );
        console.log("group for composite avg:", group);
        const vals = group
          .map(c => (c.insights as any)?.[scoreKey])
          .filter((v: any) => v !== undefined && v !== null && !isNaN(v)) as number[];
        console.log(`Values for ${scoreKey} by ${groupType}=${groupValue}:`, vals);
        return {
          avg: vals.length > 0 ? Math.round((vals.reduce((s: number, v: number) => s + v, 0) / vals.length) * 10) / 10 : 0,
          count: group.length,
        };
      };

      const getCompositeN = (allCos: CompanyRawMetrics[] | undefined, scoreKey: string): number => {
        console.log(`Computing cohort size for composite metric ${scoreKey}`, { allCos, scoreKey });
        if (!allCos) return 0;
        if (scoreKey === 'circularEconomyIndex') {
          return allCos.filter(c => c.hasEnvironmentFeature && Object.keys(c.kpis).length > 0).length;
        }
        return allCos.filter(c => Object.keys(c.kpis).length > 0).length;
      };

      if (viewMode === 'quarterly') {
        return compositeMetrics.map(metric => {
          const scoreKey = getScoreKey(metric);
          let sectorN = 0;
          let revenueN = 0;
          const data = QUARTERS.map((q, i) => {
            const allCos = quarterDatasets[i].rawData;
            const co = allCos?.find(c => c.companyId === companyId);
            const value = (co?.insights as any)?.[scoreKey] ?? 0;
            const indResult = computeGroupAvgComposite(allCos, scoreKey, 'industry', industry);
            const revResult = computeGroupAvgComposite(allCos, scoreKey, 'revenue', revenueStage);
            sectorN = indResult.count;
            revenueN = revResult.count;
            return { period: q, company: Math.round(value * 10) / 10, industryAvg: indResult.avg, revenueAvg: revResult.avg };
          });
          const n = getCompositeN(quarterDatasets[3].rawData, scoreKey);
          const repCo = quarterDatasets.map(d => d.rawData?.find(c => c.companyId === companyId)).find(Boolean);
          const isNA = metric === 'Environment Score' && (!repCo || !repCo.hasEnvironmentFeature);
          return { metric, data, n, isNA, sectorN, revenueN };
        });
      } else {
        const combinedRawData = annualData.data?.quarterlyCombinedRawData;
        const currentCo = combinedRawData?.find(c => c.companyId === companyId);
        return compositeMetrics.map(metric => {
          console.log(`Computing data for metric: ${metric}`, { combinedRawData, currentCo, industry, revenueStage });
          const scoreKey = getScoreKey(metric);
          console.log(`Score key: ${scoreKey}, Company value: ${(currentCo?.insights as any)?.[scoreKey]}`);
          const value = (currentCo?.insights as any)?.[scoreKey] ?? 0;
          const indResult = computeGroupAvgComposite(combinedRawData, scoreKey, 'industry', industry);
          const revResult = computeGroupAvgComposite(combinedRawData, scoreKey, 'revenue', revenueStage);
          console.log(`Group averages for ${metric}:`, { industryAvg: indResult, revenueAvg: revResult });
          const n = getCompositeN(combinedRawData, scoreKey);
          console.log(`Cohort size for ${metric}:`, n);
          const isNA = metric === 'Environment Score' && (!currentCo || !currentCo.hasEnvironmentFeature);
          return {
            metric,
            data: [{ period: `AY ${year}`, company: Math.round(value * 10) / 10, industryAvg: indResult.avg, revenueAvg: revResult.avg }],
            n,
            isNA,
            sectorN: indResult.count,
            revenueN: revResult.count,
          };
        });
      }
    }

    // Build per-quarter data for cross-quarter virgin plastic reduction computation
    const perQuarterData: Record<string, Array<{ companyId: string; kpis: Record<string, string> }>> = {};
    quarterDatasets.forEach(({ q, rawData }) => {
      if (rawData) {
        perQuarterData[q] = rawData.map(c => ({ companyId: c.companyId, kpis: c.kpis }));
      }
    });
    const crossQuarterVirginReductions = scoreType === 'environment' && Object.keys(perQuarterData).length > 0
      ? computeCrossQuarterVirginReductions(perQuarterData)
      : undefined;

    // Compute percentiles for each quarter
    const computePercentiles = (allCos: CompanyRawMetrics[] | undefined, virginReductions?: Map<string, number>): Map<string, Record<string, number>> => {
      if (!allCos || allCos.length === 0) return new Map();
      if (scoreType === 'environment') return computeEnvPercentiles(allCos, virginReductions);
      if (scoreType === 'social') return computeSocialPercentiles(allCos, sourcingCompanyIds);
      return computeGovPercentiles(allCos);
    };

    // Get company type from any available quarter
    const repCompany = quarterDatasets.map(d => d.rawData?.find(c => c.companyId === companyId)).find(Boolean);
    const isFashion = repCompany?.usesFashionPackaging === true;
    const hasWaterFeat = (repCompany as any)?.hasWaterFeature === true;

    // Determine metric names
    let metricNames: string[];
    if (scoreType === 'environment') {
      if (isFashion) {
        metricNames = hasWaterFeat
          ? ['Recyclable Materials %', 'Recyclable Packaging %', 'Fresh Water Consumed %', 'Water Recycled %']
          : ['Recyclable Materials %', 'Recyclable Packaging %'];
      } else {
        metricNames = ['Virgin Plastic Reduction %', 'Plastic Intensity Score', 'Material Recycled %', 'EPR/VPN %', 'P&S Recycled/Pkg %', 'Recyclable %'];
      }
    } else if (scoreType === 'social') {
      const sp = (repCompany?.insights as any)?._socialPercentiles;
      metricNames = sp?.hasSourcing
        ? ['Supplier CoC In Place', 'Supplier CoC Training', 'DEI Vendor %', 'Gender Ratio', 'Women Leadership %', 'Pay Parity']
        : ['Gender Ratio', 'Women Leadership %', 'Pay Parity'];
    } else {
      metricNames = ['Policy Adoption %', 'Training Coverage %', 'High Impact Unresolved %'];
    }

    const computeGroupAvg = (
      percMap: Map<string, Record<string, number>>,
      allCos: CompanyRawMetrics[] | undefined,
      metricName: string,
      groupType: 'industry' | 'revenue',
      groupValue: string | undefined,
    ): { avg: number; count: number } => {
      if (!allCos || !groupValue) return { avg: 0, count: 0 };
      const group = allCos.filter(c =>
        groupType === 'industry' ? c.industry === groupValue : c.revenueStage === groupValue
      );
      const vals = group
        .map(c => percMap.get(c.companyId)?.[metricName])
        .filter((v): v is number => v !== undefined && v !== null && !isNaN(v));
      return {
        avg: vals.length > 0 ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : 0,
        count: group.length,
      };
    };

    const combinedRawData = annualData.data?.quarterlyCombinedRawData;
    const quarterPercMaps = quarterDatasets.map(qds => computePercentiles(qds.rawData));

    // Compute cohort size for percentile-based metrics
    const getCohortN = (allCos: CompanyRawMetrics[] | undefined): number => {
      if (!allCos) return 0;
      const submitting = allCos.filter(c => Object.keys(c.kpis).length > 0);
      if (scoreType === 'environment') return submitting.filter(c => c.hasEnvironmentFeature).length;
      return submitting.length;
    };

    // Metrics that are based on annual-only KPIs — exclude from quarterly view
    const ANNUAL_ONLY_METRICS = new Set([
      'Policy Adoption %', 'Training Coverage %',
      'Supplier CoC In Place', 'Supplier CoC Training',
      'EPR/VPN %',
    ]);

    if (viewMode === 'quarterly') {
      const quarterlyMetrics = metricNames.filter(m => !ANNUAL_ONLY_METRICS.has(m));
      return quarterlyMetrics.map(metric => {
        let sectorN = 0;
        let revenueN = 0;
        const data = QUARTERS.map((q, i) => {
          const allCos = quarterDatasets[i].rawData;
          const percMap = quarterPercMaps[i];
          const value = percMap.get(companyId)?.[metric] ?? 0;
          const indResult = computeGroupAvg(percMap, allCos, metric, 'industry', industry);
          const revResult = computeGroupAvg(percMap, allCos, metric, 'revenue', revenueStage);
          sectorN = indResult.count;
          revenueN = revResult.count;
          return { period: q, company: value, industryAvg: indResult.avg, revenueAvg: revResult.avg };
        });
        const n = getCohortN(quarterDatasets[3].rawData);
        return { metric, data, n, isNA: false, sectorN, revenueN };
      });
    } else {
      const annualPercMap = computePercentiles(combinedRawData, crossQuarterVirginReductions);
      const n = getCohortN(combinedRawData);
      return metricNames.map(metric => {
        const value = annualPercMap.get(companyId)?.[metric] ?? 0;
        const indResult = computeGroupAvg(annualPercMap, combinedRawData, metric, 'industry', industry);
        const revResult = computeGroupAvg(annualPercMap, combinedRawData, metric, 'revenue', revenueStage);
        return {
            metric,
            data: [{ period: `AY ${year}`, company: value, industryAvg: indResult.avg, revenueAvg: revResult.avg }],
            n,
            isNA: false,
            sectorN: indResult.count,
            revenueN: revResult.count,
          };
      });
    }
  }, [isLoading, viewMode, companyId, scoreType, year, q1Data.data, q2Data.data, q3Data.data, q4Data.data, annualData.data, companyMeta, sourcingCompanyIds]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {config.icon}
            {config.title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {isCategoryView ? 'Category grades' : 'Percentile scores'} for underlying input metrics • {companyMeta?.brand || companyMeta?.name || 'Company'}
          </p>
        </DialogHeader>

        {/* Annual view badge — no toggle for any score type */}
        <div className="flex gap-2 mb-4">
          <Badge variant="outline" className="ml-auto text-xs">
            Annual • {year}
          </Badge>
        </div>

        {/* Charts */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-lg" />)}
          </div>
        ) : chartData && chartData.length > 0 ? (
          <div className="space-y-6">
            {chartData.map(({ metric, data, n, isNA, sectorN, revenueN }) => {
              // Filter out EPR/VPN if no data
              if (scoreType === 'environment' && metric === 'EPR/VPN %') {
                const hasAnyData = data.some(d => d.company > 0);
                if (!hasAnyData) return null;
              }

              // Show NA placeholder instead of chart for companies without environment features
              if (isNA) {
                return (
                  <div key={metric} className="border rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                      {getMetricDisplayName(metric)}
                      {n !== undefined && <Badge variant="secondary" className="text-[9px] ml-1">n={n}</Badge>}
                    </h4>
                    <div className="flex items-center justify-center h-[120px] text-muted-foreground">
                      <Badge variant="outline" className="text-base px-4 py-1">NA</Badge>
                      <span className="ml-2 text-sm">Environment features not assigned</span>
                    </div>
                  </div>
                );
              }

              const sectorLabel = `Sector Avg (N=${sectorN ?? 0})`;
              const revenueLabel = `Revenue Cohort Avg (N=${revenueN ?? 0})`;

              return (
                <div key={metric} className="border rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                    {getMetricDisplayName(metric)}
                    {n !== undefined && <Badge variant="secondary" className="text-[9px] ml-1">n={n}</Badge>}
                    {METRIC_TOOLTIPS[metric] && (
                      <TooltipProvider delayDuration={200}>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-xs">
                            {METRIC_TOOLTIPS[metric]}
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    )}
                  </h4>
                  <ResponsiveContainer width="100%" height={viewMode === 'quarterly' ? 200 : 120}>
                    <BarChart data={data} barCategoryGap="20%" barSize={10} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <YAxis dataKey="period" type="category" tick={{ fontSize: 12 }} width={60} />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        ticks={isCategoryView ? [0, 20, 40, 60, 80, 100] : [0, 25, 50, 75, 100]}
                        tick={{ fontSize: 11 }}
                        allowDecimals={false}
                        tickFormatter={isCategoryView ? (v: number) => {
                          if (v === 0) return 'C';
                          if (v === 20) return 'B';
                          if (v === 40) return 'BB';
                          if (v === 60) return 'A';
                          if (v === 80) return 'AA';
                          return '';
                        } : undefined}
                      />
                      <RechartsTooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number, name: string) => {
                          if (isCategoryView) {
                            const { grade } = getGradeFromValue(value);
                            return [`${grade} (${value.toFixed(1)})`, name];
                          }
                          return [`${value.toFixed(1)}`, name];
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="company" name="Your Score" fill="rgb(59, 130, 246)" radius={[0, 3, 3, 0]} />
                      <Bar dataKey="industryAvg" name={sectorLabel} fill="rgb(34, 197, 94)" radius={[0, 3, 3, 0]} />
                      <Bar dataKey="revenueAvg" name={revenueLabel} fill="rgb(245, 158, 11)" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No data available for this score breakdown
          </div>
        )}

        {/* Legend explanation */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            {isCategoryView ? (
              <>
                <strong>Category Grades:</strong> AA (80–100), A (60–79), BB (40–59), B (20–39), C (0–19). Based on percentile scores relative to the portfolio cohort.{' '}
              </>
            ) : (
              <>
                <strong>Your Score:</strong> Your company's percentile relative to the Fireside Ventures portfolio cohort.{' '}
              </>
            )}
            <strong>Industry Avg:</strong> Average percentile of all {companyMeta?.industry} companies.{' '}
            <strong>Revenue Cohort Avg:</strong> Average percentile of all companies in the {companyMeta?.revenueStage} Cr revenue range.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

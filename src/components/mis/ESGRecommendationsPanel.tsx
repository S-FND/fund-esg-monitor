import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Leaf, UsersRound, Shield, Trophy, BarChart3 } from 'lucide-react';
import { CompanyRanking } from '@/hooks/usePortfolioRankings';
import {
  extractNonFashionRawComponents,
  extractFashionRawComponents,
  extractSocialRawComponents,
  computeCrossQuarterVirginReductions,
  EnvCompanyData,
  applyEnvironmentPercentileNormalization,
  applySocialScorePercentileNormalization,
} from '@/lib/envScorePercentile';
import { RATIO_COMPONENT_COLUMNS } from '@/lib/ratioComponentColumns';
import { mockCompanies } from '@/data/mockData';
import { CompanyRawMetrics } from '@/hooks/useAnalyticsDashboardData';

type BenchmarkMode = 'portfolio' | 'sector' | 'revenue';

interface ESGRecommendationsPanelProps {
  companyId: string;
  allCompaniesRaw: CompanyRawMetrics[];
  rankings: CompanyRanking[];
  year: number;
}

// ─── 18 Parameters with clear, full-form names ───
interface ParamDef {
  key: string;
  label: string;
  category: 'E' | 'S' | 'G' | 'Performance';
  /** If true, lower raw value = better (inverted metric) */
  inverted?: boolean;
}

const ENV_PARAMS_NON_FASHION: ParamDef[] = [
  { key: 'env_virgin_plastic_reduction', label: 'Reduction in virgin plastic usage over time', category: 'E' },
  { key: 'env_plastic_intensity', label: 'Avg. plastic used per ₹1 Cr revenue (MT)', category: 'E', inverted: true },
  { key: 'env_material_recycled', label: 'Percentage of total materials recycled', category: 'E' },
  { key: 'env_epr_vpn', label: 'Plastic neutralized either voluntarily or mandated by EPR', category: 'E' },
  { key: 'env_recycled_content', label: 'Recycled content in primary & secondary packaging', category: 'E' },
  { key: 'env_recyclable', label: 'Percentage of packaging that is recyclable', category: 'E' },
];

const ENV_PARAMS_FASHION: ParamDef[] = [
  { key: 'env_fashion_recyclable_materials', label: 'Percentage of materials that are recyclable', category: 'E' },
  { key: 'env_fashion_recyclable_packaging', label: 'Percentage of packaging that is recyclable (Fashion)', category: 'E' },
  { key: 'env_fashion_fresh_water', label: 'Fresh water consumed as percentage of total water', category: 'E', inverted: true },
  { key: 'env_fashion_water_recycled', label: 'Percentage of water recycled', category: 'E' },
];

const NON_ENV_PARAMS: ParamDef[] = [
  // Social (6)
  { key: 'soc_coc_in_place', label: 'Supplier Code of Conduct in place', category: 'S' },
  { key: 'soc_coc_training', label: 'Supplier Code of Conduct training provided', category: 'S' },
  { key: 'soc_dei_vendor', label: 'Vendor diversity, equity & inclusion compliance', category: 'S' },
  { key: 'soc_gender_ratio', label: 'Employee gender diversity ratio', category: 'S' },
  { key: 'soc_women_leadership', label: 'Women in leadership positions', category: 'S' },
  { key: 'soc_pay_parity', label: 'Gender pay parity index', category: 'S' },
  // Governance (3)
  { key: 'gov_policy_adoption', label: 'Percentage of ESG policies adopted', category: 'G' },
  { key: 'gov_training_coverage', label: 'Employee ESG training coverage', category: 'G' },
  { key: 'gov_unresolved_incidents', label: 'Unresolved high-impact incidents', category: 'G', inverted: true },
  // Performance (3)
  { key: 'perf_completeness', label: 'Completeness', category: 'Performance' },
  { key: 'perf_consistency', label: 'Consistency', category: 'Performance' },
  { key: 'perf_timeliness', label: 'Timeliness', category: 'Performance' },
];

function getParamsForCompany(isFashion: boolean, hasEnv: boolean): ParamDef[] {
  const envParams = !hasEnv ? [] : isFashion ? ENV_PARAMS_FASHION : ENV_PARAMS_NON_FASHION;
  return [...envParams, ...NON_ENV_PARAMS];
}

const getGrade = (percentile: number): string => {
  if (percentile >= 80) return 'AA';
  if (percentile >= 60) return 'A';
  if (percentile >= 40) return 'BB';
  if (percentile >= 20) return 'B';
  return 'C';
};

const GRADE_ORDER: Record<string, number> = { 'AA': 5, 'A': 4, 'BB': 3, 'B': 2, 'C': 1 };

const getGradeColor = (grade: string) => {
  switch (grade) {
    case 'AA': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
    case 'A': return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
    case 'BB': return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
    case 'B': return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300';
    case 'C': return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
    default: return 'bg-muted text-muted-foreground';
  }
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  E: <Leaf className="w-3 h-3" />,
  S: <UsersRound className="w-3 h-3" />,
  G: <Shield className="w-3 h-3" />,
  Performance: <Trophy className="w-3 h-3" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  E: 'text-emerald-600',
  S: 'text-blue-600',
  G: 'text-purple-600',
  Performance: 'text-amber-600',
};

/**
 * Compute percentiles for all 18 parameters for every company.
 * Returns Map<companyId, Map<paramKey, percentile>>
 */
function computeAll18Percentiles(
  allCompanies: CompanyRawMetrics[],
  rankings: CompanyRanking[],
  sourcingEnabledIds: Set<string>,
): Map<string, Map<string, number>> {
  const result = new Map<string, Map<string, number>>();
  const submitting = allCompanies.filter(c => Object.keys(c.kpis).length > 0);
  if (submitting.length === 0) return result;

  // Initialize all companies
  submitting.forEach(c => result.set(c.companyId, new Map()));

  // ─── Helper: rank-based percentile assignment ───
  const assignPercentiles = (
    entries: { id: string; score: number; brand: string }[],
    paramKey: string,
    inverted = false,
  ) => {
    if (entries.length === 0) return;
    const sorted = [...entries].sort((a, b) => {
      const aVal = inverted ? -a.score : a.score;
      const bVal = inverted ? -b.score : b.score;
      const diff = aVal - bVal;
      return diff !== 0 ? diff : a.brand.localeCompare(b.brand);
    });
    sorted.forEach((e, idx) => {
      const pctile = sorted.length <= 1 ? 99 : Math.max(1, Math.min(99, Math.round(((idx + 1) / sorted.length) * 99)));
      result.get(e.id)?.set(paramKey, pctile);
    });
  };

  // ─── Environment ───
  // Use the existing env percentile normalization to get component-level percentiles
  const envEligible = submitting.filter(c => c.hasEnvironmentFeature !== false);
  const envData: EnvCompanyData[] = envEligible.map(c => ({
    companyId: c.companyId,
    kpis: c.kpis,
    insights: { ...c.insights },
    usesFashionPackaging: c.usesFashionPackaging,
    hasWaterFeature: (c as any).hasWaterFeature,
    hasEnvironmentFeature: c.hasEnvironmentFeature,
  }));
  const envPercentileMap = applyEnvironmentPercentileNormalization(envData);

  // Map env percentile component names to our param keys
  const ENV_NON_FASHION_MAP: Record<string, string> = {
    'Virgin Plastic Reduction %': 'env_virgin_plastic_reduction',
    'Plastic Intensity Score': 'env_plastic_intensity',
    'Material Recycled %': 'env_material_recycled',
    'EPR/VPN %': 'env_epr_vpn',
    'P&S Recycled/Pkg %': 'env_recycled_content',
    'Recyclable %': 'env_recyclable',
  };
  const ENV_FASHION_MAP: Record<string, string> = {
    'Recyclable Materials %': 'env_fashion_recyclable_materials',
    'Recyclable Packaging %': 'env_fashion_recyclable_packaging',
    'Fresh Water Consumed %': 'env_fashion_fresh_water',
    'Water Recycled %': 'env_fashion_water_recycled',
  };

  envPercentileMap.forEach((comps, cId) => {
    const m = result.get(cId);
    if (!m) return;
    // Determine which mapping based on company type
    const company = envEligible.find(c => c.companyId === cId);
    if (company?.usesFashionPackaging) {
      Object.entries(ENV_FASHION_MAP).forEach(([envKey, paramKey]) => {
        if (comps[envKey] !== undefined) m.set(paramKey, comps[envKey]);
      });
    } else {
      Object.entries(ENV_NON_FASHION_MAP).forEach(([envKey, paramKey]) => {
        if (comps[envKey] !== undefined) m.set(paramKey, comps[envKey]);
      });
    }
  });

  // ─── Social ───
  const socialData: EnvCompanyData[] = submitting.map(c => ({
    companyId: c.companyId,
    kpis: c.kpis,
    insights: { ...c.insights },
    usesFashionPackaging: c.usesFashionPackaging,
    hasEnvironmentFeature: c.hasEnvironmentFeature,
  }));
  applySocialScorePercentileNormalization(socialData, sourcingEnabledIds);

  socialData.forEach(c => {
    const m = result.get(c.companyId);
    if (!m) return;
    const sp = (c.insights as any)?._socialPercentiles;
    if (!sp) return;
    if (sp.hasSourcing) {
      m.set('soc_coc_in_place', sp.cocInPlace);
      m.set('soc_coc_training', sp.cocTraining);
      m.set('soc_dei_vendor', sp.deiPctile);
    }
    m.set('soc_gender_ratio', sp.genderRatioPctile);
    m.set('soc_women_leadership', sp.womenLeadPctile);
    m.set('soc_pay_parity', sp.payParityPctile);
  });

  // ─── Governance (min-max normalization to match drill-down dialog) ───
  const govEntries = submitting.map(c => {
    const govComps = RATIO_COMPONENT_COLUMNS.governanceScore.getValues(c);
    return {
      id: c.companyId,
      brand: c.brand,
      policyAdoption: parseFloat(govComps['Policy Adoption %'] || '0') || 0,
      trainingCoverage: parseFloat(govComps['Training Coverage %'] || '0') || 0,
      highImpact: parseFloat(govComps['High Impact Unresolved %'] || '0') || 0,
    };
  });

  // Min-max normalization helper (mirrors ESGScoreDetailDialog.computeGovPercentiles)
  const assignGovMinMax = (
    entries: typeof govEntries,
    scoreKey: 'policyAdoption' | 'trainingCoverage' | 'highImpact',
    paramKey: string,
    inverted = false,
  ) => {
    const positiveVals = entries.map(e => e[scoreKey]).filter(v => v > 0);
    const min = positiveVals.length > 0 ? Math.min(...positiveVals) : 0;
    const max = positiveVals.length > 0 ? Math.max(...positiveVals) : 0;
    const range = max - min;

    entries.forEach(e => {
      const m = result.get(e.id);
      if (!m) return;
      const v = e[scoreKey];
      let pctile = 0;
      if (inverted && v === 0) {
        pctile = 100; // best outcome (matches drill-down)
      } else if (v > 0 && range > 0) {
        pctile = inverted
          ? ((max - v) / range) * 100
          : ((v - min) / range) * 100;
      } else if (v > 0 && range === 0) {
        pctile = 100;
      }
      m.set(paramKey, Math.round(pctile * 10) / 10);
    });
  };

  assignGovMinMax(govEntries, 'policyAdoption', 'gov_policy_adoption');
  assignGovMinMax(govEntries, 'trainingCoverage', 'gov_training_coverage');
  assignGovMinMax(govEntries, 'highImpact', 'gov_unresolved_incidents', true);

  // ─── Performance ───
  assignPercentiles(
    rankings.map(r => ({ id: r.companyId, score: r.completionPct, brand: r.brand })),
    'perf_completeness',
  );
  assignPercentiles(
    rankings.map(r => ({ id: r.companyId, score: r.consistencyPct, brand: r.brand })),
    'perf_consistency',
  );
  assignPercentiles(
    rankings.map(r => ({ id: r.companyId, score: r.timelinessScore, brand: r.brand })),
    'perf_timeliness',
  );

  return result;
}

/**
 * Categorize parameters into Better / At / Needs Improvement columns.
 */
function categorizeParams(
  companyPercentiles: Map<string, number>,
  mode: BenchmarkMode,
  companyId: string,
  allPercentiles: Map<string, Map<string, number>>,
  allCompanies: CompanyRawMetrics[],
  sourcingEnabledIds: Set<string>,
): { better: ParamDef[]; at: ParamDef[]; needsImprovement: ParamDef[] } {
  const better: ParamDef[] = [];
  const at: ParamDef[] = [];
  const needsImprovement: ParamDef[] = [];

  const company = allCompanies.find(c => c.companyId === companyId);
  const hasSourcing = sourcingEnabledIds.has(companyId);
  const hasEnv = company?.hasEnvironmentFeature !== false;
  const isFashion = company?.usesFashionPackaging === true;
  const params = getParamsForCompany(isFashion, hasEnv);

  // Helper to compute cohort grade for a given param and cohort
  const getCohortGrade = (paramKey: string, cohortIds: string[]): string | null => {
    const pctiles = cohortIds
      .map(pid => allPercentiles.get(pid)?.get(paramKey))
      .filter((v): v is number => v !== undefined);
    if (pctiles.length === 0) return null;
    const avg = pctiles.reduce((s, v) => s + v, 0) / pctiles.length;
    return getGrade(avg);
  };

  // Pre-compute sector and revenue cohort IDs (used for all modes)
  const sectorIds = getCohortIds(companyId, 'sector', allCompanies);
  const revenueIds = getCohortIds(companyId, 'revenue', allCompanies);

  // For the active toggle, determine the primary cohort
  const cohortIds = mode === 'portfolio'
    ? allCompanies.filter(c => Object.keys(c.kpis).length > 0).map(c => c.companyId)
    : mode === 'sector' ? sectorIds : revenueIds;

  params.forEach(param => {
    // Skip sourcing-related social params if not enabled
    if (['soc_coc_in_place', 'soc_coc_training', 'soc_dei_vendor'].includes(param.key) && !hasSourcing) return;

    const myPctile = companyPercentiles.get(param.key);
    if (myPctile === undefined) return;

    const myGrade = getGrade(myPctile);
    const myRank = GRADE_ORDER[myGrade] || 0;

    if (mode === 'portfolio') {
      // For Overall Portfolio: compare against both sector and revenue cohort grades
      // Use the minimum rank (worst grade) so that if the company matches both, it's "at"
      const sectorGrade = getCohortGrade(param.key, sectorIds);
      const revGrade = getCohortGrade(param.key, revenueIds);
      const sectorRank = GRADE_ORDER[sectorGrade || ''] || 0;
      const revRank = GRADE_ORDER[revGrade || ''] || 0;
      // Use the lower of the two cohort ranks as the baseline
      const baselineRank = Math.min(sectorRank, revRank);

      if (myRank > baselineRank) better.push(param);
      else if (myRank === baselineRank) at.push(param);
      else needsImprovement.push(param);
    } else {
      const cohortGrade = getCohortGrade(param.key, cohortIds);
      if (!cohortGrade) {
        at.push(param);
        return;
      }
      const cohortRank = GRADE_ORDER[cohortGrade] || 0;

      if (myRank > cohortRank) better.push(param);
      else if (myRank === cohortRank) at.push(param);
      else needsImprovement.push(param);
    }
  });

  return { better, at, needsImprovement };
}

function getCohortIds(companyId: string, mode: BenchmarkMode, allCompanies: CompanyRawMetrics[]): string[] {
  const company = allCompanies.find(c => c.companyId === companyId);
  if (!company) return [];

  if (mode === 'sector') {
    return allCompanies
      .filter(c => c.industry === company.industry)
      .map(c => c.companyId);
  }
  // revenue
  return allCompanies
    .filter(c => c.revenueStage === company.revenueStage)
    .map(c => c.companyId);
}

export const ESGRecommendationsPanel = ({
  companyId,
  allCompaniesRaw,
  rankings,
  year,
}: ESGRecommendationsPanelProps) => {
//   console.log("companyId in ESGRecommendationsPanel:", companyId);
//   console.log("allCompaniesRaw in ESGRecommendationsPanel:", allCompaniesRaw);
//   console
// .log("rankings in ESGRecommendationsPanel:", rankings);
// console.log("year in ESGRecommendationsPanel:", year);
  const [benchmark, setBenchmark] = useState<BenchmarkMode>('portfolio');

  // Derive sourcingEnabledIds from the social percentile data already computed
  const sourcingEnabledIds = useMemo(() => {
    const ids = new Set<string>();
    allCompaniesRaw.forEach(c => {
      // console.log('Checking sourcing for company:', c.companyId, (c.insights as any)?._socialPercentiles);
      const sp = (c.insights as any)?._socialPercentiles;
      if (sp?.hasSourcing) ids.add(c.companyId);
    });
    return ids;
  }, [allCompaniesRaw]);

  const allPercentiles = useMemo(
    () => computeAll18Percentiles(allCompaniesRaw, rankings, sourcingEnabledIds),
    [allCompaniesRaw, rankings, sourcingEnabledIds],
  );

  const companyPercentiles = allPercentiles.get(companyId) || new Map<string, number>();

  const { better, at, needsImprovement } = useMemo(
    () => categorizeParams(companyPercentiles, benchmark, companyId, allPercentiles, allCompaniesRaw, sourcingEnabledIds),
    [companyPercentiles, benchmark, companyId, allPercentiles, allCompaniesRaw, sourcingEnabledIds],
  );

  const renderParamList = (params: ParamDef[]) => {
    if (params.length === 0) {
      return <p className="text-xs text-muted-foreground italic py-2">No parameters in this category</p>;
    }

    // Group by E/S/G/Performance
    const grouped: Record<string, ParamDef[]> = {};
    params.forEach(p => {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    });

    return (
      <div className="space-y-2">
        {(['E', 'S', 'G', 'Performance'] as const).map(cat => {
          const items = grouped[cat];
          if (!items || items.length === 0) return null;
          return (
            <div key={cat}>
              <div className={`flex items-center gap-1 mb-1 ${CATEGORY_COLORS[cat]}`}>
                {CATEGORY_ICONS[cat]}
                <span className="text-[10px] font-semibold uppercase tracking-wide">
                  {cat === 'E' ? 'Environment' : cat === 'S' ? 'Social' : cat === 'G' ? 'Governance' : 'Performance'}
                </span>
              </div>
              {items.map(p => {
                return (
                  <div key={p.key} className="flex items-center py-0.5">
                    <span className="text-xs text-foreground leading-tight">{p.label}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const columns = [
    {
      title: 'Better than cohort average',
      items: better,
      border: 'border-emerald-200 dark:border-emerald-800',
      bg: 'bg-emerald-50/30 dark:bg-emerald-950/10',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    },
    {
      title: 'At cohort average',
      items: at,
      border: 'border-blue-200 dark:border-blue-800',
      bg: 'bg-blue-50/30 dark:bg-blue-950/10',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    },
    {
      title: 'Needs improvement',
      items: needsImprovement,
      border: 'border-orange-200 dark:border-orange-800',
      bg: 'bg-orange-50/30 dark:bg-orange-950/10',
      badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    },
  ];

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-5 h-5 text-primary" />
            ESG Recommendations
          </CardTitle>
          <RadioGroup
            value={benchmark}
            onValueChange={(v) => setBenchmark(v as BenchmarkMode)}
            className="flex items-center gap-4"
          >
            {[
              { value: 'portfolio', label: 'Overall Portfolio' },
              { value: 'sector', label: 'By Sector' },
              { value: 'revenue', label: 'By Revenue Stage' },
            ].map(opt => (
              <div key={opt.value} className="flex items-center gap-1.5">
                <RadioGroupItem value={opt.value} id={`bench-${opt.value}`} />
                <Label htmlFor={`bench-${opt.value}`} className="text-xs font-medium cursor-pointer">
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {columns.map(col => (
            <div key={col.title} className={`rounded-lg border ${col.border} ${col.bg} p-3`}>
              <h4 className="text-sm font-semibold text-left mb-2">{col.title}</h4>
              {renderParamList(col.items)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

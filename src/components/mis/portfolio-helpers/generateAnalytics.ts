import { groupByCompany, mean, r2, sum } from './helpers';
import { buildAggregations } from './aggregations';
import { environmentalDerived } from './environmentalCalculations';
import { socialDerived } from './socialCalculations';
import { governanceDerived } from './governanceCalculations';
import { computeScores } from './scoreCalculations';
import type { AnalyticsContext, AnalyticsResult, CompanyAnalytics, KPIEntryInput, Period } from './types';

const ENV_FEATURE_KEYS = ['primarySecondaryPackaging', 'waterManagement', 'wasteManagement', 'fashionMaterials', 'energyManagement'];

/**
 * Pure entry point. Given KPI entries and a company context, returns an
 * analytics snapshot. Caller pre-filters entries to the desired period.
 * Optional `period` (unified `Period`) is stamped onto the result — if
 * omitted, the period is inferred from the first entry (legacy behavior).
 */
export function generateAnalytics(
  entries: KPIEntryInput[],
  ctx: AnalyticsContext,
  period?: Period,
): AnalyticsResult {
  const stampedPeriod = period
    ? (period.mode === 'annual'     ? { quarter: 'FY',          year: period.year }
    :  period.mode === 'quarterly'  ? { quarter: period.quarter, year: period.year }
    :  /* cumulative */               { quarter: 'CUMULATIVE',  year: 0 })
    : (entries.length > 0
        ? { quarter: entries[0].quarter, year: entries[0].year }
        : { quarter: '', year: 0 });

  const byCompany = groupByCompany(entries);
  const contextById = new Map(ctx.companies.map(c => [c.id, c]));

  // Ensure every context company is represented (even if no entries → all zeros)
  const companyIds = Array.from(new Set([...byCompany.keys(), ...ctx.companies.map(c => c.id)]));

  const stage1 = companyIds.map(id => {
    const kpis = byCompany.get(id) ?? {};
    const c = contextById.get(id);
    const hasEnv = c ? ENV_FEATURE_KEYS.some(k => c.features[k]) : true;
    const aggregations = buildAggregations(kpis);
    const derived = {
      ...environmentalDerived(aggregations),
      ...socialDerived(aggregations),
      ...governanceDerived(aggregations),
    };
    return { id, name: c?.brand || c?.name || id, hasEnvironmentFeature: hasEnv, aggregations, derived };
  });

  const scoreMap = computeScores(stage1);

  const companies: CompanyAnalytics[] = stage1.map(s => ({
    companyId: s.id,
    companyName: s.name,
    hasEnvironmentFeature: s.hasEnvironmentFeature,
    aggregations: s.aggregations,
    derived: s.derived,
    scores: scoreMap.get(s.id)!,
  }));

  const totals = {
    companyCount: companies.length,
    netRevenue: r2(sum(companies.map(c => c.aggregations.netRevenue))),
    totalEmployees: sum(companies.map(c => c.aggregations.totalEmployees)),
    femaleEmployees: sum(companies.map(c => c.aggregations.femaleEmployees)),
    totalPackagingMT: r2(sum(companies.map(c => c.aggregations.totalPackagingMT))),
    virginPlasticMT: r2(sum(companies.map(c => c.aggregations.virginPlasticMT))),
    recycledPlasticMT: r2(sum(companies.map(c => c.aggregations.recycledPlasticMT))),
    totalWaterKL: r2(sum(companies.map(c => c.aggregations.totalWaterKL))),
    totalEnergyKWh: r2(sum(companies.map(c => c.aggregations.totalEnergyKWh))),
    totalWasteMT: r2(sum(companies.map(c => c.aggregations.totalWasteMT))),
    incidentsTotal: sum(companies.map(c => c.aggregations.incidentsTotal)),
    csrSpendINR: r2(sum(companies.map(c => c.aggregations.csrSpendINR))),
  };

  const averages = {
    environmentScore: r2(mean(companies.map(c => c.scores.environmentScore))),
    socialScore: r2(mean(companies.map(c => c.scores.socialScore))),
    governanceScore: r2(mean(companies.map(c => c.scores.governanceScore))),
    compositeScore: r2(mean(companies.map(c => c.scores.compositeScore))),
    circularEconomyIndex: r2(mean(companies.map(c => c.scores.circularEconomyIndex))),
    deiScore: r2(mean(companies.map(c => c.scores.deiScore))),
    genderDiversityPct: r2(mean(companies.map(c => c.derived.genderDiversityPct))),
    womenInLeadershipPct: r2(mean(companies.map(c => c.derived.womenInLeadershipPct))),
    policyAdoptionPct: r2(mean(companies.map(c => c.derived.policyAdoptionPct))),
    trainingCoveragePct: r2(mean(companies.map(c => c.derived.trainingCoveragePct))),
    recycledContentPct: r2(mean(companies.map(c => c.derived.recycledContentPct))),
    waterRecyclingPct: r2(mean(companies.map(c => c.derived.waterRecyclingPct))),
    renewableEnergyPct: r2(mean(companies.map(c => c.derived.renewableEnergyPct))),
    wasteDiversionPct: r2(mean(companies.map(c => c.derived.wasteDiversionPct))),
  };

  return { period: stampedPeriod, companies, totals, averages };
}

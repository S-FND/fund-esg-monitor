// ══════════════════════════════════════════════════════════════════════════════
// Data-injected variant of usePortfolioRankings.
// The caller supplies already-fetched kpi_entries + company_feature_settings +
// (optional) company_profiles. No network calls happen inside this file.
//
// This file DOES NOT modify the original hook. It duplicates the post-fetch
// processing pipeline so `usePortfolioRankingsFromData` produces the same
// output shape (CompanyRanking[]) as `usePortfolioRankings`.
// ══════════════════════════════════════════════════════════════════════════════
import { useMemo } from 'react';
import { mockCompanies } from '@/data/mockData';
import { FEATURE_FIELD_MAPPINGS } from '@/lib/featureFieldMapping';
import { isCompanyExcluded } from '@/lib/companyExclusions';
import {
  getTotalKPICount,
  ALL_QUARTERLY_FEATURES,
  ALL_ANNUAL_FEATURES,
  ENV_QUARTERLY_FEATURES,
  ENV_ANNUAL_FEATURES,
  SOCIAL_QUARTERLY_FEATURES,
  SOCIAL_ANNUAL_FEATURES,
  GOV_QUARTERLY_FEATURES,
  GOV_ANNUAL_FEATURES,
} from '@/lib/kpiCountUtils';
import { buildQuarterLabels, type PeriodMode } from '@/lib/periodUtils';
import type { CompanyRanking, ESGCompleteness } from './usePortfolioRankings';
import { Company } from '@/types/esg';
// import { buildQuarterLabels, PeriodMode } from '@/lib/periodUtils';

const GENERIC_FIELD_IDS = new Set([
  'cases', 'open_cases', 'impact', 'value', 'count', 'in_place', 'details',
  'type', 'amount', 'list', 'self_number', 'self_names', 'self_validity',
  'supplier_number', 'supplier_names', 'supplier_validity', 'training',
  'training_count', 'total_weight', 'plastic_weight', 'recycled_content',
  'recyclable_pct', 'recycled_pct', 'energy_consumed', 'renewable_pct',
  'water_consumed', 'fresh_water_pct', 'rainwater_pct',
  'epr_targets', 'epr_compliance_pct',
  'waste_generated', 'waste_recycled_pct', 'na',
  'last_update',
]);

const isKPIGroupFilled = (
  kpi: { id: string; fields: { id: string }[] },
  entries: { kpi_id: string; value: string | null }[]
): boolean => {
  const valid = entries.filter(e => e.value !== null && e.value !== '' && e.value.trim() !== '' && !e.kpi_id.endsWith('_additional_comments'));
  if (valid.some(entry => entry.kpi_id === kpi.id)) return true;
  return kpi.fields.some(field =>
    valid.some(entry => {
      if (entry.kpi_id === field.id) return true;
      if (entry.kpi_id === `${kpi.id}_${field.id}`) return true;
      if (GENERIC_FIELD_IDS.has(field.id)) {
        return entry.kpi_id.includes(kpi.id) &&
          (entry.kpi_id.includes(field.id) || entry.kpi_id.endsWith(`_${field.id}`));
      }
      if (entry.kpi_id.endsWith(`_${field.id}`)) return true;
      if (field.id.length >= 12 && entry.kpi_id.includes(field.id)) return true;
      return false;
    })
  );
};

const countFilledKPIs = (featureKeys: string[], entries: { kpi_id: string; value: string | null }[]): number => {
  let count = 0;
  for (const key of featureKeys) {
    const mapping = FEATURE_FIELD_MAPPINGS[key];
    if (!mapping) continue;
    for (const kpi of mapping.kpis) {
      if (kpi.excludeFromProgress) continue;
      if (isKPIGroupFilled(kpi, entries)) count++;
    }
  }
  return count;
};

const r2 = (v: number) => Math.round(v * 100) / 100;

// ══════════════════════════════════════════════════════════════════════════════
export interface PortfolioRankingsInput {
  year: number;
  quarter?: string;
  /** Period mode — 'quarterly' (single quarter or all four) or 'annual' (FY only). Defaults to a full year: Q1..Q4 + FY. */
  period?: PeriodMode;
  /** kpi_entries rows already filtered by year/asOf (fetching stage responsibility). */
  kpiEntries: Array<{ companyId: string; kpi_id: string; value: string | null; quarter: string; submitted_at: string | null }>;
  /** company_feature_settings rows (enabled=true). */
  companyFeatureSettings: Array<{ companyId: string; feature_key: string; enabled: boolean }>;
  /** company_profiles rows — optional, used only for industry lookup. */
  companyProfiles?: Array<Company>;
}

export function computePortfolioRankingsFromData(input: PortfolioRankingsInput): CompanyRanking[] {
  const { year, quarter, period, kpiEntries, companyFeatureSettings, companyProfiles = [] } = input;

  // Determine which period slices to score.
  // - If caller supplies `period`, honour it via buildQuarterLabels (e.g. 'quarterly'+Q1 → ['Q1']; 'annual' → ['FY']).
  // - If neither `period` nor `quarter` given → score the full year (Q1..Q4 + FY) — matches legacy behaviour.
  // - If only `quarter` given → single quarter slice.
  let selectedPeriods: string[];
  if (period) {
    selectedPeriods = buildQuarterLabels({ period, year, quarter });
  } else if (quarter && ['Q1', 'Q2', 'Q3', 'Q4', 'FY'].includes(quarter)) {
    selectedPeriods = [quarter];
  } else {
    selectedPeriods = ['Q1', 'Q2', 'Q3', 'Q4', 'FY'];
  }
  const quarterlySlices = selectedPeriods.filter(p => p !== 'FY');
  const includeFY = selectedPeriods.includes('FY');
  const qMultiplier = quarterlySlices.length; // 0..4

  const profileMap: Record<string, { revenue_stage: string; industry: string }> = {};
  for (const p of companyProfiles) {
    profileMap[p.company_id] = { revenue_stage: (p.revenueStage as string) || '', industry: (p.industry as string) || '' };
  }

  const companies = mockCompanies
    .filter(c => c.investmentStatus === 'Invested')
    .map(c => ({
      company_id: c.id,
      industry: profileMap[c.id]?.industry || c.industry || '',
      brand: c.brand || c.name,
    }));

  const typedEntries = kpiEntries;

  const featureMap: Record<string, Set<string>> = {};
  for (const f of companyFeatureSettings) {
    if (!f.enabled) continue;
    if (!featureMap[f.companyId]) featureMap[f.companyId] = new Set();
    featureMap[f.companyId].add(f.feature_key);
  }

  const raw = companies.map(company => {
    const cEntries = typedEntries.filter(e => e.companyId === company.company_id);
    const enabled = featureMap[company.company_id] || new Set();
    const qFeats = enabled.size > 0 ? ALL_QUARTERLY_FEATURES.filter(k => enabled.has(k)) : ALL_QUARTERLY_FEATURES;
    const aFeats = enabled.size > 0 ? ALL_ANNUAL_FEATURES.filter(k => enabled.has(k)) : ALL_ANNUAL_FEATURES;

    const qFeats2 = qFeats;
    const aFeats2 = aFeats;
    const totalKPIs = getTotalKPICount(qFeats2) * qMultiplier + (includeFY ? getTotalKPICount(aFeats2) : 0);

    let totalFilled = 0;
    let adjustedTotalKPIs = totalKPIs;

    const envQFeats = qFeats.filter(k => ENV_QUARTERLY_FEATURES.includes(k));
    const envAFeats = aFeats.filter(k => ENV_ANNUAL_FEATURES.includes(k));
    const socQFeats = qFeats.filter(k => SOCIAL_QUARTERLY_FEATURES.includes(k));
    const socAFeats = aFeats.filter(k => SOCIAL_ANNUAL_FEATURES.includes(k));
    const govQFeats = qFeats.filter(k => GOV_QUARTERLY_FEATURES.includes(k));
    const govAFeats = aFeats.filter(k => GOV_ANNUAL_FEATURES.includes(k));

    let envTotal = getTotalKPICount(envQFeats) * qMultiplier + (includeFY ? getTotalKPICount(envAFeats) : 0);
    let envFilled = 0;
    let socTotal = getTotalKPICount(socQFeats) * qMultiplier + (includeFY ? getTotalKPICount(socAFeats) : 0);
    let socFilled = 0;
    let govTotal = getTotalKPICount(govQFeats) * qMultiplier + (includeFY ? getTotalKPICount(govAFeats) : 0);
    let govFilled = 0;

    for (const p of selectedPeriods) {
      if (isCompanyExcluded(company.company_id, p, year)) {
        if (p !== 'FY') {
          adjustedTotalKPIs -= getTotalKPICount(qFeats);
          envTotal -= getTotalKPICount(envQFeats);
          socTotal -= getTotalKPICount(socQFeats);
          govTotal -= getTotalKPICount(govQFeats);
        }
        continue;
      }
      const pEntries = cEntries.filter(e => e.quarter === p);
      totalFilled += countFilledKPIs(p === 'FY' ? aFeats : qFeats, pEntries);

      if (p === 'FY') {
        envFilled += countFilledKPIs(envAFeats, pEntries);
        socFilled += countFilledKPIs(socAFeats, pEntries);
        govFilled += countFilledKPIs(govAFeats, pEntries);
      } else {
        envFilled += countFilledKPIs(envQFeats, pEntries);
        socFilled += countFilledKPIs(socQFeats, pEntries);
        govFilled += countFilledKPIs(govQFeats, pEntries);
      }
    }
    const completionPct = adjustedTotalKPIs > 0 ? r2((totalFilled / adjustedTotalKPIs) * 100) : 0;

    const esgCompleteness: ESGCompleteness = {
      E: envTotal > 0 ? r2((envFilled / envTotal) * 100) : 0,
      S: socTotal > 0 ? r2((socFilled / socTotal) * 100) : 0,
      G: govTotal > 0 ? r2((govFilled / govTotal) * 100) : 0,
      overall: completionPct,
    };

    // Consistency
    const qKPIDefs: { kpiId: string; fieldIds: string[] }[] = [];
    for (const fk of qFeats) {
      const m = FEATURE_FIELD_MAPPINGS[fk];
      if (!m) continue;
      for (const kpi of m.kpis) {
        if (kpi.excludeFromProgress) continue;
        qKPIDefs.push({ kpiId: kpi.id, fieldIds: kpi.fields.map(f => f.id) });
      }
    }
    let consistencyRatio = 0;
    const consistencyQuartersBase = quarterlySlices.length > 0 ? quarterlySlices : ['Q1', 'Q2', 'Q3', 'Q4'];
    const eligibleQuarters = consistencyQuartersBase.filter(q => !isCompanyExcluded(company.company_id, q, year));
    const eligibleCount = eligibleQuarters.length || 1;
    for (const kpiDef of qKPIDefs) {
      let qWithData = 0;
      for (const q of eligibleQuarters) {
        const qE = cEntries.filter(e => e.quarter === q);
        if (isKPIGroupFilled({ id: kpiDef.kpiId, fields: kpiDef.fieldIds.map(id => ({ id })) }, qE)) qWithData++;
      }
      consistencyRatio += qWithData / eligibleCount;
    }
    const consistencyPct = qKPIDefs.length > 0 ? r2((consistencyRatio / qKPIDefs.length) * 100) : 0;

    // Timeliness
    const deadlineYear = year + 1;
    const TIMELINESS_CUTOFF = new Date(deadlineYear, 2, 3, 23, 59, 59).getTime();
    const periods = selectedPeriods;
    const firstSubmissionPerPeriod: number[] = [];
    for (const p of periods) {
      if (isCompanyExcluded(company.company_id, p, year)) continue;
      const periodSubs = cEntries
        .filter(e => e.quarter === p && e.submitted_at)
        .map(e => new Date(e.submitted_at!).getTime())
        .filter(d => !isNaN(d) && d <= TIMELINESS_CUTOFF);
      if (periodSubs.length > 0) {
        firstSubmissionPerPeriod.push(Math.min(...periodSubs));
      }
    }

    let timelinessScore = 0;
    if (firstSubmissionPerPeriod.length > 0) {
      const effectiveDate = Math.max(...firstSubmissionPerPeriod);
      const feb4 = new Date(deadlineYear, 1, 4).getTime();
      const feb20 = new Date(deadlineYear, 1, 20).getTime();
      const feb24 = new Date(deadlineYear, 1, 24).getTime();

      if (effectiveDate <= feb4) {
        timelinessScore = 100;
      } else if (effectiveDate <= feb20) {
        const daysSinceFeb4 = (effectiveDate - feb4) / (1000 * 60 * 60 * 24);
        timelinessScore = Math.max(90, 100 - (daysSinceFeb4 / 16) * 10);
      } else if (effectiveDate <= feb24) {
        const daysSinceFeb20 = (effectiveDate - feb20) / (1000 * 60 * 60 * 24);
        timelinessScore = Math.max(70, 90 - (daysSinceFeb20 / 4) * 20);
      } else {
        const daysLate = (effectiveDate - feb24) / (1000 * 60 * 60 * 24);
        timelinessScore = Math.max(0, 70 - daysLate);
      }
    }

    timelinessScore = r2(timelinessScore);

    return {
      companyId: company.company_id,
      companyName: company.brand,
      brand: company.brand,
      industry: company.industry,
      completionPct,
      consistencyPct,
      timelinessScore,
      esgCompleteness,
    };
  });

  const assignPercentiles = (items: typeof raw, getScore: (r: typeof raw[0]) => number): Map<string, number> => {
    const sorted = [...items].sort((a, b) => {
      const diff = getScore(a) - getScore(b);
      return diff !== 0 ? diff : a.brand.localeCompare(b.brand);
    });
    const n = sorted.length;
    const result = new Map<string, number>();
    sorted.forEach((r, idx) => {
      result.set(r.companyId, n <= 1 ? 99 : Math.max(1, Math.min(99, Math.round(((idx + 1) / n) * 99))));
    });
    return result;
  };

  const completionPctiles = assignPercentiles(raw, r => r.completionPct);
  const consistencyPctiles = assignPercentiles(raw, r => r.consistencyPct);
  const timelinessPctiles = assignPercentiles(raw, r => r.timelinessScore);

  return raw.map(r => ({
    ...r,
    completenessPercentile: completionPctiles.get(r.companyId) || 1,
    consistencyPercentile: consistencyPctiles.get(r.companyId) || 1,
    timelinessPercentile: timelinessPctiles.get(r.companyId) || 1,
  }));
}

export const usePortfolioRankingsFromData = (params: PortfolioRankingsInput): { rankings: CompanyRanking[]; isLoading: boolean } => {
  const rankings = useMemo(
    () => computePortfolioRankingsFromData(params),
    [params.year, params.quarter, params.kpiEntries, params.companyFeatureSettings, params.companyProfiles],
  );
  return { rankings, isLoading: false };
};

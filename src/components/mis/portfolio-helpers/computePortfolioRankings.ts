/**
 * computePortfolioRankings — STANDALONE PORTFOLIO RANKINGS HELPER
 *
 * A pure function. NO imports from any project file. NO API calls, no hooks, no
 * side effects. The caller supplies every piece of data (companies, entries,
 * feature mappings, exclusions, optional as-of cutoff) and receives back the
 * four ranking scores (Overall / Completeness / Consistency / Timeliness) plus
 * percentile ranks and AA-C grades — matching the numbers rendered by the
 * Admin Dashboard's Company Rankings panel.
 *
 * Usage:
 *   const { result } = computePortfolioRankings({
 *     companies,           // [{ id, name, brand, industry, enabledFeatures }]
 *     entries,             // [{ companyId, kpiId, value, quarter, year, submittedAt }]
 *     featureMappings,     // { featureKey: { kpis: [{ id, fields: [{ id }], excludeFromProgress? }] } }
 *     year: 2025,
 *     isExcluded: (cid, q, y) => boolean,   // optional
 *     asOf: { month: 12, year: 2025 },      // optional
 *   });
 */

import type {
  ComputePortfolioRankingsInput,
  PortfolioRankingsResult,
  CompanyRankingOutput,
  KPIEntryInput,
  FeatureMappingsInput,
  KPIDefinition,
  AsOfCutoff,
} from './types';

// ─── Defaults (match Admin Dashboard's usePortfolioRankings) ───

const DEFAULT_ALL_QUARTERLY_FEATURES = [
  'businessInformation', 'social', 'sourcingFulfillment',
  'primarySecondaryPackaging', 'fashionMaterials', 'incidentLog',
  'productServiceCertifications', 'healthCare',
];
const DEFAULT_ALL_ANNUAL_FEATURES = [
  'operations', 'governancePolicies', 'certifications', 'csr',
  'sri', 'externalReporting', 'energyManagement', 'waterManagement', 'wasteManagement',
];
const DEFAULT_ENV_QUARTERLY = ['primarySecondaryPackaging', 'fashionMaterials'];
const DEFAULT_ENV_ANNUAL = ['energyManagement', 'waterManagement', 'wasteManagement'];
const DEFAULT_SOCIAL_QUARTERLY = ['social', 'sourcingFulfillment', 'incidentLog', 'healthCare', 'productServiceCertifications'];
const DEFAULT_SOCIAL_ANNUAL = ['operations', 'csr'];
const DEFAULT_GOV_QUARTERLY: string[] = [];
const DEFAULT_GOV_ANNUAL = ['governancePolicies', 'certifications', 'sri', 'externalReporting'];

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

const r2 = (v: number) => Math.round(v * 100) / 100;

// ─── KPI-count helpers ───

const getTotalKPICount = (featureKeys: string[], mappings: FeatureMappingsInput): number => {
  let count = 0;
  for (const key of featureKeys) {
    const mapping = mappings[key];
    if (mapping) count += mapping.kpis.filter(k => !k.excludeFromProgress).length;
  }
  return count;
};

const isKPIGroupFilled = (
  kpi: { id: string; fields: { id: string }[] },
  entries: { kpiId: string; value: string | null }[],
): boolean => {
  const valid = entries.filter(e =>
    e.value !== null &&
    e.value !== '' &&
    (e.value as string).trim() !== '' &&
    !e.kpiId.endsWith('_additional_comments'),
  );

  if (valid.some(e => e.kpiId === kpi.id)) return true;

  return kpi.fields.some(field =>
    valid.some(entry => {
      if (entry.kpiId === field.id) return true;
      if (entry.kpiId === `${kpi.id}_${field.id}`) return true;
      if (GENERIC_FIELD_IDS.has(field.id)) {
        return entry.kpiId.includes(kpi.id) &&
          (entry.kpiId.includes(field.id) || entry.kpiId.endsWith(`_${field.id}`));
      }
      if (entry.kpiId.endsWith(`_${field.id}`)) return true;
      if (field.id.length >= 12 && entry.kpiId.includes(field.id)) return true;
      return false;
    }),
  );
};

const countFilledKPIs = (
  featureKeys: string[],
  entries: { kpiId: string; value: string | null }[],
  mappings: FeatureMappingsInput,
): number => {
  let count = 0;
  for (const key of featureKeys) {
    const mapping = mappings[key];
    if (!mapping) continue;
    for (const kpi of mapping.kpis) {
      if (kpi.excludeFromProgress) continue;
      if (isKPIGroupFilled(kpi, entries)) count++;
    }
  }
  return count;
};

// ─── As-of cutoff (drops entries from periods whose deadline is past cutoff) ───
// Mirrors isPeriodAfterCutoff logic: a period is "after cutoff" if its natural
// reporting deadline falls after the as-of month/year.
const PERIOD_DEADLINE_MONTH: Record<string, number> = {
  Q1: 4,   // Apr
  Q2: 7,   // Jul
  Q3: 10,  // Oct
  Q4: 1,   // Jan (of next year)
  FY: 3,   // Mar (of next year)
  Annual: 3,
};

const isEntryAfterCutoff = (quarter: string, year: number, cutoff: AsOfCutoff): boolean => {
  const dMonth = PERIOD_DEADLINE_MONTH[quarter];
  if (!dMonth) return false;
  const dYear = quarter === 'Q4' || quarter === 'FY' || quarter === 'Annual' ? year + 1 : year;
  return (dYear > cutoff.year) || (dYear === cutoff.year && dMonth > cutoff.month);
};

// ─── Percentile (matches Admin Dashboard's assignPercentiles) ───
// Sort ASC by score, alphabetical brand tie-break, percentile = round(((idx+1)/n)*99), clamp [1,99].
const assignPercentiles = <T extends { companyId: string; brand: string }>(
  items: T[],
  getScore: (r: T) => number,
): Map<string, number> => {
  const sorted = [...items].sort((a, b) => {
    const diff = getScore(a) - getScore(b);
    return diff !== 0 ? diff : a.brand.localeCompare(b.brand);
  });
  const n = sorted.length;
  const out = new Map<string, number>();
  sorted.forEach((r, idx) => {
    out.set(r.companyId, n <= 1 ? 99 : Math.max(1, Math.min(99, Math.round(((idx + 1) / n) * 99))));
  });
  return out;
};

// ─── Grade thresholds ───
const scoreToGrade = (score: number): 'AA' | 'A' | 'BB' | 'B' | 'C' => {
  if (score >= 80) return 'AA';
  if (score >= 60) return 'A';
  if (score >= 40) return 'BB';
  if (score >= 20) return 'B';
  return 'C';
};

// ─── Main helper ───

export function computePortfolioRankings(
  input: ComputePortfolioRankingsInput,
): { result: PortfolioRankingsResult } {
  const {
    companies,
    entries,
    featureMappings,
    year,
    isExcluded,
    asOf,
    categories,
  } = input;

  const ALL_Q = categories?.allQuarterlyFeatures ?? DEFAULT_ALL_QUARTERLY_FEATURES;
  const ALL_A = categories?.allAnnualFeatures ?? DEFAULT_ALL_ANNUAL_FEATURES;
  const ENV_Q = categories?.envQuarterlyFeatures ?? DEFAULT_ENV_QUARTERLY;
  const ENV_A = categories?.envAnnualFeatures ?? DEFAULT_ENV_ANNUAL;
  const SOC_Q = categories?.socialQuarterlyFeatures ?? DEFAULT_SOCIAL_QUARTERLY;
  const SOC_A = categories?.socialAnnualFeatures ?? DEFAULT_SOCIAL_ANNUAL;
  const GOV_Q = categories?.govQuarterlyFeatures ?? DEFAULT_GOV_QUARTERLY;
  const GOV_A = categories?.govAnnualFeatures ?? DEFAULT_GOV_ANNUAL;

  const excludedFn = isExcluded ?? (() => false);

  // Apply as-of filter up front
  const filteredEntries: KPIEntryInput[] = asOf
    ? entries.filter(e => !isEntryAfterCutoff(e.quarter, year, asOf))
    : entries.slice();

  // Index entries per company
  const entriesByCompany: Record<string, KPIEntryInput[]> = {};
  for (const e of filteredEntries) {
    if (e.year !== year) continue;
    if (!entriesByCompany[e.companyId]) entriesByCompany[e.companyId] = [];
    entriesByCompany[e.companyId].push(e);
  }

  const raw = companies.map(company => {
    const cEntries = entriesByCompany[company.id] || [];
    const enabled = new Set(company.enabledFeatures || []);
    const qFeats = enabled.size > 0 ? ALL_Q.filter(k => enabled.has(k)) : ALL_Q;
    const aFeats = enabled.size > 0 ? ALL_A.filter(k => enabled.has(k)) : ALL_A;
    const totalKPIs = getTotalKPICount(qFeats, featureMappings) * 4 + getTotalKPICount(aFeats, featureMappings);

    let totalFilled = 0;
    let adjustedTotalKPIs = totalKPIs;

    const envQFeats = qFeats.filter(k => ENV_Q.includes(k));
    const envAFeats = aFeats.filter(k => ENV_A.includes(k));
    const socQFeats = qFeats.filter(k => SOC_Q.includes(k));
    const socAFeats = aFeats.filter(k => SOC_A.includes(k));
    const govQFeats = qFeats.filter(k => GOV_Q.includes(k));
    const govAFeats = aFeats.filter(k => GOV_A.includes(k));

    let envTotal = getTotalKPICount(envQFeats, featureMappings) * 4 + getTotalKPICount(envAFeats, featureMappings);
    let envFilled = 0;
    let socTotal = getTotalKPICount(socQFeats, featureMappings) * 4 + getTotalKPICount(socAFeats, featureMappings);
    let socFilled = 0;
    let govTotal = getTotalKPICount(govQFeats, featureMappings) * 4 + getTotalKPICount(govAFeats, featureMappings);
    let govFilled = 0;

    for (const p of ['Q1', 'Q2', 'Q3', 'Q4', 'FY']) {
      if (excludedFn(company.id, p, year)) {
        if (p !== 'FY') {
          adjustedTotalKPIs -= getTotalKPICount(qFeats, featureMappings);
          envTotal -= getTotalKPICount(envQFeats, featureMappings);
          socTotal -= getTotalKPICount(socQFeats, featureMappings);
          govTotal -= getTotalKPICount(govQFeats, featureMappings);
        }
        continue;
      }
      const pEntries = cEntries.filter(e => e.quarter === p);
      totalFilled += countFilledKPIs(p === 'FY' ? aFeats : qFeats, pEntries, featureMappings);

      if (p === 'FY') {
        envFilled += countFilledKPIs(envAFeats, pEntries, featureMappings);
        socFilled += countFilledKPIs(socAFeats, pEntries, featureMappings);
        govFilled += countFilledKPIs(govAFeats, pEntries, featureMappings);
      } else {
        envFilled += countFilledKPIs(envQFeats, pEntries, featureMappings);
        socFilled += countFilledKPIs(socQFeats, pEntries, featureMappings);
        govFilled += countFilledKPIs(govQFeats, pEntries, featureMappings);
      }
    }
    const completionPct = adjustedTotalKPIs > 0 ? r2((totalFilled / adjustedTotalKPIs) * 100) : 0;

    // ─── Consistency ───
    const qKPIDefs: { kpiId: string; fieldIds: string[] }[] = [];
    for (const fk of qFeats) {
      const m = featureMappings[fk];
      if (!m) continue;
      for (const kpi of m.kpis) {
        if (kpi.excludeFromProgress) continue;
        qKPIDefs.push({ kpiId: kpi.id, fieldIds: kpi.fields.map(f => f.id) });
      }
    }
    const eligibleQuarters = ['Q1', 'Q2', 'Q3', 'Q4'].filter(q => !excludedFn(company.id, q, year));
    const eligibleCount = eligibleQuarters.length || 1;
    let consistencyRatio = 0;
    for (const kpiDef of qKPIDefs) {
      let qWithData = 0;
      for (const q of eligibleQuarters) {
        const qE = cEntries.filter(e => e.quarter === q);
        if (isKPIGroupFilled({ id: kpiDef.kpiId, fields: kpiDef.fieldIds.map(id => ({ id })) }, qE)) qWithData++;
      }
      consistencyRatio += qWithData / eligibleCount;
    }
    const consistencyPct = qKPIDefs.length > 0 ? r2((consistencyRatio / qKPIDefs.length) * 100) : 0;

    // ─── Timeliness ───
    const deadlineYear = year + 1;
    const TIMELINESS_CUTOFF = new Date(deadlineYear, 2, 3, 23, 59, 59).getTime();
    const periods = ['Q1', 'Q2', 'Q3', 'Q4', 'FY'];
    const firstSubmissionPerPeriod: number[] = [];
    for (const p of periods) {
      if (excludedFn(company.id, p, year)) continue;
      const periodSubs = cEntries
        .filter(e => e.quarter === p && e.submittedAt)
        .map(e => new Date(e.submittedAt as string).getTime())
        .filter(d => !isNaN(d) && d <= TIMELINESS_CUTOFF);
      if (periodSubs.length > 0) firstSubmissionPerPeriod.push(Math.min(...periodSubs));
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
      companyId: company.id,
      companyName: company.brand || company.name,
      brand: company.brand || company.name,
      industry: company.industry || '',
      completionPct,
      consistencyPct,
      timelinessScore,
      esgCompleteness: {
        E: envTotal > 0 ? r2((envFilled / envTotal) * 100) : 0,
        S: socTotal > 0 ? r2((socFilled / socTotal) * 100) : 0,
        G: govTotal > 0 ? r2((govFilled / govTotal) * 100) : 0,
        overall: completionPct,
      },
    };
  });

  // ─── Percentiles ───
  const completionPctiles = assignPercentiles(raw, r => r.completionPct);
  const consistencyPctiles = assignPercentiles(raw, r => r.consistencyPct);
  const timelinessPctiles = assignPercentiles(raw, r => r.timelinessScore);

  // ─── Overall = average of the three percentiles ───
  const perCompany: CompanyRankingOutput[] = raw.map(r => {
    const cp = completionPctiles.get(r.companyId) || 1;
    const csp = consistencyPctiles.get(r.companyId) || 1;
    const tp = timelinessPctiles.get(r.companyId) || 1;
    const overallScore = r2((cp + csp + tp) / 3);
    return {
      ...r,
      completenessPercentile: cp,
      consistencyPercentile: csp,
      timelinessPercentile: tp,
      overallScore,
      overallPercentile: 0, // set below
      grade: scoreToGrade(overallScore),
    };
  });

  // Overall percentile ranks each company against the cohort's overall scores
  const overallPctiles = assignPercentiles(
    perCompany.map(c => ({ companyId: c.companyId, brand: c.brand, overallScore: c.overallScore })),
    r => r.overallScore,
  );
  perCompany.forEach(c => {
    c.overallPercentile = overallPctiles.get(c.companyId) || 1;
  });

  // ─── Summary ───
  const avg = (get: (c: CompanyRankingOutput) => number) =>
    perCompany.length === 0 ? 0 : r2(perCompany.reduce((s, c) => s + get(c), 0) / perCompany.length);

  const gradeCounts: Record<'AA' | 'A' | 'BB' | 'B' | 'C', number> = { AA: 0, A: 0, BB: 0, B: 0, C: 0 };
  perCompany.forEach(c => { gradeCounts[c.grade]++; });

  const result: PortfolioRankingsResult = {
    perCompany,
    summary: {
      totalCompanies: perCompany.length,
      avgCompletenessScore: avg(c => c.completionPct),
      avgConsistencyScore: avg(c => c.consistencyPct),
      avgTimelinessScore: avg(c => c.timelinessScore),
      avgOverallScore: r2(
        (avg(c => c.completionPct) + avg(c => c.consistencyPct) + avg(c => c.timelinessScore)) / 3,
      ),
      avgCompletenessPercentile: avg(c => c.completenessPercentile),
      avgConsistencyPercentile: avg(c => c.consistencyPercentile),
      avgTimelinessPercentile: avg(c => c.timelinessPercentile),
      avgOverallPercentile: avg(c => c.overallPercentile),
      gradeCounts,
    },
  };

  return { result };
}

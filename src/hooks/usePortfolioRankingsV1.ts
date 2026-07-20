import { useEffect, useState } from "react";
import { ALL_ANNUAL_FEATURES, ALL_QUARTERLY_FEATURES, CompanyProfileRaw, CompanyRanking, countFilledKPIs, ENV_ANNUAL_FEATURES, ENV_QUARTERLY_FEATURES, ESGCompleteness, FeatureSettingRaw, getTotalKPICount, GOV_ANNUAL_FEATURES, GOV_QUARTERLY_FEATURES, isKPIGroupFilled, KpiEntryRaw, SOCIAL_ANNUAL_FEATURES, SOCIAL_QUARTERLY_FEATURES } from "./usePortfolioRankings";
import { isPeriodAfterCutoff, useAsOf } from "@/contexts/AsOfContext";
import { http } from "@/utils/httpInterceptor";
import { mockCompanies } from "@/data/mockData";
import { isCompanyExcluded } from "@/lib/companyExclusions";
import { FEATURE_FIELD_MAPPINGS } from "@/lib/featureFieldMapping";
import { AnalyticsFilters, r2 } from "./useAnalyticsDashboardData";

export const usePortfolioRankingsV1 = (
    year: number = 2025,
    quarter: string = 'Q4',
    cumulative: boolean = false,
    filters:AnalyticsFilters 
  ) => {
    const [rankings, setRankings] = useState<CompanyRanking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { asOf } = useAsOf();
  
    // useEffect(() => {
    //   ... (old commented-out block left untouched) ...
    // }, [year, quarter, asOf?.month, asOf?.year]);
  
    useEffect(() => {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          // Helpers to determine which periods/quarters apply for the given year.
          // 2026 → Q1 only (completeness, consistency, timeliness all restricted to Q1).
          const getApplicablePeriods = (y: number): string[] => {
            if (y === 2026) return ['Q1'];
            return ['Q1', 'Q2', 'Q3', 'Q4', 'FY'];
          };
  
          const getApplicableQuarters = (y: number): string[] => {
            if (y === 2026) return ['Q1'];
            return ['Q1', 'Q2', 'Q3', 'Q4'];
          };
  
          // 1. Fetch all data in parallel from NestJS MongoDB backend
          const yearsQuery = cumulative && year === 2025 ? `${year},${year + 1}` : `${year}`;
  
          let profilesRes = await http.get<CompanyProfileRaw[]>('mis/company-profiles');
          let entriesRes = await http.get<KpiEntryRaw[]>(`mis/kpi-entries?years=${yearsQuery}`);
          let featuresRes = await http.get<FeatureSettingRaw[]>('mis/company-feature-settings?enabled=true');
          //console.log('Fetched data:', { profiles: profilesRes.data, entries: entriesRes.data, features: featuresRes.data });
  
          const profilesData = profilesRes.data;
          const allEntries = entriesRes.data;
          const allFeatures = featuresRes.data;
  
          // 2. Build profile lookup: companyId → { revenue_stage, industry }
          const profileMap: Record<string, { revenue_stage: string; industry: string }> = {};
          for (const p of profilesData) {
            profileMap[p.companyId] = {
              revenue_stage: p.revenueStage,
              industry: p.industry,
            };
          }
  
          // 3. Build company list from mockCompanies (invested only)
          const companies = mockCompanies
            .filter(c => c.investmentStatus === 'Invested')
            .map(c => ({
              companyId: c.id,
              industry: profileMap[c.id]?.industry || c.industry || '',
              brand: c.brand || c.name,
            }));
  
          // 4. Apply "As of <Month>/<Year>" cutoff filter on entries
          const typedEntries: KpiEntryRaw[] = asOf
            ? allEntries.filter(e => !isPeriodAfterCutoff(e.quarter, e.year, asOf))
            : allEntries;
  
          // 5. Build feature map: companyId → Set<featureKey>
          const featureMap: Record<string, Set<string>> = {};
          for (const f of allFeatures) {
            if (!featureMap[f.companyId]) featureMap[f.companyId] = new Set();
            featureMap[f.companyId].add(f.feature_key);
          }
  
          //console.log('Processed data:', { companies, typedEntries, featureMap });
  
          // 6. Compute raw scores per company (completeness, consistency, timeliness)
          const raw = companies.map(company => {
            const cEntries = typedEntries.filter(e =>
              e.companyId === company.companyId &&
              (e.year === year || (cumulative && year === 2025 && e.quarter === 'Q1' && e.year === year + 1))
            );
            const enabled = featureMap[company.companyId] || new Set();
  
            const qFeats = enabled.size > 0
              ? ALL_QUARTERLY_FEATURES.filter(k => enabled.has(k))
              : ALL_QUARTERLY_FEATURES;
            const aFeats = enabled.size > 0
              ? ALL_ANNUAL_FEATURES.filter(k => enabled.has(k))
              : ALL_ANNUAL_FEATURES;
  
            // Determine applicable periods for this year (2026 → Q1 only)
            const periodsForYear = getApplicablePeriods(year);
            const quarterMultiplier = periodsForYear.filter(p => p !== 'FY').length; // 1 for 2026, 4 otherwise
            const includesFY = periodsForYear.includes('FY');
  
            const totalKPIs = getTotalKPICount(qFeats) * quarterMultiplier + (includesFY ? getTotalKPICount(aFeats) : 0);
  
            let totalFilled = 0;
            let adjustedTotalKPIs = totalKPIs;
  
            // Per-ESG category feature sets
            const envQFeats = qFeats.filter(k => ENV_QUARTERLY_FEATURES.includes(k));
            const envAFeats = aFeats.filter(k => ENV_ANNUAL_FEATURES.includes(k));
            const socQFeats = qFeats.filter(k => SOCIAL_QUARTERLY_FEATURES.includes(k));
            const socAFeats = aFeats.filter(k => SOCIAL_ANNUAL_FEATURES.includes(k));
            const govQFeats = qFeats.filter(k => GOV_QUARTERLY_FEATURES.includes(k));
            const govAFeats = aFeats.filter(k => GOV_ANNUAL_FEATURES.includes(k));
  
            let envTotal = getTotalKPICount(envQFeats) * quarterMultiplier + (includesFY ? getTotalKPICount(envAFeats) : 0);
            let envFilled = 0;
            let socTotal = getTotalKPICount(socQFeats) * quarterMultiplier + (includesFY ? getTotalKPICount(socAFeats) : 0);
            let socFilled = 0;
            let govTotal = getTotalKPICount(govQFeats) * quarterMultiplier + (includesFY ? getTotalKPICount(govAFeats) : 0);
            let govFilled = 0;
  
            const isPeriodExcluded = (period: string) => {
              if (period === 'Q1' && cumulative && year === 2025) {
                return (
                  isCompanyExcluded(company.companyId, period, year) &&
                  isCompanyExcluded(company.companyId, period, year + 1)
                );
              }
              return isCompanyExcluded(company.companyId, period, year);
            };
  
            // 6a. Completeness — per period, skip excluded quarters
            for (const p of periodsForYear) {
              if (isPeriodExcluded(p)) {
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
  
            const completionPct = adjustedTotalKPIs > 0
              ? r2((totalFilled / adjustedTotalKPIs) * 100)
              : 0;
  
            const esgCompleteness: ESGCompleteness = {
              E: envTotal > 0 ? r2((envFilled / envTotal) * 100) : 0,
              S: socTotal > 0 ? r2((socFilled / socTotal) * 100) : 0,
              G: govTotal > 0 ? r2((govFilled / govTotal) * 100) : 0,
              overall: completionPct,
            };
  
            // 6b. Consistency — across non-excluded quarters (2026 → Q1 only)
            const qKPIDefs: { kpiId: string; fieldIds: string[] }[] = [];
            for (const fk of qFeats) {
              const m = FEATURE_FIELD_MAPPINGS[fk];
              if (!m) continue;
              for (const kpi of m.kpis) {
                if (kpi.excludeFromProgress) continue;
                qKPIDefs.push({ kpiId: kpi.id, fieldIds: kpi.fields.map(f => f.id) });
              }
            }
  
            const eligibleQuarters = getApplicableQuarters(year).filter(
              q => !isPeriodExcluded(q)
            );
            const eligibleCount = eligibleQuarters.length || 1;
            let consistencyRatio = 0;
  
            for (const kpiDef of qKPIDefs) {
              let qWithData = 0;
              for (const q of eligibleQuarters) {
                const qEntries = cEntries.filter(e => e.quarter === q);
                if (isKPIGroupFilled(
                  { id: kpiDef.kpiId, fields: kpiDef.fieldIds.map(id => ({ id })) },
                  qEntries
                )) qWithData++;
              }
              consistencyRatio += qWithData / eligibleCount;
            }
  
            const consistencyPct = qKPIDefs.length > 0
              ? r2((consistencyRatio / qKPIDefs.length) * 100)
              : 0;
  
            // 6c. Timeliness — first submission per period, capped at March 3 of next year
            const deadlineYear = year + 1;
            const TIMELINESS_CUTOFF = new Date(deadlineYear, 2, 3, 23, 59, 59).getTime();
            const feb4 = new Date(deadlineYear, 1, 4).getTime();
            const feb20 = new Date(deadlineYear, 1, 20).getTime();
            const feb24 = new Date(deadlineYear, 1, 24).getTime();
  
            const firstSubmissionPerPeriod: number[] = [];
            for (const p of periodsForYear) {
              if (isCompanyExcluded(company.companyId, p, year)) continue;
              const periodSubs = cEntries
                .filter(e => e.quarter === p && e.submitted_at)
                .map(e => new Date(e.submitted_at!).getTime())
                .filter(d => !isNaN(d) && d <= TIMELINESS_CUTOFF);
              if (periodSubs.length > 0) firstSubmissionPerPeriod.push(Math.min(...periodSubs));
            }
  
            let timelinessScore = 0;
            if (firstSubmissionPerPeriod.length > 0) {
              const effectiveDate = Math.max(...firstSubmissionPerPeriod);
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
  
            return {
              companyId: company.companyId,
              companyName: company.brand,
              brand: company.brand,
              industry: company.industry,
              completionPct,
              consistencyPct,
              timelinessScore: r2(timelinessScore),
              esgCompleteness,
            };
          });
  
          // 7. Assign percentiles (ascending sort, deterministic tie-break by brand)
          const assignPercentiles = (
            items: typeof raw,
            getScore: (r: typeof raw[0]) => number
          ): Map<string, number> => {
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
  
          // 8. Merge percentiles into final ranked list
          const ranked: CompanyRanking[] = raw.map(r => ({
            ...r,
            completenessPercentile: completionPctiles.get(r.companyId) || 1,
            consistencyPercentile: consistencyPctiles.get(r.companyId) || 1,
            timelinessPercentile: timelinessPctiles.get(r.companyId) || 1,
          }));
  
          setRankings(ranked);
        } catch (err) {
          console.error('Error fetching portfolio rankings:', err);
        } finally {
          setIsLoading(false);
        }
      };
  
      fetchData();
    }, [year, quarter, cumulative]);
    return { rankings, isLoading };
  };
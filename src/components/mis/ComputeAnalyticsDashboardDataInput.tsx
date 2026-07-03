import { mockCompanies } from "@/data/mockData";
import { AggregationMetrics, AnalyticsDashboardData, AnalyticsFilters, buildAggregation, CompanyRawMetrics, deriveInsights, InsightMetrics, r2, sumAggregations, TimeSeriesPoint } from "@/hooks/useAnalyticsDashboardData";
import { applyEnvironmentPercentileNormalization, applySocialScorePercentileNormalization, computeCrossQuarterVirginReductions } from "@/lib/envScorePercentile";
import { filterKpiEntries } from "@/utils/kpiEntryFilters";
import { KPIEntryInput } from "./portfolio-helpers";

// ──── Shared lightweight types for the helper's inputs ────
export interface KpiEntryLite {
    companyId: string;
    kpi_id: string;
    value: string | null;
    quarter: string;
    year: number;
}

export interface FeatureRowLite {
    companyId: string;
    feature_key: string;
    enabled: boolean;
}

export interface ComputeAnalyticsDashboardDataInput {
    /** Already-filtered KPI entries (asOf cutoff, etc. must be applied by caller before this). May span multiple years/quarters, e.g. 2025 Q1-Q4 + 2026 Q1. */
    kpiEntries: KPIEntryInput[];
    /** Feature settings for companies (enabled=true rows, or all — function checks `.enabled` where relevant). */
    featureRows: FeatureRowLite[];
    /** Companies matching the UI's business filters (industry/fund/revenueStage/qCategory/firesidePOC/companyId/investmentStatus), already filtered by caller. */
    filteredCompanies: typeof mockCompanies;
    /** Full invested-company universe, used only for the "all companies" comparison branch when filters.companyId is set. Pass the same array as filteredCompanies if you don't need that branch. */
    allCompanies: typeof mockCompanies;
    /** Selection context — which period/quarter/year is "current", and whether cumulative mode applies. Not data filters; just tells the function which slice to treat as current. */
    filters: AnalyticsFilters;
}

// ──── Helper: derive which quarters exist per year directly from the entries ────
// Replaces the old hardcoded `(filters.year == 2025 ? ['Q1','Q2','Q3','Q4'] : ['Q1'])` checks.
const deriveQuartersByYear = (entries: KPIEntryInput[]): Record<number, string[]> => {
    const seen: Record<number, Set<string>> = {};
    entries.forEach(e => {
        if (e.quarter === 'FY') return; // FY tracked separately, not part of the quarterly set
        if (!seen[e.year]) seen[e.year] = new Set();
        seen[e.year].add(e.quarter);
    });
    const result: Record<number, string[]> = {};
    Object.entries(seen).forEach(([y, qs]) => {
        result[Number(y)] = ['Q1', 'Q2', 'Q3', 'Q4'].filter(q => qs.has(q));
    });
    return result;
};

// ──── Main helper: pure computation, no fetching, no company/asOf filtering ────
export function computeAnalyticsDashboardData(
    input: ComputeAnalyticsDashboardDataInput
): AnalyticsDashboardData {
    const { filteredCompanies, allCompanies, filters } = input;
    console.log('computeAnalyticsDashboardData ==> ',input.kpiEntries.length)
    // Quarters actually present per year, derived from the entries you sent in.
    const quartersByYear = deriveQuartersByYear(input.kpiEntries);
    const quartersForYear = (year: number): string[] => quartersByYear[year] || ['Q1'];

    const allEntries = input.kpiEntries;
    const featureRows = input.featureRows;

    // const START_QUARTER = 'Q4';
    // const START_YEAR = 2024;
    // const quarters = quartersForYear(filters.year);
    // const periods: { quarter: string; year: number }[] = [];

    // const includeCumulativeQ1NextYear = filters.cumulative && filters.year === 2025;

    // if (filters.period === 'quarterly') {
    //   let qi = quarters.indexOf(START_QUARTER);
    //   let y = START_YEAR;
    //   const endQi = quarters.indexOf(filters.quarter || 'Q1');
    //   const endY = filters.year;

    //   while (y < endY || (y === endY && qi <= endQi)) {
    //     periods.push({ quarter: quarters[qi], year: y });
    //     qi++;
    //     if (qi > 3) { qi = 0; y++; }
    //   }
    //   if (periods.length === 0) {
    //     periods.push({ quarter: filters.quarter || 'Q1', year: filters.year });
    //   }
    //   if (includeCumulativeQ1NextYear && !periods.some(p => p.quarter === 'Q1' && p.year === filters.year + 1)) {
    //     periods.push({ quarter: 'Q1', year: filters.year + 1 });
    //   }
    // } else {
    //   for (let y = START_YEAR; y <= filters.year; y++) {
    //     periods.push({ quarter: 'FY', year: y });
    //   }
    //   quartersForYear(filters.year).forEach(q => {
    //     periods.push({ quarter: q, year: filters.year });
    //   });
    //   if (includeCumulativeQ1NextYear) {
    //     periods.push({ quarter: 'Q1', year: filters.year + 1 });
    //   }
    // }

    const periods: { quarter: string; year: number }[] = [];
    const includeCumulativeQ1NextYear = filters.cumulative && filters.year === 2025;

    if (filters.period === 'quarterly') {
        // Only the single requested period — no historical walk-back
        periods.push({ quarter: filters.quarter || 'Q1', year: filters.year });

        if (includeCumulativeQ1NextYear && !periods.some(p => p.quarter === 'Q1' && p.year === filters.year + 1)) {
            periods.push({ quarter: 'Q1', year: filters.year + 1 });
        }
    } else {
        // Annual: current year's FY point + its own quarters only
        periods.push({ quarter: 'FY', year: filters.year });
        quartersForYear(filters.year).forEach(q => {
            periods.push({ quarter: q, year: filters.year });
        });

        if (includeCumulativeQ1NextYear) {
            periods.push({ quarter: 'Q1', year: filters.year + 1 });
        }
    }

    const fashionPkgCompanyIds = new Set(
        featureRows.filter(r => r.feature_key === 'fashionMaterials' && r.enabled).map(r => r.companyId)
    );
    const stdPkgCompanyIds = new Set(
        featureRows.filter(r => r.feature_key === 'primarySecondaryPackaging' && r.enabled).map(r => r.companyId)
    );
    const sourcingCompanyIds = new Set<string>(
        featureRows.filter(r => r.feature_key === 'sourcingFulfillment' && r.enabled).map(r => r.companyId)
    );
    const envFeatureCompanyIds = new Set(
        featureRows
            .filter(r => ['waterDetailed', 'waterManagement', 'energyDetailed', 'wasteDetailed'].includes(r.feature_key) && r.enabled)
            .map(r => r.companyId)
    );
    const waterDetailedCompanyIds = new Set(
        featureRows
            .filter(r => r.feature_key === 'waterDetailed' || r.feature_key === 'waterManagement')
            .map(r => r.companyId)
    );
    const hasEnvFeature = (companyId: string) =>
        fashionPkgCompanyIds.has(companyId) ||
        stdPkgCompanyIds.has(companyId) ||
        envFeatureCompanyIds.has(companyId);

    const scopedEntries = allEntries.filter(e => {
        if (e.kpiId.startsWith('food_pkg_') && !stdPkgCompanyIds.has(e.companyId)) return false;
        return true;
    });

    const companyIds = new Set(filteredCompanies.map(c => c.id));

    const timeSeries: TimeSeriesPoint[] = periods.map(p => {
        const periodEntries = filterKpiEntries(scopedEntries, {
            companyIds,
            quarter: p.quarter,
            year: p.year,
            cumulative: filters.cumulative,
        });

        const byCompany: Record<string, Record<string, string>> = {};
        periodEntries.forEach(e => {
            if (!byCompany[e.companyId]) byCompany[e.companyId] = {};
            byCompany[e.companyId][e.kpiId] = e.value || '';
        });

        const companyAggs = Object.values(byCompany).map(kpis => buildAggregation(kpis));
        const aggregation = sumAggregations(companyAggs);
        const insights = deriveInsights(aggregation);

        const companyInsightsList = Object.values(byCompany)
            .filter(kpis => Object.keys(kpis).length > 0)
            .map(kpis => deriveInsights(buildAggregation(kpis)));
        const avgInsight = (key: keyof InsightMetrics): number => {
            const vals = companyInsightsList.map(i => i[key] as number).filter(v => v !== undefined && !isNaN(v));
            return vals.length > 0 ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : 0;
        };
        const perCompanyInsights: InsightMetrics = {} as InsightMetrics;
        for (const key of Object.keys(insights) as (keyof InsightMetrics)[]) {
            (perCompanyInsights as any)[key] = avgInsight(key);
        }

        return {
            period: p.quarter === 'FY' ? `AY ${p.year}` : `${p.quarter} ${p.year}`,
            quarter: p.quarter,
            year: p.year,
            aggregation,
            insights,
            perCompanyInsights,
            companyCount: Object.keys(byCompany).length,
        };
    });

    const currentQ = filters.period === 'quarterly' ? (filters.quarter || 'Q1') : 'FY';
    const currentPeriod = timeSeries.find(t => t.quarter === currentQ && t.year === filters.year);
    const current = currentPeriod?.aggregation || buildAggregation({});
    const currentInsights = currentPeriod?.insights || deriveInsights(current);

    const currentEntries = filterKpiEntries(scopedEntries, {
        companyIds,
        quarter: currentQ,
        year: filters.year,
        cumulative: filters.cumulative,
    });

    const currentByCompany: Record<string, Record<string, string>> = {};
    currentEntries.forEach(e => {
        if (!currentByCompany[e.companyId]) currentByCompany[e.companyId] = {};
        currentByCompany[e.companyId][e.kpiId] = e.value || '';
    });

    const companyRawData: CompanyRawMetrics[] = filteredCompanies.map(company => {
        const kpis = currentByCompany[company.id] || {};
        const aggregation = buildAggregation(kpis);
        const hasFashionPkg = fashionPkgCompanyIds.has(company.id);
        const insights = deriveInsights(aggregation, company.industry, hasFashionPkg);
        return {
            companyId: company.id,
            companyName: company.name,
            brand: company.brand,
            industry: company.industry,
            fund: company.fund,
            revenueStage: company.revenueStage,
            kpis,
            aggregation,
            insights,
            usesFashionPackaging: hasFashionPkg,
            hasWaterFeature: waterDetailedCompanyIds.has(company.id),
            hasEnvironmentFeature: hasEnvFeature(company.id),
        };
    });

    const vprQ14Entries = filterKpiEntries(scopedEntries, {
        companyIds,
        quarters: quartersForYear(filters.year),
        year: filters.year,
        cumulative: filters.cumulative,
    });
    const vprByCompanyQuarter: Record<string, Record<string, Record<string, string>>> = {};
    vprQ14Entries.forEach(e => {
        if (!vprByCompanyQuarter[e.companyId]) vprByCompanyQuarter[e.companyId] = {};
        if (!vprByCompanyQuarter[e.companyId][e.quarter]) vprByCompanyQuarter[e.companyId][e.quarter] = {};
        vprByCompanyQuarter[e.companyId][e.quarter][e.kpiId] = e.value || '';
    });
    const vprPerQuarter: Record<string, Array<{ companyId: string; kpis: Record<string, string> }>> = {};
    quartersForYear(filters.year).forEach(q => {
        vprPerQuarter[q] = filteredCompanies.map(company => ({
            companyId: company.id,
            kpis: vprByCompanyQuarter[company.id]?.[q] || {},
        }));
    });
    const quarterlyVirginReductions = computeCrossQuarterVirginReductions(vprPerQuarter);

    applyEnvironmentPercentileNormalization(companyRawData, quarterlyVirginReductions);
    applySocialScorePercentileNormalization(companyRawData, sourcingCompanyIds);

    let allCompanyRawData: CompanyRawMetrics[] | undefined;
    let allQuarterlyCombinedRawData: CompanyRawMetrics[] | undefined;
    let quarterlyCombinedRawData: CompanyRawMetrics[] | undefined;
    let quarterlyCombinedAggregation: AggregationMetrics | undefined;
    let quarterlyCombinedInsights: InsightMetrics | undefined;
    let quarterlyPerQuarterRawData: Record<string, CompanyRawMetrics[]> | undefined;

    if (filters.period === 'annual') {
        const PCT_PATTERNS = ['_pct', '_percentage', 'recyclability', 'unique_female_customers', 'revenue_tier2_plus', 'attrition_rate', 'renewable_pct', 'wastewater_recycled_pct', 'waste_recycled_pct', 'fresh_water_pct', 'plastic_neutrality'];
        const AVG_KPI_PATTERNS = ['avg_cxo_compensation', 'employees_enps', 'leadership_clevel_total', 'leadership_clevel_female', 'leadership_board_total', 'leadership_board_female', 'leadership_board_independent'];
        const isPercentageKpi = (id: string) => PCT_PATTERNS.some(p => id.includes(p));
        const isAverageKpi = (id: string) => AVG_KPI_PATTERNS.some(p => id.includes(p));
        const isQ4SnapshotKpi = (id: string) => id.startsWith('vendor_mis_') && id.endsWith('_num_vendors');
        const MAX_KPI_PATTERNS = ['epr_compliance_pct', 'voluntary_plastic_neutrality'];
        const isMaxAcrossQuartersKpi = (id: string) => MAX_KPI_PATTERNS.some(p => id.includes(p));

        const q14Entries = filterKpiEntries(scopedEntries, {
            companyIds,
            quarters: quartersForYear(filters.year),
            year: filters.year,
            cumulative: filters.cumulative,
        });

        const q14ByCompanyQuarter: Record<string, Record<string, Record<string, string>>> = {};
        q14Entries.forEach(e => {
            if (!q14ByCompanyQuarter[e.companyId]) q14ByCompanyQuarter[e.companyId] = {};
            if (!q14ByCompanyQuarter[e.companyId][e.quarter]) q14ByCompanyQuarter[e.companyId][e.quarter] = {};
            q14ByCompanyQuarter[e.companyId][e.quarter][e.kpiId] = e.value || '';
        });
        quarterlyCombinedRawData = filteredCompanies.map(company => {
            const quarterData = q14ByCompanyQuarter[company.id] || {};
            const qs = Object.keys(quarterData);
            const combinedKpis: Record<string, string> = {};
            const allKpiKeys = new Set<string>();
            qs.forEach(q => Object.keys(quarterData[q]).forEach(k => allKpiKeys.add(k)));

            allKpiKeys.forEach(kpiId => {
                const rawVals = qs
                    .map(q => quarterData[q]?.[kpiId])
                    .filter(v => v !== undefined && v !== '' && v !== null) as string[];
                if (rawVals.length === 0) return;
                const numericVals = rawVals.map(v => parseFloat(v)).filter(v => !isNaN(v));
                if (numericVals.length > 0) {
                    if (isMaxAcrossQuartersKpi(kpiId)) {
                        combinedKpis[kpiId] = String(r2(Math.min(100, numericVals.reduce((a, b) => a + b, 0))));
                    } else if (isQ4SnapshotKpi(kpiId)) {
                        const q4Val = quarterData['Q4']?.[kpiId];
                        const q4Num = q4Val ? parseFloat(q4Val) : NaN;
                        if (!isNaN(q4Num)) {
                            combinedKpis[kpiId] = String(Math.round(q4Num));
                        } else {
                            combinedKpis[kpiId] = rawVals[rawVals.length - 1];
                        }
                    } else if (isPercentageKpi(kpiId) || isAverageKpi(kpiId)) {
                        combinedKpis[kpiId] = String(r2(numericVals.reduce((a, b) => a + b, 0) / numericVals.length));
                    } else {
                        combinedKpis[kpiId] = String(r2(numericVals.reduce((a, b) => a + b, 0)));
                    }
                } else {
                    let merged = false;
                    try {
                        const arrays = rawVals.map(v => JSON.parse(v)).filter(Array.isArray);
                        if (arrays.length > 0) {
                            const all = arrays.flat();
                            if (all.length > 0 && typeof all[0] === 'object' && all[0]?.id) {
                                const seen = new Set<string>();
                                const unique = all.filter(item => {
                                    if (seen.has(item.id)) return false;
                                    seen.add(item.id);
                                    return true;
                                });
                                combinedKpis[kpiId] = JSON.stringify(unique);
                            } else {
                                const lastNonEmpty = arrays.filter(a => a.length > 0).pop();
                                combinedKpis[kpiId] = JSON.stringify(lastNonEmpty || arrays[arrays.length - 1]);
                            }
                            merged = true;
                        }
                    } catch { /* not JSON */ }
                    if (!merged) {
                        combinedKpis[kpiId] = rawVals[rawVals.length - 1];
                    }
                }
            });

            const fyKpis = currentByCompany[company.id] || {};
            Object.entries(fyKpis).forEach(([k, v]) => {
                if (v && v.trim() && !combinedKpis[k]) {
                    combinedKpis[k] = v;
                }
            });

            const aggregation = buildAggregation(combinedKpis);
            const hasFashionPkg = fashionPkgCompanyIds.has(company.id);

            const insights = deriveInsights(aggregation, company.industry, hasFashionPkg);
            return {
                companyId: company.id,
                companyName: company.name,
                brand: company.brand,
                industry: company.industry,
                fund: company.fund,
                revenueStage: company.revenueStage,
                kpis: combinedKpis,
                aggregation,
                insights,
                usesFashionPackaging: hasFashionPkg,
                hasWaterFeature: waterDetailedCompanyIds.has(company.id),
                hasEnvironmentFeature: hasEnvFeature(company.id),
            };
        });

        const perQuarterForVPR: Record<string, Array<{ companyId: string; kpis: Record<string, string> }>> = {};
        quartersForYear(filters.year).forEach(q => {
            perQuarterForVPR[q] = filteredCompanies.map(company => ({
                companyId: company.id,
                kpis: q14ByCompanyQuarter[company.id]?.[q] || {},
            }));
        });
        const virginReductions = computeCrossQuarterVirginReductions(perQuarterForVPR);

        applyEnvironmentPercentileNormalization(quarterlyCombinedRawData, virginReductions);
        applySocialScorePercentileNormalization(quarterlyCombinedRawData, sourcingCompanyIds);

        const combinedAggs = quarterlyCombinedRawData.map(c => c.aggregation);
        quarterlyCombinedAggregation = sumAggregations(combinedAggs);
        quarterlyCombinedInsights = deriveInsights(quarterlyCombinedAggregation);

        const submitting = quarterlyCombinedRawData.filter(c => Object.keys(c.kpis).length > 0);
        const avgField = (key: keyof InsightMetrics) => {
            const vals = submitting.map(c => c.insights[key] as number).filter(v => !isNaN(v));
            return vals.length > 0 ? r2(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
        };
        quarterlyCombinedInsights.circularEconomyIndex = avgField('circularEconomyIndex');
        quarterlyCombinedInsights.socialScore = avgField('socialScore');
        quarterlyCombinedInsights.deiCompositeScore = avgField('deiCompositeScore');
        quarterlyCombinedInsights.esgCompositeScore = avgField('esgCompositeScore');

        quarterlyPerQuarterRawData = {};
        quartersForYear(filters.year).forEach(q => {
            quarterlyPerQuarterRawData![q] = filteredCompanies.map(company => {
                const kpis = q14ByCompanyQuarter[company.id]?.[q] || {};
                const aggregation = buildAggregation(kpis);
                const insights = deriveInsights(aggregation, company.industry, fashionPkgCompanyIds.has(company.id));
                return {
                    companyId: company.id,
                    companyName: company.name,
                    brand: company.brand,
                    industry: company.industry,
                    fund: company.fund,
                    revenueStage: company.revenueStage,
                    kpis,
                    aggregation,
                    insights,
                    usesFashionPackaging: fashionPkgCompanyIds.has(company.id),
                    hasWaterFeature: waterDetailedCompanyIds.has(company.id),
                    hasEnvironmentFeature: hasEnvFeature(company.id),
                };
            });
        });
    } else {
        const q14Entries = filterKpiEntries(scopedEntries, {
            companyIds,
            quarters: quartersForYear(filters.year),
            year: filters.year,
            cumulative: filters.cumulative,
        });
        const q14ByCompanyQuarter: Record<string, Record<string, Record<string, string>>> = {};
        q14Entries.forEach(e => {
            if (!q14ByCompanyQuarter[e.companyId]) q14ByCompanyQuarter[e.companyId] = {};
            if (!q14ByCompanyQuarter[e.companyId][e.quarter]) q14ByCompanyQuarter[e.companyId][e.quarter] = {};
            q14ByCompanyQuarter[e.companyId][e.quarter][e.kpiId] = e.value || '';
        });
        quarterlyPerQuarterRawData = {};
        quartersForYear(filters.year).forEach(q => {
            quarterlyPerQuarterRawData![q] = filteredCompanies.map(company => {
                const kpis = q14ByCompanyQuarter[company.id]?.[q] || {};
                const aggregation = buildAggregation(kpis);
                const insights = deriveInsights(aggregation, company.industry, fashionPkgCompanyIds.has(company.id));
                return {
                    companyId: company.id,
                    companyName: company.name,
                    brand: company.brand,
                    industry: company.industry,
                    fund: company.fund,
                    revenueStage: company.revenueStage,
                    kpis,
                    aggregation,
                    insights,
                    usesFashionPackaging: fashionPkgCompanyIds.has(company.id),
                    hasWaterFeature: waterDetailedCompanyIds.has(company.id),
                    hasEnvironmentFeature: hasEnvFeature(company.id),
                };
            });
        });
    }

    if (filters.companyId) {
        const allCompanyIds = new Set(allCompanies.map(c => c.id));

        if (filters.period === 'annual') {
            const PCT_PATTERNS2 = ['_pct', '_percentage', 'recyclability', 'unique_female_customers', 'revenue_tier2_plus', 'attrition_rate', 'renewable_pct', 'wastewater_recycled_pct', 'waste_recycled_pct', 'fresh_water_pct', 'plastic_neutrality'];
            const AVG_KPI_PATTERNS2 = ['avg_cxo_compensation', 'employees_enps', 'leadership_clevel_total', 'leadership_clevel_female', 'leadership_board_total', 'leadership_board_female', 'leadership_board_independent'];
            const isPercentageKpi2 = (id: string) => PCT_PATTERNS2.some(p => id.includes(p));
            const isAverageKpi2 = (id: string) => AVG_KPI_PATTERNS2.some(p => id.includes(p));
            const isQ4SnapshotKpi2 = (id: string) => id.startsWith('vendor_mis_') && id.endsWith('_num_vendors');
            const MAX_KPI_PATTERNS2 = ['epr_compliance_pct', 'voluntary_plastic_neutrality'];
            const isMaxAcrossQuartersKpi2 = (id: string) => MAX_KPI_PATTERNS2.some(p => id.includes(p));

            const allQ14Entries = filterKpiEntries(scopedEntries, {
                companyIds: allCompanyIds,
                quarters: quartersForYear(filters.year),
                year: filters.year,
                cumulative: filters.cumulative,
            });

            const allQ14ByCQ: Record<string, Record<string, Record<string, string>>> = {};
            allQ14Entries.forEach(e => {
                if (!allQ14ByCQ[e.companyId]) allQ14ByCQ[e.companyId] = {};
                if (!allQ14ByCQ[e.companyId][e.quarter]) allQ14ByCQ[e.companyId][e.quarter] = {};
                allQ14ByCQ[e.companyId][e.quarter][e.kpiId] = e.value || '';
            });

            allQuarterlyCombinedRawData = allCompanies.map(company => {
                const quarterData = allQ14ByCQ[company.id] || {};
                const qs = Object.keys(quarterData);
                const combinedKpis: Record<string, string> = {};
                const allKpiKeys = new Set<string>();
                qs.forEach(q => Object.keys(quarterData[q]).forEach(k => allKpiKeys.add(k)));

                allKpiKeys.forEach(kpiId => {
                    const rawVals = qs
                        .map(q => quarterData[q]?.[kpiId])
                        .filter(v => v !== undefined && v !== '' && v !== null) as string[];
                    if (rawVals.length === 0) return;
                    const numericVals = rawVals.map(v => parseFloat(v)).filter(v => !isNaN(v));
                    if (numericVals.length > 0) {
                        if (isMaxAcrossQuartersKpi2(kpiId)) {
                            combinedKpis[kpiId] = String(r2(Math.min(100, numericVals.reduce((a, b) => a + b, 0))));
                        } else if (isQ4SnapshotKpi2(kpiId)) {
                            const q4Val = quarterData['Q4']?.[kpiId];
                            const q4Num = q4Val ? parseFloat(q4Val) : NaN;
                            if (!isNaN(q4Num)) {
                                combinedKpis[kpiId] = String(Math.round(q4Num));
                            } else {
                                combinedKpis[kpiId] = rawVals[rawVals.length - 1];
                            }
                        } else if (isPercentageKpi2(kpiId) || isAverageKpi2(kpiId)) {
                            combinedKpis[kpiId] = String(r2(numericVals.reduce((a, b) => a + b, 0) / numericVals.length));
                        } else {
                            combinedKpis[kpiId] = String(r2(numericVals.reduce((a, b) => a + b, 0)));
                        }
                    } else {
                        combinedKpis[kpiId] = rawVals[rawVals.length - 1];
                    }
                });

                const aggregation = buildAggregation(combinedKpis);
                const insights = deriveInsights(aggregation, company.industry, fashionPkgCompanyIds.has(company.id));
                return {
                    companyId: company.id,
                    companyName: company.name,
                    brand: company.brand,
                    industry: company.industry,
                    fund: company.fund,
                    revenueStage: company.revenueStage,
                    kpis: combinedKpis,
                    aggregation,
                    insights,
                    usesFashionPackaging: fashionPkgCompanyIds.has(company.id),
                    hasWaterFeature: waterDetailedCompanyIds.has(company.id),
                    hasEnvironmentFeature: hasEnvFeature(company.id),
                };
            });

            const allPerQuarterForVPR: Record<string, Array<{ companyId: string; kpis: Record<string, string> }>> = {};
            quartersForYear(filters.year).forEach(q => {
                allPerQuarterForVPR[q] = allCompanies.map(company => ({
                    companyId: company.id,
                    kpis: allQ14ByCQ[company.id]?.[q] || {},
                }));
            });
            const allVirginReductions = computeCrossQuarterVirginReductions(allPerQuarterForVPR);
            applyEnvironmentPercentileNormalization(allQuarterlyCombinedRawData, allVirginReductions);
            applySocialScorePercentileNormalization(allQuarterlyCombinedRawData, sourcingCompanyIds);
        } else {
            const allCurrentEntries = filterKpiEntries(scopedEntries, {
                companyIds: allCompanyIds,
                quarter: filters.quarter || 'Q1',
                year: filters.year,
                cumulative: filters.cumulative,
            });

            const allCurrentByCompany: Record<string, Record<string, string>> = {};
            allCurrentEntries.forEach(e => {
                if (!allCurrentByCompany[e.companyId]) allCurrentByCompany[e.companyId] = {};
                allCurrentByCompany[e.companyId][e.kpiId] = e.value || '';
            });

            allCompanyRawData = allCompanies.map(company => {
                const kpis = allCurrentByCompany[company.id] || {};
                const aggregation = buildAggregation(kpis);
                const insights = deriveInsights(aggregation, company.industry, fashionPkgCompanyIds.has(company.id));
                return {
                    companyId: company.id,
                    companyName: company.name,
                    brand: company.brand,
                    industry: company.industry,
                    fund: company.fund,
                    revenueStage: company.revenueStage,
                    kpis,
                    aggregation,
                    insights,
                    usesFashionPackaging: fashionPkgCompanyIds.has(company.id),
                    hasWaterFeature: waterDetailedCompanyIds.has(company.id),
                    hasEnvironmentFeature: hasEnvFeature(company.id),
                };
            });

            const allVprQ14 = filterKpiEntries(scopedEntries, {
                companyIds: allCompanyIds,
                quarters: quartersForYear(filters.year),
                year: filters.year,
                cumulative: filters.cumulative,
            });
            const allVprByCQ: Record<string, Record<string, Record<string, string>>> = {};
            allVprQ14.forEach(e => {
                if (!allVprByCQ[e.companyId]) allVprByCQ[e.companyId] = {};
                if (!allVprByCQ[e.companyId][e.quarter]) allVprByCQ[e.companyId][e.quarter] = {};
                allVprByCQ[e.companyId][e.quarter][e.kpiId] = e.value || '';
            });
            const allQVprPerQ: Record<string, Array<{ companyId: string; kpis: Record<string, string> }>> = {};
            quartersForYear(filters.year).forEach(q => {
                allQVprPerQ[q] = allCompanies.map(company => ({
                    companyId: company.id,
                    kpis: allVprByCQ[company.id]?.[q] || {},
                }));
            });
            const allQVirginReductions = computeCrossQuarterVirginReductions(allQVprPerQ);
            applyEnvironmentPercentileNormalization(allCompanyRawData, allQVirginReductions);
            applySocialScorePercentileNormalization(allCompanyRawData, sourcingCompanyIds);
        }
    }

    const companyAggList: { agg: AggregationMetrics; company: typeof mockCompanies[0] }[] = [];
    filteredCompanies.forEach(company => {
        const kpis = currentByCompany[company.id] || {};
        companyAggList.push({ agg: buildAggregation(kpis), company });
    });

    const groupBy = <T extends string>(getKey: (c: typeof mockCompanies[0]) => T) => {
        const groups: Record<string, AggregationMetrics[]> = {};
        companyAggList.forEach(({ agg, company }) => {
            const key = getKey(company);
            if (!groups[key]) groups[key] = [];
            groups[key].push(agg);
        });
        const result: Record<string, AggregationMetrics> = {};
        Object.entries(groups).forEach(([key, aggs]) => {
            result[key] = sumAggregations(aggs);
        });
        return result;
    };

    return {
        current,
        currentInsights,
        timeSeries,
        byIndustry: groupBy(c => c.industry),
        byFund: groupBy(c => c.fund),
        byRevenueStage: groupBy(c => c.revenueStage),
        companyCount: filteredCompanies.length,
        filteredCompanies,
        companyRawData,
        quarterlyCombinedRawData,
        quarterlyCombinedAggregation,
        quarterlyCombinedInsights,
        quarterlyPerQuarterRawData,
        allCompanyRawData,
        allQuarterlyCombinedRawData,
    };
}
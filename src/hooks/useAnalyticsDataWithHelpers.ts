import { useEffect, useState } from 'react';
import { http } from '@/utils/httpInterceptor';
import { useAsOf, isPeriodAfterCutoff } from '@/contexts/AsOfContext';
import type { AnalyticsFilters, AnalyticsDashboardData } from '@/hooks/useAnalyticsDashboardData';
import {
  getAnalyticsPeriods,
  getYearsFromPeriods,
  getFilteredCompanies,
  buildCompanyFeatureMap,
  filterEntriesByFeatureSettings,
  groupEntriesByCompanyAndKpi,
  groupEntriesByCompanyQuarterAndKpi,
  getFilteredEntriesForPeriod,
  getFilteredEntriesForQuarters,
  hasEnvironmentFeature as checkEnvironmentFeature,
} from '@/hooks/useAnalyticsDashboardDataHelpers';
import {
  buildTimeSeriesData,
  buildCompanyRawData,
  groupByDimension,
  updateInsightsWithAverages,
  calculateAverageInsightMetric,
} from '@/hooks/useAnalyticsDashboardDataBuilders';
import { buildAggregation, deriveInsights, sumAggregations } from '@/hooks/useAnalyticsDashboardData';

/**
 * UNIFIED ANALYTICS DATA ORCHESTRATOR
 * 
 * This is the single entry point for building analytics dashboard data.
 * It internally uses all helper functions for organization and clarity.
 * 
 * Usage in AdminDashboard:
 *   const { data, isLoading, error } = useAnalyticsDataWithHelpers(filters);
 */
export const useAnalyticsDataWithHelpers = (filters: AnalyticsFilters) => {
  const { asOf } = useAsOf();
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const filtersKey = JSON.stringify(filters);
  const asOfKey = `${asOf?.month ?? 'live'}-${asOf?.year ?? 'live'}`;

  useEffect(() => {
    let cancelled = false;

    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // ═══════════════════════════════════════════════════════════════════
        // STEP 1: GENERATE PERIODS & YEARS
        // ═══════════════════════════════════════════════════════════════════
        const periods = getAnalyticsPeriods(filters);
        const years = getYearsFromPeriods(periods);

        // ═══════════════════════════════════════════════════════════════════
        // STEP 2: FETCH DATA FROM API
        // ═══════════════════════════════════════════════════════════════════
        const kpiRes = await http.get<any[]>(`mis/kpi-entries?years=${years.join(',')}`);
        let allEntries = kpiRes.data || [];

        const featuresRes = await http.get<any[]>('mis/company-feature-settings?enabled=true');
        const featureRows = featuresRes.data || [];

        // Apply asOf cutoff if needed
        if (asOf) {
          allEntries = allEntries.filter(e => !isPeriodAfterCutoff(e.quarter, e.year, asOf));
        }

        // ═══════════════════════════════════════════════════════════════════
        // STEP 3: SETUP FEATURE MAPPING & FILTER ENTRIES
        // ═══════════════════════════════════════════════════════════════════
        const featureMap = buildCompanyFeatureMap(featureRows);
        const filteredEntries = filterEntriesByFeatureSettings(allEntries, featureMap);

        // ═══════════════════════════════════════════════════════════════════
        // STEP 4: GET FILTERED COMPANIES & BUILD COMPANY ID SET
        // ═══════════════════════════════════════════════════════════════════
        const filteredCompanies = getFilteredCompanies(filters);
        const companyIds = new Set(filteredCompanies.map(c => c.id));

        // ═══════════════════════════════════════════════════════════════════
        // STEP 5: BUILD TIME SERIES DATA (OVERVIEW)
        // ═══════════════════════════════════════════════════════════════════
        const currEntries = periods.map(p => getFilteredEntriesForPeriod(filteredEntries, companyIds, p, filters));
        const currByCompany = currEntries.map(e => groupEntriesByCompanyAndKpi(e));
        
        const timeSeries = buildTimeSeriesData(periods, filteredCompanies, groupEntriesByCompanyAndKpi(filteredEntries));

        const currentQ = filters.period === 'quarterly' ? (filters.quarter || 'Q1') : 'FY';
        const currentPeriod = timeSeries.find(t => t.quarter === currentQ && t.year === filters.year);
        const current = currentPeriod?.aggregation || buildAggregation({});
        const currentInsights = currentPeriod?.insights || deriveInsights(current);

        // ═══════════════════════════════════════════════════════════════════
        // STEP 6: BUILD COMPANY RAW DATA (DETAIL VIEW)
        // ═══════════════════════════════════════════════════════════════════
        const currentEntries = getFilteredEntriesForPeriod(
          filteredEntries,
          companyIds,
          { quarter: currentQ, year: filters.year },
          filters,
        );
        const currentByCompanyKpis = groupEntriesByCompanyAndKpi(currentEntries);
        const companyRawData = buildCompanyRawData(
          filteredCompanies,
          currentByCompanyKpis,
          featureMap,
          (cid, fm) => checkEnvironmentFeature(cid, fm),
        );

        // ═══════════════════════════════════════════════════════════════════
        // STEP 7: BUILD AGGREGATIONS BY DIMENSION
        // ═══════════════════════════════════════════════════════════════════
        const byIndustry = groupByDimension(filteredCompanies, c => c.industry);
        const byFund = groupByDimension(filteredCompanies, c => c.fund);
        const byRevenueStage = groupByDimension(filteredCompanies, c => c.revenueStage);

        // ═══════════════════════════════════════════════════════════════════
        // STEP 8: BUILD ANNUAL/QUARTERLY COMBINED DATA (IF APPLICABLE)
        // ═══════════════════════════════════════════════════════════════════
        let quarterlyCombinedRawData: any[] | undefined;
        let quarterlyCombinedAggregation: any = undefined;
        let quarterlyCombinedInsights: any = undefined;
        let quarterlyPerQuarterRawData: Record<string, any[]> | undefined;

        if (filters.period === 'annual') {
          const q14Entries = getFilteredEntriesForQuarters(
            filteredEntries,
            companyIds,
            ['Q1', 'Q2', 'Q3', 'Q4'],
            filters.year,
            filters.cumulative,
          );
          const q14ByCompanyQuarter = groupEntriesByCompanyQuarterAndKpi(q14Entries);

          // Build quarterly combined data (advanced aggregation logic would go here)
          quarterlyCombinedRawData = filteredCompanies.map(company => {
            const kpis = currentByCompanyKpis[company.id] || {};
            const aggregation = buildAggregation(kpis);
            const insights = deriveInsights(aggregation, company.industry, featureMap.fashionPkgCompanyIds.has(company.id));
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
              usesFashionPackaging: featureMap.fashionPkgCompanyIds.has(company.id),
              hasWaterFeature: featureMap.waterDetailedCompanyIds.has(company.id),
              hasEnvironmentFeature: checkEnvironmentFeature(company.id, featureMap),
            };
          });

          const combinedAggs = quarterlyCombinedRawData.map(c => c.aggregation);
          quarterlyCombinedAggregation = sumAggregations(combinedAggs);
          quarterlyCombinedInsights = deriveInsights(quarterlyCombinedAggregation);

          // Update with averaged metrics
          const metricsToAverage = ['circularEconomyIndex', 'socialScore', 'deiCompositeScore', 'esgCompositeScore'] as const;
          quarterlyCombinedInsights = updateInsightsWithAverages(
            quarterlyCombinedInsights,
            quarterlyCombinedRawData,
            metricsToAverage,
          );

          quarterlyPerQuarterRawData = {};
          ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
            quarterlyPerQuarterRawData![q] = filteredCompanies.map(company => {
              const kpis = q14ByCompanyQuarter[company.id]?.[q] || {};
              const aggregation = buildAggregation(kpis);
              const insights = deriveInsights(aggregation, company.industry, featureMap.fashionPkgCompanyIds.has(company.id));
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
                usesFashionPackaging: featureMap.fashionPkgCompanyIds.has(company.id),
                hasWaterFeature: featureMap.waterDetailedCompanyIds.has(company.id),
                hasEnvironmentFeature: checkEnvironmentFeature(company.id, featureMap),
              };
            });
          });
        }

        // ═══════════════════════════════════════════════════════════════════
        // STEP 9: RETURN COMPLETE DATA STRUCTURE
        // ═══════════════════════════════════════════════════════════════════
        if (!cancelled) {
          setData({
            current,
            currentInsights,
            timeSeries,
            byIndustry,
            byFund,
            byRevenueStage,
            companyCount: filteredCompanies.length,
            filteredCompanies,
            companyRawData,
            quarterlyCombinedRawData,
            quarterlyCombinedAggregation,
            quarterlyCombinedInsights,
            quarterlyPerQuarterRawData,
            allCompanyRawData: undefined,
            allQuarterlyCombinedRawData: undefined,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchAnalyticsData();

    return () => {
      cancelled = true;
    };
  }, [filtersKey, asOfKey]);

  return { data, isLoading, error };
};

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mockCompanies } from '@/data/mockData';
import { Industry, RevenueStage } from '@/types/esg';
import { fetchAllRows } from '@/lib/supabasePaginate';
import { JFM_2026_ONBOARDED } from '@/lib/companyExclusions';
import { useAsOf, isPeriodAfterCutoff } from '@/contexts/AsOfContext';

interface CompanyAnalyticsData {
  companyId: string;
  companyName: string;
  industry: Industry;
  revenueStage: RevenueStage;
  // Packaging metrics
  totalPackaging: number;
  plasticPackaging: number;
  nonPlasticPackaging: number;
  plasticRecycled: number;
  plasticNotRecycled: number;
  // Primary packaging
  primaryTotal: number;
  primaryPlasticVirgin: number;
  primaryPlasticRecycled: number;
  primaryNonRecyclable: number;
  primaryRecyclable: number;
  primaryNonPlastic: number;
  // Secondary packaging
  secondaryTotal: number;
  secondaryPlasticVirgin: number;
  secondaryPlasticRecycled: number;
  secondaryNonRecyclable: number;
  secondaryRecyclable: number;
  secondaryNonPlastic: number;
  // Tertiary packaging
  tertiaryTotal: number;
  tertiaryPlasticVirgin: number;
  tertiaryPlasticRecycled: number;
  tertiaryNonRecyclable: number;
  tertiaryRecyclable: number;
  tertiaryNonPlastic: number;
  // Workforce metrics
  wcMaleTotal: number;
  wcFemaleTotal: number;
  bcMaleTotal: number;
  bcFemaleTotal: number;
  // Leadership
  cLevelTotal: number;
  cLevelFemale: number;
  boardTotal: number;
  boardFemale: number;
}

interface AggregatedData {
  byIndustry: Record<string, CompanyAnalyticsData[]>;
  byRevenueStage: Record<string, CompanyAnalyticsData[]>;
  allCompanies: CompanyAnalyticsData[];
}

// Parse number safely
const parseNum = (val: string | number | null | undefined): number => {
  if (val === null || val === undefined || val === '') return 0;
  const parsed = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};

export const useAdminDashboardData = (year: number = 2025, quarter: string = 'FY') => {
  const { asOf } = useAsOf();
  return useQuery({
    queryKey: ['admin-dashboard-analytics', year, quarter, asOf?.month ?? 'live', asOf?.year ?? 'live'],
    queryFn: async (): Promise<AggregatedData> => {
      // Fetch all KPI entries for the year (paginated to bypass 1000-row limit)
      const rawEntries = await fetchAllRows('kpi_entries', 'company_id, kpi_id, value, quarter, year', [{ column: 'year', value: year }]);
      const allTyped = rawEntries as unknown as { company_id: string; kpi_id: string; value: string | null; quarter: string; year: number }[];
      // Apply "As of" cutoff: drop entries from reporting periods whose deadline hasn't passed.
      const entries = asOf
        ? allTyped.filter(e => !isPeriodAfterCutoff(e.quarter, e.year, asOf))
        : allTyped;

      // Group entries by company
      const entriesByCompany: Record<string, Record<string, string>> = {};
      entries.forEach(entry => {
        if (!entriesByCompany[entry.company_id]) {
          entriesByCompany[entry.company_id] = {};
        }
        // Use the most recent entry for each KPI
        entriesByCompany[entry.company_id][entry.kpi_id] = entry.value || '';
      });

      // Build analytics data for each company (exclude Demo companies and JFM-2026 onboardees from 2025 analytics)
      const investedCompanies = mockCompanies.filter(c =>
        c.investmentStatus === 'Invested' &&
        !(year < 2026 && JFM_2026_ONBOARDED.includes(c.id))
      );
      const allCompanies: CompanyAnalyticsData[] = investedCompanies.map(company => {
        const kpis = entriesByCompany[company.id] || {};

        // Parse packaging metrics
        const totalPackagingUsed = parseNum(kpis['food_pkg_basic_total_total_material_used']);
        const totalRecycled = parseNum(kpis['food_pkg_basic_total_total_material_recycled']);
        
        // Primary packaging breakup
        const primaryTotal = parseNum(kpis['food_pkg_basic_primary_primary_total_material']);
        const primaryPlasticVirgin = parseNum(kpis['food_pkg_basic_primary_breakup_primary_plastic_virgin']);
        const primaryPlasticRecycled = parseNum(kpis['food_pkg_basic_primary_breakup_primary_plastic_recycled']);
        const primaryPaperVirgin = parseNum(kpis['food_pkg_basic_primary_breakup_primary_paper_virgin']);
        const primaryPaperRecycled = parseNum(kpis['food_pkg_basic_primary_breakup_primary_paper_recycled']);
        const primaryMetal = parseNum(kpis['food_pkg_basic_primary_breakup_primary_metal']);
        const primaryGlass = parseNum(kpis['food_pkg_basic_primary_breakup_primary_glass']);
        const primaryRecyclable = parseNum(kpis['food_pkg_basic_primary_recyclability_primary_mono_materials']);
        const primaryNonRecyclable = parseNum(kpis['food_pkg_basic_primary_recyclability_primary_multi_layered']);
        
        // Secondary packaging breakup
        const secondaryTotal = parseNum(kpis['food_pkg_detailed_secondary_secondary_total_material']);
        const secondaryPlasticVirgin = parseNum(kpis['food_pkg_detailed_secondary_breakup_secondary_plastic_virgin']);
        const secondaryPlasticRecycled = parseNum(kpis['food_pkg_detailed_secondary_breakup_secondary_plastic_recycled']);
        const secondaryPaperVirgin = parseNum(kpis['food_pkg_detailed_secondary_breakup_secondary_paper_virgin']);
        const secondaryPaperRecycled = parseNum(kpis['food_pkg_detailed_secondary_breakup_secondary_paper_recycled']);
        const secondaryMetal = parseNum(kpis['food_pkg_detailed_secondary_breakup_secondary_metal']);
        const secondaryGlass = parseNum(kpis['food_pkg_detailed_secondary_breakup_secondary_glass']);
        const secondaryRecyclable = parseNum(kpis['food_pkg_detailed_secondary_recyclability_secondary_mono_materials']);
        const secondaryNonRecyclable = parseNum(kpis['food_pkg_detailed_secondary_recyclability_secondary_multi_layered']);
        
        // Tertiary packaging
        const tertiaryTotal = parseNum(kpis['food_pkg_tertiary_tertiary_total_material']);
        const tertiaryPlasticVirgin = parseNum(kpis['food_pkg_tertiary_tertiary_breakup_tertiary_plastic_virgin']);
        const tertiaryPlasticRecycled = parseNum(kpis['food_pkg_tertiary_tertiary_breakup_tertiary_plastic_recycled']);
        const tertiaryPaperVirgin = parseNum(kpis['food_pkg_tertiary_tertiary_breakup_tertiary_paper_virgin']);
        const tertiaryPaperRecycled = parseNum(kpis['food_pkg_tertiary_tertiary_breakup_tertiary_paper_recycled']);
        const tertiaryMetal = parseNum(kpis['food_pkg_tertiary_tertiary_breakup_tertiary_metal']);
        const tertiaryGlass = parseNum(kpis['food_pkg_tertiary_tertiary_breakup_tertiary_glass']);
        const tertiaryRecyclable = parseNum(kpis['food_pkg_tertiary_tertiary_recyclability_tertiary_mono_materials']);
        const tertiaryNonRecyclable = parseNum(kpis['food_pkg_tertiary_tertiary_recyclability_tertiary_multi_layered']);

        // Calculate plastic vs non-plastic
        const primaryPlastic = primaryPlasticVirgin + primaryPlasticRecycled;
        const primaryNonPlastic = primaryPaperVirgin + primaryPaperRecycled + primaryMetal + primaryGlass;
        const secondaryPlastic = secondaryPlasticVirgin + secondaryPlasticRecycled;
        const secondaryNonPlastic = secondaryPaperVirgin + secondaryPaperRecycled + secondaryMetal + secondaryGlass;
        const tertiaryPlastic = tertiaryPlasticVirgin + tertiaryPlasticRecycled;
        const tertiaryNonPlastic = tertiaryPaperVirgin + tertiaryPaperRecycled + tertiaryMetal + tertiaryGlass;

        const totalPlastic = primaryPlastic + secondaryPlastic + tertiaryPlastic;
        const totalNonPlastic = primaryNonPlastic + secondaryNonPlastic + tertiaryNonPlastic;

        // Employee metrics
        const wcMaleFulltime = parseNum(kpis['employees_wc_male_fulltime']);
        const wcMaleContractual = parseNum(kpis['employees_wc_male_contractual']);
        const wcMaleParttime = parseNum(kpis['employees_wc_male_parttime']);
        const wcFemaleFulltime = parseNum(kpis['employees_wc_female_fulltime']);
        const wcFemaleContractual = parseNum(kpis['employees_wc_female_contractual']);
        const wcFemaleParttime = parseNum(kpis['employees_wc_female_parttime']);
        const bcMaleFulltime = parseNum(kpis['employees_bc_male_fulltime']);
        const bcMaleContractual = parseNum(kpis['employees_bc_male_contractual']);
        const bcMaleParttime = parseNum(kpis['employees_bc_male_parttime']);
        const bcFemaleFulltime = parseNum(kpis['employees_bc_female_fulltime']);
        const bcFemaleContractual = parseNum(kpis['employees_bc_female_contractual']);
        const bcFemaleParttime = parseNum(kpis['employees_bc_female_parttime']);

        // Leadership
        const cLevelTotal = parseNum(kpis['leadership_clevel_total']);
        const cLevelFemale = parseNum(kpis['leadership_clevel_female']);
        const boardTotal = parseNum(kpis['leadership_board_total']);
        const boardFemale = parseNum(kpis['leadership_board_female']);

        return {
          companyId: company.id,
          companyName: company.name,
          industry: company.industry,
          revenueStage: company.revenueStage,
          totalPackaging: totalPackagingUsed,
          plasticPackaging: totalPlastic,
          nonPlasticPackaging: totalNonPlastic,
          plasticRecycled: primaryPlasticRecycled + secondaryPlasticRecycled + tertiaryPlasticRecycled,
          plasticNotRecycled: (primaryPlasticVirgin + secondaryPlasticVirgin + tertiaryPlasticVirgin),
          primaryTotal,
          primaryPlasticVirgin,
          primaryPlasticRecycled,
          primaryNonRecyclable,
          primaryRecyclable,
          primaryNonPlastic: primaryPaperVirgin + primaryPaperRecycled + primaryMetal + primaryGlass,
          secondaryTotal,
          secondaryPlasticVirgin,
          secondaryPlasticRecycled,
          secondaryNonRecyclable,
          secondaryRecyclable,
          secondaryNonPlastic: secondaryPaperVirgin + secondaryPaperRecycled + secondaryMetal + secondaryGlass,
          tertiaryTotal,
          tertiaryPlasticVirgin,
          tertiaryPlasticRecycled,
          tertiaryNonRecyclable,
          tertiaryRecyclable,
          tertiaryNonPlastic: tertiaryPaperVirgin + tertiaryPaperRecycled + tertiaryMetal + tertiaryGlass,
          wcMaleTotal: wcMaleFulltime + wcMaleContractual + wcMaleParttime,
          wcFemaleTotal: wcFemaleFulltime + wcFemaleContractual + wcFemaleParttime,
          bcMaleTotal: bcMaleFulltime + bcMaleContractual + bcMaleParttime,
          bcFemaleTotal: bcFemaleFulltime + bcFemaleContractual + bcFemaleParttime,
          cLevelTotal,
          cLevelFemale,
          boardTotal,
          boardFemale,
        };
      });

      // Group by industry
      const byIndustry: Record<string, CompanyAnalyticsData[]> = {};
      allCompanies.forEach(company => {
        if (!byIndustry[company.industry]) {
          byIndustry[company.industry] = [];
        }
        byIndustry[company.industry].push(company);
      });

      // Group by revenue stage
      const byRevenueStage: Record<string, CompanyAnalyticsData[]> = {};
      allCompanies.forEach(company => {
        if (!byRevenueStage[company.revenueStage]) {
          byRevenueStage[company.revenueStage] = [];
        }
        byRevenueStage[company.revenueStage].push(company);
      });

      return { byIndustry, byRevenueStage, allCompanies };
    },
  });
};

// Helper to aggregate metrics for a group
export const aggregateMetrics = (companies: CompanyAnalyticsData[]) => {
  const sum = (key: keyof CompanyAnalyticsData) => 
    companies.reduce((acc, c) => acc + (c[key] as number || 0), 0);
  
  const avg = (key: keyof CompanyAnalyticsData) => {
    const total = sum(key);
    return companies.length > 0 ? total / companies.length : 0;
  };

  const count = companies.length;

  // Calculate percentages
  const totalPlastic = sum('plasticPackaging');
  const totalRecycled = sum('plasticRecycled');
  const totalNotRecycled = sum('plasticNotRecycled');
  const plasticTotal = totalRecycled + totalNotRecycled;

  return {
    count,
    totalPackaging: sum('totalPackaging'),
    plasticPackaging: sum('plasticPackaging'),
    nonPlasticPackaging: sum('nonPlasticPackaging'),
    plasticRecycledPct: plasticTotal > 0 ? (totalRecycled / plasticTotal) * 100 : 0,
    plasticNotRecycledPct: plasticTotal > 0 ? (totalNotRecycled / plasticTotal) * 100 : 0,
    // Primary
    primaryTotal: sum('primaryTotal'),
    primaryPlasticVirginPct: avg('primaryPlasticVirgin'),
    primaryPlasticRecycledPct: avg('primaryPlasticRecycled'),
    primaryNonRecyclablePct: avg('primaryNonRecyclable'),
    primaryRecyclablePct: avg('primaryRecyclable'),
    primaryNonPlasticPct: avg('primaryNonPlastic'),
    // Secondary
    secondaryTotal: sum('secondaryTotal'),
    secondaryPlasticVirginPct: avg('secondaryPlasticVirgin'),
    secondaryPlasticRecycledPct: avg('secondaryPlasticRecycled'),
    secondaryNonRecyclablePct: avg('secondaryNonRecyclable'),
    secondaryRecyclablePct: avg('secondaryRecyclable'),
    secondaryNonPlasticPct: avg('secondaryNonPlastic'),
    // Tertiary
    tertiaryTotal: sum('tertiaryTotal'),
    tertiaryPlasticVirginPct: avg('tertiaryPlasticVirgin'),
    tertiaryPlasticRecycledPct: avg('tertiaryPlasticRecycled'),
    tertiaryNonRecyclablePct: avg('tertiaryNonRecyclable'),
    tertiaryRecyclablePct: avg('tertiaryRecyclable'),
    tertiaryNonPlasticPct: avg('tertiaryNonPlastic'),
    // Workforce
    totalWcFemale: sum('wcFemaleTotal'),
    totalWcMale: sum('wcMaleTotal'),
    totalBcFemale: sum('bcFemaleTotal'),
    totalBcMale: sum('bcMaleTotal'),
    wcFemaleRatio: (sum('wcFemaleTotal') / Math.max(sum('wcFemaleTotal') + sum('wcMaleTotal'), 1)) * 100,
    bcFemaleRatio: (sum('bcFemaleTotal') / Math.max(sum('bcFemaleTotal') + sum('bcMaleTotal'), 1)) * 100,
    // Leadership
    totalCLevel: sum('cLevelTotal'),
    totalCLevelFemale: sum('cLevelFemale'),
    femaleCLevelRatio: (sum('cLevelFemale') / Math.max(sum('cLevelTotal'), 1)) * 100,
    totalBoard: sum('boardTotal'),
    totalBoardFemale: sum('boardFemale'),
    femaleBoardRatio: (sum('boardFemale') / Math.max(sum('boardTotal'), 1)) * 100,
  };
};

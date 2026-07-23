import { isCompanyExcluded } from '@/lib/companyExclusions';

export interface KpiEntryFilterParams {
  companyIds?: Set<string>;
  year?: number;
  quarter?: string;
  quarters?: string[];
  allowAnnualForFY?: boolean;
  cumulative?: boolean;
}

const isFullYearQuarterSet = (quarters: string[]) =>
  ['Q1', 'Q2', 'Q3', 'Q4'].every(q => quarters.includes(q));

export const filterKpiEntries = <T extends { companyId: string; quarter: string; year: number }>(
  entries: T[],
  params: KpiEntryFilterParams = {},
) => {
  const {
    companyIds,
    year,
    quarter,
    quarters,
    allowAnnualForFY = true,
    cumulative = false,
  } = params;

  

  const is2025Cumulative = cumulative && year === 2025;
  const includeNextYearQ1 = is2025Cumulative && quarters && isFullYearQuarterSet(quarters);
  const includeAnnualForFullYear = is2025Cumulative && includeNextYearQ1;

  let filteredEntries = entries.filter(entry => {
    if (companyIds && !companyIds.has(entry.companyId)) return false;
    if (isCompanyExcluded(entry.companyId, entry.quarter, entry.year)) return false;
    if (cumulative) return true;

    if (quarter) {
      if (quarter === 'FY') {
        const fyMatch =
          (entry.quarter === 'FY' || (allowAnnualForFY && entry.quarter === 'Annual')) &&
          entry.year === year;
        return fyMatch;
      }
      // return entry.quarter === quarter && entry.year === year;
      //Static code change for showing FY and Annual for 2026 when Q1-Q4 are selected for 2026
      return (entry.quarter === quarter || entry.quarter === 'FY') && entry.year === year;
    }

    if (quarters && quarters.length > 0) {
      const currentYearMatch = entry.year === year && quarters.includes(entry.quarter);
      const annualMatch =
        includeAnnualForFullYear &&
        entry.year === year &&
        (entry.quarter === 'FY' || entry.quarter === 'Annual');
      const nextYearQ1Match =
        includeNextYearQ1 &&
        entry.year === year + 1 &&
        entry.quarter === 'Q1';

      return currentYearMatch || annualMatch || nextYearQ1Match;
    }

    return year ? entry.year === year : true;
  });
  //console.log(filteredEntries.length, 'entries after filtering for', filteredEntries.filter(e => e.year === 2025).length, 'entries for 2025',filteredEntries.filter(e => e.year === 2026).length, 'entries for 2026', filteredEntries.filter(e => e.quarter === 'Q1' && e.year === 2026).length, 'entries for Q1 2026');
  console.log(`Filtered ${filteredEntries.length} entries for year=${year}, quarter=${quarter}, quarters=${quarters}, allowAnnualForFY=${allowAnnualForFY}, cumulative=${cumulative}`);
  if(quarter && quarter === 'FY') {
    console.log(`Filtered ${filteredEntries.filter(e => e.quarter === 'FY').length} entries for FY`);
    console.log(`Filtered ${filteredEntries.filter(e => e.quarter === 'Annual').length} entries for Annual`);
  }
  return filteredEntries;
};

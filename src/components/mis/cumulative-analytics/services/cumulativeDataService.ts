// /**
//  * cumulativeDataService
//  * ─────────────────────────────────────────────────────────────────────────────
//  * Fetches the raw KPI entries required to build a cumulative analytics
//  * snapshot. Purely I/O — no scoring, no filtering beyond the enabled
//  * (year, quarter) slices supplied by the caller.
//  *
//  * The set of enabled slices comes from the centralized `quarterConfig` service,
//  * so this module never hardcodes ['Q1','Q2','Q3','Q4'].
//  */
// import { supabase } from '@/integrations/supabase/client';
// import type { KPIEntryInput } from '../lib/portfolio-helpers';
// import { http } from '@/utils/httpInterceptor';
// import { EnabledSlice } from './quarterConfig';

// const PAGE = 1000;

// async function fetchOneSlice(quarter: string, year: number): Promise<KPIEntryInput[]> {
//   const out: KPIEntryInput[] = [];
//   let from = 0;
//   for (;;) {
//     // const { data, error } = await supabase
//     //   .from('kpi_entries')
//     //   .select('company_id, kpi_id, value, quarter, year, submitted_at')
//     //   .eq('quarter', quarter)
//     //   .eq('year', year)
//     //   .range(from, from + PAGE - 1);
//     const data=await http.get(`mis/kpi-entries?quarter=${quarter}&year=${year}&from=${from}&to=${from + PAGE - 1}`);
//     if (data.error) throw data.error;
//     if (!data.data || data.data.length === 0) break;
//     for (const r of data.data) {
//       out.push({
//         companyId: r.company_id,
//         kpiId: r.kpi_id,
//         value: r.value,
//         quarter: r.quarter,
//         year: r.year,
//         submittedAt: (r as any).submitted_at ?? null,
//       });
//     }
//     if (data.data.length < PAGE) break;
//     from += PAGE;
//   }
//   return out;
// }

// /**
//  * Fetches every enabled slice in parallel and also pulls the corresponding
//  * `FY / Annual` overlay row for each enabled year so that annual-only KPIs
//  * participate in the cumulative dataset when at least one quarter of that year
//  * is enabled.
//  */
// export async function fetchCumulativeEntries(slices: EnabledSlice[]): Promise<KPIEntryInput[]> {
//   if (slices.length === 0) return [];

//   // Include the annual (FY) row for each year whose quarter is enabled — the
//   // helper's merge rules handle "annual overlays quarterly" cleanly.
//   const yearsSeen = new Set(slices.map(s => s.year));
//   const withOverlays: EnabledSlice[] = [
//     ...slices,
//     ...Array.from(yearsSeen).map(y => ({ year: y, quarter: 'FY' })),
//     ...Array.from(yearsSeen).map(y => ({ year: y, quarter: 'Annual' })),
//   ];

//   // Dedupe by (year,quarter)
//   const seen = new Set<string>();
//   const uniq = withOverlays.filter(s => {
//     const k = `${s.year}::${s.quarter}`;
//     if (seen.has(k)) return false;
//     seen.add(k);
//     return true;
//   });
//   console.log('fetchCumulativeEntries', { slices, withOverlays, uniq });
//   {
//     "slices": [
//         {
//             "year": 2025,
//             "quarter": "Q1"
//         },
//         {
//             "year": 2025,
//             "quarter": "Q2"
//         },
//         {
//             "year": 2025,
//             "quarter": "Q3"
//         },
//         {
//             "year": 2025,
//             "quarter": "Q4"
//         },
//         {
//             "year": 2026,
//             "quarter": "Q1"
//         }
//     ],
//     "withOverlays": [
//         {
//             "year": 2025,
//             "quarter": "Q1"
//         },
//         {
//             "year": 2025,
//             "quarter": "Q2"
//         },
//         {
//             "year": 2025,
//             "quarter": "Q3"
//         },
//         {
//             "year": 2025,
//             "quarter": "Q4"
//         },
//         {
//             "year": 2026,
//             "quarter": "Q1"
//         },
//         {
//             "year": 2025,
//             "quarter": "FY"
//         },
//         {
//             "year": 2026,
//             "quarter": "FY"
//         },
//         {
//             "year": 2025,
//             "quarter": "Annual"
//         },
//         {
//             "year": 2026,
//             "quarter": "Annual"
//         }
//     ],
//     "uniq": [
//         {
//             "year": 2025,
//             "quarter": "Q1"
//         },
//         {
//             "year": 2025,
//             "quarter": "Q2"
//         },
//         {
//             "year": 2025,
//             "quarter": "Q3"
//         },
//         {
//             "year": 2025,
//             "quarter": "Q4"
//         },
//         {
//             "year": 2026,
//             "quarter": "Q1"
//         },
//         {
//             "year": 2025,
//             "quarter": "FY"
//         },
//         {
//             "year": 2026,
//             "quarter": "FY"
//         },
//         {
//             "year": 2025,
//             "quarter": "Annual"
//         },
//         {
//             "year": 2026,
//             "quarter": "Annual"
//         }
//     ]
// }
//   const chunks = await Promise.all(uniq.map(s => fetchOneSlice(s.quarter, s.year)));
//   return chunks.flat();
// }

/**
 * cumulativeDataService
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches the raw KPI entries required to build a cumulative analytics
 * snapshot. Purely I/O — no scoring, no filtering beyond the enabled
 * (year, quarter) slices supplied by the caller.
 *
 * The set of enabled slices comes from the centralized `quarterConfig` service,
 * so this module never hardcodes ['Q1','Q2','Q3','Q4'].
 */
import type { KPIEntryInput } from '../lib/portfolio-helpers';
import { http } from '@/utils/httpInterceptor';
import { EnabledSlice } from './quarterConfig';

async function fetchAllEntries(): Promise<KPIEntryInput[]> {
  const data = await http.get(`mis/kpi-entries`);

  if (data.error) throw data.error;
  if (!data.data) return [];

  return data.data.map((r: any) => ({
    companyId: r.companyId,
    kpiId: r.kpi_id,
    value: r.value,
    quarter: r.quarter,
    year: r.year,
    submittedAt: r.submitted_at ?? null,
  }));
}

/**
 * Fetches all KPI entries once, then filters down to the enabled slices
 * plus the corresponding `FY / Annual` overlay row for each enabled year,
 * so that annual-only KPIs participate in the cumulative dataset when at
 * least one quarter of that year is enabled.
 */
export async function fetchCumulativeEntries(slices: EnabledSlice[]): Promise<KPIEntryInput[]> {
  if (slices.length === 0) return [];

  const years = slices.map(s => s.year);

  const isWanted = (entry: KPIEntryInput) => {
    const matchesSlice = slices.some(
      s => s.year === entry.year && s.quarter === entry.quarter
    );
    const matchesOverlay =
      years.includes(entry.year) && (entry.quarter === 'FY' || entry.quarter === 'Annual');

    return matchesSlice || matchesOverlay;
  };

  const allEntries = await fetchAllEntries();

  return allEntries.filter(isWanted);
}

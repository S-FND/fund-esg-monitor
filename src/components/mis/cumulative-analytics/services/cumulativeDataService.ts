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
import { supabase } from '@/integrations/supabase/client';
import type { KPIEntryInput } from '../lib/portfolio-helpers';
import type { EnabledSlice } from '@/services/quarterConfig';

const PAGE = 1000;

async function fetchOneSlice(quarter: string, year: number): Promise<KPIEntryInput[]> {
  const out: KPIEntryInput[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from('kpi_entries')
      .select('company_id, kpi_id, value, quarter, year, submitted_at')
      .eq('quarter', quarter)
      .eq('year', year)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const r of data) {
      out.push({
        companyId: r.company_id,
        kpiId: r.kpi_id,
        value: r.value,
        quarter: r.quarter,
        year: r.year,
        submittedAt: (r as any).submitted_at ?? null,
      });
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

/**
 * Fetches every enabled slice in parallel and also pulls the corresponding
 * `FY / Annual` overlay row for each enabled year so that annual-only KPIs
 * participate in the cumulative dataset when at least one quarter of that year
 * is enabled.
 */
export async function fetchCumulativeEntries(slices: EnabledSlice[]): Promise<KPIEntryInput[]> {
  if (slices.length === 0) return [];

  // Include the annual (FY) row for each year whose quarter is enabled — the
  // helper's merge rules handle "annual overlays quarterly" cleanly.
  const yearsSeen = new Set(slices.map(s => s.year));
  const withOverlays: EnabledSlice[] = [
    ...slices,
    ...Array.from(yearsSeen).map(y => ({ year: y, quarter: 'FY' })),
    ...Array.from(yearsSeen).map(y => ({ year: y, quarter: 'Annual' })),
  ];

  // Dedupe by (year,quarter)
  const seen = new Set<string>();
  const uniq = withOverlays.filter(s => {
    const k = `${s.year}::${s.quarter}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const chunks = await Promise.all(uniq.map(s => fetchOneSlice(s.quarter, s.year)));
  return chunks.flat();
}

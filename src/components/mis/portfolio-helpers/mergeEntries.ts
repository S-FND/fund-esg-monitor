import type { KPIEntryInput } from './types';

/**
 * Rules to combine Q1-Q4 slices per (companyId, kpiId), mirroring the
 * Admin Dashboard's `useAnalyticsDashboardData` annual combine logic.
 *
 *  - AVERAGE_SUFFIXES / AVERAGE_KEYS   → mean of non-empty numerics
 *  - MAX_CAPPED_KEYS                   → sum capped at 100 (EPR / VPN)
 *  - Q4_SNAPSHOT_PATTERNS              → value from Q4 (or latest available quarter)
 *  - default numeric                   → sum
 *  - text                              → last non-empty
 */
const AVERAGE_SUFFIXES = ['_pct', '_percentage', '_ratio', '_rate'];

/** Exact keys that must be averaged even though they aren't rates (leadership headcounts, enps, etc.). */
const AVERAGE_KEYS = new Set<string>([
  'avg_cxo_compensation',
  'employees_enps',
  'leadership_clevel_total',
  'leadership_clevel_female',
  'leadership_board_total',
  'leadership_board_female',
  'leadership_board_independent',
]);

/** Cumulative KPIs whose Q1-Q4 sum must be capped at 100. */
const MAX_CAPPED_KEYS = new Set<string>(['epr_compliance_pct', 'voluntary_plastic_neutrality']);

/** Vendor-MIS num_vendors keys: use the Q4 snapshot (or latest available). */
function isQ4SnapshotKpi(kpiId: string): boolean {
  return /^vendor_mis_.*_num_vendors$/.test(kpiId);
}

const QUARTER_ORDER = ['Q1', 'Q2', 'Q3', 'Q4', 'FY', 'COMBINED'];
const quarterRank = (q: string) => {
  const idx = QUARTER_ORDER.indexOf(q);
  return idx === -1 ? -1 : idx;
};

function isNumericString(s: string): boolean {
  if (!s || !s.trim()) return false;
  const n = parseFloat(s.replace(/,/g, ''));
  return !isNaN(n);
}

export function mergeEntriesAcrossPeriods(entries: KPIEntryInput[]): KPIEntryInput[] {
  const bucket = new Map<string, KPIEntryInput[]>();
  for (const e of entries) {
    const k = `${e.companyId}::${e.kpiId}`;
    if (!bucket.has(k)) bucket.set(k, []);
    bucket.get(k)!.push(e);
  }
  const out: KPIEntryInput[] = [];
  for (const [k, list] of bucket) {
    const [companyId, kpiId] = k.split('::');
    const numericVals = list
      .map(e => e.value ?? '')
      .filter(isNumericString)
      .map(v => parseFloat(v.replace(/,/g, '')));

    let value: string | null;
    if (numericVals.length > 0) {
      let agg: number;
      if (isQ4SnapshotKpi(kpiId)) {
        // Prefer Q4 if present; else latest quarter numerically available.
        const q4 = list.find(e => e.quarter === 'Q4' && isNumericString(e.value ?? ''));
        if (q4) {
          agg = parseFloat((q4.value ?? '0').replace(/,/g, ''));
        } else {
          const sorted = [...list]
            .filter(e => isNumericString(e.value ?? ''))
            .sort((a, b) => quarterRank(b.quarter) - quarterRank(a.quarter));
          agg = parseFloat((sorted[0].value ?? '0').replace(/,/g, ''));
        }
      } else if (MAX_CAPPED_KEYS.has(kpiId)) {
        agg = Math.min(100, numericVals.reduce((a, b) => a + b, 0));
      } else if (AVERAGE_KEYS.has(kpiId) || AVERAGE_SUFFIXES.some(s => kpiId.endsWith(s))) {
        agg = numericVals.reduce((a, b) => a + b, 0) / numericVals.length;
      } else {
        agg = numericVals.reduce((a, b) => a + b, 0);
      }
      value = String(Math.round(agg * 100) / 100);
    } else {
      const last = [...list].reverse().find(e => (e.value ?? '').trim());
      value = last ? (last.value ?? '') : null;
    }
    out.push({ companyId, kpiId, value, quarter: 'COMBINED', year: list[0].year });
  }
  return out;
}

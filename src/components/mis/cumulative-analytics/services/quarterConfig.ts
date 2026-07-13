/**
 * quarterConfig
 * ─────────────────────────────────────────────────────────────────────────────
 * Central source of truth for which reporting quarters exist and are enabled
 * for each year across the application.
 *
 * Persisted in `admin_settings` under the key `quarter_configuration` as JSON:
 *   { "2025": { "Q1": true, "Q2": true, "Q3": true, "Q4": true },
 *     "2026": { "Q1": true, "Q2": false, "Q3": false, "Q4": false } }
 *
 * Rules:
 *   - Quarter labels are dynamic — the shape supports any label a future year
 *     may need (e.g. "H1", "Annual", etc.).
 *   - Previously enabled quarters MUST remain visible even after being disabled
 *     (the record itself never disappears; the flag flips to false).
 *   - Consumers should always drive selectors/filters/aggregations off this
 *     service — do not hardcode ['Q1','Q2','Q3','Q4'] anywhere new.
 */
import { supabase } from '@/integrations/supabase/client';

export type QuarterMap = Record<string, boolean>;
export type QuarterConfiguration = Record<string, QuarterMap>; // year -> quarter -> enabled

export const QUARTER_CONFIG_SETTING_KEY = 'quarter_configuration';

/** Default seed used the first time the setting is read. */
export const DEFAULT_QUARTER_CONFIGURATION: QuarterConfiguration = {
  '2025': { Q1: true, Q2: true, Q3: true, Q4: true },
  '2026': { Q1: true, Q2: false, Q3: false, Q4: false },
};

export interface EnabledSlice {
  year: number;
  quarter: string;
}

/** Read raw config (falls back to defaults). */
export async function fetchQuarterConfiguration(): Promise<QuarterConfiguration> {
     return { ...DEFAULT_QUARTER_CONFIGURATION };
//   const { data, error } = await supabase
//     .from('admin_settings')
//     .select('setting_value')
//     .eq('setting_key', QUARTER_CONFIG_SETTING_KEY)
//     .maybeSingle();
//   if (error) throw error;
//   if (!data?.setting_value) return { ...DEFAULT_QUARTER_CONFIGURATION };
//   try {
//     const parsed = JSON.parse(data.setting_value);
//     return normalizeConfig(parsed);
//   } catch {
//     return { ...DEFAULT_QUARTER_CONFIGURATION };
//   }
}

export async function saveQuarterConfiguration(cfg: QuarterConfiguration): Promise<void> {
  const { error } = await supabase
    .from('admin_settings')
    .upsert(
      { setting_key: QUARTER_CONFIG_SETTING_KEY, setting_value: JSON.stringify(normalizeConfig(cfg)) },
      { onConflict: 'setting_key' },
    );
  if (error) throw error;
}

function normalizeConfig(raw: any): QuarterConfiguration {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_QUARTER_CONFIGURATION };
  const out: QuarterConfiguration = {};
  for (const [year, quarters] of Object.entries(raw)) {
    if (!quarters || typeof quarters !== 'object') continue;
    const qm: QuarterMap = {};
    for (const [q, v] of Object.entries(quarters as Record<string, unknown>)) {
      qm[q] = Boolean(v);
    }
    out[year] = qm;
  }
  return out;
}

/** Merge current DB config with any newly-introduced defaults, preserving user flags. */
export function withDefaultsMerged(cfg: QuarterConfiguration): QuarterConfiguration {
  const out: QuarterConfiguration = { ...cfg };
  for (const [year, quarters] of Object.entries(DEFAULT_QUARTER_CONFIGURATION)) {
    if (!out[year]) out[year] = { ...quarters };
    else {
      for (const q of Object.keys(quarters)) {
        if (!(q in out[year])) out[year][q] = quarters[q];
      }
    }
  }
  return out;
}

/** Sorted list of years present in config. */
export function listYears(cfg: QuarterConfiguration): number[] {
  return Object.keys(cfg)
    .map(y => Number(y))
    .filter(y => Number.isFinite(y))
    .sort((a, b) => a - b);
}

/** Quarters registered for a year (regardless of enabled state) in stable order. */
export function listQuarters(cfg: QuarterConfiguration, year: number): string[] {
  const qs = Object.keys(cfg[String(year)] ?? {});
  return qs.sort(quarterSort);
}

/** All (year, quarter) slices currently enabled — feeds cumulative pipelines. */
export function listEnabledSlices(cfg: QuarterConfiguration): EnabledSlice[] {
  const out: EnabledSlice[] = [];
  for (const y of listYears(cfg)) {
    for (const q of listQuarters(cfg, y)) {
      if (cfg[String(y)][q]) out.push({ year: y, quarter: q });
    }
  }
  return out;
}

/** Distinct enabled quarters across all years (useful for quarter-only selectors). */
export function listEnabledQuarterLabels(cfg: QuarterConfiguration): string[] {
  const set = new Set<string>();
  for (const y of listYears(cfg)) {
    for (const q of listQuarters(cfg, y)) if (cfg[String(y)][q]) set.add(q);
  }
  return Array.from(set).sort(quarterSort);
}

export function isQuarterEnabled(cfg: QuarterConfiguration, year: number, quarter: string): boolean {
  return Boolean(cfg[String(year)]?.[quarter]);
}

export function toggleQuarter(
  cfg: QuarterConfiguration,
  year: number,
  quarter: string,
  enabled: boolean,
): QuarterConfiguration {
  const next: QuarterConfiguration = { ...cfg };
  const y = String(year);
  next[y] = { ...(next[y] ?? {}) };
  next[y][quarter] = enabled;
  return next;
}

export function addYear(cfg: QuarterConfiguration, year: number, quarters: string[] = ['Q1', 'Q2', 'Q3', 'Q4']): QuarterConfiguration {
  if (cfg[String(year)]) return cfg;
  const next = { ...cfg };
  const qm: QuarterMap = {};
  for (const q of quarters) qm[q] = false;
  next[String(year)] = qm;
  return next;
}

function quarterSort(a: string, b: string): number {
  const ax = /^Q(\d+)$/.exec(a);
  const bx = /^Q(\d+)$/.exec(b);
  if (ax && bx) return Number(ax[1]) - Number(bx[1]);
  return a.localeCompare(b);
}

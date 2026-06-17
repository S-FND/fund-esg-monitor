import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch all rows from a Supabase table, bypassing the default 1000-row limit.
 * Uses range-based pagination to collect every row.
 */
export const fetchAllRows = async (
  table: string,
  select: string,
  filters?: { column: string; value: unknown }[]
): Promise<Record<string, unknown>[]> => {
  const PAGE_SIZE = 1000;
  let allRows: Record<string, unknown>[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    let query = (supabase as any).from(table).select(select);
    if (filters) {
      for (const f of filters) {
        query = query.eq(f.column, f.value);
      }
    }
    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = (data || []) as Record<string, unknown>[];
    allRows = allRows.concat(rows);
    hasMore = rows.length === PAGE_SIZE;
    from += PAGE_SIZE;
  }

  return allRows;
};

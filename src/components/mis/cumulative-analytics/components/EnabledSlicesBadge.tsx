/**
 * EnabledSlicesBadge
 * ─────────────────────────────────────────────────────────────────────────────
 * Compact chip list showing which (year, quarter) slices are currently powering
 * the cumulative view. Driven entirely from `useQuarterConfig` — no hardcoded
 * quarter labels.
 */
import { Badge } from '@/components/ui/badge';
import type { EnabledSlice } from '@/services/quarterConfig';

interface Props {
  slices: EnabledSlice[];
}

export const EnabledSlicesBadge = ({ slices }: Props) => {
  if (slices.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
        No quarters are enabled. Enable at least one quarter in Settings → Quarter Configuration to
        populate cumulative analytics.
      </div>
    );
  }

  // Group by year
  const byYear = new Map<number, string[]>();
  for (const s of slices) {
    if (!byYear.has(s.year)) byYear.set(s.year, []);
    byYear.get(s.year)!.push(s.quarter);
  }
  const sortedYears = Array.from(byYear.keys()).sort((a, b) => a - b);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Cumulative dataset:</span>
      {sortedYears.map(y => (
        <div key={y} className="flex items-center gap-1">
          <span className="text-xs font-semibold">{y}</span>
          {byYear.get(y)!.map(q => (
            <Badge key={`${y}-${q}`} variant="secondary" className="text-[10px]">{q}</Badge>
          ))}
          <Badge
            key={`${y}-FY`}
            variant="outline"
            className="text-[10px] border-dashed"
            title="Annual (FY) KPIs are automatically merged with the enabled quarters for this year"
          >
            + FY
          </Badge>
        </div>
      ))}
      <span className="text-[10px] text-muted-foreground ml-1">
        (annual KPIs auto-merged per year)
      </span>
    </div>
  );
};

// TrendsComparisonPage.tsx

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AnalyticsFilters } from "@/hooks/useAnalyticsDashboardData";
import { TrendsTab } from "./TrendsTab"; // adjust path to wherever you saved it

// ──── Config — adjust to match your app's actual available years/quarters ────
const AVAILABLE_YEARS = [2024, 2025, 2026];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

interface PeriodSelection {
  periodType: 'quarterly' | 'annual';
  quarter: string;
  year: number;
}

const defaultPeriodA: PeriodSelection = { periodType: 'quarterly', quarter: 'Q1', year: 2025 };
const defaultPeriodB: PeriodSelection = { periodType: 'quarterly', quarter: 'Q1', year: 2026 };

function toFilters(sel: PeriodSelection): AnalyticsFilters {
  return {
    period: sel.periodType,
    year: sel.year,
    quarter: sel.periodType === 'quarterly' ? sel.quarter : undefined,
    cumulative: false,
  };
}

// ──── Single period selector (reused for both A and B) ────

const PeriodSelector = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: PeriodSelection;
  onChange: (next: PeriodSelection) => void;
}) => {
  return (
    <div className="flex flex-col gap-2 min-w-[220px]">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <Select
          value={value.periodType}
          onValueChange={(v: 'quarterly' | 'annual') => onChange({ ...value, periodType: v })}
        >
          <SelectTrigger className="w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="annual">Annual</SelectItem>
          </SelectContent>
        </Select>

        {value.periodType === 'quarterly' && (
          <Select
            value={value.quarter}
            onValueChange={(v) => onChange({ ...value, quarter: v })}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUARTERS.map(q => (
                <SelectItem key={q} value={q}>{q}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={String(value.year)}
          onValueChange={(v) => onChange({ ...value, year: Number(v) })}
        >
          <SelectTrigger className="w-[90px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_YEARS.map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

// ──── Main page: selectors + comparison result ────

interface TrendsComparisonPageProps {
  newInsight?: boolean;
}

export const TrendsComparisonPage = ({ newInsight = false }: TrendsComparisonPageProps) => {
  const [periodA, setPeriodA] = useState<PeriodSelection>(defaultPeriodA);
  const [periodB, setPeriodB] = useState<PeriodSelection>(defaultPeriodB);

  // "Applied" state — comparison only recomputes when the user clicks Compare,
  // not on every dropdown change (avoids re-fetching on every intermediate selection).
  const [appliedA, setAppliedA] = useState<PeriodSelection>(defaultPeriodA);
  const [appliedB, setAppliedB] = useState<PeriodSelection>(defaultPeriodB);

  const handleCompare = () => {
    setAppliedA(periodA);
    setAppliedB(periodB);
  };

  const isSamePeriod =
    periodA.periodType === periodB.periodType &&
    periodA.year === periodB.year &&
    (periodA.periodType === 'annual' || periodA.quarter === periodB.quarter);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-end gap-4 flex-wrap">
            <PeriodSelector label="Compare from" value={periodA} onChange={setPeriodA} />
            <ArrowRight className="w-4 h-4 text-muted-foreground mb-2.5 shrink-0" />
            <PeriodSelector label="Compare to" value={periodB} onChange={setPeriodB} />
            <Button onClick={handleCompare} disabled={isSamePeriod} className="mb-0">
              Compare
            </Button>
          </div>
          {isSamePeriod && (
            <p className="text-xs text-muted-foreground mt-2">
              Select two different periods to compare.
            </p>
          )}
        </CardContent>
      </Card>

      <TrendsTab
        periodAFilters={toFilters(appliedA)}
        periodBFilters={toFilters(appliedB)}
        newInsight={newInsight}
      />
    </div>
  );
};
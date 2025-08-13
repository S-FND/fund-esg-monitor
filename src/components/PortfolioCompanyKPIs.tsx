
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useCompanyKPIs } from "@/hooks/useCompanyKPIs";

interface KPI {
  id: string;
  kpi_name: string;
  kpi_value: number | null;
  unit: string | null;
  reporting_period?: string;
}
interface PortfolioCompanyKPIsProps {
  companyId: string;
  reportedYear: string;
}

export function PortfolioCompanyKPIs({ companyId, reportedYear }: PortfolioCompanyKPIsProps) {
  const { kpis, loading } = useCompanyKPIs(companyId);
  
  // Filter KPIs by reporting period if needed
  const filteredKpis = kpis.filter(kpi => 
    !kpi.reporting_period || kpi.reporting_period === reportedYear
  );

  if (!companyId || !reportedYear) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Reported ESG KPIs ({reportedYear})</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-muted-foreground">Loading ESG KPIs...</p>}
        {!loading && filteredKpis.length === 0 && (
          <p className="text-sm text-muted-foreground">No ESG KPIs reported for this company in {reportedYear}.</p>
        )}
        {!loading && filteredKpis.length > 0 && (
          <ul className="divide-y">
            {filteredKpis.map((kpi) => (
              <li key={kpi.id} className="py-2 flex flex-row gap-2 items-center">
                <span className="flex-1">{kpi.kpi_name}</span>
                <span className="font-semibold">{kpi.kpi_value ?? "-"}</span>
                <span className="ml-2 text-xs text-muted-foreground">{kpi.unit}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}


import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface KPI {
  id: string;
  kpi_name: string;
  kpi_metric: number | null;
  metric_unit: string | null;
}
interface PortfolioCompanyKPIsProps {
  companyId: string;
  reportedYear: string;
}

export function PortfolioCompanyKPIs({ companyId, reportedYear }: PortfolioCompanyKPIsProps) {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId || !reportedYear) {
      setKpis([]);
      return;
    }
    setLoading(true);
    supabase
      .from("company_esg_kpis")
      .select("id,kpi_name,kpi_metric,metric_unit")
      .eq("company_id", companyId)
      .eq("reported_year", reportedYear)
      .then((res) => {
        setKpis(res.data || []);
        setLoading(false);
      });
  }, [companyId, reportedYear]);

  if (!companyId || !reportedYear) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Reported ESG KPIs ({reportedYear})</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-muted-foreground">Loading ESG KPIs...</p>}
        {!loading && kpis.length === 0 && (
          <p className="text-sm text-muted-foreground">No ESG KPIs reported for this company in {reportedYear}.</p>
        )}
        {!loading && kpis.length > 0 && (
          <ul className="divide-y">
            {kpis.map((kpi) => (
              <li key={kpi.id} className="py-2 flex flex-row gap-2 items-center">
                <span className="flex-1">{kpi.kpi_name}</span>
                <span className="font-semibold">{kpi.kpi_metric ?? "-"}</span>
                <span className="ml-2 text-xs text-muted-foreground">{kpi.metric_unit}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

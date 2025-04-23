
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PortfolioCompanyKPIs } from "@/components/PortfolioCompanyKPIs";

export function ESGKPIsSection({
  selectedCompany,
  selectedCompanyId,
  selectedYear,
}: {
  selectedCompany: string;
  selectedCompanyId: string;
  selectedYear: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ESG Scores by Component</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] flex items-center justify-center bg-accent rounded-md mb-4">
          <p className="text-muted-foreground">ESG Component Chart</p>
        </div>
        {/* ESG KPIs reported by portfolio company for the selected year */}
        {selectedCompany !== "all" && selectedCompanyId && (
          <PortfolioCompanyKPIs companyId={selectedCompanyId} reportedYear={selectedYear} />
        )}
        {selectedCompany === "all" && (
          <p className="text-sm text-muted-foreground mt-4">
            Select a specific portfolio company to view its reported ESG KPIs.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

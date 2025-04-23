
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function CompaniesStatsCard({ totalCompanies, numFunds }: { totalCompanies: number, numFunds: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Portfolio Companies</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{totalCompanies}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Across {numFunds} funds
        </p>
      </CardContent>
    </Card>
  );
}

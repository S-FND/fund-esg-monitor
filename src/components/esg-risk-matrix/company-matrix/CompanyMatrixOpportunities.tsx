
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CompanyData } from "./types";

interface CompanyMatrixOpportunitiesProps {
  company: CompanyData;
}

export function CompanyMatrixOpportunities({ company }: CompanyMatrixOpportunitiesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ESG Opportunities</CardTitle>
        <CardDescription>
          Factors that positively impact valuation based on ESG performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Parameter</TableHead>
              <TableHead>Performance (1-5)</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Valuation Impact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {company.esgOpportunityData.map((opportunity, index) => (
              <TableRow key={index}>
                <TableCell>{opportunity.category}</TableCell>
                <TableCell>{opportunity.parameter}</TableCell>
                <TableCell>{opportunity.score}</TableCell>
                <TableCell>{opportunity.weight * 100}%</TableCell>
                <TableCell className="text-emerald-600">+{opportunity.impact}%</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/50">
              <TableCell colSpan={4} className="font-bold text-right">Total Opportunity Impact:</TableCell>
              <TableCell className="font-bold text-emerald-600">
                +{company.esgOpportunityData.reduce((sum, item) => sum + item.impact, 0).toFixed(1)}%
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

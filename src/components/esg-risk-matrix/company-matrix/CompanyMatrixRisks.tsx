
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CompanyData } from "./types";

interface CompanyMatrixRisksProps {
  company: CompanyData;
}

export function CompanyMatrixRisks({ company }: CompanyMatrixRisksProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ESG Risk Factors</CardTitle>
        <CardDescription>
          Factors that negatively impact valuation based on ESG performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Parameter</TableHead>
              <TableHead>Risk Score (1-5)</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Valuation Impact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {company.esgRiskData.map((risk, index) => (
              <TableRow key={index}>
                <TableCell>{risk.category}</TableCell>
                <TableCell>{risk.parameter}</TableCell>
                <TableCell>{risk.score}</TableCell>
                <TableCell>{risk.weight * 100}%</TableCell>
                <TableCell className="text-red-600">{risk.impact}%</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/50">
              <TableCell colSpan={4} className="font-bold text-right">Total Risk Impact:</TableCell>
              <TableCell className="font-bold text-red-600">
                {company.esgRiskData.reduce((sum, item) => sum + item.impact, 0).toFixed(1)}%
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

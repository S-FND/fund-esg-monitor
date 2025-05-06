
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { PortfolioRiskData } from "./types";

interface PortfolioRiskMatrixProps {
  data: PortfolioRiskData[];
  onShowCalculation: (title: string, calculation: string, reference: string) => void;
  getRiskScoreCalculation: (fundName: string, score: number) => string;
  getValuationImpactCalculation: (fundName: string, impact: number) => string;
}

export function PortfolioRiskMatrix({ 
  data,
  onShowCalculation,
  getRiskScoreCalculation,
  getValuationImpactCalculation
}: PortfolioRiskMatrixProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio ESG Risk Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fund</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Valuation Impact</TableHead>
                <TableHead>Top Risk</TableHead>
                <TableHead>Top Opportunity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.fundName}>
                  <TableCell className="font-medium">{item.fundName}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => onShowCalculation(
                        `${item.fundName} Risk Score`,
                        getRiskScoreCalculation(item.fundName, item.riskScore),
                        "Based on Q2 2024 ESG assessments and quarterly trend analysis."
                      )}
                      className={`font-medium hover:underline inline-flex items-center ${item.riskScore > 20 ? 'text-red-600' : item.riskScore > 15 ? 'text-amber-600' : 'text-emerald-600'}`}
                    >
                      {item.riskScore}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>Click for calculation details</TooltipContent>
                      </Tooltip>
                    </button>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => onShowCalculation(
                        `${item.fundName} Valuation Impact`,
                        getValuationImpactCalculation(item.fundName, item.valuationImpact),
                        "Based on Q2 2024 financial assessments and ESG performance data."
                      )}
                      className={`font-medium hover:underline inline-flex items-center ${item.valuationImpact < 0 ? 'text-red-600' : 'text-emerald-600'}`}
                    >
                      {item.valuationImpact > 0 ? '+' : ''}{item.valuationImpact}%
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>Click for calculation details</TooltipContent>
                      </Tooltip>
                    </button>
                  </TableCell>
                  <TableCell>{item.topRisks[0]}</TableCell>
                  <TableCell>{item.topOpportunities[0]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}

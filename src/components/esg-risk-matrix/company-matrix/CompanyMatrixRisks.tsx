
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CompanyData } from "./types";
import { CalculationDetailsDialog } from "../CalculationDetailsDialog";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface CompanyMatrixRisksProps {
  company: CompanyData;
}

export function CompanyMatrixRisks({ company }: CompanyMatrixRisksProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<{
    parameter: string;
    calculation?: string;
    reference?: string;
  } | null>(null);

  const handleRiskClick = (risk: {
    parameter: string;
    calculation?: string;
    reference?: string;
  }) => {
    setSelectedRisk(risk);
    setDialogOpen(true);
  };

  const totalRiskImpact = company.esgRiskData.reduce((sum, item) => sum + item.impact, 0).toFixed(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>ESG Risk Factors</CardTitle>
        <CardDescription>
          Factors that negatively impact valuation based on ESG performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
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
                  <TableCell>
                    <button
                      onClick={() => handleRiskClick(risk)}
                      className="hover:underline text-primary cursor-pointer inline-flex items-center"
                    >
                      {risk.score}
                      {(risk.calculation || risk.reference) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>Click for calculation details</TooltipContent>
                        </Tooltip>
                      )}
                    </button>
                  </TableCell>
                  <TableCell>{risk.weight * 100}%</TableCell>
                  <TableCell className="text-red-600">
                    <button
                      onClick={() => handleRiskClick(risk)}
                      className="hover:underline text-red-600 cursor-pointer inline-flex items-center"
                    >
                      {risk.impact}%
                      {(risk.calculation || risk.reference) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>Click for calculation details</TooltipContent>
                        </Tooltip>
                      )}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50">
                <TableCell colSpan={4} className="font-bold text-right">Total Risk Impact:</TableCell>
                <TableCell className="font-bold text-red-600">
                  <button
                    onClick={() => handleRiskClick({
                      parameter: "Total Risk Impact",
                      calculation: `Sum of all individual risk impacts: ${company.esgRiskData.map(r => r.impact).join('% + ')}% = ${totalRiskImpact}%`,
                      reference: "Based on current quarter risk assessments."
                    })}
                    className="hover:underline text-red-600 cursor-pointer inline-flex items-center"
                  >
                    {totalRiskImpact}%
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>Click for calculation details</TooltipContent>
                    </Tooltip>
                  </button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TooltipProvider>

        {selectedRisk && (
          <CalculationDetailsDialog 
            open={dialogOpen}
            setOpen={setDialogOpen}
            title={`${selectedRisk.parameter} Calculation Details`}
            calculation={selectedRisk.calculation}
            reference={selectedRisk.reference}
          />
        )}
      </CardContent>
    </Card>
  );
}

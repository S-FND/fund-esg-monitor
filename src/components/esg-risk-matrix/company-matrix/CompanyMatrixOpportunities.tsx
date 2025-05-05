
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CompanyData } from "./types";
import { CalculationDetailsDialog } from "../CalculationDetailsDialog";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface CompanyMatrixOpportunitiesProps {
  company: CompanyData;
}

export function CompanyMatrixOpportunities({ company }: CompanyMatrixOpportunitiesProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<{
    parameter: string;
    calculation?: string;
    reference?: string;
  } | null>(null);

  const handleOpportunityClick = (opportunity: {
    parameter: string;
    calculation?: string;
    reference?: string;
  }) => {
    setSelectedOpportunity(opportunity);
    setDialogOpen(true);
  };

  const totalOpportunityImpact = company.esgOpportunityData.reduce((sum, item) => sum + item.impact, 0).toFixed(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>ESG Opportunities</CardTitle>
        <CardDescription>
          Factors that positively impact valuation based on ESG performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
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
                  <TableCell>
                    <button
                      onClick={() => handleOpportunityClick(opportunity)}
                      className="hover:underline text-primary cursor-pointer inline-flex items-center"
                    >
                      {opportunity.score}
                      {(opportunity.calculation || opportunity.reference) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>Click for calculation details</TooltipContent>
                        </Tooltip>
                      )}
                    </button>
                  </TableCell>
                  <TableCell>{opportunity.weight * 100}%</TableCell>
                  <TableCell className="text-emerald-600">
                    <button
                      onClick={() => handleOpportunityClick(opportunity)}
                      className="hover:underline text-emerald-600 cursor-pointer inline-flex items-center"
                    >
                      +{opportunity.impact}%
                      {(opportunity.calculation || opportunity.reference) && (
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
                <TableCell colSpan={4} className="font-bold text-right">Total Opportunity Impact:</TableCell>
                <TableCell className="font-bold text-emerald-600">
                  <button
                    onClick={() => handleOpportunityClick({
                      parameter: "Total Opportunity Impact",
                      calculation: `Sum of all individual opportunity impacts: ${company.esgOpportunityData.map(o => o.impact).join('% + ')}% = ${totalOpportunityImpact}%`,
                      reference: "Based on current quarter opportunity assessments."
                    })}
                    className="hover:underline text-emerald-600 cursor-pointer inline-flex items-center"
                  >
                    +{totalOpportunityImpact}%
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

        {selectedOpportunity && (
          <CalculationDetailsDialog 
            open={dialogOpen}
            setOpen={setDialogOpen}
            title={`${selectedOpportunity.parameter} Calculation Details`}
            calculation={selectedOpportunity.calculation}
            reference={selectedOpportunity.reference}
          />
        )}
      </CardContent>
    </Card>
  );
}

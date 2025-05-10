
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { ValuationCompanyData } from "./types";
import { formatCurrency, formatPercentage } from "./utils";

interface ValuationDetailTableProps {
  companies: ValuationCompanyData[];
  initialValuation: number;
  adjustedValuation: number;
  netImpact: number;
  showCalculationDetails: (title: string, calculation: string, reference?: string) => void;
  portfolioCalculation: string;
  getCompanyCalculation: (company: ValuationCompanyData) => string;
}

export function ValuationDetailTable({
  companies,
  initialValuation,
  adjustedValuation,
  netImpact,
  showCalculationDetails,
  portfolioCalculation,
  getCompanyCalculation
}: ValuationDetailTableProps) {
  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Initial Valuation</TableHead>
              <TableHead>ESG-Adjusted</TableHead>
              <TableHead>Impact (%)</TableHead>
              <TableHead>Value Added/Lost</TableHead>
              <TableHead>Top Risk Factor</TableHead>
              <TableHead>Top Opportunity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.name}>
                <TableCell className="font-medium">{company.name}</TableCell>
                <TableCell>{formatCurrency(company.valuation)}</TableCell>
                <TableCell>{formatCurrency(company.adjustedValuation)}</TableCell>
                <TableCell className={`font-medium ${company.value >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  <button
                    onClick={() => showCalculationDetails(
                      `${company.name} - Impact Calculation`,
                      getCompanyCalculation(company),
                      `Based on Q1-Q2 2024 ESG performance data and ${company.name} industry benchmarks.`
                    )}
                    className={`${company.value >= 0 ? "text-emerald-600" : "text-red-600"} hover:underline inline-flex items-center`}
                  >
                    {formatPercentage(company.value)}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>Click for calculation details</TooltipContent>
                    </Tooltip>
                  </button>
                </TableCell>
                <TableCell className={`font-medium ${company.value >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  <button
                    onClick={() => showCalculationDetails(
                      `${company.name} - Value Change Calculation`,
                      getCompanyCalculation(company),
                      `Based on Q1-Q2 2024 ESG performance data and ${company.name} industry benchmarks.`
                    )}
                    className={`${company.value >= 0 ? "text-emerald-600" : "text-red-600"} hover:underline inline-flex items-center`}
                  >
                    {company.value >= 0 ? "+" : ""}{formatCurrency(company.adjustedValuation - company.valuation)}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>Click for calculation details</TooltipContent>
                    </Tooltip>
                  </button>
                </TableCell>
                <TableCell>
                  {company.value < 0 ? "Carbon Emissions" : "N/A"}
                </TableCell>
                <TableCell>
                  {company.value > 0 ? "Green Products" : "Renewable Energy"}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-medium">
              <TableCell>Total Portfolio</TableCell>
              <TableCell>{formatCurrency(initialValuation)}</TableCell>
              <TableCell>{formatCurrency(adjustedValuation)}</TableCell>
              <TableCell className={`${netImpact >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                <button
                  onClick={() => showCalculationDetails(
                    "Portfolio Total Impact",
                    portfolioCalculation,
                    "Based on aggregated Q1-Q2 2024 ESG performance data across all companies."
                  )}
                  className={`${netImpact >= 0 ? "text-emerald-600" : "text-red-600"} hover:underline inline-flex items-center`}
                >
                  {formatPercentage(netImpact)}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Click for calculation details</TooltipContent>
                  </Tooltip>
                </button>
              </TableCell>
              <TableCell className={`${netImpact >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                <button
                  onClick={() => showCalculationDetails(
                    "Portfolio Total Value Change",
                    portfolioCalculation,
                    "Based on aggregated Q1-Q2 2024 ESG performance data across all companies."
                  )}
                  className={`${netImpact >= 0 ? "text-emerald-600" : "text-red-600"} hover:underline inline-flex items-center`}
                >
                  {adjustedValuation - initialValuation >= 0 ? "+" : ""}{formatCurrency(adjustedValuation - initialValuation)}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Click for calculation details</TooltipContent>
                  </Tooltip>
                </button>
              </TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}

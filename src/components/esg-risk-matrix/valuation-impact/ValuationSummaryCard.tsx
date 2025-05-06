
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { ValuationCompanyData } from "./types";
import { formatCurrency, formatPercentage } from "./utils";

interface ValuationSummaryCardProps {
  title: string;
  initialValue?: number;
  adjustedValue?: number;
  impactPercentage?: number;
  valueChange?: number;
  topFactor?: string;
  factorValue?: number;
  companyName?: string;
  showTopFactor?: boolean;
  showCalculationDetails: (title: string, calculation: string, reference?: string) => void;
  calculationText: string;
  referenceText?: string;
}

export function ValuationSummaryCard({
  title,
  initialValue,
  adjustedValue,
  impactPercentage,
  valueChange,
  topFactor,
  factorValue,
  companyName,
  showTopFactor = true,
  showCalculationDetails,
  calculationText,
  referenceText
}: ValuationSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <TooltipProvider>
          {initialValue !== undefined && (
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">
                {companyName ? "Company:" : "Initial Portfolio Value:"}
              </span>
              <span className="font-bold">
                {companyName || formatCurrency(initialValue)}
              </span>
            </div>
          )}
          
          {adjustedValue !== undefined && !companyName && (
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">ESG-Adjusted Value:</span>
              <span className="font-bold">{formatCurrency(adjustedValue)}</span>
            </div>
          )}
          
          {impactPercentage !== undefined && (
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">
                {companyName ? "Valuation Impact:" : "Net ESG Impact:"}
              </span>
              <button
                onClick={() => showCalculationDetails(
                  `${companyName || "Portfolio"} Valuation Impact`,
                  calculationText,
                  referenceText
                )}
                className={`font-bold ${impactPercentage >= 0 ? "text-emerald-600" : "text-red-600"} hover:underline inline-flex items-center`}
              >
                {formatPercentage(impactPercentage)}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>Click for calculation details</TooltipContent>
                </Tooltip>
              </button>
            </div>
          )}
          
          {valueChange !== undefined && (
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Value Added/Lost:</span>
              <button
                onClick={() => showCalculationDetails(
                  `${companyName || "Portfolio"} Value Change`,
                  calculationText,
                  referenceText
                )}
                className={`font-bold ${valueChange >= 0 ? "text-emerald-600" : "text-red-600"} hover:underline inline-flex items-center`}
              >
                {valueChange >= 0 ? "+" : ""}{formatCurrency(valueChange)}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>Click for calculation details</TooltipContent>
                </Tooltip>
              </button>
            </div>
          )}
          
          {showTopFactor && topFactor && (
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Top ESG Factor:</span>
              <span className="font-medium">
                {topFactor} {factorValue && `(${formatPercentage(factorValue)})`}
              </span>
            </div>
          )}
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}

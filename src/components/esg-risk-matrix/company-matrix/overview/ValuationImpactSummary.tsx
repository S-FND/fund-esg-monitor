
import { TooltipProvider, Tooltip as UITooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { ValuationImpactSummaryProps } from "./types";

export function ValuationImpactSummary({ 
  company, 
  impactClass, 
  getValuationCalculation,
  showCalculationDetails 
}: ValuationImpactSummaryProps) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">Net Valuation Impact</h4>
      <div className="flex items-center justify-between text-lg">
        <span>Without ESG factors:</span>
        <span className="font-bold">${(company.valuation.current / 1000000).toFixed(1)}M</span>
      </div>
      <div className="flex items-center justify-between text-lg">
        <span>With ESG factors:</span>
        <span className="font-bold">${(company.valuation.adjusted / 1000000).toFixed(1)}M</span>
      </div>
      <div className="flex items-center justify-between text-lg border-t mt-2 pt-2">
        <span>Impact:</span>
        <button
          onClick={() => showCalculationDetails(
            "Valuation Impact Calculation", 
            getValuationCalculation(),
            "Data based on current quarter ESG assessments and historical performance trends."
          )}
          className={`font-bold ${impactClass} hover:underline inline-flex items-center`}
        >
          {company.valuation.impact > 0 ? '+' : ''}{company.valuation.impact}% (${((company.valuation.adjusted - company.valuation.current) / 1000000).toFixed(2)}M)
          <UITooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 ml-1 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>Click for calculation details</TooltipContent>
          </UITooltip>
        </button>
      </div>
    </div>
  );
}

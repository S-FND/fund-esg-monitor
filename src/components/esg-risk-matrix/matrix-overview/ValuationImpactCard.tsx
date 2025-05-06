
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface ValuationImpactCardProps {
  onShowCalculation: (title: string, calculation: string, reference: string) => void;
  getNetPortfolioImpactCalculation: () => string;
  getHighestPositiveImpactCalculation: () => string;
  getHighestNegativeImpactCalculation: () => string;
}

export function ValuationImpactCard({ 
  onShowCalculation,
  getNetPortfolioImpactCalculation,
  getHighestPositiveImpactCalculation,
  getHighestNegativeImpactCalculation
}: ValuationImpactCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Valuation Impact Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <TooltipProvider>
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Net Portfolio Impact:</span>
            <button 
              onClick={() => onShowCalculation(
                "Net Portfolio Impact",
                getNetPortfolioImpactCalculation(),
                "Based on Q1-Q2 2024 ESG assessments and historical performance data."
              )}
              className="font-bold text-lg text-emerald-600 hover:underline inline-flex items-center"
            >
              +3.8%
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Click for calculation details</TooltipContent>
              </Tooltip>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Highest Positive Impact:</span>
            <button 
              onClick={() => onShowCalculation(
                "Highest Positive Impact",
                getHighestPositiveImpactCalculation(),
                "Based on Q2 2024 ESG performance data for MediTech Innovations."
              )}
              className="font-bold text-emerald-600 hover:underline inline-flex items-center"
            >
              +12.4%
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Click for calculation details</TooltipContent>
              </Tooltip>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Highest Negative Impact:</span>
            <button 
              onClick={() => onShowCalculation(
                "Highest Negative Impact",
                getHighestNegativeImpactCalculation(),
                "Based on Q2 2024 ESG performance data for EcoSolutions Inc."
              )}
              className="font-bold text-red-600 hover:underline inline-flex items-center"
            >
              -8.2%
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Click for calculation details</TooltipContent>
              </Tooltip>
            </button>
          </div>
        </TooltipProvider>
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Average ESG Score:</span>
          <span className="font-bold">78/100</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Industry Average:</span>
          <span className="font-medium text-muted-foreground">68/100</span>
        </div>
      </CardContent>
    </Card>
  );
}

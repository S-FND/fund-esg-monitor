
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CompanyMatrixOverviewProps } from "./types";
import { ESGComparisonChart } from "./ESGComparisonChart";
import { ValuationImpactChart } from "./ValuationImpactChart";
import { ValuationImpactSummary } from "./ValuationImpactSummary";
import { CalculationDetailsDialog } from "../../CalculationDetailsDialog";

export function CompanyMatrixOverview({ company, pillarImpactData, impactClass }: CompanyMatrixOverviewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [calculationDetails, setCalculationDetails] = useState({
    title: "",
    calculation: "",
    reference: ""
  });

  const showCalculationDetails = (title: string, calculation: string, reference: string) => {
    setCalculationDetails({ title, calculation, reference });
    setDialogOpen(true);
  };

  // Generate valuation impact calculation details
  const getValuationCalculation = () => {
    const riskImpact = company.esgRiskData.reduce((sum, item) => sum + item.impact, 0);
    const opportunityImpact = company.esgOpportunityData.reduce((sum, item) => sum + item.impact, 0);
    
    return `Starting Valuation: $${(company.valuation.current / 1000000).toFixed(1)}M
    
Risk Factors: -${riskImpact.toFixed(1)}% (${company.esgRiskData.map(r => `${r.parameter}: -${r.impact}%`).join(', ')})
Opportunity Factors: +${opportunityImpact.toFixed(1)}% (${company.esgOpportunityData.map(o => `${o.parameter}: +${o.impact}%`).join(', ')})
Net ESG Impact: ${company.valuation.impact > 0 ? '+' : ''}${company.valuation.impact}%

Final Adjusted Valuation: $${(company.valuation.current / 1000000).toFixed(1)}M × (1 ${company.valuation.impact >= 0 ? '+' : ''}${company.valuation.impact/100}) = $${(company.valuation.adjusted / 1000000).toFixed(1)}M`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ESGComparisonChart company={company} />
      
      <Card>
        <CardHeader>
          <CardTitle>ESG Impact on Valuation</CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <div className="space-y-6">
              <ValuationImpactChart pillarImpactData={pillarImpactData} />
              
              <ValuationImpactSummary 
                company={company}
                impactClass={impactClass}
                getValuationCalculation={getValuationCalculation}
                showCalculationDetails={showCalculationDetails}
              />
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      <CalculationDetailsDialog 
        open={dialogOpen}
        setOpen={setDialogOpen}
        title={calculationDetails.title}
        calculation={calculationDetails.calculation}
        reference={calculationDetails.reference}
      />
    </div>
  );
}

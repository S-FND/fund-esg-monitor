
import { useState } from "react";
import { CalculationDetailsDialog } from "../CalculationDetailsDialog";
import { RiskLevelChart } from "./RiskLevelChart";
import { ValuationImpactCard } from "./ValuationImpactCard";
import { TopESGConcernsCard } from "./TopESGConcernsCard";
import { IndustryComparisonChart } from "./IndustryComparisonChart";
import { PortfolioRiskMatrix } from "./PortfolioRiskMatrix";
import { 
  portfolioRiskData, 
  riskLevelData, 
  industryComparisonData, 
  chartConfig 
} from "./data";
import {
  getNetPortfolioImpactCalculation,
  getHighestPositiveImpactCalculation,
  getHighestNegativeImpactCalculation,
  getRiskScoreCalculation,
  getValuationImpactCalculation
} from "./calculations";

interface ESGMatrixOverviewProps {
  selectedFund: string;
  selectedSector: string;
}

export function ESGMatrixOverview({ selectedFund, selectedSector }: ESGMatrixOverviewProps) {
  // Filter data based on selected fund and sector
  const filteredData = portfolioRiskData.filter(item => 
    (selectedFund === "all" || item.fundName === selectedFund)
  );
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [calculationDetails, setCalculationDetails] = useState({
    title: "",
    calculation: "",
    reference: ""
  });

  const showCalculationDetails = (title: string, calculation: string, reference: string = "") => {
    setCalculationDetails({ title, calculation, reference });
    setDialogOpen(true);
  };
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RiskLevelChart data={riskLevelData} />
        
        <ValuationImpactCard 
          onShowCalculation={showCalculationDetails}
          getNetPortfolioImpactCalculation={getNetPortfolioImpactCalculation}
          getHighestPositiveImpactCalculation={getHighestPositiveImpactCalculation}
          getHighestNegativeImpactCalculation={getHighestNegativeImpactCalculation}
        />
        
        <TopESGConcernsCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <IndustryComparisonChart 
          data={industryComparisonData}
          chartConfig={chartConfig}
        />
        
        <PortfolioRiskMatrix 
          data={filteredData}
          onShowCalculation={showCalculationDetails}
          getRiskScoreCalculation={getRiskScoreCalculation}
          getValuationImpactCalculation={getValuationImpactCalculation}
        />
      </div>

      {/* Add the calculation details dialog */}
      <CalculationDetailsDialog 
        open={dialogOpen}
        setOpen={setDialogOpen}
        title={calculationDetails.title}
        calculation={calculationDetails.calculation}
        reference={calculationDetails.reference}
      />
    </>
  );
}


import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  calculatePortfolioValues, 
  generateCompanyCalculation, 
  generatePortfolioCalculation,
  pieData, 
  valuationImpactByCompany, 
  valuationImpactByOpportunity, 
  valuationImpactByRisk 
} from "./data";
import { CalculationDetailsDialog } from "../CalculationDetailsDialog";
import { ValuationSummaryCard } from "./ValuationSummaryCard";
import { ValuationBarChart, ValuationPieChart } from "./ValuationCharts";
import { ValuationDetailTable } from "./ValuationDetailTable";
import { findCompanyByName } from "./utils";
import { CalculationDetail } from "./types";

interface ValuationImpactSummaryProps {
  selectedFund: string;
  selectedCompany: string;
  selectedSector: string;
}

export function ValuationImpactSummary({ 
  selectedFund, 
  selectedCompany, 
  selectedSector 
}: ValuationImpactSummaryProps) {
  // Calculate portfolio values
  const { initialValuation, adjustedValuation, netImpact } = calculatePortfolioValues(valuationImpactByCompany);
  
  // Filter companies by fund and sector if needed
  const filteredCompanies = valuationImpactByCompany;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [calculationDetails, setCalculationDetails] = useState<CalculationDetail>({
    title: "",
    calculation: ""
  });

  const showCalculationDetails = (title: string, calculation: string, reference: string = "") => {
    setCalculationDetails({ title, calculation, reference });
    setDialogOpen(true);
  };

  const portfolioCalculation = generatePortfolioCalculation(filteredCompanies);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Portfolio Summary Card */}
        <ValuationSummaryCard
          title="Portfolio Valuation Impact"
          initialValue={initialValuation}
          adjustedValue={adjustedValuation}
          impactPercentage={netImpact}
          valueChange={adjustedValuation - initialValuation}
          showCalculationDetails={showCalculationDetails}
          calculationText={portfolioCalculation}
          referenceText="Based on Q2 2024 ESG assessments and historical performance data."
        />
        
        {/* Highest Positive Impact Card */}
        <ValuationSummaryCard
          title="Highest Positive Impact"
          companyName="MediTech Innovations"
          impactPercentage={12.4}
          valueChange={3720000}
          topFactor="Green Products"
          factorValue={4.5}
          showCalculationDetails={showCalculationDetails}
          calculationText={generateCompanyCalculation(
            findCompanyByName(valuationImpactByCompany, "MediTech Innovations")!
          )}
          referenceText="Based on Q1-Q2 2024 ESG performance data and industry benchmarks."
        />
        
        {/* Highest Negative Impact Card */}
        <ValuationSummaryCard
          title="Highest Negative Impact"
          companyName="EcoSolutions Inc."
          impactPercentage={-8.2}
          valueChange={-2050000}
          topFactor="Carbon Emissions"
          factorValue={-4.2}
          showCalculationDetails={showCalculationDetails}
          calculationText={generateCompanyCalculation(
            findCompanyByName(valuationImpactByCompany, "EcoSolutions Inc.")!
          )}
          referenceText="Based on Q1-Q2 2024 ESG performance data and industry benchmarks."
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Company Impact Bar Chart */}
        <ValuationBarChart 
          companies={filteredCompanies} 
          title="Valuation Impact by Company" 
        />
        
        {/* ESG Impact Distribution Pie Chart */}
        <ValuationPieChart 
          data={pieData} 
          title="ESG Impact Distribution" 
        />
      </div>
      
      <div className="grid grid-cols-1 gap-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>ESG Valuation Impact Detail</CardTitle>
          </CardHeader>
          <CardContent>
            <ValuationDetailTable 
              companies={filteredCompanies}
              initialValuation={initialValuation}
              adjustedValuation={adjustedValuation}
              netImpact={netImpact}
              showCalculationDetails={showCalculationDetails}
              portfolioCalculation={portfolioCalculation}
              getCompanyCalculation={generateCompanyCalculation}
            />
          </CardContent>
        </Card>
      </div>

      {/* Calculation Details Dialog */}
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


// Types for the ESG Matrix Overview components

// Sample data for the ESG Matrix Overview
export interface PortfolioRiskData {
  fundName: string;
  riskScore: number;
  valuationImpact: number;
  topRisks: string[];
  topOpportunities: string[];
}

export interface RiskLevelData {
  name: string;
  value: number;
  color: string;
}

export interface IndustryComparisonData {
  name: string;
  esg: number;
  industry: number;
}

export interface CalculationDetailsProps {
  title: string;
  calculation: string;
  reference?: string;
}

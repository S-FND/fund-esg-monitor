
// Sample data types for valuation impact components
export interface ValuationCompanyData {
  name: string;
  value: number;
  valuation: number;
  adjustedValuation: number;
  color: string;
}

export interface ValuationRiskData {
  name: string;
  value: number;
  category: string;
}

export interface ValuationOpportunityData {
  name: string;
  value: number;
  category: string;
}

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

export interface CalculationDetail {
  title: string;
  calculation: string;
  reference?: string;
}

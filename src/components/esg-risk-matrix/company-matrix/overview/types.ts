
import { CompanyData } from "../types";

export interface PillarImpactData {
  name: string;
  value: number;
}

export interface CompanyMatrixOverviewProps {
  company: CompanyData;
  pillarImpactData: PillarImpactData[];
  impactClass: string;
}

export interface ESGComparisonChartProps {
  company: CompanyData;
}

export interface ValuationImpactChartProps {
  pillarImpactData: PillarImpactData[];
}

export interface ValuationImpactSummaryProps {
  company: CompanyData;
  impactClass: string;
  getValuationCalculation: () => string;
  showCalculationDetails: (title: string, calculation: string, reference: string) => void;
}

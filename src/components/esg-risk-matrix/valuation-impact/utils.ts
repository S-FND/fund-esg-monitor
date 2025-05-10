
import { ValuationCompanyData } from "./types";

// Helper function to format currency
export const formatCurrency = (value: number, inMillions = true) => {
  const formatted = inMillions ? 
    `$${(value / 1000000).toFixed(1)}M` : 
    `$${value.toLocaleString()}`;
  return formatted;
};

// Helper function to format percentage
export const formatPercentage = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

// Helper to find company by name
export const findCompanyByName = (
  companies: ValuationCompanyData[], 
  name: string
): ValuationCompanyData | undefined => {
  return companies.find(c => c.name === name);
};

// Helper function for tooltip formatting
export const valuationTooltipFormatter = (value: any) => {
  return [`${value}%`, 'Valuation Impact'];
};

// Helper function for pie chart tooltip
export const pieTooltipFormatter = (value: any) => {
  return [`${value}%`, 'Impact Weight'];
};

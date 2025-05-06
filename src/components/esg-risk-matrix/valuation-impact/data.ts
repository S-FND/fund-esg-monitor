
import { PieChartData, ValuationCompanyData, ValuationOpportunityData, ValuationRiskData } from "./types";

// Sample data for valuation impact
export const valuationImpactByCompany: ValuationCompanyData[] = [
  { name: "EcoSolutions Inc.", value: -8.2, valuation: 25000000, adjustedValuation: 22950000, color: "#ef4444" },
  { name: "GreenHarvest", value: 3.5, valuation: 15000000, adjustedValuation: 15525000, color: "#22c55e" },
  { name: "MediTech Innovations", value: 12.4, valuation: 30000000, adjustedValuation: 33720000, color: "#22c55e" },
  { name: "EduForward", value: 5.8, valuation: 12000000, adjustedValuation: 12696000, color: "#22c55e" },
  { name: "FinSecure", value: -3.2, valuation: 10000000, adjustedValuation: 9680000, color: "#ef4444" },
];

export const valuationImpactByRisk: ValuationRiskData[] = [
  { name: "Carbon Emissions", value: -4.2, category: "Environmental" },
  { name: "Water Management", value: -2.5, category: "Environmental" },
  { name: "Supply Chain", value: -2.8, category: "Environmental" },
  { name: "Labor Practices", value: -1.8, category: "Social" },
  { name: "DEI", value: -1.2, category: "Social" },
  { name: "Board Independence", value: -2.3, category: "Governance" },
  { name: "Executive Compensation", value: -1.5, category: "Governance" },
  { name: "ESG Reporting", value: -0.9, category: "Governance" },
];

export const valuationImpactByOpportunity: ValuationOpportunityData[] = [
  { name: "Renewable Energy", value: 3.8, category: "Environmental" },
  { name: "Circular Design", value: 2.9, category: "Environmental" },
  { name: "Green Products", value: 4.5, category: "Environmental" },
  { name: "Employee Wellbeing", value: 1.7, category: "Social" },
  { name: "Community Engagement", value: 2.4, category: "Social" },
  { name: "ESG Target Setting", value: 1.8, category: "Governance" },
  { name: "Transparent Reporting", value: 1.2, category: "Governance" },
];

export const pieData: PieChartData[] = [
  { name: "Environmental Risks", value: 9.5, color: "#ef4444" },
  { name: "Social Risks", value: 3.0, color: "#f97316" },
  { name: "Governance Risks", value: 4.7, color: "#eab308" },
  { name: "Environmental Opportunities", value: 11.2, color: "#22c55e" },
  { name: "Social Opportunities", value: 4.1, color: "#14b8a6" },
  { name: "Governance Opportunities", value: 3.0, color: "#3b82f6" },
];

// Helper functions for calculations
export const calculatePortfolioValues = (companies: ValuationCompanyData[]) => {
  const initialValuation = companies.reduce((sum, company) => sum + company.valuation, 0);
  const adjustedValuation = companies.reduce((sum, company) => sum + company.adjustedValuation, 0);
  const netImpact = ((adjustedValuation - initialValuation) / initialValuation) * 100;
  
  return { initialValuation, adjustedValuation, netImpact };
};

// Generate calculation explanations
export const generatePortfolioCalculation = (companies: ValuationCompanyData[]) => {
  const { initialValuation, adjustedValuation, netImpact } = calculatePortfolioValues(companies);
  
  return `
Initial Portfolio Value: $${(initialValuation / 1000000).toFixed(1)}M
ESG-Adjusted Value: $${(adjustedValuation / 1000000).toFixed(1)}M

Calculation Method:
${companies.map(company => `
${company.name}:
  Initial: $${(company.valuation / 1000000).toFixed(1)}M
  ESG Impact: ${company.value >= 0 ? '+' : ''}${company.value}%
  Adjusted: $${(company.adjustedValuation / 1000000).toFixed(1)}M
  Value Change: ${(company.adjustedValuation - company.valuation) >= 0 ? '+' : ''}$${((company.adjustedValuation - company.valuation) / 1000000).toFixed(2)}M
`).join('')}

Net Portfolio Impact: 
  Value Change: $${((adjustedValuation - initialValuation) / 1000000).toFixed(2)}M
  Percentage Change: ${netImpact.toFixed(1)}%
`;
};

export const generateCompanyCalculation = (company: ValuationCompanyData) => `
Initial Valuation: $${(company.valuation / 1000000).toFixed(1)}M

ESG Impact: ${company.value}% 
- Environmental factors: ${company.value < 0 ? '-3.2%' : '+4.8%'}
- Social factors: ${company.value < 0 ? '-2.7%' : '+3.3%'}
- Governance factors: ${company.value < 0 ? '-2.3%' : '+4.3%'}

Calculation: $${(company.valuation / 1000000).toFixed(1)}M × (1 ${company.value >= 0 ? '+' : ''}${company.value / 100}) = $${(company.adjustedValuation / 1000000).toFixed(1)}M

Net Impact: ${(company.adjustedValuation - company.valuation) >= 0 ? '+' : ''}$${((company.adjustedValuation - company.valuation) / 1000000).toFixed(2)}M
`;

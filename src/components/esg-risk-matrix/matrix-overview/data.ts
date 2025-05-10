
import { IndustryComparisonData, PortfolioRiskData, RiskLevelData } from "./types";

// Sample data for the ESG Matrix Overview
export const portfolioRiskData: PortfolioRiskData[] = [
  { 
    fundName: "Green Tech Fund I",
    riskScore: 24,
    valuationImpact: -8.2,
    topRisks: ["Carbon Emissions", "Water Management", "Board Independence"],
    topOpportunities: ["Renewable Energy", "Circular Design", "DEI Initiatives"]
  },
  { 
    fundName: "Sustainable Growth Fund",
    riskScore: 18,
    valuationImpact: +3.5,
    topRisks: ["Supply Chain", "Data Privacy", "Talent Retention"],
    topOpportunities: ["Green Product Innovation", "Community Engagement", "ESG Reporting"]
  },
  { 
    fundName: "Impact Ventures",
    riskScore: 12,
    valuationImpact: +10.2,
    topRisks: ["Regulatory Compliance", "Climate Transition", "Executive Compensation"],
    topOpportunities: ["Social Impact Products", "Emission Reduction", "Transparent Governance"]
  }
];

export const riskLevelData: RiskLevelData[] = [
  { name: "High Risk", value: 8, color: "#ef4444" },
  { name: "Medium Risk", value: 12, color: "#f97316" },
  { name: "Low Risk", value: 17, color: "#22c55e" }
];

export const industryComparisonData: IndustryComparisonData[] = [
  { name: "Your Portfolio", esg: 78, industry: 65 },
  { name: "ClimateTech", esg: 82, industry: 70 },
  { name: "AgriTech", esg: 75, industry: 68 },
  { name: "HealthTech", esg: 92, industry: 72 },
  { name: "EdTech", esg: 80, industry: 69 },
  { name: "FinTech", esg: 75, industry: 65 },
];

export const chartConfig = {
  esg: { color: "#8b5cf6" },
  industry: { color: "#94a3b8" }
};

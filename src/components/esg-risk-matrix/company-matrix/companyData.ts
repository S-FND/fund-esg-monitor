
import { CompanyDataMap } from "./types";

// Sample data for the companies
export const companyData: CompanyDataMap = {
  "1": {
    name: "EcoSolutions Inc.",
    valuation: {
      current: 25000000,
      adjusted: 22950000,
      impact: -8.2
    },
    industry: "ClimateTech",
    esgScores: {
      environmental: 85,
      social: 75,
      governance: 80,
      overall: 80
    },
    esgRiskData: [
      { category: "Environmental", parameter: "Carbon Emissions", score: 4, weight: 0.3, impact: -3.6 },
      { category: "Environmental", parameter: "Water Management", score: 3, weight: 0.2, impact: -1.8 },
      { category: "Environmental", parameter: "Waste Management", score: 2, weight: 0.15, impact: -0.9 },
      { category: "Social", parameter: "DEI", score: 2, weight: 0.2, impact: -1.2 },
      { category: "Social", parameter: "Community Relations", score: 1, weight: 0.15, impact: -0.45 },
      { category: "Governance", parameter: "Board Independence", score: 3, weight: 0.25, impact: -2.25 },
      { category: "Governance", parameter: "ESG Reporting", score: 1, weight: 0.2, impact: -0.6 }
    ],
    esgOpportunityData: [
      { category: "Environmental", parameter: "Renewable Energy Use", score: 4, weight: 0.3, impact: 2.4 },
      { category: "Environmental", parameter: "Circular Product Design", score: 3, weight: 0.25, impact: 1.5 },
      { category: "Social", parameter: "Employee Wellbeing", score: 2, weight: 0.2, impact: 0.8 },
      { category: "Governance", parameter: "ESG Target Setting", score: 3, weight: 0.25, impact: 1.5 }
    ],
    historicalData: [
      { quarter: "Q1 2024", esgScore: 72, industryAvg: 68 },
      { quarter: "Q2 2024", esgScore: 75, industryAvg: 69 },
      { quarter: "Q3 2024", esgScore: 78, industryAvg: 70 },
      { quarter: "Q4 2024", esgScore: 80, industryAvg: 70 }
    ],
    radarData: [
      { subject: "Carbon Emissions", A: 65, B: 90, fullMark: 100 },
      { subject: "Water Usage", A: 80, B: 70, fullMark: 100 },
      { subject: "Waste Management", A: 86, B: 65, fullMark: 100 },
      { subject: "DEI", A: 70, B: 78, fullMark: 100 },
      { subject: "Board Structure", A: 80, B: 65, fullMark: 100 },
      { subject: "ESG Reporting", A: 65, B: 85, fullMark: 100 },
    ],
  },
  "2": {
    name: "GreenHarvest",
    valuation: {
      current: 15000000,
      adjusted: 15525000,
      impact: 3.5
    },
    industry: "AgriTech",
    esgScores: {
      environmental: 70,
      social: 90,
      governance: 75,
      overall: 78
    },
    esgRiskData: [
      { category: "Environmental", parameter: "Supply Chain", score: 3, weight: 0.3, impact: -2.7 },
      { category: "Social", parameter: "Labor Rights", score: 2, weight: 0.25, impact: -1.5 },
      { category: "Governance", parameter: "Tax Transparency", score: 3, weight: 0.2, impact: -1.8 }
    ],
    esgOpportunityData: [
      { category: "Environmental", parameter: "Sustainable Farming", score: 5, weight: 0.35, impact: 3.5 },
      { category: "Social", parameter: "Community Engagement", score: 4, weight: 0.3, impact: 2.4 },
      { category: "Governance", parameter: "ESG Reporting", score: 4, weight: 0.25, impact: 2.0 }
    ],
    historicalData: [
      { quarter: "Q1 2024", esgScore: 70, industryAvg: 65 },
      { quarter: "Q2 2024", esgScore: 72, industryAvg: 66 },
      { quarter: "Q3 2024", esgScore: 75, industryAvg: 67 },
      { quarter: "Q4 2024", esgScore: 78, industryAvg: 68 }
    ],
    radarData: [
      { subject: "Carbon Emissions", A: 80, B: 70, fullMark: 100 },
      { subject: "Water Usage", A: 65, B: 75, fullMark: 100 },
      { subject: "Waste Management", A: 75, B: 68, fullMark: 100 },
      { subject: "DEI", A: 90, B: 72, fullMark: 100 },
      { subject: "Board Structure", A: 75, B: 65, fullMark: 100 },
      { subject: "ESG Reporting", A: 75, B: 60, fullMark: 100 },
    ]
  }
};

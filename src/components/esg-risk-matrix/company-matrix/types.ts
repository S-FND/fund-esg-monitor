
// Type definitions for ESG company data
export interface ESGRiskData {
  category: string;
  parameter: string;
  score: number;
  weight: number;
  impact: number;
  calculation?: string; // Calculation explanation
  reference?: string;  // Reference to historical data
}

export interface ESGScore {
  environmental: number;
  social: number;
  governance: number;
  overall: number;
}

export interface Valuation {
  current: number;
  adjusted: number;
  impact: number;
  calculation?: string; // Detailed calculation explanation
  reference?: string;   // Reference to historical data used
}

export interface HistoricalData {
  quarter: string;
  esgScore: number;
  industryAvg: number;
}

export interface RadarData {
  subject: string;
  A: number;
  B: number;
  fullMark: number;
}

export interface CompanyData {
  name: string;
  valuation: Valuation;
  industry: string;
  esgScores: ESGScore;
  esgRiskData: ESGRiskData[];
  esgOpportunityData: ESGRiskData[];
  historicalData: HistoricalData[];
  radarData: RadarData[];
}

export interface PillarImpactData {
  name: string;
  value: number;
  calculation?: string; // Calculation explanation
  reference?: string;   // Reference to historical data
}

export interface CompanyDataMap {
  [key: string]: CompanyData;
}


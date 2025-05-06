
import { CompanyData } from "../types";

export interface HistoricalComponentProps {
  company: CompanyData;
}

export interface FinancialPerformanceData {
  index: string;
  company: number;
  djsiSimilar: number;
  msciSimilar: number;
}

export interface PeerCompanyLists {
  djsi: string[];
  msci: string[];
}

export interface LongTermFinancialData {
  year: string;
  company: number;
  djsiPeers: number;
  msciPeers: number;
  projected?: boolean;
}

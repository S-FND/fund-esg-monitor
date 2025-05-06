
import { FinancialPerformanceData, LongTermFinancialData, PeerCompanyLists } from "./types";

// Financial performance comparison data for companies with similar ESG scores
export const financialPerformanceData: FinancialPerformanceData[] = [
  { 
    index: "Revenue Growth", 
    company: 5.7, 
    djsiSimilar: 4.2, 
    msciSimilar: 3.8 
  },
  { 
    index: "EBITDA Margin", 
    company: 18.3, 
    djsiSimilar: 16.5, 
    msciSimilar: 15.9 
  },
  { 
    index: "ROE", 
    company: 12.4, 
    djsiSimilar: 10.8, 
    msciSimilar: 9.7 
  },
  { 
    index: "Debt-to-Equity", 
    company: 0.85, 
    djsiSimilar: 1.2, 
    msciSimilar: 1.4 
  },
  { 
    index: "FCF Growth", 
    company: 7.2, 
    djsiSimilar: 5.1, 
    msciSimilar: 4.8 
  }
];

// Peer companies list
export const peerCompaniesList: PeerCompanyLists = {
  djsi: [
    "Novartis AG", "Roche Holding AG", "Johnson & Johnson", 
    "Pfizer Inc.", "Merck & Co., Inc.", "Bristol-Myers Squibb", 
    "Amgen Inc.", "Sanofi S.A.", "AstraZeneca PLC", 
    "Eli Lilly and Company", "GlaxoSmithKline plc", "Biogen Inc.", 
    "Gilead Sciences, Inc.", "Abbott Laboratories", "Novo Nordisk A/S"
  ],
  msci: [
    "Johnson & Johnson", "Pfizer Inc.", "Merck & Co., Inc.", 
    "AbbVie Inc.", "Thermo Fisher Scientific", "Novartis AG", 
    "Roche Holding AG", "Bristol-Myers Squibb", "AstraZeneca PLC", 
    "Eli Lilly and Company", "Amgen Inc.", "Danaher Corporation"
  ]
};

// Long-term financial performance data (historical and projected)
export const longTermFinancialData: LongTermFinancialData[] = [
  { year: "2015", company: 78.4, djsiPeers: 72.1, msciPeers: 70.8 },
  { year: "2016", company: 82.7, djsiPeers: 74.5, msciPeers: 73.2 },
  { year: "2017", company: 88.3, djsiPeers: 78.2, msciPeers: 76.8 },
  { year: "2018", company: 92.5, djsiPeers: 79.8, msciPeers: 78.5 },
  { year: "2019", company: 96.8, djsiPeers: 82.3, msciPeers: 81.7 },
  { year: "2020", company: 89.5, djsiPeers: 77.4, msciPeers: 76.2 },
  { year: "2021", company: 94.2, djsiPeers: 83.6, msciPeers: 82.1 },
  { year: "2022", company: 97.8, djsiPeers: 85.9, msciPeers: 84.3 },
  { year: "2023", company: 103.5, djsiPeers: 88.7, msciPeers: 87.2 },
  { year: "2024", company: 108.2, djsiPeers: 91.5, msciPeers: 90.4 },
  // Projected data
  { year: "2025", company: 113.6, djsiPeers: 94.8, msciPeers: 93.2, projected: true },
  { year: "2026", company: 119.4, djsiPeers: 98.2, msciPeers: 96.7, projected: true },
  { year: "2027", company: 125.6, djsiPeers: 102.1, msciPeers: 100.3, projected: true },
  { year: "2028", company: 132.3, djsiPeers: 105.7, msciPeers: 103.8, projected: true },
  { year: "2029", company: 139.4, djsiPeers: 109.6, msciPeers: 107.5, projected: true }
];

// Split the data into historical and projected for different chart styles
export const historicalData = longTermFinancialData.filter((item) => !item.projected);
export const projectedData = longTermFinancialData.filter((item) => item.projected);

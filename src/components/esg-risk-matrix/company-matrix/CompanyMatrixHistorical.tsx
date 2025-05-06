
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, AreaChart, Area } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { CompanyData } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CompanyMatrixHistoricalProps {
  company: CompanyData;
}

// Financial performance comparison data for companies with similar ESG scores
const financialPerformanceData = [
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
const peerCompaniesList = {
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
const longTermFinancialData = [
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

// Split the data into historical and projected for different dash styles
const historicalData = longTermFinancialData.filter((item) => !item.projected);
const projectedData = longTermFinancialData.filter((item) => item.projected);

export function CompanyMatrixHistorical({ company }: CompanyMatrixHistoricalProps) {
  // Create a custom renderer for the XAxis that adds a dashed line for projected years
  const customAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const year = parseInt(payload.value);
    const isProjected = year >= 2025;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={16} 
          textAnchor="middle" 
          fill={isProjected ? "#666666" : "#000000"}
          style={{ fontStyle: isProjected ? 'italic' : 'normal' }}
        >
          {payload.value}
        </text>
      </g>
    );
  };
  
  return (
    <div className="grid grid-cols-1 gap-4">
      <Tabs defaultValue="esg">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="esg">ESG Performance</TabsTrigger>
          <TabsTrigger value="financial">Financial Comparison</TabsTrigger>
          <TabsTrigger value="longterm">Long-term Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="esg">
          <Card>
            <CardHeader>
              <CardTitle>Historical ESG Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-[300px]" config={{
                esgScore: { color: "#8b5cf6" },
                industryAvg: { color: "#94a3b8" }
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={company.historicalData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="esgScore" 
                      name={`${company.name} ESG Score`}
                      stroke="#8b5cf6" 
                      strokeWidth={2} 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="industryAvg" 
                      name="Industry Average" 
                      stroke="#94a3b8" 
                      strokeWidth={2} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>Financial Performance vs Similar ESG-Rated Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Comparing {company.name}'s financial metrics against companies with similar ESG scores in DJSI and MSCI indices (trailing 12 months)
              </p>
              <ChartContainer className="h-[300px]" config={{
                company: { color: "#8b5cf6" },
                djsiSimilar: { color: "#22c55e" },
                msciSimilar: { color: "#3b82f6" }
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={financialPerformanceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar 
                      dataKey="company" 
                      name={`${company.name}`}
                      fill="#8b5cf6" 
                    />
                    <Bar 
                      dataKey="djsiSimilar" 
                      name="DJSI Similar ESG" 
                      fill="#22c55e" 
                    />
                    <Bar 
                      dataKey="msciSimilar" 
                      name="MSCI Similar ESG" 
                      fill="#3b82f6" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
              
              <div className="mt-6">
                <h4 className="font-medium text-base mb-2">Peer Companies</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium mb-2">DJSI ESG Peers</h5>
                    <div className="bg-muted rounded-md p-3 max-h-[200px] overflow-y-auto">
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {peerCompaniesList.djsi.map((company, index) => (
                          <li key={`djsi-${index}`}>{company}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium mb-2">MSCI ESG Leaders Peers</h5>
                    <div className="bg-muted rounded-md p-3 max-h-[200px] overflow-y-auto">
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {peerCompaniesList.msci.map((company, index) => (
                          <li key={`msci-${index}`}>{company}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-sm">
                <p className="font-medium">Analysis Methodology:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                  <li>Companies selected based on similar ESG ratings (±5 points) within same industry sector</li>
                  <li>DJSI (Dow Jones Sustainability Index) peer group: 15 companies</li>
                  <li>MSCI ESG Leaders peer group: 12 companies</li>
                  <li>Data source: Latest quarterly financial reports (Q1-Q2 2024)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="longterm">
          <Card>
            <CardHeader>
              <CardTitle>Long-term Financial Performance (2015-2029)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                10-year historical and 5-year projected financial performance index (2015=100 base) compared to peer groups
              </p>
              <ChartContainer className="h-[350px]" config={{
                company: { color: "#8b5cf6" },
                djsiPeers: { color: "#22c55e" },
                msciPeers: { color: "#3b82f6" }
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={longTermFinancialData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient id="colorCompany" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorDjsi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorMsci" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                      <pattern id="projectionPattern" patternUnits="userSpaceOnUse" width="4" height="4">
                        <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#000" strokeWidth="0.5" opacity="0.2"/>
                      </pattern>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="year"
                      tick={customAxisTick}
                    />
                    <YAxis 
                      domain={[60, 150]} 
                      label={{ value: 'Performance Index (2015=100)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} 
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    
                    {/* Historical Data Areas */}
                    <Area 
                      type="monotone" 
                      dataKey="company" 
                      name={`${company.name}`} 
                      stroke="#8b5cf6" 
                      fillOpacity={1}
                      fill="url(#colorCompany)" 
                      strokeWidth={2}
                      data={historicalData}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="djsiPeers" 
                      name="DJSI Peers" 
                      stroke="#22c55e" 
                      fillOpacity={1}
                      fill="url(#colorDjsi)" 
                      strokeWidth={2}
                      data={historicalData}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="msciPeers" 
                      name="MSCI Peers" 
                      stroke="#3b82f6" 
                      fillOpacity={1}
                      fill="url(#colorMsci)" 
                      strokeWidth={2}
                      data={historicalData}
                    />
                    
                    {/* Projected Data Areas with Dashed Lines */}
                    <Area 
                      type="monotone" 
                      dataKey="company" 
                      name={`${company.name} (Projected)`} 
                      stroke="#8b5cf6" 
                      fillOpacity={1}
                      fill="url(#colorCompany)" 
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      data={projectedData}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="djsiPeers" 
                      name="DJSI Peers (Projected)" 
                      stroke="#22c55e" 
                      fillOpacity={1}
                      fill="url(#colorDjsi)" 
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      data={projectedData}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="msciPeers" 
                      name="MSCI Peers (Projected)" 
                      stroke="#3b82f6" 
                      fillOpacity={1}
                      fill="url(#colorMsci)" 
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      data={projectedData}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
              
              <div className="flex items-center justify-center gap-8 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-foreground"></div>
                  <span className="text-xs">Historical Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-foreground border-dashed border-t border-foreground"></div>
                  <span className="text-xs">Projected Data</span>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Performance Details by Period</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>{company.name}</TableHead>
                      <TableHead>DJSI Peers</TableHead>
                      <TableHead>MSCI Peers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">2015-2019 (Pre-pandemic)</TableCell>
                      <TableCell className="text-purple-500">+23.5%</TableCell>
                      <TableCell className="text-green-600">+14.1%</TableCell>
                      <TableCell className="text-blue-500">+15.3%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">2020-2024 (Recovery)</TableCell>
                      <TableCell className="text-purple-500">+20.9%</TableCell>
                      <TableCell className="text-green-600">+18.2%</TableCell>
                      <TableCell className="text-blue-500">+18.6%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">2025-2029 (Projected)</TableCell>
                      <TableCell className="text-purple-500">+28.8%</TableCell>
                      <TableCell className="text-green-600">+19.8%</TableCell>
                      <TableCell className="text-blue-500">+18.9%</TableCell>
                    </TableRow>
                    <TableRow className="font-medium">
                      <TableCell>Overall Growth (2015-2029)</TableCell>
                      <TableCell className="text-purple-500">+77.8%</TableCell>
                      <TableCell className="text-green-600">+52.0%</TableCell>
                      <TableCell className="text-blue-500">+51.8%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4 text-sm">
                <p className="font-medium">Projection Methodology:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                  <li>Historical data (2015-2024) based on audited financial statements</li>
                  <li>Projections (2025-2029) based on regression analysis of historical performance</li>
                  <li>Factors considered: ESG improvement trajectory, industry growth trends, macro-economic indicators</li>
                  <li>Additional alpha attributed to companies with stronger ESG performance based on academic research</li>
                  <li>Data sources: Bloomberg Terminal, FactSet, MSCI ESG Research</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

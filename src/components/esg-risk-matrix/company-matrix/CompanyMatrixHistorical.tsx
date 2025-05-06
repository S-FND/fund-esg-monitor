
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { CompanyData } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export function CompanyMatrixHistorical({ company }: CompanyMatrixHistoricalProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <Tabs defaultValue="esg">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="esg">ESG Performance</TabsTrigger>
          <TabsTrigger value="financial">Financial Comparison</TabsTrigger>
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
      </Tabs>
    </div>
  );
}

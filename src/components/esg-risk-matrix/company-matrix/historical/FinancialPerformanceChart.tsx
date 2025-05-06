
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { financialPerformanceData, peerCompaniesList } from "./data";
import { HistoricalComponentProps } from "./types";

export function FinancialPerformanceChart({ company }: HistoricalComponentProps) {
  return (
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
  );
}

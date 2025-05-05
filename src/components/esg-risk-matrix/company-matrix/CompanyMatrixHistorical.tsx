
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { CompanyData } from "./types";

interface CompanyMatrixHistoricalProps {
  company: CompanyData;
}

export function CompanyMatrixHistorical({ company }: CompanyMatrixHistoricalProps) {
  return (
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
  );
}

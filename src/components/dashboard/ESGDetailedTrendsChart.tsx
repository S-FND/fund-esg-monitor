import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface TrendsData {
  period: string;
  environmental: number;
  social: number;
  governance: number;
  overall: number;
}

interface ESGDetailedTrendsChartProps {
  data: TrendsData[];
  timelineGranularity: string;
}

const chartConfig = {
  environmental: { color: "#22c55e" },
  social: { color: "#3b82f6" },
  governance: { color: "#8b5cf6" },
  overall: { color: "#f43f5e" }
};

export function ESGDetailedTrendsChart({ data, timelineGranularity }: ESGDetailedTrendsChartProps) {
  const title = timelineGranularity === "monthly" ? "Monthly ESG Performance Trends" : "Annual ESG Performance Trends";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[400px]" config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis domain={[0, 100]} label={{ value: 'Score', angle: -90, position: 'insideLeft', offset: -5 }} />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="environmental" 
                name="Environmental" 
                stroke="#22c55e" 
                strokeWidth={2} 
                activeDot={{ r: 6 }} 
              />
              <Line 
                type="monotone" 
                dataKey="social" 
                name="Social" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                activeDot={{ r: 6 }} 
              />
              <Line 
                type="monotone" 
                dataKey="governance" 
                name="Governance" 
                stroke="#8b5cf6" 
                strokeWidth={2} 
                activeDot={{ r: 6 }} 
              />
              <Line 
                type="monotone" 
                dataKey="overall" 
                name="Overall ESG" 
                stroke="#f43f5e" 
                strokeWidth={3} 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
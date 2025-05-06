
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { IndustryComparisonData } from "./types";

interface IndustryComparisonChartProps {
  data: IndustryComparisonData[];
  chartConfig: {
    esg: { color: string };
    industry: { color: string };
  }
}

export function IndustryComparisonChart({ data, chartConfig }: IndustryComparisonChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Industry ESG Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[300px]" config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                label={{ value: 'Score', angle: -90, position: 'insideLeft', offset: -5 }}
                domain={[0, 100]}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="esg" name="Your Portfolio" fill="#8b5cf6" />
              <Bar dataKey="industry" name="Industry Average" fill="#94a3b8" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

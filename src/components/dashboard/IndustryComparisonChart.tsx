import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface IndustryData {
  industry: string;
  environmental: number;
  social: number;
  governance: number;
  overall: number;
  companies: number;
}

interface IndustryComparisonChartProps {
  data: IndustryData[];
}

const chartConfig = {
  environmental: { color: "#22c55e" },
  social: { color: "#3b82f6" },
  governance: { color: "#8b5cf6" },
  overall: { color: "#f43f5e" }
};

export function IndustryComparisonChart({ data }: IndustryComparisonChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Industry ESG Performance Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[400px]" config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="industry" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                label={{ value: 'ESG Score', angle: -90, position: 'insideLeft', offset: -5 }}
                domain={[0, 100]}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="environmental" name="Environmental" fill="#22c55e" />
              <Bar dataKey="social" name="Social" fill="#3b82f6" />
              <Bar dataKey="governance" name="Governance" fill="#8b5cf6" />
              <Bar dataKey="overall" name="Overall ESG" fill="#f43f5e" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
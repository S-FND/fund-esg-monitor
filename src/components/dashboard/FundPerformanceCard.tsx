
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const fundPerformanceData = [
  { fund: "Green Tech Fund I", environmental: 85, social: 75, governance: 80 },
  { fund: "Sustainable Growth Fund", environmental: 70, social: 90, governance: 85 },
  { fund: "Impact Ventures", environmental: 80, social: 78, governance: 90 },
];

const chartConfig = {
  environmental: { color: "#22c55e" },
  social: { color: "#3b82f6" },
  governance: { color: "#8b5cf6" }
};

export function FundPerformanceCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ESG Performance by Fund</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[300px]" config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={fundPerformanceData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <XAxis 
                dataKey="fund" 
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
              <Bar dataKey="environmental" name="Environmental" fill="#22c55e" />
              <Bar dataKey="social" name="Social" fill="#3b82f6" />
              <Bar dataKey="governance" name="Governance" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

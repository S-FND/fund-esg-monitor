
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { ESGComparisonChartProps } from "./types";

export function ESGComparisonChart({ company }: ESGComparisonChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ESG Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[300px]" config={{
          esgScore: { color: "#8b5cf6" },
          industryAvg: { color: "#94a3b8" },
          A: { color: "#22c55e" },
          B: { color: "#3b82f6" }
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart outerRadius={90} data={company.radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Tooltip content={<ChartTooltipContent />} />
              <Radar name={company.name} dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
              <Radar name="Industry Average" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

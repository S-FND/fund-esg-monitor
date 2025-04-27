
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

const sdgColors = {
  1: "#E5243B", // No Poverty
  2: "#DDA63A", // Zero Hunger
  3: "#4C9F38", // Good Health and Well-being
  4: "#C5192D", // Quality Education
  5: "#FF3A21", // Gender Equality
  6: "#26BDE2", // Clean Water and Sanitation
  7: "#FCC30B", // Affordable and Clean Energy
  8: "#A21942", // Decent Work and Economic Growth
  9: "#FD6925", // Industry, Innovation and Infrastructure
  10: "#DD1367", // Reduced Inequalities
  11: "#FD9D24", // Sustainable Cities and Communities
  12: "#BF8B2E", // Responsible Consumption and Production
  13: "#3F7E44", // Climate Action
  14: "#0A97D9", // Life Below Water
  15: "#56C02B", // Life on Land
  16: "#00689D", // Peace, Justice and Strong Institutions
  17: "#19486A", // Partnerships for the Goals
};

interface SDGData {
  sdgNumber: number;
  progress: number;
}

interface SDGPerformanceCardProps {
  selectedFund?: string;
  selectedCompany?: string;
  selectedYear?: string;
}

export function SDGPerformanceCard({
  selectedFund = "all",
  selectedCompany = "all",
  selectedYear = "2025",
}: SDGPerformanceCardProps) {
  // This would be fetched from an API in a real application
  const sdgData: SDGData[] = [
    { sdgNumber: 7, progress: 78 },
    { sdgNumber: 13, progress: 65 },
    { sdgNumber: 12, progress: 82 },
    { sdgNumber: 8, progress: 71 },
    { sdgNumber: 9, progress: 59 },
  ];

  const chartData = sdgData.map((item) => ({
    name: `SDG ${item.sdgNumber}`,
    sdgNumber: item.sdgNumber,
    progress: item.progress,
    color: sdgColors[item.sdgNumber as keyof typeof sdgColors] || "#000000",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>SDG Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="h-[300px]"
          config={{
            sdg7: { color: sdgColors[7] },
            sdg13: { color: sdgColors[13] },
            sdg12: { color: sdgColors[12] },
            sdg8: { color: sdgColors[8] },
            sdg9: { color: sdgColors[9] },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1">
                            <div
                              className="h-3 w-3 rounded"
                              style={{ backgroundColor: data.color }}
                            />
                            <span className="font-bold">SDG {data.sdgNumber}</span>
                          </div>
                          <div>{data.progress}%</div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="progress"
                fill="currentColor"
                radius={[4, 4, 0, 0]}
                className="fill-primary"
                barSize={30}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

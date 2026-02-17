// components/dashboard/SDGPerformanceCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

const sdgColors = {
  1: "#E5243B", 2: "#DDA63A", 3: "#4C9F38", 4: "#C5192D", 5: "#FF3A21",
  6: "#26BDE2", 7: "#FCC30B", 8: "#A21942", 9: "#FD6925", 10: "#DD1367",
  11: "#FD9D24", 12: "#BF8B2E", 13: "#3F7E44", 14: "#0A97D9", 15: "#56C02B",
  16: "#00689D", 17: "#19486A",
};

interface SDGPerformanceCardProps {
  data?: {
    data?: {
      overallScore?: number;
      topPerforming?: string[];
      needsImprovement?: string[];
      sdgData?: Array<{
        sdgNumber: number;
        progress: number;
      }>;
    };
  };
}

export function SDGPerformanceCard({ data }: SDGPerformanceCardProps) {
  // Default data if none provided
  const defaultSdgData = [
    { sdgNumber: 7, progress: 78 },
    { sdgNumber: 13, progress: 65 },
    { sdgNumber: 12, progress: 82 },
    { sdgNumber: 8, progress: 71 },
    { sdgNumber: 9, progress: 59 },
  ];

  const sdgData = data?.data?.sdgData || defaultSdgData;

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
        <ChartContainer className="h-[300px]" config={{}}>
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
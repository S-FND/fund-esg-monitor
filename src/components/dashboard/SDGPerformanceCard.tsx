// components/dashboard/SDGPerformanceCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

const sdgColors: Record<number, string> = {
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
        name?: string;
      }>;
    };
  };
  selectedPortfolio?: string;
  dashboardTopics?: string[];
}

// Empty data placeholder
const getEmptyBarData = () => [{ name: 'No Data Available', value: 0 }];

export function SDGPerformanceCard({ 
  data, 
  selectedPortfolio = "fundwise",
  dashboardTopics = [] 
}: SDGPerformanceCardProps) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  useEffect(() => {
    const sdgTopics = ['sdg_strategy'];
    const activeSdgTopics = sdgTopics.filter(topic => dashboardTopics.includes(topic));
    setSelectedTopics(activeSdgTopics);
  }, [dashboardTopics]);

  const sdgData = data?.data?.sdgData || [];
  const hasData = sdgData.length > 0;
  const hasTopic = dashboardTopics.includes('sdg_strategy') || dashboardTopics.length === 0;

  // Show message when no topics selected but we're in fundwise with specific fund
  if (dashboardTopics.length > 0 && !dashboardTopics.includes('sdg_strategy') && selectedTopics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            SDG Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg">No SDG topics selected</p>
            <p className="text-sm text-muted-foreground/70 mt-2">
              This fund has no SDG metrics configured in dashboard topics
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasData || !hasTopic) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            SDG Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No SDG performance data available</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {selectedPortfolio === "fundwise" 
                ? "Select a fund to view SDG performance" 
                : "Select a company to view SDG performance"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = sdgData.map((item) => ({
    name: `SDG ${item.sdgNumber}`,
    sdgNumber: item.sdgNumber,
    progress: item.progress,
    color: sdgColors[item.sdgNumber] || "#000000",
  }));

  const averageProgress = Math.round(
    chartData.reduce((acc, item) => acc + item.progress, 0) / chartData.length
  );

  return (
    <Card>
      {/* Show active topics indicator when filtering is active */}
      {dashboardTopics.length > 0 && selectedTopics.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 mx-6 mt-4">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            <span className="font-medium">Active SDG Topics:</span> {selectedTopics.join(' • ')}
          </p>
        </div>
      )}

      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            SDG Performance
          </span>
          {averageProgress > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              Avg Progress: {averageProgress}%
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} label={{ value: 'Progress (%)', angle: -90, position: 'insideLeft', offset: -5 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded"
                              style={{ backgroundColor: data.color }}
                            />
                            <span className="font-bold">SDG {data.sdgNumber}</span>
                          </div>
                          <div className="text-sm">
                            Progress: <span className="font-bold">{data.progress}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="progress"
                radius={[4, 4, 0, 0]}
                barSize={30}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {data?.data?.topPerforming && data.data.topPerforming.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {data.data.topPerforming.length > 0 && (
              <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded">
                <p className="text-xs text-green-600 font-medium">Top Performing</p>
                <p className="text-sm truncate">{data.data.topPerforming.join(', ')}</p>
              </div>
            )}
            {data.data.needsImprovement && data.data.needsImprovement.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950/20 p-2 rounded">
                <p className="text-xs text-red-600 font-medium">Needs Improvement</p>
                <p className="text-sm truncate">{data.data.needsImprovement.join(', ')}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
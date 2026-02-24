// components/dashboard/TopSDGsCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";
import { useEffect, useState } from "react";

const sdgColors: Record<number, string> = {
  1: "#E5243B", 2: "#DDA63A", 3: "#4C9F38", 4: "#C5192D", 5: "#FF3A21",
  6: "#26BDE2", 7: "#FCC30B", 8: "#A21942", 9: "#FD6925", 10: "#DD1367",
  11: "#FD9D24", 12: "#BF8B2E", 13: "#3F7E44", 14: "#0A97D9", 15: "#56C02B",
  16: "#00689D", 17: "#19486A",
};

const sdgNames: Record<number, string> = {
  1: "No Poverty", 2: "Zero Hunger", 3: "Good Health", 4: "Quality Education",
  5: "Gender Equality", 6: "Clean Water", 7: "Clean Energy", 8: "Decent Work",
  9: "Industry & Innovation", 10: "Reduced Inequalities", 11: "Sustainable Cities",
  12: "Responsible Consumption", 13: "Climate Action", 14: "Life Below Water",
  15: "Life on Land", 16: "Peace & Justice", 17: "Partnerships",
};

interface TopSDGsCardProps {
  data?: Array<{
    sdgNumber: number;
    name?: string;
    companies: number;
    totalCompanies: number;
    progress?: number;
  }>;
  selectedPortfolio?: string;
  dashboardTopics?: string[];
}

export function TopSDGsCard({ 
  data, 
  selectedPortfolio = "fundwise",
  dashboardTopics = [] 
}: TopSDGsCardProps) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  useEffect(() => {
    const sdgTopics = ['sdg_strategy'];
    const activeSdgTopics = sdgTopics.filter(topic => dashboardTopics.includes(topic));
    setSelectedTopics(activeSdgTopics);
  }, [dashboardTopics]);

  const topSDGs = data || [];
  const hasData = topSDGs.length > 0;
  const hasTopic = dashboardTopics.includes('sdg_strategy') || dashboardTopics.length === 0;

  // Show message when no topics selected but we're in fundwise with specific fund
  if (dashboardTopics.length > 0 && !dashboardTopics.includes('sdg_strategy') && selectedTopics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Top SDGs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground/30 mb-4" />
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
            <Target className="h-5 w-5 text-blue-500" />
            Top SDGs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg">No SDG data available</p>
            <p className="text-sm text-muted-foreground/70 mt-2">
              {selectedPortfolio === "fundwise" 
                ? "No SDG data found for the selected fund" 
                : "No SDG data found for this company"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          Top SDGs Across Portfolio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {topSDGs.slice(0, 5).map((sdg) => {
            const sdgName = sdg?.name || sdgNames[sdg.sdgNumber] || `SDG ${sdg.sdgNumber}`;
            const color = sdgColors[sdg.sdgNumber] || "#000000";
            const progress = sdg.progress || (sdg.companies / sdg.totalCompanies) * 100;
            
            return (
              <div key={sdg.sdgNumber} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: color }} />
                    <span className="font-medium text-sm">SDG {sdg.sdgNumber}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {sdg.companies} of {sdg.totalCompanies}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">{sdgName}</p>
                <Progress value={progress} className="h-2" style={{ backgroundColor: `${color}20` }} />
              </div>
            );
          })}
          {topSDGs.length > 5 && (
            <p className="text-sm text-center text-muted-foreground pt-2">
              +{topSDGs.length - 5} more SDGs
            </p>
          )}
        </div>
        <div className="mt-4 text-xs text-muted-foreground text-right">
          Total SDGs: {topSDGs.length}
        </div>
      </CardContent>
    </Card>
  );
}
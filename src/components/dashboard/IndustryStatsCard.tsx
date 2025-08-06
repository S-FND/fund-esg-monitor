import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, TrendingUp, Users } from "lucide-react";

interface IndustryStatsCardProps {
  totalIndustries: number;
  topPerformingIndustry: string;
  averageESGScore: number;
}

export function IndustryStatsCard({ totalIndustries, topPerformingIndustry, averageESGScore }: IndustryStatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Industry Overview</CardTitle>
        <Building2 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-2xl font-bold">{totalIndustries}</div>
            <p className="text-xs text-muted-foreground">Total Industries</p>
          </div>
          <div>
            <div className="text-lg font-semibold text-primary">{topPerformingIndustry}</div>
            <p className="text-xs text-muted-foreground">Top Performing Industry</p>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <div>
              <div className="text-lg font-semibold">{averageESGScore}</div>
              <p className="text-xs text-muted-foreground">Avg ESG Score</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
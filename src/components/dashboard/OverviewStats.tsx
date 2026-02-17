// components/dashboard/OverviewStats.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Target, TrendingUp, Users } from "lucide-react";

interface OverviewStatsProps {
  stats?: {
    totalFunds?: number;
    totalCompanies?: number;
    totalCapital?: number;
    avgESGScore?: number;
    esgBreakdown?: {
      environmental: number;
      social: number;
      governance: number;
    };
  };
  funds: any[];
  companies: any[];
}

export function OverviewStats({ stats, funds, companies }: OverviewStatsProps) {
  const totalFunds = stats?.totalFunds || funds?.length || 0;
  const totalCompanies = stats?.totalCompanies || companies?.length || 0;
  const avgESGScore = stats?.avgESGScore || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Funds</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalFunds}</div>
          <p className="text-xs text-muted-foreground">Active investment funds</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Portfolio Companies</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCompanies}</div>
          <p className="text-xs text-muted-foreground">Active investments</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Capital</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$0</div>
          <p className="text-xs text-muted-foreground">Under management</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Avg ESG Score</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgESGScore}%</div>
          <div className="flex gap-2 text-xs">
            <span className="text-green-600">E: {stats?.esgBreakdown?.environmental || 0}%</span>
            <span className="text-blue-600">S: {stats?.esgBreakdown?.social || 0}%</span>
            <span className="text-purple-600">G: {stats?.esgBreakdown?.governance || 0}%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
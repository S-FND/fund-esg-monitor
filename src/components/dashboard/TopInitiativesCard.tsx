// components/dashboard/TopInitiativesCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Leaf } from "lucide-react";
import { useEffect, useState } from "react";

interface Initiative {
  id?: number;
  title: string;
  progress: number;
  companies: string[];
  sdgNumber: number;
  description?: string;
}

interface TopInitiativesCardProps {
  data?: Initiative[];
  selectedPortfolio?: string;
  dashboardTopics?: string[];
}

export function TopInitiativesCard({ 
  data, 
  selectedPortfolio = "fundwise",
  dashboardTopics = [] 
}: TopInitiativesCardProps) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  useEffect(() => {
    const sdgTopics = ['sdg_strategy'];
    const activeSdgTopics = sdgTopics.filter(topic => dashboardTopics.includes(topic));
    setSelectedTopics(activeSdgTopics);
  }, [dashboardTopics]);

  const initiatives = data || [];
  const hasData = initiatives.length > 0;
  const hasTopic = dashboardTopics.includes('sdg_strategy') || dashboardTopics.length === 0;

  // Show message when no topics selected but we're in fundwise with specific fund
  if (dashboardTopics.length > 0 && !dashboardTopics.includes('sdg_strategy') && selectedTopics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-500" />
            Top Initiatives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Leaf className="h-12 w-12 text-muted-foreground/30 mb-4" />
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
            <Leaf className="h-5 w-5 text-green-500" />
            Top Initiatives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Leaf className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg">No initiatives data available</p>
            <p className="text-sm text-muted-foreground/70 mt-2">
              {selectedPortfolio === "fundwise" 
                ? "No sustainability initiatives found for the selected fund" 
                : "No sustainability initiatives found for this company"}
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
          <Leaf className="h-5 w-5 text-green-500" />
          Top Sustainability Initiatives
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {initiatives.slice(0, 5).map((initiative, index) => (
            <div key={initiative.id || index} className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="bg-primary/10">
                      SDG {initiative.sdgNumber}
                    </Badge>
                    <h4 className="font-semibold text-sm">{initiative.title}</h4>
                  </div>
                  <p className="text-xs mt-1 text-muted-foreground">
                    {initiative.companies?.join(", ") || "No companies listed"}
                  </p>
                  {initiative.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {initiative.description}
                    </p>
                  )}
                </div>
                <span className="font-medium text-lg">{Math.round(initiative.progress)}%</span>
              </div>
              <Progress value={initiative.progress} className="h-2" />
            </div>
          ))}
          
          {initiatives.length > 5 && (
            <p className="text-sm text-center text-muted-foreground pt-2">
              +{initiatives.length - 5} more initiatives
            </p>
          )}
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground text-right">
          Total Initiatives: {initiatives.length}
        </div>
      </CardContent>
    </Card>
  );
}
// components/dashboard/ESGTrendsCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Leaf, Users, Shield, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ESGTrendsCardProps {
  data?: any;
  currentScores?: {
    environmental: number;
    social: number;
    governance: number;
  };
  selectedPortfolio?: string;
}

export function ESGTrendsCard({ 
  data, 
  currentScores,
  selectedPortfolio = "fundwise" 
}: ESGTrendsCardProps) {
  
  // Calculate overall ESG score
  const overallScore = currentScores 
    ? Math.round((currentScores.environmental + currentScores.social + currentScores.governance) / 3)
    : 0;

  // Determine rating based on score
  const getRating = (score: number) => {
    if (score >= 80) return { text: "Excellent", color: "text-green-600", bg: "bg-green-100" };
    if (score >= 60) return { text: "Good", color: "text-blue-600", bg: "bg-blue-100" };
    if (score >= 40) return { text: "Average", color: "text-yellow-600", bg: "bg-yellow-100" };
    if (score >= 20) return { text: "Below Average", color: "text-orange-600", bg: "bg-orange-100" };
    return { text: "Poor", color: "text-red-600", bg: "bg-red-100" };
  };

  const rating = getRating(overallScore);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-lg">ESG Performance Overview</span>
          </CardTitle>
          {overallScore > 0 && (
            <div className={`px-3 py-1 rounded-full ${rating.bg} ${rating.color} text-sm font-medium`}>
              {rating.text}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Overall Score Card */}
        {overallScore > 0 && (
          <div className="mb-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-xl border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Overall ESG Score</span>
              <span className="text-3xl font-bold">{overallScore}%</span>
            </div>
            <Progress value={overallScore} className="h-3" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Individual Scores Grid */}
        {currentScores && (
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="w-1 h-4 bg-green-500 rounded-full"></span>
              Pillar Breakdown
            </h3>
            
            <div className="grid gap-6">
              {/* Environmental */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded">
                      <Leaf className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="font-medium">Environmental</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-green-600">
                      {Math.round(currentScores.environmental)}%
                    </span>
                    <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                      {currentScores.environmental >= 70 ? 'Leading' : 
                       currentScores.environmental >= 40 ? 'Developing' : 'Needs Focus'}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <Progress value={currentScores.environmental} className="h-2.5 bg-green-100 [&>div]:bg-green-500" />
                  <div className="absolute -bottom-5 text-xs text-muted-foreground">
                    Target: 75%
                  </div>
                </div>
              </div>

              {/* Social */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-medium">Social</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-blue-600">
                      {Math.round(currentScores.social)}%
                    </span>
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                      {currentScores.social >= 70 ? 'Leading' : 
                       currentScores.social >= 40 ? 'Developing' : 'Needs Focus'}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <Progress value={currentScores.social} className="h-2.5 bg-blue-100 [&>div]:bg-blue-500" />
                  <div className="absolute -bottom-5 text-xs text-muted-foreground">
                    Target: 75%
                  </div>
                </div>
              </div>

              {/* Governance */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded">
                      <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="font-medium">Governance</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-purple-600">
                      {Math.round(currentScores.governance)}%
                    </span>
                    <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                      {currentScores.governance >= 70 ? 'Leading' : 
                       currentScores.governance >= 40 ? 'Developing' : 'Needs Focus'}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <Progress value={currentScores.governance} className="h-2.5 bg-purple-100 [&>div]:bg-purple-500" />
                  <div className="absolute -bottom-5 text-xs text-muted-foreground">
                    Target: 75%
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-8 pt-6 border-t grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(currentScores.environmental)}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">Environment</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(currentScores.social)}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">Social</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(currentScores.governance)}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">Governance</div>
              </div>
            </div>

            {/* Info Note */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Historical trend data will be available once multiple reporting periods are completed. 
                Current scores reflect the most recent reporting period.
              </p>
            </div>
          </div>
        )}

        {!currentScores && (
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-lg">No ESG data available</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {selectedPortfolio === "fundwise" 
                ? "Select a fund to view ESG performance" 
                : "Select a company to view ESG performance"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface IndustryComparisonData {
  industry: string;
  portfolioScore: number;
  comparisonScore: number;
  companies: number;
  benchmarkSource?: string;
}

interface EnhancedIndustryComparisonChartProps {
  selectedFund?: string;
  selectedIndustry?: string;
}

const chartConfig = {
  portfolioScore: { color: "hsl(var(--primary))" },
  comparisonScore: { color: "hsl(var(--muted-foreground))" }
};

// Mock data for different comparison modes
const fundPortfolioData: IndustryComparisonData[] = [
  { industry: "Technology", portfolioScore: 78, comparisonScore: 72, companies: 8 },
  { industry: "Healthcare", portfolioScore: 85, comparisonScore: 80, companies: 5 },
  { industry: "Financial Services", portfolioScore: 70, comparisonScore: 68, companies: 3 },
  { industry: "Manufacturing", portfolioScore: 65, comparisonScore: 62, companies: 4 },
  { industry: "Energy", portfolioScore: 58, comparisonScore: 55, companies: 2 }
];

const globalBenchmarkData: IndustryComparisonData[] = [
  { industry: "Technology", portfolioScore: 78, comparisonScore: 74, companies: 8, benchmarkSource: "MSCI World Tech Index" },
  { industry: "Healthcare", portfolioScore: 85, comparisonScore: 82, companies: 5, benchmarkSource: "DJSI Health Care" },
  { industry: "Financial Services", portfolioScore: 70, comparisonScore: 76, companies: 3, benchmarkSource: "S&P Global 1200 Financials" },
  { industry: "Manufacturing", portfolioScore: 65, comparisonScore: 69, companies: 4, benchmarkSource: "MSCI World Industrials" },
  { industry: "Energy", portfolioScore: 58, comparisonScore: 64, companies: 2, benchmarkSource: "DJSI Oil & Gas" }
];

export function EnhancedIndustryComparisonChart({ selectedFund, selectedIndustry }: EnhancedIndustryComparisonChartProps) {
  const [comparisonMode, setComparisonMode] = useState<"fund-portfolio" | "global-benchmark">("fund-portfolio");
  
  const data = comparisonMode === "fund-portfolio" ? fundPortfolioData : globalBenchmarkData;
  const filteredData = selectedIndustry && selectedIndustry !== "all" 
    ? data.filter(item => item.industry === selectedIndustry)
    : data;

  const getComparisonLabel = () => {
    if (comparisonMode === "fund-portfolio") {
      return selectedFund ? `${selectedFund} - Same Industry Portfolio` : "Fund Portfolio Average";
    }
    return "Global Industry Benchmark";
  };

  const getYourPortfolioLabel = () => {
    if (comparisonMode === "fund-portfolio") {
      return "Selected Company";
    }
    return "Your Portfolio";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Industry ESG Performance Comparison</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <Select value={comparisonMode} onValueChange={(value: "fund-portfolio" | "global-benchmark") => setComparisonMode(value)}>
              <SelectTrigger className="w-[280px] bg-background border">
                <SelectValue placeholder="Select comparison mode" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg">
                <SelectItem value="fund-portfolio">Compare with Fund Portfolio</SelectItem>
                <SelectItem value="global-benchmark">Compare with Global Benchmarks</SelectItem>
              </SelectContent>
            </Select>
            {comparisonMode === "global-benchmark" && (
              <Badge variant="secondary" className="text-xs">
                DJSI, MSCI, S&P Data
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[400px]" config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="industry" 
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                label={{ value: 'ESG Score', angle: -90, position: 'insideLeft', offset: -5 }}
                domain={[0, 100]}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as IndustryComparisonData;
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <p className="font-semibold">{label}</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between items-center gap-4">
                            <span style={{ color: payload[0].color }}>{getYourPortfolioLabel()}:</span>
                            <span className="font-medium">{payload[0].value}</span>
                          </div>
                          <div className="flex justify-between items-center gap-4">
                            <span style={{ color: payload[1].color }}>{getComparisonLabel()}:</span>
                            <span className="font-medium">{payload[1].value}</span>
                          </div>
                          <div className="text-muted-foreground">
                            Companies: {data.companies}
                          </div>
                          {data.benchmarkSource && (
                            <div className="text-xs text-muted-foreground pt-1 border-t">
                              Source: {data.benchmarkSource}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar 
                dataKey="portfolioScore" 
                name={getYourPortfolioLabel()}
                fill="hsl(var(--primary))" 
              />
              <Bar 
                dataKey="comparisonScore" 
                name={getComparisonLabel()}
                fill="hsl(var(--muted-foreground))" 
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {comparisonMode === "global-benchmark" && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Benchmark Sources</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>• DJSI - Dow Jones Sustainability Indices</div>
              <div>• MSCI - MSCI ESG Research</div>
              <div>• S&P - S&P Global ESG Scores</div>
              <div>• Data updated quarterly</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
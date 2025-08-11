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
  environmental: number;
  social: number;
  governance: number;
  carbonFootprint: number;
  waterUsage: number;
  wasteReduction: number;
  employeeSatisfaction: number;
  diversityIndex: number;
  boardIndependence: number;
  executiveCompensation: number;
  riskManagement: number;
}

interface EnhancedIndustryComparisonChartProps {
  selectedFund?: string;
  selectedIndustry?: string;
}

const chartConfig = {
  portfolioScore: { color: "hsl(var(--primary))" },
  comparisonScore: { color: "hsl(var(--muted-foreground))" }
};

// KPI options for comparison
const kpiOptions = [
  { value: "portfolioScore", label: "Overall ESG Score", unit: "Score" },
  { value: "environmental", label: "Environmental Score", unit: "Score" },
  { value: "social", label: "Social Score", unit: "Score" },
  { value: "governance", label: "Governance Score", unit: "Score" },
  { value: "carbonFootprint", label: "Carbon Footprint", unit: "tCO2e" },
  { value: "waterUsage", label: "Water Usage", unit: "m³" },
  { value: "wasteReduction", label: "Waste Reduction", unit: "%" },
  { value: "employeeSatisfaction", label: "Employee Satisfaction", unit: "Score" },
  { value: "diversityIndex", label: "Diversity Index", unit: "Score" },
  { value: "boardIndependence", label: "Board Independence", unit: "%" },
  { value: "executiveCompensation", label: "Executive Compensation Ratio", unit: "Ratio" },
  { value: "riskManagement", label: "Risk Management Score", unit: "Score" }
];

// Mock data for different comparison modes
const fundPortfolioData: IndustryComparisonData[] = [
  { 
    industry: "Technology", 
    portfolioScore: 78, comparisonScore: 72, companies: 8,
    environmental: 82, social: 75, governance: 77,
    carbonFootprint: 45, waterUsage: 35, wasteReduction: 68,
    employeeSatisfaction: 81, diversityIndex: 73, boardIndependence: 65,
    executiveCompensation: 58, riskManagement: 79
  },
  { 
    industry: "Healthcare", 
    portfolioScore: 85, comparisonScore: 80, companies: 5,
    environmental: 79, social: 88, governance: 87,
    carbonFootprint: 52, waterUsage: 42, wasteReduction: 72,
    employeeSatisfaction: 86, diversityIndex: 84, boardIndependence: 78,
    executiveCompensation: 72, riskManagement: 83
  },
  { 
    industry: "Financial Services", 
    portfolioScore: 70, comparisonScore: 68, companies: 3,
    environmental: 68, social: 71, governance: 74,
    carbonFootprint: 38, waterUsage: 28, wasteReduction: 55,
    employeeSatisfaction: 74, diversityIndex: 69, boardIndependence: 82,
    executiveCompensation: 65, riskManagement: 76
  },
  { 
    industry: "Manufacturing", 
    portfolioScore: 65, comparisonScore: 62, companies: 4,
    environmental: 58, social: 67, governance: 70,
    carbonFootprint: 62, waterUsage: 58, wasteReduction: 48,
    employeeSatisfaction: 69, diversityIndex: 61, boardIndependence: 68,
    executiveCompensation: 59, riskManagement: 71
  },
  { 
    industry: "Energy", 
    portfolioScore: 58, comparisonScore: 55, companies: 2,
    environmental: 45, social: 62, governance: 67,
    carbonFootprint: 78, waterUsage: 72, wasteReduction: 38,
    employeeSatisfaction: 64, diversityIndex: 56, boardIndependence: 63,
    executiveCompensation: 54, riskManagement: 68
  }
];

const globalBenchmarkData: IndustryComparisonData[] = [
  { 
    industry: "Technology", 
    portfolioScore: 78, comparisonScore: 74, companies: 8, benchmarkSource: "MSCI World Tech Index",
    environmental: 82, social: 75, governance: 77,
    carbonFootprint: 45, waterUsage: 35, wasteReduction: 68,
    employeeSatisfaction: 81, diversityIndex: 73, boardIndependence: 65,
    executiveCompensation: 58, riskManagement: 79
  },
  { 
    industry: "Healthcare", 
    portfolioScore: 85, comparisonScore: 82, companies: 5, benchmarkSource: "DJSI Health Care",
    environmental: 79, social: 88, governance: 87,
    carbonFootprint: 52, waterUsage: 42, wasteReduction: 72,
    employeeSatisfaction: 86, diversityIndex: 84, boardIndependence: 78,
    executiveCompensation: 72, riskManagement: 83
  },
  { 
    industry: "Financial Services", 
    portfolioScore: 70, comparisonScore: 76, companies: 3, benchmarkSource: "S&P Global 1200 Financials",
    environmental: 68, social: 71, governance: 74,
    carbonFootprint: 38, waterUsage: 28, wasteReduction: 55,
    employeeSatisfaction: 74, diversityIndex: 69, boardIndependence: 82,
    executiveCompensation: 65, riskManagement: 76
  },
  { 
    industry: "Manufacturing", 
    portfolioScore: 65, comparisonScore: 69, companies: 4, benchmarkSource: "MSCI World Industrials",
    environmental: 58, social: 67, governance: 70,
    carbonFootprint: 62, waterUsage: 58, wasteReduction: 48,
    employeeSatisfaction: 69, diversityIndex: 61, boardIndependence: 68,
    executiveCompensation: 59, riskManagement: 71
  },
  { 
    industry: "Energy", 
    portfolioScore: 58, comparisonScore: 64, companies: 2, benchmarkSource: "DJSI Oil & Gas",
    environmental: 45, social: 62, governance: 67,
    carbonFootprint: 78, waterUsage: 72, wasteReduction: 38,
    employeeSatisfaction: 64, diversityIndex: 56, boardIndependence: 63,
    executiveCompensation: 54, riskManagement: 68
  }
];

export function EnhancedIndustryComparisonChart({ selectedFund, selectedIndustry }: EnhancedIndustryComparisonChartProps) {
  const [comparisonMode, setComparisonMode] = useState<"fund-portfolio" | "global-benchmark">("fund-portfolio");
  const [selectedKPI, setSelectedKPI] = useState<string>("portfolioScore");
  
  const data = comparisonMode === "fund-portfolio" ? fundPortfolioData : globalBenchmarkData;
  const filteredData = selectedIndustry && selectedIndustry !== "all" 
    ? data.filter(item => item.industry === selectedIndustry)
    : data;

  const selectedKPIConfig = kpiOptions.find(kpi => kpi.value === selectedKPI);
  
  // Transform data to use selected KPI
  const chartData = filteredData.map(item => ({
    ...item,
    portfolioValue: item[selectedKPI as keyof IndustryComparisonData] as number,
    comparisonValue: selectedKPI === "portfolioScore" 
      ? item.comparisonScore 
      : (item as any)[selectedKPI] // In real app, would have separate comparison values for each KPI
  }));

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
        <div className="flex flex-col gap-4">
          <CardTitle>Industry ESG Performance Comparison</CardTitle>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <label className="text-sm font-medium whitespace-nowrap">KPI:</label>
              <Select value={selectedKPI} onValueChange={setSelectedKPI}>
                <SelectTrigger className="w-[250px] bg-background border">
                  <SelectValue placeholder="Select KPI" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg">
                  {kpiOptions.map((kpi) => (
                    <SelectItem key={kpi.value} value={kpi.value}>
                      {kpi.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <label className="text-sm font-medium whitespace-nowrap">Compare with:</label>
              <Select value={comparisonMode} onValueChange={(value: "fund-portfolio" | "global-benchmark") => setComparisonMode(value)}>
                <SelectTrigger className="w-[280px] bg-background border">
                  <SelectValue placeholder="Select comparison mode" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg">
                  <SelectItem value="fund-portfolio">Fund Portfolio</SelectItem>
                  <SelectItem value="global-benchmark">Global Benchmarks</SelectItem>
                </SelectContent>
              </Select>
              {comparisonMode === "global-benchmark" && (
                <Badge variant="secondary" className="text-xs">
                  DJSI, MSCI, S&P Data
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[400px]" config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
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
                label={{ 
                  value: selectedKPIConfig?.unit || 'Value', 
                  angle: -90, 
                  position: 'insideLeft', 
                  offset: -5 
                }}
                domain={selectedKPI.includes('Score') || selectedKPI.includes('Index') ? [0, 100] : [0, 'dataMax']}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <p className="font-semibold">{label}</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between items-center gap-4">
                            <span style={{ color: payload[0].color }}>{getYourPortfolioLabel()}:</span>
                            <span className="font-medium">
                              {payload[0].value} {selectedKPIConfig?.unit}
                            </span>
                          </div>
                          <div className="flex justify-between items-center gap-4">
                            <span style={{ color: payload[1].color }}>{getComparisonLabel()}:</span>
                            <span className="font-medium">
                              {payload[1].value} {selectedKPIConfig?.unit}
                            </span>
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
                dataKey="portfolioValue" 
                name={getYourPortfolioLabel()}
                fill="hsl(var(--primary))" 
              />
              <Bar 
                dataKey="comparisonValue" 
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

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { CalculationDetailsDialog } from "./CalculationDetailsDialog";
import { TooltipProvider, Tooltip as UITooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

// Sample data for the ESG Matrix Overview
const portfolioRiskData = [
  { 
    fundName: "Green Tech Fund I",
    riskScore: 24,
    valuationImpact: -8.2,
    topRisks: ["Carbon Emissions", "Water Management", "Board Independence"],
    topOpportunities: ["Renewable Energy", "Circular Design", "DEI Initiatives"]
  },
  { 
    fundName: "Sustainable Growth Fund",
    riskScore: 18,
    valuationImpact: +3.5,
    topRisks: ["Supply Chain", "Data Privacy", "Talent Retention"],
    topOpportunities: ["Green Product Innovation", "Community Engagement", "ESG Reporting"]
  },
  { 
    fundName: "Impact Ventures",
    riskScore: 12,
    valuationImpact: +10.2,
    topRisks: ["Regulatory Compliance", "Climate Transition", "Executive Compensation"],
    topOpportunities: ["Social Impact Products", "Emission Reduction", "Transparent Governance"]
  }
];

const riskLevelData = [
  { name: "High Risk", value: 8, color: "#ef4444" },
  { name: "Medium Risk", value: 12, color: "#f97316" },
  { name: "Low Risk", value: 17, color: "#22c55e" }
];

const industryComparisonData = [
  { name: "Your Portfolio", esg: 78, industry: 65 },
  { name: "ClimateTech", esg: 82, industry: 70 },
  { name: "AgriTech", esg: 75, industry: 68 },
  { name: "HealthTech", esg: 92, industry: 72 },
  { name: "EdTech", esg: 80, industry: 69 },
  { name: "FinTech", esg: 75, industry: 65 },
];

const chartConfig = {
  esg: { color: "#8b5cf6" },
  industry: { color: "#94a3b8" }
};

interface ESGMatrixOverviewProps {
  selectedFund: string;
  selectedSector: string;
}

export function ESGMatrixOverview({ selectedFund, selectedSector }: ESGMatrixOverviewProps) {
  // Filter data based on selected fund and sector
  const filteredData = portfolioRiskData.filter(item => 
    (selectedFund === "all" || item.fundName === selectedFund)
  );
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [calculationDetails, setCalculationDetails] = useState({
    title: "",
    calculation: "",
    reference: ""
  });

  const showCalculationDetails = (title: string, calculation: string, reference: string = "") => {
    setCalculationDetails({ title, calculation, reference });
    setDialogOpen(true);
  };
  
  // Generate calculation explanation functions
  const getNetPortfolioImpactCalculation = () => {
    return `Net Portfolio ESG Impact Calculation:

Starting with baseline portfolio valuation across all funds.
- Green Tech Fund I: -8.2% impact on $100M → -$8.2M
- Sustainable Growth Fund: +3.5% impact on $85M → +$3.0M
- Impact Ventures: +10.2% impact on $70M → +$7.1M

Net value impact: -$8.2M + $3.0M + $7.1M = +$1.9M
Total portfolio value: $255M
Net percentage impact: +$1.9M / $255M = +0.75% (rounded to +0.8%)

Contribution weighting adjustments based on:
- ESG scoring methodologies
- Materiality assessments
- Historical impact correlation factors

Final adjusted impact: +3.8%`;
  };

  const getHighestPositiveImpactCalculation = () => {
    return `Highest Positive ESG Impact Calculation:

MediTech Innovations (Health Technology Portfolio):
- Starting valuation: $30M
- ESG premium factors:
  * Green products innovation: +4.5% (+$1.35M)
  * Carbon reduction initiatives: +3.2% (+$0.96M)
  * DEI leadership programs: +2.1% (+$0.63M)
  * Governance transparency: +1.9% (+$0.57M)
  * Supply chain improvements: +0.7% (+$0.21M)

Total ESG premium: +12.4%
Value added: +$3.72M
Final valuation: $33.72M

*Premium calculations include sector-specific multipliers and peer comparison adjustments`;
  };

  const getHighestNegativeImpactCalculation = () => {
    return `Highest Negative ESG Impact Calculation:

EcoSolutions Inc. (Environmental Services):
- Starting valuation: $25M
- ESG risk factors:
  * Carbon emissions: -4.2% (-$1.05M)
  * Water management concerns: -1.8% (-$0.45M)
  * Supply chain issues: -1.3% (-$0.33M)
  * Regulatory compliance gaps: -0.9% (-$0.23M)

Total ESG discount: -8.2%
Value impact: -$2.05M
Final valuation: $22.95M

*Discount calculations include regulatory risk premiums and forward-looking scenario analysis`;
  };

  const getRiskScoreCalculation = (fundName: string, score: number) => {
    return `ESG Risk Score Calculation for ${fundName}:

Base risk assessment across ESG factors (scale 1-100, lower is better):
- Environmental factors: ${Math.round(score * 1.2)}
- Social factors: ${Math.round(score * 0.8)}
- Governance factors: ${Math.round(score * 1.1)}

Risk factors weighted by:
- Industry materiality coefficients
- Regulatory exposure multipliers
- Historical volatility correlation

Raw risk score: ${score + 10}
Risk mitigation adjustments: -${10}
Final risk score: ${score}

Score classification:
- 0-15: Low risk
- 16-25: Medium risk
- 26+: High risk`;
  };

  const getValuationImpactCalculation = (fundName: string, impact: number) => {
    return `Valuation Impact Calculation for ${fundName}:

Starting baseline using traditional valuation metrics:
- Discounted cash flow model
- Comparable company analysis
- Precedent transactions

ESG factor premium/discount application:
${impact < 0 
  ? `- Carbon emissions: -${Math.abs((impact * 0.40)).toFixed(1)}%
- Regulatory risks: -${Math.abs((impact * 0.25)).toFixed(1)}%
- Supply chain issues: -${Math.abs((impact * 0.15)).toFixed(1)}%
- Other ESG factors: -${Math.abs((impact * 0.20)).toFixed(1)}%`
  : `- Sustainability innovations: +${(impact * 0.35).toFixed(1)}%
- Social impact programs: +${(impact * 0.25).toFixed(1)}%
- Governance improvements: +${(impact * 0.20).toFixed(1)}%
- Other ESG factors: +${(impact * 0.20).toFixed(1)}%`}

Total ESG impact: ${impact > 0 ? '+' : ''}${impact}%

*Calculations incorporate 3-year historical ESG performance data and industry benchmarking`;
  };
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Portfolio ESG Risk Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskLevelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 20]} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip 
                    formatter={(value) => [`${value} Companies`, 'Count']}
                    labelFormatter={(label) => `Risk Level: ${label}`}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {riskLevelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Valuation Impact Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <TooltipProvider>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Net Portfolio Impact:</span>
                <button 
                  onClick={() => showCalculationDetails(
                    "Net Portfolio Impact",
                    getNetPortfolioImpactCalculation(),
                    "Based on Q1-Q2 2024 ESG assessments and historical performance data."
                  )}
                  className="font-bold text-lg text-emerald-600 hover:underline inline-flex items-center"
                >
                  +3.8%
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Click for calculation details</TooltipContent>
                  </UITooltip>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Highest Positive Impact:</span>
                <button 
                  onClick={() => showCalculationDetails(
                    "Highest Positive Impact",
                    getHighestPositiveImpactCalculation(),
                    "Based on Q2 2024 ESG performance data for MediTech Innovations."
                  )}
                  className="font-bold text-emerald-600 hover:underline inline-flex items-center"
                >
                  +12.4%
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Click for calculation details</TooltipContent>
                  </UITooltip>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Highest Negative Impact:</span>
                <button 
                  onClick={() => showCalculationDetails(
                    "Highest Negative Impact",
                    getHighestNegativeImpactCalculation(),
                    "Based on Q2 2024 ESG performance data for EcoSolutions Inc."
                  )}
                  className="font-bold text-red-600 hover:underline inline-flex items-center"
                >
                  -8.2%
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Click for calculation details</TooltipContent>
                  </UITooltip>
                </button>
              </div>
            </TooltipProvider>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Average ESG Score:</span>
              <span className="font-bold">78/100</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Industry Average:</span>
              <span className="font-medium text-muted-foreground">68/100</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Top ESG Concerns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">1. Carbon Emissions</span>
                <span className="text-amber-600 font-medium">High Risk</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">2. Data Privacy</span>
                <span className="text-amber-600 font-medium">High Risk</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">3. Supply Chain</span>
                <span className="text-orange-500 font-medium">Medium Risk</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">4. Board Independence</span>
                <span className="text-orange-500 font-medium">Medium Risk</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">5. Climate Transition</span>
                <span className="text-orange-500 font-medium">Medium Risk</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Industry ESG Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-[300px]" config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={industryComparisonData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    label={{ value: 'Score', angle: -90, position: 'insideLeft', offset: -5 }}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="esg" name="Your Portfolio" fill="#8b5cf6" />
                  <Bar dataKey="industry" name="Industry Average" fill="#94a3b8" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio ESG Risk Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fund</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Valuation Impact</TableHead>
                    <TableHead>Top Risk</TableHead>
                    <TableHead>Top Opportunity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.fundName}>
                      <TableCell className="font-medium">{item.fundName}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => showCalculationDetails(
                            `${item.fundName} Risk Score`,
                            getRiskScoreCalculation(item.fundName, item.riskScore),
                            "Based on Q2 2024 ESG assessments and quarterly trend analysis."
                          )}
                          className={`font-medium hover:underline inline-flex items-center ${item.riskScore > 20 ? 'text-red-600' : item.riskScore > 15 ? 'text-amber-600' : 'text-emerald-600'}`}
                        >
                          {item.riskScore}
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>Click for calculation details</TooltipContent>
                          </UITooltip>
                        </button>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => showCalculationDetails(
                            `${item.fundName} Valuation Impact`,
                            getValuationImpactCalculation(item.fundName, item.valuationImpact),
                            "Based on Q2 2024 financial assessments and ESG performance data."
                          )}
                          className={`font-medium hover:underline inline-flex items-center ${item.valuationImpact < 0 ? 'text-red-600' : 'text-emerald-600'}`}
                        >
                          {item.valuationImpact > 0 ? '+' : ''}{item.valuationImpact}%
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>Click for calculation details</TooltipContent>
                          </UITooltip>
                        </button>
                      </TableCell>
                      <TableCell>{item.topRisks[0]}</TableCell>
                      <TableCell>{item.topOpportunities[0]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>

      {/* Add the calculation details dialog */}
      <CalculationDetailsDialog 
        open={dialogOpen}
        setOpen={setDialogOpen}
        title={calculationDetails.title}
        calculation={calculationDetails.calculation}
        reference={calculationDetails.reference}
      />
    </>
  );
}


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

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
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Net Portfolio Impact:</span>
              <span className="font-bold text-lg text-emerald-600">+3.8%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Highest Positive Impact:</span>
              <span className="font-bold text-emerald-600">+12.4%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Highest Negative Impact:</span>
              <span className="font-bold text-red-600">-8.2%</span>
            </div>
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
                    <TableCell className={`font-medium ${item.riskScore > 20 ? 'text-red-600' : item.riskScore > 15 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {item.riskScore}
                    </TableCell>
                    <TableCell className={`font-medium ${item.valuationImpact < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {item.valuationImpact > 0 ? '+' : ''}{item.valuationImpact}%
                    </TableCell>
                    <TableCell>{item.topRisks[0]}</TableCell>
                    <TableCell>{item.topOpportunities[0]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

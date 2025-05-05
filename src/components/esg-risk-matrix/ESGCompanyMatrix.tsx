
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  BarChart, Bar, 
  LineChart, Line, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

// Sample data for the company
const companyData = {
  "1": {
    name: "EcoSolutions Inc.",
    valuation: {
      current: 25000000,
      adjusted: 22950000,
      impact: -8.2
    },
    industry: "ClimateTech",
    esgScores: {
      environmental: 85,
      social: 75,
      governance: 80,
      overall: 80
    },
    esgRiskData: [
      { category: "Environmental", parameter: "Carbon Emissions", score: 4, weight: 0.3, impact: -3.6 },
      { category: "Environmental", parameter: "Water Management", score: 3, weight: 0.2, impact: -1.8 },
      { category: "Environmental", parameter: "Waste Management", score: 2, weight: 0.15, impact: -0.9 },
      { category: "Social", parameter: "DEI", score: 2, weight: 0.2, impact: -1.2 },
      { category: "Social", parameter: "Community Relations", score: 1, weight: 0.15, impact: -0.45 },
      { category: "Governance", parameter: "Board Independence", score: 3, weight: 0.25, impact: -2.25 },
      { category: "Governance", parameter: "ESG Reporting", score: 1, weight: 0.2, impact: -0.6 }
    ],
    esgOpportunityData: [
      { category: "Environmental", parameter: "Renewable Energy Use", score: 4, weight: 0.3, impact: 2.4 },
      { category: "Environmental", parameter: "Circular Product Design", score: 3, weight: 0.25, impact: 1.5 },
      { category: "Social", parameter: "Employee Wellbeing", score: 2, weight: 0.2, impact: 0.8 },
      { category: "Governance", parameter: "ESG Target Setting", score: 3, weight: 0.25, impact: 1.5 }
    ],
    historicalData: [
      { quarter: "Q1 2024", esgScore: 72, industryAvg: 68 },
      { quarter: "Q2 2024", esgScore: 75, industryAvg: 69 },
      { quarter: "Q3 2024", esgScore: 78, industryAvg: 70 },
      { quarter: "Q4 2024", esgScore: 80, industryAvg: 70 }
    ],
    radarData: [
      { subject: "Carbon Emissions", A: 65, B: 90, fullMark: 100 },
      { subject: "Water Usage", A: 80, B: 70, fullMark: 100 },
      { subject: "Waste Management", A: 86, B: 65, fullMark: 100 },
      { subject: "DEI", A: 70, B: 78, fullMark: 100 },
      { subject: "Board Structure", A: 80, B: 65, fullMark: 100 },
      { subject: "ESG Reporting", A: 65, B: 85, fullMark: 100 },
    ],
  },
  "2": {
    name: "GreenHarvest",
    valuation: {
      current: 15000000,
      adjusted: 15525000,
      impact: 3.5
    },
    industry: "AgriTech",
    esgScores: {
      environmental: 70,
      social: 90,
      governance: 75,
      overall: 78
    },
    esgRiskData: [
      { category: "Environmental", parameter: "Supply Chain", score: 3, weight: 0.3, impact: -2.7 },
      { category: "Social", parameter: "Labor Rights", score: 2, weight: 0.25, impact: -1.5 },
      { category: "Governance", parameter: "Tax Transparency", score: 3, weight: 0.2, impact: -1.8 }
    ],
    esgOpportunityData: [
      { category: "Environmental", parameter: "Sustainable Farming", score: 5, weight: 0.35, impact: 3.5 },
      { category: "Social", parameter: "Community Engagement", score: 4, weight: 0.3, impact: 2.4 },
      { category: "Governance", parameter: "ESG Reporting", score: 4, weight: 0.25, impact: 2.0 }
    ],
    historicalData: [
      { quarter: "Q1 2024", esgScore: 70, industryAvg: 65 },
      { quarter: "Q2 2024", esgScore: 72, industryAvg: 66 },
      { quarter: "Q3 2024", esgScore: 75, industryAvg: 67 },
      { quarter: "Q4 2024", esgScore: 78, industryAvg: 68 }
    ],
    radarData: [
      { subject: "Carbon Emissions", A: 80, B: 70, fullMark: 100 },
      { subject: "Water Usage", A: 65, B: 75, fullMark: 100 },
      { subject: "Waste Management", A: 75, B: 68, fullMark: 100 },
      { subject: "DEI", A: 90, B: 72, fullMark: 100 },
      { subject: "Board Structure", A: 75, B: 65, fullMark: 100 },
      { subject: "ESG Reporting", A: 75, B: 60, fullMark: 100 },
    ]
  }
};

const chartConfig = {
  esgScore: { color: "#8b5cf6" },
  industryAvg: { color: "#94a3b8" },
  A: { color: "#22c55e" },
  B: { color: "#3b82f6" }
};

interface ESGCompanyMatrixProps {
  companyId: string;
}

export function ESGCompanyMatrix({ companyId }: ESGCompanyMatrixProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Get company data based on companyId
  const company = companyData[companyId as keyof typeof companyData];
  
  if (!company) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Company data not found.</p>
        </CardContent>
      </Card>
    );
  }
  
  const { impact } = company.valuation;
  const impactClass = impact < 0 ? "text-red-600" : "text-emerald-600";
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{company.name}</CardTitle>
            <CardDescription>{company.industry}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Current Valuation:</span>
                <span className="font-bold">${(company.valuation.current / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">ESG-Adjusted Valuation:</span>
                <span className="font-bold">${(company.valuation.adjusted / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Valuation Impact:</span>
                <span className={`font-bold ${impactClass}`}>
                  {impact > 0 ? '+' : ''}{impact}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">ESG Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Environmental:</span>
                <span className="font-medium">{company.esgScores.environmental}/100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Social:</span>
                <span className="font-medium">{company.esgScores.social}/100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Governance:</span>
                <span className="font-medium">{company.esgScores.governance}/100</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t">
                <span className="font-medium text-sm">Overall ESG Score:</span>
                <span className="font-bold">{company.esgScores.overall}/100</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Key Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button className="w-full" variant="outline">Generate ESG Report</Button>
              <Button className="w-full" variant="outline">Create CAP Plan</Button>
              <Button className="w-full" variant="outline">Edit ESG Parameters</Button>
              <Button className="w-full" variant="outline">View Historical Data</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">ESG Overview</TabsTrigger>
          <TabsTrigger value="risks">Risk Factors</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="historical">Historical</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>ESG Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-[300px]" config={chartConfig}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius={90} data={company.radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Radar name={company.name} dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                      <Radar name="Industry Average" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>ESG Impact on Valuation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Valuation Impact by ESG Pillar</h4>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart
                        data={[
                          {
                            name: "Environmental",
                            value: company.esgRiskData
                              .filter(item => item.category === "Environmental")
                              .reduce((sum, item) => sum + item.impact, 0) - 
                              company.esgOpportunityData
                              .filter(item => item.category === "Environmental")
                              .reduce((sum, item) => sum + item.impact, 0)
                          },
                          {
                            name: "Social",
                            value: company.esgRiskData
                              .filter(item => item.category === "Social")
                              .reduce((sum, item) => sum + item.impact, 0) - 
                              company.esgOpportunityData
                              .filter(item => item.category === "Social")
                              .reduce((sum, item) => sum + item.impact, 0)
                          },
                          {
                            name: "Governance",
                            value: company.esgRiskData
                              .filter(item => item.category === "Governance")
                              .reduce((sum, item) => sum + item.impact, 0) -
                              company.esgOpportunityData
                              .filter(item => item.category === "Governance")
                              .reduce((sum, item) => sum + item.impact, 0)
                          }
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value}%`, 'Impact']} />
                        <Bar 
                          dataKey="value" 
                          fill={(value) => value < 0 ? "#ef4444" : "#22c55e"}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Net Valuation Impact</h4>
                    <div className="flex items-center justify-between text-lg">
                      <span>Without ESG factors:</span>
                      <span className="font-bold">${(company.valuation.current / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="flex items-center justify-between text-lg">
                      <span>With ESG factors:</span>
                      <span className="font-bold">${(company.valuation.adjusted / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="flex items-center justify-between text-lg border-t mt-2 pt-2">
                      <span>Impact:</span>
                      <span className={`font-bold ${impactClass}`}>
                        {impact > 0 ? '+' : ''}{impact}% (${((company.valuation.adjusted - company.valuation.current) / 1000000).toFixed(2)}M)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="risks">
          <Card>
            <CardHeader>
              <CardTitle>ESG Risk Factors</CardTitle>
              <CardDescription>
                Factors that negatively impact valuation based on ESG performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Parameter</TableHead>
                    <TableHead>Risk Score (1-5)</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Valuation Impact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {company.esgRiskData.map((risk, index) => (
                    <TableRow key={index}>
                      <TableCell>{risk.category}</TableCell>
                      <TableCell>{risk.parameter}</TableCell>
                      <TableCell>{risk.score}</TableCell>
                      <TableCell>{risk.weight * 100}%</TableCell>
                      <TableCell className="text-red-600">{risk.impact}%</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={4} className="font-bold text-right">Total Risk Impact:</TableCell>
                    <TableCell className="font-bold text-red-600">
                      {company.esgRiskData.reduce((sum, item) => sum + item.impact, 0).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="opportunities">
          <Card>
            <CardHeader>
              <CardTitle>ESG Opportunities</CardTitle>
              <CardDescription>
                Factors that positively impact valuation based on ESG performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Parameter</TableHead>
                    <TableHead>Performance (1-5)</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Valuation Impact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {company.esgOpportunityData.map((opportunity, index) => (
                    <TableRow key={index}>
                      <TableCell>{opportunity.category}</TableCell>
                      <TableCell>{opportunity.parameter}</TableCell>
                      <TableCell>{opportunity.score}</TableCell>
                      <TableCell>{opportunity.weight * 100}%</TableCell>
                      <TableCell className="text-emerald-600">+{opportunity.impact}%</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={4} className="font-bold text-right">Total Opportunity Impact:</TableCell>
                    <TableCell className="font-bold text-emerald-600">
                      +{company.esgOpportunityData.reduce((sum, item) => sum + item.impact, 0).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="historical">
          <Card>
            <CardHeader>
              <CardTitle>Historical ESG Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-[300px]" config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={company.historicalData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="esgScore" 
                      name={`${company.name} ESG Score`}
                      stroke="#8b5cf6" 
                      strokeWidth={2} 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="industryAvg" 
                      name="Industry Average" 
                      stroke="#94a3b8" 
                      strokeWidth={2} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

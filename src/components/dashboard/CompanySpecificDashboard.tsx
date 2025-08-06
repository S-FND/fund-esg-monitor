import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Users, Calendar, TrendingUp, Target, Award } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useState } from "react";

interface CompanyData {
  id: number;
  name: string;
  type: string;
  sector: string;
  ceo: string;
  investmentDate: string;
  stage: string;
  shareholding: number;
  esgScore: number;
  esgCategory: string;
}

interface CompanySpecificDashboardProps {
  company: CompanyData;
  selectedYear: string;
  selectedTimelineGranularity: string;
}

// Mock company-specific data
const getCompanyESGData = (companyId: number) => ({
  environmental: companyId === 1 ? 88 : companyId === 3 ? 85 : 75,
  social: companyId === 1 ? 82 : companyId === 3 ? 95 : 80,
  governance: companyId === 1 ? 85 : companyId === 3 ? 92 : 78,
});

const getCompanyTrends = (companyId: number, granularity: string) => {
  if (granularity === "monthly") {
    return [
      { period: "Jan 2025", environmental: 85, social: 80, governance: 83, overall: 82 },
      { period: "Feb 2025", environmental: 86, social: 81, governance: 84, overall: 84 },
      { period: "Mar 2025", environmental: 87, social: 82, governance: 85, overall: 85 },
      { period: "Apr 2025", environmental: 88, social: 83, governance: 86, overall: 86 },
      { period: "May 2025", environmental: 90, social: 85, governance: 88, overall: 88 },
    ];
  }
  return [
    { period: "2021", environmental: 70, social: 65, governance: 75, overall: 70 },
    { period: "2022", environmental: 75, social: 72, governance: 78, overall: 75 },
    { period: "2023", environmental: 80, social: 78, governance: 82, overall: 80 },
    { period: "2024", environmental: 85, social: 82, governance: 85, overall: 84 },
    { period: "2025", environmental: 88, social: 85, governance: 88, overall: 87 },
  ];
};

const getCompanyKPIs = (companyId: number) => [
  { name: "Carbon Footprint", value: companyId === 1 ? 120 : 150, unit: "tCO2e", trend: "down" },
  { name: "Energy Efficiency", value: companyId === 1 ? 85 : 78, unit: "%", trend: "up" },
  { name: "Employee Satisfaction", value: companyId === 1 ? 4.2 : 3.8, unit: "/5", trend: "up" },
  { name: "Board Diversity", value: companyId === 1 ? 40 : 30, unit: "%", trend: "up" },
];

const getEnvironmentalKPIs = (companyId: number) => [
  { name: "Carbon Footprint Reduction", value: companyId === 1 ? 25 : 15, unit: "%", target: 30, trend: "up" },
  { name: "Renewable Energy Usage", value: companyId === 1 ? 65 : 45, unit: "%", target: 80, trend: "up" },
  { name: "Water Usage Efficiency", value: companyId === 1 ? 78 : 60, unit: "%", target: 85, trend: "up" },
  { name: "Waste Recycling Rate", value: companyId === 1 ? 85 : 70, unit: "%", target: 90, trend: "up" },
  { name: "Green Certifications", value: companyId === 1 ? 3 : 1, unit: "certs", target: 5, trend: "up" },
];

const getSocialKPIs = (companyId: number) => [
  { name: "Employee Satisfaction", value: companyId === 1 ? 4.2 : 3.8, unit: "/5", target: 4.5, trend: "up" },
  { name: "Employee Turnover Rate", value: companyId === 1 ? 8 : 15, unit: "%", target: 10, trend: "down" },
  { name: "Gender Pay Gap", value: companyId === 1 ? 5 : 12, unit: "%", target: 0, trend: "down" },
  { name: "Training Hours per Employee", value: companyId === 1 ? 40 : 25, unit: "hours", target: 50, trend: "up" },
  { name: "Community Investment", value: companyId === 1 ? 2.5 : 1.2, unit: "% revenue", target: 3, trend: "up" },
  { name: "Health & Safety Incidents", value: companyId === 1 ? 2 : 5, unit: "incidents", target: 0, trend: "down" },
];

const getGovernanceKPIs = (companyId: number) => [
  { name: "Board Independence", value: companyId === 1 ? 60 : 40, unit: "%", target: 70, trend: "up" },
  { name: "Women in Leadership", value: companyId === 1 ? 40 : 25, unit: "%", target: 50, trend: "up" },
  { name: "Ethics Training Completion", value: companyId === 1 ? 95 : 80, unit: "%", target: 100, trend: "up" },
  { name: "Data Privacy Compliance", value: companyId === 1 ? 98 : 85, unit: "%", target: 100, trend: "up" },
  { name: "Supply Chain Audits", value: companyId === 1 ? 85 : 60, unit: "% suppliers", target: 90, trend: "up" },
  { name: "Whistleblower Reports", value: companyId === 1 ? 3 : 7, unit: "reports", target: 0, trend: "down" },
];

const getPortfolioCompaniesInSameIndustry = (sector: string, currentCompanyId: number) => {
  const allCompanies = [
    { id: 1, name: "EcoSolutions Inc.", sector: "ClimateTech", environmental: 88, social: 82, governance: 85, overall: 85 },
    { id: 2, name: "GreenHarvest", sector: "AgriTech", environmental: 75, social: 80, governance: 78, overall: 78 },
    { id: 3, name: "MediTech Innovations", sector: "HealthTech", environmental: 85, social: 95, governance: 92, overall: 92 },
    { id: 4, name: "EduForward", sector: "EdTech", environmental: 70, social: 85, governance: 80, overall: 80 },
    { id: 5, name: "FinSecure", sector: "FinTech", environmental: 68, social: 72, governance: 78, overall: 75 }
  ];
  
  return allCompanies.filter(company => company.sector === sector && company.id !== currentCompanyId);
};

const getKPITrendsData = (companyId: number, kpiName: string, granularity: string) => {
  // Different KPI-specific data patterns
  const kpiDataPatterns = {
    // Environmental KPIs
    "Carbon Footprint Reduction": {
      monthly: [
        { period: "Jan 2025", value: 20 },
        { period: "Feb 2025", value: 22 },
        { period: "Mar 2025", value: 23 },
        { period: "Apr 2025", value: 24 },
        { period: "May 2025", value: 25 },
      ],
      yearly: [
        { period: "2021", value: 10 },
        { period: "2022", value: 13 },
        { period: "2023", value: 17 },
        { period: "2024", value: 21 },
        { period: "2025", value: 25 },
      ]
    },
    "Renewable Energy Usage": {
      monthly: [
        { period: "Jan 2025", value: 60 },
        { period: "Feb 2025", value: 61 },
        { period: "Mar 2025", value: 63 },
        { period: "Apr 2025", value: 64 },
        { period: "May 2025", value: 65 },
      ],
      yearly: [
        { period: "2021", value: 35 },
        { period: "2022", value: 45 },
        { period: "2023", value: 55 },
        { period: "2024", value: 62 },
        { period: "2025", value: 65 },
      ]
    },
    "Water Usage Efficiency": {
      monthly: [
        { period: "Jan 2025", value: 74 },
        { period: "Feb 2025", value: 75 },
        { period: "Mar 2025", value: 76 },
        { period: "Apr 2025", value: 77 },
        { period: "May 2025", value: 78 },
      ],
      yearly: [
        { period: "2021", value: 65 },
        { period: "2022", value: 68 },
        { period: "2023", value: 72 },
        { period: "2024", value: 76 },
        { period: "2025", value: 78 },
      ]
    },
    "Waste Recycling Rate": {
      monthly: [
        { period: "Jan 2025", value: 82 },
        { period: "Feb 2025", value: 83 },
        { period: "Mar 2025", value: 84 },
        { period: "Apr 2025", value: 84 },
        { period: "May 2025", value: 85 },
      ],
      yearly: [
        { period: "2021", value: 70 },
        { period: "2022", value: 75 },
        { period: "2023", value: 80 },
        { period: "2024", value: 83 },
        { period: "2025", value: 85 },
      ]
    },
    "Green Certifications": {
      monthly: [
        { period: "Jan 2025", value: 2 },
        { period: "Feb 2025", value: 2 },
        { period: "Mar 2025", value: 3 },
        { period: "Apr 2025", value: 3 },
        { period: "May 2025", value: 3 },
      ],
      yearly: [
        { period: "2021", value: 0 },
        { period: "2022", value: 1 },
        { period: "2023", value: 2 },
        { period: "2024", value: 2 },
        { period: "2025", value: 3 },
      ]
    },
    // Social KPIs
    "Employee Satisfaction": {
      monthly: [
        { period: "Jan 2025", value: 4.0 },
        { period: "Feb 2025", value: 4.1 },
        { period: "Mar 2025", value: 4.1 },
        { period: "Apr 2025", value: 4.2 },
        { period: "May 2025", value: 4.2 },
      ],
      yearly: [
        { period: "2021", value: 3.5 },
        { period: "2022", value: 3.7 },
        { period: "2023", value: 3.9 },
        { period: "2024", value: 4.1 },
        { period: "2025", value: 4.2 },
      ]
    },
    "Employee Turnover Rate": {
      monthly: [
        { period: "Jan 2025", value: 12 },
        { period: "Feb 2025", value: 10 },
        { period: "Mar 2025", value: 9 },
        { period: "Apr 2025", value: 8 },
        { period: "May 2025", value: 8 },
      ],
      yearly: [
        { period: "2021", value: 18 },
        { period: "2022", value: 15 },
        { period: "2023", value: 12 },
        { period: "2024", value: 10 },
        { period: "2025", value: 8 },
      ]
    },
    "Gender Pay Gap": {
      monthly: [
        { period: "Jan 2025", value: 8 },
        { period: "Feb 2025", value: 7 },
        { period: "Mar 2025", value: 6 },
        { period: "Apr 2025", value: 5 },
        { period: "May 2025", value: 5 },
      ],
      yearly: [
        { period: "2021", value: 15 },
        { period: "2022", value: 12 },
        { period: "2023", value: 9 },
        { period: "2024", value: 7 },
        { period: "2025", value: 5 },
      ]
    },
    "Training Hours per Employee": {
      monthly: [
        { period: "Jan 2025", value: 35 },
        { period: "Feb 2025", value: 37 },
        { period: "Mar 2025", value: 38 },
        { period: "Apr 2025", value: 39 },
        { period: "May 2025", value: 40 },
      ],
      yearly: [
        { period: "2021", value: 20 },
        { period: "2022", value: 25 },
        { period: "2023", value: 30 },
        { period: "2024", value: 35 },
        { period: "2025", value: 40 },
      ]
    },
    "Community Investment": {
      monthly: [
        { period: "Jan 2025", value: 2.2 },
        { period: "Feb 2025", value: 2.3 },
        { period: "Mar 2025", value: 2.4 },
        { period: "Apr 2025", value: 2.4 },
        { period: "May 2025", value: 2.5 },
      ],
      yearly: [
        { period: "2021", value: 1.0 },
        { period: "2022", value: 1.5 },
        { period: "2023", value: 2.0 },
        { period: "2024", value: 2.3 },
        { period: "2025", value: 2.5 },
      ]
    },
    "Health & Safety Incidents": {
      monthly: [
        { period: "Jan 2025", value: 4 },
        { period: "Feb 2025", value: 3 },
        { period: "Mar 2025", value: 3 },
        { period: "Apr 2025", value: 2 },
        { period: "May 2025", value: 2 },
      ],
      yearly: [
        { period: "2021", value: 8 },
        { period: "2022", value: 6 },
        { period: "2023", value: 4 },
        { period: "2024", value: 3 },
        { period: "2025", value: 2 },
      ]
    },
    // Governance KPIs
    "Board Independence": {
      monthly: [
        { period: "Jan 2025", value: 55 },
        { period: "Feb 2025", value: 57 },
        { period: "Mar 2025", value: 58 },
        { period: "Apr 2025", value: 60 },
        { period: "May 2025", value: 60 },
      ],
      yearly: [
        { period: "2021", value: 35 },
        { period: "2022", value: 42 },
        { period: "2023", value: 50 },
        { period: "2024", value: 57 },
        { period: "2025", value: 60 },
      ]
    },
    "Women in Leadership": {
      monthly: [
        { period: "Jan 2025", value: 35 },
        { period: "Feb 2025", value: 37 },
        { period: "Mar 2025", value: 38 },
        { period: "Apr 2025", value: 40 },
        { period: "May 2025", value: 40 },
      ],
      yearly: [
        { period: "2021", value: 20 },
        { period: "2022", value: 25 },
        { period: "2023", value: 30 },
        { period: "2024", value: 35 },
        { period: "2025", value: 40 },
      ]
    },
    "Ethics Training Completion": {
      monthly: [
        { period: "Jan 2025", value: 92 },
        { period: "Feb 2025", value: 93 },
        { period: "Mar 2025", value: 94 },
        { period: "Apr 2025", value: 95 },
        { period: "May 2025", value: 95 },
      ],
      yearly: [
        { period: "2021", value: 75 },
        { period: "2022", value: 82 },
        { period: "2023", value: 88 },
        { period: "2024", value: 92 },
        { period: "2025", value: 95 },
      ]
    },
    "Data Privacy Compliance": {
      monthly: [
        { period: "Jan 2025", value: 96 },
        { period: "Feb 2025", value: 97 },
        { period: "Mar 2025", value: 97 },
        { period: "Apr 2025", value: 98 },
        { period: "May 2025", value: 98 },
      ],
      yearly: [
        { period: "2021", value: 80 },
        { period: "2022", value: 85 },
        { period: "2023", value: 92 },
        { period: "2024", value: 96 },
        { period: "2025", value: 98 },
      ]
    },
    "Supply Chain Audits": {
      monthly: [
        { period: "Jan 2025", value: 82 },
        { period: "Feb 2025", value: 83 },
        { period: "Mar 2025", value: 84 },
        { period: "Apr 2025", value: 85 },
        { period: "May 2025", value: 85 },
      ],
      yearly: [
        { period: "2021", value: 60 },
        { period: "2022", value: 68 },
        { period: "2023", value: 75 },
        { period: "2024", value: 82 },
        { period: "2025", value: 85 },
      ]
    },
    "Whistleblower Reports": {
      monthly: [
        { period: "Jan 2025", value: 5 },
        { period: "Feb 2025", value: 4 },
        { period: "Mar 2025", value: 3 },
        { period: "Apr 2025", value: 3 },
        { period: "May 2025", value: 3 },
      ],
      yearly: [
        { period: "2021", value: 10 },
        { period: "2022", value: 8 },
        { period: "2023", value: 6 },
        { period: "2024", value: 4 },
        { period: "2025", value: 3 },
      ]
    }
  };
  
  // Get the specific KPI data or fallback to default
  const kpiData = kpiDataPatterns[kpiName] || {
    monthly: [
      { period: "Jan 2025", value: 70 },
      { period: "Feb 2025", value: 73 },
      { period: "Mar 2025", value: 76 },
      { period: "Apr 2025", value: 78 },
      { period: "May 2025", value: 80 },
    ],
    yearly: [
      { period: "2021", value: 60 },
      { period: "2022", value: 65 },
      { period: "2023", value: 70 },
      { period: "2024", value: 75 },
      { period: "2025", value: 80 },
    ]
  };
  
  // Apply company-specific variation
  const companyMultiplier = companyId === 1 ? 1.0 : 0.85;
  
  return kpiData[granularity].map(item => ({
    ...item,
    value: Math.round(item.value * companyMultiplier * 100) / 100
  }));
};

const chartConfig = {
  environmental: { color: "#22c55e" },
  social: { color: "#3b82f6" },
  governance: { color: "#8b5cf6" },
  overall: { color: "#f43f5e" }
};

export function CompanySpecificDashboard({ company, selectedYear, selectedTimelineGranularity }: CompanySpecificDashboardProps) {
  const [comparisonType, setComparisonType] = useState<string>("industry");
  const [selectedKPI, setSelectedKPI] = useState<string>("Carbon Footprint Reduction");
  
  const esgData = getCompanyESGData(company.id);
  const trendsData = getCompanyTrends(company.id, selectedTimelineGranularity);
  const kpis = getCompanyKPIs(company.id);
  const environmentalKPIs = getEnvironmentalKPIs(company.id);
  const socialKPIs = getSocialKPIs(company.id);
  const governanceKPIs = getGovernanceKPIs(company.id);
  const portfolioCompanies = getPortfolioCompaniesInSameIndustry(company.sector, company.id);
  const kpiTrendsData = getKPITrendsData(company.id, selectedKPI, selectedTimelineGranularity);

  const esgBreakdownData = [
    { name: "Environmental", value: esgData.environmental, fill: "#22c55e" },
    { name: "Social", value: esgData.social, fill: "#3b82f6" },
    { name: "Governance", value: esgData.governance, fill: "#8b5cf6" },
  ];

  // Prepare comparison data based on selection
  const getComparisonData = () => {
    if (comparisonType === "industry") {
      return [
        { metric: "Environmental", company: esgData.environmental, comparison: 75 },
        { metric: "Social", company: esgData.social, comparison: 78 },
        { metric: "Governance", company: esgData.governance, comparison: 80 },
      ];
    } else {
      // Find the selected portfolio company
      const selectedCompany = portfolioCompanies.find(c => c.name === comparisonType);
      if (selectedCompany) {
        return [
          { metric: "Environmental", company: esgData.environmental, comparison: selectedCompany.environmental },
          { metric: "Social", company: esgData.social, comparison: selectedCompany.social },
          { metric: "Governance", company: esgData.governance, comparison: selectedCompany.governance },
        ];
      }
      // Fallback to industry average
      return [
        { metric: "Environmental", company: esgData.environmental, comparison: 75 },
        { metric: "Social", company: esgData.social, comparison: 78 },
        { metric: "Governance", company: esgData.governance, comparison: 80 },
      ];
    }
  };

  // Get all KPIs for dropdown
  const allKPIs = [...environmentalKPIs, ...socialKPIs, ...governanceKPIs].map(kpi => kpi.name);

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-xl">{company.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{company.sector} • {company.type}</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              ESG Score: {company.esgScore} (Category {company.esgCategory})
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">CEO</p>
                <p className="text-sm text-muted-foreground">{company.ceo}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Investment Date</p>
                <p className="text-sm text-muted-foreground">{company.investmentDate}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Stage</p>
                <p className="text-sm text-muted-foreground">{company.stage}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Shareholding</p>
                <p className="text-sm text-muted-foreground">{company.shareholding}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="esg-breakdown">ESG Details</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>ESG Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-[300px]" config={chartConfig}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={esgBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {esgBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {kpis.map((kpi, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{kpi.name}</p>
                        <p className="text-2xl font-bold text-primary">
                          {kpi.value}{kpi.unit}
                        </p>
                      </div>
                      <div className={`p-2 rounded-full ${kpi.trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        <TrendingUp className={`h-4 w-4 ${kpi.trend === 'down' ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="esg-breakdown" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Environmental Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Environmental
                </CardTitle>
                <div className="text-3xl font-bold text-green-600">{esgData.environmental}</div>
              </CardHeader>
              <CardContent className="space-y-3">
                {environmentalKPIs.map((kpi, index) => (
                  <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium text-green-800">{kpi.name}</p>
                      <div className={`p-1 rounded-full ${kpi.trend === 'up' ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                        <TrendingUp className={`h-3 w-3 ${kpi.trend === 'down' ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-700">
                        {kpi.value}{kpi.unit}
                      </span>
                      <span className="text-xs text-green-600">
                        Target: {kpi.target}{kpi.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Social Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Social
                </CardTitle>
                <div className="text-3xl font-bold text-blue-600">{esgData.social}</div>
              </CardHeader>
              <CardContent className="space-y-3">
                {socialKPIs.map((kpi, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium text-blue-800">{kpi.name}</p>
                      <div className={`p-1 rounded-full ${kpi.trend === 'up' ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                        <TrendingUp className={`h-3 w-3 ${kpi.trend === 'down' ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-blue-700">
                        {kpi.value}{kpi.unit}
                      </span>
                      <span className="text-xs text-blue-600">
                        Target: {kpi.target}{kpi.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Governance Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Governance
                </CardTitle>
                <div className="text-3xl font-bold text-purple-600">{esgData.governance}</div>
              </CardHeader>
              <CardContent className="space-y-3">
                {governanceKPIs.map((kpi, index) => (
                  <div key={index} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium text-purple-800">{kpi.name}</p>
                      <div className={`p-1 rounded-full ${kpi.trend === 'up' ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                        <TrendingUp className={`h-3 w-3 ${kpi.trend === 'down' ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-purple-700">
                        {kpi.value}{kpi.unit}
                      </span>
                      <span className="text-xs text-purple-600">
                        Target: {kpi.target}{kpi.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Comparison Type</label>
              <Select value={comparisonType} onValueChange={setComparisonType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select comparison type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="industry">Industry Average</SelectItem>
                  {portfolioCompanies.map(company => (
                    <SelectItem key={company.id} value={company.name}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">KPI for Trend Analysis</label>
              <Select value={selectedKPI} onValueChange={setSelectedKPI}>
                <SelectTrigger>
                  <SelectValue placeholder="Select KPI" />
                </SelectTrigger>
                <SelectContent>
                  <optgroup label="Environmental">
                    {environmentalKPIs.map(kpi => (
                      <SelectItem key={kpi.name} value={kpi.name}>{kpi.name}</SelectItem>
                    ))}
                  </optgroup>
                  <optgroup label="Social">
                    {socialKPIs.map(kpi => (
                      <SelectItem key={kpi.name} value={kpi.name}>{kpi.name}</SelectItem>
                    ))}
                  </optgroup>
                  <optgroup label="Governance">
                    {governanceKPIs.map(kpi => (
                      <SelectItem key={kpi.name} value={kpi.name}>{kpi.name}</SelectItem>
                    ))}
                  </optgroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  ESG Performance vs {comparisonType === "industry" ? "Industry Average" : "Portfolio Companies"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-[400px]" config={chartConfig}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getComparisonData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metric" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="company" name={company.name} fill="#8b5cf6" />
                      <Bar 
                        dataKey="comparison" 
                        name={comparisonType === "industry" ? "Industry Average" : "Portfolio Average"} 
                        fill="#94a3b8" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{selectedKPI} - {selectedTimelineGranularity === "monthly" ? "Monthly" : "Annual"} Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-[400px]" config={chartConfig}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={kpiTrendsData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        name={selectedKPI}
                        stroke="#8b5cf6" 
                        strokeWidth={3} 
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedTimelineGranularity === "monthly" ? "Monthly" : "Annual"} ESG Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-[400px]" config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendsData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="environmental" name="Environmental" stroke="#22c55e" strokeWidth={2} />
                    <Line type="monotone" dataKey="social" name="Social" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="governance" name="Governance" stroke="#8b5cf6" strokeWidth={2} />
                    <Line type="monotone" dataKey="overall" name="Overall ESG" stroke="#f43f5e" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
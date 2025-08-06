
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PortfolioCompanyKPIs } from "@/components/PortfolioCompanyKPIs";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { portfolioCompanies } from "@/features/edit-portfolio-company/portfolioCompanies";
import { FundsStatsCard } from "@/components/dashboard/FundsStatsCard";
import { CompaniesStatsCard } from "@/components/dashboard/CompaniesStatsCard";
import { ESGStatsCard } from "@/components/dashboard/ESGStatsCard";
import { FundPerformanceCard } from "@/components/dashboard/FundPerformanceCard";
import { TopPerformersCard } from "@/components/dashboard/TopPerformersCard";
import { ESGKPIsSection } from "@/components/dashboard/ESGKPIsSection";
import { SDGPerformanceCard } from "@/components/dashboard/SDGPerformanceCard";
import { TopSDGsCard } from "@/components/dashboard/TopSDGsCard";
import { TopInitiativesCard } from "@/components/dashboard/TopInitiativesCard";
import { TopNonCompliancesCard } from "@/components/dashboard/TopNonCompliancesCard";
import { ESGRisksCard } from "@/components/dashboard/ESGRisksCard";
import { IndustryComparisonChart } from "@/components/dashboard/IndustryComparisonChart";
import { ESGDetailedTrendsChart } from "@/components/dashboard/ESGDetailedTrendsChart";
import { IndustryStatsCard } from "@/components/dashboard/IndustryStatsCard";
import { CompanySpecificDashboard } from "@/components/dashboard/CompanySpecificDashboard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const funds = [
  { id: 1, name: "Green Tech Fund I", size: "$50M", focus: "ClimateTech", stage: "Series A" },
  { id: 2, name: "Sustainable Growth Fund", size: "$100M", focus: "AgriTech, HealthTech", stage: "Series B and above" },
  { id: 3, name: "Impact Ventures", size: "$25M", focus: "EdTech, FinTech", stage: "Seed" },
];

const companies = portfolioCompanies.map(company => ({
  id: company.id,
  name: company.name,
  sector: company.sector,
  fundId: company.fundId,
  esgScore: company.esgScore,
  boardObserverId: company.boardObserverId,
  type: company.type,
  ceo: company.ceo,
  investmentDate: company.investmentDate,
  stage: company.stage,
  shareholding: company.shareholding,
  esgCategory: company.esgCategory
}));

// Board Observers data
const boardObservers = [
  { id: "5", name: "Robert Taylor", designation: "Board Observer" },
  { id: "6", name: "Jennifer Davis", designation: "BO (Board Observer)" },
];

const financialYears = ["2021", "2022", "2023", "2024", "2025"];

// ESG Trends Data
const esgTrendsData = [
  { period: "2021", environmental: 65, social: 60, governance: 70, overall: 65 },
  { period: "2022", environmental: 70, social: 68, governance: 75, overall: 71 },
  { period: "2023", environmental: 75, social: 73, governance: 80, overall: 76 },
  { period: "2024", environmental: 82, social: 78, governance: 85, overall: 82 },
  { period: "2025", environmental: 88, social: 85, governance: 90, overall: 88 },
];

// Monthly trends data
const monthlyTrendsData = [
  { period: "Jan 2025", environmental: 82, social: 78, governance: 85, overall: 82 },
  { period: "Feb 2025", environmental: 84, social: 80, governance: 86, overall: 83 },
  { period: "Mar 2025", environmental: 86, social: 82, governance: 87, overall: 85 },
  { period: "Apr 2025", environmental: 87, social: 83, governance: 88, overall: 86 },
  { period: "May 2025", environmental: 88, social: 85, governance: 90, overall: 88 },
];

// Industry comparison data
const industryData = [
  { industry: "ClimateTech", environmental: 88, social: 82, governance: 85, overall: 85, companies: 1 },
  { industry: "AgriTech", environmental: 75, social: 80, governance: 78, overall: 78, companies: 1 },
  { industry: "HealthTech", environmental: 85, social: 95, governance: 92, overall: 92, companies: 1 },
  { industry: "EdTech", environmental: 70, social: 85, governance: 80, overall: 80, companies: 1 },
  { industry: "FinTech", environmental: 68, social: 72, governance: 78, overall: 75, companies: 1 },
];

// Chart configuration
const esgTrendsChartConfig = {
  environmental: { color: "#22c55e" },
  social: { color: "#3b82f6" },
  governance: { color: "#8b5cf6" },
  overall: { color: "#f43f5e" }
};

export default function Dashboard() {
  const [selectedFund, setSelectedFund] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("2025");
  const [selectedBoardObserver, setSelectedBoardObserver] = useState<string>("all");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedTimelineGranularity, setSelectedTimelineGranularity] = useState<string>("yearly");
  const navigate = useNavigate();
  
  // Apply filters sequentially
  let filteredCompanies = companies;
  
  if (selectedFund !== "all") {
    filteredCompanies = filteredCompanies.filter(company => company.fundId === parseInt(selectedFund));
  }
  
  if (selectedBoardObserver !== "all") {
    filteredCompanies = filteredCompanies.filter(company => company.boardObserverId === selectedBoardObserver);
  }

  if (selectedIndustry !== "all") {
    filteredCompanies = filteredCompanies.filter(company => company.sector === selectedIndustry);
  }

  // Calculate industry stats
  const uniqueIndustries = Array.from(new Set(companies.map(c => c.sector)));
  const topPerformingIndustry = industryData.reduce((prev, current) => 
    prev.overall > current.overall ? prev : current
  ).industry;
  const averageESGScore = Math.round(
    industryData.reduce((sum, industry) => sum + industry.overall, 0) / industryData.length
  );

  // Get appropriate trends data based on timeline granularity
  const trendsData = selectedTimelineGranularity === "monthly" ? monthlyTrendsData : esgTrendsData;
  
  const selectedCompanyId =
    selectedCompany !== "all"
      ? companies.find((c) => c.id.toString() === selectedCompany)?.id?.toString() ?? ""
      : "";

  // Get selected company data
  const selectedCompanyData = selectedCompany !== "all" 
    ? portfolioCompanies.find(c => c.id.toString() === selectedCompany)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {selectedCompanyData ? `${selectedCompanyData.name} Dashboard` : "Portfolio Dashboard"}
        </h1>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Add Fund</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Fund</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>This will take you to the Create New Fund page.</p>
                <Button className="mt-4 w-full" onClick={() => navigate("/funds/new")}>
                  Continue
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Add Portfolio Company</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Portfolio Company</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>This will take you to the General Information page for adding a new company.</p>
                <Button className="mt-4 w-full" onClick={() => navigate("/portfolio/new")}>
                  Continue
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <DashboardFilters
        funds={funds}
        companies={filteredCompanies}
        financialYears={financialYears}
        boardObservers={boardObservers}
        selectedFund={selectedFund}
        setSelectedFund={setSelectedFund}
        selectedCompany={selectedCompany}
        setSelectedCompany={setSelectedCompany}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedBoardObserver={selectedBoardObserver}
        setSelectedBoardObserver={setSelectedBoardObserver}
        selectedIndustry={selectedIndustry}
        setSelectedIndustry={setSelectedIndustry}
        selectedTimelineGranularity={selectedTimelineGranularity}
        setSelectedTimelineGranularity={setSelectedTimelineGranularity}
      />
      
      {/* Conditional rendering based on company selection */}
      {selectedCompanyData ? (
        <CompanySpecificDashboard 
          company={selectedCompanyData}
          selectedYear={selectedYear}
          selectedTimelineGranularity={selectedTimelineGranularity}
        />
      ) : (
      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="esg-scores">ESG Scores</TabsTrigger>
          <TabsTrigger value="sdg-performance">SDG Performance</TabsTrigger>
          <TabsTrigger value="industry-comparison">Industry Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FundsStatsCard totalFunds={funds.length} />
            <CompaniesStatsCard totalCompanies={filteredCompanies.length} numFunds={funds.length} />
            <ESGStatsCard />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FundPerformanceCard />
            <TopPerformersCard companies={filteredCompanies} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopNonCompliancesCard 
              selectedFund={selectedFund} 
              selectedCompany={selectedCompany} 
              selectedYear={selectedYear} 
            />
            <ESGRisksCard 
              selectedFund={selectedFund} 
              selectedCompany={selectedCompany} 
              selectedYear={selectedYear} 
            />
          </div>
        </TabsContent>
        
        <TabsContent value="esg-scores">
          <ESGKPIsSection selectedCompany={selectedCompany} selectedCompanyId={selectedCompanyId} selectedYear={selectedYear} />
        </TabsContent>
        
        <TabsContent value="sdg-performance" className="space-y-4">
          <SDGPerformanceCard 
            selectedFund={selectedFund} 
            selectedCompany={selectedCompany} 
            selectedYear={selectedYear} 
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopSDGsCard 
              selectedFund={selectedFund} 
              selectedCompany={selectedCompany} 
              selectedYear={selectedYear} 
            />
            <TopInitiativesCard 
              selectedFund={selectedFund} 
              selectedCompany={selectedCompany} 
              selectedYear={selectedYear} 
            />
          </div>
        </TabsContent>
        
        <TabsContent value="industry-comparison" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FundsStatsCard totalFunds={funds.length} />
            <CompaniesStatsCard totalCompanies={filteredCompanies.length} numFunds={funds.length} />
            <ESGStatsCard />
            <IndustryStatsCard 
              totalIndustries={uniqueIndustries.length}
              topPerformingIndustry={topPerformingIndustry}
              averageESGScore={averageESGScore}
            />
          </div>
          
          <IndustryComparisonChart data={industryData} />
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-4">
          <ESGDetailedTrendsChart 
            data={trendsData} 
            timelineGranularity={selectedTimelineGranularity}
          />
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
}

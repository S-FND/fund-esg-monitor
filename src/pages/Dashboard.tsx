
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
import { FundsStatsCard } from "@/components/dashboard/FundsStatsCard";
import { CompaniesStatsCard } from "@/components/dashboard/CompaniesStatsCard";
import { ESGStatsCard } from "@/components/dashboard/ESGStatsCard";
import { FundPerformanceCard } from "@/components/dashboard/FundPerformanceCard";
import { TopPerformersCard } from "@/components/dashboard/TopPerformersCard";
import { ESGKPIsSection } from "@/components/dashboard/ESGKPIsSection";
import { SDGPerformanceCard } from "@/components/dashboard/SDGPerformanceCard";
import { TopSDGsCard } from "@/components/dashboard/TopSDGsCard";
import { TopInitiativesCard } from "@/components/dashboard/TopInitiativesCard";

// Dummy data
const funds = [
  { id: 1, name: "Green Tech Fund I", size: "$50M", focus: "ClimateTech", stage: "Series A" },
  { id: 2, name: "Sustainable Growth Fund", size: "$100M", focus: "AgriTech, HealthTech", stage: "Series B and above" },
  { id: 3, name: "Impact Ventures", size: "$25M", focus: "EdTech, FinTech", stage: "Seed" },
];

const companies = [
  { id: 1, name: "EcoSolutions Inc.", sector: "ClimateTech", fundId: 1, esgScore: 85 },
  { id: 2, name: "GreenHarvest", sector: "AgriTech", fundId: 2, esgScore: 78 },
  { id: 3, name: "MediTech Innovations", sector: "HealthTech", fundId: 2, esgScore: 92 },
  { id: 4, name: "EduForward", sector: "EdTech", fundId: 3, esgScore: 80 },
  { id: 5, name: "FinSecure", sector: "FinTech", fundId: 3, esgScore: 75 },
];

const financialYears = ["2021", "2022", "2023", "2024", "2025"];

export default function Dashboard() {
  const [selectedFund, setSelectedFund] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("2025");
  const navigate = useNavigate();
  
  // Filter companies based on selected fund
  const filteredCompanies = selectedFund === "all"
    ? companies
    : companies.filter(company => company.fundId === parseInt(selectedFund));
  
  // Find companyId for API fetch based on selected company string ID
  const selectedCompanyId =
    selectedCompany !== "all"
      ? companies.find((c) => c.id.toString() === selectedCompany)?.id?.toString() ?? ""
      : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
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
        companies={companies}
        financialYears={financialYears}
        selectedFund={selectedFund}
        setSelectedFund={setSelectedFund}
        selectedCompany={selectedCompany}
        setSelectedCompany={setSelectedCompany}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
      />
      
      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="esg-scores">ESG Scores</TabsTrigger>
          <TabsTrigger value="sdg-performance">SDG Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FundsStatsCard totalFunds={funds.length} />
            <CompaniesStatsCard totalCompanies={companies.length} numFunds={funds.length} />
            <ESGStatsCard />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FundPerformanceCard />
            <TopPerformersCard companies={companies} />
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
        
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>ESG Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center bg-accent rounded-md">
                <p className="text-muted-foreground">Year-over-Year ESG Trend Chart</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

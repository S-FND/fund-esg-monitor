
import { useEffect, useState } from "react";
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
import { TopNonCompliancesCard } from "@/components/dashboard/TopNonCompliancesCard";
import { ESGRisksCard } from "@/components/dashboard/ESGRisksCard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

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

// ESG Trends Data
const esgTrendsData = [
  { year: "2021", environmental: 65, social: 60, governance: 70, overall: 65 },
  { year: "2022", environmental: 70, social: 68, governance: 75, overall: 71 },
  { year: "2023", environmental: 75, social: 73, governance: 80, overall: 76 },
  { year: "2024", environmental: 82, social: 78, governance: 85, overall: 82 },
  { year: "2025", environmental: 88, social: 85, governance: 90, overall: 88 },
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  console.log(`localStorage.getItem('auth_token')`, localStorage.getItem('auth_token'))
  console.log('searchParam', searchParams.get('token'))
  // let token = JSON.parse((searchParams.get('token')));
  
  let getUserDetails = async (token) => {
    try {
      // Insert team member
      console.log("Strt getUserDetails")
      console.log('token',token)
      const res = await fetch(`${import.meta.env.VITE_API_URL}` + `/investor/general-info/verify-token`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.log("inisde res not ok")
        toast.error("Invalid credentials");
        // setIsLoading(false);
        setTimeout(() => {
          window.location.href = import.meta.env.VITE_LOGIN_REVERT_URL
          // "https://preprod-enterprise.fandoro.com/"
        }, 100000)

      }
      else {
        const jsonData = await res.json();
        localStorage.setItem('auth_token', token)
        localStorage.setItem('user', JSON.stringify(jsonData['data']))
      }
    }
    catch (error) {
      console.log("inisde catch",error.message)
      toast.error("Invalid credentials :: ",error.message);
        // setIsLoading(false);
        setTimeout(() => {
          window.location.href = "https://preprod-enterprise.fandoro.com/"
        }, 50000)
    }
  }
  useEffect(() => {
    let token;
    console.log("Start entry")
    if(searchParams.get('token')){
      console.log("Inside if")
      token=JSON.parse((searchParams.get('token')));
    }
    else if (!searchParams.get('token') && !localStorage.getItem('auth_token')) {
      console.log("Inside else if 1 statement")
      toast.error("Invalid credentials");
      // setIsLoading(false);
      setTimeout(() => {
        window.location.href = "https://preprod-enterprise.fandoro.com/"
      }, 10000)
    }
    else if(localStorage.getItem('auth_token') && !searchParams.get('token')){
      console.log("Inside else if 2 statement")
      token=localStorage.getItem('auth_token')
    }
    console.log("exit from useeffct")
    getUserDetails(token)
  }, [searchParams])

  const filteredCompanies = selectedFund === "all"
    ? companies
    : companies.filter(company => company.fundId === parseInt(selectedFund));

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

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>ESG Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-[400px]" config={esgTrendsChartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={esgTrendsData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis domain={[0, 100]} label={{ value: 'Score', angle: -90, position: 'insideLeft', offset: -5 }} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="environmental"
                      name="Environmental"
                      stroke="#22c55e"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="social"
                      name="Social"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="governance"
                      name="Governance"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="overall"
                      name="Overall ESG"
                      stroke="#f43f5e"
                      strokeWidth={3}
                      activeDot={{ r: 8 }}
                    />
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

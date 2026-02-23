// pages/Dashboard.tsx
import { useEffect, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Components
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { SustainabilityJourney } from "@/components/dashboard/SustainabilityJourney";
import { EnvironmentTab } from "@/components/dashboard/tabs/EnvironmentTab";
import { SocialTab } from "@/components/dashboard/tabs/SocialTab";
import { GovernanceTab } from "@/components/dashboard/tabs/GovernanceTab";
import { SDGTab } from "@/components/dashboard/tabs/SDGTab";
import { OverviewStats } from "@/components/dashboard/OverviewStats";
import { FundPerformanceCard } from "@/components/dashboard/FundPerformanceCard";
import { TopPerformersCard } from "@/components/dashboard/TopPerformersCard";
import { NonCompliancesCard } from "@/components/dashboard/NonCompliancesCard";
import { ESGRisksCard } from "@/components/dashboard/ESGRisksCard";
import { SDGPerformanceCard } from "@/components/dashboard/SDGPerformanceCard";
import { TopSDGsCard } from "@/components/dashboard/TopSDGsCard";
import { TopInitiativesCard } from "@/components/dashboard/TopInitiativesCard";
import { ESGTrendsCard } from "@/components/dashboard/ESGTrendsCard";

// API & Types
import { dashboardApi } from "./services/dashboardApi";
import { DashboardData, Fund } from "./types/dashboard.types";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();

  // Core state
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [transformedData, setTransformedData] = useState<any>(null);
  const [funds, setFunds] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  // Filter state
  const [selectedPortfolio, setSelectedPortfolio] = useState("all-funds");
  const [selectedFund, setSelectedFund] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fund topics state
  const [selectedFundTopics, setSelectedFundTopics] = useState<string[]>([]);

  // Financial years
  const [financialYears, setFinancialYears] = useState<string[]>([]);
  const [currentFinancialYear, setCurrentFinancialYear] = useState("");

  // Initialize data
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) handleTokenAuth(token);
    else if (!localStorage.getItem('auth_token')) window.location.href = import.meta.env.VITE_LOGIN_REVERT_URL;
    else loadInitialData();
  }, [searchParams]);

  const handleTokenAuth = async (token: string) => {
    const cleanToken = token.replace(/^"|"$/g, '');
    localStorage.setItem('auth_token', cleanToken);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/investor/general-info/verify-token`, {
        headers: { Authorization: `Bearer ${cleanToken}` }
      });

      if (!res.ok) throw new Error("Invalid credentials");

      const jsonData = await res.json();
      localStorage.setItem('user', JSON.stringify(jsonData.data));
      setUser(jsonData.data);
      loadInitialData();
    } catch {
      toast.error("Authentication failed");
      setTimeout(() => window.location.href = import.meta.env.VITE_LOGIN_REVERT_URL, 1000);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [fundsData, companiesData] = await Promise.all([
        dashboardApi.getFunds(),
        dashboardApi.getCompanies()
      ]);

      setFunds(fundsData);
      setCompanies(companiesData);

      const currentFY = dashboardApi.getCurrentFinancialYear();
      setCurrentFinancialYear(currentFY);
      setSelectedYear(currentFY);
      setFinancialYears(generateFinancialYears());

      await loadDashboardData();
    } catch (error) {
      toast.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { viewType: selectedPortfolio, year: selectedYear };

      if (selectedPortfolio === "fundwise" && selectedFund !== "all") {
        params.fundId = selectedFund;
      } else if (selectedPortfolio === "individual-company" && selectedCompany !== "all") {
        params.companyId = selectedCompany;
      }

      if (showMonthDropdown && selectedMonth) params.month = selectedMonth;

      const data = await dashboardApi.getDashboardData(params);
      setDashboardData(data);
      setTransformedData(dashboardApi.transformDashboardData(data));
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedFund, selectedCompany, selectedMonth, showMonthDropdown, selectedPortfolio]);

  // Get dashboard topics - ONLY for fundwise with specific fund
  useEffect(() => {
    if (selectedPortfolio === "fundwise" && selectedFund && selectedFund !== "all") {
      const selectedFundData = funds.find(fund => fund._id === selectedFund);

      if (selectedFundData) {
        console.log('🔍 Fundwise - Selected Fund:', selectedFundData.name);
        console.log('🔍 Fundwise - Dashboard Topics:', selectedFundData.dashboardTopics);
        setSelectedFundTopics(selectedFundData.dashboardTopics || []);
      } else {
        setSelectedFundTopics([]);
      }
    } else {
      // For individual company or "all funds", show all topics
      console.log('🔍 Individual Company or All Funds - Showing all topics');
      setSelectedFundTopics([]);
    }
  }, [selectedFund, selectedPortfolio, funds]);

  // Re-fetch data when filters change
  useEffect(() => {
    if (selectedYear) loadDashboardData();
  }, [selectedYear, selectedFund, selectedCompany, selectedMonth, showMonthDropdown, selectedPortfolio, loadDashboardData]);

  const generateFinancialYears = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => `${currentYear + 1 - i}-${currentYear + 2 - i}`);
  };

  const handlePortfolioChange = (value: string) => {
    setSelectedPortfolio(value);
    setSelectedFund("all");
    setSelectedCompany("all");
  };

  const handleFundChange = (value: string) => {
    setSelectedFund(value);
    if (selectedPortfolio === "fundwise") setSelectedCompany("all");
  };

  const handleCompanyChange = (value: string) => {
    setSelectedCompany(value);
    if (selectedPortfolio === "individual-company") setSelectedFund("all");
  };

  // Determine which topics to pass to tabs
  const getTopicsForTabs = () => {
    // Only apply topic filtering in fundwise view with specific fund selected
    if (selectedPortfolio === "fundwise" && selectedFund !== "all") {
      return selectedFundTopics;
    }
    // For individual company or "all funds", show all topics (empty array = show all)
    return [];
  };

  const topicsToPass = getTopicsForTabs();

  return (
    <div className="space-y-6">
      {loading && (
        <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Investor Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate("/funds/new")} className="gap-2">
            <Plus className="h-4 w-4" /> Add Fund
          </Button>
          <Button onClick={() => navigate("/portfolio/new")} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Add Portfolio Company
          </Button>
        </div>
      </div>

      <DashboardFilters
        funds={funds}
        companies={companies}
        financialYears={financialYears}
        selectedPortfolio={selectedPortfolio}
        setSelectedPortfolio={handlePortfolioChange}
        selectedFund={selectedFund}
        setSelectedFund={handleFundChange}
        selectedCompany={selectedCompany}
        setSelectedCompany={handleCompanyChange}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        showMonthDropdown={showMonthDropdown}
        setShowMonthDropdown={setShowMonthDropdown}
        currentFinancialYear={currentFinancialYear}
        // selectedFundTopics={selectedFundTopics}
      />

      {/* Show context indicator */}
      {selectedPortfolio === "fundwise" && selectedFund !== "all" && (
        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            <span className="font-medium">Viewing Fund with {selectedFundTopics.length} selected topics</span>
          </p>
        </div>
      )}

      {selectedPortfolio === "individual-company" && selectedCompany !== "all" && (
        <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400">
            <span className="font-medium">Viewing Individual Company - Showing all topics</span>
          </p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sustainability">Sustainability Journey</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
          <TabsTrigger value="sdg">SDG</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewStats
            stats={{
              totalFunds: funds?.length,
              totalCompanies: companies?.length,
              avgESGScore: dashboardData?.dashboardOtherData?.dashboardEsgMeterData?.environment?.percentage,
              esgBreakdown: {
                environmental: dashboardData?.dashboardOtherData?.dashboardEsgMeterData?.environment?.percentage,
                social: dashboardData?.dashboardOtherData?.dashboardEsgMeterData?.social?.percentage,
                governance: dashboardData?.dashboardOtherData?.dashboardEsgMeterData?.governance?.percentage
              }
            }}
            funds={funds}
            companies={companies}
            selectedPortfolio={selectedPortfolio}
          />

          {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FundPerformanceCard data={transformedData?.overview?.fundPerformance} />
            <TopPerformersCard data={transformedData?.overview?.topPerformers} />
          </div> */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <NonCompliancesCard
              data={dashboardData?.dashboardOtherData?.dashboardNonComplianceData}
            />
            <ESGRisksCard
              data={dashboardData?.dashboardOtherData?.dashboardRiskData}
            />
          </div>

          <ESGTrendsCard data={transformedData?.trends?.esgTrends} />
        </TabsContent>

        <TabsContent value="sustainability">
          <SustainabilityJourney
            esgMeterData={dashboardData?.dashboardOtherData?.dashboardEsgMeterData}
            nonComplianceData={dashboardData?.dashboardOtherData?.dashboardNonComplianceData}
            riskData={dashboardData?.dashboardOtherData?.dashboardRiskData}
            sdgData={dashboardData?.dashboardOtherData?.dashboardSDGStratgyData}
            boardMeetingsData={dashboardData?.percentage_of_board}
            selectedPortfolio={selectedPortfolio}
            // dashboardTopics={topicsToPass}
          />
        </TabsContent>

        <TabsContent value="environment">
          <EnvironmentTab
            data={dashboardData?.dashboardEnvironment}
            selectedPortfolio={selectedPortfolio}
            dashboardTopics={topicsToPass}
          />
        </TabsContent>

        <TabsContent value="social">
          <SocialTab
            data={dashboardData?.dashboardSocial}
            selectedPortfolio={selectedPortfolio}
            dashboardTopics={topicsToPass}
          />
        </TabsContent>

        <TabsContent value="governance">
          <GovernanceTab
            data={dashboardData?.dashboardGovernance}
            selectedPortfolio={selectedPortfolio}
            dashboardTopics={topicsToPass}
          />
        </TabsContent>

        <TabsContent value="sdg" className="space-y-4">
          <SDGPerformanceCard
            data={transformedData?.sdgPerformance}
            selectedPortfolio={selectedPortfolio}
            dashboardTopics={topicsToPass}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopSDGsCard
              data={transformedData?.sdgPerformance?.topSDGs}
              selectedPortfolio={selectedPortfolio}
              dashboardTopics={topicsToPass}
            />
            <TopInitiativesCard
              data={transformedData?.sdgPerformance?.topInitiatives}
              selectedPortfolio={selectedPortfolio}
              dashboardTopics={topicsToPass}
            />
          </div>
          <SDGTab
            data={dashboardData?.dashboardOtherData?.dashboardSDGStratgyData}
            selectedPortfolio={selectedPortfolio}
            dashboardTopics={topicsToPass}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
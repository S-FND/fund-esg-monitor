// pages/Dashboard.tsx
import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ESGKPIsSection } from "@/components/dashboard/ESGKPIsSection";
import { SDGPerformanceCard } from "@/components/dashboard/SDGPerformanceCard";
import { TopSDGsCard } from "@/components/dashboard/TopSDGsCard";
import { TopInitiativesCard } from "@/components/dashboard/TopInitiativesCard";
import { ESGTrendsCard } from "@/components/dashboard/ESGTrendsCard";

// API
import { dashboardApi } from "./services/dashboardApi";

// Types
import { DashboardData } from "./types/dashboard.types";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, setUser } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [transformedData, setTransformedData] = useState<any>(null);
  const [funds, setFunds] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  // Filter states
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>("all-funds");
  const [selectedFund, setSelectedFund] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  // Financial years
  const [financialYears, setFinancialYears] = useState<string[]>([]);
  const [currentFinancialYear, setCurrentFinancialYear] = useState<string>("");

  // Add this after your state declarations to track filter changes
  useEffect(() => {
    console.log('🔍 Filter changed:', {
      selectedPortfolio,
      selectedFund,
      selectedCompany,
      selectedYear,
      selectedMonth,
      showMonthDropdown
    });
  }, [selectedPortfolio, selectedFund, selectedCompany, selectedYear, selectedMonth, showMonthDropdown]);

  // Authentication
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      // Remove any surrounding quotes from the token
      const cleanToken = tokenParam.replace(/^"|"$/g, '');
      console.log('Original token param:', tokenParam);
      console.log('Cleaned token:', cleanToken);

      localStorage.setItem('auth_token', cleanToken);
      verifyToken(cleanToken);
    } else if (!localStorage.getItem('auth_token')) {
      window.location.href = import.meta.env.VITE_LOGIN_REVERT_URL;
    } else {
      loadInitialData();
    }
  }, [searchParams]);

  const verifyToken = async (token: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/investor/general-info/verify-token`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
      });

      if (!res.ok) throw new Error("Invalid credentials");

      const jsonData = await res.json();
      localStorage.setItem('user', JSON.stringify(jsonData['data']));
      setUser(prev => ({ ...prev, ...jsonData['data'] }));
      loadInitialData();

    } catch (error) {
      toast.error("Authentication failed");
      setTimeout(() => {
        window.location.href = import.meta.env.VITE_LOGIN_REVERT_URL;
      }, 1000);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load funds and companies in parallel
      const [fundsData, companiesData] = await Promise.all([
        dashboardApi.getFunds(),
        dashboardApi.getCompanies()
      ]);

      setFunds(fundsData);
      setCompanies(companiesData);

      // Set current financial year
      const currentFY = dashboardApi.getCurrentFinancialYear();
      setCurrentFinancialYear(currentFY);
      setSelectedYear(currentFY);

      // Generate financial years
      const years = generateFinancialYears();
      setFinancialYears(years);

      // Load dashboard data
      await loadDashboardData();
      setInitialLoadDone(true);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Build params object
      const params: any = {
        viewType: selectedPortfolio,
        year: selectedYear,
      };

      // Only add fundId if a specific fund is selected (not "all")
      if (selectedFund !== "all") {
        params.fundId = selectedFund;
      }

      // Only add companyId if a specific company is selected (not "all")
      if (selectedCompany !== "all") {
        params.companyId = selectedCompany;
      }

      // Only add month if month dropdown is shown and month is selected
      if (showMonthDropdown && selectedMonth) {
        params.month = selectedMonth;
      }

      console.log('📤 Calling API with filters:', params);

      const data = await dashboardApi.getDashboardData(params);
      console.log('📥 API Response:', data);

      setDashboardData(data);
      const transformed = dashboardApi.transformDashboardData(data);
      setTransformedData(transformed);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedFund, selectedCompany, selectedMonth, showMonthDropdown]);

  useEffect(() => {
    if (!selectedYear) return;

    if (initialLoadDone) {
      loadDashboardData();
    }
  }, [selectedYear, selectedFund, selectedCompany, selectedMonth, showMonthDropdown]);

  useEffect(() => {
    const fetchCompaniesForPortfolio = async () => {
      if (selectedPortfolio === "individual-company") {
        setLoading(true);
        try {
          console.log('📋 Fetching companies for individual company view...');
          const companiesData = await dashboardApi.getCompanies();
          console.log('📋 Companies data received:', companiesData);

          const formattedCompanies = companiesData.map((item: any) => ({
            companyId: item.companyId || item._id,
            name: item.companyName?.trim() || item.name?.trim() || 'Unnamed Company',
          }));

          console.log('📋 Formatted companies:', formattedCompanies);
          setCompanies(formattedCompanies);
        } catch (error) {
          console.error('Error fetching companies:', error);
          toast.error('Failed to load companies');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCompaniesForPortfolio();
  }, [selectedPortfolio]);

  const generateFinancialYears = (): string[] => {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];
    for (let year = currentYear + 1; year >= 2021; year--) {
      years.push(`${year}-${year + 1}`);
    }
    return years;
  };

  // Handle filter changes
  const handlePortfolioChange = (value: string) => {
    setSelectedPortfolio(value);
    setSelectedFund("all");
    setSelectedCompany("all");
  };

  return (
    <div className="space-y-6">
      {loading && <Loader2 />}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Investor Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate("/funds/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Fund
          </Button>
          <Button onClick={() => navigate("/portfolio/new")} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Portfolio Company
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
        setSelectedFund={setSelectedFund}
        selectedCompany={selectedCompany}
        setSelectedCompany={setSelectedCompany}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        showMonthDropdown={showMonthDropdown}
        setShowMonthDropdown={setShowMonthDropdown}
        currentFinancialYear={currentFinancialYear}
      />

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
            stats={transformedData?.overview?.stats}
            funds={funds}
            companies={companies}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FundPerformanceCard data={transformedData?.overview?.fundPerformance} />
            <TopPerformersCard data={transformedData?.overview?.topPerformers} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <NonCompliancesCard data={transformedData?.overview?.nonCompliances} />
            <ESGRisksCard data={transformedData?.overview?.esgRisks} />
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
          />
        </TabsContent>

        <TabsContent value="environment">
          <EnvironmentTab data={dashboardData?.dashboardEnvironment} />
        </TabsContent>

        <TabsContent value="social">
          <SocialTab data={dashboardData?.dashboardSocial} />
        </TabsContent>

        <TabsContent value="governance">
          <GovernanceTab data={dashboardData?.dashboardGovernance} />
        </TabsContent>

        <TabsContent value="sdg" className="space-y-4">
          <SDGPerformanceCard data={transformedData?.sdgPerformance} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopSDGsCard data={transformedData?.sdgPerformance?.topSDGs} />
            <TopInitiativesCard data={transformedData?.sdgPerformance?.topInitiatives} />
          </div>

          <SDGTab data={dashboardData?.dashboardOtherData?.dashboardSDGStratgyData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
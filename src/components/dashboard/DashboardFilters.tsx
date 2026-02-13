import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { http } from "@/utils/httpInterceptor";

interface Fund {
  _id: string;
  name: string;
}

interface Company {
  companyId: string;
  name: string;
}

export function DashboardFilters({
  selectedFund,
  setSelectedFund,
  selectedCompany,
  setSelectedCompany,
  selectedYear,
  setSelectedYear,
}: {
  funds: Fund[];
  companies: Company[];
  financialYears: string[];
  selectedFund: string;
  setSelectedFund: (v: string) => void;
  selectedCompany: string;
  setSelectedCompany: (v: string) => void;
  selectedYear: string;
  setSelectedYear: (v: string) => void;
}) {
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>("individual-company");
  const [fundListData, setFundListData] = useState<Fund[]>([]);
  const [companiesData, setCompaniesData] = useState<Company[]>([]);
  const [loading, setLoading] = useState({
    funds: false,
    companies: false
  });

  // Generate dynamic financial years (1988-1989 to current+1 year)
  const generateFinancialYears = (): string[] => {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];

    // Generate from current year + 1 down to 1988
    for (let year = currentYear + 1; year >= 1988; year--) {
      years.push(`${year}-${year + 1}`);
    }

    return years;
  };

  const dynamicFinancialYears = generateFinancialYears();

  // Get CURRENT FINANCIAL YEAR
  const getCurrentFinancialYear = (): string => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // January = 1

    // Indian financial year: April to March
    // If month is April (4) or later, current year is start year
    // If month is Jan-Mar, previous year is start year
    const financialYearStart = currentMonth >= 4 ? currentYear : currentYear - 1;
    const financialYearEnd = financialYearStart + 1;
    return `${financialYearStart}-${financialYearEnd}`;
  };

  const CURRENT_FINANCIAL_YEAR = getCurrentFinancialYear();

  // Get user from localStorage
  const getUserData = () => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  };

  // Set default year to CURRENT FINANCIAL YEAR on load
  useEffect(() => {
    if (!selectedYear && dynamicFinancialYears.length > 0) {
      // Set to CURRENT FINANCIAL YEAR
      setSelectedYear(CURRENT_FINANCIAL_YEAR);
    }
  }, [selectedYear, dynamicFinancialYears, CURRENT_FINANCIAL_YEAR]);

  // Load funds when portfolio is "fundwise"
  useEffect(() => {
    const loadFunds = async () => {
      if (selectedPortfolio !== "fundwise") return;

      const userData = getUserData();
      if (!userData?._id) return;

      try {
        setLoading(prev => ({ ...prev, funds: true }));

        const response = await http.get(`investor/fund/all/${userData._id}`);

        const data = response?.data?.data || response?.data;

        if (data && Array.isArray(data)) {
          const formattedFunds = data.map((item: any) => ({
            _id: item._id || String(item.id) || `fund-${Math.random()}`,
            name: item.name?.trim() || 'Unnamed Fund',
          }));
          setFundListData(formattedFunds);
        }
      } catch (error) {
        console.error("Error loading funds:", error);
      } finally {
        setLoading(prev => ({ ...prev, funds: false }));
      }
    };

    loadFunds();
  }, [selectedPortfolio]);

  // Load companies when portfolio is "individual-company"
  useEffect(() => {
    const loadCompanies = async () => {
      if (selectedPortfolio !== "individual-company") return;

      try {
        setLoading(prev => ({ ...prev, companies: true }));

        const response = await http.get(`investor/companyInfo`);

        const data = response?.data?.data || response?.data;

        if (data) {
          let companiesArray = [];

          if (Array.isArray(data)) {
            companiesArray = data;
          } else if (data.data && Array.isArray(data.data)) {
            companiesArray = data.data;
          }

          const formattedCompanies = companiesArray.map((item: any, index: number) => ({
            companyId: item.companyId || item._id || `company-${index + 1}`,
            name: item.companyName?.trim() || item.name?.trim() || `Company ${index + 1}`,
          }));

          setCompaniesData(formattedCompanies);
        }
      } catch (error) {
        console.error("Error loading companies:", error);
      } finally {
        setLoading(prev => ({ ...prev, companies: false }));
      }
    };

    loadCompanies();
  }, [selectedPortfolio]);

  // Reset selections when portfolio changes
  useEffect(() => {
    setSelectedFund("all");
    setSelectedCompany("all");
  }, [selectedPortfolio]);

  useEffect(() => {
    // Always set to current financial year on initial load
    if (dynamicFinancialYears.length > 0) {
      const currentYear = getCurrentFinancialYear();
      if (selectedYear !== currentYear) {
        setSelectedYear(currentYear);
      }
    }
  }, [dynamicFinancialYears.length]); // Run only once when years are loaded

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Portfolio Type Selector */}
      <div>
        <label className="block text-sm font-medium mb-1">Portfolio View</label>
        <Select
          value={selectedPortfolio}
          onValueChange={setSelectedPortfolio}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select View" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="individual-company">Individual Company</SelectItem>
            <SelectItem value="fundwise">Fundwise</SelectItem>
            <SelectItem value="all-funds">All Funds</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Fund Selector - Only show for "fundwise" */}
      {selectedPortfolio === "fundwise" && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Select Fund
            {loading.funds && <span className="ml-2 text-xs text-gray-500">(Loading...)</span>}
          </label>
          <Select
            value={selectedFund}
            onValueChange={setSelectedFund}
            disabled={loading.funds}
          >
            <SelectTrigger>
              <SelectValue placeholder={loading.funds ? "Loading funds..." : "All Funds"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Funds</SelectItem>
              {fundListData.map(fund => (
                <SelectItem key={fund._id} value={fund._id}>
                  {fund.name}
                </SelectItem>
              ))}
              {fundListData.length === 0 && !loading.funds && (
                <SelectItem value="none" disabled>
                  No funds available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Company Selector - Only show for "individual-company" */}
      {selectedPortfolio === "individual-company" && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Select Portfolio Company
            {loading.companies && <span className="ml-2 text-xs text-gray-500">(Loading...)</span>}
          </label>
          <Select
            value={selectedCompany}
            onValueChange={setSelectedCompany}
            disabled={loading.companies}
          >
            <SelectTrigger>
              <SelectValue placeholder={loading.companies ? "Loading companies..." : "All Companies"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companiesData.map(company => (
                <SelectItem key={company.companyId} value={company.companyId}>
                  {company.name}
                </SelectItem>
              ))}
              {companiesData.length === 0 && !loading.companies && (
                <SelectItem value="none" disabled>
                  No companies available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Year Selector - Always show with CURRENT YEAR SELECTED */}
      <div>
        <label className="block text-sm font-medium mb-1">Financial Year</label>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className={`${selectedYear === CURRENT_FINANCIAL_YEAR ? 'border-green-500 bg-green-50' : ''}`}>
            <SelectValue placeholder="Select Year">
              {selectedYear || CURRENT_FINANCIAL_YEAR}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {dynamicFinancialYears.map(year => (
              <SelectItem
                key={year}
                value={year}
                className={`${year === CURRENT_FINANCIAL_YEAR ? 'bg-green-50 font-medium' : ''}`}
              >
                {year} {year === CURRENT_FINANCIAL_YEAR && "(Current)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedYear === CURRENT_FINANCIAL_YEAR && (
          <p className="text-xs text-green-600 mt-1">
            ✓ Current financial year selected
          </p>
        )}
      </div>
    </div>
  );
}
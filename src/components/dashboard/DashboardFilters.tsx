// components/dashboard/DashboardFilters.tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

interface Fund {
  _id: string;
  name: string;
}

interface Company {
  companyId: string;
  name: string;
}

interface DashboardFiltersProps {
  funds: Fund[];
  companies: Company[];
  financialYears: string[];
  selectedPortfolio: string;
  setSelectedPortfolio: (v: string) => void;
  selectedFund: string;
  setSelectedFund: (v: string) => void;
  selectedCompany: string;
  setSelectedCompany: (v: string) => void;
  selectedYear: string;
  setSelectedYear: (v: string) => void;
  selectedMonth: string;
  setSelectedMonth: (v: string) => void;
  showMonthDropdown: boolean;
  setShowMonthDropdown: (v: boolean) => void;
  currentFinancialYear: string;
}

const months = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export function DashboardFilters({
  funds,
  companies,
  financialYears,
  selectedPortfolio,
  setSelectedPortfolio,
  selectedFund,
  setSelectedFund,
  selectedCompany,
  setSelectedCompany,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  showMonthDropdown,
  setShowMonthDropdown,
  currentFinancialYear,
}: DashboardFiltersProps) {
  console.log('companies----->',companies);
  return (
    <div className="flex flex-wrap gap-4 items-end">
      {/* Portfolio Type Selector */}
      <div className="min-w-[200px]">
        <label className="block text-sm font-medium mb-1">Portfolio View</label>
        <Select value={selectedPortfolio} onValueChange={setSelectedPortfolio}>
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

      {/* Fund Selector */}
      {selectedPortfolio === "fundwise" && (
        <div className="min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Select Fund</label>
          <Select value={selectedFund} onValueChange={setSelectedFund}>
            <SelectTrigger>
              <SelectValue placeholder="All Funds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Funds</SelectItem>
              {funds.map(fund => (
                <SelectItem key={fund._id} value={fund._id}>
                  {fund.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Company Selector */}
      {selectedPortfolio === "individual-company" && (
        <div className="min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Select Portfolio Company</label>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger>
              <SelectValue placeholder="All Companies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map(company => (
                <SelectItem key={company.companyId} value={company.companyId}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Year Selector */}
      <div className="min-w-[150px]">
        <label className="block text-sm font-medium mb-1">Financial Year</label>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className={selectedYear === currentFinancialYear ? 'border-green-500 bg-green-50' : ''}>
            <SelectValue>
              {selectedYear || currentFinancialYear}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {financialYears.map(year => (
              <SelectItem
                key={year}
                value={year}
                className={year === currentFinancialYear ? 'bg-green-50 font-medium' : ''}
              >
                {year} {year === currentFinancialYear && "(Current)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Month Toggle Button */}
      <Button 
        variant="outline" 
        onClick={() => setShowMonthDropdown(!showMonthDropdown)}
        className="gap-2 mb-[2px]"
      >
        <Calendar className="h-4 w-4" />
        {showMonthDropdown ? "Month" : "Year"}
      </Button>

      {/* Month Selector */}
      {showMonthDropdown && (
        <div className="min-w-[150px]">
          <label className="block text-sm font-medium mb-1">Select Month</label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger>
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
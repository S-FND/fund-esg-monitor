
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Fund {
  id: number;
  name: string;
}
interface Company {
  id: number;
  name: string;
  fundId: number;
}
export function DashboardFilters({
  funds,
  companies,
  financialYears,
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
  // Filter companies based on selected fund
  const filteredCompanies = selectedFund === "all"
    ? companies
    : companies.filter(company => company.fundId === parseInt(selectedFund));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Select Fund</label>
        <Select value={selectedFund} onValueChange={setSelectedFund}>
          <SelectTrigger>
            <SelectValue placeholder="All Funds" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Funds</SelectItem>
            {funds.map(fund => (
              <SelectItem key={fund.id} value={fund.id.toString()}>
                {fund.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Select Portfolio Company</label>
        <Select value={selectedCompany} onValueChange={setSelectedCompany}>
          <SelectTrigger>
            <SelectValue placeholder="All Companies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {filteredCompanies.map(company => (
              <SelectItem key={company.id} value={company.id.toString()}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Financial Year</label>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger>
            <SelectValue placeholder="Select Year" />
          </SelectTrigger>
          <SelectContent>
            {financialYears.map(year => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

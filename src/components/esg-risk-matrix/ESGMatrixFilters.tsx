
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const sectors = ["ClimateTech", "AgriTech", "HealthTech", "EdTech", "FinTech"];

interface ESGMatrixFiltersProps {
  selectedFund: string;
  setSelectedFund: (value: string) => void;
  selectedCompany: string;
  setSelectedCompany: (value: string) => void;
  selectedSector: string;
  setSelectedSector: (value: string) => void;
}

export function ESGMatrixFilters({
  selectedFund,
  setSelectedFund,
  selectedCompany,
  setSelectedCompany,
  selectedSector,
  setSelectedSector,
}: ESGMatrixFiltersProps) {
  // Filter companies based on the selected fund
  const filteredCompanies = selectedFund === "all"
    ? companies
    : companies.filter(company => company.fundId.toString() === selectedFund);

  return (
    <Card className="bg-muted/40">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="fund-select" className="block text-sm font-medium mb-1">
              Fund
            </label>
            <Select value={selectedFund} onValueChange={setSelectedFund}>
              <SelectTrigger id="fund-select" className="w-full">
                <SelectValue placeholder="Select Fund" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Funds</SelectItem>
                {funds.map((fund) => (
                  <SelectItem key={fund.id} value={fund.id.toString()}>
                    {fund.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="company-select" className="block text-sm font-medium mb-1">
              Portfolio Company
            </label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger id="company-select" className="w-full">
                <SelectValue placeholder="Select Company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {filteredCompanies.map((company) => (
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="sector-select" className="block text-sm font-medium mb-1">
              Industry Sector
            </label>
            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger id="sector-select" className="w-full">
                <SelectValue placeholder="Select Sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {sectors.map((sector) => (
                  <SelectItem key={sector} value={sector}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

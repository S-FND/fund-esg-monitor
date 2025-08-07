import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InviteCompanyDialog } from "@/features/portfolio/InviteCompanyDialog";
import { FilterControls } from "@/features/portfolio/FilterControls";
import { CompanyCard } from "@/features/portfolio/CompanyCard";
import { NoCompaniesFound } from "@/features/portfolio/NoCompaniesFound";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Portfolio() {
  const navigate = useNavigate();
  const { companies, newlyAddedCompanies } = usePortfolio();
  const [selectedFund, setSelectedFund] = useState<string>("all");
  const [selectedSector, setSelectedSector] = useState<string>("all");

  // Get regular portfolio companies (exclude newly added ones for the main list)
  const regularPortfolioCompanies = companies.filter(company => !company.isNewlyAdded);

  // Retrieve unique fund data for filtering from all companies
  const funds = Array.from(new Set(companies.map(company => company.fundId)))
    .map(fundId => {
      const company = companies.find(c => c.fundId === fundId);
      return { id: fundId, name: company?.fundName || '' };
    });

  // Retrieve unique sectors for filtering from all companies
  const sectors = Array.from(new Set(companies.map(company => company.sector)));

  // Filter regular companies based on selected filters
  const filteredRegularCompanies = regularPortfolioCompanies.filter(company => {
    const matchesFund = selectedFund === "all" ? true : company.fundId.toString() === selectedFund;
    const matchesSector = selectedSector === "all" ? true : company.sector === selectedSector;
    return matchesFund && matchesSector;
  });

  const handleInvite = (email: string) => {
    console.log("Inviting company with email:", email);
  };

  const clearFilters = () => {
    setSelectedFund("all");
    setSelectedSector("all");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Portfolio Companies</h1>
        <div className="flex items-center gap-2">
          <InviteCompanyDialog onInvite={handleInvite} />
          <Button onClick={() => navigate("/portfolio/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Add New Company</span>
          </Button>
        </div>
      </div>

      {/* Newly Added Companies Section */}
      {newlyAddedCompanies.length > 0 && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <Calendar className="h-5 w-5" />
              Recently Added Companies
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {newlyAddedCompanies.length} new
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {newlyAddedCompanies.map(company => (
                <div key={company.id} className="relative">
                  <CompanyCard company={company} />
                  <Badge 
                    className="absolute top-2 right-2 bg-green-600 text-white"
                  >
                    New
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <FilterControls
        funds={funds}
        sectors={sectors}
        selectedFund={selectedFund}
        selectedSector={selectedSector}
        setSelectedFund={setSelectedFund}
        setSelectedSector={setSelectedSector}
      />

      <div className="grid grid-cols-1 gap-4">
        {filteredRegularCompanies.map(company => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </div>

      {filteredRegularCompanies.length === 0 && newlyAddedCompanies.length === 0 && (
        <NoCompaniesFound clearFilters={clearFilters} />
      )}
    </div>
  );
}

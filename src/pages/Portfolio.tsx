import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InviteCompanyDialog } from "@/features/portfolio/InviteCompanyDialog";
import { FilterControls } from "@/features/portfolio/FilterControls";
import { CompanyCard } from "@/features/portfolio/CompanyCard";
import { NoCompaniesFound } from "@/features/portfolio/NoCompaniesFound";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompanyApprovalDialog } from "@/components/portfolio/CompanyApprovalDialog";

export default function Portfolio() {
  const navigate = useNavigate();
  const { companies, newlyAddedCompanies } = usePortfolio();
  const { toast } = useToast();
  const [selectedFund, setSelectedFund] = useState<string>("all");
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [dbCompanies, setDbCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Load portfolio companies from database
  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get user's profile to get tenant_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.tenant_id) {
        setLoading(false);
        return;
      }

      // Fetch companies from database
      const { data: portfolioCompanies, error } = await supabase
        .from('portfolio_companies')
        .select(`
          *,
          funds (
            name
          )
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setDbCompanies(portfolioCompanies || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast({
        title: "Error",
        description: "Failed to load portfolio companies.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (email: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to send invitations.",
          variant: "destructive",
        });
        return;
      }

      // Here you could implement invitation logic
      console.log("Inviting company with email:", email);
      
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${email}`,
      });
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation.",
        variant: "destructive",
      });
    }
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
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <CompanyCard company={company} />
                    </div>
                    <div className="flex flex-col justify-center gap-2 min-w-[200px]">
                      <Badge 
                        className="bg-orange-100 text-orange-800 border-orange-300 text-center"
                        variant="outline"
                      >
                        Pending Approval
                      </Badge>
                      <CompanyApprovalDialog company={company} />
                    </div>
                  </div>
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

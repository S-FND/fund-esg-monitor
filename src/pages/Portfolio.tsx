import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InviteCompanyDialog } from "@/features/portfolio/InviteCompanyDialog";
import { FilterControls } from "@/features/portfolio/FilterControls";
import { PortfolioTable } from "@/features/portfolio/PortfolioTable";
import { NoCompaniesFound } from "@/features/portfolio/NoCompaniesFound";
import { http } from "@/utils/httpInterceptor";
import { toast } from "sonner"; // Add this import

interface Company {
  _id: string;
  companyName: string;
  sector: string;
  esgCategory: string;
  companytype: string;
  founder: string;
  opportunityStatus: string;
  dateofScreening: string;
  fundShareholding: string;
  esgScore: string;
  foundersPromotorsMale: string;
  foundersPromotorsFemale: string;
  otherEmpMale: string;
  otherEmpFemale: string;
  otherEmpOther: string;
  foundersPromotorsOther: string;
  directContractMale: string;
  indirectlyMale: string;
  directContractFemale: string;
  indirectlyFemale: string;
  directContractOther: string;
  indirectlyOther: string;
  fundCompany: { fundId: number; fundName: string }[];
  user?: {
    _id: string;
    name?: string;
    email?: string;
    isDeleted?: boolean;
    active?: boolean;
    softDelete?: boolean;
  };
  companyId?: string;
  name?: string;
}

export default function Portfolio() {
  const navigate = useNavigate();
  const [selectedFund, setSelectedFund] = useState<string>("all");
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "deleted">("active");
  const [portfolioCompanyList, setPortfolioCompanyList] = useState<Company[]>([]);
  const [funds, setFunds] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(null);

  const handleInvite = (email: string) => {
    console.log("Inviting company with email:", email);
  };

  const clearFilters = () => {
    setSelectedFund("all");
    setSelectedSector("all");
  };

  const getFundList = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/investor/fund`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`
        },
      });
      if (res.ok) {
        const jsondata = await res.json();
        setFunds(jsondata['data']);
      }
    } catch (error) {
      console.error("Api call:", error);
    }
  };

  const getCompanyList = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/investor/companyInfo/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`
        },
      });
      if (res.ok) {
        const jsondata = await res.json();
        setPortfolioCompanyList(jsondata['data']);
        setFilteredCompanies(jsondata['data']);

        let sectorList: string[] = [];
        jsondata['data'].forEach((company: Company) => {
          if (company.sector) {
            sectorList.push(company.sector);
          }
        });
        setSectors(Array.from(new Set(sectorList)));
      }
    } catch (error) {
      console.error("Api call:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDelete = async (userId: string, shouldDelete: boolean) => {
    setDeletingCompanyId(userId);

    let companyName = "Company"; // Declare outside try block

    try {
      const company: any = portfolioCompanyList.find(c =>
        c.user?._id === userId || c.companyId === userId || c._id === userId
      );
      companyName = company?.name || company?.companyName || "Company"; // Assign here

      let response;

      if (shouldDelete) {
        // ✅ CORRECT ENDPOINT FOR SOFT DELETE
        response = await http.patch(`auth/${userId}/soft-delete`);

        if (response.data?.status || response.status === 200) {
          toast.success(`${companyName} has been archived successfully`);
        } else {
          throw new Error(response.data?.message || 'Soft delete failed');
        }
      } else {
        // ✅ CORRECT ENDPOINT FOR RESTORE
        response = await http.patch(`auth/${userId}/restore`);

        if (response.data?.status || response.status === 200) {
          toast.success(`${companyName} has been restored successfully`);
        } else {
          throw new Error(response.data?.message || 'Restore failed');
        }
      }

      // Refresh company list after successful operation
      await getCompanyList();

    } catch (error: any) {
      console.error('Operation failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';

      if (shouldDelete) {
        toast.error(`Failed to archive ${companyName}: ${errorMessage}`); // Now accessible here
      } else {
        toast.error(`Failed to restore ${companyName}: ${errorMessage}`); // Now accessible here
      }
    } finally {
      setDeletingCompanyId(null);
    }
  };

  const isCompanyDeleted = (company: Company) => {
    return company?.user?.isDeleted === true ||
      company?.user?.active === false ||
      company?.user?.softDelete === true;
  };

  useEffect(() => {
    // Filter companies based on selected filters and status filter
    let filtered = [...portfolioCompanyList];

    // Status filter (active/deleted)
    if (statusFilter === "active") {
      filtered = filtered.filter(company => !isCompanyDeleted(company));
    } else if (statusFilter === "deleted") {
      filtered = filtered.filter(company => isCompanyDeleted(company));
    }

    // Fund filter
    if (selectedFund !== 'all') {
      filtered = filtered.filter((p: any) =>
        p.fundCompany?.some((f: any) => f.fundId.toString() === selectedFund.toString())
      );
    }

    // Sector filter
    if (selectedSector !== 'all') {
      filtered = filtered.filter((p: any) => p.sector === selectedSector);
    }

    setFilteredCompanies(filtered);
  }, [selectedFund, selectedSector, statusFilter, portfolioCompanyList]);

  // Handle status filter change
  const handleStatusFilterChange = (filter: "all" | "active" | "deleted") => {
    setStatusFilter(filter);
  };

  // Get counts for stats
  const activeCount = portfolioCompanyList.filter(c => !isCompanyDeleted(c)).length;
  const deletedCount = portfolioCompanyList.filter(c => isCompanyDeleted(c)).length;

  useEffect(() => {
    getFundList();
    getCompanyList();
  }, []);

  return (
    <div className="space-y-6" style={{ paddingTop: '10px' }}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Portfolio Companies</h1>

        <div className="flex items-center gap-3">
          {/* Active Count Badge */}
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-3 rounded-full ${statusFilter === 'active'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'text-gray-600'
              }`}
            onClick={() => setStatusFilter('active')}
          >
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
            <span className="text-sm">Active</span>
            <span className="ml-2 font-semibold">{activeCount}</span>
          </Button>

          {/* Archived Count Badge */}
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-3 rounded-full ${statusFilter === 'deleted'
              ? 'bg-gray-100 text-gray-700 border border-gray-200'
              : 'text-gray-600'
              }`}
            onClick={() => setStatusFilter('deleted')}
          >
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
            <span className="text-sm">Exit</span>
            <span className="ml-2 font-semibold">{deletedCount}</span>
          </Button>

          <InviteCompanyDialog onInvite={handleInvite} />
          <Button onClick={() => navigate("/portfolio/new")} size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            <span>Add New Company</span>
          </Button>
        </div>
      </div>

        <FilterControls
          funds={funds}
          sectors={sectors}
          selectedFund={selectedFund}
          selectedSector={selectedSector}
          setSelectedFund={setSelectedFund}
          setSelectedSector={setSelectedSector}
        />

      {filteredCompanies.length > 0 ? (
        <PortfolioTable
          companies={filteredCompanies}
          onViewDetails={(companyId) => navigate(`/portfolio/${companyId}`)}
          onSoftDelete={handleSoftDelete}
          viewMode={statusFilter === "deleted" ? "deleted" : "active"}
          loading={loading || deletingCompanyId !== null}
          onFilterChange={handleStatusFilterChange}
          currentFilter={statusFilter}
        />
      ) : (
        <NoCompaniesFound clearFilters={clearFilters} />
      )}
    </div>
  );
}
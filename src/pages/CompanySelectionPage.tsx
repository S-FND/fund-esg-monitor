import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CompanyCardFilter } from "@/components/esg-cap/CompanyCardFilter";
import { Leaf } from "lucide-react";
import { Input } from "@/components/ui/input";
import { mockCompanies } from "@/data/mockData";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
interface Company {
    email: string;
    companyName: string;
    firesidePoc?: string;
    companyDetails?: {
        industry?: string;
        fund?: string;
        revenue_stage?: string;
        q_category?: string;
        fireside_category?: string;
      };
  }
  

export default function CompanySelectionPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const industryOptions = [
    "All Industries",
    "Beauty & Personal Care",
    "Fashion & Lifestyle",
    "Health & Wellness",
    "Food & Beverage",
    "Home & Decor",
    "Platform Enablers",
  ];
  
  const fundOptions = ["All Funds", "Fund I", "Fund II", "Fund III", "Fund IV"];
  
  const revenueOptions = [
    "All Revenue",
    "₹0–50 Cr",
    "₹50–100 Cr",
    "₹100–500 Cr",
    "₹500+ Cr",
  ];
  
  const qCatOptions = ["All Q Cat", "Q", "Q1", "Q2", "Q3", "Q4", "Early"];

  const firesideOptions = [
    "All POCs",
    "Aashish Mirchandani",
    "Amit Kulkarni",
    "Ankita Balotia",
    "Ankur Khaitan",
    "Nandika Pradeep",
    "Prayag Mohanty",
    "Shuchi Pandya",
    "Swati Kulkarni",
    "TBD",
    "Varun Varma",
  ];
  
  const [filters, setFilters] = useState({
    industry: "All Industries",
    fund: "All Funds",
    revenue: "All Revenue",
    qCat: "All Q Cat",
    firesidePoc: "All POCs",
  });
  
  const navigate = useNavigate();

//   const filteredCompanies = companies.filter((company) =>
//     company.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     company.email?.toLowerCase().includes(searchTerm.toLowerCase())
//   );

useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/investor/companyInfo`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        });
        const json = await res.json();
        const apiCompanies = json.data || [];
  
        // Merge API companies with mock data
        const merged = apiCompanies.map((apiCompany: any) => {
          // Find matching mock company by email or name
          const mockMatch = mockCompanies.find(
            (m) =>
              m.contactEmail === apiCompany.email ||
              m.name === apiCompany.companyName
          );
  
          return {
            email: apiCompany.email || "",
            companyName: apiCompany.companyName || "",
            firesidePoc: apiCompany.firesidePoc || mockMatch?.fl || "",
            companyDetails: {
              industry: apiCompany.companyDetails?.industry || mockMatch?.industry || "",
              fund: apiCompany.companyDetails?.fund || mockMatch?.fund || "",
              revenue_stage: apiCompany.companyDetails?.revenue_stage || mockMatch?.revenueStage || "",
              q_category: apiCompany.companyDetails?.q_category || mockMatch?.qCategory || "",
              fireside_category: apiCompany.companyDetails?.fireside_category || mockMatch?.firesideCategory || "",
            },
          };
        });
  
        setCompanies(merged);
      } catch (error) {
        console.error("Failed to load API, using mock data", error);
        // Fallback: use mock data directly with full mapping
        const fallback = mockCompanies.map((mock) => ({
          email: mock.contactEmail || "",
          companyName: mock.name || "",
          firesidePoc: mock.fl || "",
          companyDetails: {
            industry: mock.industry || "",
            fund: mock.fund || "",
            revenue_stage: mock.revenueStage || "",
            q_category: mock.qCategory || "",
            fireside_category: mock.firesideCategory || "",
          },
        }));
        setCompanies(fallback);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const revenueMap: Record<string, string> = {
    "₹0–50 Cr": "0-50",
    "₹50–100 Cr": "50-100",
    "₹100–500 Cr": "100-500",
    "₹500+ Cr": "500+",
  };

  // Apply all filters
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        company.companyName?.toLowerCase().includes(searchLower) ||
        company.email?.toLowerCase().includes(searchLower);

        const matchesIndustry = filters.industry === "All Industries" || company.companyDetails?.industry === filters.industry;
        const matchesFund = filters.fund === "All Funds" || company.companyDetails?.fund === filters.fund;
        const matchesRevenue = filters.revenue === "All Revenue" || company.companyDetails?.revenue_stage === revenueMap[filters.revenue as keyof typeof revenueMap];
        const matchesQCat = filters.qCat === "All Q Cat" || company.companyDetails?.q_category === filters.qCat;
        const matchesFireside = filters.firesidePoc === "All POCs" || company.firesidePoc === filters.firesidePoc

      return (
        matchesSearch &&
        matchesIndustry &&
        matchesFund &&
        matchesRevenue &&
        matchesQCat &&
        matchesFireside
      );
    });
  }, [companies, searchTerm, filters]);

  const handleCompanySelect = (companyEmail: string) => {
    navigate(`/esg-dd/cap/${encodeURIComponent(companyEmail)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 to-white">
      <div className="container mx-auto py-12 px-4">
        <div className="flex flex-wrap items-center gap-3 mb-6">
            <Input
                placeholder="Search company by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-96"
            />
            {/* Filter bar with dropdowns and Export */}
            {/* Industry */}
            <Select
                value={filters.industry}
                onValueChange={(val) => setFilters((prev) => ({ ...prev, industry: val }))}
            >
                <SelectTrigger className="w-[128px]">
                <SelectValue placeholder="All Industries" />
                </SelectTrigger>
                <SelectContent>
                {industryOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                    {opt}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>

            {/* Fund */}
            <Select
                value={filters.fund}
                onValueChange={(val) => setFilters((prev) => ({ ...prev, fund: val }))}
            >
                <SelectTrigger className="w-[128px]">
                <SelectValue placeholder="All Funds" />
                </SelectTrigger>
                <SelectContent>
                {fundOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                    {opt}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>

            {/* Revenue */}
            <Select
                value={filters.revenue}
                onValueChange={(val) => setFilters((prev) => ({ ...prev, revenue: val }))}
            >
                <SelectTrigger className="w-[128px]">
                <SelectValue placeholder="All Revenue" />
                </SelectTrigger>
                <SelectContent>
                {revenueOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                    {opt}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>

            {/* Q Cat */}
            <Select
                value={filters.qCat}
                onValueChange={(val) => setFilters((prev) => ({ ...prev, qCat: val }))}
            >
                <SelectTrigger className="w-[128px]">
                <SelectValue placeholder="All Q Cat" />
                </SelectTrigger>
                <SelectContent>
                {qCatOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                    {opt}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>

            {/* Fireside POCs */}
            <Select
                value={filters.firesidePoc}
                onValueChange={(val) => setFilters((prev) => ({ ...prev, firesidePoc: val }))}
                >
                <SelectTrigger className="w-[128px]">
                    <SelectValue placeholder="All POCs" />
                </SelectTrigger>
                <SelectContent>
                    {firesideOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                        {opt}
                    </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
         {/* Eco-friendly heading */}
         <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
            <div className="bg-emerald-100 p-1.5 rounded-full">
            <Leaf className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
            <h1 className="text-xl font-bold text-emerald-800">Select a Company</h1>
            <p className="text-xs text-emerald-600/70">Choose a company to view its ESG CAP</p>
            </div>
        </div>
            <div className="text-sm text-emerald-600">{filteredCompanies.length} companies</div>
        </div>

        <CompanyCardFilter
          companies={filteredCompanies}
          selectedCompany=""
          onCompanyChange={handleCompanySelect}
          loading={loading}
        />
      </div>
    </div>
  );
}
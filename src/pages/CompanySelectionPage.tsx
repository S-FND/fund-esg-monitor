import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CompanyCardFilter } from "@/components/esg-cap/CompanyCardFilter";
import { Leaf } from "lucide-react";

interface Company {
  email: string;
  companyName: string;
}

export default function CompanySelectionPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/investor/companyInfo`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        });
        const json = await res.json();
        setCompanies(json.data || []);
      } catch (error) {
        console.error("Failed to load companies", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const handleCompanySelect = (companyEmail: string) => {
    navigate(`/esg-dd/cap/${encodeURIComponent(companyEmail)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 to-white">
      <div className="container mx-auto py-12 px-4">
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
        <div className="text-sm text-emerald-600">
            {companies.length} companies
        </div>
        </div>

        <CompanyCardFilter
          companies={companies}
          selectedCompany=""
          onCompanyChange={handleCompanySelect}
          loading={loading}
        />
      </div>
    </div>
  );
}
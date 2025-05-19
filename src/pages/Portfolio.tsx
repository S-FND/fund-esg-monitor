import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InviteCompanyDialog } from "@/features/portfolio/InviteCompanyDialog";
import { FilterControls } from "@/features/portfolio/FilterControls";
import { CompanyCard } from "@/features/portfolio/CompanyCard";
import { NoCompaniesFound } from "@/features/portfolio/NoCompaniesFound";

// Dummy data
// const portfolioCompanies = [
//   {
//     id: 1,
//     name: "EcoSolutions Inc.",
//     type: "Private Ltd",
//     sector: "ClimateTech",
//     fundId: 1,
//     fundName: "Green Tech Fund I",
//     ceo: "Sarah Johnson",
//     investmentDate: "2023-05-15",
//     stage: "Series A",
//     shareholding: 12.5,
//     employees: {
//       founders: { male: 1, female: 1, others: 0 },
//       others: { male: 18, female: 12, others: 1 }
//     },
//     workers: {
//       direct: { male: 25, female: 20, others: 0 },
//       indirect: { male: 10, female: 8, others: 0 }
//     },
//     esgCategory: "B",
//     esgScore: 85
//   },
//   {
//     id: 2,
//     name: "GreenHarvest",
//     type: "Private Ltd",
//     sector: "AgriTech",
//     fundId: 2,
//     fundName: "Sustainable Growth Fund",
//     ceo: "Michael Lee",
//     investmentDate: "2022-11-03",
//     stage: "Seed",
//     shareholding: 15.0,
//     employees: {
//       founders: { male: 2, female: 0, others: 0 },
//       others: { male: 8, female: 7, others: 0 }
//     },
//     workers: {
//       direct: { male: 45, female: 30, others: 0 },
//       indirect: { male: 20, female: 25, others: 0 }
//     },
//     esgCategory: "B",
//     esgScore: 78
//   },
//   {
//     id: 3,
//     name: "MediTech Innovations",
//     type: "Private Ltd",
//     sector: "HealthTech",
//     fundId: 2,
//     fundName: "Sustainable Growth Fund",
//     ceo: "Lisa Wang",
//     investmentDate: "2023-03-22",
//     stage: "Series A",
//     shareholding: 10.0,
//     employees: {
//       founders: { male: 1, female: 2, others: 0 },
//       others: { male: 25, female: 30, others: 2 }
//     },
//     workers: {
//       direct: { male: 15, female: 25, others: 0 },
//       indirect: { male: 5, female: 10, others: 0 }
//     },
//     esgCategory: "A",
//     esgScore: 92
//   },
//   {
//     id: 4,
//     name: "EduForward",
//     type: "Private Ltd",
//     sector: "EdTech",
//     fundId: 3,
//     fundName: "Impact Ventures",
//     ceo: "Raj Patel",
//     investmentDate: "2022-08-10",
//     stage: "Pre Series A",
//     shareholding: 18.0,
//     employees: {
//       founders: { male: 1, female: 1, others: 0 },
//       others: { male: 12, female: 15, others: 0 }
//     },
//     workers: {
//       direct: { male: 8, female: 12, others: 0 },
//       indirect: { male: 4, female: 6, others: 0 }
//     },
//     esgCategory: "B",
//     esgScore: 80
//   },
//   {
//     id: 5,
//     name: "FinSecure",
//     type: "Private Ltd",
//     sector: "FinTech",
//     fundId: 3,
//     fundName: "Impact Ventures",
//     ceo: "David Chen",
//     investmentDate: "2023-01-14",
//     stage: "Seed",
//     shareholding: 20.0,
//     employees: {
//       founders: { male: 2, female: 0, others: 0 },
//       others: { male: 10, female: 8, others: 0 }
//     },
//     workers: {
//       direct: { male: 5, female: 4, others: 0 },
//       indirect: { male: 2, female: 3, others: 0 }
//     },
//     esgCategory: "C",
//     esgScore: 75
//   }
// ];

// Retrieve unique fund data for filtering
// const funds = Array.from(new Set(portfolioCompanies.map(company => company.fundId)))
//   .map(fundId => {
//     const company = portfolioCompanies.find(c => c.fundId === fundId);
//     return { id: fundId, name: company?.fundName || '' };
//   });

// Retrieve unique sectors for filtering  
// const sectors = Array.from(new Set(portfolioCompanies.map(company => company.sector)));

export default function Portfolio() {
  const navigate = useNavigate();
  const [selectedFund, setSelectedFund] = useState<string>("all");
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [portfolioCompanyList, setPortfolioCompanyList] = useState([])
  const [funds, setFunds] = useState([])
  const [filteredCompanies,setFilteredCompanies]=useState([])
  const [sectors, setSectors] = useState([])



  // const sectors = Array.from(new Set(portfolioCompanyList.map(company => company.sector)));

  const handleInvite = (email: string) => {
    console.log("Inviting company with email:", email);
  };

  const clearFilters = () => {
    setSelectedFund("all");
    setSelectedSector("all");
  };
  const getFundList = async () => {
    try {
      const res = await fetch(`https://preprod-api.fandoro.com` + `/investor/fund`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        // toast.error("Invalid credentials");
        // setIsLoading(false);
        return;
      }
      else {
        const jsondata = await res.json();
        console.log('jsondata', jsondata)
        setFunds(jsondata['data'])
      }
    } catch (error) {
      console.error("Api call:", error);
      // toast.error("API Call failed. Please try again.");
    } finally {
      // setIsLoading(false);
    }
  }

  const getCompanyList = async () => {

    try {
      const res = await fetch(`https://preprod-api.fandoro.com` + "/investor/companyInfo/", {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        // toast.error("Invalid credentials");
        // setIsLoading(false);
        return;
      }
      else {
        const jsondata = await res.json();
        console.log('jsondata', jsondata)
        setPortfolioCompanyList(jsondata['data'])
        setFilteredCompanies(jsondata['data'])
        let sectorList=[]
        jsondata['data'].forEach((company) => {
          if(company.sector){
            sectorList.push(company.sector)
          }  
        })
        // const sectors = Array.from(new Set(jsondata['data'].map(company => company.sector)));
        setSectors(Array.from(new Set(sectorList)))
        // console.log("sectors",sectorList)
      }
    } catch (error) {
      console.error("Api call:", error);
      // toast.error("API Call failed. Please try again.");
    } finally {
      // setIsLoading(false);
    }
  }

  useEffect(() => {
    // Filter companies based on selected filters
    console.log("Triggered")
    if(selectedFund !== 'all' && selectedSector !== 'all'){
      setFilteredCompanies(
        portfolioCompanyList.filter((p)=>{
          let filterfund=p.fundCompany.filter((f)=>f.fundId.toString() == selectedFund.toString())
          if(filterfund && filterfund[0] && p.sector == selectedSector){
            return p;
          }
        })
      )
    }
    else if(selectedFund !== 'all'){
      setFilteredCompanies(
        portfolioCompanyList.filter((p)=>{
          let filterfund=p.fundCompany.filter((f)=>f.fundId.toString() == selectedFund.toString())
          if(filterfund && filterfund[0]){
            return p;
          }
        })
      )
    }
    else if(selectedSector !== 'all'){
      setFilteredCompanies(
        portfolioCompanyList.filter((p)=>p.sector == selectedSector)
      )
    }
  }, [selectedFund, selectedSector])

  useEffect(() => {
    getFundList()
    getCompanyList()
  }, [])

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

      <FilterControls
        funds={funds}
        sectors={sectors}
        selectedFund={selectedFund}
        selectedSector={selectedSector}
        setSelectedFund={setSelectedFund}
        setSelectedSector={setSelectedSector}
      />
      <div className="grid grid-cols-1 gap-4">
        {filteredCompanies.map(company => (
          <CompanyCard key={company._id} company={company} />
        ))}
      </div>

      {/*{filteredCompanies.length === 0 && (
        <NoCompaniesFound clearFilters={clearFilters} />
      )} */}
      {/* <div className="grid grid-cols-1 gap-4">
        {portfolioCompanyList.map(company => (
          <CompanyCard key={company._id} company={company} />
        ))}
      </div> */}

      {portfolioCompanyList.length === 0 && (
        <NoCompaniesFound clearFilters={clearFilters} />
      )}
    </div>
  );
}

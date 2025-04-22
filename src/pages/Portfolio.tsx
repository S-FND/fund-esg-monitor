
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mail, Plus, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Dummy data
const portfolioCompanies = [
  {
    id: 1,
    name: "EcoSolutions Inc.",
    type: "Private Ltd",
    sector: "ClimateTech",
    fundId: 1,
    fundName: "Green Tech Fund I",
    ceo: "Sarah Johnson",
    investmentDate: "2023-05-15",
    stage: "Series A",
    shareholding: 12.5,
    employees: {
      founders: { male: 1, female: 1, others: 0 },
      others: { male: 18, female: 12, others: 1 }
    },
    workers: {
      direct: { male: 25, female: 20, others: 0 },
      indirect: { male: 10, female: 8, others: 0 }
    },
    esgCategory: "B",
    esgScore: 85
  },
  {
    id: 2,
    name: "GreenHarvest",
    type: "Private Ltd",
    sector: "AgriTech",
    fundId: 2,
    fundName: "Sustainable Growth Fund",
    ceo: "Michael Lee",
    investmentDate: "2022-11-03",
    stage: "Seed",
    shareholding: 15.0,
    employees: {
      founders: { male: 2, female: 0, others: 0 },
      others: { male: 8, female: 7, others: 0 }
    },
    workers: {
      direct: { male: 45, female: 30, others: 0 },
      indirect: { male: 20, female: 25, others: 0 }
    },
    esgCategory: "B",
    esgScore: 78
  },
  {
    id: 3,
    name: "MediTech Innovations",
    type: "Private Ltd",
    sector: "HealthTech",
    fundId: 2,
    fundName: "Sustainable Growth Fund",
    ceo: "Lisa Wang",
    investmentDate: "2023-03-22",
    stage: "Series A",
    shareholding: 10.0,
    employees: {
      founders: { male: 1, female: 2, others: 0 },
      others: { male: 25, female: 30, others: 2 }
    },
    workers: {
      direct: { male: 15, female: 25, others: 0 },
      indirect: { male: 5, female: 10, others: 0 }
    },
    esgCategory: "A",
    esgScore: 92
  },
  {
    id: 4,
    name: "EduForward",
    type: "Private Ltd",
    sector: "EdTech",
    fundId: 3,
    fundName: "Impact Ventures",
    ceo: "Raj Patel",
    investmentDate: "2022-08-10",
    stage: "Pre Series A",
    shareholding: 18.0,
    employees: {
      founders: { male: 1, female: 1, others: 0 },
      others: { male: 12, female: 15, others: 0 }
    },
    workers: {
      direct: { male: 8, female: 12, others: 0 },
      indirect: { male: 4, female: 6, others: 0 }
    },
    esgCategory: "B",
    esgScore: 80
  },
  {
    id: 5,
    name: "FinSecure",
    type: "Private Ltd",
    sector: "FinTech",
    fundId: 3,
    fundName: "Impact Ventures",
    ceo: "David Chen",
    investmentDate: "2023-01-14",
    stage: "Seed",
    shareholding: 20.0,
    employees: {
      founders: { male: 2, female: 0, others: 0 },
      others: { male: 10, female: 8, others: 0 }
    },
    workers: {
      direct: { male: 5, female: 4, others: 0 },
      indirect: { male: 2, female: 3, others: 0 }
    },
    esgCategory: "C",
    esgScore: 75
  }
];

// Retrieve unique fund data for filtering
const funds = Array.from(new Set(portfolioCompanies.map(company => company.fundId)))
  .map(fundId => {
    const company = portfolioCompanies.find(c => c.fundId === fundId);
    return { id: fundId, name: company?.fundName || '' };
  });

// Retrieve unique sectors for filtering  
const sectors = Array.from(new Set(portfolioCompanies.map(company => company.sector)));

export default function Portfolio() {
  const navigate = useNavigate();
  const [selectedFund, setSelectedFund] = useState<string>("");
  const [selectedSector, setSelectedSector] = useState<string>("");
  const [email, setEmail] = useState("");
  
  // Filter companies based on selected filters
  const filteredCompanies = portfolioCompanies.filter(company => {
    const matchesFund = selectedFund ? company.fundId.toString() === selectedFund : true;
    const matchesSector = selectedSector ? company.sector === selectedSector : true;
    return matchesFund && matchesSector;
  });
  
  const handleInvite = () => {
    console.log("Inviting company with email:", email);
    // Reset email input
    setEmail("");
  };
  
  // Helper function to get category color
  const getCategoryColor = (category: string) => {
    switch(category) {
      case "A": return "bg-green-100 text-green-800";
      case "B": return "bg-yellow-100 text-yellow-800";
      case "C": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Portfolio Companies</h1>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Invite Company</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a Company</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Founder/CEO Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address" 
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleInvite}
                  disabled={!email}
                >
                  Send Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button onClick={() => navigate("/portfolio/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Add New Company</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="block text-sm font-medium mb-1">Filter by Fund</Label>
          <Select value={selectedFund} onValueChange={setSelectedFund}>
            <SelectTrigger>
              <SelectValue placeholder="All Funds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Funds</SelectItem>
              {funds.map(fund => (
                <SelectItem key={fund.id} value={fund.id.toString()}>
                  {fund.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="block text-sm font-medium mb-1">Filter by Sector</Label>
          <Select value={selectedSector} onValueChange={setSelectedSector}>
            <SelectTrigger>
              <SelectValue placeholder="All Sectors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Sectors</SelectItem>
              {sectors.map(sector => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {filteredCompanies.map(company => (
          <Card key={company.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{company.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{company.sector}</p>
                </div>
                <Badge className={getCategoryColor(company.esgCategory)}>
                  Category {company.esgCategory}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Company Details</h3>
                  <div className="space-y-1 mt-2">
                    <p className="text-sm">
                      <span className="font-medium">Type:</span> {company.type}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">CEO:</span> {company.ceo}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Fund:</span> {company.fundName}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Stage:</span> {company.stage}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Investment Info</h3>
                  <div className="space-y-1 mt-2">
                    <p className="text-sm">
                      <span className="font-medium">Investment Date:</span> {new Date(company.investmentDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Fund Shareholding:</span> {company.shareholding}%
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">ESG Score:</span> {company.esgScore}/100
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Team Composition</h3>
                  <div className="space-y-1 mt-2 text-xs">
                    <p className="font-medium">Employees:</p>
                    <p>
                      Founders: {company.employees.founders.male} male, {company.employees.founders.female} female, {company.employees.founders.others} others
                    </p>
                    <p>
                      Other: {company.employees.others.male} male, {company.employees.others.female} female, {company.employees.others.others} others
                    </p>
                    <Separator className="my-1" />
                    <p className="font-medium">Workers:</p>
                    <p>
                      Direct: {company.workers.direct.male} male, {company.workers.direct.female} female, {company.workers.direct.others} others
                    </p>
                    <p>
                      Indirect: {company.workers.indirect.male} male, {company.workers.indirect.female} female, {company.workers.indirect.others} others
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 flex justify-end py-3">
              <Button variant="outline" onClick={() => navigate(`/portfolio/${company.id}`)}>
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {filteredCompanies.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Mail className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No companies found</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            No companies match your filter criteria.
          </p>
          <Button variant="outline" onClick={() => {
            setSelectedFund("");
            setSelectedSector("");
          }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}

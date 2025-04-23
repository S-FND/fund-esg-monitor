import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PortfolioCompanyKPIs } from "@/components/PortfolioCompanyKPIs";

// Dummy data
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

const financialYears = ["2021", "2022", "2023", "2024", "2025"];

export default function Dashboard() {
  const [selectedFund, setSelectedFund] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("2025");
  const navigate = useNavigate();
  
  // Filter companies based on selected fund
  const filteredCompanies = selectedFund === "all"
    ? companies
    : companies.filter(company => company.fundId === parseInt(selectedFund));
  
  // Find companyId for API fetch based on selected company string ID
  const selectedCompanyId =
    selectedCompany !== "all"
      ? companies.find((c) => c.id.toString() === selectedCompany)?.id?.toString() ?? ""
      : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Add Fund</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Fund</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>This will take you to the Create New Fund page.</p>
                <Button className="mt-4 w-full" onClick={() => navigate("/funds/new")}>
                  Continue
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Add Portfolio Company</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Portfolio Company</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>This will take you to the General Information page for adding a new company.</p>
                <Button className="mt-4 w-full" onClick={() => navigate("/portfolio/new")}>
                  Continue
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
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
      
      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="esg-scores">ESG Scores</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Funds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{funds.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total capital: $175M
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Portfolio Companies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{companies.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {funds.length} funds
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average ESG Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">82</div>
                <p className="text-xs text-muted-foreground mt-1">
                  4.5% increase since last year
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>ESG Performance by Fund</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-accent rounded-md">
                  <p className="text-muted-foreground">Fund Performance Chart</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top ESG Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {companies
                    .sort((a, b) => b.esgScore - a.esgScore)
                    .slice(0, 3)
                    .map((company, i) => (
                      <div key={company.id} className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-esg-primary text-white flex items-center justify-center">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-sm text-muted-foreground">{company.sector}</p>
                        </div>
                        <div className="ml-auto font-bold">{company.esgScore}</div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="esg-scores">
          <Card>
            <CardHeader>
              <CardTitle>ESG Scores by Component</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center bg-accent rounded-md mb-4">
                <p className="text-muted-foreground">ESG Component Chart</p>
              </div>
              {/* ESG KPIs reported by portfolio company for the selected year */}
              {selectedCompany !== "all" && selectedCompanyId && (
                <PortfolioCompanyKPIs companyId={selectedCompanyId} reportedYear={selectedYear} />
              )}
              {selectedCompany === "all" && (
                <p className="text-sm text-muted-foreground mt-4">
                  Select a specific portfolio company to view its reported ESG KPIs.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>ESG Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center bg-accent rounded-md">
                <p className="text-muted-foreground">Year-over-Year ESG Trend Chart</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

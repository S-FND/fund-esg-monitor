
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { funds as dummyFunds } from "./fundsData";
import { portfolioCompanies } from "@/features/edit-portfolio-company/portfolioCompanies";
import { BarChart2, Building, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const currencies = ["USD", "EUR", "GBP", "INR", "SGD"];

const sectors = [
  "Agritech", 
  "ClimateTech", 
  "FinTech", 
  "HealthTech", 
  "EdTech", 
  "Logistics", 
  "DeepTech", 
  "SpaceTech", 
  "Quick Commerce", 
  "Ecomm", 
  "Robotics", 
  "Others"
];

const investmentStages = [
  "Pre Seed",
  "Seed",
  "Pre Series A",
  "Series A",
  "Series B and above",
  "Pre-IPO",
  "IPO"
];

// Sample team members data
const teamMembers = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@example.com",
    designation: "Fund Manager"
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    designation: "ESG Analyst"
  },
  {
    id: "3",
    name: "Michael Wong",
    email: "michael.wong@example.com",
    designation: "Investment Analyst"
  },
  {
    id: "4",
    name: "Lisa Chen",
    email: "lisa.chen@example.com",
    designation: "Chief Investment Officer"
  }
];

export default function EditFund() {
  const navigate = useNavigate();
  const { id } = useParams();
  const fund = dummyFunds.find(f => f.id === Number(id));

  // If fund not found (bad URL), return to list
  if (!fund) {
    navigate("/funds");
    return null;
  }

  const [formData, setFormData] = useState({
    name: fund.name,
    size: fund.size,
    currency: fund.currency,
    focus: fund.focus,
    stage: fund.stage,
    inclusionTerms: fund.inclusionTerms,
    exclusionTerms: fund.exclusionTerms,
  });

  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);

  // Initialize with some sample selections
  useEffect(() => {
    setSelectedTeamMembers(["1", "4"]);
    setSelectedCompanies([1, 3]);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (
    field: "currency" | "stage",
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFocusToggle = (sector: string) => {
    setFormData(prev => {
      const focus = [...prev.focus];
      if (focus.includes(sector)) {
        return { ...prev, focus: focus.filter(s => s !== sector) };
      } else {
        return { ...prev, focus: [...focus, sector] };
      }
    });
  };

  const handleTeamMemberToggle = (id: string) => {
    setSelectedTeamMembers(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleCompanyToggle = (id: number) => {
    setSelectedCompanies(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Would save changes here; currently dummy data only
    toast({
      title: "Fund Updated",
      description: `${formData.name} has been updated successfully.`
    });
    navigate("/funds");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Edit Fund</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="details">
          <TabsList className="mb-4">
            <TabsTrigger value="details">
              <BarChart2 className="h-4 w-4 mr-2" />
              Fund Details
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="h-4 w-4 mr-2" />
              Team Members
            </TabsTrigger>
            <TabsTrigger value="companies">
              <Building className="h-4 w-4 mr-2" />
              Portfolio Companies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Edit Details for {fund.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Fund Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter fund name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="size">Fund Size</Label>
                      <Input
                        id="size"
                        name="size"
                        value={formData.size}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter fund size"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <select
                        id="currency"
                        name="currency"
                        value={formData.currency}
                        onChange={e => handleSelectChange("currency", e.target.value)}
                        className="border rounded-md px-2 py-1 w-full"
                      >
                        {currencies.map(cur => (
                          <option key={cur} value={cur}>{cur}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Sector Focus</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {sectors.sort().map(sector => (
                      <div key={sector} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`focus-${sector}`}
                          checked={formData.focus.includes(sector)}
                          onChange={() => handleFocusToggle(sector)}
                          className="accent-primary h-4 w-4 rounded border"
                        />
                        <Label htmlFor={`focus-${sector}`} className="text-sm font-normal">
                          {sector}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage">Stage of Investment</Label>
                  <select
                    id="stage"
                    name="stage"
                    value={formData.stage}
                    onChange={e => handleSelectChange("stage", e.target.value)}
                    className="border rounded-md px-2 py-1 w-full"
                  >
                    {investmentStages.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Inclusion Terms</Label>
                    <textarea
                      value={formData.inclusionTerms.join(", ")}
                      readOnly
                      className="w-full mt-1 text-sm bg-muted rounded"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Exclusion Terms</Label>
                    <textarea
                      value={formData.exclusionTerms.join(", ")}
                      readOnly
                      className="w-full mt-1 text-sm bg-muted rounded"
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select team members who will be part of this fund.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teamMembers.map(member => (
                      <div key={member.id} className="flex items-start space-x-3 p-3 border rounded-md">
                        <Checkbox 
                          id={`team-member-${member.id}`} 
                          checked={selectedTeamMembers.includes(member.id)}
                          onCheckedChange={() => handleTeamMemberToggle(member.id)}
                        />
                        <div className="space-y-1">
                          <Label 
                            htmlFor={`team-member-${member.id}`}
                            className="font-medium cursor-pointer"
                          >
                            {member.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">{member.designation}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Companies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select companies that are part of this fund's portfolio.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {portfolioCompanies.map(company => (
                      <div key={company.id} className="flex items-start space-x-3 p-3 border rounded-md">
                        <Checkbox 
                          id={`company-${company.id}`} 
                          checked={selectedCompanies.includes(company.id)}
                          onCheckedChange={() => handleCompanyToggle(company.id)}
                        />
                        <div className="space-y-1">
                          <Label 
                            htmlFor={`company-${company.id}`}
                            className="font-medium cursor-pointer"
                          >
                            {company.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">{company.industry}</p>
                          <p className="text-xs text-muted-foreground">{company.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <div className="flex justify-end mt-6 space-x-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => navigate("/funds")}
          >
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </div>
  );
}

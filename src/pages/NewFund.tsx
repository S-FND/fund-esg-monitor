import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart2, Building, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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

const INCLUSION_OPTIONS = [
  "Quality Education",
  "Sustainable Development",
  "SDGs",
  "Planet Positive",
  "Healthcare",
  "Upskilling",
];

const EXCLUSION_OPTIONS = [
  "Cyborg",
  "Mining",
  "Alcohol",
  "Arms",
  "Weapons",
  "Politics",
];

export default function NewFund() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    size: "",
    currency: "INR",
    focus: [] as string[],
    stageOfInvestment: "",
    inclusion: [] as string[],
    exclusion: [] as string[],
  });

  const [portfolioCompanies, setPortfolioCompanies] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (
    field: "stageOfInvestment",
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

  const handleInclusionToggle = (option: string) => {
    setFormData(prev => {
      const updated = prev.inclusion.includes(option)
        ? prev.inclusion.filter(i => i !== option)
        : [...prev.inclusion, option];
      return { ...prev, inclusion: updated };
    });
  };

  const handleExclusionToggle = (option: string) => {
    setFormData(prev => {
      const updated = prev.exclusion.includes(option)
        ? prev.exclusion.filter(i => i !== option)
        : [...prev.exclusion, option];
      return { ...prev, exclusion: updated };
    });
  };

  const handleCompanyToggle = (id: string, checked?: boolean) => {
    setSelectedCompanies(prev =>
      (typeof checked === "boolean" ? checked : !prev.includes(id))
        ? (prev.includes(id) ? prev : [...prev, id])
        : prev.filter(c => c !== id)
    );
  };

  const getCompanyList = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}` + "/investor/companyInfo/", {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        return;
      }
      else {
        const jsondata = await res.json();
        console.log('jsondata', jsondata)
        setPortfolioCompanies(jsondata['data'])
      }
    } catch (error) {
      console.error("Api call:", error);
    }
  }

  const getTeamList = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}` + `/subuser`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        return;
      }
      else {
        const jsondata = await res.json();
        setTeamMembers(jsondata['data'][0]?.['subuser'] || [])
      }
    } catch (error) {
      console.error("Error fetching team list:", error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting fund data:", formData);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}` + `/investor/fund`, {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          sectorFocus: formData.focus.join(","),
          stageOfInvestment: formData.stageOfInvestment
        }),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });

      if (!res.ok) {
        toast({
          title: "Error",
          description: "Failed to create fund",
          variant: "destructive"
        });
        return;
      }

      const jsondata = await res.json();
      console.log('jsondata', jsondata);

      // If companies were selected, add them to the fund
      if (selectedCompanies.length > 0 && jsondata.data?._id) {
        await addCompanyToFund(jsondata.data._id);
      }

      toast({
        title: "✅ Fund Created",
        description: `${formData.name} has been created successfully.`
      });

      navigate("/funds");

    } catch (error) {
      console.error("Api call:", error);
      toast({
        title: "Error",
        description: "API Call failed. Please try again.",
        variant: "destructive"
      });
    }
  };

  const addCompanyToFund = async (fundId: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/investor/companyInfo/company/addtoFund`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          body: JSON.stringify({
            companyInfoId: selectedCompanies,
            fundId: fundId,
          }),
        }
      );

      const data = await res.json();
      console.log("Companies Added to Fund ✅", data);
    } catch (error) {
      console.error("addCompanyToFund error:", error);
    }
  };

  useEffect(() => {
    getCompanyList();
    getTeamList();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Create New Fund</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="details">
          <TabsList className="mb-4">
            <TabsTrigger value="details">
              <BarChart2 className="h-4 w-4 mr-2" />
              Fund Details
            </TabsTrigger>
            <TabsTrigger value="companies">
              <Building className="h-4 w-4 mr-2" />
              Portfolio Companies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Fund Details</CardTitle>
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
                  <div className="space-y-2">
                    <Label htmlFor="size">Fund Size (INR)</Label>
                    <Input
                      id="size"
                      name="size"
                      type="number"
                      value={formData.size}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter fund size"
                    />
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

                {/* Inclusion Terms */}
                <div className="space-y-2">
                  <Label>Inclusion Terms</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {INCLUSION_OPTIONS.map(option => (
                      <label key={option} className="flex items-center gap-2">
                        <Checkbox
                          checked={formData.inclusion.includes(option)}
                          onCheckedChange={() => handleInclusionToggle(option)}
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.inclusion.includes("Other")}
                        onCheckedChange={() => handleInclusionToggle("Other")}
                      />
                      <span className="text-sm">Other</span>
                    </label>
                  </div>
                </div>

                {/* Exclusion Terms */}
                <div className="space-y-2 mt-6">
                  <Label>Exclusion Terms</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {EXCLUSION_OPTIONS.map(option => (
                      <label key={option} className="flex items-center gap-2">
                        <Checkbox
                          checked={formData.exclusion.includes(option)}
                          onCheckedChange={() => handleExclusionToggle(option)}
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.exclusion.includes("Other")}
                        onCheckedChange={() => handleExclusionToggle("Other")}
                      />
                      <span className="text-sm">Other</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stageOfInvestment">Stage of Investment</Label>
                  <select
                    id="stageOfInvestment"
                    name="stageOfInvestment"
                    value={formData.stageOfInvestment}
                    onChange={e => handleSelectChange("stageOfInvestment", e.target.value)}
                    className="border rounded-md px-2 py-1 w-full"
                  >
                    <option value="">Select investment stage</option>
                    {investmentStages.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
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
                    Select companies that will be part of this fund's portfolio.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {portfolioCompanies.map(company => (
                      <div
                        key={company._id}
                        className="flex items-start space-x-3 p-3 border rounded-md"
                      >
                        <Checkbox
                          id={`company-${company._id}`}
                          checked={selectedCompanies.includes(company._id)}
                          onCheckedChange={(checked) =>
                            handleCompanyToggle(company._id, Boolean(checked))
                          }
                        />
                        <div className="space-y-1">
                          <Label
                            htmlFor={`company-${company._id}`}
                            className="font-medium cursor-pointer"
                          >
                            {company.companyName}
                          </Label>
                          <p className="text-sm text-muted-foreground">{company.sector}</p>
                          <p className="text-xs text-muted-foreground">
                            {company.companytype}
                          </p>
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
          <Button variant="outline" type="button" onClick={() => navigate("/funds")}>
            Cancel
          </Button>
          <Button type="submit">Create Fund</Button>
        </div>
      </form>
    </div>
  );
}
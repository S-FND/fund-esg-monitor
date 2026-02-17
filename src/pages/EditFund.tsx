import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { funds as dummyFunds } from "./fundsData";
// import { portfolioCompanies } from "@/features/edit-portfolio-company/portfolioCompanies";
import { BarChart2, Building, Users, LayoutDashboard, Leaf, Users2, Shield, TrendingUp, Award, Droplets, Wind, Factory, Recycle, Globe, Target, Zap, Trash2, AlertCircle, AlertTriangle } from "lucide-react";
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

// Dashboard Topics based on backend service structure
const DASHBOARD_TOPICS = [
  {
    id: "environment",
    label: "Environment Metrics",
    icon: Leaf,
    subtopics: [
      { id: "energy", label: "Energy Consumption", icon: Zap },
      { id: "water_withdrawl", label: "Water Withdrawal", icon: Droplets },
      { id: "water_discharge", label: "Water Discharge", icon: Droplets },
      { id: "waste_management", label: "Waste Management", icon: Trash2 },
      { id: "waste_recovery", label: "Waste Recovery", icon: Recycle },
      { id: "gh_gas_emission", label: "GHG Emissions", icon: Wind },
      { id: "air_emission", label: "Air Emissions", icon: Factory },
      { id: "disposal_method", label: "Waste Disposal", icon: Trash2 },
    ]
  },
  {
    id: "social",
    label: "Social Metrics",
    icon: Users2,
    subtopics: [
      { id: "employee_diversity", label: "Employee Diversity", icon: Users2 },
      { id: "workers_diversity", label: "Workers Diversity", icon: Users2 },
      { id: "key_persons", label: "Key Personnel", icon: Award },
      { id: "differently_abled", label: "Differently Abled", icon: Users2 },
      { id: "workers_differently_abled", label: "Workers Differently Abled", icon: Users2 },
      { id: "minimum_wages", label: "Minimum Wages", icon: TrendingUp },
      { id: "workers_minimum_wages", label: "Workers Minimum Wages", icon: TrendingUp },
      { id: "life_coverage", label: "Life Insurance Coverage", icon: Shield },
      { id: "workers_life_coverage", label: "Workers Life Coverage", icon: Shield },
      { id: "accident_insurance", label: "Accident Insurance", icon: Shield },
      { id: "workers_accident_insurance", label: "Workers Accident Insurance", icon: Shield },
    ]
  },
  {
    id: "governance",
    label: "Governance Metrics",
    icon: Shield,
    subtopics: [
      { id: "board_members_gender", label: "Board Gender Diversity", icon: Users2 },
      { id: "board_pay_parity", label: "Board Pay Parity", icon: TrendingUp },
      { id: "esg_skilled", label: "ESG Skilled Board", icon: Award },
      { id: "disciplinary_action", label: "Disciplinary Actions", icon: Shield },
      { id: "details_of_complaints", label: "Complaints Details", icon: AlertCircle },
      { id: "percentageOperations", label: "Operations Percentage", icon: TrendingUp },
      { id: "the_ratio_of_independent", label: "Independent Directors Ratio", icon: Users2 },
      { id: "litigation_risks", label: "Litigation Risks", icon: AlertCircle },
      { id: "political_contributions", label: "Political Contributions", icon: Globe },
      { id: "percentage_of_board", label: "Board Composition", icon: Users2 },
    ]
  },
  {
    id: "risk",
    label: "Risk & Compliance",
    icon: AlertTriangle,
    subtopics: [
      { id: "risk_identified", label: "Risk Identification", icon: AlertTriangle },
      { id: "non_compliance", label: "Non-Compliance", icon: AlertCircle },
      { id: "esg_score", label: "ESG Score", icon: Target },
      { id: "sdg_strategy", label: "SDG Strategy", icon: Target },
    ]
  }
];

export default function EditFund() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [fund, setFund] = useState([])
  const [portfolioCompanies, setPortfolioCompanies] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [activeTab, setActiveTab] = useState("details");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If fund not found (bad URL), return to list
  if (!fund) {
    navigate("/funds");
    return null;
  }

  const [formData, setFormData] = useState({
    name: '',
    size: '',
    currency: '',
    focus: [],
    stage: '',
    sectorFocus: '',
    stageOfInvestment: '',
    inclusion: [],
    exclusion: [],
    dashboardTopics: [], // Store selected dashboard topic IDs
  });

  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (
    field: "currency" | "stageOfInvestment",
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

  const handleDashboardTopicToggle = (topicId: string) => {
    setFormData(prev => {
      const topics = [...prev.dashboardTopics];
      if (topics.includes(topicId)) {
        return { ...prev, dashboardTopics: topics.filter(t => t !== topicId) };
      } else {
        return { ...prev, dashboardTopics: [...topics, topicId] };
      }
    });
  };

  const handleMainCategoryToggle = (categoryId: string, subtopics: any[]) => {
    const subtopicIds = subtopics.map(s => s.id);
    const allSelected = subtopicIds.every(id => formData.dashboardTopics.includes(id));
    
    setFormData(prev => {
      let updatedTopics = [...prev.dashboardTopics];
      
      if (allSelected) {
        // Remove all subtopics in this category
        updatedTopics = updatedTopics.filter(id => !subtopicIds.includes(id));
      } else {
        // Add all subtopics in this category
        subtopicIds.forEach(id => {
          if (!updatedTopics.includes(id)) {
            updatedTopics.push(id);
          }
        });
      }
      
      return { ...prev, dashboardTopics: updatedTopics };
    });
  };

  const handleCompanyToggle = (id: string, checked?: boolean) => {
    setSelectedCompanies(prev =>
      (typeof checked === "boolean" ? checked : !prev.includes(id))
        ? (prev.includes(id) ? prev : [...prev, id])
        : prev.filter(c => c !== id)
    );
  };

  const updateFundData = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/investor/fund`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          body: JSON.stringify({
            _id: id,
            name: formData.name,
            size: formData.size,
            currency: formData.currency,
            sectorFocus: formData.focus.join(","),
            stageOfInvestment: formData.stageOfInvestment,
            inclusion: formData.inclusion,
            exclusion: formData.exclusion,
            dashboardTopics: formData.dashboardTopics,
            fundedCompany: selectedCompanies.map(companyId => ({
              companyInfoId: companyId
            }))
          }),
        }
      );

      const data = await res.json();
      console.log('data', data);
      if (!res.ok) {
        toast({
          title: "❌ Update Failed",
          description: "Failed to update fund details.",
          variant: "destructive",
        });
        return;
      }
      else {
        toast({
          title: "✅ Fund Updated",
          description: `${formData.name} has been updated successfully.`
        });
        
        // Refresh fund data
        await getFundDetail();
      }
    } catch (error) {
      console.error("Api call:", error);
      toast({
        title: "❌ Update Failed",
        description: "An error occurred while updating the fund.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateFundData();
  };

  const getFundDetail = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}` + `/investor/fund/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        return;
      }
      else {
        const jsondata = await res.json();
        console.log('jsondata', jsondata)
        setFormData({ 
          ...jsondata['data'][0], 
          focus: jsondata['data'][0]['sectorFocus']?.split(",") || [],
          dashboardTopics: jsondata['data'][0]['dashboardTopics'] || [],
        })
        setFund(jsondata['data'][0])
        setSelectedCompanies(jsondata['data'][0]?.fundedCompany?.map((c) => c.companyInfo.companyInfoId) || [])
      }
    } catch (error) {
      console.error("Api call:", error);
    }
  }

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

  useEffect(() => {
    getFundDetail()
    getCompanyList()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Edit Fund</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="details">
            <BarChart2 className="h-4 w-4 mr-2" />
            Fund Details
          </TabsTrigger>
          <TabsTrigger value="companies">
            <Building className="h-4 w-4 mr-2" />
            Portfolio Companies
          </TabsTrigger>
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard Topics
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Edit Details for {fund['name']}</CardTitle>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <Label>Inclusion Terms</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {INCLUSION_OPTIONS.map(option => (
                      <label key={option} className="flex items-center gap-2">
                        <Checkbox
                          checked={formData.inclusion.includes(option)}
                          onCheckedChange={() => {
                            setFormData(prev => {
                              const updated = prev.inclusion.includes(option)
                                ? prev.inclusion.filter(i => i !== option)
                                : [...prev.inclusion, option];
                              return { ...prev, inclusion: updated };
                            });
                          }}
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.inclusion.includes("Other")}
                        onCheckedChange={() => {
                          setFormData(prev => {
                            const updated = prev.inclusion.includes("Other")
                              ? prev.inclusion.filter(i => i !== "Other")
                              : [...prev.inclusion, "Other"];
                            return { ...prev, inclusion: updated };
                          });
                        }}
                      />
                      <span className="text-sm">Other</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2 mt-6">
                  <Label>Exclusion Terms</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {EXCLUSION_OPTIONS.map(option => (
                      <label key={option} className="flex items-center gap-2">
                        <Checkbox
                          checked={formData.exclusion.includes(option)}
                          onCheckedChange={() => {
                            setFormData(prev => {
                              const updated = prev.exclusion.includes(option)
                                ? prev.exclusion.filter(i => i !== option)
                                : [...prev.exclusion, option];
                              return { ...prev, exclusion: updated };
                            });
                          }}
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.exclusion.includes("Other")}
                        onCheckedChange={() => {
                          setFormData(prev => {
                            const updated = prev.exclusion.includes("Other")
                              ? prev.exclusion.filter(i => i !== "Other")
                              : [...prev.exclusion, "Other"];
                            return { ...prev, exclusion: updated };
                          });
                        }}
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
                    Select companies that are part of this fund's portfolio.
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

          <TabsContent value="dashboard">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Topics Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Select the dashboard metrics that should be displayed for this fund's portfolio companies.
                    These settings will be saved along with the fund details.
                  </p>

                  {DASHBOARD_TOPICS.map(category => {
                    const Icon = category.icon;
                    const allSelected = category.subtopics.every(s => 
                      formData.dashboardTopics.includes(s.id)
                    );
                    
                    return (
                      <div key={category.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">{category.label}</h3>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleMainCategoryToggle(category.id, category.subtopics)}
                          >
                            {allSelected ? "Deselect All" : "Select All"}
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {category.subtopics.map(subtopic => {
                            const SubtopicIcon = subtopic.icon;
                            return (
                              <div key={subtopic.id} className="flex items-start space-x-3 p-2 border rounded-md hover:bg-accent/50">
                                <Checkbox
                                  id={`topic-${subtopic.id}`}
                                  checked={formData.dashboardTopics.includes(subtopic.id)}
                                  onCheckedChange={() => handleDashboardTopicToggle(subtopic.id)}
                                />
                                <div className="flex items-center gap-2">
                                  <SubtopicIcon className="h-4 w-4 text-muted-foreground" />
                                  <Label
                                    htmlFor={`topic-${subtopic.id}`}
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {subtopic.label}
                                  </Label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Selected Topics Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      {formData.dashboardTopics.length} topics selected
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.dashboardTopics.map(topicId => {
                        const topic = DASHBOARD_TOPICS.flatMap(c => c.subtopics).find(s => s.id === topicId);
                        return topic && (
                          <span key={topicId} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                            <topic.icon className="h-3 w-3" />
                            {topic.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="flex justify-end mt-6 space-x-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate("/funds")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save All Changes"}
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  );
}
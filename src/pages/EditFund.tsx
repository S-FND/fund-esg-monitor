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
      { id: "energy_consumption", label: "Energy Consumption (GJ)", icon: Zap },
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

  const [fund, setFund] = useState<any>(null);
  const [portfolioCompanies, setPortfolioCompanies] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState([])
  const [activeTab, setActiveTab] = useState("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // New state for AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);

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
    dashboardTopics: [],
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
        updatedTopics = updatedTopics.filter(id => !subtopicIds.includes(id));
      } else {
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
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/investor/fund/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      if (!res.ok) {
        navigate("/funds");
        return;
      }

      const jsondata = await res.json();
      const fundData = jsondata?.data?.[0];

      if (!fundData) {
        navigate("/funds");
        return;
      }

      const focusArray = (fundData.sectorFocus || "")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);

      const companyIds =
        fundData?.fundedCompany?.map(
          (item: any) => item?.companyInfo?.companyInfoId
        ).filter(Boolean) || [];

      setFormData({
        name: fundData.name || "",
        size: fundData.size || "",
        currency: fundData.currency || "",
        focus: focusArray,
        stage: fundData.stage || "",
        sectorFocus: fundData.sectorFocus || "",
        stageOfInvestment: fundData.stageOfInvestment || "",
        inclusion: fundData.inclusion || [],
        exclusion: fundData.exclusion || [],
        dashboardTopics: fundData.dashboardTopics || [],
      });

      setSelectedCompanies(companyIds);
      setFund(fundData);
    } catch (error) {
      console.error("API Error:", error);
      navigate("/funds");
    } finally {
      setLoading(false);
    }
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
        console.log('jsondata', jsondata);
        setPortfolioCompanies(jsondata?.data || jsondata || []);
      }
    } catch (error) {
      console.error("Api call:", error);
    }
  }

  useEffect(() => {
    if (!id) return;

    Promise.all([
      getFundDetail(),
      getCompanyList()
    ]);
  }, [id]);

  // Updated AI function to handle new response structure
  const getAIDashboardSuggestions = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/investor/fund/ai/dashboard-topics`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          body: JSON.stringify({
            sectorFocus: formData.focus,
            stageOfInvestment: formData.stageOfInvestment,
            inclusion: formData.inclusion,
            exclusion: formData.exclusion,
          }),
        }
      );

      const data = await res.json();
      console.log("AI Topics:", data);

      if (data?.status && data?.data) {
        // Store AI suggestions separately
        setAiSuggestions({
          topTopics: data.data.topTopics || [],
          suggestions: data.data.suggestions || [],
          success: data.data.success
        });

        setShowAiPanel(true);

        toast({
          title: "✨ AI Suggestions Ready",
          description: `Generated ${data.data.topTopics?.length || 0} topic recommendations.`,
        });
      } else {
        toast({
          title: "AI Error",
          description: "Failed to generate AI topics",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "AI Error",
        description: "Failed to generate AI topics",
        variant: "destructive",
      });
    }
  };

  // Function to apply AI topic suggestions
  const applyAITopics = () => {
    if (aiSuggestions?.topTopics) {
      setFormData(prev => ({
        ...prev,
        dashboardTopics: aiSuggestions.topTopics
      }));
      setShowAiPanel(false);
      toast({
        title: "✅ AI Topics Applied",
        description: "Dashboard topics updated with AI recommendations.",
      });
    }
  };

  // Function to merge AI topics with current selection
  const mergeAITopics = () => {
    if (aiSuggestions?.topTopics) {
      setFormData(prev => ({
        ...prev,
        dashboardTopics: [...new Set([...prev.dashboardTopics, ...aiSuggestions.topTopics])]
      }));
      setShowAiPanel(false);
      toast({
        title: "✅ AI Topics Merged",
        description: "AI recommendations added to your current selection.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading fund details...</p>
        </div>
      </div>
    );
  }

  if (!fund) {
    navigate("/funds");
    return null;
  }

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
                <CardTitle>Edit Details for {fund?.name}</CardTitle>
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
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Select the dashboard metrics that should be displayed for this fund's portfolio companies.
                        These settings will be saved along with the fund details.
                      </p>
                    </div>

                    {/* Enhanced AI Button */}
                    <Button
                      type="button"
                      onClick={getAIDashboardSuggestions}
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">✨</span>
                        <span>Generate with AI</span>
                      </div>
                    </Button>
                  </div>

                  {/* Fund Context Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Sector Focus</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formData.focus.length > 0 ? formData.focus.join(', ') : 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Investment Stage</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formData.stageOfInvestment || 'Not selected'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                          <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">ESG Criteria</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formData.inclusion.length + formData.exclusion.length} total filters
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Suggestions Panel */}
                  {showAiPanel && aiSuggestions && (
                    <div className="mb-6 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-lg border-2 border-purple-200 dark:border-purple-800 animate-in fade-in slide-in-from-top-5 duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                            <span className="text-2xl">🤖</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">AI Recommendations</h3>
                            <p className="text-sm text-muted-foreground">
                              Based on your fund's sector focus and investment criteria
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAiPanel(false)}
                          className="hover:bg-purple-200/50"
                        >
                          ✕
                        </Button>
                      </div>

                      {/* Success/Warning Status */}
                      {aiSuggestions.success === false && (
                        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <p className="text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Some recommendations may need review based on your fund's profile.
                          </p>
                        </div>
                      )}

                      {/* Recommended Topics */}
                      {aiSuggestions.topTopics?.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Target className="h-4 w-4 text-purple-600" />
                            Recommended Dashboard Topics
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {aiSuggestions.topTopics.map((topicId: string) => {
                              const topic = DASHBOARD_TOPICS.flatMap(c => c.subtopics).find(s => s.id === topicId);
                              return topic ? (
                                <span
                                  key={topicId}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 rounded-full text-sm shadow-sm"
                                >
                                  <topic.icon className="h-3.5 w-3.5 text-purple-600" />
                                  {topic.label}
                                </span>
                              ) : (
                                <span
                                  key={topicId}
                                  className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 rounded-full text-sm"
                                >
                                  {topicId}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Actionable Suggestions */}
                      {aiSuggestions.suggestions?.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                            Actionable Insights
                          </h4>
                          <ul className="space-y-2">
                            {aiSuggestions.suggestions.map((suggestion: string, index: number) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <span className="text-purple-600 mt-1">•</span>
                                <span className="text-muted-foreground">{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                        <Button
                          size="sm"
                          onClick={applyAITopics}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                        >
                          Apply All Topics
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={mergeAITopics}
                          className="border-purple-200 hover:border-purple-300"
                        >
                          Merge with Current
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowAiPanel(false)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Dashboard Topics Categories */}
                  {DASHBOARD_TOPICS.map(category => {
                    const Icon = category.icon;
                    const allSelected = category.subtopics.every(s =>
                      formData.dashboardTopics.includes(s.id)
                    );

                    return (
                      <div key={category.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-primary/10 rounded-md">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold">{category.label}</h3>
                            <span className="text-xs bg-muted px-2 py-1 rounded-full">
                              {category.subtopics.length} metrics
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleMainCategoryToggle(category.id, category.subtopics)}
                            className="hover:bg-primary/10"
                          >
                            {allSelected ? "Deselect All" : "Select All"}
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {category.subtopics.map(subtopic => {
                            const SubtopicIcon = subtopic.icon;
                            const isSelected = formData.dashboardTopics.includes(subtopic.id);

                            return (
                              <div
                                key={subtopic.id}
                                className={`flex items-start space-x-3 p-3 border rounded-md transition-all hover:shadow-sm
                ${isSelected
                                    ? 'bg-primary/5 border-primary/30'
                                    : 'hover:bg-accent/50'
                                  }`}
                              >
                                <Checkbox
                                  id={`topic-${subtopic.id}`}
                                  checked={isSelected}
                                  onCheckedChange={() => handleDashboardTopicToggle(subtopic.id)}
                                  className="mt-0.5"
                                />
                                <Label
                                  htmlFor={`topic-${subtopic.id}`}
                                  className="text-sm font-medium cursor-pointer flex items-center gap-2 flex-1"
                                  onClick={() => handleDashboardTopicToggle(subtopic.id)}
                                >
                                  <SubtopicIcon className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                  {subtopic.label}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Enhanced Selected Topics Summary */}
                  <div className="mt-8 p-6 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <LayoutDashboard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Selected Topics Summary</h4>
                          <p className="text-sm text-muted-foreground">
                            {formData.dashboardTopics.length} metrics selected for dashboard
                          </p>
                        </div>
                      </div>

                      {/* Secondary AI Button */}
                      <Button
                        type="button"
                        onClick={getAIDashboardSuggestions}
                        disabled={isSubmitting}
                        variant="outline"
                        className="border-purple-200 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                      >
                        <span className="mr-2">🤖</span>
                        Refresh AI Suggestions
                      </Button>
                    </div>

                    {/* Selected Topics Tags */}
                    <div className="flex flex-wrap gap-2 min-h-[60px]">
                      {formData.dashboardTopics.length > 0 ? (
                        formData.dashboardTopics.map(topicId => {
                          const topic = DASHBOARD_TOPICS.flatMap(c => c.subtopics).find(s => s.id === topicId);
                          return topic && (
                            <span
                              key={topicId}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm border border-primary/20 hover:bg-primary/20 transition-colors group"
                            >
                              <topic.icon className="h-3.5 w-3.5" />
                              {topic.label}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDashboardTopicToggle(topicId);
                                }}
                                className="ml-1 opacity-60 group-hover:opacity-100 hover:text-red-500"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No topics selected. Use AI to generate suggestions or select manually above.
                        </p>
                      )}
                    </div>

                    {/* Progress Indicator */}
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${(formData.dashboardTopics.length / DASHBOARD_TOPICS.flatMap(c => c.subtopics).length) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.round((formData.dashboardTopics.length / DASHBOARD_TOPICS.flatMap(c => c.subtopics).length) * 100)}% configured
                      </span>
                    </div>

                    {/* AI Suggestions Summary (Alternative Compact View) */}
                    {aiSuggestions && !showAiPanel && (
                      <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1 bg-purple-100 dark:bg-purple-900 rounded-full">
                            <span className="text-sm">🤖</span>
                          </div>
                          <span className="text-sm font-medium">Previous AI Recommendations Available</span>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setShowAiPanel(true)} className="text-xs h-8">
                            View Recommendations
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setAiSuggestions(null)} className="text-xs h-8">
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    )}
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
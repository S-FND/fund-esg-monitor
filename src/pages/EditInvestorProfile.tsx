import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import {
  Building2,
  Mail,
  User,
  MapPin,
  Target,
  FileText,
  Briefcase,
  Globe,
  Shield,
  Upload,
  Save,
  X,
  Leaf,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  XCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Import JSON files
import sdgGoalsData from "./shared/sdgGoals.json";
import sdgTargetsData from "./shared/sdgTarget.json";

interface InvestorFormData {
  investorName: string;
  companyName: string;
  email: string;
  panNumber: string;
  gstNumber: string;
  esgManagerEmail: string;
  sdgGoal: string[];
  sdgTarget: any;
  designation: string;
  address: string;
  esgPolicy?: string;
  _id?: string;
}

// Map goal values to categories
const goalToCategoryMap: { [key: string]: string } = {
  "goal1": "category1",
  "goal2": "category2",
  "goal3": "category3",
  "goal4": "category4",
  "goal5": "category5",
  "goal6": "category6",
  "goal7": "category7",
  "goal8": "category8",
  "goal9": "category9",
  "goal10": "category10",
  "goal11": "category11",
  "goal12": "category12",
  "goal13": "category13",
  "goal14": "category14",
  "goal15": "category15",
  "goal16": "category16",
  "goal17": "category17"
};

export default function EditInvestorProfile() {
  const [formData, setFormData] = useState<InvestorFormData>({
    investorName: "",
    companyName: "",
    email: "",
    panNumber: "",
    gstNumber: "",
    esgManagerEmail: "",
    sdgGoal: [],
    sdgTarget: null,
    designation: "",
    address: ""
  });
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [openGoals, setOpenGoals] = useState(false);
  const [openTargets, setOpenTargets] = useState(false);
  const [searchGoals, setSearchGoals] = useState("");
  const [searchTargets, setSearchTargets] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFormData((prev) => ({
        ...prev,
        esgPolicy: file.name,
      }));
      setFileName(file.name);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearFile = () => {
    setFileName("");
    setFormData((prev) => ({
      ...prev,
      esgPolicy: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle SDG Goals selection
  const handleSdgGoalSelect = (goalValue: string) => {
    setFormData((prev) => {
      const currentGoals = Array.isArray(prev.sdgGoal) ? [...prev.sdgGoal] : [];
      
      if (currentGoals.includes(goalValue)) {
        return {
          ...prev,
          sdgGoal: currentGoals.filter(g => g !== goalValue),
          sdgTarget: null
        };
      } else {
        return {
          ...prev,
          sdgGoal: [...currentGoals, goalValue],
          sdgTarget: null
        };
      }
    });
  };

  // Handle SDG Targets selection
  const handleSdgTargetSelect = (targetValue: any) => {
    setFormData((prev) => ({
      ...prev,
      sdgTarget: targetValue
    }));
    setOpenTargets(false);
  };

  // Remove a specific SDG goal
  const removeSdgGoal = (goalToRemove: string) => {
    setFormData((prev) => {
      const currentGoals = Array.isArray(prev.sdgGoal) ? [...prev.sdgGoal] : [];
      return {
        ...prev,
        sdgGoal: currentGoals.filter(g => g !== goalToRemove),
        sdgTarget: null
      };
    });
  };

  // Remove selected target
  const removeSdgTarget = () => {
    setFormData((prev) => ({
      ...prev,
      sdgTarget: null
    }));
  };

  // Get selected goals data
  const getSelectedGoals = () => {
    const goals = Array.isArray(formData.sdgGoal) ? formData.sdgGoal : [];
    return sdgGoalsData.filter(goal => goals.includes(goal.value));
  };

  // Check if a goal is selected
  const isGoalSelected = (goalValue: string) => {
    return Array.isArray(formData.sdgGoal) && formData.sdgGoal.includes(goalValue);
  };

  // Get available targets based on selected goals
  const getAvailableTargets = () => {
    if (!formData.sdgGoal || formData.sdgGoal.length === 0) {
      return [];
    }

    const selectedGoalValues = Array.isArray(formData.sdgGoal) ? formData.sdgGoal : [];
    
    let allTargets: any[] = [];
    selectedGoalValues.forEach(goalValue => {
      const category = goalToCategoryMap[goalValue];
      if (category && sdgTargetsData[category]) {
        allTargets = [...allTargets, ...sdgTargetsData[category]];
      }
    });

    // Remove duplicates based on value
    const uniqueTargets = allTargets.filter((target, index, self) =>
      index === self.findIndex((t) => t.value === target.value)
    );

    return uniqueTargets;
  };

  const getInvestorInfo = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}` + "/investor/general-info/", {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        return;
      } else {
        const jsondata = await res.json();
        console.log('jsondata', jsondata);
        if (jsondata['data']) {
          let sdgGoals: string[] = [];
          const apiSdgGoal = jsondata['data']['sdgGoal'];
          
          if (Array.isArray(apiSdgGoal)) {
            sdgGoals = apiSdgGoal;
          } else if (typeof apiSdgGoal === 'string' && apiSdgGoal) {
            sdgGoals = apiSdgGoal.split(',').map((g: string) => g.trim()).filter(Boolean);
          }

          // Map old format to new format if needed
          sdgGoals = sdgGoals.map(goal => {
            if (goal.startsWith('Goal')) {
              const goalNumber = goal.split(' ')[1];
              return `goal${goalNumber}`;
            }
            return goal;
          });

          // Parse SDG Targets if exists
          let sdgTarget = null;
          if (jsondata['data']['sdgTarget']) {
            const targetValue = jsondata['data']['sdgTarget'];
            // Try to find matching target in the data
            const allTargets = Object.values(sdgTargetsData).flat();
            const matchingTarget = allTargets.find(t => t.value === targetValue || t.label === targetValue);
            sdgTarget = matchingTarget || { value: targetValue, label: targetValue };
          }

          let investorInfo: InvestorFormData = {
            investorName: jsondata['data']['investorName'] || "",
            companyName: jsondata['data']['companyName'] || "",
            email: jsondata['data']['email'] || "",
            panNumber: jsondata['data']['panNumber'] || "",
            gstNumber: jsondata['data']['gstNumber'] || "",
            esgManagerEmail: jsondata['data']['esgManagerEmail'] || "",
            sdgGoal: sdgGoals,
            sdgTarget: sdgTarget,
            designation: jsondata['data']['designation'] || "",
            address: jsondata['data']['address'] || "",
            _id: jsondata['data']['_id']
          };
          setFormData(investorInfo);
        }
      }
    } catch (error) {
      console.error("Api call:", error);
    }
  };

  useEffect(() => {
    getInvestorInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const selectedGoalLabels = selectedGoals.map(g => g.displayValue || g.label).join(', ');
      const selectedTargetLabel = formData.sdgTarget ? formData.sdgTarget.label : '';
      
      const submitData = {
        ...formData,
        sdgGoal: selectedGoalLabels,
        sdgTarget: selectedTargetLabel
      };

      console.log('submitData', submitData);
      let res;
      if (formData['_id']) {
        res = await fetch(`${import.meta.env.VITE_API_URL}` + "/investor/general-info/", {
          method: "PUT",
          body: JSON.stringify(submitData),
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        });
      } else {
        res = await fetch(`${import.meta.env.VITE_API_URL}` + "/investor/general-info/", {
          method: "POST",
          body: JSON.stringify(submitData),
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        });
      }

      if (!res.ok) {
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive",
        });
        return;
      } else {
        const jsondata = await res.json();
        console.log('jsondata', jsondata);
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        setTimeout(() => {
          navigate("/investor-info");
        }, 1500);
      }
    } catch (error) {
      console.error("Api call:", error);
      toast({
        title: "Error",
        description: "API Call failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const selectedGoals: any = getSelectedGoals();
  const availableTargets = getAvailableTargets();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Edit Investor Profile</h1>
              <p className="text-gray-600 text-sm mt-1">Update your investor information and ESG preferences</p>
            </div>
          </div>
          <Separator className="bg-gray-200" />
        </div>

        {/* Form Card */}
        <Card className="border-none shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-gray-50 border-b border-gray-200 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white rounded-lg shadow-sm">
                  <Leaf className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">Profile Information</CardTitle>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                Active
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="investorName" className="text-gray-700 font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      Investor Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="investorName"
                      name="investorName"
                      value={formData.investorName}
                      onChange={handleFieldChange}
                      placeholder="Enter investor name"
                      required
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-gray-700 font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      Company Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleFieldChange}
                      placeholder="Enter company name"
                      required
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleFieldChange}
                      placeholder="Enter email"
                      readOnly={true}
                      required
                      className="border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="designation" className="text-gray-700 font-medium flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      Designation <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="designation"
                      name="designation"
                      value={formData.designation}
                      onChange={handleFieldChange}
                      placeholder="Enter designation"
                      required
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="esgManagerEmail" className="text-gray-700 font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      ESG Manager Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="esgManagerEmail"
                      name="esgManagerEmail"
                      type="email"
                      value={formData.esgManagerEmail}
                      onChange={handleFieldChange}
                      placeholder="Enter ESG manager's email"
                      required
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="panNumber" className="text-gray-700 font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-500" />
                      PAN Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="panNumber"
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handleFieldChange}
                      placeholder="Enter PAN number"
                      required
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-mono uppercase"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gstNumber" className="text-gray-700 font-medium flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-500" />
                      GST Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="gstNumber"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleFieldChange}
                      placeholder="Enter GST number"
                      required
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-mono uppercase"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="esgPolicy" className="text-gray-700 font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      ESG Policy (PDF/Doc)
                    </Label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <input
                        id="esgPolicy"
                        name="esgPolicy"
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx"
                      />
                      <Button 
                        type="button" 
                        onClick={handleUploadClick} 
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 gap-2 w-full sm:w-auto"
                      >
                        <Upload className="h-4 w-4" />
                        {fileName ? "Change file" : "Upload file"}
                      </Button>
                      {fileName && (
                        <div className="flex items-center gap-2 flex-1">
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 py-1 px-2 text-xs truncate max-w-[200px]">
                            <FileText className="h-3 w-3 mr-1 inline" />
                            {fileName}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFile}
                            className="h-6 w-6 p-0 text-gray-500 hover:text-red-500 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {!fileName && (
                        <span className="text-sm text-gray-500 italic">No file chosen</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-gray-700 font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      Company Address <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleFieldChange}
                      placeholder="Enter company address"
                      rows={3}
                      required
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* SDG Section */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Sustainable Development Goals</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SDG Goals Dropdown */}
                  <div className="space-y-2">
                    <Label htmlFor="sdgGoal" className="text-gray-700 flex items-center gap-1">
                      SDG Goals <span className="text-red-500">*</span>
                    </Label>
                    
                    <Popover open={openGoals} onOpenChange={setOpenGoals}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between border-gray-300 bg-white hover:bg-gray-50 text-left font-normal"
                        >
                          <span className="truncate">
                            {selectedGoals.length > 0 
                              ? `${selectedGoals.length} goal${selectedGoals.length > 1 ? 's' : ''} selected` 
                              : "Select SDG goals..."}
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 max-h-80 overflow-auto" align="start">
                        <div className="p-2">
                          <Input
                            placeholder="Search goals..."
                            value={searchGoals}
                            onChange={(e) => setSearchGoals(e.target.value)}
                            className="mb-2"
                          />
                          <div className="space-y-1">
                            {sdgGoalsData
                              .filter(goal => 
                                goal.label.toLowerCase().includes(searchGoals.toLowerCase()) ||
                                (goal.displayValue && goal.displayValue.toLowerCase().includes(searchGoals.toLowerCase()))
                              )
                              .map((goal) => {
                                const selected = isGoalSelected(goal.value);
                                
                                return (
                                  <div
                                    key={goal.value}
                                    onClick={() => {
                                      handleSdgGoalSelect(goal.value);
                                    }}
                                    className={cn(
                                      "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-gray-100",
                                      selected && "bg-blue-50"
                                    )}
                                  >
                                    {goal.imageUrl && (
                                      <img 
                                        src={goal.imageUrl} 
                                        alt=""
                                        className="h-5 w-5 object-contain flex-shrink-0"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    )}
                                    <span className="flex-1 text-sm line-clamp-2">{goal.label}</span>
                                    <div className={cn(
                                      "h-4 w-4 border rounded-sm flex items-center justify-center flex-shrink-0",
                                      selected 
                                        ? "bg-blue-600 border-blue-600 text-white" 
                                        : "border-gray-300"
                                    )}>
                                      {selected && <CheckCircle2 className="h-3 w-3" />}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Selected goals display */}
                    {selectedGoals.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedGoals.map((goal) => (
                          <Badge 
                            key={goal.value}
                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none px-3 py-1 text-xs font-medium flex items-center gap-1"
                          >
                            {goal.imageUrl && (
                              <img 
                                src={goal.imageUrl} 
                                alt=""
                                className="h-3 w-3 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <span>{goal.displayValue || goal.value}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSdgGoal(goal.value);
                              }}
                              className="ml-1 hover:text-red-500 transition-colors"
                            >
                              <XCircle className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">Click on goals to select/deselect</p>
                  </div>

                  {/* SDG Targets Dropdown */}
                  <div className="space-y-2">
                    <Label htmlFor="sdgTarget" className="text-gray-700 flex items-center gap-1">
                      SDG Targets <span className="text-red-500">*</span>
                    </Label>
                    
                    <Popover open={openTargets} onOpenChange={setOpenTargets}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between border-gray-300 bg-white hover:bg-gray-50 text-left font-normal"
                          disabled={!formData.sdgGoal || formData.sdgGoal.length === 0}
                        >
                          <span className="truncate">
                            {formData.sdgTarget ? formData.sdgTarget.label : "Select targets..."}
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 max-h-80 overflow-auto" align="start">
                        <div className="p-2">
                          <Input
                            placeholder="Search targets..."
                            value={searchTargets}
                            onChange={(e) => setSearchTargets(e.target.value)}
                            className="mb-2"
                          />
                          <div className="space-y-1">
                            {availableTargets
                              .filter(target => 
                                target.label.toLowerCase().includes(searchTargets.toLowerCase()) ||
                                target.value.toLowerCase().includes(searchTargets.toLowerCase())
                              )
                              .map((target) => {
                                const selected = formData.sdgTarget?.value === target.value;
                                
                                return (
                                  <div
                                    key={target.value}
                                    onClick={() => {
                                      handleSdgTargetSelect(target);
                                    }}
                                    className={cn(
                                      "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-gray-100",
                                      selected && "bg-blue-50"
                                    )}
                                  >
                                    <span className="flex-1 text-sm line-clamp-2">{target.label}</span>
                                    <div className={cn(
                                      "h-4 w-4 border rounded-sm flex items-center justify-center flex-shrink-0",
                                      selected 
                                        ? "bg-blue-600 border-blue-600 text-white" 
                                        : "border-gray-300"
                                    )}>
                                      {selected && <CheckCircle2 className="h-3 w-3" />}
                                    </div>
                                  </div>
                                );
                              })}
                            {availableTargets.length === 0 && (
                              <div className="py-4 text-center text-sm text-gray-500">
                                No targets available for selected goals
                              </div>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Selected target display */}
                    {formData.sdgTarget && (
                      <div className="mt-2">
                        <Badge 
                          className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none px-3 py-1 text-xs font-medium flex items-center gap-1 w-fit"
                        >
                          <span>{formData.sdgTarget.label}</span>
                          <button
                            type="button"
                            onClick={removeSdgTarget}
                            className="ml-1 hover:text-red-500 transition-colors"
                          >
                            <XCircle className="h-3 w-3" />
                          </button>
                        </Badge>
                      </div>
                    )}
                    
                    {(!formData.sdgGoal || formData.sdgGoal.length === 0) && (
                      <p className="text-xs text-amber-600 mt-1">Please select SDG goals first</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-[#c8e6c9]">
                <Button
                  type="submit"
                  disabled={uploading}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#4caf50] to-[#1d8b54] hover:from-[#43a047] hover:to-[#5cb860] text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2 min-w-[150px]"
                >
                  {uploading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Profile
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto border-[#c8e6c9] text-[#2e7d32] hover:bg-[#f1f8e9] hover:border-[#4caf50] gap-2"
                  onClick={() => navigate("/investor-info")}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Fields marked with <span className="text-red-500">*</span> are required
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { PageNavigation } from "@/components/PageNavigation";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Dummy data
const funds = [
  { id: 1, name: "Green Tech Fund I" },
  { id: 2, name: "Sustainable Growth Fund" },
  { id: 3, name: "Impact Ventures" },
];

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

const companyTypes = [
  "Sole Proprietorship",
  "Partnership",
  "Non-Profits",
  "LLP",
  "Public Ltd",
  "Private Ltd"
];

const businessNatures = ["B2B", "B2C", "B2B2C"];

const investmentStages = [
  "Pre Seed",
  "Seed",
  "Pre Series A",
  "Series A",
  "Series B and above",
  "Pre-IPO",
  "IPO"
];

const futureActions = [
  "SHA to be signed",
  "Rejected",
  "To be revisited in future",
  "To review further"
];

export default function NewCompany() {
  const navigate = useNavigate();
  const { setTempCompanyData } = usePortfolio();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    companyName: "",
    companyType: "",
    email: "",
    sector: "",
    subsector: "",
    designation: "",
    businessNature: "",
    founder: "",
    screeningDate: "",
    investmentDate: "",
    fundId: "",
    investmentStrategy: "",
    city: "",
    description: "",
    investmentSize: "",
    investmentStage: "",
    futureAction: "",
    informationSource: "",
    gstNumber: "",
    shareholding: "",
    employeesFoundersMale: "0",
    employeesFoundersFemale: "0",
    employeesFoundersOthers: "0",
    employeesOtherMale: "0",
    employeesOtherFemale: "0",
    employeesOtherOthers: "0",
    workersDirectMale: "0",
    workersDirectFemale: "0",
    workersDirectOthers: "0",
    workersIndirectMale: "0",
    workersIndirectFemale: "0",
    workersIndirectOthers: "0"
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting company data:", formData);
    
    try {
      // Get current user's profile to determine tenant_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Store the form data temporarily in context for non-authenticated users
        setTempCompanyData(formData);
        navigate("/portfolio/pre-screening");
        return;
      }

      // Get user's profile to get tenant_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.tenant_id) {
        // Fallback to temporary storage if no tenant
        setTempCompanyData(formData);
        navigate("/portfolio/pre-screening");
        return;
      }

      // Save to database
      const companyData = {
        name: formData.companyName,
        industry: formData.sector,
        stage: formData.investmentStage,
        description: formData.description,
        website: formData.email, // Using email as website placeholder
        headquarters: formData.city,
        founded_year: formData.screeningDate ? new Date(formData.screeningDate).getFullYear() : null,
        employee_count: parseInt(formData.employeesFoundersMale) + parseInt(formData.employeesFoundersFemale) + parseInt(formData.employeesFoundersOthers) + parseInt(formData.employeesOtherMale) + parseInt(formData.employeesOtherFemale) + parseInt(formData.employeesOtherOthers),
        investment_amount: formData.investmentSize ? parseInt(formData.investmentSize.replace(/[^0-9]/g, '')) : null,
        equity_percentage: formData.shareholding ? parseFloat(formData.shareholding) : null,
        fund_id: formData.fundId || null,
        tenant_id: profile.tenant_id,
        created_by: user.id
      };

      const { data: company, error } = await supabase
        .from('portfolio_companies')
        .insert(companyData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Store company ID and navigate to pre-screening
      setTempCompanyData({ ...formData, companyId: company.id });
      navigate("/portfolio/pre-screening");
      
    } catch (error) {
      console.error('Error saving company:', error);
      // Fallback to temporary storage on error
      setTempCompanyData(formData);
      navigate("/portfolio/pre-screening");
    }
  };
  
  return (
    <div className="space-y-6">
      <PageNavigation />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Portfolio Company</h1>
          <p className="text-muted-foreground">Enter company details for ESG evaluation</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input 
                  id="companyName" 
                  name="companyName" 
                  value={formData.companyName} 
                  onChange={handleInputChange} 
                  placeholder="Enter company name" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyType">Company Type</Label>
                <Select 
                  value={formData.companyType} 
                  onValueChange={(value) => handleSelectChange("companyType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company type" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email"
                  value={formData.email} 
                  onChange={handleInputChange} 
                  placeholder="Enter email address" 
                  required 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sector">Sector</Label>
                  <Select 
                    value={formData.sector} 
                    onValueChange={(value) => handleSelectChange("sector", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map(sector => (
                        <SelectItem key={sector} value={sector}>
                          {sector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subsector">Subsector</Label>
                  <Input 
                    id="subsector" 
                    name="subsector" 
                    value={formData.subsector} 
                    onChange={handleInputChange} 
                    placeholder="Enter subsector" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input 
                  id="designation" 
                  name="designation" 
                  value={formData.designation} 
                  onChange={handleInputChange} 
                  placeholder="Enter designation" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessNature">Nature of Business</Label>
                <RadioGroup 
                  onValueChange={(value) => handleSelectChange("businessNature", value)} 
                  defaultValue={formData.businessNature}
                  className="flex space-x-4"
                >
                  {businessNatures.map(nature => (
                    <div key={nature} className="flex items-center space-x-2">
                      <RadioGroupItem value={nature} id={`nature-${nature}`} />
                      <Label htmlFor={`nature-${nature}`}>{nature}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="founder">Founder / CEO</Label>
                <Input 
                  id="founder" 
                  name="founder" 
                  value={formData.founder} 
                  onChange={handleInputChange} 
                  placeholder="Enter founder/CEO name" 
                  required 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="screeningDate">Date of Screening</Label>
                  <Input 
                    id="screeningDate" 
                    name="screeningDate" 
                    type="date"
                    value={formData.screeningDate} 
                    onChange={handleInputChange} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="investmentDate">Date of Investment</Label>
                  <Input 
                    id="investmentDate" 
                    name="investmentDate" 
                    type="date"
                    value={formData.investmentDate} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fundId">Fund</Label>
                <Select 
                  value={formData.fundId} 
                  onValueChange={(value) => handleSelectChange("fundId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fund" />
                  </SelectTrigger>
                  <SelectContent>
                    {funds.map(fund => (
                      <SelectItem key={fund.id} value={fund.id.toString()}>
                        {fund.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="investmentStrategy">Fund Investment Strategy</Label>
                <Input 
                  id="investmentStrategy" 
                  name="investmentStrategy" 
                  value={formData.investmentStrategy} 
                  onChange={handleInputChange} 
                  placeholder="Enter investment strategy" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  name="city" 
                  value={formData.city} 
                  onChange={handleInputChange} 
                  placeholder="Enter city" 
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Brief Description of Company Activities</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  placeholder="Describe company activities" 
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="investmentSize">Potential Investment Size (INR)</Label>
                <Input 
                  id="investmentSize" 
                  name="investmentSize" 
                  value={formData.investmentSize} 
                  onChange={handleInputChange} 
                  placeholder="Enter investment size" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="investmentStage">Stage of Investment</Label>
                <Select 
                  value={formData.investmentStage} 
                  onValueChange={(value) => handleSelectChange("investmentStage", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select investment stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {investmentStages.map(stage => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="futureAction">Future Action</Label>
                <Select 
                  value={formData.futureAction} 
                  onValueChange={(value) => handleSelectChange("futureAction", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select future action" />
                  </SelectTrigger>
                  <SelectContent>
                    {futureActions.map(action => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="informationSource">Source of Information</Label>
                <Input 
                  id="informationSource" 
                  name="informationSource" 
                  value={formData.informationSource} 
                  onChange={handleInputChange} 
                  placeholder="Enter information source" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input 
                  id="gstNumber" 
                  name="gstNumber" 
                  value={formData.gstNumber} 
                  onChange={handleInputChange} 
                  placeholder="Enter GST number" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shareholding">Fund Shareholding (%)</Label>
                <Input 
                  id="shareholding" 
                  name="shareholding" 
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.shareholding} 
                  onChange={handleInputChange} 
                  placeholder="Enter shareholding percentage" 
                />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-4">Total Number of Permanent Employees</h3>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="col-span-1"></div>
                <div className="text-center text-sm font-medium">Male</div>
                <div className="text-center text-sm font-medium">Female</div>
                <div className="text-center text-sm font-medium">Others</div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="flex items-center">Founders/Promoters</div>
                <div>
                  <Input 
                    id="employeesFoundersMale" 
                    name="employeesFoundersMale" 
                    type="number"
                    min="0"
                    value={formData.employeesFoundersMale} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div>
                  <Input 
                    id="employeesFoundersFemale" 
                    name="employeesFoundersFemale" 
                    type="number"
                    min="0"
                    value={formData.employeesFoundersFemale} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div>
                  <Input 
                    id="employeesFoundersOthers" 
                    name="employeesFoundersOthers" 
                    type="number"
                    min="0"
                    value={formData.employeesFoundersOthers} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="flex items-center">Other Employees</div>
                <div>
                  <Input 
                    id="employeesOtherMale" 
                    name="employeesOtherMale" 
                    type="number"
                    min="0"
                    value={formData.employeesOtherMale} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div>
                  <Input 
                    id="employeesOtherFemale" 
                    name="employeesOtherFemale" 
                    type="number"
                    min="0"
                    value={formData.employeesOtherFemale} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div>
                  <Input 
                    id="employeesOtherOthers" 
                    name="employeesOtherOthers" 
                    type="number"
                    min="0"
                    value={formData.employeesOtherOthers} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-4">Number of Workers</h3>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="col-span-1"></div>
                <div className="text-center text-sm font-medium">Male</div>
                <div className="text-center text-sm font-medium">Female</div>
                <div className="text-center text-sm font-medium">Others</div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="flex items-center">Direct contract / no. of workers</div>
                <div>
                  <Input 
                    id="workersDirectMale" 
                    name="workersDirectMale" 
                    type="number"
                    min="0"
                    value={formData.workersDirectMale} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div>
                  <Input 
                    id="workersDirectFemale" 
                    name="workersDirectFemale" 
                    type="number"
                    min="0"
                    value={formData.workersDirectFemale} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div>
                  <Input 
                    id="workersDirectOthers" 
                    name="workersDirectOthers" 
                    type="number"
                    min="0"
                    value={formData.workersDirectOthers} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="flex items-center">Indirectly through service providers</div>
                <div>
                  <Input 
                    id="workersIndirectMale" 
                    name="workersIndirectMale" 
                    type="number"
                    min="0"
                    value={formData.workersIndirectMale} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div>
                  <Input 
                    id="workersIndirectFemale" 
                    name="workersIndirectFemale" 
                    type="number"
                    min="0"
                    value={formData.workersIndirectFemale} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div>
                  <Input 
                    id="workersIndirectOthers" 
                    name="workersIndirectOthers" 
                    type="number"
                    min="0"
                    value={formData.workersIndirectOthers} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end mt-6 space-x-2">
          <Button variant="outline" type="button" onClick={() => navigate("/portfolio")}>
            Cancel
          </Button>
          <Button type="submit" className="gap-2">
            <span>Next: Pre-Screening</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

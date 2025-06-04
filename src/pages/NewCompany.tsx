
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
import { ChevronRight } from "lucide-react";

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
  const [formData, setFormData] = useState({
    companyName: "",
    companyType: "",
    email: "",
    sector: "",
    subsector: "",
    designation: "",
    natureofBusiness: "",
    founder: "",
    dateofScreening: "",
    investmentDate: "",
    fundId: "",
    fundInvestmentS: "",
    location: "",
    briefdescription: "",
    potentialInvestmentSize: "",
    opportunityStatus: "",
    futureAction: "",
    sourceofInformation: "",
    gst: "",
    fundShareholding: "",
    foundersPromotorsMale: "0",
    foundersPromotorsFemale: "0",
    foundersPromotorsOther: "0",
    otherEmpMale: "0",
    otherEmpFemale: "0",
    otherEmpOther: "0",
    directContractMale: "0",
    directContractFemale: "0",
    directContractOther: "0",
    indirectlyMale: "0",
    indirectlyFemale: "0",
    indirectlyOther: "0"
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}` + `/investor/companyInfo/update`, {
        method: "POST",
        body: JSON.stringify({ ...formData, companytype: 'Portfolio Company' }),
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
        // Navigate to pre-screening page
        if(jsondata['companyInfoId']){
          navigate("/portfolio/pre-screening?companyInfoId="+jsondata['companyInfoId']);
        }
        else{
          //show toast error
        }
        
      }
    } catch (error) {
      console.error("Api call:", error);
      // toast.error("API Call failed. Please try again.");
    } finally {
      // setIsLoading(false);
    }

  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Company</h1>
          <p className="text-muted-foreground">General Information</p>
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
                <Label htmlFor="natureofBusiness">Nature of Business</Label>
                <RadioGroup
                  onValueChange={(value) => handleSelectChange("natureofBusiness", value)}
                  defaultValue={formData.natureofBusiness}
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
                  <Label htmlFor="dateofScreening">Date of Screening</Label>
                  <Input
                    id="dateofScreening"
                    name="dateofScreening"
                    type="date"
                    value={formData.dateofScreening}
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
                <Label htmlFor="fundInvestmentS">Fund Investment Strategy</Label>
                <Input
                  id="fundInvestmentS"
                  name="fundInvestmentS"
                  value={formData.fundInvestmentS}
                  onChange={handleInputChange}
                  placeholder="Enter investment strategy"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">City</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Enter city"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="briefdescription">Brief Description of Company Activities</Label>
                <Textarea
                  id="briefdescription"
                  name="briefdescription"
                  value={formData.briefdescription}
                  onChange={handleInputChange}
                  placeholder="Describe company activities"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="potentialInvestmentSize">Potential Investment Size (INR)</Label>
                <Input
                  id="potentialInvestmentSize"
                  name="potentialInvestmentSize"
                  value={formData.potentialInvestmentSize}
                  onChange={handleInputChange}
                  placeholder="Enter investment size"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="opportunityStatus">Stage of Investment</Label>
                <Select
                  value={formData.opportunityStatus}
                  onValueChange={(value) => handleSelectChange("opportunityStatus", value)}
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
                <Label htmlFor="sourceofInformation">Source of Information</Label>
                <Input
                  id="sourceofInformation"
                  name="sourceofInformation"
                  value={formData.sourceofInformation}
                  onChange={handleInputChange}
                  placeholder="Enter information source"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gst">GST Number</Label>
                <Input
                  id="gst"
                  name="gst"
                  value={formData.gst}
                  onChange={handleInputChange}
                  placeholder="Enter GST number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fundShareholding">Fund Shareholding (%)</Label>
                <Input
                  id="fundShareholding"
                  name="fundShareholding"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.fundShareholding}
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
                    id="foundersPromotorsMale"
                    name="foundersPromotorsMale"
                    type="number"
                    min="0"
                    value={formData.foundersPromotorsMale}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Input
                    id="foundersPromotorsFemale"
                    name="foundersPromotorsFemale"
                    type="number"
                    min="0"
                    value={formData.foundersPromotorsFemale}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Input
                    id="foundersPromotorsOther"
                    name="foundersPromotorsOther"
                    type="number"
                    min="0"
                    value={formData.foundersPromotorsOther}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="flex items-center">Other Employees</div>
                <div>
                  <Input
                    id="otherEmpMale"
                    name="otherEmpMale"
                    type="number"
                    min="0"
                    value={formData.otherEmpMale}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Input
                    id="otherEmpFemale"
                    name="otherEmpFemale"
                    type="number"
                    min="0"
                    value={formData.otherEmpFemale}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Input
                    id="otherEmpOther"
                    name="otherEmpOther"
                    type="number"
                    min="0"
                    value={formData.otherEmpOther}
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
                    id="directContractMale"
                    name="directContractMale"
                    type="number"
                    min="0"
                    value={formData.directContractMale}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Input
                    id="directContractFemale"
                    name="directContractFemale"
                    type="number"
                    min="0"
                    value={formData.directContractFemale}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Input
                    id="directContractOther"
                    name="directContractOther"
                    type="number"
                    min="0"
                    value={formData.directContractOther}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="flex items-center">Indirectly through service providers</div>
                <div>
                  <Input
                    id="indirectlyMale"
                    name="indirectlyMale"
                    type="number"
                    min="0"
                    value={formData.indirectlyMale}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Input
                    id="indirectlyFemale"
                    name="indirectlyFemale"
                    type="number"
                    min="0"
                    value={formData.indirectlyFemale}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Input
                    id="indirectlyOther"
                    name="indirectlyOther"
                    type="number"
                    min="0"
                    value={formData.indirectlyOther}
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

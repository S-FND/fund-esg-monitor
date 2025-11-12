import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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

const natureOfBusinessOptions = [
  { value: "B2B", label: "B2B" },
  { value: "B2C", label: "B2C" },
  { value: "B2B2C", label: "B2B2C" },
  { value: "D2C", label: "D2C" },
  { value: "B2G", label: "B2G" }
];

const stageOfInvestmentOptions = [
  { value: "Seed", label: "Seed" },
  { value: "Angel", label: "Angel" },
  { value: "Series A", label: "Series A" },
  { value: "Series B", label: "Series B" },
  { value: "Series C", label: "Series C" },
  { value: "Series D", label: "Series D" },
  { value: "Series E", label: "Series E" }
];

const futureActionOptions = [
  { value: "SHA to be signed", label: "SHA to be signed" },
  { value: "Rejected", label: "Rejected" },
  { value: "To be revisited in future", label: "To be revisited in future" },
  { value: "To review further", label: "To review further" }
];

export default function NewCompany() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: "",
    companytype: "",
    email: "",
    sector: "",
    location: "",
    gst: "",
    fundName: "",
    founder: "",
    investmentDate: "",
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
    indirectlyOther: "0",
    futureAction: "",
    fundInvestmentS: "",
    potentialInvestmentSize: "",
    natureofBusiness: "",
    designation: "",
    dateofInvestment: "",
    briefdescription: "",
    dateofScreening: "",
    opportunityStatus: "",
    sourceofInformation: "",
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
        body: JSON.stringify({ ...formData }),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        return;
      }
      else {
        const jsondata = await res.json();
        console.log('jsondata', jsondata)
        if(jsondata['companyInfoId']){
          navigate("/portfolio/pre-screening?companyInfoId="+jsondata['companyInfoId']);
        }
        else{
          //show toast error
        }
      }
    } catch (error) {
      console.error("Api call:", error);
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
                <Label htmlFor="companytype">Company Type</Label>
                <Select
                  value={formData.companytype}
                  onValueChange={(value) => handleSelectChange("companytype", value)}
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
                <Select
                  value={formData.natureofBusiness}
                  onValueChange={(value) => handleSelectChange("natureofBusiness", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select nature of business" />
                  </SelectTrigger>
                  <SelectContent>
                    {natureOfBusinessOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <Label htmlFor="dateofInvestment">Date of Investment</Label>
                  <Input
                    id="dateofInvestment"
                    name="dateofInvestment"
                    type="date"
                    value={formData.dateofInvestment}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fundName">Fund Name</Label>
                <Input
                  id="fundName"
                  name="fundName"
                  value={formData.fundName}
                  onChange={handleInputChange}
                  placeholder="Enter fund name"
                />
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
                <Label htmlFor="location">Address</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Enter Address"
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
                    {stageOfInvestmentOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
                    {futureActionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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

            {/* Employees Section - Matching Edit Form Layout */}
            <div className="border-t pt-4 mt-6">
              <div className="font-semibold mb-3">Number of Employees</div>

              <table className="w-full border text-center">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-2 border">Permanent Employees</th>
                    <th className="p-2 border">Other Employees</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {/* Founders Promoters Table */}
                    <td className="p-0 border">
                      <table className="w-full">
                        <tbody>
                          {[
                            { label: "Male", key: "foundersPromotorsMale" },
                            { label: "Female", key: "foundersPromotorsFemale" },
                            { label: "Other", key: "foundersPromotorsOther" },
                          ].map((item) => (
                            <tr key={item.key}>
                              <td className="p-2 border">{item.label}</td>
                              <td className="p-2 border">
                                <Input
                                  type="number"
                                  name={item.key}
                                  value={formData[item.key] || ""}
                                  onChange={handleInputChange}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>

                    {/* Other Employees */}
                    <td className="p-0 border">
                      <table className="w-full">
                        <tbody>
                          {[
                            { label: "Male", key: "otherEmpMale" },
                            { label: "Female", key: "otherEmpFemale" },
                            { label: "Other", key: "otherEmpOther" },
                          ].map((item) => (
                            <tr key={item.key}>
                              <td className="p-2 border">{item.label}</td>
                              <td className="p-2 border">
                                <Input
                                  type="number"
                                  name={item.key}
                                  value={formData[item.key] || ""}
                                  onChange={handleInputChange}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Separator />

            {/* Workers Section - Matching Edit Form Layout */}
            <div className="border-t pt-4 mt-6">
              <div className="font-semibold mb-3">Number of Workers</div>

              <table className="w-full border text-center">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-2 border">Direct Contract</th>
                    <th className="p-2 border">Indirectly through Service Providers</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {/* Direct Workers */}
                    <td className="p-0 border">
                      <table className="w-full">
                        <tbody>
                          {[
                            { label: "Male", key: "directContractMale" },
                            { label: "Female", key: "directContractFemale" },
                            { label: "Other", key: "directContractOther" },
                          ].map((item) => (
                            <tr key={item.key}>
                              <td className="p-2 border">{item.label}</td>
                              <td className="p-2 border">
                                <Input
                                  type="number"
                                  name={item.key}
                                  value={formData[item.key] || ""}
                                  onChange={handleInputChange}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>

                    {/* Indirect Workers */}
                    <td className="p-0 border">
                      <table className="w-full">
                        <tbody>
                          {[
                            { label: "Male", key: "indirectlyMale" },
                            { label: "Female", key: "indirectlyFemale" },
                            { label: "Other", key: "indirectlyOther" },
                          ].map((item) => (
                            <tr key={item.key}>
                              <td className="p-2 border">{item.label}</td>
                              <td className="p-2 border">
                                <Input
                                  type="number"
                                  name={item.key}
                                  value={formData[item.key] || ""}
                                  onChange={handleInputChange}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
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
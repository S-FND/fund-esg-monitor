
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PreScreeningSection } from "./sections/PreScreeningSection";
import { CategorizationSection } from "./sections/CategorizationSection";
import { toast } from "@/hooks/use-toast";
// interface Company {
//   _id: number;
//   name: string;
//   type: string;
//   sector: string;
//   fundId: number;
//   fundName: string;
//   ceo: string;
//   investmentDate: string;
//   stage: string;
//   shareholding: number;
//   employees: {
//     founders: { male: number; female: number; others: number; };
//     others: { male: number; female: number; others: number; };
//   };
//   workers: {
//     direct: { male: number; female: number; others: number; };
//     indirect: { male: number; female: number; others: number; };
//   };
//   esgCategory: string;
//   esgScore: number;
// }
interface Company {
  _id: string;
  companyName: string;
  companytype: string;
  email: string;
  sector: string;
  location: string;
  gst: string;
  fundId: number;
  fundName: string;
  founder: string;
  investmentDate: string;
  fundShareholding: number;
  employees: {
    founders: { male: number; female: number; others: number; };
    others: { male: number; female: number; others: number; };
  };
  workers: {
    direct: { male: number; female: number; others: number; };
    indirect: { male: number; female: number; others: number; };
  };
  esgCategory: string;
  esgScore: number;
  directContractFemale: string
  directContractMale: string
  directContractOther: string
  foundersPromotorsFemale: number;
  foundersPromotorsMale: number;
  foundersPromotorsOther: number;
  otherEmpFemale: number;
  otherEmpMale: number;
  otherEmpOther: number;
  indirectlyFemale: number;
  indirectlyMale: number;
  indirectlyOther: string
  futureAction: string
  fundInvestmentS: string
  potentialInvestmentSize: string
  natureofBusiness: string
  natureofBudateofInvestmentsiness: string
  designation: string
  dateofInvestment: string
  briefdescription: string
  dateofScreening: string
  opportunityStatus: string
  sourceofInformation: string
}

export default function EditCompanyForm({ company }: { company: Company }) {
  const navigate = useNavigate();
  const [editData, setEditData] = useState({ ...company });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };


  const handleNestedChange = (
    section: "employees" | "workers",
    group: string,
    field: string,
    value: string
  ) => {
    setEditData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [group]: {
          ...prev[section][group],
          [field]: value,
        },
      },
    }));
  };

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

  // const handleSave = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   // Here, you would update the backend!
  //   navigate("/portfolio");
  // };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      companyInfoId: editData._id,
      companyName: editData.companyName,
      companytype: editData.companytype,
      email: editData.email,
      sector: editData.sector,
      location: editData.location,
      gst: editData.gst,
      fundName: editData.fundName,
      founder: editData.founder,
      investmentDate: editData.investmentDate,
      fundShareholding: editData.fundShareholding,
      esgCategory: editData.esgCategory,
      esgScore: editData.esgScore,
      foundersPromotorsMale: editData.foundersPromotorsMale,
      foundersPromotorsFemale: editData.foundersPromotorsFemale,
      foundersPromotorsOther: editData.foundersPromotorsOther,
      otherEmpMale: editData.otherEmpMale,
      otherEmpFemale: editData.otherEmpFemale,
      otherEmpOther: editData.otherEmpOther,
      directContractMale: editData.directContractMale,
      directContractFemale: editData.directContractFemale,
      directContractOther: editData.directContractOther,
      indirectlyMale: editData.indirectlyMale,
      indirectlyFemale: editData.indirectlyFemale,
      indirectlyOther: editData.indirectlyOther,
      futureAction: editData.futureAction,
      fundInvestmentS: editData.fundInvestmentS,
      potentialInvestmentSize: editData.potentialInvestmentSize,
      natureofBusiness: editData.natureofBusiness,
      natureofBudateofInvestmentsiness: editData.natureofBudateofInvestmentsiness,
      designation: editData.designation,
      dateofInvestment: editData.dateofInvestment,
      briefdescription: editData.briefdescription,
      dateofScreening: editData.dateofScreening,
      opportunityStatus: editData.opportunityStatus,
      sourceofInformation: editData.sourceofInformation,
    };

    console.log("Payload sent:", payload);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/investor/companyInfo/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      console.log("API Response:", data);

      if (!res.ok) {
        throw new Error(data?.message || "Update failed");
      }

      toast({
        title: "✅ Company Updated Successfully",
        description: "Your changes have been saved.",
      });
      // navigate("/portfolio");

    } catch (error) {
      console.error("❌ API Error:", error);
    }
  };
  const handleCancel = () => {
    navigate("/portfolio");
  };

  return (
    <div className="max-w-5xl mx-auto mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Portfolio Company: {editData.companyName}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="prescreening">Pre-Screening</TabsTrigger>
              <TabsTrigger value="categorization">Categorization</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-6">
              <form className="space-y-4" onSubmit={handleSave}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Company Name</Label>
                    <Input
                      name="companyName"
                      value={editData?.companyName}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label>Company Type</Label>
                    <Input
                      name="companytype"
                      value={editData?.companytype}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      name="email"
                      value={editData?.email}
                      onChange={handleChange}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Sector</Label>
                    <Input
                      name="sector"
                      value={editData?.sector}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Designation</Label>
                    <Input
                      name="designation"
                      value={editData?.designation}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label>Nature of Business</Label>
                    <select
                      name="natureofBusiness"
                      value={editData?.natureofBusiness}
                      onChange={handleChange}
                      className="border rounded-md w-full h-10 px-2"
                    >
                      <option value="">Select</option>
                      {natureOfBusinessOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Founder / CEO</Label>
                    <Input
                      name="founder"
                      value={editData?.founder}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label>Date of Screening</Label>
                    <Input
                      type="date"
                      name="dateofScreening"
                      value={editData?.dateofScreening ? editData.dateofScreening.split("T")[0] : ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date of Investment</Label>
                    <Input
                      type="date"
                      name="dateofInvestment"
                      value={editData?.dateofInvestment ? editData.dateofInvestment.split("T")[0] : ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label>Fund Investment Strategy</Label>
                    <Input
                      name="fundInvestmentS"
                      value={editData?.fundInvestmentS}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Address</Label>
                    <Input
                      name="location"
                      value={editData?.location}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label>Brief description of company activities</Label>
                    <Input
                      name="briefdescription"
                      value={editData?.briefdescription}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Potential Investment Size (INR)</Label>
                    <Input
                      name="potentialInvestmentSize"
                      value={editData?.potentialInvestmentSize}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label>Stage of Investment</Label>
                    <select
                      name="opportunityStatus"
                      value={editData?.opportunityStatus}
                      onChange={handleChange}
                      className="border rounded-md w-full h-10 px-2"
                    >
                      <option value="">Select</option>
                      {stageOfInvestmentOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Future Action</Label>
                    <select
                      name="futureAction"
                      value={editData?.futureAction}
                      onChange={handleChange}
                      className="border rounded-md w-full h-10 px-2"
                    >
                      <option value="">Select</option>
                      {futureActionOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Source of Information</Label>
                    <Input
                      name="sourceofInformation"
                      value={editData?.sourceofInformation}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>GST Number</Label>
                    <Input
                      name="gst"
                      value={editData?.gst}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label>Fund Shareholding (%)</Label>
                    <Input
                      name="fundShareholding"
                      value={editData?.fundShareholding}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* <div>
              <Label>Fund Name</Label>
              <Input
                name="fundName"
                value={editData?.fundName}
                onChange={handleChange}
              />
            </div>
                <div>
              <Label>ESG Category</Label>
              <Input
                name="esgCategory"
                value={editData?.esgCategory}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>ESG Score</Label>
              <Input
                name="esgScore"
                type="number"
                value={editData?.esgScore}
                onChange={handleChange}
              />
            </div> */}

                {/* Employees Section */}
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
                                      value={editData[item.key] || ""}
                                      onChange={handleChange}
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
                                      value={editData[item.key] || ""}
                                      onChange={handleChange}
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

                {/* Workers Section */}
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
                                      value={editData[item.key] || ""}
                                      onChange={handleChange}
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
                                      value={editData[item.key] || ""}
                                      onChange={handleChange}
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


                <div className="flex gap-2 justify-end mt-6">
                  <Button type="submit" onClick={handleSave} variant="default">
                    Save
                  </Button>
                  <Button type="button" onClick={handleCancel} variant="outline">
                    Cancel
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="prescreening" className="mt-6">
              <PreScreeningSection companyId={editData._id} />
            </TabsContent>

            <TabsContent value="categorization" className="mt-6">
              <CategorizationSection companyId={editData._id} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

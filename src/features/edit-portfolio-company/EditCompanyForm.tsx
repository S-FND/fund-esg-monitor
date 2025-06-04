
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PreScreeningSection } from "./sections/PreScreeningSection";
import { CategorizationSection } from "./sections/CategorizationSection";

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
  companyType: string;
  sector: string;
  fundId: number;
  fundName: string;
  founder: string;
  investmentDate: string;
  stage: string;
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
}

export default function EditCompanyForm({ company }: { company: Company }) {
  const navigate = useNavigate();
  const [editData, setEditData] = useState({ ...company });
  console.log('EditCompanyForm',company)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Here, you would update the backend!
    navigate("/portfolio");
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
            <div>
              <Label>Company Name</Label>
              <Input
                name="name"
                value={editData?.companyName}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>Type</Label>
              <Input
                name="type"
                value={editData?.companyType}
                onChange={handleChange}
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
            <div>
              <Label>Fund Name</Label>
              <Input
                name="fundName"
                value={editData?.fundName}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>CEO</Label>
              <Input
                name="ceo"
                value={editData?.founder}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>Investment Date</Label>
              <Input
                name="investmentDate"
                type="date"
                value={editData?.investmentDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>Stage</Label>
              <Input
                name="stage"
                value={editData?.stage}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>Shareholding (%)</Label>
              <Input
                name="shareholding"
                type="number"
                value={editData?.fundShareholding}
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
            </div>

            {/* Employees */}
            <div className="border-t pt-4 mt-6">
              <div className="font-semibold mb-2">Employees - Founders</div>
              <div className="flex gap-2 mb-2">
                <Input
                  name="foundersPromotorsMale"
                  type="number"
                  value={editData?.foundersPromotorsMale}
                  onChange={handleChange}
                  placeholder="Male"
                />
                <Input
                  name="foundersPromotorsFemale"
                  type="number"
                  value={editData?.foundersPromotorsFemale}
                  onChange={handleChange}
                  placeholder="Female"
                />
                <Input
                  name="foundersPromotorsOther"
                  type="number"
                  value={editData?.foundersPromotorsOther}
                  onChange={handleChange}
                  placeholder="Others"
                />
              </div>

              <div className="font-semibold mb-2">Employees - Other</div>
              <div className="flex gap-2 mb-2">
                <Input
                  name="otherEmpMale"
                  type="number"
                  value={editData?.otherEmpMale}
                  onChange={handleChange}
                  placeholder="Male"
                />
                <Input
                  name="otherEmpFemale"
                  type="number"
                  value={editData?.otherEmpFemale}
                  onChange={handleChange}
                  placeholder="Female"
                />
                <Input
                  name="otherEmpOther"
                  type="number"
                  value={editData?.otherEmpOther}
                  onChange={handleChange}
                  placeholder="Others"
                />
              </div>
            </div>

            {/* Workers */}
            <div className="border-t pt-4 mt-6">
              <div className="font-semibold mb-2">Workers - Direct</div>
              <div className="flex gap-2 mb-2">
                <Input
                  name="workers_direct_male"
                  type="number"
                  value={editData?.directContractMale}
                  onChange={handleChange}
                  placeholder="Male"
                />
                <Input
                  name="workers_direct_female"
                  type="number"
                  value={editData?.directContractFemale}
                  onChange={handleChange}
                  placeholder="Female"
                />
                <Input
                  name="workers_direct_others"
                  type="number"
                  value={editData?.directContractOther}
                  onChange={handleChange}
                  placeholder="Others"
                />
              </div>

              <div className="font-semibold mb-2">Workers - Indirect</div>
              <div className="flex gap-2 mb-2">
                <Input
                  name="workers_indirect_male"
                  type="number"
                  value={editData?.indirectlyMale}
                  onChange={handleChange}
                  placeholder="Male"
                />
                <Input
                  name="workers_indirect_female"
                  type="number"
                  value={editData?.indirectlyFemale}
                  onChange={handleChange}
                  placeholder="Female"
                />
                <Input
                  name="workers_indirect_others"
                  type="number"
                  value={editData?.indirectlyOther}
                  onChange={handleChange}
                  placeholder="Others"
                />
              </div>
            </div>

                <div className="flex gap-2 justify-end mt-6">
                  <Button type="submit" variant="default">
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

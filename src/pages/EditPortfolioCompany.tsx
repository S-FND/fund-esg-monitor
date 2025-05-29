
import { useParams } from "react-router-dom";
// import { portfolioCompanies } from "@/features/edit-portfolio-company/portfolioCompanies";
// import CompanyNotFound from "@/features/edit-portfolio-company/CompanyNotFound";
// import EditCompanyForm from "@/features/edit-portfolio-company/EditCompanyForm";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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


export default function EditPortfolioCompany() {
  const { id } = useParams();

  console.log('id', id)

  // if (!company) {
  //   return <CompanyNotFound />;
  // }
  const navigate = useNavigate();
  const [editData, setEditData] = useState<Company>();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const { name, value } = e.target;
    console.log(name, value)
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    editData['companyInfoId'] = editData['_id']
    delete editData['_id'];
    console.log('editform', editData)
    // Here, you would update the backend!
    try {
      const res = await fetch(`http://localhost:3002` + `/investor/companyInfo/update`, {
        method: "POST",
        body: JSON.stringify({ ...editData }),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        // toast.error("Invalid credentials");
        // setIsLoading(false);
        return;
      }
      else {
        // const jsondata: Company = await res.json();
        navigate("/portfolio");

      }
    } catch (error) {
      console.error("Api call:", error);
      // toast.error("API Call failed. Please try again.");
    } finally {
      // setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/portfolio");
  };


  const getCompanyList = async (id) => {

    try {
      const res = await fetch(`http://localhost:3002` + `/investor/companyInfo/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        // toast.error("Invalid credentials");
        // setIsLoading(false);
        return;
      }
      else {
        const jsondata: Company = await res.json();
        console.log('jsondata', jsondata)
        // company=jsondata;
        setEditData(jsondata)
        // return <EditCompanyForm company={jsondata} />;
      }
    } catch (error) {
      console.error("Api call:", error);
      // toast.error("API Call failed. Please try again.");
    } finally {
      // setIsLoading(false);
    }
  }

  useEffect(() => {
    getCompanyList(id)
  }, [id])

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Portfolio Company: {editData?.companyName}</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}


import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Company {
  id: number;
  name: string;
  type: string;
  sector: string;
  fundId: number;
  fundName: string;
  ceo: string;
  investmentDate: string;
  stage: string;
  shareholding: number;
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
    <div className="max-w-3xl mx-auto mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Portfolio Company: {editData.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSave}>
            <div>
              <Label>Company Name</Label>
              <Input
                name="name"
                value={editData?.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>Type</Label>
              <Input
                name="type"
                value={editData?.type}
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
                value={editData?.ceo}
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
                value={editData?.shareholding}
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
                  name="employees_founders_male"
                  type="number"
                  value={editData?.employees?.founders?.male}
                  onChange={e =>
                    handleNestedChange("employees", "founders", "male", e.target.value)
                  }
                  placeholder="Male"
                />
                <Input
                  name="employees_founders_female"
                  type="number"
                  value={editData?.employees?.founders?.female}
                  onChange={e =>
                    handleNestedChange("employees", "founders", "female", e.target.value)
                  }
                  placeholder="Female"
                />
                <Input
                  name="employees_founders_others"
                  type="number"
                  value={editData?.employees?.founders?.others}
                  onChange={e =>
                    handleNestedChange("employees", "founders", "others", e.target.value)
                  }
                  placeholder="Others"
                />
              </div>

              <div className="font-semibold mb-2">Employees - Other</div>
              <div className="flex gap-2 mb-2">
                <Input
                  name="employees_others_male"
                  type="number"
                  value={editData?.employees?.others?.male}
                  onChange={e =>
                    handleNestedChange("employees", "others", "male", e.target.value)
                  }
                  placeholder="Male"
                />
                <Input
                  name="employees_others_female"
                  type="number"
                  value={editData?.employees?.others?.female}
                  onChange={e =>
                    handleNestedChange("employees", "others", "female", e.target.value)
                  }
                  placeholder="Female"
                />
                <Input
                  name="employees_others_others"
                  type="number"
                  value={editData?.employees?.others?.others}
                  onChange={e =>
                    handleNestedChange("employees", "others", "others", e.target.value)
                  }
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
                  value={editData?.workers?.direct?.male}
                  onChange={e =>
                    handleNestedChange("workers", "direct", "male", e.target.value)
                  }
                  placeholder="Male"
                />
                <Input
                  name="workers_direct_female"
                  type="number"
                  value={editData?.workers?.direct?.female}
                  onChange={e =>
                    handleNestedChange("workers", "direct", "female", e.target.value)
                  }
                  placeholder="Female"
                />
                <Input
                  name="workers_direct_others"
                  type="number"
                  value={editData?.workers?.direct?.others}
                  onChange={e =>
                    handleNestedChange("workers", "direct", "others", e.target.value)
                  }
                  placeholder="Others"
                />
              </div>

              <div className="font-semibold mb-2">Workers - Indirect</div>
              <div className="flex gap-2 mb-2">
                <Input
                  name="workers_indirect_male"
                  type="number"
                  value={editData?.workers?.indirect?.male}
                  onChange={e =>
                    handleNestedChange("workers", "indirect", "male", e.target.value)
                  }
                  placeholder="Male"
                />
                <Input
                  name="workers_indirect_female"
                  type="number"
                  value={editData?.workers?.indirect?.female}
                  onChange={e =>
                    handleNestedChange("workers", "indirect", "female", e.target.value)
                  }
                  placeholder="Female"
                />
                <Input
                  name="workers_indirect_others"
                  type="number"
                  value={editData?.workers?.indirect?.others}
                  onChange={e =>
                    handleNestedChange("workers", "indirect", "others", e.target.value)
                  }
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


import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Dummy data (should be fetched from backend in a real app)
const portfolioCompanies = [
  {
    id: 1,
    name: "EcoSolutions Inc.",
    type: "Private Ltd",
    sector: "ClimateTech",
    fundId: 1,
    fundName: "Green Tech Fund I",
    ceo: "Sarah Johnson",
    investmentDate: "2023-05-15",
    stage: "Series A",
    shareholding: 12.5,
    employees: {
      founders: { male: 1, female: 1, others: 0 },
      others: { male: 18, female: 12, others: 1 }
    },
    workers: {
      direct: { male: 25, female: 20, others: 0 },
      indirect: { male: 10, female: 8, others: 0 }
    },
    esgCategory: "B",
    esgScore: 85
  },
  {
    id: 2,
    name: "GreenHarvest",
    type: "Private Ltd",
    sector: "AgriTech",
    fundId: 2,
    fundName: "Sustainable Growth Fund",
    ceo: "Michael Lee",
    investmentDate: "2022-11-03",
    stage: "Seed",
    shareholding: 15.0,
    employees: {
      founders: { male: 2, female: 0, others: 0 },
      others: { male: 8, female: 7, others: 0 }
    },
    workers: {
      direct: { male: 45, female: 30, others: 0 },
      indirect: { male: 20, female: 25, others: 0 }
    },
    esgCategory: "B",
    esgScore: 78
  },
  {
    id: 3,
    name: "MediTech Innovations",
    type: "Private Ltd",
    sector: "HealthTech",
    fundId: 2,
    fundName: "Sustainable Growth Fund",
    ceo: "Lisa Wang",
    investmentDate: "2023-03-22",
    stage: "Series A",
    shareholding: 10.0,
    employees: {
      founders: { male: 1, female: 2, others: 0 },
      others: { male: 25, female: 30, others: 2 }
    },
    workers: {
      direct: { male: 15, female: 25, others: 0 },
      indirect: { male: 5, female: 10, others: 0 }
    },
    esgCategory: "A",
    esgScore: 92
  },
  {
    id: 4,
    name: "EduForward",
    type: "Private Ltd",
    sector: "EdTech",
    fundId: 3,
    fundName: "Impact Ventures",
    ceo: "Raj Patel",
    investmentDate: "2022-08-10",
    stage: "Pre Series A",
    shareholding: 18.0,
    employees: {
      founders: { male: 1, female: 1, others: 0 },
      others: { male: 12, female: 15, others: 0 }
    },
    workers: {
      direct: { male: 8, female: 12, others: 0 },
      indirect: { male: 4, female: 6, others: 0 }
    },
    esgCategory: "B",
    esgScore: 80
  },
  {
    id: 5,
    name: "FinSecure",
    type: "Private Ltd",
    sector: "FinTech",
    fundId: 3,
    fundName: "Impact Ventures",
    ceo: "David Chen",
    investmentDate: "2023-01-14",
    stage: "Seed",
    shareholding: 20.0,
    employees: {
      founders: { male: 2, female: 0, others: 0 },
      others: { male: 10, female: 8, others: 0 }
    },
    workers: {
      direct: { male: 5, female: 4, others: 0 },
      indirect: { male: 2, female: 3, others: 0 }
    },
    esgCategory: "C",
    esgScore: 75
  }
];

export default function EditPortfolioCompany() {
  const navigate = useNavigate();
  const { id } = useParams();
  const company = portfolioCompanies.find(
    (company) => company.id.toString() === id
  );

  // Fallback if not found
  if (!company) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-2">Company Not Found</h2>
        <Button variant="outline" onClick={() => navigate("/portfolio")}>
          Back to Portfolio
        </Button>
      </div>
    );
  }

  // Setup state for editing
  const [editData, setEditData] = useState({ ...company });

  // Handle change for basic fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle change for employees and workers (nested fields)
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
    // Here, you would update in the backend!
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
                value={editData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>Type</Label>
              <Input
                name="type"
                value={editData.type}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>Sector</Label>
              <Input
                name="sector"
                value={editData.sector}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>Fund Name</Label>
              <Input
                name="fundName"
                value={editData.fundName}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>CEO</Label>
              <Input
                name="ceo"
                value={editData.ceo}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>Investment Date</Label>
              <Input
                name="investmentDate"
                type="date"
                value={editData.investmentDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>Stage</Label>
              <Input
                name="stage"
                value={editData.stage}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>Shareholding (%)</Label>
              <Input
                name="shareholding"
                type="number"
                value={editData.shareholding}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>ESG Category</Label>
              <Input
                name="esgCategory"
                value={editData.esgCategory}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>ESG Score</Label>
              <Input
                name="esgScore"
                type="number"
                value={editData.esgScore}
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
                  value={editData.employees.founders.male}
                  onChange={e =>
                    handleNestedChange("employees", "founders", "male", e.target.value)
                  }
                  placeholder="Male"
                />
                <Input
                  name="employees_founders_female"
                  type="number"
                  value={editData.employees.founders.female}
                  onChange={e =>
                    handleNestedChange("employees", "founders", "female", e.target.value)
                  }
                  placeholder="Female"
                />
                <Input
                  name="employees_founders_others"
                  type="number"
                  value={editData.employees.founders.others}
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
                  value={editData.employees.others.male}
                  onChange={e =>
                    handleNestedChange("employees", "others", "male", e.target.value)
                  }
                  placeholder="Male"
                />
                <Input
                  name="employees_others_female"
                  type="number"
                  value={editData.employees.others.female}
                  onChange={e =>
                    handleNestedChange("employees", "others", "female", e.target.value)
                  }
                  placeholder="Female"
                />
                <Input
                  name="employees_others_others"
                  type="number"
                  value={editData.employees.others.others}
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
                  value={editData.workers.direct.male}
                  onChange={e =>
                    handleNestedChange("workers", "direct", "male", e.target.value)
                  }
                  placeholder="Male"
                />
                <Input
                  name="workers_direct_female"
                  type="number"
                  value={editData.workers.direct.female}
                  onChange={e =>
                    handleNestedChange("workers", "direct", "female", e.target.value)
                  }
                  placeholder="Female"
                />
                <Input
                  name="workers_direct_others"
                  type="number"
                  value={editData.workers.direct.others}
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
                  value={editData.workers.indirect.male}
                  onChange={e =>
                    handleNestedChange("workers", "indirect", "male", e.target.value)
                  }
                  placeholder="Male"
                />
                <Input
                  name="workers_indirect_female"
                  type="number"
                  value={editData.workers.indirect.female}
                  onChange={e =>
                    handleNestedChange("workers", "indirect", "female", e.target.value)
                  }
                  placeholder="Female"
                />
                <Input
                  name="workers_indirect_others"
                  type="number"
                  value={editData.workers.indirect.others}
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

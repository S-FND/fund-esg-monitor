
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { funds as dummyFunds } from "./fundsData";

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

export default function EditFund() {
  const navigate = useNavigate();
  const { id } = useParams();
  // const fund = dummyFunds.find(f => f.id === Number(id));

  const [fund,setFund]=useState([])
  

  // If fund not found (bad URL), return to list
  if (!fund) {
    navigate("/funds");
    return null;
  }

  const [formData, setFormData] = useState({
    name: fund['name'],
    size: fund['size'],
    currency: fund['currency'],
    focus: fund['focus'],
    stage: fund['stage'],
    inclusionTerms: fund['inclusionTerms'],
    exclusionTerms: fund['exclusionTerms'],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (
    field: "currency" | "stage",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Would save changes here; currently dummy data only
    navigate("/funds");
  };

  const getFundDetail= async()=>{
    try {
      const res = await fetch(`http://localhost:3002` + `/investor/fund/${id}`, {
        method: "GET",
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
        setFormData(jsondata['data'][0])
      }
    } catch (error) {
      console.error("Api call:", error);
      // toast.error("API Call failed. Please try again.");
    } finally {
      // setIsLoading(false);
    }
  }

  useEffect(()=>{
    getFundDetail()
  },[])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Edit Fund</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Edit Details for {fund['name']}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Fund Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData['name']}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter fund name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size">Fund Size</Label>
                  <Input
                    id="size"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter fund size"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={e => handleSelectChange("currency", e.target.value)}
                    className="border rounded-md px-2 py-1 w-full"
                  >
                    {currencies.map(cur => (
                      <option key={cur} value={cur}>{cur}</option>
                    ))}
                  </select>
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
                      checked={formData.focus?.includes(sector)}
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
              <Label htmlFor="stage">Stage of Investment</Label>
              <select
                id="stage"
                name="stage"
                value={formData.stage}
                onChange={e => handleSelectChange("stage", e.target.value)}
                className="border rounded-md px-2 py-1 w-full"
              >
                {investmentStages.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Inclusion Terms</Label>
                <textarea
                  value={formData['inclusion']?.join(", ")}
                  readOnly
                  className="w-full mt-1 text-sm bg-muted rounded"
                  rows={2}
                />
              </div>
              <div>
                <Label>Exclusion Terms</Label>
                <textarea
                  value={formData['exclusion']?.join(", ")}
                  readOnly
                  className="w-full mt-1 text-sm bg-muted rounded"
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end mt-6 space-x-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => navigate("/funds")}
          >
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </div>
  );
}

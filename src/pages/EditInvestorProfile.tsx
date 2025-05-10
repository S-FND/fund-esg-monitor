
import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

// Updated interface to include the esgPolicyFileName property
interface InvestorFormData {
  investorName: string;
  companyName: string;
  email: string;
  panNumber: string;
  gstNumber: string;
  esgManagerEmail: string;
  sdgGoal: string;
  sdgTarget: string;
  designation: string;
  address: string;
  esgPolicy?: string;
  _id?:string
}

// Dummy data for testing
const dummyInvestorData: InvestorFormData = {
  investorName: "Global Sustainable Ventures",
  companyName: "GSV Holdings Ltd.",
  email: "contact@gsventures.com",
  panNumber: "AAAAA1234A",
  gstNumber: "29AAAAA1234A1Z5",
  esgManagerEmail: "esg@gsventures.com",
  sdgGoal: "SDG 7 (Clean Energy), SDG 13 (Climate Action)",
  sdgTarget: "50% reduction in portfolio carbon emissions by 2030",
  designation: "Investment Director",
  address: "123 Green Street, Eco Park, Sustainable City - 560001"
};

export default function EditInvestorProfile() {
  const [formData, setFormData] = useState<InvestorFormData>(dummyInvestorData);
  const [uploading, setUploading] = useState(false);
  const [submittedData, setSubmittedData] = useState<InvestorFormData | null>(null);
  const [submittedFile, setSubmittedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        esgPolicy: e.target.files![0].name,
      }));
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const getInvestorInfo= async()=>{
    
    try {
      const res = await fetch(`http://localhost:3002` + "/investor/general-info/", {
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
        let investorInfo:InvestorFormData = {
          investorName: jsondata['data']['investorName'],
          companyName: jsondata['data']['companyName'],
          email: jsondata['data']['email'],
          panNumber: jsondata['data']['panNumber'],
          gstNumber: jsondata['data']['gstNumber'],
          esgManagerEmail: jsondata['data']['esgManagerEmail'],
          sdgGoal: jsondata['data']['sdgGoal'],
          sdgTarget: jsondata['data']['sdgTarget'],
          designation: jsondata['data']['designation'],
          address: jsondata['data']['address'],
          _id:jsondata['data']['_id']
        };
        setFormData(investorInfo)
      }
    } catch (error) {
      console.error("Api call:", error);
      // toast.error("API Call failed. Please try again.");
    } finally {
      // setIsLoading(false);
    }
  }

  useEffect(()=>{
    getInvestorInfo()
  },[])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    // Store submitted data for display
    setSubmittedData({ ...formData });
    if (fileInputRef.current?.files?.[0]) {
      setSubmittedFile(fileInputRef.current.files[0].name);
    }

    try {
      const res = await fetch(`http://localhost:3002` + "/investor/general-info/", {
        method: "PUT",
        body:JSON.stringify(formData),
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
        // if(!training){
        //   training=data[0]
        // }
      }
    } catch (error) {
      console.error("Api call:", error);
      // toastS.error("API Call failed. Please try again.");
    } finally {
      // setIsLoading(false);
    }

    // Simulating API call delay
    setTimeout(() => {
      setUploading(false);
      toast({
        title: "Profile Updated",
        description: "Your investor profile has been updated successfully.",
      });
    }, 1000);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Edit Investor Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div>
                <Label htmlFor="investorName">Investor Name</Label>
                <Input
                  id="investorName"
                  name="investorName"
                  value={formData.investorName}
                  onChange={handleFieldChange}
                  placeholder="Enter investor name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleFieldChange}
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFieldChange}
                  placeholder="Enter email"
                  required
                />
              </div>

              <div>
                <Label htmlFor="pan">PAN</Label>
                <Input
                  id="pan"
                  name="pan"
                  value={formData.panNumber}
                  onChange={handleFieldChange}
                  placeholder="Enter PAN"
                  required
                />
              </div>

              <div>
                <Label htmlFor="gst">GST</Label>
                <Input
                  id="gst"
                  name="gst"
                  value={formData.gstNumber}
                  onChange={handleFieldChange}
                  placeholder="Enter GST"
                  required
                />
              </div>

              <div>
                <Label htmlFor="esgPolicy">ESG Policy (PDF/Doc)</Label>
                <div className="flex items-center gap-3">
                  <Button type="button" onClick={handleUploadClick} variant="outline">
                    {formData.esgPolicy ? "Change file" : "Upload file"}
                  </Button>
                  <span className="text-sm">
                    {formData.esgPolicy || "No file chosen"}
                  </span>
                  <input
                    id="esgPolicy"
                    name="esgPolicy"
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="esgManagerEmail">ESG Manager Email</Label>
                <Input
                  id="esgManagerEmail"
                  name="esgManagerEmail"
                  type="email"
                  value={formData.esgManagerEmail}
                  onChange={handleFieldChange}
                  placeholder="Enter ESG manager's email"
                  required
                />
              </div>

              <div>
                <Label htmlFor="sdgGoals">SDG Goals</Label>
                <Textarea
                  id="sdgGoals"
                  name="sdgGoals"
                  value={formData.sdgGoal}
                  onChange={handleFieldChange}
                  placeholder="List SDG goals"
                  rows={2}
                  required
                />
              </div>

              <div>
                <Label htmlFor="sdgTargets">SDG Targets</Label>
                <Textarea
                  id="sdgTargets"
                  name="sdgTargets"
                  value={formData.sdgTarget}
                  onChange={handleFieldChange}
                  placeholder="List SDG targets"
                  rows={2}
                  required
                />
              </div>

              <div>
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleFieldChange}
                  placeholder="Enter designation"
                  required
                />
              </div>

              <div>
                <Label htmlFor="companyAddress">Company Address</Label>
                <Textarea
                  id="companyAddress"
                  name="companyAddress"
                  value={formData.address}
                  onChange={handleFieldChange}
                  placeholder="Enter company address"
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center gap-4">
                <Button
                  type="submit"
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? "Saving..." : "Save Profile"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/investor-info")}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {submittedData && (
          <Card>
            <CardHeader>
              <CardTitle>Submitted Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(submittedData).map(([key, value]) => 
                  key !== "esgPolicyFileName" ? (
                    <div key={key} className="space-y-1">
                      <Label>{key}</Label>
                      <p className="text-sm text-muted-foreground">{value}</p>
                    </div>
                  ) : null
                )}
                {submittedFile && (
                  <div className="space-y-1">
                    <Label>Uploaded File</Label>
                    <p className="text-sm text-muted-foreground">{submittedFile}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

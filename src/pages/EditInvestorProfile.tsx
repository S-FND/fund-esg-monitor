
import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

// Dummy data for testing
const dummyInvestorData = {
  investorName: "Global Sustainable Ventures",
  companyName: "GSV Holdings Ltd.",
  email: "contact@gsventures.com",
  pan: "AAAAA1234A",
  gst: "29AAAAA1234A1Z5",
  esgManagerEmail: "esg@gsventures.com",
  sdgGoals: "SDG 7 (Clean Energy), SDG 13 (Climate Action)",
  sdgTargets: "50% reduction in portfolio carbon emissions by 2030",
  designation: "Investment Director",
  companyAddress: "123 Green Street, Eco Park, Sustainable City - 560001"
};

export default function EditInvestorProfile() {
  const [formData, setFormData] = useState(dummyInvestorData);
  const [uploading, setUploading] = useState(false);
  const [submittedData, setSubmittedData] = useState<null | typeof formData>(null);
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
        esgPolicyFileName: e.target.files![0].name,
      }));
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    // Store submitted data for display
    setSubmittedData(formData);
    if (fileInputRef.current?.files?.[0]) {
      setSubmittedFile(fileInputRef.current.files[0].name);
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
      <div className="grid gap-6 md:grid-cols-2">
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
                  value={formData.pan}
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
                  value={formData.gst}
                  onChange={handleFieldChange}
                  placeholder="Enter GST"
                  required
                />
              </div>

              <div>
                <Label htmlFor="esgPolicy">ESG Policy (PDF/Doc)</Label>
                <div className="flex items-center gap-3">
                  <Button type="button" onClick={handleUploadClick} variant="outline">
                    {formData.esgPolicyFileName ? "Change file" : "Upload file"}
                  </Button>
                  <span className="text-sm">
                    {formData.esgPolicyFileName || "No file chosen"}
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
                  value={formData.sdgGoals}
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
                  value={formData.sdgTargets}
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
                  value={formData.companyAddress}
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
                {Object.entries(submittedData).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <Label>{key}</Label>
                    <p className="text-sm text-muted-foreground">{value}</p>
                  </div>
                ))}
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

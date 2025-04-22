
import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function EditInvestorProfile() {
  const [formData, setFormData] = useState({
    investorName: "",
    companyName: "",
    email: "",
    pan: "",
    gst: "",
    esgPolicyFile: null as File | null,
    esgPolicyFileName: "",
    esgManagerEmail: "",
    sdgGoals: "",
    sdgTargets: "",
    designation: "",
    companyAddress: ""
  });
  const [uploading, setUploading] = useState(false);
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
        esgPolicyFile: e.target.files![0],
        esgPolicyFileName: e.target.files![0].name,
      }));
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save form data to backend
    // TODO: Upload file (formData.esgPolicyFile) if present to Supabase Storage
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      window.alert("Investor profile saved (mock)!");
      navigate("/investor-info");
    }, 500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto pt-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Investor Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
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
                  {formData.esgPolicyFileName ? formData.esgPolicyFileName : "No file chosen"}
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
    </div>
  );
}

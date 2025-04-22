
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function InvestorInfo() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Investor General Information</h2>
        <Button onClick={() => navigate("/investor-info/edit")}>Edit Profile</Button>
      </div>
      {/* Show the main profile info here (if needed in the future) */}
      <div>
        <p>This is the investor profile page. (Content can be added here...)</p>
      </div>
    </div>
  );
}

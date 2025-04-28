
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

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

export default function InvestorInfo() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Investor General Information</h2>
        <Button onClick={() => navigate("/investor-info/edit")}>Edit Profile</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Company Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Investor Name</TableCell>
                <TableCell>{dummyInvestorData.investorName}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Company Name</TableCell>
                <TableCell>{dummyInvestorData.companyName}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Email</TableCell>
                <TableCell>{dummyInvestorData.email}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">PAN</TableCell>
                <TableCell>{dummyInvestorData.pan}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">GST</TableCell>
                <TableCell>{dummyInvestorData.gst}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">ESG Manager Email</TableCell>
                <TableCell>{dummyInvestorData.esgManagerEmail}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">SDG Goals</TableCell>
                <TableCell>{dummyInvestorData.sdgGoals}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">SDG Targets</TableCell>
                <TableCell>{dummyInvestorData.sdgTargets}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Designation</TableCell>
                <TableCell>{dummyInvestorData.designation}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Company Address</TableCell>
                <TableCell>{dummyInvestorData.companyAddress}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

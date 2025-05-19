
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

interface InvestorFormData {
  investorName: string;
  companyName: string;
  email: string;
  pan: string;
  gst: string;
  esgManagerEmail: string;
  sdgGoals: string;
  sdgTargets: string;
  designation: string;
  companyAddress: string;
  esgPolicyFileName?: string;
}
// let dummyInvestorData = {
//   investorName: "Global Sustainable Ventures",
//   companyName: "GSV Holdings Ltd.",
//   email: "contact@gsventures.com",
//   pan: "AAAAA1234A",
//   gst: "29AAAAA1234A1Z5",
//   esgManagerEmail: "esg@gsventures.com",
//   sdgGoals: "SDG 7 (Clean Energy), SDG 13 (Climate Action)",
//   sdgTargets: "50% reduction in portfolio carbon emissions by 2030",
//   designation: "Investment Director",
//   companyAddress: "123 Green Street, Eco Park, Sustainable City - 560001"
// };

export default function InvestorInfo() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<InvestorFormData>();
  const getInvestorInfo= async()=>{
    
    try {
      const res = await fetch(`https://preprod-api.fandoro.com` + "/investor/general-info/", {
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
        if(jsondata['data']){
          let investorInfo = {
            investorName: jsondata['data']['investorName'],
            companyName: jsondata['data']['companyName'],
            email: jsondata['data']['email'],
            pan: jsondata['data']['panNumber'],
            gst: jsondata['data']['gstNumber'],
            esgManagerEmail: jsondata['data']['esgManagerEmail'],
            sdgGoals: jsondata['data']['sdgGoal'],
            sdgTargets: jsondata['data']['sdgTarget'],
            designation: jsondata['data']['designation'],
            companyAddress: jsondata['data']['address'],
          };
          setFormData(investorInfo)
        }
        
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
                <TableCell>{formData?.investorName}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Company Name</TableCell>
                <TableCell>{formData?.companyName}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Email</TableCell>
                <TableCell>{formData?.email}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">PAN</TableCell>
                <TableCell>{formData?.pan}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">GST</TableCell>
                <TableCell>{formData?.gst}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">ESG Manager Email</TableCell>
                <TableCell>{formData?.esgManagerEmail}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">SDG Goals</TableCell>
                <TableCell>{formData?.sdgGoals}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">SDG Targets</TableCell>
                <TableCell>{formData?.sdgTargets}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Designation</TableCell>
                <TableCell>{formData?.designation}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Company Address</TableCell>
                <TableCell>{formData?.companyAddress}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

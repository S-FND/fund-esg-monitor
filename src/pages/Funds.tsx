
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { funds } from "./fundsData";
import { useEffect, useState } from "react";

export default function Funds() {
  const navigate = useNavigate();
  const [funds,setFunds]=useState([])
  const getFundList= async()=>{
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}` + `/investor/fund`, {
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
        setFunds(jsondata['data'])
      }
    } catch (error) {
      console.error("Api call:", error);
      // toast.error("API Call failed. Please try again.");
    } finally {
      // setIsLoading(false);
    }
  }

  useEffect(()=>{
    getFundList()
  },[])
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Funds</h1>
        <Button onClick={() => navigate("/funds/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Create New Fund</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {funds.map(fund => (
          <Card key={fund._id} className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-4">
              <CardTitle>{fund.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Fund Size</h3>
                  <p className="font-semibold">{fund.size} {fund.currency}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Sector Focus</h3>
                  <div className="flex flex-wrap gap-1">
                    {["ClimateTech", "AgriTech",fund.sectorFocus.split(",")].flat().map(sector => (
                      <span key={sector} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                        {sector}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Investment Stage</h3>
                  <p>{fund.stageOfInvestment}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Inclusion Terms</h3>
                  <div className="flex flex-wrap gap-1">
                    {fund.inclusion.map(term => (
                      <span key={term} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-esg-light text-esg-primary">
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Exclusion Terms</h3>
                  <div className="flex flex-wrap gap-1">
                    {fund.exclusion.map(term => (
                      <span key={term} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button variant="outline" onClick={() => navigate(`/funds/${fund._id}`)}>
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

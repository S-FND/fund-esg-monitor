
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ESGMatrixOverview } from "@/components/esg-risk-matrix/ESGMatrixOverview";
import { ESGCompanyMatrix } from "@/components/esg-risk-matrix/ESGCompanyMatrix";
import { ESGRiskSettings } from "@/components/esg-risk-matrix/ESGRiskSettings";
import { ValuationImpactSummary } from "@/components/esg-risk-matrix/ValuationImpactSummary";
import { ESGMatrixFilters } from "@/components/esg-risk-matrix/ESGMatrixFilters";

export default function ESGRiskMatrix() {
  const [selectedFund, setSelectedFund] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [selectedSector, setSelectedSector] = useState<string>("all");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">ESG Risk Matrix</h1>
        <ESGRiskSettings />
      </div>
      
      <ESGMatrixFilters 
        selectedFund={selectedFund}
        setSelectedFund={setSelectedFund}
        selectedCompany={selectedCompany}
        setSelectedCompany={setSelectedCompany}
        selectedSector={selectedSector}
        setSelectedSector={setSelectedSector}
      />
      
      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="overview">Portfolio Overview</TabsTrigger>
          <TabsTrigger value="company">Company Analysis</TabsTrigger>
          <TabsTrigger value="valuation">Valuation Impact</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <ESGMatrixOverview 
              selectedFund={selectedFund} 
              selectedSector={selectedSector} 
            />
          </div>
        </TabsContent>
        
        <TabsContent value="company" className="space-y-4">
          {selectedCompany !== "all" ? (
            <ESGCompanyMatrix companyId={selectedCompany} />
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Please select a specific company to view its ESG risk matrix.
            </p>
          )}
        </TabsContent>
        
        <TabsContent value="valuation" className="space-y-4">
          <ValuationImpactSummary 
            selectedFund={selectedFund} 
            selectedCompany={selectedCompany} 
            selectedSector={selectedSector}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

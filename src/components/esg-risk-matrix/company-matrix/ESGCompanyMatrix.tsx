
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyMatrixHeader } from "./CompanyMatrixHeader";
import { CompanyMatrixOverview } from "./CompanyMatrixOverview";
import { CompanyMatrixRisks } from "./CompanyMatrixRisks";
import { CompanyMatrixOpportunities } from "./CompanyMatrixOpportunities";
import { CompanyMatrixHistorical } from "./CompanyMatrixHistorical";
import { CompanyData, PillarImpactData } from "./types";
import { companyData } from "./companyData";

interface ESGCompanyMatrixProps {
  companyId: string;
}

export function ESGCompanyMatrix({ companyId }: ESGCompanyMatrixProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Get company data based on companyId
  const company = companyData[companyId as keyof typeof companyData];
  
  if (!company) {
    return (
      <div className="text-center p-6">
        <p className="text-muted-foreground">Company data not found.</p>
      </div>
    );
  }
  
  const { impact } = company.valuation;
  const impactClass = impact < 0 ? "text-red-600" : "text-emerald-600";

  // Generate pillar impact data for bar chart
  const pillarImpactData: PillarImpactData[] = [
    {
      name: "Environmental",
      value: company.esgRiskData
        .filter(item => item.category === "Environmental")
        .reduce((sum, item) => sum + item.impact, 0) - 
        company.esgOpportunityData
        .filter(item => item.category === "Environmental")
        .reduce((sum, item) => sum + item.impact, 0)
    },
    {
      name: "Social",
      value: company.esgRiskData
        .filter(item => item.category === "Social")
        .reduce((sum, item) => sum + item.impact, 0) - 
        company.esgOpportunityData
        .filter(item => item.category === "Social")
        .reduce((sum, item) => sum + item.impact, 0)
    },
    {
      name: "Governance",
      value: company.esgRiskData
        .filter(item => item.category === "Governance")
        .reduce((sum, item) => sum + item.impact, 0) -
        company.esgOpportunityData
        .filter(item => item.category === "Governance")
        .reduce((sum, item) => sum + item.impact, 0)
    }
  ];
  
  return (
    <>
      <CompanyMatrixHeader company={company} impactClass={impactClass} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">ESG Overview</TabsTrigger>
          <TabsTrigger value="risks">Risk Factors</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="historical">Historical</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <CompanyMatrixOverview 
            company={company}
            pillarImpactData={pillarImpactData}
            impactClass={impactClass}
          />
        </TabsContent>
        
        <TabsContent value="risks">
          <CompanyMatrixRisks company={company} />
        </TabsContent>
        
        <TabsContent value="opportunities">
          <CompanyMatrixOpportunities company={company} />
        </TabsContent>
        
        <TabsContent value="historical">
          <CompanyMatrixHistorical company={company} />
        </TabsContent>
      </Tabs>
    </>
  );
}

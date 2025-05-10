
import { useState } from "react";
import { CompanyData, PillarImpactData } from "./types";
import { companyData } from "./companyData";

export function useCompanyMatrix(companyId: string) {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Get company data based on companyId
  const company = companyData[companyId as keyof typeof companyData];
  
  // Prepare display classes
  const impactClass = company?.valuation.impact < 0 ? "text-red-600" : "text-emerald-600";
  
  // Generate pillar impact data for bar chart
  const generatePillarImpactData = (company: CompanyData): PillarImpactData[] => {
    if (!company) return [];
    
    return [
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
  };
  
  const pillarImpactData = company ? generatePillarImpactData(company) : [];

  return {
    company,
    activeTab,
    setActiveTab,
    impactClass,
    pillarImpactData
  };
}

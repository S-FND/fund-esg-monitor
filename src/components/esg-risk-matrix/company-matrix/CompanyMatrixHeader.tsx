
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompanyData } from "./types";

interface CompanyMatrixHeaderProps {
  company: CompanyData;
  impactClass: string;
}

export function CompanyMatrixHeader({ company, impactClass }: CompanyMatrixHeaderProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{company.name}</CardTitle>
          <CardDescription>{company.industry}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Current Valuation:</span>
              <span className="font-bold">${(company.valuation.current / 1000000).toFixed(1)}M</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">ESG-Adjusted Valuation:</span>
              <span className="font-bold">${(company.valuation.adjusted / 1000000).toFixed(1)}M</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Valuation Impact:</span>
              <span className={`font-bold ${impactClass}`}>
                {company.valuation.impact > 0 ? '+' : ''}{company.valuation.impact}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">ESG Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Environmental:</span>
              <span className="font-medium">{company.esgScores.environmental}/100</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Social:</span>
              <span className="font-medium">{company.esgScores.social}/100</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Governance:</span>
              <span className="font-medium">{company.esgScores.governance}/100</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t">
              <span className="font-medium text-sm">Overall ESG Score:</span>
              <span className="font-bold">{company.esgScores.overall}/100</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Key Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button className="w-full" variant="outline">Generate ESG Report</Button>
            <Button className="w-full" variant="outline">Create CAP Plan</Button>
            <Button className="w-full" variant="outline">Edit ESG Parameters</Button>
            <Button className="w-full" variant="outline">View Historical Data</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

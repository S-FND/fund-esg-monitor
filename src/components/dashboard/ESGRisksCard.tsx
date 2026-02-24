// components/dashboard/ESGRisksCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface ESGRisksCardProps {
  data?: {
    environmental?: Array<{ value: string }>;
    social?: Array<{ value: string }>;
    governance?: Array<{ value: string }>;
  };
  selectedPortfolio?: string;
}

export function ESGRisksCard({ 
  data, 
  selectedPortfolio = "fundwise" 
}: ESGRisksCardProps) {
  const [hasData, setHasData] = useState(false);
  const [environmentalRisks, setEnvironmentalRisks] = useState<any[]>([]);
  const [socialRisks, setSocialRisks] = useState<any[]>([]);
  const [governanceRisks, setGovernanceRisks] = useState<any[]>([]);

  useEffect(() => {
    const risks = data || {};
    const env = risks.environmental?.filter(r => r.value) || [];
    const soc = risks.social?.filter(r => r.value) || [];
    const gov = risks.governance?.filter(r => r.value) || [];
    
    setEnvironmentalRisks(env);
    setSocialRisks(soc);
    setGovernanceRisks(gov);
    setHasData(env.length > 0 || soc.length > 0 || gov.length > 0);
  }, [data]);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            ESG Risks Identified
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground">No risks identified</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              All ESG risk factors are within acceptable limits
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          ESG Risks Identified
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[300px] overflow-y-auto">
          {environmentalRisks.length > 0 && (
            <div className="border-l-2 border-green-500 pl-3">
              <h4 className="font-medium text-green-600 mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Environmental ({environmentalRisks.length})
              </h4>
              <ul className="space-y-2">
                {environmentalRisks.slice(0, 3).map((risk, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">
                    • {risk.value}
                  </li>
                ))}
                {environmentalRisks.length > 3 && (
                  <li className="text-xs text-primary">+{environmentalRisks.length - 3} more</li>
                )}
              </ul>
            </div>
          )}
          
          {socialRisks.length > 0 && (
            <div className="border-l-2 border-blue-500 pl-3">
              <h4 className="font-medium text-blue-600 mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Social ({socialRisks.length})
              </h4>
              <ul className="space-y-2">
                {socialRisks.slice(0, 3).map((risk, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">
                    • {risk.value}
                  </li>
                ))}
                {socialRisks.length > 3 && (
                  <li className="text-xs text-primary">+{socialRisks.length - 3} more</li>
                )}
              </ul>
            </div>
          )}
          
          {governanceRisks.length > 0 && (
            <div className="border-l-2 border-purple-500 pl-3">
              <h4 className="font-medium text-purple-600 mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Governance ({governanceRisks.length})
              </h4>
              <ul className="space-y-2">
                {governanceRisks.slice(0, 3).map((risk, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">
                    • {risk.value}
                  </li>
                ))}
                {governanceRisks.length > 3 && (
                  <li className="text-xs text-primary">+{governanceRisks.length - 3} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground">
          Total risks: {environmentalRisks.length + socialRisks.length + governanceRisks.length}
        </div>
      </CardContent>
    </Card>
  );
}
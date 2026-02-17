// components/dashboard/ESGRisksCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ESGRisksCardProps {
  data?: {
    environmental?: Array<{ value: string }>;
    social?: Array<{ value: string }>;
    governance?: Array<{ value: string }>;
  };
}

export function ESGRisksCard({ data }: ESGRisksCardProps) {
  const risks = data || {};

  const hasRisks = Object.values(risks).some(category => 
    category && category.length > 0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          ESG Risks Identified
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasRisks ? (
          <div className="space-y-4">
            {risks.environmental && risks.environmental.length > 0 && (
              <div>
                <h4 className="font-medium text-green-600 mb-2">Environmental</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {risks.environmental.slice(0, 3).map((risk, idx) => (
                    <li key={idx} className="text-sm">{risk.value}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {risks.social && risks.social.length > 0 && (
              <div>
                <h4 className="font-medium text-blue-600 mb-2">Social</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {risks.social.slice(0, 3).map((risk, idx) => (
                    <li key={idx} className="text-sm">{risk.value}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {risks.governance && risks.governance.length > 0 && (
              <div>
                <h4 className="font-medium text-purple-600 mb-2">Governance</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {risks.governance.slice(0, 3).map((risk, idx) => (
                    <li key={idx} className="text-sm">{risk.value}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No risks identified
          </p>
        )}
      </CardContent>
    </Card>
  );
}
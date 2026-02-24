// components/dashboard/NonCompliancesCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

interface NonCompliancesCardProps {
  data?: Array<{
    area: string;
    description: string;
  }>;
  selectedPortfolio?: string;
}

export function NonCompliancesCard({ 
  data, 
  selectedPortfolio = "fundwise" 
}: NonCompliancesCardProps) {
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    setHasData(data && data.length > 0);
  }, [data]);

  if (!data || !hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Non-Compliances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground">No non-compliances found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              All compliance requirements are being met
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Safe to use data now since we've checked it's defined
  const displayData = data.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Non-Compliances
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[300px] overflow-y-auto">
          {displayData.map((item, index) => (
            <div key={index} className="border-b pb-2 last:border-0 last:pb-0">
              <h4 className="font-medium text-sm">{item.area}</h4>
              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
            </div>
          ))}
          {data.length > 5 && (
            <p className="text-sm text-primary cursor-pointer hover:underline">
              +{data.length - 5} more items
            </p>
          )}
        </div>
        <div className="mt-4 text-xs text-muted-foreground text-right">
          Total non-compliances: {data.length}
        </div>
      </CardContent>
    </Card>
  );
}
// components/dashboard/NonCompliancesCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface NonCompliancesCardProps {
  data?: Array<{
    area: string;
    description: string;
  }>;
}

export function NonCompliancesCard({ data }: NonCompliancesCardProps) {
  const nonCompliances = data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Non-Compliances
        </CardTitle>
      </CardHeader>
      <CardContent>
        {nonCompliances.length > 0 ? (
          <div className="space-y-4">
            {nonCompliances.slice(0, 5).map((item, index) => (
              <div key={index} className="border-b pb-2 last:border-0">
                <h4 className="font-medium">{item.area}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No non-compliances found
          </p>
        )}
      </CardContent>
    </Card>
  );
}
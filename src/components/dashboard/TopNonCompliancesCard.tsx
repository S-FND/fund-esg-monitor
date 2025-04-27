
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

interface TopNonCompliancesCardProps {
  selectedFund?: string;
  selectedCompany?: string;
  selectedYear?: string;
}

export function TopNonCompliancesCard({
  selectedFund = "all",
  selectedCompany = "all",
  selectedYear = "2025",
}: TopNonCompliancesCardProps) {
  // This would be fetched from an API in a real application
  const topNonCompliances = [
    {
      id: 1,
      description: "Incomplete environmental impact assessments",
      severity: "high",
      companies: ["EcoSolutions Inc.", "GreenHarvest"],
      occurrences: 5,
    },
    {
      id: 2,
      description: "Inadequate waste management documentation",
      severity: "medium",
      companies: ["MediTech Innovations", "FinSecure"],
      occurrences: 4,
    },
    {
      id: 3,
      description: "Missing employee safety training records",
      severity: "high",
      companies: ["GreenHarvest", "EduForward"],
      occurrences: 4,
    },
    {
      id: 4,
      description: "Non-compliance with emissions reporting",
      severity: "medium",
      companies: ["EcoSolutions Inc."],
      occurrences: 3,
    },
    {
      id: 5,
      description: "Incomplete supplier due diligence",
      severity: "low",
      companies: ["FinSecure", "MediTech Innovations"],
      occurrences: 3,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Non-Compliances</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topNonCompliances.map((nc) => (
            <Alert key={nc.id} variant="default" className="bg-background">
              <ShieldAlert className="h-4 w-4" />
              <div className="flex items-start justify-between w-full">
                <div className="space-y-1">
                  <AlertDescription className="font-medium">
                    {nc.description}
                  </AlertDescription>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant={nc.severity === 'high' ? 'destructive' : nc.severity === 'medium' ? 'default' : 'secondary'}>
                      {nc.severity}
                    </Badge>
                    <span>{nc.companies.join(", ")}</span>
                  </div>
                </div>
                <span className="text-sm font-bold">{nc.occurrences} occurrences</span>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

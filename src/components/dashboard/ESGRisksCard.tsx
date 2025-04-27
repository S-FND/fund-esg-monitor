
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, Social, Shield } from "lucide-react";

interface ESGRisk {
  id: number;
  description: string;
  category: 'environmental' | 'social' | 'governance';
  riskIndex: 'high' | 'medium' | 'low';
  companies: string[];
}

interface ESGRisksCardProps {
  selectedFund?: string;
  selectedCompany?: string;
  selectedYear?: string;
}

export function ESGRisksCard({
  selectedFund = "all",
  selectedCompany = "all",
  selectedYear = "2025",
}: ESGRisksCardProps) {
  // This would be fetched from an API in a real application
  const esgRisks: ESGRisk[] = [
    {
      id: 1,
      description: "Carbon emissions regulatory compliance",
      category: "environmental",
      riskIndex: "high",
      companies: ["EcoSolutions Inc.", "GreenHarvest", "MediTech Innovations"],
    },
    {
      id: 2,
      description: "Supply chain labor standards",
      category: "social",
      riskIndex: "medium",
      companies: ["GreenHarvest", "FinSecure"],
    },
    {
      id: 3,
      description: "Board diversity and inclusion",
      category: "governance",
      riskIndex: "medium",
      companies: ["EduForward", "MediTech Innovations"],
    },
    {
      id: 4,
      description: "Water scarcity impact",
      category: "environmental",
      riskIndex: "high",
      companies: ["GreenHarvest", "EcoSolutions Inc."],
    },
  ];

  const getCategoryIcon = (category: ESGRisk['category']) => {
    switch (category) {
      case 'environmental':
        return <Globe className="h-4 w-4" />;
      case 'social':
        return <Social className="h-4 w-4" />;
      case 'governance':
        return <Shield className="h-4 w-4" />;
    }
  };

  const getRiskColor = (riskIndex: ESGRisk['riskIndex']) => {
    switch (riskIndex) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>ESG Risk Assessment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {esgRisks.map((risk) => (
            <Alert key={risk.id} variant="default" className="bg-background">
              {getCategoryIcon(risk.category)}
              <div className="flex items-start justify-between w-full">
                <div className="space-y-1">
                  <AlertDescription className="font-medium">
                    {risk.description}
                  </AlertDescription>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant={getRiskColor(risk.riskIndex)}>
                      {risk.riskIndex} risk
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {risk.category}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {risk.companies.join(", ")}
                  </div>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// components/dashboard/TopInitiativesCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface Initiative {
  id: number;
  title: string;
  progress: number;
  companies: string[];
  sdgNumber: number;
}

interface TopInitiativesCardProps {
  data?: Initiative[];
}

export function TopInitiativesCard({ data }: TopInitiativesCardProps) {
  // Default data if none provided
  const defaultData: Initiative[] = [
    {
      id: 1,
      title: "Carbon Neutral Supply Chain",
      progress: 87,
      companies: ["EcoSolutions Inc.", "GreenHarvest"],
      sdgNumber: 13,
    },
    {
      id: 2,
      title: "Renewable Energy Implementation",
      progress: 82,
      companies: ["EcoSolutions Inc.", "MediTech Innovations", "FinSecure"],
      sdgNumber: 7,
    },
    {
      id: 3,
      title: "Zero Waste Manufacturing",
      progress: 76,
      companies: ["GreenHarvest", "MediTech Innovations"],
      sdgNumber: 12,
    },
  ];

  const initiatives = data || defaultData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Sustainability Initiatives</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {initiatives.map((initiative) => (
            <div key={initiative.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/10">
                      SDG {initiative.sdgNumber}
                    </Badge>
                    <h4 className="font-semibold">{initiative.title}</h4>
                  </div>
                  <p className="text-xs mt-1 text-muted-foreground">
                    {initiative.companies.join(", ")}
                  </p>
                </div>
                <span className="font-medium">{initiative.progress}%</span>
              </div>
              <Progress value={initiative.progress} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
// components/dashboard/TopPerformersCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface TopPerformersCardProps {
  data?: Array<{
    name: string;
    esgScore: number;
    sector: string;
  }>;
}

export function TopPerformersCard({ data }: TopPerformersCardProps) {
  // Default data if none provided
  const defaultData = [
    { name: "EcoSolutions Inc.", esgScore: 92, sector: "ClimateTech" },
    { name: "GreenHarvest", esgScore: 88, sector: "AgriTech" },
    { name: "MediTech Innovations", esgScore: 85, sector: "HealthTech" },
  ];

  const performers = data || defaultData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top ESG Performers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {performers
            .sort((a, b) => b.esgScore - a.esgScore)
            .slice(0, 3)
            .map((company, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                  {i + 1}
                </div>
                <div>
                  <p className="font-medium">{company.name}</p>
                  <p className="text-sm text-muted-foreground">{company.sector}</p>
                </div>
                <div className="ml-auto font-bold">{company.esgScore}</div>
              </div>
            ))
          }
        </div>
      </CardContent>
    </Card>
  );
}
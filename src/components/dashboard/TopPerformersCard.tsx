
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Company {
  id: number;
  name: string;
  sector: string;
  esgScore: number;
}

export function TopPerformersCard({ companies }: { companies: Company[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top ESG Performers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {companies
            .sort((a, b) => b.esgScore - a.esgScore)
            .slice(0, 3)
            .map((company, i) => (
              <div key={company.id} className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-esg-primary text-white flex items-center justify-center">
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

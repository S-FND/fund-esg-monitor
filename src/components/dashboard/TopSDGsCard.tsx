// components/dashboard/TopSDGsCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const sdgColors = {
  1: "#E5243B", 2: "#DDA63A", 3: "#4C9F38", 4: "#C5192D", 5: "#FF3A21",
  6: "#26BDE2", 7: "#FCC30B", 8: "#A21942", 9: "#FD6925", 10: "#DD1367",
  11: "#FD9D24", 12: "#BF8B2E", 13: "#3F7E44", 14: "#0A97D9", 15: "#56C02B",
  16: "#00689D", 17: "#19486A",
};

const sdgNames = {
  1: "No Poverty",
  2: "Zero Hunger",
  3: "Good Health and Well-being",
  4: "Quality Education",
  5: "Gender Equality",
  6: "Clean Water and Sanitation",
  7: "Affordable and Clean Energy",
  8: "Decent Work and Economic Growth",
  9: "Industry, Innovation and Infrastructure",
  10: "Reduced Inequalities",
  11: "Sustainable Cities and Communities",
  12: "Responsible Consumption and Production",
  13: "Climate Action",
  14: "Life Below Water",
  15: "Life on Land",
  16: "Peace, Justice and Strong Institutions",
  17: "Partnerships for the Goals",
};

interface TopSDGsCardProps {
  data?: Array<{
    sdgNumber: number;
    name?: string;
    companies: number;
    totalCompanies: number;
  }>;
}

export function TopSDGsCard({ data }: TopSDGsCardProps) {
  // Default data if none provided
  const defaultData = [
    {
      sdgNumber: 13,
      companies: 5,
      totalCompanies: 7,
    },
    {
      sdgNumber: 7,
      companies: 4,
      totalCompanies: 7,
    },
    {
      sdgNumber: 12,
      companies: 3,
      totalCompanies: 7,
    },
  ];

  const topSDGs = data || defaultData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top SDGs Across Portfolio</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {topSDGs.map((sdg) => {
            const sdgName = sdg?.name || sdgNames[sdg.sdgNumber as keyof typeof sdgNames] || `SDG ${sdg.sdgNumber}`;
            const color = sdgColors[sdg.sdgNumber as keyof typeof sdgColors] || "#000000";
            
            return (
              <div key={sdg.sdgNumber} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded-sm"
                      style={{ backgroundColor: color }}
                    ></div>
                    <span className="font-medium">
                      SDG {sdg.sdgNumber}: {sdgName}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {sdg.companies} of {sdg.totalCompanies} companies
                  </span>
                </div>
                <Progress
                  value={(sdg.companies / sdg.totalCompanies) * 100}
                  className="h-2"
                  style={{
                    "--progress-background": color,
                  } as React.CSSProperties}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
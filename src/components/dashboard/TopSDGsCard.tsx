
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const sdgColors = {
  1: "#E5243B", // No Poverty
  2: "#DDA63A", // Zero Hunger
  3: "#4C9F38", // Good Health and Well-being
  4: "#C5192D", // Quality Education
  5: "#FF3A21", // Gender Equality
  6: "#26BDE2", // Clean Water and Sanitation
  7: "#FCC30B", // Affordable and Clean Energy
  8: "#A21942", // Decent Work and Economic Growth
  9: "#FD6925", // Industry, Innovation and Infrastructure
  10: "#DD1367", // Reduced Inequalities
  11: "#FD9D24", // Sustainable Cities and Communities
  12: "#BF8B2E", // Responsible Consumption and Production
  13: "#3F7E44", // Climate Action
  14: "#0A97D9", // Life Below Water
  15: "#56C02B", // Life on Land
  16: "#00689D", // Peace, Justice and Strong Institutions
  17: "#19486A", // Partnerships for the Goals
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
  selectedFund?: string;
  selectedCompany?: string;
  selectedYear?: string;
}

export function TopSDGsCard({
  selectedFund = "all",
  selectedCompany = "all",
  selectedYear = "2025",
}: TopSDGsCardProps) {
  // This would be fetched from an API in a real application
  const topSDGs = [
    {
      sdgNumber: 13,
      name: "Climate Action",
      companies: 5,
      totalCompanies: 7,
    },
    {
      sdgNumber: 7,
      name: "Affordable and Clean Energy",
      companies: 4,
      totalCompanies: 7,
    },
    {
      sdgNumber: 12,
      name: "Responsible Consumption and Production",
      companies: 3,
      totalCompanies: 7,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top SDGs Across Portfolio</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {topSDGs.map((sdg) => (
            <div key={sdg.sdgNumber} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-sm"
                    style={{
                      backgroundColor: sdgColors[sdg.sdgNumber as keyof typeof sdgColors],
                    }}
                  ></div>
                  <span className="font-medium">
                    SDG {sdg.sdgNumber}: {sdgNames[sdg.sdgNumber as keyof typeof sdgNames]}
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
                  "--progress-background": sdgColors[sdg.sdgNumber as keyof typeof sdgColors],
                } as React.CSSProperties}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

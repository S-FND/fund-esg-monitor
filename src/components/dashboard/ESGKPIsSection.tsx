
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PortfolioCompanyKPIs } from "@/components/PortfolioCompanyKPIs";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const esgComponentData = [
  { subject: "Carbon Emissions", score: 78, fullMark: 100 },
  { subject: "Energy Usage", score: 85, fullMark: 100 },
  { subject: "Water Management", score: 65, fullMark: 100 },
  { subject: "Waste Management", score: 90, fullMark: 100 },
  { subject: "Biodiversity", score: 75, fullMark: 100 },
  { subject: "Employee Relations", score: 82, fullMark: 100 },
  { subject: "Community Engagement", score: 70, fullMark: 100 },
  { subject: "Board Diversity", score: 65, fullMark: 100 }
];

const chartConfig = {
  score: { color: "#8b5cf6" }
};

export function ESGKPIsSection({
  selectedCompany,
  selectedCompanyId,
  selectedYear,
}: {
  selectedCompany: string;
  selectedCompanyId: string;
  selectedYear: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ESG Scores by Component</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[400px]" config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={esgComponentData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="ESG Score"
                dataKey="score"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.6}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* ESG KPIs reported by portfolio company for the selected year */}
        {selectedCompany !== "all" && selectedCompanyId && (
          <PortfolioCompanyKPIs companyId={selectedCompanyId} reportedYear={selectedYear} />
        )}
        {selectedCompany === "all" && (
          <p className="text-sm text-muted-foreground mt-4">
            Select a specific portfolio company to view its reported ESG KPIs.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

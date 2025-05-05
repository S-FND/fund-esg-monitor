
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { CompanyData, PillarImpactData } from "./types";

interface CompanyMatrixOverviewProps {
  company: CompanyData;
  pillarImpactData: PillarImpactData[];
  impactClass: string;
}

export function CompanyMatrixOverview({ company, pillarImpactData, impactClass }: CompanyMatrixOverviewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>ESG Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[300px]" config={{
            esgScore: { color: "#8b5cf6" },
            industryAvg: { color: "#94a3b8" },
            A: { color: "#22c55e" },
            B: { color: "#3b82f6" }
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={90} data={company.radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Tooltip content={<ChartTooltipContent />} />
                <Radar name={company.name} dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                <Radar name="Industry Average" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>ESG Impact on Valuation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-2">Valuation Impact by ESG Pillar</h4>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={pillarImpactData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Impact']} />
                  <Bar dataKey="value" fill="#8884d8">
                    {pillarImpactData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value < 0 ? "#ef4444" : "#22c55e"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Net Valuation Impact</h4>
              <div className="flex items-center justify-between text-lg">
                <span>Without ESG factors:</span>
                <span className="font-bold">${(company.valuation.current / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex items-center justify-between text-lg">
                <span>With ESG factors:</span>
                <span className="font-bold">${(company.valuation.adjusted / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex items-center justify-between text-lg border-t mt-2 pt-2">
                <span>Impact:</span>
                <span className={`font-bold ${impactClass}`}>
                  {company.valuation.impact > 0 ? '+' : ''}{company.valuation.impact}% (${((company.valuation.adjusted - company.valuation.current) / 1000000).toFixed(2)}M)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

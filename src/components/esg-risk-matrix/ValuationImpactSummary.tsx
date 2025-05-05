
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

// Sample data for valuation impact
const valuationImpactByCompany = [
  { name: "EcoSolutions Inc.", value: -8.2, valuation: 25000000, adjustedValuation: 22950000, color: "#ef4444" },
  { name: "GreenHarvest", value: 3.5, valuation: 15000000, adjustedValuation: 15525000, color: "#22c55e" },
  { name: "MediTech Innovations", value: 12.4, valuation: 30000000, adjustedValuation: 33720000, color: "#22c55e" },
  { name: "EduForward", value: 5.8, valuation: 12000000, adjustedValuation: 12696000, color: "#22c55e" },
  { name: "FinSecure", value: -3.2, valuation: 10000000, adjustedValuation: 9680000, color: "#ef4444" },
];

const valuationImpactByRisk = [
  { name: "Carbon Emissions", value: -4.2, category: "Environmental" },
  { name: "Water Management", value: -2.5, category: "Environmental" },
  { name: "Supply Chain", value: -2.8, category: "Environmental" },
  { name: "Labor Practices", value: -1.8, category: "Social" },
  { name: "DEI", value: -1.2, category: "Social" },
  { name: "Board Independence", value: -2.3, category: "Governance" },
  { name: "Executive Compensation", value: -1.5, category: "Governance" },
  { name: "ESG Reporting", value: -0.9, category: "Governance" },
];

const valuationImpactByOpportunity = [
  { name: "Renewable Energy", value: 3.8, category: "Environmental" },
  { name: "Circular Design", value: 2.9, category: "Environmental" },
  { name: "Green Products", value: 4.5, category: "Environmental" },
  { name: "Employee Wellbeing", value: 1.7, category: "Social" },
  { name: "Community Engagement", value: 2.4, category: "Social" },
  { name: "ESG Target Setting", value: 1.8, category: "Governance" },
  { name: "Transparent Reporting", value: 1.2, category: "Governance" },
];

const pieData = [
  { name: "Environmental Risks", value: 9.5, color: "#ef4444" },
  { name: "Social Risks", value: 3.0, color: "#f97316" },
  { name: "Governance Risks", value: 4.7, color: "#eab308" },
  { name: "Environmental Opportunities", value: 11.2, color: "#22c55e" },
  { name: "Social Opportunities", value: 4.1, color: "#14b8a6" },
  { name: "Governance Opportunities", value: 3.0, color: "#3b82f6" },
];

interface ValuationImpactSummaryProps {
  selectedFund: string;
  selectedCompany: string;
  selectedSector: string;
}

export function ValuationImpactSummary({ 
  selectedFund, 
  selectedCompany, 
  selectedSector 
}: ValuationImpactSummaryProps) {
  // Calculate net valuation impact
  const initialValuation = valuationImpactByCompany.reduce((sum, company) => sum + company.valuation, 0);
  const adjustedValuation = valuationImpactByCompany.reduce((sum, company) => sum + company.adjustedValuation, 0);
  const netImpact = ((adjustedValuation - initialValuation) / initialValuation) * 100;
  
  // Filter companies by fund and sector if needed
  const filteredCompanies = valuationImpactByCompany;
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Portfolio Valuation Impact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Initial Portfolio Value:</span>
              <span className="font-bold">${(initialValuation / 1000000).toFixed(1)}M</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">ESG-Adjusted Value:</span>
              <span className="font-bold">${(adjustedValuation / 1000000).toFixed(1)}M</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Net ESG Impact:</span>
              <span className={`font-bold ${netImpact >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {netImpact >= 0 ? "+" : ""}{netImpact.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Value Added/Lost:</span>
              <span className={`font-bold ${netImpact >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {adjustedValuation - initialValuation >= 0 ? "+" : ""}${((adjustedValuation - initialValuation) / 1000000).toFixed(2)}M
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Highest Positive Impact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Company:</span>
              <span className="font-bold">MediTech Innovations</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Valuation Impact:</span>
              <span className="font-bold text-emerald-600">+12.4%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Value Added:</span>
              <span className="font-bold text-emerald-600">+$3.72M</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Top ESG Factor:</span>
              <span className="font-medium">Green Products (+4.5%)</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Highest Negative Impact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Company:</span>
              <span className="font-bold">EcoSolutions Inc.</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Valuation Impact:</span>
              <span className="font-bold text-red-600">-8.2%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Value Lost:</span>
              <span className="font-bold text-red-600">-$2.05M</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Top ESG Factor:</span>
              <span className="font-medium">Carbon Emissions (-4.2%)</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Valuation Impact by Company</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={filteredCompanies}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  label={{ value: 'Impact (%)', angle: -90, position: 'insideLeft', offset: -5 }}
                />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Valuation Impact']}
                />
                <Bar dataKey="value">
                  {filteredCompanies.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>ESG Impact Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Impact Weight']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>ESG Valuation Impact Detail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Initial Valuation</TableHead>
                    <TableHead>ESG-Adjusted</TableHead>
                    <TableHead>Impact (%)</TableHead>
                    <TableHead>Value Added/Lost</TableHead>
                    <TableHead>Top Risk Factor</TableHead>
                    <TableHead>Top Opportunity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.name}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>${(company.valuation / 1000000).toFixed(1)}M</TableCell>
                      <TableCell>${(company.adjustedValuation / 1000000).toFixed(1)}M</TableCell>
                      <TableCell className={`font-medium ${company.value >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {company.value >= 0 ? "+" : ""}{company.value}%
                      </TableCell>
                      <TableCell className={`font-medium ${company.value >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {company.value >= 0 ? "+" : ""}${((company.adjustedValuation - company.valuation) / 1000000).toFixed(2)}M
                      </TableCell>
                      <TableCell>
                        {company.value < 0 ? "Carbon Emissions" : "N/A"}
                      </TableCell>
                      <TableCell>
                        {company.value > 0 ? "Green Products" : "Renewable Energy"}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell>Total Portfolio</TableCell>
                    <TableCell>${(initialValuation / 1000000).toFixed(1)}M</TableCell>
                    <TableCell>${(adjustedValuation / 1000000).toFixed(1)}M</TableCell>
                    <TableCell className={`${netImpact >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {netImpact >= 0 ? "+" : ""}{netImpact.toFixed(1)}%
                    </TableCell>
                    <TableCell className={`${netImpact >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {adjustedValuation - initialValuation >= 0 ? "+" : ""}${((adjustedValuation - initialValuation) / 1000000).toFixed(2)}M
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

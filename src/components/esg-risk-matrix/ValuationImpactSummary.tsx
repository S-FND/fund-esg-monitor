import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { CalculationDetailsDialog } from "./CalculationDetailsDialog";
import { TooltipProvider, Tooltip as UITooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [calculationDetails, setCalculationDetails] = useState({
    title: "",
    calculation: "",
    reference: ""
  });

  const showCalculationDetails = (title: string, calculation: string, reference: string = "") => {
    setCalculationDetails({ title, calculation, reference });
    setDialogOpen(true);
  };

  // Portfolio calculation
  const portfolioCalculation = `
Initial Portfolio Value: $${(initialValuation / 1000000).toFixed(1)}M
ESG-Adjusted Value: $${(adjustedValuation / 1000000).toFixed(1)}M

Calculation Method:
${filteredCompanies.map(company => `
${company.name}:
  Initial: $${(company.valuation / 1000000).toFixed(1)}M
  ESG Impact: ${company.value >= 0 ? '+' : ''}${company.value}%
  Adjusted: $${(company.adjustedValuation / 1000000).toFixed(1)}M
  Value Change: ${(company.adjustedValuation - company.valuation) >= 0 ? '+' : ''}$${((company.adjustedValuation - company.valuation) / 1000000).toFixed(2)}M
`).join('')}

Net Portfolio Impact: 
  Value Change: $${((adjustedValuation - initialValuation) / 1000000).toFixed(2)}M
  Percentage Change: ${netImpact.toFixed(1)}%
`;

  // Company-specific calculations
  const getCompanyCalculation = (company: any) => `
Initial Valuation: $${(company.valuation / 1000000).toFixed(1)}M

ESG Impact: ${company.value}% 
- Environmental factors: ${company.value < 0 ? '-3.2%' : '+4.8%'}
- Social factors: ${company.value < 0 ? '-2.7%' : '+3.3%'}
- Governance factors: ${company.value < 0 ? '-2.3%' : '+4.3%'}

Calculation: $${(company.valuation / 1000000).toFixed(1)}M × (1 ${company.value >= 0 ? '+' : ''}${company.value / 100}) = $${(company.adjustedValuation / 1000000).toFixed(1)}M

Net Impact: ${(company.adjustedValuation - company.valuation) >= 0 ? '+' : ''}$${((company.adjustedValuation - company.valuation) / 1000000).toFixed(2)}M
`;

  // Now let's update the UI to include clickable values with calculation dialogs
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Portfolio Valuation Impact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <TooltipProvider>
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
                <button
                  onClick={() => showCalculationDetails(
                    "Portfolio Valuation Impact",
                    portfolioCalculation,
                    "Based on Q2 2024 ESG assessments and historical performance data."
                  )}
                  className={`font-bold ${netImpact >= 0 ? "text-emerald-600" : "text-red-600"} hover:underline inline-flex items-center`}
                >
                  {netImpact >= 0 ? "+" : ""}{netImpact.toFixed(1)}%
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Click for calculation details</TooltipContent>
                  </UITooltip>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Value Added/Lost:</span>
                <button
                  onClick={() => showCalculationDetails(
                    "Value Added/Lost Calculation",
                    portfolioCalculation,
                    "Based on Q2 2024 ESG assessments and historical performance data."
                  )}
                  className={`font-bold ${netImpact >= 0 ? "text-emerald-600" : "text-red-600"} hover:underline inline-flex items-center`}
                >
                  {adjustedValuation - initialValuation >= 0 ? "+" : ""}${((adjustedValuation - initialValuation) / 1000000).toFixed(2)}M
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Click for calculation details</TooltipContent>
                  </UITooltip>
                </button>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Highest Positive Impact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <TooltipProvider>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Company:</span>
                <span className="font-bold">MediTech Innovations</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Valuation Impact:</span>
                <button
                  onClick={() => showCalculationDetails(
                    "MediTech Innovations - Positive Impact",
                    getCompanyCalculation(valuationImpactByCompany.find(c => c.name === "MediTech Innovations")),
                    "Based on Q1-Q2 2024 ESG performance data and industry benchmarks."
                  )}
                  className="font-bold text-emerald-600 hover:underline inline-flex items-center"
                >
                  +12.4%
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Click for calculation details</TooltipContent>
                  </UITooltip>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Value Added:</span>
                <button
                  onClick={() => showCalculationDetails(
                    "MediTech Innovations - Value Added",
                    getCompanyCalculation(valuationImpactByCompany.find(c => c.name === "MediTech Innovations")),
                    "Based on Q1-Q2 2024 ESG performance data and industry benchmarks."
                  )}
                  className="font-bold text-emerald-600 hover:underline inline-flex items-center"
                >
                  +$3.72M
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Click for calculation details</TooltipContent>
                  </UITooltip>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Top ESG Factor:</span>
                <span className="font-medium">Green Products (+4.5%)</span>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Highest Negative Impact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <TooltipProvider>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Company:</span>
                <span className="font-bold">EcoSolutions Inc.</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Valuation Impact:</span>
                <button
                  onClick={() => showCalculationDetails(
                    "EcoSolutions Inc. - Negative Impact",
                    getCompanyCalculation(valuationImpactByCompany.find(c => c.name === "EcoSolutions Inc.")),
                    "Based on Q1-Q2 2024 ESG performance data and industry benchmarks."
                  )}
                  className="font-bold text-red-600 hover:underline inline-flex items-center"
                >
                  -8.2%
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Click for calculation details</TooltipContent>
                  </UITooltip>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Value Lost:</span>
                <button
                  onClick={() => showCalculationDetails(
                    "EcoSolutions Inc. - Value Lost",
                    getCompanyCalculation(valuationImpactByCompany.find(c => c.name === "EcoSolutions Inc.")),
                    "Based on Q1-Q2 2024 ESG performance data and industry benchmarks."
                  )}
                  className="font-bold text-red-600 hover:underline inline-flex items-center"
                >
                  -$2.05M
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Click for calculation details</TooltipContent>
                  </UITooltip>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Top ESG Factor:</span>
                <span className="font-medium">Carbon Emissions (-4.2%)</span>
              </div>
            </TooltipProvider>
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
            <TooltipProvider>
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
                          <button
                            onClick={() => showCalculationDetails(
                              `${company.name} - Impact Calculation`,
                              getCompanyCalculation(company),
                              `Based on Q1-Q2 2024 ESG performance data and ${company.name} industry benchmarks.`
                            )}
                            className={`${company.value >= 0 ? "text-emerald-600" : "text-red-600"} hover:underline inline-flex items-center`}
                          >
                            {company.value >= 0 ? "+" : ""}{company.value}%
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>Click for calculation details</TooltipContent>
                            </UITooltip>
                          </button>
                        </TableCell>
                        <TableCell className={`font-medium ${company.value >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          <button
                            onClick={() => showCalculationDetails(
                              `${company.name} - Value Change Calculation`,
                              getCompanyCalculation(company),
                              `Based on Q1-Q2 2024 ESG performance data and ${company.name} industry benchmarks.`
                            )}
                            className={`${company.value >= 0 ? "text-emerald-600" : "text-red-600"} hover:underline inline-flex items-center`}
                          >
                            {company.value >= 0 ? "+" : ""}${((company.adjustedValuation - company.valuation) / 1000000).toFixed(2)}M
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>Click for calculation details</TooltipContent>
                            </UITooltip>
                          </button>
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
                        <button
                          onClick={() => showCalculationDetails(
                            "Portfolio Total Impact",
                            portfolioCalculation,
                            "Based on aggregated Q1-Q2 2024 ESG performance data across all companies."
                          )}
                          className={`${netImpact >= 0 ? "text-emerald-600" : "text-red-600"} hover:underline inline-flex items-center`}
                        >
                          {netImpact >= 0 ? "+" : ""}{netImpact.toFixed(1)}%
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>Click for calculation details</TooltipContent>
                          </UITooltip>
                        </button>
                      </TableCell>
                      <TableCell className={`${netImpact >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        <button
                          onClick={() => showCalculationDetails(
                            "Portfolio Total Value Change",
                            portfolioCalculation,
                            "Based on aggregated Q1-Q2 2024 ESG performance data across all companies."
                          )}
                          className={`${netImpact >= 0 ? "text-emerald-600" : "text-red-600"} hover:underline inline-flex items-center`}
                        >
                          {adjustedValuation - initialValuation >= 0 ? "+" : ""}${((adjustedValuation - initialValuation) / 1000000).toFixed(2)}M
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>Click for calculation details</TooltipContent>
                          </UITooltip>
                        </button>
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>

      <CalculationDetailsDialog 
        open={dialogOpen}
        setOpen={setDialogOpen}
        title={calculationDetails.title}
        calculation={calculationDetails.calculation}
        reference={calculationDetails.reference}
      />
    </>
  );
}

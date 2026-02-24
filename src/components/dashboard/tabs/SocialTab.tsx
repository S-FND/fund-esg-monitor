// components/dashboard/tabs/SocialTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users } from "lucide-react";
import { useEffect, useState } from "react";

interface SocialTabProps {
  data?: any;
  selectedPortfolio?: string;
  dashboardTopics?: string[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4', '#45B7D1'];

const shouldShowTopic = (topicId: string, dashboardTopics: string[] = []): boolean => {
  if (!dashboardTopics || dashboardTopics.length === 0) {
    return true;
  }
  return dashboardTopics.includes(topicId);
};

// Empty data placeholder for when no data exists
const getEmptyPieData = () => [{ name: 'No Data Available', value: 100 }];
const getEmptyBarData = () => [{ category: 'No Data Available', value: 0 }];

export function SocialTab({ 
  data, 
  selectedPortfolio = "fundwise",
  dashboardTopics = [] 
}: SocialTabProps) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  useEffect(() => {
    // ALL possible social topics (18 topics)
    const allSocialTopics = [
      'key_persons', 'rnd_percentage', 'gross_wages', 'wellbeing_measures', 'supply_partner',
      'employee_diversity', 'workers_diversity', 'differently_abled', 'workers_differently_abled',
      'minimum_wages', 'workers_minimum_wages', 'life_coverage', 'workers_life_coverage',
      'accident_insurance', 'workers_accident_insurance', 'greivances', 'safety_incidents', 'turnover_rate'
    ];
    
    const activeSocialTopics = allSocialTopics.filter(topic => dashboardTopics.includes(topic));
    setSelectedTopics(activeSocialTopics);
    
    console.log('Active social topics:', activeSocialTopics);
  }, [dashboardTopics]);

  const formatPieData = (pieData: any, topicId: string) => {
    if (dashboardTopics.includes(topicId) && (!pieData || !pieData?.pie?.data?.some((v: number) => v > 0))) {
      return getEmptyPieData();
    }
    
    const labels = pieData?.pie?.labels || [];
    const values = pieData?.pie?.data || [];
    
    const formattedData = labels.map((label: string, index: number) => ({
      name: label,
      value: values[index] || 0
    })).filter(item => item.value > 0);
    
    return formattedData.length > 0 ? formattedData : getEmptyPieData();
  };

  const formatBarData = (barData: any, topicId: string) => {
    if (dashboardTopics.includes(topicId) && (!barData?.mbar?.xAxis?.length || !barData?.mbar?.series?.some((s: any) => s.data?.some((v: number) => v > 0)))) {
      return [{ category: 'No Data Available', value: 0 }];
    }
    
    const xAxis = barData?.mbar?.xAxis || [];
    const series = barData?.mbar?.series || [];
    
    if (xAxis.length === 0 || series.length === 0) {
      return [{ category: 'No Data Available', value: 0 }];
    }
    
    return xAxis.map((category: string, index: number) => {
      const row: any = { category };
      series.forEach((s: any) => {
        row[s.name] = s.data?.[index] || 0;
      });
      return row;
    });
  };

  const getCardTitle = (key: string) => {
    const titles: Record<string, string> = {
      key_persons: "Key Managerial Personnel (in number)",
      rnd_percentage: "R&D and CAPEX Investments (in percentage)",
      gross_wages: "Female Gross Wages (amount in INR)",
      wellbeing_measures: "Employees well-being spent (amount in INR)",
      supply_partner: "ESG Screened Suppliers (in number)",
      employee_diversity: "Employee Diversity (in number)",
      workers_diversity: "Workers Diversity (in number)",
      differently_abled: "Differently Abled Employees (in number)",
      workers_differently_abled: "Differently Abled Workers (in number)",
      minimum_wages: "Minimum Wages - Employees (in number)",
      workers_minimum_wages: "Minimum Wages - Workers (in number)",
      life_coverage: "Life Insurance - Employees (in number)",
      workers_life_coverage: "Life Insurance - Workers (in number)",
      accident_insurance: "Accident Insurance - Employees (in number)",
      workers_accident_insurance: "Accident Insurance - Workers (in number)",
      greivances: "Complaints/Grievances (in number)",
      safety_incidents: "Safety Related Incidents (in number)",
      turnover_rate: "Turnover Rate (in percentage)",
    };
    return titles[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-4">
      {/* Show active topics indicator when filtering is active */}
      {dashboardTopics.length > 0 && selectedTopics.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            <span className="font-medium">Active Social Topics ({selectedTopics.length}):</span> {selectedTopics.join(' • ')}
          </p>
        </div>
      )}

      {/* Show message when no topics selected but we're in fundwise with specific fund */}
      {dashboardTopics.length > 0 && selectedTopics.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-lg">No social topics selected</p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                This fund has no social metrics configured in dashboard topics
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show all cards when dashboardTopics is empty OR when there are selected topics */}
      {(dashboardTopics.length === 0 || selectedTopics.length > 0) && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Persons */}
            {shouldShowTopic('key_persons', dashboardTopics) && (
              <Card className={!data?.key_persons?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>{getCardTitle('key_persons')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formatPieData(data?.key_persons, 'key_persons')}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatPieData(data?.key_persons, 'key_persons').map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {!data?.key_persons?.pie?.data?.some((v: number) => v > 0) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Employee Diversity */}
            {shouldShowTopic('employee_diversity', dashboardTopics) && (
              <Card className={!data?.employee_diversity?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>{getCardTitle('employee_diversity')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formatPieData(data?.employee_diversity, 'employee_diversity')}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatPieData(data?.employee_diversity, 'employee_diversity').map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {!data?.employee_diversity?.pie?.data?.some((v: number) => v > 0) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Workers Diversity */}
            {shouldShowTopic('workers_diversity', dashboardTopics) && (
              <Card className={!data?.workers_diversity?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>{getCardTitle('workers_diversity')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formatPieData(data?.workers_diversity, 'workers_diversity')}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatPieData(data?.workers_diversity, 'workers_diversity').map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {!data?.workers_diversity?.pie?.data?.some((v: number) => v > 0) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Differently Abled Employees */}
            {shouldShowTopic('differently_abled', dashboardTopics) && (
              <Card className={!data?.differently_abled?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>{getCardTitle('differently_abled')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formatPieData(data?.differently_abled, 'differently_abled')}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatPieData(data?.differently_abled, 'differently_abled').map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {!data?.differently_abled?.pie?.data?.some((v: number) => v > 0) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Workers Differently Abled */}
            {shouldShowTopic('workers_differently_abled', dashboardTopics) && (
              <Card className={!data?.workers_differently_abled?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>{getCardTitle('workers_differently_abled')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formatPieData(data?.workers_differently_abled, 'workers_differently_abled')}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatPieData(data?.workers_differently_abled, 'workers_differently_abled').map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {!data?.workers_differently_abled?.pie?.data?.some((v: number) => v > 0) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Minimum Wages */}
            {shouldShowTopic('minimum_wages', dashboardTopics) && (
              <Card className={!data?.minimum_wages?.mbar?.series?.some((s: any) => s.data?.some((v: number) => v > 0)) ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>{getCardTitle('minimum_wages')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={formatBarData(data?.minimum_wages, 'minimum_wages')}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" angle={-45} textAnchor="end" height={70} interval={0} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {data?.minimum_wages?.mbar?.series?.map((series: any, index: number) => (
                        <Bar key={series.name} dataKey={series.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                      {!data?.minimum_wages?.mbar?.series?.length && (
                        <Bar dataKey="value" fill="#e5e7eb" />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                  {!data?.minimum_wages?.mbar?.series?.some((s: any) => s.data?.some((v: number) => v > 0)) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Workers Minimum Wages */}
            {shouldShowTopic('workers_minimum_wages', dashboardTopics) && (
              <Card className={!data?.workers_minimum_wages?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>{getCardTitle('workers_minimum_wages')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formatPieData(data?.workers_minimum_wages, 'workers_minimum_wages')}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatPieData(data?.workers_minimum_wages, 'workers_minimum_wages').map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {!data?.workers_minimum_wages?.pie?.data?.some((v: number) => v > 0) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Life Coverage */}
            {shouldShowTopic('life_coverage', dashboardTopics) && (
              <Card className={!data?.life_coverage?.mbar?.series?.some((s: any) => s.data?.some((v: number) => v > 0)) ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>{getCardTitle('life_coverage')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={formatBarData(data?.life_coverage, 'life_coverage')}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" angle={-45} textAnchor="end" height={70} interval={0} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {data?.life_coverage?.mbar?.series?.map((series: any, index: number) => (
                        <Bar key={series.name} dataKey={series.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                      {!data?.life_coverage?.mbar?.series?.length && (
                        <Bar dataKey="value" fill="#e5e7eb" />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                  {!data?.life_coverage?.mbar?.series?.some((s: any) => s.data?.some((v: number) => v > 0)) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Workers Life Coverage */}
            {shouldShowTopic('workers_life_coverage', dashboardTopics) && (
              <Card className={!data?.workers_life_coverage?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>{getCardTitle('workers_life_coverage')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formatPieData(data?.workers_life_coverage, 'workers_life_coverage')}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatPieData(data?.workers_life_coverage, 'workers_life_coverage').map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {!data?.workers_life_coverage?.pie?.data?.some((v: number) => v > 0) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Accident Insurance */}
            {shouldShowTopic('accident_insurance', dashboardTopics) && (
              <Card className={!data?.accident_insurance?.mbar?.series?.some((s: any) => s.data?.some((v: number) => v > 0)) ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>{getCardTitle('accident_insurance')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={formatBarData(data?.accident_insurance, 'accident_insurance')}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" angle={-45} textAnchor="end" height={70} interval={0} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {data?.accident_insurance?.mbar?.series?.map((series: any, index: number) => (
                        <Bar key={series.name} dataKey={series.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                      {!data?.accident_insurance?.mbar?.series?.length && (
                        <Bar dataKey="value" fill="#e5e7eb" />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                  {!data?.accident_insurance?.mbar?.series?.some((s: any) => s.data?.some((v: number) => v > 0)) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Workers Accident Insurance */}
            {shouldShowTopic('workers_accident_insurance', dashboardTopics) && (
              <Card className={!data?.workers_accident_insurance?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>{getCardTitle('workers_accident_insurance')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formatPieData(data?.workers_accident_insurance, 'workers_accident_insurance')}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatPieData(data?.workers_accident_insurance, 'workers_accident_insurance').map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {!data?.workers_accident_insurance?.pie?.data?.some((v: number) => v > 0) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* R&D Percentage */}
            {shouldShowTopic('rnd_percentage', dashboardTopics) && (
              <Card className={!data?.rnd_percentage?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>{getCardTitle('rnd_percentage')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formatPieData(data?.rnd_percentage, 'rnd_percentage')}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatPieData(data?.rnd_percentage, 'rnd_percentage').map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {!data?.rnd_percentage?.pie?.data?.some((v: number) => v > 0) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Gross Wages */}
            {shouldShowTopic('gross_wages', dashboardTopics) && (
              <Card className={!data?.gross_wages?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>{getCardTitle('gross_wages')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formatPieData(data?.gross_wages, 'gross_wages')}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatPieData(data?.gross_wages, 'gross_wages').map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {!data?.gross_wages?.pie?.data?.some((v: number) => v > 0) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Wellbeing Measures */}
            {shouldShowTopic('wellbeing_measures', dashboardTopics) && (
              <Card className={!data?.wellbeing_measures?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>{getCardTitle('wellbeing_measures')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formatPieData(data?.wellbeing_measures, 'wellbeing_measures')}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatPieData(data?.wellbeing_measures, 'wellbeing_measures').map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {!data?.wellbeing_measures?.pie?.data?.some((v: number) => v > 0) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Supply Partner */}
            {shouldShowTopic('supply_partner', dashboardTopics) && (
              <Card className={!data?.supply_partner?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>{getCardTitle('supply_partner')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formatPieData(data?.supply_partner, 'supply_partner')}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatPieData(data?.supply_partner, 'supply_partner').map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {!data?.supply_partner?.pie?.data?.some((v: number) => v > 0) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Grievances */}
          {shouldShowTopic('greivances', dashboardTopics) && (
            <Card className={!data?.greivances?.mbar?.xAxis?.length ? "opacity-70" : ""}>
              <CardHeader>
                <CardTitle>{getCardTitle('greivances')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={formatBarData(data?.greivances, 'greivances')}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={70} interval={0} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {data?.greivances?.mbar?.series?.map((series: any, index: number) => (
                      <Bar key={series.name} dataKey={series.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                    {!data?.greivances?.mbar?.series?.length && (
                      <Bar dataKey="value" fill="#e5e7eb" />
                    )}
                  </BarChart>
                </ResponsiveContainer>
                {!data?.greivances?.mbar?.xAxis?.length && (
                  <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Safety Incidents */}
          {shouldShowTopic('safety_incidents', dashboardTopics) && (
            <Card className={!data?.safety_incidents?.mbar?.xAxis?.length ? "opacity-70" : ""}>
              <CardHeader>
                <CardTitle>{getCardTitle('safety_incidents')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={formatBarData(data?.safety_incidents, 'safety_incidents')}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={70} interval={0} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {data?.safety_incidents?.mbar?.series?.map((series: any, index: number) => (
                      <Bar key={series.name} dataKey={series.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                    {!data?.safety_incidents?.mbar?.series?.length && (
                      <Bar dataKey="value" fill="#e5e7eb" />
                    )}
                  </BarChart>
                </ResponsiveContainer>
                {!data?.safety_incidents?.mbar?.xAxis?.length && (
                  <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Turnover Rate */}
          {shouldShowTopic('turnover_rate', dashboardTopics) && (
            <Card className={!data?.turnover_rate?.mbar?.xAxis?.length ? "opacity-70" : ""}>
              <CardHeader>
                <CardTitle>{getCardTitle('turnover_rate')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={formatBarData(data?.turnover_rate, 'turnover_rate')}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={70} interval={0} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {data?.turnover_rate?.mbar?.series?.map((series: any, index: number) => (
                      <Bar key={series.name} dataKey={series.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                    {!data?.turnover_rate?.mbar?.series?.length && (
                      <Bar dataKey="value" fill="#e5e7eb" />
                    )}
                  </BarChart>
                </ResponsiveContainer>
                {!data?.turnover_rate?.mbar?.xAxis?.length && (
                  <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
// components/dashboard/tabs/EnvironmentTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Leaf } from "lucide-react";
import { useEffect, useState } from "react";

interface EnvironmentTabProps {
  data?: any;
  selectedPortfolio?: string;
  dashboardTopics?: string[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4', '#45B7D1'];

// Helper function to check if a topic should be shown
const shouldShowTopic = (topicId: string, dashboardTopics: string[] = []): boolean => {
  if (!dashboardTopics || dashboardTopics.length === 0) {
    return true; // Show all topics when no filters are applied
  }
  return dashboardTopics.includes(topicId);
};

// Empty data placeholder for when no data exists
const getEmptyPieData = () => [{ name: 'No Data Available', value: 100 }];
const getEmptyBarData = () => [{ name: 'No Data Available', value: 0 }];
const getEmptyMatrixData = () => [{ category: 'No Data Available', value: 0 }];

export function EnvironmentTab({ 
  data, 
  selectedPortfolio = "fundwise",
  dashboardTopics = [] 
}: EnvironmentTabProps) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  useEffect(() => {
    // Get all environment topics that are selected in dashboardTopics
    const environmentTopics = [
      'energy', 'energy_consumption', 'water_withdrawl', 'water_discharge', 
      'waste_management', 'waste_recovery', 'gh_gas_emission', 'air_emission', 
      'disposal_method'
    ];
    
    const activeEnvironmentTopics = environmentTopics.filter(topic => dashboardTopics.includes(topic));
    setSelectedTopics(activeEnvironmentTopics);
    
    console.log('Active environment topics:', activeEnvironmentTopics);
    console.log('Original dashboardTopics:', dashboardTopics);
  }, [dashboardTopics]);

  const formatPieData = (pieData: any) => {
    const labels = pieData?.pie?.labels || pieData?.labels || [];
    const values = pieData?.pie?.data || pieData?.data || [];
    
    const formattedData = labels.map((label: string, index: number) => ({
      name: label,
      value: values[index] || 0
    })).filter(item => item.value > 0);
    
    return formattedData.length > 0 ? formattedData : getEmptyPieData();
  };

  const formatBarData = (barData: any) => {
    const labels = barData?.bar?.labels || barData?.labels || [];
    const datasets = barData?.bar?.datasets || barData?.datasets || [];
    
    if (!labels.length || !datasets.length) {
      return getEmptyBarData();
    }
    
    return labels.map((label: string, index: number) => {
      const item: any = { name: label };
      datasets.forEach((dataset: any) => {
        item[dataset.label] = dataset.data?.[index] || 0;
      });
      return item;
    });
  };

  const formatMatrixData = (matrixData: any) => {
    const xAxisLabels = matrixData?.xAxisLabels || [];
    const yAxisLabels = matrixData?.yAxisLabels || [];
    const matrix = matrixData?.data || [];
    
    if (!xAxisLabels.length) {
      return getEmptyMatrixData();
    }
    
    return xAxisLabels.map((label: string, xIndex: number) => {
      const row: any = { category: label };
      yAxisLabels.forEach((yLabel: string, yIndex: number) => {
        row[yLabel] = matrix[xIndex]?.[yIndex] || 0;
      });
      return row;
    });
  };

  return (
    <div className="space-y-4">
      {/* Show active topics indicator when filtering is active */}
      {dashboardTopics.length > 0 && selectedTopics.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            <span className="font-medium">Active Environment Topics:</span> {selectedTopics.join(' • ')}
          </p>
        </div>
      )}

      {/* Show message when no topics selected but we're in fundwise with specific fund */}
      {dashboardTopics.length > 0 && selectedTopics.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Leaf className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-lg">No environment topics selected</p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                This fund has no environment metrics configured in dashboard topics
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show all cards when dashboardTopics is empty OR when there are selected topics */}
      {(dashboardTopics.length === 0 || selectedTopics.length > 0) && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ENERGY SOURCES - Pie Chart */}
            {shouldShowTopic('energy', dashboardTopics) && (
              <Card className={!data?.energy?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>⚡ Energy Sources (in percentage)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formatPieData(data?.energy)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatPieData(data?.energy).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {!data?.energy?.pie?.data?.some((v: number) => v > 0) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ENERGY CONSUMPTION - Bar Chart */}
            {shouldShowTopic('energy_consumption', dashboardTopics) && (
              <Card className={!data?.energy?.bar?.datasets?.some((d: any) => d.data?.some((v: number) => v > 0)) ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>📊 Energy Consumption (in GJ)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={formatBarData(data?.energy)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} interval={0} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {data?.energy?.bar?.datasets?.map((dataset: any, index: number) => (
                        <Bar key={dataset.label} dataKey={dataset.label} fill={COLORS[index % COLORS.length]} />
                      ))}
                      {!data?.energy?.bar?.datasets?.length && (
                        <Bar dataKey="value" fill="#e5e7eb" />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                  {!data?.energy?.bar?.datasets?.some((d: any) => d.data?.some((v: number) => v > 0)) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Water Withdrawal */}
            {shouldShowTopic('water_withdrawl', dashboardTopics) && (
              <Card className={!data?.water_withdrawl?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>💧 Water Withdrawal (in kilolitres)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formatPieData(data?.water_withdrawl)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatPieData(data?.water_withdrawl).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {!data?.water_withdrawl?.pie?.data?.some((v: number) => v > 0) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Water Discharge */}
            {shouldShowTopic('water_discharge', dashboardTopics) && (
              <Card className={!data?.water_discharge?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>💧 Water Discharge (in kilolitres)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formatPieData(data?.water_discharge)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatPieData(data?.water_discharge).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {!data?.water_discharge?.pie?.data?.some((v: number) => v > 0) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Waste Management */}
            {shouldShowTopic('waste_management', dashboardTopics) && (
              <Card className={!data?.waste_management?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>🗑️ Waste Generation (in metric tonnes)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formatPieData(data?.waste_management)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatPieData(data?.waste_management).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {!data?.waste_management?.pie?.data?.some((v: number) => v > 0) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* GHG Emissions */}
            {shouldShowTopic('gh_gas_emission', dashboardTopics) && (
              <Card className={!data?.gh_gas_emission?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>🌫️ GHG Emissions (in metric tonnes)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formatPieData(data?.gh_gas_emission)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatPieData(data?.gh_gas_emission).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {!data?.gh_gas_emission?.pie?.data?.some((v: number) => v > 0) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Air Emissions */}
            {shouldShowTopic('air_emission', dashboardTopics) && (
              <Card className={!data?.air_emission?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>🏭 Air Emissions (in metric tonnes)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formatPieData(data?.air_emission)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatPieData(data?.air_emission).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {!data?.air_emission?.pie?.data?.some((v: number) => v > 0) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Waste Recovery */}
          {shouldShowTopic('waste_recovery', dashboardTopics) && (
            <Card className={!data?.waste_recovery?.xAxisLabels?.length ? "opacity-70" : ""}>
              <CardHeader>
                <CardTitle>🔄 Waste Recovery (in metric tonnes)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={formatMatrixData(data?.waste_recovery)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={70} interval={0} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {data?.waste_recovery?.yAxisLabels?.map((label: string, index: number) => (
                      <Bar key={label} dataKey={label} fill={COLORS[index % COLORS.length]} />
                    ))}
                    {!data?.waste_recovery?.yAxisLabels?.length && (
                      <Bar dataKey="value" fill="#e5e7eb" />
                    )}
                  </BarChart>
                </ResponsiveContainer>
                {!data?.waste_recovery?.xAxisLabels?.length && (
                  <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Disposal Method */}
          {shouldShowTopic('disposal_method', dashboardTopics) && (
            <Card className={!data?.disposal_method?.xAxisLabels?.length ? "opacity-70" : ""}>
              <CardHeader>
                <CardTitle>🗑️ Waste Disposal (in metric tonnes)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={formatMatrixData(data?.disposal_method)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={70} interval={0} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {data?.disposal_method?.yAxisLabels?.map((label: string, index: number) => (
                      <Bar key={label} dataKey={label} fill={COLORS[index % COLORS.length]} />
                    ))}
                    {!data?.disposal_method?.yAxisLabels?.length && (
                      <Bar dataKey="value" fill="#e5e7eb" />
                    )}
                  </BarChart>
                </ResponsiveContainer>
                {!data?.disposal_method?.xAxisLabels?.length && (
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
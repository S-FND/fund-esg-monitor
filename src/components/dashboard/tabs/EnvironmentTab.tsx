// components/dashboard/tabs/EnvironmentTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface EnvironmentTabProps {
  data?: {
    energy?: {
      pie?: {
        labels?: string[];
        data?: number[];
      };
      bar?: {
        labels?: string[];
        datasets?: Array<{
          label: string;
          data: number[];
        }>;
      };
    };
    water_withdrawl?: {
      pie?: {
        labels?: string[];
        data?: number[];
      };
    };
    water_discharge?: {
      pie?: {
        labels?: string[];
        data?: number[];
      };
    };
    waste_management?: {
      pie?: {
        labels?: string[];
        data?: number[];
      };
    };
    waste_recovery?: {
      xAxisLabels?: string[];
      yAxisLabels?: string[];
      data?: number[][];
    };
    gh_gas_emission?: {
      pie?: {
        labels?: string[];
        data?: number[];
      };
    };
    air_emission?: {
      pie?: {
        labels?: string[];
        data?: number[];
      };
    };
    disposal_method?: {
      xAxisLabels?: string[];
      yAxisLabels?: string[];
      data?: number[][];
    };
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4', '#45B7D1'];

export function EnvironmentTab({ data }: EnvironmentTabProps) {
  console.log('EnvironmentTab received data:', data);

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No environment data available</p>
        </CardContent>
      </Card>
    );
  }

  const hasData = (pieData: any) => {
    return pieData?.data?.some((value: number) => value > 0);
  };

  const formatPieData = (labels: string[] = [], values: number[] = []) => {
    return labels.map((label, index) => ({
      name: label,
      value: values[index] || 0
    }));
  };

  const formatBarData = (labels: string[] = [], datasets: any[] = []) => {
    if (!labels.length || !datasets.length) return [];
    
    return labels.map((label, index) => {
      const item: any = { name: label };
      datasets.forEach((dataset) => {
        item[dataset.label] = dataset.data?.[index] || 0;
      });
      return item;
    });
  };

  const formatRecoveryData = (xAxisLabels: string[] = [], yAxisLabels: string[] = [], matrix: number[][] = []) => {
    return xAxisLabels.map((label, xIndex) => {
      const row: any = { category: label };
      yAxisLabels.forEach((yLabel, yIndex) => {
        row[yLabel] = matrix[xIndex]?.[yIndex] || 0;
      });
      return row;
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Energy Sources */}
        {hasData(data.energy?.pie) && (
          <Card>
            <CardHeader>
              <CardTitle>Energy Sources (in percentage)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatPieData(data.energy?.pie?.labels, data.energy?.pie?.data)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {formatPieData(data.energy?.pie?.labels, data.energy?.pie?.data).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Water Withdrawal */}
        {hasData(data.water_withdrawl?.pie) && (
          <Card>
            <CardHeader>
              <CardTitle>Water Withdrawal (in kilolitres)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatPieData(data.water_withdrawl?.pie?.labels, data.water_withdrawl?.pie?.data)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {formatPieData(data.water_withdrawl?.pie?.labels, data.water_withdrawl?.pie?.data).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Waste Management */}
        {hasData(data.waste_management?.pie) && (
          <Card>
            <CardHeader>
              <CardTitle>Waste Generation (in metric tonnes)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatPieData(data.waste_management?.pie?.labels, data.waste_management?.pie?.data)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {formatPieData(data.waste_management?.pie?.labels, data.waste_management?.pie?.data).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* GHG Emissions */}
        {hasData(data.gh_gas_emission?.pie) && (
          <Card>
            <CardHeader>
              <CardTitle>GHG Emissions (in metric tonnes)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatPieData(data.gh_gas_emission?.pie?.labels, data.gh_gas_emission?.pie?.data)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {formatPieData(data.gh_gas_emission?.pie?.labels, data.gh_gas_emission?.pie?.data).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Waste Recovery */}
      {data.waste_recovery?.xAxisLabels && data.waste_recovery?.xAxisLabels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Waste Recovery (in metric tonnes)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={formatRecoveryData(
                  data.waste_recovery.xAxisLabels,
                  data.waste_recovery.yAxisLabels || [],
                  data.waste_recovery.data || []
                )}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={70} interval={0} />
                <YAxis />
                <Tooltip />
                <Legend />
                {data.waste_recovery.yAxisLabels?.map((label, index) => (
                  <Bar key={label} dataKey={label} fill={COLORS[index % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Disposal Method */}
      {data.disposal_method?.xAxisLabels && data.disposal_method?.xAxisLabels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Waste Disposal (in metric tonnes)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={formatRecoveryData(
                  data.disposal_method.xAxisLabels,
                  data.disposal_method.yAxisLabels || [],
                  data.disposal_method.data || []
                )}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={70} interval={0} />
                <YAxis />
                <Tooltip />
                <Legend />
                {data.disposal_method.yAxisLabels?.map((label, index) => (
                  <Bar key={label} dataKey={label} fill={COLORS[index % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
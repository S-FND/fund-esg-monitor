// components/dashboard/tabs/SocialTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface SocialTabProps {
  data?: {
    key_persons?: {
      pie?: {
        labels?: string[];
        data?: number[];
      };
    };
    rnd_percentage?: {
      pie?: {
        labels?: string[];
        data?: number[];
      };
    };
    gross_wages?: {
      pie?: {
        labels?: string[];
        data?: number[];
      };
    };
    wellbeing_measures?: {
      pie?: {
        labels?: string[];
        data?: number[];
      };
    };
    supply_partner?: {
      pie?: {
        labels?: string[];
        data?: number[];
      };
    };
    greivances?: {
      mbar?: {
        xAxis?: string[];
        series?: Array<{
          name: string;
          data: number[];
        }>;
      };
    };
    safety_incidents?: {
      mbar?: {
        xAxis?: string[];
        series?: Array<{
          name: string;
          data: number[];
        }>;
      };
    };
    turnover_rate?: {
      mbar?: {
        xAxis?: string[];
        series?: Array<{
          name: string;
          data: number[];
        }>;
      };
    };
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4', '#45B7D1'];

export function SocialTab({ data }: SocialTabProps) {
  console.log('SocialTab received data:', data);

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No social data available</p>
        </CardContent>
      </Card>
    );
  }

  const formatPieData = (labels: string[] = [], values: number[] = []) => {
    return labels.map((label, index) => ({
      name: label,
      value: values[index] || 0
    }));
  };

  const formatBarData = (xAxis: string[] = [], series: any[] = []) => {
    return xAxis.map((category, index) => {
      const row: any = { category };
      series.forEach((s) => {
        row[s.name] = s.data?.[index] || 0;
      });
      return row;
    });
  };

  const hasPieData = (pieData: any) => {
    return pieData?.data?.some((value: number) => value > 0);
  };

  const hasBarData = (barData: any) => {
    return barData?.xAxis?.length > 0 && barData?.series?.some((s: any) => s.data?.some((v: number) => v > 0));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Key Persons */}
        {hasPieData(data.key_persons?.pie) && (
          <Card>
            <CardHeader>
              <CardTitle>Key Managerial Personnel (in number)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatPieData(data.key_persons?.pie?.labels, data.key_persons?.pie?.data)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {formatPieData(data.key_persons?.pie?.labels, data.key_persons?.pie?.data).map((entry, index) => (
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

        {/* R&D Percentage */}
        {hasPieData(data.rnd_percentage?.pie) && (
          <Card>
            <CardHeader>
              <CardTitle>R&D and CAPEX Investments (in percentage)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatPieData(data.rnd_percentage?.pie?.labels, data.rnd_percentage?.pie?.data)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {formatPieData(data.rnd_percentage?.pie?.labels, data.rnd_percentage?.pie?.data).map((entry, index) => (
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

        {/* Gross Wages */}
        {hasPieData(data.gross_wages?.pie) && (
          <Card>
            <CardHeader>
              <CardTitle>Female Gross Wages (amount in INR)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatPieData(data.gross_wages?.pie?.labels, data.gross_wages?.pie?.data)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {formatPieData(data.gross_wages?.pie?.labels, data.gross_wages?.pie?.data).map((entry, index) => (
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

        {/* Wellbeing Measures */}
        {hasPieData(data.wellbeing_measures?.pie) && (
          <Card>
            <CardHeader>
              <CardTitle>Employees well-being spent (amount in INR)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatPieData(data.wellbeing_measures?.pie?.labels, data.wellbeing_measures?.pie?.data)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {formatPieData(data.wellbeing_measures?.pie?.labels, data.wellbeing_measures?.pie?.data).map((entry, index) => (
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

        {/* Supply Partner */}
        {hasPieData(data.supply_partner?.pie) && (
          <Card>
            <CardHeader>
              <CardTitle>ESG Screened Suppliers (in number)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatPieData(data.supply_partner?.pie?.labels, data.supply_partner?.pie?.data)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {formatPieData(data.supply_partner?.pie?.labels, data.supply_partner?.pie?.data).map((entry, index) => (
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

      {/* Grievances */}
      {hasBarData(data.greivances?.mbar) && (
        <Card>
          <CardHeader>
            <CardTitle>Complaints/Grievances (in number)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={formatBarData(data.greivances?.mbar?.xAxis, data.greivances?.mbar?.series)}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={70} interval={0} />
                <YAxis />
                <Tooltip />
                <Legend />
                {data.greivances?.mbar?.series?.map((series, index) => (
                  <Bar key={series.name} dataKey={series.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Safety Incidents */}
      {hasBarData(data.safety_incidents?.mbar) && (
        <Card>
          <CardHeader>
            <CardTitle>Safety Related Incidents (in number)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={formatBarData(data.safety_incidents?.mbar?.xAxis, data.safety_incidents?.mbar?.series)}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={70} interval={0} />
                <YAxis />
                <Tooltip />
                <Legend />
                {data.safety_incidents?.mbar?.series?.map((series, index) => (
                  <Bar key={series.name} dataKey={series.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Turnover Rate */}
      {hasBarData(data.turnover_rate?.mbar) && (
        <Card>
          <CardHeader>
            <CardTitle>Turnover Rate (in percentage)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={formatBarData(data.turnover_rate?.mbar?.xAxis, data.turnover_rate?.mbar?.series)}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={70} interval={0} />
                <YAxis />
                <Tooltip />
                <Legend />
                {data.turnover_rate?.mbar?.series?.map((series, index) => (
                  <Bar key={series.name} dataKey={series.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
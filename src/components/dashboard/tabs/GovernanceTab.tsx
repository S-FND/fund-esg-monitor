// src/components/dashboard/tabs/GovernanceTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";

interface GovernanceTabProps {
  data?: any; // Using any temporarily to debug, then we can type it properly
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
  '#8884D8', '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6'
];

export function GovernanceTab({ data }: GovernanceTabProps) {
  const [hasAnyData, setHasAnyData] = useState(false);

  useEffect(() => {
    if (data) {
      console.log('GovernanceTab received data:', data);
      
      // Check if there's any data to display
      const checkData = () => {
        // Try different possible data structures
        if (data.board_members_gender?.pie?.data?.some((v: number) => v > 0)) return true;
        if (data.board_pay_parity?.pie?.data?.some((v: number) => v > 0)) return true;
        if (data.esg_skilled?.pie?.data?.some((v: number) => v > 0)) return true;
        if (data.details_of_complaints?.pie?.data?.some((v: number) => v > 0)) return true;
        if (data.disciplinary_action?.pie?.data?.some((v: number) => v > 0)) return true;
        if (data.percentage_of_board?.pie?.data?.some((v: number) => v > 0)) return true;
        if (data.political_contributions?.pie?.data?.some((v: number) => v > 0)) return true;
        if (data.litigation_risks?.pie?.data?.some((v: number) => v > 0)) return true;
        if (data.the_ratio_of_independent?.pie?.data?.some((v: number) => v > 0)) return true;
        
        // Alternative structure (if data comes directly without .pie)
        if (data.board_members_gender?.data?.some((v: number) => v > 0)) return true;
        if (data.board_pay_parity?.data?.some((v: number) => v > 0)) return true;
        if (data.esg_skilled?.data?.some((v: number) => v > 0)) return true;
        if (data.details_of_complaints?.data?.some((v: number) => v > 0)) return true;
        if (data.disciplinary_action?.data?.some((v: number) => v > 0)) return true;
        if (data.percentage_of_board?.data?.some((v: number) => v > 0)) return true;
        if (data.political_contributions?.data?.some((v: number) => v > 0)) return true;
        if (data.litigation_risks?.data?.some((v: number) => v > 0)) return true;
        if (data.the_ratio_of_independent?.data?.some((v: number) => v > 0)) return true;
        
        return false;
      };
      
      setHasAnyData(checkData());
    }
  }, [data]);

  const formatPieData = (item: any) => {
    // Handle different possible structures
    const labels = item?.pie?.labels || item?.labels || [];
    const values = item?.pie?.data || item?.data || [];
    
    return labels.map((label: string, index: number) => ({
      name: label,
      value: values[index] || 0
    }));
  };

  const hasData = (item: any) => {
    if (!item) return false;
    
    // Check different possible structures
    const values = item?.pie?.data || item?.data || [];
    return values.some((value: number) => value > 0);
  };

  if (!hasAnyData) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground text-lg">
            No governance data available for the selected filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Board Gender Diversity */}
        {hasData(data?.board_members_gender) && (
          <Card>
            <CardHeader>
              <CardTitle>Board Gender Diversity (in percentage)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatPieData(data?.board_members_gender)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {formatPieData(data?.board_members_gender).map((entry: any, index: number) => (
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

        {/* Board Pay Parity */}
        {hasData(data?.board_pay_parity) && (
          <Card>
            <CardHeader>
              <CardTitle>Board Pay Parity (in percentage)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatPieData(data?.board_pay_parity)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {formatPieData(data?.board_pay_parity).map((entry: any, index: number) => (
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

        {/* ESG Skilled Board Members */}
        {hasData(data?.esg_skilled) && (
          <Card>
            <CardHeader>
              <CardTitle>ESG Skilled Board Members (in percentage)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatPieData(data?.esg_skilled)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {formatPieData(data?.esg_skilled).map((entry: any, index: number) => (
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

        {/* Complaints regarding conflict of interest */}
        {hasData(data?.details_of_complaints) && (
          <Card>
            <CardHeader>
              <CardTitle>Complaints - Conflict of Interest (in number)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatPieData(data?.details_of_complaints)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {formatPieData(data?.details_of_complaints).map((entry: any, index: number) => (
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

        {/* Disciplinary action for bribery/corruption */}
        {hasData(data?.disciplinary_action) && (
          <Card>
            <CardHeader>
              <CardTitle>Disciplinary Action - Bribery/Corruption (in number)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatPieData(data?.disciplinary_action)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {formatPieData(data?.disciplinary_action).map((entry: any, index: number) => (
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

        {/* Board Meeting Attendance */}
        {hasData(data?.percentage_of_board) && (
          <Card>
            <CardHeader>
              <CardTitle>Board Meeting Attendance (in percentage)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatPieData(data?.percentage_of_board)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {formatPieData(data?.percentage_of_board).map((entry: any, index: number) => (
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

        {/* Political Contributions */}
        {hasData(data?.political_contributions) && (
          <Card>
            <CardHeader>
              <CardTitle>Political Contributions (amount in INR)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatPieData(data?.political_contributions)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {formatPieData(data?.political_contributions).map((entry: any, index: number) => (
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

        {/* Litigation Risks */}
        {hasData(data?.litigation_risks) && (
          <Card>
            <CardHeader>
              <CardTitle>Litigation Risks (amount in INR)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatPieData(data?.litigation_risks)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {formatPieData(data?.litigation_risks).map((entry: any, index: number) => (
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

        {/* Ratio of Independent Directors */}
        {hasData(data?.the_ratio_of_independent) && (
          <Card>
            <CardHeader>
              <CardTitle>Independent Directors Ratio (in percentage)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatPieData(data?.the_ratio_of_independent)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {formatPieData(data?.the_ratio_of_independent).map((entry: any, index: number) => (
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
    </div>
  );
}
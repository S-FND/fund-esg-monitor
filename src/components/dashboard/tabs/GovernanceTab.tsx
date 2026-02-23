// components/dashboard/tabs/GovernanceTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";

interface GovernanceTabProps {
  data?: any;
  selectedPortfolio?: string;
  dashboardTopics?: string[];
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
  '#8884D8', '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6'
];

// Helper function to check if a topic should be shown
const shouldShowTopic = (topicId: string, dashboardTopics: string[] = []): boolean => {
  if (!dashboardTopics || dashboardTopics.length === 0) {
    return true;
  }
  return dashboardTopics.includes(topicId);
};

// Empty data placeholder for when no data exists
const getEmptyPieData = () => [{ name: 'No Data Available', value: 100 }];

export function GovernanceTab({ 
  data, 
  selectedPortfolio = "fundwise",
  dashboardTopics = [] 
}: GovernanceTabProps) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  useEffect(() => {
    // ALL 10 governance topics
    const governanceTopics = [
      'board_members_gender', 
      'board_pay_parity', 
      'esg_skilled',
      'details_of_complaints', 
      'disciplinary_action', 
      'percentageOperations',
      'the_ratio_of_independent',
      'litigation_risks', 
      'political_contributions', 
      'percentage_of_board'
    ];
    
    const activeGovernanceTopics = governanceTopics.filter(topic => dashboardTopics.includes(topic));
    setSelectedTopics(activeGovernanceTopics);
    
    console.log('Active governance topics:', activeGovernanceTopics);
  }, [dashboardTopics]);

  const formatPieData = (item: any, topicId: string) => {
    if (dashboardTopics.includes(topicId) && (!item || !item?.pie?.data?.some((v: number) => v > 0))) {
      return getEmptyPieData();
    }
    
    const labels = item?.pie?.labels || item?.labels || [];
    const values = item?.pie?.data || item?.data || [];
    
    const formattedData = labels.map((label: string, index: number) => ({
      name: label,
      value: values[index] || 0
    })).filter(item => item.value > 0);
    
    return formattedData.length > 0 ? formattedData : getEmptyPieData();
  };

  const getCardTitle = (key: string) => {
    const titles: Record<string, string> = {
      board_members_gender: "Board Gender Diversity (in percentage)",
      board_pay_parity: "Board Pay Parity (in percentage)",
      esg_skilled: "ESG Skilled Board Members (in percentage)",
      details_of_complaints: "Complaints - Conflict of Interest (in number)",
      disciplinary_action: "Disciplinary Action - Bribery/Corruption (in number)",
      percentageOperations: "Operations Percentage (in percentage)",
      percentage_of_board: "Board Meeting Attendance (in percentage)",
      political_contributions: "Political Contributions (amount in INR)",
      litigation_risks: "Litigation Risks (amount in INR)",
      the_ratio_of_independent: "Independent Directors Ratio (in percentage)",
    };
    return titles[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-4">
      {/* Show active topics indicator when filtering is active */}
      {dashboardTopics.length > 0 && selectedTopics.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            <span className="font-medium">Active Governance Topics:</span> {selectedTopics.join(' • ')}
          </p>
        </div>
      )}

      {/* Show message when no topics selected but we're in fundwise with specific fund */}
      {dashboardTopics.length > 0 && selectedTopics.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Shield className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-lg">No governance topics selected</p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                This fund has no governance metrics configured in dashboard topics
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show all cards when dashboardTopics is empty OR when there are selected topics */}
      {(dashboardTopics.length === 0 || selectedTopics.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Board Gender Diversity */}
          {shouldShowTopic('board_members_gender', dashboardTopics) && (
            <Card className={!data?.board_members_gender?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
              <CardHeader>
                <CardTitle>{getCardTitle('board_members_gender')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={formatPieData(data?.board_members_gender, 'board_members_gender')}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {formatPieData(data?.board_members_gender, 'board_members_gender').map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                {!data?.board_members_gender?.pie?.data?.some((v: number) => v > 0) && (
                  <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Board Pay Parity */}
          {shouldShowTopic('board_pay_parity', dashboardTopics) && (
            <Card className={!data?.board_pay_parity?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
              <CardHeader>
                <CardTitle>{getCardTitle('board_pay_parity')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={formatPieData(data?.board_pay_parity, 'board_pay_parity')}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {formatPieData(data?.board_pay_parity, 'board_pay_parity').map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                {!data?.board_pay_parity?.pie?.data?.some((v: number) => v > 0) && (
                  <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* ESG Skilled Board Members */}
          {shouldShowTopic('esg_skilled', dashboardTopics) && (
            <Card className={!data?.esg_skilled?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
              <CardHeader>
                <CardTitle>{getCardTitle('esg_skilled')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={formatPieData(data?.esg_skilled, 'esg_skilled')}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {formatPieData(data?.esg_skilled, 'esg_skilled').map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                {!data?.esg_skilled?.pie?.data?.some((v: number) => v > 0) && (
                  <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Complaints regarding conflict of interest */}
          {shouldShowTopic('details_of_complaints', dashboardTopics) && (
            <Card className={!data?.details_of_complaints?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
              <CardHeader>
                <CardTitle>{getCardTitle('details_of_complaints')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={formatPieData(data?.details_of_complaints, 'details_of_complaints')}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {formatPieData(data?.details_of_complaints, 'details_of_complaints').map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                {!data?.details_of_complaints?.pie?.data?.some((v: number) => v > 0) && (
                  <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Disciplinary action for bribery/corruption */}
          {shouldShowTopic('disciplinary_action', dashboardTopics) && (
            <Card className={!data?.disciplinary_action?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
              <CardHeader>
                <CardTitle>{getCardTitle('disciplinary_action')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={formatPieData(data?.disciplinary_action, 'disciplinary_action')}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {formatPieData(data?.disciplinary_action, 'disciplinary_action').map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                {!data?.disciplinary_action?.pie?.data?.some((v: number) => v > 0) && (
                  <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Operations Percentage */}
          {shouldShowTopic('percentageOperations', dashboardTopics) && (
            <Card className={!data?.percentageOperations?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
              <CardHeader>
                <CardTitle>{getCardTitle('percentageOperations')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={formatPieData(data?.percentageOperations, 'percentageOperations')}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {formatPieData(data?.percentageOperations, 'percentageOperations').map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                {!data?.percentageOperations?.pie?.data?.some((v: number) => v > 0) && (
                  <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Board Meeting Attendance */}
          {shouldShowTopic('percentage_of_board', dashboardTopics) && (
            <Card className={!data?.percentage_of_board?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
              <CardHeader>
                <CardTitle>{getCardTitle('percentage_of_board')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={formatPieData(data?.percentage_of_board, 'percentage_of_board')}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {formatPieData(data?.percentage_of_board, 'percentage_of_board').map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                {!data?.percentage_of_board?.pie?.data?.some((v: number) => v > 0) && (
                  <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Political Contributions */}
          {shouldShowTopic('political_contributions', dashboardTopics) && (
            <Card className={!data?.political_contributions?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
              <CardHeader>
                <CardTitle>{getCardTitle('political_contributions')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={formatPieData(data?.political_contributions, 'political_contributions')}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {formatPieData(data?.political_contributions, 'political_contributions').map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                {!data?.political_contributions?.pie?.data?.some((v: number) => v > 0) && (
                  <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Litigation Risks */}
          {shouldShowTopic('litigation_risks', dashboardTopics) && (
            <Card className={!data?.litigation_risks?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
              <CardHeader>
                <CardTitle>{getCardTitle('litigation_risks')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={formatPieData(data?.litigation_risks, 'litigation_risks')}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {formatPieData(data?.litigation_risks, 'litigation_risks').map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                {!data?.litigation_risks?.pie?.data?.some((v: number) => v > 0) && (
                  <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Ratio of Independent Directors */}
          {shouldShowTopic('the_ratio_of_independent', dashboardTopics) && (
            <Card className={!data?.the_ratio_of_independent?.pie?.data?.some((v: number) => v > 0) ? "opacity-70" : ""}>
              <CardHeader>
                <CardTitle>{getCardTitle('the_ratio_of_independent')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={formatPieData(data?.the_ratio_of_independent, 'the_ratio_of_independent')}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {formatPieData(data?.the_ratio_of_independent, 'the_ratio_of_independent').map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'No Data Available' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                {!data?.the_ratio_of_independent?.pie?.data?.some((v: number) => v > 0) && (
                  <p className="text-xs text-center text-muted-foreground mt-2">No data available for this metric</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
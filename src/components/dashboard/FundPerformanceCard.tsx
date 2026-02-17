// components/dashboard/FundPerformanceCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface FundPerformanceCardProps {
  data?: Array<{
    name: string;
    environmental: number;
    social: number;
    governance: number;
  }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="h-2 w-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.name}:</span>
            <span className="font-medium">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function FundPerformanceCard({ data }: FundPerformanceCardProps) {
  const defaultData = [
    { name: "Sample Fund I", environmental: 85, social: 75, governance: 80 },
    { name: "Dummy Private Limited", environmental: 78, social: 82, governance: 75 },
    { name: "Health Ventures", environmental: 92, social: 88, governance: 90 }
  ];

  const chartData = data || defaultData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>ESG Performance by Fund</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                label={{ value: 'Score', angle: -90, position: 'insideLeft', offset: -5 }}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="environmental" name="Environmental" fill="#22c55e" />
              <Bar dataKey="social" name="Social" fill="#3b82f6" />
              <Bar dataKey="governance" name="Governance" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
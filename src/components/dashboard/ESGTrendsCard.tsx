// components/dashboard/ESGTrendsCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ESGTrendsCardProps {
  data?: Array<{
    year: string;
    environmental: number;
    social: number;
    governance: number;
    overall: number;
  }>;
}

// Simple inline tooltip component
const SimpleTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: entry.color, borderRadius: '50%' }} />
            <span style={{ marginRight: '8px' }}>{entry.name}:</span>
            <span style={{ fontWeight: 'bold' }}>{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function ESGTrendsCard({ data }: ESGTrendsCardProps) {
  const defaultData = [
    { year: "2021-2022", environmental: 65, social: 60, governance: 70, overall: 65 },
    { year: "2022-2023", environmental: 70, social: 68, governance: 75, overall: 71 },
    { year: "2023-2024", environmental: 75, social: 73, governance: 80, overall: 76 },
    { year: "2024-2025", environmental: 82, social: 78, governance: 85, overall: 82 },
    { year: "2025-2026", environmental: 88, social: 85, governance: 90, overall: 88 }
  ];

  const chartData = data || defaultData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>ESG Performance Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis domain={[0, 100]} label={{ value: 'Score', angle: -90, position: 'insideLeft', offset: -5 }} />
              <Tooltip content={<SimpleTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="environmental" name="Environmental" stroke="#22c55e" strokeWidth={2} />
              <Line type="monotone" dataKey="social" name="Social" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="governance" name="Governance" stroke="#8b5cf6" strokeWidth={2} />
              <Line type="monotone" dataKey="overall" name="Overall ESG" stroke="#f43f5e" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
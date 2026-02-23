// components/dashboard/ESGTrendsCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface ESGTrendsCardProps {
  data?: Array<{
    year: string;
    environmental: number;
    social: number;
    governance: number;
    overall: number;
  }>;
  selectedPortfolio?: string;
}

const SimpleTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>{entry.name}:</span>
            <span className="font-medium">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function ESGTrendsCard({ 
  data, 
  selectedPortfolio = "fundwise" 
}: ESGTrendsCardProps) {
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    setHasData(data && data.length > 0);
  }, [data]);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            ESG Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No trend data available</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {selectedPortfolio === "fundwise" 
                ? "Select a fund to view historical ESG performance trends" 
                : "Select a company to view historical ESG performance trends"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          ESG Performance Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
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
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Showing trend data for {data.length} {data.length === 1 ? 'year' : 'years'}
        </p>
      </CardContent>
    </Card>
  );
}
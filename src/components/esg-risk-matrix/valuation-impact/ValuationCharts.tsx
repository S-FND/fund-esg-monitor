
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { PieChartData, ValuationCompanyData } from "./types";
import { pieTooltipFormatter, valuationTooltipFormatter } from "./utils";

interface ValuationBarChartProps {
  companies: ValuationCompanyData[];
  title: string;
}

export function ValuationBarChart({ companies, title }: ValuationBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={companies}
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
            <Tooltip formatter={valuationTooltipFormatter} />
            <Bar dataKey="value">
              {companies.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface ValuationPieChartProps {
  data: PieChartData[];
  title: string;
}

export function ValuationPieChart({ data, title }: ValuationPieChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={pieTooltipFormatter} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

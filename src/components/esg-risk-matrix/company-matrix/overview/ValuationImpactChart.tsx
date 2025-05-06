
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ValuationImpactChartProps } from "./types";

export function ValuationImpactChart({ pillarImpactData }: ValuationImpactChartProps) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">Valuation Impact by ESG Pillar</h4>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={pillarImpactData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => [`${value}%`, 'Impact']} />
          <Bar dataKey="value" fill="#8884d8">
            {pillarImpactData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.value < 0 ? "#ef4444" : "#22c55e"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

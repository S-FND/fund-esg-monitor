
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { historicalData, projectedData } from "./data";
import { HistoricalComponentProps } from "./types";

export function LongTermChart({ company }: HistoricalComponentProps) {
  // Create a custom renderer for the XAxis that adds a dashed line for projected years
  const customAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const year = parseInt(payload.value);
    const isProjected = year >= 2025;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={16} 
          textAnchor="middle" 
          fill={isProjected ? "#666666" : "#000000"}
          style={{ fontStyle: isProjected ? 'italic' : 'normal' }}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Long-term Financial Performance (2015-2029)</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          10-year historical and 5-year projected financial performance index (2015=100 base) compared to peer groups
        </p>
        <ChartContainer className="h-[350px]" config={{
          company: { color: "#8b5cf6" },
          djsiPeers: { color: "#22c55e" },
          msciPeers: { color: "#3b82f6" }
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={[...historicalData, ...projectedData]}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <defs>
                <linearGradient id="colorCompany" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorDjsi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorMsci" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year"
                tick={customAxisTick}
              />
              <YAxis 
                domain={[60, 150]} 
                label={{ value: 'Performance Index (2015=100)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} 
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend />
              
              {/* Historical Data Areas */}
              <Area 
                type="monotone" 
                dataKey="company" 
                name={`${company.name}`} 
                stroke="#8b5cf6" 
                fillOpacity={1}
                fill="url(#colorCompany)" 
                strokeWidth={2}
                data={historicalData}
              />
              <Area 
                type="monotone" 
                dataKey="djsiPeers" 
                name="DJSI Peers" 
                stroke="#22c55e" 
                fillOpacity={1}
                fill="url(#colorDjsi)" 
                strokeWidth={2}
                data={historicalData}
              />
              <Area 
                type="monotone" 
                dataKey="msciPeers" 
                name="MSCI Peers" 
                stroke="#3b82f6" 
                fillOpacity={1}
                fill="url(#colorMsci)" 
                strokeWidth={2}
                data={historicalData}
              />
              
              {/* Projected Data Areas with Dashed Lines */}
              <Area 
                type="monotone" 
                dataKey="company" 
                name={`${company.name} (Projected)`} 
                stroke="#8b5cf6" 
                fillOpacity={1}
                fill="url(#colorCompany)" 
                strokeWidth={2}
                strokeDasharray="3 3"
                data={projectedData}
              />
              <Area 
                type="monotone" 
                dataKey="djsiPeers" 
                name="DJSI Peers (Projected)" 
                stroke="#22c55e" 
                fillOpacity={1}
                fill="url(#colorDjsi)" 
                strokeWidth={2}
                strokeDasharray="3 3"
                data={projectedData}
              />
              <Area 
                type="monotone" 
                dataKey="msciPeers" 
                name="MSCI Peers (Projected)" 
                stroke="#3b82f6" 
                fillOpacity={1}
                fill="url(#colorMsci)" 
                strokeWidth={2}
                strokeDasharray="3 3"
                data={projectedData}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        <div className="flex items-center justify-center gap-8 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-foreground"></div>
            <span className="text-xs">Historical Data</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-foreground border-dashed border-t border-foreground"></div>
            <span className="text-xs">Projected Data</span>
          </div>
        </div>
        
        <LongTermPerformanceTable company={company} />
      </CardContent>
    </Card>
  );
}

function LongTermPerformanceTable({ company }: HistoricalComponentProps) {
  return (
    <div className="mt-6">
      <h4 className="text-sm font-medium mb-2">Performance Details by Period</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead>{company.name}</TableHead>
            <TableHead>DJSI Peers</TableHead>
            <TableHead>MSCI Peers</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">2015-2019 (Pre-pandemic)</TableCell>
            <TableCell className="text-purple-500">+23.5%</TableCell>
            <TableCell className="text-green-600">+14.1%</TableCell>
            <TableCell className="text-blue-500">+15.3%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">2020-2024 (Recovery)</TableCell>
            <TableCell className="text-purple-500">+20.9%</TableCell>
            <TableCell className="text-green-600">+18.2%</TableCell>
            <TableCell className="text-blue-500">+18.6%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">2025-2029 (Projected)</TableCell>
            <TableCell className="text-purple-500">+28.8%</TableCell>
            <TableCell className="text-green-600">+19.8%</TableCell>
            <TableCell className="text-blue-500">+18.9%</TableCell>
          </TableRow>
          <TableRow className="font-medium">
            <TableCell>Overall Growth (2015-2029)</TableCell>
            <TableCell className="text-purple-500">+77.8%</TableCell>
            <TableCell className="text-green-600">+52.0%</TableCell>
            <TableCell className="text-blue-500">+51.8%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      
      <div className="mt-4 text-sm">
        <p className="font-medium">Projection Methodology:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
          <li>Historical data (2015-2024) based on audited financial statements</li>
          <li>Projections (2025-2029) based on regression analysis of historical performance</li>
          <li>Factors considered: ESG improvement trajectory, industry growth trends, macro-economic indicators</li>
          <li>Additional alpha attributed to companies with stronger ESG performance based on academic research</li>
          <li>Data sources: Bloomberg Terminal, FactSet, MSCI ESG Research</li>
        </ul>
      </div>
    </div>
  );
}

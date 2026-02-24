// components/dashboard/TopPerformersCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";

interface TopPerformersCardProps {
  data?: Array<{
    name: string;
    esgScore: number;
    sector: string;
  }>;
  selectedPortfolio?: string;
}

export function TopPerformersCard({ 
  data, 
  selectedPortfolio = "fundwise" 
}: TopPerformersCardProps) {
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    setHasData(data && data.length > 0);
  }, [data]);

  const title = selectedPortfolio === "fundwise" 
    ? "Top Performing Funds" 
    : "Top Performing Companies";

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <Trophy className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No performer data available</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {selectedPortfolio === "fundwise" 
                ? "No top performers found" 
                : "No top performers found for this company"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedData = [...data].sort((a, b) => b.esgScore - a.esgScore).slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedData.map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold ${
                i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : 'bg-amber-600'
              }`}>
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.sector || 'N/A'}</p>
              </div>
              <div className="font-bold text-lg">{Math.round(item.esgScore)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function ESGStatsCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Average ESG Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">82</div>
        <p className="text-xs text-muted-foreground mt-1">
          4.5% increase since last year
        </p>
      </CardContent>
    </Card>
  );
}

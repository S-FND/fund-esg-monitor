
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function FundsStatsCard({ totalFunds }: { totalFunds: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Total Funds</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{totalFunds}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Total capital: $175M
        </p>
      </CardContent>
    </Card>
  );
}

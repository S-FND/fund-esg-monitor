
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function FundPerformanceCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ESG Performance by Fund</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center bg-accent rounded-md">
          <p className="text-muted-foreground">Fund Performance Chart</p>
        </div>
      </CardContent>
    </Card>
  );
}

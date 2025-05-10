
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TopESGConcernsCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Top ESG Concerns</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">1. Carbon Emissions</span>
            <span className="text-amber-600 font-medium">High Risk</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">2. Data Privacy</span>
            <span className="text-amber-600 font-medium">High Risk</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">3. Supply Chain</span>
            <span className="text-orange-500 font-medium">Medium Risk</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">4. Board Independence</span>
            <span className="text-orange-500 font-medium">Medium Risk</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">5. Climate Transition</span>
            <span className="text-orange-500 font-medium">Medium Risk</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

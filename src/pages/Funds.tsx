
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Building2, Calendar, Users, PiggyBank } from "lucide-react";
import { PageNavigation } from "@/components/PageNavigation";
import { funds } from "./fundsData";

export default function Funds() {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      <PageNavigation />
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Funds</h1>
        <Button onClick={() => navigate("/funds/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Create New Fund</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {funds.map(fund => (
          <Card key={fund.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-4">
              <CardTitle>{fund.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Fund Size</h3>
                  <p className="font-semibold">{fund.size} {fund.currency}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Sector Focus</h3>
                  <div className="flex flex-wrap gap-1">
                    {fund.focus.map(sector => (
                      <span key={sector} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                        {sector}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Investment Stage</h3>
                  <p>{fund.stage}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Inclusion Terms</h3>
                  <div className="flex flex-wrap gap-1">
                    {fund.inclusionTerms.map(term => (
                      <span key={term} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-esg-light text-esg-primary">
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Exclusion Terms</h3>
                  <div className="flex flex-wrap gap-1">
                    {fund.exclusionTerms.map(term => (
                      <span key={term} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button variant="outline" onClick={() => navigate(`/funds/${fund.id}`)}>
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

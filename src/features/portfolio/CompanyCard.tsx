
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

function getCategoryColor(category: string) {
  switch (category) {
    case "A": return "bg-green-100 text-green-800";
    case "B": return "bg-yellow-100 text-yellow-800";
    case "C": return "bg-orange-100 text-orange-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

interface CompanyCardProps {
  company: any;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{company.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{company.sector}</p>
          </div>
          <Badge className={getCategoryColor(company.esgCategory)}>
            Category {company.esgCategory}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Company Details</h3>
            <div className="space-y-1 mt-2">
              <p className="text-sm">
                <span className="font-medium">Type:</span> {company.type}
              </p>
              <p className="text-sm">
                <span className="font-medium">CEO:</span> {company.ceo}
              </p>
              <p className="text-sm">
                <span className="font-medium">Fund:</span> {company.fundName}
              </p>
              <p className="text-sm">
                <span className="font-medium">Stage:</span> {company.stage}
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Investment Info</h3>
            <div className="space-y-1 mt-2">
              <p className="text-sm">
                <span className="font-medium">Investment Date:</span> {new Date(company.investmentDate).toLocaleDateString()}
              </p>
              <p className="text-sm">
                <span className="font-medium">Fund Shareholding:</span> {company.shareholding}%
              </p>
              <p className="text-sm">
                <span className="font-medium">ESG Score:</span> {company.esgScore}/100
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Team Composition</h3>
            <div className="space-y-1 mt-2 text-xs">
              <p className="font-medium">Employees:</p>
              <p>
                Founders: {company.employees.founders.male} male, {company.employees.founders.female} female, {company.employees.founders.others} others
              </p>
              <p>
                Other: {company.employees.others.male} male, {company.employees.others.female} female, {company.employees.others.others} others
              </p>
              <Separator className="my-1" />
              <p className="font-medium">Workers:</p>
              <p>
                Direct: {company.workers.direct.male} male, {company.workers.direct.female} female, {company.workers.direct.others} others
              </p>
              <p>
                Indirect: {company.workers.indirect.male} male, {company.workers.indirect.female} female, {company.workers.indirect.others} others
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/50 flex justify-end py-3">
        <Button variant="outline" onClick={() => navigate(`/portfolio/${company.id}`)}>
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}

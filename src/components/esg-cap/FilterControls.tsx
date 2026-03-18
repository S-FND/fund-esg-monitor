import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Company {
  email: string;
  companyName: string;
}

interface FilterControlsProps {
  companies: Company[];
  selectedCompany: string;
  onCompanyChange: (value: string) => void;
  loading?: boolean;
}

export function FilterControls({ 
  companies, 
  selectedCompany, 
  onCompanyChange,
  loading = false
}: FilterControlsProps) {

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <Label className="block text-sm font-medium mb-1">
              Filter by Company
            </Label>

            <Select
              value={selectedCompany}
              onValueChange={onCompanyChange}
              disabled={loading}
            >
              <SelectTrigger>
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading companies...
                  </div>
                ) : (
                  <SelectValue placeholder="All Companies" />
                )}
              </SelectTrigger>

              {!loading && (
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>

                  {companies.map((company) => (
                    <SelectItem
                      key={company.email}
                      value={company.email}
                    >
                      {company.companyName}
                    </SelectItem>
                  ))}

                </SelectContent>
              )}
            </Select>

          </div>

        </div>
      </CardContent>
    </Card>
  );
}
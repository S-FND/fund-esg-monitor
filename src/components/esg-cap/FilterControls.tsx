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
  sector?: string;
  fundCompany?: {
    fundName?: string;
    stageOfInvestment?: string;
  }[];
  assignedTeamMembers?: {
    teamMemberName?: string;
    teamMemberEmail?: string;
  }[];
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

  const selectedCompanyData = companies.find(
    c => c.email === selectedCompany
  );

  return (
    <Card>
      <CardContent className="pt-6">
        {/* TWO COLUMN LAYOUT - Left: Filter, Right: Fund Cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

          {/* LEFT COLUMN: Company Filter */}
          <div className="md:col-span-3">
            <Label className="block text-sm font-medium mb-1">
              Filter by Company
            </Label>
            <Select
              value={selectedCompany}
              onValueChange={onCompanyChange}
              disabled={loading}
            >
              <SelectTrigger className="h-10 max-w-md">
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
                    <SelectItem key={company.email} value={company.email}>
                      {company.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              )}
            </Select>
          </div>

          {/* RIGHT COLUMN: Fund Cards */}
          <div className="md:col-span-9">
            {selectedCompany !== "all" && selectedCompanyData?.fundCompany?.length > 0 && (
              <div className="space-y-3">
                {selectedCompanyData.fundCompany.map((fund, index) => (
                  <div
                    key={index}
                    className="rounded-lg border bg-white px-5 py-4 shadow-sm"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-start">

                      <div>
                        <p className="text-xs text-muted-foreground truncate">Fund Name</p>
                        <p className="font-semibold text-gray-900">{fund.fundName || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground truncate">POC</p>

                        {selectedCompanyData?.assignedTeamMembers?.length ? (
                          selectedCompanyData.assignedTeamMembers.map((member, index) => (
                            <div key={index} className="mt-1">
                              <p className="font-semibold text-gray-900">
                                {member.teamMemberName}
                              </p>
                              {/* <p className="text-sm text-muted-foreground">
                                {member.teamMemberEmail}
                              </p> */}
                            </div>
                          ))
                        ) : (
                          <p className="font-semibold text-gray-900">—</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground truncate">Sector</p>
                        <p className="font-semibold text-gray-900">{selectedCompanyData?.sector || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground truncate">Stage of Investment</p>
                        <p className="font-semibold text-gray-900">{fund.stageOfInvestment || "—"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
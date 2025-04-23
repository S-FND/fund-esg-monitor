
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DateRangeSearch } from "@/components/esg-dd/DateRangeSearch";
import { useState } from "react";
import { portfolioCompanies } from "@/features/edit-portfolio-company/portfolioCompanies";

interface Report {
  id: string;
  companyId: number;
  title: string;
  date: string;
  consultant: string;
  fileUrl: string;
}

export default function ESGDDReport() {
  const allReports: Report[] = [
    {
      id: "report-1",
      companyId: 1,
      title: "ESG Due Diligence Report - Q1 2025",
      date: "2025-01-15",
      consultant: "EcoConsult Partners",
      fileUrl: "#"
    },
    {
      id: "report-2",
      companyId: 2,
      title: "ESG Due Diligence Report - Q4 2024",
      date: "2024-10-10",
      consultant: "Sustainable Future Advisors",
      fileUrl: "#"
    }
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const [filteredReports, setFilteredReports] = useState(allReports);

  const handleSearch = (startDate: Date | undefined, endDate: Date | undefined) => {
    if (!startDate || !endDate) {
      setFilteredReports(allReports);
      return;
    }

    const filtered = allReports.filter(report => {
      const reportDate = new Date(report.date);
      return reportDate >= startDate && reportDate <= endDate;
    });

    setFilteredReports(filtered);
    
    if (filtered.length === 0) {
      toast({
        title: "No Reports Found",
        description: "No reports were found within the selected date range.",
      });
    }
  };

  const handleViewReport = (report: Report) => {
    toast({
      title: "Opening PDF Report",
      description: `Opening ${report.title} for ${getCompanyName(report.companyId)}`,
    });
  };

  const getCompanyName = (companyId: number) => {
    const company = portfolioCompanies.find(c => c.id === companyId);
    return company?.name || "Unknown Company";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ESG DD Reports</h1>
        <p className="text-muted-foreground">
          View ESG Due Diligence reports uploaded by consultants
        </p>
      </div>

      <DateRangeSearch onSearch={handleSearch} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredReports.map(report => (
          <Card key={report.id}>
            <CardHeader>
              <CardTitle className="line-clamp-1">
                {getCompanyName(report.companyId)}
              </CardTitle>
              <CardDescription>
                Uploaded on {new Date(report.date).toLocaleDateString()} by {report.consultant}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                {report.title}
              </p>
              <Button 
                variant="outline" 
                onClick={() => handleViewReport(report)}
                className="w-full"
              >
                <FileText className="mr-2 h-4 w-4" />
                View PDF Report
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No reports available</h3>
          <p className="text-muted-foreground mt-2">
            No ESG DD reports were found for the selected criteria.
          </p>
        </div>
      )}
    </div>
  );
}

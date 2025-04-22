
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ESGDDReport() {
  const mockReports = [
    {
      id: "report-1",
      title: "ESG Due Diligence Report - Q1 2025",
      date: "January 15, 2025",
      consultant: "EcoConsult Partners",
      fileUrl: "#"
    },
    {
      id: "report-2",
      title: "ESG Due Diligence Report - Q4 2024",
      date: "October 10, 2024",
      consultant: "Sustainable Future Advisors",
      fileUrl: "#"
    }
  ];

  const handleViewReport = (report: typeof mockReports[0]) => {
    // In a real app, this would open the PDF
    toast({
      title: "Opening PDF Report",
      description: `Opening ${report.title}`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ESG DD Reports</h1>
        <p className="text-muted-foreground">
          View ESG Due Diligence reports uploaded by consultants
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockReports.map(report => (
          <Card key={report.id}>
            <CardHeader>
              <CardTitle className="line-clamp-1">{report.title}</CardTitle>
              <CardDescription>
                Uploaded on {report.date} by {report.consultant}
              </CardDescription>
            </CardHeader>
            <CardContent>
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

      {mockReports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No reports available</h3>
          <p className="text-muted-foreground mt-2">
            No ESG DD reports have been uploaded yet.
          </p>
        </div>
      )}
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DateRangeSearch } from "@/components/esg-dd/DateRangeSearch";
import { PageNavigation } from "@/components/PageNavigation";
import { useState } from "react";
import { portfolioCompanies } from "@/features/edit-portfolio-company/portfolioCompanies";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
      fileUrl: "/sample-esg-report.pdf"
    },
    {
      id: "report-2",
      companyId: 2,
      title: "ESG Due Diligence Report - Q4 2024",
      date: "2024-10-10",
      consultant: "Sustainable Future Advisors",
      fileUrl: "/sample-esg-report.pdf"
    }
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const [filteredReports, setFilteredReports] = useState(allReports);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);

  const handleSearch = (startDate: Date | undefined, endDate: Date | undefined) => {
    if (!startDate || !endDate) {
      applyFilters(selectedCompany, null, null);
      return;
    }

    applyFilters(selectedCompany, startDate, endDate);
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompany(companyId);
    applyFilters(companyId, null, null);
  };

  const applyFilters = (companyId: string, startDate: Date | null, endDate: Date | null) => {
    let filtered = [...allReports];

    // Filter by company if specified
    if (companyId !== "all") {
      filtered = filtered.filter(report => report.companyId === parseInt(companyId));
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.date);
        return reportDate >= startDate && reportDate <= endDate;
      });
    }

    setFilteredReports(filtered);
    
    if (filtered.length === 0) {
      toast({
        title: "No Reports Found",
        description: "No reports were found matching your criteria.",
      });
    }
  };

  const handleViewReport = async (report: Report) => {
    setIsLoading(true);
    setViewingReport(report);
    setCurrentReport(report);
    
    // Check if the PDF file exists first
    try {
      const response = await fetch(report.fileUrl, { method: 'HEAD' });
      if (!response.ok) {
        setIsLoading(false);
        toast({
          title: "Failed to load PDF document",
          description: "The PDF file could not be found. Please contact support.",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Failed to load PDF document", 
        description: "Network error while loading PDF. Please check your connection and try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Simulate loading progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      setLoadingProgress(progress > 100 ? 100 : progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setIsLoading(false);
        setPdfDialogOpen(true);
        toast({
          title: "Report Loaded",
          description: `${report.title} for ${getCompanyName(report.companyId)} is ready to view`,
        });
      }
    }, 500);
  };
  
  const handleDownloadReport = async (report: Report) => {
    try {
      // Check if file exists first
      const response = await fetch(report.fileUrl, { method: 'HEAD' });
      if (!response.ok) {
        toast({
          title: "Download Failed",
          description: "The PDF file could not be found. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Downloading Report",
        description: `Downloading ${report.title} for ${getCompanyName(report.companyId)}`,
      });
      
      // Create an anchor element and trigger download
      const link = document.createElement('a');
      link.href = report.fileUrl;
      link.download = `${getCompanyName(report.companyId)}-ESG-Report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => {
        toast({
          title: "Download Complete", 
          description: `${report.title} has been downloaded successfully.`,
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Network error while downloading PDF. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const closeReportViewer = () => {
    setViewingReport(null);
  };

  const getCompanyName = (companyId: number) => {
    const company = portfolioCompanies.find(c => c.id === companyId);
    return company?.name || "Unknown Company";
  };

  return (
    <div className="space-y-6">
      <PageNavigation />
      
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ESG DD Reports</h1>
        <p className="text-muted-foreground">
          View ESG Due Diligence reports uploaded by consultants
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-3">
            <DateRangeSearch onSearch={handleSearch} />
          </div>
          <div>
            <Label className="block text-sm font-medium mb-1">Filter by Company</Label>
            <Select value={selectedCompany} onValueChange={handleCompanyChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {portfolioCompanies.map(company => (
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {viewingReport ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{viewingReport.title}</h2>
            <Button variant="outline" onClick={closeReportViewer}>Close</Button>
          </div>
          
          {isLoading ? (
            <div className="space-y-2 py-8">
              <p className="text-center text-muted-foreground">Loading report...</p>
              <Progress value={loadingProgress} className="w-full" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <FileText className="h-16 w-16 text-primary" />
              <div className="text-center">
                <p className="font-medium">{getCompanyName(viewingReport.companyId)}</p>
                <p className="text-sm text-muted-foreground">
                  Created on {new Date(viewingReport.date).toLocaleDateString()} by {viewingReport.consultant}
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => handleViewReport(viewingReport)} className="mt-2">
                  <Eye className="mr-2 h-4 w-4" />
                  View Report
                </Button>
                <Button onClick={() => handleDownloadReport(viewingReport)} className="mt-2">
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
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
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {report.title}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleViewReport(report)}
                    className="flex-1"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Report
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => handleDownloadReport(report)}
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredReports.length === 0 && !viewingReport && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No reports available</h3>
          <p className="text-muted-foreground mt-2">
            No ESG DD reports were found for the selected criteria.
          </p>
        </div>
      )}

      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {currentReport?.title} - {currentReport && getCompanyName(currentReport.companyId)}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 h-[70vh] flex flex-col items-center justify-center space-y-6 border border-gray-300 rounded bg-gray-50">
            {currentReport?.fileUrl ? (
              <>
                <div className="text-center space-y-4">
                  <FileText className="h-20 w-20 text-primary mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {currentReport.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {getCompanyName(currentReport.companyId)} • {new Date(currentReport.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      By {currentReport.consultant}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => {
                      // Open in new tab to bypass Chrome blocking
                      window.open(currentReport.fileUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="px-6 py-2"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Open PDF in New Tab
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => handleDownloadReport(currentReport)}
                    className="px-6 py-2"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
                
                <div className="text-xs text-gray-500 text-center max-w-md">
                  <p>Click "Open PDF in New Tab" to view the report in your browser's PDF viewer, or download it to open with your preferred PDF application.</p>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <FileText className="h-16 w-16 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-600">PDF not available</p>
                  <p className="text-sm text-gray-500">Please contact support if this issue persists.</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end mt-4">
            <Button 
              onClick={() => currentReport && handleDownloadReport(currentReport)} 
              className="mr-2"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" onClick={() => setPdfDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

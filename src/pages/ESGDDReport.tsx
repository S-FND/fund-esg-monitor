import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Eye, Link, FileCheck, Clock, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DateRangeSearch } from "@/components/esg-dd/DateRangeSearch";
import { useEffect, useState } from "react";
// import { portfolioCompanies } from "@/features/edit-portfolio-company/portfolioCompanies";
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
  entityId: number;
  title: string;
  createdAt: string;
  consultant: string;
  file_path: string;
}

export default function ESGDDReport() {
  const getS3FilePath = (file_path) =>
    `https://fandoro-sustainability-saas.s3.ap-south-1.amazonaws.com/${file_path}`;
  const [portfolioCompanies, setPortfolioCompanies] = useState([])
  const [filteredReports, setFilteredReports] = useState([]);
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
    console.log('companyId', companyId)
    if (companyId == 'all') {
      getAllReportList()
    }
    else {
      getReportList(companyId)
    }

    setSelectedCompany(companyId);
    let filteredCompany = portfolioCompanies.filter((p) => p.email == companyId)[0];
    console.log('filteredCompany', filteredCompany)
    applyFilters(companyId, null, null);
  };

  const applyFilters = (companyId: string, startDate: Date | null, endDate: Date | null) => {
    let filtered = [...filteredReports];

    // Filter by company if specified
    if (companyId !== "all") {
      filtered = filtered.filter(report => report.entityId === companyId);
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.createdAt);
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

  const getCompanyInfoList = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}` + `/investor/companyInfo`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        // toast.error("Invalid credentials");
        // setIsLoading(false);
        return;
      }
      else {
        const jsondata = await res.json();
        console.log('getCompanyInfoList ::jsondata', jsondata)
        setPortfolioCompanies(jsondata['data'])
      }
    } catch (error) {
      console.error("Api call:", error);
      // toast.error("API Call failed. Please try again.");
    } finally {
      // setIsLoading(false);
    }

  };

  const getReportList = async (email) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}` + `/investor/esdd-reports/${email}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        // toast.error("Invalid credentials");
        // setIsLoading(false);
        return;
      }
      else {
        const jsondata = await res.json();
        setFilteredReports(jsondata['data'])

      }
    } catch (error) {
      console.error("Api call:", error);
      // toast.error("API Call failed. Please try again.");
    } finally {
      // setIsLoading(false);
    }

  };

  const getAllReportList = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}` + `/investor/esdd-reports`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        // toast.error("Invalid credentials");
        // setIsLoading(false);
        return;
      }
      else {
        const jsondata = await res.json();
        // setViewingReport(jsondata['data'][0])
        setFilteredReports(jsondata['data'])

      }
    } catch (error) {
      console.error("Api call:", error);
      // toast.error("API Call failed. Please try again.");
    } finally {
      // setIsLoading(false);
    }

  };

  useEffect(() => {
    getCompanyInfoList()
    getAllReportList()
  }, [])

  const handleViewReport = (report: Report) => {
    setIsLoading(true);
    setViewingReport(report);
    setCurrentReport(report)
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
          description: `${report.title} for ${getCompanyName(report.entityId)} is ready to view`,
        });
      }
    }, 500);
  };

  const handleDownloadReport = (report: Report) => {
    toast({
      title: "Downloading Report",
      description: `Downloading ${report.title} for ${getCompanyName(report.entityId)}`,
    });

    // Create an anchor element and trigger download
    const link = document.createElement('a');
    link.href = getS3FilePath(report.file_path);
    link.download = `${getCompanyName(report.entityId)}-ESG-Report.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      toast({
        title: "Download Complete",
        description: `${report.title} has been downloaded successfully.`,
      });
    }, 2000);
  };

  const closeReportViewer = () => {
    setViewingReport(null);
  };

  const getCompanyName = (companyId: number) => {
    const company = portfolioCompanies.find(c => c.id === companyId);
    return company?.name || "Unknown Company";
  };

  // Calculate stats
  const totalReports = filteredReports.length;
  const uniqueCompanies = [...new Set(filteredReports.map(r => r.entityId))].length;
  const latestReport = filteredReports.length > 0
    ? new Date(Math.max(...filteredReports.map(r => new Date(r.createdAt).getTime()))).toLocaleDateString()
    : 'N/A';
  const oldestReport = filteredReports.length > 0
    ? new Date(Math.min(...filteredReports.map(r => new Date(r.createdAt).getTime()))).toLocaleDateString()
    : 'N/A';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ESG DD Reports</h1>
        <p className="text-muted-foreground">
          View ESG Due Diligence reports uploaded by consultants
        </p>
      </div>

      {/* Stats Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Reports Card */}
        <Card className="border-none shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden">
          <div className="p-3 relative">
            <div className="absolute top-0 right-0 w-14 h-14 bg-white/10 rounded-full -mr-4 -mt-4"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 bg-white/10 rounded-full -ml-3 -mb-3"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-medium text-blue-100">Total Reports</p>
                <p className="text-xl font-bold">{totalReports}</p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <FileText className="h-4 w-4" />
              </div>
            </div>
          </div>
        </Card>

        {/* Companies Card */}
        <Card className="border-none shadow-md bg-gradient-to-br from-green-500 to-emerald-600 text-white overflow-hidden">
          <div className="p-3 relative">
            <div className="absolute top-0 right-0 w-14 h-14 bg-white/10 rounded-full -mr-4 -mt-4"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 bg-white/10 rounded-full -ml-3 -mb-3"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-medium text-green-100">Companies</p>
                <p className="text-xl font-bold">{uniqueCompanies}</p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Users className="h-4 w-4" />
              </div>
            </div>
          </div>
        </Card>

        {/* Latest Report Card */}
        <Card className="border-none shadow-md bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden">
          <div className="p-3 relative">
            <div className="absolute top-0 right-0 w-14 h-14 bg-white/10 rounded-full -mr-4 -mt-4"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 bg-white/10 rounded-full -ml-3 -mb-3"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-medium text-purple-100">Latest Report</p>
                <p className="text-base font-bold truncate max-w-[100px]">{latestReport}</p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Clock className="h-4 w-4" />
              </div>
            </div>
          </div>
        </Card>

        {/* Oldest Report Card */}
        <Card className="border-none shadow-md bg-gradient-to-br from-orange-500 to-orange-600 text-white overflow-hidden">
          <div className="p-3 relative">
            <div className="absolute top-0 right-0 w-14 h-14 bg-white/10 rounded-full -mr-4 -mt-4"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 bg-white/10 rounded-full -ml-3 -mb-3"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-medium text-orange-100">Oldest Report</p>
                <p className="text-base font-bold truncate max-w-[100px]">{oldestReport}</p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <FileCheck className="h-4 w-4" />
              </div>
            </div>
          </div>
        </Card>
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
                {portfolioCompanies.filter((c) => c.companytype == 'Invited').map(company => (
                  <SelectItem key={company.email} value={company.email.toString()}>
                    {company.companyName}
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
            <h2 className="text-xl font-semibold">{viewingReport.file_path.split('/').reverse()[0]}</h2>
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
                {/* <p className="font-medium">{getCompanyName(viewingReport.entityId)}</p> */}
                <p className="text-sm text-muted-foreground">
                  Created on {new Date(viewingReport.createdAt).toLocaleDateString()} by Fandoro
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
                  {report.file_path.split('/').reverse()[0]}
                  {/* {getCompanyName(report.entityId)} */}
                </CardTitle>
                <CardDescription>
                  Uploaded on {new Date(report.createdAt).toLocaleDateString()} by Fandoro
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
              {currentReport?.file_path.split('/').reverse()[0]}
              {/* {currentReport?.title} - {currentReport && getCompanyName(currentReport.entityId)} */}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 h-[70vh] overflow-hidden">
            <iframe
              src={getS3FilePath(currentReport?.file_path)}
              className="w-full h-full"
              title={`PDF Viewer for ${currentReport?.title}`}
            />
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
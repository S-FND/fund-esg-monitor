// components/dashboard/OverviewStats.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Target, TrendingUp, LineChart, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface OverviewStatsProps {
  stats?: {
    totalFunds?: number;
    totalCompanies?: number;
    totalCapital?: number;
    avgESGScore?: number;
    esgBreakdown?: {
      environmental: number;
      social: number;
      governance: number;
    };
    selectedFundName?: string;
    selectedCompanyName?: string;
  };
  funds: any[];
  companies: any[];
  selectedPortfolio?: string;
  selectedFund?: string;
  selectedCompany?: string;
  onViewAllFunds?: () => void;
  onViewAllCompanies?: () => void;
}

export function OverviewStats({ 
  stats, 
  funds, 
  companies, 
  selectedPortfolio = "fundwise",
  selectedFund = "all",
  selectedCompany = "all",
  onViewAllFunds,
  onViewAllCompanies
}: OverviewStatsProps) {
  const [showFundsDialog, setShowFundsDialog] = useState(false);
  const [showCompaniesDialog, setShowCompaniesDialog] = useState(false);
  
  // Calculate totals based on view type and selections
  const totalFunds = stats?.totalFunds || funds?.length || 0;
  const totalCompanies = stats?.totalCompanies || companies?.length || 0;
  const avgESGScore = stats?.avgESGScore || 0;
  const totalCapital = stats?.totalCapital || 0;

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value}`;
  };

  // Get selected item name for display
  const getSelectedContext = () => {
    if (selectedPortfolio === "fundwise" && selectedFund !== "all") {
      const fund = funds.find(f => f.id === selectedFund || f._id === selectedFund);
      return fund?.name || fund?.fundName || "Selected Fund";
    } else if (selectedPortfolio === "individual-company" && selectedCompany !== "all") {
      const company = companies.find(c => c.id === selectedCompany || c._id === selectedCompany);
      return company?.name || company?.companyName || "Selected Company";
    }
    return null;
  };

  const selectedContext = getSelectedContext();

  return (
    <div className="space-y-4">
      {/* Context indicator */}
      {selectedContext && (
        <div className="bg-muted/50 p-3 rounded-lg flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Viewing data for: <span className="font-semibold text-foreground">{selectedContext}</span>
            {selectedPortfolio === "fundwise" ? " (Fund)" : " (Company)"}
          </p>
          <Badge variant="outline" className="text-xs">
            {selectedPortfolio === "fundwise" ? "Fund View" : "Company View"}
          </Badge>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Funds Card */}
        <Card className="relative group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedPortfolio === "fundwise" ? "Total Funds" : "Funds"}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedPortfolio === "fundwise" ? totalFunds : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedPortfolio === "fundwise" 
                ? "Active investment funds" 
                : selectedFund !== "all" 
                  ? "Current fund view" 
                  : "Select a fund to view"}
            </p>
            {selectedPortfolio === "fundwise" && totalFunds > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setShowFundsDialog(true)}
              >
                View All <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Companies Card */}
        <Card className="relative group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedPortfolio === "individual-company" ? "Portfolio Companies" : "Companies"}
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedPortfolio === "individual-company" ? totalCompanies : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedPortfolio === "individual-company" 
                ? "Active investments" 
                : selectedCompany !== "all" 
                  ? "Current company view" 
                  : "Select a company to view"}
            </p>
            {selectedPortfolio === "individual-company" && totalCompanies > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setShowCompaniesDialog(true)}
              >
                View All <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Total Capital Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Capital</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCapital > 0 ? formatCurrency(totalCapital) : "$0"}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedPortfolio === "fundwise" 
                ? selectedFund !== "all" 
                  ? "Fund AUM" 
                  : "Total AUM across funds"
                : selectedCompany !== "all"
                  ? "Company valuation"
                  : "Investment value"}
            </p>
          </CardContent>
        </Card>

        {/* ESG Score Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ESG Score</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgESGScore > 0 ? `${Math.round(avgESGScore)}%` : "N/A"}
            </div>
            {stats?.esgBreakdown && (
              <div className="flex gap-2 text-xs mt-1">
                <span className="text-green-600 font-medium">
                  E: {Math.round(stats.esgBreakdown.environmental || 0)}%
                </span>
                <span className="text-blue-600 font-medium">
                  S: {Math.round(stats.esgBreakdown.social || 0)}%
                </span>
                <span className="text-purple-600 font-medium">
                  G: {Math.round(stats.esgBreakdown.governance || 0)}%
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {avgESGScore > 0 
                ? "Weighted average" 
                : "No ESG data available"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick stats summary */}
      {(selectedPortfolio === "fundwise" && selectedFund !== "all") && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
          <div className="bg-muted/30 p-3 rounded-lg text-center hover:bg-muted/50 transition-colors cursor-pointer">
            <p className="text-xs text-muted-foreground">Companies in Fund</p>
            <p className="text-2xl font-semibold">{stats?.totalCompanies || 0}</p>
          </div>
          <div className="bg-muted/30 p-3 rounded-lg text-center hover:bg-muted/50 transition-colors cursor-pointer">
            <p className="text-xs text-muted-foreground">Avg Investment</p>
            <p className="text-2xl font-semibold">
              {totalCapital > 0 && stats?.totalCompanies 
                ? formatCurrency(totalCapital / stats.totalCompanies)
                : "—"}
            </p>
          </div>
          <div className="bg-muted/30 p-3 rounded-lg text-center hover:bg-muted/50 transition-colors cursor-pointer">
            <p className="text-xs text-muted-foreground">Top ESG Pillar</p>
            <p className="text-2xl font-semibold">
              {stats?.esgBreakdown ? 
                Object.entries(stats.esgBreakdown)
                  .sort(([,a], [,b]) => b - a)[0]?.[0].charAt(0).toUpperCase() + 
                  Object.entries(stats.esgBreakdown)
                    .sort(([,a], [,b]) => b - a)[0]?.[0].slice(1) || "—"
                : "—"}
            </p>
          </div>
          <div className="bg-muted/30 p-3 rounded-lg text-center hover:bg-muted/50 transition-colors cursor-pointer">
            <p className="text-xs text-muted-foreground">Reporting Year</p>
            <p className="text-2xl font-semibold">{new Date().getFullYear()}</p>
          </div>
        </div>
      )}

      {/* Funds Dialog */}
      <Dialog open={showFundsDialog} onOpenChange={setShowFundsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>All Funds ({totalFunds})</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {funds.map((fund) => (
                <Card key={fund._id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{fund.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Size: {fund.size ? formatCurrency(fund.size) : 'N/A'} | 
                        Stage: {fund.stageOfInvestment || 'N/A'}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {fund.dashboardTopics?.length || 0} Topics
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Companies Dialog */}
      <Dialog open={showCompaniesDialog} onOpenChange={setShowCompaniesDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>All Companies ({totalCompanies})</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {companies.map((company) => (
                <Card key={company._id || company.companyId} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{company.name || company.companyName}</h4>
                      <p className="text-sm text-muted-foreground">
                        Sector: {company.sector || 'N/A'} | 
                        Type: {company.companytype || 'N/A'}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
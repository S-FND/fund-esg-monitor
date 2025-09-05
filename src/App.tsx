
import { useState, useEffect } from "react";
import {
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import {
  Dashboard,
  InvestorInfo,
  Funds,
  NewFund,
  PortfolioCompanies,
  NewCompany,
  PreScreening,
  Categorization,
  Team,
  ESGDDReport,
  ESGCAP,
  Valuation,
  ESGRiskMatrix,
  EditFund,
  TeamMemberDetail,
  TeamMemberEdit,
} from "./pages";
import NewFundSimple from "./pages/NewFundSimple";
import TeamManagement from "./pages/TeamManagement";
import Auth from "./pages/Auth";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Shell } from "@/components/Shell";
import { PortfolioProvider } from "@/contexts/PortfolioContext";
import { EditPortfolioCompany } from "@/features/edit-portfolio-company";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If user is not authenticated, show auth page
  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  // User is authenticated, show main app
  return (
    <PortfolioProvider>
      <Shell>
        <Sidebar />
        <ScrollArea className="flex-1 w-full p-4 md:p-8">
          <div className="flex justify-end space-x-4">
            <ModeToggle />
          </div>
          <Routes>
            <Route path="/auth" element={<Navigate to="/" replace />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/investor-info" element={<InvestorInfo />} />
            <Route path="/funds" element={<Funds />} />
            <Route path="/funds/new" element={<NewFundSimple />} />
            <Route path="/funds/:id" element={<EditFund />} />
            <Route path="/portfolio" element={<PortfolioCompanies />} />
            <Route path="/portfolio/new" element={<NewCompany />} />
            <Route path="/portfolio/pre-screening" element={<PreScreening />} />
            <Route path="/portfolio/categorization" element={<Categorization />} />
            <Route path="/portfolio/:id" element={<EditPortfolioCompany />} />
            <Route path="/team" element={<TeamManagement />} />
            <Route path="/esg-dd/report" element={<ESGDDReport />} />
            <Route path="/esg-dd/cap" element={<ESGCAP />} />
            <Route path="/valuation" element={<Valuation />} />
            <Route path="/esg-dd/risk-matrix" element={<ESGRiskMatrix />} />
            <Route path="/team/:id" element={<TeamMemberDetail />} />
            <Route path="/team/edit/:id" element={<TeamMemberEdit />} />
          </Routes>
        </ScrollArea>
      </Shell>
    </PortfolioProvider>
  );
}

export default App;

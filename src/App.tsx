
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MainLayout } from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Funds from "./pages/Funds";
import NewFund from "./pages/NewFund";
import Portfolio from "./pages/Portfolio";
import NewCompany from "./pages/NewCompany";
import PreScreening from "./pages/PreScreening";
import Categorization from "./pages/Categorization";
import NotFound from "./pages/NotFound";
import InvestorInfo from "./pages/InvestorInfo";
import EditInvestorProfile from "./pages/EditInvestorProfile";
import Team from "./pages/Team";
import ESGDDReport from "./pages/ESGDDReport";
import ESGCAP from "./pages/ESGCAP";
import ESGRiskMatrix from "./pages/ESGRiskMatrix";
import EditPortfolioCompany from "./pages/EditPortfolioCompany";
import EditFund from "./pages/EditFund";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { AuthCheck } from "@/components/AuthCheck";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light">
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<AuthCheck><MainLayout /></AuthCheck>}>
                <Route index element={<Dashboard />} />
                <Route path="investor-info" element={<InvestorInfo />} />
                <Route path="investor-info/edit" element={<EditInvestorProfile />} />
                <Route path="funds" element={<Funds />} />
                <Route path="funds/new" element={<NewFund />} />
                <Route path="funds/:id" element={<EditFund />} />
                <Route path="portfolio" element={<Portfolio />} />
                <Route path="portfolio/new" element={<NewCompany />} />
                <Route path="portfolio/pre-screening" element={<PreScreening />} />
                <Route path="portfolio/categorization" element={<Categorization />} />
                <Route path="portfolio/:id" element={<EditPortfolioCompany />} />
                <Route path="team" element={<Team />} />
                <Route path="esg-dd" element={<div className="p-6">ESG Due Diligence</div>} />
                <Route path="esg-dd/report" element={<ESGDDReport />} />
                <Route path="esg-dd/cap" element={<ESGCAP />} />
                <Route path="esg-dd/risk-matrix" element={<ESGRiskMatrix />} />
              </Route>
              <Route element={<AdminProtectedRoute />}>
                <Route path="/admin/risks" element={<div className="p-6">Manage ESG Risks</div>} />
                <Route path="/admin/non-compliances" element={<div className="p-6">Manage Non-Compliances</div>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

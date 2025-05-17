
import { useState, useEffect } from "react";
import {
  Route,
  Routes,
} from "react-router-dom";
import {
  Dashboard,
  InvestorInfo,
  Funds,
  PortfolioCompanies,
  Team,
  ESGDDReport,
  ESGCAP,
  Valuation,
  ESGRiskMatrix,
  EditFund,
  TeamMemberDetail,
  TeamMemberEdit,
} from "./pages";
// import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Shell } from "@/components/Shell";
import { EditPortfolioCompany } from "@/features/edit-portfolio-company";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Sidebar } from "./components/sidebar";
import EditInvestorProfile from "./pages/EditInvestorProfile";
import NewCompany from "./pages/NewCompany";
import PreScreening from "./pages/PreScreening";
import Categorization from "./pages/Categorization";

function App() {
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    setTimeout(() => {
      window.location.href = "http://localhost:3000"
    }, 3000)
  };

  return (
    <Shell>
      <Sidebar />
      <ScrollArea className="flex-1 w-full p-4 md:p-8">
        <div className="flex justify-end space-x-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Log Out</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will log you out of the application.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>
                  Log Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <ModeToggle />
        </div>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/investor-info" element={<InvestorInfo />} />
          <Route path="investor-info/edit" element={<EditInvestorProfile />} />
          <Route path="/funds" element={<Funds />} />
          <Route path="/funds/:id" element={<EditFund />} />
          <Route path="/portfolio" element={<PortfolioCompanies />} />
          <Route path="portfolio/new" element={<NewCompany />} />
          <Route path="portfolio/pre-screening" element={<PreScreening />} />
          <Route path="portfolio/categorization" element={<Categorization />} />
          <Route
            path="/portfolio/:id"
            element={<EditPortfolioCompany />}
          />
          <Route path="/team" element={<Team />} />
          <Route path="/esg-dd/report" element={<ESGDDReport />} />
          <Route path="/esg-dd/cap" element={<ESGCAP />} />
          <Route path="/valuation" element={<Valuation />} />
          <Route path="/esg-dd/risk-matrix" element={<ESGRiskMatrix />} />
          {/* Team Routes */}
          <Route path="/team/:id" element={<TeamMemberDetail />} />
          <Route path="/team/edit/:id" element={<TeamMemberEdit />} />
        </Routes>
      </ScrollArea>
    </Shell>
  );
}

export default App;

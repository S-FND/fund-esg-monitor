
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
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Shell } from "@/components/Shell";
import { EditPortfolioCompany } from "@/features/edit-portfolio-company";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
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
import { http } from "@/utils/httpInterceptor";

function App() {
  const { toast } = useToast();
  const { signOut } = useAuth();

  const handleLogout = () => {
    signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  // Example of using the HTTP interceptor (This is just for demonstration)
  useEffect(() => {
    const demoApiCall = async () => {
      // This is just a placeholder to show how the interceptor would be used
      // In a real app, you would make actual API calls where needed
      try {
        console.log("HTTP interceptor is ready to use for API calls");
        
        // Example usage (commented out as it's not real)
        // const response = await http.get('/api/some-endpoint');
        // if (response.data) {
        //   console.log("Data received:", response.data);
        // }
      } catch (error) {
        console.error("Error in API call:", error);
      }
    };
    
    demoApiCall();
  }, []);

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
          <Route path="/funds" element={<Funds />} />
          <Route path="/funds/:id" element={<EditFund />} />
          <Route path="/portfolio" element={<PortfolioCompanies />} />
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

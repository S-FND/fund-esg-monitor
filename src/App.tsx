
import { useState, useEffect } from "react";
import {
  Route,
  Routes,
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
import TeamManagement from "./pages/TeamManagement";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Shell } from "@/components/Shell";
import { PortfolioProvider } from "@/contexts/PortfolioContext";
import { EditPortfolioCompany } from "@/features/edit-portfolio-company";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContextNew";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "@/pages/Auth";
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
  const { user, loading, signOut } = useAuth();

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!user) {
    return <Auth />;
  }

  return (
    <PortfolioProvider>
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
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/investor-info" element={
              <ProtectedRoute>
                <InvestorInfo />
              </ProtectedRoute>
            } />
            <Route path="/funds" element={
              <ProtectedRoute>
                <Funds />
              </ProtectedRoute>
            } />
            <Route path="/funds/new" element={
              <ProtectedRoute requiredRole="investor_admin">
                <NewFund />
              </ProtectedRoute>
            } />
            <Route path="/funds/:id" element={
              <ProtectedRoute>
                <EditFund />
              </ProtectedRoute>
            } />
            <Route path="/portfolio" element={
              <ProtectedRoute>
                <PortfolioCompanies />
              </ProtectedRoute>
            } />
            <Route path="/portfolio/new" element={
              <ProtectedRoute requiredRole="investor_admin">
                <NewCompany />
              </ProtectedRoute>
            } />
            <Route path="/portfolio/pre-screening" element={
              <ProtectedRoute>
                <PreScreening />
              </ProtectedRoute>
            } />
            <Route path="/portfolio/categorization" element={
              <ProtectedRoute>
                <Categorization />
              </ProtectedRoute>
            } />
            <Route path="/portfolio/:id" element={
              <ProtectedRoute>
                <EditPortfolioCompany />
              </ProtectedRoute>
            } />
            <Route path="/team" element={
              <ProtectedRoute requiredRole="investor_admin">
                <TeamManagement />
              </ProtectedRoute>
            } />
            <Route path="/esg-dd/report" element={
              <ProtectedRoute>
                <ESGDDReport />
              </ProtectedRoute>
            } />
            <Route path="/esg-dd/cap" element={
              <ProtectedRoute>
                <ESGCAP />
              </ProtectedRoute>
            } />
            <Route path="/valuation" element={
              <ProtectedRoute>
                <Valuation />
              </ProtectedRoute>
            } />
            <Route path="/esg-dd/risk-matrix" element={
              <ProtectedRoute>
                <ESGRiskMatrix />
              </ProtectedRoute>
            } />
            {/* Team Routes */}
            <Route path="/team/:id" element={
              <ProtectedRoute requiredRole="investor_admin">
                <TeamMemberDetail />
              </ProtectedRoute>
            } />
            <Route path="/team/edit/:id" element={
              <ProtectedRoute requiredRole="investor_admin">
                <TeamMemberEdit />
              </ProtectedRoute>
            } />
          </Routes>
        </ScrollArea>
      </Shell>
    </PortfolioProvider>
  );
}

export default App;

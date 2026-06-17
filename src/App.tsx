
import { useState, useEffect } from "react";
import {
  Navigate,
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
  NewFund,
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
import { Sidebar } from "./components/Sidebar";
import EditInvestorProfile from "./pages/EditInvestorProfile";
import NewCompany from "./pages/NewCompany";
import PreScreening from "./pages/PreScreening";
import Categorization from "./pages/Categorization";
import { http } from "@/utils/httpInterceptor";
import Login from "./pages/Login";
import Auth from "./pages/Auth";
import { AuditLogsPage } from "./components/audit-log/AuditLogsPage";
import AdminDashboard from "./components/mis/AdminDashboard";
import Portfolio from "./components/mis/Portfolio";
import KPIMaster from "./components/mis/KPIMaster";
import FeatureManagement from "./components/mis/FeatureManagement";
import CompanyDetail from "./components/mis/CompanyDetail";
import Alerts from "./components/mis/Alerts";
import Notifications from "./components/mis/Notifications";
import AdminSettings from "./components/mis/AdminSettings";
import AdminSupport from "./components/mis/AdminSupport";
import AnalyticsDetail from "./components/mis/AnalyticsDetail";
import CompanyRankings from "./components/mis/CompanyRankings";

function App() {
  const { toast } = useToast();
  const { signOut, session } = useAuth();

  const handleLogout = () => {
    // localStorage.removeItem('auth_token')
    // localStorage.removeItem('user')
    signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    // setTimeout(() => {
    //   window.location.href = "https://preprod-enterprise.fandoro.com/"
    // }, 3000)
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
    <Routes>

      {/* ✅ PUBLIC (NO SHELL) */}
      <Route path="/" element={<Auth />} />

      {/* ✅ APP (WITH SHELL) */}
      <Route
        path="/*"
        element={
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
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="investor-info" element={<InvestorInfo />} />
                <Route path="investor-info/edit" element={<EditInvestorProfile />} />
                <Route path="funds" element={<Funds />} />
                <Route path="funds/new" element={<NewFund />} />
                <Route path="funds/:id" element={<EditFund />} />
                <Route path="portfolio" element={<PortfolioCompanies />} />
                <Route path="portfolio/new" element={<NewCompany />} />
                <Route path="portfolio/pre-screening" element={<PreScreening />} />
                <Route path="portfolio/categorization" element={<Categorization />} />
                <Route path="portfolio/:id" element={<EditPortfolioCompany />} />
                <Route path="team" element={<Team />} />
                <Route path="team/:id" element={<TeamMemberDetail />} />
                <Route path="team/edit/:id" element={<TeamMemberEdit />} />
                <Route path="esg-dd/report" element={<ESGDDReport />} />
                <Route path="esg-dd/cap" element={<ESGCAP />} />
                <Route path="valuation" element={<Valuation />} />
                <Route path="esg-dd/risk-matrix" element={<ESGRiskMatrix />} />
                {/* <Route path="/audit-logs" element={<AuditLogsPage />} /> */}


                 <Route path="/mis/dashboard" element={
                    <AdminDashboard />
                } />
                <Route path="/mis/portfolio" element={
                    <Portfolio />  
                } />
               {/* <Route path="/mis/kpi-master" element={
                    <KPIMaster />
                } />
                <Route path="/mis/features" element={
                    <FeatureManagement />
                } />
                <Route path="/mis/portfolio/:companyId" element={
                    <CompanyDetail />
                } />
                <Route path="/mis/alerts" element={
                    <Alerts />
                } />
                <Route path="/mis/notifications" element={
                    <Notifications />
                } />
                <Route path="/mis/settings" element={
                    <AdminSettings />
                } />
                <Route path="/mis/support" element={
                    <AdminSupport />
                } />
                <Route path="/mis/analytics-detail" element={
                    <AnalyticsDetail />
                } />
                <Route path="/mis/company-rankings" element={
                    <CompanyRankings />
                } /> */}
              </Routes>

            </ScrollArea>
          </Shell>
        }
      />

    </Routes>
  );

  // return (
  //   <Shell>
  //     <Route path="/" element={<Auth />} />
  //     <Sidebar />
  //     <ScrollArea className="flex-1 w-full p-4 md:p-8">
  //       <div className="flex justify-end space-x-4">
  //         <AlertDialog>
  //           <AlertDialogTrigger asChild>
  //             <Button variant="outline">Log Out</Button>
  //           </AlertDialogTrigger>
  //           <AlertDialogContent>
  //             <AlertDialogHeader>
  //               <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
  //               <AlertDialogDescription>
  //                 This action will log you out of the application.
  //               </AlertDialogDescription>
  //             </AlertDialogHeader>
  //             <AlertDialogFooter>
  //               <AlertDialogCancel>Cancel</AlertDialogCancel>
  //               <AlertDialogAction onClick={handleLogout}>
  //                 Log Out
  //               </AlertDialogAction>
  //             </AlertDialogFooter>
  //           </AlertDialogContent>
  //         </AlertDialog>
  //         <ModeToggle />
  //       </div>
  //       <Routes>
  //         <Route path="/" element={<Auth />} />
  //         <Route path="/dashboard" element={<Dashboard />} />
  //         <Route path="/investor-info" element={<InvestorInfo />} />
  //         <Route path="investor-info/edit" element={<EditInvestorProfile />} />
  //         <Route path="/funds" element={<Funds />} />
  //         <Route path="/funds/new" element={<NewFund />} /> 
  //         <Route path="/funds/:id" element={<EditFund />} />
  //         <Route path="/portfolio" element={<PortfolioCompanies />} />
  //         <Route path="portfolio/new" element={<NewCompany />} />
  //         <Route path="portfolio/pre-screening" element={<PreScreening />} />
  //         <Route path="portfolio/categorization" element={<Categorization />} />
  //         <Route
  //           path="/portfolio/:id"
  //           element={<EditPortfolioCompany />}
  //         />
  //         <Route path="/team" element={<Team />} />
  //         <Route path="/esg-dd/report" element={<ESGDDReport />} />
  //         <Route path="/esg-dd/cap" element={<ESGCAP />} />
  //         <Route path="/valuation" element={<Valuation />} />
  //         <Route path="/esg-dd/risk-matrix" element={<ESGRiskMatrix />} />
  //         {/* Team Routes */}
  //         <Route path="/team/:id" element={<TeamMemberDetail />} />
  //         <Route path="/team/edit/:id" element={<TeamMemberEdit />} />
  //       </Routes>
  //     </ScrollArea>
  //   </Shell>
  // );
}

export default App;

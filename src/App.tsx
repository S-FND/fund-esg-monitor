import { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useNavigate,
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
  TeamMemberEdit
} from "./pages";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./components/ui/mode-toggle";
import { Shell } from "./components/Shell";
import { EditPortfolioCompany } from "./features/edit-portfolio-company";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Toast } from "@/components/ui/toast";
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
import { supabase } from "./integrations/supabase/client";
import { useEffect } from "react";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
      if (!data.session) {
        navigate("/login");
      }
    };

    checkAuth();

    supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      if (!session) {
        navigate("/login");
      }
    });
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        title: "Error logging out",
        description: "There was an error logging you out. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/login");
    }
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
        <Toast />
      </ScrollArea>
    </Shell>
  );
}

export default App;

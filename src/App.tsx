
import { useState, useEffect } from "react";
import {
  Route,
  Routes,
  useNavigate,
  useLocation,
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
  Login
} from "./pages";
import { Sidebar } from "@/components/sidebar";
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
import { supabase } from "./integrations/supabase/client";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
      setAuthChecked(true);
      
      if (!data.session && location.pathname !== "/login") {
        navigate("/login");
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      if (!session && location.pathname !== "/login") {
        navigate("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

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

  // If we're still checking authentication or not logged in and already on login page
  if (!authChecked || (!isLoggedIn && location.pathname === "/login")) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

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
          <Route path="/login" element={<Login />} />
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

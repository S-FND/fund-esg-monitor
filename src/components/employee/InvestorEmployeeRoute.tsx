
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function InvestorEmployeeRoute() {
  const { userRole, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (userRole !== 'investor_employee') {
    return <Navigate to="/" replace />;
  }
  
  return <Outlet />;
}


import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function InvestorEmployeeRoute() {
  const { userRole } = useAuth();

  if (userRole !== 'investor_employee') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

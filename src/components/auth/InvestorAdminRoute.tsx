
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function InvestorAdminRoute() {
  const { userRole } = useAuth();

  if (userRole !== 'investor_admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}


import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function AdminProtectedRoute() {
  const { userRole } = useAuth();

  if (userRole !== 'admin' && userRole !== 'investor_admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

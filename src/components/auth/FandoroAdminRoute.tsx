
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function FandoroAdminRoute() {
  const { userRole } = useAuth();

  if (userRole !== 'fandoro_admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

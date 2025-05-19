
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }
  
  return <Navigate to="/" replace />;
};

export default Index;

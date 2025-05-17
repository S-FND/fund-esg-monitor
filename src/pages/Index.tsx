
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

const Index = () => {
  const { firstAccessibleRoute } = useAuth();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Short timeout to ensure context is fully loaded
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return <Navigate to={firstAccessibleRoute} replace />;
};

export default Index;

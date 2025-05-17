
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

interface AccessibleRoute {
  href: string;
  level: string;
}

const Index = () => {
  const { user } = useAuth();
  const [firstAccessibleRoute, setFirstAccessibleRoute] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const determineFirstAccessibleRoute = async () => {
      // In a real app, this would come from the backend or user context
      // For now, we'll use sample data
      const sampleAccessData = [
        {
          moduleName: "Funds",
          level: "read",
          href: "/funds"
        },
        {
          moduleName: "Portfolio Companies",
          level: "read",
          href: "/portfolio"
        },
        {
          moduleName: "ESG DD",
          level: "none",
          href: "/esg-dd"
        },
        {
          moduleName: "ESG DD Report",
          level: "read",
          href: "/esg-dd/report"
        }
      ];
      
      // Filter out routes with "none" access level
      const accessibleRoutes: AccessibleRoute[] = sampleAccessData.filter(
        item => item.level !== "none"
      );
      
      // Get the first accessible route, defaulting to "/" if none found
      const firstRoute = accessibleRoutes.length > 0 ? accessibleRoutes[0].href : "/";
      setFirstAccessibleRoute(firstRoute);
      setLoading(false);
    };
    
    determineFirstAccessibleRoute();
  }, [user]);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return <Navigate to={firstAccessibleRoute || "/"} replace />;
};

export default Index;


import { useLocation } from "react-router-dom";
import { 
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton 
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { mainNavItems } from "./navigation-items";
import { SidebarSubmenuItem } from "./SidebarSubmenuItem";
import { esgDDNavItem, valuationNavItem } from "./navigation-items";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

// Define the AssignedPage type to match the structure in the user's array
interface AssignedPage {
  moduleName: string;
  level: "read" | "write" | "admin" | "none";
  href: string;
}

export function SidebarNavigation() {
  const location = useLocation();
  const { user } = useAuth();
  const [accessibleMenus, setAccessibleMenus] = useState<AssignedPage[]>([]);
  const [firstAccessibleRoute, setFirstAccessibleRoute] = useState<string>("/");

  // Check if any path starts with /esg-dd but is not /esg-dd/risk-matrix
  const isEsgSubmenuOpen = location.pathname.startsWith("/esg-dd") && !location.pathname.includes("risk-matrix");
  
  // Check if the path includes risk-matrix
  const isValuationSubmenuOpen = location.pathname.includes("risk-matrix");

  useEffect(() => {
    // In a real app, this would come from the backend based on user roles
    // For demo purposes, we'll use mock data
    const fetchUserAccess = async () => {
      // This would eventually come from an API or user context
      // For now, we'll use the sample data provided by the user
      const sampleAccessData: AssignedPage[] = [
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

      setAccessibleMenus(sampleAccessData);
      
      // Determine the first accessible route for default redirection
      const accessibleRoutes = sampleAccessData.filter(item => item.level !== "none");
      if (accessibleRoutes.length > 0) {
        setFirstAccessibleRoute(accessibleRoutes[0].href);
      }
    };

    fetchUserAccess();
  }, [user]);

  // Filter main navigation items based on access level
  const filteredMainNavItems = mainNavItems.filter(item => {
    const matchedAccess = accessibleMenus.find(access => access.moduleName === item.title);
    return matchedAccess && matchedAccess.level !== "none";
  });

  // Check if user has access to ESG DD submenu
  const hasEsgAccess = accessibleMenus.some(access => 
    (access.moduleName === "ESG DD" && access.level !== "none") ||
    access.moduleName.startsWith("ESG DD") && access.level !== "none"
  );

  // Check if user has access to Valuation submenu
  const hasValuationAccess = accessibleMenus.some(access => 
    (access.moduleName === "Valuation" && access.level !== "none") ||
    access.moduleName.startsWith("Valuation") && access.level !== "none"
  );

  // Filter ESG DD subitems based on access
  const filteredEsgDDSubItems = hasEsgAccess ? esgDDNavItem.subItems.filter(subItem => {
    const matchedAccess = accessibleMenus.find(
      access => access.moduleName === subItem.title && access.level !== "none"
    );
    return matchedAccess;
  }) : [];

  // Create a modified ESG DD navigation item with filtered subitems
  const filteredEsgDDNavItem = {
    ...esgDDNavItem,
    subItems: filteredEsgDDSubItems
  };

  return (
    <SidebarMenu>
      {filteredMainNavItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton 
            asChild
            isActive={location.pathname === item.href}
            tooltip={item.title}
          >
            <Link to={item.href}>
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}

      {hasEsgAccess && filteredEsgDDSubItems.length > 0 && (
        <SidebarSubmenuItem 
          item={filteredEsgDDNavItem} 
          isInitiallyOpen={isEsgSubmenuOpen} 
        />
      )}
      
      {hasValuationAccess && (
        <SidebarSubmenuItem 
          item={valuationNavItem} 
          isInitiallyOpen={isValuationSubmenuOpen} 
        />
      )}
    </SidebarMenu>
  );
}

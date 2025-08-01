
import { useLocation } from "react-router-dom";
import { 
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton 
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { mainNavItems } from "./navigation-items";
import { SidebarSubmenuItem } from "./SidebarSubmenuItem";
import { esgDDNavItem, valuationNavItem } from "./navigation-items";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

export function SidebarNavigation() {
  const location = useLocation();
  const { user } = useAuth();
  const [accessibleMenus, setAccessibleMenus] = useState<string[]>([]);

  // Check if any path starts with /esg-dd but is not /esg-dd/risk-matrix
  const isEsgSubmenuOpen = location.pathname.startsWith("/esg-dd") && !location.pathname.includes("risk-matrix");
  
  // Check if the path includes risk-matrix
  const isValuationSubmenuOpen = location.pathname.includes("risk-matrix");

  useEffect(() => {
    // In a real app, this would come from the backend based on user roles
    // For demo purposes, we'll use mock data
    const fetchUserAccess = async () => {
      // Default mock accesses for demo purposes
      const mockUserAccess = {
        // Simulating different access patterns
        "1": ["Dashboard", "Funds", "Team", "Portfolio Companies", "ESG DD", "Valuation"],
        "2": ["ESG DD", "ESG CAP", "Valuation"],
        "3": ["Dashboard", "Portfolio Companies", "Valuation"],
        "4": ["Dashboard", "Funds", "Team", "Portfolio Companies", "ESG DD", "ESG CAP", "Valuation"]
      };

      const userId = user?.id || "1"; // Default to user 1 if no user ID
      const accessList = mockUserAccess[userId as keyof typeof mockUserAccess] || ["Dashboard"];
      setAccessibleMenus(accessList);
    };

    fetchUserAccess();
  }, [user]);

  // Filter menu items based on user access
  const filteredMainNavItems = mainNavItems.filter(item => 
    accessibleMenus.includes(item.title)
  );

  // Check if user has access to ESG DD submenu
  const hasEsgAccess = accessibleMenus.includes(esgDDNavItem.title);

  // Check if user has access to Valuation submenu
  const hasValuationAccess = accessibleMenus.includes(valuationNavItem.title);

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

      {hasEsgAccess && (
        <SidebarSubmenuItem 
          item={esgDDNavItem} 
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

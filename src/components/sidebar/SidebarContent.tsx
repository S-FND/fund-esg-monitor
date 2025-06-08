
import { useLocation } from "react-router-dom";
import { mainNavItems, esgDDNavItem, valuationNavItem } from "./navigation-items";
import { SidebarNavItem } from "./SidebarNavItem";
import { SidebarSubmenu } from "./SidebarSubmenu";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

export function SidebarContent() {
  const location = useLocation();
  const { user } = useAuth();
  const [accessibleMenus, setAccessibleMenus] = useState<string[]>([]);

  // Check if any path starts with /esg-dd but is not /esg-dd/risk-matrix
  const isEsgSubmenuOpen = location.pathname.startsWith("/esg-dd") && !location.pathname.includes("risk-matrix");
  
  // Check if the path includes risk-matrix
  const isValuationSubmenuOpen = location.pathname.includes("risk-matrix");

  useEffect(() => {
    // In a real app, this would come from the backend based on user roles
    console.log("Change in user Data happened")
    if (user) {
      // Get the unique module names user has access to
      const accessList = user.assignedPages
        .filter(right => right.level !== "none")
        .map(right => right.moduleName);

      // Remove duplicates if any
      const uniqueAccessList = Array.from(new Set(accessList));
      setAccessibleMenus(uniqueAccessList);
    } else {
      setAccessibleMenus(["Dashboard"]); // Default fallback
    }
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
    <nav className="mt-8 flex-1 overflow-y-auto">
      <ul className="space-y-1 px-2">
        {filteredMainNavItems.map((item) => (
          <SidebarNavItem key={item.href} item={item} />
        ))}
        
        {hasEsgAccess && (
          <SidebarSubmenu item={esgDDNavItem} isInitiallyOpen={isEsgSubmenuOpen} />
        )}
        
        {hasValuationAccess && (
          <SidebarSubmenu item={valuationNavItem} isInitiallyOpen={isValuationSubmenuOpen} />
        )}
      </ul>
    </nav>
  );
}

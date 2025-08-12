
import { useLocation } from "react-router-dom";
import { mainNavItems, esgDDNavItem, valuationNavItem } from "./navigation-items";
import { SidebarNavItem } from "./SidebarNavItem";
import { SidebarSubmenu } from "./SidebarSubmenu";

import { useState, useEffect } from "react";

export function SidebarContent() {
  const location = useLocation();
  const [accessibleMenus, setAccessibleMenus] = useState<string[]>([]);

  // Check if any path starts with /esg-dd but is not /esg-dd/risk-matrix
  const isEsgSubmenuOpen = location.pathname.startsWith("/esg-dd") && !location.pathname.includes("risk-matrix");
  
  // Check if the path includes risk-matrix
  const isValuationSubmenuOpen = location.pathname.includes("risk-matrix");

  useEffect(() => {
    // Without authentication, give access to all modules
    setAccessibleMenus(["Dashboard", "Funds", "Team", "Portfolio Companies", "ESG DD", "Valuation"]);
  }, []);

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

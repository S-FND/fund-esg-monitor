
import { useLocation } from "react-router-dom";
import { mainNavItems, esgDDNavItem, valuationNavItem } from "./navigation-items";
import { SidebarNavItem } from "./SidebarNavItem";
import { SidebarSubmenu } from "./SidebarSubmenu";

export function SidebarContent() {
  const location = useLocation();

  // Check if any path starts with /esg-dd but is not /esg-dd/risk-matrix
  const isEsgSubmenuOpen = location.pathname.startsWith("/esg-dd") && !location.pathname.includes("risk-matrix");
  
  // Check if the path includes risk-matrix
  const isValuationSubmenuOpen = location.pathname.includes("risk-matrix");

  return (
    <nav className="mt-8 flex-1 overflow-y-auto">
      <ul className="space-y-1 px-2">
        {mainNavItems.map((item) => (
          <SidebarNavItem key={item.href} item={item} />
        ))}
        
        <SidebarSubmenu item={esgDDNavItem} isInitiallyOpen={isEsgSubmenuOpen} />
        <SidebarSubmenu item={valuationNavItem} isInitiallyOpen={isValuationSubmenuOpen} />
      </ul>
    </nav>
  );
}

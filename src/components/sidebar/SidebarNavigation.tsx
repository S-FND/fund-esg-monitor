
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


// Helper: include all subitems if parent module is accessible
const getAccessibleSubmenu = (item: typeof esgDDNavItem | typeof valuationNavItem, accessibleMenus: string[]) => {
  if (!item) return null;
  // If parent module is accessible, return item with all subItems
  if (accessibleMenus.includes(item.title)) return item;
  // Else filter subItems individually
  const allowedSubs = item.subItems.filter(sub => accessibleMenus.includes(sub.title));
  if (allowedSubs.length > 0) return { ...item, subItems: allowedSubs };
  return null;
};

export function SidebarNavigation() {
  const location = useLocation();
  const { user } = useAuth();
  const [accessibleMenus, setAccessibleMenus] = useState<string[]>([]);

  // Check if any path starts with /esg-dd but is not /esg-dd/risk-matrix
  const isEsgSubmenuOpen = location.pathname.startsWith("/esg-dd") && !location.pathname.includes("risk-matrix");
  
  // Check if the path includes risk-matrix
  const isValuationSubmenuOpen = location.pathname.includes("risk-matrix");

  useEffect(() => {
    console.log("Inside SidebarNavigation :: user => ",user)
    // In a real app, this would come from the backend based on user roles
    // For demo purposes, we'll use mock data
    const  fetchUserAccess = async () => {
      // Default mock accesses for demo purposes
      const mockUserAccess = {
        // Simulating different access patterns
        "1": ["Dashboard","Investor General Info", "Funds", "Team", "Portfolio Companies", "ESG DD"],
        "2": ["ESG DD", "ESG CAP", "Valuation"],
        "3": ["Dashboard", "Portfolio Companies", "Valuation"],
        "4": ["Dashboard","Investor General Info", "Funds", "Team", "Portfolio Companies", "ESG DD", "ESG CAP", "Valuation"]
      };
      let accessList;
      if(user.isParent && (!user.assignedPages || user.assignedPages.length == 0)){
        accessList=["Dashboard","Investor General Info", "Funds", "Team", "Portfolio Companies", "ESG DD", "ESG CAP", "Valuation"]
      } else if (user?.assignedPages && user.assignedPages.length > 0) {
        accessList = user.assignedPages.flatMap(p => {
          const modules = [p.moduleName];
          if (p.moduleName === "ESG DD") modules.push("ESG DD Report", "ESG CAP");
          if (p.moduleName === "Valuation") modules.push("ESG Risk Matrix");
          console.log('modules',modules);
          return modules;
        });
      } else{
         accessList = user.assignedPages.map((p)=>p.moduleName) || ["Dashboard"];
        
      }
      setAccessibleMenus(accessList);
      const userId = user?.id || "1"; // Default to user 1 if no user ID
      // const accessList = mockUserAccess[userId as keyof typeof mockUserAccess] || ["Dashboard"];
      
    };

    fetchUserAccess();
  }, [user]);

  // Filter menu items based on user access
  const filteredMainNavItems = mainNavItems.filter(item => 
    accessibleMenus.includes(item.title)
  );

  // Check if user has access to ESG DD submenu
  // const hasEsgAccess = accessibleMenus.includes(esgDDNavItem.title);
  const filteredEsgDDNavItem = getAccessibleSubmenu(esgDDNavItem, accessibleMenus);


  // Check if user has access to Valuation submenu
  // const hasValuationAccess = accessibleMenus.includes(valuationNavItem.title);
  const filteredValuationNavItem = getAccessibleSubmenu(valuationNavItem, accessibleMenus);
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

      {/* {hasEsgAccess && (
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
      )} */}
      {filteredEsgDDNavItem && (
        <SidebarSubmenuItem 
          item={filteredEsgDDNavItem} 
          isInitiallyOpen={isEsgSubmenuOpen} 
        />
      )}

      {filteredValuationNavItem && (
        <SidebarSubmenuItem 
          item={filteredValuationNavItem} 
          isInitiallyOpen={isValuationSubmenuOpen} 
        />
      )}
    </SidebarMenu>
  );
}




// import { useLocation } from "react-router-dom";
// import { 
//   SidebarMenu,
//   SidebarMenuItem,
//   SidebarMenuButton 
// } from "@/components/ui/sidebar";
// import { Link } from "react-router-dom";
// import { cn } from "@/lib/utils";
// import { mainNavItems, esgDDNavItem, valuationNavItem } from "./navigation-items";
// import { SidebarSubmenuItem } from "./SidebarSubmenuItem";
// import { useAuth } from "@/contexts/AuthContext";
// import { useState, useEffect } from "react";
// import { LucideIcon } from "lucide-react";

// export function SidebarNavigation() {
//   const location = useLocation();
//   const { assignedPages, user } = useAuth();
//   const [accessibleMenus, setAccessibleMenus] = useState<string[]>([]);

//   // Check if any path starts with /esg-dd but is not /esg-dd/risk-matrix
//   const isEsgSubmenuOpen = location.pathname.startsWith("/esg-dd") && !location.pathname.includes("risk-matrix");
  
//   // Check if the path includes risk-matrix
//   const isValuationSubmenuOpen = location.pathname.includes("risk-matrix");

//   useEffect(() => {
//     if (assignedPages.length > 0) {
//       // Filter only accessible modules (not 'none' level)
//       const accessList = assignedPages
//         .filter(page => page.level !== "none")
//         .map(page => page.moduleName);

//       // Remove duplicates if any
//       const uniqueAccessList = Array.from(new Set(accessList));
//       setAccessibleMenus(uniqueAccessList);
//     } else if (user) {
//       // Fallback to old method if assigned pages are not available
//       const accessList = user.accessRights
//         .filter(right => right.level !== "none")
//         .map(right => right.moduleName);

//       // Remove duplicates if any
//       const uniqueAccessList = Array.from(new Set(accessList));
//       setAccessibleMenus(uniqueAccessList);
//     } else {
//       setAccessibleMenus(["Dashboard"]); // Default fallback
//     }
//   }, [assignedPages, user]);

//   // Find main nav items that match the assigned pages
//   const filteredMainNavItems = mainNavItems.filter(item => 
//     accessibleMenus.includes(item.title)
//   );

//   // Check if user has access to ESG DD submenu
//   const hasEsgAccess = accessibleMenus.includes(esgDDNavItem.title);

//   // Check if user has access to Valuation submenu
//   const hasValuationAccess = accessibleMenus.includes(valuationNavItem.title);

//   return (
//     <SidebarMenu>
//       {filteredMainNavItems.map((item) => (
//         <SidebarMenuItem key={item.href}>
//           <SidebarMenuButton 
//             asChild
//             isActive={location.pathname === item.href}
//             tooltip={item.title}
//           >
//             <Link to={item.href}>
//               <item.icon className="h-4 w-4" />
//               <span>{item.title}</span>
//             </Link>
//           </SidebarMenuButton>
//         </SidebarMenuItem>
//       ))}

//       {hasEsgAccess && (
//         <SidebarSubmenuItem 
//           item={esgDDNavItem} 
//           isInitiallyOpen={isEsgSubmenuOpen} 
//         />
//       )}
      
//       {hasValuationAccess && (
//         <SidebarSubmenuItem 
//           item={valuationNavItem} 
//           isInitiallyOpen={isValuationSubmenuOpen} 
//         />
//       )}
//     </SidebarMenu>
//   );
// }


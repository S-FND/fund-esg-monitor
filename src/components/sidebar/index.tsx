
import { useLocation } from "react-router-dom";
import { 
  Sidebar as ShadcnSidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarFooter 
} from "@/components/ui/sidebar";
import { SidebarNavigation } from "./SidebarNavigation";

export function Sidebar() {
  return (
    <ShadcnSidebar side="left" collapsible="icon" variant="sidebar">
      <SidebarHeader className="p-4 space-y-0">
        <h2 className="text-xl font-bold text-sidebar-foreground">ESG Monitor</h2>
        <p className="text-sm text-sidebar-foreground/70">Fandoro Technologies</p>
      </SidebarHeader>
      
      <SidebarContent className="mt-4">
        <SidebarNavigation />
      </SidebarContent>
      
      <SidebarFooter className="p-4 text-xs text-sidebar-foreground/70">
        <p>© {new Date().getFullYear()} Fandoro Technologies</p>
        <p>All rights reserved</p>
      </SidebarFooter>
    </ShadcnSidebar>
  );
}

// Re-export for backward compatibility
export { Sidebar as default } from "./index";

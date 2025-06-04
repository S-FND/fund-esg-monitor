
import { useLocation } from "react-router-dom";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider
} from "@/components/ui/sidebar";
import { SidebarNavigation } from "./SidebarNavigation";

export function Sidebar() {
  return (
    <ShadcnSidebar side="left" collapsible="icon" variant="sidebar">
      <SidebarHeader className="p-4 space-y-0">
        <div className="flex items-center space-x-2">
          <img
            src="/fandoro-logo.png"
            alt="Fandoro Technologies"
            className="h-8 w-8"
          />
          <div>
            <h2 className="text-xl font-bold text-sidebar-foreground">
              ESG Monitor{import.meta.env.VITE_APP_ENV !== 'production' ? ` (${import.meta.env.VITE_APP_ENV})` : ''}
            </h2>
            <p className="text-sm text-sidebar-foreground/70">Fandoro Technologies</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="mt-4">
        <SidebarNavigation />
      </SidebarContent>

      <SidebarFooter className="p-4 text-xs text-sidebar-foreground/70">
        <div className="flex items-center space-x-2">
          <img
            src="/fandoro-logo.png"
            alt="Fandoro Technologies"
            className="h-6 w-6"
          />
          <div>
            <p>© {new Date().getFullYear()} Fandoro Technologies</p>
            <p>All rights reserved</p>
          </div>
        </div>
      </SidebarFooter>
    </ShadcnSidebar>
  );
}

// Remove the incorrect re-export as it's causing confusion
// export { Sidebar as default } from "./index";

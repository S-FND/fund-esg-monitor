
import { useLocation } from "react-router-dom";
import { SidebarContent } from "./SidebarContent";

export function Sidebar() {
  return (
    <div className="h-screen w-64 bg-sidebar fixed left-0 border-r border-sidebar-border">
      <div className="flex flex-col h-full">
        <div className="p-4">
          <h2 className="text-xl font-bold text-sidebar-foreground">ESG Monitor</h2>
          <p className="text-sm text-sidebar-foreground/70">Fandoro Technologies</p>
        </div>
        
        <SidebarContent />
        
        <div className="p-4 text-xs text-sidebar-foreground/70">
          <p>© {new Date().getFullYear()} Fandoro Technologies</p>
          <p>All rights reserved</p>
        </div>
      </div>
    </div>
  );
}

// Re-export for backward compatibility
export { Sidebar as default } from "./index";

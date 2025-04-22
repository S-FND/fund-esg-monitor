
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Building,
  FileText,
  FolderOpen,
  ListChecks,
  Users,
} from "lucide-react";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: BarChart3,
  },
  {
    title: "Investor General Info",
    href: "/investor-info",
    icon: Building,
  },
  {
    title: "Funds",
    href: "/funds",
    icon: FolderOpen,
  },
  {
    title: "Portfolio Companies",
    href: "/portfolio",
    icon: Building,
  },
  {
    title: "Team",
    href: "/team",
    icon: Users,
  },
  {
    title: "ESG DD",
    href: "/esg-dd",
    icon: ListChecks,
  },
];

export function Sidebar() {
  const location = useLocation();
  
  return (
    <div className="h-screen w-64 bg-sidebar fixed left-0 border-r border-sidebar-border">
      <div className="flex flex-col h-full">
        <div className="p-4">
          <h2 className="text-xl font-bold text-sidebar-foreground">ESG Monitor</h2>
          <p className="text-sm text-sidebar-foreground/70">Investor Platform</p>
        </div>
        
        <nav className="mt-8 flex-1 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 text-xs text-sidebar-foreground/70">
          <p>© 2025 ESG Monitor</p>
          <p>All rights reserved</p>
        </div>
      </div>
    </div>
  );
}

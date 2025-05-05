
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Building,
  FileText,
  FolderOpen,
  ListChecks,
  Users,
  FileCheck,
  ChevronDown,
  ChevronRight,
  Calculator,
} from "lucide-react";
import { useState } from "react";

const mainNavItems = [
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
];

const esgDDNavItem = {
  title: "ESG DD",
  href: "/esg-dd",
  icon: ListChecks,
  subItems: [
    {
      title: "ESG DD Report",
      href: "/esg-dd/report",
      icon: FileText,
    },
    {
      title: "ESG CAP",
      href: "/esg-dd/cap",
      icon: FileCheck,
    },
  ]
};

const valuationNavItem = {
  title: "Valuation",
  href: "/valuation",
  icon: Calculator,
  subItems: [
    {
      title: "ESG Risk Matrix",
      href: "/esg-dd/risk-matrix",
      icon: Calculator,
    }
  ]
};

export function Sidebar() {
  const location = useLocation();
  const [esgSubmenuOpen, setEsgSubmenuOpen] = useState(
    location.pathname.startsWith("/esg-dd") && !location.pathname.includes("risk-matrix")
  );
  const [valuationSubmenuOpen, setValuationSubmenuOpen] = useState(
    location.pathname.includes("risk-matrix")
  );
  
  return (
    <div className="h-screen w-64 bg-sidebar fixed left-0 border-r border-sidebar-border">
      <div className="flex flex-col h-full">
        <div className="p-4">
          <h2 className="text-xl font-bold text-sidebar-foreground">ESG Monitor</h2>
          <p className="text-sm text-sidebar-foreground/70">Fandoro Technologies</p>
        </div>
        
        <nav className="mt-8 flex-1 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {mainNavItems.map((item) => {
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
            
            {/* ESG DD with submenu */}
            <li>
              <button
                onClick={() => setEsgSubmenuOpen(!esgSubmenuOpen)}
                className={cn(
                  "flex items-center justify-between w-full rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname.startsWith("/esg-dd") && !location.pathname.includes("risk-matrix")
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <esgDDNavItem.icon className="h-4 w-4" />
                  <span>{esgDDNavItem.title}</span>
                </div>
                {esgSubmenuOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {esgSubmenuOpen && (
                <ul className="mt-1 pl-9 space-y-1">
                  {esgDDNavItem.subItems.map((subItem) => {
                    const isActive = location.pathname === subItem.href;
                    return (
                      <li key={subItem.href}>
                        <Link
                          to={subItem.href}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <subItem.icon className="h-4 w-4" />
                          <span>{subItem.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
            
            {/* Valuation with submenu */}
            <li>
              <button
                onClick={() => setValuationSubmenuOpen(!valuationSubmenuOpen)}
                className={cn(
                  "flex items-center justify-between w-full rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname.includes("risk-matrix")
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <valuationNavItem.icon className="h-4 w-4" />
                  <span>{valuationNavItem.title}</span>
                </div>
                {valuationSubmenuOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {valuationSubmenuOpen && (
                <ul className="mt-1 pl-9 space-y-1">
                  {valuationNavItem.subItems.map((subItem) => {
                    const isActive = location.pathname === subItem.href;
                    return (
                      <li key={subItem.href}>
                        <Link
                          to={subItem.href}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <subItem.icon className="h-4 w-4" />
                          <span>{subItem.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          </ul>
        </nav>
        
        <div className="p-4 text-xs text-sidebar-foreground/70">
          <p>© {new Date().getFullYear()} Fandoro Technologies</p>
          <p>All rights reserved</p>
        </div>
      </div>
    </div>
  );
}

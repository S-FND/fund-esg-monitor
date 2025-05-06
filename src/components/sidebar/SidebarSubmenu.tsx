
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavItemWithSubItems } from "./types";
import { Link, useLocation } from "react-router-dom";

interface SidebarSubmenuProps {
  item: NavItemWithSubItems;
  isInitiallyOpen: boolean;
}

export function SidebarSubmenu({ item, isInitiallyOpen }: SidebarSubmenuProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);
  const isActive = item.subItems.some(subItem => location.pathname === subItem.href);
  const ItemIcon = item.icon;

  return (
    <li>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
        )}
      >
        <div className="flex items-center gap-3">
          <ItemIcon className="h-4 w-4" />
          <span>{item.title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      
      {isOpen && (
        <ul className="mt-1 pl-9 space-y-1">
          {item.subItems.map((subItem) => {
            const isSubActive = location.pathname === subItem.href;
            const SubItemIcon = subItem.icon;
            
            return (
              <li key={subItem.href}>
                <Link
                  to={subItem.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isSubActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <SubItemIcon className="h-4 w-4" />
                  <span>{subItem.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

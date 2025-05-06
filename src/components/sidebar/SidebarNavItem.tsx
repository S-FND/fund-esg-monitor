
import { cn } from "@/lib/utils";
import { NavItem } from "./types";
import { Link, useLocation } from "react-router-dom";

interface SidebarNavItemProps {
  item: NavItem;
}

export function SidebarNavItem({ item }: SidebarNavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === item.href;
  const ItemIcon = item.icon;

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
        <ItemIcon className="h-4 w-4" />
        <span>{item.title}</span>
      </Link>
    </li>
  );
}


import { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavItemWithSubItems extends NavItem {
  subItems: NavItem[];
}

export type SidebarNavItem = NavItem | NavItemWithSubItems;

export function hasSubItems(item: SidebarNavItem): item is NavItemWithSubItems {
  return 'subItems' in item;
}

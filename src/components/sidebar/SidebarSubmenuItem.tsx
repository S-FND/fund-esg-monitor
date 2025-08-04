
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { NavItemWithSubItems } from "./types";
import { 
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
} from "@/components/ui/sidebar";

interface SidebarSubmenuItemProps {
  item: NavItemWithSubItems;
  isInitiallyOpen: boolean;
}

export function SidebarSubmenuItem({ item, isInitiallyOpen }: SidebarSubmenuItemProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);
  const isActive = item.subItems.some(subItem => location.pathname === subItem.href);
  
  return (
    <SidebarMenuItem>
      <SidebarMenuButton 
        isActive={isActive}
        onClick={() => setIsOpen(!isOpen)}
        tooltip={item.title}
      >
        <item.icon className="h-4 w-4" />
        <span>{item.title}</span>
        {isOpen ? (
          <ChevronDown className="ml-auto h-4 w-4" />
        ) : (
          <ChevronRight className="ml-auto h-4 w-4" />
        )}
      </SidebarMenuButton>
      
      {isOpen && (
        <SidebarMenuSub>
          {item.subItems.map((subItem) => {
            const isSubActive = location.pathname === subItem.href;
            
            return (
              <SidebarMenuSubItem key={subItem.href}>
                <SidebarMenuSubButton
                  asChild
                  isActive={isSubActive}
                >
                  <Link to={subItem.href} className="text-black">
                    <subItem.icon className="h-4 w-4 !text-black" />
                    <span>{subItem.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

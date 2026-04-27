
import { 
  BarChart3, 
  Building, 
  FileText, 
  FolderOpen, 
  ListChecks, 
  Users, 
  FileCheck,
  Calculator 
} from "lucide-react";
import { NavItem, NavItemWithSubItems } from "./types";

export const mainNavItems: NavItem[] = [
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

export const esgDDNavItem: NavItemWithSubItems = {
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

export const valuationNavItem: NavItemWithSubItems = {
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

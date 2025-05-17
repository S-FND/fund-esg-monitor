import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { mainNavItems, esgDDNavItem, valuationNavItem } from "@/components/sidebar/navigation-items";
import { useToast } from "@/hooks/use-toast";
import { TeamMemberHeader } from "@/components/team/TeamMemberHeader";
import { TeamMemberProfile } from "@/components/team/TeamMemberProfile";
import { AccessRightsPanel } from "@/components/team/AccessRightsPanel";

interface AccessRight {
  moduleName: string;
  level: "read" | "write" | "admin" | "none";
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  designation?: string;
  mobileNumber?: string;
  accessRights: AccessRight[];
  isActive?: boolean;
}

const accessLevels = [
  { value: "none", label: "No Access" },
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
  { value: "admin", label: "Admin" }
];

export default function TeamMemberDetail() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessRights, setAccessRights] = useState<AccessRight[]>([]);
  const [isActive, setIsActive] = useState(false);
  const { toast } = useToast();

  // Create a comprehensive navigation items list that includes main items and their submenus
  const allNavItems = [
    ...mainNavItems.map((item) => ({ 
      title: item.title, 
      href: item.href,
      isParent: true,
      subItems: []
    })),
    { 
      title: esgDDNavItem.title, 
      href: esgDDNavItem.href,
      isParent: true,
      subItems: esgDDNavItem.subItems.map(subItem => ({
        title: subItem.title,
        href: subItem.href
      }))
    },
    { 
      title: valuationNavItem.title, 
      href: valuationNavItem.href,
      isParent: true,
      subItems: valuationNavItem.subItems.map(subItem => ({
        title: subItem.title,
        href: subItem.href
      }))
    }
  ];

  useEffect(() => {
    // Simulate fetching member details
    setLoading(true);
    
    // Sample data - in a real app, this would be fetched from the database
    const sampleTeamMembers = [
      {
        id: "1",
        name: "John Smith",
        email: "john.smith@example.com",
        designation: "Fund Manager",
        mobileNumber: "+1 (555) 123-4567",
        accessRights: [
          { moduleName: "Dashboard", level: "admin" as const },
          { moduleName: "Funds", level: "write" as const },
          { moduleName: "Team", level: "write" as const },
          { moduleName: "Portfolio Companies", level: "write" as const },
          { moduleName: "ESG DD", level: "read" as const },
          { moduleName: "ESG CAP", level: "read" as const },
          { moduleName: "Valuation", level: "read" as const }
        ],
        isActive: true
      },
      {
        id: "2",
        name: "Sarah Johnson",
        email: "sarah.johnson@example.com",
        designation: "ESG Analyst",
        mobileNumber: "+1 (555) 987-6543",
        accessRights: [
          { moduleName: "Dashboard", level: "read" as const },
          { moduleName: "ESG DD", level: "admin" as const },
          { moduleName: "ESG CAP", level: "write" as const },
          { moduleName: "Valuation", level: "read" as const }
        ],
        isActive: true
      },
      {
        id: "3",
        name: "Michael Wong",
        email: "michael.wong@example.com",
        designation: "Investment Analyst",
        mobileNumber: "+1 (555) 456-7890",
        accessRights: [
          { moduleName: "Dashboard", level: "read" as const },
          { moduleName: "Portfolio Companies", level: "write" as const },
          { moduleName: "Valuation", level: "admin" as const }
        ],
        isActive: false
      },
      {
        id: "4",
        name: "Lisa Chen",
        email: "lisa.chen@example.com",
        designation: "Chief Investment Officer",
        mobileNumber: "+1 (555) 567-8901",
        accessRights: [
          { moduleName: "Dashboard", level: "admin" as const },
          { moduleName: "Funds", level: "admin" as const },
          { moduleName: "Team", level: "admin" as const },
          { moduleName: "Portfolio Companies", level: "admin" as const },
          { moduleName: "ESG DD", level: "admin" as const },
          { moduleName: "ESG CAP", level: "admin" as const },
          { moduleName: "Valuation", level: "admin" as const }
        ],
        isActive: true
      }
    ];
    
    const foundMember = sampleTeamMembers.find(m => m.id === id);
    
    if (foundMember) {
      setMember(foundMember);
      setIsActive(foundMember.isActive || false);
      
      // Initialize access rights for all modules and submodules
      const initialAccessRights: AccessRight[] = [];
      
      // Process parent modules and their submodules
      allNavItems.forEach(item => {
        // Add the parent module
        const parentRight = foundMember.accessRights.find(r => r.moduleName === item.title);
        initialAccessRights.push(parentRight || { 
          moduleName: item.title, 
          level: "none" as const 
        });
        
        // Add submodules if any
        if (item.subItems && item.subItems.length > 0) {
          item.subItems.forEach(subItem => {
            const subRight = foundMember.accessRights.find(r => r.moduleName === subItem.title);
            initialAccessRights.push(subRight || { 
              moduleName: subItem.title, 
              level: "none" as const 
            });
          });
        }
      });
      
      setAccessRights(initialAccessRights);
    }
    
    setLoading(false);
  }, [id, allNavItems]);

  const handleAccessChange = (moduleName: string, level: "read" | "write" | "admin" | "none") => {
    setAccessRights(prev => 
      prev.map(right => 
        right.moduleName === moduleName ? { ...right, level } : right
      )
    );
  };

  const handleSaveAccess = () => {
    // In a real app, this would update the database
    if (member) {
      // Update the member with the new access rights
      setMember({ ...member, accessRights });
      
      toast({
        title: "Access rights updated",
        description: "User access permissions have been updated successfully."
      });
    }
  };

  const toggleMemberStatus = () => {
    const newStatus = !isActive;
    setIsActive(newStatus);
    
    if (member) {
      // Update the member with the new status
      setMember({ ...member, isActive: newStatus });
      
      toast({
        title: newStatus ? "User Activated" : "User Deactivated",
        description: `${member.name} has been ${newStatus ? "activated" : "deactivated"}.`
      });
    }
  };

  if (loading) {
    return <div className="container py-8">Loading team member details...</div>;
  }

  if (!member) {
    return <div className="container py-8">Team member not found</div>;
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <TeamMemberHeader id={id!} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <TeamMemberProfile 
            name={member.name}
            designation={member.designation}
            email={member.email}
            mobileNumber={member.mobileNumber}
            isActive={isActive}
            onStatusChange={toggleMemberStatus}
          />
        </div>

        <div className="md:col-span-2">
          <AccessRightsPanel 
            accessRights={accessRights}
            allNavItems={allNavItems}
            accessLevels={accessLevels}
            onAccessChange={handleAccessChange}
            onSave={handleSaveAccess}
          />
        </div>
      </div>
    </div>
  );
}

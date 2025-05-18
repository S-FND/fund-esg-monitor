
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { mainNavItems, esgDDNavItem, valuationNavItem } from "@/components/sidebar/navigation-items";
import { ArrowLeft, Pencil, UserCheck, Building, FolderOpen } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  assignedFunds?: string[];
  assignedCompanies?: string[];
}

const accessLevels = [
  { value: "none", label: "No Access" },
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
  { value: "admin", label: "Admin" }
];

// Sample data for funds and companies
const fundsData = [
  { id: "1", name: "Green Tech Fund I" },
  { id: "2", name: "Sustainable Growth Fund" },
  { id: "3", name: "Impact Ventures" },
];

const companiesData = [
  { id: "1", name: "EcoSolutions Inc.", fundId: "1" },
  { id: "2", name: "GreenHarvest", fundId: "2" },
  { id: "3", name: "MediTech Innovations", fundId: "2" },
  { id: "4", name: "EduForward", fundId: "3" },
  { id: "5", name: "FinSecure", fundId: "3" },
];

export default function TeamMemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessRights, setAccessRights] = useState<AccessRight[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [assignedFunds, setAssignedFunds] = useState<string[]>([]);
  const [assignedCompanies, setAssignedCompanies] = useState<string[]>([]);
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
          { moduleName: "Dashboard", level: "admin" },
          { moduleName: "Funds", level: "write" },
          { moduleName: "Team", level: "write" },
          { moduleName: "Portfolio Companies", level: "write" },
          { moduleName: "ESG DD", level: "read" },
          { moduleName: "ESG CAP", level: "read" },
          { moduleName: "Valuation", level: "read" }
        ],
        isActive: true,
        assignedFunds: ["1", "2"],
        assignedCompanies: ["1", "3"]
      } as TeamMember,
      {
        id: "2",
        name: "Sarah Johnson",
        email: "sarah.johnson@example.com",
        designation: "ESG Analyst",
        mobileNumber: "+1 (555) 987-6543",
        accessRights: [
          { moduleName: "Dashboard", level: "read" },
          { moduleName: "ESG DD", level: "admin" },
          { moduleName: "ESG CAP", level: "write" },
          { moduleName: "Valuation", level: "read" }
        ],
        isActive: true,
        assignedFunds: ["2"],
        assignedCompanies: ["2", "3"]
      } as TeamMember,
      {
        id: "3",
        name: "Michael Wong",
        email: "michael.wong@example.com",
        designation: "Investment Analyst",
        mobileNumber: "+1 (555) 456-7890",
        accessRights: [
          { moduleName: "Dashboard", level: "read" },
          { moduleName: "Portfolio Companies", level: "write" },
          { moduleName: "Valuation", level: "admin" }
        ],
        isActive: false,
        assignedFunds: ["3"],
        assignedCompanies: ["4", "5"]
      } as TeamMember,
      {
        id: "4",
        name: "Lisa Chen",
        email: "lisa.chen@example.com",
        designation: "Chief Investment Officer",
        mobileNumber: "+1 (555) 567-8901",
        accessRights: [
          { moduleName: "Dashboard", level: "admin" },
          { moduleName: "Funds", level: "admin" },
          { moduleName: "Team", level: "admin" },
          { moduleName: "Portfolio Companies", level: "admin" },
          { moduleName: "ESG DD", level: "admin" },
          { moduleName: "ESG CAP", level: "admin" },
          { moduleName: "Valuation", level: "admin" }
        ],
        isActive: true,
        assignedFunds: ["1", "2", "3"],
        assignedCompanies: ["1", "2", "3", "4", "5"]
      } as TeamMember
    ];
    
    const foundMember = sampleTeamMembers.find(m => m.id === id);
    
    if (foundMember) {
      setMember(foundMember);
      setIsActive(foundMember.isActive || false);
      setAssignedFunds(foundMember.assignedFunds || []);
      setAssignedCompanies(foundMember.assignedCompanies || []);
      
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

  const handleFundToggle = (fundId: string) => {
    setAssignedFunds(prev => {
      if (prev.includes(fundId)) {
        return prev.filter(id => id !== fundId);
      } else {
        return [...prev, fundId];
      }
    });
  };

  const handleCompanyToggle = (companyId: string) => {
    setAssignedCompanies(prev => {
      if (prev.includes(companyId)) {
        return prev.filter(id => id !== companyId);
      } else {
        return [...prev, companyId];
      }
    });
  };

  const handleSaveAssignments = () => {
    if (member) {
      // In a real app, this would update the database
      setMember({
        ...member,
        assignedFunds,
        assignedCompanies
      });

      toast({
        title: "Assignments updated",
        description: "Fund and company assignments have been updated successfully."
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
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/team')} 
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold flex-1">Team Member Details</h1>
        <Button 
          onClick={() => navigate(`/team/edit/${id}`)}
          variant="outline"
          className="mr-2"
        >
          <Pencil className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <h3 className="font-semibold text-lg">{member.name}</h3>
                <p className="text-muted-foreground">{member.designation}</p>
              </div>
              <div className="pt-2">
                <p className="text-sm"><span className="font-medium">Email:</span> {member.email}</p>
                {member.mobileNumber && (
                  <p className="text-sm"><span className="font-medium">Mobile:</span> {member.mobileNumber}</p>
                )}
              </div>
              <div className="pt-4 flex items-center space-x-2">
                <Switch
                  id="user-active"
                  checked={isActive}
                  onCheckedChange={toggleMemberStatus}
                />
                <Label htmlFor="user-active" className="cursor-pointer">
                  {isActive ? "Active" : "Inactive"}
                </Label>
                <span className={`ml-2 inline-block w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-gray-300"}`}></span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="access">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="access">Access Rights</TabsTrigger>
              <TabsTrigger value="assignments">Fund & Company Assignments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="access">
              <Card>
                <CardHeader>
                  <CardTitle>Access Rights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {allNavItems.map((item) => {
                      const currentAccess = accessRights.find(r => r.moduleName === item.title)?.level || "none";
                      
                      return (
                        <div key={item.title} className="p-4 border rounded-md space-y-4">
                          <div className="font-medium border-b pb-2">{item.title}</div>
                          
                          <div>
                            <RadioGroup 
                              value={currentAccess} 
                              onValueChange={(value) => handleAccessChange(item.title, value as "read" | "write" | "admin" | "none")}
                              className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4"
                            >
                              {accessLevels.map((level) => (
                                <div key={level.value} className="flex items-center space-x-2">
                                  <RadioGroupItem value={level.value} id={`${item.title}-${level.value}`} />
                                  <Label htmlFor={`${item.title}-${level.value}`} className="text-sm">
                                    {level.label}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                          
                          {/* Render subItems if any */}
                          {item.subItems && item.subItems.length > 0 && (
                            <div className="pl-6 space-y-4 border-l-2 border-gray-200 mt-2">
                              {item.subItems.map((subItem) => {
                                const subItemAccess = accessRights.find(r => r.moduleName === subItem.title)?.level || "none";
                                
                                return (
                                  <div key={subItem.title} className="p-2 bg-gray-50 rounded-md">
                                    <div className="text-sm font-medium mb-2">{subItem.title}</div>
                                    <RadioGroup 
                                      value={subItemAccess} 
                                      onValueChange={(value) => handleAccessChange(subItem.title, value as "read" | "write" | "admin" | "none")}
                                      className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4"
                                    >
                                      {accessLevels.map((level) => (
                                        <div key={level.value} className="flex items-center space-x-2">
                                          <RadioGroupItem value={level.value} id={`${subItem.title}-${level.value}`} />
                                          <Label htmlFor={`${subItem.title}-${level.value}`} className="text-xs">
                                            {level.label}
                                          </Label>
                                        </div>
                                      ))}
                                    </RadioGroup>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div className="flex justify-end mt-6">
                      <Button onClick={handleSaveAccess}>Save Access Rights</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="assignments">
              <Card>
                <CardHeader>
                  <CardTitle>Fund & Company Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium flex items-center mb-4">
                        <FolderOpen className="mr-2 h-5 w-5" />
                        Fund Assignments
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fundsData.map(fund => (
                          <div key={fund.id} className="flex items-center space-x-2 p-3 border rounded-md">
                            <Checkbox 
                              id={`fund-${fund.id}`} 
                              checked={assignedFunds.includes(fund.id)}
                              onCheckedChange={() => handleFundToggle(fund.id)}
                            />
                            <Label htmlFor={`fund-${fund.id}`} className="cursor-pointer flex-1">
                              {fund.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium flex items-center mb-4">
                        <Building className="mr-2 h-5 w-5" />
                        Company Assignments
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {companiesData.map(company => (
                          <div key={company.id} className="flex items-center space-x-2 p-3 border rounded-md">
                            <Checkbox 
                              id={`company-${company.id}`} 
                              checked={assignedCompanies.includes(company.id)}
                              onCheckedChange={() => handleCompanyToggle(company.id)}
                            />
                            <Label htmlFor={`company-${company.id}`} className="cursor-pointer flex-1">
                              {company.name}
                              <span className="block text-xs text-muted-foreground">
                                {fundsData.find(f => f.id === company.fundId)?.name}
                              </span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <Button onClick={handleSaveAssignments}>Save Assignments</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

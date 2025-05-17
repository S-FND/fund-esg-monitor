
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { mainNavItems, esgDDNavItem, valuationNavItem } from "@/components/sidebar/navigation-items";
import { ArrowLeft, Pencil } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

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
}

const accessLevels = [
  { value: "none", label: "No Access" },
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
  { value: "admin", label: "Admin" }
];

export default function TeamMemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessRights, setAccessRights] = useState<AccessRight[]>([]);
  const { toast } = useToast();

  const allNavItems = [
    ...mainNavItems.map((item) => ({ title: item.title, href: item.href })),
    { title: esgDDNavItem.title, href: esgDDNavItem.href },
    { title: valuationNavItem.title, href: valuationNavItem.href }
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
          { moduleName: "Valuation", level: "read" }
        ]
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
        ]
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
        ]
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
        ]
      } as TeamMember
    ];
    
    const foundMember = sampleTeamMembers.find(m => m.id === id);
    
    if (foundMember) {
      setMember(foundMember);
      
      // Initialize access rights for all modules
      const initialAccessRights: AccessRight[] = allNavItems.map(item => {
        const existingRight = foundMember.accessRights.find(r => r.moduleName === item.title);
        return existingRight || { moduleName: item.title, level: "none" as const };
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
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Access Rights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {allNavItems.map((item) => {
                  const currentAccess = accessRights.find(r => r.moduleName === item.title)?.level || "none";
                  
                  return (
                    <div key={item.title} className="p-4 border rounded-md">
                      <div className="font-medium mb-3">{item.title}</div>
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
                  );
                })}

                <div className="flex justify-end mt-6">
                  <Button onClick={handleSaveAccess}>Save Access Rights</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

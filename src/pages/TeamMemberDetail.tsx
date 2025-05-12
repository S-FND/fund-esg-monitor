
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { mainNavItems, esgDDNavItem, valuationNavItem } from "@/components/sidebar/navigation-items";
import { ArrowLeft, Pencil } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  designation?: string;
  mobileNumber?: string;
  accessRights?: string[];
}

export default function TeamMemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessRights, setAccessRights] = useState<Record<string, boolean>>({});

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
        accessRights: ["Dashboard", "Funds", "Team", "Portfolio Companies", "ESG DD"]
      },
      {
        id: "2",
        name: "Sarah Johnson",
        email: "sarah.johnson@example.com",
        designation: "ESG Analyst",
        mobileNumber: "+1 (555) 987-6543",
        accessRights: ["ESG DD", "ESG CAP", "Valuation"]
      },
      {
        id: "3",
        name: "Michael Wong",
        email: "michael.wong@example.com",
        designation: "Investment Analyst",
        mobileNumber: "+1 (555) 456-7890",
        accessRights: ["Portfolio Companies", "Valuation"]
      },
      {
        id: "4",
        name: "Lisa Chen",
        email: "lisa.chen@example.com",
        designation: "Chief Investment Officer",
        mobileNumber: "+1 (555) 567-8901",
        accessRights: ["Dashboard", "Funds", "Team", "Portfolio Companies", "ESG DD", "ESG CAP", "Valuation"]
      }
    ];
    
    const foundMember = sampleTeamMembers.find(m => m.id === id);
    
    if (foundMember) {
      setMember(foundMember);
      
      // Initialize access rights checkboxes
      const accessMap: Record<string, boolean> = {};
      allNavItems.forEach(item => {
        accessMap[item.title] = foundMember.accessRights?.includes(item.title) || false;
      });
      setAccessRights(accessMap);
    }
    
    setLoading(false);
  }, [id]);

  const handleSaveAccess = () => {
    // In a real app, this would update the database
    const updatedAccessRights = Object.entries(accessRights)
      .filter(([_, value]) => value)
      .map(([key]) => key);
    
    setMember(prev => 
      prev ? { ...prev, accessRights: updatedAccessRights } : null
    );
    
    alert("Access rights updated successfully");
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
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allNavItems.map((item) => (
                    <div key={item.title} className="flex items-center space-x-2">
                      <Checkbox
                        id={`access-${item.title}`}
                        checked={accessRights[item.title] || false}
                        onCheckedChange={(checked) => 
                          setAccessRights(prev => ({ 
                            ...prev, 
                            [item.title]: checked === true 
                          }))
                        }
                      />
                      <Label htmlFor={`access-${item.title}`}>{item.title}</Label>
                    </div>
                  ))}
                </div>

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

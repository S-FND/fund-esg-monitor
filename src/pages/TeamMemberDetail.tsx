import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { mainNavItems, esgDDNavItem, valuationNavItem } from "@/components/sidebar/navigation-items";
import { ArrowLeft, Pencil, UserCheck } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { http } from "@/utils/httpInterceptor";
import { Switch } from "@/components/ui/switch";

interface AccessRight {
  moduleName: string;
  level: "read" | "write" | "admin" | "none";
  href:string;
}

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  designation?: string;
  mobileNumber?: string;
  accessRights: AccessRight[];
  active?: boolean;
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
  const [sampleRights,setSampleRights]=useState([])
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
        _id: "1",
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
        active: true
      } as TeamMember,
      {
        _id: "2",
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
        active: true
      } as TeamMember,
      {
        _id: "3",
        name: "Michael Wong",
        email: "michael.wong@example.com",
        designation: "Investment Analyst",
        mobileNumber: "+1 (555) 456-7890",
        accessRights: [
          { moduleName: "Dashboard", level: "read" },
          { moduleName: "Portfolio Companies", level: "write" },
          { moduleName: "Valuation", level: "admin" }
        ],
        active: false
      } as TeamMember,
      {
        _id: "4",
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
        active: true
      } as TeamMember
    ];
    
    // const foundMember = sampleTeamMembers.find(m => m.id === id);
    
    if (member) {
      setMember(member);
      setIsActive(member.active || false);
      
      // Initialize access rights for all modules and submodules
      const initialAccessRights: AccessRight[] = [];
      
      // Process parent modules and their submodules
      allNavItems.forEach(item => {
        // Add the parent module
        const parentRight = member?.accessRights?.find(r => r.moduleName === item.title);
        initialAccessRights.push(parentRight || { 
          moduleName: item.title, 
          level: "none" as const ,
          href:item.href
        });
        
        // Add submodules if any
        if (item.subItems && item.subItems.length > 0) {
          item.subItems.forEach(subItem => {
            const subRight = member.accessRights?.find(r => r.moduleName === subItem.title);
            initialAccessRights.push(subRight || { 
              moduleName: subItem.title, 
              level: "none" as const ,
              href:subItem.href
            });
          });
        }
      });
      // console.log('initialAccessRights',initialAccessRights)
      setAccessRights(initialAccessRights);
    }

    setLoading(false);
  }, [id]);

  const handleAccessChange = (moduleName: string, level: "read" | "write" | "admin" | "none") => {
    let accessData = accessRights.map((right) => {
      if (right['moduleName'] == moduleName) {
        right['level'] = level;
        return right;
      }
      else {
        return right;
      }
    }
    )
    setAccessRights(accessData)
    // setAccessRights(prev => 
    //   prev.map(right => 
    //     right.moduleName === moduleName ? { ...right, level } : right
    //   )
    // );
  };


  const handleSaveAccess = () => {
    // In a real app, this would update the database
    if (member) {
      // Update the member with the new access rights
      setMember({ ...member, accessRights });
      //accessUrls
      toast({
        title: "Access rights updated",
        description: "User access permissions have been updated successfully."
      });

    }
    let payload={
      accessList:{
        urls:accessRights
      },
      subUserId:id
    }
    try {
      let response=http.post(`subuser/role`,payload)
      console.log('response',response)
    } catch (error) {
      
    }
    
    console.log('member', member)
    console.log('allNavItems', allNavItems)
    console.log('accessRights', accessRights)
  };

  // if (loading) {
  //   return <div className="container py-8">Loading team member details...</div>;
  // }

  // if (!member) {
  //   return <div className="container py-8">Team member not found</div>;
  // }

  const getTeamList = async () => {

    try {
      const res = await fetch(`http://localhost:3003` + `/subuser?id=${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        // toast.error("Invalid credentials");
        // setIsLoading(false);
        return;
      }
      else {
        const jsondata = await res.json();
        // setViewingReport(jsondata['data'][0])
        setMember(jsondata['data'][0]['subuser'][0])
        setLoading(false)

      }
    } catch (error) {

    }
    finally {

    }
  }
  const toggleMemberStatus = () => {
    const newStatus = !isActive;
    setIsActive(newStatus);
    
    if (member) {
      // Update the member with the new status
      setMember({ ...member, active: newStatus });
      
      toast({
        title: newStatus ? "User Activated" : "User Deactivated",
        description: `${member.name} has been ${newStatus ? "activated" : "deactivated"}.`
      });
    }
  };

  if (loading) {
    return <div className="container py-8">Loading team member details...</div>;
  }

  const getUserAccess=async ()=>{
    try {
      let response=await http.get(`subuser/access?id=${id}`);
      console.log('response',response)
      if(response.data && response.data.status){
        setAccessRights(response.data.data)
      }
      else if(response.error){
        throw new Error(response.error.message)
      }
    } catch (error) {
      
    }
  }

  useEffect(() => {
    console.log('accessRights',accessRights)
    setSampleRights(accessRights)
  }, [accessRights])

  useEffect(() => {
    getTeamList();
    getUserAccess()
  }, [])

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
                <h3 className="font-semibold text-lg">{member?.name}</h3>
                <p className="text-muted-foreground">{member?.designation}</p>
              </div>
              <div className="pt-2">
                <p className="text-sm"><span className="font-medium">Email:</span> {member?.email}</p>
                {member?.mobileNumber && (
                  <p className="text-sm"><span className="font-medium">Mobile:</span> {member?.mobileNumber}</p>
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
                          {(!item.subItems || item.subItems.length == 0) && accessLevels.map((level) => (
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
        </div>
      </div>
    </div>
  );
}

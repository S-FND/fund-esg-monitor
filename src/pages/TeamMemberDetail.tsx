
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast as Toast } from "sonner";
// import { portfolioCompanies } from "@/features/edit-portfolio-company/portfolioCompanies";

interface AccessRight {
  moduleName: string;
  level: "read" | "write" | "admin" | "none";
  href: string;
}

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  designation?: string;
  mobileNumber?: string;
  accessRights: AccessRight[];
  active?: boolean;
  assignedFunds?: string[];
  assignedCompanies?: string[];
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
  const [sampleRights, setSampleRights] = useState([])
  const [isActive, setIsActive] = useState(false);
  const { toast } = useToast();
  console.log("Team member ID from params:", id);
  const [selectedFunds, setSelectedFunds] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("access");
  const [funds,setFunds]=useState([])
  const[portfolioCompanyList,setPortfolioCompanyList]=useState([])

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
    //accessList

    let payload = {
      accessUrls: {
        urls: accessRights
      },
      subUserId: id,
      active: isActive,
      email: member.email
    }
    console.log('payload', payload)
    try {
      let response = http.post(`subuser/activate`, payload)
      console.log('response', response)
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

  const getTeamDetails = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/subuser?id=${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`
        }
      });

      if (!res.ok) return;

      const jsondata = await res.json();
      const memberData = jsondata['data'][0]['subuser'][0];

      if (memberData) {
        setMember(memberData);
        setIsActive(memberData.active || false);
        setSelectedFunds(memberData.assignedFunds || []);
        setSelectedCompanies(memberData.assignedCompanies || []);

        // Build initialAccessRights from nav items
        const initialAccessRights: AccessRight[] = [];
        allNavItems.forEach(item => {
          const parentRight = memberData.accessRights?.find(r => r.moduleName === item.title);
          initialAccessRights.push(parentRight || {
            moduleName: item.title,
            level: "none",
            href: item.href
          });

          item.subItems?.forEach(subItem => {
            const subRight = memberData.accessRights?.find(r => r.moduleName === subItem.title);
            initialAccessRights.push(subRight || {
              moduleName: subItem.title,
              level: "none",
              href: subItem.href
            });
          });
        });

        setAccessRights(initialAccessRights);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching member details:", error);
    }
  };


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

  const getCompanyList = async () => {

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}` + "/investor/companyInfo/", {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        Toast.error("Invalid credentials");
        setLoading(false);
        return;
      }
      else {
        const jsondata = await res.json();
        console.log('jsondata', jsondata)
        setPortfolioCompanyList(jsondata['data'])

      }

    } catch (error) {
      console.error("Api call:", error);
      Toast.error("API Call failed. Please try again.");
    } finally {
      // setIsLoading(false);
    }
  }

  const getUserAccess = async () => {
    try {
      let response = await http.get(`subuser/access?id=${id}`);
      console.log('response', response)
      if (response.data && response.data.status) {
        setAccessRights(response.data.data)
        if (response.data.funds && response.data.funds.length > 0) {
          setSelectedFunds(response.data.funds)
        }
        if (response.data.companies && response.data.companies.length > 0) {
          setSelectedCompanies(response.data.companies)
        }
      }
      else if (response.error) {
        throw new Error(response.error.message)
      }
    } catch (error) {

    }
  }
  const toggleFundSelection = (fundId: string) => {
    setSelectedFunds(prev =>
      prev.includes(fundId)
        ? prev.filter(id => id !== fundId)
        : [...prev, fundId]
    );
    console.log('selectedFunds', selectedFunds)
  };

  const toggleCompanySelection = (companyId: string) => {
    setSelectedCompanies(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleSaveAssignments = async () => {
    if (member) {
      // Update the member with the new assignments
      const updatedMember = {
        ...member,
        assignedFunds: selectedFunds,
        assignedCompanies: selectedCompanies
      };
      console.log('updatedMember', updatedMember)
      setMember(updatedMember);
      let payload = {
        accessUrls: {
          funds: selectedFunds,
          companies:selectedCompanies
        },
        subUserId: id,
        active: member.active,
        email: member.email
      }
      console.log('payload', payload)
      try {
        let response = await http.post(`subuser/activate`, payload)
        if (response.data) {
          toast({
            title: "Assignments updated",
            description: "Fund and company assignments have been updated successfully."
          });
        }
      } catch (error) {

      }


    }
  };
  const getFundList = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}` + `/investor/fund`, {
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
        console.log('jsondata', jsondata)
        setFunds(jsondata['data'])
      }
    } catch (error) {
      console.error("Api call:", error);
      // toast.error("API Call failed. Please try again.");
    } finally {
      // setIsLoading(false);
    }
  }



  useEffect(() => {
    if (id) {
      console.log("Triggered by ID:", id);
      getTeamDetails();
      getUserAccess();
      getFundList()
    }
  }, [id]);

  useEffect(() => {
    getCompanyList()
  }, []);

  // useEffect(() => {
  //   console.log('accessRights',accessRights)
  //   setSampleRights(accessRights)
  // }, [accessRights])

  // useEffect(() => {
  //   // getTeamList();
  //   // getUserAccess()
  // }, [])
  if (loading) {
    return <div className="container py-8">Loading team member details...</div>;
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
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="access">Access Rights</TabsTrigger>
                  <TabsTrigger value="funds">Funds</TabsTrigger>
                  <TabsTrigger value="companies">Companies</TabsTrigger>
                </TabsList>
                <TabsContent value="access">
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
                </TabsContent>

                <TabsContent value="funds">
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Assign Funds</h3>
                    <p className="text-muted-foreground mb-4">Select the funds that this team member should have access to:</p>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Fund Name</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {funds.map((fund) => (
                          <TableRow key={fund._id}>
                            <TableCell className="w-12">
                              <Checkbox
                                checked={selectedFunds.includes(fund._id)}
                                onCheckedChange={() => toggleFundSelection(fund._id)}
                                id={`fund-${fund._id}`}
                              />
                            </TableCell>
                            <TableCell>
                              <Label htmlFor={`fund-${fund._id}`} className="cursor-pointer">
                                {fund.name}
                              </Label>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="flex justify-end mt-6">
                      <Button onClick={handleSaveAssignments}>Save Fund Assignments</Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="companies">
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Assign Companies</h3>
                    <p className="text-muted-foreground mb-4">Select the portfolio companies that this team member should have access to:</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Company Name</TableHead>
                          <TableHead>Sector</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {portfolioCompanyList
                        .filter(c => c.companyName)
                        .sort((a, b) => a.companyName.localeCompare(b.companyName))
                        .map((company) => (
                          <TableRow key={company._id}>
                            <TableCell className="w-12">
                              <Checkbox
                                checked={selectedCompanies.includes(company._id)}
                                onCheckedChange={() => toggleCompanySelection(company._id)}
                                id={`company-${company._id}`}
                              />
                            </TableCell>
                            <TableCell>
                              <Label htmlFor={`company-${company._id}`} className="cursor-pointer">
                                {company.companyName}
                              </Label>
                            </TableCell>
                            <TableCell>{company.sector}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="flex justify-end mt-6">
                      <Button onClick={handleSaveAssignments}>Save Company Assignments</Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

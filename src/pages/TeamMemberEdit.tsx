
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  designation?: string;
  mobileNumber?: string;
  accessRights?: string[];
}

export default function TeamMemberEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [initialFormData, setInitialFormData] = useState({
    name: "",
    email: "",
    designation: "",
    mobileNumber: "",
  });
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    designation: "",
    mobileNumber: "",
  });

  // useEffect(() => {
  //   // Simulate fetching member details
  //   setLoading(true);
    
  //   // Sample data - in a real app, this would be fetched from the database
  //   const sampleTeamMembers = [
  //     {
  //       id: "1",
  //       name: "John Smith",
  //       email: "john.smith@example.com",
  //       designation: "Fund Manager",
  //       mobileNumber: "+1 (555) 123-4567",
  //       accessRights: ["Dashboard", "Funds", "Team", "Portfolio Companies", "ESG DD"]
  //     },
  //     {
  //       id: "2",
  //       name: "Sarah Johnson",
  //       email: "sarah.johnson@example.com",
  //       designation: "ESG Analyst",
  //       mobileNumber: "+1 (555) 987-6543",
  //       accessRights: ["ESG DD", "ESG CAP", "Valuation"]
  //     },
  //     {
  //       id: "3",
  //       name: "Michael Wong",
  //       email: "michael.wong@example.com",
  //       designation: "Investment Analyst",
  //       mobileNumber: "+1 (555) 456-7890",
  //       accessRights: ["Portfolio Companies", "Valuation"]
  //     },
  //     {
  //       id: "4",
  //       name: "Lisa Chen",
  //       email: "lisa.chen@example.com",
  //       designation: "Chief Investment Officer",
  //       mobileNumber: "+1 (555) 567-8901",
  //       accessRights: ["Dashboard", "Funds", "Team", "Portfolio Companies", "ESG DD", "ESG CAP", "Valuation"]
  //     }
  //   ];
    
  //   const foundMember = sampleTeamMembers.find(m => m.id === id);
    
  //   if (foundMember) {
  //     setFormData({
  //       name: foundMember.name,
  //       email: foundMember.email,
  //       designation: foundMember.designation || "",
  //       mobileNumber: foundMember.mobileNumber || "",
  //     });
  //   }
    
  //   setLoading(false);
  // }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    console.log('formData',formData)
    try {
      // Insert team member
      const res = await fetch(`http://localhost:3002` + `/subuser`, {
        method: "POST",
        body:JSON.stringify({...formData}),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        // toast.error("Invalid credentials");
        // setIsLoading(false);
        return;
      }
      else {

      }

       // Simulate API call to update user
    setTimeout(() => {
      toast({
        title: "Team member updated",
        description: `${formData.name}'s information has been updated successfully.`
      });
      setSubmitting(false);
      // navigate(`/team/${id}`);
    }, 1000);
    } catch (error) {
      console.error("Error adding team member:", error);
      toast({
        title: "Error",
        description: "Could not add team member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
   
  };

  const getTeamList=async ()=>{

    try {
      const res = await fetch(`http://localhost:3002` + `/subuser?id=${id}`, {
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
        setFormData(jsondata['data'][0]['subuser'][0]);
        setInitialFormData({
          name:jsondata['data'][0]['subuser'][0]['name'],
          email:jsondata['data'][0]['subuser'][0]['email'],
          designation:jsondata['data'][0]['subuser'][0]['designation'],
          mobileNumber:jsondata['data'][0]['subuser'][0]['mobileNumber']})
        setLoading(false)

      }
    } catch (error) {
      
    }
    finally{

    }
  }

  useEffect(()=>{
    getTeamList()
  },[])

  if (loading) {
    return <div className="container py-8">Loading team member data...</div>;
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(`/team/${id}`)} 
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold">Edit Team Member</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Full Name"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Email Address"
                  disabled={submitting}
                  readOnly={true}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input 
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  placeholder="Designation"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input 
                  id="mobileNumber"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  placeholder="Mobile Number"
                  disabled={submitting}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(`/team/${id}`)}
              className="mr-2"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              <Save className="h-4 w-4 mr-1" />
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

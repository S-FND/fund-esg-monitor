
import React, { useState, useEffect } from "react";
import { TeamAddDialog } from "@/components/TeamAddDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Pencil, Eye } from "lucide-react";

type TeamMember = {
  _id: string;
  name: string;
  email: string;
  designation?: string;
  mobileNumber?: string;
  accessRights?: string[];
};

export default function Team() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingDialogOpen, setAddingDialogOpen] = useState(false);
  const navigate = useNavigate();

  const getTeamList=async ()=>{
    try {
      const res = await fetch(`http://localhost:3003` + `/subuser`, {
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
        setTeam(jsondata['data'][0]['subuser'])
        setLoading(false)

      }
    } catch (error) {
      
    }
    finally{

    }
  }

  useEffect(() => {
    // Fetch team members when component mounts
    const fetchData = async () => {
      setLoading(true);

      // For demo purposes, let's use some sample data instead of fetching from Supabase
      const sampleTeamMembers = [
        {
          _id: "1",
          name: "John Smith",
          email: "john.smith@example.com",
          designation: "Fund Manager",
          mobileNumber: "+1 (555) 123-4567",
          accessRights: ["Dashboard", "Funds", "Team", "Portfolio Companies", "ESG DD"]
        },
        {
          _id: "2",
          name: "Sarah Johnson",
          email: "sarah.johnson@example.com",
          designation: "ESG Analyst",
          mobileNumber: "+1 (555) 987-6543",
          accessRights: ["ESG DD", "ESG CAP", "Valuation"]
        },
        {
          _id: "3",
          name: "Michael Wong",
          email: "michael.wong@example.com",
          designation: "Investment Analyst",
          mobileNumber: "+1 (555) 456-7890",
          accessRights: ["Portfolio Companies", "Valuation"]
        },
        {
          _id: "4",
          name: "Lisa Chen",
          email: "lisa.chen@example.com",
          designation: "Chief Investment Officer",
          mobileNumber: "+1 (555) 567-8901",
          accessRights: ["Dashboard", "Funds", "Team", "Portfolio Companies", "ESG DD", "ESG CAP", "Valuation"]
        }
      ];
      
      setTeam(sampleTeamMembers);
      setLoading(false);
    };

    fetchData();
    getTeamList()
  }, []);

  const handleAddTeamMember = (member: { name: string; email: string; designation: string; mobileNumber: string }) => {
    const newMember = {
      _id: Math.random().toString(36).substr(2, 9),
      ...member,
      accessRights: ["Dashboard"]
    };
    setTeam(prev => [...prev, newMember]);
  };

  const handleViewMember = (id: string) => {
    navigate(`/team/${id}`);
  };

  const handleEditMember = (id: string) => {
    navigate(`/team/edit/${id}`);
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Team Management</h1>
        <Button onClick={() => setAddingDialogOpen(true)}>Add New Team Member</Button>
      </div>
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-4">Loading team members...</div>
        ) : team.length === 0 ? (
          <div className="text-muted-foreground">No team members yet.</div>
        ) : (
          team.map((member) => (
            <Card key={member._id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <div className="font-medium">{member.name}</div>
                <div className="text-muted-foreground text-sm">{member.email}</div>
                {member.designation && (
                  <div className="text-xs text-muted-foreground">Designation: {member.designation}</div>
                )}
                {member.mobileNumber && (
                  <div className="text-xs text-muted-foreground">Mobile: {member.mobileNumber}</div>
                )}
                {member.accessRights && member.accessRights.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Access: {member.accessRights.slice(0, 2).join(", ")}
                    {member.accessRights.length > 2 && ` +${member.accessRights.length - 2} more`}
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0 mt-2 md:mt-0">
                <Button variant="outline" size="sm" onClick={() => handleViewMember(member._id)}>
                  <Eye className="h-4 w-4 mr-1" />
                  Details
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEditMember(member._id)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <TeamAddDialog open={addingDialogOpen} onOpenChange={setAddingDialogOpen} onAdd={handleAddTeamMember} />

      <div className="mt-8 text-sm text-muted-foreground">
        <ul className="list-disc ml-6">
          <li>Admins can add team members and each new member will receive an email invite.</li>
          <li>This is a demo. No actual invite emails will be sent.</li>
        </ul>
      </div>
    </div>
  );
}

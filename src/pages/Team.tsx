
import React, { useState, useEffect } from "react";
import { TeamAddDialog } from "@/components/TeamAddDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Pencil, Eye, UserCheck, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  designation?: string;
  mobileNumber?: string;
  accessRights?: string[];
  isActive: boolean;
};

export default function Team() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingDialogOpen, setAddingDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Fetch team members when component mounts
    const fetchData = async () => {
      setLoading(true);

      // For demo purposes, let's use some sample data instead of fetching from Supabase
      const sampleTeamMembers = [
        {
          id: "1",
          name: "John Smith",
          email: "john.smith@example.com",
          designation: "Fund Manager",
          mobileNumber: "+1 (555) 123-4567",
          accessRights: ["Dashboard", "Funds", "Team", "Portfolio Companies", "ESG DD"],
          isActive: true
        },
        {
          id: "2",
          name: "Sarah Johnson",
          email: "sarah.johnson@example.com",
          designation: "ESG Analyst",
          mobileNumber: "+1 (555) 987-6543",
          accessRights: ["ESG DD", "ESG CAP", "Valuation"],
          isActive: true
        },
        {
          id: "3",
          name: "Michael Wong",
          email: "michael.wong@example.com",
          designation: "Investment Analyst",
          mobileNumber: "+1 (555) 456-7890",
          accessRights: ["Portfolio Companies", "Valuation"],
          isActive: false
        },
        {
          id: "4",
          name: "Lisa Chen",
          email: "lisa.chen@example.com",
          designation: "Chief Investment Officer",
          mobileNumber: "+1 (555) 567-8901",
          accessRights: ["Dashboard", "Funds", "Team", "Portfolio Companies", "ESG DD", "ESG CAP", "Valuation"],
          isActive: true
        }
      ];
      
      setTeam(sampleTeamMembers);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleAddTeamMember = (member: { name: string; email: string; designation: string; mobileNumber: string }) => {
    const newMember = {
      id: Math.random().toString(36).substr(2, 9),
      ...member,
      accessRights: ["Dashboard"],
      isActive: false
    };
    setTeam(prev => [...prev, newMember]);
  };

  const handleViewMember = (id: string) => {
    navigate(`/team/${id}`);
  };

  const handleEditMember = (id: string) => {
    navigate(`/team/edit/${id}`);
  };

  const toggleActivateUser = (id: string) => {
    setTeam(prevTeam => 
      prevTeam.map(member => {
        if (member.id === id) {
          const newState = !member.isActive;
          toast({
            title: newState ? "User Activated" : "User Deactivated",
            description: `${member.name} has been ${newState ? "activated" : "deactivated"}.`
          });
          return { ...member, isActive: newState };
        }
        return member;
      })
    );
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
            <Card key={member.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${member.isActive ? "bg-green-500" : "bg-gray-300"}`}></div>
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
              </div>
              <div className="flex gap-2 shrink-0 mt-2 md:mt-0">
                <Button 
                  variant={member.isActive ? "outline" : "default"} 
                  size="sm" 
                  onClick={() => toggleActivateUser(member.id)}
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  {member.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleViewMember(member.id)}>
                  <Eye className="h-4 w-4 mr-1" />
                  Details
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEditMember(member.id)}>
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
          <li>New members are added with inactive status until they complete their registration.</li>
          <li>This is a demo. No actual invite emails will be sent.</li>
        </ul>
      </div>
    </div>
  );
}

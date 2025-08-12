import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamAddDialogSimple } from "@/components/TeamAddDialog/TeamAddDialogSimple";
import { useToast } from "@/hooks/use-toast";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  designation: string | null;
  mobile_number: string | null;
  role: 'investor_admin' | 'team_member_editor' | 'team_member_readonly' | 'auditor' | 'super_admin';
  is_active: boolean;
  user_id: string | null;
  invited_at: string;
  accepted_at: string | null;
}

export default function TeamManagement() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingDialogOpen, setAddingDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load initial mock data
    setLoading(false);
  }, []);

  const handleAddTeamMember = (member: { name: string; email: string; designation: string; mobileNumber: string }) => {
    const newMember: TeamMember = {
      id: crypto.randomUUID(),
      email: member.email,
      full_name: member.name,
      designation: member.designation,
      mobile_number: member.mobileNumber,
      role: 'team_member_readonly',
      is_active: true,
      user_id: null,
      invited_at: new Date().toISOString(),
      accepted_at: null,
    };
    
    setTeamMembers(prev => [newMember, ...prev]);
    
    toast({
      title: "Team Member Invited",
      description: `${member.name} has been invited to join the team.`,
    });
  };

  const updateMemberRole = (memberId: string, newRole: string) => {
    setTeamMembers(prev => 
      prev.map(member => 
        member.id === memberId 
          ? { ...member, role: newRole as any }
          : member
      )
    );
    
    toast({
      title: "Success",
      description: "Member role updated successfully",
    });
  };

  const toggleMemberStatus = (memberId: string, isActive: boolean) => {
    setTeamMembers(prev => 
      prev.map(member => 
        member.id === memberId 
          ? { ...member, is_active: !isActive }
          : member
      )
    );
    
    toast({
      title: "Success",
      description: `Member ${!isActive ? 'activated' : 'deactivated'} successfully`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">Manage your team members and their access permissions</p>
        </div>
        <Button onClick={() => setAddingDialogOpen(true)}>
          Add Team Member
        </Button>
      </div>

      {teamMembers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center mb-4">
              No team members found. Add your first team member to get started.
            </p>
            <Button onClick={() => setAddingDialogOpen(true)}>
              Add Team Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {teamMembers.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{member.full_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    {member.designation && (
                      <p className="text-sm text-muted-foreground">{member.designation}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={member.is_active ? "default" : "secondary"}>
                      {member.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant={member.user_id ? "default" : "outline"}>
                      {member.user_id ? "Joined" : "Invited"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="text-sm font-medium">Role</label>
                      <Select
                        value={member.role}
                        onValueChange={(value) => updateMemberRole(member.id, value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="team_member_readonly">Read Only</SelectItem>
                          <SelectItem value="team_member_editor">Editor</SelectItem>
                          <SelectItem value="auditor">Auditor</SelectItem>
                          <SelectItem value="investor_admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {member.mobile_number && (
                      <div>
                        <label className="text-sm font-medium">Mobile</label>
                        <p className="text-sm">{member.mobile_number}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={member.is_active ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleMemberStatus(member.id, member.is_active)}
                    >
                      {member.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  <p>Invited: {new Date(member.invited_at).toLocaleDateString()}</p>
                  {member.accepted_at && (
                    <p>Joined: {new Date(member.accepted_at).toLocaleDateString()}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TeamAddDialogSimple
        onAdd={handleAddTeamMember}
        open={addingDialogOpen}
        onOpenChange={setAddingDialogOpen}
      />
    </div>
  );
}
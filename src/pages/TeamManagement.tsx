import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamAddDialogSimple } from "@/components/TeamAddDialog/TeamAddDialogSimple";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get user's profile to get tenant_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.tenant_id) {
        setLoading(false);
        return;
      }

      // Fetch team members for this tenant
      const { data: members, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading team members:', error);
        toast({
          title: "Error",
          description: "Failed to load team members.",
          variant: "destructive",
        });
      } else {
        setTeamMembers(members || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeamMember = async (member: { name: string; email: string; designation: string; mobileNumber: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to add team members.",
          variant: "destructive",
        });
        return;
      }

      // Get user's profile to get tenant_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.tenant_id) {
        toast({
          title: "Error",
          description: "Unable to determine your organization. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      // Insert team member into database
      const { data: newMember, error } = await supabase
        .from('team_members')
        .insert({
          email: member.email,
          full_name: member.name,
          designation: member.designation,
          mobile_number: member.mobileNumber,
          role: 'team_member_readonly',
          is_active: true,
          tenant_id: profile.tenant_id,
          invited_by: user.id
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Add to local state
      setTeamMembers(prev => [newMember, ...prev]);
      
      toast({
        title: "Team Member Invited",
        description: `${member.name} has been invited to join the team and saved to the database.`,
      });
    } catch (error) {
      console.error('Error adding team member:', error);
      toast({
        title: "Error",
        description: "Failed to add team member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole as any })
        .eq('id', memberId);

      if (error) {
        throw error;
      }

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
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: "Error",
        description: "Failed to update member role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleMemberStatus = async (memberId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ is_active: !isActive })
        .eq('id', memberId);

      if (error) {
        throw error;
      }

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
    } catch (error) {
      console.error('Error updating member status:', error);
      toast({
        title: "Error",
        description: "Failed to update member status. Please try again.",
        variant: "destructive",
      });
    }
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
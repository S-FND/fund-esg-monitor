
import React, { useState, useEffect } from "react";
import { TeamAddDialog } from "@/components/TeamAddDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type TeamMember = {
  name: string;
  email: string;
  designation?: string;
  mobileNumber?: string;
};

export default function Team() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingDialogOpen, setAddingDialogOpen] = useState(false);

  useEffect(() => {
    // Fetch team members when component mounts
    const fetchData = async () => {
      setLoading(true);

      // Fetch team members
      const { data: teamData, error: teamError } = await supabase
        .from('team_members')
        .select(`
          id, 
          name, 
          email, 
          designation,
          mobile_number
        `);

      if (teamError) {
        console.error('Error fetching team members:', teamError);
      } else if (teamData) {
        const formattedTeam = teamData.map(member => ({
          name: member.name,
          email: member.email,
          designation: member.designation ?? "",
          mobileNumber: member.mobile_number ?? "",
        }));
        setTeam(formattedTeam);
      }
      
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleAddTeamMember = (member: { name: string; email: string; designation: string; mobileNumber: string }) => {
    setTeam(prev => [...prev, member]);
  };

  return (
    <div className="container max-w-2xl mx-auto py-8">
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
          team.map((member, idx) => (
            <Card key={member.email + idx} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <div className="font-medium">{member.name}</div>
                <div className="text-muted-foreground text-sm">{member.email}</div>
                {member.designation && (
                  <div className="text-xs text-muted-foreground">Designation: {member.designation}</div>
                )}
                {member.mobileNumber && (
                  <div className="text-xs text-muted-foreground">Mobile: {member.mobileNumber}</div>
                )}
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

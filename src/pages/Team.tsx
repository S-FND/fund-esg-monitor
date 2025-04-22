
import React, { useState, useEffect } from "react";
import { TeamAddDialog } from "@/components/TeamAddDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

// Update the type definition to use string IDs (UUIDs) instead of numbers
type TeamMember = {
  name: string;
  email: string;
  fundIds: string[];
};

// Update the fund type to use string IDs
type Fund = {
  id: string;
  name: string;
};

export default function Team() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingDialogOpen, setAddingDialogOpen] = useState(false);

  useEffect(() => {
    // Fetch team members and funds when component mounts
    const fetchData = async () => {
      setLoading(true);

      // Fetch funds
      const { data: fundsData, error: fundsError } = await supabase
        .from('funds')
        .select('*');

      if (fundsError) {
        console.error('Error fetching funds:', fundsError);
      } else if (fundsData) {
        setFunds(fundsData);
      }

      // Fetch team members
      const { data: teamData, error: teamError } = await supabase
        .from('team_members')
        .select(`
          id, 
          name, 
          email, 
          team_member_funds (
            fund_id
          )
        `);

      if (teamError) {
        console.error('Error fetching team members:', teamError);
      } else if (teamData) {
        // Transform the data to match our TeamMember type
        const formattedTeam = teamData.map(member => ({
          name: member.name,
          email: member.email,
          fundIds: member.team_member_funds?.map(f => f.fund_id) || []
        }));

        setTeam(formattedTeam);
      }
      
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleAddTeamMember = (member: { name: string; email: string; fundIds: string[] }) => {
    setTeam(prev => [...prev, member]);
  };

  const getFundNames = (ids: string[]) =>
    ids.length === 0
      ? "None"
      : ids.map(id => funds.find(f => f.id === id)?.name).filter(Boolean).join(", ");

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
              </div>
              <div>
                <span className="text-xs font-semibold">Assigned Funds: </span>
                <span className="text-xs">{getFundNames(member.fundIds) || "None"}</span>
              </div>
            </Card>
          ))
        )}
      </div>

      <TeamAddDialog open={addingDialogOpen} onOpenChange={setAddingDialogOpen} onAdd={handleAddTeamMember} />

      <div className="mt-8 text-sm text-muted-foreground">
        <ul className="list-disc ml-6">
          <li>Admins can add team members, assign them to funds, and each new member receives an email invite.</li>
          <li>This is a demo. No actual invite emails will be sent.</li>
        </ul>
      </div>
    </div>
  );
}

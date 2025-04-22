
import React, { useState } from "react";
import { TeamAddDialog } from "@/components/TeamAddDialog";
import { Card } from "@/components/ui/card";

// Dummy funds for selection
const dummyFunds = [
  { id: 1, name: "Climate Impact Fund" },
  { id: 2, name: "Future Tech Fund" },
  { id: 3, name: "Sustainable Ventures" },
];

// Dummy team member structure
type TeamMember = {
  name: string;
  email: string;
  fundIds: number[];
};

export default function Team() {
  const [team, setTeam] = useState<TeamMember[]>([
    {
      name: "Main Admin",
      email: "admin@investor.com",
      fundIds: [1, 2],
    },
  ]);

  const handleAddTeamMember = (m: TeamMember) => {
    setTeam(prev => [...prev, m]);
  };

  const getFundNames = (ids: number[]) =>
    ids.length === 0
      ? "None"
      : ids.map(id => dummyFunds.find(f => f.id === id)?.name).filter(Boolean).join(", ");

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Team Management</h1>
        <TeamAddDialog allFunds={dummyFunds} onAdd={handleAddTeamMember} />
      </div>
      <div className="space-y-4">
        {team.length === 0 ? (
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
      <div className="mt-8 text-sm text-muted-foreground">
        <ul className="list-disc ml-6">
          <li>Admins can add team members, assign them to funds, and each new member receives an email invite.</li>
          <li>This is a demo. No actual invite emails will be sent.</li>
        </ul>
      </div>
    </div>
  );
}


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

interface TeamMember {
  id: number;
  name: string;
  designation: string;
}

interface FundTeamMembersFieldProps {
  teamMembers: TeamMember[];
  selectedTeamMembers: TeamMember[];
  setSelectedTeamMembers: (teamMembers: TeamMember[]) => void;
}

export function FundTeamMembersField({ 
  teamMembers, 
  selectedTeamMembers, 
  setSelectedTeamMembers 
}: FundTeamMembersFieldProps) {
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string>("");
  
  const availableTeamMembers = teamMembers.filter(
    member => !selectedTeamMembers.some(selected => selected.id === member.id)
  );

  const handleAddTeamMember = () => {
    if (!selectedTeamMemberId) return;
    
    const memberToAdd = teamMembers.find(m => m.id === parseInt(selectedTeamMemberId));
    if (memberToAdd && !selectedTeamMembers.some(m => m.id === memberToAdd.id)) {
      setSelectedTeamMembers([...selectedTeamMembers, memberToAdd]);
      setSelectedTeamMemberId("");
    }
  };

  const handleRemoveTeamMember = (memberId: number) => {
    setSelectedTeamMembers(selectedTeamMembers.filter(m => m.id !== memberId));
  };

  return (
    <div className="space-y-4">
      <Label>Fund Team Members</Label>
      <div className="flex space-x-2">
        <Select 
          value={selectedTeamMemberId} 
          onValueChange={setSelectedTeamMemberId}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a team member" />
          </SelectTrigger>
          <SelectContent>
            {availableTeamMembers.length > 0 ? (
              availableTeamMembers.map(member => (
                <SelectItem key={member.id} value={member.id.toString()}>
                  {member.name} - {member.designation}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>No team members available</SelectItem>
            )}
          </SelectContent>
        </Select>
        <Button 
          type="button" 
          onClick={handleAddTeamMember}
          disabled={!selectedTeamMemberId}
        >
          Add Team Member
        </Button>
      </div>

      {selectedTeamMembers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
          {selectedTeamMembers.map(member => (
            <Card key={member.id} className="p-2 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{member.name}</span>
                <span className="text-xs text-muted-foreground">{member.designation}</span>
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => handleRemoveTeamMember(member.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

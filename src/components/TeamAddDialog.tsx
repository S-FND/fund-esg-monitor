
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue, 
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

type Fund = {
  id: string;
  name: string;
};

interface TeamAddDialogProps {
  onAdd: (member: { name: string; email: string; fundIds: string[] }) => void;
}

export function TeamAddDialog({ onAdd }: TeamAddDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [funds, setFunds] = useState<Fund[]>([]);
  const [selectedFunds, setSelectedFunds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch available funds
    const fetchFunds = async () => {
      const { data, error } = await supabase.from('funds').select('*');
      if (data) setFunds(data);
      if (error) console.error('Error fetching funds:', error);
    };

    fetchFunds();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Insert team member
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .insert({
          name, 
          email,
          fund_admin_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select('id')
        .single();

      if (memberError) throw memberError;

      // Insert fund assignments
      const fundAssignments = selectedFunds.map(fundId => ({
        team_member_id: memberData.id,
        fund_id: fundId
      }));

      const { error: assignmentError } = await supabase
        .from('team_member_funds')
        .insert(fundAssignments);

      if (assignmentError) throw assignmentError;

      // Simulate invite (replace with actual email invite later)
      onAdd({
        name,
        email,
        fundIds: selectedFunds,
      });

      // Reset form
      setName("");
      setEmail("");
      setSelectedFunds([]);
      setOpen(false);

      toast({
        title: "Team Member Added",
        description: `${name} has been added to the team.`,
      });
    } catch (error) {
      console.error('Error adding team member:', error);
      toast({
        title: "Error",
        description: "Could not add team member. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Team Member</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Invite a new team member and assign them to funds.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              required
              disabled={submitting}
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              disabled={submitting}
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label>Assign to Funds</Label>
            <Select 
              onValueChange={(value) => 
                setSelectedFunds(prev => 
                  prev.includes(value) 
                    ? prev.filter(id => id !== value) 
                    : [...prev, value]
                )
              } 
              value={selectedFunds[selectedFunds.length - 1]}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select funds" />
              </SelectTrigger>
              <SelectContent>
                {funds.map(fund => (
                  <SelectItem key={fund.id} value={fund.id}>
                    {fund.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground mt-1">
              {selectedFunds.length > 0 
                ? `${selectedFunds.length} fund(s) selected` 
                : "No funds selected"}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add Team Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

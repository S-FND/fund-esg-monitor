import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface TeamAddDialogSimpleProps {
  onAdd: (member: { 
    name: string; 
    email: string; 
    designation: string;
    mobileNumber: string;
  }) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TeamAddDialogSimple({
  onAdd,
  open,
  onOpenChange,
}: TeamAddDialogSimpleProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const isControlled = open !== undefined && onOpenChange;
  const actualOpen = isControlled ? open : internalOpen;
  const setActualOpen = isControlled ? onOpenChange! : setInternalOpen;

  const reset = () => {
    setName("");
    setEmail("");
    setDesignation("");
    setMobileNumber("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Simulate adding team member
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onAdd({
        name,
        email,
        designation,
        mobileNumber,
      });

      reset();
      setActualOpen(false);

      toast({
        title: "Team Member Invited",
        description: `${name} has been invited to join the team.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not invite team member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={actualOpen} onOpenChange={setActualOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to a new team member to join your workspace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="team-name">Full Name</Label>
              <Input
                id="team-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
            <div>
              <Label htmlFor="team-email">Email</Label>
              <Input
                id="team-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
            <div>
              <Label htmlFor="team-designation">Designation</Label>
              <Input
                id="team-designation"
                type="text"
                value={designation}
                onChange={e => setDesignation(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
            <div>
              <Label htmlFor="team-mobile">Mobile Number</Label>
              <Input
                id="team-mobile"
                type="tel"
                value={mobileNumber}
                onChange={e => setMobileNumber(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setActualOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending Invitation..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
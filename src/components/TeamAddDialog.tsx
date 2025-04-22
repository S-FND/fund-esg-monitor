
import React, { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectMultiValue } from "@radix-ui/react-select";

type Fund = {
  id: number;
  name: string;
};

interface TeamAddDialogProps {
  allFunds: Fund[];
  onAdd: (member: { name: string; email: string; fundIds: number[] }) => void;
}

export function TeamAddDialog({ allFunds, onAdd }: TeamAddDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedFunds, setSelectedFunds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSelectFund = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions).map(opt => Number(opt.value));
    setSelectedFunds(selected);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate invite
    setTimeout(() => {
      onAdd({
        name,
        email,
        fundIds: selectedFunds,
      });
      setOpen(false);
      setName("");
      setEmail("");
      setSelectedFunds([]);
      setSubmitting(false);
      toast({
        title: "Invite Sent",
        description: `An invite has been sent to ${email}.`,
      });
    }, 800);
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
            <Label htmlFor="funds">Assign to Funds</Label>
            <select
              id="funds"
              name="funds"
              multiple
              required
              disabled={submitting}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-base min-h-[40px]"
              value={selectedFunds.map(id => String(id))}
              onChange={handleSelectFund}
              size={Math.min(allFunds.length, 5)}
            >
              {allFunds.map(fund => (
                <option key={fund.id} value={fund.id}>
                  {fund.name}
                </option>
              ))}
            </select>
            <div className="text-xs text-muted-foreground mt-1">
              Hold Ctrl/Cmd to select multiple
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Inviting..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

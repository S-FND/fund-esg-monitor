
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { TeamAddForm } from "./TeamAddForm";
import { useTeamAddForm } from "./useTeamAddForm";

interface TeamAddDialogProps {
  onAdd: (member: { name: string; email: string; fundIds: string[] }) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TeamAddDialog({
  onAdd,
  open,
  onOpenChange,
}: TeamAddDialogProps) {
  // Support both controlled & uncontrolled dialog
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined && onOpenChange;
  const actualOpen = isControlled ? open : internalOpen;
  const setActualOpen = isControlled ? onOpenChange! : setInternalOpen;

  const {
    name,
    setName,
    email,
    setEmail,
    funds,
    selectedFunds,
    setSelectedFunds,
    submitting,
    handleSubmit,
  } = useTeamAddForm({
    onAdd,
    onClose: () => setActualOpen(false),
  });

  return (
    <Dialog open={actualOpen} onOpenChange={setActualOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Invite a new team member and assign them to funds.
          </DialogDescription>
        </DialogHeader>
        <TeamAddForm
          name={name}
          setName={setName}
          email={email}
          setEmail={setEmail}
          funds={funds}
          selectedFunds={selectedFunds}
          setSelectedFunds={setSelectedFunds}
          submitting={submitting}
          handleSubmit={handleSubmit}
        />
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}


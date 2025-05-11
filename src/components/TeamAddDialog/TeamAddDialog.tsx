
import React from "react";
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
  onAdd: (member: { 
    name: string; 
    email: string; 
    designation: string;
    mobileNumber: string;
  }) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TeamAddDialog({
  onAdd,
  open,
  onOpenChange,
}: TeamAddDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined && onOpenChange;
  const actualOpen = isControlled ? open : internalOpen;
  const setActualOpen = isControlled ? onOpenChange! : setInternalOpen;

  const {
    name,
    setName,
    email,
    setEmail,
    submitting,
    handleSubmit,
    designation,
    setDesignation,
    mobileNumber,
    setMobileNumber,
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
            Invite a new team member to join your organization.
          </DialogDescription>
        </DialogHeader>
        <TeamAddForm
          name={name}
          setName={setName}
          email={email}
          setEmail={setEmail}
          submitting={submitting}
          handleSubmit={handleSubmit}
          designation={designation}
          setDesignation={setDesignation}
          mobileNumber={mobileNumber}
          setMobileNumber={setMobileNumber}
        />
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}

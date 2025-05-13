
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { CAPItem } from "./CAPTable";

interface ReviewDialogProps {
  item: CAPItem | null;
  open: boolean;
  onApprove: () => void;
  onReject: () => void;
  onOpenChange: (open: boolean) => void;
  finalPlan:boolean;
}

export function ReviewDialog({
  item,
  open,
  onApprove,
  onReject,
  onOpenChange,
  finalPlan
}: ReviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review CAP Item</DialogTitle>
          <DialogDescription>
            Review and approve or reject this CAP item.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <h4 className="font-semibold">Item</h4>
            <p>{item?.item}</p>
          </div>
          <div>
            <h4 className="font-semibold">Corrective Actions</h4>
            <p>{item?.measures}</p>
          </div>
          <div>
            <h4 className="font-semibold">Responsibility</h4>
            <p>{item?.resource}</p>
          </div>
          <div>
            <h4 className="font-semibold">Target Date</h4>
            <p>{item?.targetDate}</p>
          </div>
          <div>
            <h4 className="font-semibold">Type</h4>
            <p>{item?.type}</p>
          </div>
          <div>
            <h4 className="font-semibold">Status</h4>
            <p>{item?.status}</p>
          </div>
        </div>
        <DialogFooter className="flex space-x-2 sm:justify-end">
          {finalPlan && <p>Plan is already accepted</p>}
          {!finalPlan && <Button variant="destructive" onClick={onReject}>
            <X className="mr-2 h-4 w-4" />
            Reject
          </Button>}
          {!finalPlan && <Button onClick={onApprove}>
            <Check className="mr-2 h-4 w-4" />
            Approve
          </Button>}
          
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

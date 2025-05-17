
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { CAPItem, CAPStatus, CAPType } from "./CAPTable";
import { useToast } from "@/hooks/use-toast";

interface ReviewDialogProps {
  item: CAPItem | null;
  open: boolean;
  canEdit: boolean;
  onApprove: () => void;
  onReject: () => void;
  onSaveChanges: (updatedItem: CAPItem) => void;
  onOpenChange: (open: boolean) => void;
  finalPlan:boolean;
  originalItems?: CAPItem[];
}

export function ReviewDialog({
  item,
  open,
  canEdit = true,
  onApprove,
  onReject,
  onSaveChanges,
  onOpenChange,
  finalPlan,
  originalItems = [],
}: ReviewDialogProps) {
  const [editedItem, setEditedItem] = useState<CAPItem | null>(null);
  const [originalItem, setOriginalItem] = useState<CAPItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (item) {
      setEditedItem({ ...item });
      
      // Find the corresponding original item
      const foundOriginal = originalItems.find(orig => orig.id === item.id);
      setOriginalItem(foundOriginal || { ...item });
    }
  }, [item, originalItems]);

  const handleInputChange = (field: keyof CAPItem, value: any) => {
    if (editedItem) {
      setEditedItem({ ...editedItem, [field]: value });
    }
  };

  const handleSaveChanges = () => {
    if (editedItem) {
      onSaveChanges(editedItem);
      toast({
        title: "Changes saved",
        description: "Your changes have been saved successfully."
      });
    }
  };

  const isFieldChanged = (field: keyof CAPItem): boolean => {
    return originalItem && editedItem ? originalItem[field] !== editedItem[field] : false;
  };

  if (!editedItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review CAP Item</DialogTitle>
          <DialogDescription>
            {canEdit ? "Review and edit this CAP item." : "Review this CAP item."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <h4 className="font-semibold mb-1">Item</h4>
            {canEdit ? (
              <Input 
                value={editedItem.item} 
                onChange={(e) => handleInputChange('item', e.target.value)} 
                className={isFieldChanged('item') ? "border-orange-400" : ""}
              />
            ) : (
              <p>{editedItem.item}</p>
            )}
            {isFieldChanged('item') && (
              <p className="text-xs text-amber-600 mt-1">
                Original: {originalItem?.item}
              </p>
            )}
          </div>
          
          <div>
            <h4 className="font-semibold mb-1">Corrective Actions</h4>
            {canEdit ? (
              <Textarea 
                value={editedItem.actions} 
                onChange={(e) => handleInputChange('actions', e.target.value)}
                className={isFieldChanged('actions') ? "border-orange-400" : ""}
              />
            ) : (
              <p>{editedItem.actions}</p>
            )}
            {isFieldChanged('actions') && (
              <p className="text-xs text-amber-600 mt-1">
                Original: {originalItem?.actions}
              </p>
            )}
          </div>
          
          <div>
            <h4 className="font-semibold mb-1">Responsibility</h4>
            {canEdit ? (
              <Input 
                value={editedItem.resource} 
                onChange={(e) => handleInputChange('resource', e.target.value)}
                className={isFieldChanged('resource') ? "border-orange-400" : ""}
              />
            ) : (
              <p>{editedItem.resource}</p>
            )}
            {isFieldChanged('resource') && (
              <p className="text-xs text-amber-600 mt-1">
                Previous: {originalItem?.resource}
              </p>
            )}
          </div>
          
          <div>
            <h4 className="font-semibold mb-1">Deliverable</h4>
            {canEdit ? (
              <Input 
                value={editedItem.deliverable} 
                onChange={(e) => handleInputChange('deliverable', e.target.value)}
                className={isFieldChanged('deliverable') ? "border-orange-400" : ""}
              />
            ) : (
              <p>{editedItem.deliverable}</p>
            )}
            {isFieldChanged('deliverable') && (
              <p className="text-xs text-amber-600 mt-1">
                Original: {originalItem?.deliverable}
              </p>
            )}
          </div>
          
          <div>
            <h4 className="font-semibold mb-1">Target Date</h4>
            {canEdit ? (
              <Input 
                type="date" 
                value={editedItem.targetDate} 
                onChange={(e) => handleInputChange('targetDate', e.target.value)}
                className={isFieldChanged('targetDate') ? "border-orange-400" : ""}
              />
            ) : (
              <p>{editedItem.targetDate}</p>
            )}
            {isFieldChanged('targetDate') && (
              <p className="text-xs text-amber-600 mt-1">
                Original: {originalItem?.targetDate}
              </p>
            )}
          </div>
          
          <div>
            <h4 className="font-semibold mb-1">Type</h4>
            {canEdit ? (
              <Select 
                value={editedItem.type} 
                onValueChange={(value) => handleInputChange('type', value as CAPType)}
              >
                <SelectTrigger className={isFieldChanged('type') ? "border-orange-400" : ""}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CP">CP</SelectItem>
                  <SelectItem value="CS">CS</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p>{editedItem.type}</p>
            )}
            {isFieldChanged('type') && (
              <p className="text-xs text-amber-600 mt-1">
                Original: {originalItem?.type}
              </p>
            )}
          </div>
          
          <div>
            <h4 className="font-semibold mb-1">Status</h4>
            {canEdit ? (
              <Select 
                value={editedItem.status} 
                onValueChange={(value) => handleInputChange('status', value as CAPStatus)}
              >
                <SelectTrigger className={isFieldChanged('status') ? "border-orange-400" : ""}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Delayed">Delayed</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p>{editedItem.status}</p>
            )}
            {isFieldChanged('status') && (
              <p className="text-xs text-amber-600 mt-1">
                Original: {originalItem?.status}
              </p>
            )}
          </div>
          
          <div>
            <h4 className="font-semibold mb-1">Actual Date</h4>
            <p>{editedItem.actualDate || "Not set"}</p>
          </div>
        </div>
        <DialogFooter className="flex space-x-2 sm:justify-end">
          {canEdit && (
            <Button variant="outline" onClick={handleSaveChanges}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          )}
          <Button variant="destructive" onClick={onReject} disabled={!canEdit}>
            <X className="mr-2 h-4 w-4" />
            Reject
          </Button>
          <Button onClick={onApprove} disabled={!canEdit}>
            <Check className="mr-2 h-4 w-4" />
            Approve
          </Button>}
          
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

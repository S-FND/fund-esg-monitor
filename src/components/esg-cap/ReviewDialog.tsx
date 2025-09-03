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
import { ESGCapItem, CAPStatus, CAPType, CAPCategory, CAPPriority } from "./CAPTable";
import { useToast } from "@/hooks/use-toast";

interface ReviewDialogProps {
  item: ESGCapItem | null;
  open: boolean;
  canEdit: boolean;
  onApprove: () => void;
  onReject: () => void;
  onSetEdit?: () => void;
  onCancelEdit?: () => void;
  onSaveChanges: (updatedItem: ESGCapItem) => void;
  onOpenChange: (open: boolean) => void;
  finalPlan: boolean;
  originalItems?: ESGCapItem[];
  comparePlanData: ComparePlan;
}

export interface ComparePlan {
  founderPlanLastUpdate: Number;
  investorPlanLastUpdate: Number;
  founderPlan: ESGCapItem[];
  investorPlan: ESGCapItem[];
}

export function ReviewDialog({
  item,
  open,
  canEdit = true,
  onApprove,
  onReject,
  onSetEdit,
  onCancelEdit,
  onSaveChanges,
  onOpenChange,
  finalPlan,
  originalItems = [],
  comparePlanData
}: ReviewDialogProps) {
  const [editedItem, setEditedItem] = useState<ESGCapItem | null>(null);
  const [originalItem, setOriginalItem] = useState<ESGCapItem | null>(null);
  const [dataEditStatus, setDataEditStatus] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (item) {
      setEditedItem({ ...item });

      // Find the corresponding original item
      const foundOriginal = originalItems.find(orig => orig.id === item.id);
      setOriginalItem(foundOriginal || { ...item });
    }
  }, [item, originalItems]);

  const handleInputChange = (field: keyof ESGCapItem, value: any) => {
    if (editedItem) {
      setEditedItem({ ...editedItem, [field]: value });
    }
  };

  const handleSaveChanges = () => {
    if (editedItem) {
      setDataEditStatus(true);
      onSaveChanges(editedItem);
      toast({
        title: "Changes saved",
        description: "Your changes have been saved successfully."
      });
    }
  };

  const isFieldChanged = (field: keyof ESGCapItem): boolean => {
    return originalItem && editedItem ? originalItem[field] !== editedItem[field] : false;
  };

  const isApproveRejectVisible = (comparePlan: ComparePlan, finalPlan: boolean): boolean => {
    if (finalPlan) {
      return false;
    } else if (!comparePlan || !comparePlan.founderPlanLastUpdate) {
      return true;
    } else if (comparePlan.founderPlanLastUpdate > (comparePlan.investorPlanLastUpdate || 0)) {
      return true;
    } else {
      return false;
    }
  };

  if (!editedItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Review CAP Item</DialogTitle>
          <DialogDescription>
            {canEdit ? "Review and edit this CAP item." : "Review this CAP item."}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">Issue</h4>
                {canEdit ? (
                  <Input
                    value={editedItem.issue}
                    onChange={(e) => handleInputChange('issue', e.target.value)}
                    className={isFieldChanged('issue') ? "border-orange-400" : ""}
                  />
                ) : (
                  <p>{editedItem.issue}</p>
                )}
                {isFieldChanged('issue') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.issue}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-1">Description</h4>
                {canEdit ? (
                  <Textarea
                    value={editedItem.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={isFieldChanged('description') ? "border-orange-400" : ""}
                  />
                ) : (
                  <p>{editedItem.description}</p>
                )}
                {isFieldChanged('description') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.description}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-1">Recommendation</h4>
                {canEdit ? (
                  <Input
                    value={editedItem.recommendation}
                    onChange={(e) => handleInputChange('recommendation', e.target.value)}
                    className={isFieldChanged('recommendation') ? "border-orange-400" : ""}
                  />
                ) : (
                  <p>{editedItem.recommendation}</p>
                )}
                {isFieldChanged('recommendation') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.recommendation}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-1">Category</h4>
                {canEdit ? (
                  <Select
                    value={editedItem.category}
                    onValueChange={(value) => handleInputChange('category', value as CAPCategory)}
                  >
                    <SelectTrigger className={isFieldChanged('category') ? "border-orange-400" : ""}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="environmental">Environmental</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="governance">Governance</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p>{editedItem.category}</p>
                )}
                {isFieldChanged('category') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.category}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-1">Priority</h4>
                {canEdit ? (
                  <Select
                    value={editedItem.priority}
                    onValueChange={(value) => handleInputChange('priority', value as CAPPriority)}
                  >
                    <SelectTrigger className={isFieldChanged('priority') ? "border-orange-400" : ""}>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p>{editedItem.priority}</p>
                )}
                {isFieldChanged('priority') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.priority}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-1">Assigned To</h4>
                {canEdit ? (
                  <Input
                    value={editedItem.assignedTo || ''}
                    onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                    className={isFieldChanged('assignedTo') ? "border-orange-400" : ""}
                  />
                ) : (
                  <p>{editedItem.assignedTo || 'Not assigned'}</p>
                )}
                {isFieldChanged('assignedTo') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.assignedTo || 'Not assigned'}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">Deadline</h4>
                {canEdit ? (
                  <Input
                    type="date"
                    value={editedItem.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    className={isFieldChanged('deadline') ? "border-orange-400" : ""}
                  />
                ) : (
                  <p>{editedItem.deadline}</p>
                )}
                {isFieldChanged('deadline') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.deadline}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-1">Deal Condition</h4>
                {canEdit ? (
                  <Select
                    value={editedItem.dealCondition}
                    onValueChange={(value) => handleInputChange('dealCondition', value as CAPType)}
                  >
                    <SelectTrigger className={isFieldChanged('dealCondition') ? "border-orange-400" : ""}>
                      <SelectValue placeholder="Select deal condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CP">CP</SelectItem>
                      <SelectItem value="CS">CS</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p>{editedItem.dealCondition}</p>
                )}
                {isFieldChanged('dealCondition') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.dealCondition}
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
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
                <h4 className="font-semibold mb-1">Actual Completion Date</h4>
                {canEdit ? (
                  <Input
                    type="date"
                    value={editedItem.actualCompletionDate || ''}
                    onChange={(e) => handleInputChange('actualCompletionDate', e.target.value)}
                    className={isFieldChanged('actualCompletionDate') ? "border-orange-400" : ""}
                  />
                ) : (
                  <p>{editedItem.actualCompletionDate || "Not set"}</p>
                )}
                {isFieldChanged('actualCompletionDate') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.actualCompletionDate || "Not set"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-wrap gap-2 sm:justify-end pt-4">
          {canEdit && (
            <Button variant="outline" onClick={handleSaveChanges}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          )}
          {canEdit && (
            <Button variant="destructive" onClick={onCancelEdit}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
          {!canEdit && (
            <Button onClick={onSetEdit} disabled={!canEdit}>
              <Save className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {!canEdit && isApproveRejectVisible(comparePlanData, finalPlan) && (
            <Button variant="destructive" onClick={onReject} disabled={!canEdit}>
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
          )}
          {!canEdit && isApproveRejectVisible(comparePlanData, finalPlan) && (
            <Button onClick={onApprove} disabled={!canEdit}>
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
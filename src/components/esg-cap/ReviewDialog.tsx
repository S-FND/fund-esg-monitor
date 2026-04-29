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

  // Date formatting helper
  const formatDisplayDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // --- Helper (not a hook) ---
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  // --- useEffect to set default lastReviewDate when dialog opens ---
  useEffect(() => {
    if (open && editedItem ) {
      setEditedItem(prev => ({ ...prev, lastReviewDate: getTodayDate() }));
    }
  }, [open, editedItem]);

  const toDateInputValue = (dateString?: string): string => {
    if (!dateString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (!item) return;
    
    // Format date fields for <input type="date">
    const formattedItem = {
      ...item,
      targetDate: toDateInputValue(item.targetDate),
      actualDate: toDateInputValue(item.actualDate),
      // lastReviewDate: toDateInputValue(item.lastReviewDate),
    };
    setEditedItem(formattedItem);
    
    // Find original item for comparison
    const foundOriginal = originalItems.find(orig => orig.id === item.id);
    setOriginalItem(foundOriginal || { ...item });
  }, [item, originalItems]);

  // ✅ Core change: editing is only allowed if parent says we can edit AND the plan is NOT finalized
  const isEditable = canEdit && !finalPlan;
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

  const [showSaveToast, setShowSaveToast] = useState(false);

  const handleSaveChanges = () => {
    if (editedItem && !editedItem ) {
      setDataEditStatus(true);
      onSaveChanges(editedItem);
      toast({
        title: "Please click on 'Request Cap Change'",
        description: "To save the changes and notify the company about the changes.",
        duration: Infinity,
        variant: "destructive",
      });
    }else{
      setDataEditStatus(true);
      onSaveChanges(editedItem);
      toast({
        title: "Please click on 'Update Final Cap'",
        description: "To save the changes and notify the company about the changes.",
        duration: Infinity,
        variant: "destructive",
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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review CAP Item</DialogTitle>
          <DialogDescription>
            {isEditable ? "Review and edit this CAP item." : "Review this CAP item."}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Item */}
              <div>
                <h4 className="font-semibold mb-1">Item</h4>
                {isEditable ? (
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

              {/* Priority */}
              <div>
                <h4 className="font-semibold mb-1">Priority</h4>
                {isEditable ? (
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

              {/* Related Finding */}
              <div>
                <h4 className="font-semibold mb-1">Related Finding</h4>
                {isEditable ? (
                  <Textarea
                    value={editedItem.relatedFinding || ''}
                    onChange={(e) => handleInputChange('relatedFinding', e.target.value)}
                    className={isFieldChanged('relatedFinding') ? "border-orange-400" : ""}
                  />
                ) : (
                  <p>{editedItem.relatedFinding || '-'}</p>
                )}
                {isFieldChanged('relatedFinding') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.relatedFinding || '-'}
                  </p>
                )}
              </div>

              {/* Measures & Corrective Actions */}
              <div>
                <h4 className="font-semibold mb-1">Measures & Corrective Actions</h4>
                {isEditable ? (
                  <Textarea
                    value={editedItem.measures}
                    onChange={(e) => handleInputChange('measures', e.target.value)}
                    className={isFieldChanged('measures') ? "border-orange-400" : ""}
                    rows={3}
                  />
                ) : (
                  <p>{editedItem.measures}</p>
                )}
                {isFieldChanged('measures') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.measures}
                  </p>
                )}
              </div>

              {/* Expected Deliverable */}
              <div>
                <h4 className="font-semibold mb-1">Expected Deliverable</h4>
                {isEditable ? (
                  <Textarea
                    value={editedItem.deliverable || ''}
                    onChange={(e) => handleInputChange('deliverable', e.target.value)}
                    className={isFieldChanged('deliverable') ? "border-orange-400" : ""}
                    rows={2}
                  />
                ) : (
                  <p>{editedItem.deliverable || '-'}</p>
                )}
                {isFieldChanged('deliverable') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.deliverable || '-'}
                  </p>
                )}
              </div>

              {/* Target Date */}
              <div>
                <h4 className="font-semibold mb-1">Target Date</h4>
                {isEditable ? (
                  <Input
                    type="date"
                    value={editedItem.targetDate || ''}
                    onChange={(e) => handleInputChange('targetDate', e.target.value)}
                    className={isFieldChanged('targetDate') ? "border-orange-400" : ""}
                  />
                ) : (
                  <p>{formatDisplayDate(editedItem.targetDate) || '-'}</p>
                )}
                {isFieldChanged('targetDate') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {formatDisplayDate(originalItem?.targetDate) || '-'}
                  </p>
                )}
              </div>

              {/* Progress Percentage */}
              <div>
                <h4 className="font-semibold mb-1">Progress Percentage</h4>
                {isEditable ? (
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editedItem.progressPercentage ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? undefined : Number(e.target.value);
                      handleInputChange('progressPercentage', val);
                    }}
                    className={isFieldChanged('progressPercentage') ? "border-orange-400" : ""}
                    placeholder="0-100"
                  />
                ) : (
                  <p>{editedItem.progressPercentage !== undefined ? `${editedItem.progressPercentage}%` : '-'}</p>
                )}
                {isFieldChanged('progressPercentage') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.progressPercentage !== undefined ? `${originalItem.progressPercentage}%` : '-'}
                  </p>
                )}
              </div>

              {/* Type (CP/CS) */}
              <div>
                <h4 className="font-semibold mb-1">Type (CP/CS)</h4>
                {isEditable ? (
                  <Select
                    value={editedItem.CS || ""}
                    onValueChange={(value) => handleInputChange("CS", value)}
                  >
                    <SelectTrigger className={isFieldChanged("CS") ? "border-orange-400" : ""}>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CP">CP</SelectItem>
                      <SelectItem value="CS">CS</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p>{editedItem.CS || "-"}</p>
                )}
                {isFieldChanged("CS") && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.CS || "-"}
                  </p>
                )}
              </div>

              {/* Current Status Update */}
              <div>
                <h4 className="font-semibold mb-1">Current Status Update (Company)</h4>
                {/* {isEditable ? ( */}
                  <Textarea
                    value={editedItem.statusUpdate || ''}
                    onChange={(e) => handleInputChange('statusUpdate', e.target.value)}
                    disabled
                    className={isFieldChanged('statusUpdate') ? "border-orange-400" : ""}
                    rows={2}
                    placeholder="Latest update on this action item..."
                  />
                {/* ) : (
                  <p>{editedItem.statusUpdate || '-'}</p>
                )} */}
                {isFieldChanged('statusUpdate') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.statusUpdate || '-'}
                  </p>
                )}
              </div>

              {/* Current Status Update (Investor) */}
              <div>
                <h4 className="font-semibold mb-1">Current Status Update (Investor)</h4>
                <Textarea
                  value={editedItem.investorStatusUpdate || ''}
                  onChange={(e) => handleInputChange('investorStatusUpdate', e.target.value)}
                  className={isFieldChanged('investorStatusUpdate') ? "border-orange-400" : ""}
                  rows={2}
                  placeholder="Latest update from investor..."
                />
                {isFieldChanged('investorStatusUpdate') && (
                  <p className="text-xs text-amber-600 mt-1">Original: {originalItem?.investorStatusUpdate}</p>
                )}
              </div>

              {/* Last Review Date */}
              <div>
                <h4 className="font-semibold mb-1">Last Review Date</h4>
                <Input
                  type="date"
                  value={editedItem.lastReviewDate || ''}
                  onChange={(e) => handleInputChange('lastReviewDate', e.target.value)}
                  className={isFieldChanged('lastReviewDate') ? "border-orange-400" : ""}
                />
                {isFieldChanged('lastReviewDate') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {formatDisplayDate(originalItem?.lastReviewDate) || '-'}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
               {/* Category */}
               <div>
                <h4 className="font-semibold mb-1">Category</h4>
                {isEditable ? (
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

              {/* Issue */}
              <div>
                <h4 className="font-semibold mb-1">Issue</h4>
                {isEditable ? (
                  <Textarea
                    value={editedItem.issue || ''}
                    onChange={(e) => handleInputChange('issue', e.target.value)}
                    className={isFieldChanged('issue') ? "border-orange-400" : ""}
                  />
                ) : (
                  <p>{editedItem.issue || '-'}</p>
                )}
                {isFieldChanged('issue') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.issue || '-'}
                  </p>
                )}
              </div>

              {/* ESG Lever */}
              <div>
                <h4 className="font-semibold mb-1">ESG Lever</h4>
                {isEditable ? (
                  <Input
                    value={editedItem.esgLever || ''}
                    onChange={(e) => handleInputChange('esgLever', e.target.value)}
                    className={isFieldChanged('esgLever') ? "border-orange-400" : ""}
                    placeholder="e.g., Policy, Training, Technology"
                  />
                ) : (
                  <p>{editedItem.esgLever || '-'}</p>
                )}
                {isFieldChanged('esgLever') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.esgLever || '-'}
                  </p>
                )}
              </div>

              {/* CAP Source */}
              <div>
                <h4 className="font-semibold mb-1">CAP Source</h4>
                {isEditable ? (
                  <Input
                    value={editedItem.capSource || ''}
                    onChange={(e) => handleInputChange('capSource', e.target.value)}
                    className={isFieldChanged('capSource') ? "border-orange-400" : ""}
                  />
                ) : (
                  <p>{editedItem.capSource || '-'}</p>
                )}
                {isFieldChanged('capSource') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.capSource || '-'}
                  </p>
                )}
              </div>

              {/* Resource & Responsibility */}
              <div>
                <h4 className="font-semibold mb-1">Resource & Responsibility</h4>
                {isEditable ? (
                  <Input
                    value={editedItem.resource || ''}
                    onChange={(e) => handleInputChange('resource', e.target.value)}
                    className={isFieldChanged('resource') ? "border-orange-400" : ""}
                  />
                ) : (
                  <p>{editedItem.resource || '-'}</p>
                )}
                {isFieldChanged('resource') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.resource || '-'}
                  </p>
                )}
              </div>

              {/* Timeline Month */}
              <div>
                <h4 className="font-semibold mb-1">Timeline Month</h4>
                {isEditable ? (
                  <Input
                    type="number"
                    value={editedItem.timelineMonth || ''}
                    onChange={(e) => handleInputChange('timelineMonth', e.target.value ? Number(e.target.value) : undefined)}
                    className={isFieldChanged('timelineMonth') ? "border-orange-400" : ""}
                    placeholder="e.g., 3"
                  />
                ) : (
                  <p>{editedItem.timelineMonth || '-'}</p>
                )}
                {isFieldChanged('timelineMonth') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.timelineMonth || '-'}
                  </p>
                )}
              </div>

              {/* Actual Date */}
              <div>
                <h4 className="font-semibold mb-1">Actual Date</h4>
                {isEditable ? (
                  <Input
                    type="date"
                    value={editedItem.actualDate || ''}
                    onChange={(e) => handleInputChange('actualDate', e.target.value)}
                    className={isFieldChanged('actualDate') ? "border-orange-400" : ""}
                  />
                ) : (
                  <p>{formatDisplayDate(editedItem.actualDate) || "Not set"}</p>
                )}
                {isFieldChanged('actualDate') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {formatDisplayDate(originalItem?.actualDate) || "Not set"}
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <h4 className="font-semibold mb-1">Status</h4>
                {isEditable ? (
                  <Select
                    value={editedItem.status}
                    onValueChange={(value) => handleInputChange('status', value as CAPStatus)}
                  >
                    <SelectTrigger className={isFieldChanged('status') ? "border-orange-400" : ""}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
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

              {/* Review Remarks */}
              <div>
                <h4 className="font-semibold mb-1">Review Remarks</h4>
                {/* {isEditable ? ( */}
                  <Textarea
                    value={editedItem.reviewRemarks || ''}
                    onChange={(e) => handleInputChange('reviewRemarks', e.target.value)}
                    className={isFieldChanged('reviewRemarks') ? "border-orange-400" : ""}
                    rows={2}
                    placeholder="Reviewer comments..."
                  />
                {/* ) : (
                  <p>{editedItem.reviewRemarks || '-'}</p>
                )} */}
                {isFieldChanged('reviewRemarks') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.reviewRemarks || '-'}
                  </p>
                )}
              </div>

              {/* Implementation Support Needed */}
              <div>
                <h4 className="font-semibold mb-1">Implementation Support Needed</h4>
                {/* {isEditable ? ( */}
                  <Textarea
                    value={editedItem.implementationSupportNeeded || ''}
                    onChange={(e) => handleInputChange('implementationSupportNeeded', e.target.value)}
                    className={isFieldChanged('implementationSupportNeeded') ? "border-orange-400" : ""}
                    rows={2}
                    placeholder="What support is required?"
                  />
                {/* ) : (
                  <p>{editedItem.implementationSupportNeeded || '-'}</p>
                )} */}
                {isFieldChanged('implementationSupportNeeded') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.implementationSupportNeeded || '-'}
                  </p>
                )}
              </div>

              {/* Assigned To */}
              <div>
                <h4 className="font-semibold mb-1">Assigned To</h4>
                {/* {isEditable ? ( */}
                  <Input
                    value={editedItem.assignedTo || ''}
                    onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                    className={isFieldChanged('assignedTo') ? "border-orange-400" : ""}
                  />
                {/* ) : (
                  <p>{editedItem.assignedTo || 'Not assigned'}</p>
                )} */}
                {isFieldChanged('assignedTo') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.assignedTo || 'Not assigned'}
                  </p>
                )}
              </div>

              {/* Closure Verified By */}
              <div>
                <h4 className="font-semibold mb-1">Closure Verified By</h4>
                {/* {isEditable ? ( */}
                  <Input
                    value={editedItem.closureVerifiedBy || ''}
                    onChange={(e) => handleInputChange('closureVerifiedBy', e.target.value)}
                    className={isFieldChanged('closureVerifiedBy') ? "border-orange-400" : ""}
                    placeholder="Name of verifier"
                  />
                {/* ) : (
                  <p>{editedItem.closureVerifiedBy || '-'}</p>
                )} */}
                {isFieldChanged('closureVerifiedBy') && (
                  <p className="text-xs text-amber-600 mt-1">
                    Original: {originalItem?.closureVerifiedBy || '-'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-wrap gap-2 sm:justify-end pt-4">
          {/* Save Changes button appears only when we are in edit mode AND plan not finalized */}
          {/* {isEditable && ( */}
            <Button variant="outline" onClick={handleSaveChanges}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          {/* )} */}
          {/* {isEditable && ( */}
            <Button variant="destructive" onClick={() => onOpenChange(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          {/* )} */}
          {/* Edit button: shown only when parent allows edit AND plan is NOT finalized */}
          {!canEdit && !finalPlan && (
            <Button onClick={onSetEdit}>
              <Save className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {/* Approve/Reject buttons – they are already hidden when finalPlan via isApproveRejectVisible */}
          {!canEdit && isApproveRejectVisible(comparePlanData, finalPlan) && (
            <Button variant="destructive" onClick={onReject}>
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
          )}
          {!canEdit && isApproveRejectVisible(comparePlanData, finalPlan) && (
            <Button onClick={onApprove}>
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
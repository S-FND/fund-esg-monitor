import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, ArrowLeft, ArrowRight, Undo, Plus, Trash2, Columns } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { useState } from "react";
// import { AiDialog } from "./AiDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DocumentSummaryDialog from "./document-summary-review";
import { http } from "@/utils/httpInterceptor";
import { toast } from "@/hooks/use-toast";

export type CAPStatus =
  | "pending"
  | "in_review"
  | "accepted"
  | "in_progress"
  | "completed"
  | "delayed"
  | "rejected";

export type CAPCategory = "environmental" | "social" | "governance";
export type CAPType = "CP" | "CS" | "none";
export type CAPPriority = "High" | "Medium" | "Low";

export type EvidenceType =
  | "data"
  | "report"
  | "training_record"
  | "audit"
  | "plan"
  | "system"
  | "certificate"
  | "kpi_metrics";

export interface AiResponse {
  id: string;
  _index: number;

  requiredEvidence: {
    types: EvidenceType[];
    normalizedTypes: EvidenceType[];
    reasoning: string;
    confidence: number;
  };

  documentRequired: boolean;
  documentType: string | null;
  sourceType: "internal" | "external" | null;

  sections: string[];

  templates: Template[];

  reasoning: string;
  confidence: number;
}

export interface Template {
  type: "system" | "data" | "report" | string;
  name: string;
  format: "checklist" | "table" | "document" | string;

  structure: TemplateStructure;
}
export type ESGCapDealCondition = 'CP' | 'CS' | 'none';

export interface TemplateStructure {
  components?: string[];
  columns?: string[];
  sections?: string[];
  [key: string]: any;
}

export interface ValidationScores {
  relevance: number;
  policyCompleteness: number;
  regulatoryAlignment: number;
  structure: number;
  authenticity: number;
}

export interface SuggestedImprovement {
  section: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
}

/**
 * Main Interface
 */

export interface IDocumentValidation {
  _id?: string;

  actionItemId: string;
  entityId: string;
  documentId?: string | null;

  s3Link: string;
  fileName: string;

  status: "draft" | "final";

  // Core Metrics
  overallScore: number;
  improvementPercentage: number;
  confidence: number;
  valid: boolean;

  // Scores
  scores: ValidationScores;

  // Analysis
  missingSections: string[];
  issues: string[];

  // Improvements
  suggestedImprovements: SuggestedImprovement[];

  // Summary
  summary?: string;

  // AI Raw Response
  rawResponse?: any;

  // Versioning
  version: number;

  aiInsights?: any;

  // Timestamps (since schema has timestamps: true)
  createdAt?: Date;
  updatedAt?: Date;
}
export interface ESGCapItem {
  id: string | number;
  item: string;
  issue?: string;
  relatedFinding?: string;
  esgLever?: string;
  capSource?: string;
  measures: string;
  reportId?: string;
  description?: string;
  category: CAPCategory;
  recommendation?: string;
  priority: CAPPriority;
  status: CAPStatus;
  deadline?: string;
  targetDate?: string;
  timelineMonth?: number;
  assignedTo?: string;
  dealCondition: ESGCapDealCondition;
  createdAt: string;
  actualCompletionDate?: string;
  actualDate?: string;
  acceptedAt?: string;
  resource?: string;
  deliverable?: string;
  statusUpdate?: string;
  reviewRemarks?: string;
  lastReviewDate?: string;
  progressPercentage?: number;
  implementationSupportNeeded?: string;
  closureVerifiedBy?: string;
  CS?: string;
  remarks?: string;
  theme?: "Policy" | "SOP" | "Metrics" | "Logs";
  data_type?: string;
  documentType?: string;
  sections?: string[];
  sourceType?: string;
  aiResponseRaw?: AiResponse;
  fileUploadedData?: {
    filename: string;
    mimetype: string;
    size: number;
    s3Link: string;
    status: 'Accepted' | 'Rejected' | 'Pending';
    aiSummary: IDocumentValidation;
  }[]
}

interface CAPTableProps {
  items: ESGCapItem[];
  onReview: (item: ESGCapItem) => void;
  onSendReminder: (item: ESGCapItem) => void;
  onAddItem?: (newItem: ESGCapItem) => void;
  onDeleteItem?: (itemId: string | number) => void;
  originalItems?: ESGCapItem[];
  isComparisonView?: boolean;
  onRevertField?: (itemId: string | number, field: keyof ESGCapItem) => void;
  onRevert?: (itemId: string | number) => void;
  finalPlan?: boolean;
  progressPercentage?: number;
  companyEntityId: string
  setReloadData?: (reload: boolean) => void;
}

const getStatusBadge = (status: CAPStatus) => {
  switch (status) {
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "in_progress":
      return <Badge variant="outline">In Progress</Badge>;
    case "completed":
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>;
    case "delayed":
    case "rejected":
      return <Badge variant="destructive">{status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</Badge>;
    case "in_review":
    case "accepted":
      return <Badge variant="outline">{status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getPriorityBadge = (priority: CAPPriority) => {
  switch (priority) {
    case "High":
      return <Badge variant="destructive">High</Badge>;
    case "Medium":
      return <Badge variant="default">Medium</Badge>;
    case "Low":
      return <Badge variant="secondary">Low</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
};

const getCategoryBadge = (category: string) => {
  switch (category?.toLowerCase()) {
    case "environmental":
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Environmental</Badge>;
    case "social":
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Social</Badge>;
    case "governance":
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Governance</Badge>;
    default:
      return <Badge variant="secondary">{category}</Badge>;
  }
};

const RenderChangedField = ({
  currentValue,
  originalValue,
  isComparisonView = false,
  itemId,
  fieldName,
  onRevertField
}: {
  currentValue?: string;
  originalValue?: string;
  isComparisonView?: boolean;
  itemId?: string | number;
  fieldName?: keyof ESGCapItem;
  onRevertField?: (itemId: string | number, field: keyof ESGCapItem) => void;
}) => {
  const hasChanged = (currentValue || "") !== (originalValue || "");

  if (!hasChanged || !isComparisonView) return <span>{currentValue}</span>;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1">
        <div className="bg-red-100 p-1 rounded text-red-800 line-through">
          {fieldName === "priority" ? getPriorityBadge(originalValue as CAPPriority) : originalValue}
        </div>
        <ArrowRight className="h-4 w-4" />
        <div className="bg-green-100 p-1 rounded text-green-800">
          {fieldName === "priority" ? getPriorityBadge(currentValue as CAPPriority) : currentValue}
        </div>
      </div>
      {onRevertField && itemId && fieldName && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRevertField(itemId, fieldName)}
          className="mt-1 text-xs text-amber-600 hover:text-amber-800 py-0 h-6"
        >
          <Undo className="h-3 w-3 mr-1" /> Revert
        </Button>
      )}
    </div>
  );
};

export function CAPTable({
  items,
  onReview,
  onSendReminder,
  onAddItem,
  onDeleteItem,
  originalItems = [],
  isComparisonView = false,
  onRevertField,
  onRevert,
  companyEntityId,
  setReloadData
}: CAPTableProps) {
  const completedItems = items.filter(item => item.status === "completed").length;
  const progressPercentage = items.length > 0 ? Math.round((completedItems / items.length) * 100) : 0;
  const [isViewAiOpen, setIsViewAiOpen] = useState(false);
  const [item, setItem] = useState<ESGCapItem>({} as ESGCapItem);
  const [showFullColumns, setShowFullColumns] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    item: ESGCapItem | null;
  }>({
    open: false,
    item: null,
  });
  const [confirmText, setConfirmText] = useState("");

  const handleDeleteClick = (item: ESGCapItem) => {
    setDeleteDialog({ open: true, item });
    setConfirmText("");
  };

  const confirmDelete = () => {
    if (deleteDialog.item && confirmText === "DELETE") {
      onDeleteItem?.(deleteDialog.item.id);
      setDeleteDialog({ open: false, item: null });
      setConfirmText("");
    }
  };

  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRowData, setNewRowData] = useState({
    // Basic Information
    item: "",
    category: "social" as CAPCategory,
    priority: "Medium" as CAPPriority,

    // Issue & Findings
    issue: "",
    relatedFinding: "",
    esgLever: "",
    capSource: "",

    // Action Details
    measures: "",
    resource: "",
    deliverable: "",
    timelineMonth: "",

    // Dates & Conditions
    targetDate: "",
    actualDate: "",
    dealCondition: "CP" as CAPType,

    // Status & Tracking
    status: "pending" as CAPStatus,
    statusUpdate: "",
    progressPercentage: "",

    // Review & Verification
    reviewRemarks: "",
    lastReviewDate: "",
    implementationSupportNeeded: "",
    closureVerifiedBy: "",

    // Assignment
    assignedTo: "",

    // Additional
    remarks: "",
  });

  const addNewRow = () => {
    if (!newRowData.item || !newRowData.measures) {
      alert("Please fill Item and Measures");
      return;
    }

    const newItem: ESGCapItem = {
      id: Date.now(),
      item: newRowData.item,
      issue: newRowData.issue || undefined,
      relatedFinding: newRowData.relatedFinding || undefined,
      esgLever: newRowData.esgLever || undefined,
      capSource: newRowData.capSource || undefined,
      measures: newRowData.measures,
      category: newRowData.category,
      priority: newRowData.priority,
      resource: newRowData.resource || undefined,
      deliverable: newRowData.deliverable || undefined,
      timelineMonth: newRowData.timelineMonth ? Number(newRowData.timelineMonth) : undefined,
      targetDate: newRowData.targetDate || undefined,
      actualDate: newRowData.actualDate || undefined,
      CS: newRowData.dealCondition,
      dealCondition: newRowData.dealCondition,
      status: newRowData.status,
      statusUpdate: newRowData.statusUpdate || undefined,
      progressPercentage: newRowData.progressPercentage ? Number(newRowData.progressPercentage) : undefined,
      reviewRemarks: newRowData.reviewRemarks || undefined,
      lastReviewDate: newRowData.lastReviewDate || undefined,
      implementationSupportNeeded: newRowData.implementationSupportNeeded || undefined,
      closureVerifiedBy: newRowData.closureVerifiedBy || undefined,
      assignedTo: newRowData.assignedTo || undefined,
      remarks: newRowData.remarks || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddItem?.(newItem);

    // Reset form
    setNewRowData({
      item: "",
      category: "social",
      priority: "Medium",
      issue: "",
      relatedFinding: "",
      esgLever: "",
      capSource: "",
      measures: "",
      resource: "",
      deliverable: "",
      timelineMonth: "",
      targetDate: "",
      actualDate: "",
      dealCondition: "CP",
      status: "pending",
      statusUpdate: "",
      progressPercentage: "",
      reviewRemarks: "",
      lastReviewDate: "",
      implementationSupportNeeded: "",
      closureVerifiedBy: "",
      assignedTo: "",
      remarks: "",
    });
    setIsAddingRow(false);
  };

  const handleAcceptDocument = async (payload) => {
    const {data,error}= await http.post('investor/esgdd/escap/document/accept', {
      entityId:companyEntityId,
      itemId: item['_id'],
      fileName: payload.fileName,
      status: payload.status,
      reason: payload.reason
    })
    if (error) {
      toast({
        title: `${payload.fileName} failed to process`,
        description: "Please try again or check the document.",
        variant: "destructive",
      });
      return; // ✅ stop execution
    }
    
    if (data?.status) {
      toast({
        title: `${payload.fileName} ${payload.status === "Accepted" ? "approved" : "rejected"}`,
        description: payload.reason ? `Reason: ${payload.reason}` : undefined,
        variant: "default", // ✅ success style
      });
    
      setIsViewAiOpen(false);
      setReloadData(true);
    }
  }

  const getOriginalItem = (id: string | number) => originalItems.find(item => item.id === id) || null;

  const onAiShow = (item: ESGCapItem) => {
    setIsViewAiOpen(true);
    setItem(item);
  };

  // Helper to render a field with comparison support (used in full view)
  const renderField = (
    currentValue: any,
    originalValue: any,
    fieldName: keyof ESGCapItem,
    itemId: string | number,
    // Special formatting for badges
    isBadge?: boolean,
    badgeType?: 'category' | 'priority' | 'status'
  ) => {
    if (isComparisonView && originalValue !== undefined && currentValue !== originalValue) {
      // Show changed field with revert
      if (isBadge && badgeType) {
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="line-through opacity-60">
                {badgeType === 'category' && getCategoryBadge(originalValue)}
                {badgeType === 'priority' && getPriorityBadge(originalValue)}
                {badgeType === 'status' && getStatusBadge(originalValue)}
              </div>
              <ArrowRight className="h-3 w-3" />
              <div>
                {badgeType === 'category' && getCategoryBadge(currentValue)}
                {badgeType === 'priority' && getPriorityBadge(currentValue)}
                {badgeType === 'status' && getStatusBadge(currentValue)}
              </div>
            </div>
            {onRevertField && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRevertField(itemId, fieldName)}
                className="text-xs text-amber-600 hover:text-amber-800 h-6 px-2"
              >
                <Undo className="h-3 w-3 mr-1" /> Revert
              </Button>
            )}
          </div>
        );
      }
      return (
        <RenderChangedField
          currentValue={currentValue}
          originalValue={originalValue}
          isComparisonView={true}
          itemId={itemId}
          fieldName={fieldName}
          onRevertField={onRevertField}
        />
      );
    }
    // No change or not comparison view
    if (isBadge && badgeType) {
      if (badgeType === 'category') return getCategoryBadge(currentValue);
      if (badgeType === 'priority') return getPriorityBadge(currentValue);
      if (badgeType === 'status') return getStatusBadge(currentValue);
    }
    return <span>{currentValue || "-"}</span>;
  };

  return (
    <TooltipProvider>
      {/* View toggle button */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button
            variant={showFullColumns ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFullColumns(!showFullColumns)}
          >
            <Columns className="h-4 w-4 mr-2" />
            {showFullColumns ? "Show Compact View" : "Show All Columns"}
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {items.length} items
        </div>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <table className={`w-full text-sm ${showFullColumns ? 'min-w-[2900px]' : 'min-w-[900px]'}`}>
          <thead className="bg-muted sticky top-0 z-10">
            <tr>
              {!showFullColumns ? (
                // COMPACT VIEW HEADERS
                <>
                  <th className="p-3 text-left">S. No</th>
                  <th className="p-3 text-left">Item</th>
                  <th className="p-3 text-left">Issue</th>
                  <th className="p-3 text-left">Measures & Corrective Actions</th>
                  <th className="p-3 text-left">Progress Percentage</th>
                  <th className="p-3 text-center">Actions</th>
                </>
              ) : (
                // FULL VIEW HEADERS (all columns + Progress Percentage after Target Date)
                <>
                  <th className="p-3 text-left">S. No</th>
                  <th className="p-3 text-left">Item</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Priority</th>
                  <th className="p-3 text-left">Issue</th>
                  <th className="p-3 text-left">Related Finding</th>
                  <th className="p-3 text-left">ESG Lever</th>
                  <th className="p-3 text-left">CAP Source</th>
                  <th className="p-3 text-left">Measures & Corrective Actions</th>
                  <th className="p-3 text-left">Resource & Responsibility</th>
                  <th className="p-3 text-left">Expected Deliverable</th>
                  <th className="p-3 text-left">Timeline Month</th>
                  <th className="p-3 text-left">Target Date</th>
                  <th className="p-3 text-left">Progress Percentage</th>   {/* NEW */}
                  <th className="p-3 text-left">Actual Date</th>
                  <th className="p-3 text-left">CP/CS</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Current Status Update</th>
                  <th className="p-3 text-left">Review Remarks</th>
                  <th className="p-3 text-left">Last Review Date</th>
                  <th className="p-3 text-left">Implementation Support Needed</th>
                  <th className="p-3 text-left">Closure Verified By</th>
                  <th className="p-3 text-left">Assigned To</th>
                  <th className="p-3 text-center">Actions</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const originalItem = getOriginalItem(item.id);
              return (
                <tr key={item.id} className={isComparisonView ? "bg-muted/30 hover:bg-muted/50" : "hover:bg-gray-50"}>
                  {!showFullColumns ? (
                    // COMPACT VIEW ROWS
                    <>
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">
                        {renderField(item.item, originalItem?.item, "item", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.issue, originalItem?.issue, "issue", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.measures, originalItem?.measures, "measures", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(
                          item.progressPercentage ? `${item.progressPercentage}%` : "-",
                          originalItem?.progressPercentage ? `${originalItem.progressPercentage}%` : "-",
                          "progressPercentage",
                          item.id
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {/* Actions (same as original) */}
                        <div className="flex gap-2 justify-end items-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => onReview(item)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Review CAP item</p></TooltipContent>
                          </Tooltip>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">•••</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onSendReminder(item)}>Send Reminder</DropdownMenuItem>
                              {item.aiResponseRaw && (
                                <DropdownMenuItem onClick={() => onAiShow(item)}>Review AI Suggestion</DropdownMenuItem>
                              )}
                              {!isComparisonView && onDeleteItem && (
                                <DropdownMenuItem onClick={() => handleDeleteClick(item)} className="text-red-600">
                                  Delete Item
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {isComparisonView && onRevert && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" className="text-amber-600 border-amber-600" onClick={() => onRevert(item.id)}>
                                  <ArrowLeft className="h-4 w-4" /> Revert
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Revert all changes</p></TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </>
                  ) : (
                    // FULL VIEW ROWS (including Progress Percentage after Target Date)
                    <>
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">
                        {renderField(item.item, originalItem?.item, "item", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.category, originalItem?.category, "category", item.id, true, 'category')}
                      </td>
                      <td className="p-3">
                        {renderField(item.priority, originalItem?.priority, "priority", item.id, true, 'priority')}
                      </td>
                      <td className="p-3">
                        {renderField(item.issue, originalItem?.issue, "issue", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.relatedFinding, originalItem?.relatedFinding, "relatedFinding", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.esgLever, originalItem?.esgLever, "esgLever", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.capSource, originalItem?.capSource, "capSource", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.measures, originalItem?.measures, "measures", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.resource, originalItem?.resource, "resource", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.deliverable, originalItem?.deliverable, "deliverable", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.timelineMonth, originalItem?.timelineMonth, "timelineMonth", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.targetDate, originalItem?.targetDate, "targetDate", item.id)}
                      </td>
                      {/* Progress Percentage column (after Target Date) */}
                      <td className="p-3">
                        {renderField(
                          item.progressPercentage ? `${item.progressPercentage}%` : "-",
                          originalItem?.progressPercentage ? `${originalItem.progressPercentage}%` : "-",
                          "progressPercentage",
                          item.id
                        )}
                  </td>
                  {/* 6. ESG Lever */}
                      <td className="p-3">
                        {renderField(item.actualDate, originalItem?.actualDate, "actualDate", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.CS || item.dealCondition, originalItem?.CS || originalItem?.dealCondition, "CS", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.status, originalItem?.status, "status", item.id, true, 'status')}
                      </td>
                      <td className="p-3">
                        {renderField(item.statusUpdate, originalItem?.statusUpdate, "statusUpdate", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.reviewRemarks, originalItem?.reviewRemarks, "reviewRemarks", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.lastReviewDate, originalItem?.lastReviewDate, "lastReviewDate", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.implementationSupportNeeded, originalItem?.implementationSupportNeeded, "implementationSupportNeeded", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.closureVerifiedBy, originalItem?.closureVerifiedBy, "closureVerifiedBy", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.assignedTo, originalItem?.assignedTo, "assignedTo", item.id)}
                      </td>
                      <td className="p-3 text-right">
                        {/* Actions (same as original, re-use the same actions JSX) */}
                        <div className="flex gap-2 justify-end items-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => onReview(item)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Review CAP item</p></TooltipContent>
                          </Tooltip>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">•••</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onSendReminder(item)}>Send Reminder</DropdownMenuItem>
                              {item.aiResponseRaw && (
                                <DropdownMenuItem onClick={() => onAiShow(item)}>Review AI Suggestion</DropdownMenuItem>
                              )}
                              {!isComparisonView && onDeleteItem && (
                                <DropdownMenuItem onClick={() => handleDeleteClick(item)} className="text-red-600">
                                  Delete Item
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {isComparisonView && onRevert && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" className="text-amber-600 border-amber-600" onClick={() => onRevert(item.id)}>
                                  <ArrowLeft className="h-4 w-4" /> Revert
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Revert all changes</p></TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Progress footer (unchanged) */}
      <div className="flex justify-between items-center p-4 bg-muted rounded-lg mt-4">
        <div className="text-sm text-muted-foreground">
          Total Action Items: <span className="font-semibold">{items.length}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">Progress:</div>
          <div className="flex items-center gap-2">
            <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
            </div>
            <span className="font-semibold text-sm">{progressPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Add New Row section – identical to original (unchanged) */}
      {!isComparisonView && onAddItem && (
        <div className="mt-4 border-t pt-4">
          {!isAddingRow ? (
            <Button onClick={() => setIsAddingRow(true)} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add New Row
            </Button>
          ) : (
            <div className="border rounded-lg p-6 bg-gray-50 max-h-[600px] overflow-y-auto">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4">Add New CAP Item</h3>

                {/* 1. Item */}
                <div>
                  <label className="block mb-1 font-medium text-sm">Item *</label>
                  <Textarea
                    value={newRowData.item}
                    onChange={(e) => setNewRowData({ ...newRowData, item: e.target.value })}
                    className="min-h-[60px]"
                    placeholder="Enter CAP item description"
                  />
                </div>

                {/* 2. Category & 3. Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium text-sm">Category</label>
                    <Select
                      value={newRowData.category}
                      onValueChange={(v: CAPCategory) => setNewRowData({ ...newRowData, category: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="environmental">Environmental</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="governance">Governance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-sm">Priority</label>
                    <Select
                      value={newRowData.priority}
                      onValueChange={(v: CAPPriority) => setNewRowData({ ...newRowData, priority: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 4. Issue & 5. Related Finding */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium text-sm">Issue</label>
                    <Textarea
                      value={newRowData.issue}
                      onChange={(e) => setNewRowData({ ...newRowData, issue: e.target.value })}
                      placeholder="Describe the issue"
                      className="min-h-[60px]"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-sm">Related Finding</label>
                    <Textarea
                      value={newRowData.relatedFinding}
                      onChange={(e) => setNewRowData({ ...newRowData, relatedFinding: e.target.value })}
                      placeholder="Related audit findings"
                      className="min-h-[60px]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* 6. ESG Lever */}
                  <div>
                    <label className="block mb-1 font-medium text-sm">ESG Lever</label>
                    <Input
                      value={newRowData.esgLever}
                      onChange={(e) => setNewRowData({ ...newRowData, esgLever: e.target.value })}
                      placeholder="e.g., Policy, Training, Technology"
                    />
                  </div>

                  {/* 6.1. CAP Source */}
                  <div>
                    <label className="block mb-1 font-medium text-sm">CAP Source</label>
                    <Input
                      value={newRowData.capSource}
                      onChange={(e) => setNewRowData({ ...newRowData, capSource: e.target.value })}
                      placeholder="e.g., Policy, Training, Technology"
                    />
                  </div>
                </div>
                {/* 7. Measures */}
                <div>
                  <label className="block mb-1 font-medium text-sm">Measures & Corrective Actions *</label>
                  <Textarea
                    value={newRowData.measures}
                    onChange={(e) => setNewRowData({ ...newRowData, measures: e.target.value })}
                    className="min-h-[80px]"
                    placeholder="Describe the corrective actions to be taken"
                  />
                </div>

                {/* 8. Resource & 9. Deliverable */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium text-sm">Resource & Responsibility</label>
                    <Input
                      value={newRowData.resource}
                      onChange={(e) => setNewRowData({ ...newRowData, resource: e.target.value })}
                      placeholder="Who is responsible?"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-sm">Expected Deliverable</label>
                    <Textarea
                      value={newRowData.deliverable}
                      onChange={(e) => setNewRowData({ ...newRowData, deliverable: e.target.value })}
                      placeholder="What will be delivered?"
                      className="min-h-[60px]"
                    />
                  </div>
                </div>

                {/* 10. Timeline Month & 11. Target Date & 12. Actual Date */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1 font-medium text-sm">Timeline (Months)</label>
                    <Input
                      type="number"
                      min="0"
                      value={newRowData.timelineMonth}
                      onChange={(e) => setNewRowData({ ...newRowData, timelineMonth: e.target.value })}
                      placeholder="e.g., 3"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-sm">Target Date</label>
                    <Input
                      type="date"
                      value={newRowData.targetDate}
                      onChange={(e) => setNewRowData({ ...newRowData, targetDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-sm">Actual Date</label>
                    <Input
                      type="date"
                      value={newRowData.actualDate}
                      onChange={(e) => setNewRowData({ ...newRowData, actualDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* 13. CP/CS & 14. Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium text-sm">CP/CS</label>
                    <Select
                      value={newRowData.dealCondition}
                      onValueChange={(v: CAPType) => setNewRowData({ ...newRowData, dealCondition: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CP">CP (Condition Precedent)</SelectItem>
                        <SelectItem value="CS">CS (Condition Subsequent)</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-sm">Status</label>
                    <Select
                      value={newRowData.status}
                      onValueChange={(v: CAPStatus) => setNewRowData({ ...newRowData, status: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                  </div>
                </div>

                {/* 15. Current Status Update */}
                <div>
                  <label className="block mb-1 font-medium text-sm">Current Status Update</label>
                  <Textarea
                    value={newRowData.statusUpdate}
                    onChange={(e) => setNewRowData({ ...newRowData, statusUpdate: e.target.value })}
                    placeholder="Latest update on this action item"
                    className="min-h-[60px]"
                  />
                </div>

                {/* 16. Review Remarks & 17. Last Review Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium text-sm">Review Remarks</label>
                    <Textarea
                      value={newRowData.reviewRemarks}
                      onChange={(e) => setNewRowData({ ...newRowData, reviewRemarks: e.target.value })}
                      placeholder="Reviewer comments"
                      className="min-h-[60px]"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-sm">Last Review Date</label>
                    <Input
                      type="date"
                      value={newRowData.lastReviewDate}
                      onChange={(e) => setNewRowData({ ...newRowData, lastReviewDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* 18. Implementation Support & 19. Closure Verified */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium text-sm">Implementation Support Needed</label>
                    <Textarea
                      value={newRowData.implementationSupportNeeded}
                      onChange={(e) => setNewRowData({ ...newRowData, implementationSupportNeeded: e.target.value })}
                      placeholder="What support is required?"
                      className="min-h-[60px]"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-sm">Closure Verified By</label>
                    <Input
                      value={newRowData.closureVerifiedBy}
                      onChange={(e) => setNewRowData({ ...newRowData, closureVerifiedBy: e.target.value })}
                      placeholder="Name of verifier"
                    />
                  </div>
                </div>

                {/* 20. Assigned To & 21. Remarks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium text-sm">Assigned To</label>
                    <Input
                      value={newRowData.assignedTo}
                      onChange={(e) => setNewRowData({ ...newRowData, assignedTo: e.target.value })}
                      placeholder="Person responsible"
                    />
                  </div>
                </div>

                {/* Actions Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button size="default" variant="ghost" onClick={() => setIsAddingRow(false)}>
                    Cancel
                  </Button>
                  <Button size="default" onClick={addNewRow}>
                    Save Item
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialog({ open: false, item: null });
            setConfirmText("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete CAP Item</DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 text-sm text-gray-600">
            <p className="mb-2">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">
                "{deleteDialog.item?.item}"
              </span>
              ?
            </p>
            <p className="text-xs text-gray-500">
              This action cannot be undone. All associated data, including measures,
              deliverables, and assigned resources will be permanently removed.
            </p>
          </div>

          <div className="mt-3">
            <Input
              type="text"
              placeholder='Type "DELETE" to confirm'
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full"
            />
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialog({ open: false, item: null });
                setConfirmText("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirmText !== "DELETE"}
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* <AiDialog isViewAiOpen={isViewAiOpen} onOpenChange={setIsViewAiOpen} item={item} /> */}
      <DocumentSummaryDialog open={isViewAiOpen} files={item.fileUploadedData} onClose={() => setIsViewAiOpen(false)}
        onSubmit={({ index, status, reason, fileName }) => {
          handleAcceptDocument({
            fileIndex: index,
            status,
            reason,
            fileName
          });
        }} />
    </TooltipProvider>
  );
}
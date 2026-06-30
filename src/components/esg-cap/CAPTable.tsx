import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, ArrowLeft, ArrowRight, Undo, Plus, Trash2, Columns, Pencil, AlertTriangle, Upload, Check, Loader, RotateCcw, X } from "lucide-react";
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
import { Link } from "react-router-dom";
import { getEffectiveStatus } from '@/utils/esgStatus';
export type CAPStatus = '' | 'due-in-this-month' | 'overdue' | 'partly-submitted' | 're-submit-Required' | 'submitted' | 'closed' | 'upcoming';
export type CAPCategory = "environmental" | "social" | "governance";
export type CAPType = "CP" | "CS" | "ESG_Roadmap" | "none";
export type CAPPriority = "High" | "Medium" | "Low";
import { StatusBadge } from './StatusBadge';
import { getDerivedInvestorStatus } from '@/utils/investorStatusUtils';
import { SubItemStatus } from "@/pages/useComplianceScore";

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
export type ESGCapDealCondition = 'CP' | 'CS' | 'ESG_Roadmap' | 'none';

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
  companyStatus: CAPStatus;
  investorStatus: string;
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
  // statusUpdate?: string;
  updateNote?: string;
  investorStatusUpdate?: string;
  reviewRemarks?: string;
  lastReviewDate?: string;
  progressPercentage?: number;
  implementationSupportNeeded?: string;
  closureVerifiedBy?: string;
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
  }[];
  completionIndicators?: CompletionIndicator[];
  status?:string;
  highlights?:{
    investor:Boolean
  }
  
}

export interface CompletionIndicator {
  indicatorLabel:       string;
  isMandatory?:         boolean;        // defaults true
  status?:              SubItemStatus;
  submissionDate?:      string | null;
  resubmitRequired?:    boolean;
  resubmitDueDate?:     string | null;
  resubmitComment?:     string | null;
  resubmittedDate?:     string | null;  // null = resubmit still open
  finalSubmissionDate?: string | null;  // explicit override
  guidanceResources?:   string;
  fileUploadUrl?:       string;
  reviewedOn?:          string | null;
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
  companyEmail?: string;
  companyEntityId: string
  setReloadData?: (reload: boolean) => void;
}

// ==================== DATE FORMATTER HELPERS ====================
const formatDisplayDate = (dateStr?: string): string => {
  if (!dateStr || dateStr === ' ' || dateStr === ' ') return ' ';

  const date = new Date(dateStr);

  if (isNaN(date.getTime())) return ' ';

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const isDateField = (fieldName: string): boolean => {
  return fieldName === 'targetDate' || fieldName === 'actualDate' || fieldName === 'lastReviewDate';
};
// ================================================================

const getStatusBadge = (companyStatus: CAPStatus) => {
  if (!companyStatus?.trim()) return null;
  switch (companyStatus) {
    case 'due-in-this-month':
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200"><AlertTriangle className="h-3 w-3 mr-1" /> Due in &lt;1 Month</Badge>;
    case 'overdue':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200"><X className="h-3 w-3 mr-1" /> Overdue</Badge>;
    case 'partly-submitted':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200"><Upload className="h-3 w-3 mr-1" /> Partly Submitted</Badge>;
    case 're-submit-Required':
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200"><RotateCcw className="h-3 w-3 mr-1" /> Re-submit Required</Badge>;
    case 'submitted':
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200"><Clock className="h-3 w-3 mr-1" /> Submitted</Badge>;
    case 'closed':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200"><Check className="h-3 w-3 mr-1" /> Closed</Badge>;
    default:
      return <Badge variant="outline">{companyStatus}</Badge>;
  }
};


const getPriorityBadge = (priority: CAPPriority) => {
  if (!priority?.trim()) return null;
  switch (priority?.toLowerCase()) {
    case "high":
      return (
        <Badge className="bg-red-200 text-red-500 hover:bg-red-200">
          High
        </Badge>
      );

    case "medium":
      return (
        <Badge className="bg-yellow-200 text-yellow-700 hover:bg-yellow-200">
          Medium
        </Badge>
      );

    case "low":
      return (
        <Badge className="bg-blue-200 text-blue-700 hover:bg-blue-200">
          Low
        </Badge>
      );

    default:
      return (
        <Badge className="bg-gray-300 text-black hover:bg-gray-300">
          {priority}
        </Badge>
      );
  }
};

const getCategoryBadge = (category: string) => {
  if (!category?.trim()) return null;
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
  const formatValue = (val: any) => {
    if (fieldName && isDateField(fieldName)) return formatDisplayDate(val);
    return val;
  };

  if (!hasChanged || !isComparisonView) {
    const displayValue = formatValue(currentValue) || " ";
    return <span>{displayValue}</span>;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1">
        <div className="bg-red-100 p-1 rounded text-red-800 line-through">
          {fieldName === "priority" ? getPriorityBadge(originalValue as CAPPriority) : formatValue(originalValue)}
        </div>
        <ArrowRight className="h-4 w-4" />
        <div className="bg-green-100 p-1 rounded text-green-800">
          {fieldName === "priority" ? getPriorityBadge(currentValue as CAPPriority) : formatValue(currentValue)}
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
  companyEmail,
  companyEntityId,
  setReloadData
}: CAPTableProps) {
  const completedItems = items.filter(
    item => getDerivedInvestorStatus(item) === 'closed'
  ).length;
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

  const handleAcceptDocument = async (payload) => {
    const { data, error } = await http.post('investor/esgdd/escap/document/accept', {
      entityId: companyEntityId,
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
    badgeType?: 'category' | 'priority' | 'companyStatus' | 'investorStatus'
  ) => {
    const formatValue = (val: any) => {
      if (isDateField(fieldName)) return formatDisplayDate(val);
      return val;
    };

    if (isComparisonView && originalValue !== undefined && currentValue !== originalValue) {
      // Show changed field with revert
      if (isBadge && badgeType) {
        const formatBadge = (val: any) => {
          if (isDateField(fieldName)) return formatDisplayDate(val);
          return val;
        };
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="line-through opacity-60">
                {badgeType === 'category' && getCategoryBadge(formatBadge(originalValue))}
                {badgeType === 'priority' && getPriorityBadge(formatBadge(originalValue))}
                {badgeType === 'companyStatus' && getStatusBadge(formatBadge(originalValue))}
                {badgeType === 'investorStatus' && getInvestorStatusBadge(formatBadge(originalValue))}
              </div>
              <ArrowRight className="h-3 w-3" />
              <div>
                {badgeType === 'category' && getCategoryBadge(formatBadge(currentValue))}
                {badgeType === 'priority' && getPriorityBadge(formatBadge(currentValue))}
                {badgeType === 'companyStatus' && getStatusBadge(formatBadge(currentValue))}
                {badgeType === 'investorStatus' && getInvestorStatusBadge(formatBadge(originalValue))}
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
      const displayValue = formatValue(currentValue);
      if (badgeType === 'category') return getCategoryBadge(displayValue);
      if (badgeType === 'priority') return getPriorityBadge(displayValue);
      if (badgeType === 'companyStatus') return getStatusBadge(displayValue);
      if (badgeType === 'investorStatus') return getInvestorStatusBadge(displayValue);
    }
    // Default: use formatted value (dates become readable)
    return <span>{formatValue(currentValue) || " "}</span>;
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return "↑↓"; // default
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const [sortConfig, setSortConfig] = useState<{
    key: keyof ESGCapItem;
    direction: "asc" | "desc";
  } | null>(null);

  const handleSort = (key: keyof ESGCapItem) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const isOverdue = (item: ESGCapItem) => {
    if (!item.targetDate) return false;
    const investorStatus = getDerivedInvestorStatus(item);
    if (investorStatus === 'closed') return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(item.targetDate);
    target.setHours(0, 0, 0, 0);

    return target < today;
  };

  const sortedItems = [...items].sort((a, b) => {
    // 1. Check if items are closed (push to bottom)
    const aIsClosed = getDerivedInvestorStatus(a) === 'closed';
    const bIsClosed = getDerivedInvestorStatus(b) === 'closed';

    if (aIsClosed && !bIsClosed) return 1;
    if (!aIsClosed && bIsClosed) return -1;

    // 2. Check overdue items (push to top) - optional
    const aIsOverdue = isOverdue(a);
    const bIsOverdue = isOverdue(b);

    if (aIsOverdue && !bIsOverdue) return -1;
    if (!aIsOverdue && bIsOverdue) return 1;

    // 3. If both have same status, apply normal sorting
    if (!sortConfig) return 0;

    let aVal: any = a[sortConfig.key];
    let bVal: any = b[sortConfig.key];

    // priority custom order
    if (sortConfig.key === "priority") {
      const order = { High: 3, Medium: 2, Low: 1 };
      aVal = order[aVal] || 0;
      bVal = order[bVal] || 0;
    }

    // date handling
    if (sortConfig.key === "targetDate") {
      aVal = aVal ? new Date(aVal).getTime() : 0;
      bVal = bVal ? new Date(bVal).getTime() : 0;
    }

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const getInvestorStatusBadge = (status: string) => {
    if (!status?.trim()) return null;

    // Normalize status for comparison
    const normalizedStatus = status.toLowerCase().trim();

    // Special handling for high-priority-overdue - CRITICAL STATUS
    if (normalizedStatus === 'high-priority-overdue') {
      return (
        <Badge
          variant="outline"
          className="bg-red-100 text-red-800 border-red-300 px-2.5 py-1 flex items-center gap-1 whitespace-nowrap"
        >
          <AlertTriangle className="h-3 w-3" />
          High Priority Overdue
        </Badge>
      );
    }

    // Map for other statuses - EXACTLY matching the Select options
    const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      "re-submit requested": {
        label: "Re-submit Requested",
        className: "bg-amber-100 text-amber-800 border-amber-300 px-2.5 py-1 whitespace-nowrap",
        icon: <RotateCcw className="h-3 w-3 mr-1" />
      },
      "under-review": {
        label: "Under Review",
        className: "bg-blue-100 text-blue-800 border-blue-300 px-2.5 py-1 whitespace-nowrap",
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      "reviewed-with-comments": {
        label: "Reviewed with Comments",
        className: "bg-purple-100 text-purple-800 border-purple-300 px-2.5 py-1 whitespace-nowrap",
        icon: <Pencil className="h-3 w-3 mr-1" />
      },
      "closed": {
        label: "Closed",
        className: "bg-green-100 text-green-800 border-green-300 px-2.5 py-1 whitespace-nowrap",
        icon: <Check className="h-3 w-3 mr-1" />
      },
      "deferred": {
        label: "Deferred",
        className: "bg-gray-100 text-gray-600 border-gray-300 px-2.5 py-1 whitespace-nowrap",
        icon: null
      }
    };

    // Additional statuses that might come from company status mapping
    const additionalMap: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      "overdue": {
        label: "Overdue",
        className: "bg-red-50 text-red-600 border-red-200 px-2.5 py-1 whitespace-nowrap",
        icon: <X className="h-3 w-3 mr-1" />
      },
      "partly-submitted": {
        label: "Partly Submitted",
        className: "bg-blue-100 text-blue-800 border-blue-300 px-2.5 py-1 whitespace-nowrap",
        icon: <Upload className="h-3 w-3 mr-1" />
      },
      "submitted": {
        label: "Submitted",
        className: "bg-purple-100 text-purple-800 border-purple-300 px-2.5 py-1 whitespace-nowrap",
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      "due-in-this-month": {
        label: "Due in this Month",
        className: "bg-orange-100 text-orange-800 border-orange-300 px-2.5 py-1 whitespace-nowrap",
        icon: <AlertTriangle className="h-3 w-3 mr-1" />
      }
    };

    // Try to find in main map first, then additional map
    const config = map[normalizedStatus] || additionalMap[normalizedStatus] || {
      label: status || ' ',
      className: "bg-gray-100 text-gray-600 px-2.5 py-1 whitespace-nowrap",
      icon: null
    };

    return (
      <Badge variant="outline" className={config.className}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getRowClassName = (item: ESGCapItem) => {
    const investorStatus = getDerivedInvestorStatus(item);
    const derived = getEffectiveStatus(item);
    if (investorStatus === 'closed') return 'bg-gray-300 text-gray-500';
    if (derived === 'overdue') return 'text-red-700';
    return '';
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
                  <th className="p-3 text-left">CAP Item</th>
                  <th className="p-3 text-left cursor-pointer" onClick={() => handleSort("priority")}>Priority {getSortIcon("priority")}</th>
                  <th className="p-3 text-left cursor-pointer" onClick={() => handleSort("targetDate")}>Target Date {getSortIcon("targetDate")}</th>
                  <th className="p-3 text-left">Company Status</th>
                  <th className="p-3 text-left">Investor Status</th>
                  <th className="p-3 text-left">Completed On</th>
                  <th className="p-3 text-center">Actions</th>
                  {/* <th className="p-3 text-left">Issue</th>
                  <th className="p-3 text-left">Completion indicator</th>
                  <th className="p-3 text-left">Progress Percentage</th> */}
                </>
              ) : (
                // FULL VIEW HEADERS (all columns + Progress Percentage after Target Date)
                <>
                  <th className="p-3 text-left">S. No</th>
                  <th className="p-3 text-left">CAP Item</th>
                  <th className="p-3 text-left cursor-pointer" onClick={() => handleSort("priority")}>Priority {getSortIcon("priority")}</th>
                  <th className="p-3 text-left cursor-pointer" onClick={() => handleSort("targetDate")}>Target Date {getSortIcon("targetDate")}</th>
                  <th className="p-3 text-left">Company Status</th>
                  <th className="p-3 text-left">Investor Status</th>
                  <th className="p-3 text-left">Completed On</th>
                  <th className="p-3 text-left cursor-pointer" onClick={() => handleSort("dealCondition")}>CP/CS/ESG Roadmap {getSortIcon("dealCondition")}</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Issue and Related Finding</th>
                  <th className="p-3 text-left">Measures & Corrective Actions</th>
                  <th className="p-3 text-left">Completion Indicator</th>
                  <th className="p-3 text-left">Timeline Month</th>
                  <th className="p-3 text-left">Add Update</th>
                  <th className="p-3 text-left">Review Comments</th>
                  <th className="p-3 text-left">Last Review Date</th>
                  <th className="p-3 text-left">Closure Verified By</th>
                  <th className="p-3 text-left">Assigned To</th>
                  <th className="p-3 text-left">Implementation Support Needed</th>
                  <th className="p-3 text-left">ESG Lever</th>
                  <th className="p-3 text-left">CAP Source</th>
                  <th className="p-3 text-center">Actions</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item, index) => {
              const originalItem = getOriginalItem(item.id);
              const isInvestorHighlighted = item.highlights?.investor === true;
              return (
                <tr key={item.id} className={`${getRowClassName(item)} ${isComparisonView ? "bg-muted/30 hover:bg-muted/50" : "hover:bg-gray-50"} ${isInvestorHighlighted ? "border-l-4 border-green-500" : ""
                  }`}>
                  {!showFullColumns ? (
                    // COMPACT VIEW ROWS
                    <>
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">
                        {renderField(item.item, originalItem?.item, "item", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.priority, originalItem?.priority, "priority", item.id, true, 'priority')}
                      </td>
                      <td className="p-3">
                        {renderField(item.targetDate, originalItem?.targetDate, "targetDate", item.id)}
                      </td>
                      <td className="p-3">
                        {item.targetDate ? (
                          <StatusBadge status={getEffectiveStatus(item)} />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {renderField(item.investorStatus, originalItem?.investorStatus, "investorStatus", item.id, true, 'investorStatus')}
                      </td>
                      <td className="p-3">
                        {renderField(item.actualDate, originalItem?.actualDate, "actualDate", item.id)}
                      </td>
                      <td className="p-3 text-right">
                        {/* Actions (same as original) */}
                        <div className="flex gap-2 justify-end items-center">
                          <Tooltip>
                            {/* <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => onReview(item)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger> */}
                            <TooltipTrigger asChild>
                              <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                              >
                                <Link
                                  to={`/esg-cap/review/${item?.reportId}?itemName=${encodeURIComponent(item?.item || "")}&companyEntityId=${companyEntityId || ""}&companyEmail=${encodeURIComponent(companyEmail || "")}`}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Link>
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
                              {item.fileUploadedData && item.fileUploadedData.length > 0 && (
                                <DropdownMenuItem onClick={() => onAiShow(item)}>Document Review Summary</DropdownMenuItem>
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
                        {renderField(item.priority, originalItem?.priority, "priority", item.id, true, 'priority')}
                      </td>
                      <td className="p-3">
                        {renderField(item.targetDate, originalItem?.targetDate, "targetDate", item.id)}
                      </td>
                      <td className="p-3">
                        {item.targetDate ? (
                          <StatusBadge status={getEffectiveStatus(item)} />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {renderField(item.investorStatus, originalItem?.investorStatus, "investorStatus", item.id, true, 'investorStatus')}
                      </td>
                      <td className="p-3">
                        {renderField(item.actualDate, originalItem?.actualDate, "actualDate", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.dealCondition, originalItem?.dealCondition || originalItem?.dealCondition, "dealCondition", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.category, originalItem?.category, "category", item.id, true, 'category')}
                      </td>
                      <td className="p-3">
                        {renderField(item.issue, originalItem?.issue, "issue", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.measures, originalItem?.measures, "measures", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.deliverable, originalItem?.deliverable, "deliverable", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.timelineMonth, originalItem?.timelineMonth, "timelineMonth", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.updateNote, originalItem?.updateNote, "updateNote", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.reviewRemarks, originalItem?.reviewRemarks, "reviewRemarks", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.lastReviewDate, originalItem?.lastReviewDate, "lastReviewDate", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.closureVerifiedBy, originalItem?.closureVerifiedBy, "closureVerifiedBy", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.assignedTo, originalItem?.assignedTo, "assignedTo", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.implementationSupportNeeded, originalItem?.implementationSupportNeeded, "implementationSupportNeeded", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.esgLever, originalItem?.esgLever, "esgLever", item.id)}
                      </td>
                      <td className="p-3">
                        {renderField(item.capSource, originalItem?.capSource, "capSource", item.id)}
                      </td>
                      <td className="p-3 text-right">
                        {/* Actions (same as original, re-use the same actions JSX) */}
                        <div className="flex gap-2 justify-end items-center">
                          <Tooltip>
                            {/* <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => onReview(item)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger> */}

                            <TooltipContent><p>Review CAP item</p></TooltipContent>

                            <TooltipTrigger asChild>
                              <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                              >
                                <Link
                                  to={`/esg-cap/review/${item?.reportId
                                    }?itemName=${encodeURIComponent(item?.item || "")}&companyEntityId=${companyEntityId || ""
                                    }`}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                          </Tooltip>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">•••</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onSendReminder(item)}>Send Reminder</DropdownMenuItem>
                              {item.fileUploadedData && item.fileUploadedData.length > 0 && (
                                <DropdownMenuItem onClick={() => onAiShow(item)}>Document Review Summary</DropdownMenuItem>
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
      {/* <div className="flex justify-between items-center p-4 bg-muted rounded-lg mt-4">
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
      </div> */}

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
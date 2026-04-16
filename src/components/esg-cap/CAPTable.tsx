import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, ArrowLeft, ArrowRight, Undo } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { useState } from "react";
import { AiDialog } from "./AiDialog";

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

  // requiredEvidence: {
  //   types: string[];
  //   normalizedTypes: string[];
  //   reasoning: string;
  //   confidence: number;
  // };

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
  components?: string[];   // system
  columns?: string[];      // data
  sections?: string[];     // report

  // future-proof (very important for your AI system)
  [key: string]: any;
}

export interface ESGCapItem {
  id: string | number;  // Can be string or number based on your API
  item: string;
  measures: string;
  reportId?: string;    // Make optional if not always present
  issue?: string;       // Make optional if not always present
  description?: string; // Make optional if not always present
  category: CAPCategory;
  recommendation?: string;
  priority: CAPPriority;
  status: CAPStatus;
  deadline?: string;    // This might be your targetDate
  targetDate?: string;  // Alternative to deadline
  assignedTo?: string;
  dealCondition: ESGCapDealCondition;
  createdAt: string;
  actualCompletionDate?: string;  // This might be your actualDate
  acceptedAt?: string;
  resource?: string;    // From your payload
  deliverable?: string; // From your payload
  CS?: string;         // From your payload
  actualDate?: string;
  remarks?: string;
  theme?:"Policy" | "SOP" | "Metrics" | "Logs";
  data_type?:string;
  documentType?: string;
  sections?: string[];
  sourceType?: string;
  aiResponseRaw?:AiResponse
}

// export interface ESGCapItem {
//   id: string;
//   reportId: string;
//   item: string;
//   category: CAPCategory;
//   CS?: string;
//   priority: CAPPriority;
//   measures: string;
//   resource: string;
//   deliverable: string;
//   targetDate: string;
//   actualDate?: string;
//   status: CAPStatus;
//   assignedTo?: string;
//   dealCondition?: CAPType;
//   createdAt?: string;
// }

interface CAPTableProps {
  items: ESGCapItem[];
  onReview: (item: ESGCapItem) => void;
  onSendReminder: (item: ESGCapItem) => void;
  originalItems?: ESGCapItem[]; // for comparison
  isComparisonView?: boolean;
  onRevertField?: (itemId: string | number, field: keyof ESGCapItem) => void;
  onRevert?: (itemId: string | number) => void;
  finalPlan?: boolean;
  progressPercentage?: number;
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

// Render field with changes highlight and revert
const RenderChangedField = ({
  currentValue,
  originalValue,
  isComparisonView = false,
  itemId,
  fieldName,
  onRevertField
}: {
  currentValue: string;
  originalValue: string;
  isComparisonView?: boolean;
  itemId?: string | number;
  fieldName?: keyof ESGCapItem;
  onRevertField?: (itemId: string | number, field: keyof ESGCapItem) => void;
}) => {
  const hasChanged = currentValue !== originalValue;

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
  originalItems = [],
  isComparisonView = false,
  onRevertField,
  onRevert
}: CAPTableProps) {
  const completedItems = items.filter(item => item.status === "completed").length;
  const progressPercentage = items.length > 0 ? Math.round((completedItems / items.length) * 100) : 0;
  const [isViewAiOpen, setIsViewAiOpen]=useState(false)
  const [item,setItem]=useState<ESGCapItem>({} as ESGCapItem);

  const getOriginalItem = (id: string | number) => originalItems.find(item => item.id === id) || null;

    const onAiShow=(item:ESGCapItem)=>{
      setIsViewAiOpen(true);
      setItem(item);
    }

  return (
    <>
      <div className="border rounded-md overflow-x-auto">
        <table className="w-full text-sm min-w-[1200px]">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left">S. No</th>
              <th className="p-3 text-left">Item</th>
              <th className="p-3 text-left">Measures & Corrective Actions</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Resource & Responsibility</th>
              <th className="p-3 text-left">Expected Deliverable</th>
              <th className="p-3 text-left">Target Date</th>
              <th className="p-3 text-left">CP/CS</th>
              <th className="p-3 text-left">Priority</th>
              <th className="p-3 text-left">Actual Date</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const originalItem = getOriginalItem(item.id);
              return (
                <tr key={item.id} className={isComparisonView ? "bg-muted/30" : ""}>
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">
                    {originalItem ? (
                      <RenderChangedField
                        currentValue={item.item}
                        originalValue={originalItem.item}
                        isComparisonView={isComparisonView}
                        itemId={item.id}
                        fieldName="item"
                        onRevertField={onRevertField}
                      />
                    ) : item.item}
                  </td>
                  <td className="p-3">{originalItem ? (
                    <RenderChangedField
                      currentValue={item.measures}
                      originalValue={originalItem.measures}
                      isComparisonView={isComparisonView}
                      itemId={item.id}
                      fieldName="measures"
                      onRevertField={onRevertField}
                    />
                  ) : item.measures}</td>
                  <td className="p-3">{getCategoryBadge(item.category)}</td>
                  <td className="p-3">{originalItem ? (
                    <RenderChangedField
                      currentValue={item.resource}
                      originalValue={originalItem.resource}
                      isComparisonView={isComparisonView}
                      itemId={item.id}
                      fieldName="resource"
                      onRevertField={onRevertField}
                    />
                  ) : item.resource}
                    {item.assignedTo && <div className="text-xs text-muted-foreground">{item.assignedTo}</div>}
                  </td>
                  <td className="p-3">{originalItem ? (
                    <RenderChangedField
                      currentValue={item.deliverable}
                      originalValue={originalItem.deliverable}
                      isComparisonView={isComparisonView}
                      itemId={item.id}
                      fieldName="deliverable"
                      onRevertField={onRevertField}
                    />
                  ) : item.deliverable}</td>
                  <td className="p-3">{item.targetDate || "-"}</td>
                  <td className="p-3">{item.CS || "-"}</td>
                  <td className="p-3">{getPriorityBadge(item.priority)}</td>
                  <td className="p-3">{item.actualDate || "-"}</td>
                  <td className="p-3">{getStatusBadge(item.status)}</td>
                  <td className="p-3 text-right flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => onReview(item)}>
                      <Eye className="h-4 w-4 mr-1" /> Review
                    </Button>
                    {/* <Button size="sm" variant="ghost" onClick={() => onSendReminder(item)}>
                      <Clock className="h-4 w-4" />
                    </Button> */}
                    <DropdownMenu>
                      <DropdownMenuTrigger>•••</DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onSendReminder(item)}>Send Reminder</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAiShow(item)}>Review AI Suggestion</DropdownMenuItem>
                        {/* <DropdownMenuItem>Mark Complete</DropdownMenuItem> */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {isComparisonView && onRevert && (
                      <Button size="sm" variant="outline" className="text-amber-600 border-amber-600" onClick={() => onRevert(item.id)}>
                        <ArrowLeft className="h-4 w-4 mr-1" /> Revert All
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
      {/* <Dialog open={isViewAiOpen} onOpenChange={setIsViewAiOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{item.item}</DialogTitle>
            <DialogDescription>
              ESG Action Plan Details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">

            <div>
              <h3 className="font-semibold mb-2">Basic Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p><b>Category:</b> {item.category}</p>
                <p><b>Status:</b> {item.status}</p>
                <p><b>Priority:</b> {item.priority}</p>
                <p><b>Assigned To:</b> {item.assignedTo}</p>
                <p><b>Target Date:</b> {item.targetDate}</p>
                <p><b>Actual Date:</b> {item.actualDate}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">AI Insights</h3>
              <p className="text-sm text-muted-foreground">
                {item.aiResponseRaw?.reasoning}
              </p>
              <p className="text-xs mt-1">
                Confidence: {(item.aiResponseRaw?.confidence * 100).toFixed(0)}%
              </p>
            </div>

            
            {item.aiResponseRaw?.requiredEvidence && (
              <div>
                <h3 className="font-semibold mb-2">Required Evidence</h3>
                <div className="flex flex-wrap gap-2">
                  {item.aiResponseRaw.requiredEvidence.types.map((type: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            
            {item.aiResponseRaw?.templates?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Suggested Templates</h3>

                <div className="space-y-4">
                  {item.aiResponseRaw.templates.map((template: any, index: number) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 bg-muted/20"
                    >
                      <p className="font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Type: {template.type} • Format: {template.format}
                      </p>

                      
                      {template.structure?.components && (
                        <ul className="list-disc ml-5 text-sm">
                          {template.structure.components.map((c: string, i: number) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      )}

                      {template.structure?.columns && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {template.structure.columns.map((col: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-gray-200 rounded">
                              {col}
                            </span>
                          ))}
                        </div>
                      )}

                      {template.structure?.sections && (
                        <ul className="list-disc ml-5 text-sm">
                          {template.structure.sections.map((sec: string, i: number) => (
                            <li key={i}>{sec}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewAiOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
      <AiDialog isViewAiOpen={isViewAiOpen} onOpenChange={setIsViewAiOpen} item={item} />
    </>


  );
}
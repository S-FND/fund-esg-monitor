import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, ArrowLeft, ArrowRight, Undo } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

export interface ESGCapItem {
  id: string;
  reportId: string;
  item: string;
  category: CAPCategory;
  CS?: string;
  priority: CAPPriority;
  measures: string;
  resource: string;
  deliverable: string;
  targetDate: string;
  actualDate?: string;
  status: CAPStatus;
  assignedTo?: string;
  dealCondition?: CAPType;
  createdAt?: string;
}

interface CAPTableProps {
  items: ESGCapItem[];
  onReview: (item: ESGCapItem) => void;
  onSendReminder: (item: ESGCapItem) => void;
  originalItems?: ESGCapItem[]; // for comparison
  isComparisonView?: boolean;
  onRevertField?: (itemId: string, field: keyof ESGCapItem) => void;
  onRevert?: (itemId: string) => void;
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
  itemId?: string;
  fieldName?: keyof ESGCapItem;
  onRevertField?: (itemId: string, field: keyof ESGCapItem) => void;
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

  const getOriginalItem = (id: string) => originalItems.find(item => item.id === id) || null;

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
                  <td className="p-3">
                    {originalItem ? (
                      <RenderChangedField
                        currentValue={item.measures}
                        originalValue={originalItem.measures}
                        isComparisonView={isComparisonView}
                        itemId={item.id}
                        fieldName="measures"
                        onRevertField={onRevertField}
                      />
                    ) : (
                      <div className="relative group">
                        <div className="line-clamp-2">{item.measures}</div>
                        {item.measures && item.measures.length > 100 && (
                          <button
                            className="text-blue-500 text-xs hover:underline mt-1 block"
                            onClick={(e) => {
                              const target = e.currentTarget.previousElementSibling;
                              if (target) {
                                target.classList.toggle('line-clamp-2');
                                target.classList.toggle('line-clamp-none');
                                e.currentTarget.textContent = target.classList.contains('line-clamp-none') ? 'Show less' : 'View more';
                              }
                            }}
                          >
                            View more
                          </button>
                        )}
                      </div>
                    )}
                  </td>
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
                  <td className="p-3">
                    {originalItem ? (
                      <RenderChangedField
                        currentValue={item.deliverable}
                        originalValue={originalItem.deliverable}
                        isComparisonView={isComparisonView}
                        itemId={item.id}
                        fieldName="deliverable"
                        onRevertField={onRevertField}
                      />
                    ) : (
                      <div className="relative group">
                        <div className="line-clamp-2">{item.deliverable}</div>
                        {item.deliverable && item.deliverable.length > 100 && (
                          <button
                            className="text-blue-500 text-xs hover:underline mt-1 block"
                            onClick={(e) => {
                              const target = e.currentTarget.previousElementSibling;
                              if (target) {
                                target.classList.toggle('line-clamp-2');
                                target.classList.toggle('line-clamp-none');
                                e.currentTarget.textContent = target.classList.contains('line-clamp-none') ? 'Show less' : 'View more';
                              }
                            }}
                          >
                            View more
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-3">{item.targetDate || "-"}</td>
                  <td className="p-3">{item.CS || "-"}</td>
                  <td className="p-3">{getPriorityBadge(item.priority)}</td>
                  <td className="p-3">{item.actualDate || "-"}</td>
                  <td className="p-3">{getStatusBadge(item.status)}</td>
                  <td className="p-3 text-center align-middle">
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" variant="outline" onClick={() => onReview(item)}>
                        <Eye className="h-4 w-4 mr-1" /> Review
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onSendReminder(item)}>
                        <Clock className="h-4 w-4" />
                      </Button>
                      {isComparisonView && onRevert && (
                        <Button size="sm" variant="outline" className="text-amber-600 border-amber-600" onClick={() => onRevert(item.id)}>
                          <ArrowLeft className="h-4 w-4 mr-1" /> Revert All
                        </Button>
                      )}
                    </div>
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
    </>
  );
}
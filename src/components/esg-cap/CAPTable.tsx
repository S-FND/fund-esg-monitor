import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Eye, ArrowLeft, ArrowRight, Undo } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type CAPStatus = 'in_review' | 'accepted' | 'pending' | 'in_progress' | 'completed' | 'delayed';
export type CAPCategory = 'environmental' | 'social' | 'governance';
export type CAPPriority = "High" | "Medium" | "Low";
export type CAPType = 'CP' | 'CS' | 'none';
export type CAPDealCondition = 'CP' | 'CS' | 'none';
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
  dealCondition: CAPDealCondition;
  createdAt: string;
  actualCompletionDate?: string;  // This might be your actualDate
  acceptedAt?: string;
  resource?: string;    // From your payload
  deliverable?: string; // From your payload
  CS?: string;         // From your payload
  actualDate?: string;
  remarks?: string;
}

interface CAPTableProps {
  items: ESGCapItem[];
  onReview: (item: ESGCapItem) => void;
  onSendReminder: (item: ESGCapItem) => void;
  isHistoryView?: boolean;
  originalItems?: ESGCapItem[];
  isComparisonView?: boolean;
  onRevert?: (itemId: string) => void;
  onRevertField?: (itemId: string, field: keyof ESGCapItem) => void;
  finalPlan?: boolean;
  showChangeStatus?: boolean;
  progressPercentage?: number;
}

const getStatusBadge = (status: CAPStatus) => {
  switch (status) {
    case "pending":
      return <Badge variant="outline">Pending</Badge>;
    case "in_progress":
      return <Badge variant="secondary">In Progress</Badge>;
    case "completed":
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>;
    case "delayed":
      return <Badge variant="destructive">Delayed</Badge>;
    case "in_review":
      return <Badge variant="outline">In Review</Badge>;
    case "accepted":
      return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Accepted</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getCategoryBadge = (category: CAPCategory) => {
  switch (category) {
    case "environmental":
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Environmental</Badge>;
    case "social":
      return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Social</Badge>;
    case "governance":
      return <Badge variant="default" className="bg-purple-500 hover:bg-purple-600">Governance</Badge>;
    default:
      return <Badge variant="outline">{category}</Badge>;
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

const getDealConditionBadge = (dealCondition: CAPType) => {
  switch (dealCondition) {
    case "CP":
      return <Badge variant="outline" className="border-amber-300 text-amber-700">CP</Badge>;
    case "CS":
      return <Badge variant="outline" className="border-blue-300 text-blue-700">CS</Badge>;
    case "none":
      return <Badge variant="outline" className="border-gray-300 text-gray-700">None</Badge>;
    default:
      return <Badge variant="outline">{dealCondition}</Badge>;
  }
};

// Function to check if a field has changed and wrap it appropriately
const RenderChangedField = ({
  currentValue,
  originalValue,
  isHistoryView,
  isComparisonView = false,
  itemId,
  fieldName,
  onRevertField,
  isBadge = false,
  badgeRenderer
}: {
  currentValue: any;
  originalValue: any;
  isHistoryView?: boolean;
  isComparisonView?: boolean;
  itemId?: string;
  fieldName?: keyof ESGCapItem;
  onRevertField?: (itemId: string, field: keyof ESGCapItem) => void;
  isBadge?: boolean;
  badgeRenderer?: (value: any) => React.ReactNode;
}) => {
  const hasChanged = currentValue !== originalValue;

  if (!hasChanged || (!isHistoryView && !isComparisonView)) {
    return isBadge && badgeRenderer ? badgeRenderer(currentValue) : <span>{currentValue}</span>;
  }

  if (isComparisonView) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center">
          <div className="bg-red-100 p-1 rounded text-red-800 line-through">
            {isBadge && badgeRenderer ? badgeRenderer(originalValue) : originalValue}
          </div>
          <ArrowRight className="mx-1 h-4 w-4" />
          <div className="bg-green-100 p-1 rounded text-green-800">
            {isBadge && badgeRenderer ? badgeRenderer(currentValue) : currentValue}
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
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="border-b-2 border-amber-400 pb-0.5">
            {isBadge && badgeRenderer ? badgeRenderer(currentValue) : currentValue}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">Original: {originalValue}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export function CAPTable({
  items,
  onReview,
  onSendReminder,
  isHistoryView = false,
  originalItems = [],
  isComparisonView = false,
  onRevert,
  onRevertField,
  finalPlan = false,
  progressPercentage = 0
}: CAPTableProps) {
  // Function to find the original item by ID
  const getOriginalItem = (id: string) => {
    return originalItems.find(item => item.id === id) || null;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Measures and/or Corrective Actions</TableHead>
              <TableHead>Resource & Responsibility</TableHead>
              <TableHead>Expected Deliverable</TableHead>
              <TableHead>Target Date</TableHead>
              <TableHead>CP/CS</TableHead>
              <TableHead>Actual Date</TableHead>
              <TableHead>Status</TableHead>
              {isComparisonView && <TableHead>Changes</TableHead>}
              <TableHead className="text-right">Actions</TableHead>
              <TableHead>Assigned To</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => {
              const originalItem = getOriginalItem(String(item.id));

              return (
                <TableRow key={item.id} className={isHistoryView || isComparisonView ? "bg-muted/30" : ""}>
                  <TableCell>{index + 1}</TableCell>

                  <TableCell className="font-medium">
                    {originalItem ? (
                      <RenderChangedField
                        currentValue={item.item}
                        originalValue={originalItem.item}
                        isHistoryView={isHistoryView}
                        isComparisonView={isComparisonView}
                        itemId={String(item.id)}
                        fieldName="item"
                        onRevertField={onRevertField}
                      />
                    ) : item.item}
                  </TableCell>

                  <TableCell>
                    {originalItem ? (
                      <RenderChangedField
                        currentValue={item.category}
                        originalValue={originalItem.category}
                        isHistoryView={isHistoryView}
                        isComparisonView={isComparisonView}
                        itemId={String(item.id)}
                        fieldName="category"
                        onRevertField={onRevertField}
                        isBadge={true}
                        badgeRenderer={getCategoryBadge}
                      />
                    ) : getCategoryBadge(item.category)}
                  </TableCell>

                  <TableCell>
                    {originalItem ? (
                      <RenderChangedField
                        currentValue={item.priority}
                        originalValue={originalItem.priority}
                        isHistoryView={isHistoryView}
                        isComparisonView={isComparisonView}
                        itemId={String(item.id)}
                        fieldName="priority"
                        onRevertField={onRevertField}
                        isBadge={true}
                        badgeRenderer={getPriorityBadge}
                      />
                    ) : getPriorityBadge(item.priority)}
                  </TableCell>

                  <TableCell>
                    {originalItem ? (
                      <RenderChangedField
                        currentValue={item.measures}
                        originalValue={originalItem.measures}
                        isHistoryView={isHistoryView}
                        isComparisonView={isComparisonView}
                        itemId={String(item.id)}
                        fieldName="measures"
                        onRevertField={onRevertField}
                      />
                    ) : item.measures}
                  </TableCell>

                  <TableCell>
                    {originalItem ? (
                      <RenderChangedField
                        currentValue={item.resource}
                        originalValue={originalItem.resource}
                        isHistoryView={isHistoryView}
                        isComparisonView={isComparisonView}
                        itemId={String(item.id)}
                        fieldName="resource"
                        onRevertField={onRevertField}
                      />
                    ) : item.resource}
                  </TableCell>



                  <TableCell>
                    {originalItem ? (
                      <RenderChangedField
                        currentValue={item.deliverable}
                        originalValue={originalItem.deliverable}
                        isHistoryView={isHistoryView}
                        isComparisonView={isComparisonView}
                        itemId={String(item.id)}
                        fieldName="deliverable"
                        onRevertField={onRevertField}
                      />
                    ) : item.deliverable}
                  </TableCell>

                  <TableCell>
                    {originalItem ? (
                      <RenderChangedField
                        currentValue={item.targetDate}
                        originalValue={originalItem.targetDate}
                        isHistoryView={isHistoryView}
                        isComparisonView={isComparisonView}
                        itemId={String(item.id)}
                        fieldName="targetDate"
                        onRevertField={onRevertField}
                      />
                    ) : item.targetDate}
                  </TableCell>

                  <TableCell>
                    {originalItem ? (
                      <RenderChangedField
                        currentValue={item.CS}
                        originalValue={originalItem.CS}
                        isHistoryView={isHistoryView}
                        isComparisonView={isComparisonView}
                        itemId={String(item.id)}
                        fieldName="CS"
                        onRevertField={onRevertField}
                        isBadge={true}
                        badgeRenderer={getDealConditionBadge}
                      />
                    ) : item.CS ? getDealConditionBadge(item.CS as CAPType) : getDealConditionBadge('none')}
                  </TableCell>

                  <TableCell>
                    {item.actualDate ? new Date(item.actualDate).toLocaleDateString() : "-"}
                  </TableCell>

                  <TableCell>
                    {getStatusBadge(item.status)}
                  </TableCell>

                  <TableCell>
                    {originalItem ? (
                      <RenderChangedField
                        currentValue={item.assignedTo || 'Not assigned'}
                        originalValue={originalItem.assignedTo || 'Not assigned'}
                        isHistoryView={isHistoryView}
                        isComparisonView={isComparisonView}
                        itemId={String(item.id)}
                        fieldName="assignedTo"
                        onRevertField={onRevertField}
                      />
                    ) : item.assignedTo || 'Not assigned'}
                  </TableCell>

                  {isComparisonView && (
                    <TableCell>
                      {/* Changes summary could go here */}
                    </TableCell>
                  )}

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {isComparisonView && onRevert ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRevert(String(item.id))}
                          className="text-amber-600 border-amber-600"
                          disabled={finalPlan}
                        >
                          <ArrowLeft className="h-4 w-4 mr-1" />
                          Revert All
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onReview(item)}
                            disabled={finalPlan}
                          >
                            {isHistoryView ? <Eye className="h-4 w-4 mr-1" /> : null}
                            Review
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSendReminder(item)}
                            disabled={isHistoryView || isComparisonView || finalPlan}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Progress Summary */}
      <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
        <div className="text-sm text-muted-foreground">
          Total Action Items: <span className="font-semibold">{items.length}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Progress:
          </div>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="font-semibold text-sm">{progressPercentage}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
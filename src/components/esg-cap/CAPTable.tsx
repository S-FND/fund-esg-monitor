
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Eye, ArrowLeft, ArrowRight, Undo } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { portfolioCompanies } from "@/features/edit-portfolio-company/portfolioCompanies";

export type CAPStatus = "Pending" | "In Progress" | "Completed" | "Delayed" | "Rejected";
export type CAPType = "CP" | "CS";

export interface CAPItem {
  id: string;
  companyId: number;
  item: string;
  actions: string;
  responsibility: string;
  deliverable: string;
  targetDate: string;
  type: CAPType;
  actualDate?: string;
  status: CAPStatus;
}

interface CAPTableProps {
  items: CAPItem[];
  onReview: (item: CAPItem) => void;
  onSendReminder: (item: CAPItem) => void;
  isHistoryView?: boolean;
  originalItems?: CAPItem[];
  isComparisonView?: boolean;
  onRevert?: (itemId: string) => void;
  onRevertField?: (itemId: string, field: keyof CAPItem) => void;
}

const getStatusBadge = (status: CAPStatus) => {
  switch (status) {
    case "Pending":
      return <Badge variant="outline">Pending</Badge>;
    case "In Progress":
      return <Badge variant="secondary">In Progress</Badge>;
    case "Completed":
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>;
    case "Delayed":
      return <Badge variant="destructive">Delayed</Badge>;
    case "Rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getCompanyName = (companyId: number) => {
  const company = portfolioCompanies.find(company => company.id === companyId);
  return company ? company.name : "Unknown Company";
};

// Function to check if a field has changed and wrap it appropriately
const RenderChangedField = ({ 
  currentValue, 
  originalValue, 
  isHistoryView,
  isComparisonView = false,
  itemId,
  fieldName,
  onRevertField
}: { 
  currentValue: string; 
  originalValue: string; 
  isHistoryView?: boolean;
  isComparisonView?: boolean;
  itemId?: string;
  fieldName?: keyof CAPItem;
  onRevertField?: (itemId: string, field: keyof CAPItem) => void;
}) => {
  const hasChanged = currentValue !== originalValue;

  if (!hasChanged || (!isHistoryView && !isComparisonView)) {
    return <span>{currentValue}</span>;
  }

  if (isComparisonView) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center">
          <div className="bg-red-100 p-1 rounded text-red-800 line-through">
            {originalValue}
          </div>
          <ArrowRight className="mx-1 h-4 w-4" />
          <div className="bg-green-100 p-1 rounded text-green-800">
            {currentValue}
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
            {currentValue}
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
  onRevertField
}: CAPTableProps) {
  // Function to find the original item by ID
  const getOriginalItem = (id: string) => {
    return originalItems.find(item => item.id === id) || null;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">S. No</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Measures and/or Corrective Actions</TableHead>
            <TableHead>Resource & Responsibility</TableHead>
            <TableHead>Expected Deliverable</TableHead>
            <TableHead>Target Date</TableHead>
            <TableHead>CP/CS</TableHead>
            <TableHead>Actual Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
            const originalItem = getOriginalItem(item.id);
            
            return (
              <TableRow key={item.id} className={isHistoryView || isComparisonView ? "bg-muted/30" : ""}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{getCompanyName(item.companyId)}</TableCell>
                <TableCell className="font-medium">
                  {originalItem ? (
                    <RenderChangedField 
                      currentValue={item.item} 
                      originalValue={originalItem.item} 
                      isHistoryView={isHistoryView}
                      isComparisonView={isComparisonView}
                      itemId={item.id}
                      fieldName="item"
                      onRevertField={onRevertField}
                    />
                  ) : item.item}
                </TableCell>
                <TableCell>
                  {originalItem ? (
                    <RenderChangedField 
                      currentValue={item.actions} 
                      originalValue={originalItem.actions} 
                      isHistoryView={isHistoryView}
                      isComparisonView={isComparisonView}
                      itemId={item.id}
                      fieldName="actions"
                      onRevertField={onRevertField}
                    />
                  ) : item.actions}
                </TableCell>
                <TableCell>
                  {originalItem ? (
                    <RenderChangedField 
                      currentValue={item.responsibility} 
                      originalValue={originalItem.responsibility} 
                      isHistoryView={isHistoryView}
                      isComparisonView={isComparisonView}
                      itemId={item.id}
                      fieldName="responsibility"
                      onRevertField={onRevertField}
                    />
                  ) : item.responsibility}
                </TableCell>
                <TableCell>
                  {originalItem ? (
                    <RenderChangedField 
                      currentValue={item.deliverable} 
                      originalValue={originalItem.deliverable} 
                      isHistoryView={isHistoryView}
                      isComparisonView={isComparisonView}
                      itemId={item.id}
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
                      itemId={item.id}
                      fieldName="targetDate"
                      onRevertField={onRevertField}
                    />
                  ) : item.targetDate}
                </TableCell>
                <TableCell>
                  {originalItem ? (
                    <RenderChangedField 
                      currentValue={item.type} 
                      originalValue={originalItem.type} 
                      isHistoryView={isHistoryView}
                      isComparisonView={isComparisonView}
                      itemId={item.id}
                      fieldName="type"
                      onRevertField={onRevertField}
                    />
                  ) : item.type}
                </TableCell>
                <TableCell>
                  {item.actualDate || "-"}
                </TableCell>
                <TableCell>
                  {getStatusBadge(item.status)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {isComparisonView && onRevert ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onRevert(item.id)}
                        className="text-amber-600 border-amber-600"
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Revert All
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={() => onReview(item)}>
                          {isHistoryView ? <Eye className="h-4 w-4 mr-1" /> : null}
                          Review
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onSendReminder(item)}
                          disabled={isHistoryView || isComparisonView}
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
  );
}

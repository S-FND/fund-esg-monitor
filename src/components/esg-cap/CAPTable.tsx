
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock } from "lucide-react";
import { portfolioCompanies } from "@/features/edit-portfolio-company/portfolioCompanies";

export type CAPStatus = "Pending" | "In Progress" | "Completed" | "Delayed" | "Rejected";
export type CAPType = "CP" | "CS";

export interface CAPItem {
  id: string;
  companyId: number;
  item: string;
  measures: string;
  resource: string;
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

export function CAPTable({ items, onReview, onSendReminder }: CAPTableProps) {
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
          {items.map((item, index) => (
            <TableRow key={item.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{getCompanyName(item.companyId)}</TableCell>
              <TableCell className="font-medium">{item.item}</TableCell>
              <TableCell>{item.measures}</TableCell>
              <TableCell>{item.resource}</TableCell>
              <TableCell>{item.deliverable}</TableCell>
              <TableCell>{item.targetDate}</TableCell>
              <TableCell>{item.type}</TableCell>
              <TableCell>{item.actualDate || "-"}</TableCell>
              <TableCell>{getStatusBadge(item.status)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => onReview(item)}>
                    Review
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onSendReminder(item)}>
                    <Clock className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

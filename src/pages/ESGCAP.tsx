
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Clock, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

// Types for the CAP item
type CAPStatus = "Pending" | "In Progress" | "Completed" | "Delayed" | "Rejected";
type CAPType = "CP" | "CS"; // Condition Precedent or Condition Subsequent

interface CAPItem {
  id: string;
  item: string;
  actions: string;
  responsibility: string;
  deliverable: string;
  targetDate: string;
  type: CAPType;
  actualDate?: string;
  status: CAPStatus;
}

export default function ESGCAP() {
  const [selectedItem, setSelectedItem] = useState<CAPItem | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  // Mock data for CAP items
  const mockCAPItems: CAPItem[] = [
    {
      id: "cap-1",
      item: "Environmental Policy",
      actions: "Develop and implement a comprehensive environmental policy",
      responsibility: "Company ESG Manager",
      deliverable: "Environmental Policy Document",
      targetDate: "2025-06-30",
      type: "CP",
      status: "Pending"
    },
    {
      id: "cap-2",
      item: "Waste Management",
      actions: "Implement waste segregation and recycling program",
      responsibility: "Operations Team",
      deliverable: "Waste Management Reports",
      targetDate: "2025-05-15",
      type: "CS",
      status: "In Progress"
    },
    {
      id: "cap-3",
      item: "Energy Audit",
      actions: "Conduct energy audit and implement efficiency measures",
      responsibility: "External Consultant & Facilities",
      deliverable: "Energy Audit Report",
      targetDate: "2025-04-30",
      type: "CP",
      actualDate: "2025-04-25",
      status: "Completed"
    },
    {
      id: "cap-4",
      item: "Diversity Policy",
      actions: "Develop and implement diversity and inclusion policy",
      responsibility: "HR Department",
      deliverable: "D&I Policy Document",
      targetDate: "2025-03-15",
      type: "CS",
      status: "Delayed"
    }
  ];

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

  const handleReview = (item: CAPItem) => {
    setSelectedItem(item);
    setReviewDialogOpen(true);
  };

  const handleApprove = () => {
    toast({
      title: "Item Approved",
      description: `You've approved "${selectedItem?.item}"`,
    });
    setReviewDialogOpen(false);
  };

  const handleReject = () => {
    toast({
      title: "Item Rejected",
      description: `You've rejected "${selectedItem?.item}"`,
    });
    setReviewDialogOpen(false);
  };

  const handleSendReminder = (item: CAPItem) => {
    toast({
      title: "Reminder Sent",
      description: `Reminder sent for "${item.item}"`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ESG Corrective Action Plan</h1>
        <p className="text-muted-foreground">
          Review and finalize the ESG Corrective Action Plan items
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Corrective Action Plan Items</CardTitle>
          <CardDescription>
            Review and approve items in the ESG Corrective Action Plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">S. No</TableHead>
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
                {mockCAPItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.item}</TableCell>
                    <TableCell>{item.actions}</TableCell>
                    <TableCell>{item.responsibility}</TableCell>
                    <TableCell>{item.deliverable}</TableCell>
                    <TableCell>{item.targetDate}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.actualDate || "-"}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleReview(item)}
                        >
                          Review
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleSendReminder(item)}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review CAP Item</DialogTitle>
            <DialogDescription>
              Review and approve or reject this CAP item.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <h4 className="font-semibold">Item</h4>
              <p>{selectedItem?.item}</p>
            </div>
            <div>
              <h4 className="font-semibold">Corrective Actions</h4>
              <p>{selectedItem?.actions}</p>
            </div>
            <div>
              <h4 className="font-semibold">Responsibility</h4>
              <p>{selectedItem?.responsibility}</p>
            </div>
            <div>
              <h4 className="font-semibold">Target Date</h4>
              <p>{selectedItem?.targetDate}</p>
            </div>
            <div>
              <h4 className="font-semibold">Type</h4>
              <p>{selectedItem?.type}</p>
            </div>
            <div>
              <h4 className="font-semibold">Status</h4>
              <p>{selectedItem?.status}</p>
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2 sm:justify-end">
            <Button variant="destructive" onClick={handleReject}>
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button onClick={handleApprove}>
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

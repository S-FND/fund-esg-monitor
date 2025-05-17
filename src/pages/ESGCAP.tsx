
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { CAPItem, CAPStatus, CAPType, CAPTable } from "@/components/esg-cap/CAPTable";
import { ReviewDialog } from "@/components/esg-cap/ReviewDialog";
import { FilterControls } from "@/components/esg-cap/FilterControls";
import { portfolioCompanies } from "@/features/edit-portfolio-company/portfolioCompanies";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Diff, Compare } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ESGCAP() {
  const [selectedItem, setSelectedItem] = useState<CAPItem | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [canEdit, setCanEdit] = useState(true);
  const { user, userRole } = useAuth();
  const [showHistory, setShowHistory] = useState(false);
  const [showComparisonView, setShowComparisonView] = useState(false);

  // Mock data for CAP items with company IDs
  const [originalCapItems] = useState<CAPItem[]>([
    {
      id: "cap-1",
      companyId: 1,
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
      companyId: 2,
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
      companyId: 1,
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
      companyId: 3,
      item: "Diversity Policy",
      actions: "Develop and implement diversity and inclusion policy",
      responsibility: "HR Department",
      deliverable: "D&I Policy Document",
      targetDate: "2025-03-15",
      type: "CS",
      status: "Delayed"
    }
  ]);
  
  // Current working copy of CAP items
  const [capItems, setCapItems] = useState<CAPItem[]>(originalCapItems);

  // Filter CAP items by selected company
  const filteredCAPItems = selectedCompany === "all"
    ? (showHistory ? originalCapItems : capItems)
    : (showHistory ? originalCapItems : capItems).filter(item => item.companyId === parseInt(selectedCompany));

  const handleReview = (item: CAPItem) => {
    const currentItem = capItems.find(i => i.id === item.id);
    setSelectedItem(currentItem || null);
    setReviewDialogOpen(true);
    // Check if the item is completed - if so, don't allow editing
    setCanEdit(currentItem?.status !== "Completed");
  };

  const handleApprove = () => {
    if (selectedItem) {
      const updatedItems = capItems.map(item => {
        if (item.id === selectedItem.id) {
          return { ...item, status: "Completed" as CAPStatus, actualDate: new Date().toISOString().split('T')[0] };
        }
        return item;
      });
      setCapItems(updatedItems);
    }
    toast({
      title: "Item Approved",
      description: `You've approved "${selectedItem?.item}"`,
    });
    setReviewDialogOpen(false);
  };

  const handleReject = () => {
    if (selectedItem) {
      const updatedItems = capItems.map(item => {
        if (item.id === selectedItem.id) {
          return { ...item, status: "Rejected" as CAPStatus };
        }
        return item;
      });
      setCapItems(updatedItems);
    }
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

  const handleSaveChanges = (updatedItem: CAPItem) => {
    const updatedItems = capItems.map(item => {
      if (item.id === updatedItem.id) {
        return updatedItem;
      }
      return item;
    });
    setCapItems(updatedItems);
    setSelectedItem(updatedItem);
  };

  const handleSubmitAllCap = () => {
    toast({
      title: "CAP Submitted",
      description: "All CAP items have been submitted successfully.",
    });
    // Here you would typically send the data to a backend API
    console.log("Submitting CAP items:", filteredCAPItems);
  };

  const toggleHistoryView = () => {
    setShowHistory(!showHistory);
    if (showComparisonView) {
      setShowComparisonView(false);
    }
  };

  const toggleComparisonView = () => {
    setShowComparisonView(!showComparisonView);
    if (showHistory) {
      setShowHistory(false);
    }
  };

  const handleRevertToOriginal = (itemId: string) => {
    const originalItem = originalCapItems.find(item => item.id === itemId);
    if (originalItem) {
      const updatedItems = capItems.map(item => {
        if (item.id === itemId) {
          return { ...originalItem };
        }
        return item;
      });
      setCapItems(updatedItems);
      
      toast({
        title: "Item Reverted",
        description: `Item "${originalItem.item}" has been reverted to its original state.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ESG Corrective Action Plan</h1>
        <p className="text-muted-foreground">
          Review and finalize the ESG Corrective Action Plan items
        </p>
      </div>

      <div className="flex items-center justify-between">
        <FilterControls 
          companies={portfolioCompanies}
          selectedCompany={selectedCompany}
          onCompanyChange={setSelectedCompany}
        />
        
        <div className="flex items-center gap-6">
          <div className="flex items-center space-x-2">
            <Switch 
              id="history-mode" 
              checked={showHistory} 
              onCheckedChange={toggleHistoryView}
              disabled={showComparisonView}
            />
            <Label htmlFor="history-mode">
              {showHistory ? "Viewing Original Version" : "View Original Version"}
            </Label>
          </div>
          
          <Button 
            variant="outline" 
            onClick={toggleComparisonView}
            className={showComparisonView ? "border-purple-500 text-purple-500" : ""}
          >
            <Compare className="h-4 w-4 mr-2" />
            {showComparisonView ? "Exit Comparison View" : "Compare Changes"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Corrective Action Plan Items</CardTitle>
          <CardDescription>
            Review and approve items in the ESG Corrective Action Plan
            {showHistory && <span className="ml-2 text-amber-500 font-medium">(Viewing Original Version)</span>}
            {showComparisonView && <span className="ml-2 text-purple-500 font-medium">(Comparing Changes)</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCAPItems.length > 0 ? (
            <CAPTable 
              items={capItems}
              onReview={handleReview}
              onSendReminder={handleSendReminder}
              isHistoryView={showHistory}
              originalItems={originalCapItems}
              isComparisonView={showComparisonView}
              onRevert={showComparisonView ? handleRevertToOriginal : undefined}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No corrective action plan items found for the selected company.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSubmitAllCap} size="lg" disabled={showHistory || showComparisonView}>
            Submit Complete CAP
          </Button>
        </CardFooter>
      </Card>

      <ReviewDialog
        item={selectedItem}
        open={reviewDialogOpen}
        canEdit={canEdit && !showHistory && !showComparisonView}
        onApprove={handleApprove}
        onReject={handleReject}
        onSaveChanges={handleSaveChanges}
        onOpenChange={setReviewDialogOpen}
        originalItems={originalCapItems}
      />
    </div>
  );
}

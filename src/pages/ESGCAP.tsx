
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { CAPItem, CAPStatus, CAPType, CAPPriority, CAPTable } from "@/components/esg-cap/CAPTable";
import { ReviewDialog } from "@/components/esg-cap/ReviewDialog";
import { FilterControls } from "@/components/esg-cap/FilterControls";
import { AlertsPanel } from "@/components/esg-cap/AlertsPanel";
import { AddCAPDialog } from "@/components/esg-cap/AddCAPDialog";
import { PageNavigation } from "@/components/PageNavigation";
import { portfolioCompanies } from "@/features/edit-portfolio-company/portfolioCompanies";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { useESGCAPAlerts } from "@/hooks/useESGCAPAlerts";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
      targetDate: "2025-08-10", // Approaching deadline (4 days)
      type: "CP",
      priority: "High",
      status: "Pending"
    },
    {
      id: "cap-2",
      companyId: 2,
      item: "Waste Management",
      actions: "Implement waste segregation and recycling program",
      responsibility: "Operations Team",
      deliverable: "Waste Management Reports",
      targetDate: "2025-08-09", // Approaching deadline (3 days)
      type: "CS",
      priority: "Medium",
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
      priority: "High",
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
      targetDate: "2025-08-02", // Overdue (4 days overdue)
      type: "CS",
      priority: "Low",
      status: "Delayed"
    },
    {
      id: "cap-5",
      companyId: 1,
      item: "Carbon Footprint Assessment",
      actions: "Conduct comprehensive carbon footprint assessment",
      responsibility: "Sustainability Team",
      deliverable: "Carbon Assessment Report",
      targetDate: "2025-08-12", // Approaching deadline (6 days)
      type: "CP",
      priority: "High",
      status: "Pending"
    },
    {
      id: "cap-6",
      companyId: 2,
      item: "Water Conservation Plan",
      actions: "Develop water conservation strategy and implementation plan",
      responsibility: "Facilities Management",
      deliverable: "Water Conservation Strategy",
      targetDate: "2025-08-01", // Overdue (5 days overdue)
      type: "CS",
      priority: "Medium",
      status: "In Progress"
    }
  ]);
  
  // Current working copy of CAP items - load from localStorage if available
  const loadCapItemsFromStorage = () => {
    try {
      const stored = localStorage.getItem('esg-cap-items');
      return stored ? JSON.parse(stored) : originalCapItems;
    } catch {
      return originalCapItems;
    }
  };
  
  const [capItems, setCapItems] = useState<CAPItem[]>(loadCapItemsFromStorage);
  const previousCapItemsRef = useRef<CAPItem[]>(originalCapItems);

  // Save to localStorage whenever capItems changes
  const saveToLocalStorage = (items: CAPItem[]) => {
    localStorage.setItem('esg-cap-items', JSON.stringify(items));
  };
  
  useEffect(() => {
    saveToLocalStorage(capItems);
  }, [capItems]);

  // Filter CAP items by selected company
  const filteredCAPItems = selectedCompany === "all"
    ? capItems
    : capItems.filter(item => item.companyId === parseInt(selectedCompany));

  // Filter previous items by selected company for proper alert comparison
  const filteredPreviousItems = selectedCompany === "all"
    ? previousCapItemsRef.current
    : previousCapItemsRef.current.filter(item => item.companyId === parseInt(selectedCompany));

  // Use alerts hook to monitor changes
  const alerts = useESGCAPAlerts(filteredCAPItems, filteredPreviousItems);

  const handleReview = (item: CAPItem) => {
    const currentItem = capItems.find(i => i.id === item.id);
    setSelectedItem(currentItem || null);
    setReviewDialogOpen(true);
    // Allow editing for all items except in comparison view
    setCanEdit(true);
  };

  // Added state for edit capability
  const [canEdit, setCanEdit] = useState(true);

  const handleApprove = async () => {
    if (selectedItem) {
      // Store previous state for alerts
      previousCapItemsRef.current = [...capItems];
      
      console.log('Approving item:', selectedItem.id, 'Current status:', selectedItem.status);
      
      const updatedItems = capItems.map(item => {
        if (item.id === selectedItem.id) {
          const updatedItem = { ...item, status: "Completed" as CAPStatus, actualDate: new Date().toISOString().split('T')[0] };
          console.log('Item updated to:', updatedItem);
          return updatedItem;
        }
        return item;
      });
      
      // TODO: Save to database here
      // const { error } = await supabase.from('cap_items').update({
      //   status: 'Completed',
      //   actual_date: new Date().toISOString().split('T')[0]
      // }).eq('id', selectedItem.id);
      
      setCapItems(updatedItems);
      saveToLocalStorage(updatedItems);
      console.log('Updated capItems state, alerts should recalculate');
    }
    toast({
      title: "Item Approved",
      description: `You've approved "${selectedItem?.item}"`,
    });
    setReviewDialogOpen(false);
  };

  const handleReject = async () => {
    if (selectedItem) {
      // Store previous state for alerts
      previousCapItemsRef.current = [...capItems];
      
      console.log('Rejecting item:', selectedItem.id, 'Current status:', selectedItem.status);
      
      const updatedItems = capItems.map(item => {
        if (item.id === selectedItem.id) {
          const updatedItem = { ...item, status: "Rejected" as CAPStatus };
          console.log('Item updated to:', updatedItem);
          return updatedItem;
        }
        return item;
      });
      
      // TODO: Save to database here
      // const { error } = await supabase.from('cap_items').update({
      //   status: 'Rejected'
      // }).eq('id', selectedItem.id);
      
      setCapItems(updatedItems);
      saveToLocalStorage(updatedItems);
      console.log('Updated capItems state, alerts should recalculate');
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
    // Store previous state for alerts
    previousCapItemsRef.current = [...capItems];
    
    const updatedItems = capItems.map(item => {
      if (item.id === updatedItem.id) {
        return updatedItem;
      }
      return item;
    });
    setCapItems(updatedItems);
    saveToLocalStorage(updatedItems);
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

  const toggleComparisonView = () => {
    setShowComparisonView(!showComparisonView);
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
      saveToLocalStorage(updatedItems);
      
      toast({
        title: "Item Reverted",
        description: `Item "${originalItem.item}" has been reverted to its original state.`,
      });
    }
  };

  // New function to handle reverting a specific field of an item
  const handleRevertField = (itemId: string, field: keyof CAPItem) => {
    const originalItem = originalCapItems.find(item => item.id === itemId);
    if (originalItem && field in originalItem) {
      const updatedItems = capItems.map(item => {
        if (item.id === itemId) {
          return { ...item, [field]: originalItem[field] };
        }
        return item;
      });
      setCapItems(updatedItems);
      saveToLocalStorage(updatedItems);
      
      toast({
        title: "Field Reverted",
        description: `Field "${field}" has been reverted to its original value.`,
      });
    }
  };

  const handleAddItem = (newItem: CAPItem) => {
    const updatedItems = [...capItems, newItem];
    setCapItems(updatedItems);
    saveToLocalStorage(updatedItems);
  };

  const handleAddMultipleItems = (newItems: CAPItem[]) => {
    const updatedItems = [...capItems, ...newItems];
    setCapItems(updatedItems);
    saveToLocalStorage(updatedItems);
  };

  // Scoring calculation logic
  const getPriorityWeight = (priority: CAPPriority): number => {
    switch (priority) {
      case "High": return 2;
      case "Medium": return 1;
      case "Low": return 0.5;
      default: return 1;
    }
  };

  const calculateProgress = () => {
    const totalItems = filteredCAPItems.length;
    if (totalItems === 0) return 0;

    // Calculate total possible weightage
    const totalWeightage = filteredCAPItems.reduce((sum, item) => {
      return sum + (100 / totalItems) * getPriorityWeight(item.priority);
    }, 0);

    // Calculate weightage of completed items
    const completedWeightage = filteredCAPItems
      .filter(item => item.status === "Completed")
      .reduce((sum, item) => {
        return sum + (100 / totalItems) * getPriorityWeight(item.priority);
      }, 0);

    return Math.round((completedWeightage / totalWeightage) * 100) || 0;
  };

  const progressPercentage = calculateProgress();

  return (
    <div className="space-y-6">
      <PageNavigation />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ESG Corrective Action Plan</h1>
          <p className="text-muted-foreground">
            Review and finalize the ESG Corrective Action Plan items
          </p>
        </div>
        <AddCAPDialog 
          onAddItem={handleAddItem}
          onAddMultipleItems={handleAddMultipleItems}
        />
      </div>

      <div className="flex items-center justify-between">
        <FilterControls 
          companies={portfolioCompanies}
          selectedCompany={selectedCompany}
          onCompanyChange={setSelectedCompany}
        />
        
        <div className="flex items-center gap-6">
          <Button 
            variant="outline" 
            onClick={toggleComparisonView}
            className={showComparisonView ? "border-purple-500 text-purple-500" : ""}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <ArrowRight className="h-4 w-4 mr-1" />
            {showComparisonView ? "Exit Comparison View" : "Compare Changes"}
          </Button>
        </div>
      </div>

      <AlertsPanel 
        overdueItems={alerts.overdueItems}
        approachingDeadlines={alerts.approachingDeadlines}
        onItemClick={handleReview}
      />

      <Card>
        <CardHeader>
          <CardTitle>Corrective Action Plan Items</CardTitle>
          <CardDescription>
            Review and approve items in the ESG Corrective Action Plan
            {showComparisonView && <span className="ml-2 text-purple-500 font-medium">(Comparing Changes)</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCAPItems.length > 0 ? (
            <CAPTable 
              items={filteredCAPItems}
              onReview={handleReview}
              onSendReminder={handleSendReminder}
              isComparisonView={showComparisonView}
              originalItems={originalCapItems}
              onRevert={handleRevertToOriginal}
              onRevertField={handleRevertField}
              progressPercentage={progressPercentage}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No corrective action plan items found for the selected company.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSubmitAllCap} size="lg" disabled={showComparisonView}>
            Submit Complete CAP
          </Button>
        </CardFooter>
      </Card>

      <ReviewDialog
        item={selectedItem}
        open={reviewDialogOpen}
        canEdit={canEdit && !showComparisonView}
        onApprove={handleApprove}
        onReject={handleReject}
        onSaveChanges={handleSaveChanges}
        onOpenChange={setReviewDialogOpen}
        originalItems={originalCapItems}
      />
    </div>
  );
}

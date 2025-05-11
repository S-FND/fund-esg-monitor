
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { CAPItem, CAPStatus, CAPType, CAPTable } from "@/components/esg-cap/CAPTable";
import { ReviewDialog } from "@/components/esg-cap/ReviewDialog";
import { FilterControls } from "@/components/esg-cap/FilterControls";
import { portfolioCompanies } from "@/features/edit-portfolio-company/portfolioCompanies";

export default function ESGCAP() {
  const [selectedItem, setSelectedItem] = useState<CAPItem | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");

  // Mock data for CAP items with company IDs
  const mockCAPItems: CAPItem[] = [
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
  ];

  // Filter CAP items by selected company
  const filteredCAPItems = selectedCompany === "all"
    ? mockCAPItems
    : mockCAPItems.filter(item => item.companyId === parseInt(selectedCompany));

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

      <FilterControls 
        companies={portfolioCompanies}
        selectedCompany={selectedCompany}
        onCompanyChange={setSelectedCompany}
      />

      <Card>
        <CardHeader>
          <CardTitle>Corrective Action Plan Items</CardTitle>
          <CardDescription>
            Review and approve items in the ESG Corrective Action Plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCAPItems.length > 0 ? (
            <CAPTable 
              items={filteredCAPItems}
              onReview={handleReview}
              onSendReminder={handleSendReminder}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No corrective action plan items found for the selected company.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ReviewDialog
        item={selectedItem}
        open={reviewDialogOpen}
        onApprove={handleApprove}
        onReject={handleReject}
        onOpenChange={setReviewDialogOpen}
      />
    </div>
  );
}

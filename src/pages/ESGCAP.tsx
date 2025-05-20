
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { CAPItem, CAPStatus, CAPType, CAPTable } from "@/components/esg-cap/CAPTable";
import { ReviewDialog } from "@/components/esg-cap/ReviewDialog";
import { FilterControls } from "@/components/esg-cap/FilterControls";
// import { portfolioCompanies } from "@/features/edit-portfolio-company/portfolioCompanies";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { http } from "@/utils/httpInterceptor";

export default function ESGCAP() {
  const [portfolioCompanies, setPortfolioCompanies] = useState([])
  const [selectedItem, setSelectedItem] = useState<CAPItem | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const { user, userRole } = useAuth();
  const [showComparisonView, setShowComparisonView] = useState(false);
  const [planData, setPlanData] = useState<{ entityId: string; plan: []; finalPlan: Boolean; }>()

  const [filteredCAPItems, setFilteredCAPItems] = useState([])
  const [finalPlan, setFinalPlan] = useState(false);

  // Mock data for CAP items with company IDs
  const [originalCapItems] = useState<CAPItem[]>([
    {
      id: "cap-1",
      companyId: 1,
      item: "Environmental Policy",
      measures: "Develop and implement a comprehensive environmental policy",
      resource: "Company ESG Manager",
      deliverable: "Environmental Policy Document",
      targetDate: "2025-06-30",
      CS: "CP",
      status: "Pending"
    },
    {
      id: "cap-2",
      companyId: 2,
      item: "Waste Management",
      measures: "Implement waste segregation and recycling program",
      resource: "Operations Team",
      deliverable: "Waste Management Reports",
      targetDate: "2025-05-15",
      CS: "CS",
      status: "In Progress"
    },
    {
      id: "cap-3",
      companyId: 1,
      item: "Energy Audit",
      measures: "Conduct energy audit and implement efficiency measures",
      resource: "External Consultant & Facilities",
      deliverable: "Energy Audit Report",
      targetDate: "2025-04-30",
      CS: "CP",
      actualDate: "2025-04-25",
      status: "Completed"
    },
    {
      id: "cap-4",
      companyId: 3,
      item: "Diversity Policy",
      measures: "Develop and implement diversity and inclusion policy",
      resource: "HR Department",
      deliverable: "D&I Policy Document",
      targetDate: "2025-03-15",
      CS: "CS",
      status: "Delayed"
    }
  ]);

  // Current working copy of CAP items
  const [capItems, setCapItems] = useState<CAPItem[]>([]);

  // Filter CAP items by selected company
  // const filteredCAPItems = selectedCompany === "all"
  //   ? mockCAPItems
  //   : mockCAPItems.filter(item => item.companyId === parseInt(selectedCompany));
  // setFilteredCAPItems(selectedCompany === "all"
  //   ? mockCAPItems
  //   : mockCAPItems.filter(item => item.companyId === parseInt(selectedCompany)))

  const handleReview = (item: CAPItem) => {
    const currentItem = capItems.find(i => i.id === item.id);
    setSelectedItem(currentItem || null);
    setReviewDialogOpen(true);
    // Always allow editing for items that are not completed
    const isCompleted = currentItem?.status === "Completed";
    setCanEdit(!isCompleted);
  };

  // Added state for edit capability
  const [canEdit, setCanEdit] = useState(true);

  const handleApprove = () => {
    if (selectedItem) {
      const updatedItems = capItems.map(item => {
        if (item.id === selectedItem.id) {
          return { ...item};
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
          return { ...item };
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

  const getCompanyInfoList = async () => {
    try {
      const res = await fetch(`https://preprod-api.fandoro.com` + `/investor/companyInfo`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        // toast.error("Invalid credentials");
        // setIsLoading(false);
        return;
      }
      else {
        const jsondata = await res.json();
        console.log('getCompanyInfoList ::jsondata', jsondata)
        setPortfolioCompanies(jsondata['data'])
      }
    } catch (error) {
      console.error("Api call:", error);
      // toast.error("API Call failed. Please try again.");
    } finally {
      // setIsLoading(false);
    }

  };

  const getPlanList = async (email) => {
    try {
      const res = await fetch(`https://preprod-api.fandoro.com` + `/investor/esgdd/escap/${email}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        // toast.error("Invalid credentials");
        // setIsLoading(false);
        return;
      }
      else {
        const jsondata = await res.json();
        setPlanData(jsondata)
        setFilteredCAPItems(jsondata['plan'])
        setCapItems(jsondata['plan'])
        setFinalPlan(jsondata['finalPlan'])

      }
    } catch (error) {
      console.error("Api call:", error);
      // toast.error("API Call failed. Please try again.");
    } finally {
      // setIsLoading(false);
    }

  };

  useEffect(() => {
    getCompanyInfoList()
  }, [])

  useEffect(() => {
    if (selectedCompany !== 'all') {
      getPlanList(selectedCompany)
    }
  }, [selectedCompany])
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

  const handleSubmitAllCap = async () => {
    try {
      //esgdd/escap/change-request
      let payload = {
        changeRequest: { plan: capItems },
        comment: 'Change Request',
        entityId: planData?.entityId
      }
      console.log('payload', payload)
      let response = await http.post('esgdd/escap/change-request', payload)
      if (response.data) {
        toast({
          title: "CAP Submitted",
          description: "All CAP items have been submitted successfully.",
        });
        // Here you would typically send the data to a backend API
        console.log("Submitting CAP items:", filteredCAPItems);
        console.log("Submitting CAP items ::  capItems :", capItems);
      }
    } catch (error) {

    }


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

      toast({
        title: "Field Reverted",
        description: `Field "${field}" has been reverted to its original value.`,
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

        {!finalPlan && <div className="flex items-center gap-6">
          <Button
            variant="outline"
            onClick={toggleComparisonView}
            className={showComparisonView ? "border-purple-500 text-purple-500" : ""}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <ArrowRight className="h-4 w-4 mr-1" />
            {showComparisonView ? "Exit Comparison View" : "Compare Changes"}
          </Button>
        </div>}
      </div>

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
              items={capItems}
              onReview={handleReview}
              onSendReminder={handleSendReminder}
              isComparisonView={showComparisonView}
              originalItems={originalCapItems}
              onRevert={handleRevertToOriginal}
              onRevertField={handleRevertField}
              finalPlan={finalPlan}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No corrective action plan items found for the selected company.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          {!finalPlan && <Button onClick={handleSubmitAllCap} style={{"marginRight":"2px"}} size="lg" disabled={showComparisonView}>
            Request CAP Change
          </Button>}
          {!finalPlan && <Button onClick={handleSubmitAllCap}  size="lg" disabled={showComparisonView}>
            Accept CAP 
          </Button>}
          {finalPlan && <mark>Plan already accepted</mark>}
        </CardFooter>
      </Card>

      <ReviewDialog
        item={selectedItem}
        open={reviewDialogOpen}
        canEdit={!finalPlan &&  canEdit && !showComparisonView}
        onApprove={handleApprove}
        onReject={handleReject}
        onSaveChanges={handleSaveChanges}
        onOpenChange={setReviewDialogOpen}
        finalPlan={finalPlan}
        originalItems={originalCapItems}
      />
    </div>
  );
}

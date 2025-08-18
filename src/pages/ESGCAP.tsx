import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { CAPItem, CAPStatus, CAPType, CAPPriority, CAPTable } from "@/components/esg-cap/CAPTable";
import { ComparePlan, ReviewDialog } from "@/components/esg-cap/ReviewDialog";
import { FilterControls } from "@/components/esg-cap/FilterControls";
import { AlertsPanel } from "@/components/esg-cap/AlertsPanel";
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
import { useESGCAPAlerts } from "@/hooks/useESGCAPAlerts";

interface PlanHistory {
  updateByUserId: string;
  status: string;
  requestPlan: CAPItem[];
  createdAt: number;
  userData: {
    name: string;
    email: string;
  };
}

interface APIResponse {
  status: boolean;
  plan: CAPItem[];
  planHistoryDetails: PlanHistory[];
  entityId: string;
  finalPlan: boolean;
}

export default function ESGCAP() {
  const [portfolioCompanies, setPortfolioCompanies] = useState([]);
  const [selectedItem, setSelectedItem] = useState<CAPItem | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const { user, userRole } = useAuth();
  const [showComparisonView, setShowComparisonView] = useState(false);
  const [planData, setPlanData] = useState<APIResponse | null>(null);
  const [filteredCAPItems, setFilteredCAPItems] = useState<CAPItem[]>([]);
  const [capItems, setCapItems] = useState<CAPItem[]>([]);
  const [finalPlan, setFinalPlan] = useState(false);
  const [comparePlanData, setComparePlanData] = useState<ComparePlan | null>(null);
  const previousCapItemsRef = useRef<CAPItem[]>([]);
  const [canEdit, setCanEdit] = useState(true);

  // Use alerts hook to monitor changes
  const alerts = useESGCAPAlerts(filteredCAPItems, previousCapItemsRef.current);

  const handleReview = (item: CAPItem) => {
    const currentItem = capItems.find(i => i.id === item.id);
    setSelectedItem(currentItem || null);
    setReviewDialogOpen(true);
    setCanEdit(true);
  };

  const handleApprove = () => {
    if (selectedItem) {
      previousCapItemsRef.current = [...capItems];
      
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
      previousCapItemsRef.current = [...capItems];
      
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

  const getCompanyInfoList = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/investor/companyInfo`, {
        method: "GET",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${localStorage.getItem("auth_token")}` 
        },
      });
      if (!res.ok) return;
      const jsondata = await res.json();
      setPortfolioCompanies(jsondata.data || []);
    } catch (error) {
      console.error("Api call:", error);
    }
  };

  const getPlanList = async (email: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/investor/esgdd/escap/${email}`, {
        method: "GET",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${localStorage.getItem("auth_token")}` 
        },
      });
      
      if (!res.ok) {
        setFilteredCAPItems([]);
        setCapItems([]);
        setPlanData(null);
        setComparePlanData(null);
        toast({
          title: "No Reports Found",
          description: "No reports were found matching your criteria.",
        });
        return;
      }
      
      const jsondata: APIResponse = await res.json();
      console.log("API Response:", jsondata);
      
      setPlanData(jsondata);
      setFilteredCAPItems(jsondata.plan || []);
      setCapItems(jsondata.plan || []);
      setFinalPlan(jsondata.finalPlan || false);
      
      // Initialize comparison data from plan history
      const latestHistory = jsondata.planHistoryDetails?.[0];
      setComparePlanData({
        founderPlan: latestHistory?.requestPlan || [],
        investorPlan: jsondata.plan || [],
        founderPlanLastUpdate: latestHistory?.createdAt || 0,
        investorPlanLastUpdate: Date.now()
      });
      
      previousCapItemsRef.current = jsondata.plan || [];
      
      toast({
        title: "Loaded!",
        description: "ESG Reports successfully fetched.",
      });
    } catch (error) {
      console.error("Api call:", error);
      setFilteredCAPItems([]);
      setCapItems([]);
      setPlanData(null);
      setComparePlanData(null);
    }
  };

  const handleSaveChanges = (updatedItem: CAPItem) => {
    previousCapItemsRef.current = [...capItems];
    
    const updatedItems = capItems.map(item => {
      if (item.id === updatedItem.id) {
        return { ...updatedItem, changeStatus: 'Edited' };
      }
      return item;
    });
    setCapItems(updatedItems);
    setSelectedItem(updatedItem);
    setReviewDialogOpen(false);
  };

  const isAcceptVisible = (): boolean => {
    if (!comparePlanData || !comparePlanData.founderPlanLastUpdate) {
      return false;
    }
    return comparePlanData.founderPlanLastUpdate > comparePlanData.investorPlanLastUpdate;
  };

  const handleSubmitAllCap = async () => {
    try {
      const payload = {
        changeRequest: { plan: capItems },
        comment: 'Change Request',
        entityId: planData?.entityId
      };
      const response = await http.post('esgdd/escap/change-request', payload);
      if (response.data) {
        toast({
          title: "CAP Submitted",
          description: "All CAP items have been submitted successfully.",
        });
        // Refresh the data after submission
        if (selectedCompany !== 'all') {
          getPlanList(selectedCompany);
        }
      }
    } catch (error) {
      console.error("Error submitting CAP:", error);
      toast({
        title: "Error",
        description: "Failed to submit CAP changes.",
        variant: "destructive",
      });
    }
  };

  const toggleComparisonView = () => {
    setShowComparisonView(!showComparisonView);
  };

  const handleRevertToOriginal = (itemId: string) => {
    const originalItem = previousCapItemsRef.current.find(item => item.id === itemId);
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

  const handleRevertField = (itemId: string, field: keyof CAPItem) => {
    const originalItem = previousCapItemsRef.current.find(item => item.id === itemId);
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

  const handleAcceptCap = async () => {
    if (!comparePlanData || !planData) return;

    if (comparePlanData.investorPlanLastUpdate > comparePlanData.founderPlanLastUpdate) {
      toast({
        title: "Cannot Accept",
        description: "You must wait for founder to accept your changes first",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await http.post('esgdd/escap/accept', { 
        entityId: planData.entityId 
      });
      
      if (response.data) {
        toast({
          title: "CAP Accepted",
          description: "The corrective action plan has been accepted.",
        });
        // Refresh the data
        if (selectedCompany !== 'all') {
          getPlanList(selectedCompany);
        }
      }
    } catch (error) {
      console.error("Error accepting CAP:", error);
      toast({
        title: "Error",
        description: "Failed to accept CAP.",
        variant: "destructive",
      });
    }
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

    const totalWeightage = filteredCAPItems.reduce((sum, item) => {
      return sum + (100 / totalItems) * getPriorityWeight(item.priority || "Medium");
    }, 0);

    const completedWeightage = filteredCAPItems
      .filter(item => item.status === "Completed")
      .reduce((sum, item) => {
        return sum + (100 / totalItems) * getPriorityWeight(item.priority || "Medium");
      }, 0);

    return Math.round((completedWeightage / totalWeightage) * 100) || 0;
  };

  const progressPercentage = calculateProgress();

  useEffect(() => {
    getCompanyInfoList();
  }, []);

  useEffect(() => {
    if (selectedCompany !== 'all') {
      getPlanList(selectedCompany);
    }
  }, [selectedCompany]);

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

        {!finalPlan && filteredCAPItems.length > 0 && (
          <div className="flex items-center gap-6">
            <Button
              variant="outline"
              onClick={toggleComparisonView}
              disabled={!comparePlanData?.founderPlan?.length}
              className={showComparisonView ? "border-purple-500 text-purple-500" : ""}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <ArrowRight className="h-4 w-4 mr-1" />
              {showComparisonView ? "Exit Comparison View" : "Compare Changes"}
              {!comparePlanData?.founderPlan?.length && (
                <span className="ml-2 text-xs text-muted-foreground">(No changes to compare)</span>
              )}
            </Button>
          </div>
        )}
      </div>

      {filteredCAPItems.length > 0 && (
        <>
          <AlertsPanel 
            overdueItems={alerts.overdueItems}
            approachingDeadlines={alerts.approachingDeadlines}
            onItemClick={handleReview}
          />

          <Card>
            <CardHeader>
              <CardTitle>Corrective Action Plan Items {!finalPlan && <span>(In Approval Phase)</span>} {finalPlan && <span>(Final)</span>}</CardTitle>
              <CardDescription>
                Review and approve items in the ESG Corrective Action Plan
                {showComparisonView && <span className="ml-2 text-purple-500 font-medium">(Comparing Changes)</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showComparisonView && comparePlanData ? (
                <CAPTable
                  items={comparePlanData.founderPlan}
                  onReview={handleReview}
                  onSendReminder={handleSendReminder}
                  isComparisonView={true}
                  originalItems={comparePlanData.investorPlan}
                  onRevert={handleRevertToOriginal}
                  onRevertField={handleRevertField}
                  finalPlan={finalPlan}
                  showChangeStatus={true}
                  progressPercentage={progressPercentage}
                />
              ) : (
                <CAPTable
                  items={capItems}
                  onReview={handleReview}
                  onSendReminder={handleSendReminder}
                  isComparisonView={false}
                  originalItems={previousCapItemsRef.current}
                  onRevert={handleRevertToOriginal}
                  onRevertField={handleRevertField}
                  finalPlan={finalPlan}
                  showChangeStatus={false}
                  progressPercentage={progressPercentage}
                />
              )}
            </CardContent>
            {filteredCAPItems.length > 0 && (
              <CardFooter className="flex justify-end gap-4">
                {!finalPlan && (
                  <>
                    <Button 
                      onClick={handleSubmitAllCap} 
                      size="lg" 
                      disabled={showComparisonView}
                    >
                      Request CAP Change
                    </Button>
                    <Button 
                      onClick={handleAcceptCap} 
                      size="lg" 
                      disabled={showComparisonView || !isAcceptVisible()}
                    >
                      Accept CAP
                    </Button>
                  </>
                )}
                {finalPlan && (
                  <div className="text-sm text-muted-foreground">
                    Plan has been finalized and accepted
                  </div>
                )}
              </CardFooter>
            )}
          </Card>
        </>
      )}

      <ReviewDialog
        item={selectedItem}
        open={reviewDialogOpen}
        canEdit={canEdit && !showComparisonView}
        onApprove={handleApprove}
        onReject={handleReject}
        onSetEdit={() => setCanEdit(true)}
        onCancelEdit={() => setCanEdit(false)}
        onSaveChanges={handleSaveChanges}
        onOpenChange={setReviewDialogOpen}
        finalPlan={finalPlan}
        originalItems={previousCapItemsRef.current}
        comparePlanData={comparePlanData}
      />
    </div>
  );
}
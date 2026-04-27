import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ESGCapItem, CAPStatus, CAPType, CAPPriority, CAPTable } from "@/components/esg-cap/CAPTable";
import { ComparePlan, ReviewDialog } from "@/components/esg-cap/ReviewDialog";
import { FilterControls } from "@/components/esg-cap/FilterControls";
import { AlertsPanel } from "@/components/esg-cap/AlertsPanel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown,
  FileText,
  CheckCircle2,
  Clock,
  Target
} from "lucide-react";
import { http } from "@/utils/httpInterceptor";
import { useESGCAPAlerts } from "@/hooks/useESGCAPAlerts";
import { AddCAPDialog } from "@/components/esg-cap/AddCAPDialog";
import { EsgddAPIs } from "@/network/esgdd";

interface PlanHistory {
  updateByUserId: string;
  status: string;
  requestPlan: ESGCapItem[];
  createdAt: number;
  userData: {
    name: string;
    email: string;
  };
}

interface finalAcceptance {
  founderAcceptance: boolean;
  investorAcceptance: boolean;
}
interface APIResponse {
  status: boolean;
  plan: ESGCapItem[];
  planHistoryDetails: PlanHistory[];
  entityId: string;
  finalPlan: boolean;
  finalAcceptance?: finalAcceptance;
  founderPlanFinalStatus: boolean;
  investorPlanFinalStatus: boolean;
}

export default function ESGCAP() {
  const [portfolioCompanies, setPortfolioCompanies] = useState([]);
  const [selectedItem, setSelectedItem] = useState<ESGCapItem | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const { user, userRole } = useAuth();
  const [showComparisonView, setShowComparisonView] = useState(false);
  const [planData, setPlanData] = useState<APIResponse | null>(null);
  const [filteredCAPItems, setFilteredCAPItems] = useState<ESGCapItem[]>([]);
  const [capItems, setCapItems] = useState<ESGCapItem[]>([]);
  const [comparePlanData, setComparePlanData] = useState<ComparePlan | null>(null);
  const previousCapItemsRef = useRef<ESGCapItem[]>([]);
  const [canEdit, setCanEdit] = useState(true);

  const alerts = useESGCAPAlerts(filteredCAPItems, previousCapItemsRef.current);

  const [financialYear, setFinancialYear] = useState("");

  useEffect(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const aprilFirstCurrentYear = new Date(currentYear, 3, 1);

    const financialYear =
      currentDate < aprilFirstCurrentYear
        ? `${currentYear - 1}-${currentYear.toString().slice(-2)}`
        : `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

    setFinancialYear(financialYear);
  }, []);

  // Calculate stats
  const totalItems = filteredCAPItems.length;
  const completedItems = filteredCAPItems.filter(i => i.status === 'completed').length;
  const pendingItems = filteredCAPItems.filter(i => i.status === 'pending').length;
  const inProgressItems = filteredCAPItems.filter(i => i.status === 'in_progress').length;

  const handleReview = (item: ESGCapItem) => {
    const currentItem = capItems.find(i => i.id === item.id);
    if (currentItem) {
      const clonedItem = JSON.parse(JSON.stringify(currentItem));
      setSelectedItem(clonedItem);
      setReviewDialogOpen(true);
      setCanEdit(true);
    }
  };

  const handleApprove = () => {
    if (selectedItem) {
      previousCapItemsRef.current = [...capItems];

      const updatedItems = capItems.map(item => {
        if (item.id === selectedItem.id) {
          return { ...item, status: "completed" as CAPStatus, actualCompletionDate: new Date().toISOString() };
        }
        return item;
      });
      setCapItems(updatedItems);
      setFilteredCAPItems(updatedItems);
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
          return { ...item, status: "rejected" as CAPStatus };
        }
        return item;
      });
      setCapItems(updatedItems);
      setFilteredCAPItems(updatedItems);
    }
    toast({
      title: "Item Rejected",
      description: `You've rejected "${selectedItem?.item}"`,
    });
    setReviewDialogOpen(false);
  };

  const handleSendReminder = async (item: ESGCapItem) => {
    try {
      const payload = {
        reportId: item.reportId,
        itemId: item.id,
        itemName: item.item,
        assignedTo: item.assignedTo,
        targetDate: item.targetDate
      };
  
      const [res, error] = await EsgddAPIs.sendReminder(payload);
  
      if (res) {
        toast({
          title: "Reminder Sent",
          description: "Email reminder sent successfully.",
        });
      } else {
        throw new Error(error || "Failed to send reminder");
      }
  
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to send reminder email.",
        variant: "destructive",
      });
    }
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

  const getPlanList = async (entityId: string) => {
    try {
      const entityIdWithYear = `${entityId}?financialYear=${financialYear}`;
      const [data, error] = await EsgddAPIs.getEsgCapPlan({
        entityId: entityIdWithYear,
      });
      if (data) {
        setPlanData(data);
        setFilteredCAPItems(data.plan || []);
        setCapItems(data.plan || []);
        const latestHistory = data.planHistoryDetails?.[1];
        setComparePlanData({
          founderPlan: latestHistory?.requestPlan || [],
          investorPlan: data.plan || [],
          founderPlanLastUpdate: latestHistory?.createdAt || 0,
          investorPlanLastUpdate: Date.now()
        });

        previousCapItemsRef.current = data.plan || [];
      } else {
        console.error("Error:", error);
        setPlanData(null);
        setFilteredCAPItems([]);
        setCapItems([]);
        setComparePlanData({
          founderPlan: [],
          investorPlan: [],
          founderPlanLastUpdate: 0,
          investorPlanLastUpdate: 0,
        });
        previousCapItemsRef.current = [];
      }
    } catch (error) {
      console.error("Api call error:", error);
    }
  };

  useEffect(() => {
    if (selectedCompany !== 'all') {
      const company = portfolioCompanies.find(c => c.email === selectedCompany);
      const entityId = company?.user?.entityId;
      if (entityId) {
        getPlanList(entityId);
      }
    }
  }, [selectedCompany, portfolioCompanies]);

  const handleSaveChanges = (updatedItem: ESGCapItem) => {
    previousCapItemsRef.current = [...capItems];

    const updatedItems = capItems.map(item => {
      if (item.id === updatedItem.id) {
        return { ...updatedItem, changeStatus: 'Edited' };
      }
      return item;
    });
    setCapItems(updatedItems);
    setFilteredCAPItems(updatedItems);
    setSelectedItem({ ...updatedItem });
    setReviewDialogOpen(false);
  };

  const isPlanFinalized = planData ?
    (planData.finalPlan || (planData.founderPlanFinalStatus && planData.investorPlanFinalStatus)) :
    false;

  const handleSubmitAllCap = async () => {
    try {
      // console.log('planData planData', planData);
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

        getPlanList(planData?.entityId);
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
    if (showComparisonView) {
      setShowComparisonView(false);
    } else if (comparePlanData?.founderPlan?.length) {
      setShowComparisonView(true);
    } else {
      toast({
        title: "No changes to compare",
        description: "There are no previous versions to compare with.",
      });
    }
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
      setFilteredCAPItems(updatedItems);
      toast({
        title: "Item Reverted",
        description: `Item "${originalItem.item}" has been reverted to its original state.`,
      });
    }
  };

  const handleRevertField = (itemId: string, field: keyof ESGCapItem) => {
    const originalItem = previousCapItemsRef.current.find(item => item.id === itemId);
    if (originalItem && field in originalItem) {
      const updatedItems = capItems.map(item => {
        if (item.id === itemId) {
          return { ...item, [field]: originalItem[field] };
        }
        return item;
      });
      setCapItems(updatedItems);
      setFilteredCAPItems(updatedItems);
      toast({
        title: "Field Reverted",
        description: `Field "${field}" has been reverted to its original value.`,
      });
    }
  };

  const handleAcceptCap = async () => {
    if (!planData) return;

    const isInvestor = user?.entityType === 1;
    const isFounder = user?.entityType === 2;

    try {
      const updatedFinalAcceptance = {
        founderAcceptance: planData.finalAcceptance?.founderAcceptance || false,
        investorAcceptance: planData.finalAcceptance?.investorAcceptance || false,
        ...(isFounder && { founderAcceptance: true }),
        ...(isInvestor && { investorAcceptance: true }),
      };

      const bothAccepted =
        updatedFinalAcceptance.founderAcceptance &&
        updatedFinalAcceptance.investorAcceptance;

      const payload = {
        entityId: planData.entityId,
        plan: planData.plan || [],
        finalAcceptance: updatedFinalAcceptance,
        ...(isFounder && { founderPlanFinalStatus: true }),
        ...(isInvestor && { investorPlanFinalStatus: true }),
        finalPlan: bothAccepted,
      };

      const [result, error] = await EsgddAPIs.esgddAcceptPlan(payload);

      if (result?.data) {
        const userType = isInvestor ? "Investor" : "Founder";
        const message = bothAccepted
          ? `${userType} has accepted. CAP is now finalized!`
          : `${userType} has successfully accepted the CAP.`;

        toast({
          title: "CAP Accepted",
          description: message,
        });

        if (selectedCompany !== "all") {
          await getPlanList(selectedCompany);
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
      .filter(item => item.status === "completed")
      .reduce((sum, item) => {
        return sum + (100 / totalItems) * getPriorityWeight(item.priority || "Medium");
      }, 0);

    return Math.round((completedWeightage / totalWeightage) * 100) || 0;
  };

  const progressPercentage = calculateProgress();

  useEffect(() => {
    getCompanyInfoList();
  }, []);

  const handleAddItem = (newItem: ESGCapItem) => {
    const itemWithId = newItem.id ? newItem : { ...newItem, id: (capItems.length + 1).toString() };
    const updatedItems = [...capItems, itemWithId];
    setCapItems(updatedItems);
    setFilteredCAPItems(updatedItems);
    saveToLocalStorage(updatedItems);
  };

  const handleAddMultipleItems = (newItems: ESGCapItem[]) => {
    const itemsWithIds = newItems.map((item, index) =>
      item.id ? item : { ...item, id: (capItems.length + index + 1).toString() }
    );
    const updatedItems = [...capItems, ...itemsWithIds];
    setCapItems(updatedItems);
    setFilteredCAPItems(updatedItems);
    saveToLocalStorage(updatedItems);
  };

  const saveToLocalStorage = (items: ESGCapItem[]) => {
    localStorage.setItem('esg-cap-items', JSON.stringify(items));
  };

  useEffect(() => {
    saveToLocalStorage(capItems);
  }, [capItems]);

  const canAccept = (): boolean => {
    if (!planData) return false;

    const isInvestor = user?.entityType === 1;
    const isFounder = user?.entityType === 2;

    if (planData.finalPlan) return false;

    if (isFounder) {
      return !planData.founderPlanFinalStatus;
    }

    if (isInvestor) {
      return planData.founderPlanFinalStatus && !planData.investorPlanFinalStatus;
    }

    return false;
  };

  return (
    <div className="space-y-6">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-100">Total Items</p>
                <p className="text-lg font-bold">{totalItems}</p>
              </div>
              <FileText className="h-4 w-4 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-100">Completed</p>
                <p className="text-lg font-bold">{completedItems}</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-yellow-100">Pending</p>
                <p className="text-lg font-bold">{pendingItems}</p>
              </div>
              <Clock className="h-4 w-4 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-100">In Progress</p>
                <p className="text-lg font-bold">{inProgressItems}</p>
              </div>
              <Target className="h-4 w-4 text-white/80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <FilterControls
          companies={portfolioCompanies}
          selectedCompany={selectedCompany}
          onCompanyChange={setSelectedCompany}
        />

        {!isPlanFinalized && filteredCAPItems.length > 0 && (
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
              <CardTitle>
                Corrective Action Plan Items
                {!isPlanFinalized && <span className="ml-2 text-yellow-600">(In Approval Phase)</span>}
                {isPlanFinalized && <span className="ml-2 text-green-600">(Final)</span>}
              </CardTitle>
              <CardDescription>
                Review and approve items in the ESG Corrective Action Plan
                {showComparisonView && <span className="ml-2 text-purple-500 font-medium">(Comparing Changes)</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showComparisonView && comparePlanData ? (
                <div className="relative">
                  <CAPTable
                    items={comparePlanData.founderPlan}
                    originalItems={comparePlanData.investorPlan}
                    onReview={handleReview}
                    onSendReminder={handleSendReminder}
                    isComparisonView={true}
                    onRevert={handleRevertToOriginal}
                    onRevertField={handleRevertField}
                    finalPlan={isPlanFinalized}
                    progressPercentage={progressPercentage}
                  />
                </div>
              ) : (
                <CAPTable
                  items={capItems}
                  originalItems={previousCapItemsRef.current}
                  onReview={handleReview}
                  onSendReminder={handleSendReminder}
                  isComparisonView={false}
                  onRevert={handleRevertToOriginal}
                  onRevertField={handleRevertField}
                  finalPlan={isPlanFinalized}
                  progressPercentage={progressPercentage}
                />
              )}
            </CardContent>
            {filteredCAPItems.length > 0 && (
              <CardFooter className="flex justify-end gap-4">
                {!isPlanFinalized && (
                  <>
                    <Button
                      onClick={handleSubmitAllCap}
                      size="lg"
                      disabled={isPlanFinalized}
                    >
                      Request CAP Change
                    </Button>
                    <Button
                      onClick={handleAcceptCap}
                      size="lg"
                    >
                      {planData?.investorPlanFinalStatus || planData?.founderPlanFinalStatus
                        ? "Accept CAP"
                        : "Accept CAP"}
                    </Button>
                  </>
                )}
                {isPlanFinalized && (
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
        finalPlan={isPlanFinalized}
        originalItems={previousCapItemsRef.current}
        comparePlanData={comparePlanData}
      />
    </div>
  );
}
import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { CAPItem, CAPStatus, CAPType, CAPPriority } from "@/components/esg-cap/CAPTable";
import { ComparePlan, ReviewDialog } from "@/components/esg-cap/ReviewDialog";
import { FilterControls } from "@/components/esg-cap/FilterControls";
import { AlertsPanel } from "@/components/esg-cap/AlertsPanel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ArrowRight } from "lucide-react";
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

const HighlightDiff = ({ current, original }: { current: string, original?: string }) => {
  if (!original || current === original) {
    return <span>{current}</span>;
  }

  return (
    <span className="relative group">
      <span className="text-green-600 bg-green-50 px-1 rounded">{current}</span>
      <span className="absolute hidden group-hover:block -bottom-6 left-0 text-xs text-red-600 line-through bg-red-50 px-1 rounded">
        {original}
      </span>
    </span>
  );
};

const CAPTable = ({
  items,
  originalItems,
  onReview,
  onSendReminder,
  isComparisonView,
  onRevert,
  onRevertField,
  finalPlan,
  progressPercentage
}: {
  items: CAPItem[];
  originalItems: CAPItem[];
  onReview: (item: CAPItem) => void;
  onSendReminder: (item: CAPItem) => void;
  isComparisonView: boolean;
  onRevert: (itemId: string) => void;
  onRevertField: (itemId: string, field: keyof CAPItem) => void;
  finalPlan: boolean;
  progressPercentage: number;
}) => {
  const getChangedFields = useCallback((currentItem: CAPItem, originalItem?: CAPItem) => {
    if (!originalItem) return {};
    
    const changes: Record<string, boolean> = {};
    (Object.keys(currentItem) as Array<keyof CAPItem>).forEach((key) => {
      changes[key] = JSON.stringify(currentItem[key]) !== JSON.stringify(originalItem[key]);
    });
    return changes;
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left">Item</th>
            <th className="p-3 text-left">Measures</th>
            <th className="p-3 text-left">Resource</th>
            <th className="p-3 text-left">Status</th>
            {isComparisonView && <th className="p-3 text-left">Changes</th>}
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const originalItem = originalItems.find(i => i.id === item.id);
            const changedFields = getChangedFields(item, originalItem);
            const hasChanges = isComparisonView && Object.values(changedFields).some(Boolean);

            return (
              <tr 
                key={item.id} 
                className={`border-t ${hasChanges ? "bg-yellow-50" : ""}`}
              >
                <td className={`p-3 ${changedFields.item ? "border-l-4 border-yellow-500" : ""}`}>
                  <HighlightDiff current={item.item} original={originalItem?.item} />
                </td>
                <td className={`p-3 ${changedFields.measures ? "border-l-4 border-yellow-500" : ""}`}>
                  <HighlightDiff current={item.measures} original={originalItem?.measures} />
                </td>
                <td className={`p-3 ${changedFields.resource ? "border-l-4 border-yellow-500" : ""}`}>
                  <HighlightDiff current={item.resource} original={originalItem?.resource} />
                </td>
                <td className={`p-3 ${changedFields.status ? "border-l-4 border-yellow-500" : ""}`}>
                  <HighlightDiff 
                    current={item.status} 
                    original={originalItem?.status} 
                  />
                </td>
                {isComparisonView && (
                  <td className="p-3">
                    {hasChanges ? (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(changedFields).map(([field, hasChanged]) => (
                          hasChanged && (
                            <button
                              key={field}
                              onClick={() => onRevertField(item.id, field as keyof CAPItem)}
                              className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                              title={`Revert ${field} to original`}
                            >
                              {field}
                            </button>
                          )
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No changes</span>
                    )}
                  </td>
                )}
                <td className="p-3 space-x-2">
                  <Button 
                    size="sm" 
                    onClick={() => onReview(item)}
                    disabled={finalPlan}
                  >
                    Review
                  </Button>
                  {isComparisonView && hasChanges && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRevert(item.id)}
                    >
                      Revert All
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {progressPercentage > 0 && (
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-600 h-2.5 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

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
      
      setPlanData(jsondata);
      setFilteredCAPItems(jsondata.plan || []);
      setCapItems(jsondata.plan || []);
      setFinalPlan(jsondata.finalPlan || false);
      
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
                <div className="relative">
                  <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                    Comparing with previous version
                  </div>
                  <CAPTable
                    items={comparePlanData.founderPlan}
                    originalItems={comparePlanData.investorPlan}
                    onReview={handleReview}
                    onSendReminder={handleSendReminder}
                    isComparisonView={true}
                    onRevert={handleRevertToOriginal}
                    onRevertField={handleRevertField}
                    finalPlan={finalPlan}
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
                  finalPlan={finalPlan}
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
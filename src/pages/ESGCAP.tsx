import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ESGCapItem, CAPStatus, CAPType, CAPPriority } from "@/components/esg-cap/CAPTable";
import { ComparePlan, ReviewDialog } from "@/components/esg-cap/ReviewDialog";
import { FilterControls } from "@/components/esg-cap/FilterControls";
import { AlertsPanel } from "@/components/esg-cap/AlertsPanel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
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

const HighlightDiff = ({ current, original }: { current: string, original?: string }) => {
  if (!original || current === original) {
    return <span>{current}</span>;
  }
console.log('current',current,'original',original);
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
  items: ESGCapItem[];
  originalItems: ESGCapItem[];
  onReview: (item: ESGCapItem) => void;
  onSendReminder: (item: ESGCapItem) => void;
  isComparisonView: boolean;
  onRevert: (itemId: string) => void;
  onRevertField: (itemId: string, field: keyof ESGCapItem) => void;
  finalPlan: boolean;
  progressPercentage: number;
}) => {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ESGCapItem;
    direction: 'asc' | 'desc';
  } | null>(null);
  const requestSort = (key: keyof ESGCapItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedItems = useMemo(() => {
    if (!sortConfig) return items;
    return [...items].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // For dates
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const dateA = new Date(aValue);
        const dateB = new Date(bValue);
        return sortConfig.direction === 'asc'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      }

      return 0;
    });
  }, [items, sortConfig]);

  const getChangedFields = useCallback((currentItem: ESGCapItem, originalItem?: ESGCapItem) => {
    if (!originalItem) return {};

    const changes: Record<string, boolean> = {};
    (Object.keys(currentItem) as Array<keyof ESGCapItem>).forEach((key) => {
      changes[key] = JSON.stringify(currentItem[key]) !== JSON.stringify(originalItem[key]);
    });
    return changes;
  }, []);

  const SortableHeader = ({
    field,
    title
  }: {
    field: keyof ESGCapItem;
    title: string;
  }) => (
    <th
      className="p-3 text-left cursor-pointer hover:bg-muted/50"
      onClick={() => requestSort(field)}
    >
      {title}
      {sortConfig?.key === field && (
        sortConfig.direction === 'asc' ?
          <ArrowUp className="h-4 w-4 inline ml-1" /> :
          <ArrowDown className="h-4 w-4 inline ml-1" />
      )}
    </th>
  );

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left w-[60px]">S. No</th>
            <SortableHeader field="item" title="Item" />
            <th className="p-3 text-left">Category</th>
            <SortableHeader field="priority" title="Priority" />
            <th className="p-3 text-left">Measures and/or Corrective Actions</th>
            <th className="p-3 text-left">Resource & Responsibility</th>
            {/* <th className="p-3 text-left">Expected Deliverable</th> */}
            <SortableHeader field="deadline" title="Target Date" />
            <th className="p-3 text-left">CP/CS</th>
            <th className="p-3 text-left">Actual Date</th>
            <th className="p-3 text-left">Status</th>
            {isComparisonView && <th className="p-3 text-left">Changes</th>}
            <th className="p-3 text-left">Actions</th>
            <th className="p-3 text-left">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item, index) => {
            const originalItem = originalItems.find(i => i.id === item.id);
            const changedFields = getChangedFields(item, originalItem);
            const hasChanges = isComparisonView && Object.values(changedFields).some(Boolean);
console.log(item,'item_________originalItem',originalItem);
            return (
              <tr
                key={item.id}
                className={`border-t ${hasChanges ? "bg-yellow-50" : ""}`}
              >
                <td className="p-3 text-center">{index + 1}</td>

                <td className={`p-3 ${changedFields.item ? "border-l-4 border-yellow-500" : ""}`}>
                  <HighlightDiff current={item.item} original={originalItem?.item} />
                </td>

                <td className={`p-3 ${changedFields.category ? "border-l-4 border-yellow-500" : ""}`}>
                  <HighlightDiff current={item.category || ''} original={originalItem?.category} />
                </td>

                <td className={`p-3 ${changedFields.priority ? "border-l-4 border-yellow-500" : ""}`}>
                  <HighlightDiff current={item.priority || ''} original={originalItem?.priority} />
                </td>

                <td className={`p-3 ${changedFields.measures ? "border-l-4 border-yellow-500" : ""}`}>
                  <HighlightDiff current={item.measures || ''} original={originalItem?.measures} />
                </td>

                <td className={`p-3 ${changedFields.resource ? "border-l-4 border-yellow-500" : ""}`}>
                  <HighlightDiff current={item.resource || ''} original={originalItem?.resource} />
                </td>
                {/* 
                <td className={`p-3 ${changedFields.expectedDeliverable ? "border-l-4 border-yellow-500" : ""}`}>
                  <HighlightDiff current={item.expectedDeliverable || ''} original={originalItem?.expectedDeliverable} />
                </td> */}

                <td className={`p-3 ${changedFields.targetDate ? "border-l-4 border-yellow-500" : ""}`}>
                  <HighlightDiff
                    current={formatDate(item.targetDate)}
                    original={formatDate(originalItem?.targetDate)}
                  />
                </td>

                <td className={`p-3 ${changedFields.CS ? "border-l-4 border-yellow-500" : ""}`}>
                  <HighlightDiff current={item.CS || ''} original={originalItem?.CS} />
                </td>

                <td className={`p-3 ${changedFields.actualDate ? "border-l-4 border-yellow-500" : ""}`}>
                  <HighlightDiff
                    current={formatDate(item.actualDate)}
                    original={formatDate(originalItem?.actualDate)}
                  />
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
                              onClick={() => onRevertField(String(item.id), field as keyof ESGCapItem)}
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
                      onClick={() => onRevert(String(item.id))}
                    >
                      Revert All
                    </Button>
                  )}
                </td>

                {/* <td className={`p-3 ${changedFields.remarks ? "border-l-4 border-yellow-500" : ""}`}>
                  <HighlightDiff current={item.remarks || ''} original={originalItem?.remarks} />
                </td> */}
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
    const aprilFirstCurrentYear = new Date(currentYear, 3, 1); // April 1st of the current year

    // Check if the current date is before April 1st of the current year
    const financialYear =
      currentDate < aprilFirstCurrentYear
        ? `${currentYear - 1}-${currentYear.toString().slice(-2)}`
        : `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

    setFinancialYear(financialYear);
  }, []);

  const handleReview = (item: ESGCapItem) => {
    const currentItem = capItems.find(i => i.item === item.item);
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
        if (item.item === selectedItem.item) {
          return { ...item, status: "completed" as CAPStatus, actualCompletionDate: new Date().toISOString() };
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
        if (item.item === selectedItem.item) {
          return { ...item, status: "rejected" as CAPStatus };
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

  const handleSendReminder = (item: ESGCapItem) => {
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
          // reset state when no data
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
      const entityId = company?.user?.entityId
      if (entityId) {
        getPlanList(entityId);
      }else{
        getPlanList(entityId);
      }
    }
  }, [selectedCompany,portfolioCompanies]);

  const handleSaveChanges = (updatedItem: ESGCapItem) => {
    previousCapItemsRef.current = [...capItems];
  
    const updatedItems = capItems.map(item => {
      // Use item.item for identification
      if (item.item === updatedItem.item) {
        return { ...updatedItem, changeStatus: 'Edited' };
      }
      return item;
    });
    setCapItems(updatedItems);
    setSelectedItem({ ...updatedItem });
    setReviewDialogOpen(false);
  };


  const isAcceptVisible = (): boolean => {
    if (!planData) return false;
    return !planData.investorPlanFinalStatus;
  };

  const isPlanFinalized = planData ?
    (planData.finalPlan || (planData.founderPlanFinalStatus && planData.investorPlanFinalStatus)) :
    false;

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
    // If itemId is the item.name, find by that
    const originalItem = previousCapItemsRef.current.find(item => item.item === itemId);
    if (originalItem) {
      const updatedItems = capItems.map(item => {
        if (item.item === itemId) {
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
  
  const handleRevertField = (itemId: string, field: keyof ESGCapItem) => {
    const originalItem = previousCapItemsRef.current.find(item => item.item === itemId);
    if (originalItem && field in originalItem) {
      const updatedItems = capItems.map(item => {
        if (item.item === itemId) {
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
    if (!planData) return;

    const isInvestor = user?.entityType === 1;
    const isFounder = user?.entityType === 2;

    try {
      // Update acceptance flags
      const updatedFinalAcceptance = {
        founderAcceptance: planData.finalAcceptance?.founderAcceptance || false,
        investorAcceptance: planData.finalAcceptance?.investorAcceptance || false,
        ...(isFounder && { founderAcceptance: true }),
        ...(isInvestor && { investorAcceptance: true }),
      };

      // Check if both have accepted
      const bothAccepted =
        updatedFinalAcceptance.founderAcceptance &&
        updatedFinalAcceptance.investorAcceptance;

      // Payload for API (added plan)
      const payload = {
        entityId: planData.entityId,
        plan: planData.plan || [], // ✅ include the CAP plan
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
      .filter(item => item.status === "completed") // Changed from "Completed" to "completed"
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
    const updatedItems = [...capItems, newItem];
    setCapItems(updatedItems);
    saveToLocalStorage(updatedItems);
  };

  const handleAddMultipleItems = (newItems: ESGCapItem[]) => {
    const updatedItems = [...capItems, ...newItems];
    setCapItems(updatedItems);
    saveToLocalStorage(updatedItems);
    setFilteredCAPItems(updatedItems);
  };

  // Save to localStorage whenever capItems changes
  const saveToLocalStorage = (items: ESGCapItem[]) => {
    localStorage.setItem('esg-cap-items', JSON.stringify(items));
  };

  useEffect(() => {
    saveToLocalStorage(capItems);
  }, [capItems]);

  // Add this helper
  const canAccept = (): boolean => {
    if (!planData) return false;

    const isInvestor = user?.entityType === 1;
    const isFounder = user?.entityType === 2;

    // If already finalized → no accept
    if (planData.finalPlan) return false;

    // Founder case
    if (isFounder) {
      return !planData.founderPlanFinalStatus;
    }

    // Investor case
    if (isInvestor) {
      // Must wait for founder + not already accepted
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
              <CardTitle>
                Corrective Action Plan Items
                {!isPlanFinalized && <span>(In Approval Phase)</span>}
                {isPlanFinalized && <span>(Final)</span>}
              </CardTitle>
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
                      disabled={showComparisonView}
                    >
                      Request CAP Change
                    </Button>
                    <Button
                      onClick={handleAcceptCap}
                      size="lg"
                      // disabled={showComparisonView || !canAccept()}
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
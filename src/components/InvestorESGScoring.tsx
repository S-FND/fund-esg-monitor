import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ESGCapItem } from './esg-cap/CAPTable';
import { getDerivedInvestorStatus, isInvestorStatusClosed } from '@/utils/investorStatusUtils';
import { getEffectiveStatus } from '@/utils/esgStatus';
import { ComplianceGraphModal } from './ComplianceGraphModal';

interface ESGCapScoringProps {
  items: ESGCapItem[];
  onFilterChange?: (filterKey: string | null) => void;
  activeFilter?: string | null;
  complianceScore?: number;
  entityId: string;
}

export const ESGCapScoring: React.FC<ESGCapScoringProps> = ({ items, onFilterChange, activeFilter,complianceScore, entityId }) => {
  const [modalOpen, setModalOpen] = useState(false);

  // ✅ FILTER: Only include CP and CS items for card counting (exclude ESG_Roadmap)
  const filteredItems = items.filter(
    item => item.dealCondition === 'CP' || item.dealCondition === 'CS'
  );

  // Priority weightages for compliance score
  const priorityWeights = {
    High: 2,
    Medium: 1,
    Low: 0.5
  };

  const totalItems = filteredItems.length;
  const baseWeight = totalItems > 0 ? 100 / totalItems : 0;

  const totalWeightage = filteredItems.reduce((sum, item) => {
    const priority = item.priority || 'Medium';
    const weight = priorityWeights[priority] || priorityWeights.Medium;
    return sum + (baseWeight * weight);
  }, 0);

  const completedWeightage = filteredItems
    .filter(isInvestorStatusClosed)
    .reduce((sum, item) => {
      const priority = item.priority || 'Medium';
      const weight = priorityWeights[priority] || priorityWeights.Medium;
      return sum + (baseWeight * weight);
    }, 0);

  const progressPercentage = totalWeightage > 0
    ? (completedWeightage / totalWeightage) * 100
    : 0;

  const safeProgress = Math.max(0, Math.min(100, progressPercentage));

  // Helper: Check if target date is in current month
  const isInCurrentMonth = (targetDate?: string): boolean => {
    if (!targetDate) return false;
    const today = new Date();
    const target = new Date(targetDate);
    return target.getMonth() === today.getMonth() &&
           target.getFullYear() === today.getFullYear();
  };

  // ✅ All metrics use filteredItems (ONLY CP and CS)
  const highPriorityOverdue = filteredItems.filter(
    item => getDerivedInvestorStatus(item) === 'high-priority-overdue'
  ).length;

  const partlySubmittedCount = filteredItems.filter(
    item => getEffectiveStatus(item) === 'partly-submitted'
  ).length;

  const submittedPendingReviewCount = filteredItems.filter(
    item => {
      const companyStatus = (item.companyStatus || item.status || '').toLowerCase().trim();
      const investorStatus = (item.investorStatus || '').toLowerCase().trim();
      const effectiveStatus = getEffectiveStatus(item);
      
      // Company has submitted AND investor hasn't closed it yet
      return (companyStatus === 'submitted') && 
            investorStatus === 'under-review' || investorStatus === 'under review'
    }
  ).length;

  const resubmitRequestedCount = filteredItems.filter(
    item => (item.investorStatus || '').toLowerCase().trim() === 're-submit requested'
  ).length;
  
  const closedThisMonthCount = filteredItems.filter(
    item => {
      const isClosed = isInvestorStatusClosed(item);
      return isClosed && isInCurrentMonth(item.targetDate);
    }
  ).length;

  const highPriorityCount = filteredItems.filter(
    item => item.priority === 'High'
  ).length;

  // Helper to style active card
  const getCardClass = (filterKey: string | null, defaultBg: string, isStatic: boolean = false) => {
    const baseClass = "text-center p-2 rounded-lg transition-all";
    if (isStatic) {
      return `${baseClass} ${defaultBg} cursor-default`;
    }
    const clickableClass = "cursor-pointer hover:shadow-md hover:scale-105";
    if (activeFilter === filterKey) {
      return `${baseClass} ${clickableClass} ring-2 ring-primary bg-primary/10 shadow-lg`;
    }
    return `${baseClass} ${clickableClass} ${defaultBg}`;
  };

  const handleFilter = (filterKey: string | null, isStatic: boolean = false) => {
    if (isStatic) return;
    const newFilter = activeFilter === filterKey ? null : filterKey;
    onFilterChange?.(newFilter);
  };

  const csItems = filteredItems.filter(
    item => item.dealCondition === "CS"
  );

  const getSubmitDate = (item: any): Date | null => {
    const indicators = item.completionIndicators || [];
  
    const uploadedDates = indicators
      .map(indicator => indicator.uploadedAt)
      .filter(Boolean)
      .map(date => new Date(date as string))
      .filter(date => !isNaN(date.getTime()));
  
    // Last uploadedAt = submit date
    if (uploadedDates.length > 0) {
      return new Date(
        Math.max(...uploadedDates.map(date => date.getTime()))
      );
    }
  
    // If no uploadedAt and company submitted,
    // use this item's createdAt
    const companyStatus = (
      item.companyStatus ||
      item.status ||
      ""
    ).toLowerCase().trim();
  
    if (companyStatus === "submitted" && item.createdAt) {
      const createdAt = new Date(item.createdAt);
  
      if (!isNaN(createdAt.getTime())) {
        return createdAt;
      }
    }
  
    return null;
  };

  const getMonthDifference = (
    targetDate: Date,
    submitDate: Date
  ): number => {
    return (
      (submitDate.getFullYear() - targetDate.getFullYear()) * 12 +
      (submitDate.getMonth() - targetDate.getMonth())
    );
  };

  const getUploadedDate = (item: any): Date | null => {
    const uploadedDates = (item.completionIndicators || [])
      .map((indicator: any) => indicator.uploadedAt)
      .filter(Boolean)
      .map((date: string) => new Date(date))
      .filter((date: Date) => !isNaN(date.getTime()));
  
    if (uploadedDates.length === 0) {
      return null;
    }
  
    return new Date(
      Math.max(...uploadedDates.map(date => date.getTime()))
    );
  };
  
  const normalize = (s?: string) =>
    (s ?? '').trim().toLowerCase();
  
  
  const getCSCategory = (item: ESGCapItem) => {
    const CUTOFF_DATE = new Date('2026-06-30T23:59:59.999');
  
    if (!item.targetDate) {
      return null;
    }
  
    const targetDate = new Date(item.targetDate);
    if (isNaN(targetDate.getTime())) {
      return null;
    }
  
    // ---- 👇 NEW: Resolve status with fallback chain ----
    // Priority: companyStatus > investorStatus > status
    let rawStatus = item.companyStatus;
    if (rawStatus === undefined || rawStatus === null) {
      rawStatus = item.investorStatus; // fallback 1
    }
    if (rawStatus === undefined || rawStatus === null) {
      rawStatus = item.status;         // fallback 2
    }
    // Normalize only if we have a value
    const resolvedStatus = rawStatus ? normalize(String(rawStatus)) : null;
  
    const uploadedDate = getUploadedDate(item);
  
    /*
     * =====================================================
     * TARGET DATE <= 30 JUNE 2026
     * =====================================================
     */
    if (targetDate <= CUTOFF_DATE) {
      /*
       * 1. uploadedAt EXISTS
       */
      if (uploadedDate) {
        // Uploaded on/before target = ON TIME
        if (uploadedDate <= targetDate) {
          return 'ontime';
        }
  
        // Uploaded after target = BUFFER
        const months = getMonthDifference(targetDate, uploadedDate);
        if (months === 1) return 'buffer1';
        if (months === 2) return 'buffer2';
        if (months === 3) return 'buffer3';
        if (months > 3) return 'over3';
        return null;
      }
  
      /*
       * 2. uploadedAt DOES NOT EXIST
       * Only submitted (resolvedStatus) is considered completed.
       */
      if (resolvedStatus === 'submitted') {
        return 'ontime';
      }
  
      /*
       * 3. NOT COMPLETED
       */
      const today = new Date();
      const months = getMonthDifference(targetDate, today);
      if (months <= 3) {
        return 'under3';
      }
      return 'over3';
    }
  
    /*
     * =====================================================
     * TARGET DATE AFTER 30 JUNE 2026
     * =====================================================
     */
  
    const submitDate = getSubmitDate(item);
  
    if (submitDate) {
      // Submitted on/before target = ON TIME
      if (resolvedStatus === 'submitted' && submitDate <= targetDate) {
        return 'ontime';
      }
  
      // Submitted after target = BUFFER
      const months = getMonthDifference(targetDate, submitDate);
      if (months === 1) return 'buffer1';
      if (months === 2) return 'buffer2';
      if (months === 3) return 'buffer3';
      if (months > 3) return 'over3';
      return null;
    }
  
    /*
     * =====================================================
     * NOT COMPLETED
     * =====================================================
     */
    const today = new Date();
    const months = getMonthDifference(targetDate, today);
    if (months <= 3) {
      return 'under3';
    }
    return 'over3';
  };

  const getCSCount = (
    priority: 'High' | 'Medium' | 'Low',
    type:
      | 'ontime'
      | 'buffer1'
      | 'buffer2'
      | 'buffer3'
      | 'under3'
      | 'over3'
  ) => {
    return csItems.filter(item => {
      if ((item.priority || 'Medium') !== priority) {
        return false;
      }
  
      return getCSCategory(item) === type;
    }).length;
  };

  const getPriorityTotal = (
    priority: "High" | "Medium" | "Low"
  ) => {
    return csItems.filter((item) => {
      const itemPriority = (item.priority || "Medium")
        .trim()
        .toLowerCase();
  
      return itemPriority === priority.toLowerCase();
    }).length;
  };

  const getCSTotal = (type:
    | "ontime"
    | "buffer1"
    | "buffer2"
    | "buffer3"
    | "under3"
    | "over3"
  ) => {
    return (
      getCSCount("High", type) +
      getCSCount("Medium", type) +
      getCSCount("Low", type)
    );
  };

  const debugInvestorCSItems = csItems.map(item => ({
    item: item.item,
    priority: item.priority,
    targetDate: item.targetDate,
    companyStatus: item.companyStatus,
    investorStatus: item.investorStatus,
    uploadedDate: getUploadedDate(item)?.toISOString() || null,
    category: getCSCategory(item),
  }));
  
  console.table(
    debugInvestorCSItems.filter(
      item => item.category === 'under3'
    )
  );

  console.table(
    debugInvestorCSItems.filter(
      item =>
        item.category === 'ontime' ||
        item.category === 'under3'
    )
  );

  return (
    <>
    <div className="space-y-4">
      <Card className="mt-3 border-emerald-100">
        <CardContent className="p-3">
          <div className="overflow-x-auto rounded-xl border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-slate-700">
              CS Items
            </div>
          </div>
            {/* Header */}
            <div className="grid grid-cols-[0.8fr_1.4fr_1.7fr_1.7fr_1.7fr_1.7fr_1.7fr_0.8fr] min-w-[950px] items-center bg-emerald-50/70 px-3 py-2.5">

              <div className="text-[10px] font-semibold uppercase tracking-wide ">
                Priority
              </div>

              <div className="text-center text-[10px] font-semibold ">
                Completed in Time
              </div>

              <div className="text-center text-[10px] font-semibold ">
                Completed within 1 Buffer Time
              </div>

              <div className="text-center text-[10px] font-semibold ">
                Completed within 2 Buffer Time
              </div>

              <div className="text-center text-[10px] font-semibold ">
                Completed within 3 Buffer Time
              </div>

              <div className="text-center text-[10px] font-semibold ">
                Not completed &lt;3 Buffer Time
              </div>

              <div className="text-center text-[10px] font-semibold ">
                Not completed &gt;3 Buffer Time
              </div>

              <div className="text-center text-[10px] font-bold ">
                Total
              </div>

            </div>


            {/* High */}
            <div className="grid grid-cols-[0.8fr_1.4fr_1.7fr_1.7fr_1.7fr_1.7fr_1.7fr_0.8fr] min-w-[950px] items-center border-t border-slate-100 px-3 py-2.5">

              <div className="text-xs font-bold text-red-600">
                High
              </div>

              <div className="text-center text-xs font-semibold">
                {getCSCount("High", "ontime")}
              </div>

              <div className="text-center text-xs font-semibold">
                {getCSCount("High", "buffer1")}
              </div>

              <div className="text-center text-xs font-semibold">
                {getCSCount("High", "buffer2")}
              </div>

              <div className="text-center text-xs font-semibold">
                {getCSCount("High", "buffer3")}
              </div>

              <div className="text-center text-xs font-semibold">
                {getCSCount("High", "under3")}
              </div>

              <div className="text-center text-xs font-bold">
                {getCSCount("High", "over3")}
              </div>

              <div className="text-center text-xs font-bold">
                {getPriorityTotal("High")}
              </div>

            </div>


            {/* Medium */}
            <div className="grid grid-cols-[0.8fr_1.4fr_1.7fr_1.7fr_1.7fr_1.7fr_1.7fr_0.8fr] min-w-[950px] items-center border-t border-slate-100 px-3 py-2.5">

              <div className="text-xs font-bold text-amber-600">
                Medium
              </div>

              <div className="text-center text-xs font-semibold">
                {getCSCount("Medium", "ontime")}
              </div>

              <div className="text-center text-xs font-semibold">
                {getCSCount("Medium", "buffer1")}
              </div>

              <div className="text-center text-xs font-semibold">
                {getCSCount("Medium", "buffer2")}
              </div>

              <div className="text-center text-xs font-semibold">
                {getCSCount("Medium", "buffer3")}
              </div>

              <div className="text-center text-xs font-semibold">
                {getCSCount("Medium", "under3")}
              </div>

              <div className="text-center text-xs font-bold">
                {getCSCount("Medium", "over3")}
              </div>

              <div className="text-center text-xs font-bold">
                {getPriorityTotal("Medium")}
              </div>

            </div>


            {/* Low */}
            <div className="grid grid-cols-[0.8fr_1.4fr_1.7fr_1.7fr_1.7fr_1.7fr_1.7fr_0.8fr] min-w-[950px] items-center border-t border-slate-100 px-3 py-2.5">

              <div className="text-xs font-bold text-slate-500">
                Low
              </div>

              <div className="text-center text-xs font-semibold">
                {getCSCount("Low", "ontime")}
              </div>

              <div className="text-center text-xs font-semibold">
                {getCSCount("Low", "buffer1")}
              </div>

              <div className="text-center text-xs font-semibold">
                {getCSCount("Low", "buffer2")}
              </div>

              <div className="text-center text-xs font-semibold">
                {getCSCount("Low", "buffer3")}
              </div>

              <div className="text-center text-xs font-semibold">
                {getCSCount("Low", "under3")}
              </div>

              <div className="text-center text-xs font-bold">
                {getCSCount("Low", "over3")}
              </div>

              <div className="text-center text-xs font-bold">
                {getPriorityTotal("Low")}
              </div>

            </div>


            {/* Total */}
            <div className="grid grid-cols-[0.8fr_1.4fr_1.7fr_1.7fr_1.7fr_1.7fr_1.7fr_0.8fr] min-w-[950px] items-center border-t border-emerald-200 bg-emerald-50 px-3 py-2.5">

              <div className="text-xs font-bold text-emerald-700">
                Total
              </div>

              <div className="text-center text-xs font-bold">
                {getCSTotal("ontime")}
              </div>

              <div className="text-center text-xs font-bold">
                {getCSTotal("buffer1")}
              </div>

              <div className="text-center text-xs font-bold">
                {getCSTotal("buffer2")}
              </div>

              <div className="text-center text-xs font-bold">
                {getCSTotal("buffer3")}
              </div>

              <div className="text-center text-xs font-bold">
                {getCSTotal("under3")}
              </div>

              <div className="text-center text-xs font-bold">
                {getCSTotal("over3")}
              </div>

              <div className="flex justify-center">
                <span className="rounded-full bg-emerald-200 px-3 py-1 text-xs font-bold">
                  {csItems.length}
                </span>
              </div>

            </div>

          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-3">
          <div className="grid grid-cols-6 gap-2">
            {/* 1. Portfolio Compliance Score - STATIC */}
            <div className="text-center p-2 rounded-lg bg-green-50 cursor-default cursor-pointer" onClick={() => setModalOpen(true)}>
              <div className="flex items-center justify-center gap-1">
                <div className="text-lg font-bold text-green-600">{complianceScore?.toFixed(1)}%</div>
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight">Portfolio Compliance Score</div>
            </div>

            {/* 2. High Priority Overdue - CLICKABLE */}
            <div 
              className={getCardClass('high-priority-overdue', "bg-red-50")}
              onClick={() => handleFilter('high-priority-overdue')}
            >
              <div className="flex items-center justify-center gap-1">
                <div className="text-lg font-bold text-red-600">{highPriorityOverdue}</div>
              </div>
              <div className="text-[10px] text-red-600 font-medium leading-tight">High Priority Overdue</div>
            </div>

            {/* 3. Partly Submitted - CLICKABLE */}
            <div 
              className={getCardClass('partly-submitted', "bg-blue-50")}
              onClick={() => handleFilter('partly-submitted')}
            >
              <div className="flex items-center justify-center gap-1">
                <div className="text-lg font-bold text-blue-600">{partlySubmittedCount}</div>
              </div>
              <div className="text-[10px] text-blue-600 font-medium leading-tight">Partly Submitted</div>
            </div>

            {/* 4. Submitted Pending Review - CLICKABLE */}
            <div 
              className={getCardClass('submitted-pending-review', "bg-purple-50")}
              onClick={() => handleFilter('submitted-pending-review')}
            >
              <div className="flex items-center justify-center gap-1">
                <div className="text-lg font-bold text-purple-600">{submittedPendingReviewCount}</div>
              </div>
              <div className="text-[10px] text-purple-600 font-medium leading-tight">Submitted Pending Review</div>
            </div>

            {/* 5. Re-submit Requested - CLICKABLE */}
            <div 
              className={getCardClass('re-submit-requested', "bg-amber-50")}
              onClick={() => handleFilter('re-submit-requested')}
            >
              <div className="flex items-center justify-center gap-1">
                <div className="text-lg font-bold text-amber-600">{resubmitRequestedCount}</div>
              </div>
              <div className="text-[10px] text-amber-600 font-medium leading-tight">Re-submit Requested</div>
            </div>

            {/* 6. Closed This Month - CLICKABLE */}
            <div 
              className={getCardClass('closed-this-month', "bg-emerald-50")}
              onClick={() => handleFilter('closed-this-month')}
            >
              <div className="flex items-center justify-center gap-1">
                <div className="text-lg font-bold text-emerald-600">{closedThisMonthCount}</div>
              </div>
              <div className="text-[10px] text-emerald-600 font-medium leading-tight">Closed This Month</div>
            </div>

            {/* 7. Critical Risk Flags - STATIC */}
            {/* <div className="text-center p-2 rounded-lg bg-red-50 cursor-default">
              <div className="flex items-center justify-center gap-1">
                <div className="text-lg font-bold text-red-600">{highPriorityCount}</div>
              </div>
              <div className="text-[10px] text-red-600 font-medium leading-tight">Critical Risk Flags</div>
            </div> */}
          </div>
        </CardContent>
      </Card>
    </div>
     <ComplianceGraphModal
      entityId={entityId}
      open={modalOpen}
      onOpenChange={setModalOpen}
    />
   </>
  );
};
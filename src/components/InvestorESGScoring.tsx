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

  return (
    <>
    <div className="space-y-4">
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
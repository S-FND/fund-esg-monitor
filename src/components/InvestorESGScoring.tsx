import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ESGCapItem } from './esg-cap/CAPTable';

interface ESGCapScoringProps {
  items: ESGCapItem[];
  onFilterChange?: (filterKey: string | null) => void;
  activeFilter?: string | null;
}

export const ESGCapScoring: React.FC<ESGCapScoringProps> = ({ items, onFilterChange, activeFilter }) => {

  // Priority weightages
  const priorityWeights = {
    High: 2,
    Medium: 1,
    Low: 0.5
  };

  const totalItems = items.length;
  const baseWeight = totalItems > 0 ? 100 / totalItems : 0;

  const totalWeightage = items.reduce((sum, item) => {
    const priority = item.priority || 'Medium';
    const weight = priorityWeights[priority] || priorityWeights.Medium;
    return sum + (baseWeight * weight);
  }, 0);

  const isClosed = (item: ESGCapItem) =>
    (item.investorStatus || '').toLowerCase() === 'closed';

  // ✅ Use investorStatus "Closed" for completed items
  const completedWeightage = items
    .filter(isClosed)
    .reduce((sum, item) => {
      const priority = item.priority || 'Medium';
      const weight = priorityWeights[priority] || priorityWeights.Medium;
      return sum + (baseWeight * weight);
    }, 0);


  const progressPercentage = totalWeightage > 0
    ? (completedWeightage / totalWeightage) * 100
    : 0;

  const safeProgress = Math.max(0, Math.min(100, progressPercentage));

  const getDateStatus = (item: ESGCapItem) => {
    const investorStatus = (item.investorStatus || "").toLowerCase();
  
    if (investorStatus === "closed") {
      return "closed";
    }
  
    // if (item.status === "submitted") {
    //   return "submitted";
    // }
  
    if (!item.targetDate) {
      return " ";
    }
  
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const target = new Date(item.targetDate);
    target.setHours(0, 0, 0, 0);
  
    if (target < today) {
      return "overdue";
    }
  
    if (
      target.getMonth() === today.getMonth() &&
      target.getFullYear() === today.getFullYear()
    ) {
      return "due in this month";
    }
  
    return "upcoming";
  };
  
  const completedCount = items.filter(
    item => getDateStatus(item) === "closed"
  ).length;
  
  const submittedCount = items.filter(
    item => (item.status || '').toLowerCase() === 'submitted'
  ).length;
  
  const overdueCount = items.filter(
    item => getDateStatus(item) === "overdue"
  ).length;
  
  const dueSoonCount = items.filter(
    item => getDateStatus(item) === "due in this month"
  ).length;
  
  const upcomingCount = items.filter(
    item => getDateStatus(item) === "upcoming"
  ).length;

  // Helper to style active card while preserving original background colors
  const getCardClass = (filterKey: string | null, defaultBg: string) => {
    let baseClass = "text-center p-3 rounded-lg cursor-pointer transition-all hover:shadow-md";
    if (activeFilter === filterKey) {
      return `${baseClass} ring-2 ring-primary bg-primary/10`;
    }
    return `${baseClass} ${defaultBg}`;
  };

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">ESG CAP Progress</h3>
            {/* <div className="text-2xl font-bold text-primary">
              {progressPercentage.toFixed(1)}%
            </div> */}
          </div>

          <Progress value={safeProgress} className="w-full h-3" style={{ backgroundColor: '#f8fafc' }} />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
            <div
              className={getCardClass(null, "bg-muted/50")}
              onClick={() => onFilterChange?.(null)}
            >
              <div className="font-semibold text-lg">{totalItems}</div>
              <div className="text-muted-foreground">Total</div>
            </div>

            <div
              className={getCardClass('closed', "bg-green-50")}
              onClick={() => onFilterChange?.('closed')}
            >
              <div className="font-semibold text-lg text-green-700">{completedCount}</div>
              <div className="text-green-600">Closed</div>
            </div>

            <div
              className={getCardClass('due in this month', "bg-orange-50")}
              onClick={() => onFilterChange?.('due in this month')}
            >
              <div className="font-semibold text-lg text-orange-700">{dueSoonCount}</div>
              <div className="text-orange-600">Due in this Month</div>
            </div>

            <div
              className={getCardClass('overdue', "bg-red-50")}
              onClick={() => onFilterChange?.('overdue')}
            >
              <div className="font-semibold text-lg text-red-700">{overdueCount}</div>
              <div className="text-red-600">Overdue</div>
            </div>

            <div
              className={getCardClass('submitted', "bg-blue-50")}
              onClick={() => onFilterChange?.('submitted')}
            >
              <div className="font-semibold text-lg text-blue-700">{submittedCount}</div>
              <div className="text-blue-600">Submitted</div>
            </div>

            <div
              className={getCardClass('upcoming', "bg-slate-50")}
              onClick={() => onFilterChange?.('upcoming')}
            >
              <div className="font-semibold text-lg text-slate-700">{upcomingCount}</div>
              <div className="text-slate-600">Upcoming</div>
            </div>
          </div>

          {/* <div className="flex justify-between text-sm text-muted-foreground">
            <span>Weighted Score: {completedWeightage.toFixed(1)} / {totalWeightage.toFixed(1)}</span>
            <span>Progress: {progressPercentage.toFixed(1)}% Complete</span>
          </div> */}
        </div>
      </CardContent>
    </Card>
  );
};
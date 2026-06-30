// ─────────────────────────────────────────────────────────────────────────────
// useComplianceScore.ts
// Usage (function): const result = calculateComplianceScore(items)
// Usage (hook):     const result = useComplianceScore(items)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type Priority       = "High" | "Medium" | "Low";
export type DealCondition  = "CS" | "CP" | "ESG_Roadmap";
export type InvestorStatus = "closed" | "re-submit" | "";
export type SubItemStatus  =
  | "not-submitted"
  | "submitted"
  | "resubmit-required"
  | "resubmitted"
  | "accepted";

export type CSStatus =
  | "Upcoming"
  | "Due This Month"
  | "Partly Submitted"
  | "Submitted"
  | "Re-submit Required"
  | "Overdue"
  | "Closed"
  | "Dropped";

export type ScoreStatus =
  | "On Track"
  | "Stable"
  | "Needs Attention"
  | "At Risk"
  | "Critical";

export interface CompletionIndicator {
  indicatorLabel:       string;
  isMandatory?:         boolean;        // defaults true
  status?:              SubItemStatus;
  submissionDate?:      string | null;
  resubmitRequired?:    boolean;
  resubmitDueDate?:     string | null;
  resubmitComment?:     string | null;
  resubmittedDate?:     string | null;  // null = resubmit still open
  finalSubmissionDate?: string | null;  // explicit override
  guidanceResources?:   string;
  fileUploadUrl?:       string;
  reviewedOn?:          string | null;
}

export interface PlanItem {
  id:                   string;
  item:                 string;
  dealCondition:        DealCondition;
  priority:             Priority;
  status:               string;
  investorStatus:       InvestorStatus;
  targetDate:           string | { $date: string };
  actualDate?:          string | null;
  completionIndicators: CompletionIndicator[];
  csStartDate?:         string | null;
  revisedDueDate?:      string | null;
}

export interface SubItemDetail {
  label:         string;
  isSettled:     boolean;
  needsResubmit: boolean;
  effectiveDate: Date;
}

export interface ItemScore {
  itemId:              string;
  itemName:            string;
  priority:            Priority;
  weight:              number;
  isApplicable:        boolean;
  isDropped:           boolean;
  csStatus:            CSStatus;
  isComplete:          boolean;
  submittedCount:      number;
  totalMandatory:      number;
  hasResubmitRequired: boolean;
  dueDate:             Date | null;
  bufferEndDate:       Date | null;
  timelineDays:        number;
  allowedBufferDays:   number;
  completionDate:      Date;
  delayAfterBuffer:    number;
  delayBucket:         number;
  itemScore:           number;
  weightedScore:       number;
  riskFlag:            boolean;
  subItems:            SubItemDetail[];
}

export interface ComplianceScoreResult {
  overallScore:         number;
  status:               ScoreStatus;
  highPriorityRiskFlag: boolean;
  items:                ItemScore[];
  summary: {
    totalCSItems:          number;
    applicableItems:       number;
    upcomingItems:         number;
    completedItems:        number;
    overdueItems:          number;
    partlySubmittedItems:  number;
    resubmitRequiredItems: number;
    dueThisMonthItems:     number;
  };
}

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

const PRIORITY_WEIGHT: Record<Priority, number> = { High: 60, Medium: 30, Low: 10 };
const BUFFER_RATIO = 0.25;

function toDate(v: string | { $date: string } | null | undefined): Date | null {
  if (!v) return null;
  const iso = typeof v === "string" ? v : v.$date;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function resolveSubItem(ci: CompletionIndicator, today: Date): SubItemDetail {
  const label = ci.indicatorLabel;

  if (ci.finalSubmissionDate)
    return { label, isSettled: true, needsResubmit: false,
             effectiveDate: toDate(ci.finalSubmissionDate) ?? today };

  if (ci.resubmitRequired && ci.resubmittedDate)
    return { label, isSettled: true, needsResubmit: false,
             effectiveDate: toDate(ci.resubmittedDate) ?? today };

  if (ci.resubmitRequired && !ci.resubmittedDate)
    return { label, isSettled: false, needsResubmit: true, effectiveDate: today };

  if (ci.submissionDate)
    return { label, isSettled: true, needsResubmit: false,
             effectiveDate: toDate(ci.submissionDate) ?? today };

  return { label, isSettled: false, needsResubmit: false, effectiveDate: today };
}

function resolveCompletion(indicators: CompletionIndicator[], today: Date) {
  const mandatory   = indicators.filter((ci) => ci.isMandatory !== false);
  const subItems    = mandatory.map((ci) => resolveSubItem(ci, today));
  const settled     = subItems.filter((s) => s.isSettled);
  const hasResubmit = subItems.some((s) => s.needsResubmit);
  const isComplete  = settled.length === mandatory.length && !hasResubmit;
  const completionDate = isComplete
    ? settled.reduce((max, s) => s.effectiveDate > max ? s.effectiveDate : max, settled[0].effectiveDate)
    : today;

  return { subItems, totalMandatory: mandatory.length, submittedCount: settled.length,
           hasResubmitRequired: hasResubmit, isComplete, completionDate };
}

function deriveStatus(
  item: PlanItem,
  comp: ReturnType<typeof resolveCompletion>,
  bufferEndDate: Date | null,
  today: Date
): CSStatus {
  if (item.status?.toLowerCase() === "dropped") return "Dropped";
  if (item.investorStatus === "closed")          return "Closed";
  if (comp.hasResubmitRequired)                  return "Re-submit Required";
  if (comp.isComplete)                           return "Submitted";
  if (bufferEndDate && today > bufferEndDate)    return "Overdue";
  if (comp.submittedCount > 0)                   return "Partly Submitted";

  const due = toDate(item.revisedDueDate) ?? toDate(item.targetDate);
  if (due) {
    const toMonth = (d: Date) => d.getFullYear() * 12 + d.getMonth();
    if (toMonth(due) <= toMonth(today)) return "Due This Month";
  }
  return "Upcoming";
}

// ─────────────────────────────────────────────
// Plain function
// ─────────────────────────────────────────────

export function calculateComplianceScore(
  items: PlanItem[],
  today: Date = new Date()
): ComplianceScoreResult {
  const csItems = items.filter((i) => i.dealCondition === "CS");

  const scored: ItemScore[] = csItems.map((item) => {
    const weight      = PRIORITY_WEIGHT[item.priority];
    const dueDate     = toDate(item.revisedDueDate) ?? toDate(item.targetDate);
    const startDate   = toDate(item.csStartDate) ?? dueDate;
    const timelineDays  = startDate && dueDate ? daysBetween(startDate, dueDate) : 0;
    const allowedBuffer = Math.round(timelineDays * BUFFER_RATIO);
    const bufferEndDate = dueDate
      ? new Date(dueDate.getTime() + allowedBuffer * 86_400_000)
      : null;

    const comp      = resolveCompletion(item.completionIndicators ?? [], today);
    const csStatus  = deriveStatus(item, comp, bufferEndDate, today);
    const isApplicable = csStatus !== "Upcoming" && csStatus !== "Dropped";

    let itemScore = 0, delayAfterBuffer = 0, delayBucket = 0, weightedScore = 0;

    if (isApplicable && bufferEndDate) {
      if (comp.completionDate <= bufferEndDate) {
        itemScore = 100;
      } else {
        delayAfterBuffer = daysBetween(bufferEndDate, comp.completionDate);
        delayBucket      = Math.ceil(delayAfterBuffer / (allowedBuffer || 1));
        itemScore        = Math.max(0, 100 - delayBucket * 25);
      }
      weightedScore = itemScore * weight;
    }

    return {
      itemId: item.id, itemName: item.item, priority: item.priority,
      weight, isApplicable, isDropped: csStatus === "Dropped", csStatus,
      isComplete: comp.isComplete, submittedCount: comp.submittedCount,
      totalMandatory: comp.totalMandatory, hasResubmitRequired: comp.hasResubmitRequired,
      dueDate, bufferEndDate, timelineDays, allowedBufferDays: allowedBuffer,
      completionDate: comp.completionDate, delayAfterBuffer, delayBucket,
      itemScore, weightedScore,
      riskFlag: item.priority === "High" && delayBucket >= 2,
      subItems: comp.subItems,
    };
  });

  const applicable  = scored.filter((r) => r.isApplicable);
  const sumWeighted = applicable.reduce((s, r) => s + r.weightedScore, 0);
  const sumWeights  = applicable.reduce((s, r) => s + r.weight, 0);
  const overallScore = sumWeights === 0
    ? 0
    : Math.round((sumWeighted / sumWeights) * 10) / 10;

  const status: ScoreStatus =
    overallScore >= 85 ? "On Track"       :
    overallScore >= 70 ? "Stable"          :
    overallScore >= 55 ? "Needs Attention" :
    overallScore >= 40 ? "At Risk"         : "Critical";

  return {
    overallScore, status,
    highPriorityRiskFlag: applicable.some((r) => r.riskFlag),
    items: scored,
    summary: {
      totalCSItems:          csItems.length,
      applicableItems:       applicable.length,
      upcomingItems:         scored.filter((r) => r.csStatus === "Upcoming").length,
      completedItems:        applicable.filter((r) => r.isComplete).length,
      overdueItems:          applicable.filter((r) => r.csStatus === "Overdue").length,
      partlySubmittedItems:  applicable.filter((r) => r.csStatus === "Partly Submitted").length,
      resubmitRequiredItems: applicable.filter((r) => r.csStatus === "Re-submit Required").length,
      dueThisMonthItems:     applicable.filter((r) => r.csStatus === "Due This Month").length,
    },
  };
}

// ─────────────────────────────────────────────
// React hook
// ─────────────────────────────────────────────

export function useComplianceScore(
  items: PlanItem[],
  today: Date = new Date()
): ComplianceScoreResult {
  const [result, setResult] = useState<ComplianceScoreResult>(
    calculateComplianceScore(items, today)
  );

  useEffect(() => {
    setResult(calculateComplianceScore(items, today));
  }, [items, today]);

  return result;
}
// ─────────────────────────────────────────────────────────────────────────────
// mapESGCapItem.ts
// Maps ESGCapItem[] (your app's actual plan-item interface) to PlanItem[]
// expected by calculateComplianceScore() / useComplianceScore().
//
// NOTE: ESGCapItem.completionIndicators already uses the exact target
// CompletionIndicator type, so sub-items pass through almost unchanged —
// only the item-level fields (status, dealCondition, priority, dates) need
// translation.
// ─────────────────────────────────────────────────────────────────────────────

import { ESGCapItem } from "@/components/esg-cap/CAPTable";
import {
  PlanItem,
  CompletionIndicator,
  DealCondition,
  Priority,
} from "./useComplianceScore";

// ─────────────────────────────────────────────
// Your app's interface (as given)
// ─────────────────────────────────────────────

export type ESGCategory = string;
export type ESGCapPriority = string;       // e.g. "High" | "Medium" | "Low"
export type ESGCapDealCondition = string;  // e.g. "CS" | "CP" | "ESG_Roadmap"
export type CAPStatus = string;            // e.g. "Submitted" | "Overdue" | "Pending" | "Dropped" | ...

export interface IDocumentValidation {
  [key: string]: unknown;
}

export interface AiResponse {
  [key: string]: unknown;
}

export interface AiInsights {
  [key: string]: unknown;
}

export interface ESGCapItemv1 {
  id: string | number;
  item: string;
  measures: string;
  reportId?: string;
  issue?: string;
  description?: string;
  category: ESGCategory;
  recommendation?: string;
  priority: ESGCapPriority;
  status: CAPStatus;
  investorStatus: string;
  deadline?: string;
  targetDate?: string;
  progressPercentage?: string;
  assignedTo?: string;
  dealCondition: ESGCapDealCondition;
  createdAt: string;
  actualCompletionDate?: string;
  acceptedAt?: string;
  resource?: string;
  deliverable?: string;
  CS?: string;
  actualDate?: string;
  remarks?: string;
  theme?: "Policy" | "SOP" | "Metrics" | "Logs";
  data_type?: string;
  documentType?: string;
  sections?: string[];
  sourceType?: string;
  aiResponseRaw?: AiResponse;
  manualInsights?: AiResponse;
  aiInsights?: AiInsights;
  completionIndicators: CompletionIndicator[];   // ← exact target type, pass-through
}

// ─────────────────────────────────────────────
// Normalisation helpers (item-level fields only)
// ─────────────────────────────────────────────

function normalisePriority(p: string | undefined): Priority {
  const v = (p ?? "").trim().toLowerCase();
  if (v === "high") return "High";
  if (v === "low") return "Low";
  return "Medium";
}

function normaliseDealCondition(d: string | undefined): DealCondition {
  const v = (d ?? "").trim();
  if (v === "CS" || v === "CP" || v === "ESG_Roadmap") return v;
  return "ESG_Roadmap";
}

/**
 * Normalises any free-text investor status string into the strict union
 * the scorer understands. Covers: "closed", "Closed", "re-submit-requested",
 * "re-submit requested", "Re-submit Required", "under-review", "deferred",
 * "", "—", etc.
 */
function normaliseInvestorStatus(s: string | undefined): "closed" | "re-submit" | "" {
  const v = (s ?? "").trim().toLowerCase();
  if (v === "closed") return "closed";
  if (v.includes("resubmit") || v.includes("re-submit")) return "re-submit";
  return "";
}

/** Normalises CAPStatus into the "dropped" / " " distinction the scorer needs */
function normaliseItemStatus(s: string | undefined): string {
  const v = (s ?? "").trim().toLowerCase();
  if (v.includes("drop")) return "dropped";
  return " ";
}

function firstDefined(...vals: (string | undefined | null)[]): string | null {
  for (const v of vals) {
    if (v && v.trim() !== "") return v;
  }
  return null;
}

/**
 * csStartDate must be ≤ targetDate or the buffer-day math breaks (negative timeline).
 * Falls back to targetDate itself (0-day timeline) if createdAt is after it.
 */
function resolveCsStartDate(
  globalOverride: string | undefined,
  createdAt: string | null,
  targetDate: string
): string {
  if (globalOverride) return globalOverride;

  const target = new Date(targetDate).getTime();
  if (createdAt) {
    const created = new Date(createdAt).getTime();
    if (!isNaN(created) && !isNaN(target) && created <= target) return createdAt;
  }
  return targetDate;
}

// ─────────────────────────────────────────────
// Sub-item handling
// ─────────────────────────────────────────────

/**
 * Since ESGCapItem.completionIndicators is already typed as CompletionIndicator[],
 * this is mostly a pass-through. We only:
 *   1. Default isMandatory to true if not set
 *   2. Force-settle every sub-item if the parent item is closed/accepted
 *      (covers older records lacking per-sub-item submission tracking)
 */
function normaliseIndicator(
  ci: CompletionIndicator,
  forceSettle: boolean,
  fallbackDate: string | null
): CompletionIndicator {
  const normalised: CompletionIndicator = {
    ...ci,
    isMandatory: ci.isMandatory !== false,
  };

  if (forceSettle) {
    const isAlreadySettled =
      normalised.status === "submitted" ||
      normalised.status === "accepted" ||
      normalised.status === "resubmitted";

    if (!isAlreadySettled) {
      normalised.status = "submitted";
      normalised.submissionDate = normalised.submissionDate ?? fallbackDate;
      normalised.resubmitRequired = false;
    }
  }

  return normalised;
}

// ─────────────────────────────────────────────
// Main mapper
// ─────────────────────────────────────────────

/**
 * mapESGCapItems
 *
 * Converts ESGCapItem[] (your app's plan-item shape) into PlanItem[],
 * ready for calculateComplianceScore() / useComplianceScore().
 *
 * @param capItems     Your raw plan items
 * @param csStartDate  Optional global timeline-start override (e.g. deal close date)
 */
export function mapESGCapItems(
  capItems: ESGCapItem[],
  csStartDate?: string
): PlanItem[] {
  return capItems.map((c) => {
    const targetDate = firstDefined(c.targetDate, c.deadline) ?? new Date().toISOString();
    const actualDate = firstDefined(c.actualDate, c.actualCompletionDate);
    const createdAt = c.createdAt ?? null;

    const investorStatus = normaliseInvestorStatus(c.investorStatus);
    const isClosed = investorStatus === "closed" || !!c.acceptedAt;
    const fallbackDate = actualDate ?? targetDate;

    const completionIndicators = (c.completionIndicators ?? []).map((ci) =>
      normaliseIndicator(ci, isClosed, fallbackDate)
    );

    const mapped: PlanItem = {
      id: String(c.id),
      item: c.item,
      dealCondition: normaliseDealCondition(c.dealCondition),
      priority: normalisePriority(c.priority),
      status: normaliseItemStatus(c.status),
      investorStatus,
      targetDate,
      actualDate,
      completionIndicators,
      csStartDate: resolveCsStartDate(csStartDate, createdAt, targetDate),
    };

    return mapped;
  });
}
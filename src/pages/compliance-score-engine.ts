/**
 * ComplianceScoreEngine
 * ---------------------
 * Single source of truth for all Compliance Score calculations.
 *
 * Deterministic, fully explainable, reusable. The UI must NEVER calculate
 * scores directly — it must consume the output of `calculateComplianceScore`.
 *
 * Pipeline (in strict order):
 *   Timeline → Buffer → Completion Date → Delay → Bucket → Penalty
 *   → Item Score → Weighted Score → Overall Score → Status
 *   → Compliance Status → Risk Flags → Next Action
 */

// ============================================================================
// Types
// ============================================================================

export type DealCondition = "CS" | "CP" | "Roadmap" | string;
export type Priority = "High" | "Medium" | "Low" | string;

export type ItemStatus =
  | "Dropped"
  | "Closed"
  | "Re-submit Required"
  | "Overdue"
  | "Submitted"
  | "Partly Submitted"
  | "Due This Month"
  | "Upcoming";

export type ComplianceStatus =
  | "On Track"
  | "Stable"
  | "Needs Attention"
  | "At Risk"
  | "Critical";

export type NextActionOwner = "Company" | "Fireside" | "None";

export interface SubItem {
  name?: string;
  mandatory?: boolean;                // future flag; if absent, defaults per rules
  submissionDate?: string | Date | null;
  uploadDate?: string | Date | null;
  reviewDate?: string | Date | null;
  reSubmitRequired?: boolean;
  reSubmitDueDate?: string | Date | null;
  status?: string;
  [k: string]: unknown;
}

export interface AuditFields {
  originalDueDate?: string | Date | null;
  revisedDueDate?: string | Date | null;
  revisionCount?: number;
  revisionReason?: string;
  revisedBy?: string;
  revisedOn?: string | Date | null;
  dateEditedBy?: string;
  dateEditedOn?: string | Date | null;
  dateEditReason?: string;
}

export interface PlanItem extends AuditFields {
  id?: string | number;
  name?: string;
  dealCondition?: DealCondition;
  priority?: Priority;
  status?: string;
  investorStatus?: string;

  // Dates
  csStartDate?: string | Date | null;
  startDate?: string | Date | null;
  originalDueDate?: string | Date | null;
  currentDueDate?: string | Date | null;
  revisedDueDate?: string | Date | null;
  targetDate?: string | Date | null;
  actualDate?: string | Date | null;
  actualSubmissionDate?: string | Date | null;
  finalSubmissionDate?: string | Date | null;
  uploadDate?: string | Date | null;
  reviewDate?: string | Date | null;
  lastReviewDate?: string | Date | null;
  closedDate?: string | Date | null;
  reSubmitDueDate?: string | Date | null;

  timelineMonth?: number;

  reSubmitRequired?: boolean;
  dropped?: boolean;
  closed?: boolean;

  subItems?: SubItem[];

  [k: string]: unknown;
}

export interface PlanJson {
  plan?: PlanItem[];
  [k: string]: unknown;
}

export interface EngineConfig {
  /** Days per timelineMonth when start date is missing. Default 30. */
  configurableDaysPerMonth: number;
  /** Buffer percent of timeline. Default 25%. */
  bufferPercent: number;
  /** Reference "today"; defaults to system now on each call. */
  today?: Date;
}

export interface ExplainScore {
  timelineDays: number | null;
  bufferDays: number | null;
  bufferEndDate: Date | null;
  completionDateUsed: Date | null;
  reasonCompletionDateSelected: string;
  delayDays: number | null;
  delayBucket: number | null;
  penalty: number;
  itemScore: number;
  priorityWeight: number;
  weightedScore: number;
  status: ItemStatus;
  reasonStatusAssigned: string;
  applicable: boolean;
  nextAction: NextActionOwner;
  riskFlag: string | null;
  validationWarnings: string[];
  auditInformation: AuditFields;
  formulaUsed: string[];
  businessRuleApplied: string[];
}

export interface ItemResult {
  id: string | number | undefined;
  name: string | undefined;
  dealCondition: DealCondition | undefined;
  priority: Priority | undefined;
  itemScore: number;
  priorityWeight: number;
  weightedScore: number;
  status: ItemStatus;
  applicable: boolean;
  nextAction: NextActionOwner;
  riskFlag: string | null;
  validationWarnings: string[];
  explain: ExplainScore;
}

export interface ExplainOverall {
  applicableItems: Array<{
    id: ItemResult["id"];
    name: ItemResult["name"];
    itemScore: number;
    priorityWeight: number;
    weightedScore: number;
  }>;
  excludedItems: Array<{
    id: ItemResult["id"];
    name: ItemResult["name"];
    reason: string;
  }>;
  sumWeightedScore: number;
  sumPriorityWeight: number;
  formula: string;
  overallScore: number;
  complianceStatus: ComplianceStatus;
  highPriorityRisks: Array<{ id: ItemResult["id"]; name: ItemResult["name"]; reason: string }>;
  reasonForComplianceStatus: string;
}

export interface DashboardSummary {
  totalItems: number;
  applicableCount: number;
  excludedCount: number;
  byStatus: Record<string, number>;
  highPriorityRisks: number;
  validationWarningsCount: number;
}

export interface EngineResult {
  overallComplianceScore: number;
 
}

// ============================================================================
// Helpers
// ============================================================================

const DAY_MS = 24 * 60 * 60 * 1000;

const toDate = (v: unknown): Date | null => {
  if (v == null || v === "") return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

const startOfDay = (d: Date): Date => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

const diffDays = (a: Date, b: Date): number =>
  Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY_MS);

const addDays = (d: Date, days: number): Date => {
  const c = new Date(d);
  c.setDate(c.getDate() + days);
  return c;
};

const priorityWeightOf = (p: Priority | undefined): number => {
  switch ((p ?? "").toString().toLowerCase()) {
    case "high":
      return 60;
    case "medium":
      return 30;
    case "low":
      return 10;
    default:
      return 0;
  }
};

const isValidPriority = (p: Priority | undefined): boolean =>
  ["high", "medium", "low"].includes((p ?? "").toString().toLowerCase());

const isValidDealCondition = (dc: DealCondition | undefined): boolean =>
  ["CS", "CP", "Roadmap"].includes((dc ?? "").toString());

const complianceStatusFromScore = (s: number): ComplianceStatus => {
  if (s >= 85) return "On Track";
  if (s >= 70) return "Stable";
  if (s >= 55) return "Needs Attention";
  if (s >= 40) return "At Risk";
  return "Critical";
};

// ============================================================================
// Engine
// ============================================================================

export class ComplianceScoreEngine {
  private config: EngineConfig;

  constructor(config: Partial<EngineConfig> = {}) {
    this.config = {
      configurableDaysPerMonth: config.configurableDaysPerMonth ?? 30,
      bufferPercent: config.bufferPercent ?? 0.25,
      today: config.today,
    };
  }

  /** Public API */
  calculateComplianceScore(planJson: PlanJson | PlanItem[] | null | undefined): EngineResult {
    const today = startOfDay(this.config.today ?? new Date());
    const rawItems: PlanItem[] = Array.isArray(planJson)
      ? planJson
      : Array.isArray(planJson?.plan)
        ? planJson!.plan!
        : [];

    const items: ItemResult[] = rawItems.map((raw) => this.evaluateItem(raw, today));

    // Overall score — only Applicable items participate
    const applicable = items.filter((i) => i.applicable);
    const excluded = items.filter((i) => !i.applicable);
    const sumWeighted = applicable.reduce((s, i) => s + i.weightedScore, 0);
    const sumWeight = applicable.reduce((s, i) => s + i.priorityWeight, 0);
    const overallScore = sumWeight > 0 ? sumWeighted / sumWeight : 0;
    const compliance = complianceStatusFromScore(overallScore);

    const highPriorityRisks = items
      .filter((i) => i.riskFlag)
      .map((i) => ({ id: i.id, name: i.name, reason: i.riskFlag! }));

    const byStatus: Record<string, number> = {};
    for (const i of items) byStatus[i.status] = (byStatus[i.status] ?? 0) + 1;

    const dashboardSummary: DashboardSummary = {
      totalItems: items.length,
      applicableCount: applicable.length,
      excludedCount: excluded.length,
      byStatus,
      highPriorityRisks: highPriorityRisks.length,
      validationWarningsCount: items.reduce((s, i) => s + i.validationWarnings.length, 0),
    };

    const explainOverall: ExplainOverall = {
      applicableItems: applicable.map((i) => ({
        id: i.id,
        name: i.name,
        itemScore: i.itemScore,
        priorityWeight: i.priorityWeight,
        weightedScore: i.weightedScore,
      })),
      excludedItems: excluded.map((i) => ({
        id: i.id,
        name: i.name,
        reason: this.exclusionReason(i),
      })),
      sumWeightedScore: sumWeighted,
      sumPriorityWeight: sumWeight,
      formula: "Overall Score = Σ(Item Score × Priority Weight) / Σ(Priority Weight)",
      overallScore,
      complianceStatus: compliance,
      highPriorityRisks,
      reasonForComplianceStatus: `Overall score ${overallScore.toFixed(2)} falls into "${compliance}" band.`,
    };

    return {
      overallComplianceScore: overallScore,
    };
  }

  // --------------------------------------------------------------------------
  // Per-item evaluation
  // --------------------------------------------------------------------------
  private evaluateItem(raw: PlanItem, today: Date): ItemResult {
    const formulaUsed: string[] = [];
    const businessRuleApplied: string[] = [];
    const validationWarnings: string[] = [];

    // ---- Validation (structural) --------------------------------------------
    if (!isValidDealCondition(raw.dealCondition))
      validationWarnings.push("Invalid Deal Condition");
    if (!isValidPriority(raw.priority)) validationWarnings.push("Invalid Priority");

    // ---- Ignore non-CS items ------------------------------------------------
    if (raw.dealCondition !== "CS") {
      businessRuleApplied.push("Non-CS item excluded from scoring (CP / Roadmap ignored).");
      return this.nonApplicableResult(raw, {
        formulaUsed,
        businessRuleApplied,
        validationWarnings,
        reasonStatusAssigned: "Item is not CS; excluded from score.",
      });
    }

    // ---- Normalize dates ----------------------------------------------------
    const csStartDate = toDate(raw.csStartDate ?? raw.startDate);
    const originalDueDate = toDate(raw.originalDueDate);
    const revisedDueDate = toDate(raw.revisedDueDate);
    const targetDate = toDate(raw.targetDate);

    // Rule: if Revised Due Date exists, always use it. Otherwise Target Date
    // becomes Current Due Date. Original Due Date retained only for audit.
    let currentDueDate: Date | null =
      revisedDueDate ?? toDate(raw.currentDueDate) ?? targetDate ?? null;

    if (revisedDueDate) businessRuleApplied.push("Revised Due Date used as Current Due Date.");
    else if (!raw.currentDueDate && targetDate)
      businessRuleApplied.push("Target Date used as Current Due Date.");

    if (!currentDueDate) validationWarnings.push("Missing Due Date");
    if (!csStartDate) validationWarnings.push("Missing Start Date");

    // Invalid date sanity checks
    for (const [k, v] of Object.entries({
      csStartDate: raw.csStartDate,
      originalDueDate: raw.originalDueDate,
      revisedDueDate: raw.revisedDueDate,
      targetDate: raw.targetDate,
      currentDueDate: raw.currentDueDate,
      actualDate: raw.actualDate,
      uploadDate: raw.uploadDate,
      reviewDate: raw.reviewDate,
      closedDate: raw.closedDate,
    })) {
      if (v != null && v !== "" && toDate(v) === null) {
        validationWarnings.push(`Invalid Dates (${k})`);
      }
    }

    // ---- Timeline -----------------------------------------------------------
    let timelineDays: number | null = null;
    if (csStartDate && currentDueDate) {
      timelineDays = diffDays(currentDueDate, csStartDate);
      formulaUsed.push("Timeline Days = Current Due Date - CS Start Date");
      if (timelineDays < 0) validationWarnings.push("Negative Timeline");
    } else if (raw.timelineMonth && Number.isFinite(raw.timelineMonth)) {
      timelineDays = Math.max(
        0,
        Math.round(raw.timelineMonth * this.config.configurableDaysPerMonth),
      );
      businessRuleApplied.push(
        `Timeline fallback: timelineMonth (${raw.timelineMonth}) × configurableDays (${this.config.configurableDaysPerMonth}).`,
      );
    }

    // ---- Buffer -------------------------------------------------------------
    let bufferDays: number | null = null;
    let bufferEndDate: Date | null = null;
    if (timelineDays != null && currentDueDate) {
      bufferDays = Math.ceil(Math.max(0, timelineDays) * this.config.bufferPercent);
      bufferEndDate = addDays(currentDueDate, bufferDays);
      formulaUsed.push("Allowed Buffer = Ceiling(Timeline Days × 25%)");
      formulaUsed.push("Buffer End Date = Current Due Date + Allowed Buffer");
    }

    // ---- Mandatory sub-items + completion logic -----------------------------
    const subItems: SubItem[] = Array.isArray(raw.subItems) ? raw.subItems : [];
    // Default: if `mandatory` flag absent, treat all as mandatory (rules say
    // "Only Mandatory items affect completion" and only Optional is opt-out).
    const mandatorySubs = subItems.filter((s) => s.mandatory !== false);
    const optionalCount = subItems.length - mandatorySubs.length;

    if (mandatorySubs.length === 0 && subItems.length > 0) {
      validationWarnings.push("Missing Mandatory Items");
    }
    // Duplicate mandatory items
    const seen = new Set<string>();
    for (const s of mandatorySubs) {
      const key = (s.name ?? "").toString().trim().toLowerCase();
      if (!key) continue;
      if (seen.has(key)) {
        validationWarnings.push("Duplicate Mandatory Items");
        break;
      }
      seen.add(key);
    }
    // Submission-before-upload / review-before-submission
    for (const s of subItems) {
      const sub = toDate(s.submissionDate);
      const up = toDate(s.uploadDate);
      const rv = toDate(s.reviewDate);
      if (sub && up && sub.getTime() < up.getTime())
        validationWarnings.push("Submission Before Upload");
      if (rv && sub && rv.getTime() < sub.getTime())
        validationWarnings.push("Review Before Submission");
    }

    const anyMandatoryReSubmit =
      mandatorySubs.some((s) => s.reSubmitRequired === true) || raw.reSubmitRequired === true;

    let allMandatorySubmitted = false;
    let latestMandatorySubmission: Date | null = null;
    if (mandatorySubs.length > 0) {
      const dates = mandatorySubs.map((s) => toDate(s.submissionDate));
      allMandatorySubmitted = dates.every((d) => d != null);
      latestMandatorySubmission = dates.reduce<Date | null>(
        (acc, d) => (d && (!acc || d > acc) ? d : acc),
        null,
      );
    } else {
      // No sub-items available yet — fall back to actualDate as "Latest
      // Mandatory Submission Date" per specification.
      latestMandatorySubmission = toDate(
        raw.actualSubmissionDate ?? raw.actualDate ?? raw.finalSubmissionDate,
      );
      allMandatorySubmitted = latestMandatorySubmission != null;
      if (latestMandatorySubmission)
        businessRuleApplied.push(
          "No sub-items provided; treating actualDate as Latest Mandatory Submission Date.",
        );
    }

    // Re-submit override: treat as Open
    let completionDate: Date;
    let reasonCompletionDateSelected: string;
    if (anyMandatoryReSubmit) {
      // If a corrected submission has come in after the re-submit flag, use latest.
      if (allMandatorySubmitted && latestMandatorySubmission) {
        completionDate = latestMandatorySubmission;
        reasonCompletionDateSelected =
          "Re-submit was required; corrected mandatory submissions completed — using latest corrected submission.";
      } else {
        completionDate = today;
        reasonCompletionDateSelected =
          "Re-submit required on a mandatory item — item treated as Open; Completion Date = Today.";
      }
      businessRuleApplied.push("Re-submit rule applied: previous completion ignored.");
    } else if (allMandatorySubmitted && latestMandatorySubmission) {
      completionDate = latestMandatorySubmission;
      reasonCompletionDateSelected =
        "All mandatory items submitted and none pending re-submit — using Latest Mandatory Submission Date.";
    } else {
      completionDate = today;
      reasonCompletionDateSelected =
        "Mandatory items still pending — Completion Date = Today (delay logic applies).";
      if (mandatorySubs.length === 0 && !latestMandatorySubmission)
        validationWarnings.push("Missing Completion Date");
    }

    // ---- Delay / Bucket / Penalty / Score -----------------------------------
    let delayDays: number | null = null;
    let delayBucket: number | null = null;
    let penalty = 0;
    let itemScore = 100;

    if (bufferEndDate && bufferDays != null) {
      delayDays = diffDays(completionDate, bufferEndDate);
      formulaUsed.push("Delay Days = Completion Date - Buffer End Date");
      if (delayDays <= 0) {
        itemScore = 100;
        penalty = 0;
        delayBucket = 0;
      } else {
        const denom = bufferDays > 0 ? bufferDays : 1;
        delayBucket = Math.ceil(delayDays / denom);
        penalty = delayBucket * 25;
        itemScore = Math.max(0, 100 - penalty);
        formulaUsed.push("Delay Bucket = Ceiling(Delay Days / Buffer Days)");
        formulaUsed.push("Penalty = Delay Bucket × 25");
        formulaUsed.push("Item Score = max(0, 100 - Penalty)");
      }
    } else {
      // Without a due date we cannot score — leave at 0 penalty; item likely
      // becomes non-applicable via status logic below.
      itemScore = 100;
    }

    // ---- Status hierarchy (derived AFTER calc) ------------------------------
    const { status, reasonStatusAssigned } = this.deriveStatus({
      raw,
      today,
      currentDueDate,
      anyMandatoryReSubmit,
      allMandatorySubmitted,
      mandatorySubsCount: mandatorySubs.length,
      someMandatorySubmitted:
        mandatorySubs.length > 0 &&
        mandatorySubs.some((s) => toDate(s.submissionDate) != null) &&
        !allMandatorySubmitted,
      latestMandatorySubmission,
      delayDays,
    });

    // ---- Applicability ------------------------------------------------------
    const applicableStatuses: ItemStatus[] = [
      "Due This Month",
      "Submitted",
      "Partly Submitted",
      "Re-submit Required",
      "Overdue",
      "Closed",
    ];
    const applicable = applicableStatuses.includes(status);

    if (status === "Closed") {
      businessRuleApplied.push(
        "Closed item: score derived from Actual Completion Date only; Review/Closed dates informational.",
      );
    }

    // ---- Priority weight & weighted score -----------------------------------
    const priorityWeight = priorityWeightOf(raw.priority);
    const weightedScore = applicable ? itemScore * priorityWeight : 0;
    if (applicable) formulaUsed.push("Weighted Score = Item Score × Priority Weight");

    // ---- Next action --------------------------------------------------------
    const nextAction = this.deriveNextAction({
      status,
      hasSubmission: latestMandatorySubmission != null,
      hasReview: toDate(raw.reviewDate ?? raw.lastReviewDate) != null,
      anyMandatoryReSubmit,
    });

    // ---- Risk flag ----------------------------------------------------------
    let riskFlag: string | null = null;
    const priorityLc = (raw.priority ?? "").toString().toLowerCase();
    const stillOpen =
      status !== "Closed" && status !== "Dropped" && status !== "Submitted";
    if (
      priorityLc === "high" &&
      delayBucket != null &&
      delayBucket >= 2 &&
      stillOpen
    ) {
      riskFlag = "High Priority Delay";
      businessRuleApplied.push("High Priority Delay flag raised (informational, no score impact).");
    }

    if (optionalCount > 0)
      businessRuleApplied.push(`${optionalCount} optional sub-item(s) ignored for scoring.`);

    // ---- Audit --------------------------------------------------------------
    const auditInformation: AuditFields = {
      originalDueDate: originalDueDate ?? raw.originalDueDate ?? null,
      revisedDueDate: revisedDueDate ?? raw.revisedDueDate ?? null,
      revisionCount: raw.revisionCount,
      revisionReason: raw.revisionReason,
      revisedBy: raw.revisedBy,
      revisedOn: raw.revisedOn ?? null,
      dateEditedBy: raw.dateEditedBy,
      dateEditedOn: raw.dateEditedOn ?? null,
      dateEditReason: raw.dateEditReason,
    };

    const explain: ExplainScore = {
      timelineDays,
      bufferDays,
      bufferEndDate,
      completionDateUsed: completionDate,
      reasonCompletionDateSelected,
      delayDays,
      delayBucket,
      penalty,
      itemScore,
      priorityWeight,
      weightedScore,
      status,
      reasonStatusAssigned,
      applicable,
      nextAction,
      riskFlag,
      validationWarnings,
      auditInformation,
      formulaUsed,
      businessRuleApplied,
    };

    return {
      id: raw.id,
      name: raw.name,
      dealCondition: raw.dealCondition,
      priority: raw.priority,
      itemScore,
      priorityWeight,
      weightedScore,
      status,
      applicable,
      nextAction,
      riskFlag,
      validationWarnings,
      explain,
    };
  }

  // --------------------------------------------------------------------------
  private deriveStatus(input: {
    raw: PlanItem;
    today: Date;
    currentDueDate: Date | null;
    anyMandatoryReSubmit: boolean;
    allMandatorySubmitted: boolean;
    mandatorySubsCount: number;
    someMandatorySubmitted: boolean;
    latestMandatorySubmission: Date | null;
    delayDays: number | null;
  }): { status: ItemStatus; reasonStatusAssigned: string } {
    const {
      raw,
      today,
      currentDueDate,
      anyMandatoryReSubmit,
      allMandatorySubmitted,
      someMandatorySubmitted,
      delayDays,
    } = input;

    // 1 Dropped
    if (raw.dropped === true || (raw.status ?? "").toString().toLowerCase() === "dropped") {
      return { status: "Dropped", reasonStatusAssigned: "Item marked as Dropped." };
    }
    // 2 Closed
    if (
      raw.closed === true ||
      toDate(raw.closedDate) != null ||
      (raw.status ?? "").toString().toLowerCase() === "closed"
    ) {
      return { status: "Closed", reasonStatusAssigned: "Item is Closed by reviewer." };
    }
    // 3 Re-submit Required
    if (anyMandatoryReSubmit) {
      return {
        status: "Re-submit Required",
        reasonStatusAssigned: "One or more mandatory items require re-submission.",
      };
    }
    // 4 Overdue — past due (buffer breached) and not fully submitted
    if (currentDueDate && !allMandatorySubmitted && delayDays != null && delayDays > 0) {
      return {
        status: "Overdue",
        reasonStatusAssigned: "Buffer End Date passed without full submission.",
      };
    }
    // 5 Submitted
    if (allMandatorySubmitted) {
      return {
        status: "Submitted",
        reasonStatusAssigned:
          "All mandatory items submitted — score awarded immediately (investor review does not gate score).",
      };
    }
    // 6 Partly Submitted
    if (someMandatorySubmitted) {
      return {
        status: "Partly Submitted",
        reasonStatusAssigned:
          "Some mandatory items submitted; partial submission receives no proportional credit.",
      };
    }
    // 7 Due This Month
    if (currentDueDate) {
      const sameMonth =
        currentDueDate.getFullYear() === today.getFullYear() &&
        currentDueDate.getMonth() === today.getMonth();
      const inFuture = currentDueDate.getTime() >= today.getTime();
      if (sameMonth && inFuture) {
        return { status: "Due This Month", reasonStatusAssigned: "Due Date falls in current month." };
      }
      if (currentDueDate.getTime() < today.getTime()) {
        return {
          status: "Overdue",
          reasonStatusAssigned: "Current Due Date has passed without submission.",
        };
      }
    }
    // 8 Upcoming
    return { status: "Upcoming", reasonStatusAssigned: "Due Date is beyond current month." };
  }

  private deriveNextAction(input: {
    status: ItemStatus;
    hasSubmission: boolean;
    hasReview: boolean;
    anyMandatoryReSubmit: boolean;
  }): NextActionOwner {
    const { status, hasSubmission, hasReview, anyMandatoryReSubmit } = input;
    switch (status) {
      case "Closed":
      case "Dropped":
        return "None";
      case "Re-submit Required":
        return hasSubmission ? "Fireside" : "Company";
      case "Submitted":
        return hasReview ? "Fireside" : "Fireside";
      case "Partly Submitted":
        return "Company";
      case "Overdue":
      case "Due This Month":
      case "Upcoming":
      default:
        if (anyMandatoryReSubmit) return "Company";
        if (hasSubmission && !hasReview) return "Fireside";
        return "Company";
    }
  }

  private exclusionReason(i: ItemResult): string {
    if (i.dealCondition !== "CS") return `Deal condition is ${i.dealCondition ?? "unknown"} (not CS).`;
    if (i.status === "Upcoming") return "Status Upcoming — not yet applicable.";
    if (i.status === "Dropped") return "Item Dropped.";
    return "Excluded from applicable scope.";
  }

  private nonApplicableResult(
    raw: PlanItem,
    ctx: {
      formulaUsed: string[];
      businessRuleApplied: string[];
      validationWarnings: string[];
      reasonStatusAssigned: string;
    },
  ): ItemResult {
    const status: ItemStatus =
      raw.dropped === true
        ? "Dropped"
        : (raw.status as ItemStatus) === "Closed"
          ? "Closed"
          : "Upcoming";
    const explain: ExplainScore = {
      timelineDays: null,
      bufferDays: null,
      bufferEndDate: null,
      completionDateUsed: null,
      reasonCompletionDateSelected: "Item not scored (non-CS / excluded).",
      delayDays: null,
      delayBucket: null,
      penalty: 0,
      itemScore: 0,
      priorityWeight: priorityWeightOf(raw.priority),
      weightedScore: 0,
      status,
      reasonStatusAssigned: ctx.reasonStatusAssigned,
      applicable: false,
      nextAction: "None",
      riskFlag: null,
      validationWarnings: ctx.validationWarnings,
      auditInformation: {
        originalDueDate: raw.originalDueDate ?? null,
        revisedDueDate: raw.revisedDueDate ?? null,
        revisionCount: raw.revisionCount,
        revisionReason: raw.revisionReason,
        revisedBy: raw.revisedBy,
        revisedOn: raw.revisedOn ?? null,
        dateEditedBy: raw.dateEditedBy,
        dateEditedOn: raw.dateEditedOn ?? null,
        dateEditReason: raw.dateEditReason,
      },
      formulaUsed: ctx.formulaUsed,
      businessRuleApplied: ctx.businessRuleApplied,
    };
    return {
      id: raw.id,
      name: raw.name,
      dealCondition: raw.dealCondition,
      priority: raw.priority,
      itemScore: 0,
      priorityWeight: priorityWeightOf(raw.priority),
      weightedScore: 0,
      status,
      applicable: false,
      nextAction: "None",
      riskFlag: null,
      validationWarnings: ctx.validationWarnings,
      explain,
    };
  }
}

/** Default singleton for convenience. */
export const complianceScoreEngine = new ComplianceScoreEngine();

/** Functional shorthand mirroring the requested public API. */
export function calculateComplianceScore(
  planJson: PlanJson | PlanItem[] | null | undefined,
  config?: Partial<EngineConfig>,
): EngineResult {
  const engine = config ? new ComplianceScoreEngine(config) : complianceScoreEngine;
  return engine.calculateComplianceScore(planJson);
}

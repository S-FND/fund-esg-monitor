// 🔥 ESG Scoring Utility (Completion 80% + Timeliness 20%)
// - Priority-based weighting
// - Timeliness ONLY if completed
// - Start date = endDate - 3 months (configurable)
// - Future-proof: can switch to actual startDate anytime

import { ESGCapItem } from "@/components/esg-cap/CAPTable";


type ESGItem = {
    priority?: "High" | "Medium" | "Low";
    status: "completed" | "in_progress" | "pending";
    startDate?: string | Date;
    endDate?: string | Date;
    completedDate?: string | Date;
  };
  
  // 🔧 Config (future-proof)
  const SCORING_CONFIG = {
    COMPLETION_WEIGHT: 0.8,
    TIMELINESS_WEIGHT: 0.2,
  
    USE_ACTUAL_START_DATE: false, // 🔁 flip to true later
    DEFAULT_DURATION_MONTHS: 3,
  };
  
  // 🎯 Priority weights
  const priorityWeights = {
    High: 2,
    Medium: 1,
    Low: 0.5,
  };
  
  // 🧠 Resolve Start Date
  function resolveStartDate(item: ESGCapItem): Date | undefined {
    if (!item.targetDate) return undefined;
  
    // Future: use actual start date
    if (SCORING_CONFIG.USE_ACTUAL_START_DATE && item.investmentDate) {
      return new Date(item.investmentDate);
    }
  
    // Current: endDate - 3 months
    const end = new Date(item.targetDate);
    const start = new Date(end);
    start.setMonth(start.getMonth() - SCORING_CONFIG.DEFAULT_DURATION_MONTHS);
  
    return start;
  }
  
  // ⏱️ Timeliness Factor
  function getTimelinessFactor(item: ESGCapItem): number {
    // ❌ Not completed → always 0
    if (item.status !== "completed") return 0;
  
    if (!item.targetDate || !item.actualDate) return 0;
  
    const start = resolveStartDate(item);
    if (!start) return 0;
  
    const s = start.getTime();
    const e = new Date(item.targetDate).getTime();
    const c = new Date(item.actualDate).getTime();
  
    // Safety
    if (e <= s) return 0;
  
    if (c >= e) return 0;
    if (c <= s) return 1;
  
    return (e - c) / (e - s);
  }
  
  // 🧮 Main Scoring Function
  // 🧮 Main Scoring Function
export function calculateESGScore(items: ESGCapItem[]) {
    const totalItems = items.length;
  
    if (!totalItems) {
      return {
        completionScore: 0,
        timelinessScore: 0,
        finalScore: 0,
        actualScore: 0,
        maxScore: 0,
      };
    }
  
    const baseWeight = 100 / totalItems;
  
    let totalWeightage = 0;
    let completedWeightage = 0;
    let timelinessWeightage = 0;
  
    items.forEach((item) => {
      const priority = item.priority || "Medium";
      const weight = priorityWeights[priority] || 1;
  
      const itemWeight = baseWeight * weight;
  
      totalWeightage += itemWeight;
  
      if (item.status === "completed") {
        // ✅ Completion contribution
        completedWeightage += itemWeight;
  
        // ✅ Timeliness contribution
        const factor = getTimelinessFactor(item);
        timelinessWeightage += itemWeight * factor;
      }
    });
  
    // ✅ Percentage scores
    const completionScore =
      totalWeightage > 0
        ? (completedWeightage / totalWeightage) * 100
        : 0;
  
    const timelinessScore =
      totalWeightage > 0
        ? (timelinessWeightage / totalWeightage) * 100
        : 0;
  
    const finalScore =
      completionScore * SCORING_CONFIG.COMPLETION_WEIGHT +
      timelinessScore * SCORING_CONFIG.TIMELINESS_WEIGHT;
  
    // 🔥 NEW: actual weighted score (raw)
    const actualScore =
      completedWeightage * SCORING_CONFIG.COMPLETION_WEIGHT +
      timelinessWeightage * SCORING_CONFIG.TIMELINESS_WEIGHT;
  
    // 🔥 NEW: max possible score
    const maxScore = totalWeightage;
  
    return {
      completionScore,
      timelinessScore,
      finalScore,
  
      // 👇 new fields
      actualScore,
      maxScore,
    };
  }
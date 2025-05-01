
import { CategoryQuestion, ResponsesData } from "@/types/categorization";

/**
 * Calculate the score for a specific question based on its response
 */
export function calculateQuestionScore(questionId: string, value: string, section: string): number {
  // Default scoring pattern
  const scoreMap: Record<string, number[]> = {
    policy: [0, 1, 3],
    esg: [-1, 0, 1, 2, 3],
    social: [0, 1, 2],
    environmental: [0, 1, 3],
    impact: [0, 1, 2]
  };
  
  // Special scoring logic for certain questions
  if (section === "policy") {
    if (questionId === "1.9") {
      if (value === "Yes") return 0;
      if (value === "No, but willing to have") return 1;
      return 3;
    }
    
    // Handle standard policy questions
    const index = ["Yes", "No, but willing to have", "No & Not willing to have"].indexOf(value);
    return index >= 0 ? scoreMap.policy[index] : 0;
  }
  
  if (section === "esg") {
    // Handle ESG-specific scoring logic
    switch (value) {
      case "Yes": return -1;
      case "Likely": return 0;
      case "No": return 1;
      case "For moderate intent and performance": return 1;
      case "Orange manufacturing Industry": return 2;
      case "Yes Adhoc": return 1;
      case "Often": return 0;
      case "Quarterly": return 1;
      case "Sometimes (including management emails)": return 0;
      case "Few times but resolved against": return 2;
      default: return 0;
    }
  }
  
  // For other sections, use index-based scoring when possible
  const options = getSectionResponseOptions(section);
  const index = options.indexOf(value);
  return index >= 0 && index < scoreMap[section].length ? scoreMap[section][index] : 0;
}

/**
 * Calculate scores for an entire section
 */
export function calculateSectionScore(
  section: string, 
  questions: CategoryQuestion[], 
  responses: Record<string, { response: string; score: number; observations: string }>
): number {
  return questions.reduce((sum, question) => {
    return sum + (responses[question.id]?.score || 0);
  }, 0);
}

/**
 * Calculate scores for all sections
 */
export function calculateAllSectionScores(
  questions: Record<string, CategoryQuestion[]>, 
  responses: ResponsesData
): Record<string, number> {
  return Object.keys(questions).reduce<Record<string, number>>((acc, section) => {
    const sectionQuestions = questions[section];
    acc[section] = calculateSectionScore(section, sectionQuestions, responses[section]);
    return acc;
  }, {});
}

/**
 * Calculate the total score across all sections
 */
export function calculateTotalScore(sectionScores: Record<string, number>): number {
  return Object.values(sectionScores).reduce((sum, score) => sum + score, 0);
}

/**
 * Get response options for a specific section
 */
export function getSectionResponseOptions(section: string): string[] {
  switch (section) {
    case "policy":
      return ["Yes", "No, but willing to have", "No & Not willing to have"];
    case "esg":
      return [
        "Yes", "Likely", "Partial", "No", 
        "For moderate intent and performance", 
        "Orange manufacturing Industry", 
        "Yes Adhoc", "Often", 
        "Quarterly", 
        "Sometimes (including management emails)", 
        "Few times but resolved against"
      ];
    case "social":
      return ["Yes", "Partial", "No"];
    case "environmental":
      return ["Yes, comprehensive", "Partial", "No"];
    case "impact":
      return ["Yes, with metrics", "Yes, qualitative", "No"];
    default:
      return [];
  }
}

export const responseOptions = {
  policy: ["Yes", "No, but willing to have", "No & Not willing to have"],
  esg: [
    "Yes", "Likely", "Partial", "No", 
    "For moderate intent and performance", 
    "Orange manufacturing Industry", 
    "Yes Adhoc", "Often", 
    "Quarterly", 
    "Sometimes (including management emails)", 
    "Few times but resolved against"
  ],
  social: ["Yes", "Partial", "No"],
  environmental: ["Yes, comprehensive", "Partial", "No"],
  impact: ["Yes, with metrics", "Yes, qualitative", "No"]
};

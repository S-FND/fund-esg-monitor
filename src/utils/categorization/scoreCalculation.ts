
import { 
  calculatePolicyScore,
  calculateESGScore,
  calculateSocialScore,
  calculateEnvironmentalScore,
  calculateImpactScore
} from './scoring';

/**
 * Calculate the score for a specific question based on its response
 */
export function calculateQuestionScore(questionId: string, value: string, section: string): number {
  // Delegate to the appropriate scoring function based on section
  switch (section) {
    case "policy":
      return calculatePolicyScore(questionId, value);
    case "esg":
      return calculateESGScore(questionId, value);
    case "social":
      return calculateSocialScore(questionId, value);
    case "environmental":
      return calculateEnvironmentalScore(questionId, value);
    case "impact":
      return calculateImpactScore(questionId, value);
    default:
      return 0; // Default score if no specific logic matches
  }
}

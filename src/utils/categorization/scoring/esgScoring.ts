
/**
 * Calculate the score for an ESG section question based on its response
 */
export function calculateESGScore(questionId: string, value: string): number {
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

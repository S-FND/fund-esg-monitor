
/**
 * Calculate the score for an impact section question based on its response
 */
export function calculateImpactScore(questionId: string, value: string): number {
  switch (questionId) {
    case "5.1":
    case "5.4":
    case "5.5":
    case "5.6":
      if (value === "Yes") return 0;
      if (value === "Somewhat") return 1;
      return 2; // "No"
    
    case "5.2":
    case "5.3":
      if (value === "Greater than 10 SDGs") return 0;
      if (value === "5-10 SDGs") return 1;
      return 2; // "Less then 5 SDGs"
  }
  
  return 0;
}

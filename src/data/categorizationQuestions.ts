
import { CategoriesData } from "@/types/categorization";
import { policyQuestions } from "@/data/categorization/policyQuestions";
import { esgQuestions } from "@/data/categorization/esgQuestions";
import { socialQuestions } from "@/data/categorization/socialQuestions";
import { environmentalQuestions } from "@/data/categorization/environmentalQuestions";
import { impactQuestions } from "@/data/categorization/impactQuestions";
import { responseOptions } from "@/data/categorization/responseOptions";

// Combine all question categories
export const categorizationQuestions: CategoriesData = {
  policy: policyQuestions,
  esg: esgQuestions,
  social: socialQuestions,
  environmental: environmentalQuestions,
  impact: impactQuestions
};

// Helper functions
export const getSectionTitle = (section: string) => {
  switch(section) {
    case "policy": return "Policy Commitment";
    case "esg": return "ESG";
    case "social": return "Social Attributes";
    case "environmental": return "Environmental and Occupational Health & Safety Attributes";
    case "impact": return "Impact Attributes";
    default: return section;
  }
};

export const getCategory = (score: number) => {
  if (score >= 25) return "A - High Risk";
  if (score >= 15) return "B - Medium Risk";
  return "C - Low Risk";
};

// Re-export responseOptions for backward compatibility
export { responseOptions };

// Export the CategoriesData type from here for backward compatibility
export type { CategoriesData };

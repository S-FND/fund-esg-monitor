
import { CategorySection } from "@/types/categorization";
import { responseOptions } from "@/data/categorization/responseOptions";

/**
 * Get response options for a specific section
 */
export function getSectionResponseOptions(section: string): string[] {
  if (responseOptions[section as CategorySection]) {
    return responseOptions[section as CategorySection];
  }
  return [];
}

// Re-export responseOptions for backwards compatibility
export { responseOptions };

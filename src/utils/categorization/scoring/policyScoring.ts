
/**
 * Calculate the score for a policy section question based on its response
 */
export function calculatePolicyScore(questionId: string, value: string): number {
  // Policy section scoring
  const index = ["Yes", "No, but willing to have", "No & Not willing to have"].indexOf(value);
  return index >= 0 ? [0, 1, 3][index] : 0;
}

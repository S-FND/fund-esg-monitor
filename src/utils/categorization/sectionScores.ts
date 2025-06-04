
import { CategoryQuestion, ResponsesData, SectionScores } from "@/types/categorization";

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
): SectionScores {
  console.log("questions",questions)
  if(questions){
    return Object.keys(questions).reduce<SectionScores>((acc, section) => {
      const sectionQuestions = questions[section];
      acc[section] = calculateSectionScore(section, sectionQuestions, responses[section]);
      return acc;
    }, {});
  }
  
}

/**
 * Calculate the total score across all sections
 */
export function calculateTotalScore(sectionScores: SectionScores): number {
  if(sectionScores){
  return Object.values(sectionScores).reduce((sum, score) => sum + score, 0);
  }
}

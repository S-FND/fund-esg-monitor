

import { CategoriesData, CategoryQuestion } from "@/types/categorization";
import { ManageCategoryQuestionsDialog } from "./manage-questions/ManageCategoryQuestionsDialog";

interface ManageCategoryQuestionsProps {
  questions: CategoriesData;
  onQuestionUpdate: (section: string, updatedQuestions: CategoryQuestion[]) => void;
}

export function ManageCategoryQuestions({ 
  questions, 
  onQuestionUpdate 
}: ManageCategoryQuestionsProps) {
  const canManageQuestions = true; // Allow all users to manage questions without auth

  return (
    <ManageCategoryQuestionsDialog
      questions={questions}
      onQuestionUpdate={onQuestionUpdate}
      canManageQuestions={canManageQuestions}
    />
  );
}

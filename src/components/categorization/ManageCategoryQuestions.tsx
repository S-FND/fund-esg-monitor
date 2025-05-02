
import { useAuth } from "@/contexts/AuthContext";
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
  const { userRole } = useAuth();
  const canManageQuestions = userRole === 'admin' || userRole === 'investor_admin' || userRole === 'investor';

  return (
    <ManageCategoryQuestionsDialog
      questions={questions}
      onQuestionUpdate={onQuestionUpdate}
      canManageQuestions={canManageQuestions}
    />
  );
}

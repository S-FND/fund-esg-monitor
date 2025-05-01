
import { CategoryQuestionFormBase, CategoryQuestionFormData } from "./CategoryQuestionFormBase";

interface CategoryQuestionFormProps {
  onSubmit: (data: CategoryQuestionFormData) => void;
  initialData?: CategoryQuestionFormData;
  onCancel?: () => void;
}

export function CategoryQuestionForm({ onSubmit, initialData, onCancel }: CategoryQuestionFormProps) {
  return (
    <CategoryQuestionFormBase
      onSubmit={onSubmit}
      initialData={initialData}
      onCancel={onCancel}
    />
  );
}

export type { CategoryQuestionFormData } from "./CategoryQuestionFormBase";

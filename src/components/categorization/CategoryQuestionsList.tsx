
import { Button } from "@/components/ui/button";
import { type CategoryQuestionFormData } from "./CategoryQuestionForm";

interface CategoryQuestionsListProps {
  sections: string[];
  questions: Record<string, any[]>;
  onEditQuestion: (section: string, question: CategoryQuestionFormData) => void;
}

export function CategoryQuestionsList({ 
  sections, 
  questions, 
  onEditQuestion 
}: CategoryQuestionsListProps) {
  return (
    <div className="mt-6">
      <h3 className="font-medium mb-2">Current Questions by Section</h3>
      {sections.map(section => (
        <div key={section} className="mb-4">
          <h4 className="font-medium text-sm mb-2 capitalize">{section}</h4>
          <div className="space-y-2">
            {questions[section]?.map((q) => (
              <div key={q.id} className="p-4 border rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{q.id}: {q.question}</p>
                    <p className="text-sm text-muted-foreground">Scoring: {q.scoringCriteria}</p>
                    <p className="text-sm text-muted-foreground">Weightage: {q.weightage}</p>
                    <p className="text-sm text-muted-foreground">Guidance: {q.guidance}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditQuestion(section, q)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

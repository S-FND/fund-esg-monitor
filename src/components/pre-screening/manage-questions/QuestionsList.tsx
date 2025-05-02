
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { QuestionItem } from "./QuestionItem";

interface Question {
  id: string;
  question: string;
  scoringCriteria: string;
  weightage: number;
}

interface QuestionsListProps {
  questions: Question[];
  onAddNew: () => void;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
}

export function QuestionsList({ questions, onAddNew, onEdit, onDelete }: QuestionsListProps) {
  return (
    <>
      <Button 
        onClick={onAddNew} 
        className="w-full gap-2"
      >
        <Plus className="h-4 w-4" />
        <span>Add New Question</span>
      </Button>
      
      <div className="mt-6">
        <h3 className="font-medium mb-2">Current Questions</h3>
        <div className="space-y-2">
          {questions.map((question) => (
            <QuestionItem
              key={question.id}
              question={question}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          {questions.length === 0 && (
            <p className="text-sm text-muted-foreground">No questions yet. Add one above.</p>
          )}
        </div>
      </div>
    </>
  );
}

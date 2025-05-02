
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { CategoriesData, CategoryQuestion } from "@/types/categorization";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface CategoryQuestionsListProps {
  sections: string[];
  questions: CategoriesData;
  onEditQuestion: (section: string, question: CategoryQuestion) => void;
  onDeleteQuestion: (section: string, questionId: string) => void;
}

export function CategoryQuestionsList({ 
  sections, 
  questions, 
  onEditQuestion,
  onDeleteQuestion
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
                  <div className="flex-1 pr-4">
                    <p className="font-medium">{q.id}: {q.question}</p>
                    <p className="text-sm text-muted-foreground">Scoring: {q.scoringCriteria}</p>
                    {q.guidance && <p className="text-sm text-muted-foreground">Guidance: {q.guidance}</p>}
                    
                    {q.responses && q.responses.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Response Options:</p>
                        <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1 mt-1">
                          {q.responses.map((r, idx) => (
                            <div key={idx} className="bg-muted/30 px-2 py-1 rounded">
                              {r.response}: {r.score} points
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditQuestion(section, q)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete question "{q.id}: {q.question.substring(0, 50)}..."
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteQuestion(section, q.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
            {questions[section]?.length === 0 && (
              <p className="text-sm text-muted-foreground">No questions in this section. Add one above.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

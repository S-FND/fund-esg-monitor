
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Question {
  id: string;
  question: string;
  scoringCriteria: string;
  weightage: number;
}

interface QuestionItemProps {
  question: Question;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
}

export function QuestionItem({ question, onEdit, onDelete }: QuestionItemProps) {
  return (
    <div className="p-4 border rounded">
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-4">
          <p className="font-medium">{question.id}: {question.question}</p>
          <p className="text-sm text-muted-foreground">Scoring: {question.scoringCriteria}</p>
          <p className="text-sm text-muted-foreground">Weightage: {question.weightage}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(question)}
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
                  This action cannot be undone. This will permanently delete question "{question.id}: {question.question.substring(0, 50)}..."
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(question.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

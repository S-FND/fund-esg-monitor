
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { QuestionForm, type QuestionFormData } from "./manage-questions/QuestionForm";
import { QuestionsList } from "./manage-questions/QuestionsList";

export function ManageQuestions({ questions, onQuestionUpdate }: { 
  questions: any[], 
  onQuestionUpdate: (questions: any[]) => void 
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionFormData | null>(null);
  
  // Allow all users to manage questions without auth
  const canManageQuestions = true;

  if (!canManageQuestions) {
    return null;
  }

  const handleSubmit = (data: QuestionFormData) => {
    const updatedQuestions = [...questions];
    const existingIndex = updatedQuestions.findIndex(q => q.id === data.id);
    
    if (existingIndex >= 0) {
      updatedQuestions[existingIndex] = data;
      toast({
        title: "Question Updated",
        description: "The question has been successfully updated."
      });
    } else {
      updatedQuestions.push({
        ...data,
        id: `B.${questions.length + 1}`
      });
      toast({
        title: "Question Added",
        description: "New question has been successfully added."
      });
    }
    
    onQuestionUpdate(updatedQuestions);
    setShowQuestionForm(false);
    setOpen(false);
    setIsEditing(false);
  };

  const handleDeleteQuestion = (questionId: string) => {
    const updatedQuestions = questions.filter(q => q.id !== questionId);
    
    // Renumber the questions to maintain sequential ids
    const renumberedQuestions = updatedQuestions.map((q, index) => ({
      ...q,
      id: `B.${index + 1}`
    }));
    
    onQuestionUpdate(renumberedQuestions);
    toast({
      title: "Question Deleted",
      description: "The question has been successfully deleted."
    });
  };

  const handleEditClick = (question: any) => {
    setCurrentQuestion({
      id: question.id,
      question: question.question,
      scoringCriteria: question.scoringCriteria,
      weightage: question.weightage
    });
    setIsEditing(true);
    setShowQuestionForm(true);
    setOpen(true);
  };

  const handleAddNewClick = () => {
    setCurrentQuestion(null);
    setIsEditing(false);
    setShowQuestionForm(true);
    setOpen(true);
  };

  const handleManageQuestionsClick = () => {
    setShowQuestionForm(false);
    setOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        setIsEditing(false);
        setShowQuestionForm(false);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mb-4" onClick={handleManageQuestionsClick}>Manage Questions</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{showQuestionForm ? (isEditing ? "Edit Question" : "Add New Question") : "Manage Categorization Questions"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {showQuestionForm ? (
            <QuestionForm
              initialData={currentQuestion || undefined}
              isEditing={isEditing}
              onSubmit={handleSubmit}
              onCancel={() => setShowQuestionForm(false)}
            />
          ) : (
            <QuestionsList
              questions={questions}
              onAddNew={handleAddNewClick}
              onEdit={handleEditClick}
              onDelete={handleDeleteQuestion}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

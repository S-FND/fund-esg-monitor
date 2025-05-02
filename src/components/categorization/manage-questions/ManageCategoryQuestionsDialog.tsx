
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { CategoryQuestionForm, CategoryQuestionFormData } from "../CategoryQuestionForm";
import { CategoryQuestionsList } from "../CategoryQuestionsList";
import { CategoryQuestion } from "@/types/categorization";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle } from "lucide-react";

const sections = ["policy", "esg", "social", "environmental", "impact"];

interface ManageCategoryQuestionsDialogProps {
  questions: Record<string, CategoryQuestion[]>;
  onQuestionUpdate: (section: string, updatedQuestions: CategoryQuestion[]) => void;
  canManageQuestions: boolean;
}

export function ManageCategoryQuestionsDialog({ 
  questions, 
  onQuestionUpdate,
  canManageQuestions
}: ManageCategoryQuestionsDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<CategoryQuestionFormData | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  if (!canManageQuestions) {
    return null;
  }

  const handleSubmit = (data: CategoryQuestionFormData) => {
    const section = data.section;
    const updatedQuestions = [...(questions[section] || [])];
    const existingIndex = updatedQuestions.findIndex(q => q.id === data.id);
    
    if (existingIndex >= 0) {
      updatedQuestions[existingIndex] = {
        id: data.id,
        question: data.question,
        scoringCriteria: data.scoringCriteria,
        guidance: data.guidance,
        responses: data.responses as { response: string; score: number }[]
      };
      
      toast({
        title: "Question Updated",
        description: `Question ${data.id} has been successfully updated.`
      });
    } else {
      const sectionPrefix = section.charAt(0).toUpperCase();
      const newId = `${sectionPrefix}.${updatedQuestions.length + 1}`;
      
      updatedQuestions.push({
        id: newId,
        question: data.question,
        scoringCriteria: data.scoringCriteria,
        guidance: data.guidance,
        responses: data.responses as { response: string; score: number }[]
      });
      
      toast({
        title: "Question Added",
        description: `New question ${newId} has been successfully added.`
      });
    }
    
    onQuestionUpdate(section, updatedQuestions);
    setOpen(false);
    setEditingQuestion(null);
    setShowQuestionForm(false);
  };

  const handleEditQuestion = (section: string, question: CategoryQuestion) => {
    setEditingQuestion({
      id: question.id,
      section,
      question: question.question,
      scoringCriteria: question.scoringCriteria,
      guidance: question.guidance || "",
      weightage: 0.5, // Default weightage for form
      responses: question.responses || []
    });
    setShowQuestionForm(true);
    setOpen(true);
  };
  
  const handleDeleteQuestion = (section: string, questionId: string) => {
    const updatedQuestions = questions[section].filter(q => q.id !== questionId);
    
    // Renumber questions if needed
    const renumberedQuestions = updatedQuestions.map((q, index) => {
      const sectionPrefix = section.charAt(0).toUpperCase();
      const newId = `${sectionPrefix}.${index + 1}`;
      
      return {
        ...q,
        id: newId
      };
    });
    
    onQuestionUpdate(section, renumberedQuestions);
    
    toast({
      title: "Question Deleted",
      description: `Question ${questionId} has been successfully deleted.`
    });
  };

  const handleAddNewQuestion = () => {
    setEditingQuestion(null);
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
        setEditingQuestion(null);
        setShowQuestionForm(false);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mb-4" onClick={handleManageQuestionsClick}>Manage Questions</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{showQuestionForm ? (editingQuestion ? "Edit Question" : "Add New Question") : "Manage Categorization Questions"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {showQuestionForm ? (
            <CategoryQuestionForm 
              onSubmit={handleSubmit} 
              initialData={editingQuestion}
              onCancel={() => setShowQuestionForm(false)}
            />
          ) : (
            <>
              <Button 
                onClick={handleAddNewQuestion} 
                className="w-full gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add New Question</span>
              </Button>
              
              <CategoryQuestionsList 
                sections={sections} 
                questions={questions} 
                onEditQuestion={handleEditQuestion}
                onDeleteQuestion={handleDeleteQuestion}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

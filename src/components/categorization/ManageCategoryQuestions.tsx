
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { CategoryQuestionForm, type CategoryQuestionFormData } from "./CategoryQuestionForm";
import { CategoryQuestionsList } from "./CategoryQuestionsList";

const sections = ["policy", "esg", "social", "environmental", "impact"];

interface ManageCategoryQuestionsProps {
  questions: Record<string, any[]>;
  onQuestionUpdate: (section: string, updatedQuestions: any[]) => void;
}

export function ManageCategoryQuestions({ 
  questions, 
  onQuestionUpdate 
}: ManageCategoryQuestionsProps) {
  const { userRole } = useAuth();
  const canManageQuestions = userRole === 'admin' || userRole === 'investor_admin';

  if (!canManageQuestions) {
    return null;
  }

  const handleSubmit = (data: CategoryQuestionFormData) => {
    const section = data.section;
    const updatedQuestions = [...(questions[section] || [])];
    const existingIndex = updatedQuestions.findIndex(q => q.id === data.id);
    
    if (existingIndex >= 0) {
      updatedQuestions[existingIndex] = data;
    } else {
      const sectionPrefix = section.charAt(0).toUpperCase();
      updatedQuestions.push({
        ...data,
        id: `${sectionPrefix}.${updatedQuestions.length + 1}`
      });
    }
    
    onQuestionUpdate(section, updatedQuestions);
  };

  const handleEditQuestion = (section: string, question: CategoryQuestionFormData) => {
    const formData: CategoryQuestionFormData = {
      id: question.id,
      section,
      question: question.question,
      scoringCriteria: question.scoringCriteria,
      guidance: question.guidance,
      weightage: question.weightage
    };
    handleSubmit(formData);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="mb-4">Manage Category Questions</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Categorization Questions</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <CategoryQuestionForm onSubmit={handleSubmit} />
          <CategoryQuestionsList 
            sections={sections} 
            questions={questions} 
            onEditQuestion={handleEditQuestion}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

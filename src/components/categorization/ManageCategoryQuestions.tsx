
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { CategoryQuestionForm, type CategoryQuestionFormData } from "./CategoryQuestionForm";
import { CategoryQuestionsList } from "./CategoryQuestionsList";
import { CategoryQuestion, CategoriesData } from "@/types/categorization";

const sections = ["policy", "esg", "social", "environmental", "impact"];

interface ManageCategoryQuestionsProps {
  questions: CategoriesData;
  onQuestionUpdate: (section: string, updatedQuestions: CategoryQuestion[]) => void;
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
      updatedQuestions[existingIndex] = {
        id: data.id,
        question: data.question,
        scoringCriteria: data.scoringCriteria,
        guidance: data.guidance
      };
    } else {
      const sectionPrefix = section.charAt(0).toUpperCase();
      updatedQuestions.push({
        id: `${sectionPrefix}.${updatedQuestions.length + 1}`,
        question: data.question,
        scoringCriteria: data.scoringCriteria,
        guidance: data.guidance
      });
    }
    
    onQuestionUpdate(section, updatedQuestions);
  };

  const handleEditQuestion = (section: string, question: CategoryQuestion) => {
    const formData: CategoryQuestionFormData = {
      id: question.id,
      section,
      question: question.question,
      scoringCriteria: question.scoringCriteria,
      guidance: question.guidance,
      weightage: 0.5 // Default weightage for form
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

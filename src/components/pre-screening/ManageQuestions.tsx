
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Trash2, Edit, Plus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const questionSchema = z.object({
  id: z.string(),
  question: z.string().min(1, "Question is required"),
  scoringCriteria: z.string().min(1, "Scoring criteria is required"),
  weightage: z.number().min(0).max(1)
});

type QuestionFormData = z.infer<typeof questionSchema>;

export function ManageQuestions({ questions, onQuestionUpdate }: { 
  questions: any[], 
  onQuestionUpdate: (questions: any[]) => void 
}) {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      id: "",
      question: "",
      scoringCriteria: "",
      weightage: 0.5
    }
  });

  // Allow admin, investor_admin, and investor roles to manage questions
  const canManageQuestions = userRole === 'admin' || userRole === 'investor_admin' || userRole === 'investor';

  if (!canManageQuestions) {
    return null;
  }

  const onSubmit = (data: QuestionFormData) => {
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
    form.reset();
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
    form.reset({
      id: question.id,
      question: question.question,
      scoringCriteria: question.scoringCriteria,
      weightage: question.weightage
    });
    setIsEditing(true);
    setOpen(true);
  };

  const handleAddNewClick = () => {
    form.reset({
      id: "",
      question: "",
      scoringCriteria: "",
      weightage: 0.5
    });
    setIsEditing(false);
    setOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset form when dialog is closed
        setIsEditing(false);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mb-4" onClick={handleAddNewClick}>Manage Questions</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Question" : "Add New Question"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter question text" />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="scoringCriteria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scoring Criteria</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., No: 0, Yes/Maybe: 1" />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="weightage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Weightage (0-1)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        min="0"
                        max="1"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    form.reset();
                    setOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">{isEditing ? "Update Question" : "Save Question"}</Button>
              </div>
            </form>
          </Form>
          
          <div className="mt-6">
            <h3 className="font-medium mb-2">Current Questions</h3>
            <div className="space-y-2">
              {questions.map((q) => (
                <div key={q.id} className="p-4 border rounded">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <p className="font-medium">{q.id}: {q.question}</p>
                      <p className="text-sm text-muted-foreground">Scoring: {q.scoringCriteria}</p>
                      <p className="text-sm text-muted-foreground">Weightage: {q.weightage}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(q)}
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
                            <AlertDialogAction onClick={() => handleDeleteQuestion(q.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
              {questions.length === 0 && (
                <p className="text-sm text-muted-foreground">No questions yet. Add one above.</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

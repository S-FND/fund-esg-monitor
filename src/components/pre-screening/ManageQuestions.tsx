
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";

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
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      id: "",
      question: "",
      scoringCriteria: "",
      weightage: 0.5
    }
  });

  const canManageQuestions = userRole === 'fandoro_admin' || userRole === 'admin';

  if (!canManageQuestions) {
    return null;
  }

  const onSubmit = (data: QuestionFormData) => {
    const updatedQuestions = [...questions];
    const existingIndex = updatedQuestions.findIndex(q => q.id === data.id);
    
    if (existingIndex >= 0) {
      updatedQuestions[existingIndex] = data;
    } else {
      updatedQuestions.push({
        ...data,
        id: `B.${questions.length + 1}`
      });
    }
    
    onQuestionUpdate(updatedQuestions);
    form.reset();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="mb-4">Manage Questions</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Pre-Screening Questions</DialogTitle>
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
              
              <Button type="submit">Save Question</Button>
            </form>
          </Form>
          
          <div className="mt-6">
            <h3 className="font-medium mb-2">Current Questions</h3>
            <div className="space-y-2">
              {questions.map((q) => (
                <div key={q.id} className="p-4 border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{q.id}: {q.question}</p>
                      <p className="text-sm text-muted-foreground">Scoring: {q.scoringCriteria}</p>
                      <p className="text-sm text-muted-foreground">Weightage: {q.weightage}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        form.reset({
                          id: q.id,
                          question: q.question,
                          scoringCriteria: q.scoringCriteria,
                          weightage: q.weightage
                        });
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

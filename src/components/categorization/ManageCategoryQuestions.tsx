
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";

const categoryQuestionSchema = z.object({
  id: z.string(),
  section: z.string(),
  question: z.string().min(1, "Question is required"),
  scoringCriteria: z.string().min(1, "Scoring criteria is required"),
  guidance: z.string(),
  weightage: z.number().min(0).max(1)
});

type CategoryQuestionFormData = z.infer<typeof categoryQuestionSchema>;

const sections = ["policy", "esg", "social", "environmental", "impact"];

export function ManageCategoryQuestions({ 
  questions,
  onQuestionUpdate 
}: { 
  questions: Record<string, any[]>,
  onQuestionUpdate: (section: string, updatedQuestions: any[]) => void
}) {
  const { userRole } = useAuth();
  const form = useForm<CategoryQuestionFormData>({
    resolver: zodResolver(categoryQuestionSchema),
    defaultValues: {
      id: "",
      section: "policy",
      question: "",
      scoringCriteria: "",
      guidance: "",
      weightage: 0.5
    }
  });

  const canManageQuestions = userRole === 'fandoro_admin' || userRole === 'admin';

  if (!canManageQuestions) {
    return null;
  }

  const onSubmit = (data: CategoryQuestionFormData) => {
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
    form.reset();
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="section"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map(section => (
                          <SelectItem key={section} value={section}>
                            {section.charAt(0).toUpperCase() + section.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
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
                      <Input {...field} placeholder="e.g., Yes- 0, No- 2" />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="guidance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guidance</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter guidance for ESDD Report" />
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
                          onClick={() => {
                            form.reset({
                              id: q.id,
                              section,
                              question: q.question,
                              scoringCriteria: q.scoringCriteria,
                              guidance: q.guidance,
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
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

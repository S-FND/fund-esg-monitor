
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const questionSchema = z.object({
  id: z.string(),
  question: z.string().min(1, "Question is required"),
  scoringCriteria: z.string().min(1, "Scoring criteria is required"),
  weightage: z.number().min(0).max(1)
});

export type QuestionFormData = z.infer<typeof questionSchema>;

interface QuestionFormProps {
  initialData?: QuestionFormData;
  isEditing: boolean;
  onSubmit: (data: QuestionFormData) => void;
  onCancel: () => void;
}

export function QuestionForm({ initialData, isEditing, onSubmit, onCancel }: QuestionFormProps) {
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: initialData || {
      id: "",
      question: "",
      scoringCriteria: "",
      weightage: 0.5
    }
  });

  return (
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
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit">{isEditing ? "Update Question" : "Save Question"}</Button>
        </div>
      </form>
    </Form>
  );
}

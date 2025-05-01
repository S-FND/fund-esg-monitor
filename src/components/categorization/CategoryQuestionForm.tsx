
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CategorySection } from "@/types/categorization";

const categoryQuestionSchema = z.object({
  id: z.string(),
  section: z.string(),
  question: z.string().min(1, "Question is required"),
  scoringCriteria: z.string().min(1, "Scoring criteria is required"),
  guidance: z.string(),
  weightage: z.number().min(0).max(1)
});

export type CategoryQuestionFormData = z.infer<typeof categoryQuestionSchema>;

const sections: CategorySection[] = ["policy", "esg", "social", "environmental", "impact"];

interface CategoryQuestionFormProps {
  onSubmit: (data: CategoryQuestionFormData) => void;
  initialData?: CategoryQuestionFormData;
  onCancel?: () => void;
}

export function CategoryQuestionForm({ onSubmit, initialData, onCancel }: CategoryQuestionFormProps) {
  const form = useForm<CategoryQuestionFormData>({
    resolver: zodResolver(categoryQuestionSchema),
    defaultValues: initialData || {
      id: "",
      section: "policy",
      question: "",
      scoringCriteria: "",
      guidance: "",
      weightage: 0.5
    }
  });

  return (
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
              <FormMessage />
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
                <Textarea {...field} placeholder="Enter question text" className="min-h-[100px]" />
              </FormControl>
              <FormMessage />
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
              <FormMessage />
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
              <FormMessage />
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
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit">
            {initialData?.id ? 'Update Question' : 'Add Question'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

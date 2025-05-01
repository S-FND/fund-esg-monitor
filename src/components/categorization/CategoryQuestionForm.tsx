
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CategorySection } from "@/types/categorization";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { responseOptions } from "@/data/categorization/responseOptions";

const categoryQuestionSchema = z.object({
  id: z.string(),
  section: z.string(),
  question: z.string().min(1, "Question is required"),
  scoringCriteria: z.string().min(1, "Scoring criteria is required"),
  guidance: z.string(),
  weightage: z.number().min(0).max(1),
  responses: z.array(z.object({
    response: z.string(),
    score: z.number()
  }))
});

export type CategoryQuestionFormData = z.infer<typeof categoryQuestionSchema>;

const sections: CategorySection[] = ["policy", "esg", "social", "environmental", "impact"];

interface CategoryQuestionFormProps {
  onSubmit: (data: CategoryQuestionFormData) => void;
  initialData?: CategoryQuestionFormData;
  onCancel?: () => void;
}

export function CategoryQuestionForm({ onSubmit, initialData, onCancel }: CategoryQuestionFormProps) {
  const [selectedSection, setSelectedSection] = useState<string>(initialData?.section || "policy");
  const [responsesList, setResponsesList] = useState<{response: string, score: number}[]>(
    initialData?.responses || []
  );
  
  // Get section-specific response options
  const availableResponses = responseOptions[selectedSection as CategorySection] || [];

  const form = useForm<CategoryQuestionFormData>({
    resolver: zodResolver(categoryQuestionSchema),
    defaultValues: initialData || {
      id: "",
      section: "policy",
      question: "",
      scoringCriteria: "",
      guidance: "",
      weightage: 0.5,
      responses: []
    }
  });

  const handleSectionChange = (value: string) => {
    setSelectedSection(value);
    form.setValue("section", value);
  };

  const addResponse = (response: string, score: number) => {
    const newResponsesList = [...responsesList, { response, score }];
    setResponsesList(newResponsesList);
    form.setValue("responses", newResponsesList);
  };

  const removeResponse = (index: number) => {
    const newResponsesList = responsesList.filter((_, i) => i !== index);
    setResponsesList(newResponsesList);
    form.setValue("responses", newResponsesList);
  };

  const handleSubmit = (data: CategoryQuestionFormData) => {
    // Include the responsesList in the form data
    data.responses = responsesList;
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="section"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Section</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  handleSectionChange(value);
                }}
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
        
        <div className="border p-4 rounded-md">
          <h3 className="font-medium mb-3">Response Options and Scores</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Select possible responses and assign scores for each
          </p>
          
          <div className="space-y-2 mb-4">
            {responsesList.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-grow p-2 border rounded bg-muted/30">
                  <span className="font-medium mr-2">{item.response}:</span>
                  <span>{item.score} points</span>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removeResponse(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="flex items-end gap-2">
            <div className="flex-grow space-y-2">
              <label className="text-sm font-medium">Response</label>
              <Select onValueChange={(value) => {
                const selectElement = document.getElementById('response-score-input') as HTMLInputElement;
                if (selectElement) {
                  addResponse(value, parseFloat(selectElement.value || "0"));
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select response option" />
                </SelectTrigger>
                <SelectContent>
                  {availableResponses.map(response => (
                    <SelectItem key={response} value={response}>
                      {response}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-24 space-y-2">
              <label className="text-sm font-medium">Score</label>
              <Input
                id="response-score-input"
                type="number"
                step="0.5"
                defaultValue="0"
              />
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                const selectElement = document.querySelector('[data-value]') as HTMLElement;
                const scoreElement = document.getElementById('response-score-input') as HTMLInputElement;
                
                if (selectElement && scoreElement) {
                  const selectedValue = selectElement.getAttribute('data-value');
                  if (selectedValue) {
                    addResponse(selectedValue, parseFloat(scoreElement.value || "0"));
                  }
                }
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
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

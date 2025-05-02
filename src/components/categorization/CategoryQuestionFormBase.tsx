
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { CategorySection } from "@/types/categorization";
import { useState } from "react";
import { QuestionDetailsFields } from "./form/QuestionDetailsFields";
import { ResponseOptionsFields } from "./form/ResponseOptionsFields";

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

interface CategoryQuestionFormBaseProps {
  onSubmit: (data: CategoryQuestionFormData) => void;
  initialData?: CategoryQuestionFormData;
  onCancel?: () => void;
}

export function CategoryQuestionFormBase({ onSubmit, initialData, onCancel }: CategoryQuestionFormBaseProps) {
  const [selectedSection, setSelectedSection] = useState<string>(initialData?.section || "policy");
  // Ensure we're using a correctly typed array for the responsesList state
  const [responsesList, setResponsesList] = useState<{response: string, score: number}[]>(
    initialData?.responses ? 
    // Make sure each response has required properties with default values if missing
    initialData.responses.map(r => ({
      response: r.response || "",
      score: typeof r.score === 'number' ? r.score : 0
    })) : 
    []
  );
  
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
    // Ensure we're passing required properties
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
        <QuestionDetailsFields 
          control={form.control}
          selectedSection={selectedSection}
          handleSectionChange={handleSectionChange}
        />
        
        <ResponseOptionsFields
          selectedSection={selectedSection as CategorySection}
          responsesList={responsesList}
          addResponse={addResponse}
          removeResponse={removeResponse}
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

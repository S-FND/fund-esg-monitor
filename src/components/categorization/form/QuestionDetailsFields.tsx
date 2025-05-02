
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CategorySection } from "@/types/categorization";
import { Control } from "react-hook-form";
import { CategoryQuestionFormData } from "../CategoryQuestionFormBase";

const sections: CategorySection[] = ["policy", "esg", "social", "environmental", "impact"];

interface QuestionDetailsFieldsProps {
  control: Control<CategoryQuestionFormData>;
  selectedSection: string;
  handleSectionChange: (value: string) => void;
}

export function QuestionDetailsFields({ 
  control, 
  selectedSection, 
  handleSectionChange 
}: QuestionDetailsFieldsProps) {
  return (
    <>
      <FormField
        control={control}
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
        control={control}
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
        control={control}
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
        control={control}
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
        control={control}
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
    </>
  );
}

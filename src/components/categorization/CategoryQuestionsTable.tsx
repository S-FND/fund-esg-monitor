
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CategoryQuestion, Response } from "@/types/categorization";

interface CategoryQuestionsTableProps {
  questions: CategoryQuestion[];
  responses: Record<string, Response>;
  onResponseChange: (questionId: string, value: string) => void;
  onObservationsChange: (questionId: string, value: string) => void;
  section: string;
}

export function CategoryQuestionsTable({
  questions,
  responses,
  onResponseChange,
  onObservationsChange,
  section
}: CategoryQuestionsTableProps) {
  // Default response options
  const defaultResponseOptions = ["Yes", "No", "Partial", "N/A"];
  
  // Get available response options for a question (either from the question's responses or from the default options)
  const getQuestionResponseOptions = (question: CategoryQuestion): string[] => {
    if (question.responses && question.responses.length > 0) {
      return question.responses.map(r => r.response);
    }
    return defaultResponseOptions;
  };
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">S. No.</TableHead>
          <TableHead className="w-[300px]">Question</TableHead>
          <TableHead className="w-[150px]">Response</TableHead>
          <TableHead className="w-[80px]">Score</TableHead>
          <TableHead className="w-[150px]">Scoring Criteria</TableHead>
          <TableHead className="w-[200px]">Specific Observations</TableHead>
          <TableHead>Guidance for ESDD Report</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {questions.map((question) => (
          <TableRow key={question.id}>
            <TableCell>{question.id}</TableCell>
            <TableCell>{question.question}</TableCell>
            <TableCell>
              <Select 
                value={responses[question.id]?.response || ""} 
                onValueChange={(value) => onResponseChange(question.id, value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {getQuestionResponseOptions(question).map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>{responses[question.id]?.score || 0}</TableCell>
            <TableCell>{question.scoringCriteria}</TableCell>
            <TableCell>
              <Textarea 
                value={responses[question.id]?.observations || ""} 
                onChange={(e) => onObservationsChange(question.id, e.target.value)}
                placeholder="Add observations"
                className="min-h-[60px]"
              />
            </TableCell>
            <TableCell>{question.guidance}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}


import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CategoryQuestion } from "@/data/categorizationQuestions";

interface CategoryQuestionsTableProps {
  questions: CategoryQuestion[];
  responses: Record<string, { response: string; score: number; observations: string; }>;
  responseOptions: string[];
  onResponseChange: (questionId: string, value: string) => void;
  onObservationsChange: (questionId: string, value: string) => void;
}

export function CategoryQuestionsTable({
  questions,
  responses,
  responseOptions,
  onResponseChange,
  onObservationsChange
}: CategoryQuestionsTableProps) {
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
                value={responses[question.id]?.response} 
                onValueChange={(value) => onResponseChange(question.id, value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {responseOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>{responses[question.id]?.score}</TableCell>
            <TableCell>{question.scoringCriteria}</TableCell>
            <TableCell>
              <Textarea 
                value={responses[question.id]?.observations} 
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


import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Question = {
  id: string;
  question: string;
  scoringCriteria: string;
  weightage: number;
};

type Response = {
  response: string;
  score: number;
  remarks: string;
};

interface QuestionsTableProps {
  questions: Question[];
  responses: Record<string, Response>;
  onResponseChange: (questionId: string, value: string) => void;
  onRemarksChange: (questionId: string, value: string) => void;
}

export function QuestionsTable({
  questions,
  responses,
  onResponseChange,
  onRemarksChange
}: QuestionsTableProps) {
  console.log("QuestionsTable :: questions => ",questions)
  console.log("QuestionsTable :: responses => ",responses)
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">S. No.</TableHead>
          <TableHead className="w-[300px]">Question</TableHead>
          <TableHead className="w-[150px]">Response</TableHead>
          <TableHead className="w-[100px]">Score</TableHead>
          <TableHead className="w-[150px]">Scoring Criteria</TableHead>
          <TableHead>Remarks / Comments</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {questions.map((question,index) => (
          <TableRow key={question.id}>
            <TableCell>{`${question.id.split(".")[0]}.${index+1}`}</TableCell>
            <TableCell>{question.question}</TableCell>
            <TableCell>
              <Select 
                value={responses[question.id]?.response} 
                onValueChange={(value) => onResponseChange(question.id, value)}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="Maybe">Maybe</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>{responses[question.id]?.score.toFixed(2)}</TableCell>
            <TableCell>{question.scoringCriteria}</TableCell>
            <TableCell>
              <Textarea 
                value={responses[question.id]?.remarks} 
                onChange={(e) => onRemarksChange(question.id, e.target.value)}
                placeholder="Add remarks"
                className="min-h-[60px]"
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
